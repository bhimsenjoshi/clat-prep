#!/usr/bin/env node
/**
 * Daily Question Generator — Zero-dependency Cron Executable
 *
 * Uses Node 18+ built-in fetch for both DeepSeek API and Supabase REST API.
 * No npm install needed.
 *
 * Usage: node scripts/daily-questions-cron.mjs
 * Requires env: SUPABASE_SERVICE_ROLE_KEY, DEEPSEEK_API_KEY,
 *               NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

const SECTIONS = ['English', 'Current Affairs', 'Legal Reasoning', 'Logical Reasoning', 'Quantitative Techniques'];
const QS_PER_SECTION = 5;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY || '';

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

  const parsed = JSON.parse(raw);
  const questions = parsed.questions || (Array.isArray(parsed) ? parsed : [parsed]);
  return questions.map(normalise).filter(Boolean);
}

function normalise(q) {
  if (!q?.question_text || !q?.options || !q?.correct_option) return null;

  let options = q.options;
  if (typeof options === 'string') {
    try { options = JSON.parse(options); } catch { return null; }
  }

  return {
    question_text: q.question_text,
    passage: q.passage || null,
    options: typeof options === 'object' ? options : {},
    correct_option: String(q.correct_option),
    explanation: q.explanation || null,
    difficulty: q.difficulty || 'medium',
    source: 'daily',
    generated_by: 'deepseek',
    reviewed: false,
  };
}

function buildPrompt(section) {
  const sectionPrompts = {
    'English': `You are a CLAT English Language expert. Generate ${QS_PER_SECTION} passage-based reading comprehension questions. Each question must have a passage, 4 options (A-D), a correct answer, explanation, and difficulty level. Return JSON with a "questions" array.`,
    'Current Affairs': `You are a CLAT Current Affairs & GK expert. Generate ${QS_PER_SECTION} questions based on recent news and events (2025-2026). Each question must have a passage, 4 options (A-D), a correct answer, explanation, and difficulty level. Return JSON with a "questions" array.`,
    'Legal Reasoning': `You are a CLAT Legal Reasoning expert. Generate ${QS_PER_SECTION} questions based on legal principles and case laws. Each question must have a passage describing a legal scenario, 4 options (A-D), a correct answer, explanation, and difficulty level. Return JSON with a "questions" array.`,
    'Logical Reasoning': `You are a CLAT Logical Reasoning expert. Generate ${QS_PER_SECTION} critical thinking questions testing arguments, assumptions, and inferences. Each question must have a passage, 4 options (A-D), a correct answer, explanation, and difficulty level. Return JSON with a "questions" array.`,
    'Quantitative Techniques': `You are a CLAT Quantitative Techniques expert. Generate ${QS_PER_SECTION} data interpretation and math questions. Each question must include data/short passage, 4 options (A-D), a correct answer, explanation, and difficulty level. Return JSON with a "questions" array.`,
  };
  return sectionPrompts[section] || sectionPrompts['English'];
}

async function supabaseInsert(rows) {
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/practice_questions`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase error ${res.status}: ${text}`);
  }
  return true;
}

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY || !ANON_KEY) {
    console.log('❌ Supabase env vars not set');
    process.exit(1);
  }
  if (!DEEPSEEK_KEY) {
    console.log('❌ DEEPSEEK_API_KEY not set');
    process.exit(1);
  }

  console.log(`📅 Generating ${QS_PER_SECTION} questions per section...`);
  let totalInserted = 0;

  for (const section of SECTIONS) {
    try {
      console.log(`  → ${section}...`);
      const questions = await callDeepSeek(
        buildPrompt(section),
        `Generate ${QS_PER_SECTION} CLAT practice questions for the "${section}" section.`
      );

      if (questions.length === 0) {
        console.log(`    ⚠️ No questions generated`);
        continue;
      }

      const rows = questions.map(q => ({ ...q, section }));
      await supabaseInsert(rows);
      console.log(`    ✅ ${rows.length} questions inserted`);
      totalInserted += rows.length;
    } catch (err) {
      console.log(`    ❌ Error: ${err.message}`);
    }
  }

  console.log(`\n✅ Done! ${totalInserted} new questions added today.`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
