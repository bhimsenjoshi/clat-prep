# CLAT Prep Hub 🎯

AI-powered practice test platform for CLAT (Common Law Admission Test) preparation.

Built with **Next.js** + **Supabase** + **Gemini API** for AI question generation.

## Features

- **5 CLAT Sections**: English, Current Affairs/GK, Legal Reasoning, Logical Reasoning, Quantitative Techniques
- **Test Taking**: Timed tests with section navigation, question grid, and auto-grading
- **Student Dashboard**: Stats, recent attempts, per-section performance
- **Leaderboard**: Per-test and all-time rankings
- **Admin Panel**: Create/manage/publish tests, review and edit AI-generated questions
- **AI Question Generation**: Powered by Google Gemini multi-agent pipeline (separate sub-agent per section)
- **Row-Level Security**: Students can only access their own data

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router, TypeScript, Tailwind) |
| Backend | Next.js API routes + Server Components |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password) |
| AI | Gemini API (Google AI Studio) |
| Validator | DeepSeek API (optional cross-check) |
| Hosting | Vercel + Supabase |

## Quick Start

### 1. Clone and install

```bash
git clone <your-repo-url> clat-prep
cd clat-prep
npm install
```

### 2. Set up Supabase

1. Create a free Supabase project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `src/lib/db/schema.sql` — creates all tables, RLS policies, and the leaderboard view
3. (Optional) To get started with sample data, run `src/lib/db/seed.sql`
4. Go to **Project Settings → API** and copy your **Project URL** and **anon key**

### 3. Set up Gemini API

1. Go to [Google AI Studio](https://aistudio.google.com) and generate an API key
2. (This is different from your Gemini Pro / Gemini Advanced subscription)

### 4. (Optional) Set up DeepSeek

1. Create an account at [platform.deepseek.com](https://platform.deepseek.com)
2. Generate an API key for question validation

### 5. Configure environment

```bash
cp .env.example .env.local
```

Fill in your keys:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (service_role, keep private!) |
| `GEMINI_API_KEY` | Google AI Studio |
| `DEEPSEEK_API_KEY` | DeepSeek Platform (optional) |

### 6. Make yourself an admin

1. Sign up at your app URL
2. Go to **Supabase → SQL Editor** and run:
```sql
update public.profiles set role = 'admin' where id = '<your-user-uuid>';
```
(Find your user UUID in Supabase → Authentication → Users)

### 7. Run locally

```bash
npm run dev
```

Visit `http://localhost:3000`

### 8. Deploy

Push to GitHub, connect to Vercel, set the same environment variables in Vercel dashboard.

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Tailwind imports
│   ├── auth/
│   │   ├── login/page.tsx    # Student/admin login
│   │   ├── signup/page.tsx   # Registration
│   │   └── callback/route.ts # OAuth callback
│   ├── student/
│   │   ├── dashboard/page.tsx
│   │   ├── tests/page.tsx    # Available tests
│   │   ├── tests/[id]/page.tsx  # Test-taking screen
│   │   └── leaderboard/page.tsx
│   ├── admin/
│   │   ├── dashboard/page.tsx
│   │   ├── tests/page.tsx      # Test management
│   │   ├── tests/[id]/page.tsx # Question editor
│   │   └── students/page.tsx   # Student analytics
│   └── api/
│       └── generate-test/route.ts  # AI generation endpoint
├── components/
│   └── ui/                    # (future) shared UI components
├── lib/
│   ├── supabase/
│   │   ├── client.ts          # Browser client
│   │   ├── server.ts          # Server + admin clients
│   │   └── middleware.ts      # Auth middleware logic
│   ├── ai/
│   │   └── generate.ts        # Gemini sub-agent pipeline
│   ├── db/
│   │   ├── schema.sql         # Full schema + RLS
│   │   └── seed.sql           # Sample test data
│   └── ...
├── types/
│   └── index.ts               # TypeScript types
└── middleware.ts              # Next.js auth middleware
```

## Database Schema

7 tables + 1 view:

- `profiles` — extends auth.users with role + full_name
- `tests` — test header (title, status, created_by)
- `sections` — 5 sections per test (English, GK, Legal, Logical, Quant)
- `questions` — 10 per section, with options JSONB + correct answer
- `attempts` — one per student per test, stores scores
- `responses` — one per question per attempt
- `leaderboard` — view computing per-test ranks

Row-Level Security ensures students can only read/write their own data.

## AI Question Generation

The generation pipeline uses a multi-agent architecture:

```
Admin clicks "Generate" → API route
        ↓
Orchestrator (selects prompts)
        ↓
5 parallel sub-agents (call Gemini):
  - English → Flash-Lite (cheapest)
  - Current Affairs → Flash (with search grounding)
  - Legal Reasoning → Flash
  - Logical Reasoning → Flash
  - Quantitative → Flash-Lite
        ↓
Questions written to DB → Admin reviews → Publish
```

Each sub-agent has a specialized system prompt tuned for CLAT's question format.

## Cost Estimate

| Service | Free tier | Paid (small scale) |
|---|---|---|
| Vercel | ✅ Hobby (100GB bandwidth) | $20/mo Pro |
| Supabase | ✅ 500MB DB, 50k MAU | $25/mo Pro |
| Gemini API | Not free, but ~$0.10/test | ~$5/50 tests |
| **Total** | **~$0-5/month** | |

## License

Private — for educational use.
