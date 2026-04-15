-- ============================================================
-- Migration 023: Ecosystem Finalization
-- Consolidates Reputation Engine, Activity Logging, and Talent discovery
-- ============================================================

-- 1. Ensure Profiles has all necessary columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS recruitment_opt_in BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS learning_momentum FLOAT DEFAULT 0.0;

-- 2. Mastery Snapshots (for Time-Series Charts)
CREATE TABLE IF NOT EXISTS public.mastery_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  avg_score FLOAT NOT NULL,
  recorded_at DATE DEFAULT CURRENT_DATE,
  UNIQUE(student_id, subject, recorded_at)
);

CREATE INDEX IF NOT EXISTS idx_mastery_snapshots_student ON public.mastery_snapshots(student_id, recorded_at);

-- 3. Reputation History (Canonical Audit Trail)
-- (Already exists from 014, but we ensure structure)

-- 4. Canonical Reputation RPC
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
    WHEN 'post_answer'      THEN 15
    WHEN 'answer_accepted'  THEN 25
    WHEN 'answer_upvoted'   THEN 10
    WHEN 'test_passed'      THEN 15
    WHEN 'complete_test'    THEN COALESCE((p_metadata->>'points')::int, 10)
    WHEN 'cert_earned'      THEN 50
    WHEN 'daily_login'      THEN 5
    WHEN 'streak_bonus'     THEN 50
    WHEN 'mentor_session'   THEN 20
    WHEN 'rating_5'         THEN 30
    ELSE 0
  END;

  IF v_points = 0 AND p_action != 'complete_test' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid action');
  END IF;

  -- 2. Record in History
  BEGIN
    INSERT INTO public.reputation_history (user_id, points, action, entity_id, idempotency_key, metadata)
    VALUES (p_user_id, v_points, p_action, p_entity_id, p_idempotency_key, p_metadata);
  EXCEPTION WHEN unique_violation THEN
    SELECT reputation_points INTO v_new_total FROM public.profiles WHERE id = p_user_id;
    RETURN jsonb_build_object('success', true, 'reputation', v_new_total, 'duplicate', true);
  END;

  -- 3. Update Profile
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

-- 5. Updated Triggers to include Reputation
-- (Overriding triggers from 022 to add points)

-- Update Practice Completion Trigger
CREATE OR REPLACE FUNCTION on_practice_attempt_completed_v2()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    PERFORM log_daily_activity(NEW.user_id, 'test_completed');
    -- Award reputation for completing a test
    PERFORM update_reputation(NEW.user_id, 'complete_test', NEW.id, jsonb_build_object('score', NEW.score));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_practice_attempt_completed ON public.practice_attempts;
CREATE TRIGGER on_practice_attempt_completed
  AFTER UPDATE OF status ON public.practice_attempts
  FOR EACH ROW
  EXECUTE FUNCTION on_practice_attempt_completed_v2();

-- Update Doubt Posted Trigger
CREATE OR REPLACE FUNCTION on_doubt_created_v2()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM log_daily_activity(NEW.author_id, 'doubt_posted');
  PERFORM update_reputation(NEW.author_id, 'post_doubt', NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_doubt_created ON public.doubts;
CREATE TRIGGER on_doubt_created
  AFTER INSERT ON public.doubts
  FOR EACH ROW
  EXECUTE FUNCTION on_doubt_created_v2();

-- Update Answer Posted Trigger
CREATE OR REPLACE FUNCTION on_answer_posted_v2()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM log_daily_activity(NEW.author_id, 'answer_posted');
  PERFORM update_reputation(NEW.author_id, 'post_answer', NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_answer_posted ON public.answers;
CREATE TRIGGER on_answer_posted
  AFTER INSERT ON public.answers
  FOR EACH ROW
  EXECUTE FUNCTION on_answer_posted_v2();

-- 6. Leaderboard Views
DROP VIEW IF EXISTS public.leaderboard_alltime CASCADE;
CREATE OR REPLACE VIEW public.leaderboard_alltime AS
SELECT 
  p.id, 
  p.full_name, 
  p.username,
  p.avatar_url, 
  p.reputation_points,
  p.college,
  p.recruitment_opt_in,
  p.branch,
  RANK() OVER (ORDER BY p.reputation_points DESC) as rank
FROM public.profiles p
WHERE p.role = 'student';

DROP VIEW IF EXISTS public.leaderboard_weekly CASCADE;
CREATE OR REPLACE VIEW public.leaderboard_weekly AS
WITH weekly_points AS (
  SELECT user_id, SUM(points) as total_delta
  FROM public.reputation_history
  WHERE created_at > now() - interval '7 days'
  GROUP BY user_id
)
SELECT 
  p.id, 
  p.full_name, 
  p.username,
  p.avatar_url, 
  p.reputation_points as total_points,
  COALESCE(wp.total_delta, 0) as weekly_points,
  p.college,
  p.recruitment_opt_in,
  p.branch,
  RANK() OVER (ORDER BY COALESCE(wp.total_delta, 0) DESC) as rank
FROM public.profiles p
LEFT JOIN weekly_points wp ON p.id = wp.user_id
WHERE p.role = 'student';

-- 7. Mentor Affiliation
ALTER TABLE public.mentor_profiles ADD COLUMN IF NOT EXISTS is_affiliated BOOLEAN DEFAULT false;
ALTER TABLE public.mentor_profiles ADD COLUMN IF NOT EXISTS affiliated_org_id UUID REFERENCES public.organizations(id);
