-- ==============================================================================
-- SKILLBRIDGE ENTERPRISE SEED SCRIPT (PROD-COMPATIBLE)
-- Populates Profiles, Mentors, Doubts, and Usage Logs for Heatmap
-- ==============================================================================

-- 1. Create Dummy Profiles (Top Students & Contributors)
-- Note: In a real Supabase environment with FKs, these would normally be 
-- created via auth.signUp. For seeding, we assume RLS/FK bypass or manual Dashboard execution.

DO $$
DECLARE
    v_subject_dsa UUID;
    v_subject_ml UUID;
    v_subject_web UUID;
    v_subject_sys UUID;
BEGIN
    -- Get some real subject IDs
    SELECT id INTO v_subject_dsa FROM subjects WHERE slug = 'dsa' LIMIT 1;
    SELECT id INTO v_subject_ml FROM subjects WHERE slug = 'ml' LIMIT 1;
    SELECT id INTO v_subject_web FROM subjects WHERE slug = 'web-dev' LIMIT 1;
    SELECT id INTO v_subject_sys FROM subjects WHERE slug = 'system-design' LIMIT 1;

    -- A. Seed Profiles
    FOR i IN 1..15 LOOP
        INSERT INTO public.profiles (id, username, full_name, email, college, branch, semester, reputation_points, role)
        VALUES (
            gen_random_uuid(),
            'student_' || i || '_' || floor(random()*1000),
            'Student ' || i,
            'student' || i || '@skillbridge.edu',
            (ARRAY['IIT Delhi', 'BITS Pilani', 'NIT Trichy', 'VIT Vellore'])[floor(random() * 4 + 1)],
            (ARRAY['Computer Science', 'Electronics', 'Mechanical', 'IT'])[floor(random() * 4 + 1)],
            floor(random() * 8 + 1)::INT,
            floor(random() * 500 + 50)::INT,
            'student'
        ) ON CONFLICT DO NOTHING;
    END LOOP;

    -- B. Seed Mentors
    -- Dr. Aditi Sharma
    INSERT INTO public.profiles (id, username, full_name, email, college, role, reputation_points)
    VALUES (gen_random_uuid(), 'aditi_ml', 'Dr. Aditi Sharma', 'aditi@stanford.edu', 'Stanford University', 'mentor', 1200)
    ON CONFLICT DO NOTHING;

    INSERT INTO public.mentor_profiles (id, specialty, price_per_session, rating, sessions_completed, is_verified)
    SELECT id, 'Machine Learning', 800, 4.9, 120, true 
    FROM public.profiles WHERE username = 'aditi_ml'
    ON CONFLICT DO NOTHING;

    -- Rahul Verma
    INSERT INTO public.profiles (id, username, full_name, email, college, role, reputation_points)
    VALUES (gen_random_uuid(), 'rahul_swe', 'Rahul Verma', 'rahul@google.com', 'Ex-Google SWE', 'mentor', 950)
    ON CONFLICT DO NOTHING;

    INSERT INTO public.mentor_profiles (id, specialty, price_per_session, rating, sessions_completed, is_verified)
    SELECT id, 'System Design', 600, 4.8, 85, true 
    FROM public.profiles WHERE username = 'rahul_swe'
    ON CONFLICT DO NOTHING;

    -- C. Seed Doubts
    FOR i IN 1..10 LOOP
        INSERT INTO public.doubts (id, author_id, title, content, subject_id, status)
        VALUES (
            gen_random_uuid(),
            (SELECT id FROM public.profiles WHERE role = 'student' ORDER BY random() LIMIT 1),
            'How does React Server Components ' || i || ' work?',
            'I am migrating to Next.js 15 and struggling with hydration boundaries. Any help?',
            v_subject_web,
            'open'
        ) ON CONFLICT DO NOTHING;
    END LOOP;

    -- D. Seed Usage Logs (For the HeatPulse HeatMap)
    -- Generates activity over the last 30 days
    FOR i IN 1..150 LOOP
        INSERT INTO public.usage_daily_log (user_id, action, date, count)
        VALUES (
            (SELECT id FROM public.profiles ORDER BY random() LIMIT 1),
            (ARRAY['ai_doubt_solve', 'test_passed', 'mentor_booked'])[floor(random() * 3 + 1)],
            CURRENT_DATE - (floor(random() * 30) || ' days')::interval,
            floor(random() * 5 + 1)::INT
        ) ON CONFLICT (user_id, action, date) 
        DO UPDATE SET count = usage_daily_log.count + EXCLUDED.count;
    END LOOP;

END $$;
