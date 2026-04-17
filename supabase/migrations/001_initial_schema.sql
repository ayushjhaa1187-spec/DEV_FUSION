-- ============================================================
-- Migration 001: Initial Schema (aligned with API code)
-- SkillBridge / DEV_FUSION Platform
-- ============================================================

-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student' CHECK (role IN ('student', 'mentor', 'admin'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS college TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS branch TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS semester INT CHECK (semester BETWEEN 1 AND 8);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reputation_points INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS login_streak INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Doubts Table
CREATE TABLE IF NOT EXISTS doubts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
);

ALTER TABLE doubts ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE doubts ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT 'Untitled Doubt';
ALTER TABLE doubts ADD COLUMN IF NOT EXISTS content TEXT NOT NULL DEFAULT '';
ALTER TABLE doubts ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES subjects(id);
ALTER TABLE doubts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'closed'));
ALTER TABLE doubts ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'manual' CHECK (source_type IN ('manual', 'ai_escalated'));
ALTER TABLE doubts ADD COLUMN IF NOT EXISTS answer_count INT DEFAULT 0;
ALTER TABLE doubts ADD COLUMN IF NOT EXISTS votes INT DEFAULT 0;
ALTER TABLE doubts ADD COLUMN IF NOT EXISTS views_count INT DEFAULT 0;
ALTER TABLE doubts ADD COLUMN IF NOT EXISTS academic_context_snapshot JSONB DEFAULT '{}';
ALTER TABLE doubts ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE doubts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE doubts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 4. Answers Table
CREATE TABLE IF NOT EXISTS answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doubt_id UUID REFERENCES doubts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  votes INT DEFAULT 0,
  upvotes_count INT DEFAULT 0,
  downvotes_count INT DEFAULT 0,
  is_accepted BOOLEAN DEFAULT FALSE,
  is_ai_seeded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE doubts ADD COLUMN IF NOT EXISTS accepted_answer_id UUID;
ALTER TABLE doubts ADD CONSTRAINT fk_accepted_answer FOREIGN KEY (accepted_answer_id) REFERENCES answers(id) ON DELETE SET NULL;

-- 5. Answer Votes
CREATE TABLE IF NOT EXISTS answer_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  answer_id UUID REFERENCES answers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  vote_type INT CHECK (vote_type IN (1, -1)),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(answer_id, user_id)
);

-- 6. AI Attempts
CREATE TABLE IF NOT EXISTS ai_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  image_url TEXT,
  subject_hint TEXT,
  ai_response_markdown TEXT,
  ai_response_json JSONB,
  confidence_score INT,
  helpful_feedback BOOLEAN,
  escalated_to_doubt BOOLEAN DEFAULT FALSE,
  doubt_id UUID REFERENCES doubts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Mentor Profiles
CREATE TABLE IF NOT EXISTS mentor_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
);

ALTER TABLE mentor_profiles ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE;
ALTER TABLE mentor_profiles ADD COLUMN IF NOT EXISTS headline TEXT;
ALTER TABLE mentor_profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE mentor_profiles ADD COLUMN IF NOT EXISTS specialty TEXT;
ALTER TABLE mentor_profiles ADD COLUMN IF NOT EXISTS subjects TEXT[];
ALTER TABLE mentor_profiles ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected'));
ALTER TABLE mentor_profiles ADD COLUMN IF NOT EXISTS hourly_rate INT DEFAULT 0;
ALTER TABLE mentor_profiles ADD COLUMN IF NOT EXISTS rating_avg DECIMAL(3,2) DEFAULT 0;
ALTER TABLE mentor_profiles ADD COLUMN IF NOT EXISTS rating_count INT DEFAULT 0;
ALTER TABLE mentor_profiles ADD COLUMN IF NOT EXISTS sessions_completed INT DEFAULT 0;
ALTER TABLE mentor_profiles ADD COLUMN IF NOT EXISTS is_free_session_available BOOLEAN DEFAULT FALSE;
ALTER TABLE mentor_profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 8. Mentor Slots
CREATE TABLE IF NOT EXISTS mentor_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mentor_id UUID REFERENCES mentor_profiles(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'locked', 'booked', 'completed', 'cancelled')),
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES profiles(id),
  mentor_id UUID REFERENCES mentor_profiles(id),
  slot_id UUID REFERENCES mentor_slots(id),
  payment_id TEXT,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  meeting_link TEXT,
  meeting_provider TEXT DEFAULT 'jitsi',
  review_text TEXT,
  review_rating INT CHECK (review_rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Tests
CREATE TABLE IF NOT EXISTS tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id),
  topic TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  question_count INT NOT NULL,
  duration_seconds INT NOT NULL,
  ai_prompt_used TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Test Questions
CREATE TABLE IF NOT EXISTS test_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_option INT NOT NULL,
  explanation TEXT,
  topic TEXT,
  difficulty TEXT
);

-- 12. Test Submissions
CREATE TABLE IF NOT EXISTS test_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,
  score INT NOT NULL,
  max_score INT NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  time_taken_seconds INT NOT NULL,
  weak_topics JSONB DEFAULT '[]',
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Reputation Ledger
CREATE TABLE IF NOT EXISTS reputation_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  points_delta INT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Badges
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  image_url TEXT,
  requirement_type TEXT,
  requirement_value INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- 15. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles viewable" ON profiles;
CREATE POLICY "Public profiles viewable" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users update own profile" ON profiles;
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users insert own profile" ON profiles;
CREATE POLICY "Users insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

ALTER TABLE doubts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Doubts viewable" ON doubts;
CREATE POLICY "Doubts viewable" ON doubts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Auth users create doubts" ON doubts;
CREATE POLICY "Auth users create doubts" ON doubts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Authors update doubts" ON doubts;
CREATE POLICY "Authors update doubts" ON doubts FOR UPDATE USING (auth.uid() = author_id);
DROP POLICY IF EXISTS "Authors delete doubts" ON doubts;
CREATE POLICY "Authors delete doubts" ON doubts FOR DELETE USING (auth.uid() = author_id);

ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Answers viewable" ON answers;
CREATE POLICY "Answers viewable" ON answers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Auth users create answers" ON answers;
CREATE POLICY "Auth users create answers" ON answers FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Authors update answers" ON answers;
CREATE POLICY "Authors update answers" ON answers FOR UPDATE USING (auth.uid() = author_id);

ALTER TABLE answer_votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Votes viewable" ON answer_votes;
CREATE POLICY "Votes viewable" ON answer_votes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Auth users vote" ON answer_votes;
CREATE POLICY "Auth users vote" ON answer_votes FOR INSERT WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE mentor_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Mentor profiles viewable" ON mentor_profiles;
CREATE POLICY "Mentor profiles viewable" ON mentor_profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Mentors update own" ON mentor_profiles;
CREATE POLICY "Mentors update own" ON mentor_profiles FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Auth users apply mentor" ON mentor_profiles;
CREATE POLICY "Auth users apply mentor" ON mentor_profiles FOR INSERT WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE mentor_slots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Slots viewable" ON mentor_slots;
CREATE POLICY "Slots viewable" ON mentor_slots FOR SELECT USING (true);
DROP POLICY IF EXISTS "Mentors manage slots" ON mentor_slots;
CREATE POLICY "Mentors manage slots" ON mentor_slots FOR INSERT WITH CHECK (
  auth.uid() = (SELECT user_id FROM mentor_profiles WHERE id = mentor_id)
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Booking visibility" ON bookings;
CREATE POLICY "Booking visibility" ON bookings FOR SELECT USING (
  auth.uid() = student_id OR
  auth.uid() = (SELECT user_id FROM mentor_profiles WHERE id = mentor_id)
);
DROP POLICY IF EXISTS "Students create bookings" ON bookings;
CREATE POLICY "Students create bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = student_id);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own notifications" ON notifications;
CREATE POLICY "Users view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Insert notifications" ON notifications;
CREATE POLICY "Insert notifications" ON notifications FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users update notifications" ON notifications;
CREATE POLICY "Users update notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Badges viewable" ON badges FOR SELECT USING (true);

-- 17. Indexes
CREATE INDEX IF NOT EXISTS idx_doubts_subject ON doubts(subject_id);
CREATE INDEX IF NOT EXISTS idx_doubts_author ON doubts(author_id);
CREATE INDEX IF NOT EXISTS idx_doubts_created ON doubts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_answers_doubt ON answers(doubt_id);
CREATE INDEX IF NOT EXISTS idx_answers_author ON answers(author_id);
CREATE INDEX IF NOT EXISTS idx_reputation_user ON reputation_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_profiles_reputation ON profiles(reputation_points DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_branch ON profiles(branch);

-- 18. Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, username, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();
