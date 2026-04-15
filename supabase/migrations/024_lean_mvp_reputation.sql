-- ============================================================
-- Migration 024: Lean MVP Reputation Adjustment
-- Corrects double-reward logic and aligns multipliers with MVP specs.
-- ============================================================

-- 1. Update the reputation function with EXACT requested values
CREATE OR REPLACE FUNCTION public.update_reputation(
  p_user_id UUID,
  p_action TEXT,
  p_entity_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_points INT;
  v_new_total INT;
BEGIN
  -- 1. Determine points based on action
  v_points := CASE p_action
    WHEN 'post_doubt'       THEN 5
    WHEN 'post_answer'      THEN 10
    WHEN 'answer_accepted'  THEN 25
    WHEN 'test_passed'      THEN 15
    WHEN 'complete_test'    THEN 15
    WHEN 'daily_login'      THEN 5
    WHEN 'streak_bonus'     THEN 20
    WHEN 'mentor_booking'   THEN 10
    ELSE 0
  END;

  IF v_points = 0 AND p_action NOT IN ('daily_login', 'streak_bonus') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid action or zero points');
  END IF;

  -- 2. Idempotency Check (Prevent duplicate awards for the same action/entity)
  IF p_idempotency_key IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.reputation_history WHERE idempotency_key = p_idempotency_key
  ) THEN
    SELECT reputation_points INTO v_new_total FROM public.profiles WHERE id = p_user_id;
    RETURN jsonb_build_object('success', true, 'reputation', v_new_total, 'duplicate', true);
  END IF;

  -- 3. Record in History
  INSERT INTO public.reputation_history (user_id, points, action, entity_id, idempotency_key, metadata)
  VALUES (p_user_id, v_points, p_action, p_entity_id, p_idempotency_key, p_metadata);

  -- 4. Update Profile
  UPDATE public.profiles
  SET reputation_points = reputation_points + v_points
  WHERE id = p_user_id
  RETURNING reputation_points INTO v_new_total;

  RETURN jsonb_build_object(
    'success', true,
    'reputation', v_new_total,
    'delta', v_points,
    'action', p_action
  );
END;
$$;

-- 2. Ensure triggers are clean and use appropriate actions
CREATE OR REPLACE FUNCTION on_doubt_created_v2()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_reputation(NEW.author_id, 'post_doubt', NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION on_answer_posted_v2()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_reputation(NEW.author_id, 'post_answer', NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
