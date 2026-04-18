-- Migration 038: Global Practice Bank
-- Creates the separation of concerns: Global Tests vs User Attempts for rate-limit bypassing.

-- 1. Tests (The Global Bank)
CREATE TABLE IF NOT EXISTS global_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject TEXT NOT NULL,
    topic TEXT NOT NULL,
    total_questions INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    -- Ensure we don't have exact duplicates for caching purposes
    UNIQUE(subject, topic)
);

-- Index for searching the bank quickly
CREATE INDEX IF NOT EXISTS idx_global_tests_subject_topic ON global_tests(subject, topic);

-- 2. Questions
CREATE TABLE IF NOT EXISTS global_test_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID REFERENCES global_tests(id) ON DELETE CASCADE NOT NULL,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of 4 strings
    correct_index INTEGER NOT NULL CHECK (correct_index >= 0 AND correct_index <= 3),
    order_index INTEGER NOT NULL DEFAULT 0, -- To maintain deterministic order if needed
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Test Attempts (Score History)
CREATE TABLE IF NOT EXISTS test_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    test_id UUID REFERENCES global_tests(id) ON DELETE CASCADE NOT NULL,
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    status TEXT DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'AUTO_SUBMITTED')),
    score INTEGER,
    total_questions INTEGER -- snapshot of total questions at time of attempt
);

-- 4. User Answers
CREATE TABLE IF NOT EXISTS test_attempt_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID REFERENCES test_attempts(id) ON DELETE CASCADE NOT NULL,
    question_id UUID REFERENCES global_test_questions(id) ON DELETE CASCADE NOT NULL,
    selected_index INTEGER CHECK (selected_index >= 0 AND selected_index <= 3),
    is_correct BOOLEAN,
    UNIQUE(attempt_id, question_id)
);

-- Note: In a production environment, we'd add row-level security (RLS).
-- For public practice without deep auth complexity on the global bank:

ALTER TABLE global_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_attempt_answers ENABLE ROW LEVEL SECURITY;

-- Global Bank: Anyone can read
CREATE POLICY "Anyone can read global tests" ON global_tests FOR SELECT USING (true);
CREATE POLICY "Anyone can read global questions" ON global_test_questions FOR SELECT USING (true);
-- Note: inserting to global bounds should technically be handled securely. Since the backend handles Gemini generation,
-- we'll rely on the service role key bypassing RLS there. Or we can allow authenticated inserts if the client calls the API.

-- Users can insert and read their own attempts
CREATE POLICY "Users can view own attempts" ON test_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own attempts" ON test_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own attempts" ON test_attempts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own answers" ON test_attempt_answers FOR SELECT USING (
    EXISTS (SELECT 1 FROM test_attempts a WHERE a.id = attempt_id AND a.user_id = auth.uid())
);
CREATE POLICY "Users can insert own answers" ON test_attempt_answers FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM test_attempts a WHERE a.id = attempt_id AND a.user_id = auth.uid())
);
CREATE POLICY "Users can update own answers" ON test_attempt_answers FOR UPDATE USING (
    EXISTS (SELECT 1 FROM test_attempts a WHERE a.id = attempt_id AND a.user_id = auth.uid())
);
