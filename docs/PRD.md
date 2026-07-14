# CLAT Prep Hub — Product Requirements Document (PRD)

> **Version:** 3.0  
> **Status:** Active  
> **Author:** Bhimsen (@Bhimsen443)  
> **Last Updated:** July 14, 2026

---

## 1. Executive Summary

CLAT Prep Hub is an AI-powered practice test platform for CLAT (Common Law Admission Test) aspirants. It generates high-quality CLAT-pattern questions across all 5 sections using DeepSeek AI, provides instant answer feedback with explanations, tracks progress, and auto-refreshes the question pool daily.

**Live:** [clatly.com](https://clatly.com)  
**Stack:** Next.js 16 + Supabase (Postgres + Auth) + DeepSeek AI + Gemini fallback  
**Deploy:** Vercel (Free) + Cloudflare (DNS/SSL)  
**Cost:** ₹0/month hosting + ~₹30/month AI generation

---

## 2. Problem Statement

| Problem | Current Solutions | Gap |
|---------|------------------|-----|
| **Limited practice material** | Coaching centers, static books | Questions are finite, expensive, not personalized |
| **No instant feedback** | Answer keys with minimal explanations | Students can't learn *why* they got something wrong |
| **No daily freshness** | Fixed question banks | Students exhaust the pool quickly |

**Our solution:** Infinite AI-generated questions, instant explainers, daily content refresh.

---

## 3. Functional Requirements

### 3.1 Authentication

| ID | Requirement | Priority |
|----|-------------|----------|
| AUTH-01 | Students sign up with email/password | P0 |
| AUTH-02 | Admins log in with same flow (role in DB) | P0 |
| AUTH-03 | Custom cookies `clat-at` / `clat-rt` for SSR | P0 |
| AUTH-04 | Middleware guards `/student/*` and `/admin/*` | P0 |
| AUTH-05 | `getServerUser()` fallback for stale sessions | P0 |
| AUTH-06 | Role-based redirect: student ↔ admin dashboard | P0 |
| AUTH-07 | **Change password** — in-app password change for students & admins | P1 |
| AUTH-08 | **Sign-out button** — visible on all student pages via `PageHeader` | P1 |
| AUTH-09 | **Concurrent session limit** — max 2 devices using `session_version` toggle (1↔2) on login | P1 |
| AUTH-10 | **Admin user management** — view/upgrade/delete student accounts from admin panel | P1 |
| AUTH-11 | **Admin delete handles FK** — cascading cleanup of tests, attempts, upgrade_log | P1 |

### 3.2 Practice Quiz (Student)

| ID | Requirement | Priority |
|----|-------------|----------|
| QUIZ-01 | Select any CLAT section (English, CA, Legal, LR, Quant) | P0 |
| QUIZ-02 | Mixed/all-sections practice mode | P1 |
| QUIZ-03 | Questions shown one at a time with prev/next | P0 |
| QUIZ-04 | Per-question time tracking | P1 |
| QUIZ-05 | Instant answer feedback (correct/incorrect + explanation) | P0 |
| QUIZ-06 | Daily free limit: 10 questions/day (per profile) | P0 |
| QUIZ-07 | Decrement count on answer, not on session start | P0 |
| QUIZ-08 | Resume incomplete attempts | P1 |
| QUIZ-09 | Multi-attempt via `attempt_number` column | P1 |
| QUIZ-10 | **Live timer** with pause/resume during practice | P1 |
| QUIZ-11 | **Passage-based questions** — collapsible passage display for passage-linked questions | P0 |
| QUIZ-12 | **Official CLAT section names** — DB uses full names (`English Language`, `Current Affairs Including General Knowledge`) | P0 |
| QUIZ-13 | **Back-to-review** button after completing a practice session | P2 |
| QUIZ-14 | **Option dict format** — options stored as JSON `{A, B, C, D}` not list | P0 |

### 3.3 Dashboard

| ID | Requirement | Priority |
|----|-------------|----------|
| DSH-01 | CLAT 2026 countdown timer | P0 |
| DSH-02 | Today's Stats: streak, questions today, accuracy, total Q | P0 |
| DSH-03 | Announcements bar (dismissible, localStorage) | P1 |
| DSH-04 | Legal Maxim of the Day (rotating quotes from 50+ maxims) | P1 |
| DSH-05 | ✨ **Today's Focus** — smart weakest-section recommendation (shown after 10+ Q) | P1 |
| DSH-06 | **RSS-powered Editorials** — 3×3 grid from The Hindu, Indian Express, LiveLaw | P0 |
| DSH-07 | **Read tracking** — mark editorials as read, show ✅ status | P0 |
| DSH-08 | **Editorial Quiz** — AI-generated quiz per editorial (premium/max only) | P1 |
| DSH-09 | Quick Practice section cards (tap to jump into practice) | P0 |
| DSH-10 | Recent Activity feed (practice sessions + test attempts) | P0 |
| DSH-11 | **Collapsible sections** — all dashboard sections collapse/expand | P1 |
| DSH-12 | **Legal/maxim icons** — court-themed iconography across all pages | P1 |

### 3.4 Review & Analytics

| ID | Requirement | Priority |
|----|-------------|----------|
| REV-01 | Per-attempt cards with attempted/correct/incorrect/total/time | P0 |
| REV-02 | Section breakdown with actual DB totals (by DB section name) | P0 |
| REV-03 | Correct/incorrect markings (green/red) with explanations | P0 |
| REV-04 | Retake button for each attempt | P1 |
| ANL-01 | **Dedicated Analytics page** (`/student/analytics`) with 3 tabs: Practice, Tests, Editorials | P0 |
| ANL-02 | **Practice tab** — overall summary (total Q, accuracy, avg time) | P0 |
| ANL-03 | **Practice by Section** — per-section pass/fail bar, accuracy %, avg time, session count | P0 |
| ANL-04 | **Strongest/Weakest** section cards (practice) | P0 |
| ANL-05 | **Recent Practice Sessions** — per-session rows with date, time, accuracy | P0 |
| ANL-06 | **Tests tab** — overall accuracy, avg/best score, section-wise performance bars | P0 |
| ANL-07 | **Attempt History** — test attempt rows with scores | P0 |
| ANL-08 | **Editorials tab** — total reads, total quizzes, quiz accuracy | P0 |
| ANL-09 | **Editorial line graph** — daily reads over last 30 days | P1 |
| ANL-10 | **LockedSection** — premium-only content with upgrade CTA overlay | P1 |
| ANL-11 | **Dashboard analytics query** — uses `quiz_responses` table for accurate counts, not `questions_answered` column | P0 |

### 3.5 Daily Question Generation

| ID | Requirement | Priority |
|----|-------------|----------|
| GEN-01 | Auto-generate 25 questions daily (5 per section) | P0 |
| GEN-02 | Runs at 7:00 AM IST via Hermes cron | P0 |
| GEN-03 | Admin button for on-demand generation | P0 |
| GEN-04 | Tags questions with `source='daily'` | P0 |
| GEN-05 | Zero-dependency cron script (Node built-in fetch only) | P0 |
| GEN-06 | Delivery notification to admin Telegram on completion | P1 |
| GEN-07 | **Passage-based generation** — each section's daily Q linked to a passage | P1 |
| GEN-08 | **Quality enforcement** — No trivia/recall, inference-only, 6 Q per passage | P0 |
| GEN-09 | **CLAT-topic-approved prompts** — mandatory computation in Quant, principle-application in Legal | P0 |
| GEN-10 | **Explanation quality** — structured explanations, no answer leaks in text | P0 |

### 3.6 Original CLAT Papers (Exams)

| ID | Requirement | Priority |
|----|-------------|----------|
| EXM-01 | **Exams page** (`/student/exams`) replacing old "Tests" | P0 |
| EXM-02 | **CLAT 2025 UG Set A** — original paper with 120 Q, 19 passages | P0 |
| EXM-03 | **CLAT 2026 UG** — original paper with 120 Q, 21 passages | P0 |
| EXM-04 | **Mock Test #2** — 5-section mock test | P0 |
| EXM-05 | **Full Length Mock** — comprehensive mock with real passage data | P0 |
| EXM-06 | Normalized 5-table schema: `original_papers\|sections\|passages\|questions\|answer_keys` | P0 |
| EXM-07 | **120-minute countdown timer** — server-side recalibration, no localStorage | P0 |
| EXM-08 | **Auto-submit** on timer expiry | P0 |
| EXM-09 | **Exit confirmation modal** — warns about progress loss | P0 |
| EXM-10 | **Attempt cleanup on exit** — deletes in-progress attempt from DB | P0 |
| EXM-11 | **Retake support** — dropped unique constraint on (test_id, student_id) | P0 |
| EXM-12 | **45 test coverage** — timer lifecycle, submit, review, exit scenarios | P1 |
| EXM-13 | **Options in `{A,B,C,D}` dict format** — critical for exam page compatibility | P0 |
| EXM-14 | **Answer key import** — separate `answer_keys` table, 3-col layout artifact | P0 |

### 3.7 Subscription & Monetization

| ID | Requirement | Priority |
|----|-------------|----------|
| SUB-01 | **3-tier model**: free (10Q/day) / premium (unlimited) / max (all + AI mentor) | P0 |
| SUB-02 | **Promo campaign**: free premium upgrade till Jul 31, first 20 users | P0 |
| SUB-03 | `subscription_plan` + `is_promo_user` columns on profiles | P0 |
| SUB-04 | **Plan badge** — shows "PREMIUM 🎁", "MAX ✨", or "⚜️ Upgrade" CTA on dashboard header | P0 |
| SUB-05 | **Profile page** (`/student/profile`) — upgrade flow, campaign status | P0 |
| SUB-06 | **Daily count enforcement** — free users get 10 questions/day, tracked on login | P0 |
| SUB-07 | **Editorial quiz gated** — only premium/max can take editorial quizzes | P1 |
| SUB-08 | **Analytics locked sections** — detailed analytics behind premium paywall (LockedSection component) | P1 |

### 3.8 Admin Interface

| ID | Requirement | Priority |
|----|-------------|----------|
| ADM-01 | Dashboard at `/admin/dashboard` | P0 |
| ADM-02 | "Generate Daily Questions" button | P0 |
| ADM-03 | Per-section success/failure results display | P0 |
| ADM-04 | **Student management** — view all students, subscription status, delete accounts | P0 |
| ADM-05 | **Test editor** — create/edit tests with section-level question assignments | P1 |
| ADM-06 | **Theme-aware admin pages** — fully responsive, matches student theme | P1 |

### 3.9 Editorial System

| ID | Requirement | Priority |
|----|-------------|----------|
| EDL-01 | **RSS ingestion** — real-time headlines from The Hindu, Indian Express, LiveLaw | P0 |
| EDL-02 | **3×3 grid display** on dashboard, grouped by source | P0 |
| EDL-03 | **Read tracking** — `editorial_activity` table logs reads & quizzes | P0 |
| EDL-04 | **AI quiz generation** — per-editorial questions via DeepSeek | P1 |
| EDL-05 | **Quiz gating** — only premium/max subscribers can take editorial quizzes | P1 |
| EDL-06 | **Dashboard integration** — "Today's Editorials" collapsible section | P0 |
| EDL-07 | **Analytics integration** — Editorial tab with reads/quizzes stats & line graph | P1 |

### 3.10 Theme & UI

| ID | Requirement | Priority |
|----|-------------|----------|
| THM-01 | **Universal CSS variable theme system** — light & dark mode via CSS variables | P0 |
| THM-02 | **ThemeToggle component** — accessible on analytics, student pages | P0 |
| THM-03 | **Court-themed branding** — gavel ⚖️, Supreme Court 🏛️, Constitution 📜 icons | P0 |
| THM-04 | **Light theme contrast** — pure black text-primary, fully WCAG-compatible | P0 |
| THM-05 | **Mobile responsive** — all student pages, admin pages | P0 |
| THM-06 | **Landing page** — hardcoded light theme, decoupled from system | P0 |

### 3.11 WhatsApp Integration

| ID | Requirement | Priority |
|----|-------------|----------|
| WHT-01 | **WhatsApp registration** — `/api/whatsapp/register` links phone to student ID | P2 |
| WHT-02 | **WhatsApp webhook** — `/api/whatsapp/webhook` for Meta Cloud API verification + message handling | P2 |
| WHT-03 | **Quiz result delivery** — `/api/whatsapp/send-quiz-result` sends practice results via WhatsApp | P2 |
| WHT-04 | **Daily report cron** — `scripts/daily-whatsapp-report.mjs` generates/sends daily progress | P2 |
| WHT-05 | **Meta Business API** — shelved pending simplification (#25) | P3 |

---

## 4. Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-01 | Page load time | < 2s (SSR) |
| NFR-02 | AI generation (25 questions) | < 2 min |
| NFR-03 | Daily cost | ~₹1/day (~₹30/month) |
| NFR-04 | Security | Cookie auth, Supabase RLS, service role key for admin ops |
| NFR-05 | Mobile | Fully responsive, PWA-ready |
| NFR-06 | Free tier | ₹0/month (Vercel Free + Supabase Free) |
| NFR-07 | **Concurrent sessions** | Max 2 devices per account using `session_version` |
| NFR-08 | **API key audit** | All keys/tokens saved in `.env`, gitignored, no hardcoded secrets |
| NFR-09 | **SQL constraints** | Options stored as JSON dict `{A,B,C,D}`, not list |
| NFR-10 | **Timer accuracy** | Server-side expires_at recalibration, no localStorage drift |

---

## 5. Data Model

### Core Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `profiles` | User profile + auth | `id`, `full_name`, `subscription_plan` (free/premium/max), `is_promo_user`, `daily_free_questions`, `session_version` |
| `quiz_sessions` | Practice sessions | `student_id`, `section`, `questions_answered`, `correct_count` |
| `quiz_responses` | Individual answers | `session_id`, `question_id`, `selected_option`, `is_correct`, `time_taken_seconds` |
| `attempts` | Exam/test attempts | `student_id`, `test_id`, `total_score`, `section_scores`, `submitted_at` |
| `responses` | Exam answer records | `attempt_id`, `question_id`, `selected_option`, `is_correct` |

### Editorial System

| Table | Purpose |
|-------|---------|
| `editorial_activity` | Tracks reads and quizzes per article (`user_id`, `source_id`, `article_url`, `action`, `correct`, `total`) |

### Original Papers (5-table schema)

| Table | Purpose |
|-------|---------|
| `original_papers` | CLAT paper metadata (year, set, total questions) |
| `sections` | Section definitions per paper |
| `passages` | Passage text linked to sections |
| `questions` | Questions with `options` (JSON dict `{A,B,C,D}`), linked to passage/section |
| `answer_keys` | Correct answers per question |

### Cron & Generation

| Script | Schedule | Purpose |
|--------|----------|---------|
| `scripts/daily-questions-cron.mjs` | 7:30 AM IST daily | Generate 25 passage-based questions (5 per section) |
| `scripts/daily-whatsapp-report.mjs` | Manual/on-demand | Send daily progress report to WhatsApp |

---

## 6. User Flows

### Practice Quiz
```
Landing → /auth/login → Student Dashboard → Pick Section/All
  → Quiz (Question 1 of N) → Answer → Instant feedback + explanation
  → Next Question → ... → End → Dashboard (updated stats)
```

### Exam (Original CLAT Paper)
```
Student Dashboard → Exams → Select Exam → Start 120-min Timer
  → Navigate sections/back/next → Pause/Resume
  → Auto-submit on expiry OR Manual submit → Score + Review
```

### Daily Questions
```
Hermes Cron (7:30 AM IST) → Node.js script → DeepSeek API × 5 sections
  → Normalize JSON → Supabase REST insert (source='daily')
  → Telegram: "✅ 25 new questions added"
```

### Editorial Reads
```
Dashboard → "Today's Editorials" → Click "Read" → Opens article in new tab
  → Logged as `editorial_activity (action='read')`
  → "Quiz" button → AI generates 3 MCQs → Premium/max only
```

### Admin Manual
```
Admin Dashboard → "📅 Generate Daily Questions" → POST /api/admin/generate-daily
  → Same logic as cron → Results: "English: ✅ 5 | CA: ✅ 5 | ..."
```

### Subscription
```
Free → 10 Q/day → "⚜️ Upgrade" CTA on dashboard
Premium (promo) → unlimited → "PREMIUM 🎁" badge
Premium/Max → unlimited + editorial quiz + detailed analytics → "MAX ✨" badge
```

---

## 7. Out of Scope (v2.0)

| Feature | Notes |
|---------|-------|
| AI Mentor / Personal Tutor | Planned for Max plan — conversational AI for doubts, planning, teaching |
| Advanced weak-topic recommendations | Analytics improvement |
| Question validation/review queue | #13, #15, #16 — manual review before publishing |
| Payments/subscriptions | No payment gateway yet; promos manually assigned |
| PYQ bulk import for years prior to 2025 | `source='pyq'` column reserved |

---

## 8. Architecture Overview

```
Cloudflare → Vercel (Next.js 16) → Supabase (Postgres + Auth)
                                    ↑
                              DeepSeek AI / Gemini (daily generation, editorial quiz)
                                    ↑
                              Hermes Cron (7:30 AM IST)

WhatsApp (partial):
  User → Meta Cloud API → Vercel webhook → Supabase
```

Full system details: [`ARCHITECTURE.md`](../ARCHITECTURE.md)  
Decision log: [`ADR.md`](./ADR.md)

---

## 9. Success Metrics

| Metric | Target | Measure |
|--------|--------|---------|
| Questions generated | 10,000+ in 3 months | DB `practice_questions` count |
| Active students | 100+ weekly | Supabase auth stats |
| Daily generation success | 100% (25/25) | Cron delivery logs |
| AI parse success rate | > 95% | Per-run logs |
| Original papers seeded | 4+ (CLAT 2025, 2026, Mock, Full) | DB `original_papers` count |
| Promo conversion | 20 promo users activated | `is_promo_user` flag count |

---

## 10. Timeline (Actual)

| Phase | What | Status |
|-------|------|--------|
| Foundation | Domain, DNS, CI/CD, Auth | ✅ Done |
| Core Quiz | Quiz flow, answer tracking, review | ✅ Done |
| Daily Gen | Cron + admin button + 25 questions/day | ✅ Done |
| Theme System | Light/dark, court branding, responsive | ✅ Done |
| Editorial System | RSS, read tracking, AI quiz, analytics | ✅ Done |
| Exam System | CLAT 2025/2026 papers, timer, submit, review | ✅ Done |
| Subscription | 3-tier model, promo campaign, gated features | ✅ Done |
| Analytics | Practice/Tests/Editorials tabs, section breakdown | ✅ Done |
| Concurrency | 2-device session limit | ✅ Done |
| WhatsApp | Registration, webhook, reports | ⏳ Partial |
| AI Mentor | Personal tutor for Max plan | 🔜 Next |
