-- ─── Seed: CLAT UG 2025 Set A — English Language Passages & Questions ───
-- Extracted from the official CLAT 2025 UG Set A question paper PDF.
-- Section ID for English Language: 53b4039c-7ba7-400d-a990-59b8716e087b

-- ============================================================================
-- PASSAGE I — George Orwell's "Why I Write" (Questions 1–6)
-- ============================================================================
do $$
declare
  v_section_id uuid := '53b4039c-7ba7-400d-a990-59b8716e087b';
  v_passage_id uuid;
begin
  insert into public.original_passages (section_id, passage_number, title, source, content)
  values (
    v_section_id,
    1,
    'George Orwell — Why I Write',
    'Extracted with edits from George Orwell''s ''Why I Write''',
    'From a very early age, I knew that when I grew up, I should be a writer. I had the lonely child''s habit of making up stories and holding conversations with imaginary persons, and I think from the very start my literary ambitions were mixed up with the feeling of being isolated and undervalued. I knew that I had a facility with words and a power of facing unpleasant facts, and I felt that this created a sort of private world in which I could get my own back for my failure in everyday life. I wanted to write enormous naturalistic novels with unhappy endings, full of detailed descriptions and arresting similes, and also full of purple passages in which words were used partly for the sake of their sound. I give all this background information because I do not think one can assess a writer''s motives without knowing something of his early development. His subject-matter will be determined by the age he lives in - at least this is true in tumultuous, revolutionary ages like our own - but before he ever begins to write he will have acquired an emotional attitude from which he will never completely escape. It is his job to discipline his temperament, but if he escapes from his early influences altogether, he will have killed his impulse to write. I think there are four great motives for writing, at any rate for writing prose. They are: (i) Sheer egoism: Desire to seem clever, to be talked about, to be remembered after death, to get your own back on grown-ups who snubbed you in childhood; (ii) Aesthetic enthusiasm: Desire to share an experience which one feels is valuable and ought not to be missed (iii) Historical impulse: Desire to see things as they are, to find out true facts and store them up for the use of posterity (iv) Political purpose : Desire to push the world in a certain direction, to alter other people''s idea of the kind of society that they should strive after.'
  )
  returning id into v_passage_id;

  -- Q1
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (
    v_section_id, v_passage_id, 1,
    'For the author, aesthetic enthusiasm is an important motive for writing because it ...',
    '[{"label": "A", "text": "shapes the thoughts"}, {"label": "B", "text": "creates an artistic piece"}, {"label": "C", "text": "becomes invaluable"}, {"label": "D", "text": "non-utilitarian"}]',
    'D',
    'The passage describes aesthetic enthusiasm as a "non-utilitarian" desire, i.e., art for art''s sake.'
  );

  -- Q2
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (
    v_section_id, v_passage_id, 2,
    'The author strongly advocates the writers to:',
    '[{"label": "A", "text": "avoid any egoistic impression in their work"}, {"label": "B", "text": "be apolitical in their approach"}, {"label": "C", "text": "be contemporary in their treatment of their work"}, {"label": "D", "text": "None of the above"}]',
    'A',
    null
  );

  -- Q3
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (
    v_section_id, v_passage_id, 3,
    'Which of the following is a synonym for the word "tumultuous"?',
    '[{"label": "A", "text": "Chaotic"}, {"label": "B", "text": "Turbulent"}, {"label": "C", "text": "Disorderly"}, {"label": "D", "text": "All of the above"}]',
    'D',
    null
  );

  -- Q4
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (
    v_section_id, v_passage_id, 4,
    'George Orwell''s loneliness during childhood led to',
    '[{"label": "A", "text": "estrangement with his father"}, {"label": "B", "text": "unhappy days"}, {"label": "C", "text": "making up stories"}, {"label": "D", "text": "unpleasant incidents"}]',
    'C',
    'Orwell states "I had the lonely child''s habit of making up stories and holding conversations with imaginary persons"'
  );

  -- Q5
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (
    v_section_id, v_passage_id, 5,
    'Why does Orwell give background information?',
    '[{"label": "A", "text": "He had the lonely child''s habits"}, {"label": "B", "text": "It is essential to know about motives of writers"}, {"label": "C", "text": "Because of his historic impulse"}, {"label": "D", "text": "Due to the aesthetic enthusiasm"}]',
    'B',
    'Orwell says "I do not think one can assess a writer''s motives without knowing something of his early development."'
  );

  -- Q6
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (
    v_section_id, v_passage_id, 6,
    'If writer escapes from early impulses, he will ...',
    '[{"label": "A", "text": "lose his urge to write"}, {"label": "B", "text": "be unable to imagine creatively"}, {"label": "C", "text": "be able to converse with imaginary characters"}, {"label": "D", "text": "be able to influence others"}]',
    'A',
    null
  );
end $$;

-- ============================================================================
-- PASSAGE II — Swami Vivekananda on Education (Questions 7–12)
-- ============================================================================
do $$
declare
  v_section_id uuid := '53b4039c-7ba7-400d-a990-59b8716e087b';
  v_passage_id uuid;
begin
  insert into public.original_passages (section_id, passage_number, title, source, content)
  values (
    v_section_id,
    2,
    'Swami Vivekananda — Education',
    'Extracted with edits from ''Education'' by Swami Vivekananda',
    'Education is not the amount of information that is put into your brain and runs riot there, undigested, all your life. We must have life-building, man-making, character-making assimilation of ideas... If education were identical with information, the libraries are the sages in the world and encyclopaedias are the rishis. Getting by heart the thoughts of others in a foreign language and stuffing your brain with them and taking some University degree, you consider yourself educated. Is this education? What is the goal of your education? Open your eyes and see what a piteous cry for food is rising in the land of Bharata, proverbial for its food. Will your education fulfill this want? We want that education by which character is formed, strength of mind is increased, the intellect is expanded and by which one can stand on one''s own feet. What we need to study independent of foreign control, different branches of the knowledge that is our own, and with it the English language and Western science; we need technical education and all else that will develop industries so that men instead of seeking for service may earn enough to provide for themselves and save against a rainy day. The end of all education, all training, should be man-making. The end and aim of all training are to make the man grow. The training by which the current expression of will are brought under control and become fruitful, is called education. What our country now wants are muscles of iron and nerves of steel, gigantic wills, which nothing can resist, which can penetrate into the mysteries and secrets of the universe and will accomplish their purpose in any fashion, even if it meant going down to the bottom of the ocean, meeting death face to face. There is only one method of attaining knowledge. It is by concentration. The very essence of education is concentration of mind.'
  )
  returning id into v_passage_id;

  -- Q7
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (
    v_section_id, v_passage_id, 7,
    'According to the author, we need to study:',
    '[{"label": "A", "text": "English Language"}, {"label": "B", "text": "Technical Education"}, {"label": "C", "text": "Western Science"}, {"label": "D", "text": "All of the above"}]',
    'D',
    null
  );

  -- Q8
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (
    v_section_id, v_passage_id, 8,
    'According to the author, which among the following is key to attain knowledge?',
    '[{"label": "A", "text": "University Degrees"}, {"label": "B", "text": "Library"}, {"label": "C", "text": "Concentration of mind"}, {"label": "D", "text": "Hard work and sports training"}]',
    'C',
    'The passage states "The very essence of education is concentration of mind"'
  );

  -- Q9
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (
    v_section_id, v_passage_id, 9,
    'Which of the following words is related to the word "assimilation"?',
    '[{"label": "A", "text": "Integration"}, {"label": "B", "text": "Adjustment"}, {"label": "C", "text": "Acclimatization"}, {"label": "D", "text": "All of the above"}]',
    'D',
    null
  );

  -- Q10
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (
    v_section_id, v_passage_id, 10,
    'Education, as described by the author means:',
    '[{"label": "A", "text": "Information"}, {"label": "B", "text": "Library"}, {"label": "C", "text": "Degrees"}, {"label": "D", "text": "None of the above"}]',
    'D',
    'The author explicitly rejects all three — education is "character-making assimilation of ideas"'
  );

  -- Q11
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (
    v_section_id, v_passage_id, 11,
    'As per the author, the aim of education should be:',
    '[{"label": "A", "text": "to help a person build his/her character"}, {"label": "B", "text": "to help a person earn his/her livelihood"}, {"label": "C", "text": "to help a person develop his/her intellect"}, {"label": "D", "text": "All of the above"}]',
    'D',
    null
  );

  -- Q12
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (
    v_section_id, v_passage_id, 12,
    'According to the author the country wants:',
    '[{"label": "A", "text": "massive will power"}, {"label": "B", "text": "spirit of philanthropy"}, {"label": "C", "text": "iron and steel industries"}, {"label": "D", "text": "All of the above"}]',
    'D',
    null
  );
end $$;
