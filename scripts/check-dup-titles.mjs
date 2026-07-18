#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const d = dirname(fileURLToPath(import.meta.url));
[resolve(d,'..','.env'), resolve(d,'.env')].forEach(p => {
  if (!existsSync(p)) return;
  readFileSync(p,'utf-8').split('\n').forEach(l => {
    const t=l.trim(); if(!t||t.startsWith('#')) return;
    const i=t.indexOf('='); if(i<0) return;
    const k=t.slice(0,i).trim(), v=t.slice(i+1).trim().replace(/^['\"]|['\"]$/g,'');
    if(!process.env[k]) process.env[k]=v;
  });
});

const U=process.env.NEXT_PUBLIC_SUPABASE_URL, K=process.env.SUPABASE_SERVICE_ROLE_KEY;

(async () => {
  // Check all passage titles for duplicates
  const r = await fetch(U+'/rest/v1/practice_passages?select=id,title,section&limit=200', {
    headers: {'Authorization': 'Bearer '+K, 'apikey': K}
  });
  const all = await r.json();

  const titles = {};
  all.forEach(p => { titles[p.title] = titles[p.title] || []; titles[p.title].push(p); });
  const dups = Object.entries(titles).filter(([t, list]) => list.length > 1);
  console.log('Total passages:', all.length);
  console.log('Duplicate titles:', dups.length);
  dups.forEach(([t, list]) => {
    console.log('  x' + list.length + ':', t.slice(0, 60));
    list.forEach(p => console.log('    #' + p.id.slice(0, 8), p.section));
  });

  // Check the specific passage
  console.log('\n--- Passage #437b0b44 ---');
  const r2 = await fetch(U+'/rest/v1/practice_passages?id=eq.437b0b44-b3c3-4a9c-b90f-880f60d18d16&select=*', {
    headers: {'Authorization': 'Bearer '+K, 'apikey': K}
  });
  const p = await r2.json();
  console.log(JSON.stringify(p[0], null, 2));

  // Questions under it
  const r3 = await fetch(U+'/rest/v1/practice_questions?select=id,question_text,passage_id&passage_id=eq.437b0b44-b3c3-4a9c-b90f-880f60d18d16&limit=20&order=created_at', {
    headers: {'Authorization': 'Bearer '+K, 'apikey': K}
  });
  const qs = await r3.json();
  console.log('\nQuestions:', qs.length);
  qs.forEach((q,i) => console.log('  Q'+(i+1)+' q:'+q.id.slice(0,8), q.question_text.slice(0,60)));
  
  // Check if any question IDs are duplicate in the DB
  const r4 = await fetch(U+'/rest/v1/practice_questions?select=id,question_text,passage_id&passage_id=eq.437b0b44-b3c3-4a9c-b90f-880f60d18d16&limit=20&order=created_at', {
    headers: {'Authorization': 'Bearer '+K, 'apikey': K}
  });
  const qs2 = await r4.json();
  const idCounts = {};
  qs2.forEach(q => { idCounts[q.id] = (idCounts[q.id] || 0) + 1; });
  const dupIds = Object.entries(idCounts).filter(([id, c]) => c > 1);
  if (dupIds.length) {
    console.log('\n⚠️ DUPLICATE QUESTION IDs:', dupIds.length);
    dupIds.forEach(([id, c]) => console.log('  x' + c + ': q:' + id.slice(0, 8)));
  } else {
    console.log('\n✅ No duplicate question IDs');
  }
})();
