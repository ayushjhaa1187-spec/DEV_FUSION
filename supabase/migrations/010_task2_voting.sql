-- ==========================================
-- Task 2: Downvote and Voting System Updates
-- ==========================================

-- 1. Ensure answer_votes has text-based vote_type and proper constraints
DO $$ 
BEGIN
    -- Drop old check constraint if exists
    ALTER TABLE public.answer_votes DROP CONSTRAINT IF EXISTS answer_votes_vote_type_check;
    ALTER TABLE public.answer_votes DROP CONSTRAINT IF EXISTS check_vote_type;

    -- Alter column type if it's still integer
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'answer_votes' AND column_name = 'vote_type' AND data_type = 'integer'
    ) THEN
        -- Temporary conversion
        ALTER TABLE public.answer_votes ALTER COLUMN vote_type TYPE TEXT USING 
            CASE WHEN vote_type = 1 THEN 'up' ELSE 'down' END;
    END IF;

    -- Add the new check constraint
    ALTER TABLE public.answer_votes ADD CONSTRAINT check_vote_type CHECK (vote_type IN ('up', 'down'));

    -- Ensure unique constraint for upsert
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'answer_votes' AND constraint_name = 'uq_user_answer'
    ) THEN
        ALTER TABLE public.answer_votes ADD CONSTRAINT uq_user_answer UNIQUE (user_id, answer_id);
    END IF;
END $$;

-- 2. Update the trigger function to handle string-based votes and UPDATE events
CREATE OR REPLACE FUNCTION handle_answer_vote()
RETURNS TRIGGER AS $$
DECLARE 
    v_author_id UUID;
    v_net_votes INT;
    v_upvotes INT;
    v_downvotes INT;
BEGIN
    -- Get total counts for the answer
    SELECT 
        COUNT(*) FILTER (WHERE vote_type = 'up'),
        COUNT(*) FILTER (WHERE vote_type = 'down')
    INTO v_upvotes, v_downvotes
    FROM public.answer_votes
    WHERE answer_id = COALESCE(NEW.answer_id, OLD.answer_id);

    v_net_votes := v_upvotes - v_downvotes;

    -- Update the answer counts
    UPDATE public.answers 
    SET 
        votes = v_net_votes,
        upvotes_count = v_upvotes,
        downvotes_count = v_downvotes
    WHERE id = COALESCE(NEW.answer_id, OLD.answer_id);

    -- Award reputation for upvotes
    -- Only on new upvotes or change from down to up
    IF (TG_OP = 'INSERT' AND NEW.vote_type = 'up') OR (TG_OP = 'UPDATE' AND NEW.vote_type = 'up' AND OLD.vote_type = 'down') THEN
        SELECT author_id INTO v_author_id FROM public.answers WHERE id = NEW.answer_id;
        IF v_author_id IS NOT NULL AND v_author_id != NEW.user_id THEN
            -- Using award_reputation (version from 002 for simplicity, but maps to points)
            PERFORM award_reputation(v_author_id, 'answer_upvoted', 1, 'answer', NEW.answer_id);
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-bind the trigger to handle UPDATES and DELETES too
DROP TRIGGER IF EXISTS on_answer_vote ON public.answer_votes;
CREATE TRIGGER on_answer_vote 
AFTER INSERT OR UPDATE OR DELETE ON public.answer_votes
FOR EACH ROW EXECUTE FUNCTION handle_answer_vote();

-- 4. Ensure RLS allows users to manage their own votes
ALTER TABLE public.answer_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own votes" ON public.answer_votes;
CREATE POLICY "Users can manage own votes" ON public.answer_votes
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Votes viewable by all" ON public.answer_votes;
CREATE POLICY "Votes viewable by all" ON public.answer_votes
    FOR SELECT USING (true);
