import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = readFileSync('.env', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(\S+)/)[1];
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(\S+)/)[1];
const sb = createClient(url, key, { auth: { persistSession: false } });

const { data, error } = await sb.from('rate_limits').select('*').limit(5);
console.log('✅ Table exists:', !!data);
console.log('Error:', error?.message || 'none');
if (data) console.log('Rows:', data.length);

// Also smoke-test the checkRateLimit logic directly
const now = Date.now();
const { data: upserted, error: ue } = await sb
  .from('rate_limits')
  .upsert({ key: '__smoke_test__', count: 1, reset_at: new Date(now + 60000).toISOString() }, { onConflict: 'key' })
  .select();
console.log('Upsert:', upserted?.[0]?.key === '__smoke_test__' ? '✅' : '❌', ue?.message || '');

// Cleanup
await sb.from('rate_limits').delete().eq('key', '__smoke_test__');
console.log('✅ Rate limiter ready!');
