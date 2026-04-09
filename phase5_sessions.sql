-- Phase 5: Sessions Module Migration
-- Run this in your Supabase SQL editor

-- Add Jitsi room name column (deterministic, generated at booking confirmation)
ALTER TABLE mentor_bookings ADD COLUMN IF NOT EXISTS jitsi_room_name TEXT;

-- Add session notes column (saved by mentor/student during/after session)
ALTER TABLE mentor_bookings ADD COLUMN IF NOT EXISTS session_notes TEXT;

-- Add recording URL column (optional post-session recording link)
ALTER TABLE mentor_bookings ADD COLUMN IF NOT EXISTS recording_url TEXT;

-- Add rating and feedback columns if they don't exist yet
ALTER TABLE mentor_bookings ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5);
ALTER TABLE mentor_bookings ADD COLUMN IF NOT EXISTS feedback TEXT;

-- Index on jitsi_room_name for fast lookups
CREATE INDEX IF NOT EXISTS idx_mentor_bookings_jitsi_room ON mentor_bookings(jitsi_room_name);

-- Index for querying sessions by student and status
CREATE INDEX IF NOT EXISTS idx_mentor_bookings_student_status ON mentor_bookings(student_id, status);

-- Index for querying sessions by mentor and status
CREATE INDEX IF NOT EXISTS idx_mentor_bookings_mentor_status ON mentor_bookings(mentor_id, status);

-- Backfill jitsi_room_name for existing confirmed bookings
UPDATE mentor_bookings
SET jitsi_room_name = 'skillbridge-session-' || LEFT(REPLACE(id::text, '-', ''), 16)
WHERE status = 'confirmed' AND jitsi_room_name IS NULL;
