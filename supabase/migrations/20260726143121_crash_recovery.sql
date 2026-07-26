ALTER TABLE public.attempts ADD COLUMN IF NOT EXISTS last_question_id uuid REFERENCES public.questions(id) ON DELETE SET NULL;
