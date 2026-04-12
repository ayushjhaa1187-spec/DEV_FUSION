-- SkillBridge Phase 2 Enhancements
-- 1. Profile Table Updates
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS twitter_url TEXT,
ADD COLUMN IF NOT EXISTS github_url TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS subjects TEXT[] DEFAULT '{}';

-- 2. Follows Table
CREATE TABLE IF NOT EXISTS public.follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CONSTRAINT cannot_follow_self CHECK (follower_id != following_id)
);

-- RLS for follows
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view follows' AND tablename = 'follows') THEN
        CREATE POLICY "Public can view follows" ON public.follows FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can follow others' AND tablename = 'follows') THEN
        CREATE POLICY "Users can follow others" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can unfollow' AND tablename = 'follows') THEN
        CREATE POLICY "Users can unfollow" ON public.follows FOR DELETE USING (auth.uid() = follower_id);
    END IF;
END $$;

-- 3. Mentor Availability Table
CREATE TABLE IF NOT EXISTS public.mentor_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mentor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- RLS for mentor_availability
ALTER TABLE public.mentor_availability ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view availability' AND tablename = 'mentor_availability') THEN
        CREATE POLICY "Public can view availability" ON public.mentor_availability FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Mentors can manage availability' AND tablename = 'mentor_availability') THEN
        CREATE POLICY "Mentors can manage availability" ON public.mentor_availability FOR ALL USING (auth.uid() = mentor_id);
    END IF;
END $$;

-- 4. Trending Doubts View
-- Formula: (votes * 2 + answer_count * 3) / (hours_old + 2)^1.5
CREATE OR REPLACE VIEW trending_doubts AS
SELECT 
    d.*,
    ((d.votes * 2 + d.answer_count * 3)::FLOAT / POWER((EXTRACT(EPOCH FROM (NOW() - d.created_at))/3600 + 2), 1.5)) AS hotness_score
FROM doubts d
ORDER BY hotness_score DESC;

-- 5. Full-Text Search for Doubts
-- Adding a generated column for better performance
ALTER TABLE public.doubts ADD COLUMN IF NOT EXISTS fts tsvector 
GENERATED ALWAYS AS (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))) STORED;

CREATE INDEX IF NOT EXISTS idx_doubts_fts ON public.doubts USING GIN (fts);

-- 6. Trigger for Notifications on Follow
CREATE OR REPLACE FUNCTION notify_on_follow()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notifications (user_id, type, title, body, entity_type, entity_id)
    VALUES (
        NEW.following_id,
        'follow',
        'New Follower',
        (SELECT full_name FROM public.profiles WHERE id = NEW.follower_id) || ' started following you!',
        'profile',
        NEW.follower_id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_on_follow ON public.follows;
CREATE TRIGGER tr_on_follow
    AFTER INSERT ON public.follows
    FOR EACH ROW EXECUTE FUNCTION notify_on_follow();
