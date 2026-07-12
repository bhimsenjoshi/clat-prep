-- Fix ALL CLAT exam entries: remove broken ones, update existing, and ensure
-- ONLY clean, functional exam entries with properly populated questions remain.

BEGIN;

-- ============================================================
-- STEP 1: Delete broken draft entries (CLAT 2025 Original, CLAT 2025 A)
-- ============================================================
DO $$
DECLARE
  test_ids uuid[];
  tid uuid;
BEGIN
  test_ids := ARRAY(
    SELECT id FROM tests
    WHERE title IN ('CLAT 2025 Original', 'CLAT 2025 A')
    AND created_by = 'cd6c2afa-72ef-4ee8-93ef-9d33d8bd47f2'
  );

  IF array_length(test_ids, 1) IS NOT NULL THEN
    FOREACH tid IN ARRAY test_ids
    LOOP
      DELETE FROM questions
      WHERE section_id IN (SELECT id FROM sections WHERE test_id = tid);
      DELETE FROM sections WHERE test_id = tid;
    END LOOP;
    DELETE FROM tests WHERE id = ANY(test_ids);
  END IF;
END $$;

-- ============================================================
-- STEP 2: Fix "Mock Test #2" and "CLAT UG 2025 — Full Length Mock"
--         Re-create sections (order 0-4) and populate questions
--         from original_questions with passage text.
-- ============================================================

-- Helper function: populate sections + questions from original CLAT data.
-- original_sections.name holds the subject name (e.g. 'English Language').
CREATE OR REPLACE FUNCTION _populate_test_from_original(target_test_id uuid) RETURNS void AS $$
DECLARE
  _secid uuid;
  _subj RECORD;
BEGIN
  DELETE FROM questions
  WHERE section_id IN (SELECT id FROM sections WHERE test_id = target_test_id);
  DELETE FROM sections WHERE test_id = target_test_id;

  FOR _subj IN
    SELECT * FROM (VALUES
      ('English'::text, 'English Language'::text, 0),
      ('Current Affairs'::text, 'Current Affairs Including General Knowledge'::text, 1),
      ('Legal Reasoning'::text, 'Legal Reasoning'::text, 2),
      ('Logical Reasoning'::text, 'Logical Reasoning'::text, 3),
      ('Quantitative Techniques'::text, 'Quantitative Techniques'::text, 4)
    ) AS t(name, section_name, ord)
  LOOP
    INSERT INTO sections (test_id, name, order_index)
    VALUES (target_test_id, _subj.name, _subj.ord)
    RETURNING id INTO _secid;

    -- Copy questions from original_questions for this subject, using Set A only.
    -- original_sections.name matches _subj.section_name exactly.
    INSERT INTO questions (section_id, question_text, passage, options, correct_option, explanation, difficulty, generated_by, reviewed)
    SELECT
      _secid,
      oq.question_text,
      opass.content,
      oq.options,
      oq.correct_option,
      oq.explanation,
      'medium',
      'manual',
      true
    FROM original_questions oq
    JOIN original_sections os ON oq.section_id = os.id
    JOIN original_papers op ON os.paper_id = op.id
    LEFT JOIN original_passages opass ON oq.passage_id = opass.id
    WHERE os.name = _subj.section_name
      AND op.set_name = 'A'
      AND op.is_active = true
    ORDER BY oq.question_number;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Fix Mock Test #2
DO $$
DECLARE
  tid uuid;
BEGIN
  SELECT id INTO tid FROM tests
  WHERE title = 'Mock Test #2'
  AND created_by = 'cd6c2afa-72ef-4ee8-93ef-9d33d8bd47f2'
  LIMIT 1;
  IF tid IS NOT NULL THEN
    PERFORM _populate_test_from_original(tid);
  END IF;
END $$;

-- Fix CLAT UG 2025 — Full Length Mock
DO $$
DECLARE
  tid uuid;
BEGIN
  SELECT id INTO tid FROM tests
  WHERE title = 'CLAT UG 2025 — Full Length Mock'
  AND created_by = 'cd6c2afa-72ef-4ee8-93ef-9d33d8bd47f2'
  LIMIT 1;
  IF tid IS NOT NULL THEN
    PERFORM _populate_test_from_original(tid);
  END IF;
END $$;

-- Clean up helper
DROP FUNCTION IF EXISTS _populate_test_from_original(uuid);

-- ============================================================
-- STEP 3: Verify final state
-- ============================================================
SELECT
  t.title,
  t.status,
  s.name AS section_name,
  s.order_index,
  COUNT(q.id) AS question_count
FROM tests t
LEFT JOIN sections s ON s.test_id = t.id
LEFT JOIN questions q ON q.section_id = s.id
WHERE t.created_by = 'cd6c2afa-72ef-4ee8-93ef-9d33d8bd47f2'
  AND t.status = 'published'
GROUP BY t.id, t.title, t.status, s.id, s.name, s.order_index
ORDER BY t.created_at, s.order_index;

COMMIT;
