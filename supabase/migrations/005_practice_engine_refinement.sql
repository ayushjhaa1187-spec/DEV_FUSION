-- Practice Engine Refinement
-- Adds timer support, real-time counters, and answer tracking

ALTER TABLE public.practice_attempts 
ADD COLUMN IF NOT EXISTS ends_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS total_questions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS correct_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS wrong_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'timed_out'));

-- Table for tracking individual question responses during an attempt
CREATE TABLE IF NOT EXISTS public.practice_answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    attempt_id UUID REFERENCES public.practice_attempts(id) ON DELETE CASCADE NOT NULL,
    question_id UUID REFERENCES public.practice_questions(id) ON DELETE CASCADE NOT NULL,
    selected_index INTEGER, -- 0 to 3 for options A to D
    is_correct BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(attempt_id, question_id)
);

-- RLS for privacy
ALTER TABLE public.practice_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own answers" ON public.practice_answers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.practice_attempts a
            WHERE a.id = attempt_id AND a.user_id = auth.uid()
        )
    );

-- Add a column to store subject_id directly in attempts to make history filtering faster
ALTER TABLE public.practice_attempts ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES public.subjects(id);

-- Trigger to calculate duration based on test if not provided
CREATE OR REPLACE FUNCTION set_attempt_ends_at()
RETURNS TRIGGER AS $$
DECLARE
    v_duration INTEGER;
BEGIN
    SELECT duration_minutes INTO v_duration FROM public.practice_tests WHERE id = NEW.test_id;
    NEW.ends_at := NEW.started_at + (COALESCE(v_duration, 30) * interval '1 minute');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_attempt_started ON public.practice_attempts;
CREATE TRIGGER on_attempt_started
    BEFORE INSERT ON public.practice_attempts
    FOR EACH ROW EXECUTE FUNCTION set_attempt_ends_at();
