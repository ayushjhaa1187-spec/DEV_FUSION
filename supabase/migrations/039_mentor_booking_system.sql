-- Migration 039: Mentor Booking & Payment System

-- 1. Mentor Profiles Additions
ALTER TABLE public.mentor_profiles 
ADD COLUMN IF NOT EXISTS session_fee INTEGER DEFAULT 0 CHECK (session_fee >= 0 AND session_fee <= 500),
ADD COLUMN IF NOT EXISTS default_meeting_link TEXT;

-- 2. Availability Rules Table
CREATE TABLE IF NOT EXISTS public.availability_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mentor_id UUID NOT NULL REFERENCES public.mentor_profiles(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- RLS for Availability Rules
ALTER TABLE public.availability_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Availability rules are viewable by everyone" 
ON public.availability_rules FOR SELECT 
USING (true);

CREATE POLICY "Mentors can manage their own availability" 
ON public.availability_rules FOR ALL 
USING (auth.uid() = mentor_id);

-- 3. Bookings Table Updates (Adding explicit timestamps & amount tracking)
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS start_timestamp TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS end_timestamp TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS amount_paid INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'COMPLETED', 'FAILED', 'FREE', 'CANCELLED'));

-- In the new system, slot_id is optional and meeting_provider is likely dynamic or default
ALTER TABLE public.bookings ALTER COLUMN slot_id DROP NOT NULL;

-- 4. Sync existing price_per_session data into session_fee for backwards compatibility if needed
UPDATE public.mentor_profiles 
SET session_fee = COALESCE(price_per_session, 0)
WHERE session_fee IS NULL;
