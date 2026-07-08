-- ─── WhatsApp Interactive Quiz — Schema ───
-- Run this in Supabase SQL Editor.

-- Active quiz session (one per user at a time)
create table if not exists public.whatsapp_quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  phone text not null,                          -- user's WhatsApp number
  section text not null,                        -- 'English', 'Legal Reasoning', etc.
  status text not null default 'active' check (status in ('active', 'completed', 'cancelled')),
  current_index int not null default 0,         -- 0-based index into question order
  question_order uuid[] not null default '{}',  -- ordered list of question IDs
  correct_count int not null default 0,
  total_questions int not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (phone, status)  -- only one active session per phone
);
create index if not exists idx_wqs_phone_status on public.whatsapp_quiz_sessions(phone, status);

-- Response log per question within a session
create table if not exists public.whatsapp_quiz_responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.whatsapp_quiz_sessions(id) on delete cascade,
  question_id uuid not null references public.practice_questions(id),
  selected_option text,
  is_correct boolean,
  responded_at timestamptz not null default now(),
  unique (session_id, question_id)
);

-- Incoming message log (for debugging + opt-out handling)
create table if not exists public.whatsapp_incoming (
  id bigserial primary key,
  phone text not null,
  message_body text not null,
  message_type text,          -- 'text', 'interactive', etc.
  meta_message_id text,
  created_at timestamptz not null default now()
);
create index if not exists idx_wi_phone on public.whatsapp_incoming(phone, created_at desc);

-- RLS
alter table public.whatsapp_quiz_sessions enable row level security;
alter table public.whatsapp_quiz_responses enable row level security;
alter table public.whatsapp_incoming enable row level security;

create policy "Users read own quiz sessions" on public.whatsapp_quiz_sessions
  for select using (auth.uid() = user_id);
create policy "Service insert quiz sessions" on public.whatsapp_quiz_sessions
  for insert with check (true);
create policy "Service update quiz sessions" on public.whatsapp_quiz_sessions
  for update using (true);

create policy "Users read own responses" on public.whatsapp_quiz_responses
  for select using (exists (
    select 1 from public.whatsapp_quiz_sessions where id = session_id and user_id = auth.uid()
  ));
create policy "Service insert responses" on public.whatsapp_quiz_responses
  for insert with check (true);
