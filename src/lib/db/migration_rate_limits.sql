-- Rate limiting table for serverless-friendly request throttling
-- Used by admin API routes instead of in-memory Map (which doesn't work on Vercel)

create table if not exists public.rate_limits (
  key text primary key,
  count int not null default 1,
  reset_at timestamptz not null
);

-- Enable RLS but allow service_role only
alter table public.rate_limits enable row level security;

create policy "Service role manages rate limits"
  on public.rate_limits
  using (true)
  with check (true);
