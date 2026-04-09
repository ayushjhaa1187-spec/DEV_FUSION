-- Phase 1 Gamification Logic
-- Award +25 rep to the answerer when an answer is marked as accepted.
-- Increment reputation atomically and update reputation_points in profiles.

-- 1. Reputation Ledger Table (if not exists)
CREATE TABLE IF NOT EXISTS public.reputation_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    points INTEGER NOT NULL,
    reference_id UUID, -- id of the doubt, answer, or test
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Trigger to sync reputation_history sum to profiles.reputation_points
CREATE OR REPLACE FUNCTION sync_user_reputation()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET reputation_points = (
        SELECT COALESCE(SUM(points), 0)
        FROM public.reputation_history
        WHERE user_id = NEW.user_id
    )
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_reputation_added ON public.reputation_history;
CREATE TRIGGER on_reputation_added
    AFTER INSERT ON public.reputation_history
    FOR EACH ROW EXECUTE FUNCTION sync_user_reputation();

-- 3. Functions for Specific Actions

-- A. Mark as Accepted
CREATE OR REPLACE FUNCTION accept_answer(p_answer_id UUID, p_doubt_id UUID, p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_answer_author_id UUID;
    v_doubt_author_id UUID;
BEGIN
    -- Check if doubt author is the one accepting
    SELECT user_id INTO v_doubt_author_id FROM public.doubts WHERE id = p_doubt_id;
    IF v_doubt_author_id != p_user_id THEN
        RAISE EXCEPTION 'Only the doubt author can accept an answer';
    END IF;

    -- Get answer author
    SELECT user_id INTO v_answer_author_id FROM public.answers WHERE id = p_answer_id;

    -- Update Doubt
    UPDATE public.doubts SET accepted_answer_id = p_answer_id, status = 'resolved' WHERE id = p_doubt_id;

    -- Award Reputation (+25)
    INSERT INTO public.reputation_history (user_id, action_type, points, reference_id)
    VALUES (v_answer_author_id, 'answer_accepted', 25, p_answer_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- B. Post an Answer (+10)
CREATE OR REPLACE FUNCTION handle_answer_points()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.reputation_history (user_id, action_type, points, reference_id)
    VALUES (NEW.user_id, 'answer_posted', 10, NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_answer_created ON public.answers;
CREATE TRIGGER on_answer_created
    AFTER INSERT ON public.answers
    FOR EACH ROW EXECUTE FUNCTION handle_answer_points();

-- C. Atomic Vote Increment
CREATE OR REPLACE FUNCTION increment_vote(p_answer_id UUID, p_increment INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE public.answers
    SET upvotes = upvotes + p_increment
    WHERE id = p_answer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Daily Streak Logic (+2)
-- Assume this is called via an API on first login of the day
CREATE OR REPLACE FUNCTION award_daily_login_points(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_last_login TIMESTAMP;
BEGIN
    SELECT last_login_at INTO v_last_login FROM public.profiles WHERE id = p_user_id;
    
    -- If last login was more than 20 hours ago but less than 48 hours (to maintain streak)
    -- Or if it's the first login
    IF v_last_login IS NULL OR (v_last_login < now() - interval '20 hours') THEN
        INSERT INTO public.reputation_history (user_id, action_type, points)
        VALUES (p_user_id, 'daily_login', 2);
        
        UPDATE public.profiles 
        SET login_streak = CASE 
            WHEN v_last_login > now() - interval '48 hours' THEN login_streak + 1 
            ELSE 1 
        END,
        last_login_at = now()
        WHERE id = p_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 30-Min Session Reminders (Phase 1.7)
CREATE OR REPLACE FUNCTION notify_upcoming_sessions()
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    SELECT 
        student_id, 
        'Session in 30 mins!', 
        'Your mentor session is about to start. Get ready!', 
        'session_reminder', 
        '/dashboard/sessions'
    FROM public.mentor_bookings
    WHERE status = 'confirmed' 
      AND slot_id IN (
          SELECT id FROM public.mentor_slots 
          WHERE start_time BETWEEN now() + interval '25 minutes' AND now() + interval '35 minutes'
      );
      
    INSERT INTO public.notifications (user_id, title, message, type, link)
    SELECT 
        mentor_id, 
        'Mentoring in 30 mins!', 
        'You have a session with a student starting soon.', 
        'session_reminder', 
        '/dashboard/sessions'
    FROM public.mentor_bookings
    WHERE status = 'confirmed' 
      AND slot_id IN (
          SELECT id FROM public.mentor_slots 
          WHERE start_time BETWEEN now() + interval '25 minutes' AND now() + interval '35 minutes'
      );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trending Score Logic (Phase 1.2)
-- Trending = (upvotes + answer_count)
CREATE OR REPLACE FUNCTION update_trending_scores()
RETURNS VOID AS $$
BEGIN
    UPDATE public.doubts
    SET trending_score = (votes + answer_count * 2)
    WHERE created_at > now() - interval '48 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
