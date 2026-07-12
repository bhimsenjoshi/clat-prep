-- ─── Seed: CLAT UG 2025 Set C (Original Paper) ───
-- Extracted from the official question paper PDF at /tmp/clat_2025_set_c.pdf
-- 120 questions across 5 sections
-- Generated on 2026-07-11

-- ─────────────────────────────────────────────────────
-- 1. Insert paper metadata
-- ─────────────────────────────────────────────────────
with paper as (
  insert into public.original_papers (title, exam_type, year, set_name, total_questions, duration_minutes, source_url)
  values ('CLAT UG 2025 Set C', 'ug', 2025, 'C', 120, 120, 'https://cdn-images.prepp.in/public/image/clat-2025-ug-question-paper-pdf-dec-01-2024-c-1762246952.pdf')
  returning id
),
-- ─────────────────────────────────────────────────────
-- 2. Insert sections
-- ─────────────────────────────────────────────────────
sections as (
  insert into public.original_sections (paper_id, name, order_index, total_questions)
  select paper.id, name, order_index, total_questions
  from paper cross join (values
    ('English Language', 1, 24),
    ('Current Affairs Including General Knowledge', 2, 28),
    ('Legal Reasoning', 3, 32),
    ('Logical Reasoning', 4, 24),
    ('Quantitative Techniques', 5, 12)
  ) as s(name, order_index, total_questions)
  returning id, name, order_index
),
-- ─────────────────────────────────────────────────────
-- 3. Insert passages with UUIDs we can reference
-- ─────────────────────────────────────────────────────
section_ids as (
  select id, name, order_index from sections
),
passages as (
  insert into public.original_passages (id, section_id, passage_number, title, source, content)
  select
    p.id, s.id, p.passage_number, p.title, p.source, p.content
  from section_ids s
  cross join lateral (values
    -- ═══════════════════════════════════════════════════
    -- ENGLISH LANGUAGE (Section 1) — Passages I to IV
    -- ═══════════════════════════════════════════════════
    (
      gen_random_uuid(), 1,
      'Education is not the amount of information...',
      'Swami Vivekananda',
      $$Education is not the amount of information that is put into your brain and runs riot there, undigested, all your life. We must have life-building, man-making, character-making assimilation of ideas…. If education were identical with information, the libraries are the sages in the world and encyclopaedias are the rishis. Getting by heart the thoughts of others in a foreign language and stuffing your brain with them and taking some University degree, you consider yourself educated. Is this education? What is the goal of your education? Open your eyes and see what a piteous cry for food is rising in the land of Bharata, proverbial for its food. Will your education fulfill this want?

We want that education by which character is formed, strength of mind is increased, the intellect is expanded and by which one can stand on one''s own feet. What we need to study independent of foreign control, different branches of the knowledge that is our own, and with it the English language and Western science; we need technical education and all else that will develop industries so that men instead of seeking for service may earn enough to provide for themselves and save against a rainy day. The end of all education, all training, should be man-making. The end and aim of all training are to make the man grow. The training by which the current expression of will are brought under control and become fruitful, is called education. What our country now wants are muscles of iron and nerves of steel, gigantic wills, which nothing can resist, which can penetrate into the mysteries and secrets of the universe and will accomplish their purpose in any fashion, even if it meant going down to the bottom of the ocean, meeting death face to face.

There is only one method of attaining knowledge. It is by concentration. The very essence of education is concentration of mind. From the lowest to the highest man, all have to use the same method to attain knowledge. The chemist who works in the laboratory concentrates on elements to analyze them. Knowledge is acquired by concentration.$$
    ),
    (
      gen_random_uuid(), 2,
      'From a very early age, I knew that when I grew up, I should be a writer...',
      'George Orwell',
      $$From a very early age, I knew that when I grew up, I should be a writer. I had the lonely child''s habit of making up stories and holding conversations with imaginary persons, and I think from the very start my literary ambitions were mixed up with the feeling of being isolated and undervalued. I knew that I had a facility with words and a power of facing unpleasant facts, and I felt that this created a sort of private world in which I could get my own back for my failure in everyday life. I wanted to write enormous naturalistic novels with unhappy endings, full of detailed descriptions and arresting similes, and also full of purple passages in which words were used partly for the sake of their sound. I give all this background information because I do not think one can assess a writer''s motives without knowing something of his early development.

His subject-matter will be determined by the age he lives in – at least this is true in tumultuous, revolutionary ages like our own – but before he ever begins to write he will have acquired an emotional attitude from which he will never completely escape. It is his job to discipline his temperament, but if he escapes from his early influences altogether, he will have killed his impulse to write. I think there are four great motives for writing, at any rate for writing prose. They are: (i) Sheer egoism: Desire to seem clever, to be talked about, to be remembered after death, to get your own back on grown-ups who snubbed you in childhood; (ii) Aesthetic enthusiasm: Desire to share an experience which one feels is valuable and ought not to be missed (iii) Historical impulse: Desire to see things as they are, to find out true facts and store them up for the benefit of posterity (iv) Political purpose: Desire to push the world in a certain direction, to alter other people''s idea of the kind of society that they should strive after.$$
    ),
    (
      gen_random_uuid(), 3,
      'Punctually at midday, he opened his bag and spread out his professional equipment...',
      'R.K. Narayan',
      $$Punctually at midday, he opened his bag and spread out his professional equipment, which consisted of a dozen cowrie shells, a square piece of cloth with obscure mystic charts on it, a notebook, and a bundle of palmyra writing. His forehead was dazzling with sacred ash and vermilion, and his eyes sparkled with a sharp, abnormal gleam which was really an outcome of a continual searching look for customers, but which his simple clients took to be a prophetic light and felt comforted. The power of his eyes was considerably enhanced by their position—placed as they were between the painted forehead and the dark whiskers which streamed down his cheeks: even a half-wit''s eyes would sparkle in such a setting. People were attracted to him as bees are attracted to cosmos or dahlia stalks. He sat under the boughs of a spreading tamarind tree which flanked a path running through the town hall park. It was a remarkable place in many ways: a surging crowd was always moving up and down this narrow road morning till night. A variety of trades and occupations was represented all along its way: medicine sellers, sellers of stolen hardware and junk, magicians, and, above all, an auctioneer of cheap cloth, who created enough din all day to attract the whole town. Next to him in vociferousness came a vendor of fried groundnut, who gave his ware a fancy name each day, calling it "Bombay Ice Cream" one day, and on the next "Delhi Almond," and on the third "Raja''s Delicacy," and so on and so forth, and people flocked to him. A considerable portion of this crowd dallied before the astrologer too. The astrologer transacted his business by the light of a flare which crackled and smoked up above the groundnut heap nearby.$$
    ),
    (
      gen_random_uuid(), 4,
      'The right kind of education consists in understanding the child as he is...',
      'J. Krishnamurti',
      $$The right kind of education consists in understanding the child as he is without imposing upon him an ideal of what we think he should be. To enclose him in the framework of an ideal is to encourage him to conform, which breeds fear and produces in him a constant conflict between what he is and what he should be: and all inward conflicts have their outward manifestations in society. If the parent loves the child, he observes him, he studies his tendencies, his moods, and peculiarities. It is only when one feels no love for the child that one imposes upon him an ideal, for then one''s ambitions are trying to fulfill themselves in him, wanting him to become this or that. If one loves, not the ideal but the child, then there is a possibility of helping him to understand himself as he is.

Ideals are a convenient escape, and the teacher who follows them is incapable of understanding his students and dealing with them intelligently; for him, the future ideal, the what should be, is far more important than the present child. The pursuit of an ideal excludes love, and without love no human problem can be solved. If the teacher is of the right kind, he will not depend on a method, but will study each individual pupil. In our relationship with children and young people, we are not dealing with mechanical devices that can be quickly repaired, but with living beings who are impressionable, volatile, sensitive, afraid, affectionate: and to deal with them, we have to have great understanding, the strength of patience and love. When we lack these, we look to quick and easy remedies and hope for marvellous and automatic results. If we are unaware, mechanical in our attitudes and actions, we fight shy of any demand upon us that is disturbing and that cannot be met by an automatic response, and this is one of our major difficulties in education.$$
    ),
    -- ═══════════════════════════════════════════════════
    -- CURRENT AFFAIRS & GK (Section 2) — Passages V to IX
    -- ═══════════════════════════════════════════════════
    (
      gen_random_uuid(), 5,
      'In keeping with the slogan for this year''s Olympics, "Games Wide Open"...',
      'Paris Olympics 2024',
      $$In keeping with the slogan for this year''s Olympics, "Games Wide Open," the opening ceremony took place outside a stadium setting by the river for the first time. In many respects, the Paris Games turned out to be one of the most elaborate cultural rituals since Covid swept across the world beginning in late 2019. Health restrictions forced the organizers of Tokyo 2020 and Beijing 2022 to sharply limit the scale of the festivities, with events largely closed to the public. Paris 2024, powered in part by pent-up demand for communal experiences, symbolized an international post-pandemic vibe shift.

The International Olympic Committee and French officials managed strict security measures in place. Yet the recent history of violence in France — including the 2015 terror attack in Paris that left 138 people dead and at least 416 injured — stalked public consciousness prior to the games. The geopolitical backdrop for the Paris Games was no less troubling. The war between Israel and Hamas which had crossed the six-month mark, raised fears of a protracted conflict and wider regional instability. The devastation in the Gaza Strip has provoked international outrage, isolating Israel on the global stage. Meanwhile, Russia continues to gain ground in its military offensive against Ukraine as some Western nations worry about the rise of authoritarianism. These international crises raised serious concerns that could come into play during the Games in the form of protests and other political demonstrations.

Nevertheless, Olympics organizers put up a show that stunned the throngs assembled on the boulevards of Paris, not to mention the millions of people who watched the Games unfold on their televisions and mobile devices. At the Paris 2024 Olympics, India secured a total of six medals: one silver and five bronze which was one down from the highest haul of medals from the previous Olympics. Neeraj Chopra earned a silver in men''s javelin with an 89.45 throw, narrowly missing gold to Pakistan''s Arshad Nadeem. Shooter Manu Bhaker made history by clinching bronze in the women''s 10m air pistol, becoming the first Indian woman to win a medal in Olympic shooting. The men''s hockey team achieved a second consecutive bronze, defeating Spain 2-1, with captain Harmanpreet Singh scoring both goals.$$
    ),
    (
      gen_random_uuid(), 6,
      'Chinese President Xi Jinping and Indian Prime Minister Narendra Modi used a BRICS summit...',
      'BRICS Summit 2024',
      $$Chinese President Xi Jinping and Indian Prime Minister Narendra Modi used a BRICS summit in Russia recently to showcase ambitions for a more harmonious relationship between the world''s two most populous countries after years of animosity.

The meeting between Xi and Modi, who have not held formal talks for five years, was one highlight of a summit. BRICS also gave an opportunity to the Russian President Vladimir Putin for showcasing that the West had failed to isolate Russia over the Ukraine war.

A final communique listed a number of projects aimed at facilitating trade between BRICS nations - including an alternative payment system to the dollar - but did not include details or timelines.

Just two days after New Delhi announced that it had reached a deal with Beijing to resolve a four-year military stand-off on their disputed Himalayan frontier, Xi told Modi that they should enhance communication and cooperation and effectively manage differences.

BRICS - an idea thought up inside Goldman Sachs two decades ago to describe the growing economic clout of China and other major emerging markets - is now a group that accounts for 45% of the world''s population and 35% of the global economy.

Former Goldman Sachs economist Jim O''Neill, who coined the BRIC term in 2001, told Reuters that he had little optimism for the BRICS club as long as China and India remained so divided.

"It seems to me basically to be a symbolic annual gathering where important emerging countries, particularly noisy ones like Russia, but also China, can basically get together and highlight how good it is to be part of something that doesn''t involve the U.S. and that global governance isn''t good enough."

The 43-page final communique from the summit ranged from geopolitics and narcotics to artificial intelligence and even the preservation of Big Cats, but lacked detail on some major issues. It mentioned Ukraine just once.$$
    ),
    (
      gen_random_uuid(), 7,
      'On the recommendation of Parliament, the President of India effectively abrogated Article 370...',
      'Article 370 and J&K Reorganization',
      $$On the recommendation of Parliament, the President of India effectively abrogated Article 370 of the Indian Constitution and gave assent to the Jammu and Kashmir Reorganization Act, 2019. The former state of Jammu & Kashmir has been reorganized as the new Union Territory of Jammu and Kashmir and the new Union Territory of Ladakh on 31st October 2019.

The new Union Territory of Ladakh consists of two districts of Kargil and Leh. The rest of the former State of Jammu and Kashmir is in the new Union Territory of Jammu and Kashmir.

By 2019, the state government of former Jammu and Kashmir had reorganized the areas of these 14 districts into 28 districts. The names of the new districts are as follows - Kupwara, Bandipur, Ganderbal, Srinagar, Budgam, Pulwama, Shupian, Kulgam, Rajouri, Ramban, Doda, Kishtivar, Samba and Kargil.

Out of these, Kargil district was carved out from the area of Leh and Ladakh district. The Leh district of the new Union Territory of Ladakh has been defined in the Jammu and Kashmir Reorganization (Removal of Difficulties) Second Order, 2019, issued by the President of India, to include the areas of the districts of Gilgit, Gilgit Wazarat, Chilhas and Tribal Territory of 1947, in addition to the remaining areas of Leh and Ladakh districts of 1947, after carving out the Kargil District.$$
    ),
    (
      gen_random_uuid(), 8,
      'The "Nari Shakti Vandan Adhiniyam", 2023 Act received near-unanimous support...',
      'Nari Shakti Vandan Adhiniyam 2023',
      $$The "Nari Shakti Vandan Adhiniyam", 2023 Act received near-unanimous support in both the Lok Sabha and the Rajya Sabha. The legislation mandates the reservation of one-third of all seats in the Lok Sabha, state legislative assemblies, and Delhi (as a union territory with an elected assembly) for women. This linking of the implementation of the Act to the implementing of two long-term exercises of census and delimitation, makes little sense to many, and sounds quite like empowerment delayed for now.

In a 2012 article ''Holding Up Half the Sky: Reservations for Women in India'', Rudolf C Heredia breaks down the common misconceptions that cloud our understanding of women''s political participation- "When women do attain a national leadership role it is often because they have inherited the mantle from their fathers or husbands, rather than as persons in their own right and are then projected as matriarchs, part of the joint family, complementary to the patriarchy rather than a challenge to it."

In ''Equality versus Empowerment: Women in Indian Legislature'', 2023, Soumya Bhowmick makes the case for going a step beyond quotas, and to turn our attention to the complexities that shape women''s agency in the country. This, he argues, would require a bottoms-up approach, rather than merely handing out reservations in a top-down manner. "In a country like India with a considerably large heterogeneous population, the dissemination of legislative power would be insufficient to protect the interests of minority groups such as women, Scheduled Castes, and Scheduled Tribes." He concludes that "implementing the idea of reservation for women would bring about descriptive representation, but its transformation into substantive representation would depend on the change in the attitudes of the people."

While the reservation of one-third of seats for women belonging to the scheduled castes and tribes under the amendment to article 330a and 332 of the constitution is a welcome step, it remains to be seen whether it fully acknowledges the complex interplay of hierarchies, socio-political relationships which also affect the extent and nature of complications that surround effective realisation of women''s politics for Indian politics to emerge as a truly emancipatory space.$$
    ),
    (
      gen_random_uuid(), 9,
      'During the First World War, Indian merchants and industrialists wanted protection...',
      'Civil Disobedience Movement (NCERT)',
      $$During the First World War, Indian merchants and industrialists wanted protection against imports of foreign goods, and a rupee-sterling foreign exchange ratio that would discourage imports. To organise business interests, they formed the Indian Industrial and Commercial Congress in 1920 and the Federation of the Indian Chamber of Commerce and Industries (FICCI) in 1927. The industrialists attacked colonial control over the Indian economy, and supported the Civil Disobedience Movement when it was first launched. They gave financial assistance and refused to buy or sell imported goods. After the failure of the Round Table Conference, business groups were no longer uniformly enthusiastic. They were apprehensive of the spread of militant activities, and worried about prolonged disruption of business, as well as of the growing influence of socialism amongst the younger members of the Congress.

The industrial working classes did not participate in the Civil Disobedience Movement in large numbers, except in the Nagpur region. As the industrialists came closer to the Congress, workers stayed aloof. But inspite of that, some workers did participate in the Civil Disobedience Movement, selectively adopting some of the ideas of the Gandhian programme, like boycott of foreign goods, as part of their own movements against low wages and poor working conditions. There were strikes by railway workers in 1930 and dockworkers in 1932. In 1930, thousands of workers in Chotanagpur tin mines wore Gandhi caps and participated in protest rallies and boycott campaigns. But the Congress was reluctant to include workers'' demands as part of its programme of struggle. It felt that this would alienate industrialists and divide the anti-imperial forces.

Another important feature of the Civil Disobedience Movement was the large-scale participation of women. During Gandhiji''s salt march, thousands of women came out of their homes to listen to him. They participated in protest marches, manufactured salt, and picketed foreign cloth and liquor shops. Many went to jail.$$
    ),
    -- ═══════════════════════════════════════════════════
    -- LEGAL REASONING (Section 3) — Passages X to XV
    -- ═══════════════════════════════════════════════════
    (
      gen_random_uuid(), 10,
      'The Contract Act 1872 deals with contract law in India...',
      'Contract Act — Void Agreements and Voidable Contracts',
      $$The Contract Act 1872 deals with contract law in India, its rights, duties, and exceptions arising out of it. Section 2(h) of the Act gives us the definition of a contract, which is simply an agreement enforceable by law. To understand the difference between void agreements and voidable contracts it is important to talk about sections 2(h), 2(a), 2(i), 2(d), 14, 16 (3) and 15,24-28 of the Indian Contract Act. Void agreements, are fundamentally invalid making them unenforceable by default. These agreements cannot be fulfilled as they consist of illegal elements and they cannot be enforced even after subjecting it to both parties. However, in the case of voidable contract, the agreement is initially enforceable but it is later on denied at the option of either of the parties due to various reasons.

Unless rejected by a party, this contract will remain valid and enforceable. The party who is at the disadvantage due to any circumstance applicable to the contract has the ability to render the agreement void. A void agreement is void ab initio making it impossible to rectify any defects in it while voidable contracts can be rectified. In case of a void agreement, neither of the parties is subject to any compensation for any losses but voidable contracts have some remedies.

A valid agreement forms a contract that may again be either valid or voidable. The primary difference between a void agreement and voidable contract is that a void agreement cannot be converted into a contract.$$
    ),
    (
      gen_random_uuid(), 11,
      'The Supreme Court of India declared that the right to privacy is a fundamental right...',
      'Digital Personal Data Protection Law',
      $$The Supreme Court of India declared that the right to privacy is a fundamental right and that the right to informational privacy is part of this right. Subsequently, the Parliament of India enacted a new law relating to digital personal data protection. The law applies to Indian residents and businesses collecting the data of Indian residents. It also applies to non-citizens living in India whose data processing is "in connection with any activity related to the offering of goods or services" that happens outside India. The law allows personal data to be processed for any lawful purpose. If the personal data is sensitive, then additional safeguards are to be observed. The entity processing data can do so either by taking the concerned individual''s consent or for "legitimate uses"- which include situations where an individual has voluntarily provided personal data for a specified purpose. The law requires that an individual''s consent must be "free, specific, informed, unconditional and unambiguous with a clear affirmative action" and for a specific purpose. The data collected has to be limited to that necessary for the specified purpose. A clear notice containing these details has to be provided to consumers, including the rights of the concerned individual and the grievance redressal mechanism. Individuals have the right to withdraw consent if consent is the ground on which data is being processed. The law also creates rights and obligations for individuals. These include the right to get a summary of all the collected data and to know the identities of all other entities/organisations with whom the personal data has been shared, along with a description of the data shared. Individuals also have the right to correction, completion, updating, and erasure of their data. Besides, they have a right to obtain redressal for their grievances and a right to nominate persons who will receive their data.$$
    ),
    (
      gen_random_uuid(), 12,
      'The Public Examinations (Prevention of Unfair Means) Act, 2024...',
      'Public Examinations (Prevention of Unfair Means) Act, 2024',
      $$The Public Examinations (Prevention of Unfair Means) Act, 2024 that has provision for up to five years'' imprisonment and a fine of up to Rs. 1 crore for malpractices and organized cheating in government recruitment exams was notified by the Union government and came into effect from June 21, 2024. The Bill had received assent from the President of India on the 13th February 2024. The Public Examinations (Prevention of Unfair Means) Act, 2024 mentions punishments for "leakage of question paper or answer key", "directly or indirectly assisting the candidate in any manner unauthorisedly in the public examination" and "tampering with the computer network or a computer resource or a computer system" as offences done by a person, group of persons or institutions. Besides these, "creation of fake website to cheat or for monetary gain", "conduct of fake examination, issuance of fake admit cards or offer letters to cheat or for monetary gain" and "manipulation in seating arrangements, allocation of dates and shifts for the candidates to facilitate adopting unfair means in examinations" are also among the offences punishable under the law.

"Any person or persons resorting to unfair means and offences under this Act shall be punished with imprisonment for a term not less than three years but which may extend to five years and with fine up to Rs. 10 lakh," said the Act. A service provider, engaged by the public examination authority for conduct of examinations, shall also be liable to be punished with imposition of a fine up to Rs. 1 crore "and proportionate cost of examination shall also be recovered" from it, according to the Act. Such service providers shall also be barred from being assigned with any responsibility for the conduct of any public examination for a period of four years.$$
    ),
    (
      gen_random_uuid(), 13,
      'The 42nd Constitutional Amendment Act 1976 introduced the concept of environmental protection...',
      'Right to Clean Environment and Climate Change',
      $$The 42nd Constitutional Amendment Act 1976 introduced the concept of environmental protection in an explicit manner into the Constitution through introduction of Article 48-A and Article 51-A (g). In many judgments, the Supreme Court ruled that both the state and its residents have a fundamental duty to preserve and protect their natural resources. The recent judgment obliquely makes way for an enforceable right, and a potential obligation on the state unless the same is overturned by an Act of Parliament.

India is signatory of various international environmental conservation treaties under which India has the binding commitment to reduce carbon emission. During the COP 21, India signed Paris Agreement along with 196 countries, under which universally binding agreement was made to limit greenhouse gas emission to levels that would prevent global temperatures from increasing to more than 1.5 degree Celsius before the industrial revolution. India has committed to generating 50% of its energy through renewable resources and will generate 500 GW of energy from non-fossil fuels by 2030, reducing the carbon emission by 1 billion ton. Additionally, India has committed to achieve net zero carbon emission target by 2070.

Supreme Court''s March 21, 2024 verdict builds on the bulwark of jurisprudence in place since 1986, and, through various other judgments, the Supreme Court has recognised the right to clean environment along with right to clean air, water and soil free from pollution which is absolutely necessary for the enjoyment of life. Any disturbance with these basic elements of environment would amount to violation of Article 21. It also establishes duty of the state to maintain ecological balance and hygienic environment. Although right to clean environment has existed, by recognizing the right against climate change it shall compel the states to prioritize environmental protection and sustainable development.$$
    ),
    (
      gen_random_uuid(), 14,
      'Children come in contact with the criminal justice system either as victims or witnesses...',
      'Child Rights in the Criminal Justice System',
      $$Children come in contact with the criminal justice system either as victims or witnesses to a crime or as children in conflict with law (CICL). As CICL, they could be alleged of, accused or recognised as having broken the law by committing a crime. According to the National Crime Records Bureau (NCRB) Report 2021, India recorded a total number of 1,49,404 instances of crimes against children in 2021 — a rise of over 16 per cent from the previous year. In terms of percentage, the top categories under crime against children were kidnapping and abduction, followed by cases registered under the POCSO Act. Further, the NCRB report revealed that of the total cases, 53,874 were registered under POCSO Sections. Sexual offences against children shows a steady ascent, with 47,221 such cases being recorded in 2020, and 47,335 cases in 2019. In 2019, as many as 32,269 cases were registered across the country, while the 2021 report registered a decline of 3.5 per cent recording 31,170 cases.

The Criminal Justice system of any country broadly refers to agencies of the government charged with enforcing law, adjudicating crime, and correcting criminal conduct. The main objective of the criminal justice system is ''deterrence'', i.e., to punish the ''transgressors and the criminals'' and to maintain law and order in the society. Globally, children and young people are routinely exposed to various forms of violence if they are before the criminal justice system. They are at risk of physical and psychological abuse, sexual assault, and other harms, including inadequate educational opportunities, poor and outdated vocational training. They face several challenges including mental, emotional, and behavioural disorders. Children, who are victims of violence or exposed to violence during childhood, are more likely to have difficulty in school, abuse drugs or alcohol, act aggressively, suffer from depression or other mental health problems and engage in criminal behaviour as adults.$$
    ),
    (
      gen_random_uuid(), 15,
      'Geographical Indications (GIs) are a form of intellectual property...',
      'Geographical Indications and TRIPS',
      $$Geographical Indications (GIs) are a form of intellectual property that designates a product as originating from a specific geographic location, where a given quality, reputation, or other characteristic is essentially attributable to its geographic origin. GIs protect names that are used to identify products with specific qualities or characteristics due to their geographic origin. For example, ''Champagne'' refers to sparkling wine produced in the Champagne region of France, and ''Darjeeling Tea'' refers to tea grown in the Darjeeling region of India. The protection of GIs ensures that only products genuinely originating from a specific region are allowed to use the geographical name. This helps maintain the product''s reputation and quality, prevents misuse or imitation, and supports local economies by promoting regional products. International agreements such as the TRIPS Agreement under the World Trade Organization (WTO) provide a framework for the protection of GIs globally.$$
    ),
    -- ═══════════════════════════════════════════════════
    -- LOGICAL REASONING (Section 4) — Passages XVI to XIX
    -- ═══════════════════════════════════════════════════
    (
      gen_random_uuid(), 16,
      'Being a consultant, your work consists of a deep examination of the company''s environment...',
      'Consulting and Business Efficiency',
      $$Being a consultant, your work consists of a deep examination of the company''s environment and its internal system to notice inefficiencies and potential improvements. The interaction with the company''s management and different sections to decipher their objectives, opportunities, and processes. This means that, through the use of data analysis, industry best practices, and the formulation of creative ways of solving all problems, to come up with unique solutions to all problems to increase efficiency and productivity, and hence, increase profitability for employers. This might entail operations such as logistics redesign, business process reengineering, adopting new applications, systems, or even community relation programs. People management is a critical component of change management, to make sure that all the relevant parties interpret the potential alterations positively. Also, to offer orientation and create resources to explain the changes to the group and make it comfortable with the shift. The general goal is the organization''s ability to continue to grow and remain relevant with the shareholders and stakeholders in the industries it operates.$$
    ),
    (
      gen_random_uuid(), 17,
      'India is poised for rapid economic growth, potentially spurred by a young population...',
      'Lifestyle and Mental Health Epidemic',
      $$India is poised for rapid economic growth, potentially spurred by a young population driving production and demand. In the process, inevitably, lifestyles are being dramatically altered for the worse. India now reports the highest growth of ultra-processed food consumption among the youth, as well as low levels of exercise and adequate sleep. Cultural changes, including smartphones and a preponderance of English in schools, are also associated with weakened family relationships. Until recently, in the absence of extensive data, the role of these factors on mental well-being, encompassing our full range of mental capability, was not well understood. Recent findings based on a large database of over 1,50,000 individuals in India are beginning to shed light on the correlates of mental well-being among adolescents. The findings are dire. There is a silent epidemic of mental ill-health in India. Previous studies have found that ownership of smartphones is "frying" the brain. Data also suggests that it is not merely the ownership of a phone but also the early age of access that is associated with worse cognition and mental well-being as young adults. The young brain is developing and must be nurtured. These gadgets are handed to adolescents, presumably more out of convenience than sound logic. The American philosopher David Henry Thoreau remarked over 175 years ago, "Technology is an improved means to an unimproved end." This is an extreme position but one worth mulling. India reports the highest growth in consumption of ultra-processed foods. Some evidence suggests that these foods are as addictive as smoking. Recent data globally and from India shows a strong association between the consumption of ultra-processed foods and poor mental well-being, particularly the capacities for emotional and cognitive control.$$
    ),
    (
      gen_random_uuid(), 18,
      'While a majority of homeless groups exist solely in modernized cultures...',
      'Homelessness — A Global Problem',
      $$While a majority of homeless groups exist solely in modernized cultures, homelessness remains a problem throughout the world. Everywhere there are people in constant search of food, water and shelter. Many of these people have nowhere to go and can find no end or relief to their suffering. Homelessness was originally believed to be a cultural problem but is now revealing itself as a global problem. It is a problem suffered by all of humanity and must be faced and solved as such. Although this problem exists everywhere, it is more severe in certain parts of the world. Due to the differing circumstances of homelessness around the world, there can be no one solution or one set of guidelines for everyone to follow.

Even the United States constantly struggles with homelessness, despite being one of the wealthiest countries in the world. According to a 2005 survey by the United Nations, 1.6 billion people lack adequate housing. The causes vary depending on the place and person. Common reasons include a lack of affordable housing, poverty, a lack of mental health services, and more. Homelessness is rooted in systemic failures that fail to protect those who are most vulnerable. Approximately 580,000 people experience homelessness on any given night in the United States, as stated by the Housing and Urban Development (HUD) Department of the United States. The number of individuals experiencing homelessness varies by region, with urban areas experiencing higher rates of homelessness compared to rural areas. The COVID-19 pandemic has exacerbated homelessness and housing insecurity, leading to increased rates of eviction, unemployment, and housing instability. Using social distancing measures to curb the virus''s transmission has presented difficulties for homeless shelters and service providers in maintaining their capacity. The economic fallout from the pandemic has further strained resources and support systems for individuals and families experiencing homelessness.$$
    ),
    (
      gen_random_uuid(), 19,
      'Ram, Shyam, Rohit, Mohit, Rohan, Sohan, Mohan, Rakesh and Suresh are sitting around a circle...',
      'Seating Arrangement Puzzle',
      $$Ram, Shyam, Rohit, Mohit, Rohan, Sohan, Mohan, Rakesh and Suresh are sitting around a circle facing the centre. Rohit is third to the left of Ram. Rohan is fourth to the right of Ram. Mohit is fourth to the left of Suresh who is second to the right of Ram. Sohan is third to the right of Shyam. Mohan is not an immediate neighbour of Ram.$$
    ),
    -- ═══════════════════════════════════════════════════
    -- QUANTITATIVE TECHNIQUES (Section 5) — Passages XX to XXI
    -- ═══════════════════════════════════════════════════
    (
      gen_random_uuid(), 20,
      'Mr. Das is working in a construction company...',
      'Mr. Das — Household Budget',
      $$Mr. Das is working in a construction company. He has a family, including his wife and a daughter. His total monthly income includes a salary of Rs. 9228/- and a 10% house rent allowance. Due to increasing inflation, he is keeping a home budget that accounts for the income and expenses of the household. Out of his total monthly income, he spends 25% on food expenses, 18% on paying the house-rent, 9% on entertainment, 23% on the education of his child, 13% on medical expenses, and he saves 12% of his total monthly income.$$
    ),
    (
      gen_random_uuid(), 21,
      'According to the estimates of the World Inequality Report 2022...',
      'Gender Wage Gap in India',
      $$According to the estimates of the World Inequality Report 2022, in India, men earn 82 percent of the labour income, whereas women earn 18 percent of it. A woman agriculture field labourer makes Rs. 88 per day lesser than her male counterpart, according to the Ministry of Agriculture''s data for 2020-21. While a man is paid Rs. 383 a day on an average, a woman makes a mere Rs. 294 a day. The gap in their daily wages is more than the cost of two kilograms of rice. This gap differs from State to State. Field laborers, for instance, make the most money in Kerala. While a man gets Rs. 789 per day, a woman is paid Rs. 537. While this is the highest amount paid to a woman labourer in a State, it is also Rs. 252 lesser than what her male counterpart was paid. As of 2020-21, Tamil Nadu has the highest gender wage gap among agriculture field laborers at 112 per cent. It is followed by Goa (61 percent) and Kerala. The wage gap is the lowest in Jharkhand and Gujarat (6 percent each), but the women laborers there get paid just Rs. 239 and Rs. 247 per day, respectively.

Men earn more than women across all forms of work, the gap greatest for the self-employed. In 2023, male self-employed workers earned 2.8 times that of women. In contrast, male regular wage workers earned 24% more than women and male casual workers earned 48% more. The gender gap in earnings is still a persistent phenomenon. However, there are differences in trends. The gender gap has increased for self-employed workers, while falling for regular wage workers. Male regular wage workers earned 34% more than women from 2019 to 2022, with the gap falling to 24% in 2023.$$
    )
  ) as p(id, passage_number, title, source, content)
  where s.order_index = case
    when p.passage_number between 1 and 4 then 1
    when p.passage_number between 5 and 9 then 2
    when p.passage_number between 10 and 15 then 3
    when p.passage_number between 16 and 19 then 4
    when p.passage_number between 20 and 21 then 5
  end
  returning id, passage_number, section_id
)
-- Just verify counts
select
  (select count(*) from paper) as paper_count,
  (select count(*) from sections) as section_count,
  (select count(*) from passages) as passage_count;
