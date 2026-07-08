-- ─── WhatsApp Integration — Schema Migration ───
-- Run this in Supabase SQL Editor after the Meta Business setup is done.

-- Add WhatsApp columns to profiles
alter table public.profiles
  add column if not exists phone text,
  add column if not exists whatsapp_opted_in boolean not null default false,
  add column if not exists whatsapp_verified boolean not null default false;

-- Verify phone uniqueness (one account per number)
create unique index if not exists idx_profiles_phone
  on public.profiles(phone)
  where phone is not null;

-- Track sent WhatsApp messages (for reporting / rate limiting)
create table if not exists public.whatsapp_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  message_type text not null,              -- 'quiz_result' | 'daily_summary' | 'welcome' | 'otp'
  message_body text not null,
  whatsapp_message_id text,                -- Meta's message ID
  status text not null default 'sent',     -- 'sent' | 'delivered' | 'read' | 'failed'
  error text,
  created_at timestamptz not null default now()
);

-- Index for daily reports query
create index if not exists idx_whatsapp_log_user_date
  on public.whatsapp_log(user_id, created_at);

-- RLS: users can see their own log
alter table public.whatsapp_log enable row level security;

create policy "Users can read own whatsapp log"
  on public.whatsapp_log for select
  using (auth.uid() = user_id);

create policy "Service can insert whatsapp log"
  on public.whatsapp_log for insert
  with check (true);

-- ─── Helper: get opted-in users for daily broadcast ───
create or replace view public.whatsapp_opted_in_users as
select
  id,
  full_name,
  phone,
  daily_free_questions,
  subscription_plan
from public.profiles
where phone is not null
  and whatsapp_opted_in = true;
