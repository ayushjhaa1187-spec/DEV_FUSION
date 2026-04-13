-- ============================================================
-- SkillBridge — Phase 5 Scaling Infrastructure
-- Organizations, Campus Management, and Mentors
-- ============================================================

-- ── 1. Organizations table ──────────────────────────────────
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  admin_id UUID REFERENCES auth.users(id),
  plan TEXT DEFAULT 'campus_starter',
  is_verified BOOLEAN DEFAULT false,
  logo_url TEXT,
  website TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read own organization" ON organizations FOR SELECT USING (auth.uid() = admin_id);

-- ── 2. Campus Members (Mapping users to organizations) ──────
CREATE TABLE IF NOT EXISTS campus_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'staff', 'admin')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, user_id)
);
ALTER TABLE campus_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own memberships" ON campus_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Org admins read all members" ON campus_members FOR SELECT 
  USING (org_id IN (SELECT id FROM organizations WHERE admin_id = auth.uid()));

-- ── 3. Campus Invitations ────────────────────────────────────
CREATE TABLE IF NOT EXISTS campus_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'student',
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 4. Mentors table (Base table for Independent Mentors) ───
-- Note: profiles already exists, but we need a specific table for mentor stats
CREATE TABLE IF NOT EXISTS mentor_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  specialty TEXT NOT NULL,
  bio TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  availability TEXT DEFAULT 'weekdays',
  is_verified BOOLEAN DEFAULT false,
  hourly_rate INT DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 5.0,
  total_sessions INT DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE mentor_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read verified mentors" ON mentor_profiles FOR SELECT USING (is_verified = true);
CREATE POLICY "Mentors manage own profile" ON mentor_profiles FOR ALL USING (auth.uid() = id);

-- ── 5. Organization Usage Tracking ──────────────────────────
CREATE TABLE IF NOT EXISTS org_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 6. RLS & Functions ───────────────────────────────────────
-- Function to link user to organization via invitation
CREATE OR REPLACE FUNCTION accept_campus_invitation(inv_token TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_org_id UUID;
  v_role TEXT;
  v_email TEXT;
BEGIN
  SELECT org_id, role, email INTO v_org_id, v_role, v_email FROM campus_invitations WHERE token = inv_token AND expires_at > now();
  
  IF v_org_id IS NULL THEN
    RETURN FALSE;
  END IF;

  INSERT INTO campus_members (org_id, user_id, role)
  VALUES (v_org_id, auth.uid(), v_role)
  ON CONFLICT DO NOTHING;

  DELETE FROM campus_invitations WHERE token = inv_token;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
