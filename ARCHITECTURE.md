# CLAT Prep Hub — Architecture & Requirements

## 🎯 Overview

CLAT Prep Hub is a Next.js 16 web app for CLAT (Common Law Admission Test) aspirants. It delivers AI-generated practice questions across 5 CLAT sections with instant feedback, progress tracking, and daily content refresh.

**Domain:** [clatly.com](https://clatly.com)  
**Stack:** Next.js 16 + Supabase (Postgres + Auth) + DeepSeek AI  
**Deploy:** Vercel (Free) + Cloudflare (DNS/SSL)  
**Cost:** ₹0/month (hosting) + ~₹30/month (AI generation)

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Cloudflare                          │
│              DNS (proxy ON) · SSL Full Strict             │
│              Email Routing → Gmail (₹0/mo)                │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                       Vercel                             │
│              clatly.com → clat-prep project              │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Next.js 16 App Router                │   │
│  │                                                    │   │
│  │  ┌─────────┐  ┌──────────┐  ┌──────────────────┐  │   │
│  │  │ Landing  │  │  Auth     │  │  Student App      │  │   │
│  │  │ (public) │  │ (login/  │  │  ┌────────────┐   │  │   │
│  │  │          │  │  signup) │  │  │ Dashboard  │   │  │   │
│  │  └─────────┘  └──────────┘  │  ├────────────┤   │  │   │
│  │                              │  │ Quiz (test │   │  │   │
│  │  ┌──────────┐               │  │  /review)  │   │  │   │
│  │  │  Admin    │               │  ├────────────┤   │  │   │
│  │  │ Dashboard │               │  │ Review     │   │  │   │
│  │  └──────────┘               │  └────────────┘   │  │   │
│  └──────────────────────────────────────────────────┘   │
│                          │                               │
│  Server-side: Supabase SSR (cookies: clat-at/clat-rt)    │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                     Supabase                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐   │
│  │ Auth      │  │ Postgres │  │  REST API            │   │
│  │ (JWT +   │  │          │  │  (internal)          │   │
│  │ cookies) │  │ Tables:  │  └──────────────────────┘   │
│  │          │  │ profiles │                             │
│  │          │  │ practice_│                             │
│  │          │  │ questions│                             │
│  │          │  │…         │                             │
│  └──────────┘  └──────────┘                             │
└────────────────────────────────────────────────────────┘
                         ▲
                         │ (DeepSeek API — daily generation)
┌────────────────────────┴────────────────────────────────┐
│                    DeepSeek AI                            │
│  Model: deepseek-chat · Response: JSON object            │
│  Generates: 5 questions/section × 5 sections = 25/day    │
└─────────────────────────────────────────────────────────┘
                         ▲
                         │ (Hermes Cron — no_agent mode)
┌────────────────────────┴────────────────────────────────┐
│              VM (Hermes Agent — Nova)                     │
│  Cron: scripts/daily-questions-cron.mjs                  │
│  Runs: 1:30am UTC (7:00am IST) via Hermes cron           │
│  Uses: Node 18+ built-in fetch (zero deps)               │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Database Schema

### `profiles`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, FK → auth.users |
| email | text | |
| role | text | `student` \| `admin` |
| daily_questions_limit | int4 | Default 10 |
| questions_used_today | int4 | Reset daily |
| created_at | timestamptz | |

### `practice_questions`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| section | text | CLAT section name |
| topic | text | Optional topic tag |
| question_text | text | The question |
| passage | text | Optional passage |
| options | jsonb | `{"A":"...","B":"...","C":"...","D":"..."}` |
| correct_option | text | Single letter (A/B/C/D) |
| explanation | text | |
| difficulty | text | `easy` \| `medium` \| `hard` (check constraint) |
| source | text | `manual` \| `daily` \| `pyq` |
| tags | jsonb | Optional tags |
| created_at | timestamptz | |

### `quiz_sessions` / `quiz_answers`
Tracks per-attempt quiz sessions with attempt numbers (supports retakes). Each answer records: question_id, selected_option, correct, time_spent.

---

## 🔐 Authentication

- **Supabase SSR** with cookie-based auth
- **Cookies:** `clat-at` (access token), `clat-rt` (refresh token) — set by middleware
- **Fallback:** `getServerUser()` helper reads `clat-at` cookie when server-side Supabase session is stale
- Daily free limit: 10 questions/day (decremented on answer, not on session start)
- Admin: role check on `profiles.role = 'admin'`

---

## ❓ Question Generation Pipeline

### Daily Cron (Hermes)
```
Script: scripts/daily-questions-cron.mjs
Schedule: 30 1 * * *  (1:30am UTC = 7:00am IST)
Type: no_agent=true (direct script execution, no LLM overhead)
Delivery: origin (Telegram notification on completion)
```

### Flow
1. Cron triggers → Node.js script runs (built-in `fetch`, zero npm deps)
2. For each of 5 sections, calls DeepSeek API (`/v1/chat/completions`)
3. DeepSeek returns JSON with `questions` array
4. Script normalises field names (handles `question`/`question_text`, `correct_answer`/`correct_option`, array/object options)
5. Inserts rows via Supabase REST API (`service_role` key, admin bypass)
6. Tags with `source='daily'`
7. Logs results → delivered to Telegram

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

## 🧪 Quiz Flow

1. **Student Dashboard** shows per-attempt cards (attempted/correct/incorrect/total/time)
2. **Start Quiz** → creates session, fetches questions (mixed sections or single section)
3. **Per-question time tracking** — auto-saves on navigate
4. **Answer** → immediately shows correct/incorrect + explanation + marks
5. **On respond** → decrements daily questions used (only if answered, not on session start)
6. **No correct** → counts as attempt, shows explanation
7. **Review page** → correct/incorrect markings, explanations, retake button
8. **Multi-attempt** via `attempt_number` column, resume incomplete attempts

---

## 🕹️ Tech Decisions

| Decision | Rationale |
|----------|-----------|
| Next.js 16 App Router | Modern RSC, server components, built-in API routes |
| Supabase SSR cookies | Avoids stale session issues with middleware |
| `clat-at`/`clat-rt` cookies | Custom cookie names prevent conflicts with default Supabase cookies |
| `getServerUser()` fallback | Bridges gap between middleware (reads `clat-at`) and API routes |
| Zero-dep cron script | Node 18+ `fetch` means no `npm install` needed on Hermes VM |
| `no_agent=true` cron | Direct script execution — no LLM tokens wasted for cron ticks |
| Decrement on answer | Prevents wasting daily limit when user opens quiz and leaves |
| DeepSeek `response_format: json_object` | Ensures structured output for reliable parsing |
| Flexible field name handling | AI is inconsistent with naming; normalise function handles all variants |
| WhatsApp shelved (#25) | Meta Business API too complex (need verification, template approval) |

---

## 📁 Project Structure

```
clat-prep/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing page (section cards)
│   │   ├── auth/
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── student/
│   │   │   ├── dashboard/page.tsx
│   │   │   └── tests/
│   │   │       ├── [id]/page.tsx     # Test-taking
│   │   │       └── [id]/review/page.tsx
│   │   ├── admin/
│   │   │   └── dashboard/page.tsx
│   │   └── api/
│   │       ├── auth/.../
│   │       ├── quiz/
│   │       │   ├── start/route.ts
│   │       │   └── respond/route.ts
│   │       └── admin/
│   │           └── generate-daily/route.ts
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts          # getServerUser() helper
│   │   │   └── middleware.ts
│   │   ├── ai/
│   │   │   └── generate.ts        # AI generation logic
│   │   └── db/
│   │       ├── schema.sql
│   │       └── migrations/
│   └── middleware.ts
├── scripts/
│   └── daily-questions-cron.mjs    # Zero-dep cron script
├── .env                            # Local env vars (gitignored)
├── .gitignore
├── package.json
└── tsconfig.json
```

---

## 👨‍💼 Admin Interface

**URL:** `/admin/dashboard`  
**Access:** Users with `profiles.role = 'admin'`

### Actions
- **📅 Generate Daily Questions** — Triggers immediate generation of 25 questions (5/section)
- View generation results (per-section success/failure counts)

---

## 🔄 Future Roadmap

- [ ] Phase 2: Analytics / weak-topic recommendations
- [ ] PYQ (Previous Year Questions) import — `source='pyq'`
- [ ] Question validator / review queue (#13, #15, #16)
- [ ] Telegram bot or in-app chat (WhatsApp deferred — #25)

---

## ⚙️ Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://qjhxokmhbhyrykuozwhc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
DEEPSEEK_API_KEY=<deepseek-api-key>
CRON_API_KEY=<cron-auth-key>       # For Vercel cron auth
```

---

## 🐳 Deployment

- **Git:** GitHub → `bhimsenjoshi/clat-prep`
- **Build:** Vercel auto-deploys from `main` branch
- **DNS:** Cloudflare proxy ON → CNAME to `cname.vercel-dns.com`
- **SSL:** Cloudflare Full (Strict)
- **Cron:** Hermes Agent (VM) runs daily at 1:30am UTC
