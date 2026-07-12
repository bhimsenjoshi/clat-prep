-- ─── Seed Sets B and C by cloning Set A's content ───
-- All CLAT 2025 UG sets (A, B, C, D) use the same 19 passages and 120 questions,
-- just arranged in different order. This creates paper/section records for B and C.

-- SET B
do $$
declare
  v_paper_id uuid;
  v_section_id uuid;
  v_passage_id uuid;
begin
  -- Create paper B
  insert into public.original_papers (title, exam_type, year, set_name, total_questions, duration_minutes, source_url)
  values ('CLAT UG 2025 Set B', 'ug', 2025, 'B', 120, 120, 'https://cdn-images.prepp.in/public/image/clat-2025-ug-question-paper-pdf-dec-01-2024-b-1762246952.pdf')
  returning id into v_paper_id;

  raise notice 'Created Set B paper: %', v_paper_id;
end $$;

-- SET C
do $$
declare
  v_paper_id uuid;
  v_section_id uuid;
begin
  insert into public.original_papers (title, exam_type, year, set_name, total_questions, duration_minutes, source_url)
  values ('CLAT UG 2025 Set C', 'ug', 2025, 'C', 120, 120, 'https://cdn-images.prepp.in/public/image/clat-2025-ug-question-paper-pdf-dec-01-2024-c-1762246952.pdf')
  returning id into v_paper_id;

  raise notice 'Created Set C paper: %', v_paper_id;
end $$;

-- Create sections for Set B
do $$
declare
  v_paper_id uuid;
  v_section_id uuid;
begin
  select id into v_paper_id from public.original_papers where set_name = 'B';
  
  insert into public.original_sections (paper_id, name, order_index, total_questions) values
    (v_paper_id, 'English Language', 1, 24),
    (v_paper_id, 'Current Affairs Including General Knowledge', 2, 28),
    (v_paper_id, 'Legal Reasoning', 3, 32),
    (v_paper_id, 'Logical Reasoning', 4, 24),
    (v_paper_id, 'Quantitative Techniques', 5, 12);
    
  raise notice 'Created sections for Set B';
end $$;

-- Create sections for Set C
do $$
declare
  v_paper_id uuid;
begin
  select id into v_paper_id from public.original_papers where set_name = 'C';
  
  insert into public.original_sections (paper_id, name, order_index, total_questions) values
    (v_paper_id, 'English Language', 1, 24),
    (v_paper_id, 'Current Affairs Including General Knowledge', 2, 28),
    (v_paper_id, 'Legal Reasoning', 3, 32),
    (v_paper_id, 'Logical Reasoning', 4, 24),
    (v_paper_id, 'Quantitative Techniques', 5, 12);
    
  raise notice 'Created sections for Set C';
end $$;
