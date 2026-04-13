-- Phase 4: Revenue Infrastructure Schema Updates

-- 1. Alter profiles to add subscription & credit tracking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_tier TEXT DEFAULT 'free' CHECK (current_tier IN ('free', 'pro', 'elite'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_ai_credits INTEGER DEFAULT 10;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_id TEXT;

-- 2. Subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) NOT NULL UNIQUE,
    razorpay_subscription_id TEXT NOT NULL UNIQUE,
    plan_id TEXT NOT NULL,
    status TEXT NOT NULL,
    current_start TIMESTAMP WITH TIME ZONE,
    current_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. AI Credit Ledgers
CREATE TABLE IF NOT EXISTS public.ai_credit_ledgers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    amount_change INTEGER NOT NULL,
    reason TEXT NOT NULL,
    reference_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Certificates
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    certificate_type TEXT NOT NULL, -- e.g., 'test_passed', 'mentor_excellence'
    subject_id UUID REFERENCES public.subjects(id),
    score INTEGER,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    verification_hash TEXT UNIQUE NOT NULL
);

-- 5. Billing Invoices
CREATE TABLE IF NOT EXISTS public.billing_invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    razorpay_invoice_id TEXT UNIQUE NOT NULL,
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'INR',
    status TEXT NOT NULL,
    invoice_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Mentor Payouts
CREATE TABLE IF NOT EXISTS public.mentor_payouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mentor_id UUID REFERENCES public.mentor_profiles(id) NOT NULL,
    booking_id UUID REFERENCES public.mentor_bookings(id) NOT NULL UNIQUE,
    amount_total NUMERIC NOT NULL,
    amount_mentor NUMERIC NOT NULL,
    amount_platform NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed')),
    razorpay_payout_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE
);

-- 7. RLS Policies
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Private Read: subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE public.ai_credit_ledgers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Private Read: ai_credit_ledgers" ON public.ai_credit_ledgers FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read: certificates" ON public.certificates FOR SELECT USING (true); -- Public to allow verification
CREATE POLICY "Private Create: certificates" ON public.certificates FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.billing_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Private Read: invoices" ON public.billing_invoices FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE public.mentor_payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mentor Read: mentor_payouts" ON public.mentor_payouts FOR SELECT USING (auth.uid() = mentor_id);
