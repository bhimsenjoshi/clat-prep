-- DELETE all Current Affairs questions that came from AI-generated passages (Electoral Bonds, SEBI)
-- These are Q37-48 in the Current Affairs section
DO $$
DECLARE
  v_section_id uuid;
BEGIN
  SELECT id INTO v_section_id FROM public.original_sections 
  WHERE name = 'Current Affairs Including General Knowledge' 
  AND paper_id = (SELECT id FROM public.original_papers LIMIT 1);
  
  -- Delete the fake questions (Q37-48) and their associated passages
  DELETE FROM public.original_answer_keys 
  WHERE section_id = v_section_id AND question_number BETWEEN 37 AND 48;
  
  DELETE FROM public.original_questions 
  WHERE section_id = v_section_id AND question_number BETWEEN 37 AND 48;
  
  -- Delete the fake passages (Electoral Bonds, SEBI)
  DELETE FROM public.original_passages 
  WHERE section_id = v_section_id 
  AND title IN ('Electoral Bonds Scheme', 'Securities and Exchange Board of India (SEBI)');
  
  -- Also fix Legal Reasoning - delete AI-generated questions outside range
  SELECT id INTO v_section_id FROM public.original_sections 
  WHERE name = 'Legal Reasoning' 
  AND paper_id = (SELECT id FROM public.original_papers LIMIT 1);
  
  -- First check what LR questions we have
  RAISE NOTICE 'Legal Reasoning section_id: %', v_section_id;
END $$;

SELECT s.name, MIN(q.question_number) as min_q, MAX(q.question_number) as max_q, count(*) as total
FROM public.original_sections s
JOIN public.original_questions q ON q.section_id = s.id
WHERE s.paper_id = (SELECT id FROM public.original_papers LIMIT 1)
GROUP BY s.name, s.order_index
ORDER BY s.order_index;
