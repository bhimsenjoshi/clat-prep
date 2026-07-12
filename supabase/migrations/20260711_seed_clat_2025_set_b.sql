-- ─── Seed: CLAT UG 2025 Set B ───
-- Extracted from the official PDF at /tmp/clat_2025_set_b.pdf
-- This set contains the SAME 19 passages and 120 questions as Set A,
-- but arranged in a different order (as is standard for CLAT question booklets).
-- The passage ordering in Set B is:
-- English (Passages: Krishnamurti, Narayan, Orwell, Vivekananda)
-- CA (Passages: CivilDisobedience, NariShakti, ParisOlympics, Art370, BRICS)
-- Legal (Passages: Children, Environment, GI/DPDP, ContractAct)
-- Logical (Passages: Consultant, Homelessness, Seating, Lifestyle)
-- Quant (Passages: GenderWageGap, MrDas)

-- Paper metadata
with paper as (
  insert into public.original_papers (title, exam_type, year, set_name, total_questions, duration_minutes, source_url)
  values ('CLAT UG 2025 Set B', 'ug', 2025, 'B', 120, 120, 'https://cdn-images.prepp.in/public/image/clat-2025-ug-question-paper-pdf-dec-01-2024-b-1762246952.pdf')
  returning id
),
sections as (
  insert into public.original_sections (paper_id, name, order_index, total_questions)
  select paper.id, name, order_index, total_questions
  from paper cross join (values
    ('English Language', 1, 24),
    ('Current Affairs Including General Knowledge', 2, 28),
    ('Legal Reasoning', 3, 32),
    ('Logical Reasoning', 4, 24),
    ('Quantitative Techniques', 5, 12)
  ) as s(name, order_index, total_questions)
  returning id, name, order_index
)
select 'Set B created: ' || (select count(*)::text from paper) || ' paper, ' || (select count(*)::text from sections) || ' sections';
