-- Fix reputation signature and column names to match app expectations
BEGIN;

-- 1. Fix update_reputation to match app code signature and column names
CREATE OR REPLACE FUNCTION public.update_reputation(
  p_user_id UUID,
  p_action TEXT,
  p_entity_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_idempotency_key TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_points INTEGER;
BEGIN
  -- Idempotency check
  IF p_idempotency_key IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.reputation_history WHERE idempotency_key = p_idempotency_key
  ) THEN
    RETURN;
  END IF;

  v_points := CASE p_action
    WHEN 'post_doubt' THEN 10
    WHEN 'post_answer' THEN 15
    WHEN 'accept_answer' THEN 25
    WHEN 'vote_up' THEN 2
    WHEN 'daily_login' THEN 5
    WHEN 'complete_test' THEN COALESCE((p_metadata->>'points')::integer, 10)
    WHEN 'streak_bonus' THEN 50
    WHEN 'mentor_booking' THEN 20
    WHEN 'session_complete' THEN 30
    ELSE 0
  END;

  IF v_points != 0 THEN
    -- Ensure history table is clean
    INSERT INTO public.reputation_history (user_id, action, points, entity_id, metadata, idempotency_key)
    VALUES (p_user_id, p_action, v_points, p_entity_id, p_metadata, p_idempotency_key)
    ON CONFLICT (idempotency_key) DO NOTHING;

    -- Correct column name is reputation_points
    UPDATE public.profiles
    SET reputation_points = reputation_points + v_points
    WHERE id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ensure login_streak functionality is handled by update_login_streak RPC
-- (Already exists in 014, but let's ensure it handles today's logic)
CREATE OR REPLACE FUNCTION public.update_login_streak(u_id UUID)
RETURNS VOID AS $$
DECLARE
    last_login TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT last_login_at INTO last_login
    FROM public.profiles
    WHERE id = u_id;

    IF last_login IS NULL THEN
        UPDATE public.profiles 
        SET login_streak = 1, last_login_at = NOW() 
        WHERE id = u_id;
    ELSIF last_login::date = (NOW() - INTERVAL '1 day')::date THEN
        -- Logged in yesterday
        UPDATE public.profiles 
        SET login_streak = login_streak + 1, last_login_at = NOW() 
        WHERE id = u_id;
    ELSIF last_login::date < NOW()::date THEN
        -- Missed a day
        UPDATE public.profiles 
        SET login_streak = 1, last_login_at = NOW() 
        WHERE id = u_id;
    END IF;
    -- If already logged in today, do nothing to streak count
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
