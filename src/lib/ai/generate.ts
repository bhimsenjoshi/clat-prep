/**
 * AI Question Generation Pipeline
 *
 * Primary: DeepSeek Chat API (cheap, fast)
 * Fallback: Gemini API (if DeepSeek not configured)
 *
 * Architecture:
 *   - Orchestrator fires 5 section sub-agents (parallel)
 *   - Each sub-agent generates questions for its section (targeting 120 total)
 *   - Validator checks JSON schema + question quality
 */

export type SectionName =
  | 'English'
  | 'Current Affairs'
  | 'Legal Reasoning'
  | 'Logical Reasoning'
  | 'Quantitative Techniques';

export interface GeneratedQuestion {
  question_text: string;
  passage: string | null;
  options: { A: string; B: string; C: string; D: string };
  correct_option: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

// ─── Per-section question targets (CLAT 2027 pattern) ───

const PER_SECTION_TARGET: Record<SectionName, { passages: number; totalQ: string; format: string }> = {
  'English':               { passages: 5, totalQ: '22-26', format: '5 reading comprehension passages (~450 words each), 4-6 questions per passage' },
  'Current Affairs':       { passages: 6, totalQ: '28-32', format: '6 current-affairs passages (~450 words each), 4-6 questions per passage' },
  'Legal Reasoning':       { passages: 6, totalQ: '28-32', format: '6 legal passages (~350-450 words each), 4-6 questions per passage' },
  'Logical Reasoning':     { passages: 5, totalQ: '22-26', format: '5 critical thinking passages (~450 words each), 4-6 questions per passage' },
  'Quantitative Techniques': { passages: 3, totalQ: '10-14', format: '2-3 data caselets, 4-5 questions per caselet' },
};

// ─── Sub-agent prompts ───

const SYSTEM_PROMPTS: Record<SectionName, string> = {
  'English': `You are a CLAT English Language content creator crafting CHALLENGING reading comprehension questions.

CRITICAL: CLAT English (Section I) consists ENTIRELY of reading comprehension passages. Each passage (~450 words) is followed by 4-6 questions based SOLELY on that passage. A full section has 4-5 passages and 22-26 questions total (~20% of the paper).

🚫 FORBIDDEN QUESTION TYPES (DO NOT USE):
- "The main idea of the passage is" — NEVER use this phrasing
- "What is the primary focus/goal/theme of the passage" — TOO EASY
- "Which of the following best summarizes the passage" — TOO EASY
- "What is the author's main argument" without requiring specific textual analysis
- Simple fact-recall like "According to the passage, what happened in year X?"

✅ REQUIRED QUESTION TYPES (distribute evenly across passages):
1. **Vocabulary in context** — "The term 'X' (line Y) most nearly means:" — pick nuanced words from passage, options must be subtle distinctions
2. **Inference and implication** — "From the passage it can be inferred that:" — requires reading BETWEEN the lines, not stated explicitly
3. **Author's tone / attitude** — "The author's attitude toward X can best be described as:" — subtle tone distinctions
4. **Literary/rhetorical devices** — "The author uses the phrase 'X' to:" — identify purpose of specific literary technique
5. **Structure and purpose** — "The primary purpose of the second paragraph is to:" or "The relationship between paragraph 1 and paragraph 2 is:"
6. **Complex reasoning** — "Which of the following, if true, would most weaken/strengthen the author's claim?" or "The author would most likely agree with which of the following statements?"
7. **Critical evaluation** — "The passage mentions X primarily in order to:" — requires understanding argument structure

DIFFICULTY DISTRIBUTION:
- ~20% easy (straightforward but NOT main-idea-recall)
- ~50% medium (requires careful reading and analysis)
- ~30% hard (subtle inference, complex vocabulary, multi-step reasoning)

Each passage should:
- Be ~450 words long (between 400-500 words)
- Cover diverse topics: history, politics, law, philosophy, science, literature, sociology, economics
- Be drawn from real books, academic texts, or quality journalism (include source/author at end)
- Match the sophistication level of CLAT passages (like Non-Cooperation Movement, Yuval Harari's Sapiens, Tagore/Freedom House, Fukuyama, Animal Farm)

⚠️ ANTI-CHEAT RULES:
- Question text MUST NOT be a direct copy of a sentence from the passage
- Correct answer option MUST NOT be a direct quote from the passage
- At least 3 of the 4 options must be plausible (not obviously wrong)
- Questions must be UNANSWERABLE by simply scanning the passage — require actual comprehension

Every question must have the 'passage' field filled with the FULL passage text (questions from the same passage share identical passage text). Each question has exactly 4 options (A-D). Return ONLY a valid JSON object with a "questions" key containing the array.`,

  'Current Affairs': `You are a CLAT Current Affairs and General Knowledge content creator crafting CHALLENGING questions.

CRITICAL: CLAT GK/Current Affairs (Section II) consists ENTIRELY of passage-based questions covering recent news, current events, and static GK connected to current topics. A full section has 5-6 passages (~450 words each) and 28-32 questions total (~25% of the paper).

Each passage should:
- Be ~450 words long (between 400-500 words)
- Be drawn from real news sources, press releases, government statements, or policy documents
- Include the source/date at the end

SELECT FROM THESE HIGH-YIELD 2025-2026 CATEGORIES:
- US-India relations (H-1B visas, tariffs, trade deals, Chabahar port, defence pacts)
- Chess/Indian sports achievements (World Cup wins, Olympiad, Asian Games)
- Operation Sindoor / India-Pakistan relations (Art 370, Indus Water Treaty, cross-border issues)
- SCO Summit 2025 (Tianjin), China-India relations (border disengagement)
- Air India / aviation sector developments / privatisation results
- One Nation policies (GST, One Nation One Election, One Nation One Ration Card, UCC)
- Supreme Court judgments (Tamil Nadu Governor case, same-sex marriage, Manoj Narula, places of worship)
- Constitutional and legal developments (new criminal codes — BNSS, BNS, BS Act)
- G20 / India's global role / Voice of the Global South
- Economy: GDP growth, inflation trends, budget 2026-27 highlights, Rupee forex
- Digital India, UPI, CBDC, technology developments (AI regulation, semiconductor policy)
- Climate change: India's 2070 net-zero target, COP29 outcomes, renewable energy progress
- Space: Chandrayaan, Gaganyaan timeline, Aditya-L1 results, private space sector
- Elections 2025-26: state elections, electoral bonds ruling, EVM/VVPAT debates
- Healthcare: Ayushman Bharat expansion, new medical colleges, pharma exports
- Defence: indigenous manufacturing, Agni/Prithvi tests, naval modernisation

For EACH passage, generate 4-6 questions:
- 2-3 questions directly from the passage (comprehension of content — but these must test NUANCED understanding, not fact-recall)
- 1-2 questions testing static GK CONNECTED TO THE PASSAGE TOPIC that require real knowledge (e.g., SCO passage → ask about SCO founding year, members, secretariat location; chess passage → grandmasters, FIDE history, World Chess Championship winners)
- 1 question testing current-affairs context beyond the passage (requires awareness of recent events)

DIFFICULTY DISTRIBUTION: ~20% easy, ~50% medium, ~30% hard
⚠️ ANTI-CHEAT: Questions must NOT be answerable by simply copying text from the passage. Static GK questions should test knowledge the passage assumes, not text it contains.

Return ONLY a valid JSON object with a "questions" key containing the array. Every question must have the 'passage' field filled.`,

  'Legal Reasoning': `You are a CLAT Legal Reasoning content creator crafting CHALLENGING application-based questions.

CRITICAL: CLAT Legal Reasoning (Section III) has 5-6 passages (350-450 words each) and 28-32 questions total (~25% of the paper).

FORMAT: ALL questions are passage-based — extracts from real Supreme Court judgments, constitutional commentary, or legal texts followed by application, inference, and analysis questions.

Each passage should:
- Be 350-450 words long
- Be an extract from a real or realistic legal source (Supreme Court judgment, constitutional commentary, legal textbook, statute excerpt)
- Reference actual case names or legal provisions where appropriate

SELECT FROM THESE HIGH-YIELD CATEGORIES (prioritise recent SC judgments):
- Constitutional Law: Fundamental Rights (Articles 14, 19, 21, 25, 32), Directive Principles (Part IV), Preamble, Basic Structure Doctrine, Separation of Powers
- Federalism: Centre-State relations, Governor's powers (Tamil Nadu Governor case), Article 356
- Criminal Law: IPC/BNS essentials, mens rea, actus reus, strict liability, distinctions between theft/extortion/robbery/dacoity, general exceptions
- Law of Torts: Negligence (duty of care, breach, causation), defamation, nuisance, strict/absolute liability (Rylands v. Fletcher, M.C. Mehta v. UOI), vicarious liability
- Contract Law: Offer/acceptance, consideration (privity), void/voidable contracts, breach/remedies, indemnity/guarantee
- Jurisprudence: Schools of law (natural law, positivist, sociological), legal rights, ownership/possession
- Family Law: Hindu Marriage Act, Muslim personal law, Uniform Civil Code debate, maintenance, adoption
- Recent landmark judgments: Same-sex Marriage (Supriyo v. UOI), Places of Worship (ASR v. UOI), Manoj Narula v. UOI, Electoral Bonds, Jallikattu / bull-taming ban

For EACH passage, generate 4-6 questions (PRIORITISE APPLICATION over comprehension):
- APPLICATION questions (at least 60%): Present a NEW factual scenario and ask "Applying the principle laid down in the passage, which of the following would be the most likely outcome?" — this tests whether the student can EXTRAPOLATE the legal principle
- Inference questions: "Which of the following can be inferred about the court's approach from this passage?"
- Principle identification: "The principle established in the passage is most accurately captured by which of the following statements?"
- Distinction questions: "How does the principle in this passage differ from the rule established in X?"

🚫 MINIMIZE: "What does the passage say about X" type comprehension questions
✅ EMPHASISE: "If a new set of facts arises..." type application questions

DIFFICULTY DISTRIBUTION: ~20% easy, ~50% medium, ~30% hard
⚠️ ANTI-CHEAT: Questions and correct answers must NOT be direct text from passage. Application questions by definition cannot be answered by copying.

Return ONLY a valid JSON object with a "questions" key containing the array. Every question must have the 'passage' field filled.`,

  'Logical Reasoning': `You are a CLAT Logical Reasoning content creator crafting CHALLENGING critical thinking questions.

CRITICAL: CLAT Logical Reasoning (Section IV) consists ENTIRELY of critical thinking / reasoning passages — NOT puzzles, coding, blood relations, or scheduling. A full section has 4-5 passages (~450 words each) and 22-26 questions total (~20% of the paper).

Each passage should:
- Be ~450 words long (between 400-500 words)
- Present a nuanced argument, debate, reasoning chain, or analytical scenario
- Be drawn from areas like: philosophy of law, ethics, public policy debates, scientific reasoning, economic analysis, or everyday logical puzzles expressed as prose
- NOT contain coding patterns, blood relations, or mathematical arrangement puzzles

Questions test these CRITICAL THINKING skills (not puzzles):

1. **Strengthen/Weaken** — "Which of the following, if true, would most strengthen/weaken the argument?"
2. **Assumptions** — "Which of the following is an assumption made by the author?"
3. **Inferences / Conclusions** — "Which of the following can be most reasonably inferred from the passage?"
4. **Flaw in Reasoning** — "Which of the following is a flaw in the argument presented?"
5. **Parallel Reasoning** — "Which of the following arguments is most similar in structure to the one above?"
6. **Cause and Effect** — "Which of the following, if true, challenges the causal relationship suggested in the passage?"
7. **Principle Identification** — "Which of the following principles best justifies the conclusion drawn?"
8. **Analogies** — "The reasoning in the passage is most analogous to which of the following?"

🚫 FORBIDDEN: CRITICAL REASONING ONLY — DO NOT generate syllogism questions ("All A are B. Some B are C..."), coding-decoding, blood relations, seating arrangement, or any puzzle-type question. These are NOT in CLAT Logical Reasoning.

DIFFICULTY DISTRIBUTION: ~20% easy, ~50% medium, ~30% hard
⚠️ ANTI-CHEAT: Correct answer MUST NOT be a direct quote from passage. At least 3 options must be plausible. Questions must require genuine reasoning, not text scanning.

PASSAGE TOPICS (cover 5 different reasoning domains):
- Legal/philosophical arguments (nature of justice, rights vs duties, utilitarian vs deontological reasoning)
- Ethical dilemmas in public policy (privacy vs security, free speech vs hate speech)
- Scientific/methodological reasoning (inductive vs deductive, correlation vs causation, sample bias)
- Economic/social reasoning (cost-benefit analysis, trade-offs, incentive effects)
- Everyday reasoning (analogical arguments, slippery slopes, false dichotomies, appeals to authority)

Example passage structure (DO NOT copy, use as style guide):
"A recent government proposal suggests that mandatory CCTV installation in all public spaces will reduce crime rates. Proponents argue that visible surveillance deters potential offenders and helps law enforcement identify criminals more quickly. Opponents counter that surveillance infringes on privacy rights, that the correlation between CCTV and crime reduction is weak in many real-world studies, and that the money would be better spent on community policing..."

Return ONLY a valid JSON object with a "questions" key containing the array. Every question must have the 'passage' field filled.`,

  'Quantitative Techniques': `You are a CLAT Quantitative Techniques content creator. Generate questions for the CLAT 2027 exam pattern.

### EXAM GUIDELINES:
1. Format: 2-3 passage-based caselets (Data Interpretation)
2. Generate 10-14 total multiple-choice questions across the caselets (e.g., two caselets with 5 questions each + one caselet with 2-4 questions, or 3 caselets with 4-5 questions each)
3. Difficulty: Class 10-level arithmetic embedded in reading-heavy text (250-350 words per passage)
4. Each question must have exactly 4 options (A-D) with one correct answer

### CORE SYLLABUS TOPICS (distribute across caselets):
- Percentages, Fractions, Successive changes
- Ratios, Proportions, Mixtures
- Averages, Profit & Loss, Simple/Compound Interest
- Time, Speed, Distance / Time & Work
- Basic Mensuration or Data representation (Tables/Bar graphs described via text)

### CASELE T FORMAT:
Each caselet must have:
1. A dense passage (250-350 words) containing realistic numerical data — legal-economic scenarios, survey statistics, government scheme budgets, corporate case disputes, or population census data WITH a data table or chart described in the text
2. 4-5 questions based ENTIRELY on the passage data

Question style: Avoid direct calculation. Use analytical phrasings:
- "By what percentage does X exceed Y..."
- "If a legal dispute reduces the payout by 20%, what is the new ratio..."
- "What is the ratio of insured adults in Urban to Rural..."
- "By what percentage is X higher/lower than Y..."
- "If total grows by X% and shares remain same, how many additional..."
- Multi-step: "If X is reduced by Y% and the reduction is shifted equally into A and B..."

Return ONLY a valid JSON array. Every question must have the 'passage' field filled with the caselet data.
Include step-by-step numerical explanations in the 'explanation' field.`,
};

// ─── Validation ───

/** Normalise a question into our standard format, handling variations in AI output. */
function normaliseQuestion(q: any): GeneratedQuestion | null {
  if (!q || typeof q !== 'object') return null;

  // Question text
  const question_text = typeof q.question_text === 'string' && q.question_text.length >= 5
    ? q.question_text
    : (typeof q.question === 'string' ? q.question : null);
  if (!question_text) return null;

  // Passage
  const passage = typeof q.passage === 'string' ? q.passage
    : typeof q.context === 'string' ? q.context : null;

  // Options — handle both {A, B, C, D} and {1, 2, 3, 4} and arrays
  let options: Record<string, string> = {};
  if (q.options && typeof q.options === 'object') {
    const keys = Object.keys(q.options);
    const alphaKeys = ['A', 'B', 'C', 'D'];
    // Convert numeric keys to alpha
    if (keys.every((k) => /^[0-9]+$/.test(k))) {
      alphaKeys.forEach((letter, i) => {
        const val = q.options[String(i + 1)] || q.options[i];
        if (val) options[letter] = String(val);
      });
    } else {
      // Already alpha or some other keys
      alphaKeys.forEach((letter) => {
        const val = q.options[letter] !== undefined ? String(q.options[letter]) : null;
        if (val) options[letter] = val;
      });
    }
  } else if (Array.isArray(q.options)) {
    // Array format [optA, optB, optC, optD]
    ['A', 'B', 'C', 'D'].forEach((letter, i) => {
      if (q.options[i] !== undefined && q.options[i] !== null) {
        options[letter] = String(q.options[i]);
      }
    });
  }
  if (Object.keys(options).length < 2) return null;

  // Correct option — handle A, 1, "a", etc.
  let correct_option: string | null = null;
  let rawCorrect: any = q.correct_option !== undefined ? q.correct_option : q.answer;
  if (rawCorrect !== undefined && rawCorrect !== null) {
    const str = String(rawCorrect).toUpperCase().trim();
    if (['A', 'B', 'C', 'D'].includes(str)) {
      correct_option = str;
    } else if (/^[0-4]$/.test(str)) {
      correct_option = ['A', 'B', 'C', 'D'][parseInt(str, 10) - 1] || ['A', 'B', 'C', 'D'][parseInt(str, 10)] || 'A';
    }
  }
  if (!correct_option && Object.keys(options).length > 0) {
    correct_option = Object.keys(options)[0]; // fallback to first option
  }
  if (!correct_option) return null;

  // Explanation
  const explanation = typeof q.explanation === 'string' && q.explanation.length >= 5
    ? q.explanation
    : (typeof q.explanation_text === 'string' ? q.explanation_text
      : 'No explanation provided.');

  // Difficulty
  const difficulty = ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium';

  return {
    question_text,
    passage,
    options: options as { A: string; B: string; C: string; D: string },
    correct_option: correct_option as 'A' | 'B' | 'C' | 'D',
    explanation,
    difficulty: difficulty as 'easy' | 'medium' | 'hard',
  };
}

// ─── Quality Validator ───

/** List of shallow/forbidden question patterns that produce easy questions. */
const SHALLOW_PATTERNS = [
  /main idea (of|in) (the )?passage/i,
  /primary (focus|goal|theme|idea|purpose) (of|in) (the )?passage/i,
  /best summarizes (the )?passage/i,
  /best summarizes (the )?main/i,
  /what (is|was) (the )?(author'?s|passage'?s) main/i,
];

/**
 * Validate a question's quality.
 * Returns null if the question passes, or a string reason if it should be rejected.
 */
function validateQuality(q: GeneratedQuestion): string | null {
  // 1. Check for shallow/forbidden question patterns
  for (const pattern of SHALLOW_PATTERNS) {
    if (pattern.test(q.question_text)) {
      return `Shallow question pattern: ${q.question_text.slice(0, 60)}`;
    }
  }

  // 2. If there's a passage, check the question text isn't a direct copy from passage
  if (q.passage) {
    // Clean the question text for comparison (remove common prefixes)
    const qClean = q.question_text
      .replace(/^(which of the following|according to the passage|the passage suggests that|what does the passage\s+)\s*/i, '')
      .replace(/[?.,!;:]+$/, '')
      .trim()
      .toLowerCase();

    // Check if a substantial portion of the question text appears verbatim in the passage
    if (qClean.length > 30) {
      const passageLower = q.passage.toLowerCase();
      // Check first 30 chars
      if (passageLower.includes(qClean.slice(0, 40))) {
        return 'Question text is a direct copy from passage';
      }
    }

    // Check if the correct answer option text is a direct quote from the passage
    const correctOptText = q.options[q.correct_option]?.toLowerCase().trim() || '';
    if (correctOptText.length > 25 && q.passage.toLowerCase().includes(correctOptText)) {
      return 'Correct answer option is a direct quote from passage';
    }
  }

  // 3. Check that not all options are too similar (all starting with same text)
  const optValues = Object.values(q.options).map(v => v.toLowerCase().trim());
  const sharedPrefix = optValues[0]?.slice(0, 15) || '';
  const allSamePrefix = optValues.every(v => v && v.startsWith(sharedPrefix));
  if (allSamePrefix && optValues.length >= 3 && sharedPrefix.length > 5) {
    return 'All options share the same prefix — likely poor options';
  }

  return null; // Passes validation
}

function parseJSONResponse(raw: string): any[] {
  try {
    const parsed = JSON.parse(raw);
    // Handle both raw arrays and {"questions": [...]} wrappers
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.questions)) return parsed.questions;
    if (parsed && Array.isArray(parsed.data)) return parsed.data;
    if (parsed && Array.isArray(parsed.items)) return parsed.items;
    throw new Error('Response is not an array or does not contain a questions array');
  } catch {
    // Try extracting JSON array from markdown or text
    const match = raw.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
    // Try extracting JSON object
    const objMatch = raw.match(/\{[\s\S]*\}/);
    if (objMatch) {
      const parsed = JSON.parse(objMatch[0]);
      if (Array.isArray(parsed.questions)) return parsed.questions;
      if (Array.isArray(parsed.data)) return parsed.data;
    }
    throw new Error('Could not parse JSON from response');
  }
}

// ─── DeepSeek API Call (Primary) ───

async function callDeepSeek(
  systemPrompt: string,
  userPrompt: string
): Promise<GeneratedQuestion[]> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY not configured');

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 16384,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`DeepSeek API error ${response.status}: ${text}`);
  }

  const data = await response.json();
  const raw = data?.choices?.[0]?.message?.content;

  if (!raw) throw new Error('DeepSeek returned empty response');

  const questions = parseJSONResponse(raw);
  if (!Array.isArray(questions)) throw new Error('DeepSeek response is not an array');

  const normalised = questions.map(normaliseQuestion).filter((q): q is GeneratedQuestion => q !== null);

  // Apply quality validation — log rejections for debugging
  const validQuestions = normalised.filter(q => {
    const rejection = validateQuality(q);
    if (rejection) {
      console.warn(`[Quality Reject] ${rejection}`);
      return false;
    }
    return true;
  });

  if (validQuestions.length === 0) {
    throw new Error('All generated questions failed quality validation');
  }

  return validQuestions.slice(0, 35);
}

// ─── Gemini Fallback ───

async function callGemini(
  systemPrompt: string,
  userPrompt: string
): Promise<GeneratedQuestion[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 8192, responseMimeType: 'application/json' },
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${text}`);
  }

  const data = await response.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error('Gemini returned empty response');

  const questions = parseJSONResponse(raw);
  if (!Array.isArray(questions)) throw new Error('Gemini response is not an array');

  const normalised = questions.map(normaliseQuestion).filter((q): q is GeneratedQuestion => q !== null);

  // Apply quality validation — log rejections for debugging
  const validQuestions = normalised.filter(q => {
    const rejection = validateQuality(q);
    if (rejection) {
      console.warn(`[Quality Reject] ${rejection}`);
      return false;
    }
    return true;
  });

  if (validQuestions.length === 0) {
    throw new Error('All generated questions failed quality validation');
  }

  return validQuestions.slice(0, 35);
}

// ─── Orchestrator ───

export interface GenerationResult {
  section: SectionName;
  questions: GeneratedQuestion[];
  success: boolean;
  aiService?: 'deepseek' | 'gemini';
  error?: string;
}

/**
 * Generate questions for a single section.
 * Tries DeepSeek first, falls back to Gemini if configured.
 */
export async function generateSection(
  section: SectionName,
  maxQuestions?: number
): Promise<GenerationResult> {
  const sectionTitle: Record<SectionName, string> = {
    'English': 'English Language',
    'Current Affairs': 'Current Affairs & GK',
    'Legal Reasoning': 'Legal Reasoning',
    'Logical Reasoning': 'Logical Reasoning',
    'Quantitative Techniques': 'Quantitative Techniques',
  };

  const target = PER_SECTION_TARGET[section];
  const batchSize = Math.min(maxQuestions ?? 12, 12);
  const userPrompt = `Generate exactly ${batchSize} CLAT-style multiple-choice questions for the "${sectionTitle[section]}" section. These will be added to a larger test that ultimately has ${target.totalQ} questions across ${target.passages} passages. Follow the section format described earlier. Return a JSON object with a key "questions" containing the array of question objects. Each question must have: question_text, passage, options (A-D), correct_option, explanation, difficulty.`;

  // Try DeepSeek first
  if (process.env.DEEPSEEK_API_KEY) {
    try {
      const questions = await callDeepSeek(SYSTEM_PROMPTS[section], userPrompt);
      return {
        section,
        questions,
        success: questions.length > 0,
        aiService: 'deepseek',
        error: questions.length === 0 ? 'No valid questions generated' : undefined,
      };
    } catch (err: any) {
      // DeepSeek failed — fall through to Gemini if available
      if (!process.env.GEMINI_API_KEY) {
        return { section, questions: [], success: false, error: err.message };
      }
    }
  }

  // Fallback to Gemini
  if (process.env.GEMINI_API_KEY) {
    try {
      const questions = await callGemini(SYSTEM_PROMPTS[section], userPrompt);
      return {
        section,
        questions,
        success: questions.length > 0,
        aiService: 'gemini',
        error: questions.length === 0 ? 'No valid questions generated' : undefined,
      };
    } catch (err: any) {
      return { section, questions: [], success: false, error: err.message };
    }
  }

  return {
    section,
    questions: [],
    success: false,
    error: 'No AI API key configured. Set DEEPSEEK_API_KEY or GEMINI_API_KEY.',
  };
}

/**
 * Generate questions for all 5 CLAT sections in parallel.
 */
export async function generateFullTest(title?: string): Promise<{
  results: GenerationResult[];
  allSuccess: boolean;
}> {
  const sections: SectionName[] = [
    'English',
    'Current Affairs',
    'Legal Reasoning',
    'Logical Reasoning',
    'Quantitative Techniques',
  ];

  const results = await Promise.all(sections.map((s) => generateSection(s)));

  return {
    results,
    allSuccess: results.every((r) => r.success),
  };
}
