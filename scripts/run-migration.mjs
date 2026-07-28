#!/usr/bin/env node
/**
 * Run migration SQL via Supabase service role key.
 * Usage: node scripts/run-migration.mjs supabase/migrations/20260728_quickfire_visual_math_trackers.sql
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load .env
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const sqlFile = process.argv[2];

if (!sqlFile) {
  console.error('Usage: node scripts/run-migration.mjs <sql-file>');
  process.exit(1);
}

if (!existsSync(sqlFile)) {
  console.error(`File not found: ${sqlFile}`);
  process.exit(1);
}

const sql = readFileSync(sqlFile, 'utf-8');
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

console.log(`📋 Running migration: ${sqlFile}`);
console.log(`   ${statements.length} statements to execute`);

const baseUrl = SUPABASE_URL.replace(/\/$/, '');
const headers = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

let successCount = 0;
let failCount = 0;

for (let i = 0; i < statements.length; i++) {
  const stmt = statements[i] + ';';
  // For CREATE/ALTER/SELECT we use different REST paths
  // CREATE TABLE: POST to the table doesn't work, so we use a workaround
  // Instead, batch execute via the REST API
  
  const tableMatch = stmt.match(/CREATE TABLE.*?(?:IF NOT EXISTS\s+)?public\.(\w+)/i);
  const indexMatch = stmt.match(/CREATE INDEX.*?ON\s+public\.(\w+)/i);
  const alterMatch = stmt.match(/ALTER TABLE.*?public\.(\w+)/i);
  const policyMatch = stmt.match(/CREATE POLICY.*?ON\s+public\.(\w+)/i);
  
  const tableName = (tableMatch && tableMatch[1]) || (indexMatch && indexMatch[1]) || (alterMatch && alterMatch[1]) || (policyMatch && policyMatch[1]);
  
  if (tableMatch) {
    // CREATE TABLE — check if already exists first
    const checkUrl = `${baseUrl}/rest/v1/${tableName}?select=id&limit=1`;
    try {
      const checkRes = await fetch(checkUrl, { headers });
      if (checkRes.ok) {
        console.log(`   ⏭️  (${i+1}) Table ${tableName} already exists`);
        successCount++;
        continue;
      }
    } catch {}
    
    // Can't CREATE TABLE via REST. Need to use supabase-js raw SQL.
    // Fall through to the management API approach
    console.log(`   ⚠️ (${i+1}) Cannot CREATE TABLE ${tableName} via REST — trying direct query`);
    
    // Try inserting via a different approach — RPC
    // For now we'll try to use the pg_database extension
    try {
      const rpcRes = await fetch(`${baseUrl}/rest/v1/rpc/`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'text/plain' },
        body: stmt,
      });
      if (rpcRes.ok) {
        successCount++;
        console.log(`   ✅ (${i+1}) ${tableMatch[1]} created`);
      } else {
        const txt = await rpcRes.text();
        console.log(`   ❓ (${i+1}) Response ${rpcRes.status}: ${txt.slice(0, 200)}`);
        failCount++;
      }
    } catch (e) {
      console.log(`   ❌ (${i+1}) ${e.message}`);
      failCount++;
    }
  } else if (policyMatch || alterMatch || indexMatch) {
    // For policies, indexes, and alters, try via a different method
    // These are DDL and can't be done via REST
    console.log(`   ⚠️ (${i+1}) DDL statement (${tableName || 'policy'}) needs manual SQL execution`);
    failCount++;
  } else {
    console.log(`   ⚠️ (${i+1}) Unrecognized statement type — needs manual execution`);
  }
}

console.log(`\n📊 Migration Results: ${successCount} ok, ${failCount} skipped (need manual run)`);
if (failCount > 0) {
  console.log('\n⚠️  Some statements could not be executed via REST API.');
  console.log('   Run this SQL manually in Supabase SQL Editor:');
  console.log('   → https://supabase.com/dashboard/project/_/sql/new');
  console.log('   Or paste the migration file content.');
}
