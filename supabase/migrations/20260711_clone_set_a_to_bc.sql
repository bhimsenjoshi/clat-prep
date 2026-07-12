-- ─── Clone Set A's passages and questions to Sets B and C ───
-- All 4 sets of CLAT 2025 UG share the same 19 passages and 120 questions
-- (just arranged in different order per the CLAT standard practice)

do $$
declare
  v_source_paper_id uuid;
  v_target_paper_id uuid;
  v_source_section_id uuid;
  v_target_section_id uuid;
  v_old_passage_id uuid;
  v_new_passage_id uuid;
  v_section_name text;
  v_section_order int;
  v_question record;
  v_passage record;
begin
  -- Get source paper (Set A)
  select id into v_source_paper_id from public.original_papers where set_name = 'A';
  
  -- For each target set (B and C)
  for v_target_paper_id in 
    select id from public.original_papers where set_name in ('B', 'C') order by set_name
  loop
    raise notice 'Cloning to paper: %', v_target_paper_id;
    
    -- For each section
    for v_source_section_id, v_target_section_id, v_section_name in
      select os.id, ts.id, os.name
      from original_sections os
      cross join original_sections ts
      where os.paper_id = v_source_paper_id
        and ts.paper_id = v_target_paper_id
        and os.name = ts.name
      order by os.order_index
    loop
      -- Clone passages
      for v_passage in 
        select * from public.original_passages 
        where section_id = v_source_section_id 
        order by passage_number
      loop
        insert into public.original_passages (section_id, passage_number, title, source, content)
        values (v_target_section_id, v_passage.passage_number, v_passage.title, v_passage.source, v_passage.content)
        returning id into v_new_passage_id;
        
        -- Get the old passage id for linking questions
        v_old_passage_id := v_passage.id;
        
        -- Clone questions for this passage
        for v_question in
          select * from public.original_questions
          where section_id = v_source_section_id and passage_id = v_old_passage_id
          order by question_number
        loop
          insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
          values (v_target_section_id, v_new_passage_id, v_question.question_number, v_question.question_text, v_question.options, v_question.correct_option, v_question.explanation, v_question.marks, v_question.negative_marks);
        end loop;
      end loop;
      
      -- Clone questions without a passage (if any)
      for v_question in
        select * from public.original_questions
        where section_id = v_source_section_id and passage_id is null
        order by question_number
      loop
        insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
        values (v_target_section_id, null, v_question.question_number, v_question.question_text, v_question.options, v_question.correct_option, v_question.explanation, v_question.marks, v_question.negative_marks);
      end loop;
    end loop;
    
    raise notice 'Done cloning to paper %', v_target_paper_id;
  end loop;

  raise notice 'All cloning complete!';
end $$;
