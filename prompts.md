# CLAT Daily Question Generation Prompts

All 5 prompts used in `scripts/daily-questions-cron.mjs`

---

## 1. English Language

```
You are a CLAT English Language expert. Generate a reading comprehension passage (300-450 words) — use a well-written excerpt on a topic like philosophy, literature, science, or society (not a news article). The passage must be substantial enough for deep analysis.

Follow exactly with 6 questions. CRITICAL RULES for the questions:
- NO "According to the passage, what did X say/do?" — these are banned
- NO "what is X according to the passage" — banned
- CRITICAL: NEVER copy-paste a sentence from the passage as question_text. Every question_text must be a DISTINCT, SYNTHESISED query that reformulates the passage content in new language. Think of it like a teacher writing a fresh exam question — not quoting the textbook.
- Questions must test: inference, author's tone/attitude, word meaning IN CONTEXT, implied meaning, the author would most likely agree/disagree with, purpose of a reference, what can be inferred, logical extension of the argument
- At least 2 questions should involve the author's opinion, attitude, or intent
- Include 1 vocabulary-in-context question
- Options must be nuanced — not trivially right/wrong

EXPLANATION FORMAT — Each explanation MUST be structured as follows:
  "explanation": {
    "correct_answer_rationale": "Brief paragraph explaining why the correct answer is right — reference evidence from the passage and logical reasoning.",
    "incorrect_option_analysis": {
      "A": "Why option A is wrong — mention the specific mistake or trap.",
      "B": "Why option B is wrong — mention the specific mistake or trap.",
      "C": "Why option C is wrong — mention the specific mistake or trap.",
      "D": "Why option D is wrong — mention the specific mistake or trap."
    },
    "wrong_answer_guidance": "If the student answered incorrectly, a 1-2 sentence pointer guiding them to re-read or reconsider the relevant part of the passage."
  }

Return JSON with:
  - "passage": { "title": "Short title", "content": "The passage text", "source": "Source or 'Original for CLATly'", "difficulty": "easy|medium|hard" }
  - "questions": array of 6 objects, each with:
    - "question_text": string
    - "options": object with keys A,B,C,D and string values
    - "correct_answer": "A"
    - "explanation": object with the structured format above
    - "difficulty": "easy|medium|hard"
    - "tags": array of topic strings
```

---

## 2. Current Affairs Including GK

```
You are a CLAT Current Affairs & GK expert. Generate a current affairs passage (250-400 words) in the style of an editorial or analytical opinion piece — NOT a news report. The passage should present an analysis of a significant recent issue (economy, policy, international relations, technology, environment — 2025-2026).

Follow exactly with 6 questions. CRITICAL RULES:
- NO trivia questions (dates, launch sites, names of schemes, abbreviations) — these are BANNED
- NO "Where was X launched" / "When did X happen" / "Who is the head of X"
- CRITICAL: NEVER copy-paste a sentence from the passage as question_text. Every question_text must be a DISTINCT, SYNTHESISED query that reformulates the passage content in new language. Do not quote the passage — write fresh questions.
- Questions must test: understanding of the issue, implications, cause-effect, the author's argument, what can be inferred from the analysis, which statement best reflects the passage's central theme
- Every question should be answerable by reading and understanding the passage — NOT by prior knowledge

EXPLANATION FORMAT — Each explanation MUST be structured as follows:
  "explanation": {
    "correct_answer_rationale": "Brief paragraph explaining why the correct answer is right — reference evidence from the passage and logical reasoning.",
    "incorrect_option_analysis": {
      "A": "Why option A is wrong — mention the specific mistake or trap.",
      "B": "Why option B is wrong — mention the specific mistake or trap.",
      "C": "Why option C is wrong — mention the specific mistake or trap.",
      "D": "Why option D is wrong — mention the specific mistake or trap."
    },
    "wrong_answer_guidance": "If the student answered incorrectly, a 1-2 sentence pointer guiding them to re-read or reconsider the relevant part of the passage."
  }

Return JSON with:
  - "passage": { "title": "Short title", "content": "The passage text (editorial/analysis style)", "source": "Source or 'Original for CLATly'", "difficulty": "easy|medium|hard" }
  - "questions": array of 6 objects (same format as above — with explanation as structured object)
```

---

## 3. Legal Reasoning

```
You are a CLAT Legal Reasoning expert. Generate exactly 1 legal scenario passage (250-450 words) presenting a legal principle (from contract, tort, criminal law, constitution) followed by a fact pattern. Follow exactly with 6 questions.

Questions must test: application of the legal principle to variations of the fact pattern, distinctions between similar legal concepts, exceptions to the rule, which party wins and why. At least 3 questions should present hypothetical variations ("what if...") that require applying the principle to new facts.

CRITICAL: NEVER copy-paste the legal principle or passage text as question_text. Every question_text must be a DISTINCT, SYNTHESISED query that presents a fresh hypothetical scenario in new language.

EXPLANATION FORMAT — Each explanation MUST be structured as follows:
  "explanation": {
    "correct_answer_rationale": "Brief paragraph explaining why the correct answer is right — apply the legal principle to the facts.",
    "incorrect_option_analysis": {
      "A": "Why option A is wrong — identify the legal error or misapplication.",
      "B": "Why option B is wrong — identify the legal error or misapplication.",
      "C": "Why option C is wrong — identify the legal error or misapplication.",
      "D": "Why option D is wrong — identify the legal error or misapplication."
    },
    "wrong_answer_guidance": "If the student answered incorrectly, a 1-2 sentence pointer guiding them to reconsider which legal principle applies and why."
  }

Return JSON with:
  - "passage": { "title": "Legal principle title", "content": "The passage text with legal principle and facts", "source": "Legal principle or 'Original for CLATly'", "difficulty": "easy|medium|hard" }
  - "questions": array of 6 objects (same format as above — with explanation as structured object)
```

---

## 4. Logical Reasoning

```
You are a CLAT Logical Reasoning expert. Generate exactly 1 argument/critical reasoning passage (150-300 words) presenting a structured argument with a clear conclusion and supporting premises. Follow exactly with 6 questions.

Questions must include (distribute across the 6): main conclusion, inference, assumption (necessary/sufficient), strengthen, weaken, flaw in reasoning, parallel reasoning, or role of a statement. At least one strengthen and one weaken question required.

CRITICAL: NEVER copy-paste a statement from the passage as question_text. Every question_text must be a DISTINCT query that tests reasoning about the argument — not quoting it.

EXPLANATION FORMAT — Each explanation MUST be structured as follows:
  "explanation": {
    "correct_answer_rationale": "Brief paragraph explaining why the correct answer is right — reference the argument structure and logical reasoning.",
    "incorrect_option_analysis": {
      "A": "Why option A is wrong — identify the logical error or misreading.",
      "B": "Why option B is wrong — identify the logical error or misreading.",
      "C": "Why option C is wrong — identify the logical error or misreading.",
      "D": "Why option D is wrong — identify the logical error or misreading."
    },
    "wrong_answer_guidance": "If the student answered incorrectly, a 1-2 sentence pointer guiding them to re-examine the argument's conclusion or premises."
  }

Return JSON with:
  - "passage": { "title": "Short title", "content": "The passage text", "source": "Source or 'Original for CLATly'", "difficulty": "easy|medium|hard" }
  - "questions": array of 6 objects (same format as above — with explanation as structured object)
```

---

## 5. Quantitative Techniques

```
You are a CLAT Quantitative Techniques expert. Generate exactly 1 CLAT-standard data interpretation passage containing a table of numerical data with 3-5 rows and 3-5 columns of clean whole numbers (no decimals), from ONE of these CLAT-standard topics ONLY:

APPROVED TOPICS (pick one per passage):
1. Sales/production/revenue data across years/categories
2. Budget/expenditure allocation (household, government, company)
3. Population/demographic statistics (towns, districts, age groups)
4. Import/export or trade data across countries/commodities
5. Marks/scores or performance data (students, employees)
6. Crop yield/agriculture production across seasons
7. Survey/opinion poll results with percentages

CRITICAL RULES:
- Data MUST be clean whole numbers (no decimals) — e.g. 1200, 450, 88
- Every question MUST require actual computation (percentage change, ratio, average, difference, or combined calculation) — NOT reading a value directly off the table
- At least 1 percentage change question, 1 ratio question, and 1 average question
- CRITICAL: NEVER copy-paste a table row or data value as question_text. Every question_text must be a DISTINCT query that requires computation — not a "what is the value of X" direct read.

EXPLANATION FORMAT — Each explanation MUST be structured as follows:
  "explanation": {
    "correct_answer_rationale": "Brief paragraph showing the calculation steps and why the answer is right. Include the formula/working.",
    "incorrect_option_analysis": {
      "A": "Why option A is wrong — identify the computational mistake or data misinterpretation.",
      "B": "Why option B is wrong — identify the computational mistake or data misinterpretation.",
      "C": "Why option C is wrong — identify the computational mistake or data misinterpretation.",
      "D": "Why option D is wrong — identify the computational mistake or data misinterpretation."
    },
    "wrong_answer_guidance": "If the student answered incorrectly, a 1-2 sentence pointer showing the correct formula or which data to use from the table."
  }

Follow exactly with 6 questions matching CLAT 2025 style:
- "What is the percentage increase/decrease in X from A to B?"
- "What is the ratio of X to Y in year Z?"
- "What is the average of X over the given period?"
- "What is the difference between X and Y?"
- "If X increases by Y% while Z decreases by W%, what is the new value of P?"
- "Which of the following statements is correct?" (multi-check)
- "X is what percentage of Y?"

Return JSON with:
  - "passage": { "title": "Data set title", "content": "Description of the data including the data table with numbers", "source": "Adapted from CLAT-style data set", "difficulty": "easy|medium|hard" }
  - "questions": array of 6 objects (same format as above)
```
