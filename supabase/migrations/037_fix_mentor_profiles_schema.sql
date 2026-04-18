-- Migration 037: Reconcile mentor_profiles schema and normalize visibility
-- This script ensures all columns from both legacy (001) and phase5 schemas exist
-- and consolidates RLS policies for consistent mentor visibility.

-- 1. Ensure all columns exist on mentor_profiles
DO $$ 
BEGIN
    -- status columns
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'mentor_profiles' AND COLUMN_NAME = 'is_verified') THEN
        ALTER TABLE mentor_profiles ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'mentor_profiles' AND COLUMN_NAME = 'verification_status') THEN
        ALTER TABLE mentor_profiles ADD COLUMN verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected'));
    END IF;

    -- pricing columns
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'mentor_profiles' AND COLUMN_NAME = 'price_per_session') THEN
        ALTER TABLE mentor_profiles ADD COLUMN price_per_session INT DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'mentor_profiles' AND COLUMN_NAME = 'hourly_rate') THEN
        ALTER TABLE mentor_profiles ADD COLUMN hourly_rate INT DEFAULT 0;
    END IF;

    -- rating columns
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'mentor_profiles' AND COLUMN_NAME = 'rating') THEN
        ALTER TABLE mentor_profiles ADD COLUMN rating DECIMAL(3,2) DEFAULT 5.0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'mentor_profiles' AND COLUMN_NAME = 'rating_avg') THEN
        ALTER TABLE mentor_profiles ADD COLUMN rating_avg DECIMAL(3,2) DEFAULT 5.0;
    END IF;

    -- content columns
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'mentor_profiles' AND COLUMN_NAME = 'skills') THEN
        ALTER TABLE mentor_profiles ADD COLUMN skills TEXT[] DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'mentor_profiles' AND COLUMN_NAME = 'subjects') THEN
        ALTER TABLE mentor_profiles ADD COLUMN subjects TEXT[] DEFAULT '{}';
    END IF;

    -- metadata
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'mentor_profiles' AND COLUMN_NAME = 'updated_at') THEN
        ALTER TABLE mentor_profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 2. Data Synchronization (One-time)
UPDATE mentor_profiles 
SET 
  is_verified = (verification_status = 'approved') 
WHERE verification_status IS NOT NULL AND is_verified IS NULL;

UPDATE mentor_profiles 
SET 
  verification_status = CASE WHEN is_verified = TRUE THEN 'approved' ELSE 'pending' END
WHERE verification_status IS NULL AND is_verified IS NOT NULL;

UPDATE mentor_profiles
SET price_per_session = hourly_rate
WHERE price_per_session = 0 AND hourly_rate > 0;

UPDATE mentor_profiles
SET hourly_rate = price_per_session
WHERE hourly_rate = 0 AND price_per_session > 0;

-- 3. Consolidate RLS Policies
-- Drop existing public read policies to avoid duplicates/conflicts
DROP POLICY IF EXISTS "Public read verified mentors" ON mentor_profiles;
DROP POLICY IF EXISTS "Anyone can view approved mentors" ON mentor_profiles;
DROP POLICY IF EXISTS "mentor_profiles_read_policy" ON mentor_profiles;
DROP POLICY IF EXISTS "Public read approved mentors" ON mentor_profiles; 

-- Create unified public read policy
CREATE POLICY "Public read approved mentors" 
ON mentor_profiles FOR SELECT 
USING (
  is_verified = TRUE 
  OR verification_status = 'approved'
);

-- Ensure authenticated users can also read (standard practice)
DROP POLICY IF EXISTS "Mentors manage own profile" ON mentor_profiles;
CREATE POLICY "Mentors manage own profile" 
ON mentor_profiles FOR ALL 
USING (auth.uid() = id OR auth.uid() = user_id)
WITH CHECK (auth.uid() = id OR auth.uid() = user_id);

-- 4. Enable RLS if not enabled
ALTER TABLE mentor_profiles ENABLE ROW LEVEL SECURITY;
