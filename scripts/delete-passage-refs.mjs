#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs';
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

import { createClient } from '@supabase/supabase-js';
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const phrases = [
  'according to the passage', 'based on the passage', 'based on the text',
  'in the passage', 'the passage says', 'the passage notes', 'the passage suggests',
  'the passage mentions', 'the passage indicates', 'the passage highlights',
  'the passage discusses', 'the passage details',
  'as stated in the passage', 'as described in the passage', 'as mentioned in the passage',
  'as outlined in the passage', 'as detailed in the passage',
  'presented in the passage', 'described in the passage', 'mentioned in the passage',
  'detailed in the passage', 'from the passage', 'this passage',
  'summarizes the passage', 'summarizes the text',
  "the author's tone in the passage",
  'according to the text', 'the provided text',
  'the text discusses', 'the text presents', 'the text describes',
];

async function main() {
  const { data: all } = await s.from('practice_questions')
    .select('id, section, question_text')
    .is('passage_id', null);

  const toDelete = [];
  for (const q of all) {
    const t = q.question_text.toLowerCase();
    if (phrases.some(p => t.includes(p))) toDelete.push(q);
  }

  const ids = toDelete.map(q => q.id);
  const bySec = {};
  for (const q of toDelete) {
    bySec[q.section] = (bySec[q.section] || 0) + 1;
  }

  console.log('Contaminated questions to delete: ' + ids.length);
  for (const [sec, cnt] of Object.entries(bySec).sort()) {
    console.log('  ' + sec + ': ' + cnt);
  }

  if (ids.length === 0) {
    console.log('Nothing to delete.');
    return;
  }

  // Delete quiz_responses first (FK constraint)
  console.log('\nDeleting quiz_responses...');
  const { error: respErr } = await s.from('quiz_responses').delete().in('question_id', ids);
  if (respErr) {
    console.log('quiz_responses error: ' + respErr.message);
    // If some don't have responses, that's fine
  }
  console.log('quiz_responses done');

  // Delete practice_questions
  console.log('Deleting practice_questions...');
  const { error: qErr } = await s.from('practice_questions').delete().in('id', ids);
  if (qErr) {
    console.log('practice_questions error: ' + qErr.message);
    process.exit(1);
  }
  console.log('Done!');

  // Verify remaining
  const { data: remaining } = await s.from('practice_questions')
    .select('id, section')
    .is('passage_id', null);

  const counts = {};
  for (const q of remaining) counts[q.section] = (counts[q.section] || 0) + 1;
  console.log('\nRemaining clean standalone: ' + remaining.length);
  for (const [sec, cnt] of Object.entries(counts).sort()) {
    console.log('  ' + sec + ': ' + cnt);
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
