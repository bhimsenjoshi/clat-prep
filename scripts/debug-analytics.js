import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = readFileSync('.env', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(\S+)/)[1];
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(\S+)/)[1];

const supabase = createClient(url, key, { auth: { persistSession: false } });

const NAMYATA_ID = '8f60b70d-c949-4d78-941e-dfd1d0827853';

async function main() {
  // Get all sessions for Namyata
  const { data: sessions } = await supabase
    .from('quiz_sessions')
    .select('*')
    .eq('student_id', NAMYATA_ID)
    .order('started_at', { ascending: false });

  console.log(`\n📊 Namyata's Quiz Sessions (${sessions?.length || 0} total):`);
  
  let grandTotal = 0;
  let grandCorrect = 0;

  for (const s of (sessions || [])) {
    // Fetch actual response data
    const { data: responses } = await supabase
      .from('quiz_responses')
      .select('is_correct, time_taken_seconds')
      .eq('session_id', s.id);

    const respTotal = responses?.length || 0;
    const respCorrect = responses?.filter(r => r.is_correct)?.length || 0;
    
    // Check if session counts match response counts
    const countMatch = s.questions_answered === respTotal;
    
    const section = s.section?.substring(0, 25) || '?';
    const stype = s.session_type || 'practice';
    
    console.log(`  ${s.id?.substring(0, 8)}... | ${stype.padEnd(10)} | ${section.padEnd(25)} | DB: ${String(s.questions_answered).padStart(2)}q/${String(s.correct_count).padStart(2)}c | Actual: ${respTotal}q/${respCorrect}c | ${countMatch ? '✅' : '⚠️ MISMATCH'}`);

    // For analytics: skip abandoned (0 responses), use actual response data
    if (respTotal > 0) {
      grandTotal += respTotal;
      grandCorrect += respCorrect;
    }
  }

  // Overall accuracy from responses (what analytics SHOULD be)
  const acc = grandTotal > 0 ? Math.round((grandCorrect / grandTotal) * 100) : 0;
  console.log(`\n📈 Overall Practice (from response data): ${grandCorrect}/${grandTotal} = ${acc}%`);
  
  // Per-type
  for (const stype of ['practice', 'quick_fire']) {
    let t = 0, c = 0;
    for (const s of (sessions || [])) {
      if ((s.session_type || 'practice') !== stype) continue;
      const { data: responses } = await supabase
        .from('quiz_responses')
        .select('is_correct')
        .eq('session_id', s.id);
      const r = responses || [];
      if (r.length === 0) continue;
      t += r.length;
      c += r.filter(x => x.is_correct).length;
    }
    const a = t > 0 ? Math.round((c / t) * 100) : 0;
    console.log(`  ${stype === 'practice' ? '📚 Practice' : '⚡ Quick Fire'}: ${c}/${t} = ${a}%`);
  }

  // Check editorial reads for Namyata
  const { data: editorial } = await supabase
    .from('editorial_activity')
    .select('read_at, created_at')
    .eq('student_id', NAMYATA_ID)
    .order('read_at', { ascending: false });

  console.log(`\n📰 Editorial reads: ${editorial?.length || 0} total`);
  
  // Per-day breakdown
  const dayCounts = {};
  for (const a of (editorial || [])) {
    const ts = a.read_at || a.created_at;
    if (!ts) continue;
    const d = new Date(ts);
    const ist = new Date(d.getTime() + 5.5*60*60*1000);
    const day = ist.toISOString().split('T')[0];
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  }
  for (const [day, count] of Object.entries(dayCounts).sort().reverse()) {
    console.log(`  ${day}: ${count} reads`);
  }
}

main().catch(console.error);
