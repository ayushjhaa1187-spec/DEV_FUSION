-- Migration: Feature Parity Alignment
-- Align reputation points and badges with the visual requirements

BEGIN;

-- 1. Update Reputation Function with correct point values
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
    WHEN 'post_answer' THEN 10
    WHEN 'accept_answer' THEN 25
    WHEN 'daily_login' THEN 2
    WHEN 'complete_test' THEN 5
    WHEN 'post_doubt' THEN 10
    WHEN 'streak_bonus' THEN 50
    WHEN 'vote_up' THEN 2
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

-- 2. Seed/Update Official Badges
INSERT INTO public.badges (name, description, icon, criteria_type, criteria_value)
VALUES 
('First Answer', 'Shared your first piece of knowledge with the community', 'message-square', 'answers_count', 1),
('Helpful Mentor', 'Maintained a 4.5+ rating across 5+ sessions', 'heart', 'mentor_rating', 5),
('Streak Master', 'Maintained a 7-day login streak', 'flame', 'streak', 7),
('Subject Expert', 'Scored 90%+ in 3 different tests for a single subject', 'award', 'subject_mastery', 3)
ON CONFLICT (name) DO UPDATE SET 
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  criteria_type = EXCLUDED.criteria_type,
  criteria_value = EXCLUDED.criteria_value;

COMMIT;
