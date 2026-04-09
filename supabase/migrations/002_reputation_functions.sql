-- ============================================================
-- Migration 002: Reputation Functions, Triggers, and Views
-- SkillBridge / DEV_FUSION Platform
-- ============================================================

-- 1. Compatibility view: reputation_events -> reputation_ledger
CREATE OR REPLACE VIEW reputation_events AS
  SELECT
    id,
    user_id,
    event_type,
    points_delta,
    entity_type,
    entity_id,
    metadata,
    created_at
  FROM reputation_ledger;

-- 2. Core function: Award reputation points and log to ledger
CREATE OR REPLACE FUNCTION award_reputation(
  p_user_id    UUID,
  p_event_type TEXT,
  p_points     INT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id  UUID DEFAULT NULL,
  p_metadata   JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO reputation_ledger (user_id, event_type, points_delta, entity_type, entity_id, metadata)
  VALUES (p_user_id, p_event_type, p_points, p_entity_type, p_entity_id, p_metadata);
  UPDATE profiles SET reputation_score = reputation_score + p_points, updated_at = NOW() WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger: Award points when an answer is accepted
CREATE OR REPLACE FUNCTION handle_accepted_answer()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_accepted = TRUE AND (OLD.is_accepted IS NULL OR OLD.is_accepted = FALSE) THEN
    PERFORM award_reputation(NEW.author_id, 'answer_accepted', 15, 'answer', NEW.id, jsonb_build_object('doubt_id', NEW.question_id));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_answer_accepted ON answers;
CREATE TRIGGER on_answer_accepted AFTER UPDATE OF is_accepted ON answers FOR EACH ROW EXECUTE PROCEDURE handle_accepted_answer();

-- 4. Trigger: Award points for posting a new answer
CREATE OR REPLACE FUNCTION handle_new_answer()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT NEW.is_ai_seeded THEN
    PERFORM award_reputation(NEW.author_id, 'answer_posted', 2, 'answer', NEW.id, jsonb_build_object('doubt_id', NEW.question_id));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_answer ON answers;
CREATE TRIGGER on_new_answer AFTER INSERT ON answers FOR EACH ROW EXECUTE PROCEDURE handle_new_answer();

-- 5. Trigger: Handle answer votes and award reputation
CREATE OR REPLACE FUNCTION handle_answer_vote()
RETURNS TRIGGER AS $$
DECLARE v_author_id UUID;
BEGIN
  SELECT author_id INTO v_author_id FROM answers WHERE id = NEW.answer_id;
  IF NEW.vote_type = 1 THEN
    UPDATE answers SET upvotes_count = upvotes_count + 1, score_cached = score_cached + 1 WHERE id = NEW.answer_id;
    IF v_author_id IS NOT NULL AND v_author_id != NEW.user_id THEN
      PERFORM award_reputation(v_author_id, 'answer_upvoted', 1, 'answer', NEW.answer_id);
    END IF;
  ELSIF NEW.vote_type = -1 THEN
    UPDATE answers SET downvotes_count = downvotes_count + 1, score_cached = score_cached - 1 WHERE id = NEW.answer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_answer_vote ON answer_votes;
CREATE TRIGGER on_answer_vote AFTER INSERT ON answer_votes FOR EACH ROW EXECUTE PROCEDURE handle_answer_vote();

-- 6. Trigger: Award reputation when a practice test is completed
CREATE OR REPLACE FUNCTION handle_test_submission()
RETURNS TRIGGER AS $$
DECLARE v_points INT;
BEGIN
  v_points := 5;
  IF NEW.percentage >= 80 THEN v_points := 15;
  ELSIF NEW.percentage >= 60 THEN v_points := 10;
  END IF;
  PERFORM award_reputation(NEW.user_id, 'test_completed', v_points, 'test_submission', NEW.id, jsonb_build_object('score', NEW.score, 'percentage', NEW.percentage));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_test_submitted ON test_submissions;
CREATE TRIGGER on_test_submitted AFTER INSERT ON test_submissions FOR EACH ROW EXECUTE PROCEDURE handle_test_submission();

-- 7. Function: Check and award badges based on reputation milestones
CREATE OR REPLACE FUNCTION check_and_award_badges(p_user_id UUID)
RETURNS VOID AS $$
DECLARE v_score INT; v_badge RECORD;
BEGIN
  SELECT reputation_score INTO v_score FROM profiles WHERE id = p_user_id;
  FOR v_badge IN SELECT id, requirement_value FROM badges WHERE requirement_type = 'reputation_score' AND requirement_value <= v_score LOOP
    INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, v_badge.id) ON CONFLICT (user_id, badge_id) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Trigger: Auto-run badge check after every reputation award
CREATE OR REPLACE FUNCTION after_reputation_award()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM check_and_award_badges(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_reputation_awarded ON reputation_ledger;
CREATE TRIGGER on_reputation_awarded AFTER INSERT ON reputation_ledger FOR EACH ROW EXECUTE PROCEDURE after_reputation_award();

-- 9. Function: Increment view count for doubts
CREATE OR REPLACE FUNCTION increment_view_count(doubt_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE questions SET views_count = views_count + 1 WHERE id = doubt_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. RLS policies for reputation_ledger
ALTER TABLE reputation_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own reputation history" ON reputation_ledger FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can insert reputation events" ON reputation_ledger FOR INSERT WITH CHECK (true);

-- 11. RLS for user_badges
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Badges are publicly viewable" ON user_badges FOR SELECT USING (true);
CREATE POLICY "Service role can award badges" ON user_badges FOR INSERT WITH CHECK (true);

-- 12. Seed default reputation badges
INSERT INTO badges (name, description, requirement_type, requirement_value) VALUES
  ('First Answer', 'Posted your first answer in the community', 'reputation_score', 2),
  ('Helper', 'Reached 25 reputation points', 'reputation_score', 25),
  ('Rising Star', 'Reached 100 reputation points', 'reputation_score', 100),
  ('Expert', 'Reached 500 reputation points', 'reputation_score', 500),
  ('Legend', 'Reached 1000 reputation points', 'reputation_score', 1000)
ON CONFLICT (name) DO NOTHING;
