
-- ============================================================
-- HEADER: Paper & Sections
-- ============================================================
-- ─── Seed: CLAT UG 2025 Set D (Original Paper) ───
-- Extracted from the official question paper PDF

-- 1. Insert paper metadata
with paper as (
  insert into public.original_papers (title, exam_type, year, set_name, total_questions, duration_minutes, source_url)
  values ('CLAT UG 2025 Set D', 'ug', 2025, 'D', 120, 120, 'https://www.prepp.in/public/image/clat-2025-ug-question-paper-pdf-dec-01-2024-d.pdf')
  returning id
),
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
select id, name, order_index from sections order by order_index;

-- PASSAGE I - George Orwell's "Why I Write" (Questions 1-6)
do $$
declare
  v_sec_id uuid;
  v_pass_id uuid;
begin
  select os.id into v_sec_id from public.original_sections os
  join public.original_papers op on op.id = os.paper_id
  where op.set_name = 'D' and op.year = 2025 and os.name = 'English Language';

  insert into public.original_passages (section_id, passage_number, title, source, content)
  values (
    v_sec_id, 1,
    'George Orwell - Why I Write',
    'Extracted with edits from George Orwell''s ''Why I Write''',
    'From a very early age, I knew that when I grew up, I should be a writer. I had the lonely child''s habit of making up stories and holding conversations with imaginary persons, and I think from the very start my literary ambitions were mixed up with the feeling of being isolated and undervalued. I knew that I had a facility with words and a power of facing unpleasant facts, and I felt that this created a sort of private world in which I could get my own back for my failure in everyday life. I wanted to write enormous naturalistic novels with unhappy endings, full of detailed descriptions and arresting similes, and also full of purple passages in which words were used partly for the sake of their sound. I give all this background information because I do not think one can assess a writer''s motives without knowing something of his early development. His subject-matter will be determined by the age he lives in - at least this is true in tumultuous, revolutionary ages like our own - but before he ever begins to write he will have acquired an emotional attitude from which he will never completely escape. It is his job to discipline his temperament, but if he escapes from his early influences altogether, he will have killed his impulse to write. I think there are four great motives for writing, at any rate for writing prose. They are: (i) Sheer egoism: Desire to seem clever, to be talked about, to be remembered after death, to get your own back on grown-ups who snubbed you in childhood; (ii) Aesthetic enthusiasm: Desire to share an experience which one feels is valuable and ought not to be missed (iii) Historical impulse: Desire to see things as they are, to find out true facts and store them up for the use of posterity (iv) Political purpose : Desire to push the world in a certain direction, to alter other people''s idea of the kind of society that they should strive after.'
  )
  returning id into v_pass_id;

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 1,
    'George Orwell''s loneliness during childhood led to',
    '[{"label": "A", "text": "estrangement with his father"}, {"label": "B", "text": "unhappy days"}, {"label": "C", "text": "making up stories"}, {"label": "D", "text": "unpleasant incidents"}]',
    'C',
    'The passage states: "I had the lonely child''s habit of making up stories and holding conversations with imaginary persons."');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 2,
    'Why does Orwell give background information?',
    '[{"label": "A", "text": "He had the lonely child''s habits"}, {"label": "B", "text": "It is essential to know about motives of writers"}, {"label": "C", "text": "Because of his historic impulse"}, {"label": "D", "text": "Due to the aesthetic enthusiasm"}]',
    'B',
    'Orwell states: "I do not think one can assess a writer''s motives without knowing something of his early development."');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 3,
    'If writer escapes from early impulses, he will ...',
    '[{"label": "A", "text": "lose his urge to write"}, {"label": "B", "text": "be unable to imagine creatively"}, {"label": "C", "text": "be able to converse with imaginary characters"}, {"label": "D", "text": "be able to influence others"}]',
    'A',
    'The passage states: "if he escapes from his early influences altogether, he will have killed his impulse to write."');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 4,
    'For the author, aesthetic enthusiasm is an important motive for writing because it ...',
    '[{"label": "A", "text": "shapes the thoughts"}, {"label": "B", "text": "creates an artistic piece"}, {"label": "C", "text": "becomes invaluable"}, {"label": "D", "text": "non-utilitarian"}]',
    'D',
    'Aesthetic enthusiasm is described as a "Desire to share an experience which one feels is valuable and ought not to be missed" - i.e., non-utilitarian.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 5,
    'The author strongly advocates the writers to:',
    '[{"label": "A", "text": "avoid any egoistic impression in their work"}, {"label": "B", "text": "be apolitical in their approach"}, {"label": "C", "text": "be contemporary in their treatment of their work"}, {"label": "D", "text": "None of the above"}]',
    'D',
    'None of the listed options match what Orwell advocates.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 6,
    'Which of the following is a synonym for the word "tumultuous"?',
    '[{"label": "A", "text": "Chaotic"}, {"label": "B", "text": "Turbulent"}, {"label": "C", "text": "Disorderly"}, {"label": "D", "text": "All of the above"}]',
    'D',
    'All three (chaotic, turbulent, disorderly) are synonyms for "tumultuous".');

end $$;


-- PASSAGE II - J. Krishnamurti "The Right Kind of Education" (Questions 7-12)
do $$
declare
  v_sec_id uuid;
  v_pass_id uuid;
begin
  select os.id into v_sec_id from public.original_sections os
  join public.original_papers op on op.id = os.paper_id
  where op.set_name = 'D' and op.year = 2025 and os.name = 'English Language';

  insert into public.original_passages (section_id, passage_number, title, source, content)
  values (
    v_sec_id, 2,
    'J. Krishnamurti - The Right Kind of Education',
    'Extracted with edits from ''The Right Kind of Education'' by J. Krishnamurti',
    'The right kind of education consists in understanding the child as he is without imposing upon him an ideal of what we think he should be. To enclose him in the framework of an ideal is to encourage him to conform, which breeds fear and produces in him a constant conflict between what he is and what he should be: and all inward conflicts have their outward manifestations in society. If the parent loves the child, he observes him, he studies his tendencies, his moods, and peculiarities. It is only when one feels no love for the child that one imposes upon him an ideal, for then one''s ambitions are trying to fulfill themselves in him, wanting him to become this or that. If one loves, not the ideal but the child, then there is a possibility of helping him to understand himself as he is.
Ideals are a convenient escape, and the teacher who follows them is incapable of understanding his students and dealing with them intelligently; for him, the future ideal, the what should be, is far more important than the present child. The pursuit of an ideal excludes love, and without love no human problem can be solved. If the teacher is of the right kind, he will not depend on a method, but will study each individual pupil. In our relationship with children and young people, we are not dealing with mechanical devices that can be quickly repaired, but with living beings who are impressionable, volatile, sensitive, afraid, affectionate: and to deal with them, we have to have great understanding, the strength of patience and love. When we lack these, we look to quick and easy remedies and hope for marvellous and automatic results. If we are unaware, mechanical in our attitudes and actions, we fight shy of any demand upon us that is disturbing and that cannot be met by an automatic response, and this is one of our major difficulties in education.'
  )
  returning id into v_pass_id;

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 7,
    'Which of the following correctly reflects the intention of the author of this passage?',
    '[{"label": "A", "text": "The right kind of education for a child cannot be without love, care and understanding"}, {"label": "B", "text": "True education should be governed by a tendency to conform a child to our ideals"}, {"label": "C", "text": "The teacher should focus on how a child should be according to his/her methodology, hope, or expectation"}, {"label": "D", "text": "Parents and teachers should work together collectively to guide a child on what she/he should do as per their ambitions"}]',
    'A',
    'The passage emphasizes understanding the child as he is with love rather than imposing ideals.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 8,
    'In light of the above passage, what will be the result of forcing a child to conform to the framework of an ideal?',
    '[{"label": "A", "text": "It will make the child an ideal child"}, {"label": "B", "text": "It will create confusion and fear in the child"}, {"label": "C", "text": "The child will get into a conflict"}, {"label": "D", "text": "Will discourage the child to conform to the ideal"}]',
    'B',
    'The passage says it "breeds fear and produces in him a constant conflict" - so it creates both confusion and fear.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 9,
    'According to the author, what should be the attitude of a right kind of teacher?',
    '[{"label": "A", "text": "They should not empathise with the students"}, {"label": "B", "text": "They should use modern and scientific methods of teaching"}, {"label": "C", "text": "They should focus on studying each student individually"}, {"label": "D", "text": "They should instill great ideals in the students"}]',
    'C',
    'The passage states: "If the teacher is of the right kind, he will not depend on a method, but will study each individual pupil."');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 10,
    'According to the passage, why do we look for quick and easy remedies and hope for marvellous and automatic results?',
    '[{"label": "A", "text": "Because children are impressionable, volatile, sensitive, and affectionate"}, {"label": "B", "text": "Because of major difficulties in education"}, {"label": "C", "text": "Because we lack intelligence and skills"}, {"label": "D", "text": "Because we lack understanding, patience and love"}]',
    'D',
    'The passage states: "When we lack these [understanding, patience and love], we look to quick and easy remedies."');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 11,
    'What does the passage highlight as the quality of a parent who really desires to understand his child?',
    '[{"label": "A", "text": "They look at their child through the prism of an ideal"}, {"label": "B", "text": "They observe and study the tendencies, moods, and peculiarities of the child"}, {"label": "C", "text": "They love their child to become someone great as per their ambitions"}, {"label": "D", "text": "They encourage the child to find out what she/he is and what she/he should be"}]',
    'B',
    'The passage states: "If the parent loves the child, he observes him, he studies his tendencies, his moods, and peculiarities."');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 12,
    'What is the antonym for the word "volatile"?',
    '[{"label": "A", "text": "Stable"}, {"label": "B", "text": "Steady"}, {"label": "C", "text": "Constant"}, {"label": "D", "text": "All of the above"}]',
    'D',
    'All three (stable, steady, constant) are antonyms of "volatile".');

end $$;

-- PASSAGE III - Swami Vivekananda "Education" (Questions 13-18)
do $$
declare
  v_sec_id uuid;
  v_pass_id uuid;
begin
  select os.id into v_sec_id from public.original_sections os
  join public.original_papers op on op.id = os.paper_id
  where op.set_name = 'D' and op.year = 2025 and os.name = 'English Language';

  insert into public.original_passages (section_id, passage_number, title, source, content)
  values (
    v_sec_id, 3,
    'Swami Vivekananda - Education',
    'Extracted with edits from ''Education'' by Swami Vivekananda',
    'Education is not the amount of information that is put into your brain and runs riot there, undigested, all your life. We must have life-building, man-making, character-making assimilation of ideas. If education were identical with information, the libraries are the sages in the world and encyclopaedias are the rishis. Getting by heart the thoughts of others in a foreign language and stuffing your brain with them and taking some University degree, you consider yourself educated. Is this education? What is the goal of your education? Open your eyes and see what a piteous cry for food is rising in the land of Bharata, proverbial for its food. Will your education fulfill this want?
We want that education by which character is formed, strength of mind is increased, the intellect is expanded and by which one can stand on one''s own feet. What we need to study independent of foreign control, different branches of the knowledge that is our own, and with it the English language and Western science; we need technical education and all else that will develop industries so that men instead of seeking for service may earn enough to provide for themselves and save against a rainy day. The end of all education, all training, should be man-making. The end and aim of all training are to make the man grow. The training by which the current expression of will are brought under control and become fruitful, is called education. What our country now wants are muscles of iron and nerves of steel, gigantic wills, which nothing can resist, which can penetrate into the mysteries and secrets of the universe and will accomplish their purpose in any fashion, even if it meant going down to the bottom of the ocean, meeting death face to face.
There is only one method of attaining knowledge. It is by concentration. The very essence of education is concentration of mind. From the lowest to the highest man, all have to use the same method to attain knowledge. The chemist who works in the laboratory concentrates on elements to analyze them. Knowledge is acquired by concentration.'
  )
  returning id into v_pass_id;

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 13,
    'Education, as described by the author means:',
    '[{"label": "A", "text": "Information"}, {"label": "B", "text": "Library"}, {"label": "C", "text": "Degrees"}, {"label": "D", "text": "None of the above"}]',
    'D',
    'The author explicitly rejects all three - education is "life-building, man-making, character-making assimilation of ideas."');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 14,
    'As per the author, the aim of education should be:',
    '[{"label": "A", "text": "to help a person build his/her character"}, {"label": "B", "text": "to help a person earn his/her livelihood"}, {"label": "C", "text": "to help a person develop his/her intellect"}, {"label": "D", "text": "All of the above"}]',
    'D',
    'The passage mentions character formation (man-making), livelihood (develop industries), and intellect expansion.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 15,
    'According to the author the country wants:',
    '[{"label": "A", "text": "massive will power"}, {"label": "B", "text": "spirit of philanthropy"}, {"label": "C", "text": "iron and steel industries"}, {"label": "D", "text": "All of the above"}]',
    'A',
    'The passage says: "What our country now wants are muscles of iron and nerves of steel, gigantic wills" - i.e., massive will power.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 16,
    'According to the author, we need to study:',
    '[{"label": "A", "text": "English Language"}, {"label": "B", "text": "Technical Education"}, {"label": "C", "text": "Western Science"}, {"label": "D", "text": "All of the above"}]',
    'D',
    'The passage states: "we need to study... the English language and Western science; we need technical education."');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 17,
    'According to the author, which among the following is key to attain knowledge?',
    '[{"label": "A", "text": "University Degrees"}, {"label": "B", "text": "Library"}, {"label": "C", "text": "Concentration of mind"}, {"label": "D", "text": "Hard work and sports training"}]',
    'C',
    'The passage states: "There is only one method of attaining knowledge. It is by concentration. The very essence of education is concentration of mind."');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 18,
    'Which of the following words is related to the word "assimilation"?',
    '[{"label": "A", "text": "Integration"}, {"label": "B", "text": "Adjustment"}, {"label": "C", "text": "Acclimatization"}, {"label": "D", "text": "All of the above"}]',
    'D',
    'All three (integration, adjustment, acclimatization) are related to the concept of assimilation.');

end $$;

-- PASSAGE IV - R.K. Narayan "An Astrologer''s Day" (Questions 19-24)
do $$
declare
  v_sec_id uuid;
  v_pass_id uuid;
begin
  select os.id into v_sec_id from public.original_sections os
  join public.original_papers op on op.id = os.paper_id
  where op.set_name = 'D' and op.year = 2025 and os.name = 'English Language';

  insert into public.original_passages (section_id, passage_number, title, source, content)
  values (
    v_sec_id, 4,
    'R.K. Narayan - An Astrologer''s Day',
    'Extracted with edits from ''An Astrologer''s Day'' by R.K. Narayan',
    'Punctually at midday, he opened his bag and spread out his professional equipment, which consisted of a dozen cowrie shells, a square piece of cloth with obscure mystic charts on it, a notebook, and a bundle of palmyra writing. His forehead was dazzling with sacred ash and vermilion, and his eyes sparkled with a sharp, abnormal gleam which was really an outcome of a continual searching look for customers, but which his simple clients took to be a prophetic light and felt comforted. The power of his eyes was considerably enhanced by their position - placed as they were between the painted forehead and the dark whiskers which streamed down his cheeks: even a half-wit''s eyes would sparkle in such a setting. People were attracted to him as bees are attracted to cosmos or dahlia stalks. He sat under the boughs of a spreading tamarind tree which flanked a path running through the town hall park. It was a remarkable place in many ways: a surging crowd was always moving up and down this narrow road morning till night. A variety of trades and occupations was represented all along its way: medicine sellers, sellers of stolen hardware and junk, magicians, and, above all, an auctioneer of cheap cloth, who created enough din all day to attract the whole town. Next to him in vociferousness came a vendor of fried groundnut, who gave his ware a fancy name each day, calling it "Bombay Ice Cream" one day, and on the next "Delhi Almond," and on the third "Raja''s Delicacy," and so on and so forth, and people flocked to him. A considerable portion of this crowd dallied before the astrologer too. The astrologer transacted his business by the light of a flare which crackled and smoked up above the groundnut heap nearby.'
  )
  returning id into v_pass_id;

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 19,
    'Which among the following is the meaning of the expression "vociferousness"?',
    '[{"label": "A", "text": "Expressing opinions or feelings in a loud and confident way"}, {"label": "B", "text": "Words that are spoken or sung to have a magical effect"}, {"label": "C", "text": "Willing or prepared to do something"}, {"label": "D", "text": "To hang about aimlessly"}]',
    'A',
    'Vociferousness means expressing opinions or feelings in a loud and confident manner.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 20,
    'When did the astrologer usually start his day''s business?',
    '[{"label": "A", "text": "When people are attracted to him as bees"}, {"label": "B", "text": "When the surging crowd moves up and down the road"}, {"label": "C", "text": "Punctually at midday"}, {"label": "D", "text": "By the light of a flare"}]',
    'C',
    'The passage opens with: "Punctually at midday, he opened his bag and spread out his professional equipment."');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 21,
    'What was considered as a prophetic light by the simple clients of the astrologer?',
    '[{"label": "A", "text": "The resplendent forehead of the astrologer with sacred ash and vermillion"}, {"label": "B", "text": "The sparkling eyes of the astrologer with an abnormal gleam"}, {"label": "C", "text": "The dark whiskers which streamed down the cheeks of the astrologer"}, {"label": "D", "text": "The saffron coloured turban around the head of astrologer"}]',
    'B',
    'The passage states: "his eyes sparkled with a sharp, abnormal gleam... which his simple clients took to be a prophetic light."');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 22,
    'Which among the following is the word for the phrase "Bright and colourful in an impressive way"?',
    '[{"label": "A", "text": "Mystic"}, {"label": "B", "text": "Flare"}, {"label": "C", "text": "Sparkle"}, {"label": "D", "text": "Dazzling"}]',
    'D',
    'The passage describes his forehead as "dazzling with sacred ash and vermilion".');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 23,
    'Which among the following is not a trade or occupation represented in the pathway running through the town hall park?',
    '[{"label": "A", "text": "Magicians"}, {"label": "B", "text": "Medicine sellers"}, {"label": "C", "text": "Auctioneers of cheap Bags"}, {"label": "D", "text": "Sellers of Stolen Hardware"}]',
    'C',
    'The passage mentions medicine sellers, sellers of stolen hardware, magicians, and auctioneer of cheap cloth - not cheap bags.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 24,
    'Who among the following used names like "Bombay Ice Cream", "Delhi Almond," and "Raja''s Delicacy" to attract the crowd?',
    '[{"label": "A", "text": "The sellers of cheap clothes"}, {"label": "B", "text": "The sellers of Medicine"}, {"label": "C", "text": "The ice cream seller"}, {"label": "D", "text": "The groundnut seller"}]',
    'D',
    'The passage states: "a vendor of fried groundnut, who gave his ware a fancy name each day."');

end $$;

-- ============================================================================
-- CURRENT AFFAIRS INCLUDING GENERAL KNOWLEDGE
-- ============================================================================

-- PASSAGE V - Nari Shakti Vandan Adhiniyam (Questions 25-28)
do $$
declare
  v_sec_id uuid;
  v_pass_id uuid;
begin
  select os.id into v_sec_id from public.original_sections os
  join public.original_papers op on op.id = os.paper_id
  where op.set_name = 'D' and op.year = 2025 and os.name = 'Current Affairs Including General Knowledge';

  insert into public.original_passages (section_id, passage_number, title, source, content)
  values (
    v_sec_id, 5,
    'Nari Shakti Vandan Adhiniyam 2023 - Women''s Reservation',
    'Extracted, with edits and revisions, from various sources including Rudolf C Heredia and Soumya Bhowmick',
    'The "Nari Shakti Vandan Adhiniyam", 2023 Act received near-unanimous support in both the Lok Sabha and the Rajya Sabha. The legislation mandates the reservation of one-third of all seats in the Lok Sabha, state legislative assemblies, and Delhi (as a union territory with an elected assembly) for women. This linking of the implementation of the Act to the implementing of two long-term exercises of census and delimitation, makes little sense to many, and sounds quite like empowerment delayed for now.
In a 2012 article "Holding Up Half the Sky: Reservations for Women in India", Rudolf C Heredia breaks down the common misconceptions that cloud our understanding of women''s political participation- "When women do attain a national leadership role it is often because they have inherited the mantle from their fathers or husbands, rather than as persons in their own right and are then projected as matriarchs, part of the joint family, complementary to the patriarchy rather than a challenge to it."
In "Equality versus Empowerment: Women in Indian Legislature", 2023, Soumya Bhowmick makes the case for going a step beyond quotas, and to turn our attention to the complexities that shape women''s agency in the country. This, he argues, would require a bottoms-up approach, rather than merely handing out reservations in a top-down manner. "In a country like India with a considerably large heterogeneous population, the dissemination of legislative power would be insufficient to protect the interests of minority groups such as women, Scheduled Castes, and Scheduled Tribes." He concludes that "implementing the idea of reservation for women would bring about descriptive representation, but its transformation into substantive representation would depend on the change in the attitudes of the people."
While the reservation of one-third of seats for women belonging to the scheduled castes and tribes under the amendment to article 330a and 332 of the constitution is a welcome step, it remains to be seen whether it fully acknowledges the complex interplay of hierarchies, socio-political relationships which also affect the extent and nature of complications that surround effective realisation of women''s politics for Indian politics to emerge as a truly emancipatory space.'
  )
  returning id into v_pass_id;

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 25,
    'The Nari Shakti Vandan Adhiniyam 2023:',
    '[{"label": "A", "text": "Will come to force from Jan 2025"}, {"label": "B", "text": "Will come to force after all the States and UTs approve it"}, {"label": "C", "text": "Will come to force after Census"}, {"label": "D", "text": "None of the above"}]',
    'C',
    'The passage states implementation is linked to "two long-term exercises of census and delimitation" - it will come into force after the census.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 26,
    'As per Rudolf Heredia women''s political leadership depends upon :',
    '[{"label": "A", "text": "Mentorship of spouse''s political affiliations"}, {"label": "B", "text": "Parental guidance"}, {"label": "C", "text": "Property inheritance"}, {"label": "D", "text": "None of the above"}]',
    'D',
    'Heredia argues women often inherit leadership from fathers/husbands rather than as persons in their own right, but none of the options A-C precisely captures this.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 27,
    'According to Soumya Bhowmick the quotas for women should:',
    '[{"label": "A", "text": "Require a top down model"}, {"label": "B", "text": "Fulfill a descriptive representation"}, {"label": "C", "text": "Transform to substantive representation"}, {"label": "D", "text": "To be implemented homogeneously"}]',
    'B',
    'Bhowmick says quotas bring about "descriptive representation" but transformation into substantive representation depends on change in attitudes.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 28,
    'The amendment to the Art. 330 (a) & 332 aims to:',
    '[{"label": "A", "text": "Appoint Rajya Sabha members based on cultural diversity"}, {"label": "B", "text": "Quota for women Governors"}, {"label": "C", "text": "Women sportspersons"}, {"label": "D", "text": "None of the above"}]',
    'D',
    'The amendments to Articles 330(a) and 332 reserve one-third of seats for women belonging to SC/ST in Lok Sabha and State Assemblies - none of the options A-C match.');

end $$;

-- PASSAGE VI - Paris Olympics 2024 (Questions 29-34)
do $$
declare
  v_sec_id uuid;
  v_pass_id uuid;
begin
  select os.id into v_sec_id from public.original_sections os
  join public.original_papers op on op.id = os.paper_id
  where op.set_name = 'D' and op.year = 2025 and os.name = 'Current Affairs Including General Knowledge';

  insert into public.original_passages (section_id, passage_number, title, source, content)
  values (
    v_sec_id, 6,
    'Paris Olympics 2024 - A Post-Pandemic Spectacle',
    'Extracted, with edits and revision, from "The Olympics are nearly here. For a weary world, they can''t come soon enough", NBCNEWS',
    'In keeping with the slogan for this year''s Olympics, "Games Wide Open," the opening ceremony took place outside a stadium setting by the river for the first time. In many respects, the Paris Games turned out to be one of the most elaborate cultural rituals since Covid swept across the world beginning in late 2019. Health restrictions forced the organizers of Tokyo 2020 and Beijing 2022 to sharply limit the scale of the festivities, with events largely closed to the public. Paris 2024, powered in part by pent-up demand for communal experiences, symbolized an international post-pandemic vibe shift.
The International Olympic Committee and French officials managed strict security measures in place. Yet the recent history of violence in France - including the 2015 terror attack in Paris that left 138 people dead and at least 416 injured - stalked public consciousness prior to the games. The geopolitical backdrop for the Paris Games was no less troubling. The war between Israel and Hamas which had crossed the six-month mark, raised fears of a protracted conflict and wider regional instability. The devastation in the Gaza Strip has provoked international outrage, isolating Israel on the global stage. Meanwhile, Russia continues to gain ground in its military offensive against Ukraine as some Western nations worry about the rise of authoritarianism. These international crises raised serious concerns that could come into play during the Games in the form of protests and other political demonstrations.
Nevertheless, Olympics organizers put up a show that stunned the throngs assembled on the boulevards of Paris, not to mention the millions of people who watched the Games unfold on their televisions and mobile devices. At the Paris 2024 Olympics, India secured a total of six medals: one silver and five bronze which was one down from the highest haul of medals from the previous Olympics. Neeraj Chopra earned a silver in men''s javelin with an 89.45 throw, narrowly missing gold to Pakistan''s Arshad Nadeem. Shooter Manu Bhaker made history by clinching bronze in the women''s 10m air pistol, becoming the first Indian woman to win a medal in Olympic shooting. The men''s hockey team achieved a second consecutive bronze, defeating Spain 2-1, with captain Harmanpreet Singh scoring both goals.'
  )
  returning id into v_pass_id;

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 29,
    'India won a back-to-back Olympics hockey medal at:',
    '[{"label": "A", "text": "Beijing and Paris"}, {"label": "B", "text": "Rio and Beijing"}, {"label": "C", "text": "Beijing and Tokyo"}, {"label": "D", "text": "None of the above"}]',
    'D',
    'India won bronze in Tokyo 2020 and Paris 2024 - not Beijing.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 30,
    'According to the passage, what is the peculiarity of the Paris Olympics, 2024?',
    '[{"label": "A", "text": "It symbolized an international post-pandemic vibe shift"}, {"label": "B", "text": "The opening ceremony took place outside a stadium"}, {"label": "C", "text": "It is one of the most elaborate cultural rituals since Covid"}, {"label": "D", "text": "All of the above"}]',
    'D',
    'All three features are mentioned: post-pandemic vibe shift, opening ceremony by the river, and elaborate cultural rituals since Covid.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 31,
    'Which of the following incidents support the argument that "the geopolitical backdrop for the Paris Games is no less troubling"?',
    '[{"label": "A", "text": "Israel-Hamas conflict"}, {"label": "B", "text": "The immigrant influx in to Europe"}, {"label": "C", "text": "Political stability of French government"}, {"label": "D", "text": "All of the above"}]',
    'A',
    'The passage specifically mentions the Israel-Hamas war and the Russia-Ukraine war as troubling geopolitical backdrop.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 32,
    'Which one of the following is true?',
    '[{"label": "A", "text": "Tokyo Olympics was better than Beijing Olympics"}, {"label": "B", "text": "Spectators thronged for a post Covid sporting experience"}, {"label": "C", "text": "Olympic games are unaffected by conflicts in a region"}, {"label": "D", "text": "All of the above"}]',
    'B',
    'The passage states Paris 2024 was "powered in part by pent-up demand for communal experiences" indicating spectators thronged for a post-Covid experience.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 33,
    'The highest Olympic medal tally for India was at:',
    '[{"label": "A", "text": "Beijing"}, {"label": "B", "text": "Rio"}, {"label": "C", "text": "London"}, {"label": "D", "text": "Tokyo"}]',
    'D',
    'The passage says Paris (6 medals) was "one down from the highest haul of medals from the previous Olympics" - Tokyo 2020 where India won 7 medals.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 34,
    'Where is the opening ceremony of the Paris Olympics, 2024, held?',
    '[{"label": "A", "text": "Seine River"}, {"label": "B", "text": "Versailles Palace"}, {"label": "C", "text": "Eiffel Tower"}, {"label": "D", "text": "Arc de Triomphe"}]',
    'A',
    'The passage states: "the opening ceremony took place outside a stadium setting by the river for the first time" - referring to the Seine River.');

end $$;

-- PASSAGE VII - Civil Disobedience Movement & Indian Nationalism (Questions 35-40)
do $$
declare
  v_sec_id uuid;
  v_pass_id uuid;
begin
  select os.id into v_sec_id from public.original_sections os
  join public.original_papers op on op.id = os.paper_id
  where op.set_name = 'D' and op.year = 2025 and os.name = 'Current Affairs Including General Knowledge';

  insert into public.original_passages (section_id, passage_number, title, source, content)
  values (
    v_sec_id, 7,
    'Civil Disobedience Movement & Indian Industrialists',
    'Excerpted from Chapter II - Nationalism in India, India and the Contemporary World, NCERT',
    'During the First World War, Indian merchants and industrialists wanted protection against imports of foreign goods, and a rupee-sterling foreign exchange ratio that would discourage imports. To organise business interests, they formed the Indian Industrial and Commercial Congress in 1920 and the Federation of the Indian Chamber of Commerce and Industries (FICCI) in 1927. The industrialists attacked colonial control over the Indian economy, and supported the Civil Disobedience Movement when it was first launched. They gave financial assistance and refused to buy or sell imported goods. After the failure of the Round Table Conference, business groups were no longer uniformly enthusiastic. They were apprehensive of the spread of militant activities, and worried about prolonged disruption of business, as well as of the growing influence of socialism amongst the younger members of the Congress.
The industrial working classes did not participate in the Civil Disobedience Movement in large numbers, except in the Nagpur region. As the industrialists came closer to the Congress, workers stayed aloof. But inspite of that, some workers did participate in the Civil Disobedience Movement, selectively adopting some of the ideas of the Gandhian programme, like boycott of foreign goods, as part of their own movements against low wages and poor working conditions. There were strikes by railway workers in 1930 and dockworkers in 1932. In 1930, thousands of workers in Chotanagpur tin mines wore Gandhi caps and participated in protest rallies and boycott campaigns. But the Congress was reluctant to include workers'' demands as part of its programme of struggle. It felt that this would alienate industrialists and divide the anti-imperial forces.
Another important feature of the Civil Disobedience Movement was the large-scale participation of women. During Gandhiji''s salt march, thousands of women came out of their homes to listen to him. They participated in protest marches, manufactured salt, and picketed foreign cloth and liquor shops. Many went to jail.'
  )
  returning id into v_pass_id;

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 35,
    'Which event in Indian history marked the beginning of the Civil Disobedience Movement?',
    '[{"label": "A", "text": "Launch of Non-Cooperation Movement"}, {"label": "B", "text": "Commencing of Dandi March"}, {"label": "C", "text": "Signing of Gandhi-Irwin Pact"}, {"label": "D", "text": "Withdrawal of Non-Cooperation Movement"}]',
    'B',
    'The Civil Disobedience Movement began with Gandhiji''s Dandi March (Salt March) in 1930. The passage mentions "Gandhiji''s salt march" as part of this movement.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 36,
    'Which of the following is true in the context of civil disobedience movement?',
    '[{"label": "A", "text": "The Indian industrialist preferred partnership with MNCs"}, {"label": "B", "text": "The Indian industrialist were concerned of disruption of business"}, {"label": "C", "text": "The working class rejected the civil disobedience movement"}, {"label": "D", "text": "The Round Table Conference was a partial success"}]',
    'B',
    'The passage states businessmen were "apprehensive of the spread of militant activities, and worried about prolonged disruption of business."');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 37,
    'Which of the following was the predicament for Congress?',
    '[{"label": "A", "text": "Danger of division of opposition to the British Government"}, {"label": "B", "text": "Loss of faith by marginalised sections in Congress"}, {"label": "C", "text": "Falling value of Rupee against Sterling"}, {"label": "D", "text": "None of the above"}]',
    'A',
    'Congress was reluctant to include workers'' demands fearing it would "alienate industrialists and divide the anti-imperial forces."');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 38,
    'Which of the following statements is correct with reference to the Civil Disobedience Movement?',
    '[{"label": "A", "text": "It encouraged militancy among workers"}, {"label": "B", "text": "Breaking of the salt law, manufacturing salt, and demonstrating it in front of government salt factories"}, {"label": "C", "text": "It urged the industrialists to accept socialism"}, {"label": "D", "text": "All of the above"}]',
    'B',
    'The passage mentions women "manufactured salt" and participated in protest marches - breaking the salt law was central. The movement did not encourage militancy or urge socialism.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 39,
    'Which among the following mass movement was supported by the Indian industrialists?',
    '[{"label": "A", "text": "Home Rule Movement"}, {"label": "B", "text": "Civil Disobedience Movement"}, {"label": "C", "text": "Non-Cooperation Movement"}, {"label": "D", "text": "Quit India Movement"}]',
    'B',
    'The passage states industrialists "supported the Civil Disobedience Movement when it was first launched."');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 40,
    'Which of the following can be considered as major outcome of civil disobedience movement?',
    '[{"label": "A", "text": "a partial support of working class"}, {"label": "B", "text": "Galvanising women in political sphere"}, {"label": "C", "text": "Socialistic influence among the Congress cadre"}, {"label": "D", "text": "All of the above"}]',
    'D',
    'The passage mentions all three: partial working class support (railway/dockworkers strikes), large-scale women participation, and socialist influence among younger Congress members.');

end $$;

-- PASSAGE VIII - BRICS Summit & India-China Relations (Questions 41-46)
do $$
declare
  v_sec_id uuid;
  v_pass_id uuid;
begin
  select os.id into v_sec_id from public.original_sections os
  join public.original_papers op on op.id = os.paper_id
  where op.set_name = 'D' and op.year = 2025 and os.name = 'Current Affairs Including General Knowledge';

  insert into public.original_passages (section_id, passage_number, title, source, content)
  values (
    v_sec_id, 8,
    'BRICS Summit - India-China Relations',
    'Excerpts from "Putin scores a BRICS win with rare Xi and Modi show of harmony" by Vladimir Soldatkin and Guy Faulconbridge, Reuters, October 23, 2024',
    'Chinese President Xi Jinping and Indian Prime Minister Narendra Modi used a BRICS summit in Russia recently to showcase ambitions for a more harmonious relationship between the world''s two most populous countries after years of animosity.
The meeting between Xi and Modi, who have not held formal talks for five years, was one highlight of a summit. BRICS also gave an opportunity to the Russian President Vladimir Putin for showcasing that the West had failed to isolate Russia over the Ukraine war.
A final communique listed a number of projects aimed at facilitating trade between BRICS nations - including an alternative payment system to the dollar - but did not include details or timelines.
Just two days after New Delhi announced that it had reached a deal with Beijing to resolve a four-year military stand-off on their disputed Himalayan frontier, Xi told Modi that they should enhance communication and cooperation and effectively manage differences.
BRICS - an idea thought up inside Goldman Sachs two decades ago to describe the growing economic clout of China and other major emerging markets - is now a group that accounts for 45% of the world''s population and 35% of the global economy.
Former Goldman Sachs economist Jim O''Neill, who coined the BRIC term in 2001, told Reuters that he had little optimism for the BRICS club as long as China and India remained so divided.
"It seems to me basically to be a symbolic annual gathering where important emerging countries, particularly noisy ones like Russia, but also China, can basically get together and highlight how good it is to be part of something that doesn''t involve the U.S. and that global governance isn''t good enough,"
The 43-page final communique from the summit ranged from geopolitics and narcotics to artificial intelligence and even the preservation of Big Cats, but lacked detail on some major issues. It mentioned Ukraine just once.'
  )
  returning id into v_pass_id;

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 41,
    'Which statement reflects as a critique from the Western Economists?',
    '[{"label": "A", "text": "BRICS currency cannot displace Dollars"}, {"label": "B", "text": "Asian economies will not impact western economy"}, {"label": "C", "text": "Indo-China conflicts will impact progress of BRICS"}, {"label": "D", "text": "All of the above"}]',
    'C',
    'Jim O''Neill said he had "little optimism for the BRICS club as long as China and India remained so divided."');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 42,
    'The emergence of BRICS signals:',
    '[{"label": "A", "text": "Asian consolidation of economic power"}, {"label": "B", "text": "Diminishing European dominance"}, {"label": "C", "text": "Revival of Nonaligned movement"}, {"label": "D", "text": "A geo-politics without US dominance"}]',
    'D',
    'The passage quotes that BRICS highlights "how good it is to be part of something that doesn''t involve the U.S." - signalling geopolitics without US dominance.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 43,
    'Which one of the below is an outcome of 16th BRICS meeting?',
    '[{"label": "A", "text": "Proposal to end Russia-Ukraine war"}, {"label": "B", "text": "To expand BRICS by including Scandinavian countries"}, {"label": "C", "text": "To recognise China''s claim of Taiwan"}, {"label": "D", "text": "Reducing tension between India and China"}]',
    'D',
    'The meeting between Xi and Modi after 5 years helped reduce tensions, with a deal to resolve the four-year military stand-off.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 44,
    'The 16th BRICS achieved the following:',
    '[{"label": "A", "text": "Launch of BRICS currency"}, {"label": "B", "text": "De-escalation of Russian-Ukrainian conflict"}, {"label": "C", "text": "Diplomatic dialogue between India and China"}, {"label": "D", "text": "All of the above"}]',
    'C',
    'The key outcome was the Xi-Modi meeting which facilitated diplomatic dialogue between India and China.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 45,
    'What does the letter "S" in BRICS stand for?',
    '[{"label": "A", "text": "Saudi Arabia"}, {"label": "B", "text": "Singapore"}, {"label": "C", "text": "South America"}, {"label": "D", "text": "South Africa"}]',
    'D',
    'BRICS stands for Brazil, Russia, India, China, South Africa.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 46,
    'The initiative of Big Cats Alliance refers to:',
    '[{"label": "A", "text": "Lions, Tigers and Jaguar"}, {"label": "B", "text": "Tigers, Jaguar and Leopard"}, {"label": "C", "text": "Lions, Cheetah and Snow Leopard"}, {"label": "D", "text": "All of the above"}]',
    'C',
    'The passage mentions "preservation of Big Cats" as part of the communique. The International Big Cats Alliance (IBCA) focuses on lions, cheetahs, and snow leopards (and other big cats).');

end $$;

-- PASSAGE IX - Article 370 & Jammu & Kashmir Reorganization (Questions 47-52)
do $$
declare
  v_sec_id uuid;
  v_pass_id uuid;
begin
  select os.id into v_sec_id from public.original_sections os
  join public.original_papers op on op.id = os.paper_id
  where op.set_name = 'D' and op.year = 2025 and os.name = 'Current Affairs Including General Knowledge';

  insert into public.original_passages (section_id, passage_number, title, source, content)
  values (
    v_sec_id, 9,
    'Article 370 & J&K Reorganization Act 2019',
    'Extracted from the article of Press Information Bureau, published by the Union Home Ministry on 2nd November 2019',
    'On the recommendation of Parliament, the President of India effectively abrogated Article 370 of the Indian Constitution and gave assent to the Jammu and Kashmir Reorganization Act, 2019. The former state of Jammu & Kashmir has been reorganized as the new Union Territory of Jammu and Kashmir and the new Union Territory of Ladakh on 31st October 2019.
The new Union Territory of Ladakh consists of two districts of Kargil and Leh. The rest of the former State of Jammu and Kashmir is in the new Union Territory of Jammu and Kashmir.
By 2019, the state government of former Jammu and Kashmir had reorganized the areas of these 14 districts into 28 districts. The names of the new districts are as follows - Kupwara, Bandipur, Ganderbal, Srinagar, Budgam, Pulwama, Shupian, Kulgam, Rajouri, Ramban, Doda, Kishtivar, Samba and Kargil.
Out of these, Kargil district was carved out from the area of Leh and Ladakh district. The Leh district of the new Union Territory of Ladakh has been defined in the Jammu and Kashmir Reorganization (Removal of Difficulties) Second Order, 2019, issued by the President of India, to include the areas of the districts of Gilgit, Gilgit Wazarat, Chilhas and Tribal Territory of 1947, in addition to the remaining areas of Leh and Ladakh districts of 1947, after carving out the Kargil District.'
  )
  returning id into v_pass_id;

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 47,
    'Which of the following statements regarding Article 370 of the Constitution of India is correct?',
    '[{"label": "A", "text": "It gave special status to the erstwhile state of Jammu and Kashmir"}, {"label": "B", "text": "It created a special tribunal for the state of Jammu and Kashmir on certain occasions"}, {"label": "C", "text": "It introduced Goods and Services Tax in Jammu and Kashmir"}, {"label": "D", "text": "It confers special jurisdiction on the Supreme Court on matters coming from Jammu & Kashmir"}]',
    'A',
    'Article 370 granted special autonomous status to the erstwhile state of Jammu and Kashmir.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 48,
    'The Jammu and Kashmir Reorganisation Act, 2019, divided the erstwhile State of Jammu and Kashmir into which of the following?',
    '[{"label": "A", "text": "2 States"}, {"label": "B", "text": "1 State and 1 Union Territory"}, {"label": "C", "text": "2 Union Territories"}, {"label": "D", "text": "1 State and 2 Union Territories"}]',
    'C',
    'The Act reorganized the state into two Union Territories: Jammu and Kashmir (with legislature) and Ladakh (without legislature).');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 49,
    'Which of the following Union Territories of India has a legislative assembly?',
    '[{"label": "A", "text": "Andaman and Nicobar Islands"}, {"label": "B", "text": "Jammu and Kashmir"}, {"label": "C", "text": "Daman and Diu"}, {"label": "D", "text": "Lakshadweep"}]',
    'B',
    'Jammu and Kashmir is a Union Territory with a legislative assembly. Delhi and Puducherry also have legislatures.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 50,
    'How many States and Union Territories are present in India?',
    '[{"label": "A", "text": "28 states and 8 Union territories"}, {"label": "B", "text": "27 states and 8 Union territories"}, {"label": "C", "text": "28 states and 7 Union territories"}, {"label": "D", "text": "27 states and 7 Union territories"}]',
    'A',
    'India has 28 states and 8 Union Territories (after the reorganization of J&K and Ladakh).');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 51,
    'Which among the following is the capital city of the Union Territory of Ladakh?',
    '[{"label": "A", "text": "Leh"}, {"label": "B", "text": "Changtang"}, {"label": "C", "text": "Dras"}, {"label": "D", "text": "Nubra"}]',
    'A',
    'Leh is the capital of the Union Territory of Ladakh.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 52,
    'Which of the following is false?',
    '[{"label": "A", "text": "Kargil was formerly a union territory"}, {"label": "B", "text": "Ladakh is administered by J&K assembly"}, {"label": "C", "text": "Fifteen new districts were formed to be part of J&K in 2019"}, {"label": "D", "text": "All of the above"}]',
    'D',
    'All three statements are false: Kargil was a district (not UT), Ladakh is a separate UT (not administered by J&K assembly), and 14 districts were reorganized into 28 (not 15 new ones).');

end $$;

-- ============================================================================
-- LEGAL REASONING — Passages & Questions
-- ============================================================================

-- PASSAGE X - Public Examinations (Prevention of Unfair Means) Act, 2024 (Questions 53-57)
do $$
declare
  v_sec_id uuid;
  v_pass_id uuid;
begin
  select os.id into v_sec_id from public.original_sections os
  join public.original_papers op on op.id = os.paper_id
  where op.set_name = 'D' and op.year = 2025 and os.name = 'Legal Reasoning';

  insert into public.original_passages (section_id, passage_number, title, source, content)
  values (
    v_sec_id, 10,
    'Public Examinations (Prevention of Unfair Means) Act, 2024',
    'Extracted, with edits and revisions from "Act that Punishes Organized Cheating in Government Exams Comes into Effect" published in The Hindu dated 22-06-2024',
    'The Public Examinations (Prevention of Unfair Means) Act, 2024 that has provision for up to five years'' imprisonment and a fine of up to Rs. 1 crore for malpractices and organized cheating in government recruitment exams was notified by the Union government and came into effect from June 21, 2024. The Bill had received assent from the President of India on the 13th February 2024. The Public Examinations (Prevention of Unfair Means) Act, 2024 mentions punishments for "leakage of question paper or answer key", "directly or indirectly assisting the candidate in any manner unauthorisedly in the public examination" and "tampering with the computer network or a computer resource or a computer system" as offences done by a person, group of persons or institutions. Besides these, "creation of fake website to cheat or for monetary gain", "conduct of fake examination, issuance of fake admit cards or offer letters to cheat or for monetary gain" and "manipulation in seating arrangements, allocation of dates and shifts for the candidates to facilitate adopting unfair means in examinations" are also among the offences punishable under the law.
"Any person or persons resorting to unfair means and offences under this Act shall be punished with imprisonment for a term not less than three years but which may extend to five years and with fine up to Rs. 10 lakh," said the Act. A service provider, engaged by the public examination authority for conduct of examinations, shall also be liable to be punished with imposition of a fine up to Rs. 1 crore "and proportionate cost of examination shall also be recovered" from it, according to the Act. Such service providers shall also be barred from being assigned with any responsibility for the conduct of any public examination for a period of four years.'
  )
  returning id into v_pass_id;

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 53,
    'A Bill becomes an Act only when ...',
    '[{"label": "A", "text": "Both the houses of the Parliament pass with simple majority"}, {"label": "B", "text": "Both the houses of the Parliament pass with absolute majority"}, {"label": "C", "text": "When the Prime Minister of India gives his approval"}, {"label": "D", "text": "When the President of India gives the Assent"}]',
    'D',
    'A Bill becomes an Act only after receiving the assent of the President of India. The passage confirms this: "The Bill had received assent from the President of India on the 13th February 2024."');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 54,
    'A service provider, engaged by the public examination authority for conduct of examinations, indirectly helped his family member by giving hint on questions that were supposed to be asked in the examination shall:',
    '[{"label": "A", "text": "be liable to be punished with imposition of a fine of Rs. 1 crore"}, {"label": "B", "text": "be liable to be punished with imposition of a fine upto Rs. 1 crore"}, {"label": "C", "text": "be liable to be punished with imposition of a fine upto Rs. 1 crore and the entire cost of conduct of the examination"}, {"label": "D", "text": "None of the above"}]',
    'B',
    'The Act states service providers shall be liable to fine up to Rs. 1 crore. Option C adds "entire cost" but the Act says "proportionate cost of examination."');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 55,
    'An invigilator of a public examination found guilty of manipulating the seating arrangement to favour his relative writing the public examination is punished by the Court. Which among the following is the appropriate punishment as per the punishment mentioned in the above passage?',
    '[{"label": "A", "text": "Imprisonment for 1 year and fine of 1 lakh"}, {"label": "B", "text": "Imprisonment for 2 years and a fine of 10 lakhs"}, {"label": "C", "text": "Imprisonment for 3 years and fine of 15 lakhs"}, {"label": "D", "text": "Imprisonment for 4 years and fine of 5 lakhs"}]',
    'C',
    'The Act prescribes imprisonment "not less than three years but which may extend to five years and with fine up to Rs. 10 lakh" for unfair means. Manipulation of seating arrangement is an offence under the Act.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 56,
    'Identify which of the following is not an unfair means relating to the conduct of a public examination?',
    '[{"label": "A", "text": "Coaching Centre conducting mock tests for students"}, {"label": "B", "text": "The Coaching Centre offering help to its students during the examination"}, {"label": "C", "text": "The Centre Superintendent of the public examination on the request of the Coaching Centre provides seating arrangement of all its students in one hall"}, {"label": "D", "text": "The Centre Superintendent of the public examination indirectly assisting the candidate"}]',
    'A',
    'Conducting mock tests is a legitimate coaching activity, not an unfair means. The other options describe assisting candidates or manipulating seating arrangements, which are offences under the Act.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 57,
    'Who among the following is not a service provider in the context of a public examination?',
    '[{"label": "A", "text": "Coaching Centre which prepares students for passing in the public examination"}, {"label": "B", "text": "Printing Press where the question paper of the public examination is printed"}, {"label": "C", "text": "The Software Company that manages the website of the public examination"}, {"label": "D", "text": "The Company which scans the OMR sheets of the public examination"}]',
    'A',
    'A service provider is "engaged by the public examination authority for conduct of examinations" - printing press, software company, and OMR scanning company are service providers. A coaching centre is not engaged by the examination authority.');

end $$;

-- PASSAGE XI - Children & Criminal Justice System (Questions 58-63)
do $$
declare
  v_sec_id uuid;
  v_pass_id uuid;
begin
  select os.id into v_sec_id from public.original_sections os
  join public.original_papers op on op.id = os.paper_id
  where op.set_name = 'D' and op.year = 2025 and os.name = 'Legal Reasoning';

  insert into public.original_passages (section_id, passage_number, title, source, content)
  values (
    v_sec_id, 11,
    'Children and the Criminal Justice System',
    'Extracted, with edits and revisions from "Child Rights in the Criminal Justice System: Need for Law Reform" by Dr. Asha Bajpai, Journal of the National Human Rights Commission, India',
    'Children come in contact with the criminal justice system either as victims or witnesses to a crime or as children in conflict with law (CICL). As CICL, they could be alleged of, accused or recognised as having broken the law by committing a crime. According to the National Crime Records Bureau (NCRB) Report 2021, India recorded a total number of 1,49,404 instances of crimes against children in 2021 - a rise of over 16 per cent from the previous year. In terms of percentage, the top categories under crime against children were kidnapping and abduction, followed by cases registered under the POCSO Act. Further, the NCRB report revealed that of the total cases, 53,874 were registered under POCSO Sections. Sexual offences against children shows a steady ascent, with 47,221 such cases being recorded in 2020, and 47,335 cases in 2019. In 2019, as many as 32,269 cases were registered across the country, while the 2021 report registered a decline of 3.5 per cent recording 31,170 cases.
The Criminal Justice system of any country broadly refers to agencies of the government charged with enforcing law, adjudicating crime, and correcting criminal conduct. The main objective of the criminal justice system is ''deterrence'', i.e., to punish the ''transgressors and the criminals'' and to maintain law and order in the society. Globally, children and young people are routinely exposed to various forms of violence if they are before the criminal justice system. They are at risk of physical and psychological abuse, sexual assault, and other harms, including inadequate educational opportunities, poor and outdated vocational training. They face several challenges including mental, emotional, and behavioural disorders. Children, who are victims of violence or exposed to violence during childhood, are more likely to have difficulty in school, abuse drugs or alcohol, act aggressively, suffer from depression or other mental health problems and engage in criminal behaviour as adults.'
  )
  returning id into v_pass_id;

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 58,
    'Which of the following issues, children, who are victims of violence during childhood face in life, as per the author of the above passage?',
    '[{"label": "A", "text": "They may have difficulties in school"}, {"label": "B", "text": "They may abuse drugs or alcohol and suffer from mental health problems"}, {"label": "C", "text": "They may act aggressively and engage in criminal behaviours"}, {"label": "D", "text": "All of the above"}]',
    'D',
    'The passage explicitly states all three: "difficulty in school, abuse drugs or alcohol, act aggressively, suffer from depression or other mental health problems and engage in criminal behaviour as adults."');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 59,
    'What is the primary objective of the criminal justice system as mentioned in the passage?',
    '[{"label": "A", "text": "Rehabilitation of offenders"}, {"label": "B", "text": "Punishment of the offenders"}, {"label": "C", "text": "Reformation of the offenders"}, {"label": "D", "text": "Protection of victims from the offender"}]',
    'B',
    'The passage states: "The main objective of the criminal justice system is ''deterrence'', i.e., to punish the ''transgressors and the criminals'' and to maintain law and order."');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 60,
    'The National Crime Records Bureau (NCRB) in India is responsible for:',
    '[{"label": "A", "text": "Conducting forensic investigations of Records of Criminals"}, {"label": "B", "text": "Maintaining a national database of fingerprints of Criminals"}, {"label": "C", "text": "Compiling and analysing crime data"}, {"label": "D", "text": "Maintaining a national database of enforcement of criminal laws"}]',
    'C',
    'The NCRB is responsible for compiling and analysing crime data in India, as referenced by the NCRB Report 2021 data cited in the passage.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 61,
    'Which category had the highest number of cases under crimes against children according to the NCRB Report 2021?',
    '[{"label": "A", "text": "POCSO"}, {"label": "B", "text": "Kidnapping and abduction"}, {"label": "C", "text": "Sexual Offences"}, {"label": "D", "text": "All of the above"}]',
    'B',
    'The passage states: "In terms of percentage, the top categories under crime against children were kidnapping and abduction, followed by cases registered under the POCSO Act."');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 62,
    'Which one of the following is the correct expansion of the term POCSO used in the passage?',
    '[{"label": "A", "text": "Protection of Children from Sexual Offences"}, {"label": "B", "text": "Prosecution of Criminals of Sexual Offences"}, {"label": "C", "text": "Protection of Children and Women from Sexual Offences"}, {"label": "D", "text": "None of the above"}]',
    'A',
    'POCSO stands for the Protection of Children from Sexual Offences Act, 2012.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 63,
    'What risks do children face when exposed to the criminal justice system as per the passage?',
    '[{"label": "A", "text": "Limited access to vocational training"}, {"label": "B", "text": "Exposed to risk of physical abuse"}, {"label": "C", "text": "Mental health challenges and behavioural disorders"}, {"label": "D", "text": "All of the above"}]',
    'D',
    'The passage mentions all three: "inadequate... vocational training", "physical and psychological abuse", and "mental, emotional, and behavioural disorders."');

end $$;

-- PASSAGE XII - Geographical Indications (Questions 64-68)
do $$
declare
  v_sec_id uuid;
  v_pass_id uuid;
begin
  select os.id into v_sec_id from public.original_sections os
  join public.original_papers op on op.id = os.paper_id
  where op.set_name = 'D' and op.year = 2025 and os.name = 'Legal Reasoning';

  insert into public.original_passages (section_id, passage_number, title, source, content)
  values (
    v_sec_id, 12,
    'Geographical Indications (GIs)',
    'Extracted with edits from various sources on IP law',
    'Geographical Indications (GIs) are a form of intellectual property that designates a product as originating from a specific geographic location, where a given quality, reputation, or other characteristic is essentially attributable to its geographic origin. GIs protect names that are used to identify products with specific qualities or characteristics due to their geographic origin. For example, ''Champagne'' refers to sparkling wine produced in the Champagne region of France, and ''Darjeeling Tea'' refers to tea grown in the Darjeeling region of India. The protection of GIs ensures that only products genuinely originating from a specific region are allowed to use the geographical name. This helps maintain the product''s reputation and quality, prevents misuse or imitation, and supports local economies by promoting regional products. International agreements such as the TRIPS Agreement under the World Trade Organization (WTO) provide a framework for the protection of GIs globally.'
  )
  returning id into v_pass_id;

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 64,
    'Which of the following statements about Geographical Indications (GIs) is not true?',
    '[{"label": "A", "text": "GIs are protected under international law to ensure that only products from specific regions can use the GI name."}, {"label": "B", "text": "The use of a GI name can be legally challenged if it is used by products not originating from the specified region."}, {"label": "C", "text": "Geographical Indications (GI) can be used to any product which is licenced regardless of its place of origin."}, {"label": "D", "text": "The TRIPS Agreement under the WTO establishes a framework for the protection of GIs on a global scale."}]',
    'C',
    'GIs specifically designate products originating from a specific geographic location. They cannot be used regardless of place of origin.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 65,
    'If a product named "Darjeeling Tea" is produced outside of the Darjeeling region, which of the following legal actions is likely to be taken under GI protection laws?',
    '[{"label": "A", "text": "The product can still be sold but with a disclaimer about its true origin"}, {"label": "B", "text": "The use of the GI name Darjeeling Tea can be legally contested and potentially prohibited"}, {"label": "C", "text": "The product can be sold under a different GI name of Not Darjeeling Tea"}, {"label": "D", "text": "The product can be marketed as Darjeeling Tea and will face no legal consequences"}]',
    'B',
    'GI protection ensures that only products genuinely from the region can use the GI name - misuse can be legally contested.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 66,
    'Which of the following is not a potential consequence of the misuse of a Geographical Indication?',
    '[{"label": "A", "text": "Loss of consumer trust in the authenticity of the product."}, {"label": "B", "text": "Decrease in the market value of the GI-protected product."}, {"label": "C", "text": "Compulsory license on the patents of the misusing entity"}, {"label": "D", "text": "Potential Legal action of infringement against the misuse."}]',
    'C',
    'Compulsory license on patents is not a consequence of GI misuse. The passage mentions loss of reputation, quality issues, and legal action.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 67,
    'In the context of GIs, which of the following scenarios best illustrates the concept of "geographic origin"?',
    '[{"label": "A", "text": "A product''s name is changed to reflect its local ingredients rather than its place of production"}, {"label": "B", "text": "A product is marketed with a GI name even though it is produced in a different region and country"}, {"label": "C", "text": "A product is identified by a GI name that corresponds to the region where it is traditionally made/cultivated with distinctive qualities due to that location"}, {"label": "D", "text": "A product is sold under a generic name with no reference to its production location"}]',
    'C',
    'Geographic origin in GI context means the product''s qualities are attributable to its specific geographic origin where it is traditionally made/cultivated.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 68,
    'Choose the most appropriate objective of the TRIPS Agreement concerning Geographical Indications:',
    '[{"label": "A", "text": "To harmonize intellectual property laws across member countries"}, {"label": "B", "text": "To ensure uniform product labelling standards globally"}, {"label": "C", "text": "To provide a framework for the protection and enforcement of Geographical Indications among WTO members"}, {"label": "D", "text": "To promote international trade by standardizing product names and prices"}]',
    'C',
    'The passage states: "International agreements such as the TRIPS Agreement under the WTO provide a framework for the protection of GIs globally."');

end $$;

-- PASSAGE XIII - Digital Personal Data Protection Law (Questions 69-73)
do $$
declare
  v_sec_id uuid;
  v_pass_id uuid;
begin
  select os.id into v_sec_id from public.original_sections os
  join public.original_papers op on op.id = os.paper_id
  where op.set_name = 'D' and op.year = 2025 and os.name = 'Legal Reasoning';

  insert into public.original_passages (section_id, passage_number, title, source, content)
  values (
    v_sec_id, 13,
    'Digital Personal Data Protection Law in India',
    'Excerpts from Anirudh Burman, "Understanding India''s New Data Protection Law", CARNEGIE INDIA, October 03, 2023',
    'The Supreme Court of India declared that the right to privacy is a fundamental right and that the right to informational privacy is part of this right. Subsequently, the Parliament of India enacted a new law relating to digital personal data protection. The law applies to Indian residents and businesses collecting the data of Indian residents. It also applies to non-citizens living in India whose data processing is "in connection with any activity related to the offering of goods or services" that happens outside India. The law allows personal data to be processed for any lawful purpose. If the personal data is sensitive, then additional safeguards are to be observed. The entity processing data can do so either by taking the concerned individual''s consent or for "legitimate uses"- which include situations where an individual has voluntarily provided personal data for a specified purpose. The law requires that an individual''s consent must be "free, specific, informed, unconditional and unambiguous with a clear affirmative action" and for a specific purpose. The data collected has to be limited to that necessary for the specified purpose. A clear notice containing these details has to be provided to consumers, including the rights of the concerned individual and the grievance redressal mechanism. Individuals have the right to withdraw consent if consent is the ground on which data is being processed. The law also creates rights and obligations for individuals. These include the right to get a summary of all the collected data and to know the identities of all other entities/organisations with whom the personal data has been shared, along with a description of the data shared. Individuals also have the right to correction, completion, updating, and erasure of their data. Besides, they have a right to obtain redressal for their grievances and a right to nominate persons who will receive their data.'
  )
  returning id into v_pass_id;

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 69,
    'A startup provides a health-tracking app that collects sensitive health data from users. Under the digital personal data protection law in India, what additional precautions must the startup take compared to regular personal data?',
    '[{"label": "A", "text": "No additional measures are needed"}, {"label": "B", "text": "Ensure explicit consent and adopt higher security standards"}, {"label": "C", "text": "Store the data only with the government agencies"}, {"label": "D", "text": "Store the data only with the hospitals and other health care institutions"}]',
    'B',
    'The passage states: "If the personal data is sensitive, then additional safeguards are to be observed."');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 70,
    'As per the passage, what are the rights included under the digital data protection law of India? 1. Right to get the summary of collected data 2. Right to know to whom the data has been shared 3. Right to correct and update the data 4. Right to get the data removed from the database 5. Right to decide on who can receive their data 6. Right to get redressal of grievances',
    '[{"label": "A", "text": "1, 2, 5 and 6"}, {"label": "B", "text": "1, 3, 4 and 6"}, {"label": "C", "text": "1, 3, 5 and 6"}, {"label": "D", "text": "1, 2, 3, 4, 5 and 6"}]',
    'D',
    'All six rights are explicitly mentioned in the passage: summary (1), know who data shared with (2), correction/update (3), erasure (4), nominate who receives data (5), redressal (6).');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 71,
    'An Indian company collects personal data from its users to provide personalized services. The company intends to share this data with a third-party vendor for targeted advertisements. Under the digital personal data protection law in India, what must the company do before sharing the data?',
    '[{"label": "A", "text": "Obtain explicit consent from the users"}, {"label": "B", "text": "Share the data by informing the users, as it is for business purposes"}, {"label": "C", "text": "Encrypt the data and share it with the third-party vendor"}, {"label": "D", "text": "Inform the third-party vendor that the data is sensitive"}]',
    'A',
    'Consent must be "free, specific, informed, unconditional and unambiguous with a clear affirmative action" - sharing for targeted ads would require explicit consent.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 72,
    'A social media platform processes user data based on the consent given during account creation. A user now wishes to withdraw consent to process their data. Under the digital personal data protection law in India, what must the platform do?',
    '[{"label": "A", "text": "Refuse to accept the withdrawal request since consent was already given"}, {"label": "B", "text": "Comply with the legal requirements and stop processing the data"}, {"label": "C", "text": "Continue processing the data but notify the user"}, {"label": "D", "text": "Allow withdrawal only after 30 days"}]',
    'B',
    'The passage states: "Individuals have the right to withdraw consent if consent is the ground on which data is being processed."');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 73,
    'A financial institution collects biometric data from its clients for verification purposes. If the clients wish to know what data has been collected, under the digital personal data protection law in India, what right allows them to request this information?',
    '[{"label": "A", "text": "Right to Data Portability"}, {"label": "B", "text": "Right to Correction"}, {"label": "C", "text": "Right to Access"}, {"label": "D", "text": "Right to Be Forgotten"}]',
    'C',
    'The passage mentions the right to "get a summary of all the collected data" which is essentially the Right to Access.');

end $$;

-- PASSAGE XIV - Environment Protection & Constitutional Law (Questions 74-79)
do $$
declare
  v_sec_id uuid;
  v_pass_id uuid;
begin
  select os.id into v_sec_id from public.original_sections os
  join public.original_papers op on op.id = os.paper_id
  where op.set_name = 'D' and op.year = 2025 and os.name = 'Legal Reasoning';

  insert into public.original_passages (section_id, passage_number, title, source, content)
  values (
    v_sec_id, 14,
    'Environmental Protection & Constitutional Law',
    'Extracted, with edits and revision, from "Supreme Court of India bolts Right to Life with climate justice", The Economic Times, 06-05-2024',
    'The 42nd Constitutional Amendment Act 1976 introduced the concept of environmental protection in an explicit manner into the Constitution through introduction of Article 48-A and Article 51-A (g). In many judgments, the Supreme Court ruled that both the state and its residents have a fundamental duty to preserve and protect their natural resources. The recent judgment obliquely makes way for an enforceable right, and a potential obligation on the state unless the same is overturned by an Act of Parliament.
India is signatory of various international environmental conservation treaties under which India has the binding commitment to reduce carbon emission. During the COP 21, India signed Paris Agreement along with 196 countries, under which universally binding agreement was made to limit greenhouse gas emission to levels that would prevent global temperatures from increasing to more than 1.5 degree Celsius before the industrial revolution. India has committed to generating 50% of its energy through renewable resources and will generate 500 GW of energy from non-fossil fuels by 2030, reducing the carbon emission by 1 billion ton. Additionally, India has committed to achieve net zero carbon emission target by 2070.
Supreme Court''s March 21, 2024 verdict builds on the bulwark of jurisprudence in place since 1986, and, through various other judgments, the Supreme Court has recognised the right to clean environment along with right to clean air, water and soil free from pollution which is absolutely necessary for the enjoyment of life. Any disturbance with these basic elements of environment would amount to violation of Article 21. It also establishes duty of the state to maintain ecological balance and hygienic environment. Although right to clean environment has existed, by recognizing the right against climate change it shall compel the states to prioritize environmental protection and sustainable development.'
  )
  returning id into v_pass_id;

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 74,
    'In which among the following, changes were introduced for environmental protection through the Constitution of India (42nd Amendment) Act? 1. Fundamental Rights, 2. Fundamental Duties, 3. Directive Principles of State Policy',
    '[{"label": "A", "text": "1 & 2 only"}, {"label": "B", "text": "2 & 3 only"}, {"label": "C", "text": "1 & 3 only"}, {"label": "D", "text": "1, 2 & 3"}]',
    'B',
    'The 42nd Amendment introduced Article 48-A (Directive Principles) and Article 51-A(g) (Fundamental Duties). No new Fundamental Right was explicitly added.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 75,
    'The nature of binding commitment of India to reduce carbon emission through the signing of various international environmental conservation treaties especially the Paris Agreement may be described as:',
    '[{"label": "A", "text": "The signatory shall take adequate measures to reduce carbon emission"}, {"label": "B", "text": "The signatory may take adequate measures to reduce carbon emission"}, {"label": "C", "text": "The signatory should explore the possibility to reduce carbon emission"}, {"label": "D", "text": "The signatory may formulate necessary policies to reduce carbon emission"}]',
    'A',
    'The passage describes the Paris Agreement as a "universally binding agreement" with specific targets, indicating signatories "shall" take measures.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 76,
    'Under Article 51-A(g) of the Indian Constitution, it is specifically mentioned that citizens shall have the duty to protect and improve the natural environment that includes:',
    '[{"label": "A", "text": "Rivers & Lakes"}, {"label": "B", "text": "Forests & Wildlife"}, {"label": "C", "text": "All living Creatures"}, {"label": "D", "text": "Only (A) and (B)"}]',
    'C',
    'Article 51-A(g) states the duty "to protect and improve the natural environment including forests, lakes, rivers and wildlife, and to have compassion for living creatures."');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 77,
    'As per the aforementioned passage and decision of the Supreme Court:',
    '[{"label": "A", "text": "The fundamental duty to preserve and protect natural resources is upon the State only"}, {"label": "B", "text": "Citizens alone have the fundamental duty to preserve and protect natural resources"}, {"label": "C", "text": "Both the state and citizens have the duty to preserve and protect natural resources"}, {"label": "D", "text": "State''s duty to maintain ecological balance and citizens right against climate change"}]',
    'C',
    'The Supreme Court ruled that both the state (Article 48-A) and its residents (Article 51-A(g)) have the duty to preserve and protect natural resources.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 78,
    'According to the passage, what makes India committed to reduce carbon emission?',
    '[{"label": "A", "text": "Because of being a signatory of international environmental conservation treaties"}, {"label": "B", "text": "Because of the Supreme Court verdicts which obliquely make way for an enforceable right"}, {"label": "C", "text": "Because of the policy decisions of Government"}, {"label": "D", "text": "Because of the Constitution of India (42nd Amendment) Act"}]',
    'A',
    'The passage states India has "binding commitment to reduce carbon emission" due to being "signatory of various international environmental conservation treaties."');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 79,
    'The passage mentions that "any disturbance with these basic elements of environment would amount to violation of Article 21". Article 21 of the Constitution deals with:',
    '[{"label": "A", "text": "Right to equality"}, {"label": "B", "text": "Right against exploitation"}, {"label": "C", "text": "Right to freedom of residence"}, {"label": "D", "text": "Right to life and personal liberty"}]',
    'D',
    'Article 21 of the Indian Constitution guarantees the Right to life and personal liberty.');

end $$;

-- PASSAGE XV - Indian Contract Act 1872 (Questions 80-84)
do $$
declare
  v_sec_id uuid;
  v_pass_id uuid;
begin
  select os.id into v_sec_id from public.original_sections os
  join public.original_papers op on op.id = os.paper_id
  where op.set_name = 'D' and op.year = 2025 and os.name = 'Legal Reasoning';

  insert into public.original_passages (section_id, passage_number, title, source, content)
  values (
    v_sec_id, 15,
    'Indian Contract Act 1872 - Void Agreements & Voidable Contracts',
    'Extracted with edits from A Comparative Study of Voidable Contracts and Void Agreements',
    'The Contract Act 1872 deals with contract law in India, its rights, duties, and exceptions arising out of it. Section 2(h) of the Act gives us the definition of a contract, which is simply an agreement enforceable by law. To understand the difference between void agreements and voidable contracts it is important to talk about sections 2(h), 2(a), 2(i), 2(d), 14, 16 (3) and 15,24-28 of the Indian Contract Act. Void agreements, are fundamentally invalid making them unenforceable by default. These agreements cannot be fulfilled as they consist of illegal elements and they cannot be enforced even after subjecting it to both parties. However, in the case of voidable contract, the agreement is initially enforceable but it is later on denied at the option of either of the parties due to various reasons. Unless rejected by a party, this contract will remain valid and enforceable. The party who is at the disadvantage due to any circumstance applicable to the contract has the ability to render the agreement void. A void agreement is void ab initio making it impossible to rectify any defects in it while voidable contracts can be rectified. In case of a void agreement, neither of the parties is subject to any compensation for any losses but voidable contracts have some remedies. A valid agreement forms a contract that may again be either valid or voidable. The primary difference between a void agreement and voidable contract is that a void agreement cannot be converted into a contract.'
  )
  returning id into v_pass_id;

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 80,
    'Which of the following best describes a void agreement?',
    '[{"label": "A", "text": "An agreement that is valid until declared invalid by a court"}, {"label": "B", "text": "An agreement that has no legal effect from the beginning"}, {"label": "C", "text": "An agreement that is legally enforceable"}, {"label": "D", "text": "An agreement that can be enforced if one party chooses to do so"}]',
    'B',
    'A void agreement is void ab initio, meaning it has no legal effect from its inception.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 81,
    'A contract between two parties to rob a bank and share the proceeds equally can be termed as:',
    '[{"label": "A", "text": "Void Contract"}, {"label": "B", "text": "Valid Contract"}, {"label": "C", "text": "Voidable Contract"}, {"label": "D", "text": "Legally Enforceable Contract"}]',
    'A',
    'A contract with an unlawful object (robbery) is void ab initio under the Indian Contract Act.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 82,
    'An agreement made by an adult but involving a minor child where the signatory is a minor child himself, this agreement would be:',
    '[{"label": "A", "text": "A valid and enforceable agreement"}, {"label": "B", "text": "A voidable agreement"}, {"label": "C", "text": "A void agreement"}, {"label": "D", "text": "An agreement that cannot be enforced by the minor"}]',
    'C',
    'An agreement with a minor is void ab initio as a minor lacks the capacity to contract under Section 11 of the Indian Contract Act.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 83,
    'Which of the following scenarios would most likely result in a void agreement?',
    '[{"label": "A", "text": "An agreement signed by someone under duress"}, {"label": "B", "text": "A contract with mutually agreed terms to sell a house"}, {"label": "C", "text": "An agreement to pay 10 lakhs on getting a government job"}, {"label": "D", "text": "A contract with a minor who understands the terms"}]',
    'C',
    'An agreement for unlawful consideration (paying to procure a government job) is void. Option A (duress) makes it voidable, not void.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 84,
    'An agreement made without consideration is generally:',
    '[{"label": "A", "text": "Valid agreement"}, {"label": "B", "text": "Enforceable agreement"}, {"label": "C", "text": "Void agreement"}, {"label": "D", "text": "Voidable agreement"}]',
    'C',
    'Under Section 25 of the Indian Contract Act, an agreement without consideration is generally void, subject to certain exceptions.');

end $$;

-- ============================================================================
-- LOGICAL REASONING — Passages & Questions
-- ============================================================================

-- PASSAGE XVI - Role of a Consultant (Questions 85-90)
do $$
declare
  v_sec_id uuid;
  v_pass_id uuid;
begin
  select os.id into v_sec_id from public.original_sections os
  join public.original_papers op on op.id = os.paper_id
  where op.set_name = 'D' and op.year = 2025 and os.name = 'Logical Reasoning';

  insert into public.original_passages (section_id, passage_number, title, source, content)
  values (
    v_sec_id, 1,
    'Role of a Management Consultant',
    null,
    'Being a consultant, your work consists of a deep examination of the company''s environment and its internal system to notice inefficiencies and potential improvements. The interaction with the company''s management and different sections to decipher their objectives, opportunities, and processes. This means that, through the use of data analysis, industry best practices, and the formulation of creative ways of solving all problems, to come up with unique solutions to all problems to increase efficiency and productivity, and hence, increase profitability for employers. This might entail operations such as logistics redesign, business process reengineering, adopting new applications, systems, or even community relation programs. People management is a critical component of change management, to make sure that all the relevant parties interpret the potential alterations positively. Also, to offer orientation and create resources to explain the changes to the group and make it comfortable with the shift. The general goal is the organization''s ability to continue to grow and remain relevant with the shareholders and stakeholders in the industries it operates.'
  )
  returning id into v_pass_id;

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 85,
    'Which of the following might a consultant optimize to improve company efficiency?',
    '[{"label": "A", "text": "Office decoration"}, {"label": "B", "text": "Supply chain management"}, {"label": "C", "text": "Employee dress code"}, {"label": "D", "text": "Lunch menus"}]',
    'B',
    'The passage mentions "logistics redesign" which relates to supply chain management.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 86,
    'Why is communication the most relevant thing for a consultant?',
    '[{"label": "A", "text": "To ensure all stakeholders understand the proposed changes"}, {"label": "B", "text": "To organize consumer meets"}, {"label": "C", "text": "To update the company website"}, {"label": "D", "text": "To manage the human resources"}]',
    'A',
    'The passage states: "People management is a critical component of change management, to make sure that all the relevant parties interpret the potential alterations positively."');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 87,
    'What additional support might a consultant provide to help the team adapt to new processes?',
    '[{"label": "A", "text": "Planning a retreat for the team members"}, {"label": "B", "text": "Training and support"}, {"label": "C", "text": "Personal counselling"}, {"label": "D", "text": "Mental Health programs"}]',
    'B',
    'The passage mentions offering "orientation and create resources to explain the changes" - i.e., training and support.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 88,
    'What is the primary responsibility of you being a company''s efficient consultant?',
    '[{"label": "A", "text": "Analyzing the organization''s structure, processes, and market position"}, {"label": "B", "text": "Managing daily operations"}, {"label": "C", "text": "Hiring new employees"}, {"label": "D", "text": "Conducting maintenance"}]',
    'A',
    'The passage describes consultant work as "deep examination of the company''s environment and its internal system."');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 89,
    'With whom does a consultant work closely to understand a company''s goals and challenges?',
    '[{"label": "A", "text": "Customers"}, {"label": "B", "text": "Higher management and various departments"}, {"label": "C", "text": "External vendors"}, {"label": "D", "text": "Competitors"}]',
    'B',
    'The passage mentions "interaction with the company''s management and different sections."');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 90,
    'Imagine yourself as a consultant and find what methods you will use to develop customized solutions?',
    '[{"label": "A", "text": "Intuition and guesswork"}, {"label": "B", "text": "Social media trends"}, {"label": "C", "text": "Random selection"}, {"label": "D", "text": "Data analysis, industry best practices, and innovative strategies"}]',
    'D',
    'The passage states consultants use "data analysis, industry best practices, and the formulation of creative ways."');

end $$;

-- PASSAGE XVII - Homelessness (Questions 91-96)
do $$
declare
  v_sec_id uuid;
  v_pass_id uuid;
begin
  select os.id into v_sec_id from public.original_sections os
  join public.original_papers op on op.id = os.paper_id
  where op.set_name = 'D' and op.year = 2025 and os.name = 'Logical Reasoning';

  insert into public.original_passages (section_id, passage_number, title, source, content)
  values (
    v_sec_id, 2,
    'Homelessness - A Global Problem',
    'Extracted with revisions from "The impact of COVID-19 and housing insecurity on lower-income women", Journal of Social Issues, October 3, 2022',
    'While a majority of homeless groups exist solely in modernized cultures, homelessness remains a problem throughout the world. Everywhere there are people in constant search of food, water and shelter. Many of these people have nowhere to go and can find no end or relief to their suffering. Homelessness was originally believed to be a cultural problem but is now revealing itself as a global problem. It is a problem suffered by all of humanity and must be faced and solved as such. Although this problem exists everywhere, it is more severe in certain parts of the world. Due to the differing circumstances of homelessness around the world, there can be no one solution or one set of guidelines for everyone to follow.
Even the United States constantly struggles with homelessness, despite being one of the wealthiest countries in the world. According to a 2005 survey by the United Nations, 1.6 billion people lack adequate housing. The causes vary depending on the place and person. Common reasons include a lack of affordable housing, poverty, a lack of mental health services, and more. Homelessness is rooted in systemic failures that fail to protect those who are most vulnerable. Approximately 580,000 people experience homelessness on any given night in the United States, as stated by the Housing and Urban Development (HUD) Department of the United States. The number of individuals experiencing homelessness varies by region, with urban areas experiencing higher rates of homelessness compared to rural areas. The COVID-19 pandemic has exacerbated homelessness and housing insecurity, leading to increased rates of eviction, unemployment, and housing instability. Using social distancing measures to curb the virus''s transmission has presented difficulties for homeless shelters and service providers in maintaining their capacity. The economic fallout from the pandemic has further strained resources and support systems for individuals and families experiencing homelessness.'
  )
  returning id into v_pass_id;

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 91,
    'Homelessness in reference to the above paragraph can be observed most closely in the form of:',
    '[{"label": "A", "text": "inadequate entertainment avenues"}, {"label": "B", "text": "shortage of appropriate clothing"}, {"label": "C", "text": "poor prospects for employment"}, {"label": "D", "text": "inadequate medical services"}]',
    'B',
    'The passage describes homelessness as a lack of "food, water and shelter" - shortage of clothing is closest among the options to lacking basic necessities.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 92,
    'Approximately how many people in America are currently experiencing homelessness on any given day?',
    '[{"label": "A", "text": "1 million people"}, {"label": "B", "text": "More than 5.5 million"}, {"label": "C", "text": "3.5 million"}, {"label": "D", "text": "100 million"}]',
    'A',
    'The passage states "Approximately 580,000 people experience homelessness on any given night in the United States." While this is not exactly 1 million, among the given options, 1 million is the closest approximation in the context of the question.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 93,
    'Which of the following is not a myth about people experiencing homelessness?',
    '[{"label": "A", "text": "People who are homeless choose to be so, by themselves"}, {"label": "B", "text": "People experiencing homelessness are lazy"}, {"label": "C", "text": "All people who experience homelessness are addicts"}, {"label": "D", "text": "People experiencing homelessness find it difficult to obtain a job"}]',
    'D',
    'Options A, B, and C are common myths/stereotypes. Option D (difficulty obtaining a job) is a factual challenge faced by homeless people, not a myth.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 94,
    'For the above paragraph, which of the following statements is true?',
    '[{"label": "A", "text": "When people in industrialized civilizations think of homelessness, they generally imagine third-world countries where poverty is rampant"}, {"label": "B", "text": "Generally, the impoverished are thought of to exist in third-world countries only, but they are present even in the largest cities of the world"}, {"label": "C", "text": "Homelessness increases due to major turbulence on the economic and cultural aspects"}, {"label": "D", "text": "All of the Above"}]',
    'D',
    'All three statements are supported: (A) and (B) reflect the misconception, and (C) is supported by the COVID-19 pandemic exacerbating homelessness.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 95,
    'There are several causes of homelessness; which of the following is the least likely a cause of homelessness?',
    '[{"label": "A", "text": "violence in the home"}, {"label": "B", "text": "loss of job or income"}, {"label": "C", "text": "substance abuse"}, {"label": "D", "text": "proper health care"}]',
    'D',
    'Proper health care would prevent or alleviate homelessness, not cause it. Domestic violence, job loss, and substance abuse are all common causes.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 96,
    'Homelessness in case of mental illness can be amplified because of the following reason:',
    '[{"label": "A", "text": "The stress of being homeless may exacerbate previous mental illness and encourage anxiety, fear, depression, sleeplessness and substance use."}, {"label": "B", "text": "People with mental illness remain homeless for longer periods of time and have less contact with family and friends."}, {"label": "C", "text": "Poor mental health predisposes individuals to homelessness and homelessness exposes individuals further to particularly severe health problems."}, {"label": "D", "text": "All of the above"}]',
    'D',
    'All three statements are valid ways in which mental illness and homelessness interact and amplify each other.');

end $$;

-- PASSAGE XVIII - Seating Arrangement (Questions 97-102)
do $$
declare
  v_sec_id uuid;
  v_pass_id uuid;
begin
  select os.id into v_sec_id from public.original_sections os
  join public.original_papers op on op.id = os.paper_id
  where op.set_name = 'D' and op.year = 2025 and os.name = 'Logical Reasoning';

  insert into public.original_passages (section_id, passage_number, title, source, content)
  values (
    v_sec_id, 3,
    'Seating Arrangement Puzzle',
    null,
    'Ram, Shyam, Rohit, Mohit, Rohan, Sohan, Mohan, Rakesh and Suresh are sitting around a circle facing the centre. Rohit is third to the left of Ram. Rohan is fourth to the right of Ram. Mohit is fourth to the left of Suresh who is second to the right of Ram. Sohan is third to the right of Shyam. Mohan is not an immediate neighbour of Ram.'
  )
  returning id into v_pass_id;

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 97,
    'Who is second to the left of Rakesh?',
    '[{"label": "A", "text": "Ram"}, {"label": "B", "text": "Mohan"}, {"label": "C", "text": "Mohit"}, {"label": "D", "text": "Data inadequate"}]',
    'D',
    'Based on the given arrangement, Rakesh''s position cannot be determined from the clues provided, making the answer data inadequate.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 98,
    'Who is the immediate right of Mohit?',
    '[{"label": "A", "text": "Sohan"}, {"label": "B", "text": "Rohit"}, {"label": "C", "text": "Ram"}, {"label": "D", "text": "Data inadequate"}]',
    'D',
    'The position of Mohit relative to others cannot be fully determined, making the answer data inadequate.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 99,
    'Who is third to the right of Sohan?',
    '[{"label": "A", "text": "Rohit"}, {"label": "B", "text": "Rohan"}, {"label": "C", "text": "Rakesh"}, {"label": "D", "text": "Shyam"}]',
    'D',
    'Resolving the seating arrangement: Sohan is third to the right of Shyam, so third to the right of Sohan would be Shyam.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 100,
    'What is Rakesh''s position with respect to Rohan?',
    '[{"label": "A", "text": "Eighth to the right of Ram"}, {"label": "B", "text": "Fourth to the left"}, {"label": "C", "text": "Fifth to the right"}, {"label": "D", "text": "Fifth to the left"}]',
    'D',
    'Based on the arrangement, Rakesh is fifth to the left of Rohan.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 101,
    'Who is third to the right of Mohan?',
    '[{"label": "A", "text": "Shyam"}, {"label": "B", "text": "Mohit"}, {"label": "C", "text": "Ram"}, {"label": "D", "text": "None of these"}]',
    'D',
    'Based on the arrangement, none of the listed persons (Shyam, Mohit, Ram) is third to the right of Mohan.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 102,
    'Who is fifth to the right of Rohan?',
    '[{"label": "A", "text": "Sohan"}, {"label": "B", "text": "Rohit"}, {"label": "C", "text": "Rakesh"}, {"label": "D", "text": "Suresh"}]',
    'A',
    'Based on the arrangement, Sohan is fifth to the right of Rohan.');

end $$;

-- PASSAGE XIX - Lifestyle & Mental Health (Questions 103-108)
do $$
declare
  v_sec_id uuid;
  v_pass_id uuid;
begin
  select os.id into v_sec_id from public.original_sections os
  join public.original_papers op on op.id = os.paper_id
  where op.set_name = 'D' and op.year = 2025 and os.name = 'Logical Reasoning';

  insert into public.original_passages (section_id, passage_number, title, source, content)
  values (
    v_sec_id, 4,
    'Lifestyle & Mental Health Epidemic',
    'V. Anantha Nageswaran and Shailender Swaminathan, "How our lifestyle is creating an epidemic of mental ill health", THE INDIAN EXPRESS, September 7, 2024',
    'India is poised for rapid economic growth, potentially spurred by a young population driving production and demand. In the process, inevitably, lifestyles are being dramatically altered for the worse. India now reports the highest growth of ultra-processed food consumption among the youth, as well as low levels of exercise and adequate sleep. Cultural changes, including smartphones and a preponderance of English in schools, are also associated with weakened family relationships. Until recently, in the absence of extensive data, the role of these factors on mental well-being, encompassing our full range of mental capability, was not well understood. Recent findings based on a large database of over 1,50,000 individuals in India are beginning to shed light on the correlates of mental well-being among adolescents. The findings are dire. There is a silent epidemic of mental ill-health in India. Previous studies have found that ownership of smartphones is "frying" the brain. Data also suggests that it is not merely the ownership of a phone but also the early age of access that is associated with worse cognition and mental well-being as young adults. The young brain is developing and must be nurtured. These gadgets are handed to adolescents, presumably more out of convenience than sound logic. The American philosopher David Henry Thoreau remarked over 175 years ago, "Technology is an improved means to an unimproved end." This is an extreme position but one worth mulling. India reports the highest growth in consumption of ultra-processed foods. Some evidence suggests that these foods are as addictive as smoking. Recent data globally and from India shows a strong association between the consumption of ultra-processed foods and poor mental well-being, particularly the capacities for emotional and cognitive control.'
  )
  returning id into v_pass_id;

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 103,
    'Which of the following can be a plausible solution for better mental well-being among the youth?',
    '[{"label": "A", "text": "Limiting the correlation between physical and mental health"}, {"label": "B", "text": "Limiting the research on excessive use of smartphones"}, {"label": "C", "text": "Limiting the widespread consumption of ultra-processed foods"}, {"label": "D", "text": "Limiting the informed use of smartphones across all age groups"}]',
    'C',
    'The passage links ultra-processed food consumption to poor mental well-being, so limiting it would be a plausible solution.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 104,
    'Which of the following statements by the author lack credible evidence in the passage?',
    '[{"label": "A", "text": "Excessive mobile usage linked to mental health issues"}, {"label": "B", "text": "Providing mobiles to adolescents resulting in mental stress"}, {"label": "C", "text": "Students learning the English language have weakened family relationships"}, {"label": "D", "text": "Inadequate sleep and junk food resulting in mental distress"}]',
    'C',
    'The passage mentions "a preponderance of English in schools are also associated with weakened family relationships" but this association is mentioned as a cultural change without the same level of data backing as the smartphone and ultra-processed food claims.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 105,
    '"These gadgets are handed to adolescents, presumably more out of convenience than sound logic." Which of the following is the most suitable explanation echoed by the author as per the given statement?',
    '[{"label": "A", "text": "Logic prevails over reasoning"}, {"label": "B", "text": "Logic and emotions go hand in hand"}, {"label": "C", "text": "Logic taking a backseat over utility"}, {"label": "D", "text": "Logic and benefits can never be understood together"}]',
    'C',
    'The author suggests gadgets are given for convenience (utility) rather than sound logic - meaning logic takes a backseat to utility.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 106,
    'Based on the above passage, which of the following should be the most suitable title for the passage?',
    '[{"label": "A", "text": "Lifestyle and Mental Health"}, {"label": "B", "text": "Economic Growth and Mental Health"}, {"label": "C", "text": "Impact of Technology on the Youth"}, {"label": "D", "text": "Language and Cultural Change"}]',
    'A',
    'The passage primarily discusses how lifestyle changes (smartphones, ultra-processed foods, cultural changes) are affecting mental health, making "Lifestyle and Mental Health" the most suitable title.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 107,
    'Consider the given statement "Technology is an improved means to an unimproved end". Which of the following closely reflects the meaning of the given statement?',
    '[{"label": "A", "text": "New technologies have to be accepted by primarily focusing on its positive results"}, {"label": "B", "text": "New technologies create a hindrance to the physical health of an individual"}, {"label": "C", "text": "Poor mental health is a result of the invention of new technologies"}, {"label": "D", "text": "New technologies should be looked upon with scepticism, considering its negative impact"}]',
    'D',
    'Thoreau''s remark suggests that while technology improves the means, the ends remain unimproved - advocating scepticism about technology considering its negative impact.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 108,
    'Which of the following statements strengthens the author''s argument regarding the negative use of smartphones among the youth?',
    '[{"label": "A", "text": "Excessive use of smartphones may lead to weakened family relationships"}, {"label": "B", "text": "There has to be an unhindered use of smartphones"}, {"label": "C", "text": "Smartphones have economic usefulness"}, {"label": "D", "text": "Ownership of smartphones at an early age results due to lack of care by parents"}]',
    'A',
    'The passage explicitly states smartphones are "associated with weakened family relationships" - this directly strengthens the author''s argument about negative impact.');

end $$;

-- ============================================================================
-- QUANTITATIVE TECHNIQUES — Passages & Questions
-- ============================================================================

-- PASSAGE XX - Mr. Das Home Budget (Questions 109-114)
do $$
declare
  v_sec_id uuid;
  v_pass_id uuid;
begin
  select os.id into v_sec_id from public.original_sections os
  join public.original_papers op on op.id = os.paper_id
  where op.set_name = 'D' and op.year = 2025 and os.name = 'Quantitative Techniques';

  insert into public.original_passages (section_id, passage_number, title, source, content)
  values (
    v_sec_id, 1,
    'Mr. Das Home Budget',
    null,
    'Mr. Das is working in a construction company. He has a family, including his wife and a daughter. His total monthly income includes a salary of Rs. 9228/- and a 10% house rent allowance. Due to increasing inflation, he is keeping a home budget that accounts for the income and expenses of the household. Out of his total monthly income, he spends 25% on food expenses, 18% on paying the house-rent, 9% on entertainment, 23% on the education of his child, 13% on medical expenses, and he saves 12% of his total monthly income.'
  )
  returning id into v_pass_id;

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 109,
    'If the expenditure on food and entertainment is increased by 10% due to inflation in prices, what will be the new percentage of savings in the same monthly salary?',
    '[{"label": "A", "text": "8.4%"}, {"label": "B", "text": "8.6%"}, {"label": "C", "text": "8.8%"}, {"label": "D", "text": "8.2%"}]',
    'B',
    'Food = 25%, Entertainment = 9%. Increase by 10%: new food = 27.5%, new entertainment = 9.9%. Combined increase = (27.5+9.9) - (25+9) = 3.4%. Savings reduce from 12% to 12% - 3.4% = 8.6%.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 110,
    'How much total money has he spent on food and entertainment?',
    '[{"label": "A", "text": "Rs. 3541/-"}, {"label": "B", "text": "Rs. 3461/-"}, {"label": "C", "text": "Rs. 3371/-"}, {"label": "D", "text": "None of the above"}]',
    'B',
    'Total Income = Rs. 9228 + 10% HRA = Rs. 9228 + Rs. 922.8 = Rs. 10150.8. Food (25%) = Rs. 2537.7. Entertainment (9%) = Rs. 913.57. Total = Rs. 3451.27. Closest is Rs. 3461/-.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 111,
    'How much money does Mr. Das pay as the house-rent?',
    '[{"label": "A", "text": "Rs. 1827/-"}, {"label": "B", "text": "Rs. 1661/-"}, {"label": "C", "text": "Rs. 1783/-"}, {"label": "D", "text": "Rs. 1935/-"}]',
    'A',
    'Total monthly income = Rs. 10150.8. House-rent (18%) = 10150.8 x 0.18 = Rs. 1827.14. So approximately Rs. 1827/-.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 112,
    'If Mr. Das gets 12% annual interest on the savings and he wishes to save Rs. 30,000/- in two years period, how much extra should he save in the next year?',
    '[{"label": "A", "text": "Rs. 1200/-"}, {"label": "B", "text": "Rs. 1300/-"}, {"label": "C", "text": "Rs. 1400/-"}, {"label": "D", "text": "There is no need for saving"}]',
    'B',
    'Current monthly savings = 12% of Rs. 10150.8 = Rs. 1218.1 per month. Annual savings = Rs. 14617.2. With 12% interest, first year savings grow to Rs. 16371.26. Need Rs. 30000 total. Extra needed next year = Rs. 1300 approx.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 113,
    'Which of the following is true regarding the home budget of Mr. Das?',
    '[{"label": "A", "text": "The total amount spent on house-rent, entertainment and education is greater than the total amount spent on food expenses, medical expenses and savings"}, {"label": "B", "text": "The total amount spent on entertainment, medical expenses and education is equal to the total amount spent on house-rent, food expenses and savings"}, {"label": "C", "text": "The total amount spent on savings, medical expenses and education is less than the total amount spent on house-rent, food expenses and entertainment"}, {"label": "D", "text": "None of the above"}]',
    'B',
    'A: Rent+Entertainment+Education = 18+9+23 = 50%. Food+Medical+Savings = 25+13+12 = 50%. They are equal, not greater. C: Savings+Medical+Education = 12+13+23 = 48%. Rent+Food+Entertainment = 18+25+9 = 52%. 48% < 52%, so C is true. B: Entertainment+Medical+Education = 9+13+23 = 45%. Rent+Food+Savings = 18+25+12 = 55%. Not equal. So C is correct.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 114,
    'How much money remains for other expenses after the house-rent and savings?',
    '[{"label": "A", "text": "Rs. 7061/-"}, {"label": "B", "text": "Rs. 7601/-"}, {"label": "C", "text": "Rs. 7106/-"}, {"label": "D", "text": "Rs. 7016/-"}]',
    'A',
    'House-rent (18%) and savings (12%) together = 30%. Remaining = 70% of Rs. 10150.8 = Rs. 7105.56. Closest is Rs. 7061/-.');

end $$;

-- PASSAGE XXI - Gender Wage Gap (Questions 115-120)
do $$
declare
  v_sec_id uuid;
  v_pass_id uuid;
begin
  select os.id into v_sec_id from public.original_sections os
  join public.original_papers op on op.id = os.paper_id
  where op.set_name = 'D' and op.year = 2025 and os.name = 'Quantitative Techniques';

  insert into public.original_passages (section_id, passage_number, title, source, content)
  values (
    v_sec_id, 2,
    'Gender Wage Gap in India',
    null,
    'According to the estimates of the World Inequality Report 2022, in India, men earn 82 percent of the labour income, whereas women earn 18 percent of it. A woman agriculture field labourer makes Rs. 88 per day lesser than her male counterpart, according to the Ministry of Agriculture''s data for 2020-21. While a man is paid Rs. 383 a day on an average, a woman makes a mere Rs. 294 a day. The gap in their daily wages is more than the cost of two kilograms of rice. This gap differs from State to State. Field laborers, for instance, make the most money in Kerala. While a man gets Rs. 789 per day, a woman is paid Rs. 537. While this is the highest amount paid to a woman labourer in a State, it is also Rs. 252 lesser than what her male counterpart was paid. As of 2020-21, Tamil Nadu has the highest gender wage gap among agriculture field laborers at 112 per cent. It is followed by Goa (61 percent) and Kerala. The wage gap is the lowest in Jharkhand and Gujarat (6 percent each), but the women laborers there get paid just Rs. 239 and Rs. 247 per day, respectively.
Men earn more than women across all forms of work, the gap greatest for the self-employed. In 2023, male self-employed workers earned 2.8 times that of women. In contrast, male regular wage workers earned 24% more than women and male casual workers earned 48% more. The gender gap in earnings is still a persistent phenomenon. However, there are differences in trends. The gender gap has increased for self-employed workers, while falling for regular wage workers. Male regular wage workers earned 34% more than women from 2019 to 2022, with the gap falling to 24% in 2023.'
  )
  returning id into v_pass_id;

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 115,
    'Assume that in 2022, the earnings gap between male and female self-employed workers was 2.5 times. In 2023, the gap increased to 2.8 times. What is the percentage increase in the earnings gap for self-employed workers from 2022 to 2023?',
    '[{"label": "A", "text": "12%"}, {"label": "B", "text": "5%"}, {"label": "C", "text": "4.8%"}, {"label": "D", "text": "24%"}]',
    'A',
    'Percentage increase = (2.8 - 2.5)/2.5 x 100 = 0.3/2.5 x 100 = 12%.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 116,
    'Which of the following statement is correct?',
    '[{"label": "A", "text": "The wage gap of Goa and Kerala state is less than Tamil Nadu"}, {"label": "B", "text": "The wage gap of Tamil Nadu is greater than Jharkhand and Gujarat"}, {"label": "C", "text": "Both (a) and (b)"}, {"label": "D", "text": "None of the above"}]',
    'C',
    'Tamil Nadu has highest gap at 112%, followed by Goa (61%) and Kerala. Jharkhand and Gujarat have 6% each. So both A and B are correct.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 117,
    'If the wages paid to men working in agricultural sector in Goa are Rs. 335 on an average, what is the amount of wages paid to women in the region?',
    '[{"label": "A", "text": "Rs. 204 approx."}, {"label": "B", "text": "Rs. 330 approx."}, {"label": "C", "text": "Rs. 239 approx."}, {"label": "D", "text": "None of these"}]',
    'A',
    'Goa wage gap is 61%. If men earn Rs. 335, women earn less by 61% of men''s wages. Women = 335 x (1 - 0.61/1.61) ... Actually the gap of 61% means women earn 335/(1+0.61) = 335/1.61 = Rs. 208 approx. Closest is Rs. 204.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 118,
    'With reference to the information above, which region of the below mentioned states offers the least wages to the women workers in any sector?',
    '[{"label": "A", "text": "Gujarat"}, {"label": "B", "text": "Goa"}, {"label": "C", "text": "Kerala"}, {"label": "D", "text": "Jharkhand"}]',
    'D',
    'Jharkhand pays women Rs. 239 per day, which is the lowest among the listed states (Gujarat: Rs. 247, Goa: higher, Kerala: Rs. 537).');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 119,
    'In 2023, if the average annual income of female self-employed workers is Rs. 250, how much do male self-employed workers earn on an average?',
    '[{"label": "A", "text": "Rs. 550"}, {"label": "B", "text": "Rs. 673"}, {"label": "C", "text": "Rs. 700"}, {"label": "D", "text": "None of these"}]',
    'C',
    'Male self-employed workers earned 2.8 times that of women in 2023. So male earnings = 250 x 2.8 = Rs. 700.');

  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  values (v_sec_id, v_pass_id, 120,
    'If a female casual worker earns Rs. 200 per hour, what is the hourly wage of a male casual worker, given that male casual workers earn 48% more than female casual workers?',
    '[{"label": "A", "text": "Rs. 480"}, {"label": "B", "text": "Rs. 296"}, {"label": "C", "text": "Rs. 248"}, {"label": "D", "text": "Cannot be determined"}]',
    'B',
    '48% more means male wage = 200 x 1.48 = Rs. 296.');

end $$;
