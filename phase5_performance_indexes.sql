-- Indexes for RLS and query performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_doubts_user_id ON doubts(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_doubts_created_at ON doubts(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_doubts_subject_id ON doubts(subject_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reputation_events_user_id ON reputation_events(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mentor_bookings_mentor_id ON mentor_bookings(mentor_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mentor_bookings_user_id ON mentor_bookings(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_practice_attempts_user_id ON practice_attempts(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_id_is_read ON notifications(user_id, is_read);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_answer_votes_answer_id ON answer_votes(answer_id);

-- Leaderboard materialized view (refresh every 5 mins via pg_cron)
CREATE MATERIALIZED VIEW IF NOT EXISTS leaderboard_cache AS
  SELECT
    p.id,
    p.full_name,
    p.avatar_url,
    p.username,
    p.reputation_points,
    RANK() OVER (ORDER BY p.reputation_points DESC) AS rank
  FROM profiles p
  WHERE p.reputation_points > 0
WITH DATA;

CREATE UNIQUE INDEX ON leaderboard_cache(id);

-- Schedule refresh (requires pg_cron extension)
-- SELECT cron.schedule('refresh-leaderboard', '*/5 * * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_cache');
