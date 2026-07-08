#!/usr/bin/env node
/**
 * Daily Question Generator — Cron Executable
 *
 * Run via Hermes cron: runs generateSection for all 5 sections
 * and inserts into practice_questions with source='daily'.
 *
 * Usage: node scripts/daily-questions-cron.mjs
 * Requires env: SUPABASE_SERVICE_ROLE_KEY, DEEPSEEK_API_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 */
import { createClient } from '@supabase/supabase-js';

const SECTIONS = ['English', 'Current Affairs', 'Legal Reasoning', 'Logical Reasoning', 'Quantitative Techniques'];
const QS_PER_SECTION = 5;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
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
  return {
    question_text: q.question_text,
    passage: q.passage || null,
    options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
    correct_option: q.correct_option,
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

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.log('❌ Supabase env vars not set');
    process.exit(1);
  }
  if (!DEEPSEEK_KEY) {
    console.log('❌ DEEPSEEK_API_KEY not set');
    process.exit(1);
  }

  const db = createClient(SUPABASE_URL, SERVICE_KEY);
  console.log(`📅 Generating ${QS_PER_SECTION} questions per section...`);
  let totalInserted = 0;

  for (const section of SECTIONS) {
    try {
      console.log(`  → ${section}...`);
      const questions = await callDeepSeek(buildPrompt(section), `Generate ${QS_PER_SECTION} CLAT practice questions for the "${section}" section.`);
      
      if (questions.length === 0) {
        console.log(`    ⚠️ No questions generated`);
        continue;
      }

      const rows = questions.map(q => ({ ...q, section }));
      const { error } = await db.from('practice_questions').insert(rows);
      
      if (error) {
        console.log(`    ❌ Insert error: ${error.message}`);
      } else {
        console.log(`    ✅ ${rows.length} questions inserted`);
        totalInserted += rows.length;
      }
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
