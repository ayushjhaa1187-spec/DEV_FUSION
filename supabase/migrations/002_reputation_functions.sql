-- ============================================================
-- Migration 002: Reputation Functions, Triggers, Views
-- SkillBridge / DEV_FUSION Platform
-- ============================================================

-- 1. Idempotency guard: drop reputation_events whether it is a table or a view
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'reputation_events' AND n.nspname = 'public' AND c.relkind = 'r'
  ) THEN
    DROP TABLE public.reputation_events CASCADE;
  ELSIF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'reputation_events' AND n.nspname = 'public' AND c.relkind = 'v'
  ) THEN
    DROP VIEW public.reputation_events CASCADE;
  END IF;
END $$;

-- 2. Compatibility view: reputation_events -> reputation_ledger
CREATE OR REPLACE VIEW reputation_events AS
  SELECT
    id,
    user_id,
    event_type,
    points_delta AS points,
    points_delta,
    entity_type,
    entity_id,
    metadata,
    created_at
  FROM reputation_ledger;

-- 3. Core function: Award reputation points
DROP FUNCTION IF EXISTS award_reputation(UUID, TEXT, INTEGER, TEXT, UUID, JSONB);
DROP FUNCTION IF EXISTS award_reputation(UUID, TEXT, INTEGER, TEXT, UUID);
DROP FUNCTION IF EXISTS award_reputation(UUID, TEXT, INTEGER);

CREATE OR REPLACE FUNCTION award_reputation(
  p_user_id UUID,
  p_event_type TEXT,
  p_points_delta INTEGER,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO reputation_ledger (
    user_id, event_type, points_delta, entity_type, entity_id, metadata
  ) VALUES (
    p_user_id, p_event_type, p_points_delta, p_entity_type, p_entity_id, p_metadata
  );

  INSERT INTO profiles (id, reputation_points)
  VALUES (p_user_id, GREATEST(0, p_points_delta))
  ON CONFLICT (id) DO UPDATE
    SET reputation_points = GREATEST(0, profiles.reputation_points + p_points_delta),
        updated_at = NOW();
END;
$$;

-- 4. Function: Check and award badges
DROP FUNCTION IF EXISTS check_and_award_badges(UUID);

CREATE OR REPLACE FUNCTION check_and_award_badges(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_points INTEGER;
  v_badge RECORD;
BEGIN
  SELECT COALESCE(reputation_points, 0) INTO v_user_points
  FROM profiles
  WHERE id = p_user_id;

  FOR v_badge IN
    SELECT b.id, b.name, b.requirement_type, b.requirement_value
    FROM badges b
    WHERE b.requirement_type = 'reputation_points'
      AND b.requirement_value <= v_user_points
      AND NOT EXISTS (
        SELECT 1 FROM user_badges ub
        WHERE ub.user_id = p_user_id AND ub.badge_id = b.id
      )
  LOOP
    INSERT INTO user_badges (user_id, badge_id)
    VALUES (p_user_id, v_badge.id)
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;

-- 5. Trigger function: on reputation change, check badges
CREATE OR REPLACE FUNCTION trigger_check_badges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM check_and_award_badges(NEW.user_id);
  RETURN NEW;
END;
$$;

-- 6. Attach trigger to reputation_ledger
DROP TRIGGER IF EXISTS on_reputation_change ON reputation_ledger;
CREATE TRIGGER on_reputation_change
  AFTER INSERT ON reputation_ledger
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_badges();

-- 7. Leaderboard view
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'leaderboard' AND n.nspname = 'public'
  ) THEN
    DROP VIEW public.leaderboard CASCADE;
  END IF;
END $$;

CREATE VIEW leaderboard AS
  SELECT
    p.id AS user_id,
    p.full_name,
    p.avatar_url,
    p.reputation_points AS points,
    RANK() OVER (ORDER BY p.reputation_points DESC) AS rank
  FROM profiles p
  WHERE p.reputation_points > 0;
