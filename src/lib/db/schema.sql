-- ─── CLAT Prep Platform — Database Schema ───
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)

-- 0. Extensions
create extension if not exists "pgcrypto";

-- 1. Profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null check (role in ('student', 'admin')) default 'student',
  created_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Tests
create table public.tests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status text not null check (status in ('draft', 'published', 'archived')) default 'draft',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  published_at timestamptz
);

-- 3. Sections (5 per test)
create table public.sections (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.tests(id) on delete cascade,
  name text not null check (name in ('English', 'Current Affairs', 'Legal Reasoning', 'Logical Reasoning', 'Quantitative Techniques')),
  order_index int not null,
  unique (test_id, name)
);

-- 4. Questions (10 per section = 50 per test)
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.sections(id) on delete cascade,
  question_text text not null,
  passage text,
  options jsonb not null,           -- {"A": "...", "B": "...", "C": "...", "D": "..."}
  correct_option text not null,     -- 'A' | 'B' | 'C' | 'D'
  explanation text,
  difficulty text,                  -- 'easy' | 'medium' | 'hard'
  generated_by text not null check (generated_by in ('gemini', 'deepseek', 'manual')) default 'manual',
  reviewed boolean not null default false
);

-- 5. Attempts (one per student per test)
create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.tests(id) on delete cascade,
  student_id uuid not null references public.profiles(id),
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  total_score numeric,
  section_scores jsonb,             -- {"English": 7, "Legal Reasoning": 5, ...}
  unique (test_id, student_id)      -- one attempt per test per student
);

-- 6. Responses (one per question per attempt)
create table public.responses (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id),
  selected_option text,             -- null means unanswered
  is_correct boolean,
  time_taken_seconds int,
  unique (attempt_id, question_id)
);

-- 7. Leaderboard view
create view public.leaderboard as
select
  a.test_id,
  p.full_name,
  a.total_score,
  rank() over (partition by a.test_id order by a.total_score desc) as test_rank
from public.attempts a
join public.profiles p on p.id = a.student_id
where a.submitted_at is not null;

-- 8. Indexes for performance
create index idx_sections_test_id on public.sections(test_id);
create index idx_questions_section_id on public.questions(section_id);
create index idx_attempts_student_id on public.attempts(student_id);
create index idx_attempts_test_id on public.attempts(test_id);
create index idx_responses_attempt_id on public.responses(attempt_id);

-- ─── Row Level Security ───

-- Profiles
alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admins can read all profiles"
  on public.profiles for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Tests
alter table public.tests enable row level security;

create policy "Students can read published tests"
  on public.tests for select
  using (status = 'published');

create policy "Admins can read/write all tests"
  on public.tests for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Sections
alter table public.sections enable row level security;

create policy "Students can read sections of published tests"
  on public.sections for select
  using (
    exists (select 1 from public.tests where id = test_id and status = 'published')
  );

create policy "Admins can read/write all sections"
  on public.sections for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Questions
alter table public.questions enable row level security;

create policy "Students can read questions of published tests"
  on public.questions for select
  using (
    exists (
      select 1 from public.sections s
      join public.tests t on t.id = s.test_id
      where s.id = section_id and t.status = 'published'
    )
  );

create policy "Admins can read/write all questions"
  on public.questions for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Attempts
alter table public.attempts enable row level security;

create policy "Students can read own attempts"
  on public.attempts for select
  using (auth.uid() = student_id);

create policy "Students can insert own attempts"
  on public.attempts for insert
  with check (auth.uid() = student_id);

create policy "Students can update own attempts"
  on public.attempts for update
  using (auth.uid() = student_id);

create policy "Admins can read all attempts"
  on public.attempts for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Responses
alter table public.responses enable row level security;

create policy "Students can read own responses (via attempt)"
  on public.responses for select
  using (
    exists (
      select 1 from public.attempts
      where id = attempt_id and student_id = auth.uid()
    )
  );

create policy "Students can insert own responses"
  on public.responses for insert
  with check (
    exists (
      select 1 from public.attempts
      where id = attempt_id and student_id = auth.uid()
    )
  );

create policy "Students can update own responses"
  on public.responses for update
  using (
    exists (
      select 1 from public.attempts
      where id = attempt_id and student_id = auth.uid()
    )
  );

create policy "Admins can read all responses"
  on public.responses for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ─── Helper: manually make a user admin ───
-- Run this in the SQL Editor after signing up:
-- update public.profiles set role = 'admin' where id = '<user-uuid>';

-- ─── Seed data: sample test with hand-written questions ───
-- (Use the admin dashboard UI to create tests, but here's a helper)
