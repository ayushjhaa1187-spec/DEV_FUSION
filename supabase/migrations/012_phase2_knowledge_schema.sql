-- ============================================================
-- Migration 012: Phase 2 Knowledge Schema
-- Adds rich-text and AI tracking columns to doubts & answers
-- ============================================================

-- DOUBTS TABLE: add markdown content + AI tracking
ALTER TABLE public.doubts
  ADD COLUMN IF NOT EXISTS content_markdown TEXT,
  ADD COLUMN IF NOT EXISTS ai_attempted     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_response      TEXT,
  ADD COLUMN IF NOT EXISTS is_resolved      BOOLEAN NOT NULL DEFAULT false;

-- Backfill: copy legacy 'content' TEXT into content_markdown if it exists
-- (safe no-op if content column doesn't exist)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'doubts' AND column_name = 'content'
  ) THEN
    UPDATE public.doubts
    SET content_markdown = content
    WHERE content_markdown IS NULL AND content IS NOT NULL;
  END IF;
END $$;

-- ANSWERS TABLE: add markdown content
ALTER TABLE public.answers
  ADD COLUMN IF NOT EXISTS content_markdown TEXT;

-- Backfill answers too
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'answers' AND column_name = 'content'
  ) THEN
    UPDATE public.answers
    SET content_markdown = content
    WHERE content_markdown IS NULL AND content IS NOT NULL;
  END IF;
END $$;

-- Full-text search index on doubts (GIN for fast ilike/tsquery)
CREATE INDEX IF NOT EXISTS idx_doubts_content_fts
  ON public.doubts
  USING GIN (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content_markdown, '')));

-- Create indexes for performance (idempotent ADD INDEX is not standard, but IF NOT EXISTS works in some envs, or use DO block)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_doubts_subject_new') THEN
        CREATE INDEX idx_doubts_subject_new ON public.doubts(subject_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_doubts_created_desc') THEN
        CREATE INDEX idx_doubts_created_desc ON public.doubts(created_at DESC);
    END IF;
END $$;

-- Ensure RLS is ON (idempotent)
ALTER TABLE public.doubts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for doubts (create only if they don't exist)
DO $$
BEGIN
  -- SELECT: all authenticated users can read all doubts
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'doubts' AND policyname = 'doubts_select_all'
  ) THEN
    CREATE POLICY doubts_select_all ON public.doubts
      FOR SELECT TO authenticated USING (true);
  END IF;

  -- INSERT: authenticated users insert their own doubts only
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'doubts' AND policyname = 'doubts_insert_own'
  ) THEN
    CREATE POLICY doubts_insert_own ON public.doubts
      FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = author_id);
  END IF;

  -- UPDATE: users update their own doubts only
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'doubts' AND policyname = 'doubts_update_own'
  ) THEN
    CREATE POLICY doubts_update_own ON public.doubts
      FOR UPDATE TO authenticated
      USING (auth.uid() = author_id);
  END IF;

  -- DELETE: users delete their own doubts only
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'doubts' AND policyname = 'doubts_delete_own'
  ) THEN
    CREATE POLICY doubts_delete_own ON public.doubts
      FOR DELETE TO authenticated
      USING (auth.uid() = author_id);
  END IF;
END $$;

-- RLS Policies for answers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'answers' AND policyname = 'answers_select_all'
  ) THEN
    CREATE POLICY answers_select_all ON public.answers
      FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'answers' AND policyname = 'answers_insert_own'
  ) THEN
    CREATE POLICY answers_insert_own ON public.answers
      FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = author_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'answers' AND policyname = 'answers_update_own'
  ) THEN
    CREATE POLICY answers_update_own ON public.answers
      FOR UPDATE TO authenticated
      USING (auth.uid() = author_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'answers' AND policyname = 'answers_delete_own'
  ) THEN
    CREATE POLICY answers_delete_own ON public.answers
      FOR DELETE TO authenticated
      USING (auth.uid() = author_id);
  END IF;
END $$;
