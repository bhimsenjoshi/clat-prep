#!/usr/bin/env node
/**
 * Dump flagged questions with details for manual review.
 * Usage: node scripts/dump-flagged-questions.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const envPaths = [resolve(scriptDir, '..', '.env'), resolve(scriptDir, '.env')];
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
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
      if (!process.env[key]) process.env[key] = val;
    }
    break;
  }
}

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const HEADERS = { 'Content-Type': 'application/json', 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` };

async function get(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`GET ${res.status}: ${await res.text()}`);
  return res.json();
}

async function main() {
  // ─── 1. Get AI-flagged validation logs ───
  console.log('Fetching AI-flagged questions...');
  const logsUrl = `${SUPABASE_URL}/rest/v1/validation_logs?status_after=eq.flagged&order=created_at.desc`;
  const allFlaggedLogs = await get(logsUrl);
  
  const aiFlagged = allFlaggedLogs.filter(l => l.checks_failed && l.checks_failed.includes('ai_check_failed'));
  const mechFlagged = allFlaggedLogs.filter(l => !l.checks_failed || !l.checks_failed.includes('ai_check_failed'));
  
  console.log(`AI-flagged: ${aiFlagged.length}, Mechanically-flagged: ${mechFlagged.length}`);

  // ─── 2. Fetch AI-flagged questions by section → filter locally ───
  const aiQuestionIds = new Set(aiFlagged.map(l => l.question_id));
  const aiQuestions = [];

  // Fetch questions in batches of section
  const sections = ['English Language', 'Current Affairs Including General Knowledge', 'Legal Reasoning', 'Logical Reasoning', 'Quantitative Techniques'];
  for (const section of sections) {
    const qUrl = `${SUPABASE_URL}/rest/v1/practice_questions?section=eq.${encodeURIComponent(section)}&select=id,section,topic,question_text,passage_id,options,correct_option,explanation,difficulty,source,tags,created_at&limit=1000`;
    const qs = await get(qUrl);
    for (const q of qs) {
      if (aiQuestionIds.has(q.id)) aiQuestions.push(q);
    }
  }

  // ─── 3. Fetch passages for AI-flagged questions by section ───
  const passageIds = [...new Set(aiQuestions.map(q => q.passage_id).filter(Boolean))];
  const passages = {};
  if (passageIds.length > 0) {
    const pUrl = `${SUPABASE_URL}/rest/v1/practice_passages?select=id,title,content,section&limit=1000`;
    const ps = await get(pUrl);
    const passageIdSet = new Set(passageIds);
    for (const p of ps) {
      if (passageIdSet.has(p.id)) passages[p.id] = p;
    }
  }

  // ─── 4. Build rich dump ───
  const dump = [];
  for (const log of aiFlagged) {
    const q = aiQuestions.find(q => q.id === log.question_id);
    if (!q) continue;
    
    let opts;
    try { opts = typeof q.options === 'string' ? JSON.parse(q.options) : q.options; } catch { opts = q.options; }

    const entry = {
      id: q.id,
      section: q.section,
      topic: q.topic,
      question_text: q.question_text,
      correct_answer: q.correct_option,
      options: opts,
      explanation: q.explanation,
      difficulty: q.difficulty,
      source: q.source,
      tags: q.tags,
      created_at: q.created_at,
      flag_reason: log.notes || 'AI flagged (no details in log)',
      checks_passed: log.checks_passed,
      checks_failed: log.checks_failed,
    };

    // Attach passage if exists
    if (q.passage_id && passages[q.passage_id]) {
      entry.passage = {
        title: passages[q.passage_id].title,
        content: passages[q.passage_id].content,
        section: passages[q.passage_id].section,
      };
    }

    dump.push(entry);
  }

  // ─── 5. Write file ───
  const outPath = resolve(scriptDir, '..', 'ai-flagged-questions.json');
  writeFileSync(outPath, JSON.stringify(dump, null, 2));
  console.log(`\n✅ Written ${dump.length} AI-flagged questions to ai-flagged-questions.json`);

  // ─── 6. Also dump mechanically flagged for summary ───
  const mechFailures = {};
  for (const log of mechFlagged) {
    if (!log.checks_failed) continue;
    for (const check of log.checks_failed) {
      mechFailures[check] = (mechFailures[check] || 0) + 1;
    }
  }
  console.log(`\n📊 Mechanically-flagged breakdown:`);
  for (const [check, count] of Object.entries(mechFailures).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${check}: ${count}`);
  }
  console.log(`\n📁 File: ai-flagged-questions.json`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
