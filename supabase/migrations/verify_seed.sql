-- Verify the seeded data
SELECT 'paper' as entity, p.title, p.year, p.set_name, p.total_questions FROM public.original_papers p
UNION ALL
SELECT 'sections' as entity, s.name || ' (' || s.total_questions || ' questions)' as title, s.order_index::text, null, null FROM public.original_sections s WHERE s.paper_id = (SELECT id FROM public.original_papers LIMIT 1) ORDER BY 1, 2;
