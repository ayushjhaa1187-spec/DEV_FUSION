-- Migration: 040_notifications.sql
-- Description: Create Notifications table and Realtime channels for in-app alerts

-- 1. Create enum for notification types if needed
DO $$ BEGIN
    CREATE TYPE "public"."notification_type" AS ENUM (
        'DOUBT_ANSWERED',
        'SESSION_REMINDER'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 2. Create the notifications table
DROP TABLE IF EXISTS "public"."notifications" CASCADE;
CREATE TABLE IF NOT EXISTS "public"."notifications" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    message TEXT NOT NULL,
    reference_id UUID,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
-- Users can read their own notifications
CREATE POLICY "Users can read own notifications" ON public.notifications
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Ensure only server/postgres can insert notifications (so we don't enable INSERT rules for authenticated)
CREATE POLICY "Service role can insert notifications" ON public.notifications
    FOR INSERT TO service_role
    WITH CHECK (true);

-- 5. Enable Supabase Realtime for notifications table
-- This allows the frontend to subscribe to Postgres changes for this table
alter publication supabase_realtime add table "public"."notifications";
