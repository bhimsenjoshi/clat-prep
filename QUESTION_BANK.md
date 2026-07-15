# Question Bank Status

*Last updated: 14 July 2026*

## Overview — 746 Total Questions

| Mode | Section | Count | Description |
|---|---|---|---|
| 🏛️ **Original Papers** | All 5 sections | **407** | Authentic CLAT 2025, CLAT 2026, Mock #1, Mock #2 |
| 📚 **Practice (Passage)** | All 5 sections | **145** | AI-generated passage-linked (25 passages, ~6 Qs each) |
| ⚡ **Quick Fire (Standalone)** | 4 sections (+ Quant) | **194** | No passages, rapid-fire format |

---

## 🏛️ Original CLAT Papers

| Paper | English | GK | Legal | Logical | Quant | **Total** |
|---|---|---|---|---|---|---|
| CLAT 2025 A | 24 | 27 | 32 | 24 | 11 | **118** |
| CLAT 2026 A | 24 | 28 | 30 | 26 | 12 | **120** |
| Mock Test #1 | 10 | 10 | 10 | 10 | 10 | **50** |
| Mock Test #2 | 24 | 28 | 32 | 24 | 11 | **119** |
| **Total** | **82** | **93** | **104** | **84** | **44** | **407** |

Key: Quant includes 10 standalone (non-table) + 34 passage-linked (data tables).

## 📚 Practice Questions (Passage-linked)

| Section | Passages | Questions | Avg |
|---|---|---|---|
| English Language | 6 | 34 | ~5.7/passage |
| Current Affairs + GK | 5 | 29 | ~5.8/passage |
| Legal Reasoning | 5 | 29 | ~5.8/passage |
| Logical Reasoning | 4 | 23 | ~5.8/passage |
| Quantitative Techniques | 5 | 30 | 6/passage |
| **Total** | **25** | **145** | |

## ⚡ Quick Fire (Standalone)

| Section | Count | Question Types |
|---|---|---|
| English Language | 50 | Vocab, grammar, inference, error-spotting |
| Current Affairs + GK | 45 | Policy analysis, current events (no trivia) |
| Legal Reasoning | 44 | Principle application, fact-pattern analysis |
| Logical Reasoning | 45 | Syllogisms, assumptions, strengthen/weaken |
| Quantitative Techniques | 10 | Profit-loss, averages, ratios, TSD, work-time, percentages, SI, mixtures, number sums, ages |
| **Total** | **194** | |

## DB Schema

- `practice_questions` — All practice + Quick Fire questions (passage_id links to practice_passages)
- `practice_passages` — Passage text for practice questions
- `questions` — Original CLAT paper questions (linked to sections/tests)
- `sections` / `tests` — Original paper structure
- `quiz_sessions` — Practice + Quick Fire session records (session_type: 'practice' | 'quick_fire')
- `quiz_responses` — Per-question responses for practice/Quick Fire

## Daily Generation

- Cron: `scripts/daily-questions-cron.mjs` runs at 7:30 AM IST daily
- Generates 1 passage + 6 questions per section = 30 new questions/day
- All CLAT-format: passage-linked only (no orphan standalone questions — fixed)
