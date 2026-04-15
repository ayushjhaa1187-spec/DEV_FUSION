-- ============================================================
-- Migration 025: Manual Reputation Control Shift
-- Removes automatic triggers to allow API-driven reputation control.
-- ============================================================

-- 1. Drop existing reputation triggers to prevent double-awarding
DROP TRIGGER IF EXISTS on_doubt_created_trigger_v2 ON public.doubts;
DROP TRIGGER IF EXISTS on_answer_posted_trigger_v2 ON public.answers;

-- 2. Update the reputation function to be robust and support both old and new keys
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
    WHEN 'answer_upvoted'   THEN 10  -- Explicitly requested (+10)
    WHEN 'post_answer'      THEN 10  -- Mapping old key for safety
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

  -- 2. Optional Idempotency Check
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
