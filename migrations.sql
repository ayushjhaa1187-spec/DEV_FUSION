-- [1] Add suspension support to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;

-- [2] Create saved_doubts table for bookmarking
CREATE TABLE IF NOT EXISTS saved_doubts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    doubt_id UUID REFERENCES doubts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, doubt_id)
);

-- Enable RLS for saved_doubts
ALTER TABLE saved_doubts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own saved doubts" 
ON saved_doubts FOR ALL 
USING (auth.uid() = user_id);

-- [3] Ensure mentor_bookings consistency for Jitsi/Meeting integration
ALTER TABLE mentor_bookings ADD COLUMN IF NOT EXISTS jitsi_room_name TEXT;

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_saved_doubts_user ON saved_doubts(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
