-- ============================================================
-- Migration 003: Seed Data
-- Subjects and badges initial data
-- ============================================================

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
ON CONFLICT (slug) DO NOTHING;

-- Seed Badges
INSERT INTO badges (name, description, icon, requirement_type, requirement_value) VALUES
  ('First Answer', 'Submitted your first answer', '🎯', 'answers_count', 1),
  ('Helpful', 'Had 5 answers accepted', '⭐', 'accepted_answers', 5),
  ('Expert', 'Had 25 answers accepted', '🏆', 'accepted_answers', 25),
  ('Questioner', 'Posted 10 doubts', '❓', 'doubts_count', 10),
  ('Rising Star', 'Earned 100 reputation points', '🌟', 'reputation_points', 100),
  ('Scholar', 'Earned 500 reputation points', '📚', 'reputation_points', 500),
  ('Legend', 'Earned 1000 reputation points', '🔥', 'reputation_points', 1000),
  ('Consistent', 'Maintained a 7-day login streak', '📅', 'login_streak', 7)
ON CONFLICT (name) DO NOTHING;
