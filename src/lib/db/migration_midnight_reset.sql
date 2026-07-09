-- ─── Daily Quota Reset at Midnight ───
-- Run in Supabase SQL Editor to enable automatic daily reset

-- First, enable pg_cron (requires Supabase project with cron support)
-- If pg_cron is not available, the check-on-visit logic in the API routes handles it

create extension if not exists pg_cron with schema pg_catalog;

-- Schedule daily reset for free users at midnight IST (18:30 UTC)
select cron.schedule(
  'reset-free-daily-questions',  -- job name
  '30 18 * * *',                 -- 6:30 PM UTC = midnight IST
  $$
    update public.profiles
    set
      daily_free_questions = 10,
      last_practice_date = current_date
    where subscription_plan = 'free'
      and (
        daily_free_questions < 10
        or last_practice_date is distinct from current_date
      );
  $$
);

-- ─── Existing: check-based reset in API routes still works as fallback ───
