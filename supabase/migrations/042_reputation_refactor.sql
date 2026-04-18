-- Migration 042: Reputation System Cleanup & Trigger Refactor
-- SkillBridge / DEV_FUSION Platform
-- This migration ensures all reputation triggers use the modern `update_reputation` function 
-- instead of the legacy (and now broken) `award_reputation` which depended on `reputation_ledger`.

-- 1. Drop the legacy award_reputation function and its dependencies
DROP FUNCTION IF EXISTS public.award_reputation CASCADE;

-- 2. Update 'on_answer_accepted' to use update_reputation
CREATE OR REPLACE FUNCTION public.handle_accepted_answer_v2()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_accepted = TRUE AND (OLD.is_accepted IS NULL OR OLD.is_accepted = FALSE) THEN
    -- Reward the answer author
    PERFORM public.update_reputation(
      NEW.author_id, 
      'answer_accepted', 
      NEW.id, 
      jsonb_build_object('doubt_id', NEW.doubt_id)
    );
    
    -- Update doubt status and mark as resolved
    UPDATE public.doubts 
    SET status = 'resolved', 
        accepted_answer_id = NEW.id,
        is_resolved = TRUE
    WHERE id = NEW.doubt_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_answer_accepted ON public.answers;
CREATE TRIGGER on_answer_accepted 
AFTER UPDATE OF is_accepted ON public.answers
FOR EACH ROW EXECUTE PROCEDURE public.handle_accepted_answer_v2();

-- 3. Update 'on_answer_vote' to use update_reputation
CREATE OR REPLACE FUNCTION public.handle_answer_vote_v2()
RETURNS TRIGGER AS $$
DECLARE 
  v_author_id UUID;
BEGIN
  SELECT author_id INTO v_author_id FROM public.answers WHERE id = NEW.answer_id;
  
  -- Handle upvotes
  IF NEW.vote_type = 1 THEN
    UPDATE public.answers 
    SET upvotes_count = upvotes_count + 1, 
        votes = votes + 1 
    WHERE id = NEW.answer_id;
    
    IF v_author_id IS NOT NULL AND v_author_id != NEW.user_id THEN
      PERFORM public.update_reputation(v_author_id, 'answer_upvoted', NEW.answer_id);
    END IF;
    
  -- Handle downvotes
  ELSIF NEW.vote_type = -1 THEN
    UPDATE public.answers 
    SET downvotes_count = downvotes_count + 1, 
        votes = votes - 1 
    WHERE id = NEW.answer_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_answer_vote ON public.answer_votes;
CREATE TRIGGER on_answer_vote 
AFTER INSERT ON public.answer_votes
FOR EACH ROW EXECUTE PROCEDURE public.handle_answer_vote_v2();

-- 4. Update 'on_test_submitted' (aligned with test_attempts table)
CREATE OR REPLACE FUNCTION public.handle_test_submission_v2()
RETURNS TRIGGER AS $$
BEGIN
  -- Logic for reputation based on test score
  -- Note: 041 aligned certificates with test_attempts
  IF NEW.score >= 0 THEN
    PERFORM public.update_reputation(
      NEW.user_id, 
      'test_passed', 
      NEW.id, 
      jsonb_build_object('score', NEW.score, 'percentage', NEW.percentage)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_test_submitted_v2 ON public.test_attempts;
CREATE TRIGGER on_test_submitted_v2 
AFTER INSERT ON public.test_attempts
FOR EACH ROW EXECUTE PROCEDURE public.handle_test_submission_v2();

-- 5. Fix possible recursive trigger or missing v2 functions from 024
-- Ensure doubt and answer creation triggers are pointing to update_reputation
DROP TRIGGER IF EXISTS on_doubt_created ON public.doubts;
CREATE OR REPLACE FUNCTION public.on_doubt_created_v2()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.update_reputation(NEW.author_id, 'post_doubt', NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_doubt_created 
AFTER INSERT ON public.doubts
FOR EACH ROW EXECUTE PROCEDURE public.on_doubt_created_v2();

DROP TRIGGER IF EXISTS on_answer_posted ON public.answers;
CREATE OR REPLACE FUNCTION public.on_answer_posted_v2()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.update_reputation(NEW.author_id, 'post_answer', NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_answer_posted 
AFTER INSERT ON public.answers
FOR EACH ROW EXECUTE PROCEDURE public.on_answer_posted_v2();
