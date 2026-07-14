# CLAT Prep Hub — Architecture & System Design

> **Version:** 3.0  
> **Last Updated:** July 14, 2026

---

## 🎯 Overview

CLAT Prep Hub is a Next.js 16 web app for CLAT (Common Law Admission Test) aspirants. It delivers AI-generated & original CLAT-pattern questions across 5 sections with instant feedback, progress tracking, daily content refresh, editorial system, and original exam papers.

**Domain:** [clatly.com](https://clatly.com)  
**Stack:** Next.js 16 + Supabase (Postgres + Auth) + DeepSeek AI / Gemini fallback  
**Deploy:** Vercel (Free) + Cloudflare (DNS/SSL)  
**Cost:** ₹0/month (hosting) + ~₹30/month (AI generation)

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                          Cloudflare                                │
│         DNS (proxy ON) · SSL Full Strict                          │
│         Email Routing → Gmail (₹0/mo)                            │
│         Root → www redirect                                       │
└───────────────────────────┬──────────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────────┐
│                          Vercel                                    │
│                  clatly.com → clat-prep project                    │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │                  Next.js 16 App Router                    │     │
│  │                                                           │     │
│  │  ┌──────────┐  ┌──────────┐  ┌────────────────────────┐ │     │
│  │  │  Public   │  │  Auth    │  │  Student Pages          │ │     │
│  │  │          │  │          │  │  ┌──────┬──────┬─────┐ │ │     │
│  │  │ Landing  │  │ Login    │  │  │Dash  │Quiz  │Exam │ │ │     │
│  │  │ Page     │  │ Signup   │  │  │board │      │     │ │ │     │
│  │  │          │  │ Callback │  │  ├──────┼──────┼─────┤ │ │     │
│  │  └──────────┘  └──────────┘  │  │Analyt│Prac  │Lead │ │ │     │
│  │                              │  │ics   │tice  │board│ │ │     │
│  │  ┌─────────────┐             │  ├──────┴──────┴─────┤ │ │     │
│  │  │ Admin Pages │             │  │ Profile (upgrade)  │ │ │     │
│  │  │ dashboard   │             │  └───────────────────┘ │ │     │
│  │  │ students/   │             └────────────────────────┘ │     │
│  │  │ tests/*     │                                        │     │
│  │  └─────────────┘                                        │     │
│  │                                                           │     │
│  │  API Routes:                                              │     │
│  │  /api/auth/* · /api/quiz/* · /api/editorials/*           │     │
│  │  /api/me · /api/generate-test · /api/debug               │     │
│  │  /api/whatsapp/* · /api/admin/*                          │     │
│  │                                                           │     │
│  │  Auth: Supabase SSR (cookies: clat-at/clat-rt/clat-sv)    │     │
│  │  Middleware: guards /student/* /admin/*, checks sv cookie │     │
│  └─────────────────────────────────────────────────────────┘     │
└───────────────────────────┬──────────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────────┐
│                        Supabase                                   │
│                                                                   │
│  ┌────────────────────┐  ┌──────────────────────────────────┐    │
│  │      Auth          │  │          Postgres                 │    │
│  │  (JWT + cookies)   │  │                                   │    │
│  │                    │  │  Profiles (sub_plan, sv, promo)   │    │
│  │  Signup / Login    │  │  practice_questions               │    │
│  │  Password change   │  │  quiz_sessions + quiz_responses   │    │
│  │  Session mgmt      │  │  tests + attempts + responses     │    │
│  └────────────────────┘  │  original_papers / sections       │    │
│                          │    / passages / questions          │    │
│                          │  editorial_activity                │    │
│                          │  upgrade_log                       │    │
│                          │  RLS policies (student/admin)      │    │
│                          └──────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
                            ▲
                            │ (DeepSeek + Gemini API — generation)
┌───────────────────────────┴──────────────────────────────────────┐
│                    AI Generation Layer                              │
│                                                                     │
│  Primary: DeepSeek (deepseek-chat, structured JSON output)         │
│  Fallback: Gemini 3.5 Flash (Google)                               │
│                                                                     │
│  Generates:                                                         │
│  → 25 daily practice questions (5/section, passage-based)          │
│  → Editorial quizzes (3 MCQs per article, premium-only)            │
│  → Structured JSON with passage, options {A,B,C,D}, explanation    │
│                                                                     │
│  Quality rules enforced via prompts:                                │
│  - No direct recall / trivia questions only inference              │
│  - 6 questions per passage                                         │
│  - Mandatory computation in Quant, principle-apply in Legal        │
└──────────────────────────────────────────────────────────────────┘
                            ▲
                            │ (Hermes Cron — no_agent mode)
┌───────────────────────────┴──────────────────────────────────────┐
│               VM (Hermes Agent — Nova profile)                     │
│                                                                     │
│  Cron Jobs:                                                         │
│  → Daily questions: scripts/daily-questions-cron.mjs               │
│      Schedule: 0 2 * * * (7:30am IST)                              │
│      Type: no_agent=true · zero npm deps                           │
│  → WhatsApp report (manual/on-demand)                              │
│                                                                     │
│  Profile: nova (default)                                           │
│  Fallback model: DeepSeek v4 Flash                                 │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
clat-prep/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing page
│   │   ├── layout.tsx                  # Root layout + ThemeProvider
│   │   ├── auth/
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   ├── callback/route.ts
│   │   │   └── redirect/page.tsx
│   │   ├── student/
│   │   │   ├── dashboard/page.tsx      # Main dashboard
│   │   │   ├── analytics/page.tsx      # Practice/Tests/Editorials
│   │   │   ├── practice/page.tsx       # Practice quiz engine
│   │   │   ├── quiz/page.tsx           # Section picker hub
│   │   │   ├── quiz/[section]/page.tsx # Per-section quiz
│   │   │   ├── exams/page.tsx          # Original CLAT papers listing
│   │   │   ├── exams/[id]/page.tsx     # 120-min exam timer
│   │   │   ├── exams/[id]/review/      # Exam review + scores
│   │   │   ├── profile/page.tsx        # Profile + upgrade
│   │   │   └── leaderboard/page.tsx    # Student rankings
│   │   ├── admin/
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── students/page.tsx
│   │   │   └── tests/[id]/page.tsx
│   │   └── api/
│   │       ├── auth/login/signin/route.ts
│   │       ├── quiz/start/route.ts
│   │       ├── quiz/respond/route.ts
│   │       ├── editorials/route.ts      # RSS fetch
│   │       ├── editorials/quiz/route.ts # AI quiz gen
│   │       ├── editorials/activity/route.ts # Log + stats
│   │       ├── me/route.ts             # Current user
│   │       ├── generate-test/route.ts
│   │       ├── debug/route.ts
│   │       ├── whatsapp/register/route.ts
│   │       ├── whatsapp/webhook/route.ts
│   │       ├── whatsapp/send-quiz-result/route.ts
│   │       └── admin/generate-daily/route.ts
│   ├── app/api/auth/login/signin/route.ts # Session-version login
│   ├── middleware.ts                     # Auth guard + sv check
│   ├── components/
│   │   ├── PageHeader.tsx
│   │   ├── SectionCard.tsx
│   │   ├── ThemeToggle.tsx
│   │   ├── ChangePassword.tsx
│   │   └── admin/StudentTable.tsx
│   ├── lib/
│   │   ├── supabase/client.ts
│   │   ├── supabase/server.ts           # getServerUser()
│   │   └── theme/ThemeProvider.tsx
│   └── types/
├── scripts/
│   ├── daily-questions-cron.mjs          # Zero-dep cron (25 Q/day)
│   └── daily-whatsapp-report.mjs         # WhatsApp daily report
├── docs/
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── ADR.md
│   └── legal-consultation.md
├── supabase/
│   ├── config.toml
│   └── migrations/                       # SQL migrations
├── .env                                  # Gitignored (secrets)
├── next.config.ts
├── vercel.json
├── package.json
└── tsconfig.json
```

---

## 🗄️ Database Schema

### `profiles`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, FK → auth.users |
| email | text | |
| full_name | text | |
| role | text | `student` \| `admin` |
| subscription_plan | text | `free` \| `premium` \| `max` |
| is_promo_user | boolean | Free premium upgrade (Jul 31, first 20) |
| daily_free_questions | int4 | Decremented on answer |
| session_version | int4 | 1↔2 toggle for concurrent device limit |
| avatar_url | text | Profile picture |
| created_at | timestamptz | |

### `practice_questions` (AI-generated daily questions)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| section | text | `English Language`, `Current Affairs Including General Knowledge`, etc. |
| topic | text | Optional topic tag |
| question_text | text | The question |
| passage | text | Optional passage (passage-linked Q have this) |
| passage_id | uuid | Links to `practice_passages` |
| options | jsonb | `{"A":"...","B":"...","C":"...","D":"..."}` — **MUST be dict, not list** |
| correct_option | text | Letter A/B/C/D |
| explanation | text | Structured explanation |
| difficulty | text | `easy` \| `medium` \| `hard` |
| source | text | `manual` \| `daily` \| `pyq` |
| tags | jsonb | Metadata tags |
| generated_by | text | AI model name |
| created_at | timestamptz | |

### `practice_passages`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| section | text | CLAT section |
| passage_text | text | Passage content |
| source | text | `daily` |
| generated_at | timestamptz | |

### `quiz_sessions`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| student_id | uuid | FK → profiles |
| section | text | CLAT section practiced |
| topic | text | |
| questions_answered | int4 | Count (may be inflated due to past bug — now accurate from backfill) |
| correct_count | int4 | |
| started_at | timestamptz | |
| ended_at | timestamptz | |

### `quiz_responses`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| session_id | uuid | FK → quiz_sessions |
| question_id | uuid | |
| selected_option | text | A/B/C/D |
| is_correct | boolean | |
| time_taken_seconds | int4 | |
| created_at | timestamptz | |

### `original_papers` / `sections` / `passages` / `questions` / `answer_keys`
5-table normalized schema for authentic CLAT papers (CLAT 2025 UG Set A, CLAT 2026 UG, Mock Test #2, Full Length Mock).

| Table | Key Columns |
|-------|-------------|
| `original_papers` | id, year, set_name, total_questions, type |
| `sections` | id, paper_id, name, order_index, question_count |
| `passages` | id, section_id, passage_text, order_index |
| `questions` | id, section_id, passage_id, question_text, options (JSON dict `{A,B,C,D}`), correct_option, order_index |
| `answer_keys` | id, question_id, correct_option, explanation |

### `editorial_activity`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK → profiles |
| source_id | text | RSS source identifier |
| article_url | text | |
| article_title | text | |
| action | text | `read` \| `quiz` |
| correct | int4 | Quiz score |
| total | int4 | Quiz total |
| created_at | timestamptz | |

### `upgrade_log`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| student_id | uuid | |
| old_plan | text | |
| new_plan | text | |
| upgraded_by | uuid | Admin who performed upgrade |
| created_at | timestamptz | |

---

## 🔐 Authentication & Session Flow

### Auth Chain
```
Browser → middleware.ts (reads clat-at cookie)
  → If absent: redirect to /auth/login
  → If present: verify with Supabase SSR, check clat-sv match
  → If clat-sv mismatch: delete cookie → force re-login
  → Proceed to /student/* or /admin/*
```

### Cookie Strategy
| Cookie | Purpose | Set by |
|--------|---------|--------|
| `clat-at` | Supabase access token | Login route + middleware |
| `clat-rt` | Supabase refresh token | Login route |
| `clat-sv` | Session version (1 or 2) | Login route — toggles on each login |

### Concurrent Session Limit
- Login toggles `session_version` (1↔2) in DB + sets `clat-sv` cookie
- Middleware checks `clat-sv` cookie against DB `session_version` on every page load
- Mismatch → cookie dropped → user redirected to login (old device kicked)
- Max 2 concurrent devices

### Admin Access
- Role check on `profiles.role = 'admin'`
- Admin pages at `/admin/*` guarded by middleware
- Admin can manage students, create/modify tests, generate daily questions

### Fallback: `getServerUser()`
- Server-side helper reads `clat-at` cookie directly when Supabase SSR session is stale
- Avoids redirect loops during long-running server operations

---

## ❓ Question Generation Pipeline

### Daily Cron (Hermes)
```
Script:   scripts/daily-questions-cron.mjs
Schedule: 0 2 * * *  (2:00am UTC = 7:30am IST)
Type:     no_agent=true (direct script execution)
Delivery: origin (Telegram notification)
```

### Flow
1. Cron triggers → Node.js script runs (built-in `fetch`, zero npm deps)
2. For each of 5 sections, calls DeepSeek API with section-specific prompt
3. Prompts enforce: 1 passage → 6 questions, inference-only, CLAT-topic-approved
4. DeepSeek returns JSON with `questions` array + passage text
5. Script normalises field names (handles `question`/`question_text`, `correct_answer`/`correct_option`, array/object options)
6. Inserts passage → `practice_passages` table, then questions → `practice_questions`
7. Tags with `source='daily'`
8. Logs results → delivered to Telegram

### Editorial Quiz Generation
- Triggered via dashboard "Quiz" button on editorial cards
- Posts headline + source to `/api/editorials/quiz`
- DeepSeek generates 3 MCQs on editorial's topic area
- **Premium/max only** — free users see upgrade CTA

### Admin Manual Trigger
```
POST /api/admin/generate-daily
Auth: Admin cookie OR x-cron-key header
```
Same logic as cron — calls `generateAllSections()` helper.

### Cost
| Item | Cost |
|------|------|
| 25 questions/day DeepSeek API | ~₹1/day (~₹30/month) |
| Supabase (Free) | ₹0 |
| Vercel (Free) | ₹0 |
| Cloudflare | ₹0 |
| Domain (clatly.com) | $10.46/year (₹870/year) |
| **Total running cost** | **~₹30/month** |

---

## 🧪 Quiz Flow (Practice)

1. **Student Dashboard** → Quick Practice cards or `/student/practice`
2. **Start Quiz** → creates `quiz_sessions` row, fetches first question from `practice_questions`
3. **Passage display** — collapsible passage shown above question (passage-linked Q)
4. **Answer** → POST `/api/quiz/respond` → `quiz_responses` insert + decrement daily limit
5. **Instant feedback** — correct/incorrect badge + explanation shown immediately
6. **Navigation** — Next/Back buttons, progress tracker
7. **Session end** → summary with correct/incorrect counts
8. **Recent Activity** — dashboard + analytics show per-session results

---

## 📝 Exam Flow (Original CLAT Papers)

1. **Exams page** (`/student/exams`) lists available papers
2. **Start exam** → creates `attempts` row with `started_at` → 120-min countdown
3. **Timer** — server-side expires_at recalibration, no localStorage drift, auto-submit on expiry
4. **Navigation** — sections left sidebar, back/next within section, question palette
5. **Pause/Resume** — pauses timer, hides content
6. **Exit** → confirmation modal, deletes in-progress attempt from DB
7. **Submit** → locks answers, scores section-wise, shows total + section scores
8. **Review** → per-question review with correct answers + explanations
9. **Retake** → dropped unique constraint on (test_id, student_id) allows unlimited retakes

---

## 📊 Analytics System

### Pages
| Page | Tabs | Data Source |
|------|------|-------------|
| `/student/analytics` | Practice / Tests / Editorials | `quiz_sessions` + `quiz_responses`, `attempts` + `responses`, `editorial_activity` |

### Computed Metrics
- **Practice total**: `SUM(questions_answered)` from `quiz_responses` (actual, not `quiz_sessions.questions_answered`)
- **Practice by section**: Filtered by exact section name (`English Language`, etc.)
- **Accuracy**: `correct / total * 100`
- **Test scores**: `total_score` from `attempts`, `section_scores` JSON
- **Editorial stats**: Daily reads line graph, total reads/quizzes, quiz accuracy

### Gating
- Practice analytics & editorial stats are visible to all
- Detailed breakdowns (locked with `LockedSection` component) require premium/max

---

## 📰 Editorial System

### RSS Ingestion
- 3 sources: The Hindu, Indian Express, LiveLaw
- Fetched via `<url>/feed` RSS/Atom endpoint on page load
- Each source gets independent fetch with timeout + error handling
- Displayed as 3×3 grid (3 per source) on dashboard

### Activity Tracking
- `editorial_activity` table logs every `read` (click to open article) and `quiz` (quiz taken)
- Dashboard shows ✅/📖 toggle per article
- Analytics tab shows daily reads line graph (30 days)

### Editorial Quiz
- AI generates 3 MCQs per article on similar topic area
- Premium/max only (free users see upgrade overlay)
- Results logged to `editorial_activity` + quiz answers shown instantly

---

## 💳 Subscription & Campaign

### Tiers
| Plan | Daily Limit | Editorial Quiz | Detailed Analytics | AI Mentor |
|------|-------------|----------------|-------------------|-----------|
| Free | 10 Q/day | ❌ | Basic | ❌ |
| Premium | Unlimited | ✅ | ✅ | ❌ |
| Max | Unlimited | ✅ | ✅ | 🔜 |

### Promo Campaign
- Free premium upgrade till Jul 31, first 20 users
- Flagged via `is_promo_user = true` on profiles
- Badge shows "PREMIUM 🎁" on dashboard header

### Enforcement
- `daily_free_questions` column decremented on each answer response
- Reset daily via logic in `quiz/respond/route.ts`
- Premium/max skip the check entirely

---

## 🎨 Theme System

### Architecture
- **CSS variable system** — universal variables in `:root` + `[data-theme="light"]`
- **ThemeProvider** — React context provides `useTheme()` hook
- **ThemeToggle** — accessible on student pages (sun/moon icon)
- **Persistence** — saved to localStorage, no flash on reload

### Variables
```
--bg-primary, --bg-card, --bg-elevated (backgrounds)
--text-primary, --text-secondary, --text-muted (text)
--border-theme, --border-theme-light (borders)
--accent, --success, --warning, --danger, --info (semantic)
--tint-* (utility backgrounds)
--stat-* (stats text)
```

### Key rules
- Landing/login/signup: fixed light theme, decoupled from system
- Dashboard: gradient background, semantic classes for all elements
- Mobile responsive: hamburger menu, grid stacking

---

## 👨‍💼 Admin Interface

**URL:** `/admin/dashboard`  
**Access:** Users with `profiles.role = 'admin'`

### Pages
| Page | URL | Purpose |
|------|-----|---------|
| Dashboard | `/admin/dashboard` | Overview + Generate Daily Q button |
| Students | `/admin/students` | CRUD students, upgrade/downgrade plans |
| Test Editor | `/admin/tests` | Create/edit tests with section assignments |
| Test Detail | `/admin/tests/[id]` | Per-test section editor |

### Actions
- **Generate Daily Questions** — Triggers immediate generation of 25 questions (5/section)
- **Student CRUD** — View all students, search, upgrade plan, delete (with FK cascade cleanup)
- **Test CRUD** — Create/edit/delete tests, assign questions to sections
- View generation results (per-section success/failure counts)

---

## 📡 API Routes

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/auth/login/signin` | POST | Public | Login + session_version toggle |
| `/api/quiz/start` | POST | Cookie | Start practice session |
| `/api/quiz/respond` | POST | Cookie | Submit answer, check correctness |
| `/api/editorials` | GET | Cookie | Fetch RSS headlines |
| `/api/editorials/quiz` | POST | Cookie | Generate editorial quiz (premium) |
| `/api/editorials/activity` | GET/POST | Cookie | Log or fetch editorial activity |
| `/api/me` | GET | Cookie | Current user profile + plan |
| `/api/generate-test` | POST | Admin | Generate exam test |
| `/api/debug` | GET | Cookie | Debug endpoint |
| `/api/whatsapp/register` | POST | Public | Link WhatsApp number |
| `/api/whatsapp/webhook` | GET/POST | Meta | WhatsApp verification + messages |
| `/api/whatsapp/send-quiz-result` | POST | Internal | Send practice results to WhatsApp |
| `/api/admin/generate-daily` | POST | Admin | Trigger daily generation |

---

## 🔄 Event/Data Flows

### Daily Question Lifecycle
```
[Generate] → [Normalise] → [Insert passage] → [Insert Q] → [Notify Telegram]
```

### Editorial Read Lifecycle
```
[Dashboard click "Read"] → [Open article new tab] → [POST activity (read)]
  → [Update readArticles Set] → [Toggle to ✅]
```

### Exam Lifecycle
```
[Start] → [create attempt] → [start 120min timer] → [navigate sections]
  → [answer questions] → [pause/resume] → [submit OR auto-submit on expiry]
  → [score] → [review page]
```

### Session Limit Enforcement
```
[Login] → [toggle session_version 1↔2] → [set clat-sv cookie]
  → [Middleware on each page load: clat-sv === DB session_version?]
  → [Mismatch → delete cookie → force login]
```

---

## 🔮 Future Roadmap

- **AI Mentor / Personal Tutor** — Conversational AI for doubt resolution, study planning, performance analysis (Max plan)
- **Advanced Analytics** — Weak-topic recommendations, trend predictions
- **PYQ Import** — Previous year questions beyond CLAT 2025/2026
- **Question Validation Queue** — Review before publishing (#13, #15, #16)
- **Payment Gateway** — Subscription payments instead of manual assignments

---

## 🐳 Deployment

| Step | Detail |
|------|--------|
| **Git** | GitHub → `bhimsenjoshi/clat-prep` |
| **Build** | Vercel auto-deploys from `main` branch |
| **Ignore Command** | Skips builds on migrations-only commits (manual re-deploy needed) |
| **DNS** | Cloudflare proxy ON → CNAME to `cname.vercel-dns.com` |
| **SSL** | Cloudflare Full (Strict) |
| **Cron** | Hermes Agent (Nova profile) runs daily at 2:00am UTC (7:30am IST) |

## ⚙️ Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://qjhxokmhbhyrykuozwhc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
DEEPSEEK_API_KEY=<deepseek-api-key>
GOOGLE_API_KEY=<gemini-fallback-key>
CRON_API_KEY=<cron-auth-key>
```

All env vars stored in `.env` (gitignored). No hardcoded secrets in source.
