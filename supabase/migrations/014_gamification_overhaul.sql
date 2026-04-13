-- Consolidation and gamification overhaul
BEGIN;

-- 1. Ensure reputation_history has all necessary columns
ALTER TABLE public.reputation_history 
ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Migrate data from reputation_events if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reputation_events') THEN
        INSERT INTO public.reputation_history (user_id, points, action, entity_id, created_at, metadata)
        SELECT user_id, points, event_type, entity_id, created_at, jsonb_build_object('source', 'legacy_events')
        FROM public.reputation_events
        ON CONFLICT DO NOTHING;
        
        DROP TABLE public.reputation_events CASCADE;
    END IF;
END $$;

-- 3. Update update_reputation function
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
    ELSE 0
  END;

  IF v_points != 0 THEN
    INSERT INTO public.reputation_history (user_id, action, points, entity_id, metadata, idempotency_key)
    VALUES (p_user_id, p_action, v_points, p_entity_id, p_metadata, p_idempotency_key);

    UPDATE public.profiles
    SET reputation_points = reputation_points + v_points
    WHERE id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Implement update_login_streak function
CREATE OR REPLACE FUNCTION public.update_login_streak(u_id UUID)
RETURNS VOID AS $$
DECLARE
    last_login TIMESTAMP;
    current_streak INTEGER;
BEGIN
    SELECT last_login_at, login_streak INTO last_login, current_streak
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
    ELSIF last_login::date < (NOW() - INTERVAL '1 day')::date THEN
        -- Missed a day or more
        UPDATE public.profiles 
        SET login_streak = 1, last_login_at = NOW() 
        WHERE id = u_id;
    ELSE
        -- Already updated today, just update timestamp for precision if needed
        UPDATE public.profiles 
        SET last_login_at = NOW() 
        WHERE id = u_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Add missing badges
INSERT INTO public.badges (name, description, icon_url, criteria_type, criteria_value)
VALUES 
('Test Ace', 'Scored 100% on a practice test', 'award', 'test_score', 100),
('Streak Master', 'Maintained a 7-day login streak', 'flame', 'streak', 7)
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

COMMIT;
