-- ============================================================
-- Migration 007: User System Extensions
-- Adds missing Profile, Privacy, and Preferences fields
-- ============================================================

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS expertise_tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{"showEmail": false, "showCollege": true, "showBranch": true, "showSemester": true, "showSocialLinks": true, "showActivity": true}',
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "push": true, "mentorReminders": true, "answerUpdates": true, "badgeAlerts": true}',
ADD COLUMN IF NOT EXISTS profile_completion_percent INT DEFAULT 0;

-- Function to safely update completion percent over time if desired
CREATE OR REPLACE FUNCTION update_profile_completion(p_user_id UUID, p_percent INT)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles SET profile_completion_percent = p_percent WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
