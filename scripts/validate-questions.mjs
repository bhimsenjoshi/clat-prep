#!/usr/bin/env node
/**
 * Question Validator — Mechanical + AI Validation for Pending Questions
 *
 * Fetches all practice_questions with validation_status = 'pending',
 * runs mechanical checks on each, then optionally sends flagged questions
 * to DeepSeek AI for deeper validation.
 *
 * Usage:
 *   node scripts/validate-questions.mjs
 *
 * As an imported module:
 *   import { validatePendingQuestions } from './validate-questions.mjs';
 *   const result = await validatePendingQuestions();
 *
 * Requires env: SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL,
 *               NEXT_PUBLIC_SUPABASE_ANON_KEY (DEEPSEEK_API_KEY optional)
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ─── Load .env file ───
const scriptDir = dirname(fileURLToPath(import.meta.url));
const envPaths = [
  resolve(scriptDir, '..', '.env'),
  resolve(scriptDir, '.env'),
];
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
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
    break;
  }
}

// ─── Environment ───
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const SUPABASE_HEADERS = {
  'Content-Type': 'application/json',
  'apikey': ANON_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
};

// CLAT sections
const VALID_SECTIONS = [
  'English Language',
  'Current Affairs Including General Knowledge',
  'Legal Reasoning',
  'Logical Reasoning',
  'Quantitative Techniques',
];

// ─── Supabase REST helpers ───

async function supabaseGet(url) {
  const res = await fetch(url, { headers: SUPABASE_HEADERS });
  if (!res.ok) throw new Error(`Supabase error GET: ${res.status}: ${await res.text()}`);
  return await res.json();
}

async function supabasePatch(url, body) {
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { ...SUPABASE_HEADERS, 'Prefer': 'return=representation' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase error PATCH: ${res.status}: ${text}`);
  }
  return await res.json();
}

async function supabaseInsert(table, rows) {
  if (!rows || rows.length === 0) return [];
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${table}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { ...SUPABASE_HEADERS, 'Prefer': 'return=representation' },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase error inserting ${table}: ${res.status}: ${text}`);
  }
  return await res.json();
}

// ─── Parse options — handles both JSON object and JSON string ───

function parseOptions(raw) {
  if (!raw) return null;
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return null;
}

// ─── Mechanical checks ───

const MECHANICAL_CHECKS = [
  {
    name: 'has_4_options',
    check: (q, opts) => Object.keys(opts || {}).length === 4,
  },
  {
    name: 'options_nonempty',
    check: (q, opts) => {
      if (!opts) return false;
      return Object.values(opts).every(v => typeof v === 'string' && v.trim().length > 0);
    },
  },
  {
    name: 'correct_option_valid',
    check: (q, opts) => {
      const co = q.correct_option;
      return ['A', 'B', 'C', 'D'].includes(co);
    },
  },
  {
    name: 'correct_option_exists',
    check: (q, opts) => {
      if (!opts) return false;
      const co = q.correct_option;
      return co in opts;
    },
  },
  {
    name: 'no_duplicate_options',
    check: (q, opts) => {
      if (!opts) return false;
      const values = Object.values(opts).map(v => String(v).trim().toLowerCase());
      return new Set(values).size === values.length;
    },
  },
  {
    name: 'question_text_exists',
    check: (q, opts) => {
      return typeof q.question_text === 'string' && q.question_text.trim().length > 0;
    },
  },
  {
    name: 'explanation_exists',
    check: (q, opts) => {
      return q.explanation != null && (
        (typeof q.explanation === 'string' && q.explanation.trim().length > 0) ||
        (typeof q.explanation === 'object' && Object.keys(q.explanation).length > 0)
      );
    },
  },
  {
    name: 'difficulty_valid',
    check: (q, opts) => {
      return ['easy', 'medium', 'hard'].includes(String(q.difficulty || '').toLowerCase());
    },
  },
  {
    name: 'section_valid',
    check: (q, opts) => {
      return VALID_SECTIONS.includes(q.section);
    },
  },
  {
    name: 'question_not_passage_copy',
    check: (q, opts) => {
      // If there's a passage, the question_text should NOT be a substring of the passage content
      // This ensures questions are synthesised, not copy-pasted
      if (!q.passage && !q.passage_id) return true; // no passage, skip check
      // passage content could be in a nested object from join, or we check the question text isn't too similar
      const passageContent = q.passage_content || (q.passage && q.passage.content) || null;
      if (!passageContent) return true; // can't check
      const qt = (q.question_text || '').trim().toLowerCase();
      const pc = passageContent.trim().toLowerCase();
      if (!qt || qt.length < 10) return true; // skip for very short questions
      return !pc.includes(qt);
    },
  },
];

// ─── Main validation function ───

async function callDeepSeek(systemPrompt, userPrompt, retries = 2) {
  const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;
  if (!DEEPSEEK_KEY) throw new Error('DEEPSEEK_API_KEY not set — AI validation requires it');

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-v4-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.1,
          max_tokens: 8192,
          response_format: { type: 'json_object' },
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        if (attempt < retries) {
          console.log(`    ⚠️ DeepSeek error ${res.status} (attempt ${attempt}) — retrying...`);
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
        throw new Error(`DeepSeek error ${res.status}: ${text}`);
      }

      const data = await res.json();
      const raw = data?.choices?.[0]?.message?.content;
      if (!raw) throw new Error('Empty DeepSeek response');

      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try { parsed = JSON.parse(jsonMatch[0]); } catch {
            throw new Error('Failed to parse AI response as JSON');
          }
        } else {
          throw new Error('Failed to parse AI response as JSON');
        }
      }

      return parsed;
    } catch (err) {
      if (attempt < retries) {
        console.log(`    ⚠️ Attempt ${attempt} failed: ${err.message} — retrying...`);
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
      throw err;
    }
  }
}

function buildAiValidationPrompt(questionsToValidate) {
  const questionsJson = questionsToValidate.map((q, i) => ({
    index: i,
    id: q.id,
    section: q.section,
    question_text: q.question_text,
    passage_content: q.passage_content || q.passage_text || null,
    options: (() => {
      const opts = parseOptions(q.options);
      return opts || {};
    })(),
    correct_answer: q.correct_option,
    explanation: q.explanation,
    difficulty: q.difficulty,
  }));

  return {
    system: `You are a CLAT question validator. Review each question and flag any issues.

For each question check:
1. ANSWER ACCURACY: Is the correct_answer genuinely correct? Does the explanation support it?
2. OPTION QUALITY: Are all 4 options distinct and plausible (not trivially wrong)?
3. EXPLANATION MATCH: Does the explanation actually explain why the correct answer is right and why others are wrong?
4. PASSAGE RELEVANCE: If there's a passage, does the question genuinely relate to its content? 
5. CLAT APPROPRIATENESS: Is this a CLAT-quality question (tests reasoning/knowledge, not trivia)? For Current Affairs, does it require external knowledge beyond what's in the passage?

Be conservative — only flag questions that have CLEAR issues. If everything looks reasonable, pass it.
Return JSON: { "results": [{ "index": 0, "passed": true, "reasons": [] }, { "index": 1, "passed": false, "reasons": ["Explanation contradicts correct answer"] }] }`,

    user: `Validate these CLAT questions:\n\n${JSON.stringify(questionsJson, null, 2)}`,
  };
}

export async function validatePendingQuestions() {
  if (!SUPABASE_URL || !SERVICE_KEY || !ANON_KEY) {
    throw new Error('Supabase env vars not set (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY)');
  }

  const baseUrl = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/practice_questions`;

  // Fetch ALL pending questions — we need passage_content for the copy check
  // Use a select that includes passage content if passage_id is set
  const fetchUrl = `${baseUrl}?validation_status=eq.pending&select=*,passage:passage_id(content)`;
  console.log(`🔍 Fetching pending questions...`);
  const pendingQuestions = await supabaseGet(fetchUrl);

  if (!pendingQuestions || pendingQuestions.length === 0) {
    console.log(`✅ No pending questions to validate.`);
    return { total: 0, passed: 0, flagged: 0, ai_flagged: 0 };
  }

  console.log(`📋 Found ${pendingQuestions.length} pending questions.`);

  // Flatten passage join: if Supabase returns {passage: {content: "..."}}, hoist it
  for (const q of pendingQuestions) {
    if (q.passage && typeof q.passage === 'object' && q.passage.content) {
      q.passage_content = q.passage.content;
    }
    delete q.passage; // clean up the nested object
  }

  const results = [];
  let passedCount = 0;
  let flaggedCount = 0;

  for (const q of pendingQuestions) {
    const opts = parseOptions(q.options);
    const checksPassed = [];
    const checksFailed = [];

    for (const check of MECHANICAL_CHECKS) {
      const ok = check.check(q, opts);
      if (ok) {
        checksPassed.push(check.name);
      } else {
        checksFailed.push(check.name);
      }
    }

    // Determine overall status
    const overallPassed = checksFailed.length === 0;
    if (overallPassed) {
      passedCount++;
    } else {
      flaggedCount++;
    }

    results.push({
      id: q.id,
      status_before: 'pending',
      status_after: overallPassed ? 'passed' : 'flagged',
      checks_passed: checksPassed,
      checks_failed: checksFailed,
      notes: checksFailed.length > 0
        ? `Failed mechanical checks: ${checksFailed.join(', ')}`
        : null,
    });
  }

  // ─── AI Validation — send mechanically-passed questions to DeepSeek ───
  const mechanicallyPassed = results.filter(r => r.status_after === 'passed');
  let aiFlaggedCount = 0;

  if (mechanicallyPassed.length > 0 && process.env.DEEPSEEK_API_KEY) {
    console.log(`🤖 Running AI validation on ${mechanicallyPassed.length} mechanically-passed questions...`);

    // Build lookup: result item id -> full question data
    const questionById = {};
    for (const q of pendingQuestions) {
      questionById[q.id] = q;
    }

    try {
      const { system, user } = buildAiValidationPrompt(
        mechanicallyPassed.map(r => questionById[r.id]).filter(Boolean)
      );
      const aiResult = await callDeepSeek(system, user);

      if (aiResult && aiResult.results && Array.isArray(aiResult.results)) {
        // Map AI results back to questions using the index
        const mechanicallyPassedQuestions = mechanicallyPassed
          .map(r => questionById[r.id])
          .filter(Boolean);

        for (const aiCheck of aiResult.results) {
          if (aiCheck.passed === false && aiCheck.reasons && aiCheck.reasons.length > 0) {
            const qData = mechanicallyPassedQuestions[aiCheck.index];
            if (qData) {
              const resultItem = results.find(r => r.id === qData.id);
              if (resultItem) {
                resultItem.status_after = 'flagged';
                resultItem.checks_failed.push('ai_check_failed');
                resultItem.notes = `AI flagged: ${aiCheck.reasons.join('; ')}`;
                aiFlaggedCount++;
              }
            }
          }
        }
        console.log(`  🤖 AI flagged ${aiFlaggedCount} questions out of ${mechanicallyPassed.length}`);
      } else {
        console.log(`  🤖 AI validation returned unexpected format — treating all as passed`);
      }
    } catch (aiErr) {
      console.log(`  ⚠️ AI validation error: ${aiErr.message} — all mechanically-passed questions will be marked passed`);
    }
  } else if (mechanicallyPassed.length > 0 && !process.env.DEEPSEEK_API_KEY) {
    console.log(`  ⚠️ No DEEPSEEK_API_KEY set — skipping AI validation. All mechanically-passed questions marked passed.`);
  }

  // Adjust counts after AI validation
  passedCount = results.filter(r => r.status_after === 'passed').length;
  flaggedCount = results.filter(r => r.status_after === 'flagged').length;

  // ─── Batch UPDATE validation_status on practice_questions ───
  console.log(`📝 Updating validation statuses...`);

  for (const r of results) {
    const patchUrl = `${baseUrl}?id=eq.${r.id}`;
    await supabasePatch(patchUrl, { validation_status: r.status_after });
  }
  console.log(`  ✅ Updated ${results.length} questions.`);

  // ─── Insert validation_logs ───
  console.log(`📝 Inserting validation logs...`);

  const logRows = results.map(r => ({
    question_id: r.id,
    validator: 'auto',
    status_before: r.status_before,
    status_after: r.status_after,
    checks_passed: r.checks_passed,
    checks_failed: r.checks_failed,
    notes: r.notes,
  }));

  // Insert in batches of 50 to avoid request size limits
  const BATCH_SIZE = 50;
  for (let i = 0; i < logRows.length; i += BATCH_SIZE) {
    const batch = logRows.slice(i, i + BATCH_SIZE);
    await supabaseInsert('validation_logs', batch);
  }
  console.log(`  ✅ Inserted ${logRows.length} validation log entries.`);

  const summary = {
    total: results.length,
    passed: passedCount,
    flagged: flaggedCount,
    ai_flagged: aiFlaggedCount,
  };

  console.log(`\n📊 Validation complete: ${summary.total} total, ${summary.passed} passed, ${summary.flagged} flagged (${summary.ai_flagged} by AI)`);
  return summary;
}

// ─── Run directly ───

if (process.argv[1] && (process.argv[1] === fileURLToPath(import.meta.url) || process.argv[1].endsWith('validate-questions.mjs'))) {
  validatePendingQuestions()
    .then(result => console.log('\nResult:', JSON.stringify(result)))
    .catch(err => {
      console.error('❌ Fatal:', err.message);
      process.exit(1);
    });
}
