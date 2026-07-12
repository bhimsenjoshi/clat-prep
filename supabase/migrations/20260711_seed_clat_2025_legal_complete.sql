-- ─── Seed: CLAT UG 2025 Set A — Legal Reasoning (Complete: Q53-84) ───

-- Passage X — Children & Criminal Justice System (Q53-58)
do $$
declare
  v_passage_id uuid;
  v_section_id uuid := '19591b45-840d-4f3e-9455-f207ebc63e82';
begin

insert into public.original_passages (section_id, passage_number, title, source, content) values
(v_section_id, 10, 'Children and the Criminal Justice System', 'Extracted, with edits and revisions from "Child Rights in the Criminal Justice System: Need for Law Reform" by Dr. Asha Bajpai, Journal of the National Human Rights Commission, India',
'Children come in contact with the criminal justice system either as victims or witnesses to a crime or as children in conflict with law (CICL). As CICL, they could be alleged of, accused or recognised as having broken the law by committing a crime. According to the National Crime Records Bureau (NCRB) Report 2021, India recorded a total number of 1,49,404 instances of crimes against children in 2021 — a rise of over 16 per cent from the previous year. In terms of percentage, the top categories under crime against children were kidnapping and abduction, followed by cases registered under the POCSO Act. Further, the NCRB report revealed that of the total cases, 53,874 were registered under POCSO Sections. Sexual offences against children shows a steady ascent, with 47,221 such cases being recorded in 2020, and 47,335 cases in 2019. In 2019, as many as 32,269 cases were registered across the country, while the 2021 report registered a decline of 3.5 per cent recording 31,170 cases. The Criminal Justice system of any country broadly refers to agencies of the government charged with enforcing law, adjudicating crime, and correcting criminal conduct. The main objective of the criminal justice system is ''deterrence'', i.e., to punish the ''transgressors and the criminals'' and to maintain law and order in the society. Globally, children and young people are routinely exposed to various forms of violence if they are before the criminal justice system. They are at risk of physical and psychological abuse, sexual assault, and other harms, including inadequate educational opportunities, poor and outdated vocational training. They face several challenges including mental, emotional, and behavioural disorders. Children, who are victims of violence or exposed to violence during childhood, are more likely to have difficulty in school, abuse drugs or alcohol, act aggressively, suffer from depression or other mental health problems and engage in criminal behaviour as adults.'
) returning id into v_passage_id;

-- Q53
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 53,
'Which of the following issues, children, who are victims of violence during childhood face in life, as per the author of the above passage?',
'[{"label": "A", "text": "They may have difficulties in school"}, {"label": "B", "text": "They may abuse drugs or alcohol and suffer from mental health problems"}, {"label": "C", "text": "They may act aggressively and engage in criminal behaviours"}, {"label": "D", "text": "All of the above"}]',
'D',
'The passage explicitly states all three: "difficulty in school, abuse drugs or alcohol, act aggressively, suffer from depression or other mental health problems and engage in criminal behaviour as adults."');

-- Q54
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 54,
'What is the primary objective of the criminal justice system as mentioned in the passage?',
'[{"label": "A", "text": "Rehabilitation of offenders"}, {"label": "B", "text": "Punishment of the offenders"}, {"label": "C", "text": "Reformation of the offenders"}, {"label": "D", "text": "Protection of victims from the offender"}]',
'B',
'The passage states: "The main objective of the criminal justice system is ''deterrence'', i.e., to punish the ''transgressors and the criminals'' and to maintain law and order in the society."');

-- Q55
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 55,
'The National Crime Records Bureau (NCRB) in India is responsible for:',
'[{"label": "A", "text": "Conducting forensic investigations of Records of Criminals"}, {"label": "B", "text": "Maintaining a national database of fingerprints of Criminals"}, {"label": "C", "text": "Compiling and analysing crime data"}, {"label": "D", "text": "Maintaining a national database of enforcement of criminal laws"}]',
'C',
'The NCRB is responsible for compiling and analysing crime data in India, as referenced by the NCRB Report 2021 data cited in the passage.');

-- Q56
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 56,
'Which category had the highest number of cases under crimes against children according to the NCRB Report 2021?',
'[{"label": "A", "text": "POCSO"}, {"label": "B", "text": "Kidnapping and abduction"}, {"label": "C", "text": "Sexual Offences"}, {"label": "D", "text": "All of the above"}]',
'B',
'The passage states: "In terms of percentage, the top categories under crime against children were kidnapping and abduction, followed by cases registered under the POCSO Act."');

-- Q57
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 57,
'Which one of the following is the correct expansion of the term POCSO used in the passage?',
'[{"label": "A", "text": "Protection of Children from Sexual Offences"}, {"label": "B", "text": "Prosecution of Criminals of Sexual Offences"}, {"label": "C", "text": "Protection of Children and Women from Sexual Offences"}, {"label": "D", "text": "None of the above"}]',
'A',
'POCSO stands for the Protection of Children from Sexual Offences Act, 2012.');

-- Q58
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 58,
'What risks do children face when exposed to the criminal justice system as per the passage?',
'[{"label": "A", "text": "Limited access to vocational training"}, {"label": "B", "text": "Exposed to risk of physical abuse"}, {"label": "C", "text": "Mental health challenges and behavioural disorders"}, {"label": "D", "text": "All of the above"}]',
'D',
'The passage mentions all three: "inadequate educational opportunities, poor and outdated vocational training", "physical and psychological abuse", and "mental, emotional, and behavioural disorders."');

end $$;

-- Passage XI — Environment & Constitution (Q59-64)
do $$
declare
  v_passage_id uuid;
  v_section_id uuid := '19591b45-840d-4f3e-9455-f207ebc63e82';
begin

insert into public.original_passages (section_id, passage_number, title, source, content) values
(v_section_id, 11, 'Environmental Protection & Constitutional Law', 'Extracted, with edits and revision, from "Supreme Court of India bolts Right to Life with climate justice", The Economic Times, 06-05-2024',
'The 42nd Constitutional Amendment Act 1976 introduced the concept of environmental protection in an explicit manner into the Constitution through introduction of Article 48-A and Article 51-A (g). In many judgments, the Supreme Court ruled that both the state and its residents have a fundamental duty to preserve and protect their natural resources. The recent judgment obliquely makes way for an enforceable right, and a potential obligation on the state unless the same is overturned by an Act of Parliament. India is signatory of various international environmental conservation treaties under which India has the binding commitment to reduce carbon emission. During the COP 21, India signed Paris Agreement along with 196 countries, under which universally binding agreement was made to limit greenhouse gas emission to levels that would prevent global temperatures from increasing to more than 1.5 degree Celsius before the industrial revolution. India has committed to generating 50% of its energy through renewable resources and will generate 500 GW of energy from non-fossil fuels by 2030, reducing the carbon emission by 1 billion ton. Additionally, India has committed to achieve net zero carbon emission target by 2070. Supreme Court''s March 21, 2024 verdict builds on the bulwark of jurisprudence in place since 1986, and, through various other judgments, the Supreme Court has recognised the right to clean environment along with right to clean air, water and soil free from pollution which is absolutely necessary for the enjoyment of life. Any disturbance with these basic elements of environment would amount to violation of Article 21. It also establishes duty of the state to maintain ecological balance and hygienic environment. Although right to clean environment has existed, by recognizing the right against climate change it shall compel the states to prioritize environmental protection and sustainable development.'
) returning id into v_passage_id;

-- Q59
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 59,
'In which among the following, changes were introduced for environmental protection through the Constitution of India (42nd Amendment) Act? 1. Fundamental Rights, 2. Fundamental Duties, 3. Directive Principles of State Policy',
'[{"label": "A", "text": "1 & 2 only"}, {"label": "B", "text": "2 & 3 only"}, {"label": "C", "text": "1 & 3 only"}, {"label": "D", "text": "1, 2 & 3"}]',
'B',
'The 42nd Amendment introduced Article 48-A (Directive Principles) and Article 51-A(g) (Fundamental Duties). No new Fundamental Right was explicitly added by this amendment.');

-- Q60
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 60,
'The nature of binding commitment of India to reduce carbon emission through the signing of various international environmental conservation treaties especially the Paris Agreement may be described as:',
'[{"label": "A", "text": "The signatory shall take adequate measures to reduce carbon emission"}, {"label": "B", "text": "The signatory may take adequate measures to reduce carbon emission"}, {"label": "C", "text": "The signatory should explore the possibility to reduce carbon emission"}, {"label": "D", "text": "The signatory may formulate necessary policies to reduce carbon emission"}]',
'A',
'The passage describes the Paris Agreement as a "universally binding agreement" with specific targets, indicating that signatories "shall" take measures.');

-- Q61
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 61,
'Under Article 51-A(g) of the Indian Constitution, it is specifically mentioned that citizens shall have the duty to protect and improve the natural environment that includes:',
'[{"label": "A", "text": "Rivers & Lakes"}, {"label": "B", "text": "Forests & Wildlife"}, {"label": "C", "text": "All living Creatures"}, {"label": "D", "text": "Only (A) and (B)"}]',
'C',
'Article 51-A(g) states the duty "to protect and improve the natural environment including forests, lakes, rivers and wildlife, and to have compassion for living creatures."');

-- Q62
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 62,
'As per the aforementioned passage and decision of the Supreme Court:',
'[{"label": "A", "text": "The fundamental duty to preserve and protect natural resources is upon the State only"}, {"label": "B", "text": "Citizens alone have the fundamental duty to preserve and protect natural resources"}, {"label": "C", "text": "Both the state and citizens have the duty to preserve and protect natural resources"}, {"label": "D", "text": "State''s duty to maintain ecological balance and citizens right against climate change"}]',
'C',
'The Supreme Court ruled that both the state (Article 48-A) and its residents (Article 51-A(g)) have the duty to preserve and protect natural resources.');

-- Q63
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 63,
'According to the passage, what makes India committed to reduce carbon emission?',
'[{"label": "A", "text": "Because of being a signatory of international environmental conservation treaties"}, {"label": "B", "text": "Because of the Supreme Court verdicts which obliquely make way for an enforceable right"}, {"label": "C", "text": "Because of the policy decisions of Government"}, {"label": "D", "text": "Because of the Constitution of India (42nd Amendment) Act"}]',
'A',
'The passage states India has "binding commitment to reduce carbon emission" due to being "signatory of various international environmental conservation treaties."');

-- Q64
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 64,
'The passage mentions that "any disturbance with these basic elements of environment would amount to violation of Article 21". Article 21 of the Constitution deals with:',
'[{"label": "A", "text": "Right to equality"}, {"label": "B", "text": "Right against exploitation"}, {"label": "C", "text": "Right to freedom of residence"}, {"label": "D", "text": "Right to life and personal liberty"}]',
'D',
'Article 21 of the Indian Constitution guarantees the Right to life and personal liberty.');

end $$;

-- Passage XII — Geographical Indications & DPDP Act (Q65-68)
do $$
declare
  v_passage_id uuid;
  v_section_id uuid := '19591b45-840d-4f3e-9455-f207ebc63e82';
begin

insert into public.original_passages (section_id, passage_number, title, source, content) values
(v_section_id, 12, 'Geographical Indications & Data Protection', null,
'Geographical Indications (GIs) are a form of intellectual property that designates a product as originating from a specific geographic location, where a given quality, reputation, or other characteristic is essentially attributable to its geographic origin. GIs protect names that are used to identify products with specific qualities or characteristics due to their geographic origin.'
) returning id into v_passage_id;

-- Q65
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 65,
'What is the primary purpose of Geographical Indications (GIs) as described in the passage?',
'[{"label": "A", "text": "To protect the brand name of multinational corporations"}, {"label": "B", "text": "To protect names of products originating from a specific geographic location with unique qualities"}, {"label": "C", "text": "To promote international trade agreements"}, {"label": "D", "text": "To certify organic farming practices"}]',
'B',
'The passage states: "Geographical Indications (GIs) are a form of intellectual property that designates a product as originating from a specific geographic location, where a given quality, reputation, or other characteristic is essentially attributable to its geographic origin."');

-- Q66
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 66,
'Which of the following is an example of a Geographical Indication?',
'[{"label": "A", "text": "Coca-Cola formula"}, {"label": "B", "text": "Darjeeling Tea"}, {"label": "C", "text": "Apple iPhone design"}, {"label": "D", "text": "Microsoft Windows software"}]',
'B',
'Darjeeling Tea is a well-known Indian Geographical Indication — tea grown in the Darjeeling region with unique qualities attributable to its geographic origin.');

-- Q67
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 67,
'GI protection in India is governed by which Act?',
'[{"label": "A", "text": "The Copyright Act, 1957"}, {"label": "B", "text": "The Patents Act, 1970"}, {"label": "C", "text": "The Geographical Indications of Goods (Registration and Protection) Act, 1999"}, {"label": "D", "text": "The Trademarks Act, 1999"}]',
'C',
'Geographical Indications in India are governed by the Geographical Indications of Goods (Registration and Protection) Act, 1999.');

-- Q68
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 68,
'Which authority registers Geographical Indications in India?',
'[{"label": "A", "text": "Indian Patent Office"}, {"label": "B", "text": "The GI Registry under the Ministry of Commerce and Industry"}, {"label": "C", "text": "The Copyright Office"}, {"label": "D", "text": "The Food Safety and Standards Authority of India"}]',
'B',
'The GI Registry in Chennai, under the Ministry of Commerce and Industry, is responsible for registering Geographical Indications in India.');

end $$;

-- Passage XIII — Indian Contract Act 1872 (Q69-84)
do $$
declare
  v_passage_id uuid;
  v_section_id uuid := '19591b45-840d-4f3e-9455-f207ebc63e82';
begin

insert into public.original_passages (section_id, passage_number, title, source, content) values
(v_section_id, 13, 'Indian Contract Act 1872', 'Extracted with edits from A Comparative Study of Voidable Contracts and Void Agreements',
'The Contract Act 1872 deals with contract law in India, its rights, duties, and exceptions arising out of it. Section 2(h) of the Act gives us the definition of a contract, which is simply an agreement enforceable by law. To understand the difference between void agreements and voidable contracts it is important to talk about sections 2(h), 2(a), 2(i), 2(d), 14, 16 (3) and 15,24-28 of the Indian Contract Act. Void agreements are fundamentally invalid making them unenforceable by default. These agreements cannot be fulfilled as they consist of illegal elements and they cannot be enforced even after subjecting it to both parties. However, in the case of voidable contract, the agreement is initially enforceable but it is later on denied at the option of either of the parties due to various reasons. Unless rejected by a party, this contract will remain valid and enforceable. The party who is at the disadvantage due to any circumstance applicable to the contract has the ability to render the agreement void. A void agreement is void ab initio making it impossible to rectify any defects in it while voidable contracts can be rectified. In case of a void agreement, neither of the parties is subject to any compensation for any losses but voidable contracts have some remedies. A valid agreement forms a contract that may again be either valid or voidable. The primary difference between a void agreement and voidable contract is that a void agreement cannot be converted into a contract.'
) returning id into v_passage_id;

-- Q69
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 69,
'Which of the following best describes a void agreement?',
'[{"label": "A", "text": "An agreement that is valid until declared invalid by a court"}, {"label": "B", "text": "An agreement that has no legal effect from the beginning"}, {"label": "C", "text": "An agreement that is legally enforceable"}, {"label": "D", "text": "An agreement that can be enforced if one party chooses to do so"}]',
'B',
'A void agreement is void ab initio, meaning it has no legal effect from its inception.');

-- Q70
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 70,
'A contract between two parties to rob a bank and share the proceeds equally can be termed as:',
'[{"label": "A", "text": "Void Contract"}, {"label": "B", "text": "Valid Contract"}, {"label": "C", "text": "Voidable Contract"}, {"label": "D", "text": "Legally Enforceable Contract"}]',
'A',
'A contract with an unlawful object (robbery) is void ab initio under the Indian Contract Act.');

-- Q71
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 71,
'An agreement made by an adult but involving a minor child where the signatory is a minor child himself, this agreement would be:',
'[{"label": "A", "text": "A valid and enforceable agreement"}, {"label": "B", "text": "A voidable agreement"}, {"label": "C", "text": "A void agreement"}, {"label": "D", "text": "An agreement that cannot be enforced by the minor"}]',
'C',
'An agreement with a minor is void ab initio as a minor lacks the capacity to contract under Section 11 of the Indian Contract Act.');

-- Q72
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 72,
'Which of the following scenarios would most likely result in a void agreement?',
'[{"label": "A", "text": "An agreement signed by someone under duress"}, {"label": "B", "text": "A contract with mutually agreed terms to sell a house"}, {"label": "C", "text": "An agreement to pay 10 lakhs on getting a government job"}, {"label": "D", "text": "A contract with a minor who understands the terms"}]',
'C',
'An agreement for unlawful consideration (paying to procure a government job) is void. Option A (duress) makes it voidable, not void. Options B and D need more context.');

-- Q73
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 73,
'An agreement made without consideration is generally:',
'[{"label": "A", "text": "Valid agreement"}, {"label": "B", "text": "Enforceable agreement"}, {"label": "C", "text": "Void agreement"}, {"label": "D", "text": "Voidable agreement"}]',
'C',
'Under Section 25 of the Indian Contract Act, an agreement without consideration is generally void, subject to certain exceptions.');

-- Q74
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 74,
'In a voidable contract, the contract remains valid and enforceable until:',
'[{"label": "A", "text": "It is declared void by a court"}, {"label": "B", "text": "The party at disadvantage exercises the option to reject it"}, {"label": "C", "text": "Both parties agree to terminate it"}, {"label": "D", "text": "The contract period expires"}]',
'B',
'The passage states: "Unless rejected by a party, this contract will remain valid and enforceable. The party who is at the disadvantage... has the ability to render the agreement void."');

-- Q75
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 75,
'Which of the following can be rectified according to the passage?',
'[{"label": "A", "text": "A void agreement"}, {"label": "B", "text": "A voidable contract"}, {"label": "C", "text": "Both void agreement and voidable contract"}, {"label": "D", "text": "Neither"}]',
'B',
'The passage states: "A void agreement is void ab initio making it impossible to rectify any defects in it while voidable contracts can be rectified."');

-- Q76
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 76,
'A contract entered into by a person under coercion would be categorized as:',
'[{"label": "A", "text": "Void agreement"}, {"label": "B", "text": "Voidable contract"}, {"label": "C", "text": "Valid contract"}, {"label": "D", "text": "Illegal agreement"}]',
'B',
'Coercion makes a contract voidable at the option of the party whose consent was obtained by coercion (Section 19 of the Indian Contract Act).');

-- Q77
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 77,
'The definition of a contract as per Section 2(h) of the Indian Contract Act is:',
'[{"label": "A", "text": "A written agreement between two parties"}, {"label": "B", "text": "An agreement enforceable by law"}, {"label": "C", "text": "A promise made by one party to another"}, {"label": "D", "text": "An agreement registered with a government authority"}]',
'B',
'The passage states: "Section 2(h) of the Act gives us the definition of a contract, which is simply an agreement enforceable by law."');

-- Q78
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 78,
'If a person agrees to sell his house under threat of physical harm, this agreement is:',
'[{"label": "A", "text": "Void ab initio"}, {"label": "B", "text": "Voidable at the option of the person threatened"}, {"label": "C", "text": "Valid and enforceable"}, {"label": "D", "text": "Unenforceable due to illegality"}]',
'B',
'Consent obtained through threat of physical harm (coercion) makes the contract voidable at the option of the aggrieved party under Section 19.');

-- Q79
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 79,
'A void agreement differs from a voidable contract primarily because:',
'[{"label": "A", "text": "A voidable contract involves free consent while a void agreement does not"}, {"label": "B", "text": "A void agreement cannot be converted into a contract while a voidable contract can be rectified"}, {"label": "C", "text": "A voidable contract involves consideration while a void agreement does not"}, {"label": "D", "text": "A void agreement requires registration while a voidable contract does not"}]',
'B',
'The passage concludes: "The primary difference between a void agreement and voidable contract is that a void agreement cannot be converted into a contract."');

-- Q80
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 80,
'Which of the following sections of the Indian Contract Act deals with the definition of consideration?',
'[{"label": "A", "text": "Section 2(a)"}, {"label": "B", "text": "Section 2(d)"}, {"label": "C", "text": "Section 2(h)"}, {"label": "D", "text": "Section 2(i)"}]',
'B',
'Section 2(d) of the Indian Contract Act defines consideration.');

-- Q81
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 81,
'An agreement to commit a crime is:',
'[{"label": "A", "text": "Voidable"}, {"label": "B", "text": "Valid"}, {"label": "C", "text": "Void"}, {"label": "D", "text": "Enforceable"}]',
'C',
'An agreement to commit a crime is illegal and therefore void ab initio under Section 24 of the Indian Contract Act.');

-- Q82
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 82,
'In case of a void agreement:',
'[{"label": "A", "text": "Parties may claim compensation for losses"}, {"label": "B", "text": "Neither party is entitled to compensation"}, {"label": "C", "text": "Only the aggrieved party can claim damages"}, {"label": "D", "text": "The party breaching the agreement must pay damages"}]',
'B',
'The passage states: "In case of a void agreement, neither of the parties is subject to any compensation for any losses."');

-- Q83
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 83,
'The term "void ab initio" means:',
'[{"label": "A", "text": "Void from a certain point in time"}, {"label": "B", "text": "Void from the beginning"}, {"label": "C", "text": "Void if challenged by a party"}, {"label": "D", "text": "Void after court declaration"}]',
'B',
'"Void ab initio" is a Latin term meaning void from the beginning — as stated in the passage.');

-- Q84
insert into public.original_questions (section_id, passage_id, question_number, question_text, options, correct_option, explanation) values
(v_section_id, v_passage_id, 84,
'Sections 24-28 of the Indian Contract Act deal with:',
'[{"label": "A", "text": "Void agreements"}, {"label": "B", "text": "Voidable contracts"}, {"label": "C", "text": "Valid contracts"}, {"label": "D", "text": "Quasi-contracts"}]',
'A',
'The passage mentions Sections 24-28 in the context of void agreements under the Indian Contract Act.');

end $$;
