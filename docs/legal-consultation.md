# Legal Consultation — CLATly EdTech Platform

**To:** Bhimsen
**From:** Yogita Sharma, Legal Counsel (Regulatory & Tech)
**Date:** July 10, 2026
**Subject:** Pre-Launch Legal Compliance Review — AI-Powered CLAT Preparation Platform

---

## Executive Summary

This memorandum covers five key legal areas for the CLATly platform ahead of its commercial launch with paid subscriptions: advertising compliance, data privacy, intellectual property, Terms of Service with AI disclaimers, and payment processing. Priority actions are flagged in the timeline below.

---

## 1. Advertising & Marketing Compliance

### Legal Framework
- **ASCI Guidelines** — All claims must be substantiated with verifiable data
- **Consumer Protection Act 2019** — False or misleading claims are prohibited
- **Endorsements & Testimonials** — Require written consent + "results not typical" disclaimer

### Specific Rules for EdTech Ads
| Requirement | Implementation |
|---|---|
| No "guaranteed selection" claims | Replace with "improve your preparation" |
| Testimonials need written consent | Collect consent form at time of recording |
| Comparative ads must be factual | Back every claim with data, avoid disparagement |
| AI marketing claims | Disclaim that AI is supplementary, not a guarantee |

### ⚠️ AI-Powered Claims
If advertising "AI-driven personalized learning," ensure:
- Demonstrable that AI performs as advertised
- Prominent disclaimer: *"AI suggestions are supplemental aids, not guarantees of exam performance"*
- No claim that AI replaces human coaching

**Recommendation:** Create an ad pre-approval checklist that flags "guarantee," "percentage," and "ranking" language for legal review before any campaign.

---

## 2. Data Privacy & Security — DPDP Act 2023

### Your Obligations as Data Fiduciary

| Area | Requirement |
|---|---|
| **Consent** | Explicit, informed, freely given — separate consent for processing vs. marketing |
| **Notice** | Privacy notice in clear language (English + Hindi recommended). State: what data, why, retention period, third-party sharing |
| **Data Minimization** | Collect only: name, email, phone, academic level. Avoid Aadhaar unless verified necessary |
| **Parental Consent** | **Mandatory** if any user under 18 — verifiable parental consent required under DPDP |
| **Data Retention** | Delete on consent withdrawal. Publish a retention schedule with auto-delete rules |
| **Breach Notification** | Must report to DPB India + affected users. Implement breach detection now |
| **Security Safeguards** | AES-256 at rest, TLS 1.3 in transit, access controls, audit logs |
| **Grievance Officer** | Appoint Data Protection Officer, publish name and contact on the site |

### DPDP Compliance Checklist
- [ ] Privacy Policy (layered: summary + full version)
- [ ] Consent checkboxes (not pre-ticked) on registration
- [ ] Parental consent flow for under-18 users
- [ ] Data deletion API endpoint for account closure
- [ ] DPO / Grievance Officer contact page
- [ ] Data Processing Agreement with Supabase covering DPDP obligations

### 🔴 Infrastructure Note
Supabase project at `ap-south-1` (Mumbai) — ✓ India data residency. Verify the Data Processing Agreement includes DPDP Act 2023 provisions (not just GDPR).

---

## 3. Intellectual Property & Branding

| Asset | Protection Strategy |
|---|---|
| **"CLATly" brand name** | File **TM Application** (Class 41 — education; Class 9 — software). Priority date matters even before registration |
| **Logo + Visual Identity** | Copyright as artistic work. Use ™ marking until registration |
| **Question bank content** | Copyright exists on creation. Display `© CLATly, 2026` in site footer |
| **AI-generated content** | Under Indian law, AI outputs have **no copyright** (no human author). Protect *curation*, *platform code*, *database structure* instead |
| **Domain** | clatly.com ✓ — also register clatly.in, clatprep.in, typo-squatting variants |

### ⚠️ AI Content IP Warning
If a user copies and republishes AI-generated answers, limited legal recourse since those outputs aren't copyrightable. Focus protection on the platform itself.

---

## 4. Terms of Service & AI Liability Disclaimers

### Essential ToS Clauses

| Clause | Key Content |
|---|---|
| **Service Description** | Define what AI does and does not do (assistance ≠ coaching) |
| **User Eligibility** | Min. age 13; under-18 requires parent/guardian acceptance |
| **Subscriptions** | Billing terms, auto-renewal, refund policy (no statutory right to refund for digital goods — state your policy) |
| **User Conduct** | Prohibit answer-sharing, scraping, multi-account abuse of free tier |
| **AI Disclaimer** | **(Critical — see draft below)** |
| **Limitation of Liability** | Cap at subscription fees paid in last 12 months. Disclaim exam results and indirect damages |
| **Dispute Resolution** | Jurisdiction: user's local courts or specified city. Arbitration clause optional |
| **Termination** | Right to suspend for ToS violation. 30-day data retention post-termination, then delete |
| **Updates** | 30-day notice for material changes |

### AI-Specific Disclaimer (must be prominent, not buried in fine print)

```
**AI-Powered Assistance Disclaimer**

The CLATly AI Mentor and related AI features provide informational
guidance, practice questions, and explanatory content only. They:

- Are NOT a substitute for professional legal coaching,
  structured coursework, or human mentorship.
- Do NOT guarantee any specific CLAT rank, score, admission,
  or selection outcome.
- May occasionally produce incomplete, inaccurate, or
  outdated information. Users are advised to verify critical
  content independently.
- Should not be relied upon for time-sensitive exam strategy
  decisions.

CLATly makes no warranty, express or implied, regarding the
accuracy, completeness, or fitness of AI-generated content for
any particular purpose. Your use of AI features is at your
own risk.
```

---

## 5. Online Payment Processing

### Compliance Requirements

| Area | Standard |
|---|---|
| **Payment Gateway** | Use RBI-authorized aggregator (Razorpay recommended for subscription billing) |
| **PCI-DSS** | Use hosted checkout — never store card data on your server |
| **RBI Recurring Payments** | Explicit mandate, pre-transaction notification, easy cancellation, SMS/email confirmation |
| **Refund Policy** | Must be published. Fair policy (e.g., 7-day cooling-off for first purchase) builds trust |
| **GST** | 18% on digital educational services. Register if turnover > ₹20L. Issue GST invoices with HSN 998439 |
| **TCS** | Check Section 206C(1H) applicability if using Razorpay marketplace model |

### Recommended Stack
- **Gateway:** Razorpay Subscriptions API + webhooks for billing events
- **Integration:** Hosted checkout page only — never bring raw card/PIN data to your server
- **Invoicing:** Auto-generate invoices per transaction with GSTIN and HSN code

---

## Priority Action Plan

| Priority | Action | Timeline |
|---|---|---|
| 🔴 **Critical** | Draft & publish Privacy Policy (DPDP compliant) + ToS | Before paid launch |
| 🔴 **Critical** | Parental consent mechanism for under-18 users | Before paid launch |
| 🔴 **Critical** | AI disclaimer in ToS + separate consent on first AI use | Before paid launch |
| 🟡 **High** | File trademark application for "CLATly" | This month |
| 🟡 **High** | Register for GST (if projected > ₹20L annual) | Before 1st paid subscription |
| 🟡 **High** | Set up Razorpay with DPDP-compliant data processing agreement | Before paid launch |
| 🟢 **Medium** | ASCI ad review checklist + pre-approval process | Before any marketing campaign |
| 🟢 **Medium** | Grievance Officer / DPO contact page | Before paid launch |

---

*This consultation provides general legal guidance based on Indian law as of July 2026. It does not constitute an attorney-client relationship. Specific contractual documents (ToS, Privacy Policy) should be finalized with review of the live platform's features and data flows.*

---

*Document prepared by Yogita Sharma, Legal Consultant — Tech & EdTech Compliance*
