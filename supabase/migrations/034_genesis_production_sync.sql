-- Migration 034: Genesis Production Sync
-- THE ABSOLUTE RECOVERY SCRIPT to resolve all production RLS violations and missing RPCs.

-- 1. Ensure the Reputation History Table is hardened
CREATE TABLE IF NOT EXISTS public.reputation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    points INTEGER DEFAULT 0,
    entity_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    idempotency_key TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Grant Global Authenticated Access for Reputation Management
ALTER TABLE public.reputation_history ENABLE ROW LEVEL SECURITY;

-- DROP AND RE-CREATE POLICIES: Resolve "Ecosystem Breach" RLS locks
DROP POLICY IF EXISTS "Users can view own reputation" ON public.reputation_history;
CREATE POLICY "Users can view own reputation" 
ON public.reputation_history FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "App can insert reputation" ON public.reputation_history;
CREATE POLICY "App can insert reputation" 
ON public.reputation_history FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 3. Ensure the Usage Logging Table exists and has open RLS for authenticated owners
CREATE TABLE IF NOT EXISTS public.usage_daily_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    count INTEGER DEFAULT 1,
    date DATE DEFAULT CURRENT_DATE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, action, date)
);

ALTER TABLE public.usage_daily_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own usage logs" ON public.usage_daily_log;
CREATE POLICY "Users can manage own usage logs" 
ON public.usage_daily_log FOR ALL 
USING (auth.uid() = user_id);

-- 4. Re-deploy CRITICAL RPCs to the 'public' schema
-- These functions are used by the Node.js API layer.

-- A: Update Reputation RPC
CREATE OR REPLACE FUNCTION public.update_reputation(
  p_user_id UUID,
  p_action TEXT,
  p_entity_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_idempotency_key TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_points INTEGER;
BEGIN
  -- Points Logic
  CASE p_action
    WHEN 'daily_login' THEN v_points := 10;
    WHEN 'accepted_answer' THEN v_points := 50;
    WHEN 'doubt_resolved' THEN v_points := 20;
    ELSE v_points := 5;
  END CASE;

  INSERT INTO public.reputation_history (user_id, action, points, entity_id, metadata, idempotency_key)
  VALUES (p_user_id, p_action, v_points, p_entity_id, p_metadata, p_idempotency_key)
  ON CONFLICT (idempotency_key) DO NOTHING;

  -- Update profile aggregation
  UPDATE public.profiles
  SET reputation_points = COALESCE(reputation_points, 0) + v_points
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- B: Update Login Streak RPC
CREATE OR REPLACE FUNCTION public.update_login_streak(u_id UUID) RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET 
    login_streak = CASE 
      WHEN last_login_date = CURRENT_DATE - INTERVAL '1 day' THEN login_streak + 1
      WHEN last_login_date = CURRENT_DATE THEN login_streak
      ELSE 1
    END,
    last_login_date = CURRENT_DATE
  WHERE id = u_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Final Permissions Audit
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres;

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.reputation_history TO authenticated;
GRANT ALL ON public.usage_daily_log TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_reputation TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_login_streak TO authenticated;
