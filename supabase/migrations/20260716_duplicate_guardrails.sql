-- ─── CLAT Prep — Duplicate Guardrails ───
-- Prevents duplicate passage content from being inserted

-- 1. Add content_hash column to practice_passages for fast dedup
--    Uses sha256 hash of the content text for exact-match detection
ALTER TABLE public.practice_passages
  ADD COLUMN IF NOT EXISTS content_hash text;

-- 2. Backfill content_hash for existing rows
UPDATE public.practice_passages
SET content_hash = encode(sha256(content::bytea), 'hex')
WHERE content_hash IS NULL;

-- 3. Make content_hash NOT NULL going forward
ALTER TABLE public.practice_passages
  ALTER COLUMN content_hash SET NOT NULL;

-- 4. Unique constraint on content_hash — this is the guardrail
--    Prevents inserting a passage with the exact same content
CREATE UNIQUE INDEX IF NOT EXISTS idx_practice_passages_content_hash
  ON public.practice_passages(content_hash);

-- 5. Auto-set content_hash on insert/update via trigger
CREATE OR REPLACE FUNCTION public.set_passage_content_hash()
RETURNS trigger AS $$
BEGIN
  NEW.content_hash := encode(sha256(NEW.content::bytea), 'hex');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_passage_content_hash ON public.practice_passages;
CREATE TRIGGER trg_set_passage_content_hash
  BEFORE INSERT OR UPDATE OF content
  ON public.practice_passages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_passage_content_hash();

COMMENT ON COLUMN public.practice_passages.content_hash IS 'SHA-256 hash of passage content for exact duplicate detection. Unique constraint prevents re-insertion of identical passages.';
