# CLAT Prep — Test Suite Report
## Generated: July 13, 2026 | v2 — 6 Q per passage + quality improvements

### Test Suite Overview

| Test File | Lines | Tests | Type | Purpose |
|---|---|---|---|---|
| `src/__tests__/section-name-migration.test.ts` | 649 | 56 | Unit | Section rename, passage generation, question metadata, normalisation logic |
| `src/__tests__/exam-flow.test.ts` | 312 | 32 | Unit (pure functions) | Exam question grouping, scoring, section validation |
| `src/__tests__/timer-countdown.test.ts` | 260 | 10 | Unit (React state sim) | Timer lifecycle: start, retake, exit, refresh |
| **Total** | **1,221** | **98** | — | **All passing** |

### Test Results (2026-07-13)

```
 ✓ src/__tests__/exam-flow.test.ts (32 tests)
 ✓ src/__tests__/section-name-migration.test.ts (56 tests)
 ✓ src/__tests__/timer-countdown.test.ts (10 tests)
 Test Files  3 passed (3)
      Tests  98 passed (98)
```

---

## `section-name-migration.test.ts` — 56 Tests

### 1. Official CLAT Section Names (6 tests)
| Test | Description |
|---|---|
| has exactly 5 sections matching CLAT 2025 | Array length = 5 |
| includes English Language (not short "English") | New name present, old absent |
| includes Current Affairs Including General Knowledge (not short) | New name present, old absent |
| includes Legal Reasoning | As expected |
| includes Logical Reasoning | As expected |
| includes Quantitative Techniques | As expected |

### 2. Section Slug Generation (4 tests)
| Test | Description |
|---|---|
| Converts all to correct URL slugs | `english-language`, `current-affairs-including-general-knowledge`, etc. |
| Resolves all slugs back to correct names | Bijection check |
| Rejects invalid slugs | `english`, `current-affairs` not in map |
| Is bijective — slug → section → slug | Roundtrip preserves value |

### 3. Practice Question Metadata (11 tests)
| Test | Description |
|---|---|
| Default marks are 1 | `marks: 1` |
| Default negative marks are 0.25 | `negative_marks: 0.25` |
| Question_number sequential when provided (6 questions) | `[1, 2, 3, 4, 5, 6]` |
| Passage_id links questions together | All 6 share same ID |
| Passage_id can be null for standalone | Null allowed |
| Passage text stripped when passage_id set | No text duplication |
| Accepts all official section names | All 5 valid |
| Rejects invalid section names | Old short names not valid |
| Options always A/B/C/D format | 4 keys, no extras |
| Difficulty is always easy/medium/hard | Constrained values |
| Marks can be custom (non-negative) | Override `marks: 2` works |

### 4. Passage-Based Question Generation (5 tests)
| Test | Description |
|---|---|
| 1 passage → 6 questions (matches CLAT 2025) | Correct count |
| All questions share same passage_id | Single shared UUID |
| Passage has required fields | section, content, difficulty all present |
| Exactly 1 passage per section call | 5 sections, 1 each |
| Passage + 6 questions = 7 DB rows | `1 + 6 = 7` |

### 5. Question Normalisation Logic (14 tests)
| Test | Description |
|---|---|
| Normalises standard question correctly | All fields preserved |
| Strips passage text when passage_id set | No duplication |
| Keeps passage text when passage_id null | Standalone mode |
| Returns null for missing question text | Validation |
| Returns null for missing options | Validation |
| Returns null for missing correct answer | Validation |
| Parses string options JSON | Serialized JSON → object |
| Converts array options to A/B/C/D | `['First','Second']` → `{A:'First',B:'Second'}` |
| Handles question_text vs question naming | Both `question_text` and `question` accepted |
| Preserves custom marks/negative marks from AI | Override respected |
| Defaults marks to 1 when not provided | Default |
| Assigns sequential question numbers (6) | `[1,2,3,4,5,6]` |

### 6. AI Prompt Building (4 tests)
| Test | Description |
|---|---|
| Correct prompt per section | Each mentions its section name |
| Falls back to English Language | Unknown section → fallback |
| All prompts mention "passage" | Passage-based generation |
| All prompts have right number (6) | `QS_PER_PASSAGE = 6` |

### 7. DB Schema Validation (8 tests)
| Test | Description |
|---|---|
| practice_passages has all expected columns | id, section, title, source, content, difficulty, created_at |
| CHECK constraint on section | 5 valid names |
| FK from practice_questions → practice_passages | Foreign key named `fk_practice_questions_passage` |
| ON DELETE SET NULL | Deleting passage → questions keep passage_id as null |
| marks column with default 1 | New column |
| negative_marks column with default 0.25 | New column |
| passage_id column (nullable UUID) | New column |
| question_number column (nullable int) | New column |

### 8. Section Icons (3 tests)
| Test | Description |
|---|---|
| All 5 sections mapped to icons | Complete mapping |
| Unique icons per section | No duplicates |
| No old short-name keys exist | `English`, `Current Affairs` → undefined |

### 9. API Route Validation (3 tests)
| Test | Description |
|---|---|
| Accepts all official section names | Validated |
| Rejects old short names | `English` rejected |
| Rejects invalid names | Empty string rejected |

---

## `exam-flow.test.ts` — 32 Tests (no changes from v1)

## `timer-countdown.test.ts` — 10 Tests (no changes from v1)

---

## Quality Improvements (v2)

| Change | Before | After |
|---|---|---|
| Questions per passage | 5 | **6** (matches CLAT 2025) |
| English Language prompt | Allowed recall questions | **Banned** "According to the passage...", requires inference/author-intent/tone/vocab-in-context |
| Current Affairs prompt | Allowed trivia + news-report passages | **Banned** trivia (dates/launch sites/names), uses editorial/analysis style |
| Legal Reasoning | Good | Added requirement for hypothetical variations |
| Logical Reasoning | Good | Added strengthen/weaken/parallel-reasoning requirements |
| Labels array for normalise | A,B,C,D,E | A,B,C,D,E,F (supports 6 options) |

### Post-improvement sample: English Language
All 6 questions are inference/attitude/meaning-in-context:
1. "The author would most likely agree with..." ✅ (inference)
2. "The author's attitude toward 'dogma'..." ✅ (tone)
3. "The word 'sterile' most nearly means..." ✅ (vocab in context)
4. "It can be inferred that..." ✅ (inference)
5. "Primary purpose in mentioning X is to..." ✅ (author's intent)
6. "Which statement is most consistent..." ✅ (thematic consistency)

### Post-improvement sample: Current Affairs
No trivia questions — all test understanding:
1. "Central theme of the passage" ✅
2. "Negative consequence of overly strict regulation" ✅
3. "Author implies India's approach should be..." ✅
4. "What does 'wait-and-watch' refer to?" ✅
5. "What can be inferred about AI deepfakes?" ✅
6. "Passage suggests ideal regulation should be..." ✅
