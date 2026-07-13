# CLAT Prep — Existing Test Suite Report
## Generated: July 13, 2026

### Test Suite Overview

| Test File | Lines | Type | Purpose |
|---|---|---|---|
| `src/__tests__/exam-flow.test.ts` | 312 | Unit (pure functions) | Exam question grouping, scoring, section validation |
| `src/__tests__/timer-countdown.test.ts` | 260 | Unit (React state sim) | Timer lifecycle: start, retake, exit, refresh |
| `src/__tests__/db-lifecycle.test.ts` | 277 | Integration (Supabase) | Attempt CRUD, RLS policies, retake flow |

### Config
- **Runner**: Vitest 4.x with jsdom environment
- **Alias**: `@` → `src/`
- **Setup**: `src/__tests__/setup.ts`
- **Pattern**: `src/__tests__/**/*.test.{ts,tsx}`

---

### 1. `exam-flow.test.ts` (312 lines)

**Purpose**: Validates exam data processing functions

| Test | Description |
|---|---|
| `groupByPassage` groups questions without passage together | 2 null-passage questions → 1 group |
| `groupByPassage` groups questions with same passage | 2 questions with same passage → 1 group |
| `groupByPassage` handles mixed passages | Mix of null + different passages → separate groups |
| `groupByPassage` handles empty array | [] → [] |
| `calcScore` returns 0 for no attempted questions | [] → 0 |
| `calcScore` calculates correct +1, incorrect -0.25 | 4 correct, 1 wrong → 3.75 |
| `calcScore` floors at 0 | All wrong → 0 (not negative) |
| `getSectionsForTest` returns proper section structure | 5 sections with correct order/names |
| `validateTestStructure` checks 120 total questions | Sum of section question counts = 120 |
| `validateTestStructure` checks section count = 5 | Exactly 5 sections required |
| `validateTestStructure` checks for empty sections | Empty section → invalid |

### 2. `timer-countdown.test.ts` (260 lines)

**Purpose**: Simulates React timer state transitions for exam lifecycle

| Test | Description |
|---|---|
| Timer starts at 7200 on first render | Fresh mount → timeLeft = 7200 |
| Timer counts down every second | 3 ticks → 7197 |
| Timer stops when submitted=true | submitted flag stops interval |
| Timer stops when loading=true | loading flag prevents interval |
| Timer stops when no test/attemptId | Guards prevent interval without data |
| Retake: timer resets to 7200 | After exit, new attempt → 7200 |
| Exit: timer stops and resets | exit sets submitted=true, resets to 7200 |
| Page refresh: timer restores from DB | Simulated DB restore (7200 - elapsed) |
| Auto-submit at 0 | timer hits 0 → submitted=true |
| Cleanup on unmount | interval cleared via return fn |

### 3. `db-lifecycle.test.ts` (277 lines)

**Purpose**: End-to-end Supabase integration tests

| Test | Description |
|---|---|
| Inserts attempt row | CREATE attempt for test+user → row exists |
| Deletes attempt row | DELETE attempt → row gone |
| Delete cascades to responses | DELETE attempt → responses also deleted |
| Full lifecycle: start→submit→retake | INSERT → UPDATE submitted_at → INSERT new |
| RLS blocks other user's attempts | User A cannot SELECT user B's attempt |
| Unique constraint prevents duplicate active attempts | 2nd INSERT for same (test,user) fails |
| No orphan responses after attempt delete | DELETE attempt → 0 remaining responses |
| No orphan quiz_sessions after student profile delete | CASCADE on profiles(id) |
| Multiple attempts allowed after submit | Submitted attempt + new INSERT = 2 rows |
| Student can DELETE own attempt | Auth user deletes own attempt |
| Student can DELETE even after time passes | Old attempt deletable |
| Same test can have attempt from different students | Student A + Student B → 2 rows |
| Empty responses table after cleanup | After cascade, no orphan rows |

---

### Migration Checklist (Pre-Change Snapshot)

**Schema files before changes:**
- `src/lib/db/practice_quiz.sql` — Section CHECK constraints, no passage metadata
- `scripts/daily-questions-cron.mjs` — Uses `['English', 'Current Affairs', ...]` array
- `src/types/index.ts` — `SectionName` type with old names
- `src/app/student/quiz/page.tsx` — `SECTIONS` array with old names
- `src/app/student/quiz/[section]/page.tsx` — `SECTION_MAP` with old names
- `src/app/student/practice/page.tsx` — `SECTIONS` array with old names
- `src/app/api/quiz/start/route.ts` — `validSections` array with old names
