-- ============================================================
-- Migration 015: Security Hardening & RLS Implementation
-- SkillBridge / DEV_FUSION Platform
-- Aligns with 014_gamification_overhaul.sql function signatures
-- ============================================================

BEGIN;

-- ============================================================
-- 1. Harden Functions (Set search_path to prevent search_path injection)
-- NOTE: Signatures must exactly match the CREATE OR REPLACE in prior migrations.
-- update_reputation and update_login_streak signatures from 014_gamification_overhaul.sql
-- sync_answer_votes and handle_new_user from schemas in 002/007.
-- ============================================================

-- From 014_gamification_overhaul.sql
ALTER FUNCTION public.update_reputation(
  UUID, TEXT, UUID, JSONB, TEXT
) SET search_path = public;

ALTER FUNCTION public.update_login_streak(UUID)
  SET search_path = public;

-- From 013_reputation_and_vote_sync.sql (older overload — 3-arg version)
-- This is a different overload; use a DO block to safely skip if not present
DO $$
BEGIN
  -- Attempt to harden the 3-arg overload from migration 013 if it still exists
  BEGIN
    ALTER FUNCTION public.update_reputation(UUID, TEXT, UUID) SET search_path = public;
  EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'update_reputation(UUID, TEXT, UUID) not found — skipped.';
  END;
END $$;

-- From 002_reputation_functions.sql
ALTER FUNCTION public.sync_answer_votes() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.award_reputation(UUID, TEXT, INT, TEXT, UUID, JSONB) SET search_path = public;
ALTER FUNCTION public.handle_accepted_answer() SET search_path = public;
ALTER FUNCTION public.handle_new_answer() SET search_path = public;
ALTER FUNCTION public.check_and_award_badges(UUID) SET search_path = public;
ALTER FUNCTION public.after_reputation_award() SET search_path = public;
ALTER FUNCTION public.increment_view_count(UUID) SET search_path = public;


-- ============================================================
-- 2. Harden Views (SECURITY INVOKER — respects RLS of the querying user)
-- ============================================================
ALTER VIEW public.trending_doubts SET (security_invoker = on);

DO $$
BEGIN
  -- test_leaderboard may or may not exist
  BEGIN
    ALTER VIEW public.test_leaderboard SET (security_invoker = on);
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'View test_leaderboard not found — skipped.';
  END;
END $$;


-- ============================================================
-- 3. Enable RLS on all sensitive tables (idempotent)
-- ============================================================
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reputation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_answers  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges       ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 4. RLS Policies — Profiles
-- ============================================================
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);


-- ============================================================
-- 5. RLS Policies — Mentor Profiles
-- ============================================================
DROP POLICY IF EXISTS "Mentor profiles are viewable by everyone" ON public.mentor_profiles;
CREATE POLICY "Mentor profiles are viewable by everyone"
  ON public.mentor_profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Mentors can update own profile" ON public.mentor_profiles;
CREATE POLICY "Mentors can update own profile"
  ON public.mentor_profiles FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Mentors can insert own profile" ON public.mentor_profiles;
CREATE POLICY "Mentors can insert own profile"
  ON public.mentor_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- 6. RLS Policies — Bookings
-- A student sees their own bookings; a mentor sees bookings for their slot.
-- ============================================================
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
CREATE POLICY "Users can view own bookings"
  ON public.bookings FOR SELECT USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT user_id FROM public.mentor_profiles WHERE id = mentor_id
    )
  );

DROP POLICY IF EXISTS "Users can insert own bookings" ON public.bookings;
CREATE POLICY "Users can insert own bookings"
  ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
CREATE POLICY "Users can update own bookings"
  ON public.bookings FOR UPDATE USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT user_id FROM public.mentor_profiles WHERE id = mentor_id
    )
  );


-- ============================================================
-- 7. RLS Policies — Reputation History
-- ============================================================
-- Drop older policies that may conflict (from migration 013)
DROP POLICY IF EXISTS "history_select_own" ON public.reputation_history;
DROP POLICY IF EXISTS "Users can view own reputation" ON public.reputation_history;

CREATE POLICY "Users can view own reputation"
  ON public.reputation_history FOR SELECT USING (auth.uid() = user_id);

-- Allow SECURITY DEFINER functions (update_reputation) to insert — via service role
DROP POLICY IF EXISTS "Service can insert reputation" ON public.reputation_history;
CREATE POLICY "Service can insert reputation"
  ON public.reputation_history FOR INSERT WITH CHECK (true);


-- ============================================================
-- 8. RLS Policies — Practice Attempts
-- ============================================================
DROP POLICY IF EXISTS "Users can view own attempts" ON public.practice_attempts;
DROP POLICY IF EXISTS "Users can manage own attempts" ON public.practice_attempts;

CREATE POLICY "Users can view own attempts"
  ON public.practice_attempts FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attempts"
  ON public.practice_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own attempts"
  ON public.practice_attempts FOR UPDATE USING (auth.uid() = user_id);


-- ============================================================
-- 9. RLS Policies — Practice Answers
-- ============================================================
DROP POLICY IF EXISTS "Users can view own answers" ON public.practice_answers;
DROP POLICY IF EXISTS "Users can manage own answers" ON public.practice_answers;

CREATE POLICY "Users can view own answers"
  ON public.practice_answers FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.practice_attempts
      WHERE id = attempt_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own answers"
  ON public.practice_answers FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.practice_attempts
      WHERE id = attempt_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own answers"
  ON public.practice_answers FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.practice_attempts
      WHERE id = attempt_id AND user_id = auth.uid()
    )
  );


-- ============================================================
-- 10. RLS Policies — Badges & User Badges
-- ============================================================
DROP POLICY IF EXISTS "Badges are viewable by everyone" ON public.badges;
CREATE POLICY "Badges are viewable by everyone"
  ON public.badges FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view own badges" ON public.user_badges;
DROP POLICY IF EXISTS "Badges publicly viewable" ON public.user_badges;
DROP POLICY IF EXISTS "Service award badges" ON public.user_badges;

CREATE POLICY "User badges are viewable by everyone"
  ON public.user_badges FOR SELECT USING (true);

CREATE POLICY "Service can award badges"
  ON public.user_badges FOR INSERT WITH CHECK (true);

COMMIT;
