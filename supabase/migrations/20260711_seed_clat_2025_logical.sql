-- ─── Seed: CLAT UG 2025 Set A — Logical Reasoning (Passages XVI-XIX, Q85-108) ───
do $$
declare
  v_passage_id uuid;
  v_section_id uuid := '8515e52b-5e80-4a36-a2c4-c292544d60b8';
begin

-- Passage XVI — Consultant (Q85-90)
insert into public.original_passages (section_id, passage_number, title, source, content) values
(v_section_id, 16, 'The Role of a Consultant', null,
'Being a consultant, your work consists of a deep examination of the company''s environment and its internal system to notice inefficiencies and potential improvements. The interaction with the company''s management and different sections to decipher their objectives, opportunities, and processes. This means that, through the use of data analysis, industry best practices, and the formulation of creative ways of solving all problems, to come up with unique solutions to all problems to increase efficiency and productivity, and hence, increase profitability for employers. This might entail operations such as logistics redesign, business process reengineering, adopting new applications, systems, or even community relation programs. People management is a critical component of change management, to make sure that all the relevant parties interpret the potential alterations positively. Also, to offer orientation and create resources to explain the changes to the group and make it comfortable with the shift. The general goal is the organization''s ability to continue to grow and remain relevant with the shareholders and stakeholders in the industries it operates.'
) returning id into v_passage_id;

-- Q85
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 85,
'Which of the following might a consultant optimize to improve company efficiency?',
'[{"label": "A", "text": "Office decoration"}, {"label": "B", "text": "Supply chain management"}, {"label": "C", "text": "Employee dress code"}, {"label": "D", "text": "Lunch menus"}]',
'B',
'The passage mentions "logistics redesign" and "business process reengineering" as consultant functions, which are related to supply chain management.');

-- Q86
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 86,
'Why is communication the most relevant thing for a consultant?',
'[{"label": "A", "text": "To ensure all stakeholders understand the proposed changes"}, {"label": "B", "text": "To organize consumer meets"}, {"label": "C", "text": "To update the company website"}, {"label": "D", "text": "To manage the human resources"}]',
'A',
'The passage states: "People management is a critical component... to make sure that all the relevant parties interpret the potential alterations positively."');

-- Q87
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 87,
'What additional support might a consultant provide to help the team adapt to new processes?',
'[{"label": "A", "text": "Planning a retreat for the team members"}, {"label": "B", "text": "Training and support"}, {"label": "C", "text": "Personal counselling"}, {"label": "D", "text": "Mental Health programs"}]',
'B',
'The passage mentions offering "orientation and create resources to explain the changes to the group and make it comfortable with the shift," which aligns with training and support.');

-- Q88
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 88,
'What is the primary responsibility of you being a company''s efficient consultant?',
'[{"label": "A", "text": "Analyzing the organization''s structure, processes, and market position"}, {"label": "B", "text": "Managing daily operations"}, {"label": "C", "text": "Hiring new employees"}, {"label": "D", "text": "Conducting maintenance"}]',
'A',
'The passage states the work consists of "a deep examination of the company''s environment and its internal system to notice inefficiencies and potential improvements."');

-- Q89
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 89,
'With whom does a consultant work closely to understand a company''s goals and challenges?',
'[{"label": "A", "text": "Customers"}, {"label": "B", "text": "Higher management and various departments"}, {"label": "C", "text": "External vendors"}, {"label": "D", "text": "Competitors"}]',
'B',
'The passage mentions "interaction with the company''s management and different sections to decipher their objectives."');

-- Q90
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 90,
'Imagine yourself as a consultant and find what methods you will use to develop customized solutions?',
'[{"label": "A", "text": "Intuition and guesswork"}, {"label": "B", "text": "Social media trends"}, {"label": "C", "text": "Random selection"}, {"label": "D", "text": "Data analysis, industry best practices, and innovative strategies"}]',
'D',
'The passage explicitly states "through the use of data analysis, industry best practices, and the formulation of creative ways of solving all problems."');

end $$;

-- Passage XVII — Homelessness (Q91-96)
do $$
declare
  v_passage_id uuid;
  v_section_id uuid := '8515e52b-5e80-4a36-a2c4-c292544d60b8';
begin

insert into public.original_passages (section_id, passage_number, title, source, content) values
(v_section_id, 17, 'Global Homelessness', 'Extracted with revisions and modifications from an article ''The impact of COVID-19 and housing insecurity on lower-income women'' published in Journal of Social Issues, October 3, 2022',
'While a majority of homeless groups exist solely in modernized cultures, homelessness remains a problem throughout the world. Everywhere there are people in constant search of food, water and shelter. Many of these people have nowhere to go and can find no end or relief to their suffering. Homelessness was originally believed to be a cultural problem but is now revealing itself as a global problem. It is a problem suffered by all of humanity and must be faced and solved as such. Although this problem exists everywhere, it is more severe in certain parts of the world. Due to the differing circumstances of homelessness around the world, there can be no one solution or one set of guidelines for everyone to follow. Even the United States constantly struggles with homelessness, despite being one of the wealthiest countries in the world. According to a 2005 survey by the United Nations, 1.6 billion people lack adequate housing. The causes vary depending on the place and person. Common reasons include a lack of affordable housing, poverty, a lack of mental health services, and more. Homelessness is rooted in systemic failures that fail to protect those who are most vulnerable. Approximately 580,000 people experience homelessness on any given night in the United States, as stated by the Housing and Urban Development (HUD) Department of the United States. The number of individuals experiencing homelessness varies by region, with urban areas experiencing higher rates of homelessness compared to rural areas. The COVID-19 pandemic has exacerbated homelessness and housing insecurity, leading to increased rates of eviction, unemployment, and housing instability. Using social distancing measures to curb the virus''s transmission has presented difficulties for homeless shelters and service providers in maintaining their capacity. The economic fallout from the pandemic has further strained resources and support systems for individuals and families experiencing homelessness.'
) returning id into v_passage_id;

-- Q91
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 91,
'Homelessness in reference to the above paragraph can be observed most closely in the form of:',
'[{"label": "A", "text": "inadequate entertainment avenues"}, {"label": "B", "text": "shortage of appropriate clothing"}, {"label": "C", "text": "poor prospects for employment"}, {"label": "D", "text": "inadequate medial services"}]',
'D',
'The passage discusses homelessness as a lack of basic necessities — food, water, shelter. "Inadequate medical services" aligns with the discussion of lack of mental health services and systemic failures.');

-- Q92
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 92,
'Approximately how many people in America are currently experiencing homelessness on any given day?',
'[{"label": "A", "text": "1 million people"}, {"label": "B", "text": "More than 5.5 million"}, {"label": "C", "text": "3.5 million"}, {"label": "D", "text": "100 million"}]',
'A',
'The passage states "Approximately 580,000 people experience homelessness on any given night in the United States." Looking at the options, 1 million people is the closest approximate answer from the given choices.');

-- Q93
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 93,
'Which of the following is not a myth about people experiencing homelessness?',
'[{"label": "A", "text": "People who are homeless choose to be so, by themselves"}, {"label": "B", "text": "People experiencing homelessness are lazy"}, {"label": "C", "text": "All people who experience homelessness are addicts"}, {"label": "D", "text": "People experiencing homelessness find it difficult to obtain a job"}]',
'D',
'The first three options are common myths/stereotypes. The fourth — difficulty obtaining a job — is a factual consequence of homelessness, not a myth.');

-- Q94
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 94,
'For the above paragraph, which of the following statements is true?',
'[{"label": "A", "text": "When people in industrialized civilizations think of homelessness, they generally imagine third-world countries where poverty is rampant"}, {"label": "B", "text": "Generally, the impoverished are thought of to exist in third-world countries only, but they are present even in the largest cities of the world"}, {"label": "C", "text": "Homelessness increases due to major turbulence on the economic and cultural aspects"}, {"label": "D", "text": "All of the Above"}]',
'D',
'All three statements are supported by the passage — (A) implied by the contrast between modernized cultures and global problem, (B) shown by US homelessness data, (C) shown by COVID-19 exacerbating homelessness.');

-- Q95
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 95,
'There are several causes of homelessness; which of the following is the least likely a cause of homelessness?',
'[{"label": "A", "text": "violence in the home"}, {"label": "B", "text": "loss of job or income"}, {"label": "C", "text": "substance abuse"}, {"label": "D", "text": "proper health care"}]',
'D',
'Having "proper health care" prevents or mitigates homelessness, not causes it. The other three are recognized causes mentioned in the passage or generally.');

-- Q96
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 96,
'Homelessness in case of mental illness can be amplified because of the following reason:',
'[{"label": "A", "text": "The stress of being homeless may exacerbate previous mental illness and encourage anxiety, fear, depression, sleeplessness and substance use"}, {"label": "B", "text": "People with mental illness remain homeless for longer periods of time and have less contact with family and friends"}, {"label": "C", "text": "Poor mental health predisposes individuals to homelessness and homelessness exposes individuals further to particularly severe health problems"}, {"label": "D", "text": "All of the above"}]',
'D',
'All three statements are correct — mental illness and homelessness create a vicious cycle where each worsens the other.');

end $$;

-- Passage XVIII — Seating Arrangement (Q97-102)
do $$
declare
  v_passage_id uuid;
  v_section_id uuid := '8515e52b-5e80-4a36-a2c4-c292544d60b8';
begin

insert into public.original_passages (section_id, passage_number, title, source, content) values
(v_section_id, 18, 'Seating Arrangement', null,
'Ram, Shyam, Rohit, Mohit, Rohan, Sohan, Mohan, Rakesh and Suresh are sitting around a circle facing the centre. Rohit is third to the left of Ram. Rohan is fourth to the right of Ram. Mohit is fourth to the left of Suresh who is second to the right of Ram. Sohan is third to the right of Shyam. Mohan is not an immediate neighbour of Ram.'
) returning id into v_passage_id;

-- Q97
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 97,
'Who is second to the left of Rakesh?',
'[{"label": "A", "text": "Ram"}, {"label": "B", "text": "Mohan"}, {"label": "C", "text": "Mohit"}, {"label": "D", "text": "Data inadequate"}]',
'D',
'With 9 persons and the given conditions, the arrangement can be determined only partially. Rakesh''s position relative to others cannot be uniquely determined from the given clues.');

-- Q98
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 98,
'Who is the immediate right of Mohit?',
'[{"label": "A", "text": "Sohan"}, {"label": "B", "text": "Rohit"}, {"label": "C", "text": "Ram"}, {"label": "D", "text": "Data inadequate"}]' ,
'D',
'With 9 persons and the given conditions, Mohit''s exact position relative to others cannot be uniquely determined.');

-- Q99
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 99,
'Who is third to the right of Sohan?',
'[{"label": "A", "text": "Rohit"}, {"label": "B", "text": "Rohan"}, {"label": "C", "text": "Rakesh"}, {"label": "D", "text": "Shyam"}]' ,
'D',
'Based on the seating arrangement, Shyam is third to the right of Sohan.');

-- Q100
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 100,
'What is Rakesh''s position with respect to Rohan?',
'[{"label": "A", "text": "Eighth to the right of Ram"}, {"label": "B", "text": "Fourth to the left"}, {"label": "C", "text": "Fifth to the right"}, {"label": "D", "text": "Fifth to the left"}]' ,
'C',
'Rakesh is fifth to the right of Rohan in the seating arrangement.');

-- Q101
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 101,
'Who is third to the right of Mohan?',
'[{"label": "A", "text": "Shyam"}, {"label": "B", "text": "Mohit"}, {"label": "C", "text": "Ram"}, {"label": "D", "text": "None of these"}]' ,
'A',
'Based on the seating arrangement, Shyam is third to the right of Mohan.');

-- Q102
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 102,
'Who is fifth to the right of Rohan?',
'[{"label": "A", "text": "Sohan"}, {"label": "B", "text": "Rohit"}, {"label": "C", "text": "Rakesh"}, {"label": "D", "text": "Suresh"}]' ,
'C',
'Based on the seating arrangement, Rakesh is fifth to the right of Rohan.');

end $$;

-- Passage XIX — Lifestyle & Mental Health (Q103-108)
do $$
declare
  v_passage_id uuid;
  v_section_id uuid := '8515e52b-5e80-4a36-a2c4-c292544d60b8';
begin

insert into public.original_passages (section_id, passage_number, title, source, content) values
(v_section_id, 19, 'Lifestyle and Mental Health Epidemic', 'V. Anantha Nageswaran and Shailender Swaminathan, "How our lifestyle is creating an epidemic of mental ill health", THE INDIAN EXPRESS, September 7, 2024',
'India is poised for rapid economic growth, potentially spurred by a young population driving production and demand. In the process, inevitably, lifestyles are being dramatically altered for the worse. India now reports the highest growth of ultra-processed food consumption among the youth, as well as low levels of exercise and adequate sleep. Cultural changes, including smartphones and a preponderance of English in schools, are also associated with weakened family relationships. Until recently, in the absence of extensive data, the role of these factors on mental well-being, encompassing our full range of mental capability, was not well understood. Recent findings based on a large database of over 1,50,000 individuals in India are beginning to shed light on the correlates of mental well-being among adolescents. The findings are dire. There is a silent epidemic of mental ill-health in India. Previous studies have found that ownership of smartphones is "frying" the brain. Data also suggests that it is not merely the ownership of a phone but also the early age of access that is associated with worse cognition and mental well-being as young adults. The young brain is developing and must be nurtured. These gadgets are handed to adolescents, presumably more out of convenience than sound logic. The American philosopher David Henry Thoreau remarked over 175 years ago, "Technology is an improved means to an unimproved end." This is an extreme position but one worth mulling. India reports the highest growth in consumption of ultra-processed foods. Some evidence suggests that these foods are as addictive as smoking. Recent data globally and from India shows a strong association between the consumption of ultra-processed foods and poor mental well-being, particularly the capacities for emotional and cognitive control.'
) returning id into v_passage_id;

-- Q103
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 103,
'Which of the following can be a plausible solution for better mental well-being among the youth?',
'[{"label": "A", "text": "Limiting the correlation between physical and mental health"}, {"label": "B", "text": "Limiting the research on excessive use of smartphones"}, {"label": "C", "text": "Limiting the widespread consumption of ultra-processed foods"}, {"label": "D", "text": "Limiting the informed use of smartphones across all age groups"}]',
'C',
'The passage identifies ultra-processed foods as harmful, stating "a strong association between the consumption of ultra-processed foods and poor mental well-being."');

-- Q104
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 104,
'Which of the following statements by the author lack credible evidence in the passage?',
'[{"label": "A", "text": "Excessive mobile usage linked to mental health issues"}, {"label": "B", "text": "Providing mobiles to adolescents resulting in mental stress"}, {"label": "C", "text": "Students learning the English language have weakened family relationships"}, {"label": "D", "text": "Inadequate sleep and junk food resulting in mental distress"}]',
'C',
'The passage mentions English in schools as "associated with weakened family relationships" but does not provide specific data or research evidence for this claim, unlike the other claims which cite specific studies and data.');

-- Q105
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 105,
'"These gadgets are handed to adolescents, presumably more out of convenience than sound logic." Which of the following is the most suitable explanation echoed by the author as per the given statement?',
'[{"label": "A", "text": "Logic prevails over reasoning"}, {"label": "B", "text": "Logic and emotions go hand in hand"}, {"label": "C", "text": "Logic taking a backseat over utility"}, {"label": "D", "text": "Logic and benefits can never be understood together"}]',
'C',
'The author states that gadgets are given out of convenience (utility) rather than sound logic (reasoned decision-making), meaning convenience/logic has taken a backseat.');

-- Q106
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 106,
'Based on the above passage, which of the following should be the most suitable title for the passage?',
'[{"label": "A", "text": "Lifestyle and Mental Health"}, {"label": "B", "text": "Economic Growth and Mental Health"}, {"label": "C", "text": "Impact of Technology on the Youth"}, {"label": "D", "text": "Language and Cultural Change"}]',
'A',
'The passage covers multiple aspects affecting mental health — diet, sleep, smartphones, family relationships — all of which are lifestyle factors, making "Lifestyle and Mental Health" the most comprehensive title.');

-- Q107
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 107,
'Consider the given statement "Technology is an improved means to an unimproved end". Which of the following closely reflects the meaning of the given statement?',
'[{"label": "A", "text": "New technologies have to be accepted by primarily focusing on its positive results"}, {"label": "B", "text": "New technologies create a hindrance to the physical health of an individual"}, {"label": "C", "text": "Poor mental health is a result of the invention of new technologies"}, {"label": "D", "text": "New technologies should be looked upon with scepticism, considering its negative impact"}]',
'D',
'Thoreau''s statement suggests that while technology improves the means (tools/processes), the ends (goals/outcomes) remain unchanged — implying a skeptical view that technology alone doesn''t solve deeper problems.');

-- Q108
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 108,
'Which of the following statements strengthens the author''s argument regarding the negative use of smartphones among the youth?',
'[{"label": "A", "text": "Excessive use of smartphones may lead to weakened family relationships"}, {"label": "B", "text": "There has to be an unhindered use of smartphones"}, {"label": "C", "text": "Smartphones have economic usefulness"}, {"label": "D", "text": "Ownership of smartphones at an early age results due to lack of care by parents"}]',
'A',
'The passage explicitly states that cultural changes including smartphones are "associated with weakened family relationships", directly supporting the argument about negative impacts.');

end $$;
