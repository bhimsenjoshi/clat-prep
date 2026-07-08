# CLAT Prep Hub — Product Requirements Document (PRD)

> **Version:** 2.0  
> **Status:** Active  
> **Author:** Bhimsen (@Bhimsen443)  
> **Last Updated:** July 8, 2026

---

## 1. Executive Summary

CLAT Prep Hub is an AI-powered practice test platform for CLAT (Common Law Admission Test) aspirants. It generates high-quality CLAT-pattern questions across all 5 sections using DeepSeek AI, provides instant answer feedback with explanations, tracks progress, and auto-refreshes the question pool daily.

**Live:** [clatly.com](https://clatly.com)  
**Stack:** Next.js 16 + Supabase (Postgres + Auth) + DeepSeek AI  
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

### 3.3 Review & Dashboard

| ID | Requirement | Priority |
|----|-------------|----------|
| REV-01 | Per-attempt cards with attempted/correct/incorrect/total/time | P0 |
| REV-02 | Section breakdown with actual DB totals (no hardcoding) | P0 |
| REV-03 | Correct/incorrect markings (green/red) with explanations | P0 |
| REV-04 | Retake button for each attempt | P1 |

### 3.4 Daily Question Generation

| ID | Requirement | Priority |
|----|-------------|----------|
| GEN-01 | Auto-generate 25 questions daily (5 per section) | P0 |
| GEN-02 | Runs at 7:00 AM IST via Hermes cron | P0 |
| GEN-03 | Admin button for on-demand generation | P0 |
| GEN-04 | Tags questions with `source='daily'` | P0 |
| GEN-05 | Zero-dependency cron script (Node built-in fetch only) | P0 |
| GEN-06 | Delivery notification to admin Telegram on completion | P1 |

### 3.5 Admin Interface

| ID | Requirement | Priority |
|----|-------------|----------|
| ADM-01 | Dashboard at `/admin/dashboard` | P0 |
| ADM-02 | "Generate Daily Questions" button | P0 |
| ADM-03 | Per-section success/failure results display | P0 |

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

---

## 5. User Flows

### Practice Quiz
```
Landing → /auth/login → Student Dashboard → Pick Section/All
  → Quiz (Question 1 of N) → Answer → Instant feedback + explanation
  → Next Question → ... → End → Dashboard (updated attempt card)
```

### Daily Questions
```
Hermes Cron (7:00 AM IST) → Node.js script → DeepSeek API × 5 sections
  → Normalize JSON → Supabase REST insert (source='daily')
  → Telegram: "✅ 25 new questions added"
```

### Admin Manual
```
Admin Dashboard → "📅 Generate Daily Questions" → POST /api/admin/generate-daily
  → Same logic as cron → Results: "English: ✅ 5 | CA: ✅ 5 | ..."
```

---

## 6. Out of Scope (v1.0)

- PYQ (Previous Year Questions) import — `source='pyq'` column reserved
- WhatsApp integration — shelved (#25, Meta Business API too complex)
- Advanced analytics / weak-topic recommendations
- Question validation/review queue (#13, #15, #16)
- Payments/subscriptions

---

## 7. Architecture Overview

```
Cloudflare → Vercel (Next.js 16) → Supabase (Postgres + Auth)
                                    ↑
                              DeepSeek AI (daily generation)
                                    ↑
                              Hermes Cron (7:00 AM IST)
```

Full system details: [`ARCHITECTURE.md`](../ARCHITECTURE.md)  
Decision log: [`ADR.md`](./ADR.md)

---

## 8. Success Metrics

| Metric | Target | Measure |
|--------|--------|---------|
| Questions generated | 10,000+ in 3 months | DB `practice_questions` count |
| Active students | 100+ weekly | Supabase auth stats |
| Daily generation success | 100% (25/25) | Cron delivery logs |
| AI parse success rate | > 95% | Per-run logs |

---

## 9. Timeline (Actual)

| Phase | What | Status |
|-------|------|--------|
| Foundation | Domain, DNS, CI/CD, Auth | ✅ Done |
| Core Quiz | Quiz flow, answer tracking, review | ✅ Done |
| Daily Gen | Cron + admin button + 25 questions/day | ✅ Done |
| Analytics | Weak-topic recommendations | 🔜 Next |
| PYQ Import | Previous year questions | ⏳ Backlog |
