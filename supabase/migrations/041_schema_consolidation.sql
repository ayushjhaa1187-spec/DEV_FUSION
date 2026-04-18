-- Migration 041: Schema Consolidation & Revenue Alignment
-- Resolves table fragmentation, adds missing revenue features, enforces FK integrity.
-- WARNING: This migration drops redundant tables. Ensure no critical data exists before running.

-- ============================================================================
-- STEP 1: Add missing columns to `bookings` before dropping `mentor_bookings`
-- ============================================================================

-- Add columns that only existed on mentor_bookings
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS jitsi_room_name TEXT,
ADD COLUMN IF NOT EXISTS transaction_id UUID;

-- Transaction FK for billing separation of concerns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'bookings_transaction_id_fkey'
  ) THEN
    ALTER TABLE public.bookings
    ADD CONSTRAINT bookings_transaction_id_fkey
    FOREIGN KEY (transaction_id) REFERENCES public.transactions(id);
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Rewire commission_ledger FK from mentor_bookings → bookings
-- ============================================================================

-- Drop the old FK
ALTER TABLE public.commission_ledger
DROP CONSTRAINT IF EXISTS commission_ledger_booking_id_fkey;

-- Add the new FK pointing to bookings
ALTER TABLE public.commission_ledger
ADD CONSTRAINT commission_ledger_booking_id_fkey
FOREIGN KEY (booking_id) REFERENCES public.bookings(id);

-- ============================================================================
-- STEP 3: Drop redundant booking table
-- ============================================================================

DROP TABLE IF EXISTS public.mentor_bookings CASCADE;

-- ============================================================================
-- STEP 4: Drop redundant test tables (keep global_tests ecosystem)
-- ============================================================================

-- Drop the oldest test ecosystem (tests → test_questions → test_submissions)
DROP TABLE IF EXISTS public.test_submissions CASCADE;
DROP TABLE IF EXISTS public.test_questions CASCADE;
DROP TABLE IF EXISTS public.tests CASCADE;

-- Drop the intermediate test ecosystem (practice_tests → practice_questions → practice_attempts)
-- practice_answers may exist as a runtime table from save-answer route
DROP TABLE IF EXISTS public.practice_answers CASCADE;
DROP TABLE IF EXISTS public.practice_attempts CASCADE;
DROP TABLE IF EXISTS public.practice_questions CASCADE;
DROP TABLE IF EXISTS public.practice_tests CASCADE;

-- Drop leftover debug table
DROP TABLE IF EXISTS public.test_table CASCADE;

-- ============================================================================
-- STEP 5: Drop redundant reputation tables (keep reputation_history)
-- ============================================================================

DROP TABLE IF EXISTS public.reputation_events CASCADE;
DROP TABLE IF EXISTS public.reputation_ledger CASCADE;

-- ============================================================================
-- STEP 6: Drop redundant availability table (keep availability_rules)
-- ============================================================================

DROP TABLE IF EXISTS public.mentor_availability CASCADE;

-- ============================================================================
-- STEP 7: Add missing mentor_tier column to mentor_profiles
-- ============================================================================

ALTER TABLE public.mentor_profiles
ADD COLUMN IF NOT EXISTS mentor_tier TEXT DEFAULT 'starter'
CHECK (mentor_tier IN ('starter', 'trusted', 'expert', 'elite'));

-- ============================================================================
-- STEP 8: Add next_refill_date to credit_wallets for CRON reliability
-- ============================================================================

ALTER TABLE public.credit_wallets
ADD COLUMN IF NOT EXISTS next_refill_date DATE;

-- ============================================================================
-- STEP 9: Add FK constraint on certificates.test_result_id → test_attempts.id
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'certificates_test_result_id_fkey'
  ) THEN
    ALTER TABLE public.certificates
    ADD CONSTRAINT certificates_test_result_id_fkey
    FOREIGN KEY (test_result_id) REFERENCES public.test_attempts(id);
  END IF;
END $$;

-- ============================================================================
-- STEP 10: Create institutional_accounts table (Revenue Stream 4 — B2B)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.institutional_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_name TEXT NOT NULL,
    contact_email TEXT,
    plan TEXT NOT NULL CHECK (plan IN (
        'campus_starter', 'campus_pro', 'campus_enterprise',
        'coaching', 'api'
    )),
    student_cap INTEGER,
    contract_start DATE,
    contract_end DATE,
    annual_value NUMERIC(12,2),
    custom_domain TEXT,
    org_id UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT institutional_accounts_org_id_fkey
    FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);

-- RLS for institutional_accounts
ALTER TABLE public.institutional_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage institutional accounts"
ON public.institutional_accounts FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Public can view institutional accounts"
ON public.institutional_accounts FOR SELECT
USING (true);

-- ============================================================================
-- STEP 11: Ensure RLS is correctly configured on all surviving tables
-- ============================================================================

-- Bookings RLS (ensure policies exist for the unified table)
DO $$
BEGIN
  -- Only create if policy doesn't already exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'bookings' AND policyname = 'Users can view own bookings'
  ) THEN
    CREATE POLICY "Users can view own bookings"
    ON public.bookings FOR SELECT
    USING (auth.uid() = student_id OR auth.uid() = mentor_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'bookings' AND policyname = 'Users can insert own bookings'
  ) THEN
    CREATE POLICY "Users can insert own bookings"
    ON public.bookings FOR INSERT
    WITH CHECK (auth.uid() = student_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'bookings' AND policyname = 'Users can update own bookings'
  ) THEN
    CREATE POLICY "Users can update own bookings"
    ON public.bookings FOR UPDATE
    USING (auth.uid() = student_id OR auth.uid() = mentor_id);
  END IF;
END $$;

-- Reputation history RLS (canonical reputation table)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'reputation_history' AND policyname = 'Users can view own reputation'
  ) THEN
    CREATE POLICY "Users can view own reputation"
    ON public.reputation_history FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================================================
-- STEP 12: Create helpful indexes on the consolidated schema
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_bookings_student_id ON public.bookings(student_id);
CREATE INDEX IF NOT EXISTS idx_bookings_mentor_id ON public.bookings(mentor_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_reputation_history_user_id ON public.reputation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_user_id ON public.test_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_institutional_accounts_org ON public.institutional_accounts(org_id);
