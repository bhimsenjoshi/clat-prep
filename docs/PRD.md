# CLAT Prep Hub — Product Requirements Document (PRD)

> **Version:** 1.0  
> **Status:** Draft  
> **Author:** Bhimsen (@Bhimsen443)  
> **Last Updated:** July 2026

---

## 1. Executive Summary

CLAT Prep Hub is an AI-powered practice test platform designed specifically for CLAT (Common Law Admission Test) aspirants. It generates high-quality, CLAT-pattern practice tests across all 5 sections using a multi-agent AI pipeline (DeepSeek + Gemini), provides a realistic test-taking experience with timed sections and per-question tracking, and offers detailed performance review and analytics.

The platform targets **₹0/month operating cost** using Vercel Free + Supabase Free tiers, with AI generation costs at ~$0.10/test.

---

## 2. Problem Statement

### 2.1 The Gap

CLAT aspirants face three key problems:

| Problem | Current Solutions | Gap |
|---------|------------------|-----|
| **Limited practice material** | Coaching centers, static books | Questions are finite, expensive, and not personalized |
| **No adaptive learning** | Fixed test series | Every student gets the same tests regardless of weak areas |
| **No instant review** | Answer keys with minimal explanations | Students can't learn *why* they got something wrong |

### 2.2 Our Solution

CLAT Prep Hub solves all three:
- **Infinite practice** — AI generates fresh CLAT-pattern questions on demand
- **Section targeting** — Generate questions for specific weak sections
- **Deep review** — Every question has an AI-generated explanation

---

## 3. User Personas

### 3.1 Student (Test-Taker)

| Attribute | Detail |
|-----------|--------|
| **Age** | 16-20 years |
| **Goal** | Practice for CLAT 2027+ |
| **Device** | Phone (primary), Laptop (secondary) |
| **Tech comfort** | Moderate — can open a link and tap buttons |
| **Pain points** | Can't find enough quality practice tests; coaching is expensive |

**Typical session:** Opens the PWA → picks a test → answers questions with timer → reviews results → checks leaderboard

### 3.2 Admin (Coach / Test Creator)

| Attribute | Detail |
|-----------|--------|
| **Role** | CLAT coach, mentor, or Bhimsen himself |
| **Goal** | Create practice tests, monitor student progress |
| **Device** | Laptop (primary) |
| **Pain points** | Manually creating questions is slow; grading is tedious |

**Typical session:** Logs in → creates a new test → clicks "Generate" for each section → reviews AI output → publishes → checks student analytics

---

## 4. Functional Requirements

### 4.1 Authentication & Authorization

| ID | Requirement | Priority |
|----|-------------|----------|
| AUTH-01 | Students can sign up with email/password | P0 |
| AUTH-02 | Admins can log in with same flow (role assigned in DB) | P0 |
| AUTH-03 | Custom cookie auth (`clat-at` / `clat-rt`) for SSR compatibility | P0 |
| AUTH-04 | Middleware guards all `/student/*` and `/admin/*` routes | P0 |
| AUTH-05 | Token auto-refresh via Supabase `refreshSession()` | P0 |
| AUTH-06 | Role-based redirect: student ↔ admin dashboards | P0 |

### 4.2 Test Creation (Admin)

| ID | Requirement | Priority |
|----|-------------|----------|
| TEST-01 | Admin can create a new test with title and description | P0 |
| TEST-02 | Each test has 5 sections (English, CA, Legal, LR, Quant) | P0 |
| TEST-03 | Admin can set per-section question counts (dynamic batch sizing) | P1 |
| TEST-04 | Admin clicks "Generate" → AI creates questions for a section | P0 |
| TEST-05 | Generated questions go to a review queue (admin must approve) | P1 |
| TEST-06 | Admin can manually add/edit questions | P2 |
| TEST-07 | Deduplication against existing questions | P1 |

### 4.3 Test-Taking (Student)

| ID | Requirement | Priority |
|----|-------------|----------|
| TAKE-01 | Student sees a list of available (published) tests | P0 |
| TAKE-02 | Clicking a test starts a timed attempt | P0 |
| TAKE-03 | Questions displayed with section navigation (prev/next/jump) | P0 |
| TAKE-04 | Per-question timer tracks time spent | P1 |
| TAKE-05 | Auto-save answer on navigation (no explicit save needed) | P1 |
| TAKE-06 | Resume incomplete attempts (multi-attempt via attempt_number) | P1 |
| TAKE-07 | 120-question compose algorithm: min 110 + random 10 from overflow | P1 |
| TAKE-08 | Submit with confirmation dialog | P0 |

### 4.4 Review & Scoring

| ID | Requirement | Priority |
|----|-------------|----------|
| REVIEW-01 | Auto-score all answers on submission | P0 |
| REVIEW-02 | Section-wise and total score display | P0 |
| REVIEW-03 | Correct/incorrect visual marking (green/red) | P0 |
| REVIEW-04 | AI-generated explanation for each question | P0 |
| REVIEW-05 | Time spent per question displayed | P2 |
| REVIEW-06 | Retake button creates a new attempt | P1 |

### 4.5 Dashboard & Analytics

| ID | Requirement | Priority |
|----|-------------|----------|
| DASH-01 | Student dashboard shows recent attempts with scores | P0 |
| DASH-02 | Per-section breakdown with actual DB totals (no hardcoding) | P0 |
| DASH-03 | Accuracy trends over time | P2 |
| DASH-04 | Admin dashboard: total students, tests, questions generated | P1 |
| DASH-05 | Student list with performance overview (admin) | P2 |

### 4.6 Leaderboard

| ID | Requirement | Priority |
|----|-------------|----------|
| LEAD-01 | Aggregate scores across completed tests | P1 |
| LEAD-02 | Rank by average accuracy, total tests, improvement | P1 |
| LEAD-03 | Student's own rank highlighted | P1 |
| LEAD-04 | Filters: by section, by time period | P2 |

### 4.7 AI Question Generation

| ID | Requirement | Priority |
|----|-------------|----------|
| AI-01 | 5 parallel sub-agents (one per section) via Promise.all | P0 |
| AI-02 | DeepSeek Chat API as primary AI backend | P0 |
| AI-03 | Gemini 2.5 Flash as fallback if DeepSeek fails | P1 |
| AI-04 | Per-section system prompts with CLAT 2027 syllabus | P0 |
| AI-05 | JSON response format with strict schema validation | P0 |
| AI-06 | Normalizer handles AI output quirks (key names, formats) | P0 |
| AI-07 | Deduplication against existing questions (first 60 chars) | P1 |

---

## 5. Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-01 | Page load time | < 2s (server-side rendered) |
| NFR-02 | AI generation time | < 30s per section (5 parallel = ~30s total) |
| NFR-03 | Uptime | 99% (Vercel SLA) |
| NFR-04 | Security | Cookie-based auth, RLS on all tables |
| NFR-05 | Cost | ₹0/month (Vercel Free + Supabase Free + AI pay-per-use) |
| NFR-06 | Mobile support | Fully responsive, PWA installable |
| NFR-07 | Concurrency | Handle 50+ simultaneous test-takers |

---

## 6. User Flow Map

```
                    ┌──────────────┐
                    │  Landing Page │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  /auth/login │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────▼─────┐ ┌───▼────┐ ┌────▼──────┐
       │ Student    │ │ Admin  │ │ Unauthed  │
       │ Dashboard  │ │ Dashboard│ │ Redirect  │
       └──────┬─────┘ └───┬────┘ └───────────┘
              │            │
     ┌────────┼────────┐  │
     │        │        │  │
  ┌──▼───┐ ┌──▼───┐ ┌─▼──▼──┐
  │Take  │ │Review│ │Leader │
  │Test  │ │      │ │board  │
  └──────┘ └──────┘ └───────┘
```

### Admin Flow
```
Admin Dashboard
  ├── Create Test → Add Sections → Generate AI Questions
  │                                → Review Queue → Approve/Edit
  │                                → Publish Test
  ├── Student List → View performance
  └── Question Bank → Browse/Edit/Delete
```

---

## 7. Out of Scope (v1.0)

- Payment/subscription system (future)
- Real-time proctoring
- Video explanations
- Mobile native apps (PWA covers this)
- Multiple languages (English-only for v1)
- AI-generated personalized study plans

---

## 8. Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Questions generated | 10,000+ in first 3 months | DB count |
| Active students | 100+ weekly active | Supabase auth stats |
| Test completion rate | > 70% (started vs submitted) | attempts table |
| Average accuracy | Improves by 5% after 10 tests | per-user trend |
| AI generation success | > 95% (valid JSON on first try) | generate-test logs |

---

## 9. Timeline

| Phase | Milestone | Target Date |
|-------|-----------|-------------|
| **v1.0** | Foundation — PRD, Architecture, CI/CD | Aug 2026 |
| **v2.0** | Core Features — Auth, Dashboard, Test-taking, Review | Oct 2026 |
| **v3.0** | AI Engine — Multi-section generation, validation | Dec 2026 |
| **v4.0** | Testing & QA — Unit, integration, performance | Jan 2027 |
| **v5.0** | Launch — Production deploy, docs, contributors | Feb 2027 |

---

## 10. Open Questions

| Question | Status |
|----------|--------|
| Should we support social login (Google/GitHub) in addition to email? | ⏳ TBD |
| Do we need a paid tier for AI generation beyond free limits? | ⏳ TBD |
| Should explanations be generated at test-creation time or on-demand during review? | ✅ At creation time (faster review) |
| How many questions per test for optimal student experience? | ✅ 120 (CLAT pattern) |

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| CLAT | Common Law Admission Test — India's centralized law entrance exam |
| PWA | Progressive Web App — installable from browser |
| RLS | Row-Level Security — Supabase's per-row permission system |
| Service Role Key | Supabase admin key that bypasses RLS |
| Sub-agent | Individual AI call for one CLAT section |
| Passage | Reading comprehension text that questions are based on |
