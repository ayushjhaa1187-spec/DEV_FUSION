-- Migration 021: Dynamic Reputation Filter
-- Adds the ability for organizations to set their own barrier to entry.

ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS min_reputation INTEGER DEFAULT 50 CHECK (min_reputation >= 0);

COMMENT ON COLUMN public.organizations.min_reputation IS 'Minimum reputation points a user must have to apply for membership.';

-- Update the mentor_public_directory view to include min_reputation for complete transparency
DROP VIEW IF EXISTS public.mentor_public_directory;

CREATE OR REPLACE VIEW public.mentor_public_directory AS
SELECT 
  mp.*,
  p.username,
  p.full_name,
  p.avatar_url,
  p.reputation_points,
  ma.status as application_status,
  o.name as organization_name,
  o.logo_url as organization_logo,
  o.min_reputation as organization_min_rep
FROM public.mentor_profiles mp
JOIN public.profiles p ON mp.id = p.id
JOIN public.mentor_applications ma ON mp.id = ma.user_id
LEFT JOIN public.organization_memberships om ON mp.id = om.user_id AND om.status = 'approved'
LEFT JOIN public.organizations o ON om.organization_id = o.id
WHERE ma.status = 'approved';
