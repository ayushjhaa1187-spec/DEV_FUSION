-- Migration 028: Credit and Usage System
-- Includes wallet logic, atomic consumption, and daily activity logging.

-- 1. Create credit_wallets (Priority 4)
CREATE TABLE IF NOT EXISTS public.credit_wallets (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance INT DEFAULT 50, -- Starting balance
  lifetime_purchased INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Daily Usage Log (Priority 6 & 10)
-- Tracks actions per user/day for heatmap and limits
CREATE TABLE IF NOT EXISTS public.usage_daily_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  count INT DEFAULT 1,
  UNIQUE(user_id, action, date)
);

-- 3. Atomic Credit Consumption Function (Priority 4)
CREATE OR REPLACE FUNCTION public.consume_ai_credit(p_user_id UUID, p_action TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cost INT;
  v_balance INT;
BEGIN
  -- 1. Map costs (must match AI_ACTION_COSTS in TypeScript)
  v_cost := CASE p_action
    WHEN 'ai_doubt_solve' THEN 2
    WHEN 'ai_test_generate' THEN 5
    WHEN 'ai_study_plan' THEN 15
    ELSE 0
  END;

  -- 2. Check balance
  -- FOR UPDATE ensures no other transaction modifies this row until we are done
  SELECT balance INTO v_balance FROM public.credit_wallets WHERE user_id = p_user_id FOR UPDATE;
  
  IF v_balance IS NULL THEN
    -- Auto-initialize wallet if missing
    INSERT INTO public.credit_wallets (user_id, balance) VALUES (p_user_id, 50) RETURNING balance INTO v_balance;
  END IF;

  IF v_balance < v_cost THEN
    RETURN jsonb_build_object('success', false, 'new_balance', v_balance);
  END IF;

  -- 3. Deduct
  UPDATE public.credit_wallets 
  SET balance = balance - v_cost 
  WHERE user_id = p_user_id
  RETURNING balance INTO v_balance;

  -- 4. Log usage automatically
  PERFORM public.increment_daily_usage(p_user_id, p_action, CURRENT_DATE);

  RETURN jsonb_build_object('success', true, 'new_balance', v_balance);
END;
$$;

-- 4. Daily Usage Increment Function
CREATE OR REPLACE FUNCTION public.increment_daily_usage(p_user_id UUID, p_action TEXT, p_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.usage_daily_log (user_id, action, date, count)
  VALUES (p_user_id, p_action, p_date, 1)
  ON CONFLICT (user_id, action, date)
  DO UPDATE SET count = usage_daily_log.count + 1;
END;
$$;

-- 5. RLS Policies
ALTER TABLE public.credit_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own wallet" ON public.credit_wallets FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE public.usage_daily_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own activity" ON public.usage_daily_log FOR SELECT USING (auth.uid() = user_id);

-- 6. Trigger to create wallet on profile creation
CREATE OR REPLACE FUNCTION public.handle_new_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.credit_wallets (user_id, balance)
  VALUES (NEW.id, 50);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created_wallet ON public.profiles;
CREATE TRIGGER on_profile_created_wallet
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_wallet();
