-- ─── CLAT Prep — Quant Foundations (Visual Math) ───
-- Run this in Supabase SQL Editor
--
-- Option C: Separate section + shared analytics engine
-- Subsections: Percentages, Ratios & Proportions, Fractions & Decimals, Data Basics

-- 1. Visual Math Questions (standalone, passage-linked visual problems)
create table public.visual_math_questions (
  id uuid primary key default gen_random_uuid(),
  subsection text not null check (subsection in (
    'Percentages', 'Ratios & Proportions', 'Fractions & Decimals', 'Data Basics'
  )),
  topic text not null default 'general',
  question_text text not null,
  passage text,                              -- describes the visual model (SVG/grid/tape)
  options jsonb not null,                    -- {"A": "...", "B": "...", "C": "...", "D": "..."}
  correct_option text not null,              -- 'A' | 'B' | 'C' | 'D'
  explanation text,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')) default 'medium',
  visual_type text default 'none',           -- 'pie_chart' | 'bar_diagram' | 'tape_diagram' | 'grid' | 'number_line' | 'none'
  source text default 'ai_generated',
  tags text[] default '{}',
  created_at timestamptz not null default now()
);

-- 2. Visual Math Sessions (one per practice session)
create table public.visual_math_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  subsection text not null check (subsection in (
    'Percentages', 'Ratios & Proportions', 'Fractions & Decimals', 'Data Basics'
  )),
  topic text not null default 'general',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  questions_answered int not null default 0,
  correct_count int not null default 0
);

-- 3. Visual Math Responses (one per answered question)
create table public.visual_math_responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.visual_math_sessions(id) on delete cascade,
  question_id uuid not null references public.visual_math_questions(id),
  selected_option text,
  is_correct boolean,
  time_taken_seconds int not null default 0,
  answered_at timestamptz not null default now(),
  unique (session_id, question_id)
);

-- ─── Indexes ───
create index if not exists idx_visual_math_questions_subsection
  on public.visual_math_questions(subsection);
create index if not exists idx_visual_math_questions_topic
  on public.visual_math_questions(topic);
create index if not exists idx_visual_math_sessions_student
  on public.visual_math_sessions(student_id);
create index if not exists idx_visual_math_responses_session
  on public.visual_math_responses(session_id);

-- ─── Row Level Security ───

-- Visual Math Questions
alter table public.visual_math_questions enable row level security;

create policy "Anyone can read visual math questions"
  on public.visual_math_questions for select
  using (true);

create policy "Admins can write visual math questions"
  on public.visual_math_questions for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Visual Math Sessions
alter table public.visual_math_sessions enable row level security;

create policy "Students can read own visual math sessions"
  on public.visual_math_sessions for select
  using (auth.uid() = student_id);

create policy "Students can create own visual math sessions"
  on public.visual_math_sessions for insert
  with check (auth.uid() = student_id);

create policy "Students can update own visual math sessions"
  on public.visual_math_sessions for update
  using (auth.uid() = student_id);

-- Visual Math Responses
alter table public.visual_math_responses enable row level security;

create policy "Students can read own visual math responses"
  on public.visual_math_responses for select
  using (
    exists (
      select 1 from public.visual_math_sessions
      where id = session_id and student_id = auth.uid()
    )
  );

create policy "Students can insert own visual math responses"
  on public.visual_math_responses for insert
  with check (
    exists (
      select 1 from public.visual_math_sessions
      where id = session_id and student_id = auth.uid()
    )
  );
