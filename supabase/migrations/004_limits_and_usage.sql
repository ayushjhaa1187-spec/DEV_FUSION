-- ============================================================
-- Migration 004: Limits and Usage Tracking Tables
-- SkillBridge / DEV_FUSION Platform
-- ============================================================

-- 1. Rate Limit Windows Table
-- Implements a sliding-window rate limiter
CREATE TABLE IF NOT EXISTS rate_limit_windows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  request_count INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast sliding-window queries
CREATE INDEX IF NOT EXISTS idx_rate_limit_user_action_time ON rate_limit_windows(user_id, action, window_start);

-- 2. User Usage Table
-- Tracks daily/monthly AI and feature usage
CREATE TABLE IF NOT EXISTS user_usage (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  interviews_this_month INT DEFAULT 0,
  questions_today INT DEFAULT 0,
  last_reset_interviews DATE DEFAULT CURRENT_DATE,
  last_reset_questions DATE DEFAULT CURRENT_DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS Policies

-- Rate Limit Windows: Users can see their own windows, but only service-role/backend should really insert/delete.
-- However, for the app to work with client-side supabase calls if needed, we allow authenticated users.
ALTER TABLE rate_limit_windows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own rate limits" ON rate_limit_windows FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service can manage rate limits" ON rate_limit_windows FOR ALL USING (true); -- Usually restricted to service_role in dashboard

-- User Usage: Users can view their own usage
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own usage" ON user_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service can manage usage" ON user_usage FOR ALL USING (true);
