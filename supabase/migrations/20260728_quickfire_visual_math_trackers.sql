-- ─── CLAT Prep — Quick Fire & Visual Math Topic Trackers ───
-- Tracks which topics have been used for Quick Fire standalone questions
-- and Visual Math (Quant Foundations) concepts.
-- Part of the daily cron rotation system.

-- ─── 1. Quick Fire Topic Tracker ───
CREATE TABLE IF NOT EXISTS public.quick_fire_tracker (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section text NOT NULL,
  bank_index integer NOT NULL,          -- Index into topic-bank-quickfire.json
  topic_title text NOT NULL,
  domain text NOT NULL DEFAULT '',
  used_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (section, bank_index)
);

CREATE INDEX IF NOT EXISTS idx_quick_fire_tracker_section
  ON public.quick_fire_tracker(section, bank_index);

ALTER TABLE public.quick_fire_tracker ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Service can read/write quick_fire_tracker"
  ON public.quick_fire_tracker FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─── 2. Visual Math Topic Tracker ───
CREATE TABLE IF NOT EXISTS public.visual_math_tracker (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subsection text NOT NULL,             -- Percentages, Ratios & Proportions, etc.
  bank_index integer NOT NULL,          -- Index into topic-bank-visual-math.json
  concept text NOT NULL,
  difficulty text NOT NULL DEFAULT 'easy',
  used_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (subsection, bank_index)
);

CREATE INDEX IF NOT EXISTS idx_visual_math_tracker_subsection
  ON public.visual_math_tracker(subsection, bank_index);

ALTER TABLE public.visual_math_tracker ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Service can read/write visual_math_tracker"
  ON public.visual_math_tracker FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
