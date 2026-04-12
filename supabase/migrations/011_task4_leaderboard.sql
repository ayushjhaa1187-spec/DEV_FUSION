CREATE OR REPLACE VIEW test_leaderboard AS
SELECT 
    p.id as user_id,
    p.username,
    p.avatar_url,
    t.topic,
    MAX(ts.score) as best_score,
    MAX(ts.submitted_at) as completed_at
FROM public.practice_attempts ts
JOIN public.practice_tests t ON ts.test_id = t.id
JOIN public.profiles p ON ts.user_id = p.id
WHERE ts.status = 'completed'
GROUP BY p.id, p.username, p.avatar_url, t.topic;

-- For Task 5: Global Leaderboard View
CREATE OR REPLACE VIEW global_reputation_leaderboard AS
SELECT 
    id,
    username,
    avatar_url,
    reputation_points,
    login_streak,
    college
FROM public.profiles
ORDER BY reputation_points DESC, login_streak DESC;
