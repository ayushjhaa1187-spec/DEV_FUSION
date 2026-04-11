-- SkillBridge Comprehensive Backend Schema (Phase 1 Refactoring)

-- 1. Enums
CREATE TYPE public.user_role AS ENUM ('student', 'mentor', 'admin');
CREATE TYPE public.doubt_status AS ENUM ('open', 'answered', 'resolved', 'archived');
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'refunded');
CREATE TYPE public.notification_type AS ENUM ('answer_received', 'answer_accepted', 'answer_posted', 'session_reminder', 'reputation_gain', 'badge_earned', 'booking_confirmed');
CREATE TYPE public.mentor_application_status AS ENUM ('pending', 'approved', 'rejected');

-- 2. Core Tables
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role public.user_role DEFAULT 'student' NOT NULL,
  reputation_points INTEGER DEFAULT 0 NOT NULL,
  branch TEXT,
  semester INTEGER CHECK (semester BETWEEN 1 AND 8),
  bio TEXT,
  college TEXT,
  github_url TEXT,
  linkedin_url TEXT,
  website_url TEXT,
  login_streak INTEGER DEFAULT 0,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  code TEXT UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.user_subjects (
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) NOT NULL,
  PRIMARY KEY (user_id, subject_id)
);

CREATE TABLE public.doubts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES public.profiles(id) NOT NULL,
  subject_id UUID REFERENCES public.subjects(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status public.doubt_status DEFAULT 'open' NOT NULL,
  votes INTEGER DEFAULT 0 NOT NULL,
  ai_response TEXT,
  academic_context_snapshot JSONB, -- Record branch/semester at time of post
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doubt_id UUID REFERENCES public.doubts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.profiles(id) NOT NULL,
  content TEXT NOT NULL,
  votes INTEGER DEFAULT 0 NOT NULL,
  is_accepted BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.answer_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  answer_id UUID REFERENCES public.answers(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  vote_type INTEGER NOT NULL, -- 1 for upvote, -1 for downvote
  UNIQUE (answer_id, user_id)
);

CREATE TABLE public.doubt_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doubt_id UUID REFERENCES public.doubts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  vote_type INTEGER NOT NULL, -- 1 for upvote, -1 for downvote
  UNIQUE (doubt_id, user_id)
);


-- 3. Mentorship System
CREATE TABLE public.mentor_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  status public.mentor_application_status DEFAULT 'pending' NOT NULL,
  resume_url TEXT,
  expertise_areas TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.mentor_profiles (
  id UUID REFERENCES public.profiles(id) PRIMARY KEY,
  specialty TEXT NOT NULL,
  price_per_session INTEGER DEFAULT 0 NOT NULL,
  rating DECIMAL(3,2) DEFAULT 0.00,
  sessions_completed INTEGER DEFAULT 0 NOT NULL
);

CREATE TABLE public.mentor_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID REFERENCES public.mentor_profiles(id) NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  is_booked BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.mentor_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.profiles(id) NOT NULL,
  mentor_id UUID REFERENCES public.mentor_profiles(id) NOT NULL,
  slot_id UUID REFERENCES public.mentor_slots(id) NOT NULL,
  status public.booking_status DEFAULT 'pending' NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  payment_id TEXT,
  meeting_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Practice Test Engine
CREATE TABLE public.practice_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES public.profiles(id),
  subject_id UUID REFERENCES public.subjects(id),
  topic TEXT NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.practice_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id UUID REFERENCES public.practice_tests(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of strings
  correct_answer_index INTEGER NOT NULL,
  explanation TEXT
);

CREATE TABLE public.practice_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  test_id UUID REFERENCES public.practice_tests(id) NOT NULL,
  score INTEGER,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 5. Reputation & Gamification
CREATE TABLE public.reputation_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  points INTEGER NOT NULL,
  event_type TEXT NOT NULL, -- answer_posted, answer_accepted, daily_login
  entity_id UUID, -- doubt_id or answer_id link
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  idempotency_key TEXT UNIQUE -- prevents duplicate point awards
);

CREATE TABLE public.badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  requirement_points INTEGER NOT NULL
);

CREATE TABLE public.user_badges (
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  badge_id UUID REFERENCES public.badges(id) NOT NULL,
  PRIMARY KEY (user_id, badge_id)
);

-- 6. Notifications & Auditing
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type public.notification_type NOT NULL,
  is_read BOOLEAN DEFAULT false NOT NULL,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. RLS Baseline
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read: profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Private Write: profiles" ON public.profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE public.doubts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read: doubts" ON public.doubts FOR SELECT USING (true);
CREATE POLICY "Auth Create: doubts" ON public.doubts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Owner Update: doubts" ON public.doubts FOR UPDATE USING (auth.uid() = author_id);

ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read: answers" ON public.answers FOR SELECT USING (true);
CREATE POLICY "Auth Create: answers" ON public.answers FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Owner Edit: answers" ON public.answers FOR UPDATE USING (auth.uid() = author_id);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Private Read: notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Private Update: notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- 8. Views for Performance & Analytics
CREATE OR REPLACE VIEW public.doubts_with_stats AS
SELECT 
  d.*,
  p.username as author_username,
  p.avatar_url as author_avatar_url,
  s.name as subject_name,
  (SELECT COUNT(*) FROM public.answers a WHERE a.doubt_id = d.id) as answers_count,
  -- PS#2 Formula: (votes * 0.7 + answers_count * 0.3)
  (d.votes * 0.7 + (SELECT COUNT(*) FROM public.answers a WHERE a.doubt_id = d.id) * 0.3) as trending_score
FROM public.doubts d
JOIN public.profiles p ON d.author_id = p.id
LEFT JOIN public.subjects s ON d.subject_id = s.id;

CREATE OR REPLACE VIEW public.mentor_public_directory AS
SELECT 
  mp.*,
  p.username,
  p.full_name,
  p.avatar_url,
  p.reputation_points,
  ma.status as application_status
FROM public.mentor_profiles mp
JOIN public.profiles p ON mp.id = p.id
JOIN public.mentor_applications ma ON mp.id = ma.user_id
WHERE ma.status = 'approved';
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
DECLARE
  v_doubt_author_id UUID;
BEGIN
  -- Award points to answerer
  PERFORM award_points(
    NEW.author_id,
    10,
    'answer_posted',
    NEW.doubt_id,
    'ans_post_' || NEW.id::TEXT
  );
  PERFORM check_and_award_badges(NEW.author_id);

  -- Get doubt author
  SELECT author_id INTO v_doubt_author_id FROM public.doubts WHERE id = NEW.doubt_id;

  -- Notify doubt author (if not the same person)
  IF v_doubt_author_id != NEW.author_id THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      v_doubt_author_id,
      'New Answer!',
      'Someone just posted an answer to your doubt.',
      'answer_posted',
      '/doubts/' || NEW.doubt_id::TEXT
    );
  END IF;

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
-- Run this in your Supabase SQL editor to auto-create a profile row on user signup.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    username, 
    full_name, 
    avatar_url,
    college,
    branch,
    semester,
    bio,
    login_streak
  )
  VALUES (
    NEW.id,
    split_part(NEW.email, '@', 1) || '_' || floor(random() * 9000 + 1000)::text,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL),
    NULL, NULL, NULL, NULL, 0
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
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
-- Phase 3: Ecosystem & Advanced Gamification Logic

-- 1. Weekly XP View (Phase 3.3)
-- Calculations reset every Monday at 00:00 UTC
CREATE OR REPLACE VIEW public.weekly_leaderboard AS
SELECT 
    p.id as user_id,
    p.username,
    p.avatar_url,
    p.college,
    COALESCE(SUM(rh.points), 0) as weekly_xp
FROM public.profiles p
LEFT JOIN public.reputation_history rh ON p.id = rh.user_id
WHERE rh.created_at >= date_trunc('week', now())
GROUP BY p.id, p.username, p.avatar_url, p.college
ORDER BY weekly_xp DESC;

-- 2. Subject Expert Auto-Award (Phase 3.3)
-- Logic: If user has >= 10 accepted answers in a subject, award 'Subject Expert' badge
CREATE OR REPLACE FUNCTION check_for_subject_expert()
RETURNS TRIGGER AS $$
DECLARE
    v_subject_id UUID;
    v_accepted_count INTEGER;
    v_badge_exists BOOLEAN;
BEGIN
    -- The NEW row is from reputation_history where action_type = 'answer_accepted'
    IF NEW.action_type = 'answer_accepted' THEN
        -- Find the subject of the original doubt
        SELECT d.subject_id INTO v_subject_id
        FROM public.doubts d
        JOIN public.answers a ON a.doubt_id = d.id
        WHERE a.id = NEW.reference_id;

        -- Count accepted answers for this user in this subject
        SELECT COUNT(*) INTO v_accepted_count
        FROM public.doubts d
        JOIN public.answers a ON a.doubt_id = d.id
        WHERE a.user_id = NEW.user_id
          AND d.accepted_answer_id = a.id
          AND d.subject_id = v_subject_id;

        -- If count is 10, check if badge already awarded
        IF v_accepted_count >= 10 THEN
            SELECT EXISTS(
                SELECT 1 FROM public.user_badges 
                WHERE user_id = NEW.user_id AND metadata->>'subject_id' = v_subject_id::text
            ) INTO v_badge_exists;

            IF NOT v_badge_exists THEN
                INSERT INTO public.user_badges (user_id, badge_type, metadata)
                VALUES (NEW.user_id, 'subject_expert', jsonb_build_object('subject_id', v_subject_id));
                
                -- Extra bonus XP for being an expert
                INSERT INTO public.reputation_history (user_id, action_type, points)
                VALUES (NEW.user_id, 'expert_badge_earned', 50);
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_check_expert ON public.reputation_history;
CREATE TRIGGER trigger_check_expert
    AFTER INSERT ON public.reputation_history
    FOR EACH ROW EXECUTE FUNCTION check_for_subject_expert();

-- 3. Streak Freeze & Store (Phase 3.3)
-- Spend XP to get a 'streak_freeze' charge (Stored in metadata)
CREATE OR REPLACE FUNCTION purchase_streak_freeze(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_current_xp INTEGER;
BEGIN
    SELECT reputation_points INTO v_current_xp FROM public.profiles WHERE id = p_user_id;
    
    IF v_current_xp < 50 THEN
        RAISE EXCEPTION 'Insufficient XP. Needed: 50, Current: %', v_current_xp;
    END IF;

    -- Deduct XP
    INSERT INTO public.reputation_history (user_id, action_type, points)
    VALUES (p_user_id, 'store_purchase_streak_freeze', -50);

    -- Increment streak freeze count in profiles
    UPDATE public.profiles
    SET streak_freezes = COALESCE(streak_freezes, 0) + 1
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Dynamic Discount Function (Phase 3.3)
-- 100 XP = ₹50 discount on next session booking
CREATE OR REPLACE FUNCTION apply_xp_discount(p_user_id UUID, p_booking_id UUID)
RETURNS VOID AS $$
DECLARE
    v_current_xp INTEGER;
BEGIN
    SELECT reputation_points INTO v_current_xp FROM public.profiles WHERE id = p_user_id;

    IF v_current_xp < 100 THEN
        RAISE EXCEPTION 'Insufficient XP for discount.';
    END IF;

    -- Deduct 100 XP
    INSERT INTO public.reputation_history (user_id, action_type, points)
    VALUES (p_user_id, 'xp_discount_applied', -100);

    -- Log discount for the booking
    UPDATE public.mentor_bookings
    SET discount_amount = 50,
        metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{discount_type}', '"xp_redeem"')
    WHERE id = p_booking_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Phase 3: Payment & Subscription Schema Updates

-- Types for Payments
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_type') THEN
        CREATE TYPE public.payment_type AS ENUM ('subscription', 'session');
    END IF;
END $$;

-- 1. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    amount INTEGER NOT NULL, -- in paise
    currency TEXT DEFAULT 'INR' NOT NULL,
    status public.payment_status DEFAULT 'pending' NOT NULL,
    type public.payment_type NOT NULL,
    razorpay_order_id TEXT UNIQUE,
    razorpay_payment_id TEXT UNIQUE,
    razorpay_signature TEXT,
    entity_id UUID, -- Could be slot_id for sessions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Subscriptions Table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    user_id UUID REFERENCES public.profiles(id) PRIMARY KEY,
    tier TEXT DEFAULT 'free' NOT NULL, -- 'free', 'pro'
    start_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. User Usage Tracking
CREATE TABLE IF NOT EXISTS public.user_usage (
    user_id UUID REFERENCES public.profiles(id) PRIMARY KEY,
    interviews_this_month INTEGER DEFAULT 0 NOT NULL,
    questions_today INTEGER DEFAULT 0 NOT NULL,
    last_reset_interviews DATE DEFAULT CURRENT_DATE NOT NULL,
    last_reset_questions DATE DEFAULT CURRENT_DATE NOT NULL
);

-- 4. Add subscription_tier to profiles for helper
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';

-- 5. RLS Policies
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own transactions" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own subscription" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own usage" ON public.user_usage
    FOR SELECT USING (auth.uid() = user_id);

-- 6. Trigger to reset usage daily/monthly (simplified, can also be done in backend)
-- For now, we will handle reset logic in the backend on first access of the day/month.
-- Phase 4: Community Features (4.7)

-- 1. Study Groups Table
CREATE TABLE IF NOT EXISTS public.study_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID REFERENCES public.profiles(id) NOT NULL,
    subject_id UUID REFERENCES public.subjects(id),
    name TEXT NOT NULL,
    description TEXT,
    is_private BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Study Group Members
CREATE TABLE IF NOT EXISTS public.study_group_members (
    group_id UUID REFERENCES public.study_groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member', -- 'owner', 'admin', 'member'
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (group_id, user_id)
);

-- 3. Study Group Messages (Group Chat)
CREATE TABLE IF NOT EXISTS public.study_group_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES public.study_groups(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Direct Messages Table
CREATE TABLE IF NOT EXISTS public.direct_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES public.profiles(id) NOT NULL,
    receiver_id UUID REFERENCES public.profiles(id) NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. RLS Policies
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read: study_groups" ON public.study_groups FOR SELECT USING (true);
CREATE POLICY "Auth Create: study_groups" ON public.study_groups FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Members Read: study_group_members" ON public.study_group_members FOR SELECT USING (true);
CREATE POLICY "Auth Join: study_group_members" ON public.study_group_members FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Members Read: study_group_messages" ON public.study_group_messages FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.study_group_members WHERE group_id = study_group_messages.group_id AND user_id = auth.uid()));

CREATE POLICY "Members Send: study_group_messages" ON public.study_group_messages FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.study_group_members WHERE group_id = group_id AND user_id = auth.uid()));

CREATE POLICY "Participant Read: direct_messages" ON public.direct_messages FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Participant Send: direct_messages" ON public.direct_messages FOR INSERT 
WITH CHECK (auth.uid() = sender_id);
-- Phase 4: Video & Resource Schema Updates

-- 1. Add video field to mentor_profiles
ALTER TABLE public.mentor_profiles ADD COLUMN IF NOT EXISTS tutorial_video_url TEXT;

-- 2. Resources Table (4.7)
CREATE TABLE IF NOT EXISTS public.resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    uploader_id UUID REFERENCES public.profiles(id) NOT NULL,
    subject_id UUID REFERENCES public.subjects(id),
    title TEXT NOT NULL,
    description TEXT,
    file_type TEXT NOT NULL, -- 'pdf', 'notes', 'cheat-sheet'
    file_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. RLS for Resources
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read: resources" ON public.resources FOR SELECT USING (true);
CREATE POLICY "Auth Create: resources" ON public.resources FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Owner Delete: resources" ON public.resources FOR DELETE USING (auth.uid() = uploader_id);

-- 4. Helper View for Admin Analytics (Used in Phase 4.6)
CREATE OR REPLACE FUNCTION get_popular_subjects()
RETURNS TABLE (subject_name TEXT, trending_score NUMERIC) AS $$
BEGIN
    RETURN QUERY
    SELECT s.name, (COUNT(d.id) * 1.5 + (SELECT COUNT(*) FROM practice_tests pt WHERE pt.subject_id = s.id))::NUMERIC as score
    FROM public.subjects s
    LEFT JOIN public.doubts d ON d.subject_id = s.id
    GROUP BY s.id, s.name
    ORDER BY score DESC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Ensure profiles table has a role column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student' CHECK (role IN ('student', 'mentor', 'admin'));

CREATE TABLE IF NOT EXISTS mentor_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending','approved','rejected')) DEFAULT 'pending',
  expertise TEXT[] NOT NULL,
  years_experience INT,
  bio TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  sample_work_url TEXT,
  admin_notes TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, status) -- Prevents multiple pending apps, but might be tricky for re-applying after rejection. 
  -- Better to handle logic in API.
);

-- Re-adjusting unique constraint to only prevent multiple pending/approved ones
-- (Users should be able to apply again if rejected)
-- This is easier to do with a conditional index in Postgres
CREATE UNIQUE INDEX IF NOT EXISTS idx_mentor_apps_active ON mentor_applications (user_id) 
WHERE status = 'pending' OR status = 'approved';

ALTER TABLE mentor_applications ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users submit own applications') THEN
        CREATE POLICY "Users submit own applications" ON mentor_applications FOR INSERT WITH CHECK (user_id = auth.uid());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users view own applications') THEN
        CREATE POLICY "Users view own applications" ON mentor_applications FOR SELECT USING (user_id = auth.uid());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins manage all applications') THEN
        CREATE POLICY "Admins manage all applications" ON mentor_applications FOR ALL USING (
          EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
        );
    END IF;
END $$;
-- Phase 5: Sessions Module Migration
-- Run this in your Supabase SQL editor

-- Add Jitsi room name column (deterministic, generated at booking confirmation)
ALTER TABLE mentor_bookings ADD COLUMN IF NOT EXISTS jitsi_room_name TEXT;

-- Add session notes column (saved by mentor/student during/after session)
ALTER TABLE mentor_bookings ADD COLUMN IF NOT EXISTS session_notes TEXT;

-- Add recording URL column (optional post-session recording link)
ALTER TABLE mentor_bookings ADD COLUMN IF NOT EXISTS recording_url TEXT;

-- Add rating and feedback columns if they don't exist yet
ALTER TABLE mentor_bookings ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5);
ALTER TABLE mentor_bookings ADD COLUMN IF NOT EXISTS feedback TEXT;

-- Index on jitsi_room_name for fast lookups
CREATE INDEX IF NOT EXISTS idx_mentor_bookings_jitsi_room ON mentor_bookings(jitsi_room_name);

-- Index for querying sessions by student and status
CREATE INDEX IF NOT EXISTS idx_mentor_bookings_student_status ON mentor_bookings(student_id, status);

-- Index for querying sessions by mentor and status
CREATE INDEX IF NOT EXISTS idx_mentor_bookings_mentor_status ON mentor_bookings(mentor_id, status);

-- Backfill jitsi_room_name for existing confirmed bookings
UPDATE mentor_bookings
SET jitsi_room_name = 'skillbridge-session-' || LEFT(REPLACE(id::text, '-', ''), 16)
WHERE status = 'confirmed' AND jitsi_room_name IS NULL;
-- Indexes for RLS and query performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_doubts_user_id ON doubts(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_doubts_created_at ON doubts(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_doubts_subject_id ON doubts(subject_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reputation_events_user_id ON reputation_events(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mentor_bookings_mentor_id ON mentor_bookings(mentor_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mentor_bookings_user_id ON mentor_bookings(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_practice_attempts_user_id ON practice_attempts(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_id_is_read ON notifications(user_id, is_read);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_answer_votes_answer_id ON answer_votes(answer_id);

-- Leaderboard materialized view (refresh every 5 mins via pg_cron)
CREATE MATERIALIZED VIEW IF NOT EXISTS leaderboard_cache AS
  SELECT
    p.id,
    p.full_name,
    p.avatar_url,
    p.username,
    p.reputation_points,
    RANK() OVER (ORDER BY p.reputation_points DESC) AS rank
  FROM profiles p
  WHERE p.reputation_points > 0
WITH DATA;

CREATE UNIQUE INDEX ON leaderboard_cache(id);

-- Schedule refresh (requires pg_cron extension)
-- SELECT cron.schedule('refresh-leaderboard', '*/5 * * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_cache');
