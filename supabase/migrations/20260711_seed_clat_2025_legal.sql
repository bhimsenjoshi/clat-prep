-- ─── Seed: CLAT UG 2025 Set A — Legal Reasoning (Passages XIII-XV, Q69-84) ───
do $$
declare
  v_passage_id uuid;
  v_section_id uuid := '19591b45-840d-4f3e-9455-f207ebc63e82';
begin

-- Passage XIII — Geographical Indications
insert into public.original_passages (section_id, passage_number, title, source, content) values
(v_section_id, 13, 'Geographical Indications', null,
'Geographical Indications (GIs) are a form of intellectual property that designates a product as originating from a specific geographic location, where a given quality, reputation, or other characteristic is essentially attributable to its geographic origin. GIs protect names that are used to identify products with specific qualities or characteristics due to their geographic origin.'
) returning id into v_passage_id;

-- Q69
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 69,
'A startup provides a health-tracking app that collects sensitive health data from users. Under the digital personal data protection law in India, what additional precautions must the startup take compared to regular personal data?',
'[{"label": "A", "text": "No additional measures are needed"}, {"label": "B", "text": "Ensure explicit consent and adopt higher security standards"}, {"label": "C", "text": "Store the data only with the government agencies"}, {"label": "D", "text": "Store the data only with the hospitals and other health care institutions"}]',
'B',
'Under the DPDP Act, sensitive personal data requires explicit consent and additional safeguards (higher security standards) for processing.');

-- Q70
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 70,
'As per the passage, what are the rights included under the digital data protection law of India?',
'[{"label": "A", "text": "1, 2, 5 and 6"}, {"label": "B", "text": "1, 3, 4 and 6"}, {"label": "C", "text": "1, 3, 5 and 6"}, {"label": "D", "text": "1, 2, 3, 4, 5 and 6"}]',
'D',
'All six rights are mentioned in the passage: (1) summary of collected data, (2) know identities shared with, (3) correction, (4) erasure/removal, (5) nominate persons to receive data, (6) redressal of grievances.');

-- Q71
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 71,
'An Indian company collects personal data from its users to provide personalized services. The company intends to share this data with a third-party vendor for targeted advertisements. Under the digital personal data protection law in India, what must the company do before sharing the data?',
'[{"label": "A", "text": "Obtain explicit consent from the users"}, {"label": "B", "text": "Share the data by informing the users, as it is for business purposes"}, {"label": "C", "text": "Encrypt the data and share it with the third-party vendor"}, {"label": "D", "text": "Inform the third-party vendor that the data is sensitive"}]',
'A',
'Under the DPDP Act, explicit consent must be obtained from users before sharing personal data with third parties for purposes like targeted advertisements.');

-- Q72
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 72,
'A social media platform processes user data based on the consent given during account creation. A user now wishes to withdraw consent to process their data. Under the digital personal data protection law in India, what must the platform do?',
'[{"label": "A", "text": "Refuse to accept the withdrawal request since consent was already given"}, {"label": "B", "text": "Comply with the legal requirements and stop processing the data"}, {"label": "C", "text": "Continue processing the data but notify the user"}, {"label": "D", "text": "Allow withdrawal only after 30 days"}]',
'B',
'The DPDP Act gives individuals the right to withdraw consent. The platform must comply and stop processing the data.');

-- Q73
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 73,
'A financial institution collects biometric data from its clients for verification purposes. If the clients wish to know what data has been collected, under the digital personal data protection law in India, what right allows them to request this information?',
'[{"label": "A", "text": "Right to Data Portability"}, {"label": "B", "text": "Right to Correction"}, {"label": "C", "text": "Right to Access"}, {"label": "D", "text": "Right to Be Forgotten"}]',
'C',
'The right to access (or right to get a summary of all collected data) allows individuals to know what data has been collected about them.');

end $$;

-- Passage XIV — Environment & Constitution (Q74-79)
do $$
declare
  v_passage_id uuid;
  v_section_id uuid := '19591b45-840d-4f3e-9455-f207ebc63e82';
begin

insert into public.original_passages (section_id, passage_number, title, source, content) values
(v_section_id, 14, 'Climate Change & Constitutional Law', 'Extracted, with edits and revision, from "Supreme Court of India bolts Right to Life with climate justice", The Economic Times, 06-05-2024',
'The 42nd Constitutional Amendment Act 1976 introduced the concept of environmental protection in an explicit manner into the Constitution through introduction of Article 48-A and Article 51-A (g). In many judgments, the Supreme Court ruled that both the state and its residents have a fundamental duty to preserve and protect their natural resources. The recent judgment obliquely makes way for an enforceable right, and a potential obligation on the state unless the same is overturned by an Act of Parliament. India is signatory of various international environmental conservation treaties under which India has the binding commitment to reduce carbon emission. During the COP 21, India signed Paris Agreement along with 196 countries, under which universally binding agreement was made to limit greenhouse gas emission to levels that would prevent global temperatures from increasing to more than 1.5 degree Celsius before the industrial revolution. India has committed to generating 50% of its energy through renewable resources and will generate 500 GW of energy from non-fossil fuels by 2030, reducing the carbon emission by 1 billion ton. Additionally, India has committed to achieve net zero carbon emission target by 2070. Supreme Court''s March 21, 2024 verdict builds on the bulwark of jurisprudence in place since 1986, and, through various other judgments, the Supreme Court has recognised the right to clean environment along with right to clean air, water and soil free from pollution which is absolutely necessary for the enjoyment of life. Any disturbance with these basic elements of environment would amount to violation of Article 21. It also establishes duty of the state to maintain ecological balance and hygienic environment. Although right to clean environment has existed, by recognizing the right against climate change it shall compel the states to prioritize environmental protection and sustainable development.'
) returning id into v_passage_id;

-- Q74
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 74,
'In which among the following, changes were introduced for environmental protection through the Constitution of India (42nd Amendment) Act?',
'[{"label": "A", "text": "1 & 2 only"}, {"label": "B", "text": "2 & 3 only"}, {"label": "C", "text": "1 & 3 only"}, {"label": "D", "text": "1, 2 & 3"}]',
'B',
'The 42nd Amendment introduced Article 48-A (Directive Principles) and Article 51-A(g) (Fundamental Duties). It did not introduce any new Fundamental Right — that came through judicial interpretation of Article 21.');

-- Q75
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 75,
'The nature of binding commitment of India to reduce carbon emission through the signing of various international environmental conservation treaties especially the Paris Agreement may be described as:',
'[{"label": "A", "text": "The signatory shall take adequate measures to reduce carbon emission"}, {"label": "B", "text": "The signatory may take adequate measures to reduce carbon emission"}, {"label": "C", "text": "The signatory should explore the possibility to reduce carbon emission"}, {"label": "D", "text": "The signatory may formulate necessary policies to reduce carbon emission"}]',
'A',
'The Paris Agreement creates a universally binding commitment. India has committed to specific targets (500 GW non-fossil energy by 2030, net zero by 2070), indicating that signatories "shall" take measures.');

-- Q76
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 76,
'Under Article 51-A(g) of the Indian Constitution, it is specifically mentioned that citizens shall have the duty to protect and improve the natural environment that includes:',
'[{"label": "A", "text": "Rivers & Lakes"}, {"label": "B", "text": "Forests & Wildlife"}, {"label": "C", "text": "All living Creatures"}, {"label": "D", "text": "Only (A) and (B)"}]',
'C',
'Article 51-A(g) states the duty of every citizen "to protect and improve the natural environment including forests, lakes, rivers and wildlife, and to have compassion for living creatures."');

-- Q77
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 77,
'As per the aforementioned passage and decision of the Supreme Court:',
'[{"label": "A", "text": "The fundamental duty to preserve and protect natural resources is upon the State only"}, {"label": "B", "text": "Citizens alone have the fundamental duty to preserve and protect natural resources"}, {"label": "C", "text": "Both the state and citizens have the duty to preserve and protect natural resources"}, {"label": "D", "text": "State''s duty to maintain ecological balance and citizens right against climate change"}]',
'C',
'The Supreme Court ruled that both the state (through Article 48-A/DPSP) and residents (through Article 51-A(g)/Fundamental Duties) have the duty to preserve and protect natural resources.');

-- Q78
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 78,
'According to the passage, what makes India committed to reduce carbon emission?',
'[{"label": "A", "text": "Because of being a signatory of international environmental conservation treaties"}, {"label": "B", "text": "Because of the Supreme Court verdicts which obliquely make way for an enforceable right"}, {"label": "C", "text": "Because of the policy decisions of Government"}, {"label": "D", "text": "Because of the Constitution of India (42nd Amendment) Act"}]',
'A',
'India''s commitment to reduce carbon emissions arises from being a signatory to international environmental treaties, particularly the Paris Agreement, creating a binding commitment.');

-- Q79
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 79,
'The passage mentions that "any disturbance with these basic elements of environment would amount to violation of Article 21". Article 21 of the Constitution deals with:',
'[{"label": "A", "text": "Right to equality"}, {"label": "B", "text": "Right against exploitation"}, {"label": "C", "text": "Right to freedom of residence"}, {"label": "D", "text": "Right to life and personal liberty"}]',
'D',
'Article 21 of the Indian Constitution states: "No person shall be deprived of his life or personal liberty except according to procedure established by law." The Supreme Court has expansively interpreted this to include the right to a clean environment.');

end $$;

-- Passage XV — Contract Act 1872 (Q80-84)
do $$
declare
  v_passage_id uuid;
  v_section_id uuid := '19591b45-840d-4f3e-9455-f207ebc63e82';
begin

insert into public.original_passages (section_id, passage_number, title, source, content) values
(v_section_id, 15, 'Indian Contract Act 1872', 'Extracted with edits from A Comparative Study of Voidable Contracts and Void Agreements',
'The Contract Act 1872 deals with contract law in India, its rights, duties, and exceptions arising out of it. Section 2(h) of the Act gives us the definition of a contract, which is simply an agreement enforceable by law. To understand the difference between void agreements and voidable contracts it is important to talk about sections 2(h), 2(a), 2(i), 2(d), 14, 16 (3) and 15,24-28 of the Indian Contract Act. Void agreements, are fundamentally invalid making them unenforceable by default. These agreements cannot be fulfilled as they consist of illegal elements and they cannot be enforced even after subjecting it to both parties. However, in the case of voidable contract, the agreement is initially enforceable but it is later on denied at the option of either of the parties due to various reasons. Unless rejected by a party, this contract will remain valid and enforceable. The party who is at the disadvantage due to any circumstance applicable to the contract has the ability to render the agreement void. A void agreement is void ab initio making it impossible to rectify any defects in it while voidable contracts can be rectified. In case of a void agreement, neither of the parties is subject to any compensation for any losses but voidable contracts have some remedies. A valid agreement forms a contract that may again be either valid or voidable. The primary difference between a void agreement and voidable contract is that a void agreement cannot be converted into a contract.'
) returning id into v_passage_id;

-- Q80
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 80,
'Which of the following best describes a void agreement?',
'[{"label": "A", "text": "An agreement that is valid until declared invalid by a court"}, {"label": "B", "text": "An agreement that has no legal effect from the beginning"}, {"label": "C", "text": "An agreement that is legally enforceable"}, {"label": "D", "text": "An agreement that can be enforced if one party chooses to do so"}]',
'B',
'A void agreement is void ab initio (from the beginning) and has no legal effect. It cannot be enforced by either party.');

-- Q81
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 81,
'A contract between two parties to rob a bank and share the proceeds equally can be termed as:',
'[{"label": "A", "text": "Void Contract"}, {"label": "B", "text": "Valid Contract"}, {"label": "C", "text": "Voidable Contract"}, {"label": "D", "text": "Legally Enforceable Contract"}]',
'A',
'Such an agreement has an unlawful object (robbery), rendering it void ab initio under Section 24 of the Indian Contract Act.');

-- Q82
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 82,
'An agreement made by an adult but involving a minor child where the signatory is a minor child himself, this agreement would be:',
'[{"label": "A", "text": "A valid and enforceable agreement"}, {"label": "B", "text": "A voidable agreement"}, {"label": "C", "text": "A void agreement"}, {"label": "D", "text": "An agreement that cannot be enforced by the minor"}]',
'C',
'An agreement with a minor is void ab initio under the Indian Contract Act as a minor lacks the capacity to contract.');

-- Q83
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 83,
'Which of the following scenarios would most likely result in a void agreement?',
'[{"label": "A", "text": "An agreement signed by someone under duress"}, {"label": "B", "text": "A contract with mutually agreed terms to sell a house"}, {"label": "C", "text": "An agreement to pay 10 lakhs on getting a government job"}, {"label": "D", "text": "A contract with a minor who understands the terms"}]',
'C',
'An agreement to pay money for procuring a government job is for an unlawful consideration and is void. Option A (duress) makes it voidable, not void. Option B is valid. Option D, while involving a minor, is also void.');

-- Q84
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 84,
'An agreement made without consideration is generally:',
'[{"label": "A", "text": "Valid agreement"}, {"label": "B", "text": "Enforceable agreement"}, {"label": "C", "text": "Void agreement"}, {"label": "D", "text": "Voidable agreement"}]',
'C',
'Under Section 25 of the Indian Contract Act, an agreement without consideration is generally void, subject to certain exceptions (natural love and affection, past voluntary service, etc.).');

end $$;
