-- Migration 020: Stage 2 Final Fixes

-- 1. Create Mentor Ratings table if not exists
CREATE TABLE IF NOT EXISTS public.mentor_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.mentor_bookings(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  review TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(booking_id) -- Only one review per booking
);

-- 2. Add verification column to mentor_profiles (mapping from user's 'mentors' request)
ALTER TABLE public.mentor_profiles 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- 3. Notification Performance Indices
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- 4. Enable Realtime for notifications if not already enabled
-- (This is usually done in the Supabase dashboard but adding here for completeness)
-- Note: This requires superuser or relevant permissions, but we'll try it.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
EXCEPTION
  WHEN undefined_object THEN
    NULL; -- Publication might not exist in local env
END $$;

-- 5. RLS for Ratings
ALTER TABLE public.mentor_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read: Ratings" ON public.mentor_ratings FOR SELECT USING (true);
CREATE POLICY "Students Create Ratings" ON public.mentor_ratings FOR INSERT WITH CHECK (auth.uid() = student_id);

-- 6. Update view for directory to include verification
DROP VIEW IF EXISTS public.mentor_public_directory;
CREATE OR REPLACE VIEW public.mentor_public_directory AS
SELECT 
  mp.*,
  p.username,
  p.full_name,
  p.avatar_url,
  p.reputation_points,
  ma.status as application_status,
  COALESCE((SELECT AVG(rating) FROM public.mentor_ratings WHERE mentor_id = mp.id), 0) as average_rating,
  (SELECT COUNT(*) FROM public.mentor_ratings WHERE mentor_id = mp.id) as review_count
FROM public.mentor_profiles mp
JOIN public.profiles p ON mp.id = p.id
JOIN public.mentor_applications ma ON mp.id = ma.user_id
WHERE ma.status = 'approved';
