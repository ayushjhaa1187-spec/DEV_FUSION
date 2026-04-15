-- ============================================================
-- Migration 026: Final Reputation Cleanup
-- Removes legacy triggers to fully transition to API-driven logic.
-- This prevents double-awarding of reputation points.
-- ============================================================

-- 1. Drop the legacy answer creation trigger (Awards +10)
-- This was defined as 'on_answer_created' in supabase_functions.sql
DROP TRIGGER IF EXISTS on_answer_created ON public.answers;

-- 2. Drop the legacy answer acceptance trigger (Awards +25)
-- This was defined as 'on_answer_accepted_update' in supabase_functions.sql
DROP TRIGGER IF EXISTS on_answer_accepted_update ON public.answers;

-- 3. Verify and drop any other ghost triggers from earlier phases
DROP TRIGGER IF EXISTS on_doubt_created ON public.doubts;

-- NOTE: Reputation is now handled EXCLUSIVELY by the PATCH/POST route handlers
-- using the update_reputation() RPC for maximum control and idempotency.
