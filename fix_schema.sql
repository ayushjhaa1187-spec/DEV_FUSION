-- Fix Subscriptions table schema
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS plan TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;

-- Update Mentor Applications table
ALTER TABLE public.mentor_applications ADD COLUMN IF NOT EXISTS work_mode TEXT CHECK (work_mode IN ('independent', 'organization')) DEFAULT 'independent';

-- ─── MENTOR APPLICATIONS SECURITY ───
ALTER TABLE mentor_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own applications" ON mentor_applications;
CREATE POLICY "Users can insert their own applications" 
ON mentor_applications FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own applications" ON mentor_applications;
CREATE POLICY "Users can view their own applications" 
ON mentor_applications FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all applications" ON mentor_applications;
CREATE POLICY "Admins can view all applications" 
ON mentor_applications FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

GRANT ALL ON mentor_applications TO authenticated;
GRANT ALL ON mentor_applications TO service_role;

-- Fix Resource Table performance
CREATE INDEX IF NOT EXISTS idx_resources_uploader ON public.resources(uploader_id);
CREATE INDEX IF NOT EXISTS idx_resources_subject ON public.resources(subject_id);

-- Ensure RLS is correct for mentor applications
DROP POLICY IF EXISTS "Users submit own applications" ON public.mentor_applications;
CREATE POLICY "Users submit own applications" ON public.mentor_applications FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Re-sync schema cache hint
NOTIFY pgrst, 'reload schema';
