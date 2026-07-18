#!/usr/bin/env node
/**
 * Daily Question Generator — Zero-dependency Cron Executable
 *
 * Generates CLAT-realistic passage-based questions matching the official CLAT 2025 format.
 * Each section: 1 passage → 6 questions (matches real CLAT exactly).
 * Questions linked to passages via practice_passages table with metadata
 * (marks=1, negative_marks=0.25, question_number).
 *
 * Quality standards enforced via prompts:
 * - English Language: inference/interpretation/tone questions only — NO direct recall
 * - Current Affairs: editorial/analysis passages — NO trivia questions
 * - Legal Reasoning: principle application, fact-pattern analysis
 * - Logical Reasoning: strengthen/weaken/assumption/inference
 * - Quantitative Techniques: data interpretation with clean numbers
 *
 * Uses Node 18+ built-in fetch for both DeepSeek API and Supabase REST API.
 * No npm install needed.
 *
 * Usage: node scripts/daily-questions-cron.mjs
 * Requires env: SUPABASE_SERVICE_ROLE_KEY, DEEPSEEK_API_KEY,
 *               NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ─── Load .env file for cron context ───
const scriptDir = dirname(fileURLToPath(import.meta.url));
const envPaths = [
  resolve(scriptDir, '..', '.env'),
  resolve(scriptDir, '.env'),
];
for (const envPath of envPaths) {
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
    break;
  }
}

// ─── Dynamic import of validator for post-generation check ───
let validatePendingQuestions = null;

// ─── Topic bank mapping ───
const TOPIC_BANK_FILES = {
  'English Language': 'topic-bank-english.json',
  'Current Affairs Including General Knowledge': 'topic-bank-current-affairs.json',
  'Legal Reasoning': 'topic-bank-legal.json',
  'Logical Reasoning': 'topic-bank-logical.json',
};

// ─── Load a topic bank JSON file ───
function loadTopicBank(section) {
  const filename = TOPIC_BANK_FILES[section];
  if (!filename) return null;
  const filepath = resolve(scriptDir, filename);
  if (!existsSync(filepath)) return null;
  return JSON.parse(readFileSync(filepath, 'utf-8'));
}

// ─── Pick the next unused topic for a section from the topic bank ───
async function pickNextTopic(section) {
  const bank = loadTopicBank(section);
  if (!bank || bank.length === 0) return null;

  // Fetch already-used indices from the tracker (sorted by bank_index)
  const baseUrl = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/topic_tracker`;
  const usedUrl = `${baseUrl}?section=eq.${encodeURIComponent(section)}&select=bank_index&order=bank_index`;
  const usedData = await supabaseGet(usedUrl);
  
  const usedIndices = new Set((usedData || []).map(r => r.bank_index));

  // Find the first unused index
  for (let i = 0; i < bank.length; i++) {
    if (!usedIndices.has(i)) {
      return { index: i, topic: bank[i] };
    }
  }

  // All topics used — reset (cycle back)
  console.log(`    🔄 All ${bank.length} topics used for ${section}. Resetting cycle.`);
  return { index: 0, topic: bank[0] };
}

const SECTIONS = ['English Language', 'Current Affairs Including General Knowledge', 'Legal Reasoning', 'Logical Reasoning'];
const QS_PER_PASSAGE = 6;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY || '';

const SUPABASE_HEADERS = {
  'Content-Type': 'application/json',
  'apikey': ANON_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
};

// ─── DeepSeek API ───

async function callDeepSeek(systemPrompt, userPrompt, retries = 2) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-v4-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 16384,
          response_format: { type: 'json_object' },
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        if (attempt < retries) {
          console.log(`    ⚠️ DeepSeek error ${res.status} (attempt ${attempt}) — retrying...`);
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
        throw new Error(`DeepSeek error ${res.status}: ${text}`);
      }

      const data = await res.json();
      const raw = data?.choices?.[0]?.message?.content;
      if (!raw) throw new Error('Empty DeepSeek response');

      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try { parsed = JSON.parse(jsonMatch[0]); } catch {
            throw new Error('Failed to parse AI response as JSON');
          }
        } else {
          throw new Error('Failed to parse AI response as JSON');
        }
      }

      return {
        passageData: parsed.passage || null,
        questions: parsed.questions || (Array.isArray(parsed) ? parsed : [parsed]),
      };
    } catch (err) {
      if (attempt < retries) {
        console.log(`    ⚠️ Attempt ${attempt} failed: ${err.message} — retrying...`);
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
      throw err;
    }
  }
}

// ─── Supabase REST helpers ───

async function supabaseInsert(table, rows) {
  if (!rows || rows.length === 0) return [];
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${table}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { ...SUPABASE_HEADERS, 'Prefer': 'return=representation' },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase error inserting ${table}: ${res.status}: ${text}`);
  }
  return await res.json();
}

async function supabaseGet(url) {
  const res = await fetch(url, { headers: SUPABASE_HEADERS });
  if (!res.ok) throw new Error(`Supabase error GET: ${res.status}: ${await res.text()}`);
  return await res.json();
}

// ─── Normalise a question from AI response ───

function normalise(q, passageId, questionNumber) {
  let question_text = q.question_text || q.question;
  const correct_answer = q.correct_option || q.correct_answer || q.correctAnswer || q.answer;
  let options = q.options;

  if (!question_text && q.passage) {
    const sentences = q.passage.match(/[^.!?]+[.!?]/g);
    question_text = (sentences && sentences[0]) ? sentences[0].trim() : q.passage.substring(0, 150);
  }

  if (!question_text || !options || !correct_answer) return null;

  let parsedOptions = options;
  if (typeof parsedOptions === 'string') {
    try { parsedOptions = JSON.parse(parsedOptions); } catch { return null; }
  }
  if (Array.isArray(parsedOptions)) {
    const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
    const obj = {};
    parsedOptions.forEach((opt, i) => { if (i < labels.length) obj[labels[i]] = String(opt); });
    parsedOptions = obj;
  }

  // If correct_answer is a value (not a label), convert to label
  let resolvedAnswer = String(correct_answer);
  if (parsedOptions && typeof parsedOptions === 'object' && !['A','B','C','D','E','F'].includes(resolvedAnswer)) {
    for (const [label, value] of Object.entries(parsedOptions)) {
      if (String(value).trim() === resolvedAnswer.trim()) {
        resolvedAnswer = label;
        break;
      }
    }
  }

  const passage = q.passage || null;

  return {
    question_text,
    passage: passageId ? null : passage,
    options: typeof parsedOptions === 'object' ? parsedOptions : {},
    correct_option: resolvedAnswer,
    explanation: q.explanation || null,
    difficulty: (q.difficulty || 'medium').toLowerCase(),
    source: 'daily',
    marks: q.marks ?? 1,
    negative_marks: q.negative_marks ?? 0.25,
    question_number: questionNumber,
    passage_id: passageId || null,
    tags: q.tags || [],
  };
}

// ─── Build AI prompts for passage-based generation ───

function buildPassagePrompt(section) {
  const prompts = {
    'English Language': `You are a CLAT English Language expert. Generate a reading comprehension passage (300-450 words) — use a well-written excerpt on a topic like philosophy, literature, science, or society (not a news article). The passage must be substantial enough for deep analysis.

Follow exactly with ${QS_PER_PASSAGE} questions. CRITICAL RULES for the questions:
|- NO "According to the passage, what did X say/do?" — these are banned
|- NO "what is X according to the passage" — banned
|- CRITICAL: NEVER copy-paste a sentence from the passage as question_text. Every question_text must be a DISTINCT, SYNTHESISED query that reformulates the passage content in new language. Think of it like a teacher writing a fresh exam question — not quoting the textbook.
|- Questions must test: inference, author's tone/attitude, word meaning IN CONTEXT, implied meaning, the author would most likely agree/disagree with, purpose of a reference, what can be inferred, logical extension of the argument
|- At least 2 questions should involve the author's opinion, attitude, or intent
|- Include 1 vocabulary-in-context question
|- Options must be nuanced — not trivially right/wrong

EXPLANATION FORMAT — Each explanation MUST be structured as follows:
  "explanation": {
    "correct_answer_rationale": "Brief paragraph explaining why the correct answer is right — reference evidence from the passage and logical reasoning.",
    "incorrect_option_analysis": {
      "A": "Why option A is wrong — mention the specific mistake or trap.",
      "B": "Why option B is wrong — mention the specific mistake or trap.",
      "C": "Why option C is wrong — mention the specific mistake or trap.",
      "D": "Why option D is wrong — mention the specific mistake or trap."
    },
    "wrong_answer_guidance": "If the student answered incorrectly, a 1-2 sentence pointer guiding them to re-read or reconsider the relevant part of the passage."
  }

Return JSON with:
  - "passage": { "title": "Short title", "content": "The passage text", "source": "Source or 'Original for CLATly'", "difficulty": "easy|medium|hard" }
  - "questions": array of ${QS_PER_PASSAGE} objects, each with:
    - "question_text": string (must NOT start with "According to the passage" — must be a distinct reformulation, NOT a passage excerpt)
    - "options": object with keys A,B,C,D and string values
    - "correct_answer": "A"
    - "explanation": object with the structured format above
    - "difficulty": "easy|medium|hard"
    - "tags": array of topic strings`,

    'Current Affairs Including General Knowledge': `You are a CLAT Current Affairs & GK expert. Generate a current affairs passage (250-400 words) in the style of an editorial or analytical opinion piece — NOT a news report. The passage should present an analysis of a significant recent issue (economy, policy, international relations, technology, environment — 2025-2026).

Follow exactly with ${QS_PER_PASSAGE} questions. CRITICAL RULES:
||- NO trivia questions (dates, launch sites, names of schemes, abbreviations) — these are BANNED
||- NO "Where was X launched" / "When did X happen" / "Who is the head of X"
||- EXTERNAL PENALTY: The answer to any Current Affairs multiple-choice question must NOT be present as a substring or direct logical derivation within the text passage. Every question must require external historical, legal, or institutional factual knowledge to answer correctly.
||- CRITICAL: NEVER copy-paste a sentence from the passage as question_text. Every question_text must be a DISTINCT, SYNTHESISED query that reformulates the passage content in new language. Do not quote the passage — write fresh questions.
||- Questions must test: knowledge of related constitutional provisions, past international agreements, institutional structures, landmark judgments, or historical context relevant to the passage topic.

EXPLANATION FORMAT — Each explanation MUST be structured as follows:
  "explanation": {
    "correct_answer_rationale": "Brief paragraph explaining why the correct answer is right — reference the external factual knowledge (not the passage) that confirms it.",
    "incorrect_option_analysis": {
      "A": "Why option A is wrong — mention the specific factual error or common misconception.",
      "B": "Why option B is wrong — mention the specific factual error or common misconception.",
      "C": "Why option C is wrong — mention the specific factual error or common misconception.",
      "D": "Why option D is wrong — mention the specific factual error or common misconception."
    },
    "wrong_answer_guidance": "If the student answered incorrectly, a 1-2 sentence pointer guiding them to recall the relevant external GK fact they should know."
  }

Return JSON with:
  - "passage": { "title": "Short title", "content": "The passage text (editorial/analysis style)", "source": "Source or 'Original for CLATly'", "difficulty": "easy|medium|hard" }
  - "questions": array of ${QS_PER_PASSAGE} objects (same format as above — with explanation as structured object)`,

    'Legal Reasoning': `You are a CLAT Legal Reasoning expert. Generate exactly 1 legal scenario passage (250-450 words) presenting a legal principle (from contract, tort, criminal law, constitution) followed by a fact pattern. Follow exactly with ${QS_PER_PASSAGE} questions.

Questions must test: application of the legal principle to variations of the fact pattern, distinctions between similar legal concepts, exceptions to the rule, which party wins and why. At least 3 questions should present hypothetical variations ("what if...") that require applying the principle to new facts.

CRITICAL: NEVER copy-paste the legal principle or passage text as question_text. Every question_text must be a DISTINCT, SYNTHESISED query that presents a fresh hypothetical scenario in new language.

EXPLANATION FORMAT — Each explanation MUST be structured as follows:
  "explanation": {
    "correct_answer_rationale": "Brief paragraph explaining why the correct answer is right — apply the legal principle to the facts.",
    "incorrect_option_analysis": {
      "A": "Why option A is wrong — identify the legal error or misapplication.",
      "B": "Why option B is wrong — identify the legal error or misapplication.",
      "C": "Why option C is wrong — identify the legal error or misapplication.",
      "D": "Why option D is wrong — identify the legal error or misapplication."
    },
    "wrong_answer_guidance": "If the student answered incorrectly, a 1-2 sentence pointer guiding them to reconsider which legal principle applies and why."
  }

Return JSON with:
  - "passage": { "title": "Legal principle title", "content": "The passage text with legal principle and facts", "source": "Legal principle or 'Original for CLATly'", "difficulty": "easy|medium|hard" }
  - "questions": array of ${QS_PER_PASSAGE} objects (same format as above — with explanation as structured object)`,

    'Logical Reasoning': `Role: Senior Item Writer for GMAT/CLAT Critical Reasoning.

Core Generation Workflow:
1. PASSAGE ANATOMY BREAKDOWN: Write a passage arguing a specific point of view on a policy, economic theory, or social trend. Before drafting questions, explicitly map out:
   - The Central Conclusion: [State it in one sentence]
   - Key Premises: [List the supporting evidence provided in the text]
   - Unstated Assumptions: [Identify the logical leaps the author makes]
2. QUESTION TYPES: Draft exactly ${QS_PER_PASSAGE} questions targeting these archetypes (distribute across all 6):
   - Assumption Identification: Find the unstated link required for the conclusion to stand.
   - Weaken the Argument: Introduce a new fact that attacks the unstated assumption.
   - Strengthen the Argument: Introduce a fact that solidifies the assumption.
   - Inference/Must be True: A conclusion that can be logically derived *solely* from the premises, without any external knowledge.
   - Main Conclusion/Purpose: Identify the author's central claim or the role of a specific statement.
   - Flaw in Reasoning: Spot the logical error in the argument structure.
3. DISTRACTOR RULES — every incorrect option must fall into one of these categories:
   - Out of Scope: Introduces realistic, true real-world ideas that are completely absent from the text.
   - Direct Reversal: Does the exact opposite of what is requested (e.g. strengthens when asked to weaken).
   - Extreme Language: Uses absolute words ("never", "always", "entirely") when the passage relies on qualified arguments.
4. CRITICAL: NEVER copy-paste a statement from the passage as question_text. Every question_text must be a DISTINCT query that tests reasoning about the argument — not quoting it.

EXPLANATION FORMAT — Each explanation MUST be structured as follows:
  "explanation": {
    "correct_answer_rationale": "Explain why the correct answer is right — reference the Central Conclusion, Premises, or Unstated Assumptions identified in step 1.",
    "incorrect_option_analysis": {
      "A": "Why option A is wrong — identify which distractor rule it follows (Out of Scope / Direct Reversal / Extreme Language) and why it doesn't work.",
      "B": "Why option B is wrong — identify which distractor rule it follows and why it doesn't work.",
      "C": "Why option C is wrong — identify which distractor rule it follows and why it doesn't work.",
      "D": "Why option D is wrong — identify which distractor rule it follows and why it doesn't work."
    },
    "wrong_answer_guidance": "If the student answered incorrectly, a 1-2 sentence pointer guiding them to re-examine which part of the argument (conclusion, premise, or assumption) they missed."
  }

Return JSON with:
  - "passage": { "title": "Short title", "content": "The passage text", "source": "Source or 'Original for CLATly'", "difficulty": "easy|medium|hard" }
  - "questions": array of ${QS_PER_PASSAGE} objects (same format as above — with explanation as structured object)`,

    'Quantitative Techniques': `You are a CLAT Quantitative Techniques content creator. Generate exactly 1 data interpretation passage with ${QS_PER_PASSAGE} questions. The passage must present numerical data embedded in narrative prose (NOT a raw table) with 3-4 categories and 2-3 relationship constraints. Data MUST be clean whole numbers.

REQUIRED STRUCTURE — each passage must follow this pattern:
1. Declare a TOTAL figure (e.g., "total production = 20,000 units")
2. Assign percentages/ratios for first 1-2 categories (e.g., "ICE = 40% of total")
3. Distribute remaining volume across 2-3 other categories using a RATIO or algebraic relationship (e.g., "EV:HEV = 3:2", or "P2P = Consumer Durable - ₹50 Cr")
4. Apply a condition, filter, or loss rate to each category (e.g., "5% of Metro Core bandwidth encounters data drop anomalies")
5. Questions must require: percentage change, compound ratios, weighted averages, difference-based inference, or multi-step algebra

PASSAGE STYLE — narrative prose embedding all data relationships, e.g.:
"A prominent Indian automotive manufacturing ecosystem tracked its multi-tier vehicle dispatches across three primary variants... The cumulative production run for the financial cycle totaled exactly 20,000 units. The structural ratio of total EV units to total HEV units deployed across all matrices was firmly established at 3:2."

GOOD EXAMPLE TOPICS (use these):
- EV/HEV/ICE production with distribution channels
- Telecom bandwidth by node type with drop rates
- Banking loan portfolio segments with NPA rates
- Energy grid generation by source with transmission losses
- Agricultural inventory by crop type with quality rejections
- Student enrollment by stream with pass/fail rates
- Budget allocation across departments with utilization rates

CRITICAL: NEVER copy-paste a data value directly as question_text. Every question must require computation — not a direct read.

EXPLANATION FORMAT — Each explanation MUST be structured as follows:
  "explanation": {
    "correct_answer_rationale": "Show the exact step-by-step calculation. Include formulas and intermediate values.",
    "incorrect_option_analysis": {
      "A": "Why option A is wrong — identify the computational mistake or data misinterpretation.",
      "B": "Why option B is wrong — identify the computational mistake or data misinterpretation.",
      "C": "Why option C is wrong — identify the computational mistake or data misinterpretation.",
      "D": "Why option D is wrong — identify the computational mistake or data misinterpretation."
    },
    "wrong_answer_guidance": "If the student answered incorrectly, a 1-2 sentence pointer showing the correct formula or which data to use."
  }

Return JSON with:
  - "passage": { "title": "Data set title", "content": "Narrative passage embedding all data relationships", "source": "Adapted from CLAT-style data set", "difficulty": "easy|medium|hard" }
  - "questions": array of ${QS_PER_PASSAGE} objects (same format as above — with explanation as structured object)`,
  };
  return prompts[section] || prompts['English Language'];
}

// ─── Main ───

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY || !ANON_KEY) {
    console.log('❌ Supabase env vars not set');
    process.exit(1);
  }
  if (!DEEPSEEK_KEY) {
    console.log('❌ DEEPSEEK_API_KEY not set');
    process.exit(1);
  }

  console.log(`📅 Generating 1 passage + ${QS_PER_PASSAGE} questions per section (${SECTIONS.length} sections)...`);
  let totalPassages = 0;
  let totalQuestions = 0;

  for (const section of SECTIONS) {
    try {
      console.log(`  → ${section}...`);

      // Step 0: Pick the next unused topic from the topic bank
      const topicPick = await pickNextTopic(section);
      let topicInstruction = '';
      if (topicPick) {
        topicInstruction = `\n\nTOPIC TO COVER (first time this topic is being used): "${topicPick.topic.title}" (domain: ${topicPick.topic.domain}). CRITICAL: You MUST write a passage on EXACTLY this topic. Choose your own unique angle within this topic.`;
        console.log(`    📋 Topic from bank: "${topicPick.topic.title}" (#${topicPick.index})`);
      }

      // Step 1: Call AI for passage + questions together — with topic guidance
      const { passageData, questions: rawQuestions } = await callDeepSeek(
        buildPassagePrompt(section),
        `Generate 1 passage and ${QS_PER_PASSAGE} CLAT practice questions for the "${section}" section.${topicInstruction}`
      );

      if (!rawQuestions || rawQuestions.length === 0) {
        console.log(`    ⚠️ No questions generated`);
        continue;
      }

      // Step 2: Check for duplicate passage content before inserting
      let passageId = null;
      let finalPassageData = passageData;
      let finalQuestions = rawQuestions;
      if (!finalPassageData || !finalPassageData.content) {
        console.log(`    ⚠️ No passage returned by AI — retrying section "${section}" once...`);
        const retry = await callDeepSeek(
          buildPassagePrompt(section),
          `Generate 1 passage and ${QS_PER_PASSAGE} CLAT practice questions for the "${section}" section.${topicInstruction || ''} CRITICAL: The response MUST include a valid "passage" object with a "content" field.`
        );
        if (retry.passageData && retry.passageData.content) {
          finalPassageData = retry.passageData;
          if (retry.questions && retry.questions.length > 0) {
            finalQuestions = retry.questions;
          }
        }
      }
      if (!finalPassageData || !finalPassageData.content) {
        console.log(`    ❌ Retry failed — no passage returned. Skipping section "${section}" entirely.`);
        continue;
      }

      // 🛡️ Combined guardrail: abort if passage or questions are invalid (prevents orphan questions)
      const validQuestions = [];
      for (let i = 0; i < finalQuestions.length; i++) {
        const q = finalQuestions[i];
        const normalised = normalise(q, null, i + 1);
        if (normalised) {
          normalised.section = section;
          validQuestions.push(normalised);
        }
      }
      if (!finalPassageData.content || validQuestions.length === 0) {
        console.log(`    ❌ Hard Abort: Section "${section}" failed validation (passage: ${!!finalPassageData.content}, questions: ${validQuestions.length}). Skipping insertion to prevent orphan question clutter.`);
        continue;
      }

      // App-level duplicate check: hash the content and query for existing match
      const contentBytes = new TextEncoder().encode(finalPassageData.content);
      const hashBuffer = await crypto.subtle.digest('SHA-256', contentBytes);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const contentHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      const dupCheckUrl = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/practice_passages?content_hash=eq.${contentHash}&select=id,title`;
      const { data: existing } = await supabaseGet(dupCheckUrl);
      if (existing && existing.length > 0) {
        console.log(`    ⏭️ Duplicate passage detected: "${finalPassageData.title}" matches existing passage "${existing[0].title}" (id: ${existing[0].id.substring(0,8)}). Discarding entire section — new questions would crowd the existing passage.`);
        continue;
      }
      
      // Also check by title+section — catch regenerated passages with same topic
      const titleCheckUrl = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/practice_passages?section=eq.${encodeURIComponent(section)}&title=eq.${encodeURIComponent(finalPassageData.title || '')}&select=id,title`;
      const { data: existingByTitle } = await supabaseGet(titleCheckUrl);
      if (existingByTitle && existingByTitle.length > 0) {
        console.log(`    ⏭️ Passage with same title+section exists: "${finalPassageData.title}" (id: ${existingByTitle[0].id.substring(0,8)}). Skipping to avoid duplicate topic.`);
        continue;
      } else {
        // Insert new passage
        const passageRows = await supabaseInsert('practice_passages', [{
          section,
          title: finalPassageData.title || '',
          source: finalPassageData.source || 'AI-generated',
          content: finalPassageData.content,
          difficulty: (finalPassageData.difficulty || 'medium').toLowerCase(),
        }]);
        passageId = passageRows?.[0]?.id || null;
        totalPassages++;
        console.log(`    📄 New passage inserted: "${finalPassageData.title || 'Untitled'}" (id: ${passageId ? passageId.substring(0, 8) + '...' : 'none'})`);

        // Record topic usage in tracker
        if (topicPick && passageId) {
          const trackerUrl = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/topic_tracker`;
          await fetch(trackerUrl, {
            method: 'POST',
            headers: { ...SUPABASE_HEADERS, 'Prefer': 'resolution=merge-duplicates' },
            body: JSON.stringify({
              section,
              bank_index: topicPick.index,
              topic_title: topicPick.topic.title,
              domain: topicPick.topic.domain,
              passage_id: passageId,
            }),
          });
        }
      }

      // Step 3: Update passage link on pre-normalised questions
      for (const q of validQuestions) {
        q.passage_id = passageId;
        q.question_number = validQuestions.indexOf(q) + 1;
      }

      if (validQuestions.length === 0) {
        console.log(`    ⚠️ No valid questions after normalisation`);
        if (passageId) {
          const delUrl = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/practice_passages?id=eq.${passageId}`;
          await fetch(delUrl, { method: 'DELETE', headers: SUPABASE_HEADERS });
        }
        continue;
      }

      // Step 4: Insert all questions
      await supabaseInsert('practice_questions', validQuestions);
      console.log(`    ✅ ${validQuestions.length} questions inserted (${passageId ? 'passage-linked' : 'standalone'})`);
      totalQuestions += validQuestions.length;

    } catch (err) {
      console.log(`    ❌ Error: ${err.message}`);
    }
  }

  // Step 5: Run auto-validation on newly inserted questions
  try {
    if (!validatePendingQuestions) {
      const validatorModule = await import('./validate-questions.mjs');
      validatePendingQuestions = validatorModule.validatePendingQuestions;
    }
    const validationResult = await validatePendingQuestions();
    console.log(`    🔍 ${validationResult.passed}/${validationResult.total} passed validation (${validationResult.flagged} flagged)`);
  } catch (valErr) {
    console.log(`    ⚠️ Validation step failed: ${valErr.message}`);
  }

  console.log(`\n✅ Done! ${totalPassages} passages + ${totalQuestions} new questions added today.`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
