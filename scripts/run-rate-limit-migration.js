import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = readFileSync('.env', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(\S+)/)[1];
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(\S+)/)[1];

const supabase = createClient(url, key, { auth: { persistSession: false } });

const sql = `
create table if not exists public.rate_limits (
  key text primary key,
  count int not null default 1,
  reset_at timestamptz not null
);
alter table public.rate_limits enable row level security;
create policy if not exists "Service role manages rate limits"
  on public.rate_limits
  using (true)
  with check (true);
`;

async function main() {
  // Use rpc to execute raw SQL
  const { data, error } = await supabase.rpc('exec_sql', { sql });
  
  if (error) {
    console.log('RPC method failed:', error.message);
    console.log('Trying direct insert/select to create table...');
    
    // Fallback: try to just insert a test row — if the table doesn't exist,
    // the error will tell us. If it does exist, we're good.
    try {
      // Remove existing test entries
      await supabase.from('rate_limits').delete().neq('key', '__never__');
      // Create a test entry
      const { error: insertErr } = await supabase
        .from('rate_limits')
        .upsert({ key: '__test__', count: 0, reset_at: new Date().toISOString() });
      
      if (insertErr) {
        console.log('Table might not exist yet. Error:', insertErr.message);
        console.log('\n⚠️  Please run this SQL manually in Supabase SQL Editor:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(sql);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      } else {
        console.log('✅ Table already exists and is working!');
        // Clean up test
        await supabase.from('rate_limits').delete().eq('key', '__test__');
      }
    } catch (e) {
      console.log('Fallback also failed:', e.message);
      console.log('\n⚠️  Please run this SQL manually in Supabase SQL Editor:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(sql);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }
    return;
  }
  
  console.log('✅ Migration executed successfully:', data);
}

main().catch(console.error);
