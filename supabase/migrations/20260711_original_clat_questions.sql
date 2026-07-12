-- ─── CLAT Prep — Original CLAT Question Papers Database ───
-- Holds authentic past CLAT question papers (not AI-generated)
-- Separate from the practice/questions/test tables used for admin-created tests

-- 1. Original question papers metadata
create table if not exists public.original_papers (
  id uuid primary key default gen_random_uuid(),
  title text not null,                    -- e.g. "CLAT UG 2025 Set A"
  exam_type text not null check (exam_type in ('ug', 'pg')),
  year integer not null,
  set_name text not null,                 -- 'A', 'B', 'C', 'D'
  total_questions integer not null,
  duration_minutes integer default 120,
  conducted_by text default 'Consortium of NLUs',
  source_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  
  -- Ensure one entry per exam/year/set
  unique (exam_type, year, set_name)
);

-- 2. Sections within each original paper (mirrors CLAT sections)
create table if not exists public.original_sections (
  id uuid primary key default gen_random_uuid(),
  paper_id uuid not null references public.original_papers(id) on delete cascade,
  name text not null,                     -- 'English Language', 'Current Affairs & GK', 'Legal Reasoning', 'Logical Reasoning', 'Quantitative Techniques'
  order_index integer not null,
  total_questions integer not null,
  created_at timestamptz not null default now(),
  
  unique (paper_id, name)
);

-- 3. Passage excerpts (for reading comprehension sections)
create table if not exists public.original_passages (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.original_sections(id) on delete cascade,
  passage_number integer not null,        -- Passage I, II, III, IV, V, VI...
  title text,                             -- e.g. "George Orwell - Why I Write"
  source text,                            -- e.g. "Extracted from George Orwell's 'Why I Write'"
  content text not null,
  created_at timestamptz not null default now(),
  
  unique (section_id, passage_number)
);

-- 4. Original questions (with correct answers)
create table if not exists public.original_questions (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.original_sections(id) on delete cascade,
  passage_id uuid references public.original_passages(id) on delete set null,
  question_number integer not null,
  question_text text not null,
  options jsonb not null,                 -- [{"label": "A", "text": "..."}, ...]
  correct_option text not null,           -- 'A', 'B', 'C', or 'D'
  explanation text,
  marks integer not null default 1,
  negative_marks numeric default 0,
  created_at timestamptz not null default now(),
  
  unique (section_id, question_number)
);

-- 5. Answer key for the whole paper (quick reference)
--    Populated automatically via trigger
create table if not exists public.original_answer_keys (
  id uuid primary key default gen_random_uuid(),
  paper_id uuid not null references public.original_papers(id) on delete cascade,
  section_id uuid not null references public.original_sections(id) on delete cascade,
  question_number integer not null,
  correct_option text not null,
  marks integer not null default 1,
  
  unique (paper_id, section_id, question_number)
);

-- Indexes for performance
create index if not exists idx_original_sections_paper on original_sections(paper_id);
create index if not exists idx_original_passages_section on original_passages(section_id);
create index if not exists idx_original_questions_section on original_questions(section_id);
create index if not exists idx_original_questions_passage on original_questions(passage_id);
create index if not exists idx_original_questions_number on original_questions(question_number);
create index if not exists idx_original_answer_keys_paper on original_answer_keys(paper_id);
create index if not exists idx_original_papers_year on original_papers(year desc);

-- Enable RLS
alter table public.original_papers enable row level security;
alter table public.original_sections enable row level security;
alter table public.original_passages enable row level security;
alter table public.original_questions enable row level security;
alter table public.original_answer_keys enable row level security;

-- RLS: All authenticated users can READ; only admins can write
create policy "Anyone can view original papers"
  on public.original_papers for select
  to authenticated
  using (true);

create policy "Only admins can insert/update/delete original papers"
  on public.original_papers for all
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Apply same RLS to other tables (reusable function)
do $$ begin
  execute format(
    'create policy "Anyone can view original sections"
      on %I for select to authenticated using (true)',
    'original_sections'
  );
  execute format(
    'create policy "Admin write only"
      on %I for all to authenticated
      using (exists (select 1 from public.profiles where id = auth.uid() and role = ''admin''))
      with check (exists (select 1 from public.profiles where id = auth.uid() and role = ''admin''))',
    'original_sections'
  );
  execute format(
    'create policy "Anyone can view original passages"
      on %I for select to authenticated using (true)',
    'original_passages'
  );
  execute format(
    'create policy "Admin write only"
      on %I for all to authenticated
      using (exists (select 1 from public.profiles where id = auth.uid() and role = ''admin''))
      with check (exists (select 1 from public.profiles where id = auth.uid() and role = ''admin''))',
    'original_passages'
  );
  execute format(
    'create policy "Anyone can view original questions"
      on %I for select to authenticated using (true)',
    'original_questions'
  );
  execute format(
    'create policy "Admin write only"
      on %I for all to authenticated
      using (exists (select 1 from public.profiles where id = auth.uid() and role = ''admin''))
      with check (exists (select 1 from public.profiles where id = auth.uid() and role = ''admin''))',
    'original_questions'
  );
  execute format(
    'create policy "Anyone can view answer keys"
      on %I for select to authenticated using (true)',
    'original_answer_keys'
  );
  execute format(
    'create policy "Admin write only"
      on %I for all to authenticated
      using (exists (select 1 from public.profiles where id = auth.uid() and role = ''admin''))
      with check (exists (select 1 from public.profiles where id = auth.uid() and role = ''admin''))',
    'original_answer_keys'
  );
end $$;

-- Trigger: auto-populate answer_key when a question is inserted/updated
create or replace function public.sync_answer_key()
returns trigger as $$
begin
  insert into public.original_answer_keys (paper_id, section_id, question_number, correct_option, marks)
  select op.id, new.section_id, new.question_number, new.correct_option, new.marks
  from public.original_sections os
  join public.original_papers op on op.id = os.paper_id
  where os.id = new.section_id
  on conflict (paper_id, section_id, question_number)
  do update set correct_option = new.correct_option, marks = new.marks;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_sync_answer_key on public.original_questions;
create trigger trg_sync_answer_key
  after insert or update of correct_option, marks, question_number
  on public.original_questions
  for each row execute function public.sync_answer_key();
