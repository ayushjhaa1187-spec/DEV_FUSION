-- ============================================================
-- Migration 006: Gamification translation from Master Prompt
-- Translates MongoDB logic into PostgreSQL schema updates & RPCs
-- ============================================================

-- 1. Add Last Login Tracking & Level tracking to Profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS last_login_date TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS current_level TEXT DEFAULT 'Novice';

-- 2. Update Reputation Ledger to be Idempotent
ALTER TABLE reputation_ledger 
ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_reputation_ledger_idempotency ON reputation_ledger(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_reputation_user_created ON reputation_ledger(user_id, created_at);

-- 3. Stored Procedure: Award Idempotent Reputation Points
CREATE OR REPLACE FUNCTION award_reputation(
  p_user_id UUID,
  p_event_type TEXT,
  p_entity_id UUID,
  p_points INT,
  p_idempotency_key TEXT
) RETURNS JSONB AS $$
DECLARE
  v_current_rep INT;
  v_new_level TEXT;
BEGIN
  -- Prevent duplicate awards via idempotency constraint
  BEGIN
    INSERT INTO reputation_ledger (user_id, event_type, entity_id, points_delta, idempotency_key)
    VALUES (p_user_id, p_event_type, p_entity_id, p_points, p_idempotency_key);
  EXCEPTION WHEN unique_violation THEN
    -- If duplicate, silently return current state
    SELECT reputation_points, current_level INTO v_current_rep, v_new_level FROM profiles WHERE id = p_user_id;
    RETURN jsonb_build_object('success', false, 'reason', 'already_awarded', 'reputation', v_current_rep, 'level', v_new_level);
  END;

  -- Update user reputation
  UPDATE profiles 
  SET reputation_points = reputation_points + p_points
  WHERE id = p_user_id
  RETURNING reputation_points INTO v_current_rep;

  -- Level Logic
  IF v_current_rep >= 1000 THEN v_new_level := 'Legend';
  ELSIF v_current_rep >= 500 THEN v_new_level := 'Expert';
  ELSIF v_current_rep >= 200 THEN v_new_level := 'Helper';
  ELSE v_new_level := 'Novice';
  END IF;

  UPDATE profiles SET current_level = v_new_level WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true, 'reputation', v_current_rep, 'level', v_new_level, 'points_awarded', p_points);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Stored Procedure: Handle Daily Login Streak
CREATE OR REPLACE FUNCTION process_login_streak(p_user_id UUID) RETURNS JSONB AS $$
DECLARE
  v_last_login TIMESTAMPTZ;
  v_streak INT;
  v_days_diff INT;
  v_idempotency_key TEXT;
  v_points_awarded INT := 0;
BEGIN
  SELECT last_login_date, login_streak INTO v_last_login, v_streak 
  FROM profiles WHERE id = p_user_id;

  -- Calculate day difference in UTC
  -- Extract days from the interval
  v_days_diff := EXTRACT(DAY FROM DATE_TRUNC('day', NOW()) - DATE_TRUNC('day', v_last_login));

  IF v_days_diff = 1 THEN
    -- Consecutive day
    v_streak := v_streak + 1;
    v_points_awarded := 2;
  ELSIF v_days_diff > 1 THEN
    -- Streak broken
    v_streak := 1;
    v_points_awarded := 2;
  ELSE
    -- Same day login, do nothing
    RETURN jsonb_build_object('success', false, 'streak', v_streak, 'points_awarded', 0, 'reason', 'already_logged_in_today');
  END IF;

  -- Update Profile
  UPDATE profiles 
  SET login_streak = v_streak, last_login_date = NOW()
  WHERE id = p_user_id;

  -- Award points if streak updated
  IF v_points_awarded > 0 THEN
    -- Generate idempotency key based on user and current date (yyyy-mm-dd)
    v_idempotency_key := 'dailylogin:' || p_user_id::TEXT || ':' || TO_CHAR(NOW(), 'YYYY-MM-DD');
    PERFORM award_reputation(p_user_id, 'dailylogin', NULL, v_points_awarded, v_idempotency_key);
  END IF;

  RETURN jsonb_build_object('success', true, 'streak', v_streak, 'points_awarded', v_points_awarded);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Seed some Default Badges
INSERT INTO badges (name, description, icon, requirement_type, requirement_value)
VALUES 
  ('firstanswer', 'Posted first answer', 'MessageSquare', 'answerposted', 1),
  ('helpful5', '5 accepted answers', 'ThumbsUp', 'answeraccepted', 5),
  ('streak7', '7 day login streak', 'Flame', 'dailylogin', 7),
  ('subjectexpert', '50 answers posted', 'Award', 'answerposted', 50),
  ('testmaster', '10 practice tests passed', 'Target', 'testcompleted', 10),
  ('reputation500', 'Reached Expert level (500 XP)', 'Star', 'reputation', 500),
  ('reputation1000', 'Reached Legend level (1000 XP)', 'Crown', 'reputation', 1000)
ON CONFLICT (name) DO NOTHING;

-- 6. RPC: Check and Award Badges
CREATE OR REPLACE FUNCTION check_and_award_badges(p_user_id UUID, p_trigger_type TEXT) RETURNS JSONB AS $$
DECLARE
  v_badge RECORD;
  v_earned_count INT := 0;
  v_condition_met BOOLEAN;
  v_test_count INT;
  v_answer_count INT;
  v_accepted_count INT;
  v_streak INT;
  v_rep INT;
BEGIN
  -- We evaluate un-earned badges that match the triggering event type or generic 'any'
  FOR v_badge IN 
    SELECT * FROM badges 
    WHERE requirement_type IN (p_trigger_type, 'reputation')
    AND id NOT IN (SELECT badge_id FROM user_badges WHERE user_id = p_user_id)
  LOOP
    v_condition_met := false;

    -- Evaluate based on trigger logic described in Master Prompt
    IF v_badge.requirement_type = 'answerposted' THEN
      SELECT COUNT(*) INTO v_answer_count FROM answers WHERE author_id = p_user_id;
      IF v_answer_count >= v_badge.requirement_value THEN v_condition_met := true; END IF;

    ELSIF v_badge.requirement_type = 'answeraccepted' THEN
      SELECT COUNT(*) INTO v_accepted_count FROM answers WHERE author_id = p_user_id AND is_accepted = true;
      IF v_accepted_count >= v_badge.requirement_value THEN v_condition_met := true; END IF;

    ELSIF v_badge.requirement_type = 'dailylogin' THEN
      SELECT login_streak INTO v_streak FROM profiles WHERE id = p_user_id;
      IF v_streak >= v_badge.requirement_value THEN v_condition_met := true; END IF;

    ELSIF v_badge.requirement_type = 'testcompleted' THEN
      -- Passed means score >= 70 (assumption based on prompt)
      SELECT COUNT(*) INTO v_test_count FROM practice_attempts WHERE user_id = p_user_id AND score >= 70;
      IF v_test_count >= v_badge.requirement_value THEN v_condition_met := true; END IF;

    ELSIF v_badge.requirement_type = 'reputation' THEN
      SELECT reputation_points INTO v_rep FROM profiles WHERE id = p_user_id;
      IF v_rep >= v_badge.requirement_value THEN v_condition_met := true; END IF;
    END IF;

    -- Award if met
    IF v_condition_met THEN
      BEGIN
        INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, v_badge.id);
        
        -- Also create an in-app notification
        INSERT INTO notifications (user_id, type, title, body, entity_type, entity_id)
        VALUES (p_user_id, 'badgeearned', 'Badge Unlocked!', 'You earned the ' || v_badge.name || ' badge.', 'badge', v_badge.id);

        v_earned_count := v_earned_count + 1;
      EXCEPTION WHEN unique_violation THEN
        -- already awarded
      END;
    END IF;

  END LOOP;

  RETURN jsonb_build_object('success', true, 'badges_earned_this_run', v_earned_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
