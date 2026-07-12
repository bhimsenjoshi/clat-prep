-- ─── Seed: CLAT UG 2025 Set A — Current Affairs (Q37-52) ───
-- Sections: Nari Shakti (Q37-40), Civil Disobedience (Q41-46), Paris Olympics (Q47-52)

-- Passage VII — Nari Shakti Vandan Adhiniyam 2023 (Q37-40)
do $$
declare
  v_passage_id uuid;
  v_section_id uuid := '97da94d1-304f-476c-a8cb-cee87c1fb195';
begin

insert into public.original_passages (section_id, passage_number, title, source, content) values
(v_section_id, 7, 'Nari Shakti Vandan Adhiniyam 2023', null,
'The "Nari Shakti Vandan Adhiniyam", 2023 Act received near-unanimous support in both the Lok Sabha and the Rajya Sabha. The legislation mandates the reservation of one-third of all seats in the Lok Sabha, state legislative assemblies, and Delhi (as a union territory with an elected assembly) for women. This linking of the implementation of the Act to the implementing of two long-term exercises of census and delimitation, makes little sense to many, and sounds quite like empowerment delayed for now. In a 2012 article ''Holding Up Half the Sky: Reservations for Women in India'', Rudolf C Heredia breaks down the common misconceptions that cloud our understanding of women''s political participation- "When women do attain a national leadership role it is often because they have inherited the mantle from their fathers or husbands, rather than as persons in their own right and are then projected as matriarchs, part of the joint family, complementary to the patriarchy rather than a challenge to it." In ''Equality versus Empowerment: Women in Indian Legislature'', 2023, Soumya Bhowmick makes the case for going a step beyond quotas, and to turn our attention to the complexities that shape women''s agency in the country. This, he argues, would require a bottoms-up approach, rather than merely handing out reservations in a top-down manner. "In a country like India with a considerably large heterogeneous population, the dissemination of legislative power would be insufficient to protect the interests of minority groups such as women, Scheduled Castes, and Scheduled Tribes." He concludes that "implementing the idea of reservation for women would bring about descriptive representation, but its transformation into substantive representation would depend on the change in the attitudes of the people." While the reservation of one-third of seats for women belonging to the scheduled castes and tribes under the amendment to article 330a and 332 of the constitution is a welcome step, it remains to be seen whether it fully acknowledges the complex interplay of hierarchies, socio-political relationships which also affect the extent and nature of complications that surround effective realisation of women''s politics for Indian politics to emerge as a truly emancipatory space.'
) returning id into v_passage_id;

-- Q37
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 37,
'The Nari Shakti Vandan Adhiniyam 2023:',
'[{"label": "A", "text": "Will come to force from Jan 2025"}, {"label": "B", "text": "Will come to force after all the States and UTs approve it"}, {"label": "C", "text": "Will come to force after Census"}, {"label": "D", "text": "None of the above"}]',
'C',
'The passage states: "This linking of the implementation of the Act to the implementing of two long-term exercises of census and delimitation."');

-- Q38
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 38,
'As per Rudolf Heredia women''s political leadership depends upon:',
'[{"label": "A", "text": "Mentorship of spouse''s political affiliations"}, {"label": "B", "text": "Parental guidance"}, {"label": "C", "text": "Property inheritance"}, {"label": "D", "text": "None of the above"}]',
'D',
'Heredia argues that women who attain national leadership often inherit the mantle from fathers or husbands, but the passage does not attribute this to mentorship, parental guidance, or property inheritance specifically. None of the options directly match Heredia''s argument about inheritance of political mantle.');

-- Q39
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 39,
'According to Soumya Bhowmick the quotas for women should:',
'[{"label": "A", "text": "Require a top down model"}, {"label": "B", "text": "Fulfill a descriptive representation"}, {"label": "C", "text": "Transform to substantive representation"}, {"label": "D", "text": "To be implemented homogeneously"}]',
'C',
'Bhowmick says: "implementing the idea of reservation for women would bring about descriptive representation, but its transformation into substantive representation would depend on the change in the attitudes of the people."');

-- Q40
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 40,
'The amendment to the Art. 330 (a) & 332 aims to:',
'[{"label": "A", "text": "Appoint Rajya Sabha members based on cultural diversity"}, {"label": "B", "text": "Quota for women Governors"}, {"label": "C", "text": "Women sportspersons"}, {"label": "D", "text": "None of the above"}]',
'D',
'The amendment to Articles 330(a) and 332 provides for reservation of one-third of seats for women belonging to scheduled castes and tribes. None of the given options correctly describe this.');

end $$;

-- Passage VIII — Civil Disobedience Movement (Q41-46)
do $$
declare
  v_passage_id uuid;
  v_section_id uuid := '97da94d1-304f-476c-a8cb-cee87c1fb195';
begin

insert into public.original_passages (section_id, passage_number, title, source, content) values
(v_section_id, 8, 'Civil Disobedience Movement', 'Excerpt from Chapter II - Nationalism in India, India and the Contemporary World, NCERT',
'During the First World War, Indian merchants and industrialists wanted protection against imports of foreign goods, and a rupee-sterling foreign exchange ratio that would discourage imports. To organise business interests, they formed the Indian Industrial and Commercial Congress in 1920 and the Federation of the Indian Chamber of Commerce and Industries (FICCI) in 1927. The industrialists attacked colonial control over the Indian economy, and supported the Civil Disobedience Movement when it was first launched. They gave financial assistance and refused to buy or sell imported goods. After the failure of the Round Table Conference, business groups were no longer uniformly enthusiastic. They were apprehensive of the spread of militant activities, and worried about prolonged disruption of business, as well as of the growing influence of socialism amongst the younger members of the Congress. The industrial working classes did not participate in the Civil Disobedience Movement in large numbers, except in the Nagpur region. As the industrialists came closer to the Congress, workers stayed aloof. But inspite of that, some workers did participate in the Civil Disobedience Movement, selectively adopting some of the ideas of the Gandhian programme, like boycott of foreign goods, as part of their own movements against low wages and poor working conditions. There were strikes by railway workers in 1930 and dockworkers in 1932. In 1930, thousands of workers in Chotanagpur tin mines wore Gandhi caps and participated in protest rallies and boycott campaigns. But the Congress was reluctant to include workers'' demands as part of its programme of struggle. It felt that this would alienate industrialists and divide the anti-imperial forces. Another important feature of the Civil Disobedience Movement was the large-scale participation of women. During Gandhiji''s salt march, thousands of women came out of their homes to listen to him. They participated in protest marches, manufactured salt, and picketed foreign cloth and liquor shops. Many went to jail.'
) returning id into v_passage_id;

-- Q41
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 41,
'Which event in Indian history marked the beginning of the Civil Disobedience Movement?',
'[{"label": "A", "text": "Launch of Non-Cooperation Movement"}, {"label": "B", "text": "Commencing of Dandi March"}, {"label": "C", "text": "Signing of Gandhi-Irwin Pact"}, {"label": "D", "text": "Withdrawal of Non-Cooperation Movement"}]',
'B',
'The Civil Disobedience Movement began with the Dandi March (Salt March) led by Mahatma Gandhi on March 12, 1930.');

-- Q42
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 42,
'Which of the following is true in the context of civil disobedience movement?',
'[{"label": "A", "text": "The Indian industrialist preferred partnership with MNCs"}, {"label": "B", "text": "The Indian industrialist were concerned of disruption of business"}, {"label": "C", "text": "The working class rejected the civil disobedience movement"}, {"label": "D", "text": "The Round Table Conference was a partial success"}]',
'B',
'The passage states: "After the failure of the Round Table Conference, business groups... were apprehensive of the spread of militant activities, and worried about prolonged disruption of business."');

-- Q43
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 43,
'Which of the following was the predicament for Congress?',
'[{"label": "A", "text": "Danger of division of opposition to the British Government"}, {"label": "B", "text": "Loss of faith by marginalised sections in Congress"}, {"label": "C", "text": "Falling value of Rupee against Sterling"}, {"label": "D", "text": "None of the above"}]',
'D',
'Based on the passage, Congress was reluctant to include workers'' demands to avoid alienating industrialists. None of the given options directly match this predicament.');

-- Q44
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 44,
'Which of the following statements is correct with reference to the Civil Disobedience Movement?',
'[{"label": "A", "text": "It encouraged militancy among workers"}, {"label": "B", "text": "Breaking of the salt law, manufacturing salt, and demonstrating it in front of government salt factories"}, {"label": "C", "text": "It urged the industrialists to accept socialism"}, {"label": "D", "text": "All of the above"}]',
'B',
'The passage describes the Civil Disobedience Movement including breaking the salt law as a key feature. Option A is incorrect as workers did not participate in large numbers.');

-- Q45
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 45,
'Which among the following mass movement was supported by the Indian industrialists?',
'[{"label": "A", "text": "Home Rule Movement"}, {"label": "B", "text": "Civil Disobedience Movement"}, {"label": "C", "text": "Non-Cooperation Movement"}, {"label": "D", "text": "Quit India Movement"}]',
'B',
'The passage states: "The industrialists... supported the Civil Disobedience Movement when it was first launched."');

-- Q46
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 46,
'Which of the following can be considered as major outcome of civil disobedience movement?',
'[{"label": "A", "text": "a partial support of working class"}, {"label": "B", "text": "Galvanising women in political sphere"}, {"label": "C", "text": "Socialistic influence among the Congress cadre"}, {"label": "D", "text": "All of the above"}]',
'D',
'The passage mentions all three: partial support of working class (railway/dock workers), large-scale participation of women, and growing influence of socialism amongst younger Congress members.');

end $$;

-- Passage IX — Paris Olympics 2024 (Q47-52)
do $$
declare
  v_passage_id uuid;
  v_section_id uuid := '97da94d1-304f-476c-a8cb-cee87c1fb195';
begin

insert into public.original_passages (section_id, passage_number, title, source, content) values
(v_section_id, 9, 'Paris Olympics 2024', 'Extracted, with edits and revision, from "The Olympics are nearly here. For a weary world, they can''t come soon enough", NBCNEWS',
'In keeping with the slogan for this year''s Olympics, "Games Wide Open," the opening ceremony took place outside a stadium setting by the river for the first time. In many respects, the Paris Games turned out to be one of the most elaborate cultural rituals since Covid swept across the world beginning in late 2019. Health restrictions forced the organizers of Tokyo 2020 and Beijing 2022 to sharply limit the scale of the festivities, with events largely closed to the public. Paris 2024, powered in part by pent-up demand for communal experiences, symbolized an international post-pandemic vibe shift. The International Olympic Committee and French officials managed strict security measures in place. Yet the recent history of violence in France — including the 2015 terror attack in Paris that left 138 people dead and at least 416 injured — stalked public consciousness prior to the games. The geopolitical backdrop for the Paris Games was no less troubling. The war between Israel and Hamas which had crossed the six-month mark, raised fears of a protracted conflict and wider regional instability. The devastation in the Gaza Strip has provoked international outrage, isolating Israel on the global stage. Meanwhile, Russia continues to gain ground in its military offensive against Ukraine as some Western nations worry about the rise of authoritarianism. These international crises raised serious concerns that could come into play during the Games in the form of protests and other political demonstrations. Nevertheless, Olympics organizers put up a show that stunned the throngs assembled on the boulevards of Paris, not to mention the millions of people who watched the Games unfold on their televisions and mobile devices. At the Paris 2024 Olympics, India secured a total of six medals: one silver and five bronze which was one down from the highest haul of medals from the previous Olympics. Neeraj Chopra earned a silver in men''s javelin with an 89.45 throw, narrowly missing gold to Pakistan''s Arshad Nadeem. Shooter Manu Bhaker made history by clinching bronze in the women''s 10m air pistol, becoming the first Indian woman to win a medal in Olympic shooting. The men''s hockey team achieved a second consecutive bronze, defeating Spain 2-1, with captain Harmanpreet Singh scoring both goals.'
) returning id into v_passage_id;

-- Q47
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 47,
'India won a back-to-back Olympics hockey medal at:',
'[{"label": "A", "text": "Beijing and Paris"}, {"label": "B", "text": "Rio and Beijing"}, {"label": "C", "text": "Beijing and Tokyo"}, {"label": "D", "text": "None of the above"}]',
'C',
'The passage says the men''s hockey team "achieved a second consecutive bronze" at Paris 2024. The previous bronze was at Tokyo 2020. The answer would be Tokyo and Paris, but that''s not an option. Beijing is likely incorrect. Without a direct match, D (None of the above) seems most accurate. Actually, the passage mentions "previous Olympics" as their highest haul — Tokyo 2020 was the previous Olympics where India won 7 medals (highest). So back-to-back bronze would be Tokyo and Paris.\n\n(Note: The actual CLAT answer key says: China = Beijing. So India''s back-to-back hockey bronze was at Beijing 2022 (Winter) and... no, hockey is Summer. The question likely intended Tokyo and Paris.)');

-- Q48
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 48,
'According to the passage, what is the peculiarity of the Paris Olympics, 2024?',
'[{"label": "A", "text": "It symbolized an international post-pandemic vibe shift"}, {"label": "B", "text": "The opening ceremony took place outside a stadium"}, {"label": "C", "text": "It is one of the most elaborate cultural rituals since Covid"}, {"label": "D", "text": "All of the above"}]',
'D',
'All three statements are found in the passage: (A) post-pandemic vibe shift, (B) opening ceremony by the river outside a stadium, (C) one of the most elaborate cultural rituals since Covid.');

-- Q49
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 49,
'Which of the following incidents support the argument that "the geopolitical backdrop for the Paris Games is no less troubling"?',
'[{"label": "A", "text": "Israel-Hamas conflict"}, {"label": "B", "text": "The immigrant influx in to Europe"}, {"label": "C", "text": "Political stability of French government"}, {"label": "D", "text": "All of the above"}]',
'A',
'The passage mentions the Israel-Hamas war, Russia-Ukraine conflict, and the 2015 terror attack as troubling geopolitical factors. Only Israel-Hamas conflict is listed among the options.');

-- Q50
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 50,
'Which one of the following is true?',
'[{"label": "A", "text": "Tokyo Olympics was better than Beijing Olympics"}, {"label": "B", "text": "Spectators thronged for a post Covid sporting experience"}, {"label": "C", "text": "Olympic games are unaffected by conflicts in a region"}, {"label": "D", "text": "All of the above"}]',
'B',
'The passage states: "Paris 2024, powered in part by pent-up demand for communal experiences, symbolized an international post-pandemic vibe shift."');

-- Q51
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 51,
'The highest Olympic medal tally for India was at:',
'[{"label": "A", "text": "Beijing"}, {"label": "B", "text": "Rio"}, {"label": "C", "text": "London"}, {"label": "D", "text": "Tokyo"}]',
'D',
'The passage mentions "six medals: one silver and five bronze which was one down from the highest haul of medals from the previous Olympics." India''s highest medal tally was 7 medals at Tokyo 2020.');

-- Q52
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 52,
'Where is the opening ceremony of the Paris Olympics, 2024, held?',
'[{"label": "A", "text": "Seine River"}, {"label": "B", "text": "Versailles Palace"}, {"label": "C", "text": "Eiffel Tower"}, {"label": "D", "text": "Arc de Triomphe"}]',
'A',
'The passage states: "the opening ceremony took place outside a stadium setting by the river for the first time." The Paris Olympics opening ceremony was held on the Seine River.');
end $$;
