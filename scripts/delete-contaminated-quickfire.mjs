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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const HEADERS = {
  'Content-Type': 'application/json',
  'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
};

// All phrases that indicate a passage reference
const passagePhrases = [
  'according to the passage',
  'based on the passage',
  'based on the text',
  'in the passage',
  'the passage says',
  'the passage notes',
  'the passage suggests',
  'the passage mentions',
  'the passage indicates',
  'the passage highlights',
  'the passage discusses',
  'the passage details',
  'as stated in the passage',
  'as described in the passage',
  'as mentioned in the passage',
  'as outlined in the passage',
  'as detailed in the passage',
  'presented in the passage',
  'described in the passage',
  'mentioned in the passage',
  'detailed in the passage',
  'from the passage',
  'this passage',
  'summarizes the passage',
  'summarizes the text',
  'the author\'s tone in the passage',
  'according to the text',
  'the provided text',
  'the text discusses',
  'the text presents',
  'the text describes',
  'the provided',
];

async function supabase(method, path, body) {
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${path}`;
  const res = await fetch(url, {
    method,
    headers: HEADERS,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${path}: ${res.status} ${text}`);
  }
  if (method === 'DELETE') return null;
  return await res.json();
}

async function main() {
  // Fetch all standalone questions
  const all = await supabase(
    'GET',
    `practice_questions?select=id,section,question_text&passage_id=is.null&limit=1000`
  );

  console.log(`Total standalone: ${all.length}`);

  // Find contaminated ones
  const toDelete = [];
  for (const q of all) {
    const text = q.question_text.toLowerCase();
    const hasPassageRef = passagePhrases.some(phrase => text.includes(phrase));
    if (hasPassageRef) {
      toDelete.push(q);
    }
  }

  const bySection = {};
  for (const q of toDelete) {
    if (!bySection[q.section]) bySection[q.section] = [];
    bySection[q.section].push(q.id);
  }

  console.log(`\nFound ${toDelete.length} contaminated questions:`);
  for (const [sec, ids] of Object.entries(bySection).sort()) {
    console.log(`  ${sec}: ${ids.length}`);
  }

  if (toDelete.length === 0) {
    console.log('\nNothing to delete.');
    return;
  }

  // Delete in batches
  const ids = toDelete.map(q => q.id);
  console.log('\nDeleting...');
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    const inList = batch.map(id => `"${id}"`).join(',');
    await supabase('DELETE', `practice_questions?id=in.(${inList})`);
    console.log(`  Deleted ${i + 1}-${Math.min(i + 50, ids.length)}`);
  }

  // Verify remaining
  const remaining = await supabase(
    'GET',
    `practice_questions?select=id,section&passage_id=is.null&limit=1000`
  );
  const remBySec = {};
  for (const q of remaining) {
    remBySec[q.section] = (remBySec[q.section] || 0) + 1;
  }

  console.log(`\nRemaining clean standalone: ${remaining.length}`);
  for (const [sec, count] of Object.entries(remBySec).sort()) {
    console.log(`  ${sec}: ${count}`);
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
