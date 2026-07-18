# Changelog

All notable changes to CLATly (v1) are documented here.

## [2026-07-18] — Practice flow overhaul, editorial auth fix, duplicate passage fix

### Fixed — `?` as correct answer
- **Root cause**: `/api/quiz/start` destructured `correct_option` out of the first question before sending it to the client. The practice page's `currentCorrectOptionRef` was always `null`.
- **Fix**: Keep `correct_option` in the response; have the practice page read it directly from the question object.

### Fixed — Passage jumping / different passage after Q1
- **Root cause**: The practice page (`/student/practice`) used `remaining_ids` from `/api/quiz/respond` to determine the next question. The respond API returned a **random** order, bypassing the passage-grouped queue that `/api/quiz/start` built.
- **Fix**: Store the full passage-grouped `questionQueue` client-side. `answerQuestion()` serves the next question from this queue instead of relying on the respond API.
- **Files**: `src/app/student/practice/page.tsx`

### Fixed — Duplicate passages (same topic, different content_hash)
- **Root cause**: The daily cron regenerated passages with the same topic title (e.g. "The Paradox of Progress") every day. Since each run produced slightly different content, the `content_hash` guardrail didn't catch it. Both versions persisted in the DB, causing the API to return questions from both — making it feel like Q1-Q4 were from one passage and Q5 was "different."
- **Fix** (3 layers):
  1. **DB cleanup**: Removed 6 pairs of duplicate passages (kept newest per title+section).
  2. **API deduplication**: `/api/quiz/start` now fetches passage titles and keeps only the newest passage per unique `(section, title)` before building the queue.
  3. **Cron guardrail**: Added `title + section` check in `scripts/daily-questions-cron.mjs` — if a passage with the same title exists in the same section, skip instead of generating another.
- **Files**: `scripts/daily-questions-cron.mjs`, `src/app/api/quiz/start/route.ts`

### Fixed — Repeat passages on every restart
- **Root cause**: `/api/quiz/start` always returned the newest passage first, regardless of whether the user had already answered all its questions.
- **Fix**: The API now fetches `quiz_responses` for the user+section and skips any passage where ALL its questions have been answered (only shows passages with unanswered questions).
- **Files**: `src/app/api/quiz/start/route.ts`

### Fixed — Editorial stats showing same data across users
- **Root cause**: The editorial activity API's `GET` handler used `getServerUser()` which reads the `clat-at` cookie. If User A logged out and User B logged in on the same browser, the stale `clat-at` cookie could persist and resolve to User A for the editorial stats (even though the client-side Supabase session correctly identified User B).
- **Fix**:
  1. Added `export const dynamic = 'force-dynamic'` to prevent Vercel response caching.
  2. Dashboard now passes `?uid=` from `supabase.auth.getUser()` (authoritative client-side auth) to the editorial API.
  3. Editorial API accepts `?uid=` and uses it instead of the cookie-based user ID when provided.
  4. Same pattern applied to analytics page.
- **Files**: `src/app/api/editorials/activity/route.ts`, `src/app/student/dashboard/page.tsx`, `src/app/student/analytics/page.tsx`

### Added — Debugging badges (question ID + passage ID)
- Each question card now shows `#XXXXXXXX` (passage ID) and `q:XXXXXXXX` (question ID) badges in the top-right corner.
- Result view shows `Passage: #XX · q:XX` below the question text.
- **Files**: `src/app/student/practice/page.tsx`

### Added — Previous question navigation
- "← Previous" button in the result view now walks back through `trackedResponses` by index (not ref-based, preventing loops).
- "→ Resume Quiz" button appears when at the end of history, returning to the next unanswered question.
- Three render paths: review mode (completed session), prev mode (historyPos), and normal mode.
- **Files**: `src/app/student/practice/page.tsx`

### Added — Answered count display
- Top bar shows `X answered` next to the free questions badge.
- Result card shows `X answered` or `Q1 of X answered` when browsing history.
- **Files**: `src/app/student/practice/page.tsx`
