-- ─── Editorial Activity Tracking ───
-- Tracks editorial reads and quiz performance per student

create table if not exists public.editorial_activity (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  source_id text not null,
  article_url text not null,
  article_title text not null,
  read_at timestamptz,
  quiz_correct int not null default 0,
  quiz_total int not null default 0,
  last_quiz_at timestamptz,
  created_at timestamptz not null default now(),
  unique (student_id, article_url)
);

-- Index for fast lookups by student
create index if not exists idx_editorial_activity_student
  on public.editorial_activity(student_id);

-- Index for analytics aggregation
create index if not exists idx_editorial_activity_read_at
  on public.editorial_activity(student_id, read_at);

-- RLS
alter table public.editorial_activity enable row level security;

create policy "Students can read own editorial activity"
  on public.editorial_activity for select
  using (auth.uid() = student_id);

create policy "Students can insert own editorial activity"
  on public.editorial_activity for insert
  with check (auth.uid() = student_id);

create policy "Students can update own editorial activity"
  on public.editorial_activity for update
  using (auth.uid() = student_id);
