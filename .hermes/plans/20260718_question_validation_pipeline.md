# Question Validation Pipeline — Implementation Plan

> **Goal:** Add automatic question validation after cron generation, filter production APIs to serve only validated questions, and give you a review dashboard for flagged items.

## Architecture

```
Cron generates questions → Auto-validator checks all pending questions
                                    ↓
                        ┌───────────────────────┐
                        │  validation_status     │
                        │  = 'passed' | 'flagged'│
                        │  | 'pending'           │
                        └───────────────────────┘
                                    ↓
                      ┌──────────────────────────┐
                      │  Production APIs filter   │
                      │  WHERE validation_status  │
                      │  = 'passed'               │
                      └──────────────────────────┘
                                    ↓
                      Admin review page at
                      /admin/review for flagged Q
```

## Files Changed

| File | Change |
|------|--------|
| `supabase/migrations/20260718_question_validation.sql` | NEW — migration |
| `scripts/validate-questions.mjs` | NEW — auto-audit module |
| `scripts/daily-questions-cron.mjs` | MODIFY — call validator after insert |
| `src/app/api/quiz/start/route.ts` | MODIFY — filter by `validation_status = 'passed'` |
| `src/app/api/quiz/quickfire/start/route.ts` | MODIFY — same filter |
| `src/app/api/quiz/respond/route.ts` | MODIFY — fetch question filters |
| `src/app/admin/review/page.tsx` | NEW — review flagged questions |

---

## Step 1: DB Migration

**File:** `supabase/migrations/20260718_question_validation.sql`

Add to `practice_questions`:
```sql
-- Validation status for question quality pipeline
ALTER TABLE public.practice_questions
  ADD COLUMN IF NOT EXISTS validation_status text NOT NULL DEFAULT 'pending'
    CHECK (validation_status IN ('pending', 'passed', 'flagged', 'rejected'));

-- Index for fast filtering
CREATE INDEX IF NOT EXISTS idx_practice_questions_validation_status
  ON public.practice_questions(validation_status);

-- Validation logs table for audit trail
CREATE TABLE IF NOT EXISTS public.validation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.practice_questions(id) ON DELETE CASCADE,
  validator text NOT NULL DEFAULT 'auto',  -- 'auto' | 'manual:admin_id'
  status_before text NOT NULL,
  status_after text NOT NULL,
  checks_passed text[] DEFAULT '{}',
  checks_failed text[] DEFAULT '{}',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_validation_logs_question
  ON public.validation_logs(question_id);
```

---

## Step 2: Auto-Validation Module

**File:** `scripts/validate-questions.mjs`

A Node.js module (zero deps like the cron) that:
1. Fetches ALL `practice_questions` with `validation_status = 'pending'`
2. Runs these checks on each question:

| Check | Description |
|-------|-------------|
| `has_4_options` | Options object has exactly keys A, B, C, D |
| `options_nonempty` | Each option value is non-empty string |
| `correct_option_valid` | `correct_option` is one of A/B/C/D |
| `correct_option_matches` | `correct_option` key exists in options |
| `no_duplicate_options` | No two options have identical text |
| `question_text_exists` | `question_text` is non-empty |
| `question_not_passage_copy` | Question text is not a substring of passage (if passage exists) |
| `explanation_exists` | Explanation is non-empty |
| `difficulty_valid` | One of easy/medium/hard |
| `section_valid` | One of the 5 CLAT sections |

3. Sets `validation_status`:
   - All checks pass → `'passed'`
   - Any check fails → `'flagged'`
4. Writes to `validation_logs` with which checks passed/failed
5. Returns summary object

---

## Step 3: Cron Integration

**File:** `scripts/daily-questions-cron.mjs`

After the insert block (line 544), add:
```js
// Step 5: Run auto-validation on newly inserted questions
const { validatePendingQuestions } = await import('./validate-questions.mjs');
const validationResult = await validatePendingQuestions();
console.log(`    🔍 Validation: ${validationResult.passed} passed, ${validationResult.flagged} flagged`);
```

Also update final output to include validation counts.

---

## Step 4: API Filtering

### `/api/quiz/start/route.ts`
Add `.eq('validation_status', 'passed')` to the `practice_questions` query at line 76:
```ts
.from('practice_questions')
.select(...)
.eq('section', section)
.eq('validation_status', 'passed')  // ← ADD
.not('passage_id', 'is', null);
```

### `/api/quiz/quickfire/start/route.ts`
Same filter on the standalone questions query:
```ts
.from('practice_questions')
.select(...)
.eq('section', section)
.eq('validation_status', 'passed')  // ← ADD
.is('passage_id', null)
```

### `/api/quiz/respond/route.ts`
Add filter to the question fetch:
```ts
.from('practice_questions')
.select(...)
.eq('id', question_id)
.eq('validation_status', 'passed')  // ← ADD
.single()
```

---

## Step 5: Admin Review Page

**File:** `src/app/admin/review/page.tsx`

Simple page showing:
- Count summary: Pending / Passed / Flagged / Rejected
- Table of flagged questions with:
  - Question text (truncated)
  - Section
  - Failed checks list
  - Actions: Approve (→ passed) / Reject (→ rejected)
- Bulk approve all flagged button

---

## Step 6: Backfill

After migration runs, trigger validation on ALL existing `pending` questions:
```bash
node scripts/validate-questions.mjs
```

---

## Risks & Tradeoffs

1. **No questions in production if validator fails** — the cron already inserts + validates in the same run, so if validation breaks, new questions stay `pending` and students just see old questions. The cron report will show 0 passed.
2. **False positives** — the checks are conservative. If a question legitimately has fewer options (unlikely for CLAT), it'll be flagged. You can manually approve.
3. **Performance** — the validation queries all pending questions and runs simple checks. With <5000 questions this is sub-second.
