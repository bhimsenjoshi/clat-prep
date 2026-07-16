import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = readFileSync('.env', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(\S+)/)[1];
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(\S+)/)[1];
const sb = createClient(url, key, { auth: { persistSession: false } });

const NAMYATA_ID = '8f60b70d-c949-4d78-941e-dfd1d0827853';

async function main() {
  // Check test attempts
  const { data: attempts } = await sb
    .from('attempts')
    .select('id, total_score, section_scores')
    .eq('student_id', NAMYATA_ID)
    .not('submitted_at', 'is', null);

  console.log(`\n📝 Test Attempts (${attempts?.length || 0}):`);
  for (const a of (attempts || [])) {
    console.log(`  ${a.id?.substring(0,8)}... | Total: ${a.total_score}%`);
    if (a.section_scores) {
      for (const [sec, score] of Object.entries(a.section_scores)) {
        console.log(`    ${sec}: ${JSON.stringify(score)}`);
      }
    }
    // Get response-level data for this attempt
    const { data: responses } = await sb
      .from('responses')
      .select('is_correct, questions!inner(section_id)')
      .eq('attempt_id', a.id);
      
    const total = responses?.length || 0;
    const correct = responses?.filter(r => r.is_correct === true)?.length || 0;
    const acc = total > 0 ? Math.round(correct/total*100) : 0;
    console.log(`    From responses: ${correct}/${total} = ${acc}%`);
  }
}

main().catch(console.error);
