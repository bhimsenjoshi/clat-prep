-- ─── Fix daily_free_questions default for new users ───
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)

-- 1. Fix existing NULL values
UPDATE public.profiles
SET daily_free_questions = 10,
    subscription_plan = 'free'
WHERE daily_free_questions IS NULL;

-- 2. Update the trigger to set proper defaults on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, subscription_plan, daily_free_questions)
  VALUES (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), 'free', 10);
  RETURN new;
END;
$$;
