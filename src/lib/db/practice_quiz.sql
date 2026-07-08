-- ─── CLAT Prep — Practice Quiz Tables ───
-- Run this in Supabase SQL Editor after the main schema

-- 1. Practice Questions (standalone, not tied to a test/section)
create table public.practice_questions (
  id uuid primary key default gen_random_uuid(),
  section text not null check (section in (
    'English', 'Current Affairs', 'Legal Reasoning',
    'Logical Reasoning', 'Quantitative Techniques'
  )),
  topic text not null default 'general',
  question_text text not null,
  passage text,
  options jsonb not null,             -- {"A": "...", "B": "...", "C": "...", "D": "..."}
  correct_option text not null,       -- 'A' | 'B' | 'C' | 'D'
  explanation text,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')) default 'medium',
  source text default 'ai_generated',  -- 'ai_generated' | 'verified' | 'real_clat'
  tags text[] default '{}',
  created_at timestamptz not null default now()
);

-- 2. Quiz Sessions (one per practice session)
create table public.quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  section text not null check (section in (
    'English', 'Current Affairs', 'Legal Reasoning',
    'Logical Reasoning', 'Quantitative Techniques'
  )),
  topic text not null default 'general',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  questions_answered int not null default 0,
  correct_count int not null default 0
);

-- 3. Quiz Responses (one per answered question)
create table public.quiz_responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.quiz_sessions(id) on delete cascade,
  question_id uuid not null references public.practice_questions(id),
  selected_option text,
  is_correct boolean,
  time_taken_seconds int not null default 0,
  answered_at timestamptz not null default now(),
  unique (session_id, question_id)
);

-- 4. Add daily tracking fields to profiles
alter table public.profiles
  add column if not exists daily_free_questions int not null default 10,
  add column if not exists last_practice_date date,
  add column if not exists subscription_plan text not null default 'free'
    check (subscription_plan in ('free', 'premium'));

-- ─── Indexes ───
create index if not exists idx_practice_questions_section
  on public.practice_questions(section);
create index if not exists idx_practice_questions_topic
  on public.practice_questions(topic);
create index if not exists idx_quiz_sessions_student
  on public.quiz_sessions(student_id);
create index if not exists idx_quiz_responses_session
  on public.quiz_responses(session_id);

-- ─── Row Level Security ───

-- Practice Questions
alter table public.practice_questions enable row level security;

create policy "Students can read practice questions"
  on public.practice_questions for select
  using (true);

create policy "Admins can write practice questions"
  on public.practice_questions for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Quiz Sessions
alter table public.quiz_sessions enable row level security;

create policy "Students can read own quiz sessions"
  on public.quiz_sessions for select
  using (auth.uid() = student_id);

create policy "Students can create own quiz sessions"
  on public.quiz_sessions for insert
  with check (auth.uid() = student_id);

create policy "Students can update own quiz sessions"
  on public.quiz_sessions for update
  using (auth.uid() = student_id);

-- Quiz Responses
alter table public.quiz_responses enable row level security;

create policy "Students can read own quiz responses"
  on public.quiz_responses for select
  using (
    exists (
      select 1 from public.quiz_sessions
      where id = session_id and student_id = auth.uid()
    )
  );

create policy "Students can insert own quiz responses"
  on public.quiz_responses for insert
  with check (
    exists (
      select 1 from public.quiz_sessions
      where id = session_id and student_id = auth.uid()
    )
  );
