-- Phase 5: Production Performance Indexing
-- Optimizes frequent queries for profiles, doubts, and answers.

-- 1. Profiles: Index username for mentions and profile searches
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles (username);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);

-- 2. Doubts: Index author_id and status for feed and profile views
CREATE INDEX IF NOT EXISTS idx_doubts_author_id ON public.doubts (author_id);
CREATE INDEX IF NOT EXISTS idx_doubts_status ON public.doubts (status);
CREATE INDEX IF NOT EXISTS idx_doubts_created_at ON public.doubts (created_at DESC);

-- 3. Answers: Index doubt_id and author_id for thread views and user contributions
CREATE INDEX IF NOT EXISTS idx_answers_doubt_id ON public.answers (doubt_id);
CREATE INDEX IF NOT EXISTS idx_answers_author_id ON public.answers (author_id);
CREATE INDEX IF NOT EXISTS idx_answers_is_accepted ON public.answers (is_accepted) WHERE is_accepted = true;

-- 4. Notifications: Index user_id and is_read for faster inbox loading
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_unread ON public.notifications (user_id) WHERE is_read = false;

-- 5. Analytics: (Optional but recommended if tables grow)
-- We'll skip for now as we are using Vercel Analytics for fast/free metrics.
