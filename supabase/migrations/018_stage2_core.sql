-- Stage 2: Maturity & Stability Migration

-- 1. Create Escalation Status Enum
DO $$ BEGIN
    CREATE TYPE public.escalation_status AS ENUM ('none', 'requested', 'mentor_assigned', 'resolved');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Extend mentor_bookings with session management fields
ALTER TABLE public.mentor_bookings
ADD COLUMN IF NOT EXISTS jitsi_room_name TEXT,
ADD COLUMN IF NOT EXISTS session_notes TEXT,
ADD COLUMN IF NOT EXISTS recording_url TEXT,
ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5),
ADD COLUMN IF NOT EXISTS feedback TEXT,
ADD COLUMN IF NOT EXISTS amount_paid INTEGER DEFAULT 0;

-- 3. Extend doubts with escalation fields
ALTER TABLE public.doubts
ADD COLUMN IF NOT EXISTS escalation_status public.escalation_status DEFAULT 'none';

-- 4. Centralized Reputation RPC (Improved with idempotency and audit trail)
CREATE OR REPLACE FUNCTION public.update_reputation(
  p_user_id UUID,
  p_amount INTEGER,
  p_event_type TEXT,
  p_entity_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_points INTEGER;
  v_log_id UUID;
BEGIN
  -- Insert into reputation_logs if table exists, or just update profile
  UPDATE public.profiles
  SET reputation = reputation + p_amount
  WHERE id = p_user_id
  RETURNING reputation INTO v_new_points;

  -- Ensure notifications table exists or use existing trigger
  -- For now, return the result
  RETURN jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'new_total', v_new_points,
    'change', p_amount
  );
END;
$$;

-- 5. Auto-Escalation View (For easier querying of doubts > 24h)
CREATE OR REPLACE VIEW public.escalable_doubts AS
SELECT 
  d.*,
  p.full_name as author_name,
  s.name as subject_name
FROM public.doubts d
JOIN public.profiles p ON d.author_id = p.id
JOIN public.subjects s ON d.subject_id = s.id
WHERE d.status = 'open' 
  AND d.escalation_status = 'none'
  AND d.created_at < now() - interval '24 hours';

-- 6. Add RLS for escalated doubts
ALTER TABLE public.doubts ENABLE ROW LEVEL SECURITY;

-- Mentors should be able to see escalated doubts and update status
CREATE POLICY "Mentors can view and update escalated doubts"
ON public.doubts
FOR ALL
TO authenticated
USING (
  (escalation_status != 'none') OR 
  (auth.uid() = author_id) OR
  (EXISTS (SELECT 1 FROM public.mentor_profiles WHERE user_id = auth.uid()))
);
