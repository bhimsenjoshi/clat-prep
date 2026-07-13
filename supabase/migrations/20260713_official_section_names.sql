-- ─── Migration: Rename sections to official CLAT names + add passage metadata ───
-- Part of the CLATly legal compliance update (label: legal)
-- Applied successfully via direct SQL on 2026-07-13

-- ============================================================
-- STEP 1: Drop old constraints (needs to happen before UPDATE)
-- ============================================================

ALTER TABLE public.practice_questions DROP CONSTRAINT IF EXISTS practice_questions_section_check;
ALTER TABLE public.quiz_sessions DROP CONSTRAINT IF EXISTS quiz_sessions_section_check;
ALTER TABLE public.sections DROP CONSTRAINT IF EXISTS sections_name_check;

-- ============================================================
-- STEP 2: Migrate existing data to new section names
-- ============================================================

UPDATE public.practice_questions SET section = 'English Language' WHERE section = 'English';
UPDATE public.practice_questions SET section = 'Current Affairs Including General Knowledge' WHERE section = 'Current Affairs';
UPDATE public.quiz_sessions SET section = 'English Language' WHERE section = 'English';
UPDATE public.quiz_sessions SET section = 'Current Affairs Including General Knowledge' WHERE section = 'Current Affairs';
UPDATE public.sections SET name = 'English Language' WHERE name = 'English';
UPDATE public.sections SET name = 'Current Affairs Including General Knowledge' WHERE name = 'Current Affairs';

-- ============================================================
-- STEP 3: Add new CHECK constraints with official names
-- ============================================================

ALTER TABLE public.practice_questions
  ADD CONSTRAINT practice_questions_section_check
  CHECK (section IN (
    'English Language',
    'Current Affairs Including General Knowledge',
    'Legal Reasoning',
    'Logical Reasoning',
    'Quantitative Techniques'
  ));

ALTER TABLE public.quiz_sessions
  ADD CONSTRAINT quiz_sessions_section_check
  CHECK (section IN (
    'English Language',
    'Current Affairs Including General Knowledge',
    'Legal Reasoning',
    'Logical Reasoning',
    'Quantitative Techniques'
  ));

ALTER TABLE public.sections
  ADD CONSTRAINT sections_name_check
  CHECK (name IN (
    'English Language',
    'Current Affairs Including General Knowledge',
    'Legal Reasoning',
    'Logical Reasoning',
    'Quantitative Techniques'
  ));

-- ============================================================
-- STEP 4: Add passage metadata columns to practice_questions
-- ============================================================

ALTER TABLE public.practice_questions
  ADD COLUMN IF NOT EXISTS marks int NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS negative_marks numeric NOT NULL DEFAULT 0.25,
  ADD COLUMN IF NOT EXISTS passage_id uuid,
  ADD COLUMN IF NOT EXISTS question_number int;

CREATE INDEX IF NOT EXISTS idx_practice_questions_passage_id
  ON public.practice_questions(passage_id);

CREATE INDEX IF NOT EXISTS idx_practice_questions_passage_section
  ON public.practice_questions(section, passage_id);

-- ============================================================
-- STEP 5: Create practice_passages table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.practice_passages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section text NOT NULL,
  title text NOT NULL DEFAULT '',
  source text,
  content text NOT NULL,
  difficulty text NOT NULL DEFAULT 'medium'
    CHECK (difficulty IN ('easy', 'medium', 'hard')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT practice_passages_section_check
    CHECK (section IN (
      'English Language',
      'Current Affairs Including General Knowledge',
      'Legal Reasoning',
      'Logical Reasoning',
      'Quantitative Techniques'
    ))
);

ALTER TABLE public.practice_questions
  ADD CONSTRAINT fk_practice_questions_passage
  FOREIGN KEY (passage_id) REFERENCES public.practice_passages(id)
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_practice_passages_section
  ON public.practice_passages(section);

-- ============================================================
-- STEP 6: Clean up old index, create new
-- ============================================================

DROP INDEX IF EXISTS idx_practice_questions_section;
CREATE INDEX IF NOT EXISTS idx_practice_questions_section_name
  ON public.practice_questions(section);

-- ============================================================
-- STEP 7: Add daily passage tracking to profiles
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS daily_practice_passage_ids uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS last_passage_section text;

-- ============================================================
-- VERIFICATION
-- ============================================================
-- SELECT DISTINCT section FROM practice_questions ORDER BY section;
-- SELECT DISTINCT name FROM sections ORDER BY name;
-- SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name='practice_passages');
