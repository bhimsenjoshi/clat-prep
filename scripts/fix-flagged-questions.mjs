#!/usr/bin/env node
/**
 * Fix all flagged/broken questions:
 *  A) 8 mechanically flagged (5 options -> drop E to make 4, CLAT format)
 *  B) 9 AI-flagged content fixes (answers, options, explanations)
 *  C) f69ba726 Quant question (passed but broken: options lack the correct answer)
 * Then set all to 'pending' for re-validation through the AI gate.
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
for (const envPath of [resolve(scriptDir, '..', '.env'), resolve(scriptDir, '.env')]) {
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
      if (!process.env[key]) process.env[key] = val;
    }
    break;
  }
}
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const HEADERS = { 'Content-Type': 'application/json', 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` };

async function patch(id, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/practice_questions?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...HEADERS, 'Prefer': 'return=representation' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH ${id} ${res.status}: ${await res.text()}`);
  return res.json();
}

const results = [];
async function apply(id, label, body) {
  await patch(id, body);
  results.push(`✅ ${label} (${id.slice(0, 8)})`);
  console.log(`✅ ${label} (${id.slice(0, 8)})`);
}

// ─── A) 8 mechanically flagged: drop option E ───
const dropE = {
  'f465d121-fc8f-45bb-a188-5ac9da230782': { A: 'Mandatory voting would not encourage previously disengaged individuals to become more politically informed.', B: 'Voter apathy is primarily caused by a lack of interest in politics rather than structural barriers.', C: 'Election outcomes are currently not distorted by uninformed voters.', D: 'Higher voter turnout necessarily leads to better democratic representation.' },
  '8427412d-446c-4172-aa13-34e81e3d45fc': { A: 'In countries with mandatory voting, the number of spoiled or random ballots is no higher than in voluntary systems.', B: 'Many people who do not vote are already well-informed about politics but choose not to vote as a form of protest.', C: 'Political apathy is often correlated with lower levels of education and income.', D: 'Compulsory voting laws are difficult to enforce and often lead to legal challenges.' },
  '6a948f85-a29c-47c0-901d-caa52b2c932c': { A: 'Mandatory voting is currently used in some democracies.', B: 'The author believes that voter apathy is not primarily due to laziness.', C: 'High voter turnout is always beneficial for democracy.', D: 'Informed voting is less important than high turnout.' },
  '9fd05231-fca3-40e2-96c9-bb65f402a923': { A: 'Argue that compulsory licensing should be used for all pharmaceutical products.', B: 'Defend the current patent system against critics.', C: 'Propose that compulsory licensing be temporarily allowed for vaccines during pandemics.', D: 'Compare the merits of vaccine patents and alternative incentive systems.' },
  'fdf76015-d450-427b-9ef4-fe9fae52814a': { A: 'Assumes that what is true for one pharmaceutical company is true for the entire industry.', B: 'Overlooks the possibility that compulsory licensing might delay vaccine development in future pandemics.', C: 'Relies on the assumption that governments will act in the public interest.', D: 'Fails to consider that the loss of patent profits might discourage investment in other therapeutic areas.' },
  'e95006b0-0c6a-45b7-bc43-f1b36c598f69': { A: 'Most citizens who currently vote are well-informed about political issues.', B: 'In a recent survey, the majority of non-voters admitted they knew very little about the candidates and policies.', C: 'Countries with mandatory voting tend to have more stable governments.', D: 'Many voters in voluntary systems cast ballots based on party loyalty rather than issue knowledge.' },
  '6d358367-9529-451b-8e4b-1ed2e9be022f': { A: 'Advocate for the implementation of mandatory voting in all democracies.', B: 'Critique the assumption that high voter turnout is inherently good.', C: 'Argue that mandatory voting would harm democratic representation.', D: 'Explain the various causes of voter apathy in modern democracies.' },
  '2bbd4539-c85e-4059-b749-39e48554370c': { A: 'Assumes that the disengaged are necessarily uninformed without providing evidence.', B: 'Confuses voter apathy with laziness.', C: 'Rests on the false dichotomy that high turnout or good representation are mutually exclusive.', D: 'Overlooks the possibility that mandatory voting might increase political engagement over time.' },
};
for (const [id, opts] of Object.entries(dropE)) {
  await apply(id, 'LR 5-option → 4 options', { options: opts });
}

// ─── B) AI-flagged content fixes ───

// 1. 02c351f9: explanation mischaracterizes option B (says "decrease in violent crime", B is about tax revenues)
await apply('02c351f9-d812-4af0-8555-bba309b3270a', 'LR drug-policy explanation fixed (option B)', {
  explanation: JSON.stringify({
    correct_answer_rationale: "The correct option is C because it directly undermines the claim that Portugal's decriminalisation reduced harm: if a sharp rise in drug consumption and resurgence of deaths cancels earlier reductions, then the policy did not produce an overall net benefit. This attacks the assumption that the reduction in overdose deaths is a lasting and complete harm-reduction outcome.",
    incorrect_option_analysis: {
      A: "Out of scope; Portugal's population size relative to other countries is irrelevant to the effectiveness of its drug policy.",
      B: "Incorrect as a weaken-er: new tax revenues from regulated drug sales actually support the argument for legalisation/regulation, so this option strengthens rather than weakens the claim that regulation reduces harm.",
      C: "This is the correct answer; it directly offsets the claimed benefits of decriminalisation.",
      D: "Out of scope; pharmaceutical profits do not affect the public-health argument being made.",
    },
    wrong_answer_guidance: "Focus on the contrast between the reduction in overdose deaths and the potential rise in consumption. A weakening fact must show that the claimed benefits do not hold or are offset.",
  }),
});

// 2. 1bfbec63: explanation contradicts itself (A and C both 'correct'); true answer is C (fee on manufacturers = industry, Union List)
await apply('1bfbec63-8632-4ed7-add3-687debe1330b', 'Legal fee answer A→C + explanation fixed', {
  correct_option: 'C',
  explanation: JSON.stringify({
    correct_answer_rationale: "Here the levy is imposed on sugar manufacturers based on the quantity of sugar produced — the direct subject of the fee is manufacturing, an industrial activity governed by Entry 52, List I (Union List). The use of the proceeds for sugarcane research does not change the substance of the levy: it is a fee connected to the regulation of an industry within Parliament's competence, so the law is valid and not colourable.",
    incorrect_option_analysis: {
      A: "Incorrect — a regulatory fee is not 'a form of taxation' within the excise power; fees are levied for services or regulation, and their validity turns on the subject matter of the levy, which here is industry.",
      B: "Incorrect — the fee is on manufacturers, not on agriculture; the proceeds being used for sugarcane research does not make the fee a tax on agriculture.",
      C: "This is the correct answer — the fee is on manufacturers and relates to sugar production, an industrial activity under the Union List.",
      D: "Incorrect — Parliament can impose fees on subjects within its competence even if the benefit incidentally flows to agriculture.",
    },
    wrong_answer_guidance: "Distinguish the direct object of the levy. If the fee is imposed on an industry (a Union subject), incidental benefit to a State subject like agriculture is allowed.",
  }),
});

// 3. 236e55d5: option A says Part IXA — 97th Amendment added Part IXB. Fix option text so C stays correct.
await apply('236e55d5-f3c1-482c-a8eb-c0cd46d897ed', 'CA 97th Amendment option A fixed (IXA→IXB)', {
  options: {
    A: 'Added Part IXB (Articles 243ZH to 243ZT) on cooperatives to the Constitution',
    B: 'Made the right to form cooperatives a fundamental right under Article 19(1)(c)',
    C: 'Both A and B are correct',
    D: 'Added a Directive Principle under Article 48 for promotion of cooperatives',
  },
  explanation: 'The 97th Amendment inserted Part IXB (Articles 243ZH to 243ZT) related to cooperative societies, and also amended Article 19(1)(c) to include cooperative societies within the right to form associations, making it a fundamental right. Additionally, it added Article 43B (Directive Principle) for promotion of cooperatives. Option A and Option B are both correct, so C is the comprehensive answer. Option D is incorrect because the Directive Principle added is Article 43B, not Article 48.',
});

// 4. 39c537c5: question misstates parties (Aarav sues himself) — Bhavna is the plaintiff
await apply('39c537c5-3962-467e-843c-e4488fb3b6db', 'Legal unjust-enrichment parties fixed', {
  question_text: "Differentiate between a claim for unjust enrichment and a claim for breach of contract. Aarav had an existing contract with Bhavna to deliver goods worth ₹5,00,000, and Bhavna paid the full price but Aarav never delivered the goods. Which statement is true?",
  options: {
    A: 'Bhavna can sue Aarav for breach of contract to recover the price; a claim in unjust enrichment is not available because a valid contract governs.',
    B: 'Bhavna can sue Aarav in unjust enrichment because the contract failed, and restitution may be an alternative remedy.',
    C: 'Bhavna cannot claim unjust enrichment because she is a volunteer.',
    D: 'Breach of contract and unjust enrichment are mutually exclusive; one must choose either remedy.',
  },
  correct_option: 'A',
  explanation: JSON.stringify({
    correct_answer_rationale: "Where a valid contract exists and the defendant fails to perform, the usual remedy is damages for breach of contract. Unjust enrichment is a quasi-contractual remedy that typically arises in the absence of a contract, or where the contract is void, voidable, or has failed. Here Bhavna paid the full price under a valid contract with Aarav, who never delivered. The contract governs the parties' obligations, so Bhavna's proper claim is for breach of contract; a claim in unjust enrichment is not available because the valid contract covers the same subject matter.",
    incorrect_option_analysis: {
      A: "This is the correct answer — Bhavna (the buyer who performed) sues Aarav (the seller who breached) for breach of contract; the existence of a valid contract precludes unjust enrichment.",
      B: "Incorrect — unjust enrichment is generally not available where a valid contract covers the same subject matter; the contract is the primary source of obligations.",
      C: "Incorrect — Bhavna is not a volunteer; she paid money. The existence of a contract precludes unjust enrichment for a different reason.",
      D: "Incorrect — the two remedies are not mutually exclusive in all cases, but where a contract exists, the law prefers the contract remedy.",
    },
    wrong_answer_guidance: "Consider the relationship between contract and restitution. Typically, a claim for unjust enrichment is subsidiary; it fills gaps where no contract exists or is ineffective.",
  }),
});

// 5-7. Passage-mismatched standalone GK questions → detach to Quick Fire (standalone), per project rule
await apply('808beaf3-41e8-42d3-a011-317df4f6e109', 'CA 44th Amendment detached → Quick Fire', {
  passage_id: null,
  source: 'daily_quickfire',
});
await apply('a79ff30a-e138-48e6-8356-480e92951ea0', 'CA Article 53 detached → Quick Fire', {
  passage_id: null,
  source: 'daily_quickfire',
});
await apply('82aff0dd-601e-438a-8366-e21f1629bb74', 'CA Seventh Schedule detached → Quick Fire + explanation fixed', {
  passage_id: null,
  source: 'daily_quickfire',
  explanation: JSON.stringify({
    correct_answer_rationale: "Article 246 of the Constitution demarcates legislative subjects through the Seventh Schedule. Entry 1 of the Union List deals with 'Defence of India and every part thereof', including preparation for defence and related war activities. This exclusive competence ensures the Centre alone can enact laws on the armed forces.",
    incorrect_option_analysis: {
      A: "This is the correct answer — Entry 1, Union List covers 'Defence of India and every part thereof'.",
      B: "Entry 7 of the State List relates to prison administration and reformatories, not defence. The State List does not cover military affairs, which are reserved for the Union.",
      C: "The Concurrent List includes criminal law and preventive detention but has no defence or military entry; defence is not a concurrent subject at all.",
      D: "Incorrect — Entry 13 of the Union List relates to 'Participation in international conferences, associations and other bodies', not to defence powers, which are found in Entry 1.",
    },
    wrong_answer_guidance: "Remember that all armed forces, defence production and war-related matters fall under the Union List, specifically Entry 1. The State List has 'public order' and 'police', but not armies.",
  }),
});

// 8. b9f62f6b: ambiguous ICC question — A, B, C all valid; make D "All of the above"
await apply('b9f62f6b-6bd8-4748-bed5-9e860ae666cb', 'ICC jurisdiction options fixed (D = All of the above)', {
  options: {
    A: 'The crime must have been committed by a national of a state party to the Rome Statute',
    B: 'The crime must have been committed on the territory of a state party to the Rome Statute',
    C: 'The United Nations Security Council must refer the situation to the ICC',
    D: 'All of the above',
  },
  correct_option: 'D',
  explanation: 'Under the Rome Statute (Articles 12–13), the ICC can exercise jurisdiction when: (i) the accused is a national of a State Party; (ii) the crime occurred on the territory of a State Party; or (iii) the UN Security Council refers the situation to the ICC. Options A, B and C each state a valid jurisdictional basis, so the most complete and correct answer is D, "All of the above".',
});

// 9. dd7be5e0: answer-explanation mismatch — correct is B (state has competence over both land tax & agri income tax)
await apply('dd7be5e0-bb08-4306-9dfb-edec6e8c093a', 'Legal colourable land tax answer A→B + explanation fixed', {
  correct_option: 'B',
  explanation: JSON.stringify({
    correct_answer_rationale: "The doctrine of colourable legislation prevents a legislature from doing indirectly what it cannot do directly. Here, the state's 'land tax' on agricultural land — even if calculated by reference to the market value of crops — is in substance a tax on land and/or agricultural income. Both are State subjects: land taxes fall under Entry 49, List II and taxes on agricultural income under Entry 46, List II. Because the State is competent to impose either tax directly, there is no colourable exercise of power; the method of valuation and the purpose of the revenue do not change the constitutional character of the levy.",
    incorrect_option_analysis: {
      A: "Incorrect — taxing agricultural income is within the State's own competence (Entry 46, List II), so the fact that the tax is linked to crop value does not make it colourable.",
      B: "This is the correct answer — land tax is a State subject (Entry 49, List II) and the method of calculation does not change the nature of the tax, nor does the use of revenue.",
      C: "Incorrect — using land-tax revenue for industrial development does not invade the Union's domain; the purpose of expenditure does not determine legislative competence.",
      D: "Incorrect in reasoning — the levy is valid, but the reason is that the State has competence over both land tax and agricultural income tax, not merely that 'any tax on land' is permissible.",
    },
    wrong_answer_guidance: "Remember: colourable legislation arises only when a legislature does indirectly what it cannot do directly. If the legislature has direct competence over the true subject of the levy, there is no colourability.",
  }),
});

// ─── C) f69ba726 Quant UPI: passed but broken — options contain no correct answer (CAGR ≈ 171M)
await apply('f69ba726-1921-40e7-b347-d9e2c256995c', 'Quant UPI options rewritten (correct ~171M)', {
  options: {
    A: '126.67 million',
    B: '171 million',
    C: '200 million',
    D: '250 million',
  },
  correct_option: 'B',
  explanation: JSON.stringify({
    correct_answer_rationale: "The number of merchants grew from 20 million in FY 2021 to 100 million in FY 2024, a 5-fold increase over 3 years. Using the compound annual growth rate (CAGR), the annual growth factor is 5^(1/3) ≈ 1.71, i.e. about 71% per year. Applying this to FY 2024: 100 million × 1.71 ≈ 171 million merchants in FY 2025. Option B (171 million) is therefore correct.",
    incorrect_option_analysis: {
      A: "126.67 million is the result of adding the average absolute increase (80/3 ≈ 26.67 million per year) to 100 million — a linear projection, not the compound growth asked for.",
      B: "This is the correct answer — the CAGR projection gives ≈ 171 million.",
      C: "200 million overstates the projection; it would require a 100% annual growth rate.",
      D: "250 million overstates the projection; it would require a 150% annual growth rate.",
    },
    wrong_answer_guidance: "Use the compound annual growth rate formula (final/initial)^(1/n) − 1, then apply the growth factor to the latest year: 100 × 5^(1/3) ≈ 171 million.",
  }),
});

// ─── Set all 18 to 'pending' for re-validation ───
const allIds = [...Object.keys(dropE), '02c351f9-d812-4af0-8555-bba309b3270a', '1bfbec63-8632-4ed7-add3-687debe1330b', '236e55d5-f3c1-482c-a8eb-c0cd46d897ed', '39c537c5-3962-467e-843c-e4488fb3b6db', '808beaf3-41e8-42d3-a011-317df4f6e109', 'a79ff30a-e138-48e6-8356-480e92951ea0', '82aff0dd-601e-438a-8366-e21f1629bb74', 'b9f62f6b-6bd8-4748-bed5-9e860ae666cb', 'dd7be5e0-bb08-4306-9dfb-edec6e8c093a', 'f69ba726-1921-40e7-b347-d9e2c256995c'];
for (const id of allIds) {
  await patch(id, { validation_status: 'pending' });
}
console.log(`\n🔁 Set ${allIds.length} questions to pending for re-validation.`);
console.log(results.length + ' fixes applied.');
