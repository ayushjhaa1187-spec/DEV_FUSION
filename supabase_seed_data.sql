-- SkillBridge Comprehensive Hub Seed Data (Final Hackathon Release)
-- Instructions: 
-- 1. Run this in your Supabase SQL Editor.
-- 2. IMPORTANT: Replace 'JUDGE_USER_ID_HERE' with your real user ID from Supabase Auth logic if tests are needed.
-- 3. If you just want to see the UI populated, run as is (some features dependent on real IDs may show empty).

-- 📜 1. Academic Subjects
INSERT INTO public.subjects (name, code, description) VALUES
('Data Structures & Algorithms', 'DS101', 'Core computer science concepts, big O, and fundamental data structures.'),
('Operating Systems', 'CS302', 'Processes, memory management, and file systems.'),
('Calculus I', 'MA101', 'Limits, derivatives, and integrals.'),
('Intro to Psychology', 'PY110', 'Basic human behavior and mental processes.'),
('Modern World History', 'HS204', 'Global events from the 20th century to present.'),
('Computer Networks', 'CN401', 'TCP/IP, HTTP, routing protocols, and socket programming.')
ON CONFLICT (name) DO NOTHING;

-- 👤 2. Seed a Master Mentor Profile
-- NOTE: In production, IDs are actual UUIDs from auth.users
-- This is a template for judges who want to demo a LIVE booking
/*
INSERT INTO public.profiles (id, username, full_name, role, reputation_points, branch, bio)
VALUES ('JUDGE_USER_ID_HERE', 'academic_expert', 'Dr. Sarah SkillBridge', 'mentor', 550, 'Computer Science', 'Veteran academic mentor with 10+ years in teaching DS & AI.');

INSERT INTO public.mentor_profiles (id, specialty, price_per_session, rating, sessions_completed)
VALUES ('JUDGE_USER_ID_HERE', 'Data Structures & DBMS', 0, 4.95, 127);

INSERT INTO public.mentor_slots (mentor_id, start_time, end_time, is_booked)
VALUES 
('JUDGE_USER_ID_HERE', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day' + INTERVAL '30 minutes', false),
('JUDGE_USER_ID_HERE', NOW() + INTERVAL '1 day' + INTERVAL '1 hour', NOW() + INTERVAL '1 day' + INTERVAL '1 hour 30 minutes', false);
*/

-- 🆘 3. Seed Doubts for the Feed
-- Attempt to use any existing profiles or fallback to a template
INSERT INTO public.doubts (author_id, subject_id, title, content, status)
SELECT 
  p.id,
  (SELECT id FROM public.subjects WHERE name = 'Data Structures & Algorithms' LIMIT 1),
  'Understanding Time Complexity of Heap Sort',
  'Is it possible to achieve O(n) in best case for Heap Sort? I keep getting conflicting answers online.',
  'open'
FROM public.profiles p LIMIT 1;

INSERT INTO public.doubts (author_id, subject_id, title, content, status)
SELECT 
  p.id,
  (SELECT id FROM public.subjects WHERE name = 'Operating Systems' LIMIT 1),
  'Paging vs Segmentation',
  'Can someone provide a real-world analogy to understand the technical difference between paging and segmentation?',
  'open'
FROM public.profiles p LIMIT 1;

-- 💡 4. Seed a Verified Answer
INSERT INTO public.answers (doubt_id, author_id, content, votes, is_accepted)
SELECT 
  d.id,
  p.id,
  'Think of paging as splitting a book into fixed size pages (regardless of content), while segmentation is splitting by chapters (variable size logic).',
  12,
  true
FROM public.doubts d, public.profiles p
WHERE d.title = 'Paging vs Segmentation'
LIMIT 1;

-- 🎖️ 5. Record Initial Reputation for Hero Users
UPDATE public.profiles 
SET reputation_points = 1500 
WHERE role = 'mentor' 
AND username = 'academic_expert';
