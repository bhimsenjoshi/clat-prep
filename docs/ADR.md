# Architecture Decision Record — CLAT Prep Hub

> **Date:** July 2026  
> **Status:** Accepted  
> **Deciders:** Bhimsen (@Bhimsen443)  
> **Last Updated:** July 8, 2026

---

## 1. Technology Stack

### 1.1 Next.js 16 (App Router)

**Decision:** Next.js 16 App Router + React 19 Server Components

**Rationale:** Built-in API routes, SSR for fast loads, Vercel auto-deploy, large contributor pool.

### 1.2 Supabase (Postgres + Auth)

**Decision:** Supabase PostgreSQL with RLS + service role key for admin ops

**Rationale:** Relational data, built-in auth, free tier (500MB DB, 50k MAU), RLS for per-row security.

### 1.3 DeepSeek AI

**Decision:** DeepSeek Chat API — single AI backend (no Gemini fallback)

**Rationale:** At ~₹0.10/test, it's the cheapest quality option. Gemini fallback considered but not implemented yet — DeepSeek uptime has been reliable.

### 1.4 Vercel (Hobby) + Cloudflare

**Decision:** Vercel auto-deploy + Cloudflare DNS proxy + SSL Full Strict

**Rationale:** ₹0 hosting, auto-deploys from GitHub push, Cloudflare for DNS management and email routing.

---

## 2. Key Architecture Decisions

### ADR-001: Custom Cookie Auth (`clat-at` / `clat-rt`)

**Context:** Supabase SSR package had cookie-name conflicts. Middleware reads `clat-at`, but server API routes couldn't find the user.

**Decision:** Custom cookie names + `getServerUser()` fallback helper.

```typescript
// src/lib/supabase/server.ts
export async function getServerUser() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) return { user, supabase };

  // Fallback: read clat-at cookie directly
  const clatAt = cookies().get('clat-at')?.value;
  if (clatAt) {
    const { data: { user: tokenUser } } = await supabase.auth.getUser(clatAt);
    if (tokenUser) {
      await supabase.auth.setSession({ ... }); // Sync session
      return { user: tokenUser, supabase };
    }
  }
  return { user: null, supabase };
}
```

**Files:** `src/lib/supabase/server.ts`, `src/lib/supabase/client.ts`, `src/middleware.ts`

---

### ADR-002: Practice Quiz Model (No Tests/Sections Tables)

**Context:** Original design had `tests` + `sections` + `questions` tables. Simplified to direct question consumption.

**Decision:** Single `practice_questions` table. Students pick a CLAT section → API fetches random questions filtered by section.

**Files:** `src/app/api/quiz/start/route.ts`, `src/app/api/quiz/respond/route.ts`

---

### ADR-003: Daily Count Decrement on Answer

**Context:** Daily limit was decremented when a quiz session started. Students who opened a quiz and left wasted their daily quota.

**Decision:** Decrement only happens in `/api/quiz/respond` — when a student actually answers a question.

**Files:** `src/app/api/quiz/respond/route.ts`

---

### ADR-004: Daily Question Generation (Hybrid Cron + Admin)

**Context:** Need fresh questions daily without manual work.

**Decision:** Two-trigger system:
1. **Hermes cron** — `30 1 * * *` (7:00 AM IST), `no_agent=true` script execution
2. **Admin button** — POST `/api/admin/generate-daily`

Both use the same `scripts/daily-questions-cron.mjs` logic. Zero npm dependencies (Node 18+ built-in `fetch`).

**Key design choices:**
- `response_format: { type: 'json_object' }` forces structured AI output
- `normalise()` handles AI naming quirks (`question`/`question_text`, `correct_answer`/`correct_option`, array/object options)
- Supabase REST API (not client SDK) to avoid npm deps
- `source='daily'` tag for question origin tracking

**Files:** `scripts/daily-questions-cron.mjs`, `src/app/api/admin/generate-daily/route.ts`

---

### ADR-005: `source` Column for Question Origin

**Context:** Need to distinguish AI-generated questions from manual/PYQ imports.

**Decision:** `practice_questions.source` column with values: `manual`, `daily`, `pyq`.

**Status:** Column exists. `daily` is active. `pyq` reserved for future import.

---

### ADR-006: Zero-Dependency Cron Script

**Context:** Hermes cron needs to run the script daily. `npm install` takes 30-60s on the VM and can fail.

**Decision:** Script uses only Node.js built-in APIs (`fetch`, `JSON`, `console`). No npm packages. Supabase inserts via REST API with `fetch()`.

**Rationale:** Eliminates install failures, faster cron ticks, no version conflicts.

---

### ADR-007: Flexible AI Response Parsing

**Context:** DeepSeek is inconsistent with JSON key naming — sometimes uses `question_text`, sometimes `question`, sometimes `correct_option`, sometimes `correct_answer`.

**Decision:** `normalise()` function accepts all known variants and falls back gracefully.

```javascript
const question_text = q.question_text || q.question;
const correct_answer = q.correct_option || q.correct_answer || q.correctAnswer;
// Array options → {"A":"...", "B":"...", "C":"...", "D":"..."}
```

---

## 3. Database Schema (Current)

### `practice_questions`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| section | text | CLAT section name |
| topic | text | Optional |
| question_text | text | The question |
| passage | text | Optional passage |
| options | jsonb | `{"A":"...","B":"...","C":"...","D":"..."}` |
| correct_option | text | Single letter |
| explanation | text | |
| difficulty | text | Check constraint: `easy`/`medium`/`hard` |
| source | text | `manual`/`daily`/`pyq` |
| tags | jsonb | Optional |
| created_at | timestamptz | |

### `profiles`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK → auth.users |
| email | text | |
| role | text | `student`/`admin` |
| daily_questions_limit | int4 | Default 10 |
| questions_used_today | int4 | Reset daily |

Plus `quiz_sessions` and `quiz_answers` for attempt tracking.

---

## 4. Data Flows

### Question Generation Flow
```
Trigger (cron 7am IST OR admin button)
  → scripts/daily-questions-cron.mjs
  → For each of 5 sections (sequential):
      → POST DeepSeek API (response_format: json_object)
      → JSON.parse → normalise() → filter(Boolean)
      → POST Supabase REST API (service_role key)
  → Output: "✅ English: 5 | CA: 5 | ... | Total: 25"
```

### Quiz Flow
```
Student clicks section → POST /api/quiz/start
  → Fetch random questions from practice_questions (filtered by section)
  → Create session → Return questions
→ Student answers → POST /api/quiz/respond
  → Check → Correct? Update attempt
  → Decrement daily_questions_used (only on answer)
  → Return result + explanation
```

---

## 5. Cost Budget (Actual)

| Service | Cost | Notes |
|---------|------|-------|
| Vercel Hobby | ₹0 | Unlimited projects, shared free tier |
| Supabase Free | ₹0 | 500MB DB, 50k MAU |
| Cloudflare | ₹0 | DNS proxy, Email Routing, SSL |
| Domain (clatly.com) | $10.46/yr | ₹870/yr (~₹72/month) |
| DeepSeek AI (25 questions/day) | ~₹1/day | ~₹30/month |
| **Total** | **~₹102/month** | |

---

## 6. Future Considerations

| Topic | Plan |
|-------|------|
| PYQ Import | Use `source='pyq'` column; import from PDF/excel |
| Question validation | Review queue before questions go live (#13, #15, #16) |
| WhatsApp | Shelved (#25) — Meta Business API too complex |
| Advanced analytics | Weak-topic recommendations from attempt data |
| More students | Scale: PgBouncer for connection pooling |

---

## 7. References

- [ARCHITECTURE.md](../ARCHITECTURE.md) — Full system design
- [PRD.md](./PRD.md) — Product requirements
- [GitHub Repo](https://github.com/bhimsenjoshi/clat-prep)
