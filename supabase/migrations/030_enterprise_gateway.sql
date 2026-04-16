-- Phase 4: Enterprise Gateway & Real-time Notifications
-- 1. Support for unassigned roles and gateway redirection
ALTER TABLE public.profiles 
  ALTER COLUMN role DROP DEFAULT,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- 2. Support for scheduled real-time notifications
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS is_sent BOOLEAN DEFAULT true, -- default true for legacy/immediate notifs
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 3. Ensure organization_interviews is enterprise-ready
-- (Already exists from 017 but let's ensure room_id and status are optimized)
CREATE INDEX IF NOT EXISTS idx_interviews_scheduled ON public.organization_interviews(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON public.organization_interviews(status);

-- 4. Enable Realtime for notifications
-- Check if publication exists first, otherwise create
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION
  WHEN OTHERS THEN
    -- Fallback if publication exists but table not added
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
END $$;
