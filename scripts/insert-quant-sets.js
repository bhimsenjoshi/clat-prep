// Insert remaining Quant sets (qt-set-003, qt-set-004, qt-set-005)
// Using deterministic UUIDs from human-readable IDs since the DB column is uuid type
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import crypto from 'crypto';

const env = readFileSync('.env', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(\S+)/)[1];
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(\S+)/)[1];
console.log('Connecting to:', url);

const supabase = createClient(url, key, {
  auth: { persistSession: false },
});

// Generate a deterministic UUID from a string (UUID v5 in the 'url' namespace)
function uuidFromId(id) {
  const ns = '1b671a64-40d5-491e-99b0-da01ff1f3341'; // our own namespace
  return crypto.createHash('md5').update(ns + id).digest('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
}

function parseSet(data) {
  const passageId = uuidFromId(data.id);
  
  const passage = {
    id: passageId,
    section: data.section,
    title: data.title,
    source: data.source || '',
    content: data.content,
    difficulty: data.difficulty || 'medium',
    created_at: data.created_at || new Date().toISOString(),
  };

  const questions = data.practice_questions.map((q, i) => ({
    id: uuidFromId(q.id),
    section: data.section,
    topic: q.topic || 'Data Interpretation',
    question_text: q.question_text,
    passage: null,
    options: q.options,
    correct_option: q.correct_option,
    explanation: typeof q.explanation === 'string' ? q.explanation : JSON.stringify(q.explanation),
    difficulty: data.difficulty || 'medium',
    source: 'daily',
    tags: q.tags || [],
    created_at: data.created_at || new Date().toISOString(),
    marks: q.marks || 1,
    negative_marks: q.negative_marks || 0.25,
    passage_id: passageId,
    question_number: q.question_number || (i + 1),
  }));

  return { passage, questions, humanId: data.id };
}

async function insertSet(data) {
  const { passage, questions, humanId } = parseSet(data);

  // Check if passage already exists
  const { data: existing } = await supabase
    .from('practice_passages')
    .select('id')
    .eq('id', passage.id)
    .maybeSingle();

  if (existing) {
    console.log(`⏭️  Passage ${humanId} already exists, skipping`);
  } else {
    const { error: pe } = await supabase
      .from('practice_passages')
      .insert(passage);
    if (pe) {
      console.error(`❌ Failed to insert passage ${humanId}:`, pe.message);
      return;
    }
    console.log(`✅ Inserted passage: ${humanId} → ${passage.id}`);
  }

  // Check existing questions
  const qIds = questions.map(q => q.id);
  const { data: existingQ } = await supabase
    .from('practice_questions')
    .select('id')
    .in('id', qIds);

  const existingIds = new Set((existingQ || []).map(r => r.id));
  const toInsert = questions.filter(q => !existingIds.has(q.id));

  for (const q of toInsert) {
    const { error: qe } = await supabase
      .from('practice_questions')
      .insert(q);
    if (qe) {
      console.error(`❌ Failed to insert question ${q.id}:`, qe.message);
    } else {
      const humanQId = data.practice_questions.find(pq => uuidFromId(pq.id) === q.id)?.id || q.id;
      console.log(`  ✅ Question ${humanQId}`);
    }
  }

  console.log(`📊 ${toInsert.length}/${questions.length} questions inserted for ${humanId}`);
}

// --- DATA ---
const sets = [
  {
    "id": "qt-set-003-fintech",
    "section": "Quantitative Techniques",
    "title": "Digital Banking Lending Portfolios",
    "source": "Neo-Banking Credit Risk Registry",
    "content": "A digital lending startup extends short-term lines of credit through Micro loans, Consumer Durable financing, and Peer-to-Peer (P2P) consolidation models. The aggregate outstanding portfolio assets value is ₹500 Crores. Micro loans comprise precisely 30% of the aggregate value. The remaining active portfolio space is distributed between Consumer Durable assets and P2P lines. The volume of outstanding P2P consolidation assets is exactly ₹50 Crores less than the Consumer Durable line value. The annualized non-performing asset (NPA) percentages tracking systemic default are identified as follows: 6% for Micro loans, 4% for Consumer Durable financing, and 10% for P2P models.",
    "difficulty": "medium",
    "created_at": "2026-07-16T10:10:00.000000+00:00",
    "practice_questions": [
      {"id":"qt-q301","tags":["algebra","finance"],"marks":1,"topic":"Data Interpretation","options":{"A":"₹150 Crores","B":"₹200 Crores","C":"₹250 Crores","D":"₹300 Crores"},"question_text":"Determine the exact value of the outstanding asset pool allocated specifically to the Consumer Durable financing vertical within the neo-banking enterprise.","correct_option":"B","negative_marks":0.25,"question_number":1,"explanation":JSON.stringify({"correct_answer_rationale":"Total outstanding = 500 Crores. Micro loans = 30% of 500 = 150 Crores. Balance = 350 Crores. Consumer Durable (X) + P2P (X - 50) = 350 => 2X = 400 => X = 200 Crores.","incorrect_option_analysis":{"A":"P2P or Micro segment value.","C":"Plain division ignoring parameters.","D":"Exceeds parameter boundaries."},"wrong_answer_guidance":"Deduct Micro loan values from asset base before constructing variable equation."})},
      {"id":"qt-q302","tags":["percentages"],"marks":1,"topic":"Data Interpretation","options":{"A":"₹15 Crores","B":"₹24 Crores","C":"₹32 Crores","D":"₹40 Crores"},"question_text":"Calculate the cumulative value of Non-Performing Assets (NPAs) across all three lending verticals combined.","correct_option":"C","negative_marks":0.25,"question_number":2,"explanation":JSON.stringify({"correct_answer_rationale":"Micro NPA = 6% of 150 = 9 Cr. Consumer Durable NPA = 4% of 200 = 8 Cr. P2P NPA = 10% of 150 = 15 Cr. Total = 9+8+15 = 32 Cr.","incorrect_option_analysis":{"A":"Only P2P NPA.","B":"Calculation error.","D":"Unweighted summation error."},"wrong_answer_guidance":"Calculate each vertical's NPA individually, then sum."})},
      {"id":"qt-q303","tags":["ratios"],"marks":1,"topic":"Data Interpretation","options":{"A":"3:4","B":"4:3","C":"1:1","D":"5:3"},"question_text":"What is the ratio of Micro loans to P2P consolidation assets?","correct_option":"C","negative_marks":0.25,"question_number":3,"explanation":JSON.stringify({"correct_answer_rationale":"Micro = 150 Cr. P2P = 150 Cr. Ratio = 150:150 = 1:1.","incorrect_option_analysis":{"A":"Micro:Consumer Durable.","B":"Inverted relationship.","D":"Erroneous split."},"wrong_answer_guidance":"Find absolute values for both, then simplify ratio."})},
      {"id":"qt-q304","tags":["percentages"],"marks":1,"topic":"Data Interpretation","options":{"A":"5.60%","B":"6.40%","C":"6.67%","D":"8.00%"},"question_text":"What is the weighted average NPA percentage across the entire ₹500 Crore portfolio?","correct_option":"B","negative_marks":0.25,"question_number":4,"explanation":JSON.stringify({"correct_answer_rationale":"Total NPA = 32 Cr. Base = 500 Cr. Weighted = (32/500)*100 = 6.4%.","incorrect_option_analysis":{"A":"Computational variance.","C":"Simple mean (6+4+10)/3 = 6.67% — wrong.","D":"Overshoot."},"wrong_answer_guidance":"Use total NPA value over total portfolio, not unweighted average of percentages."})},
      {"id":"qt-q305","tags":["percentages"],"marks":1,"topic":"Data Interpretation","options":{"A":"₹45 Crores","B":"₹57 Crores","C":"₹65 Crores","D":"₹75 Crores"},"question_text":"Absolute difference between performing (non-NPA) assets in Consumer Durable vs P2P?","correct_option":"B","negative_marks":0.25,"question_number":5,"explanation":JSON.stringify({"correct_answer_rationale":"Consumer Durable performing = 200-8 = 192 Cr. P2P performing = 150-15 = 135 Cr. Difference = 57 Cr.","incorrect_option_analysis":{"A":"Pre-default comparison.","C":"Subtraction error.","D":"Wrong parameters."},"wrong_answer_guidance":"Deduct NPAs from each vertical first, then find difference."})},
      {"id":"qt-q306","tags":["percentages"],"marks":1,"topic":"Data Interpretation","options":{"A":"15.00%","B":"20.00%","C":"25.00%","D":"33.33%"},"question_text":"If ₹50 Cr of P2P is written off, what % of remaining portfolio is Micro loans?","correct_option":"D","negative_marks":0.25,"question_number":6,"explanation":JSON.stringify({"correct_answer_rationale":"New base = 500-50 = 450 Cr. Micro = 150 Cr. % = (150/450)*100 = 33.33%.","incorrect_option_analysis":{"A":"Misaligned ratio.","B":"Static metrics without adjustment.","C":"Wrong subset."},"wrong_answer_guidance":"Recalculate using new denominator of 450 Crores."})}
    ]
  },
  {
    "id": "qt-set-004-renewables",
    "section": "Quantitative Techniques",
    "title": "Clean Energy Grid Distribution Matrix",
    "source": "Central Electricity Regulatory Commission Data",
    "content": "An integrated power transmission enterprise monitors generation across four primary installations: Solar Arrays, Wind Farms, Biomass Plants, and Hydroelectric Stations. The composite daily generation capacity stands at 16,000 Megawatt-hours (MWh). Hydroelectric generation represents 20% of this total capacity. The remaining volume of daily generation is distributed among Solar, Wind, and Biomass installations in the absolute ratio of 5:2:1 respectively. The operational internal consumption costs (transmission losses) within the facilities run at 4% for Solar Arrays, 5% for Wind Farms, 8% for Biomass Plants, and 2.5% for Hydroelectric Stations.",
    "difficulty": "medium",
    "created_at": "2026-07-16T10:15:00.000000+00:00",
    "practice_questions": [
      {"id":"qt-q401","tags":["ratios","averages"],"marks":1,"topic":"Data Interpretation","options":{"A":"5.00:1.00","B":"5.21:1.00","C":"8.00:3.00","D":"10.00:3.00"},"question_text":"Ratio of net transmission (after losses) from Solar Arrays to Biomass Plants?","correct_option":"B","negative_marks":0.25,"question_number":1,"explanation":JSON.stringify({"correct_answer_rationale":"Total=16,000 MWh. Hydro=3,200. Balance=12,800. 5:2:1 → Solar=8,000, Wind=3,200, Biomass=1,600. Net Solar=7,680. Net Biomass=1,472. Ratio=7,680:1,472=5.21:1.","incorrect_option_analysis":{"A":"Gross ratio ignoring losses.","C":"Factoring Hydro incorrectly.","D":"Rounding error."},"wrong_answer_guidance":"Subtract losses before computing ratio."})},
      {"id":"qt-q402","tags":["percentages"],"marks":1,"topic":"Data Interpretation","options":{"A":"320 MWh","B":"440 MWh","C":"512 MWh","D":"688 MWh"},"question_text":"Cumulative daily transmission loss (MWh) across all four installations?","correct_option":"D","negative_marks":0.25,"question_number":2,"explanation":JSON.stringify({"correct_answer_rationale":"Solar loss=320, Wind loss=160, Biomass loss=128, Hydro loss=80. Total=688 MWh.","incorrect_option_analysis":{"A":"Solar only.","B":"Omission error.","C":"Selective indices."},"wrong_answer_guidance":"Multiply each capacity by loss%, then sum."})},
      {"id":"qt-q403","tags":["percentages"],"marks":1,"topic":"Data Interpretation","options":{"A":"3.50%","B":"4.30%","C":"4.88%","D":"6.00%"},"question_text":"Overall average transmission loss % across the entire network?","correct_option":"B","negative_marks":0.25,"question_number":3,"explanation":JSON.stringify({"correct_answer_rationale":"Total losses=688 MWh. Base=16,000. % = (688/16,000)*100 = 4.3%.","incorrect_option_analysis":{"A":"Computation error.","C":"Simple mean (4+5+8+2.5)/4=4.875% — wrong.","D":"Overshoot."},"wrong_answer_guidance":"Divide total losses by total capacity, not average of percentages."})},
      {"id":"qt-q404","tags":["averages"],"marks":1,"topic":"Data Interpretation","options":{"A":"2,840 MWh","B":"3,000 MWh","C":"3,828 MWh","D":"4,000 MWh"},"question_text":"Average net generation per station (after losses) across all four?","correct_option":"C","negative_marks":0.25,"question_number":4,"explanation":JSON.stringify({"correct_answer_rationale":"Net total=16,000-688=15,312 MWh. Avg=15,312/4=3,828 MWh.","incorrect_option_analysis":{"A":"Excludes Hydro.","B":"Uniform estimate.","D":"Gross capacity mean."},"wrong_answer_guidance":"Find net total first, then divide by 4 stations."})},
      {"id":"qt-q405","tags":["percentages"],"marks":1,"topic":"Data Interpretation","options":{"A":"640 MWh","B":"1,200 MWh","C":"1,440 MWh","D":"80 MWh"},"question_text":"Absolute difference in net generation between Wind Farms and Hydroelectric Stations?","correct_option":"D","negative_marks":0.25,"question_number":5,"explanation":JSON.stringify({"correct_answer_rationale":"Net Wind=3,040 MWh. Net Hydro=3,120 MWh. Diff=80 MWh.","incorrect_option_analysis":{"A":"Gross values.","B":"Arithmetic error.","C":"Wrong capacity indicator."},"wrong_answer_guidance":"Find net values for each, then subtract."})},
      {"id":"qt-q406","tags":["percentages"],"marks":1,"topic":"Data Interpretation","options":{"A":"25.00%","B":"40.00%","C":"146.15%","D":"200.00%"},"question_text":"By what % does net Solar generation exceed net Hydro generation?","correct_option":"C","negative_marks":0.25,"question_number":6,"explanation":JSON.stringify({"correct_answer_rationale":"Net Solar=7,680 MWh. Net Hydro=3,120 MWh. Excess%=((7,680-3,120)/3,120)*100=146.15%.","incorrect_option_analysis":{"A":"Wrong proportion.","B":"Gross inputs.","D":"Flat estimate."},"wrong_answer_guidance":"Use net Hydro (3,120 MWh) as denominator."})}
    ]
  },
  {
    "id": "qt-set-005-agri",
    "section": "Quantitative Techniques",
    "title": "Agricultural Output and Export Logistics",
    "source": "APEDA Export Monitoring Cell",
    "content": "An agricultural cooperative handles the logistical clearance of 24,000 metric tonnes (MT) of grain grains divided into Basmati Rice, Non-Basmati Rice, and Wheat. The share of Wheat constitutes exactly one-third of the complete logistical inventory volume. The remaining transactional volume is distributed between Basmati Rice and Non-Basmati Rice such that the total tonnage of Non-Basmati Rice is precisely 60% of the combined rice infrastructure pool. Quality compliance audits reject certain sub-components before sea border shipping: 2% of Basmati volumes are flagged, 5% of Non-Basmati volumes are flagged, and 3.5% of the primary Wheat inventory fails compliance criteria.",
    "difficulty": "hard",
    "created_at": "2026-07-16T10:20:00.000000+00:00",
    "practice_questions": [
      {"id":"qt-q501","tags":["percentages","ratios"],"marks":1,"topic":"Data Interpretation","options":{"A":"480 MT","B":"608 MT","C":"888 MT","D":"23,112 MT"},"question_text":"Total volume (MT) that clears compliance and is certified for export?","correct_option":"D","negative_marks":0.25,"question_number":1,"explanation":JSON.stringify({"correct_answer_rationale":"Total=24,000. Wheat=8,000. Rice=16,000. Non-Basmati=9,600. Basmati=6,400. Rejections: Basmati=128, Non-Basmati=480, Wheat=280. Total reject=888. Net=24,000-888=23,112 MT.","incorrect_option_analysis":{"A":"Non-Basmati reject only.","B":"Partial subset.","C":"Total rejections (not clear volume)."},"wrong_answer_guidance":"Deduct total rejections from total inventory."})},
      {"id":"qt-q502","tags":["percentages"],"marks":1,"topic":"Data Interpretation","options":{"A":"3.70%","B":"4.20%","C":"4.90%","D":"5.50%"},"question_text":"% of total inventory that fails compliance and is rejected?","correct_option":"A","negative_marks":0.25,"question_number":2,"explanation":JSON.stringify({"correct_answer_rationale":"Rejections=888 MT. Base=24,000 MT. %=(888/24,000)*100=3.7%.","incorrect_option_analysis":{"B":"Balance formatting error.","C":"Intermediate coefficient error.","D":"Scale estimation error."},"wrong_answer_guidance":"Divide total rejections by total supply, not unweighted average of rejection rates."})},
      {"id":"qt-q503","tags":["ratios"],"marks":1,"topic":"Data Interpretation","options":{"A":"2:3","B":"3:2","C":"4:3","D":"5:4"},"question_text":"Ratio of Basmati Rice to Non-Basmati Rice?","correct_option":"A","negative_marks":0.25,"question_number":3,"explanation":JSON.stringify({"correct_answer_rationale":"Basmati=6,400 MT. Non-Basmati=9,600 MT. Ratio=6,400:9,600=2:3.","incorrect_option_analysis":{"B":"Inverted.","C":"Fraction division error.","D":"Parameter mismatch."},"wrong_answer_guidance":"Find both rice volumes, then simplify ratio."})},
      {"id":"qt-q504","tags":["percentages"],"marks":1,"topic":"Data Interpretation","options":{"A":"50.00%","B":"100.00%","C":"120.00%","D":"150.00%"},"question_text":"By what % does Non-Basmati rejection rate exceed Basmati rejection rate?","correct_option":"D","negative_marks":0.25,"question_number":4,"explanation":JSON.stringify({"correct_answer_rationale":"Non-Basmati=5%. Basmati=2%. Excess%=((5-2)/2)*100=150%.","incorrect_option_analysis":{"A":"Wrong fractional base.","B":"Absolute subtraction instead of %.","C":"Arithmetic error."},"wrong_answer_guidance":"Use Basmati rejection rate (2%) as denominator."})},
      {"id":"qt-q505","tags":["percentages"],"marks":1,"topic":"Data Interpretation","options":{"A":"200 MT","B":"252 MT","C":"352 MT","D":"480 MT"},"question_text":"Absolute difference in rejected volume between Non-Basmati Rice and Wheat?","correct_option":"A","negative_marks":0.25,"question_number":5,"explanation":JSON.stringify({"correct_answer_rationale":"Non-Basmati reject=480 MT. Wheat reject=280 MT. Diff=200 MT.","incorrect_option_analysis":{"B":"Misaligned weights.","C":"Subtraction error.","D":"Non-Basmati reject only."},"wrong_answer_guidance":"Subtract Wheat reject mass from Non-Basmati reject mass."})},
      {"id":"qt-q506","tags":["averages"],"marks":1,"topic":"Data Interpretation","options":{"A":"252 MT","B":"296 MT","C":"312 MT","D":"380 MT"},"question_text":"Average rejected volume per category across all three groups?","correct_option":"B","negative_marks":0.25,"question_number":6,"explanation":JSON.stringify({"correct_answer_rationale":"Total reject=128+480+280=888 MT. Avg=888/3=296 MT.","incorrect_option_analysis":{"A":"Omits Basmati.","C":"Summation error.","D":"Round approximation."},"wrong_answer_guidance":"Sum all rejections, then divide by 3 categories."})}
    ]
  }
];

async function main() {
  for (const set of sets) {
    console.log(`\n🚀 Processing: ${set.id} — ${set.title}`);
    await insertSet(set);
  }
  console.log('\n✅ All 3 sets processed!');
}

main().catch(console.error);
