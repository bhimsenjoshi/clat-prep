-- ─── Atomic Update Functions for Fast Quiz Respond ───
-- Run this in Supabase SQL Editor

-- 1. Decrement daily free question count (atomic, no race conditions)
create or replace function public.decrement_daily_count(p_user_id uuid)
returns int
language plpgsql
security definer
as $$
declare
  v_current int;
  v_plan text;
  v_last_date date;
begin
  select daily_free_questions, subscription_plan, last_practice_date
  into v_current, v_plan, v_last_date
  from public.profiles where id = p_user_id;

  -- Reset if new day
  if v_last_date is distinct from current_date then
    update public.profiles
    set daily_free_questions = 9, last_practice_date = current_date
    where id = p_user_id;
    return 9;
  end if;

  -- Decrement for free users
  if v_plan = 'free' and v_current > 0 then
    update public.profiles
    set daily_free_questions = daily_free_questions - 1
    where id = p_user_id;
    return v_current - 1;
  end if;

  return v_current;
end;
$$;

-- 2. Increment session counts atomically
create or replace function public.update_session_counts(
  p_session_id uuid,
  p_correct_inc int default 0
)
returns void
language plpgsql
security definer
as $$
begin
  update public.quiz_sessions
  set
    questions_answered = questions_answered + 1,
    correct_count = correct_count + p_correct_inc
  where id = p_session_id;
end;
$$;

-- 3. Combined: record response + update counts in one transaction
create or replace function public.record_answer_and_update(
  p_session_id uuid,
  p_question_id uuid,
  p_selected_option text,
  p_is_correct boolean,
  p_time_taken_seconds int,
  p_user_id uuid,
  p_correct_inc int default 0
)
returns void
language plpgsql
security definer
as $$
begin
  -- Insert response (ignore if already answered)
  insert into public.quiz_responses (session_id, question_id, selected_option, is_correct, time_taken_seconds)
  values (p_session_id, p_question_id, p_selected_option, p_is_correct, p_time_taken_seconds)
  on conflict (session_id, question_id) do nothing;

  -- Update session counts
  update public.quiz_sessions
  set
    questions_answered = questions_answered + 1,
    correct_count = correct_count + p_correct_inc
  where id = p_session_id;
end;
$$;
