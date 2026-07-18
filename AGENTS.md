<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# CLATly — Project Architecture

## Stack
- **Framework**: Next.js (App Router, `src/` directory)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (client-side) + cookie fallback via `clat-at`
- **Hosting**: Vercel (auto-deploy on push to `main`)
- **Client**: Telegram (Hermes Agent integration)

## Key Conventions

### Auth
- **Client-side**: `supabase.auth.getUser()` is the **authoritative** source — always use this.
- **Server-side**: `getServerUser()` from `@/lib/supabase/server` reads Supabase cookies + `clat-at` cookie fallback. **Stale cookie can cause cross-user data leaks** — when calling server API from client, pass `?uid=` from client-side auth and have the API use it.
- `persistSessionToCookie()` syncs session to `clat-at` cookie after login.

### Database Tables

| Table | Purpose |
|---|---|
| `practice_passages` | Passage text + metadata. Has `content_hash` (SHA-256) for duplicate detection + unique index on (section, title). |
| `practice_questions` | All questions. Passage-linked via `passage_id` (FK ON DELETE SET NULL). Standalone questions have `passage_id IS NULL`. |
| `quiz_sessions` | Practice/quiz sessions per user. Tracks section, answered count. |
| `quiz_responses` | Individual answer records per question in a session. |
| `editorial_activity` | Editorial article reads + quiz attempts per user. |

### Question Types
1. **Passage-linked** (`passage_id IS NOT NULL`) — CLAT-format. Grouped by passage.
2. **Standalone** (`passage_id IS NULL`) — Quick Fire mode only.
3. **Options must be JSON dict**: `{A: "text", B: "text", C: "text", D: "text"}`.

### Practice Flow (important!)
1. Client calls `POST /api/quiz/start` with `{ section }`.
2. API fetches ALL passage-linked questions for section, groups by passage, deduplicates by title (keeps newest per title+section), skips passages where all questions already answered.
3. Returns `{ session_id, questions: [...ordered queue...], total, daily_remaining }`.
4. Client stores the queue in state and serves questions sequentially.
5. `POST /api/quiz/respond` records the answer — the **next question comes from the client-side queue**, NOT from the response.
6. Free users: limited to 10 questions/day (resets on profile's `last_practice_date`).

### Practice Page States
- **Section selector** → picks a section
- **Active quiz** → shows question + passage, timer, pause button
- **Result view** → shows correct/incorrect, explanation, ← Previous / Next → buttons
- **History browsing** (prev mode) → walks back through `trackedResponses` by `historyPos` index
- **Session complete** → summary screen → review answers or practice again

### Duplicate Passage Guardrails
1. **DB level**: Unique index on `(section, title)` via `content_hash` column.
2. **Cron level**: Before inserting, check (a) `content_hash`, then (b) `title+section`. Skip if either matches.
3. **API level**: `/api/quiz/start` deduplicates by title at query time.

### Editorial Stats
- `GET /api/editorials/activity?uid=<user_id>` — accepts `uid` from client-side auth.
- `POST /api/editorials/activity` — records read/quiz events.
- Dashboard and analytics pages both use `?uid=` to avoid stale cookie issues.

### Daily Cron
- Runs via Hermes daily at 0 2 * * * (7:30am IST).
- Script: `scripts/daily-questions-cron.mjs`
- Uses topic bank (50 topics × 4 sections) + `topic_tracker` table to avoid repeating topics.
- Workdir: `~/clat-prep`, sources `.env`.

### Debugging Badges
- Questions show `#XXXXXXXX` (passage ID) and `q:XXXXXXXX` (question ID) in top-right.
- Result view shows `Passage: #XX · q:XX` below question text.
