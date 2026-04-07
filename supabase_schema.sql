-- SkillBridge Comprehensive Backend Schema (Phase 1 Refactoring)

-- 1. Enums
CREATE TYPE public.user_role AS ENUM ('student', 'mentor', 'admin');
CREATE TYPE public.doubt_status AS ENUM ('open', 'answered', 'resolved', 'archived');
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'refunded');
CREATE TYPE public.notification_type AS ENUM ('answer_received', 'answer_accepted', 'session_reminder', 'reputation_gain', 'badge_earned');
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
  semester INTEGER,
  bio TEXT,
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
