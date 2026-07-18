-- ─── CLAT Prep — Topic Tracker for Daily Cron ───
-- Tracks which topics from the topic banks have been used
-- The cron picks the next unused topic in rotation for each section

CREATE TABLE IF NOT EXISTS public.topic_tracker (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section text NOT NULL,
  bank_index integer NOT NULL,          -- Index into the topic bank JSON array for this section
  topic_title text NOT NULL,
  domain text NOT NULL DEFAULT '',
  used_at timestamptz NOT NULL DEFAULT now(),
  passage_id uuid REFERENCES public.practice_passages(id) ON DELETE SET NULL,
  
  -- Only one entry per section + bank_index combination
  UNIQUE (section, bank_index)
);

-- Index for fast "find the next unused topic" queries
CREATE INDEX IF NOT EXISTS idx_topic_tracker_section
  ON public.topic_tracker(section, bank_index);

ALTER TABLE public.topic_tracker ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Service can read/write topic_tracker"
  ON public.topic_tracker FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
