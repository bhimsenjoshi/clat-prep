-- ─── Wire CLAT Original Papers into the existing exam system ───
-- Maps original_papers -> tests, original_sections -> sections, original_questions -> questions
-- Uses the existing check constraint: 'English', 'Current Affairs', etc.

do $$
declare
  v_set record;
  v_test_id uuid;
  v_section record;
  v_new_section_id uuid;
  v_orig_section_id uuid;
  v_question record;
  v_passage_text text;
  v_admin_user_id uuid;
  v_short_name text;
begin
  -- Get an admin user for created_by
  select coalesce(
    (select id from public.profiles where role = 'admin' limit 1),
    (select id from auth.users limit 1),
    '00000000-0000-0000-0000-000000000000'::uuid
  ) into v_admin_user_id;

  -- Process each original paper (only Sets A for now — single set approach)
  for v_set in 
    select * from public.original_papers 
    where exam_type = 'ug' and year = 2025 and set_name = 'A'
  loop
    -- Insert into tests table
    insert into public.tests (title, status, created_by, created_at, published_at)
    values (
      'CLAT UG 2025 — Full Length Mock',
      'published',
      v_admin_user_id,
      now(),
      now()
    )
    returning id into v_test_id;
    
    raise notice 'Created test: %', v_test_id;

    -- For each section in this paper
    for v_section in 
      select * from public.original_sections 
      where paper_id = v_set.id 
      order by order_index
    loop
      v_orig_section_id := v_section.id;
      
      -- Map full section names to short names the constraint expects
      v_short_name := case v_section.name
        when 'English Language' then 'English'
        when 'Current Affairs Including General Knowledge' then 'Current Affairs'
        when 'Legal Reasoning' then 'Legal Reasoning'
        when 'Logical Reasoning' then 'Logical Reasoning'
        when 'Quantitative Techniques' then 'Quantitative Techniques'
        else v_section.name
      end;
      
      insert into public.sections (test_id, name, order_index)
      values (v_test_id, v_short_name, v_section.order_index)
      returning id into v_new_section_id;

      -- Clone questions from original_questions to questions table
      for v_question in
        select * from public.original_questions
        where section_id = v_orig_section_id
        order by question_number
      loop
        -- Get passage text if any
        v_passage_text := null;
        if v_question.passage_id is not null then
          select content into v_passage_text 
          from public.original_passages 
          where id = v_question.passage_id;
        end if;

        insert into public.questions (
          section_id, question_text, passage, options, 
          correct_option, explanation, difficulty, generated_by, reviewed
        ) values (
          v_new_section_id,
          v_question.question_text,
          v_passage_text,
          v_question.options,
          v_question.correct_option,
          v_question.explanation,
          'medium',
          'manual',
          true
        );
      end loop;
      
      raise notice '  Section % done', v_short_name;
    end loop;
  end loop;
  
  raise notice '✅ CLAT 2025 wired into exam system!';
end $$;
