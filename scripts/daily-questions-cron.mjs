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

const SECTIONS = ['English Language', 'Current Affairs Including General Knowledge', 'Legal Reasoning', 'Logical Reasoning', 'Quantitative Techniques'];
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

async function callDeepSeek(systemPrompt, userPrompt) {
  const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
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

  const passage = q.passage || null;

  return {
    question_text,
    passage: passageId ? null : passage,
    options: typeof parsedOptions === 'object' ? parsedOptions : {},
    correct_option: String(correct_answer),
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
- NO "According to the passage, what did X say/do?" — these are banned
- NO "what is X according to the passage" — banned
- Questions must test: inference, author's tone/attitude, word meaning IN CONTEXT, implied meaning, the author would most likely agree/disagree with, purpose of a reference, what can be inferred, logical extension of the argument
- At least 2 questions should involve the author's opinion, attitude, or intent
- Include 1 vocabulary-in-context question
- Options must be nuanced — not trivially right/wrong

Return JSON with:
  - "passage": { "title": "Short title", "content": "The passage text", "source": "Source or 'Original for CLATly'", "difficulty": "easy|medium|hard" }
  - "questions": array of ${QS_PER_PASSAGE} objects, each with:
    - "question_text": string (must NOT start with "According to the passage")
    - "options": object with keys A,B,C,D and string values
    - "correct_answer": "A"
    - "explanation": string
    - "difficulty": "easy|medium|hard"
    - "tags": array of topic strings`,

    'Current Affairs Including General Knowledge': `You are a CLAT Current Affairs & GK expert. Generate a current affairs passage (250-400 words) in the style of an editorial or analytical opinion piece — NOT a news report. The passage should present an analysis of a significant recent issue (economy, policy, international relations, technology, environment — 2025-2026).

Follow exactly with ${QS_PER_PASSAGE} questions. CRITICAL RULES:
- NO trivia questions (dates, launch sites, names of schemes, abbreviations) — these are BANNED
- NO "Where was X launched" / "When did X happen" / "Who is the head of X"
- Questions must test: understanding of the issue, implications, cause-effect, the author's argument, what can be inferred from the analysis, which statement best reflects the passage's central theme
- Every question should be answerable by reading and understanding the passage — NOT by prior knowledge

Return JSON with:
  - "passage": { "title": "Short title", "content": "The passage text (editorial/analysis style)", "source": "Source or 'Original for CLATly'", "difficulty": "easy|medium|hard" }
  - "questions": array of ${QS_PER_PASSAGE} objects (same format as above)`,

    'Legal Reasoning': `You are a CLAT Legal Reasoning expert. Generate exactly 1 legal scenario passage (250-450 words) presenting a legal principle (from contract, tort, criminal law, constitution) followed by a fact pattern. Follow exactly with ${QS_PER_PASSAGE} questions.

Questions must test: application of the legal principle to variations of the fact pattern, distinctions between similar legal concepts, exceptions to the rule, which party wins and why. At least 3 questions should present hypothetical variations ("what if...") that require applying the principle to new facts.

Return JSON with:
  - "passage": { "title": "Legal principle title", "content": "The passage text with legal principle and facts", "source": "Legal principle or 'Original for CLATly'", "difficulty": "easy|medium|hard" }
  - "questions": array of ${QS_PER_PASSAGE} objects (same format as above)`,

    'Logical Reasoning': `You are a CLAT Logical Reasoning expert. Generate exactly 1 argument/critical reasoning passage (150-300 words) presenting a structured argument with a clear conclusion and supporting premises. Follow exactly with ${QS_PER_PASSAGE} questions.

Questions must include (distribute across the 6): main conclusion, inference, assumption (necessary/sufficient), strengthen, weaken, flaw in reasoning, parallel reasoning, or role of a statement. At least one strengthen and one weaken question required.

Return JSON with:
  - "passage": { "title": "Short title", "content": "The passage text", "source": "Source or 'Original for CLATly'", "difficulty": "easy|medium|hard" }
  - "questions": array of ${QS_PER_PASSAGE} objects (same format as above)`,

    'Quantitative Techniques': `You are a CLAT Quantitative Techniques expert. Generate exactly 1 data interpretation passage (a chart, table, or data set described in text) followed by exactly ${QS_PER_PASSAGE} questions requiring calculations, percentages, ratios, and data analysis. Ensure data points are clean whole numbers and calculations are non-trivial (require actual computation, not just reading a value off the table). Include at least one percentage change and one ratio question.

Return JSON with:
  - "passage": { "title": "Data set title", "content": "Description of the data including the data set/table", "source": "Source or 'Original for CLATly'", "difficulty": "easy|medium|hard" }
  - "questions": array of ${QS_PER_PASSAGE} objects (same format as above)`,
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

  console.log(`📅 Generating 1 passage + ${QS_PER_PASSAGE} questions per section...`);
  let totalPassages = 0;
  let totalQuestions = 0;

  for (const section of SECTIONS) {
    try {
      console.log(`  → ${section}...`);

      // Step 1: Call AI for passage + questions together
      const { passageData, questions: rawQuestions } = await callDeepSeek(
        buildPassagePrompt(section),
        `Generate 1 passage and ${QS_PER_PASSAGE} CLAT practice questions for the "${section}" section. The passage must be formatted as per CLAT 2025 standards.`
      );

      if (!rawQuestions || rawQuestions.length === 0) {
        console.log(`    ⚠️ No questions generated`);
        continue;
      }

      // Step 2: Insert passage into practice_passages table
      let passageId = null;
      if (passageData && passageData.content) {
        const passageRows = await supabaseInsert('practice_passages', [{
          section,
          title: passageData.title || '',
          source: passageData.source || 'AI-generated',
          content: passageData.content,
          difficulty: (passageData.difficulty || 'medium').toLowerCase(),
        }]);
        passageId = passageRows?.[0]?.id || null;
        totalPassages++;
        console.log(`    📄 Passage inserted: "${passageData.title || 'Untitled'}" (id: ${passageId ? passageId.substring(0, 8) + '...' : 'none'})`);
      }

      // Step 3: Normalise questions with passage link and metadata
      const validQuestions = [];
      for (let i = 0; i < rawQuestions.length; i++) {
        const q = rawQuestions[i];
        const normalised = normalise(q, passageId, i + 1);
        if (normalised) {
          normalised.section = section;
          validQuestions.push(normalised);
        }
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

  console.log(`\n✅ Done! ${totalPassages} passages + ${totalQuestions} new questions added today.`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
