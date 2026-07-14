-- ─── Add username, school, clat_year, minor_consent to profiles ───
-- Run this in Supabase SQL Editor

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text UNIQUE,
  ADD COLUMN IF NOT EXISTS school text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS clat_year int NOT NULL DEFAULT 2027,
  ADD COLUMN IF NOT EXISTS minor_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS display_name text;

-- Index for username search (friend feature)
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- Update the auto-profile trigger to also generate a unique username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username, school, clat_year, minor_consent)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'full_name', ''),
    '@user_' || substr(md5(random()::text || clock_timestamp()::text), 1, 6),
    COALESCE(new.raw_user_meta_data ->> 'school', ''),
    COALESCE((new.raw_user_meta_data ->> 'clat_year')::int, 2027),
    COALESCE((new.raw_user_meta_data ->> 'minor_consent')::boolean, false)
  );
  RETURN new;
END;
$$;
