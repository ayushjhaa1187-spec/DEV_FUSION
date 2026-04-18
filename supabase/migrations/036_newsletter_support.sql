-- Migration 036: Newsletter Support & Community Pulse
-- Adds subscription flag for the weekly summary engine

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS newsletter_subscribed BOOLEAN DEFAULT TRUE;

-- Ensure RLS allows users to manage their own subscription
DROP POLICY IF EXISTS "Users can update own subscription" ON public.profiles;
CREATE POLICY "Users can update own subscription" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create a view for public community pulse (anonymized/public data)
-- This allows the landing page to fetch recent "Solved" activity safely
CREATE OR REPLACE VIEW public.community_pulse AS
SELECT 
  p.username,
  d.title as doubt_title,
  d.updated_at as resolved_at
FROM public.doubts d
JOIN public.profiles p ON d.author_id = p.id
WHERE d.status = 'resolved'
ORDER BY d.updated_at DESC
LIMIT 10;

GRANT SELECT ON public.community_pulse TO anon, authenticated;
