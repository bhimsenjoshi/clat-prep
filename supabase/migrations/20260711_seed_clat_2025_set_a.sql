-- ─── Seed: CLAT UG 2025 Set A (Original Paper) ───
-- Extracted from the official question paper PDF

-- 1. Insert paper metadata
with paper as (
  insert into public.original_papers (title, exam_type, year, set_name, total_questions, duration_minutes, source_url)
  values ('CLAT UG 2025 Set A', 'ug', 2025, 'A', 120, 120, 'https://cdn-images.prepp.in/public/image/clat-2025-ug-question-paper-pdf-dec-01-2024-a-1762246952.pdf')
  returning id
),
-- 2. Insert sections
sections as (
  insert into public.original_sections (paper_id, name, order_index, total_questions)
  select paper.id, name, order_index, total_questions
  from paper cross join (values
    ('English Language', 1, 24),
    ('Current Affairs Including General Knowledge', 2, 36),
    ('Legal Reasoning', 3, 24),
    ('Logical Reasoning', 4, 24),
    ('Quantitative Techniques', 5, 12)
  ) as s(name, order_index, total_questions)
  returning id, name, order_index
)
select * from sections;
