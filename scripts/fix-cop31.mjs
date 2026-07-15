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

async function main() {
  // Fix Q2: remove passage reference
  const { error: e2 } = await s.from('practice_questions')
    .update({ question_text: 'Which major global infrastructure project did India launch at the COP31 summit?' })
    .eq('section', 'Current Affairs Including General Knowledge')
    .ilike('question_text', '%solar grid%');
  console.log('Q2 fix:', e2 ? e2.message : 'OK');

  // Verify
  const { data } = await s.from('practice_questions')
    .select('id, question_text')
    .is('passage_id', null)
    .ilike('question_text', '%cop31%');
  console.log('\nFinal:');
  for (const q of data) {
    console.log('  ' + q.question_text.substring(0, 100));
  }
}
main().catch(console.error);
