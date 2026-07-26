-- Add last_question_id to track student's position for crash recovery
ALTER TABLE public.attempts ADD COLUMN IF NOT EXISTS last_question_id uuid REFERENCES public.questions(id) ON DELETE SET NULL;
