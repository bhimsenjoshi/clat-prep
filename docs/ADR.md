# Architecture Decision Record — CLAT Prep Hub

> **Date:** July 2026  
> **Status:** Accepted  
> **Deciders:** Bhimsen (@Bhimsen443)  
> **Issue:** [#2 — Architecture Decision Record](https://github.com/bhimsenjoshi/clat-prep/issues/2)

---

## 1. Project Overview

CLAT Prep Hub is a web-based practice test platform for CLAT (Common Law Admission Test) aspirants. It generates CLAT-pattern questions using AI, provides a timed test-taking interface, and offers detailed performance analytics.

### System Context

```
┌──────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│  Student  │ ──→ │  CLAT Prep   │ ──→ │  Supabase   │     │  DeepSeek    │
│ (Browser) │     │  Hub (Next)  │     │ (PostgreSQL)│     │  / Gemini AI │
│  Admin    │ ←── │  on Vercel   │ ←── │  + Auth     │     │  (API calls) │
└──────────┘     └──────────────┘     └─────────────┘     └──────────────┘
```

**See the full diagram:** [`docs/architecture.html`](./architecture.html) (open in browser)

---

## 2. Architecture Principles

| Principle | Description |
|-----------|-------------|
| **₹0/month ops** | Free tiers for everything (Vercel + Supabase). Pay only for AI API usage (~$0.10/test) |
| **SSR-first** | Server Components + cookie auth for fast page loads and SEO |
| **AI-powered** | DeepSeek primary, Gemini fallback — never manually write questions |
| **Open for contribution** | Clean TypeScript, PR templates, `good first issue` labels |
| **Mobile-first** | PWA installable, fully responsive for phone usage |

---

## 3. Technology Decisions

### 3.1 Next.js 16 (App Router) — Frontend Framework

**Decision:** Next.js 16 App Router with React 19 Server Components

**Alternatives considered:**
- **Vite + React SPA** — No SSR, worse SEO, no built-in API routes
- **Remix** — Good but smaller ecosystem than Next.js
- **SvelteKit** — Too niche for potential contributors

**Rationale:**
- App Router gives us built-in API routes (no separate backend server)
- Server Components mean zero JS shipped for static content
- Vercel auto-deploys from GitHub — zero DevOps overhead
- Largest contributor pool (most developers know Next.js)

---

### 3.2 Custom Cookie Auth — Authentication

**Decision:** Custom cookie-based auth using `clat-at` / `clat-rt` cookies with Supabase Auth underneath

**Alternatives considered:**
- **NextAuth.js** — Heavy dependency, complex callback flow, version compatibility issues
- **Clerk** — $0/tier has limits, vendor lock-in
- **Supabase SSR package** — Good but `@supabase/ssr` was immature when the project started

**Rationale:**
- Cookies survive page loads (unlike localStorage), enabling SSR
- Custom middleware gives full control over role-based redirects (student vs admin)
- `refreshSession()` fallback handles token expiry transparently
- Supabase Auth still handles password hashing, email verification, session management
- Zero additional cost

**Flow:**
```
1. User logs in → Supabase Auth returns session
2. persistSessionToCookie() saves clat-at + clat-rt as cookies
3. Middleware reads cookies → getUser() validates → checks profiles.role
4. If token expired → refreshSession() with rt cookie → re-saves new tokens
5. Role-based redirect: /student/* or /admin/*
```

**Key files:**
- `src/middleware.ts` — Edge middleware
- `src/lib/supabase/middleware.ts` — Auth logic
- `src/lib/supabase/client.ts` — Browser client + cookie persistence

---

### 3.3 Supabase — Database & Auth

**Decision:** Supabase (PostgreSQL) with RLS policies and service role key for admin operations

**Alternatives considered:**
- **Firebase Firestore** — NoSQL, expensive at scale, no JOINs
- **MongoDB Atlas** — Requires separate backend, more complex
- **Neon** — Serverless PostgreSQL but no built-in auth

**Rationale:**
- PostgreSQL gives us proper relational data (tests → sections → questions → attempts)
- RLS (Row-Level Security) means queries automatically respect ownership
- Service role key bypasses RLS for admin operations
- Free tier: 500MB DB, 50k monthly active users — enough for launch
- Built-in auth (Supabase Auth) handles signup/login/sessions

---

### 3.4 DeepSeek (Primary) + Gemini (Fallback) — AI Question Generation

**Decision:** Dual AI backend — DeepSeek Chat API as primary, Gemini 2.5 Flash as fallback

**Alternatives considered:**
- **OpenAI GPT-4** — Too expensive ($2-5/test vs $0.10/test)
- **Claude** — Good quality but higher cost per token
- **Gemini only** — Single point of failure

**Rationale:**
- DeepSeek is ~₹0.10/test — cheapest option that produces quality CLAT questions
- Gemini Flash as fallback if DeepSeek is down or rate-limited
- Both support JSON response format natively
- Prompts are section-specific (5 different system prompts for 5 CLAT sections)
- Sub-agents run in parallel — all 5 sections generate simultaneously (~30s total)

---

### 3.5 Vercel — Hosting & Deployment

**Decision:** Vercel (Hobby tier) with auto-deploy from GitHub

**Alternatives considered:**
- **Cloudflare Pages** — No built-in SSR for Next.js App Router at project start
- **Railway** — More expensive, less mature Next.js support
- **Self-hosted VM** — More ops overhead, not ₹0

**Rationale:**
- GitHub push → Vercel auto-deploys (branch previews included)
- Free tier: 100GB bandwidth, 6000 build minutes/month — generous for a study tool
- Custom domain support (when purchased)
- Built-in analytics and monitoring

---

## 4. Database Schema

### Tables

| Table | Purpose | Key Columns | RLS |
|-------|---------|-------------|-----|
| `profiles` | Extends auth.users | id (FK), role, full_name | ✅ Users read own |
| `tests` | Test header | id, title, status, created_by | ✅ Admins only |
| `sections` | 5 per test | id, test_id, name, question_count | ✅ Admins only |
| `questions` | Individual questions | id, section_id, passage, options (JSONB), correct_option, explanation, difficulty, generated_by, reviewed | ✅ Students read published |
| `attempts` | One per student per test-take | id, user_id, test_id, attempt_number, score, started_at, submitted_at | ✅ Users see own |
| `attempt_answers` | Per-question response | id, attempt_id, question_id, selected_option, is_correct, time_spent_seconds | ✅ Users see own |

**Schema SQL:** `src/lib/db/schema.sql`  
**Seed data:** `src/lib/db/seed.sql`

---

## 5. Data Flow

### Test-Taking Flow

```
Student → /student/tests → Click test
  → middleware reads clat-at cookie
  → Supabase getUser() validates token
  → fetch sections + questions from DB
  → Render Server Component (fast, no JS for initial state)
  → Student answers questions (Client Component with timer)
  → Auto-save per question on navigation
  → Submit → API route scores → insert attempt_answers
  → Redirect to /review → show results
```

### AI Generation Flow

```
Admin → /admin/tests/[id] → Click "Generate"
  → POST /api/generate-test with { sectionId, sectionName, maxQuestions }
  → Validate auth + admin role
  → generateSection() → DeepSeek API (parallel sub-agents)
  → If DeepSeek fails → Gemini fallback
  → Parse JSON → Normalize → Validate schema
  → Deduplicate against existing questions
  → Insert into questions table (reviewed: false)
  → Return count + skipped to admin
```

---

## 6. Cost Budget

| Service | Free Tier | What We Use | Cost |
|---------|-----------|-------------|------|
| Vercel Hobby | 100GB BW, 6000 builds/mo | SSR + API routes | ₹0 |
| Supabase Free | 500MB DB, 50k MAU | PostgreSQL + Auth | ₹0 |
| DeepSeek API | Pay-as-you-go | ~$0.10/test × 50 tests/mo | ~₹40/mo |
| Gemini API | Pay-as-you-go | Fallback only | ~₹0 |
| **Total** | | | **~₹40/month** |

---

## 7. Project Structure

```
clat-prep/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx            # Landing
│   │   ├── layout.tsx          # Root layout
│   │   ├── auth/               # Login, signup, callback
│   │   ├── student/            # Dashboard, test-taking, review, leaderboard
│   │   ├── admin/              # Dashboard, test management, students
│   │   └── api/                # Route handlers (login, me, generate-test)
│   ├── lib/
│   │   ├── ai/generate.ts      # Multi-agent AI question generation
│   │   ├── supabase/           # Client, server, middleware
│   │   └── db/                 # schema.sql, seed.sql, migrations
│   ├── types/index.ts          # TypeScript interfaces
│   └── middleware.ts           # Auth guard (edge)
├── docs/
│   ├── PRD.md                  # Product Requirements
│   ├── ADR.md                  # This document
│   └── architecture.html       # Visual architecture diagram
├── .github/
│   ├── ISSUE_TEMPLATE/         # Bug + feature templates
│   └── PULL_REQUEST_TEMPLATE.md
└── README.md
```

---

## 8. Future Considerations

| Topic | Consideration |
|-------|--------------|
| **Scale** | If >50 concurrent students, consider PgBouncer for Supabase connection pooling |
| **Performance** | If page loads exceed 2s, add ISR (Incremental Static Regeneration) for test listing |
| **AI Cost** | If monthly AI cost >₹500, implement caching or question recycling |
| **Contributors** | Add CODEOWNERS file, stricter CI checks, and contribution guide |
| **Mobile** | If PWA usage exceeds 80%, consider native wrapper (Capacitor/Tauri) |
| **Payments** | If monetization is needed, add Stripe integration (future phase) |

---

## 9. References

- [Visual Architecture Diagram](./architecture.html) — Open in browser for interactive SVG
- [Product Requirements Document](./PRD.md) — Complete feature specification
- [Project Board](https://github.com/users/bhimsenjoshi/projects/1) — Track progress
- [GitHub Repo](https://github.com/bhimsenjoshi/clat-prep) — Source code
