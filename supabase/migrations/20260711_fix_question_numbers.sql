-- Fix Current Affairs questions - shift from Q25-48 to proper numbers
-- The current data has Q25-Q48 (BRICS=25-30, Art370=31-36, NariShakti=37-40, CivilDisobedience=41-46, Olympics=47-52)
-- But the actual paper has CA section starting at Q25
-- Let me check what question numbers we actually have

-- First, check what CA questions exist
SELECT question_number, LEFT(question_text, 80) as preview
FROM public.original_questions q
JOIN public.original_sections s ON s.id = q.section_id
WHERE s.name = 'Current Affairs Including General Knowledge'
ORDER BY question_number;
