-- ─── Add subtopic column to questions and practice_questions ───

-- 1. Main test questions
alter table public.questions
  add column if not exists subtopic text not null default 'General';

-- 2. Practice questions (already has 'topic' — rename mental model, keep both)
alter table public.practice_questions
  add column if not exists subtopic text not null default 'General';

-- 3. Index for filtering by subtopic
create index if not exists idx_questions_subtopic
  on public.questions(subtopic);

create index if not exists idx_practice_questions_subtopic
  on public.practice_questions(subtopic);
