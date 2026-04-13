-- ============================================================
-- Migration 013: Reputation RPC and Vote Sync
-- Implements core logic for gamification and vote counting
-- ============================================================

-- Function to handle reputation updates
CREATE OR REPLACE FUNCTION public.update_reputation(
  p_user_id UUID,
  p_action  TEXT,
  p_ref_id  UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_points INTEGER := 0;
BEGIN
  -- Determine points based on action
  CASE p_action
    WHEN 'post_doubt'     THEN v_points := 10;
    WHEN 'post_answer'    THEN v_points := 15;
    WHEN 'accept_answer'  THEN v_points := 20;
    WHEN 'vote_up'        THEN v_points := 5;
    ELSE v_points := 0;
  END CASE;

  IF v_points > 0 THEN
    -- Update profile points
    UPDATE public.profiles
    SET reputation_points = COALESCE(reputation_points, 0) + v_points
    WHERE id = p_user_id;

    -- Record in history (assuming reputation_history table exists)
    INSERT INTO public.reputation_history (user_id, action, points, reference_id)
    VALUES (p_user_id, p_action, v_points, p_ref_id)
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$;

-- Function to update answers.votes based on answer_votes records
CREATE OR REPLACE FUNCTION public.sync_answer_votes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- We compute net_votes: count(up) - count(down)
  -- Or just use the summary column 'votes' if it's meant to be total upvotes
  -- Let's stick to net_votes for modern UIs
  
  UPDATE public.answers
  SET votes = (
    SELECT 
      COUNT(*) FILTER (WHERE vote_type = 'up') - 
      COUNT(*) FILTER (WHERE vote_type = 'down')
    FROM public.answer_votes
    WHERE answer_id = COALESCE(NEW.answer_id, OLD.answer_id)
  )
  WHERE id = COALESCE(NEW.answer_id, OLD.answer_id);

  RETURN NULL;
END;
$$;

-- Trigger to keep votes in sync
DROP TRIGGER IF EXISTS trg_sync_answer_votes ON public.answer_votes;
CREATE TRIGGER trg_sync_answer_votes
AFTER INSERT OR UPDATE OR DELETE ON public.answer_votes
FOR EACH ROW EXECUTE FUNCTION public.sync_answer_votes();

-- Ensure reputation_history table exists
CREATE TABLE IF NOT EXISTS public.reputation_history (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action       TEXT NOT NULL,
  points       INTEGER NOT NULL,
  reference_id UUID,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on history
ALTER TABLE public.reputation_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY history_select_own ON public.reputation_history
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
