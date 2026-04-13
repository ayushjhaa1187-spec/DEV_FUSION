-- ============================================================
-- SkillBridge — Phase 4 & 5 Database Migrations
-- Run these in order in your Supabase SQL editor.
-- ============================================================

-- ── 1. Subscriptions table ───────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('free','pro','elite','campus_starter','campus_pro','campus_enterprise','coaching','institutional')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','cancelled','past_due','trialing','paused')),
  current_period_start TIMESTAMPTZ DEFAULT now(),
  current_period_end   TIMESTAMPTZ,
  razorpay_subscription_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role manages subscriptions" ON subscriptions FOR ALL USING (auth.role() = 'service_role');

-- ── 2. Credit wallets ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS credit_wallets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INT NOT NULL DEFAULT 0 CHECK (balance >= 0),
  lifetime_purchased INT NOT NULL DEFAULT 0,
  last_topped_up TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE credit_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own wallet" ON credit_wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role manages wallets" ON credit_wallets FOR ALL USING (auth.role() = 'service_role');

-- Trigger: auto-create wallet on user insert (into profiles table)
CREATE OR REPLACE FUNCTION create_credit_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO credit_wallets (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_created_create_wallet ON profiles;
CREATE TRIGGER on_user_created_create_wallet
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_credit_wallet();

-- ── 3. Daily usage log (rate limiting) ──────────────────────
CREATE TABLE IF NOT EXISTS usage_daily_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  date DATE NOT NULL,
  count INT NOT NULL DEFAULT 1,
  UNIQUE(user_id, action, date)
);
ALTER TABLE usage_daily_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages usage" ON usage_daily_log FOR ALL USING (auth.role() = 'service_role');

-- RPC: atomically increment daily usage
CREATE OR REPLACE FUNCTION increment_daily_usage(
  p_user_id UUID,
  p_action TEXT,
  p_date DATE
) RETURNS VOID AS $$
BEGIN
  INSERT INTO usage_daily_log (user_id, action, date, count)
  VALUES (p_user_id, p_action, p_date, 1)
  ON CONFLICT (user_id, action, date)
  DO UPDATE SET count = usage_daily_log.count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 4. Atomic credit consumption RPC ────────────────────────
CREATE OR REPLACE FUNCTION consume_ai_credit(
  p_user_id UUID,
  p_action TEXT
) RETURNS JSONB AS $$
DECLARE
  cost INT;
  current_balance INT;
BEGIN
  cost := CASE p_action
    WHEN 'ai_doubt_solve'      THEN 2
    WHEN 'ai_test_generate'    THEN 5
    WHEN 'ai_coaching_report'  THEN 8
    WHEN 'ai_study_plan'       THEN 15
    ELSE 2
  END;

  SELECT balance INTO current_balance FROM credit_wallets WHERE user_id = p_user_id FOR UPDATE;

  IF current_balance IS NULL THEN
    -- Auto-create wallet if missing
    INSERT INTO credit_wallets (user_id, balance) VALUES (p_user_id, 0);
    RETURN jsonb_build_object('success', false, 'new_balance', 0);
  END IF;

  IF current_balance < cost THEN
    RETURN jsonb_build_object('success', false, 'new_balance', current_balance);
  END IF;

  UPDATE credit_wallets SET balance = balance - cost WHERE user_id = p_user_id;

  RETURN jsonb_build_object('success', true, 'new_balance', current_balance - cost);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: add credits (used by webhook after purchase)
CREATE OR REPLACE FUNCTION add_credits(
  p_user_id UUID,
  p_credits INT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO credit_wallets (user_id, balance, lifetime_purchased)
  VALUES (p_user_id, p_credits, p_credits)
  ON CONFLICT (user_id) DO UPDATE SET
    balance            = credit_wallets.balance + p_credits,
    lifetime_purchased = credit_wallets.lifetime_purchased + p_credits,
    last_topped_up     = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 5. Commission ledger ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS commission_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES mentor_bookings(id) ON DELETE SET NULL,
  mentor_id UUID REFERENCES mentor_profiles(id) ON DELETE SET NULL,
  gross_amount DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(4,3) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL,
  mentor_payout DECIMAL(10,2) NOT NULL,
  mentor_tier TEXT,
  settled BOOLEAN NOT NULL DEFAULT false,
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE commission_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mentors read own ledger" ON commission_ledger FOR SELECT
  USING (mentor_id IN (SELECT id FROM mentor_profiles WHERE id = auth.uid()));
CREATE POLICY "Admins manage ledger" ON commission_ledger FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "Service role manages ledger" ON commission_ledger FOR ALL
  USING (auth.role() = 'service_role');

-- ── 6. Certificates ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  test_result_id UUID,  -- FK added once test_results table confirmed
  subject TEXT NOT NULL,
  cert_type TEXT NOT NULL CHECK (cert_type IN ('subject','domain','mentor_reviewed')),
  score_achieved INT NOT NULL,
  verification_hash TEXT UNIQUE NOT NULL,
  razorpay_payment_id TEXT,
  pdf_url TEXT,
  metadata JSONB DEFAULT '{}',
  issued_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public verification" ON certificates FOR SELECT USING (true);
CREATE POLICY "Users read own certs" ON certificates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role issues certs" ON certificates FOR INSERT USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_certs_hash ON certificates(verification_hash);
CREATE INDEX IF NOT EXISTS idx_certs_user ON certificates(user_id);

-- ── 7. Invoices table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  razorpay_payment_id TEXT UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  plan TEXT,
  description TEXT,
  status TEXT DEFAULT 'paid' CHECK (status IN ('paid','pending','refunded','failed')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own invoices" ON invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role manages invoices" ON invoices FOR ALL USING (auth.role() = 'service_role');

-- ── 8. Razorpay plan mapping ─────────────────────────────────
CREATE TABLE IF NOT EXISTS razorpay_plan_mapping (
  razorpay_plan_id TEXT PRIMARY KEY,
  plan_name TEXT NOT NULL,
  interval TEXT,
  amount INT
);

-- ── 9. Recruitment opt-in flag on profiles table ────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reputation_points INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS login_streak INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS recruitment_opt_in BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student' CHECK (role IN ('student','admin','recruiter', 'organization', 'campus_admin', 'mentor'));

-- ── 10. Update reputation function to include cert_earned ────
CREATE OR REPLACE FUNCTION update_reputation(
  p_user_id UUID,
  p_action TEXT,
  p_ref_id UUID DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  pts INT;
BEGIN
  pts := CASE p_action
    WHEN 'post_doubt'       THEN 5
    WHEN 'answer_upvoted'   THEN 10
    WHEN 'answer_accepted'  THEN 25
    WHEN 'test_passed'      THEN 15
    WHEN 'session_complete' THEN 20
    WHEN 'mentor_rated_5'   THEN 30
    WHEN 'cert_earned'      THEN 20
    WHEN 'daily_login'      THEN 2
    ELSE 0
  END;

  UPDATE profiles SET reputation_points = reputation_points + pts WHERE id = p_user_id;

  -- Log the event (ensure reputation_log exists)
  -- INSERT INTO reputation_log (user_id, points_delta, action_type, reference_id)
  -- VALUES (p_user_id, pts, p_action, p_ref_id);

  -- PERFORM check_badge_unlock(p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 11. Indexes for performance ──────────────────────────────
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_user ON invoices(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commission_settled ON commission_ledger(settled, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_log_user_date ON usage_daily_log(user_id, action, date);

-- ── 12. Phase 5: Institutional Scaling ───────────────────────
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT UNIQUE,
  type TEXT NOT NULL DEFAULT 'college' CHECK (type IN ('college', 'university', 'bootcamp', 'corporate')),
  admin_id UUID REFERENCES auth.users(id),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read organizations" ON organizations FOR SELECT USING (true);
CREATE POLICY "Admins manage own org" ON organizations FOR ALL USING (auth.uid() = admin_id);

CREATE TABLE IF NOT EXISTS campus_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'faculty', 'admin')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, user_id)
);
ALTER TABLE campus_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members see fellow members" ON campus_members FOR SELECT 
  USING (org_id IN (SELECT org_id FROM campus_members WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS campus_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'student',
  invited_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, email)
);
ALTER TABLE campus_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage invitations" ON campus_invitations FOR ALL 
  USING (org_id IN (SELECT id FROM organizations WHERE admin_id = auth.uid()));

-- ── 13. Phase 5: B2B Mentor Infrastructure ────────────────────
CREATE TABLE IF NOT EXISTS mentor_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  specialty TEXT,
  hourly_rate DECIMAL(10,2) DEFAULT 0,
  avg_rating DECIMAL(3,2) DEFAULT 0,
  total_sessions INT DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  bio TEXT,
  availability_json JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE mentor_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are public" ON mentor_profiles FOR SELECT USING (true);
CREATE POLICY "Mentors manage own profile" ON mentor_profiles FOR UPDATE USING (auth.uid() = id);

CREATE TABLE IF NOT EXISTS mentor_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id),
  mentor_id UUID REFERENCES mentor_profiles(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  amount_paid DECIMAL(10,2),
  payment_id TEXT,
  session_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE mentor_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own bookings" ON mentor_bookings FOR SELECT 
  USING (auth.uid() = student_id OR auth.uid() = mentor_id);

CREATE TABLE IF NOT EXISTS mentor_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID REFERENCES mentor_profiles(id),
  amount DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earning', 'withdrawal', 'refund')),
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'cleared', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE mentor_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mentors see own ledger" ON mentor_ledger FOR SELECT USING (auth.uid() = mentor_id);

-- ── 14. Support for Dynamic Dashboards ────────────────────────
CREATE OR REPLACE VIEW user_roles_expanded AS
SELECT 
  p.id,
  p.full_name,
  p.role as global_role,
  m.id IS NOT NULL as is_mentor,
  o.id IS NOT NULL as is_org_admin
FROM profiles p
LEFT JOIN mentor_profiles m ON p.id = m.id
LEFT JOIN organizations o ON p.id = o.admin_id;

