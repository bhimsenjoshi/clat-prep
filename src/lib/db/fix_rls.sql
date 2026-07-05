-- Fix RLS infinite recursion: create a security definer function
-- that bypasses RLS when checking the admin role.

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Drop and recreate the policy for tests using the function
drop policy if exists "Admins can read/write all tests" on public.tests;
create policy "Admins can read/write all tests" on public.tests
  for all using (public.is_admin());

-- Drop and recreate for sections
drop policy if exists "Admins can read/write all sections" on public.sections;
create policy "Admins can read/write all sections" on public.sections
  for all using (public.is_admin());

-- Drop and recreate for questions
drop policy if exists "Admins can read/write all questions" on public.questions;
create policy "Admins can read/write all questions" on public.questions
  for all using (public.is_admin());

-- Drop and recreate for attempts
drop policy if exists "Admins can read all attempts" on public.attempts;
create policy "Admins can read all attempts" on public.attempts
  for select using (public.is_admin());

-- Drop and recreate for responses
drop policy if exists "Admins can read all responses" on public.responses;
create policy "Admins can read all responses" on public.responses
  for select using (public.is_admin());

-- Drop and recreate the admin profile policy
drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles" on public.profiles
  for select using (public.is_admin());
