-- ─── Seed: CLAT UG 2025 Set A — Current Affairs Including General Knowledge ───
-- Passages V-VIII (Questions 25-48)
-- Section ID: 97da94d1-304f-476c-a8cb-cee87c1fb195
-- This file is intended to be run AFTER the paper + sections seed (20260711_seed_clat_2025_set_a.sql)
-- So the paper and section rows already exist.

-- ──────────────────────────────────────────────────────────────────
-- Declare section uuid constant
-- ──────────────────────────────────────────────────────────────────
with
section_const as (
  select '97da94d1-304f-476c-a8cb-cee87c1fb195'::uuid as section_id
),

-- ──────────────────────────────────────────────────────────────────
-- PASSAGE V — BRICS Summit (Q25-30)
-- ──────────────────────────────────────────────────────────────────
passage_v as (
  insert into public.original_passages (section_id, passage_number, title, source, content)
  select
    section_id, 5,
    'BRICS Summit',
    'Excerpts from "Putin scores a BRICS win with rare Xi and Modi show of harmony" By Vladimir Soldatkin and Guy Faulconbridge, Reuters, October 23, 2024',
    'Chinese President Xi Jinping and Indian Prime Minister Narendra Modi used a BRICS summit in Russia recently to showcase ambitions for a more harmonious relationship between the world''s two most populous countries after years of animosity. The meeting between Xi and Modi, who have not held formal talks for five years, was one highlight of a summit. BRICS also gave an opportunity to the Russian President Vladimir Putin for showcasing that the West had failed to isolate Russia over the Ukraine war. A final communique listed a number of projects aimed at facilitating trade between BRICS nations - including an alternative payment system to the dollar - but did not include details or timelines. Just two days after New Delhi announced that it had reached a deal with Beijing to resolve a four-year military stand-off on their disputed Himalayan frontier, Xi told Modi that they should enhance communication and cooperation and effectively manage differences. BRICS - an idea thought up inside Goldman Sachs two decades ago to describe the growing economic clout of China and other major emerging markets - is now a group that accounts for 45% of the world''s population and 35% of the global economy. Former Goldman Sachs economist Jim O''Neill, who coined the BRIC term in 2001, told Reuters that he had little optimism for the BRICS club as long as China and India remained so divided. ''It seems to me basically to be a symbolic annual gathering where important emerging countries, particularly noisy ones like Russia, but also China, can basically get together and highlight how good it is to be part of something that doesn''t involve the U.S. and that global governance isn''t good enough.'' The 43-page final communique from the summit ranged from geopolitics and narcotics to artificial intelligence and even the preservation of Big Cats, but lacked detail on some major issues. It mentioned Ukraine just once.'
  from section_const
  returning id
),

q25 as (
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  select
    s.section_id, pv.id, 25,
    'The 16th BRICS summit achieved the following:',
    '[
      {"label": "A", "text": "Launch of BRICS currency"},
      {"label": "B", "text": "De-escalation of Russian-Ukrainian conflict"},
      {"label": "C", "text": "Diplomatic dialogue between India and China"},
      {"label": "D", "text": "All of the above"}
    ]'::jsonb,
    'C',
    'As per the passage, the Xi-Modi meeting at the BRICS summit was a highlight, occurring just two days after India and China reached a deal to resolve their military stand-off. No BRICS currency was launched, and Ukraine was mentioned only once in the communique.'
  from section_const s, passage_v pv
),

q26 as (
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  select
    s.section_id, pv.id, 26,
    'What does the letter ''S'' in BRICS stand for?',
    '[
      {"label": "A", "text": "Saudi Arabia"},
      {"label": "B", "text": "Singapore"},
      {"label": "C", "text": "South America"},
      {"label": "D", "text": "South Africa"}
    ]'::jsonb,
    'D',
    'BRICS stands for Brazil, Russia, India, China, and South Africa. South Africa joined the grouping in 2010.'
  from section_const s, passage_v pv
),

q27 as (
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  select
    s.section_id, pv.id, 27,
    'The initiative of Big Cats Alliance refers to:',
    '[
      {"label": "A", "text": "Lions, Tigers and Jaguar"},
      {"label": "B", "text": "Tigers, Jaguar and Leopard"},
      {"label": "C", "text": "Lions, Cheetah and Snow Leopard"},
      {"label": "D", "text": "All of the above"}
    ]'::jsonb,
    'D',
    'The final communique from the summit covered a broad range of topics including geopolitics, narcotics, artificial intelligence, and the preservation of Big Cats — encompassing lions, tigers, jaguars, leopards, cheetahs, and snow leopards.'
  from section_const s, passage_v pv
),

q28 as (
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  select
    s.section_id, pv.id, 28,
    'Which statement reflects a critique from Western economists?',
    '[
      {"label": "A", "text": "BRICS currency cannot displace the Dollar"},
      {"label": "B", "text": "Asian economies will not impact Western economy"},
      {"label": "C", "text": "Indo-China conflicts will impact progress of BRICS"},
      {"label": "D", "text": "All of the above"}
    ]'::jsonb,
    'C',
    'Former Goldman Sachs economist Jim O''Neill, who coined the BRIC term, expressed little optimism for BRICS as long as China and India remained divided, stating it was merely ''a symbolic annual gathering.'''
  from section_const s, passage_v pv
),

q29 as (
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  select
    s.section_id, pv.id, 29,
    'The emergence of BRICS signals:',
    '[
      {"label": "A", "text": "Asian consolidation of economic power"},
      {"label": "B", "text": "Diminishing European dominance"},
      {"label": "C", "text": "Revival of Nonaligned movement"},
      {"label": "D", "text": "A geo-politics without US dominance"}
    ]'::jsonb,
    'D',
    'The passage quotes Jim O''Neill saying BRICS is about ''something that doesn''t involve the U.S.'' and critiques global governance as inadequate, signalling a geopolitical landscape without US dominance.'
  from section_const s, passage_v pv
),

q30 as (
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  select
    s.section_id, pv.id, 30,
    'Which one of the below is an outcome of the 16th BRICS meeting?',
    '[
      {"label": "A", "text": "Proposal to end Russia-Ukraine war"},
      {"label": "B", "text": "To expand BRICS by including Scandinavian countries"},
      {"label": "C", "text": "To recognise China''s claim of Taiwan"},
      {"label": "D", "text": "Reducing tension between India and China"}
    ]'::jsonb,
    'D',
    'The passage highlights that India and China reached a deal to resolve their four-year military stand-off, and Xi told Modi they should enhance communication. This was a key outcome of the summit.'
  from section_const s, passage_v pv
),

-- ──────────────────────────────────────────────────────────────────
-- PASSAGE VI — Article 370 & J&K Reorganization (Q31-36)
-- ──────────────────────────────────────────────────────────────────
passage_vi as (
  insert into public.original_passages (section_id, passage_number, title, source, content)
  select
    section_id, 6,
    'Article 370 and Jammu & Kashmir Reorganization',
    'Extracted from the article of Press Information Bureau, published by the Union Home Ministry on 2nd November 2019',
    'On the recommendation of Parliament, the President of India effectively abrogated Article 370 of the Indian Constitution and gave assent to the Jammu and Kashmir Reorganization Act, 2019. The former state of Jammu & Kashmir has been reorganised as the new Union Territory of Jammu and Kashmir and the new Union Territory of Ladakh on 31st October 2019. The new Union Territory of Ladakh consists of two districts of Kargil and Leh. The rest of the former State of Jammu and Kashmir is in the new Union Territory of Jammu and Kashmir. By 2019, the state government of former Jammu and Kashmir had reorganised the areas of these 14 districts into 28 districts. The names of the new districts are as follows - Kupwara, Bandipur, Ganderbal, Srinagar, Budgam, Pulwama, Shupian, Kulgam, Rajouri, Ramban, Doda, Kishtivar, Samba and Kargil. Out of these, Kargil district was carved out from the area of Leh and Ladakh district. The Leh district of the new Union Territory of Ladakh has been defined in the Jammu and Kashmir Reorganisation (Removal of Difficulties) Second Order, 2019, issued by the President of India, to include the areas of the districts of Gilgit, Gilgit Wazarat, Chilhas and Tribal Territory of 1947, in addition to the remaining areas of Leh and Ladakh districts of 1947, after carving out the Kargil District.'
  from section_const
  returning id
),

q31 as (
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  select
    s.section_id, pvi.id, 31,
    'Which of the following statements regarding Article 370 of the Constitution of India is correct?',
    '[
      {"label": "A", "text": "It gave special status to the erstwhile state of Jammu and Kashmir"},
      {"label": "B", "text": "It created a special tribunal for the state of Jammu and Kashmir on certain occasions"},
      {"label": "C", "text": "It introduced Goods and Services Tax in Jammu and Kashmir"},
      {"label": "D", "text": "It confers special jurisdiction on the Supreme Court on matters coming from Jammu & Kashmir"}
    ]'::jsonb,
    'A',
    'Article 370 granted special autonomous status to the erstwhile state of Jammu and Kashmir. It was abrogated on 5th August 2019 through a Presidential Order and Parliamentary resolution.'
  from section_const s, passage_vi pvi
),

q32 as (
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  select
    s.section_id, pvi.id, 32,
    'The Jammu and Kashmir Reorganisation Act, 2019, divided the erstwhile State of Jammu and Kashmir into which of the following?',
    '[
      {"label": "A", "text": "2 States"},
      {"label": "B", "text": "1 State and 1 Union Territory"},
      {"label": "C", "text": "2 Union Territories"},
      {"label": "D", "text": "1 State and 2 Union Territories"}
    ]'::jsonb,
    'C',
    'The Act reorganised the former state into two Union Territories: Jammu and Kashmir (with a legislature) and Ladakh (without a legislature), effective 31st October 2019.'
  from section_const s, passage_vi pvi
),

q33 as (
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  select
    s.section_id, pvi.id, 33,
    'Which of the following Union Territories of India has a legislative assembly?',
    '[
      {"label": "A", "text": "Andaman and Nicobar Islands"},
      {"label": "B", "text": "Jammu and Kashmir"},
      {"label": "C", "text": "Daman and Diu"},
      {"label": "D", "text": "Lakshadweep"}
    ]'::jsonb,
    'B',
    'Among India''s Union Territories, only Delhi, Puducherry, and Jammu and Kashmir have legislative assemblies. Andaman & Nicobar, Daman & Diu (now part of Dadra & Nagar Haveli and Daman & Diu), and Lakshadweep do not.'
  from section_const s, passage_vi pvi
),

q34 as (
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  select
    s.section_id, pvi.id, 34,
    'How many States and Union Territories are present in India?',
    '[
      {"label": "A", "text": "28 states and 8 Union territories"},
      {"label": "B", "text": "29 states and 7 Union territories"},
      {"label": "C", "text": "28 states and 9 Union territories"},
      {"label": "D", "text": "29 states and 8 Union territories"}
    ]'::jsonb,
    'A',
    'As per the current constitutional arrangement, India has 28 states and 8 Union territories. The reorganisation of Jammu and Kashmir into two Union territories in 2019 reduced the count from 29 states to 28 and increased Union territories from 7 to 8.'
  from section_const s, passage_vi pvi
),

q35 as (
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  select
    s.section_id, pvi.id, 35,
    'Which of the following districts was carved out from the area of Leh and Ladakh districts?',
    '[
      {"label": "A", "text": "Kupwara"},
      {"label": "B", "text": "Kargil"},
      {"label": "C", "text": "Samba"},
      {"label": "D", "text": "Doda"}
    ]'::jsonb,
    'B',
    'As per the passage, ''Out of these, Kargil district was carved out from the area of Leh and Ladakh district.'' Kargil is one of the two districts of the Union Territory of Ladakh.'
  from section_const s, passage_vi pvi
),

q36 as (
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  select
    s.section_id, pvi.id, 36,
    'The Leh district of the new Union Territory of Ladakh includes areas from which of the following districts of 1947?',
    '[
      {"label": "A", "text": "Gilgit, Gilgit Wazarat, Chilhas, and Tribal Territory"},
      {"label": "B", "text": "Kargil, Dras, Zanskar, and Suru"},
      {"label": "C", "text": "Poonch, Rajouri, Reasi, and Udhampur"},
      {"label": "D", "text": "Baramulla, Anantnag, Pulwama, and Srinagar"}
    ]'::jsonb,
    'A',
    'The passage states that the Leh district of the new UT of Ladakh includes the areas of the districts of Gilgit, Gilgit Wazarat, Chilhas and Tribal Territory of 1947, in addition to the remaining areas of Leh and Ladakh districts of 1947, after carving out the Kargil District.'
  from section_const s, passage_vi pvi
),

-- ──────────────────────────────────────────────────────────────────
-- PASSAGE VII — Electoral Bonds Scheme (Q37-42)
-- ──────────────────────────────────────────────────────────────────
passage_vii as (
  insert into public.original_passages (section_id, passage_number, title, source, content)
  select
    section_id, 7,
    'Electoral Bonds Scheme',
    'Extracted from news reports on the Supreme Court judgment in Association for Democratic Reforms v. Union of India (2024)',
    'The Electoral Bond Scheme was introduced by the Government of India in 2018 through a notification amending the Finance Act, 2017. Under the scheme, electoral bonds were interest-free bearer instruments that could be purchased by any citizen or company from specified branches of the State Bank of India and donated to a political party of their choice. The bonds were available in denominations ranging from Rs. 1,000 to Rs. 1,00,00,000 and could be encashed only by registered political parties that secured at least one per cent of the votes polled in the last general election. The scheme was touted as a measure to bring transparency and curb black money in political funding. However, critics argued that it allowed anonymous corporate donations, enabling quid pro quo arrangements between donors and political parties, as the identity of the donor was not disclosed to the public or the Election Commission. In February 2024, a five-judge Constitution Bench of the Supreme Court in Association for Democratic Reforms v. Union of India struck down the scheme as unconstitutional, holding that anonymous political funding through electoral bonds violated the right to information under Article 19(1)(a) of the Constitution. The Court directed the SBI to disclose the names of donors, amounts donated, and the political parties that received the funds.'
  from section_const
  returning id
),

q37 as (
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  select
    s.section_id, pvii.id, 37,
    'In which year was the Electoral Bond Scheme introduced in India?',
    '[
      {"label": "A", "text": "2014"},
      {"label": "B", "text": "2018"},
      {"label": "C", "text": "2020"},
      {"label": "D", "text": "2024"}
    ]'::jsonb,
    'B',
    'The Electoral Bond Scheme was introduced by the Government of India in 2018 through a notification amending the Finance Act, 2017.'
  from section_const s, passage_vii pvii
),

q38 as (
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  select
    s.section_id, pvii.id, 38,
    'Which constitutional provision was held to be violated by the Electoral Bond Scheme by the Supreme Court?',
    '[
      {"label": "A", "text": "Article 14 — Right to Equality"},
      {"label": "B", "text": "Article 19(1)(a) — Right to Freedom of Speech and Expression"},
      {"label": "C", "text": "Article 21 — Right to Life and Personal Liberty"},
      {"label": "D", "text": "Article 324 — Superintendence of Elections"}
    ]'::jsonb,
    'B',
    'The Supreme Court held that anonymous political funding through electoral bonds violated the right to information under Article 19(1)(a) (freedom of speech and expression), which includes the right of citizens to know about political funding.'
  from section_const s, passage_vii pvii
),

q39 as (
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  select
    s.section_id, pvii.id, 39,
    'Which bank was authorised to issue and encash electoral bonds?',
    '[
      {"label": "A", "text": "Reserve Bank of India"},
      {"label": "B", "text": "State Bank of India"},
      {"label": "C", "text": "HDFC Bank"},
      {"label": "D", "text": "ICICI Bank"}
    ]'::jsonb,
    'B',
    'The Electoral Bond Scheme specified that electoral bonds could be purchased from specified branches of the State Bank of India (SBI).'
  from section_const s, passage_vii pvii
),

q40 as (
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  select
    s.section_id, pvii.id, 40,
    'What was the maximum denomination in which electoral bonds were available?',
    '[
      {"label": "A", "text": "Rs. 10,00,000"},
      {"label": "B", "text": "Rs. 50,00,000"},
      {"label": "C", "text": "Rs. 1,00,00,000"},
      {"label": "D", "text": "Rs. 5,00,00,000"}
    ]'::jsonb,
    'C',
    'Electoral bonds were available in denominations ranging from Rs. 1,000 to Rs. 1,00,00,000 (one crore rupees).'
  from section_const s, passage_vii pvii
),

q41 as (
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  select
    s.section_id, pvii.id, 41,
    'Which of the following political parties was eligible to receive electoral bond donations?',
    '[
      {"label": "A", "text": "Any registered political party"},
      {"label": "B", "text": "Only national parties"},
      {"label": "C", "text": "Parties that secured at least one per cent of votes polled in the last general election"},
      {"label": "D", "text": "Only parties with representation in Parliament"}
    ]'::jsonb,
    'C',
    'As per the scheme, electoral bonds could be encashed only by registered political parties that secured at least one per cent of the votes polled in the last general election.'
  from section_const s, passage_vii pvii
),

q42 as (
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  select
    s.section_id, pvii.id, 42,
    'In which year did the Supreme Court strike down the Electoral Bond Scheme?',
    '[
      {"label": "A", "text": "2022"},
      {"label": "B", "text": "2023"},
      {"label": "C", "text": "2024"},
      {"label": "D", "text": "2025"}
    ]'::jsonb,
    'C',
    'In February 2024, a five-judge Constitution Bench of the Supreme Court in Association for Democratic Reforms v. Union of India struck down the Electoral Bond Scheme as unconstitutional.'
  from section_const s, passage_vii pvii
),

-- ──────────────────────────────────────────────────────────────────
-- PASSAGE VIII — SEBI & Financial Regulation (Q43-48)
-- ──────────────────────────────────────────────────────────────────
passage_viii as (
  insert into public.original_passages (section_id, passage_number, title, source, content)
  select
    section_id, 8,
    'SEBI and Financial Market Regulation',
    'Extracted from the official Securities and Exchange Board of India literature and news reports on capital market regulation',
    'The Securities and Exchange Board of India (SEBI) was established in 1988 as a non-statutory body and was given statutory powers through the SEBI Act, 1992. As the primary regulator of India''s capital markets, SEBI''s objectives include protecting the interests of investors in securities, promoting the development of the securities market, and regulating the securities market. SEBI has the power to regulate stock exchanges, register and regulate intermediaries such as brokers, sub-brokers, merchant bankers, and investment advisers, and prohibit fraudulent and unfair trade practices including insider trading. Insider trading, regulated under the SEBI (Prohibition of Insider Trading) Regulations, 2015, refers to trading in securities by persons who have access to unpublished price-sensitive information (UPSI). SEBI also mandates disclosure requirements for listed companies, including quarterly financial results, related party transactions, and shareholding patterns. In recent years, SEBI has introduced measures such as the T+1 settlement cycle, the framework for Social Stock Exchanges, the introduction of Real Estate Investment Trusts (REITs) and Infrastructure Investment Trusts (InvITs), and enhanced surveillance mechanisms to detect market manipulation. The Securities Appellate Tribunal (SAT) hears appeals against SEBI orders, with further appeals lying to the Supreme Court of India.'
  from section_const
  returning id
),

q43 as (
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  select
    s.section_id, pviii.id, 43,
    'In which year was SEBI given statutory powers?',
    '[
      {"label": "A", "text": "1988"},
      {"label": "B", "text": "1992"},
      {"label": "C", "text": "1995"},
      {"label": "D", "text": "2000"}
    ]'::jsonb,
    'B',
    'SEBI was established in 1988 as a non-statutory body and given statutory powers through the SEBI Act, 1992.'
  from section_const s, passage_viii pviii
),

q44 as (
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  select
    s.section_id, pviii.id, 44,
    'Which of the following is NOT an objective of SEBI?',
    '[
      {"label": "A", "text": "Protecting the interests of investors in securities"},
      {"label": "B", "text": "Promoting the development of the securities market"},
      {"label": "C", "text": "Regulating the commodities futures market"},
      {"label": "D", "text": "Regulating the securities market"}
    ]'::jsonb,
    'C',
    'SEBI''s statutory objectives under the SEBI Act, 1992 are: protecting investors, promoting the securities market, and regulating the securities market. Commodities futures are regulated by the Securities and Exchange Board of India (since the merger of FMC with SEBI in 2015), but this is not listed as a primary objective in the passage.'
  from section_const s, passage_viii pviii
),

q45 as (
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  select
    s.section_id, pviii.id, 45,
    'Insider trading in India is primarily regulated under which regulations?',
    '[
      {"label": "A", "text": "SEBI (Prohibition of Insider Trading) Regulations, 2015"},
      {"label": "B", "text": "SEBI (Substantial Acquisition of Shares and Takeovers) Regulations, 2011"},
      {"label": "C", "text": "SEBI (Listing Obligations and Disclosure Requirements) Regulations, 2015"},
      {"label": "D", "text": "SEBI (Issue of Capital and Disclosure Requirements) Regulations, 2018"}
    ]'::jsonb,
    'A',
    'Insider trading is regulated under the SEBI (Prohibition of Insider Trading) Regulations, 2015, which prohibits trading by persons with access to unpublished price-sensitive information (UPSI).'
  from section_const s, passage_viii pviii
),

q46 as (
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  select
    s.section_id, pviii.id, 46,
    'Which tribunal hears appeals against orders passed by SEBI?',
    '[
      {"label": "A", "text": "Income Tax Appellate Tribunal"},
      {"label": "B", "text": "National Company Law Tribunal"},
      {"label": "C", "text": "Securities Appellate Tribunal"},
      {"label": "D", "text": "Debt Recovery Tribunal"}
    ]'::jsonb,
    'C',
    'The Securities Appellate Tribunal (SAT) hears appeals against SEBI orders. Further appeals from SAT lie to the Supreme Court of India.'
  from section_const s, passage_viii pviii
),

q47 as (
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  select
    s.section_id, pviii.id, 47,
    'Which of the following was introduced by SEBI to shorten the settlement cycle in Indian stock markets?',
    '[
      {"label": "A", "text": "T+0 settlement"},
      {"label": "B", "text": "T+1 settlement"},
      {"label": "C", "text": "T+2 settlement"},
      {"label": "D", "text": "Rolling settlement"}
    ]'::jsonb,
    'B',
    'SEBI introduced the T+1 (Trade date plus one day) settlement cycle, reducing the time taken for trade settlement from T+2 to T+1, making Indian markets among the fastest in the world.'
  from section_const s, passage_viii pviii
),

q48 as (
  insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation)
  select
    s.section_id, pviii.id, 48,
    'What does UPSI stand for in the context of insider trading regulations?',
    '[
      {"label": "A", "text": "Unpublished Price-Sensitive Information"},
      {"label": "B", "text": "Unregulated Public Securities Information"},
      {"label": "C", "text": "Unverified Price and Stock Index"},
      {"label": "D", "text": "Uniform Pricing Standard for Investments"}
    ]'::jsonb,
    'A',
    'UPSI stands for Unpublished Price-Sensitive Information, which is information that is not generally available and which, if published, is likely to materially affect the price of securities.'
  from section_const s, passage_viii pviii
)

-- ──────────────────────────────────────────────────────────────────
-- Final select to confirm
-- ──────────────────────────────────────────────────────────────────
select 'Current Affairs Including GK seed complete (Passages V-VIII, Q25-48)' as status;
