-- SkillBridge Phase 1 Migration: Required Fixes

-- 1. Update answer_votes to use TEXT for vote_type
DO $$ 
BEGIN
    -- Check if vote_type is integer, if so, we need to convert it or recreate
    -- For safety, we drop and recreate if it's different from the requested spec
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'answer_votes' AND column_name = 'vote_type' AND data_type = 'integer'
    ) THEN
        ALTER TABLE public.answer_votes DROP COLUMN vote_type;
        ALTER TABLE public.answer_votes ADD COLUMN vote_type TEXT CHECK (vote_type IN ('up', 'down'));
    END IF;
END $$;

-- 2. Update doubts table for Rich Text and AI
ALTER TABLE public.doubts 
ADD COLUMN IF NOT EXISTS content_jsonb JSONB,
ADD COLUMN IF NOT EXISTS content_text TEXT,
ADD COLUMN IF NOT EXISTS accepted_answer_id UUID REFERENCES public.answers(id),
ADD COLUMN IF NOT EXISTS ai_attempted BOOLEAN DEFAULT false;

-- 3. Add Reputation trigger for marking answer as accepted
CREATE OR REPLACE FUNCTION handle_answer_accepted_reputation()
RETURNS TRIGGER AS $$
BEGIN
    -- Only when accepted_answer_id is set
    IF NEW.accepted_answer_id IS NOT NULL AND OLD.accepted_answer_id IS NULL THEN
        -- Increase reputation of the answer author
        UPDATE public.profiles
        SET reputation_points = reputation_points + 25
        WHERE id = (SELECT author_id FROM public.answers WHERE id = NEW.accepted_answer_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_doubt_solved ON public.doubts;
CREATE TRIGGER on_doubt_solved
  AFTER UPDATE OF accepted_answer_id ON public.doubts
  FOR EACH ROW EXECUTE FUNCTION handle_answer_accepted_reputation();

-- 4. Mentor application extensions
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_mentor BOOLEAN DEFAULT false;

-- 5. Transactions table for payments
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount INT NOT NULL, -- amount in paise
    currency TEXT DEFAULT 'INR',
    status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    type TEXT CHECK (type IN ('session', 'course', 'tip')),
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,
    entity_id UUID, -- reference to slot_id or course_id
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Storage bucket for images (Doubt images)
-- Note: This is usually done via Supabase dashboard or a separate script
-- But we can add a comment here for reference
-- INSERT INTO storage.buckets (id, name, public) VALUES ('doubt-images', 'doubt-images', true);
