-- ─── Seed: CLAT UG 2025 Set A — English Language (Passages III-IV, Q13-24) ───
do $$
declare
  v_passage_id uuid;
  v_section_id uuid := '53b4039c-7ba7-400d-a990-59b8716e087b';
begin

-- Passage III — R.K. Narayan's "An Astrologer's Day"
insert into public.original_passages (section_id, passage_number, title, source, content) values
(v_section_id, 3, 'An Astrologer''s Day', 'Extracted with edits from "An Astrologer''s Day" by R.K. Narayan',
'Punctually at midday, he opened his bag and spread out his professional equipment, which consisted of a dozen cowrie shells, a square piece of cloth with obscure mystic charts on it, a notebook, and a bundle of palmyra writing. His forehead was dazzling with sacred ash and vermilion, and his eyes sparkled with a sharp, abnormal gleam which was really an outcome of a continual searching look for customers, but which his simple clients took to be a prophetic light and felt comforted. The power of his eyes was considerably enhanced by their position—placed as they were between the painted forehead and the dark whiskers which streamed down his cheeks: even a half-wit''s eyes would sparkle in such a setting. People were attracted to him as bees are attracted to cosmos or dahlia stalks. He sat under the boughs of a spreading tamarind tree which flanked a path running through the town hall park. It was a remarkable place in many ways: a surging crowd was always moving up and down this narrow road morning till night. A variety of trades and occupations was represented all along its way: medicine sellers, sellers of stolen hardware and junk, magicians, and, above all, an auctioneer of cheap cloth, who created enough din all day to attract the whole town. Next to him in vociferousness came a vendor of fried groundnut, who gave his ware a fancy name each day, calling it "Bombay Ice Cream" one day, and on the next "Delhi Almond," and on the third "Raja''s Delicacy," and so on and so forth, and people flocked to him. A considerable portion of this crowd dallied before the astrologer too. The astrologer transacted his business by the light of a flare which crackled and smoked up above the groundnut heap nearby.'
) returning id into v_passage_id;

-- Q13
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 13,
'Which among the following is the word for the phrase ''Bright and colourful in an impressive way''?',
'[{"label": "A", "text": "Mystic"}, {"label": "B", "text": "Flare"}, {"label": "C", "text": "Sparkle"}, {"label": "D", "text": "Dazzling"}]',
'D',
'The passage describes the astrologer''s forehead as "dazzling with sacred ash and vermilion", meaning bright and colourful in an impressive way.');

-- Q14
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 14,
'Which among the following is not a trade or occupation represented in the pathway running through the town hall park?',
'[{"label": "A", "text": "Magicians"}, {"label": "B", "text": "Medicine sellers"}, {"label": "C", "text": "Auctioneers of cheap Bags"}, {"label": "D", "text": "Sellers of Stolen Hardware"}]',
'C',
'The passage mentions "medicine sellers, sellers of stolen hardware and junk, magicians, and, above all, an auctioneer of cheap cloth". There is no mention of "auctioneers of cheap Bags" — it is "cheap cloth" not bags.');

-- Q15
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 15,
'Who among the following used names like "Bombay Ice Cream", "Delhi Almond," and "Raja''s Delicacy" to attract the crowd?',
'[{"label": "A", "text": "The sellers of cheap clothes"}, {"label": "B", "text": "The sellers of Medicine"}, {"label": "C", "text": "The ice cream seller"}, {"label": "D", "text": "The groundnut seller"}]',
'D',
'The passage states: "a vendor of fried groundnut, who gave his ware a fancy name each day, calling it ''''Bombay Ice Cream'''' one day, and on the next ''''Delhi Almond''''."');

-- Q16
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 16,
'Which among the following is the meaning of the expression ''vociferousness''?',
'[{"label": "A", "text": "Expressing opinions or feelings in a loud and confident way"}, {"label": "B", "text": "Words that are spoken or sung to have a magical effect"}, {"label": "C", "text": "Willing or prepared to do something"}, {"label": "D", "text": "To hang about aimlessly"}]',
'A',
'Vociferousness means expressing opinions or feelings in a loud and confident way. The passage uses it to describe the groundnut vendor who created a lot of noise to attract customers.');

-- Q17
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 17,
'When did the astrologer usually start his day''s business?',
'[{"label": "A", "text": "When people are attracted to him as bees"}, {"label": "B", "text": "When the surging crowd moves up and down the road"}, {"label": "C", "text": "Punctually at midday"}, {"label": "D", "text": "By the light of a flare"}]',
'C',
'The passage begins with: "Punctually at midday, he opened his bag and spread out his professional equipment."');

-- Q18
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 18,
'What was considered as a prophetic light by the simple clients of the astrologer?',
'[{"label": "A", "text": "The resplendent forehead of the astrologer with sacred ash and vermillion"}, {"label": "B", "text": "The sparkling eyes of the astrologer with an abnormal gleam"}, {"label": "C", "text": "The dark whiskers which streamed down the cheeks of the astrologer"}, {"label": "D", "text": "The saffron coloured turban around the head of astrologer"}]',
'B',
'The passage states: "his eyes sparkled with a sharp, abnormal gleam... which his simple clients took to be a prophetic light and felt comforted."');

end $$;

-- Passage IV — J. Krishnamurti's "The Right Kind of Education" (Q19-24)
do $$
declare
  v_passage_id uuid;
  v_section_id uuid := '53b4039c-7ba7-400d-a990-59b8716e087b';
begin

insert into public.original_passages (section_id, passage_number, title, source, content) values
(v_section_id, 4, 'The Right Kind of Education', 'Extract with edits from "The right kind of Education" by J. Krishna Murti',
'The right kind of education consists in understanding the child as he is without imposing upon him an ideal of what we think he should be. To enclose him in the framework of an ideal is to encourage him to conform, which breeds fear and produces in him a constant conflict between what he is and what he should be: and all inward conflicts have their outward manifestations in society. If the parent loves the child, he observes him, he studies his tendencies, his moods, and peculiarities. It is only when one feels no love for the child that one imposes upon him an ideal, for then one''s ambitions are trying to fulfill themselves in him, wanting him to become this or that. If one loves, not the ideal but the child, then there is a possibility of helping him to understand himself as he is. Ideals are a convenient escape, and the teacher who follows them is incapable of understanding his students and dealing with them intelligently; for him, the future ideal, the what should be, is far more important than the present child. The pursuit of an ideal excludes love, and without love no human problem can be solved. If the teacher is of the right kind, he will not depend on a method, but will study each individual pupil. In our relationship with children and young people, we are not dealing with mechanical devices that can be quickly repaired, but with living beings who are impressionable, volatile, sensitive, afraid, affectionate: and to deal with them, we have to have great understanding, the strength of patience and love. When we lack these, we look to quick and easy remedies and hope for marvellous and automatic results. If we are unaware, mechanical in our attitudes and actions, we fight shy of any demand upon us that is disturbing and that cannot be met by an automatic response, and this is one of our major difficulties in education.'
) returning id into v_passage_id;

-- Q19
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 19,
'According to the passage, why do we look for quick and easy remedies and hope for marvellous and automatic results?',
'[{"label": "A", "text": "Because children are impressionable, volatile, sensitive, and affectionate"}, {"label": "B", "text": "Because of major difficulties in education"}, {"label": "C", "text": "Because we lack intelligence and skills"}, {"label": "D", "text": "Because we lack understanding, patience and love"}]',
'D',
'The passage states: "When we lack these [understanding, the strength of patience and love], we look to quick and easy remedies and hope for marvellous and automatic results."');

-- Q20
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 20,
'What does the passage highlight as the quality of a parent who really desires to understand his child?',
'[{"label": "A", "text": "They look at their child through the prism of an ideal"}, {"label": "B", "text": "They observe and study the tendencies, moods, and peculiarities of the child"}, {"label": "C", "text": "They love their child to become someone great as per their ambitions"}, {"label": "D", "text": "They encourage the child to find out what she/he is and what she/he should be"}]',
'B',
'The passage says: "If the parent loves the child, he observes him, he studies his tendencies, his moods, and peculiarities."');

-- Q21
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 21,
'What is the antonym for the word "volatile"?',
'[{"label": "A", "text": "Stable"}, {"label": "B", "text": "Steady"}, {"label": "C", "text": "Constant"}, {"label": "D", "text": "All of the above"}]',
'D',
'All three options — Stable, Steady, and Constant — are antonyms of "volatile", which means liable to change rapidly and unpredictably.');

-- Q22
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 22,
'Which of the following currently reflects the intention of the author of this passage?',
'[{"label": "A", "text": "The right kind of education for a child cannot be without love, care and understanding"}, {"label": "B", "text": "True education should be governed by a tendency to conform a child to our ideals"}, {"label": "C", "text": "The teacher should focus on how a child should be according to his/her methodology, hope, or expectation"}, {"label": "D", "text": "Parents and teachers should work together collectively to guide a child on what she/he should do as per their ambitions"}]',
'A',
'The passage''s central thesis is that education requires love, care and understanding — not imposition of ideals. It states: "the pursuit of an ideal excludes love, and without love no human problem can be solved."');

-- Q23
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 23,
'In light of the above passage, what will be the result of forcing a child to conform to the framework of an ideal?',
'[{"label": "A", "text": "It will make the child an ideal child"}, {"label": "B", "text": "It will create confusion and fear in the child"}, {"label": "C", "text": "The child will get into a conflict"}, {"label": "D", "text": "Will discourage the child to conform to the ideal"}]',
'B',
'The passage states: "To enclose him in the framework of an ideal is to encourage him to conform, which breeds fear and produces in him a constant conflict between what he is and what he should be." Both confusion and fear are explicitly mentioned as results.');

-- Q24
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 24,
'According to the author, what should be the attitude of a right kind of teacher?',
'[{"label": "A", "text": "They should not empathise with the students"}, {"label": "B", "text": "They should use modern and scientific methods of teaching"}, {"label": "C", "text": "They should focus on studying each student individually"}, {"label": "D", "text": "They should instill great ideals in the students"}]',
'C',
'The passage states: "If the teacher is of the right kind, he will not depend on a method, but will study each individual pupil."');

end $$;
