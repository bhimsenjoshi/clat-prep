-- ─── CLAT Prep — Subscription Tiers & Profile Upgrade ───
-- Campaign: Free upgrade till July 31, 2026, first 20 users only

-- 1. Update subscription_plan constraint to include 'max' tier
alter table public.profiles
  drop constraint if exists profiles_subscription_plan_check;

alter table public.profiles
  add constraint profiles_subscription_plan_check
  check (subscription_plan in ('free', 'premium', 'max'));

-- 2. Add campaign tracking fields
alter table public.profiles
  add column if not exists is_promo_user boolean not null default false;

alter table public.profiles
  add column if not exists promo_claimed_at timestamptz;

-- 3. Add DPDP-compliant user details (optional, for later use)
--    Following data minimization: only collect what's needed
--    Phone is encrypted at rest by Supabase (BYOK available)
alter table public.profiles
  add column if not exists phone text;  -- optional, DPDP: collect explicit consent

alter table public.profiles
  add column if not exists email text;  -- mirrors auth.users.email, cached for display

-- 4. Auto-populate email from auth.users on profile creation/update
create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set email = new.email
  where id = new.id and (email is null or email != new.email);
  return new;
end;
$$;

create or replace trigger on_auth_user_email_changed
  after insert or update of email on auth.users
  for each row execute function public.sync_profile_email();

-- 5. Backfill emails for existing profiles
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;

-- 6. RLS: Users can update own profile (needed for upgrade)
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 7. RLS: Admins can update all profiles (for manual adjustments)
drop policy if exists "Admins can update all profiles" on public.profiles;
create policy "Admins can update all profiles"
  on public.profiles for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 8. Create upgrade_log table for audit trail (DPDP compliance)
--    Immutable audit log: once written, never modified
create table public.upgrade_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  from_plan text not null,
  to_plan text not null,
  upgrade_type text not null check (upgrade_type in ('promo_campaign', 'self_upgrade', 'admin_grant')),
  campaign_remaining int,  -- snapshot of remaining promo slots at time of upgrade
  created_at timestamptz not null default now()
);

alter table public.upgrade_log enable row level security;

create policy "Users can read own upgrade log"
  on public.upgrade_log for select
  using (auth.uid() = user_id);

create policy "Admins can read all upgrade logs"
  on public.upgrade_log for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Admins can insert logs (system operation)
create policy "Service can insert upgrade logs"
  on public.upgrade_log for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    or auth.uid() = user_id  -- the user whose upgrade is being logged
  );

-- 9. Index for campaign count queries
create index if not exists idx_profiles_subscription_plan
on public.profiles(subscription_plan);

create index if not exists idx_profiles_is_promo_user
  on public.profiles(is_promo_user);

create index if not exists idx_upgrade_log_user
  on public.upgrade_log(user_id);
