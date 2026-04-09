-- Phase 3: Payment & Subscription Schema Updates

-- Types for Payments
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_type') THEN
        CREATE TYPE public.payment_type AS ENUM ('subscription', 'session');
    END IF;
END $$;

-- 1. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    amount INTEGER NOT NULL, -- in paise
    currency TEXT DEFAULT 'INR' NOT NULL,
    status public.payment_status DEFAULT 'pending' NOT NULL,
    type public.payment_type NOT NULL,
    razorpay_order_id TEXT UNIQUE,
    razorpay_payment_id TEXT UNIQUE,
    razorpay_signature TEXT,
    entity_id UUID, -- Could be slot_id for sessions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Subscriptions Table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    user_id UUID REFERENCES public.profiles(id) PRIMARY KEY,
    tier TEXT DEFAULT 'free' NOT NULL, -- 'free', 'pro'
    start_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. User Usage Tracking
CREATE TABLE IF NOT EXISTS public.user_usage (
    user_id UUID REFERENCES public.profiles(id) PRIMARY KEY,
    interviews_this_month INTEGER DEFAULT 0 NOT NULL,
    questions_today INTEGER DEFAULT 0 NOT NULL,
    last_reset_interviews DATE DEFAULT CURRENT_DATE NOT NULL,
    last_reset_questions DATE DEFAULT CURRENT_DATE NOT NULL
);

-- 4. Add subscription_tier to profiles for helper
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';

-- 5. RLS Policies
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own transactions" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own subscription" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own usage" ON public.user_usage
    FOR SELECT USING (auth.uid() = user_id);

-- 6. Trigger to reset usage daily/monthly (simplified, can also be done in backend)
-- For now, we will handle reset logic in the backend on first access of the day/month.
