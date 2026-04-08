-- SkillBridge Reputation & Notification Functions (Phase 1 Refactoring)

-- 1. Helper to record reputation events and update profile totals (Atomic CTE Fix from BUG-06)
CREATE OR REPLACE FUNCTION award_points(
  u_id    UUID,
  p_count INTEGER,
  e_type  TEXT,
  ent_id  UUID    DEFAULT NULL,
  i_key   TEXT    DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- Generate a fallback idempotency key if not provided
  IF i_key IS NULL THEN
    i_key := e_type || ':' || u_id::TEXT || ':' || extract(epoch from now())::BIGINT::TEXT;
  END IF;

  -- Atomic insert + conditional update in one CTE
  WITH ins AS (
    INSERT INTO public.reputation_events (user_id, points, event_type, entity_id, idempotency_key)
    VALUES (u_id, p_count, e_type, ent_id, i_key)
    ON CONFLICT (idempotency_key) DO NOTHING
    RETURNING 1
  )
  UPDATE public.profiles
  SET
    reputation_points = reputation_points + p_count,
    updated_at        = timezone('utc'::text, now())
  WHERE id = u_id
    AND EXISTS (SELECT 1 FROM ins);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Badge checker function (called from triggers)
CREATE OR REPLACE FUNCTION check_and_award_badges(u_id UUID)
RETURNS void AS $$
DECLARE
  v_rep      INTEGER;
  v_answers  BIGINT;
  v_accepted BIGINT;
BEGIN
  -- Load current user stats
  SELECT reputation_points INTO v_rep FROM public.profiles WHERE id = u_id;
  
  SELECT COUNT(*) INTO v_answers
    FROM public.answers WHERE author_id = u_id;
  
  SELECT COUNT(*) INTO v_accepted
    FROM public.answers WHERE author_id = u_id AND is_accepted = true;

  -- Badge: First Answer
  IF v_answers >= 1 THEN
    INSERT INTO public.user_badges (user_id, badge_id)
    SELECT u_id, b.id FROM public.badges b WHERE b.name = 'First Answer'
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;

  -- Badge: Helpful Mentor (5 accepted answers)
  IF v_accepted >= 5 THEN
    INSERT INTO public.user_badges (user_id, badge_id)
    SELECT u_id, b.id FROM public.badges b WHERE b.name = 'Helpful Mentor'
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;

  -- Badge: Subject Expert (250+ points)
  IF v_rep >= 250 THEN
    INSERT INTO public.user_badges (user_id, badge_id)
    SELECT u_id, b.id FROM public.badges b WHERE b.name = 'Subject Expert'
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;

  -- Badge: Streak Master (7-day login streak)
  DECLARE
    v_streak INTEGER;
  BEGIN
    SELECT login_streak INTO v_streak FROM public.profiles WHERE id = u_id;
    IF v_streak >= 7 THEN
      INSERT INTO public.user_badges (user_id, badge_id)
      SELECT u_id, b.id FROM public.badges b WHERE b.name = 'Streak Master'
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger for New Answer (+10 points)
CREATE OR REPLACE FUNCTION handle_new_answer_points()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM award_points(
    NEW.author_id,
    10,
    'answer_posted',
    NEW.doubt_id,
    'ans_post_' || NEW.id::TEXT
  );
  PERFORM check_and_award_badges(NEW.author_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_answer_created ON public.answers;
CREATE TRIGGER on_answer_created
  AFTER INSERT ON public.answers
  FOR EACH ROW EXECUTE FUNCTION handle_new_answer_points();

-- 4. Trigger for Accepted Answer (+25 points)
CREATE OR REPLACE FUNCTION handle_answer_acceptance_points()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_accepted = true AND (OLD.is_accepted = false OR OLD.is_accepted IS NULL) THEN
    -- Award points
    PERFORM award_points(
      NEW.author_id,
      25,
      'answer_accepted',
      NEW.doubt_id,
      'ans_acc_' || NEW.id::TEXT
    );
    PERFORM check_and_award_badges(NEW.author_id);

    -- Notify
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      NEW.author_id,
      'Solution Accepted! +25 pts',
      'Your answer was chosen as the best solution.',
      'answer_accepted',
      '/doubts/' || NEW.doubt_id::TEXT
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_answer_accepted_update ON public.answers;
CREATE TRIGGER on_answer_accepted_update
  AFTER UPDATE ON public.answers
  FOR EACH ROW EXECUTE FUNCTION handle_answer_acceptance_points();

-- 5. Badge Seed Data
INSERT INTO public.badges (name, description, icon, requirement_points)
VALUES
  ('First Answer',    'Posted your very first answer',          '✍️', 10),
  ('Helpful Mentor',  '5 of your answers have been accepted',   '🤝', 100),
  ('Streak Master',   'Logged in 7 days in a row',              '🔥', 50),
  ('Subject Expert',  'Earned 250+ reputation points',          '🎓', 250)
ON CONFLICT (name) DO NOTHING;

-- 6. Login Streak Update logic
CREATE OR REPLACE FUNCTION update_login_streak(u_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_last_login TIMESTAMP WITH TIME ZONE;
  v_streak     INTEGER;
  v_today      DATE := CURRENT_DATE;
  v_yesterday  DATE := CURRENT_DATE - 1;
BEGIN
  SELECT last_login_at, login_streak
    INTO v_last_login, v_streak
    FROM public.profiles
   WHERE id = u_id;

  -- First ever login
  IF v_last_login IS NULL THEN
    v_streak := 1;
  -- Already logged in today
  ELSIF v_last_login::DATE = v_today THEN
    RETURN v_streak;
  -- Logged in yesterday -> extend streak
  ELSIF v_last_login::DATE = v_yesterday THEN
    v_streak := COALESCE(v_streak, 0) + 1;
  -- Streak broken
  ELSE
    v_streak := 1;
  END IF;

  UPDATE public.profiles
     SET last_login_at = NOW(),
         login_streak  = v_streak
   WHERE id = u_id;

  RETURN v_streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
