#!/usr/bin/env node
// Simulates /api/quiz/start with the NEW partial-passage logic against real data.
// Usage: node scripts/simulate-quiz-start.mjs <user_id> <section>
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
const d = dirname(fileURLToPath(import.meta.url));
for (const p of [resolve(d,'..','.env'),resolve(d,'.env')]) {
  if (existsSync(p)) {
    for (const l of readFileSync(p,'utf-8').split('\n')) {
      const t=l.trim(); if(!t||t.startsWith('#')) continue;
      const i=t.indexOf('='); if(i===-1) continue;
      const k=t.slice(0,i).trim(); let v=t.slice(i+1).trim();
      if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'"))) v=v.slice(1,-1);
      if(!process.env[k]) process.env[k]=v;
    } break;
  }
}
const U = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/,'');
const K = process.env.SUPABASE_SERVICE_ROLE_KEY;
const H = { 'apikey': K, 'Authorization': `Bearer ${K}`, 'Content-Type': 'application/json' };
const j = async (path) => { const r = await fetch(`${U}/rest/v1/${path}`, { headers: H }); return r.json(); };

const [, , USER_ID, SECTION] = process.argv;
if (!USER_ID || !SECTION) { console.error('usage: simulate-quiz-start.mjs <user_id> <section>'); process.exit(1); }

// 1. Answered question IDs
const sessions = await j(`quiz_sessions?select=id&student_id=eq.${USER_ID}&section=eq.${encodeURIComponent(SECTION)}`);
const sessionIds = (sessions ?? []).map(s => s.id);
let answeredIds = new Set();
if (sessionIds.length > 0) {
  const chunk = 900;
  for (let i = 0; i < sessionIds.length; i += chunk) {
    const ids = sessionIds.slice(i, i + chunk);
    const resp = await j(`quiz_responses?select=question_id&session_id=in.(${ids.map(x => `"${x}"`).join(',')})`);
    (resp ?? []).forEach(r => answeredIds.add(r.question_id));
  }
}
console.log(`Answered Qs (${SECTION}): ${answeredIds.size} across ${sessionIds.length} sessions`);

// 2. Passage-linked questions
const qs = await j(`practice_questions?select=id,section,passage_id,question_text,correct_option,created_at&section=eq.${encodeURIComponent(SECTION)}&validation_status=eq.passed&passage_id=not.is.null`);
console.log(`Total passage-linked passed Qs: ${qs.length}`);

// 3. Group + dedupe by title (keep newest per title)
const passageIds = [...new Set(qs.map(q => q.passage_id))];
const passages = await j(`practice_passages?select=id,title&id=in.(${passageIds.map(x => `"${x}"`).join(',')})`);
const titleMap = {}; for (const p of passages ?? []) titleMap[p.id] = p.title;

const tempMap = {};
for (const q of qs) { (tempMap[q.passage_id] ||= []).push(q); }
const sortedByNewest = Object.keys(tempMap).sort((a, b) => {
  const maxA = Math.max(...tempMap[a].map(q => new Date(q.created_at).getTime()));
  const maxB = Math.max(...tempMap[b].map(q => new Date(q.created_at).getTime()));
  return maxB - maxA;
});
const kept = new Set(); const firstSeen = {};
for (const pid of sortedByNewest) {
  const t = titleMap[pid];
  if (!t) { kept.add(pid); continue; }
  if (!firstSeen[t]) { firstSeen[t] = pid; kept.add(pid); }
}

// NEW logic: keep unanswered questions from every kept passage
let passageMap = {};
let excluded = 0;
for (const [pid, arr] of Object.entries(tempMap)) {
  if (!kept.has(pid)) continue;
  const fresh = arr.filter(q => !answeredIds.has(q.id));
  if (fresh.length > 0) passageMap[pid] = fresh; else excluded++;
}
let queue = Object.values(passageMap).flat();
const freshCount = queue.length;
const isRepeat = Object.keys(passageMap).length === 0 || freshCount < 12;
if (isRepeat) {
  // full repeat
  passageMap = {}; queue = [];
  for (const [pid, arr] of Object.entries(tempMap)) { if (kept.has(pid)) { passageMap[pid] = arr; queue.push(...arr); } }
}

// ALSO compute OLD logic for comparison
let oldMap = {};
for (const [pid, arr] of Object.entries(tempMap)) {
  if (!kept.has(pid)) continue;
  if (!arr.some(q => answeredIds.has(q.id))) oldMap[pid] = arr;
}
const oldRepeat = Object.keys(oldMap).length === 0;
if (oldRepeat) { oldMap = {}; for (const [pid, arr] of Object.entries(tempMap)) if (kept.has(pid)) oldMap[pid] = arr; }
const oldQueue = Object.values(oldMap).flat();

console.log('────────────────────────────────────────────');
console.log(`OLD logic: ${Object.keys(oldMap).length} passages, ${oldQueue.length} questions${oldRepeat ? ' (REPEAT MODE)' : ''}`);
console.log(`NEW logic: ${Object.keys(passageMap).length} passages, ${queue.length} questions${isRepeat ? ' (REPEAT MODE)' : ''}`);
console.log(`Fully-answered passages skipped (new): ${excluded}`);
// Show a sample: per-passage fresh counts
const sample = Object.entries(passageMap).slice(0, 8).map(([pid, arr]) => `${titleMap[pid]?.slice(0, 40) || pid.slice(0, 8)} → ${arr.length} fresh`);
console.log('Sample passages:'); sample.forEach(s => console.log('  •', s));
