#!/usr/bin/env node
/**
 * Daily Question Generator — Zero-dependency Cron Executable
 *
 * Generates CLAT-realistic passage-based questions matching the official CLAT 2025 format.
 * Each section: 1 passage → 5 questions (mirrors real exam structure).
 * Questions linked to passages via practice_passages table with metadata
 * (marks=1, negative_marks=0.25, question_number).
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
const QS_PER_PASSAGE = 5;

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

  // New response format: { passage: {...}, questions: [...] }
  // OR legacy: { questions: [...] } with embedded passages
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

  // Some AI responses embed the question in passage; use passage as fallback
  if (!question_text && q.passage) {
    const sentences = q.passage.match(/[^.!?]+[.!?]/g);
    question_text = (sentences && sentences[0]) ? sentences[0].trim() : q.passage.substring(0, 150);
  }

  if (!question_text || !options || !correct_answer) return null;

  let parsedOptions = options;
  if (typeof parsedOptions === 'string') {
    try { parsedOptions = JSON.parse(parsedOptions); } catch { return null; }
  }
  // Convert array options to A/B/C/D object
  if (Array.isArray(parsedOptions)) {
    const labels = ['A', 'B', 'C', 'D', 'E'];
    const obj = {};
    parsedOptions.forEach((opt, i) => { if (i < labels.length) obj[labels[i]] = String(opt); });
    parsedOptions = obj;
  }

  // Use passage from the AI response only if no passage_id is provided
  // (if we generated a passage separately, the question's passage field is redundant)
  const passage = q.passage || null;

  return {
    question_text,
    passage: passageId ? null : passage, // Don't duplicate passage text if linked via ID
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
    'English Language': `You are a CLAT English Language expert. Generate exactly 1 reading comprehension passage (250-400 words) followed by exactly ${QS_PER_PASSAGE} questions based on that passage. Return JSON with:
  - "passage": { "title": "Short title", "content": "The passage text", "source": "Source or 'Original for CLATly'", "difficulty": "easy|medium|hard" }
  - "questions": array of ${QS_PER_PASSAGE} objects, each with:
    - "question_text": string
    - "options": object with keys A,B,C,D and string values
    - "correct_answer": "A"
    - "explanation": string
    - "difficulty": "easy|medium|hard"
    - "tags": array of topic strings`,
    'Current Affairs Including General Knowledge': `You are a CLAT Current Affairs & GK expert. Generate exactly 1 current affairs passage (200-350 words) based on real recent news/events (2025-2026) followed by exactly ${QS_PER_PASSAGE} questions. Return JSON with:
  - "passage": { "title": "Short title", "content": "The passage text", "source": "Source or 'Original for CLATly'", "difficulty": "easy|medium|hard" }
  - "questions": array of ${QS_PER_PASSAGE} objects (same format as above)`,
    'Legal Reasoning': `You are a CLAT Legal Reasoning expert. Generate exactly 1 legal scenario passage (200-400 words) presenting a legal principle and fact pattern, followed by exactly ${QS_PER_PASSAGE} questions testing application of legal principles. Return JSON with:
  - "passage": { "title": "Legal principle title", "content": "The passage text with legal principle and facts", "source": "Legal principle or 'Original for CLATly'", "difficulty": "easy|medium|hard" }
  - "questions": array of ${QS_PER_PASSAGE} objects (same format as above)`,
    'Logical Reasoning': `You are a CLAT Logical Reasoning expert. Generate exactly 1 argument/critical reasoning passage (150-300 words) presenting an argument or reasoning scenario, followed by exactly ${QS_PER_PASSAGE} questions testing critical thinking, assumptions, inferences, and conclusions. Return JSON with:
  - "passage": { "title": "Short title", "content": "The passage text", "source": "Source or 'Original for CLATly'", "difficulty": "easy|medium|hard" }
  - "questions": array of ${QS_PER_PASSAGE} objects (same format as above)`,
    'Quantitative Techniques': `You are a CLAT Quantitative Techniques expert. Generate exactly 1 data interpretation passage (a chart, table, or data set described in text) followed by exactly ${QS_PER_PASSAGE} questions requiring calculations, percentages, ratios, and data analysis. Return JSON with:
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
          // Clean up orphaned passage
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
