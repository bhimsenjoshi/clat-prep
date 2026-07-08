-- ─── Seed Practice Questions ───
-- Run this in Supabase SQL Editor after the practice_quiz.sql migration
-- 25 questions total (5 per section), CLAT-realistic

-- ─── ENGLISH (Reading Comprehension) ───

INSERT INTO public.practice_questions (section, topic, question_text, passage, options, correct_option, explanation, difficulty, tags)
VALUES
(
  'English', 'Reading Comprehension',
  'According to the passage, what was the primary reason for the decline of the Indus Valley Civilization?',
  'The Indus Valley Civilization, one of the world''s oldest urban cultures, flourished around 2500 BCE in what is now Pakistan and northwest India. The civilization was known for its advanced city planning, sophisticated drainage systems, and extensive trade networks. However, by 1900 BCE, the civilization began to decline. Scholars have debated the causes for centuries. Some attribute it to climate change, as evidence suggests a weakening of the monsoon rains that sustained agriculture. Others point to the shifting course of the Indus River, which may have disrupted trade and agriculture. A third theory suggests that over-exploitation of resources led to environmental degradation. Recent archaeological findings indicate that a combination of factors, rather than a single cause, likely led to the civilization''s gradual decline.',
  '{"A": "Foreign invasion by Aryan tribes", "B": "A combination of climate change, river shifts, and resource depletion", "C": "A sudden catastrophic earthquake", "D": "The collapse of trade networks only"}',
  'B', 'The passage explicitly states: "Recent archaeological findings indicate that a combination of factors, rather than a single cause, likely led to the civilization''s gradual decline." It mentions climate change, river shifts, AND resource depletion—not any one cause alone.', 'medium', ARRAY['passage-based', 'history']
),
(
  'English', 'Reading Comprehension',
  'The author''s tone in the passage can best be described as:',
  'The rapid proliferation of artificial intelligence in everyday life has been nothing short of remarkable. From virtual assistants that manage our schedules to algorithms that curate our news feeds, AI has become an invisible hand guiding modern existence. Yet, beneath the veneer of convenience lies a troubling reality. These systems, trained on vast datasets, often perpetuate and amplify existing societal biases. A hiring algorithm trained on a company''s historical data may learn to favor male candidates if the company traditionally hired more men. A facial recognition system trained primarily on light-skinned faces may perform poorly on darker skin tones. The consequences are not merely theoretical; they affect real people—denying job opportunities, triggering false arrests, and reinforcing systemic inequality. As we stand at this crossroads, the question is not whether AI will shape our future, but whether we will shape AI responsibly.',
  '{"A": "Optimistic and celebratory", "B": "Neutral and dispassionate", "C": "Critical but constructive", "D": "Pessimistic and alarmist"}',
  'C', 'The author acknowledges the benefits ("remarkable," "convenience") but also points out serious problems ("troubling reality," "affect real people"). The ending asks whether we will shape AI "responsibly" — critical of current issues but hopeful about the future. This is critical but constructive.', 'medium', ARRAY['passage-based', 'tone']
),
(
  'English', 'Vocabulary',
  'Choose the word most similar in meaning to the underlined word in the sentence: The judge was known for her IMPARTIAL decisions.' ,
  NULL,
  '{"A": "Biased", "B": "Unbiased", "C": "Harsh", "D": "Lenient"}',
  'B', '"Impartial" means treating all rivals or disputants equally; fair and just. "Unbiased" is a direct synonym. "Biased" is the opposite, while "harsh" and "lenient" describe the nature of decisions, not fairness.', 'easy', ARRAY['vocabulary']
),
(
  'English', 'Grammar',
  'Identify the sentence with the correct grammatical structure:',
  NULL,
  '{"A": "Neither the teacher nor the students was aware of the change.", "B": "Neither the teacher nor the students were aware of the change.", "C": "Neither the teacher nor the students are being aware of the change.", "D": "Neither the teacher nor the students is aware of the change."}',
  'B', 'When using "neither...nor" with a plural subject closest to the verb ("the students"), the verb should be plural ("were"). Option A incorrectly uses "was." Options C and D have tense/agreement errors.', 'medium', ARRAY['grammar', 'subject-verb-agreement']
),
(
  'English', 'Reading Comprehension',
  'What does the author suggest is the main barrier to achieving gender equality in the workplace?',
  'Despite decades of legislation and social progress, gender equality in the workplace remains an elusive goal. The "glass ceiling" metaphor, coined in the 1980s, described the invisible barrier preventing women from reaching top leadership positions. Today, that ceiling has developed cracks—more women serve as CEOs and board members than ever before. However, a new challenge has emerged: the "broken rung." Studies show that women, particularly women of color, are significantly less likely than men to be promoted from entry-level positions to manager roles. This early-career gap means fewer women are in the pipeline for senior leadership. The problem is compounded by unconscious bias in performance evaluations, where women''s assertiveness is often perceived negatively while the same behavior in men is rewarded. Until organizations address these systemic issues at every level, true equality will remain aspirational.',
  '{"A": "Explicit discriminatory laws", "B": "The broken rung—lack of promotion from entry-level to manager", "C": "The glass ceiling at senior levels", "D": "Women choosing not to pursue leadership"}',
  'B', 'The passage explicitly contrasts the "glass ceiling" (senior level) with the "broken rung" (entry to manager level) and states the latter is the bigger current problem: "this early-career gap means fewer women are in the pipeline for senior leadership."', 'hard', ARRAY['passage-based', 'social-issues']
);

-- ─── CURRENT AFFAIRS ───

INSERT INTO public.practice_questions (section, topic, question_text, passage, options, correct_option, explanation, difficulty, tags)
VALUES
(
  'Current Affairs', 'Polity',
  'The Finance Commission of India is constituted under which Article of the Constitution?',
  NULL,
  '{"A": "Article 280", "B": "Article 360", "C": "Article 112", "D": "Article 324"}',
  'A', 'Article 280 provides for the constitution of a Finance Commission every five years to recommend the distribution of tax revenues between the Union and States. Article 360 relates to financial emergency, Article 112 is the Annual Financial Statement (Budget), and Article 324 deals with the Election Commission.', 'medium', ARRAY['polity', 'constitution']
),
(
  'Current Affairs', 'International Relations',
  'India recently joined which major trade agreement in 2025?',
  NULL,
  '{"A": "RCEP (Regional Comprehensive Economic Partnership)", "B": "IPEF (Indo-Pacific Economic Framework)", "C": "CPTPP (Comprehensive and Progressive Agreement for Trans-Pacific Partnership)", "D": "SCO Free Trade Area"}',
  'B', 'India joined the Indo-Pacific Economic Framework (IPEF) in recent years as part of its strategic engagement with the Indo-Pacific region. India chose not to join RCEP in 2020. CPTPP membership has been discussed but not finalized. SCO is a security organization, not a trade agreement per se.', 'medium', ARRAY['international-relations', 'trade']
),
(
  'Current Affairs', 'Economy',
  'What is the primary objective of the Production Linked Incentive (PLI) scheme?',
  NULL,
  '{"A": "To provide direct cash transfers to farmers", "B": "To boost domestic manufacturing and reduce import dependence", "C": "To subsidize exports of agricultural products", "D": "To provide free electricity to industrial zones"}',
  'B', 'The PLI scheme, launched in 2020 and expanded since, aims to boost domestic manufacturing by offering incentives to companies that meet production targets in 14 key sectors including electronics, automobiles, pharmaceuticals, and textiles. It is designed to reduce import dependence and make India a global manufacturing hub.', 'easy', ARRAY['economy', 'government-schemes']
),
(
  'Current Affairs', 'Science & Technology',
  'Which Indian space mission is designed to study the Sun?',
  NULL,
  '{"A": "Mangalyaan", "B": "Chandrayaan-3", "C": "Aditya-L1", "D": "Gaganyaan"}',
  'C', 'Aditya-L1 is ISRO''s first space-based mission to study the Sun, launched in 2023. It is placed at the Lagrange Point 1 (L1) about 1.5 million km from Earth. Mangalyaan is Mars, Chandrayaan-3 is the Moon, and Gaganyaan is India''s human spaceflight program.', 'easy', ARRAY['science', 'isro']
),
(
  'Current Affairs', 'Environment',
  'The term "Carbon Border Adjustment Mechanism" (CBAM) recently in news refers to:',
  NULL,
  '{"A": "A UN treaty to ban carbon emissions", "B": "A European Union tariff on imports from countries with weaker climate policies", "C": "A carbon trading system within India", "D": "A World Bank fund for renewable energy"}',
  'B', 'CBAM is a policy mechanism introduced by the European Union that imposes a carbon price on imports of certain goods from countries with less stringent climate regulations. It aims to prevent "carbon leakage" where companies relocate production to countries with laxer emissions standards. India has raised concerns about its impact on exports.', 'hard', ARRAY['environment', 'eu-policy']
);

-- ─── LEGAL REASONING ───

INSERT INTO public.practice_questions (section, topic, question_text, passage, options, correct_option, explanation, difficulty, tags)
VALUES
(
  'Legal Reasoning', 'Law of Torts',
  'Principle: A person is liable for negligence if they owe a duty of care to the plaintiff, breach that duty, and the breach causes damage. Facts: Rohan, a shopkeeper, mopped the floor of his store but did not place a "Wet Floor" warning sign. Priya, a customer, entered the shop, slipped on the wet floor, and broke her ankle. Is Rohan liable?',
  NULL,
  '{"A": "No, because mopping is a routine activity", "B": "No, because Priya should have been careful", "C": "Yes, because Rohan breached his duty of care by not warning customers", "D": "Yes, because Priya suffered an injury"}',
  'C', 'Rohan owed a duty of care to customers entering his store. By mopping the floor and failing to place a warning sign, he breached that duty. The breach directly caused Priya''s injury. All elements of negligence (duty, breach, causation, damage) are satisfied. Option D is incomplete—injury alone isn''t enough; there must be a breach of duty.', 'easy', ARRAY['torts', 'negligence']
),
(
  'Legal Reasoning', 'Constitutional Law',
  'Principle: The Right to Freedom of Speech and Expression under Article 19(1)(a) is subject to "reasonable restrictions" imposed by law in the interests of sovereignty, security, public order, decency, or morality. Facts: Amit posted a video on social media claiming that a particular community was planning violent attacks, based on an unverified WhatsApp forward. The post went viral and led to mob violence in two cities. The government arrested Amit under a law imposing reasonable restrictions on speech. Is the restriction valid?',
  NULL,
  '{"A": "No, because social media posts are absolutely protected", "B": "Yes, because the post threatened public order and was based on unverified information", "C": "No, because Amit did not intend to cause violence", "D": "Yes, because the government can restrict any speech it dislikes"}',
  'B', 'While Article 19(1)(a) guarantees free speech, it is not absolute. The restriction here is reasonable because: (1) the post incited fear and led to actual violence (public order), (2) it was based on unverified information (negligent at best), (3) the government action falls within the "reasonable restrictions" clause of Article 19(2).', 'medium', ARRAY['constitutional-law', 'fundamental-rights']
),
(
  'Legal Reasoning', 'Criminal Law',
  'Principle: The right of private defense of body extends to causing death if the apprehended assault reasonably causes an apprehension of death or grievous hurt. Facts: Sameer was walking home at night when two armed men confronted him demanding his wallet. One man pulled out a knife. Sameer, who had a licensed firearm, shot the knife-wielding attacker in self-defense. The attacker died. Can Sameer claim the right of private defense?',
  NULL,
  '{"A": "No, because causing death is never justified for property crimes", "B": "Yes, because Sameer reasonably feared death or grievous hurt from the knife-wielding attacker", "C": "No, because Sameer should have called the police first", "D": "Yes, because Sameer had a licensed firearm"}',
  'B', 'Under IPC, the right of private defense extends to causing death when there is reasonable apprehension of death or grievous hurt. A knife-wielding attacker threatening bodily harm creates such reasonable apprehension. Sameer did not have a duty to retreat first (unlike some common law systems). Option D is wrong—having a license doesn''t automatically justify use; it must be in reasonable self-defense.', 'hard', ARRAY['criminal-law', 'private-defense']
),
(
  'Legal Reasoning', 'Contract Law',
  'Principle: An agreement is a contract if it is made by the free consent of parties competent to contract, for a lawful consideration, with a lawful object. Facts: Meera, a 16-year-old, bought a smartphone worth ₹20,000 from an electronics store. After using it for two months, she wants to return it and get a full refund, claiming the contract is void. Is she correct?',
  NULL,
  '{"A": "Yes, because a minor''s contract is void ab initio", "B": "No, because the phone was a necessity", "C": "Yes, but she must return the phone and may get a partial refund", "D": "No, because she used the phone for two months"}',
  'A', 'Under the Indian Contract Act, 1872, a minor (person under 18) is not competent to contract. Any agreement with a minor is void ab initio (void from the beginning). However, the minor must return any benefit received (the phone) if still possible. The seller cannot enforce the contract against the minor.', 'medium', ARRAY['contract-law', 'capacity']
),
(
  'Legal Reasoning', 'Jurisprudence',
  'Principle: Ignorance of the law is not a valid defense in criminal cases. Facts: Raj moved to a new city and was unaware that the city had a municipal law prohibiting the feeding of stray dogs in public parks. He fed a stray dog in a park and was fined. Raj argues he did not know about the law. Is his defense valid?',
  NULL,
  '{"A": "Yes, because he had no criminal intent", "B": "No, because ignorance of the law is not a defense", "C": "Yes, because the law was not properly publicized", "D": "No, because feeding dogs is always illegal"}',
  'B', 'The principle is well-established in criminal jurisprudence: ignorantia juris non excusat (ignorance of the law is not an excuse). Every person is presumed to know the law. While harsh in some cases, this principle is essential for the rule of law—otherwise everyone could avoid liability by claiming ignorance. Option C might apply if the law was secret, but a municipal law is enacted through proper channels.', 'medium', ARRAY['jurisprudence', 'legal-maxims']
);

-- ─── LOGICAL REASONING ───

INSERT INTO public.practice_questions (section, topic, question_text, passage, options, correct_option, explanation, difficulty, tags)
VALUES
(
  'Logical Reasoning', 'Critical Reasoning',
  'All lawyers are graduates. Some graduates are judges. Therefore, some lawyers are judges. This argument is:',
  NULL,
  '{"A": "Valid", "B": "Invalid—the conclusion does not necessarily follow", "C": "Valid only if all graduates are lawyers", "D": "Invalid because it contains a false premise"}',
  'B', 'This is a classic syllogism fallacy. From "All L are G" and "Some G are J," we cannot conclude "Some L are J." The judges could all be from the non-lawyer graduates. Venn diagram: the set of graduates who are judges may be entirely outside the set of lawyers.', 'easy', ARRAY['syllogism', 'logic']
),
(
  'Logical Reasoning', 'Assumptions',
  'Statement: The government should mandate that all cars sold after 2030 must be electric vehicles. Which of the following is an underlying assumption of this argument?',
  NULL,
  '{"A": "Electric cars are more expensive than petrol cars", "B": "The electricity grid will be able to handle the increased load by 2030", "C": "People prefer electric cars over petrol cars", "D": "Car manufacturers have already stopped producing petrol cars"}',
  'B', 'For a mandate to be feasible, the necessary infrastructure must exist. The argument assumes that by 2030, the electricity grid will have sufficient capacity to charge millions of EVs. If this assumption is false, the mandate could lead to grid failure and be counterproductive.', 'medium', ARRAY['assumptions', 'policy']
),
(
  'Logical Reasoning', 'Blood Relations',
  'Amit is the father of Bina. Bina is the sister of Chetan. Chetan is the husband of Deepa. Deepa is the daughter of Emily. How is Emily related to Amit?',
  NULL,
  '{"A": "Wife", "B": "Mother-in-law", "C": "Sister-in-law", "D": "Cannot be determined"}',
  'D', 'Chain: Amit → father of Bina and Chetan. Chetan → husband of Deepa. Deepa → daughter of Emily. So Emily is Deepa''s mother, and Deepa is Chetan''s wife. But Chetan is Amit''s son. So Emily is the mother of Amit''s daughter-in-law — that makes Emily the mother-in-law of Amit''s son. The relationship between Emily and Amit directly is not a standard familial relation with a single name (she is the mother of his son''s wife). Actually wait, let me re-check. Amit is father of Chetan. Chetan married Deepa. Deepa is daughter of Emily. So Emily is the mother of Amit''s daughter-in-law. The relation from Amit to Emily: his son''s mother-in-law. There''s no direct blood relation—they are connected only through marriage of their children. So "Cannot be determined" in terms of a standard relationship. Actually, in common parlance, they would be "samdhi" (co-parents-in-law) in Hindi, but among the given options, "Cannot be determined" is most accurate as none of the other options fit.', 'hard', ARRAY['blood-relations', 'puzzle']
),
(
  'Logical Reasoning', 'Critical Reasoning',
  'Studies show that students who drink coffee before exams perform better than those who do not. Therefore, coffee improves exam performance. Which of the following, if true, most weakens this argument?',
  NULL,
  '{"A": "Coffee contains caffeine, a known stimulant", "B": "Students who drink coffee before exams also tend to study more hours than non-coffee drinkers", "C": "Some students prefer tea over coffee", "D": "Coffee consumption has increased globally over the last decade"}',
  'B', 'The argument claims coffee causes better performance. Option B suggests an alternative cause—students who drink coffee might study more (which could be the real cause of better performance). This weakens the causal claim. Option A actually strengthens it. C and D are irrelevant.', 'medium', ARRAY['critical-reasoning', 'cause-effect']
),
(
  'Logical Reasoning', 'Analogies',
  'Doctor : Stethoscope :: :',
  NULL,
  '{"A": "Sculptor : Chisel", "B": "Teacher : Chalk", "C": "Chef : Recipe", "D": "Lawyer : Court"}',
  'A', 'A stethoscope is the primary diagnostic tool used by a doctor. Similarly, a chisel is the primary shaping tool used by a sculptor. The relationship is professional → primary working tool. While a teacher uses chalk, it''s not the defining tool of the profession. Chef uses a recipe as a guide, but a knife would be a better tool analogy.', 'easy', ARRAY['analogies']
);

-- ─── QUANTITATIVE TECHNIQUES ───

INSERT INTO public.practice_questions (section, topic, question_text, passage, options, correct_option, explanation, difficulty, tags)
VALUES
(
  'Quantitative Techniques', 'Data Interpretation',
  'What is the approximate percentage increase in India''s GDP from 2022 to 2023 based on the table?',
  'Economic Indicators of India (figures in ₹ lakh crore):
| Year | GDP | Exports | FDI Inflow |
|------|-----|---------|------------|
| 2020 | 135 | 29.1 | 4.2 |
| 2021 | 147 | 32.5 | 5.1 |
| 2022 | 160 | 36.8 | 5.8 |
| 2023 | 173 | 41.2 | 6.4 |',
  '{"A": "8.1%", "B": "12.5%", "C": "7.5%", "D": "13.5%"}',
  'A', 'GDP increased from ₹160 lakh crore to ₹173 lakh crore. Increase = 173 - 160 = 13. Percentage increase = (13/160) × 100 = 8.125%. Approximately 8.1%.', 'medium', ARRAY['data-interpretation', 'percentages']
),
(
  'Quantitative Techniques', 'Percentages',
  'In a CLAT coaching centre, 60% of students are male. If 40% of the male students and 30% of the female students qualify for the next level, what percentage of total students qualified?',
  NULL,
  '{"A": "35%", "B": "36%", "C": "42%", "D": "48%"}',
  'B', 'Assume 100 total students. Males = 60, Females = 40. Males qualified = 40% of 60 = 24. Females qualified = 30% of 40 = 12. Total qualified = 24 + 12 = 36 out of 100 = 36%.', 'easy', ARRAY['percentages', 'weighted-average']
),
(
  'Quantitative Techniques', 'Ratios',
  'The ratio of the number of questions attempted by Ravi to those attempted by Simran is 3:5. If Simran attempted 40 questions more than Ravi, how many questions did Ravi attempt?',
  NULL,
  '{"A": "60", "B": "100", "C": "40", "D": "80"}',
  'A', 'Let Ravi = 3x, Simran = 5x. Difference = 5x - 3x = 2x = 40. So x = 20. Ravi = 3 × 20 = 60 questions.', 'easy', ARRAY['ratios', 'linear-equations']
),
(
  'Quantitative Techniques', 'Data Interpretation',
  'If the trend in exports continues, what is the estimated export value (in ₹ lakh crore) for 2024?',
  'Export data (₹ lakh crore):
2020: 29.1
2021: 32.5
2022: 36.8
2023: 41.2',
  '{"A": "43.5", "B": "44.8", "C": "46.0", "D": "48.3"}',
  'C', 'Yearly increases: 2020→21: 3.4, 2021→22: 4.3, 2022→23: 4.4. The increments are ~3.4, 4.3, 4.4—trending upward. A reasonable estimate for 2023→24 is ~4.5-5.0. 41.2 + 4.8 ≈ 46.0. Option C is the most reasonable.', 'hard', ARRAY['data-interpretation', 'trend-analysis']
),
(
  'Quantitative Techniques', 'Time & Work',
  'A and B together can complete a CLAT mock test paper in 6 hours. A alone takes 10 hours. How long would B alone take to complete the same paper?',
  NULL,
  '{"A": "12 hours", "B": "15 hours", "C": "16 hours", "D": "18 hours"}',
  'B', 'A + B together: 1/6 of the work per hour. A alone: 1/10 per hour. So B alone: 1/6 - 1/10 = (5-3)/30 = 2/30 = 1/15 of the work per hour. Therefore B takes 15 hours alone.', 'medium', ARRAY['time-work', 'efficiency']
);
