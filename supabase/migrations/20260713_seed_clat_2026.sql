-- ─── Seed: CLAT UG 2026 (Original Paper) ───
-- Extracted from the official CLAT 2026 UG question paper PDF
-- Structure: 5 sections, 120 questions (Q100 withdrawn)
-- Matches CLAT UG 2025 Set A format exactly

begin;

-- 1. Insert paper metadata
with paper as (
  insert into public.original_papers (title, exam_type, year, set_name, total_questions, duration_minutes, source_url)
  values ('CLAT UG 2026 Set A', 'ug', 2026, 'A', 120, 120, null)
  returning id
),
-- 2. Insert sections
sections as (
  insert into public.original_sections (paper_id, name, order_index, total_questions)
  select paper.id, name, order_index, total_questions
  from paper cross join (values
    ('English Language', 1, 24),
    ('Current Affairs Including General Knowledge', 2, 28),
    ('Legal Reasoning', 3, 30),
    ('Logical Reasoning', 4, 26),
    ('Quantitative Techniques', 5, 12)
  ) as s(name, order_index, total_questions)
  returning id, name, order_index
)
select * from sections;



-- ====================================================================
-- English Language (Q1-Q24)
-- ====================================================================
do $$
declare
  v_paper_id uuid;
  v_section_id uuid;
  v_passage_id uuid;
begin
  -- Get paper id
  select id into v_paper_id from public.original_papers where title = 'CLAT UG 2026 Set A' and year = 2026;
  
  -- Get section id
  select id into v_section_id from public.original_sections 
  where paper_id = v_paper_id and name = 'English Language';


  -- Passage I
  insert into public.original_passages (section_id, passage_number, title, source, content)
  values (v_section_id, 1, 'Passage I', NULL, 'The adoption of the Non-Cooperation Movement by the Congress gave it a new energy and from January 1921 it began to register considerable success all over the country. Gandhiji undertook a nation-wide tour during which he addressed hundreds of meetings and met a large number of political workers. In the first month, thousands of students left their educational institutions and joined more than 800 national schools and colleges that had sprung up all over the country. Gandhiji had promised Swaraj within a year, if his programme was adopted. The Non-Cooperation Movement demonstrated that it commanded the support and sympathy of vast sections of the Indian people. Its reach among many sections of Indian peasants, workers, artisans etc, had been demonstrated. The spatial spread of the movement was also nation-wide. Some areas were more active than others, but there were few that showed no signs of activity at all. The capacity of the ''poor dumb millions'' of India to take part in modern nationalist politics was also demonstrated. This was the first time that nationalists from the towns, students from schools and colleges or even the educated and politically aware in the villages had made a serious attempt to bring the ideology and the movement into their midst. The tremendous participation of different communities in the movement, and the maintenance of communal unity, despite the Malabar developments, was in itself no mean achievement. There is hardly any doubt that it was minority participation that gave the movement its truly mass character in many areas. And it was, indeed, unfortunate that this most positive feature of the movement was not to be repeated in later years once communalism began to take its toll.')
  returning id into v_passage_id;


  -- Q1
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 1, 'From the passage it is evident that:', $JSON$[{"label": "A", "text": "The idea of Swaraj seemed futile"}, {"label": "B", "text": "The non-cooperation movement was a complete success"}, {"label": "C", "text": "The non-cooperation movement gained the sympathy of majority of the Indians"}, {"label": "D", "text": "The Indian National Congress represented microscopic minority"}]$JSON$::jsonb, 'C', NULL, 1, 0.25);


  -- Q2
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 2, 'The term "poor dumb millions" refer to-', $JSON$[{"label": "A", "text": "The vast number of common people who are impoverished"}, {"label": "B", "text": "Large number of common people who are hearing impaired"}, {"label": "C", "text": "Large number of people who are vulnerable"}, {"label": "D", "text": "The vast number of people who are impoverished and uneducated"}]$JSON$::jsonb, 'D', NULL, 1, 0.25);


  -- Q3
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 3, 'Which of the statements is true?', $JSON$[{"label": "A", "text": "The Swaraj movement happened before the non co-operation movement"}, {"label": "B", "text": "The non co-operation movement failed due to sudden withdrawal"}, {"label": "C", "text": "There was a fine show of communal unity in the movement"}, {"label": "D", "text": "The rich and the educated kept themselves away from the non co-operation movement"}]$JSON$::jsonb, 'C', NULL, 1, 0.25);


  -- Q4
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 4, 'The main idea of the passage is-', $JSON$[{"label": "A", "text": "The Non co-operation movement did not give impetus to the future movements"}, {"label": "B", "text": "The movement made the Indians realize their potential to fight against the mighty British"}, {"label": "C", "text": "The British became fearful and worried of Gandhiji's leadership and co-operation of Indians"}, {"label": "D", "text": "That the most positive feature of the movement was that it was repeated in later years"}]$JSON$::jsonb, 'B', NULL, 1, 0.25);


  -- Q5
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 5, 'The word "Communalism" in the above passage refers to-', $JSON$[{"label": "A", "text": "Religious identity"}, {"label": "B", "text": "Caste identity"}, {"label": "C", "text": "Regional identity"}, {"label": "D", "text": "Secularism"}]$JSON$::jsonb, 'A', NULL, 1, 0.25);


  -- Passage II
  insert into public.original_passages (section_id, passage_number, title, source, content)
  values (v_section_id, 2, 'Passage II', NULL, 'There were humans long before there was history. The archaic humans loved, played, formed close friendships and competed for status and power, but so did chimpanzees, baboons and elephants. There was nothing special about them. Nobody, least of all humans themselves, had any inkling that their descendants would one day walk on the moon, split the atom, fathom the genetic code and write history books. The most important thing to know about prehistoric humans is that they were incognisant animals with no more impact on their environment than gorillas, fireflies or jellyfish. Biologists classify organisms into species. Animals are said to belong to the same species if they tend to mate with each other, giving birth to fertile offspring. Horses and donkeys have a recent common ancestor and share many physical traits. They will mate if induced to do so but their offspring, called mules, are sterile. Mutations in donkey DNA can therefore never cross over to horses, or vice versa. The two types of animals are consequently considered two distinct species, moving along separate evolutionary paths. By contrast, a bulldog and a spaniel may look very different, but they are members of the same species, sharing the same DNA pool.')
  returning id into v_passage_id;


  -- Q6
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 6, 'Which of the following can be inferred as the most significant characteristic of prehistoric humans, as per the passage?', $JSON$[{"label": "A", "text": "Their conscious effort to alter and shape their environment for survival"}, {"label": "B", "text": "Their complex social organization and clear hierarchical structures that set them apart from other species"}, {"label": "C", "text": "Their evolutionary divergence was marked by warfare and the pursuit of dominance over rival species"}, {"label": "D", "text": "Their inability to distinguish themselves from other species in terms of environmental impact"}]$JSON$::jsonb, 'D', NULL, 1, 0.25);


  -- Q7
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 7, 'In the context of the passage, the term ''incognisant'' most likely means:', $JSON$[{"label": "A", "text": "Lacking intelligence"}, {"label": "B", "text": "Unaware of their future potential"}, {"label": "C", "text": "Incapable of social interaction"}, {"label": "D", "text": "Disinterested in the environment"}]$JSON$::jsonb, 'B', NULL, 1, 0.25);


  -- Q8
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 8, 'Which of the following best explains why humans did not initially stand out among other organisms?', $JSON$[{"label": "A", "text": "They had fewer offspring than other species"}, {"label": "B", "text": "Their behaviours were not unique compared to other animals"}, {"label": "C", "text": "They did not yet evolve the ability to use tools"}, {"label": "D", "text": "They lacked the genetic capacity to develop language"}]$JSON$::jsonb, 'B', NULL, 1, 0.25);


  -- Q9
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 9, 'According to the passage, what determines whether two animals belong to the same species?', $JSON$[{"label": "A", "text": "Their ability to produce fertile offspring"}, {"label": "B", "text": "Their physical appearance and size"}, {"label": "C", "text": "Their shared evolutionary ancestor"}, {"label": "D", "text": "Their capacity to adapt to the environment"}]$JSON$::jsonb, 'A', NULL, 1, 0.25);


  -- Q10
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 10, 'The passage explains the concept of species classification by', $JSON$[{"label": "A", "text": "Highlighting the behavioural differences between species like horses, donkeys, bulldogs and spaniels"}, {"label": "B", "text": "Focusing on the DNA pool they share"}, {"label": "C", "text": "Contrasting horses and bulldogs with donkeys and spaniels to explain reproductive compatibility"}, {"label": "D", "text": "Discussing the environmental impact of different species like horses and donkeys, and bulldogs and spaniels"}]$JSON$::jsonb, 'B', NULL, 1, 0.25);


  -- Passage III
  insert into public.original_passages (section_id, passage_number, title, source, content)
  values (v_section_id, 3, 'Passage III', NULL, 'In 1973, only 45 of the world''s 151 countries were counted as ''free'' by Freedom House, a nongovernmental organization that produces quantitative measures of civil and political rights for countries around the world. The following generation saw momentous political change, with democracies and market-oriented economies spreading in virtually every part of the world except for the Arab Middle East. This transformation was Samuel Huntington''s third wave of democratization; liberal democracy as the default form of government became part of the accepted political landscape at the beginning of the twenty-first century. Underlying these changes in political systems was a massive social transformation as well. The shift to democracy was a result of millions of formerly passive individuals around the world organizing themselves and participating in the political life of their societies. This social mobilization was driven by a host of factors: greatly expanded access to education that made people more aware of themselves and the political world around them; information technology, which facilitated the rapid spread of ideas and knowledge; cheap travel and communications that allowed people to vote with their feet if they didn''t like their government; and greater prosperity, which induced people to demand better protection of their rights. The third wave crested after the late 1990s, however, a ''democratic recession'' emerged in the first decade of the twenty-first century. Approximately one in five countries that had been part of the third wave either reverted to authoritarianism or saw a significant erosion of democratic institutions. Freedom house noted that 2009 marked the fourth consecutive year in which freedom had declined around the world, the first time this had happened since it established its measures of freedom in 1973.')
  returning id into v_passage_id;


  -- Q11
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 11, 'Which of the following aspects is most critical in understanding Freedom House''s evaluation process?', $JSON$[{"label": "A", "text": "The methodology by which it quantifies the relative freedoms in different political systems"}, {"label": "B", "text": "Its emphasis on electoral participation and voter turnout in measuring democracy"}, {"label": "C", "text": "Its role in advising governments on democratic reforms based on its rankings"}, {"label": "D", "text": "Its primary focus on economic disparities within democracies"}]$JSON$::jsonb, 'A', NULL, 1, 0.25);


  -- Q12
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 12, 'What does the phrase ''vote with their feet'' imply in the context of the passage?', $JSON$[{"label": "A", "text": "Engaging in electoral processes to demand political change"}, {"label": "B", "text": "Demonstrating political preferences through public protests"}, {"label": "C", "text": "Migrating to countries with better governance or conditions"}, {"label": "D", "text": "Participating in local government initiatives and reforms"}]$JSON$::jsonb, 'C', NULL, 1, 0.25);


  -- Q13
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 13, 'The term ''third wave of democratization'' as used in the passage refers to:', $JSON$[{"label": "A", "text": "The rise of communism in Eastern Europe"}, {"label": "B", "text": "The spread of democracy and market-oriented economies"}, {"label": "C", "text": "The decline of authoritarian regimes in the 1960s"}, {"label": "D", "text": "The global movement for civil rights"}]$JSON$::jsonb, 'B', NULL, 1, 0.25);


  -- Q14
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 14, 'Which of the following was not mentioned as a factor contributing to social mobilization and the shift to democracy?', $JSON$[{"label": "A", "text": "Increased access to education"}, {"label": "B", "text": "Expanding information technology"}, {"label": "C", "text": "Heightened global military presence"}, {"label": "D", "text": "Greater prosperity"}]$JSON$::jsonb, 'C', NULL, 1, 0.25);


  -- Q15
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 15, 'According to this passage, when was the first time the freedom had declined around the world', $JSON$[{"label": "A", "text": "1973"}, {"label": "B", "text": "1990"}, {"label": "C", "text": "2006"}, {"label": "D", "text": "2009"}]$JSON$::jsonb, 'C', NULL, 1, 0.25);


  -- Passage IV
  insert into public.original_passages (section_id, passage_number, title, source, content)
  values (v_section_id, 4, 'Passage IV', NULL, 'My kinsman and I were returning to Calcutta from our Puja trip when we encountered an unusual man on the train. At first, judging from his dress and bearing, we mistook him for an up-country boorish man. But as soon as he began to speak, our impression changed. He discoursed on every subject with such confidence that one might think the ''Disposer of All Things'' sought his counsel in every decision. Until then, we had been perfectly content, unaware of hidden forces shaping the world that the Russians were advancing, that the English were pursuing secret policies, and that confusion among native chiefs had reached its peak. Our new acquaintance, however, hinted at such matters with a sly smile, remarking: "There are more things in heaven and earth, Horatio, than are reported in your newspapers." Having never before travelled beyond our homes, we were struck dumb with wonder at his manner. No matter how trivial the topic, he could quote science, comment on the Vedas, or recite quatrains from Persian poets. Since we possessed no real knowledge of science, the Vedas, or Persian literature, our admiration for him only grew. My kinsman, a theosophist, became convinced that our fellow passenger was inspired by some strange magnetism, occult power, or astral body. He listened with devotional rapture even to the most common place remarks and secretly noted down his words. I suspect our extraordinary companion noticed this and was quietly pleased. When the train reached the junction, we gathered in the waiting room to await our connection. It was 10 p.m., and as the train was expected to be delayed owing to some fault in the lines, I spread my bed on the table and prepared to sleep. But just then, the extraordinary man began spinning a tale, and of course, I could not close my eyes all night.')
  returning id into v_passage_id;


  -- Q16
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 16, 'The narrator and his kinsman''s initial impression of the "unusual man" highlights which theme most strongly?', $JSON$[{"label": "A", "text": "The deceptive nature of appearances"}, {"label": "B", "text": "The superiority of Western education"}, {"label": "C", "text": "The danger of blind faith"}, {"label": "D", "text": "The reliability of cultural stereotypes"}]$JSON$::jsonb, 'A', NULL, 1, 0.25);


  -- Q17
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 17, 'Which literary device is most evident in the narrator''s line: "one might think the Disposer of All Things sought his counsel in every decision"?', $JSON$[{"label": "A", "text": "Irony"}, {"label": "B", "text": "Euphemism"}, {"label": "C", "text": "Allegory"}, {"label": "D", "text": "Hyperbole"}]$JSON$::jsonb, 'D', NULL, 1, 0.25);


  -- Q18
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 18, 'The word "theosophist" means:', $JSON$[{"label": "A", "text": "Skeptic"}, {"label": "B", "text": "Mystic"}, {"label": "C", "text": "Agnostic"}, {"label": "D", "text": "Materialist"}]$JSON$::jsonb, 'B', NULL, 1, 0.25);


  -- Q19
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 19, 'The word "Boorish" mean:', $JSON$[{"label": "A", "text": "Discourteous"}, {"label": "B", "text": "Genteel"}, {"label": "C", "text": "Well-bred"}, {"label": "D", "text": "Courtly"}]$JSON$::jsonb, 'A', NULL, 1, 0.25);


  -- Q20
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 20, 'The narrator''s suspicion that the extraordinary man was "quietly pleased" suggests:', $JSON$[{"label": "A", "text": "The man was genuinely humble and embarrassed by the attention"}, {"label": "B", "text": "The man wished to avoid any recognition of his authority"}, {"label": "C", "text": "The man was indifferent to how others perceived him"}, {"label": "D", "text": "The man derived satisfaction from impressing and influencing others"}]$JSON$::jsonb, 'D', NULL, 1, 0.25);


  -- Passage V
  insert into public.original_passages (section_id, passage_number, title, source, content)
  values (v_section_id, 5, 'Passage V', NULL, 'Man is the only creature that consumes without producing. He does not give milk, he does not lay eggs, he is too weak to pull the plough, and he cannot run fast enough to catch rabbits. Yet he claims dominion over all animals. He sets us to work, returns only the bare minimum to keep us from starving, and keeps the rest for himself. Our labour tills the soil, our dung fertilizes it, and still, not one of us owns more than our bare skin. You cows, look at yourselves-how many thousands of gallons of milk have you produced this past year? And what has become of it, milk that should have nurtured strong calves? Every drop has gone down the throats of our enemies. And you hens, how many eggs have you laid, and how many of those ever hatched into chicks? The rest have gone to market to bring in money for Jones and his men. And you, Clover, where are the four foals you bore, who should have supported and comforted you in your old age? Each was sold at just a year old-you will never see them again. For all your labour in the fields and your four confinements, what have you gained except bare rations and a stall? Even the lives we do live are cut short, denied their natural span. I do not grumble, for I am among the fortunate. I am twelve years old and have borne over four hundred children. Such is the natural life of a pig. But no animal escapes the cruel knife in the end. You young porkers sitting before me, each of you will scream your lives out at the block within a year. This is the fate that awaits all of us-cows, pigs, hens, sheep, everyone. Even horses and dogs share no better end. Boxer, the very day your great muscles fail you, Jones will sell you to the knacker, who will slit your throat and boil you down for the foxhounds. And the dogs, when old and toothless, are tied with a brick and drowned in the nearest pond.')
  returning id into v_passage_id;


  -- Q21
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 21, 'Which of the following best describes the tone of the passage?', $JSON$[{"label": "A", "text": "Detached and neutral"}, {"label": "B", "text": "Critical, somber, and resentful, evoking both awareness and outrage"}, {"label": "C", "text": "Humorous and light-hearted"}, {"label": "D", "text": "Admiring and celebratory"}]$JSON$::jsonb, 'B', NULL, 1, 0.25);


  -- Q22
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 22, 'The speaker frequently contrasts animals'' work with human gain. This literary technique is best classified as:', $JSON$[{"label": "A", "text": "Allegory of class exploitation"}, {"label": "B", "text": "Hyperbole for comic effect"}, {"label": "C", "text": "Irony about farm management"}, {"label": "D", "text": "Metaphor for animal biology"}]$JSON$::jsonb, 'A', NULL, 1, 0.25);


  -- Q23
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 23, 'Who is ''knacker''?', $JSON$[{"label": "A", "text": "A slaughterer"}, {"label": "B", "text": "A trader whose business is disposal of dead and unwanted animals"}, {"label": "C", "text": "A person whose business is disposal of dead or unwanted animals especially those whose flesh is not fit for human consumption"}, {"label": "D", "text": "Harness-maker"}]$JSON$::jsonb, 'C', NULL, 1, 0.25);


  -- Q24
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 24, 'The repeated reference to slaughter, drowning, and the knacker in the passage primarily implies to:', $JSON$[{"label": "A", "text": "Provide a detailed account of animal husbandry"}, {"label": "B", "text": "Evoke emotional outrage and highlight the brutality of exploitation"}, {"label": "C", "text": "Suggest that animals are naturally subservient"}, {"label": "D", "text": "Indicate that humans value animals"}]$JSON$::jsonb, 'B', NULL, 1, 0.25);


  raise notice '✅ English Language seeded';
end $$;


-- ====================================================================
-- Current Affairs Including General Knowledge (Q25-Q52)
-- ====================================================================
do $$
declare
  v_paper_id uuid;
  v_section_id uuid;
  v_passage_id uuid;
begin
  -- Get paper id
  select id into v_paper_id from public.original_papers where title = 'CLAT UG 2026 Set A' and year = 2026;
  
  -- Get section id
  select id into v_section_id from public.original_sections 
  where paper_id = v_paper_id and name = 'Current Affairs Including General Knowledge';


  -- Passage VI
  insert into public.original_passages (section_id, passage_number, title, source, content)
  values (v_section_id, 6, 'Passage VI', NULL, 'US president Donald trump has landed a triple whammy on India by torpedoing the H-1B visa programme, days after revoking sanctions waiver on Chabahar port in Iran and weeks after imposing a 50% tariff on Indian exports to the US. The White House also maintained a conspicuous silence on the Pakistan-Saudi Arabia mutual defence treaty amid reports that neither country informed Washington of the pact, suggesting a growing US indifference to India’s concerns. The triple blow has shaken US-India ties to the foundation, mystifying experts who expected a reset after an exchange of friendly messages between Modi and Trump. While some observers see in the crackdown on H-1B a pressure tactic to make India bend on the trade deal, sources familiar with the dynamics of the current White House say the two issues are unrelated and Trump was convinced of the need to “reform” the guest worker visa programme ever since MAGA hardliners persuaded him that American workers were being gamed out of jobs by foreign companies and US big tech acting in tandem.')
  returning id into v_passage_id;


  -- Q25
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 25, 'What percentage tariff did President Trump initially impose on Indian imports in 2025?', $JSON$[{"label": "A", "text": "15%"}, {"label": "B", "text": "25%"}, {"label": "C", "text": "40%"}, {"label": "D", "text": "50%"}]$JSON$::jsonb, 'B', NULL, 1, 0.25);


  -- Q26
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 26, 'What strategic reason did Donald Trump cite for penalizing India with additional tariffs apart from trade imbalances?', $JSON$[{"label": "A", "text": "India’s IT service exports"}, {"label": "B", "text": "Indian Banknote Demonetization"}, {"label": "C", "text": "India’s immigration policies"}, {"label": "D", "text": "India’s defense and energy ties with Russia"}]$JSON$::jsonb, 'D', NULL, 1, 0.25);


  -- Q27
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 27, 'What is the strategic significance of Chabahar Port for India?', $JSON$[{"label": "A", "text": "Provides trade access to China through Pakistan"}, {"label": "B", "text": "Acts as counterbalance to China’s presence in nearby Gwadar Port, Pakistan"}, {"label": "C", "text": "Serves as the primary naval base for India"}, {"label": "D", "text": "Connects India directly to the Mediterranean Sea"}]$JSON$::jsonb, 'B', NULL, 1, 0.25);


  -- Q28
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 28, 'What is the primary purpose of the H-1B Visa?', $JSON$[{"label": "A", "text": "Exchange Visitor Visa"}, {"label": "B", "text": "Employment Visa"}, {"label": "C", "text": "Immigrant visa for permanent residence in the U.S."}, {"label": "D", "text": "Non-immigrant visa that allows US companies to hire foreign professionals in specialized field"}]$JSON$::jsonb, 'D', NULL, 1, 0.25);


  -- Q29
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 29, 'The acronym ‘MAGA’ mentioned in the above passage refers to:', $JSON$[{"label": "A", "text": "Multilateral Agencies Global Association"}, {"label": "B", "text": "Make America Great Again"}, {"label": "C", "text": "Mutual Agreements for Global Advantage"}, {"label": "D", "text": "Monetary Advantage For Great America"}]$JSON$::jsonb, 'B', NULL, 1, 0.25);


  -- Passage VII
  insert into public.original_passages (section_id, passage_number, title, source, content)
  values (v_section_id, 7, 'Passage VII', NULL, 'Indian Chess recorded yet another great moment on Monday; as Divya Deshmukh won the Women’s World Cup in Georgian city of Batumi. In the final, the 19-year-old defeated fellow-Indian Koneru Humpy in the tiebreakers. While Humpy contesting the final wasn’t much of a surprise-she is the World No. 5 and has been one of the best female players for the last couple of decades-not many would have anticipated Divya’s stunning show. But, given her obvious talent and the way she has been playing for the past two years, it didn’t come as a big surprise. By winning the World Cup, one of the biggest events organized by the world chess governing body FIDE, Divya also achieved another significant milestone. She became India’s 88th Grandmaster and is only the fourth Indian Woman after Humpy, D. Harika and R. Vaishali to get that coveted title. Last year, Divya won the World junior championship in Ahmedabad with a dominant display. She also played a key role in India’s historic gold in the Chess Olympiad at Budapest. India was the top seed there, though. At the World Cup, the Indian women exceeded expectations, with four of them making it to the quarterfinals.')
  returning id into v_passage_id;


  -- Q30
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 30, 'Where is the origin of chess believed to be?', $JSON$[{"label": "A", "text": "China"}, {"label": "B", "text": "Russia"}, {"label": "C", "text": "India"}, {"label": "D", "text": "Egypt"}]$JSON$::jsonb, 'C', NULL, 1, 0.25);


  -- Q31
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 31, 'Who was the first Indian to earn the title of chess Grandmaster ?', $JSON$[{"label": "A", "text": "D. Gukesh"}, {"label": "B", "text": "Praveen Thipsay"}, {"label": "C", "text": "Dibyendu Barua"}, {"label": "D", "text": "Vishwanathan Anand"}]$JSON$::jsonb, 'D', NULL, 1, 0.25);


  -- Q32
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 32, 'Who was the first official World Chess Champion?', $JSON$[{"label": "A", "text": "Bobby Fischer"}, {"label": "B", "text": "Gary Kasparov"}, {"label": "C", "text": "Vishwanathan Anand"}, {"label": "D", "text": "Wilhelm Steinitz"}]$JSON$::jsonb, 'D', NULL, 1, 0.25);


  -- Q33
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 33, 'Which of the following computers successfully defeated Garry Kasparov, the reigning world chess champion, in a tournament match?', $JSON$[{"label": "A", "text": "Deep AI"}, {"label": "B", "text": "Deep Thought"}, {"label": "C", "text": "Deep Blue"}, {"label": "D", "text": "Deep Water"}]$JSON$::jsonb, 'C', NULL, 1, 0.25);


  -- Q34
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 34, 'Which of the following cities is the venue for hosting the 11th edition of Chess World Cup 2025?', $JSON$[{"label": "A", "text": "Paris, France"}, {"label": "B", "text": "Baku, Azerbaijan"}, {"label": "C", "text": "Goa, India"}, {"label": "D", "text": "Chennai, India"}]$JSON$::jsonb, 'C', NULL, 1, 0.25);


  -- Passage VIII
  insert into public.original_passages (section_id, passage_number, title, source, content)
  values (v_section_id, 8, 'Passage VIII', NULL, 'I rise to apprise this august House of the foreign policy dimension of our response to the Pahalgam terrorist attack, going into the preparations for Operation Sindoor and how foreign policy was handled during Operation Sindoor. As all the honourable members would appreciate, it was important to send a clear, strong and resolute message after the Pahalgam attack. Our red lines had been crossed and we had to make it very apparent that there would be serious consequences. As a result, the first step which was taken was that a meeting of the Cabinet Committee of Security took place on the 23rd of April, and that meeting decided that: ● One, the Indus Water Treaty of 1960 will be held in abeyance with immediate effect until Pakistan credibly and irrevocably abjures its support for cross-border terrorism. ● Two, the integrated checkpost Attari would be closed with immediate effect. ● Three, Pakistani nationals who were traveling under SAARC visa exemption scheme would no longer be allowed to do that. ● Four, the Defence, Naval and Air Advisors of the Pakistani High Commission would be declared persona non-grata and, ● Five, the overall strength of the High Commission would be brought down to 30 from the number of 55.')
  returning id into v_passage_id;


  -- Q35
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 35, 'Where is Pahalgam situated in India?', $JSON$[{"label": "A", "text": "Punjab"}, {"label": "B", "text": "Himachal Pradesh"}, {"label": "C", "text": "Jammu & Kashmir"}, {"label": "D", "text": "Uttarakhand"}]$JSON$::jsonb, 'C', NULL, 1, 0.25);


  -- Q36
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 36, 'The Checkpost Attari is located in', $JSON$[{"label": "A", "text": "Near Amritsar Punjab"}, {"label": "B", "text": "Near Baramulla in Jammu & Kashmir"}, {"label": "C", "text": "Near Kutch in Gujrat"}, {"label": "D", "text": "Near Barmer in Rajasthan"}]$JSON$::jsonb, 'A', NULL, 1, 0.25);


  -- Q37
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 37, 'Which amongst the following is not a SAARC Nation?', $JSON$[{"label": "A", "text": "Afghanistan"}, {"label": "B", "text": "Maldives"}, {"label": "C", "text": "Mauritius"}, {"label": "D", "text": "Bangladesh"}]$JSON$::jsonb, 'C', NULL, 1, 0.25);


  -- Q38
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 38, 'Expression ‘Persona Non Grata’ means:', $JSON$[{"label": "A", "text": "An ungrateful person"}, {"label": "B", "text": "An unwelcome person"}, {"label": "C", "text": "An untrustworthy person"}, {"label": "D", "text": "A displaced person"}]$JSON$::jsonb, 'B', NULL, 1, 0.25);


  -- Q39
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 39, 'The Indus Water Treaty signed in 1960 between India and Pakistan was facilitated by:', $JSON$[{"label": "A", "text": "The United Nations General Assembly"}, {"label": "B", "text": "The United Nations Security Council"}, {"label": "C", "text": "The World Bank"}, {"label": "D", "text": "The permanent Indus Commission"}]$JSON$::jsonb, 'C', NULL, 1, 0.25);


  -- Q40
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 40, 'Which amongst the following is not a tributary of River Indus?', $JSON$[{"label": "A", "text": "Ravi"}, {"label": "B", "text": "Jhelum"}, {"label": "C", "text": "Tapti"}, {"label": "D", "text": "Chenab"}]$JSON$::jsonb, 'C', NULL, 1, 0.25);


  -- Passage IX
  insert into public.original_passages (section_id, passage_number, title, source, content)
  values (v_section_id, 9, 'Passage IX', NULL, 'Prime Minister Shri Narendra Modi participated in the 25th Meeting of the Council of Heads of State of the Shanghai Cooperation Organization (SCO), held in Tianjin, China, from 31 August to 1 September 2025. The Summit witnessed productive discussions on SCO Development Strategy, Reform of Global Governance, Counter-Terrorism, Peace and Security, Economic and Financial Cooperation, and Sustainable Development. Addressing the Summit, Prime Minister highlighted India’s approach to strengthening cooperation under the SCO framework. In this regard, he noted that India seeks greater action under three pillars – Security, Connectivity and Opportunity. Emphasising that peace, security and stability remain key to progress and prosperity, he called upon member countries to take firm and decisive action to fight terrorism in all its manifestations. Prime Minister underlined the need for coordinated action against terror financing and radicalization. Thanking member countries for their strong solidarity in the wake of the Pahalgam terror attack, he emphasized that there should be no double standards in dealing with terrorism and urged the group to hold countries who perpetrate and support cross-border terrorism accountable. Highlighting the role of connectivity in fostering development and building trust, Prime Minister stated that India strongly supported projects such as Chabahar port and International North-South Transport Corridor. He also spoke about opportunities in the fields of start-ups, innovation, youth empowerment and shared heritage, which must be pursued under the SCO umbrella. Prime Minister proposed commencing a Civilizational Dialogue Forum within the group to foster greater people-to-people ties and cultural understanding.')
  returning id into v_passage_id;


  -- Q41
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 41, 'The civilizational dialogue forum (CDF) proposed by the Prime Minister of India at the 25th Meeting of Shanghai Cooperation Organization, is intended to promote', $JSON$[{"label": "A", "text": "Peace and security"}, {"label": "B", "text": "Sustainable development"}, {"label": "C", "text": "Reform of Global governance"}, {"label": "D", "text": "Cultural Understanding"}]$JSON$::jsonb, 'D', NULL, 1, 0.25);


  -- Q42
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 42, 'The next Presidency of SCO is taken over by:', $JSON$[{"label": "A", "text": "Kyrgyzstan"}, {"label": "B", "text": "Tajikistan"}, {"label": "C", "text": "Uzbekistan"}, {"label": "D", "text": "Kazakhistan"}]$JSON$::jsonb, 'A', NULL, 1, 0.25);


  -- Q43
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 43, 'Prime Minister of India stated that India strongly supported projects such as Chabahar port. Where is this port located?', $JSON$[{"label": "A", "text": "Oman"}, {"label": "B", "text": "Iran"}, {"label": "C", "text": "Afghanistan"}, {"label": "D", "text": "Saudi Arabia"}]$JSON$::jsonb, 'B', NULL, 1, 0.25);


  -- Q44
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 44, 'Which of the following countries is not a member of SCO?', $JSON$[{"label": "A", "text": "Belarus"}, {"label": "B", "text": "Iran"}, {"label": "C", "text": "Pakistan"}, {"label": "D", "text": "Myanmar"}]$JSON$::jsonb, 'D', NULL, 1, 0.25);


  -- Q45
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 45, 'The Secretariat of SCO is located in:', $JSON$[{"label": "A", "text": "Beijing, China"}, {"label": "B", "text": "Tianjin, China"}, {"label": "C", "text": "Shanghai, China"}, {"label": "D", "text": "Wuhan, China"}]$JSON$::jsonb, 'A', NULL, 1, 0.25);


  -- Q46
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 46, 'At the conclusion of 25th SCO summit, the member countries adopted the:', $JSON$[{"label": "A", "text": "Beijing Declaration"}, {"label": "B", "text": "Tianjin Declaration"}, {"label": "C", "text": "Shanghai Declaration"}, {"label": "D", "text": "Wuhan Declaration"}]$JSON$::jsonb, 'B', NULL, 1, 0.25);


  -- Passage X
  insert into public.original_passages (section_id, passage_number, title, source, content)
  values (v_section_id, 10, 'Passage X', NULL, 'Air India stands in solidarity with the families and those affected by the AI-171 accident. We continue to mourn their loss and remain fully committed to providing support during this difficult time. Over a month ago, Air India started releasing interim payment of Rs 25 lakh to the affected families, to help them meet their immediate financial needs. The interim payment will be adjusted against any final compensation. Air India has, so far, released the interim compensation to the families of 147 of the 229 deceased passengers and also the 19 who lost their lives at the accident site. In addition, the requisite documents of 52 others have been verified, to whose families the interim compensation will be released progressively. The Tata Group has also registered ‘The AI-171 Memorial and Welfare Trust’, dedicated to the victims of the unfortunate accident. The Trust has pledged an ex-gratia payment of Rs 1 crore in respect of each of the deceased, and support for rebuilding the B.J. Medical College Hostel infrastructure, which was damaged in the accident. The Trust will also provide aid and assistance for alleviation of any trauma or distress suffered by the first responders, medical and disaster relief professionals, social workers, and governmental staff who provided invaluable institutional support and service in the aftermath of the accident.')
  returning id into v_passage_id;


  -- Q47
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 47, 'Air India flight AI-171 was operating from Ahmedabad to:', $JSON$[{"label": "A", "text": "London Gatwick airport"}, {"label": "B", "text": "Heathrow Airport"}, {"label": "C", "text": "London Luton Airport"}, {"label": "D", "text": "London Stansted Airport"}]$JSON$::jsonb, 'A', NULL, 1, 0.25);


  -- Q48
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 48, 'Who is the Minister of Civil Aviation of India?', $JSON$[{"label": "A", "text": "Shri Piyush Goyal"}, {"label": "B", "text": "Shri Jyotiraditya Scindia"}, {"label": "C", "text": "Shri Ram Mohan Naidu"}, {"label": "D", "text": "Shri Prafulla Patel"}]$JSON$::jsonb, 'C', NULL, 1, 0.25);


  -- Q49
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 49, 'The AI-171 Memorial and Welfare Trust'' is registered by Tata Group as a public charitable trust in:', $JSON$[{"label": "A", "text": "Ahmedabad"}, {"label": "B", "text": "Gandhinagar"}, {"label": "C", "text": "Mumbai"}, {"label": "D", "text": "Delhi"}]$JSON$::jsonb, 'C', NULL, 1, 0.25);


  -- Q50
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 50, 'The sole survivor of ''The Air India flight AI-171 accident'' is:', $JSON$[{"label": "A", "text": "British National of Indian Origin"}, {"label": "B", "text": "Canadian National of Indian origin"}, {"label": "C", "text": "Portuguese National of Indian Origin"}, {"label": "D", "text": "Indian National"}]$JSON$::jsonb, 'A', NULL, 1, 0.25);


  -- Q51
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 51, 'The agency that probes the fatal crash of AI-171 is:', $JSON$[{"label": "A", "text": "DGCA"}, {"label": "B", "text": "AAI"}, {"label": "C", "text": "AAIB"}, {"label": "D", "text": "FIP"}]$JSON$::jsonb, 'C', NULL, 1, 0.25);


  -- Q52
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 52, 'The Air India flight AI-171 was:', $JSON$[{"label": "A", "text": "Boeing 737-800 aircraft"}, {"label": "B", "text": "Boeing 787-8 Dreamliner"}, {"label": "C", "text": "Boeing 737 Max aircraft"}, {"label": "D", "text": "Boeing Next Generation 737"}]$JSON$::jsonb, 'B', NULL, 1, 0.25);


  raise notice '✅ Current Affairs Including General Knowledge seeded';
end $$;


-- ====================================================================
-- Legal Reasoning (Q53-Q82)
-- ====================================================================
do $$
declare
  v_paper_id uuid;
  v_section_id uuid;
  v_passage_id uuid;
begin
  -- Get paper id
  select id into v_paper_id from public.original_papers where title = 'CLAT UG 2026 Set A' and year = 2026;
  
  -- Get section id
  select id into v_section_id from public.original_sections 
  where paper_id = v_paper_id and name = 'Legal Reasoning';


  -- Passage XI
  insert into public.original_passages (section_id, passage_number, title, source, content)
  values (v_section_id, 11, 'Passage XI', NULL, 'One of the central motifs of the past decade of governance under Indian Prime Minister has been the embrace of policy measures that seek to apply uniform solutions to disparate policy dilemmas facing the country. These measures, often termed One Nation policies, are motivated by a desire to replace the existing patchwork of state-specific policies, regulations, and regimes with measures that are identical across the length and breadth of India. There are numerous examples of such One Nation policies being propagated and, in several cases, implemented in the eleven years since this Government came to power. For instance, in 2016, Parliament passed a series of constitutional amendments to introduce a new Goods and Services Tax (GST), which introduced a unified value-added tax in place of state-specific levies. This reform, known informally as One Nation, One Tax, had been debated and discussed for nearly two decades and was widely touted as an important precursor to forging a common market across India’s twenty-eight states. In a similar vein, the government rolled out a new initiative to allow Indian citizens to take advantage of subsidized food rations irrespective of their state of residence. This scheme, commonly termed One Nation, One Ration Card, was intended to increase access to welfare benefits, especially for the millions of internal migrants in India without a fixed place of residence. Earlier this year, the government announced the launch of a new online portal that will provide students, faculty, and researchers across the country’s public higher education institutions with open access to international scholarly journals and articles under a scheme it has dubbed One Nation, One Subscription. Most notably, the government recently signalled its intention to pursue a monumental One Nation policy that has been long discussed but only recently outlined in detail. This measure, known as One Nation, One Election, would do away with India’s current system of staggered elections for state and national assemblies, replacing it with a framework of simultaneous elections. The proposal, which has featured in many of PM’s speeches in the past, was advanced by a high-level committee (HLC) established by the government in 2023.')
  returning id into v_passage_id;


  -- Q53
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 53, 'What is the underlying idea behind the “One Nation” policies of the government?', $JSON$[{"label": "A", "text": "To strengthen federalism by empowering states with greater autonomy"}, {"label": "B", "text": "To apply uniform solutions across India, replacing state-specific variations"}, {"label": "C", "text": "To decentralize governance to local self-government institutions"}, {"label": "D", "text": "To promote diversity by encouraging state-specific policies"}]$JSON$::jsonb, 'B', NULL, 1, 0.25);


  -- Q54
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 54, 'Which of the following Constitution Amendment Bill deals with empowerment of the Election Commission of India (ECI) to implement simultaneous state and national elections.', $JSON$[{"label": "A", "text": "One Hundred and Twenty-Ninth Amendment"}, {"label": "B", "text": "One Hundred and Twenty-Eighth Amendment"}, {"label": "C", "text": "One Hundred and Twenty-Seventh Amendment"}, {"label": "D", "text": "One Hundred and Twenty-Sixth Amendment"}]$JSON$::jsonb, 'A', NULL, 1, 0.25);


  -- Q55
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 55, 'Which committee or report has discussed the feasibility of simultaneous elections in India?', $JSON$[{"label": "A", "text": "Justice Verma Committee 2013"}, {"label": "B", "text": "Law Commission of India Report 2018"}, {"label": "C", "text": "Sarkaria Commission Report 1988"}, {"label": "D", "text": "Punchhi Commission Report 2010"}]$JSON$::jsonb, 'B', NULL, 1, 0.25);


  -- Q56
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 56, 'A High-Level Committee was constituted by the government to examine the policy of One Nation One Election. The Committee was led by:', $JSON$[{"label": "A", "text": "Shri Ram Nath Kovind"}, {"label": "B", "text": "Shri Jagdip Dhankar"}, {"label": "C", "text": "Shri Pranab Mukherjee"}, {"label": "D", "text": "Smt. Draupadi Murmu"}]$JSON$::jsonb, 'A', NULL, 1, 0.25);


  -- Q57
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 57, 'As per the new GST reforms introduced in September 2025, the structure of new GST rates are as follows', $JSON$[{"label": "A", "text": "5%, 12%, 18% and 28%"}, {"label": "B", "text": "5%, 12% and 18%"}, {"label": "C", "text": "5%, 12% and 40%"}, {"label": "D", "text": "5%, 18% and 40%"}]$JSON$::jsonb, 'D', NULL, 1, 0.25);


  -- Q58
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 58, 'The object of One Nation, One Ration Card scheme is to benefit:', $JSON$[{"label": "A", "text": "The rural population"}, {"label": "B", "text": "The Farmers"}, {"label": "C", "text": "The Migrant labourers"}, {"label": "D", "text": "The ration shopkeepers"}]$JSON$::jsonb, 'C', NULL, 1, 0.25);


  -- Passage XII
  insert into public.original_passages (section_id, passage_number, title, source, content)
  values (v_section_id, 12, 'Passage XII', NULL, 'I may here trace the history of the shaping of the Preamble because this would show that the Preamble was in conformity with the Constitution as it was finally accepted. Not only was the Constitution framed in the light of the Preamble but the Preamble was ultimately settled in the light of the Constitution. In the earliest draft the Preamble was something formal and read: "We, the people of India, seeking to promote the common good, do hereby, through our chosen representatives, enact, adopt and give to ourselves this Constitution. After the plan of June 3, 1947, which led to the decision to partition the country and to set up two independent Dominions of India and Pakistan, on June 8, 1947, a joint sub-committee of the Union Constitution and Provincial Constitution Committees, took note that the objective resolution would require amendment in view of the latest announcement of the British Government. The announcement of June 3 had made it clear that full independence, in the form of Dominion Status, would be conferred on India as from August 15, 1947. After examining the implications of partition the sub-committee thought that the question of making changes in the Objectives Resolution could appropriately be considered only when effect had actually been given to the June 3 Plan. Later on July 12, 1947, the special sub-committee again postponed consideration of the matter. The Union Constitution Committee provisionally accepted the Preamble as drafted by B.N. Rao and reproduced it in its report of July 4, 1947 without any change, with the tacit recognition at that stage that the Preamble would be finally based on the Objectives Resolution. In a statement circulated to members of the Assembly on July 18, 1947 Pandit Jawaharlal Nehru inter alia, observed that the Preamble was covered more or less by the Objectives Resolution which it was intended to incorporate in the final Constitution, subject to some modification on account of the political changes resulting from partition.')
  returning id into v_passage_id;


  -- Q59
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 59, 'According to the passage, the relationship between the Constitution and the Preamble can best be described as:', $JSON$[{"label": "A", "text": "The Preamble was drafted in isolation"}, {"label": "B", "text": "The Constitution and the Preamble were framed independent of each other"}, {"label": "C", "text": "Both the Constitution and the Preamble were shaped in light of each other"}, {"label": "D", "text": "The Preamble had no relevance to the Constitution"}]$JSON$::jsonb, 'C', NULL, 1, 0.25);


  -- Q60
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 60, 'What did the earliest draft of the Preamble emphasize?', $JSON$[{"label": "A", "text": "Liberty, equality, and fraternity"}, {"label": "B", "text": "Sovereign, socialist, secular democratic republic"}, {"label": "C", "text": "Formal enactment by the people through representatives"}, {"label": "D", "text": "Unity and integrity of the nation"}]$JSON$::jsonb, 'C', NULL, 1, 0.25);


  -- Q61
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 61, 'Which of the following is not enshrined in the Preamble of the Constitution of India?', $JSON$[{"label": "A", "text": "Equality of status and of opportunity"}, {"label": "B", "text": "Liberty of thought, expression, belief, faith and worship"}, {"label": "C", "text": "Justice-moral, ethical and legal"}, {"label": "D", "text": "Fraternity assuring the dignity of the individual"}]$JSON$::jsonb, 'C', NULL, 1, 0.25);


  -- Q62
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 62, 'Which has been rightly arranged according to the Preamble of the Constitution of India-', $JSON$[{"label": "A", "text": "Sovereign Socialist Secular Democratic Republic"}, {"label": "B", "text": "Sovereign Secular Socialist Democratic Republic"}, {"label": "C", "text": "Sovereign Socialist Democratic Secular Republic"}, {"label": "D", "text": "Secular, Socialist, Sovereign and Democratic Republic"}]$JSON$::jsonb, 'A', NULL, 1, 0.25);


  -- Q63
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 63, 'The Preamble of the Constitution of India is finally based on:', $JSON$[{"label": "A", "text": "The Objectives Resolution"}, {"label": "B", "text": "The Report of the Union Constitution Committee"}, {"label": "C", "text": "The June 3 plan of the British Government"}, {"label": "D", "text": "The Report of special Sub-committee of the Constituent Assembly"}]$JSON$::jsonb, 'A', NULL, 1, 0.25);


  -- Q64
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 64, 'What was the role of Sir B. N. Rau in the making of the Indian Constitution?', $JSON$[{"label": "A", "text": "Chairman of the Drafting Committee"}, {"label": "B", "text": "Constitutional Advisor to the Constituent Assembly"}, {"label": "C", "text": "President of the Constituent Assembly"}, {"label": "D", "text": "Member of the Union Powers Committee"}]$JSON$::jsonb, 'B', NULL, 1, 0.25);


  -- Passage XIII
  insert into public.original_passages (section_id, passage_number, title, source, content)
  values (v_section_id, 13, 'Passage XIII', NULL, 'Good governance is only in the hands of good men. No doubt, what is good or bad is not for the court to decide: but the court can always indicate the constitutional ethos on goodness, good governance and purity in administration remind the constitutional functionaries to preserve, protect and promote the same. That ethos are the unwritten words in our Constitution. However, as the Constitution makers stated, there is a presumption that the Prime Minister/Chief Minister would be well advised and guided by such unwritten yet constitutional principles as well. According to Dr. B. R. Ambedkar, such things were only to be left to the good sense of the Prime Minister, and for that matter, the Chief Minister of State, since it was expected that the two great constitutional functionaries would not dare to do any infamous thing by inducting an otherwise unfit person to the Council of Ministers. It appears, over a period of time, at least in some cases, it was only a story of great expectations. Some of the instances pointed out in the writ petition indicate that Dr. Ambedkar and other great visionaries in the Constituent Assembly have been bailed out. Qualification has been wrongly understood as the mere absence of prescribed disqualification. Hence, it has become the bounden duty of the court to remind the Prime Minister and the Chief Minister of the State of their duty to act in accordance with the constitutional aspirations. No doubt, it is not for the court to issue any direction to the Prime Minister or the Chief Minister, as the case may be, as to the manner in which they should exercise their power while selecting the colleagues in the Council of Ministers. That is the constitutional prerogative of those functionaries who are called upon to preserve, protect and defend the Constitution. But it is the prophetic duty of this Court to remind the key duty holders about their role in working the Constitution. Hence, I am of the firm view, that the Prime Minister and the Chief Minister of the State, who themselves have taken oath to bear true faith and allegiance to the Constitution of India and to discharge their duties faithfully and conscientiously, will be well advised to consider avoiding any person in the Council of Ministers, against whom charges have been framed by a criminal court in respect of offences involving moral turpitude and also offences specifically referred to in Chapter III of The Representation of the People Act, 1951.')
  returning id into v_passage_id;


  -- Q65
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 65, 'According to the passage, the Court cannot decide what is “good” or “bad” governance, but it can:', $JSON$[{"label": "A", "text": "Disqualify Ministers from holding office"}, {"label": "B", "text": "Indicate constitutional ethos on governance and remind functionaries of their duty"}, {"label": "C", "text": "Frame rules on qualifications of Ministers"}, {"label": "D", "text": "Amend the Constitution to insert explicit standards of morality"}]$JSON$::jsonb, 'B', NULL, 1, 0.25);


  -- Q66
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 66, 'Dr. B.R. Ambedkar believed that the working of the Constitution ultimately depends on:', $JSON$[{"label": "A", "text": "The rigidity of the constitutional text"}, {"label": "B", "text": "The good sense and integrity of those who are going to administer this constitution"}, {"label": "C", "text": "The presence of a strong opposition"}, {"label": "D", "text": "Judicial intervention in governance"}]$JSON$::jsonb, 'B', NULL, 1, 0.25);


  -- Q67
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 67, 'The Court, while respecting the prerogative of the Prime Minister and Chief Minister to select Ministers emphasized that:', $JSON$[{"label": "A", "text": "They should avoid appointing persons against whom criminal charges involving moral turpitude are framed"}, {"label": "B", "text": "They must appoint Ministers strictly from the ruling party only"}, {"label": "C", "text": "They should consult the Supreme Court before finalizing appointments"}, {"label": "D", "text": "They are bound to appoint only members of the Lok Sabha/Legislative Assembly"}]$JSON$::jsonb, 'A', NULL, 1, 0.25);


  -- Q68
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 68, 'What role does the Court assume, as described in the passage, regarding governance and appointments to the Council of Ministers?', $JSON$[{"label": "A", "text": "Judicial review of all ministerial appointments"}, {"label": "B", "text": "Prophetic duty to remind key functionaries of their constitutional role"}, {"label": "C", "text": "Power to veto ministerial selections made by the Prime Minister"}, {"label": "D", "text": "Directing Parliament to amend the law on disqualification"}]$JSON$::jsonb, 'B', NULL, 1, 0.25);


  -- Q69
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 69, 'Who are the constitutional functionaries, this passage primarily refers to?', $JSON$[{"label": "A", "text": "Council of Ministers"}, {"label": "B", "text": "Prime Minister and Council of Ministers"}, {"label": "C", "text": "Chief Minister and Council of Ministers"}, {"label": "D", "text": "Prime Minister and Chief Minister"}]$JSON$::jsonb, 'D', NULL, 1, 0.25);


  -- Q70
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 70, 'Who, according to the above passage shall not be appointed as a Minister?', $JSON$[{"label": "A", "text": "Against whom charges have been framed in a court of law"}, {"label": "B", "text": "Against whom charges involving moral turpitude have been framed in a court of law"}, {"label": "C", "text": "Against whom charges have been proved in a court of law"}, {"label": "D", "text": "Against whom case is pending in a court of law"}]$JSON$::jsonb, 'B', NULL, 1, 0.25);


  -- Passage XIV
  insert into public.original_passages (section_id, passage_number, title, source, content)
  values (v_section_id, 14, 'Passage XIV', NULL, 'The recent Supreme Court judgment in State of Tamil Nadu v. Governor of Tamil Nadu (2025) affirmed that a Governor cannot exercise an absolute or "pocket" veto on bills, holding that if assent is withheld, the bill must be returned to the legislature “as soon as possible” for reconsideration, with the Governor having no discretion to withhold assent again. The court established that inaction or indefinite delay is illegal and unconstitutional, prescribing timelines for the Governor''s decision and even “deeming assent” on pending bills in the Tamil Nadu case, establishing a critical precedent for judicial review of gubernatorial powers. The Supreme Court explicitly rejected the Governor’s power to an absolute or “pocket” veto, which allows for bills to be indefinitely delayed. If a Governor withholds assent to a bill, they are constitutionally obligated to return it to the State Assembly for reconsideration, according to the proviso in Article 200 of the Constitution. If the State Assembly re-enacts a bill after it has been returned by the Governor, the Governor has no choice but to give assent to it and cannot withhold it for a second time. The Court held that indefinitely delaying or remaining silent on bills is unconstitutional and that Governors must act “as soon as possible” on bills. The judgment expanded the scope of judicial review by setting timelines for the Governor’s actions on bills, allowing state governments to approach courts if these timelines are breached. In the case of the Tamil Nadu, the Court used its powers under Article 142 to “deem assent” on the long-pending bills, which had the effect of making any subsequent decision by the President on those bills void.')
  returning id into v_passage_id;


  -- Q71
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 71, 'The Legislative Assembly of State X passes a controversial bill and sends it to the Governor for assent. The Governor, strongly disagreeing with the bill''s provisions, decides to neither give assent nor return the bill, hoping it will be forgotten over the time. Which of the following statements accurately describes the legal position of the Governor''s action?', $JSON$[{"label": "A", "text": "The Governor’s action is a legitimate exercise of a “pocket veto”, allowing for indefinite delay of bills"}, {"label": "B", "text": "The Governor’s inaction is unconstitutional, as the Supreme Court has explicitly rejected the power to an absolute or “pocket” veto, and they are obligated to return the bill “as soon as possible” if assent is withheld"}, {"label": "C", "text": "The Governor is within their rights to delay the bill indefinitely as long as they do not explicitly reject it, reflecting the true spirit of gubernatorial discretion"}, {"label": "D", "text": "The bill will automatically lapse after six months of gubernatorial inaction, making the delay a de facto rejection"}]$JSON$::jsonb, 'B', NULL, 1, 0.25);


  -- Q72
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 72, 'Governor Y receives a bill from the State Assembly and, after careful consideration, decides to withhold assent, promptly returning it with a message for reconsideration. The State Assembly then re-enacts the bill without any change and sends it back to Governor Y. What is the constitutional obligation of Governor Y at this point?', $JSON$[{"label": "A", "text": "Governor Y has no choice but to give assent to the re-enacted bill, as the Supreme Court has ruled that the Governor cannot withhold assent for a second time"}, {"label": "B", "text": "Governor Y can again withhold assent if they continue to disagree with the bill’s content, sending it back for further reconsideration"}, {"label": "C", "text": "Governor Y can refer the bill to the President of India for a final decision, exercising a higher discretionary power"}, {"label": "D", "text": "Governor Y can dissolve the State Assembly for consistently passing erroneous bills"}]$JSON$::jsonb, 'A', NULL, 1, 0.25);


  -- Q73
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 73, 'After the Supreme Court''s judgment in State of Tamil Nadu v. Governor of Tamil Nadu (2025), a State Governor holds a bill for eight months without taking any action—neither assenting nor returning it. The State Government believes that this delay is unconstitutional. Based on the precedent set by the judgment, what recourse is available to the State Government?', $JSON$[{"label": "A", "text": "The State Government must wait for a full year before any action can be taken, as gubernatorial delays are typically permitted for this duration"}, {"label": "B", "text": "The bill automatically lapses after six months of inaction, making any further action by the State Government unnecessary"}, {"label": "C", "text": "The State Government's only recourse is to re-enact the bill, which would then compel the Governor to act"}, {"label": "D", "text": "The State Government can approach the courts, as the judgment had prescribed timelines for the Governor’s actions on bills since indefinite delay was construed unconstitutional"}]$JSON$::jsonb, 'D', NULL, 1, 0.25);


  -- Q74
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 74, 'In a situation mirroring the Tamil Nadu case, a Supreme Court bench is reviewing several instances where a particular Governor has indefinitely delayed assent on multiple bills passed by the State Assembly, despite Constitutional obligations. If the Supreme Court decides to follow the precedent established in State of Tamil Nadu v. Governor of Tamil Nadu (2025) regarding pending bills, what would be a likely outcome for these delayed bills?', $JSON$[{"label": "A", "text": "The Supreme Court would order the Governor to explicitly reject all the delayed bills"}, {"label": "B", "text": "The Supreme Court would direct the State Assembly to conduct a public referendum on each delayed bill"}, {"label": "C", "text": "The Supreme Court could deem assent on the pending bills, establishing a critical precedent for judicial review of gubernatorial powers in such cases, as it did in the Tamil Nadu case"}, {"label": "D", "text": "The Supreme Court would advise the Governor to seek legal counsel and then re-evaluate each bill individually without a set timeline"}]$JSON$::jsonb, 'C', NULL, 1, 0.25);


  -- Q75
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 75, 'A newly appointed Governor publicly declares that he intend to use his discretion to permanently halt any legislation he deems inappropriate, by simply not acting on the bills, citing an inherent gubernatorial power. How does this declaration align with the constitutional interpretation provided by the Supreme Court of India?', $JSON$[{"label": "A", "text": "The Governor's declaration is consistent with the broad discretionary powers traditionally afforded to Governors, allowing them significant influence over state legislation"}, {"label": "B", "text": "The Governor’s declaration is valid only for non-money bills, as money bills have different Constitutional protocols"}, {"label": "C", "text": "The Governor’s declaration is partially valid, as indefinite delay is permissible only if the State Assembly is not in session"}, {"label": "D", "text": "The Governor’s declaration is unconstitutional; the Supreme Court explicitly rejected the Governor’s power to an absolute or “pocket” veto"}]$JSON$::jsonb, 'D', NULL, 1, 0.25);


  -- Q76
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 76, 'What are the three primary courses of action for a Governor when a Bill is enacted by the State Assembly and sent to him/her for his/her assent. Which option correctly lists these three courses?', $JSON$[{"label": "A", "text": "(i) Give assent, (ii) Veto absolutely, or (iii) Refer to the Supreme Court"}, {"label": "B", "text": "(i) Give assent, (ii) Withhold assent (allowing the Bill to fail, unless the proviso is followed), or (iii) Recommend amendments"}, {"label": "C", "text": "(i) Give assent, (ii) Withhold assent (with the option to return for reconsideration), or (iii) Reserve for the consideration of the President"}, {"label": "D", "text": "(i) Give assent, (ii) Return for reconsideration, or (iii) Refer to the Union Government"}]$JSON$::jsonb, 'C', NULL, 1, 0.25);


  -- Passage XV
  insert into public.original_passages (section_id, passage_number, title, source, content)
  values (v_section_id, 15, 'Passage XV', NULL, 'Same-sex marriage has no legal recognition in India as per the recent Supreme Court''s judgment, where it was decided that this is an issue for Parliament to address. While Hindu marriages between transgender persons and cisgender men are permissible, and the Court acknowledged systemic discrimination and the right to choose a partner, it held that there is no fundamental right to marry. The government has been urged to form a panel to consider granting more legal rights to same-sex couples, but the legal status of marriage remains unchanged for now. The five-judge bench of the Supreme Court of India in Supriyo @ Supriya Chakraborty & Anr. v. Union of India (2023), in a majority verdict, ruled that there is no fundamental right to marry under the Indian Constitution, making it beyond the court''s scope to legislate on same-sex marriage. The Court stated that the power to legislate on same-sex marriage rests with the Parliament and state legislatures. The judgment affirmed constitutional rights for LGBTQ+ citizens and the right to choose a partner. The government agreed to set up a panel to explore legal rights and benefits for same-sex couples, though these benefits are not the same as those conferred by marriage. Same-sex couples cannot legally marry and do not receive the same legal rights, such as automatic inheritance, pension, or adoption rights, that legally married couples do. Despite the ruling, LGBTQ+ couples continue to face legal discrimination and have no social recognition of marriage. The Court affirmed the right of same-sex couples to cohabit privately. While the Supreme Court''s verdict brought limited benefits and acknowledgments, it has not legalized same-sex marriage in India, deferring the ultimate decision to the Parliament.')
  returning id into v_passage_id;


  -- Q77
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 77, 'In October 2023, two individuals in India, Ramesh and Sameer, who identify as a same-sex couple, sought to legally solemnize their marriage. Based on the Supreme Court''s ruling, what is the current legal standing of their ability to marry?', $JSON$[{"label": "A", "text": "Their marriage is legally recognized nationwide under a new constitutional right"}, {"label": "B", "text": "Their marriage is not legally recognized, as the Supreme Court ruled that this issue is for Parliament to address"}, {"label": "C", "text": "Their marriage is recognized only if both of them identify as transgender"}, {"label": "D", "text": "Their marriage is temporarily recognized until Parliament decides otherwise"}]$JSON$::jsonb, 'B', NULL, 1, 0.25);


  -- Q78
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 78, 'During a legal proceeding in India, an advocate argues that the Supreme Court should directly legislate on same-sex marriage because the right to choose a partner inherently implies a fundamental right to marry for all citizens. How would the Supreme Court''s judgment likely to counter this argument?', $JSON$[{"label": "A", "text": "The Court acknowledged the right to choose a partner, therefore it would agree to legislate on marriage"}, {"label": "B", "text": "The Court held that there is no fundamental right to marry under the Indian Constitution, and such a policy can be made only by the Parliament"}, {"label": "C", "text": "The Court has held that it will set up a panel to look into the fundamental right to marry"}, {"label": "D", "text": "The Court upheld the fundamental right to marry, but declined to recognise same sex marriage"}]$JSON$::jsonb, 'B', NULL, 1, 0.25);


  -- Q79
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 79, 'Following the Supreme Court''s decision, an LGBTQ+ advocacy group in India aims to achieve legal recognition for same-sex marriage. To which governmental body or bodies should this group primarily direct its lobbying efforts to secure the necessary legislation?', $JSON$[{"label": "A", "text": "The Supreme Court of India, as they are ultimately responsible for interpreting constitutional rights"}, {"label": "B", "text": "The President of India as head of the Union legislature"}, {"label": "C", "text": "The Parliament and state legislatures, as the power to legislate on same-sex marriage rests with them"}, {"label": "D", "text": "The National Commission for Human Rights, to advocate for a new directive"}]$JSON$::jsonb, 'C', NULL, 1, 0.25);


  -- Q80
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 80, 'While same-sex marriage is not legally recognized in India, however, the Supreme Court''s verdict did offer some acknowledgments of rights for same-sex couples. Which of the following rights was specifically affirmed by the Court?', $JSON$[{"label": "A", "text": "The automatic right to inheritance for same-sex partners"}, {"label": "B", "text": "The right of same-sex couples to adopt children jointly"}, {"label": "C", "text": "The right of same-sex couples to cohabit privately"}, {"label": "D", "text": "The right to maintenance for same-sex partners"}]$JSON$::jsonb, 'C', NULL, 1, 0.25);


  -- Q81
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 81, 'Ramesh and Suresh, a same-sex couple in India, have lived together for a decade and want to ensure they receive legal benefits equivalent to those of married couples, such as automatic inheritance and pension rights. Based on the Supreme Court''s judgment, what is the primary obstacle they face in achieving these benefits?', $JSON$[{"label": "A", "text": "They must first register their union with the government panel that was urged to be formed"}, {"label": "B", "text": "They cannot legally marry and therefore cannot automatically be entitled to these specific legal rights"}, {"label": "C", "text": "These rights are only available to same-sex couples where one partner is transgender"}, {"label": "D", "text": "They can receive these benefits if they convert to a religion that recognizes same-sex unions"}]$JSON$::jsonb, 'B', NULL, 1, 0.25);


  -- Q82
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 82, 'The new acronym that is evolved after LGBTQ+ is an acronym called LGBTQIA+. In this new acronym ''IA'' refers to:', $JSON$[{"label": "A", "text": "Intersex and Asexual"}, {"label": "B", "text": "Initialisms and Agender"}, {"label": "C", "text": "Intersex and Ally"}, {"label": "D", "text": "Intrasex and Androgynous"}]$JSON$::jsonb, 'A', NULL, 1, 0.25);


  raise notice '✅ Legal Reasoning seeded';
end $$;


-- ====================================================================
-- Logical Reasoning (Q83-Q108)
-- ====================================================================
do $$
declare
  v_paper_id uuid;
  v_section_id uuid;
  v_passage_id uuid;
begin
  -- Get paper id
  select id into v_paper_id from public.original_papers where title = 'CLAT UG 2026 Set A' and year = 2026;
  
  -- Get section id
  select id into v_section_id from public.original_sections 
  where paper_id = v_paper_id and name = 'Logical Reasoning';


  -- Passage XVI
  insert into public.original_passages (section_id, passage_number, title, source, content)
  values (v_section_id, 16, 'Passage XVI', NULL, 'In a language laboratory, students were given an interesting puzzle involving the word "ELECTROCARDIOGRAPH." The teacher explained that such exercises not only test logical skills but also sharpen attention to detail. According to the challenge, the word had to undergo a series of transformations. First, the class was asked to take the first half of the letters, reverse their order and make the arrangement of letters look quite different from the original. Next, the students were told to identify the last but one letter of the original word and place it at the very beginning, a step that changed the opening appearance of the sequence completely. Finally, as a finishing touch, they had to add the letter ''S'' at the end. Following these steps carefully would lead them to the correct transformed word, and only those who adhered to each condition in the exact order could solve the puzzle successfully.')
  returning id into v_passage_id;


  -- Q83
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 83, 'Which letter will be exactly in the middle?', $JSON$[{"label": "A", "text": "L"}, {"label": "B", "text": "R"}, {"label": "C", "text": "D"}, {"label": "D", "text": "E"}]$JSON$::jsonb, 'D', NULL, 1, 0.25);


  -- Q84
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 84, 'How many vowels will be to the left of the middle letter?', $JSON$[{"label": "A", "text": "2"}, {"label": "B", "text": "1"}, {"label": "C", "text": "4"}, {"label": "D", "text": "3"}]$JSON$::jsonb, 'D', NULL, 1, 0.25);


  -- Q85
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 85, 'Which of the two vowels will be adjoining each other?', $JSON$[{"label": "A", "text": "IE"}, {"label": "B", "text": "IO"}, {"label": "C", "text": "AE"}, {"label": "D", "text": "AO"}]$JSON$::jsonb, 'B', NULL, 1, 0.25);


  -- Q86
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 86, 'Which vowel will have a consonant to the left but a vowel to the right of it?', $JSON$[{"label": "A", "text": "I"}, {"label": "B", "text": "O"}, {"label": "C", "text": "A"}, {"label": "D", "text": "E"}]$JSON$::jsonb, 'A', NULL, 1, 0.25);


  -- Q87
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 87, 'Name the letter sandwiched between two vowels?', $JSON$[{"label": "A", "text": "R and T"}, {"label": "B", "text": "C and L"}, {"label": "C", "text": "R and L"}, {"label": "D", "text": "D and R"}]$JSON$::jsonb, 'B', NULL, 1, 0.25);


  -- Q88
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 88, 'Which letter is prefixed to the word after the first half is reversed?', $JSON$[{"label": "A", "text": "G"}, {"label": "B", "text": "P"}, {"label": "C", "text": "H"}, {"label": "D", "text": "S"}]$JSON$::jsonb, 'B', NULL, 1, 0.25);


  -- Passage XVII
  insert into public.original_passages (section_id, passage_number, title, source, content)
  values (v_section_id, 17, 'Passage XVII', NULL, 'On the night of October 12th, the "Sunburst Medallion" was stolen from the highly secured display case in the city museum. The theft occurred sometime between the museum closing at 10:00 PM and the night guard, Mr. Hemant, completing his final round at 1:00 AM. Three primary suspects were identified, all of whom had recently been dismissed from their museum positions: Anjali, the former curator; Bharat, the former security expert; and Chitra, the former exhibits designer. Here are the established facts and their alibis: * The security system logs show that the display case was opened using a specific five-digit code, which only Anjali and the museum director (who was out of the country) knew. * Bharat''s alibi is that he was at a distant relative''s birthday party from 8:00 PM to 1:30 AM. Multiple independent witnesses confirmed his presence throughout the entire period. * Chitra''s alibi is that she was working late at a downtown graphic design studio. A time-stamped security camera from the studio''s entrance shows her entering at 7:00 PM and exiting at 11:45 PM. The studio is a 20-minute drive from the museum. * Mr. Hemant, the night guard, stated he checked the medallion at 10:30 PM, and it was still there. Further investigation revealed that a small, distinctive silver button was found near the display case. Anjali is known to frequently wear a coat with similar unique silver buttons. The security expert, Bharat, had previously boasted that he could remotely disable a certain type of magnetic lock-the same type used on the medallion''s case-without needing the code, though the log suggests the code was used.')
  returning id into v_passage_id;


  -- Q89
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 89, 'Identifying the Most Likely Suspect: Based only on the fact that the five-digit code was used to open the display case, who is the only plausible suspect among the three?', $JSON$[{"label": "A", "text": "Anjali"}, {"label": "B", "text": "Bharat"}, {"label": "C", "text": "Chitra"}, {"label": "D", "text": "Both Anjali and Chitra"}]$JSON$::jsonb, 'A', NULL, 1, 0.25);


  -- Q90
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 90, 'Evaluating Alibis and Time Constraints: The theft occurred between 10:00 PM and 1:00 AM, but the night guard saw the medallion at 10:30 PM. Given Chitra''s alibi, what is the earliest time she could have reached the museum?', $JSON$[{"label": "A", "text": "11:45 PM"}, {"label": "B", "text": "12:05 AM"}, {"label": "C", "text": "12:45 AM"}, {"label": "D", "text": "10:50 PM"}]$JSON$::jsonb, 'B', NULL, 1, 0.25);


  -- Q91
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 91, 'Deduction and Contradictory Evidence: If the theft was committed by Bharat, which established fact must be incorrect, based on the provided information?', $JSON$[{"label": "A", "text": "The medallion was present at 10:30 PM"}, {"label": "B", "text": "The security logs indicating the code was used"}, {"label": "C", "text": "The museum closing time of 10:00 PM"}, {"label": "D", "text": "The time frame of his alibi (8:00 PM to 1:30 AM)"}]$JSON$::jsonb, 'D', NULL, 1, 0.25);


  -- Q92
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 92, 'Analyzing Accessory Evidence: The discovery of the silver button near the display case is the most incriminating evidence against which suspect, and why?', $JSON$[{"label": "A", "text": "Bharat, because he had the technical expertise to get close to the case"}, {"label": "B", "text": "Chitra, because she was near the museum late that night"}, {"label": "C", "text": "Anjali, because she is known to wear a coat with similar buttons"}, {"label": "D", "text": "Mr. Hemant, as he was the last person to check the area"}]$JSON$::jsonb, 'C', NULL, 1, 0.25);


  -- Q93
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 93, 'Identifying the Logical Flaw in the Argument: A detective argues: "Since Bharat has a confirmed, continuous alibi covering the entire time window of the theft (10:30 PM to 1:00 AM), he cannot be the thief." What principle of logic supports this detective''s conclusion?', $JSON$[{"label": "A", "text": "Correlation does not imply causation"}, {"label": "B", "text": "If an event requires presence, confirmed absence proves innocence"}, {"label": "C", "text": "The rule of double jeopardy"}, {"label": "D", "text": "The burden of proof lies with the accuser"}]$JSON$::jsonb, 'B', NULL, 1, 0.25);


  -- Q94
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 94, 'Drawing a Strongest Conclusion: Considering all the facts (the code being used, the silver button, and the confirmed alibis), which is the most reasonable inference?', $JSON$[{"label": "A", "text": "Bharat must have had an accomplice who knew the code"}, {"label": "B", "text": "Chitra's alibi is false because she had enough time to commit the crime after leaving the studio"}, {"label": "C", "text": "Anjali is the most likely suspect because the code was used and she has a direct link to the physical evidence (the button)"}, {"label": "D", "text": "Mr. Hemant is secretly the thief and is trying to frame the former employees"}]$JSON$::jsonb, 'C', NULL, 1, 0.25);


  -- Q95
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 95, 'Assessing Necessary Conditions: What condition is necessary for Chitra to have stolen the medallion?', $JSON$[{"label": "A", "text": "She must know the five digit code"}, {"label": "B", "text": "She must have left the graphic design studio before 11.45 pm"}, {"label": "C", "text": "The theft must have occurred after she left the studio and before 1 am"}, {"label": "D", "text": "She must have worked with Anjali to disable the locks"}]$JSON$::jsonb, 'C', NULL, 1, 0.25);


  -- Passage XVIII
  insert into public.original_passages (section_id, passage_number, title, source, content)
  values (v_section_id, 18, 'Passage XVIII', NULL, 'In a small town lived a close-knit family where every relation could be expressed through simple symbols. For instance, when they said A x B it meant A is the father of B, while A / B meant A is the mother of B. The younger ones were often introduced with A + B, meaning A was the daughter of B, and the bond of brotherhood was shown by A - B (A is brother of B). One day, the children in the family turned these symbols into a playful code. Instead of introducing their parents and siblings in words, they spoke only in symbols. "Look," giggled little Meena, M + N / O - P. Everyone laughed, because they knew it meant Meena was the daughter of N, and N was the mother of O, making her O''s sister. What started as a code soon became a family game, making the bonds of father, mother, daughter, and brother not just relations, but symbols of love and togetherness.')
  returning id into v_passage_id;


  -- Q96
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 96, 'If P + Q - R / T, how is T related to P?', $JSON$[{"label": "A", "text": "Aunt"}, {"label": "B", "text": "Father"}, {"label": "C", "text": "Grandmother"}, {"label": "D", "text": "None of these"}]$JSON$::jsonb, 'D', NULL, 1, 0.25);


  -- Q97
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 97, 'Which of the following means that R is wife of P?', $JSON$[{"label": "A", "text": "P x R - Q - T"}, {"label": "B", "text": "P / T + R - Q"}, {"label": "C", "text": "P / R - Q + T"}, {"label": "D", "text": "P x T - Q + R"}]$JSON$::jsonb, 'D', NULL, 1, 0.25);


  -- Q98
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 98, 'If P x T / Q + R, how is R related to P?', $JSON$[{"label": "A", "text": "Daughter"}, {"label": "B", "text": "Husband"}, {"label": "C", "text": "Son-in-law"}, {"label": "D", "text": "None of these"}]$JSON$::jsonb, 'C', NULL, 1, 0.25);


  -- Q99
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 99, 'If P / R - Q x T, how is P related to T?', $JSON$[{"label": "A", "text": "Grandmother"}, {"label": "B", "text": "Mother-in-law"}, {"label": "C", "text": "Sister"}, {"label": "D", "text": "Grandfather"}]$JSON$::jsonb, 'A', NULL, 1, 0.25);


  -- Q100
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 100, 'If R / Q + R x T, how is T related to Q?', $JSON$[{"label": "A", "text": "Aunt"}, {"label": "B", "text": "Sister"}, {"label": "C", "text": "Brother"}, {"label": "D", "text": "Grandson"}]$JSON$::jsonb, 'Withdrawn', 'Question withdrawn from scoring.', 1, 0.25);


  -- Q101
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 101, 'If R - P / J x Q, how is J related to R?', $JSON$[{"label": "A", "text": "Son"}, {"label": "B", "text": "Nephew"}, {"label": "C", "text": "Niece"}, {"label": "D", "text": "Grandson"}]$JSON$::jsonb, 'B', NULL, 1, 0.25);


  -- Passage XIX
  insert into public.original_passages (section_id, passage_number, title, source, content)
  values (v_section_id, 19, 'Passage XIX', NULL, 'Four teams - Red (R), Blue (B), Green (G), and Yellow (Y) are competing in the final four rounds of the Inter-School Science Olympiad, labeled Round A, Round B, Round C, and Round D. Each round consists of one match between two teams, and every team plays exactly two matches. No team plays the same opponent more than once. The final schedule must adhere to the following rules: * Rule 1 (Consecutive Play): The Green team (G) must play their two matches in consecutive rounds. * Rule 2 (Fixed Appearance): The Yellow team (Y) must play in Round B. * Rule 3 (Positional Constraint): The Red team (R) must play against the Blue team (B) in a round that is immediately before a round in which neither R nor B is playing. * Rule 4 (Timing): The Blue team''s (B) first match must occur in an earlier round than the Green team''s (G) first match. * Rule 5 (Opponent Link): The team that plays against the Red team (R) in the round that is not against the Blue team (B), is the same team that plays in Round D.')
  returning id into v_passage_id;


  -- Q102
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 102, 'Determining the Green Team''s Schedule: Considering Rules 1 and 2, which of the following pairs of rounds contains the Green team''s two matches?', $JSON$[{"label": "A", "text": "Round A and Round D"}, {"label": "B", "text": "Round B and Round C"}, {"label": "C", "text": "Round C and Round D"}, {"label": "D", "text": "Round A and Round B"}]$JSON$::jsonb, 'B', NULL, 1, 0.25);


  -- Q103
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 103, 'Applying the Positional Constraint: Based on all the rules, particularly Rule 3, which of the following matches must be scheduled for Round A?', $JSON$[{"label": "A", "text": "Red vs. Green"}, {"label": "B", "text": "Red vs. Yellow"}, {"label": "C", "text": "Red vs. Blue"}, {"label": "D", "text": "Blue vs. Yellow"}]$JSON$::jsonb, 'C', NULL, 1, 0.25);


  -- Q104
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 104, 'Identifying the Blue Team''s First Opponent: Who is the Blue team''s first opponent in the tournament?', $JSON$[{"label": "A", "text": "Green"}, {"label": "B", "text": "Red"}, {"label": "C", "text": "Yellow"}, {"label": "D", "text": "The opponent cannot be determined"}]$JSON$::jsonb, 'B', NULL, 1, 0.25);


  -- Q105
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 105, 'Finding the Match in Round C: What is the match scheduled for Round C?', $JSON$[{"label": "A", "text": "Red vs. Green"}, {"label": "B", "text": "Green vs. Blue"}, {"label": "C", "text": "Blue vs. Yellow"}, {"label": "D", "text": "Red vs. Yellow"}]$JSON$::jsonb, 'B', NULL, 1, 0.25);


  -- Q106
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 106, 'Identifying the Teams Excluded from a Round: Which pair of rounds contains matches where the Yellow team does not participate?', $JSON$[{"label": "A", "text": "Round A and Round C"}, {"label": "B", "text": "Round A and Round D"}, {"label": "C", "text": "Round B and Round C"}, {"label": "D", "text": "Round C and Round D"}]$JSON$::jsonb, 'A', NULL, 1, 0.25);


  -- Q107
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 107, 'Team Opponent Check: Which team does the Yellow team NOT play against over the course of the four rounds?', $JSON$[{"label": "A", "text": "Red"}, {"label": "B", "text": "Blue"}, {"label": "C", "text": "Green"}, {"label": "D", "text": "The Yellow team plays against all other teams"}]$JSON$::jsonb, 'B', NULL, 1, 0.25);


  -- Q108
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 108, 'Assessing a Rule Violation: If the match in Round D was (Blue vs. Yellow), which of the original rules would be violated by this schedule change?', $JSON$[{"label": "A", "text": "Rule 1 (Consecutive Play)"}, {"label": "B", "text": "Rule 3 (Positional Constraint)"}, {"label": "C", "text": "Rule 4 (Timing)"}, {"label": "D", "text": "Rule 5 (Opponent Link)"}]$JSON$::jsonb, 'D', NULL, 1, 0.25);


  raise notice '✅ Logical Reasoning seeded';
end $$;


-- ====================================================================
-- Quantitative Techniques (Q109-Q120)
-- ====================================================================
do $$
declare
  v_paper_id uuid;
  v_section_id uuid;
  v_passage_id uuid;
begin
  -- Get paper id
  select id into v_paper_id from public.original_papers where title = 'CLAT UG 2026 Set A' and year = 2026;
  
  -- Get section id
  select id into v_section_id from public.original_sections 
  where paper_id = v_paper_id and name = 'Quantitative Techniques';


  -- Passage XX
  insert into public.original_passages (section_id, passage_number, title, source, content)
  values (v_section_id, 20, 'Passage XX', NULL, 'Health insurance plays a vital role in ensuring financial protection and access to quality healthcare. In India, however, the extent and nature of health insurance coverage vary significantly between urban and rural areas. While urban populations often have better access to organized insurance schemes, employer-provided coverage, and awareness about health policies, rural populations face challenges such as limited outreach of insurance schemes, inadequate infrastructure, and lower awareness levels. This urban-rural divide in health insurance coverage highlights the broader issue of healthcare inequality, making it essential to analyze the factors contributing to this gap and explore strategies for more inclusive health protection. A state-level health survey was conducted. The survey covered 1,80,000 adults across urban and rural areas. Urban residents formed 55% of the sample (that is, 99,000 people) while rural residents made up 45% (that is, 81,000 people). In each area, coverage was classified under four heads - Public schemes, Private insurance, Employer-provided coverage, and Uninsured. In urban areas, Public coverage accounted for 28% of the urban population, Private for 22%, Employer for 18%, and the remaining 32% were Uninsured. In rural areas, where formal coverage is generally lower, Public coverage stood at 35%, Private at 10%, Employer at 8%, while 47% were Uninsured. For this survey, "Insured" includes everyone covered by Public + Private + Employer schemes, and "Uninsured" indicates those with no coverage at all. Officials noted that public schemes remain the backbone of rural coverage, while employer and private plans are relatively more prevalent in urban centres.')
  returning id into v_passage_id;


  -- Q109
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 109, 'The ratio of insured adults in Urban: Rural is:', $JSON$[{"label": "A", "text": "82:65"}, {"label": "B", "text": "748:477"}, {"label": "C", "text": "65:82"}, {"label": "D", "text": "477:748"}]$JSON$::jsonb, 'B', NULL, 1, 0.25);


  -- Q110
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 110, 'By what percentage is the number of Uninsured in Rural higher than Uninsured in Urban?', $JSON$[{"label": "A", "text": "18.75%"}, {"label": "B", "text": "20.17%"}, {"label": "C", "text": "22.50%"}, {"label": "D", "text": "25.00%"}]$JSON$::jsonb, 'B', NULL, 1, 0.25);


  -- Q111
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 111, 'If the total population grows by 5% next year and all percentage shares remain the same (including the Urban-Rural split), how many additional privately insured people will there be (vs. this year)?', $JSON$[{"label": "A", "text": "1,494"}, {"label": "B", "text": "1,560"}, {"label": "C", "text": "1,620"}, {"label": "D", "text": "1,650"}]$JSON$::jsonb, 'A', NULL, 1, 0.25);


  -- Q112
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 112, 'The total number of Employer-covered adults is:', $JSON$[{"label": "A", "text": "22,800"}, {"label": "B", "text": "23,100"}, {"label": "C", "text": "24,300"}, {"label": "D", "text": "25,200"}]$JSON$::jsonb, 'C', NULL, 1, 0.25);


  -- Q113
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 113, 'What percentage of all insured adults are Publicly insured?', $JSON$[{"label": "A", "text": "48.50%"}, {"label": "B", "text": "49.75%"}, {"label": "C", "text": "50.86%"}, {"label": "D", "text": "52.00%"}]$JSON$::jsonb, 'C', NULL, 1, 0.25);


  -- Q114
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 114, 'What percentage of the total surveyed population was insured?', $JSON$[{"label": "A", "text": "52.15%"}, {"label": "B", "text": "56.25%"}, {"label": "C", "text": "61.25%"}, {"label": "D", "text": "64%"}]$JSON$::jsonb, 'C', NULL, 1, 0.25);


  -- Passage XXI
  insert into public.original_passages (section_id, passage_number, title, source, content)
  values (v_section_id, 21, 'Passage XXI', NULL, 'A state electricity report serves as an important tool to assess energy production and track progress in the power sector. By providing quarterly data on generation measured in gigawatt hours (GWh), the report highlights the contribution of different energy sources such as coal, gas, hydro, solar, and wind. This not only helps in understanding the overall energy mix and dependence on conventional versus renewable sources but also enables policymakers, planners, and stakeholders to evaluate trends, address gaps, and promote sustainable energy development. A state electricity report provides quarterly generation (in GWh) by source Coal, Gas, Hydro, Solar, and Wind. In Q1: Generation from Coal is 2,200 GWh, Gas contributes 800 GWh, Hydro 900 GWh, Solar 700 GWh, and Wind 400 GWh, for a total of 5,000 GWh. In Q2: Coal rises to 2,400 GWh, while Gas dips to 700 GWh; Hydro improves to 1,000 GWh, Solar to 800 GWh, and Wind to 600 GWh, bringing the quarterly total to 5,500 GWh. In Q3: Coal moderates to 2,100 GWh, Gas increases to 900 GWh, Hydro softens to 800 GWh, but Solar advances to 1,000 GWh and Wind to 700 GWh, keeping the total at 5,500 GWh. In Q4: Coal moves to 2,300 GWh, Gas to 850 GWh, Hydro to 1,100 GWh, Solar to 900 GWh, and Wind to 850 GWh, for a total of 6,000 GWh. For analysis, Renewables are taken as Hydro+Solar+Wind. A carbon policy scenario proposes cutting Q4 Coal by 10%, shifting the entire reduction equally into Solar and Wind.')
  returning id into v_passage_id;


  -- Q115
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 115, 'The total annual generation (GWh) is:', $JSON$[{"label": "A", "text": "20,500"}, {"label": "B", "text": "21,500"}, {"label": "C", "text": "22,000"}, {"label": "D", "text": "22,500"}]$JSON$::jsonb, 'C', NULL, 1, 0.25);


  -- Q116
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 116, 'The overall renewable share (as % of annual generation) is closest to:', $JSON$[{"label": "A", "text": "42.5%"}, {"label": "B", "text": "43.8%"}, {"label": "C", "text": "44.3%"}, {"label": "D", "text": "45.0%"}]$JSON$::jsonb, 'C', NULL, 1, 0.25);


  -- Q117
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 117, 'The quarter with the highest renewable percentage share is:', $JSON$[{"label": "A", "text": "Q1"}, {"label": "B", "text": "Q2"}, {"label": "C", "text": "Q3"}, {"label": "D", "text": "Q4"}]$JSON$::jsonb, 'D', NULL, 1, 0.25);


  -- Q118
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 118, 'A carbon policy reduces Q4 Coal by 10% and shifts the entire reduction equally to Solar and Wind. The new Q4 Solar (GWh) is:', $JSON$[{"label": "A", "text": "975"}, {"label": "B", "text": "1,000"}, {"label": "C", "text": "1,015"}, {"label": "D", "text": "1,030"}]$JSON$::jsonb, 'C', NULL, 1, 0.25);


  -- Q119
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 119, 'The annual Gas: Hydro generation ratio is:', $JSON$[{"label": "A", "text": "13:15"}, {"label": "B", "text": "65:76"}, {"label": "C", "text": "5:6"}, {"label": "D", "text": "26:31"}]$JSON$::jsonb, 'B', NULL, 1, 0.25);


  -- Q120
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation, marks, negative_marks)
  values (v_section_id, v_passage_id, 120, 'The quarter with the lowest renewable percentage share is:', $JSON$[{"label": "A", "text": "Q1"}, {"label": "B", "text": "Q2"}, {"label": "C", "text": "Q3"}, {"label": "D", "text": "Q4"}]$JSON$::jsonb, 'A', NULL, 1, 0.25);


  raise notice '✅ Quantitative Techniques seeded';
end $$;



commit;

-- ============================================================
-- Verify
-- ============================================================
select
  os.name as section_name,
  os.order_index,
  os.total_questions,
  count(oq.id) as actual_questions
from original_papers op
join original_sections os on os.paper_id = op.id
left join original_questions oq on oq.section_id = os.id
where op.title = 'CLAT UG 2026 Set A'
group by os.id, os.name, os.order_index, os.total_questions
order by os.order_index;
