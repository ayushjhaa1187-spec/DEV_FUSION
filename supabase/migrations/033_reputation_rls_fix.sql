-- Migration 033: Platform Stabilization - Reputation & Usage RLS Fix
-- Resolves "Ecosystem Breach" RLS violations and backend 500s.

-- 1. Ensure reputation_history exists and has proper RLS
CREATE TABLE IF NOT EXISTS public.reputation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    points INTEGER DEFAULT 0,
    entity_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    idempotency_key TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.reputation_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own history
DROP POLICY IF EXISTS "Users can view own reputation history" ON public.reputation_history;
CREATE POLICY "Users can view own reputation history" 
ON public.reputation_history FOR SELECT 
USING (auth.uid() = user_id);

-- 2. Ensure usage_daily_log exists and has proper RLS
CREATE TABLE IF NOT EXISTS public.usage_daily_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    count INTEGER DEFAULT 1,
    date DATE DEFAULT CURRENT_DATE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, action, date)
);

ALTER TABLE public.usage_daily_log ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own usage logs
DROP POLICY IF EXISTS "Users can view own usage logs" ON public.usage_daily_log;
CREATE POLICY "Users can view own usage logs" 
ON public.usage_daily_log FOR SELECT 
USING (auth.uid() = user_id);

-- 3. Grant necessary execution permissions to the authenticated role
-- This allows the app code (via Supabase client) to call the RPCs safely.
GRANT EXECUTE ON FUNCTION public.update_reputation(UUID, TEXT, UUID, JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_login_streak(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_daily_usage(UUID, TEXT, DATE) TO authenticated;

-- 4. Audit: Ensure the profiles table RLS doesn't block plan lookups
-- Some components (like CreditPulse) need to read the active user's plan.
DROP POLICY IF EXISTS "Profiles are viewable by owners" ON public.profiles;
CREATE POLICY "Profiles are viewable by owners" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);
