-- SkillBridge Phase 1 Migration (Compatibility Update)

-- 1. Extend Mentor Applications table to match the UI/API schema
ALTER TABLE public.mentor_applications 
ADD COLUMN IF NOT EXISTS years_experience INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS github_url TEXT,
ADD COLUMN IF NOT EXISTS sample_work_url TEXT,
ADD COLUMN IF NOT EXISTS availability_type TEXT DEFAULT 'weekdays',
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Check if expertise column exists (supabase_schema had expertise_areas)
-- We will keep expertise_areas and add expertise as an alias/alias if needed, 
-- but better to just ensure expertise exists since API uses it.
ALTER TABLE public.mentor_applications 
ADD COLUMN IF NOT EXISTS expertise TEXT[];

-- 2. Extend Doubts table
ALTER TABLE public.doubts 
ADD COLUMN IF NOT EXISTS content_jsonb JSONB,
ADD COLUMN IF NOT EXISTS content_text TEXT,
ADD COLUMN IF NOT EXISTS accepted_answer_id UUID REFERENCES public.answers(id),
ADD COLUMN IF NOT EXISTS ai_attempted BOOLEAN DEFAULT FALSE;

-- 3. Extend Mentor Profiles
ALTER TABLE public.mentor_profiles
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS availability TEXT DEFAULT 'weekdays',
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS github_url TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

-- 4. Reputation & Notifications Logic

CREATE OR REPLACE FUNCTION public.handle_new_answer()
RETURNS TRIGGER AS $$
BEGIN
    -- Award reputation to answerer (+5)
    UPDATE public.profiles 
    SET reputation_points = reputation_points + 5
    WHERE id = NEW.author_id;

    -- Log reputation event
    INSERT INTO public.reputation_events (user_id, points, event_type, entity_id)
    VALUES (NEW.author_id, 5, 'answer_posted', NEW.id);

    -- Create notification for doubt author
    INSERT INTO public.notifications (user_id, title, message, type, link)
    SELECT 
        author_id, 
        'New Answer Received', 
        'Someone shared their perspective on your doubt.', 
        'answer_posted',
        '/doubts/' || NEW.doubt_id
    FROM public.doubts 
    WHERE id = NEW.doubt_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_accepted_answer()
RETURNS TRIGGER AS $$
BEGIN
    -- Award reputation to answerer (+50)
    IF NEW.accepted_answer_id IS NOT NULL AND (OLD.accepted_answer_id IS NULL OR NEW.accepted_answer_id != OLD.accepted_answer_id) THEN
        -- Award points to answer author
        UPDATE public.profiles p
        SET reputation_points = reputation_points + 50
        FROM public.answers a
        WHERE a.id = NEW.accepted_answer_id AND p.id = a.author_id;

        -- Log reputation event
        INSERT INTO public.reputation_events (user_id, points, event_type, entity_id)
        SELECT author_id, 50, 'answer_accepted', NEW.id
        FROM public.answers WHERE id = NEW.accepted_answer_id;

        -- Notify the answerer
        INSERT INTO public.notifications (user_id, title, message, type, link)
        SELECT 
            author_id, 
            'Answer Accepted!', 
            'Your solution was recognized as the best answer.', 
            'answer_accepted',
            '/doubts/' || NEW.id
        FROM public.answers 
        WHERE id = NEW.accepted_answer_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply Triggers
DROP TRIGGER IF EXISTS on_answer_posted ON public.answers;
CREATE TRIGGER on_answer_posted
    AFTER INSERT ON public.answers
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_answer();

DROP TRIGGER IF EXISTS on_answer_accepted ON public.doubts;
CREATE TRIGGER on_answer_accepted
    AFTER UPDATE ON public.doubts
    FOR EACH ROW EXECUTE FUNCTION public.handle_accepted_answer();

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_doubts_accepted_answer_id ON public.doubts(accepted_answer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_mentor_profiles_verified ON public.mentor_profiles(is_verified);
