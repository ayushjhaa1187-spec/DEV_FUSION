-- Migration 017: Organization System

-- 1. Update Enums
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'organization';

-- 2. Organizations Table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  description TEXT,
  website TEXT,
  is_verified BOOLEAN DEFAULT false,
  owner_id UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Organization Memberships
DO $$ BEGIN
    CREATE TYPE public.membership_status AS ENUM ('pending', 'interviewing', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.organization_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status public.membership_status DEFAULT 'pending' NOT NULL,
  resume_url TEXT,
  introduction TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(organization_id, user_id)
);

-- 4. Organization Interviews
DO $$ BEGIN
    CREATE TYPE public.interview_status AS ENUM ('scheduled', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.organization_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id UUID REFERENCES public.organization_memberships(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status public.interview_status DEFAULT 'scheduled' NOT NULL,
  room_id TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. RLS Policies
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read: organizations" ON public.organizations FOR SELECT USING (true);
CREATE POLICY "Owner Update: organizations" ON public.organizations FOR UPDATE USING (auth.uid() = owner_id);

ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins Read Memberships" ON public.organization_memberships FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.organizations WHERE id = organization_id AND owner_id = auth.uid())
);
CREATE POLICY "Users Read Own Memberships" ON public.organization_memberships FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users Create Memberships" ON public.organization_memberships FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.organization_interviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Access Interviews" ON public.organization_interviews FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.organization_memberships m
    WHERE m.id = membership_id AND (m.user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = m.organization_id AND o.owner_id = auth.uid()))
  )
);

-- 6. Update Views for Branding
CREATE OR REPLACE VIEW public.mentor_public_directory AS
SELECT 
  mp.*,
  p.username,
  p.full_name,
  p.avatar_url,
  p.reputation_points,
  ma.status as application_status,
  o.name as organization_name,
  o.logo_url as organization_logo
FROM public.mentor_profiles mp
JOIN public.profiles p ON mp.id = p.id
JOIN public.mentor_applications ma ON mp.id = ma.user_id
LEFT JOIN public.organization_memberships om ON mp.id = om.user_id AND om.status = 'approved'
LEFT JOIN public.organizations o ON om.organization_id = o.id
WHERE ma.status = 'approved';
