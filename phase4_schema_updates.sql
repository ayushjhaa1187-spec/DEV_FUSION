-- Phase 4: Video & Resource Schema Updates

-- 1. Add video field to mentor_profiles
ALTER TABLE public.mentor_profiles ADD COLUMN IF NOT EXISTS tutorial_video_url TEXT;

-- 2. Resources Table (4.7)
CREATE TABLE IF NOT EXISTS public.resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    uploader_id UUID REFERENCES public.profiles(id) NOT NULL,
    subject_id UUID REFERENCES public.subjects(id),
    title TEXT NOT NULL,
    description TEXT,
    file_type TEXT NOT NULL, -- 'pdf', 'notes', 'cheat-sheet'
    file_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. RLS for Resources
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read: resources" ON public.resources FOR SELECT USING (true);
CREATE POLICY "Auth Create: resources" ON public.resources FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Owner Delete: resources" ON public.resources FOR DELETE USING (auth.uid() = uploader_id);

-- 4. Helper View for Admin Analytics (Used in Phase 4.6)
CREATE OR REPLACE FUNCTION get_popular_subjects()
RETURNS TABLE (subject_name TEXT, trending_score NUMERIC) AS $$
BEGIN
    RETURN QUERY
    SELECT s.name, (COUNT(d.id) * 1.5 + (SELECT COUNT(*) FROM practice_tests pt WHERE pt.subject_id = s.id))::NUMERIC as score
    FROM public.subjects s
    LEFT JOIN public.doubts d ON d.subject_id = s.id
    GROUP BY s.id, s.name
    ORDER BY score DESC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
