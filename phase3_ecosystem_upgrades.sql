-- Phase 3: Ecosystem & Advanced Gamification Logic

-- 1. Weekly XP View (Phase 3.3)
-- Calculations reset every Monday at 00:00 UTC
CREATE OR REPLACE VIEW public.weekly_leaderboard AS
SELECT 
    p.id as user_id,
    p.username,
    p.avatar_url,
    p.college,
    COALESCE(SUM(rh.points), 0) as weekly_xp
FROM public.profiles p
LEFT JOIN public.reputation_history rh ON p.id = rh.user_id
WHERE rh.created_at >= date_trunc('week', now())
GROUP BY p.id, p.username, p.avatar_url, p.college
ORDER BY weekly_xp DESC;

-- 2. Subject Expert Auto-Award (Phase 3.3)
-- Logic: If user has >= 10 accepted answers in a subject, award 'Subject Expert' badge
CREATE OR REPLACE FUNCTION check_for_subject_expert()
RETURNS TRIGGER AS $$
DECLARE
    v_subject_id UUID;
    v_accepted_count INTEGER;
    v_badge_exists BOOLEAN;
BEGIN
    -- The NEW row is from reputation_history where action_type = 'answer_accepted'
    IF NEW.action_type = 'answer_accepted' THEN
        -- Find the subject of the original doubt
        SELECT d.subject_id INTO v_subject_id
        FROM public.doubts d
        JOIN public.answers a ON a.doubt_id = d.id
        WHERE a.id = NEW.reference_id;

        -- Count accepted answers for this user in this subject
        SELECT COUNT(*) INTO v_accepted_count
        FROM public.doubts d
        JOIN public.answers a ON a.doubt_id = d.id
        WHERE a.user_id = NEW.user_id
          AND d.accepted_answer_id = a.id
          AND d.subject_id = v_subject_id;

        -- If count is 10, check if badge already awarded
        IF v_accepted_count >= 10 THEN
            SELECT EXISTS(
                SELECT 1 FROM public.user_badges 
                WHERE user_id = NEW.user_id AND metadata->>'subject_id' = v_subject_id::text
            ) INTO v_badge_exists;

            IF NOT v_badge_exists THEN
                INSERT INTO public.user_badges (user_id, badge_type, metadata)
                VALUES (NEW.user_id, 'subject_expert', jsonb_build_object('subject_id', v_subject_id));
                
                -- Extra bonus XP for being an expert
                INSERT INTO public.reputation_history (user_id, action_type, points)
                VALUES (NEW.user_id, 'expert_badge_earned', 50);
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_check_expert ON public.reputation_history;
CREATE TRIGGER trigger_check_expert
    AFTER INSERT ON public.reputation_history
    FOR EACH ROW EXECUTE FUNCTION check_for_subject_expert();

-- 3. Streak Freeze & Store (Phase 3.3)
-- Spend XP to get a 'streak_freeze' charge (Stored in metadata)
CREATE OR REPLACE FUNCTION purchase_streak_freeze(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_current_xp INTEGER;
BEGIN
    SELECT reputation_points INTO v_current_xp FROM public.profiles WHERE id = p_user_id;
    
    IF v_current_xp < 50 THEN
        RAISE EXCEPTION 'Insufficient XP. Needed: 50, Current: %', v_current_xp;
    END IF;

    -- Deduct XP
    INSERT INTO public.reputation_history (user_id, action_type, points)
    VALUES (p_user_id, 'store_purchase_streak_freeze', -50);

    -- Increment streak freeze count in profiles
    UPDATE public.profiles
    SET streak_freezes = COALESCE(streak_freezes, 0) + 1
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Dynamic Discount Function (Phase 3.3)
-- 100 XP = ₹50 discount on next session booking
CREATE OR REPLACE FUNCTION apply_xp_discount(p_user_id UUID, p_booking_id UUID)
RETURNS VOID AS $$
DECLARE
    v_current_xp INTEGER;
BEGIN
    SELECT reputation_points INTO v_current_xp FROM public.profiles WHERE id = p_user_id;

    IF v_current_xp < 100 THEN
        RAISE EXCEPTION 'Insufficient XP for discount.';
    END IF;

    -- Deduct 100 XP
    INSERT INTO public.reputation_history (user_id, action_type, points)
    VALUES (p_user_id, 'xp_discount_applied', -100);

    -- Log discount for the booking
    UPDATE public.mentor_bookings
    SET discount_amount = 50,
        metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{discount_type}', '"xp_redeem"')
    WHERE id = p_booking_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
