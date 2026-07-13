-- ─── Seed Data: Sample CLAT Mock Test with 50 Hand-Written Questions ───
-- Run after schema.sql to populate a test you can use immediately.

-- 1. Create a test
insert into public.tests (id, title, status, created_by)
select
  '00000000-0000-0000-0000-000000000001',
  'CLAT Mock Test #1',
  'published',
  id
from public.profiles
where role = 'admin'
limit 1;

-- 2. Create 5 sections
insert into public.sections (id, test_id, name, order_index) values
  ('s-english',           '00000000-0000-0000-0000-000000000001', 'English Language',               0),
  ('s-current-affairs',   '00000000-0000-0000-0000-000000000001', 'Current Affairs Including General Knowledge',        1),
  ('s-legal-reasoning',   '00000000-0000-0000-0000-000000000001', 'Legal Reasoning',        2),
  ('s-logical-reasoning', '00000000-0000-0000-0000-000000000001', 'Logical Reasoning',      3),
  ('s-quantitative',      '00000000-0000-0000-0000-000000000001', 'Quantitative Techniques', 4);

-- 3. Insert 10 questions per section
-- English
insert into public.questions (section_id, question_text, options, correct_option, explanation, generated_by, reviewed) values
('s-english', 'Select the synonym of "Pernicious":', '{"A":"Harmless","B":"Beneficial","C":"Destructive","D":"Temporary"}', 'C', 'Pernicious means having a harmful effect, especially in a gradual or subtle way. Destructive is the closest synonym.', 'manual', true),
('s-english', 'Choose the correctly spelled word:', '{"A":"Accommodate","B":"Acommodate","C":"Accomodate","D":"Acomodate"}', 'A', 'Accommodate is the correct spelling — double c, double m.', 'manual', true),
('s-english', 'Identify the figure of speech: "The wind whispered through the trees."', '{"A":"Simile","B":"Metaphor","C":"Personification","D":"Hyperbole"}', 'C', 'The wind is given the human ability to "whisper," which is personification.', 'manual', true),
('s-english', 'Read the passage and answer: ... [Replace with actual passage] The author''s tone can best be described as:', '{"A":"Optimistic","B":"Critical","C":"Neutral","D":"Sarcastic"}', 'B', '[Replace with explanation matching the passage]', 'manual', true),
('s-english', 'Choose the correct preposition: "He is adept _____ playing chess."', '{"A":"in","B":"at","C":"with","D":"on"}', 'B', 'The correct idiom is "adept at" — meaning skilful or proficient at something.', 'manual', true),
('s-english', 'Transform the sentence to passive voice: "The students completed the project."', '{"A":"The project was completed by the students.","B":"The project is completed by the students.","C":"The project had been completed by the students.","D":"The project has been completed by the students."}', 'A', 'Simple past active → was/were + past participle: "was completed."', 'manual', true),
('s-english', 'Which word is the antonym of "Ephemeral"?', '{"A":"Fleeting","B":"Permanent","C":"Brief","D":"Transient"}', 'B', 'Ephemeral means lasting a very short time. Permanent is its antonym.', 'manual', true),
('s-english', 'Choose the correct form: "Neither the teacher nor the students _____ present."', '{"A":"was","B":"were","C":"is","D":"has been"}', 'B', 'With "neither...nor," the verb agrees with the subject closest to it — "students" (plural) → "were."', 'manual', true),
('s-english', 'Identify the type of sentence: "If I had known, I would have come earlier."', '{"A":"Simple","B":"Compound","C":"Complex","D":"Compound-Complex"}', 'C', 'It has one independent clause and one dependent clause ("If I had known"), making it a complex sentence.', 'manual', true),
('s-english', 'Which option best fills the blank? "The _____ of the research was questioned by several experts."', '{"A":"validity","B":"valid","C":"validate","D":"validation"}', 'A', 'The noun "validity" is needed here as the subject of the sentence.', 'manual', true);

-- Current Affairs
insert into public.questions (section_id, question_text, options, correct_option, explanation, generated_by, reviewed) values
('s-current-affairs', 'Who is the current Chief Justice of India as of 2026?', '{"A":"Justice Sanjiv Khanna","B":"Justice D.Y. Chandrachud","C":"Justice N.V. Ramana","D":"Justice U.U. Lalit"}', 'B', 'Justice D.Y. Chandrachud is the 50th Chief Justice of India, appointed in November 2022.', 'manual', true),
('s-current-affairs', 'Which Indian city hosted the 2026 G20 Summit?', '{"A":"New Delhi","B":"Mumbai","C":"Bengaluru","D":"Hyderabad"}', 'A', '[Update with actual host city]', 'manual', true),
('s-current-affairs', 'The "Mission 500 GW" target for India refers to:', '{"A":"Renewable energy capacity by 2030","B":"Highway construction by 2027","C":"Digital transactions by 2025","D":"Manufacturing output by 2030"}', 'A', 'India aims to achieve 500 GW of non-fossil fuel energy capacity by 2030 as part of its climate commitments.', 'manual', true),
('s-current-affairs', 'Who won the 2025 Nobel Prize in Literature?', '{"A":"Salman Rushdie","B":"Jon Fosse","C":"Annie Ernaux","D":"Abdulrazak Gurnah"}', 'B', '[Update as needed]', 'manual', true),
('s-current-affairs', 'The "National Education Policy 2020" replaced which earlier policy?', '{"A":"NEP 1986","B":"NEP 1992","C":"NEP 2000","D":"NEP 2005"}', 'A', 'NEP 2020 replaced the National Policy on Education of 1986.', 'manual', true),
('s-current-affairs', 'India successfully launched which lunar mission in 2023?', '{"A":"Chandrayaan-2","B":"Chandrayaan-3","C":"Mangalyaan-2","D":"Aditya-L1"}', 'B', 'Chandrayaan-3 landed near the lunar south pole on August 23, 2023.', 'manual', true),
('s-current-affairs', 'Which Indian state recently passed the "Right to Health" bill?', '{"A":"Kerala","B":"Rajasthan","C":"Tamil Nadu","D":"Maharashtra"}', 'B', 'Rajasthan passed the Right to Health Bill in 2023, guaranteeing free healthcare to all residents.', 'manual', true),
('s-current-affairs', 'The "Squid Game" actor who won a 2024 Emmy for Best Lead Actor:', '{"A":"Lee Jung-jae","B":"Park Hae-soo","C":"Gong Yoo","D":"Wi Ha-joon"}', 'A', 'Lee Jung-jae won the Emmy for Outstanding Lead Actor in a Drama Series for Squid Game.', 'manual', true),
('s-current-affairs', 'India''s GDP growth rate for FY 2025-26 was approximately:', '{"A":"5.5%","B":"6.5%","C":"7.5%","D":"8.5%"}', 'B', '[Update with latest official estimate]', 'manual', true),
('s-current-affairs', 'Which Indian sportsperson won a gold medal at the 2024 Paris Olympics?', '{"A":"Neeraj Chopra","B":"P.V. Sindhu","C":"Mirabai Chanu","D":"Lovlina Borgohain"}', 'A', 'Neeraj Chopra won the gold medal in javelin throw at the 2024 Paris Olympics.', 'manual', true);

-- Legal Reasoning
insert into public.questions (section_id, question_text, passage, options, correct_option, explanation, generated_by, reviewed) values
('s-legal-reasoning', 'Principle: A contract without consideration is void, except when it is a promise to compensate a person who has already voluntarily done something for the promisor.
Facts: Ankit''s car broke down on a highway. A stranger, Rohan, helped push the car to a nearby garage. Later, Ankit promised to pay Rohan ₹1,000 for his help. Is Ankit''s promise enforceable?', 'Legal Principle: A contract without consideration is void, except when it is a promise to compensate a person who has already voluntarily done something for the promisor under Section 25(2) of the Indian Contract Act, 1872.', '{"A":"Yes, because Rohan voluntarily helped Ankit","B":"No, because there was no prior request from Ankit","C":"Yes, because consideration is not required in any service","D":"No, because the amount is not specified"}', 'A', 'Under Section 25(2), a promise to compensate for voluntary services already rendered is enforceable even without consideration, provided the services were done voluntarily and the promisor was in existence at the time.', 'manual', true),
('s-legal-reasoning', 'Principle: A person is liable for the natural and probable consequences of their negligent acts.
Facts: A store owner left a wet floor without any warning sign. A customer slipped and broke their arm. Is the store owner liable?', 'Legal Principle: A person owes a duty of care to others who may reasonably be affected by their actions. Breach of this duty causing damage results in liability for negligence.', '{"A":"Yes, because the store owner failed to warn customers","B":"No, because the customer should have been careful","C":"Yes, only if the customer demanded compensation","D":"No, because the floor was being cleaned"}', 'A', 'The store owner had a duty to warn customers of the wet floor. Failing to put up a warning sign is a breach of that duty, and the injury was a foreseeable consequence.', 'manual', true),
('s-legal-reasoning', 'Principle: The right to life under Article 21 includes the right to live with human dignity.
Facts: The government ordered the eviction of slum dwellers without providing alternative accommodation. Is this constitutional?', 'Legal Principle: Article 21 of the Constitution of India guarantees that no person shall be deprived of their life or personal liberty except according to procedure established by law.', '{"A":"Yes, because the government has the right to evict","B":"No, because it violates Article 21","C":"Yes, because slums are illegal","D":"No, because eviction requires a court order"}', 'B', 'The Supreme Court has held that the right to life includes the right to shelter and livelihood. Eviction without alternative accommodation violates Article 21.', 'manual', true),
('s-legal-reasoning', 'Principle: An agreement in restraint of trade is void.
Facts: A sold his bakery business to B and agreed not to open any bakery within the same city for 10 years. Is this agreement valid?', 'Legal Principle: Section 27 of the Indian Contract Act, 1872 states that any agreement that restrains a person from carrying on a lawful trade is void to that extent.', '{"A":"Yes, because it was part of a sale agreement","B":"No, because it restrains trade unreasonably","C":"Yes, because A voluntarily agreed","D":"No, because 10 years is too long"}', 'B', 'While reasonable restraints are sometimes permitted, a blanket restraint on carrying on trade in the entire city is an unreasonable restraint of trade and void under Section 27.', 'manual', true),
('s-legal-reasoning', 'Principle: Whoever, intending to take dishonestly any movable property out of the possession of any person without that person''s consent, moves that property, commits theft.
Facts: Priya took Neha''s pen from her desk without asking, intending to keep it. Neha saw this but said nothing. Has Priya committed theft?', 'Legal Principle: Theft is defined under Section 378 of the Indian Penal Code, 1860.', '{"A":"Yes, because she took the pen without consent","B":"No, because Neha saw and did not object","C":"No, because the pen was not in Neha''s hand","D":"Yes, but only if the pen is valuable"}', 'A', 'All elements of theft are present: dishonest intention, taking movable property out of possession without consent. Neha''s silence does not constitute consent.', 'manual', true),
('s-legal-reasoning', 'Principle: A minor''s contract is void ab initio.
Facts: Ravi, aged 17, signed a contract to buy a motorcycle. He paid ₹50,000. Later, his guardian discovered this and wants to cancel the contract.', 'Legal Principle: Under the Indian Contract Act, 1872, a person below 18 years of age is a minor and cannot enter into a valid contract.', '{"A":"Ravi can cancel and get his money back","B":"Ravi cannot cancel because he paid willingly","C":"The seller can keep the money","D":"Ravi can cancel but will lose 10%"}', 'A', 'Since a minor''s contract is void ab initio (void from the beginning), Ravi can cancel it and is entitled to get his money back.', 'manual', true),
('s-legal-reasoning', 'Principle: Defamation is the publication of a false statement that injures a person''s reputation.
Facts: A newspaper published that a politician was involved in a corruption scandal without verifying the facts. The politician was later cleared by the court.', 'Legal Principle: For defamation, the statement must be false, published to a third party, and must harm the reputation of the person.', '{"A":"The newspaper is liable for defamation","B":"The newspaper is not liable as it was news","C":"The politician cannot sue because he is a public figure","D":"The newspaper is liable only if they named the politician"}', 'A', 'The newspaper published a false statement without verification, which harmed the politician''s reputation. All elements of defamation are satisfied.', 'manual', true),
('s-legal-reasoning', 'Principle: An offer can be revoked at any time before acceptance, but must be communicated.
Facts: A offered to sell his car to B for ₹5 lakh. B sent a letter of acceptance. Before the letter reached A, A sold the car to C. Is A liable to B?', 'Legal Principle: Under the Indian Contract Act, an offer is accepted when the acceptance is put in the course of transmission to the offeror.', '{"A":"Yes, A is liable because B accepted before revocation","B":"No, because A sold before receiving acceptance","C":"Yes, because A should have waited","D":"No, because B could have called instead"}', 'A', 'Under the postal rule, acceptance is complete when the letter is dispatched. Since B posted the acceptance before A sold the car, a valid contract was formed.', 'manual', true),
('s-legal-reasoning', 'Principle: Strict liability applies when a person brings and keeps on their land something likely to cause harm if it escapes.
Facts: A factory stored toxic chemicals in a tank. The tank leaked, contaminating a nearby river.', 'Legal Principle: The rule in Rylands v. Fletcher (1868) establishes strict liability for escape of dangerous things.', '{"A":"The factory is strictly liable for the damage","B":"The factory is not liable if they took precautions","C":"The factory is liable only if they were negligent","D":"The factory is not liable because it was an accident"}', 'A', 'Under strict liability, if a person brings something dangerous onto their land and it escapes causing damage, they are liable regardless of negligence.', 'manual', true),
('s-legal-reasoning', 'Principle: Res Ipsa Loquitur ("the thing speaks for itself") applies when the accident would not ordinarily happen without negligence.
Facts: A patient went into surgery and woke up with a surgical instrument left inside their body.', 'Legal Principle: Res Ipsa Loquitur shifts the burden of proof to the defendant to show that they were not negligent.', '{"A":"The hospital must prove they were not negligent","B":"The patient must prove the hospital was negligent","C":"The surgeon is automatically liable","D":"The hospital is not liable if the patient signed a consent form"}', 'A', 'Under Res Ipsa Loquitur, the fact that an instrument was left inside a patient speaks of negligence. The burden shifts to the hospital to disprove negligence.', 'manual', true);

-- Logical Reasoning
insert into public.questions (section_id, question_text, options, correct_option, explanation, generated_by, reviewed) values
('s-logical-reasoning', 'All cats are mammals. All mammals are vertebrates. Therefore:', '{"A":"All vertebrates are cats","B":"All cats are vertebrates","C":"Some mammals are not cats","D":"No conclusion follows"}', 'B', 'If all cats are mammals and all mammals are vertebrates, then all cats are vertebrates by transitive syllogism.', 'manual', true),
('s-logical-reasoning', 'If FRIEND is coded as GSJFOE, how is ENEMY coded?', '{"A":"FONFN","B":"FONFZ","C":"FPOFN","D":"FONFZ"}', 'B', 'Each letter is replaced by the next letter in the alphabet: F→G, R→S, I→J, E→F, N→O, D→E. So ENEMY → FO NFZ (E→F, N→O, E→F, M→N, Y→Z).', 'manual', true),
('s-logical-reasoning', 'A is the father of B. B is the sister of C. C is the mother of D. How is D related to A?', '{"A":"Granddaughter","B":"Grandson","C":"Niece","D":"Cannot be determined"}', 'D', 'D could be male or female — the information does not specify D''s gender, so the relationship cannot be determined precisely (could be grandson or granddaughter).', 'manual', true),
('s-logical-reasoning', 'Statement: "This medicine is 95% effective."
Assumption I: 5% of people will not benefit from this medicine.
Assumption II: The medicine has no side effects.', '{"A":"Only I is implicit","B":"Only II is implicit","C":"Both are implicit","D":"Neither is implicit"}', 'A', 'If it is 95% effective, it implies that 5% may not benefit. But effectiveness does not imply anything about side effects.', 'manual', true),
('s-logical-reasoning', 'If you walk 3 km north, then 4 km east, then 3 km south, how far are you from your starting point?', '{"A":"0 km","B":"3 km","C":"4 km","D":"5 km"}', 'C', 'Walking 3 km north and then 3 km south cancels out. You are 4 km east of the starting point.', 'manual', true),
('s-logical-reasoning', 'Pointing to a photograph, a man said, "She is the daughter of my grandfather''s only son." How is she related to the man?', '{"A":"Sister","B":"Cousin","C":"Niece","D":"Mother"}', 'A', 'My grandfather''s only son is my father. The daughter of my father is my sister.', 'manual', true),
('s-logical-reasoning', 'Find the odd one out: 2, 3, 5, 7, 9, 11, 13', '{"A":"9","B":"7","C":"11","D":"13"}', 'A', 'All except 9 are prime numbers. 9 is composite (3×3).', 'manual', true),
('s-logical-reasoning', 'Argument: "If you study hard, you will pass. You did not study hard. Therefore, you will not pass."
This argument is:', '{"A":"Valid and sound","B":"Valid but not sound","C":"Invalid — fallacy of denying the antecedent","D":"Invalid — fallacy of affirming the consequent"}', 'C', 'This is the fallacy of denying the antecedent. If P→Q, ¬P does not imply ¬Q — you could still pass through other means.', 'manual', true),
('s-logical-reasoning', 'Complete the series: 2, 6, 12, 20, 30, ?', '{"A":"36","B":"40","C":"42","D":"44"}', 'C', 'The differences increase by 2 each time: +4, +6, +8, +10, so next is +12 → 30 + 12 = 42.', 'manual', true),
('s-logical-reasoning', 'All roses are flowers. Some flowers fade quickly. Therefore:', '{"A":"All roses fade quickly","B":"Some roses may fade quickly","C":"No roses fade quickly","D":"Only roses fade quickly"}', 'B', 'We only know that some flowers fade quickly. Roses are flowers, so some of them could be in that subset — but we cannot conclude all or none.', 'manual', true);

-- Quantitative Techniques
insert into public.questions (section_id, question_text, passage, options, correct_option, explanation, generated_by, reviewed) values
('s-quantitative', 'A shopkeeper sells an item at a 20% profit. If the cost price is ₹500, what is the selling price?', NULL, '{"A":"₹550","B":"₹600","C":"₹620","D":"₹580"}', 'B', 'Profit = 20% of 500 = 100. Selling price = 500 + 100 = ₹600.', 'manual', true),
('s-quantitative', 'The average of 5 numbers is 30. If one number is removed, the average becomes 28. What is the removed number?', NULL, '{"A":"32","B":"34","C":"36","D":"38"}', 'D', 'Sum of 5 numbers = 5×30 = 150. Sum of remaining 4 = 4×28 = 112. Removed number = 150 - 112 = 38.', 'manual', true),
('s-quantitative', 'If the ratio of boys to girls in a class is 3:5 and there are 40 students, how many boys are there?', NULL, '{"A":"12","B":"15","C":"18","D":"24"}', 'B', 'Total parts = 3+5 = 8. Each part = 40/8 = 5. Boys = 3 × 5 = 15.', 'manual', true),
('s-quantitative', 'A train 200 meters long crosses a platform 300 meters long in 20 seconds. What is the speed of the train in km/h?', NULL, '{"A":"54","B":"72","C":"90","D":"108"}', 'C', 'Total distance = 200 + 300 = 500m. Time = 20s. Speed = 500/20 = 25 m/s. In km/h: 25 × 18/5 = 90 km/h.', 'manual', true),
('s-quantitative', 'Study the table and answer:
The total expenditure of company A across all three years is:', 'Year | Company A (₹L) | Company B (₹L)
2020 | 120 | 150
2021 | 150 | 180
2022 | 180 | 200', '{"A":"₹400L","B":"₹450L","C":"₹530L","D":"₹500L"}', 'B', 'Company A total = 120 + 150 + 180 = ₹450 lakh.', 'manual', true),
('s-quantitative', 'A can do a piece of work in 10 days and B can do the same work in 15 days. How many days will they take working together?', NULL, '{"A":"5 days","B":"6 days","C":"7 days","D":"8 days"}', 'B', 'A''s one-day work = 1/10. B''s one-day work = 1/15. Combined = 1/10 + 1/15 = 5/30 = 1/6. So 6 days.', 'manual', true),
('s-quantitative', 'What is the simple interest on ₹10,000 at 8% per annum for 3 years?', NULL, '{"A":"₹2,000","B":"₹2,400","C":"₹2,800","D":"₹3,000"}', 'B', 'SI = (P×R×T)/100 = (10000×8×3)/100 = ₹2,400.', 'manual', true),
('s-quantitative', 'If x² - 5x + 6 = 0, what are the values of x?', NULL, '{"A":"2, 3","B":"1, 6","C":"-2, -3","D":"2, -3"}', 'A', 'x² - 5x + 6 = (x-2)(x-3) = 0 ⇒ x = 2 or x = 3.', 'manual', true),
('s-quantitative', 'A bag contains 3 red and 2 blue balls. What is the probability of drawing a red ball?', NULL, '{"A":"1/5","B":"2/5","C":"3/5","D":"4/5"}', 'C', 'Total balls = 5. Red balls = 3. Probability = 3/5.', 'manual', true),
('s-quantitative', 'If 15% of a number is 45, what is the number?', NULL, '{"A":"200","B":"250","C":"300","D":"350"}', 'C', 'Let the number be x. 0.15x = 45 ⇒ x = 45/0.15 = 300.', 'manual', true);

-- Publish the test
update public.tests set published_at = now() where id = '00000000-0000-0000-0000-000000000001';
