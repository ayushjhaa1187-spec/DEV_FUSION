-- ============================================================
-- Migration 016: Mentor Application Schema Sync
-- Fixes: Missing columns and incorrect RLS policies
-- ============================================================

ALTER TABLE public.mentor_applications
  ADD COLUMN IF NOT EXISTS availability_type TEXT DEFAULT 'weekdays' CHECK (availability_type IN ('weekdays', 'weekends', 'both')),
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS expertise TEXT[],
  ADD COLUMN IF NOT EXISTS github_url TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS years_experience INTEGER,
  ADD COLUMN IF NOT EXISTS sample_work_url TEXT;

-- Enable RLS and set policies
ALTER TABLE public.mentor_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users submit own applications" ON public.mentor_applications;
CREATE POLICY "Users submit own applications" ON public.mentor_applications 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users view own applications" ON public.mentor_applications;
CREATE POLICY "Users view own applications" ON public.mentor_applications 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins manage all applications" ON public.mentor_applications;
CREATE POLICY "Admins manage all applications" ON public.mentor_applications 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
