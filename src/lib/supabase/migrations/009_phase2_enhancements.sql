-- Phase 2: Community & Mentorship Enhancements

-- 1. Add new columns to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subjects jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS availability jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS github_url text,
ADD COLUMN IF NOT EXISTS linkedin_url text,
ADD COLUMN IF NOT EXISTS twitter_url text,
ADD COLUMN IF NOT EXISTS website_url text;

-- 2. Create follows table
CREATE TABLE IF NOT EXISTS follows (
  follower_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (follower_id, following_id)
);

-- 3. RLS for follows
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can see follows" 
ON follows FOR SELECT 
USING (true);

CREATE POLICY "Users can follow others" 
ON follows FOR INSERT 
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow" 
ON follows FOR DELETE 
USING (auth.uid() = follower_id);

-- 4. Gravity Index for Trending (Optional helper function)
-- This logic is handled in the API for now, but can be materialized if needed.
