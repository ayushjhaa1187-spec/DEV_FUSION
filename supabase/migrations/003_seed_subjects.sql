-- ============================================================
-- Migration 003: Seed Data
-- Subjects and badges initial data
-- ============================================================

-- Ensure subjects table has required columns
ALTER TABLE IF EXISTS subjects ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE IF EXISTS subjects ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE IF EXISTS subjects ADD COLUMN IF NOT EXISTS description TEXT;

-- Add unique constraint on slug if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'subjects_slug_key'
  ) THEN
    ALTER TABLE subjects ADD CONSTRAINT subjects_slug_key UNIQUE (slug);
  END IF;
END $$;

-- Ensure badges table has all required columns
-- Production may have requirement_points (NOT NULL) instead of requirement_type/requirement_value
ALTER TABLE IF EXISTS badges ADD COLUMN IF NOT EXISTS requirement_type TEXT;
ALTER TABLE IF EXISTS badges ADD COLUMN IF NOT EXISTS requirement_value INTEGER;
-- Make requirement_points nullable or add default to avoid NOT NULL violation
ALTER TABLE IF EXISTS badges ALTER COLUMN requirement_points SET DEFAULT 0;
DO $$ BEGIN
  BEGIN
    ALTER TABLE badges ALTER COLUMN requirement_points DROP NOT NULL;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- ignore if column doesn't exist
  END;
END $$;

-- Add unique constraint on badges name if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'badges_name_key'
  ) THEN
    ALTER TABLE badges ADD CONSTRAINT badges_name_key UNIQUE (name);
  END IF;
END $$;

-- Seed Subjects
INSERT INTO subjects (id, name, slug, description) VALUES
  (uuid_generate_v4(), 'Data Structures and Algorithms', 'dsa', 'Fundamental data structures and algorithmic problem solving'),
  (uuid_generate_v4(), 'Operating Systems', 'os', 'Process management, memory, file systems'),
  (uuid_generate_v4(), 'Database Management Systems', 'dbms', 'Relational databases, SQL, transactions, normalization'),
  (uuid_generate_v4(), 'Computer Networks', 'cn', 'Networking protocols, OSI model, TCP/IP'),
  (uuid_generate_v4(), 'Machine Learning', 'ml', 'Supervised and unsupervised learning, neural networks'),
  (uuid_generate_v4(), 'Web Development', 'web-dev', 'Frontend and backend web technologies'),
  (uuid_generate_v4(), 'System Design', 'system-design', 'Scalable architecture, distributed systems'),
  (uuid_generate_v4(), 'Computer Architecture', 'coa', 'CPU design, memory hierarchy, instruction sets'),
  (uuid_generate_v4(), 'Theory of Computation', 'toc', 'Automata, formal languages, complexity theory'),
  (uuid_generate_v4(), 'Software Engineering', 'se', 'SDLC, design patterns, agile methodology')
ON CONFLICT DO NOTHING;

-- Seed Badges (compatible with both requirement_points and requirement_type/requirement_value schemas)
INSERT INTO badges (name, description, icon, requirement_type, requirement_value)
SELECT name, description, icon, requirement_type, requirement_value
FROM (VALUES
  ('First Answer', 'Submitted your first answer', '🎯', 'answers_count', 1),
  ('Helpful', 'Had 5 answers accepted', '⭐', 'accepted_answers', 5),
  ('Expert', 'Had 25 answers accepted', '🏆', 'accepted_answers', 25),
  ('Questioner', 'Posted 10 doubts', '❓', 'doubts_count', 10),
  ('Rising Star', 'Earned 100 reputation points', '🌟', 'reputation_points', 100),
  ('Scholar', 'Earned 500 reputation points', '📚', 'reputation_points', 500),
  ('Legend', 'Earned 1000 reputation points', '🔥', 'reputation_points', 1000),
  ('Consistent', 'Maintained a 7-day login streak', '📅', 'login_streak', 7)
) AS v(name, description, icon, requirement_type, requirement_value)
WHERE NOT EXISTS (SELECT 1 FROM badges b WHERE b.name = v.name);

-- Sync requirement_points from requirement_value if both exist
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'badges' AND column_name = 'requirement_points'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'badges' AND column_name = 'requirement_value'
  ) THEN
    UPDATE badges SET requirement_points = requirement_value
    WHERE requirement_points IS NULL AND requirement_value IS NOT NULL;
  END IF;
END $$;
