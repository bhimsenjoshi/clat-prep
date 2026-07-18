#!/usr/bin/env node
/**
 * Fix Explanations — Generate explanations for mechanically flagged questions
 *
 * Fetches flagged questions with missing/empty explanations, sends them to
 * DeepSeek V4 Flash to generate proper explanations, then updates the DB.
 *
 * Usage: node scripts/fix-explanations.mjs
 * Requires env: SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL,
 *               DEEPSEEK_API_KEY
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ─── Load .env ───
const scriptDir = dirname(fileURLToPath(import.meta.url));
const envPaths = [
  resolve(scriptDir, '..', '.env'),
  resolve(scriptDir, '.env'),
];
for (const envPath of envPaths) {
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}
if (!DEEPSEEK_KEY) {
  console.error('Missing DEEPSEEK_API_KEY');
  process.exit(1);
}

// ─── Progress stats ───
const stats = { fetched: 0, fixed: 0, failed: 0, skipped: 0 };

// ─── Fetch flagged questions with missing/empty explanations ───
async function fetchFlaggedQuestions() {
  let allQuestions = [];

  const url = `${SUPABASE_URL}/rest/v1/practice_questions?select=id,question_text,options,correct_option,explanation,passage_id,section&validation_status=eq.flagged&limit=200`;
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'apikey': SUPABASE_KEY,
    },
  });
  if (!res.ok) {
    console.error(`  Failed fetching questions: ${res.status} ${await res.text()}`);
    return [];
  }
  allQuestions = await res.json();

  // Filter: only those with missing/empty/too-short explanations
  const needsFix = allQuestions.filter(q => {
    const exp = (q.explanation || '').trim();
    if (!exp || exp.length < 20) return true;
    return false;
  });

  stats.fetched = allQuestions.length;
  stats.needsFix = needsFix.length;
  console.log(`\nFetched ${allQuestions.length} flagged questions`);
  console.log(`With missing/empty explanations: ${needsFix.length}`);
  return needsFix;
}

// ─── Fetch passage text ───
async function fetchPassages(questionIds) {
  const passageIds = [...new Set(questionIds
    .filter(q => q.passage_id)
    .map(q => q.passage_id)
  )];

  if (passageIds.length === 0) return {};

  const chunks = [];
  for (let i = 0; i < passageIds.length; i += 50) {
    chunks.push(passageIds.slice(i, i + 50));
  }

  const passages = {};
  for (const chunk of chunks) {
    const ids = chunk.map(id => `id=eq.${id}`).join(',');
    const url = `${SUPABASE_URL}/rest/v1/practice_passages?select=id,title,content&or=(${ids})`;
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
      },
    });
    if (!res.ok) {
      console.error(`  Failed fetching passages chunk: ${res.status}`);
      continue;
    }
    const data = await res.json();
    for (const p of data) {
      passages[p.id] = p;
    }
  }
  return passages;
}

// ─── Generate explanation via DeepSeek V4 Flash ───
async function generateExplanation(question) {
  const options = typeof question.options === 'string'
    ? JSON.parse(question.options)
    : question.options;

  const correctLetter = question.correct_option;
  const correctText = options[correctLetter] || '';

  const optionText = Object.entries(options)
    .map(([k, v]) => `  ${k}. ${v}`)
    .join('\n');

  const messages = [
    {
      role: 'system',
      content: 'You are a CLAT exam expert. Generate a clear, detailed explanation for why the correct answer is right and why the other options are wrong. Write in simple English suitable for law aspirants. Keep explanations between 50-150 words. Respond with ONLY the explanation text, no JSON, no formatting.',
    },
    {
      role: 'user',
      content: `Question: ${question.question_text}\n\nOptions:\n${optionText}\n\nCorrect Answer: ${correctLetter}. ${correctText}\n\nGenerate a detailed explanation for this CLAT question.`
    },
  ];

  const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-v4-flash',
      messages,
      max_tokens: 300,
      temperature: 0.3,
      stop: ['\n\n\n'],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`DeepSeek API ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const message = data.choices?.[0]?.message;
  let explanation = message?.content?.trim();

  // V4 Flash may return reasoning_content but empty content
  if (!explanation && message?.reasoning_content) {
    explanation = message.reasoning_content.trim();
  }

  if (!explanation) throw new Error('Empty response from DeepSeek');

  return explanation;
}

// ─── Update question in DB ───
async function updateExplanation(questionId, explanation) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/practice_questions?id=eq.${questionId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'apikey': SUPABASE_KEY,
    },
    body: JSON.stringify({
      explanation,
      validation_status: 'flagged', // keep flagged — needs admin review
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`DB update ${res.status}: ${errText.slice(0, 200)}`);
  }
  return true;
}

// ─── Main ───
async function main() {
  console.log('🔧 CLATly — Explanation Fixer\n');
  console.log(`Model: deepseek-v4-flash`);

  const questions = await fetchFlaggedQuestions();
  if (questions.length === 0) {
    console.log('\n✅ No questions need fixing!');
    return;
  }

  console.log('\n📥 Fetching passages...');
  const passages = await fetchPassages(questions);
  console.log(`  Got ${Object.keys(passages).length} passages`);

  console.log('\n🤖 Generating explanations...\n');

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const passage = q.passage_id ? passages[q.passage_id] : null;
    const prefix = `[${i + 1}/${questions.length}]`;

    try {
      process.stdout.write(`${prefix} q:${q.id.slice(0, 8)} (${q.section}) → generating... `);

      const explanation = await generateExplanation(q);

      // Add passage context if available
      let finalExplanation = explanation;
      if (passage) {
        finalExplanation += `\n\n*Passage reference: "${passage.title}"*`;
      }

      await updateExplanation(q.id, finalExplanation);

      stats.fixed++;
      console.log('✅');
    } catch (err) {
      stats.failed++;
      console.log(`❌ ${err.message}`);
    }

    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 300));
  }

  // ─── Summary ───
  console.log('\n' + '='.repeat(50));
  console.log('📊 SUMMARY');
  console.log('='.repeat(50));
  console.log(`  Total flagged fetched:   ${stats.fetched}`);
  console.log(`  Needed explanations:     ${stats.needsFix}`);
  console.log(`  Fixed:                   ${stats.fixed}`);
  console.log(`  Failed:                  ${stats.failed}`);
  console.log('='.repeat(50));

  if (stats.failed > 0) {
    console.log('\n⚠️  Some explanations failed. Check network/rate limits.');
  }
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
