-- ─── CLAT Prep — Question Validation Support ───
-- Adds validation status tracking to practice_questions and creates
-- a validation_logs table for audit trail.

-- 1. Add validation_status column to practice_questions
ALTER TABLE public.practice_questions
  ADD COLUMN validation_status text NOT NULL DEFAULT 'pending'
    CHECK (validation_status IN ('pending', 'passed', 'flagged', 'rejected'));

-- 2. Index on validation_status for fast filtering
CREATE INDEX IF NOT EXISTS idx_practice_questions_validation_status
  ON public.practice_questions(validation_status);

-- 3. Create validation_logs table
CREATE TABLE IF NOT EXISTS public.validation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.practice_questions(id) ON DELETE CASCADE,
  validator text NOT NULL DEFAULT 'auto',
  status_before text NOT NULL,
  status_after text NOT NULL,
  checks_passed text[] DEFAULT '{}',
  checks_failed text[] DEFAULT '{}',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Index on validation_logs.question_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_validation_logs_question_id
  ON public.validation_logs(question_id);

-- 5. RLS for validation_logs
ALTER TABLE public.validation_logs ENABLE ROW LEVEL SECURITY;

-- Admins can read all validation logs
CREATE POLICY "Admins can read validation logs"
  ON public.validation_logs FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can write validation logs
CREATE POLICY "Admins can write validation logs"
  ON public.validation_logs FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 6. Update existing RLS policy for practice_questions
-- Drop the old permissive policy
DROP POLICY IF EXISTS "Students can read practice questions"
  ON public.practice_questions;

-- Re-create: students can only read 'passed' questions, admins can read all
CREATE POLICY "Students and admins read practice questions"
  ON public.practice_questions FOR SELECT
  USING (
    validation_status = 'passed'
    OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
