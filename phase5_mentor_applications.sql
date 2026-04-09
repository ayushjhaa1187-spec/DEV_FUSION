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
