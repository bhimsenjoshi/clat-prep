#!/usr/bin/env node
/**
 * Generate standalone Quant questions for Quick Fire mode.
 * No passages, no data tables — pure arithmetic word problems in CLAT style.
 */
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

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

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY || '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_HEADERS = {
  'Content-Type': 'application/json',
  'apikey': ANON_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
};

const prompt = `You are a CLAT Quantitative Techniques expert. Generate EXACTLY 10 standalone quant questions — NO passage, NO data table.

Each question must be a self-contained arithmetic word problem that gives the student all numbers in the question_text itself.

QUESTION TYPES (cover at least 6 of these, spread evenly):
1. Profit & Loss — "A shopkeeper sells at X% profit. If CP is Rs.Y, what is SP?"
2. Averages — "Average of N numbers is X. If one is removed, average becomes Y. What was removed?"
3. Ratios — "Ratio of A to B is X:Y. Total = Z. How many of A?"
4. Time-Speed-Distance — "A Xm train crosses a Ym platform in Z seconds. Speed in km/h?"
5. Work & Time — "A can do work in X days, B in Y days. Days taken together?"
6. Percentages — "X is what percent of Y?"
7. Simple Interest — "Principal Rs.X, rate Y%, time Z years. Simple interest?"
8. Mixtures — "Mix X litres of A costing Rs.P with Y litres of B costing Rs.Q. Cost per litre?"
9. Number Systems — "Sum of first N natural numbers?" or "LCM of X and Y?"
10. Age Problems — "A is X years older than B. In Y years, ratio P:Q. Current ages?"

CRITICAL RULES:
- All numbers MUST be whole numbers (no decimals in inputs)
- Answers must be clean numbers where possible
- Options: exactly 4 choices with keys A,B,C,D
- correct_answer must be the LETTER (A/B/C/D), not the value
- NO passage field — each question is standalone
- Use "Rs." for Rupees (not the symbol)

EXPLANATION FORMAT — each explanation must be a JSON object:
{
  "correct_answer_rationale": "Step-by-step working.",
  "incorrect_option_analysis": {
    "A": "Why A is wrong.",
    "B": "Why B is wrong.",
    "C": "Why C is wrong.",
    "D": "Why D is wrong."
  },
  "wrong_answer_guidance": "Pointer for student."
}

Return EXACTLY this JSON structure:
{
  "questions": [
    {
      "question_text": "...",
      "options": {"A":"...", "B":"...", "C":"...", "D":"..."},
      "correct_answer": "A",
      "explanation": { ... },
      "difficulty": "easy|medium|hard",
      "tags": ["type-name"]
    }
  ]
}`;

async function callDeepSeek() {
  const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: 'Generate 10 standalone CLAT quant questions for Quick Fire mode. No passages, no data tables. Each question self-contained.' }
      ],
      temperature: 0.7,
      max_tokens: 8192,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DeepSeek error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content;
  if (!raw) throw new Error('Empty response');
  return JSON.parse(raw);
}

function normalise(q) {
  let question_text = q.question_text || q.question;
  if (!question_text) return null;

  let options = q.options;
  if (typeof options === 'string') {
    try { options = JSON.parse(options); } catch { return null; }
  }
  if (Array.isArray(options)) {
    const labels = ['A', 'B', 'C', 'D'];
    const obj = {};
    options.forEach((opt, i) => { if (i < labels.length) obj[labels[i]] = String(opt); });
    options = obj;
  }
  if (!options || typeof options !== 'object') return null;

  let correct_answer = String(q.correct_answer || q.correct_option || '').trim();
  if (!['A','B','C','D'].includes(correct_answer)) {
    // Try to find it by value
    for (const [label, value] of Object.entries(options)) {
      if (String(value).trim() === correct_answer.trim()) {
        correct_answer = label;
        break;
      }
    }
  }
  if (!['A','B','C','D'].includes(correct_answer)) return null;

  return {
    section: 'Quantitative Techniques',
    topic: 'quantitative',
    question_text,
    passage: null,
    passage_id: null,
    options,
    correct_option: correct_answer,
    explanation: typeof q.explanation === 'object' ? JSON.stringify(q.explanation) : (q.explanation || null),
    difficulty: (q.difficulty || 'medium').toLowerCase(),
    source: 'daily',
    marks: 1,
    negative_marks: 0.25,
    tags: q.tags || [],
  };
}

async function insertQuestions(rows) {
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/practice_questions`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { ...SUPABASE_HEADERS, 'Prefer': 'return=representation' },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Insert error ${res.status}: ${text}`);
  }
  return await res.json();
}

async function main() {
  if (!DEEPSEEK_KEY || !SERVICE_KEY) {
    console.log('Missing API keys');
    process.exit(1);
  }

  console.log('Generating standalone quant questions...');
  const data = await callDeepSeek();
  const rawQuestions = data.questions || [];
  console.log(`  Raw: ${rawQuestions.length} questions from AI`);

  const valid = [];
  for (const q of rawQuestions) {
    const n = normalise(q);
    if (n) valid.push(n);
  }
  console.log(`  Valid: ${valid.length} questions after normalisation`);

  if (valid.length === 0) {
    console.log('No valid questions — aborting');
    process.exit(1);
  }

  console.log('\nQuestions to insert:');
  valid.forEach((q, i) => {
    console.log(`  ${i+1}. [${q.difficulty}] ${q.question_text.substring(0, 80)}`);
    console.log(`     Options: ${JSON.stringify(q.options)}`);
    console.log(`     Answer: ${q.correct_option}`);
  });

  // Ask for confirmation
  console.log('\nInserting...');
  const inserted = await insertQuestions(valid);
  console.log(`Inserted ${inserted.length} questions successfully`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
