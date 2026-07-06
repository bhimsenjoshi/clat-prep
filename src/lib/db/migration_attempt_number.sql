-- ─── Migration: Enable multiple attempts per test per student ───
-- Run this in Supabase SQL Editor AFTER existing data is set up.

-- 1. Add attempt_number column (default 1 for existing rows)
alter table public.attempts
  add column if not exists attempt_number int not null default 1;

-- 2. Drop old unique constraint
alter table public.attempts
  drop constraint if exists attempts_test_id_student_id_key;

-- 3. Add new composite unique constraint
alter table public.attempts
  add constraint attempts_test_id_student_id_attempt_number_key
  unique (test_id, student_id, attempt_number);

-- 4. Update the auto-profile trigger (if it references attempts)
-- (No changes needed — the trigger only handles profiles)

-- Verify
select constraint_name, constraint_type
from information_schema.table_constraints
where table_name = 'attempts';
