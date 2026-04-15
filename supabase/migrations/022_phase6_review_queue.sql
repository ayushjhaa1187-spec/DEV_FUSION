-- ============================================================
-- Migration 022: Phase 6 - Conceptual Review Queue (Spaced Repetition)
-- Adds SM-2 algorithm support for adaptive learning
-- ============================================================

-- 1. Review Queue Table (SM-2 Spaced Repetition)
CREATE TABLE public.review_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  concept_id TEXT NOT NULL,                    -- e.g. "linear-algebra/eigenvalues"
  subject TEXT NOT NULL,
  ease_factor FLOAT DEFAULT 2.5,                -- SM-2 algorithm parameter (quality input)
  interval_days INT DEFAULT 1,                  -- Days until next review
  repetitions INT DEFAULT 0,                    -- Number of times reviewed
  due_at TIMESTAMPTZ DEFAULT now(),             -- When to review next
  last_score FLOAT,                             -- Last test score (0-1)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, concept_id)
);

CREATE INDEX idx_review_queue_due ON public.review_queue(student_id, due_at);
CREATE INDEX idx_review_queue_concept ON public.review_queue(concept_id);

-- 2. Daily Activity Log (for Streak Heatmap)
CREATE TABLE public.daily_activity_log (
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL,
  actions_count INT DEFAULT 1,
  action_types TEXT[] DEFAULT '{}',             -- e.g. ['test_completed', 'doubt_answered']
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (student_id, activity_date)
);

CREATE INDEX idx_daily_activity_student ON public.daily_activity_log(student_id);
CREATE INDEX idx_daily_activity_date ON public.daily_activity_log(activity_date);

-- 3. RLS Policies
ALTER TABLE public.review_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own review queue" ON public.review_queue
  FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Service manages queue" ON public.review_queue
  FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.daily_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own activity" ON public.daily_activity_log
  FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Service logs activity" ON public.daily_activity_log
  FOR INSERT WITH CHECK (true);

-- 4. Function: Add/Update review queue item (SM-2 calculation)
CREATE OR REPLACE FUNCTION handle_review_queue_update(
  p_student_id UUID,
  p_concept_id TEXT,
  p_subject TEXT,
  p_test_score FLOAT  -- 0 to 1 (percentage / 100)
)
RETURNS VOID AS $$
DECLARE
  v_ease_factor FLOAT;
  v_interval_days INT;
  v_repetitions INT;
BEGIN
  -- SM-2 Algorithm:
  -- If score < 0.6 (60%), enqueue for immediate review
  -- ease_factor = max(1.3, ease_factor + (0.1 - (0.08 * (0.6 - score))))

  IF p_test_score < 0.6 THEN
    -- Calculate new ease factor
    v_ease_factor := GREATEST(1.3, 2.5 + (0.1 - (0.08 * (0.6 - p_test_score))));
    v_interval_days := 1;
    v_repetitions := 0;
  ELSE
    -- Score >= 0.6, increase ease slightly
    v_ease_factor := GREATEST(1.3, 2.5 + (0.1 - (0.08 * (0.6 - p_test_score))));
    v_interval_days := 3;
    v_repetitions := 1;
  END IF;

  INSERT INTO public.review_queue (
    student_id, concept_id, subject, ease_factor,
    interval_days, repetitions, due_at, last_score
  ) VALUES (
    p_student_id, p_concept_id, p_subject, v_ease_factor,
    v_interval_days, v_repetitions,
    now() + (v_interval_days || ' days')::interval,
    p_test_score
  )
  ON CONFLICT (student_id, concept_id) DO UPDATE SET
    ease_factor = EXCLUDED.ease_factor,
    interval_days = EXCLUDED.interval_days,
    repetitions = EXCLUDED.repetitions,
    due_at = EXCLUDED.due_at,
    last_score = EXCLUDED.last_score,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Function: Log daily activity
CREATE OR REPLACE FUNCTION log_daily_activity(
  p_student_id UUID,
  p_action_type TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.daily_activity_log (
    student_id, activity_date, actions_count, action_types
  ) VALUES (
    p_student_id, CURRENT_DATE, 1, ARRAY[p_action_type]
  )
  ON CONFLICT (student_id, activity_date) DO UPDATE SET
    actions_count = daily_activity_log.actions_count + 1,
    action_types = array_append(EXCLUDED.action_types, p_action_type),
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger: Auto-log activity on practice attempt completion
CREATE OR REPLACE FUNCTION on_practice_attempt_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    PERFORM log_daily_activity(NEW.user_id, 'test_completed');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_practice_attempt_completed ON public.practice_attempts;
CREATE TRIGGER on_practice_attempt_completed
  AFTER UPDATE OF status ON public.practice_attempts
  FOR EACH ROW
  EXECUTE FUNCTION on_practice_attempt_completed();

-- 7. Trigger: Auto-log activity on doubt creation
CREATE OR REPLACE FUNCTION on_doubt_created()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM log_daily_activity(NEW.author_id, 'doubt_posted');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_doubt_created ON public.doubts;
CREATE TRIGGER on_doubt_created
  AFTER INSERT ON public.doubts
  FOR EACH ROW
  EXECUTE FUNCTION on_doubt_created();

-- 8. Trigger: Auto-log activity on answer posted
CREATE OR REPLACE FUNCTION on_answer_posted()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM log_daily_activity(NEW.author_id, 'answer_posted');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_answer_posted ON public.answers;
CREATE TRIGGER on_answer_posted
  AFTER INSERT ON public.answers
  FOR EACH ROW
  EXECUTE FUNCTION on_answer_posted();
