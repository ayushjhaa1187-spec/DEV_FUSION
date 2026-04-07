-- SkillBridge Reputation & Notification Functions (Phase 1 Refactoring)

-- 1. Helper to record reputation events and update profile totals
CREATE OR REPLACE FUNCTION award_points(u_id UUID, p_count INTEGER, e_type TEXT, ent_id UUID DEFAULT NULL, i_key TEXT DEFAULT NULL)
RETURNS void AS $$
BEGIN
  -- Insert into ledger (idempotency checked by unique constraint on i_key)
  INSERT INTO public.reputation_events (user_id, points, event_type, entity_id, idempotency_key)
  VALUES (u_id, p_count, e_type, ent_id, i_key)
  ON CONFLICT (idempotency_key) DO NOTHING;

  -- Update profile if insert was successful
  IF FOUND THEN
    UPDATE public.profiles
    SET reputation_points = reputation_points + p_count,
        updated_at = timezone('utc'::text, now())
    WHERE id = u_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger for New Answer (+10 points)
CREATE OR REPLACE FUNCTION handle_new_answer_points()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM award_points(
    NEW.author_id, 
    10, 
    'answer_posted', 
    NEW.doubt_id, 
    'ans_post_' || NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_answer_created
  AFTER INSERT ON public.answers
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_answer_points();

-- 3. Trigger for Accepted Answer (+25 points)
CREATE OR REPLACE FUNCTION handle_answer_acceptance_points()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_accepted = true AND OLD.is_accepted = false THEN
    -- Award points
    PERFORM award_points(
      NEW.author_id, 
      25, 
      'answer_accepted', 
      NEW.doubt_id, 
      'ans_acc_' || NEW.id
    );

    -- Notify
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      NEW.author_id, 
      'Solution Accepted!', 
      'Your answer was chosen as the best solution. You earned +25 points!', 
      'answer_accepted',
      '/doubts/' || NEW.doubt_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_answer_accepted_update
  AFTER UPDATE ON public.answers
  FOR EACH ROW
  EXECUTE FUNCTION handle_answer_acceptance_points();

-- 4. Initial Subjects Seed
INSERT INTO public.subjects (name, code, description) VALUES
('Data Structures & Algorithms', 'CS101', 'Core computer science concepts.'),
('Database Management Systems', 'CS202', 'SQL, NoSQL, and indexing.'),
('Machine Learning', 'AI303', 'Supervised and unsupervised learning.'),
('Discrete Mathematics', 'MA105', 'Logic, set theory, and graph theory.')
ON CONFLICT (name) DO NOTHING;
