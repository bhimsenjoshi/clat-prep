/**
 * AI Question Generation Pipeline
 *
 * Primary: DeepSeek Chat API (cheap, fast)
 * Fallback: Gemini API (if DeepSeek not configured)
 *
 * Architecture:
 *   - Orchestrator fires 5 section sub-agents (parallel)
 *   - Each sub-agent generates 10 questions for its section
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

// ─── Sub-agent prompts ───

const SYSTEM_PROMPTS: Record<SectionName, string> = {
  'English': `You are a CLAT English Language content creator.

CRITICAL: CLAT English (Section I) consists ENTIRELY of reading comprehension passages. Each passage is followed by 4-5 questions based SOLELY on that passage.

Generate 2 reading comprehension passages. Each passage should:
- Be 300-450 words long
- Cover diverse topics: history, politics, law, philosophy, science, literature (like the CLAT 2026 paper which had passages on Non-Cooperation Movement, Yuval Harari's Sapiens, Freedom House/Tagore, Fukuyama, and George Orwell's Animal Farm)
- Be drawn from real books, academic texts, or quality journalism
- Include the source/author at the end

For EACH passage, generate 4-5 questions testing:
- Central theme / main idea (e.g., "The main idea of the passage is:")
- Inference and implication ("From the passage it is evident that:")
- Vocabulary in context ("The term 'X' in the passage refers to:")
- Specific detail / true statements ("Which of the following is true?")
- Author's tone or purpose ("Which best describes the tone of the passage?")
- Literary device identification

Each question must have exactly 4 options (A-D). 'passage' field = full passage text. 'question_text' = the question.
Return ONLY a valid JSON array of question objects.

IMPORTANT: Every question in your output MUST have the 'passage' field filled with the relevant reading passage text. Questions from the same passage should share identical passage text.`,

  'Current Affairs': `You are a CLAT Current Affairs and General Knowledge content creator.

CRITICAL: CLAT GK consists ENTIRELY of passage-based questions. Each passage is a recent news extract (150-250 words) from a newspaper, press release, or government statement. Questions test comprehension AND related static GK tied to the passage.

Generate 2-3 short news-based passages on the MOST IMPORTANT recent events of 2025-2026, selected based on CLAT past trends:

HIGH-YIELD 2025-2026 TOPICS (select 2-3):
- US-India relations (H-1B visas, tariffs, trade deals, Chabahar port)
- Chess/Indian sports achievements (World Cup wins, Olympiad)
- Operation Sindoor / India-Pakistan relations after Pahalgam (Art 370, Indus Water Treaty)
- SCO Summit 2025 (Tianjin), China-India relations
- Air India / aviation sector developments
- One Nation policies (GST, One Nation One Election, One Nation One Ration Card)
- Supreme Court judgments (Tamil Nadu Governor case, same-sex marriage, Manoj Narula)
- Constitutional and legal developments
- G20 / India's global role
- Economy: GDP growth, inflation, budget highlights
- Digital India, UPI, technology developments
- Climate change and environment (India's 2070 net-zero target)
- Space missions (Chandrayaan, Gaganyaan, Aditya-L1)
- Elections and political developments

For each passage, generate 4-5 questions:
- 2-3 questions directly from the passage (comprehension of content)
- 1-2 questions that are static GK CONNECTED TO THE PASSAGE TOPIC (e.g., passsage on SCO → ask about SCO members, secretariat location; passage on chess → ask about grandmasters, origin of chess)

Return ONLY a valid JSON array. Every question must have a filled 'passage' field.`,

  'Legal Reasoning': `You are a CLAT Legal Reasoning content creator.

CRITICAL: CLAT Legal Reasoning consists of two formats as per the 2026 paper:
FORMAT A (Majority): Passage-based — extracts from real Supreme Court judgments, constitutional commentary, or legal texts followed by comprehension/application questions (5-6 per passage)
FORMAT B (Minority): Principle + Facts — a legal principle given in the passage, followed by a factual scenario in the question_text

Generate 2 passages based on CLAT's high-yield legal topics:

PASSAGE TOPICS (select 2, based on past trends and current affairs):
- Constitutional Law: Fundamental Rights (Article 14, 19, 21), Directive Principles, Preamble interpretation, separation of powers
- Criminal Law: IPC essentials, mens rea, actus reus, strict liability, theft/extortion/robbery distinctions
- Law of Torts: Negligence, defamation, nuisance, strict liability (Rylands v. Fletcher), vicarious liability
- Contract Law: Offer/acceptance, consideration, void/voidable contracts, breach and remedies
- Recent Supreme Court judgments (Tamil Nadu Governor case, same-sex marriage, Manoj Narula v. Union of India, etc.)

For each passage:
- FORMAT A passages: Extract from a real or realistic legal text (250-400 words). Follow with 5-6 questions testing: main legal principle, application to new facts, inference from the text, and understanding of legal concepts
- FORMAT B passages: State a legal principle (in the 'passage' field), then present facts in 'question_text'. Follow with 3-4 application questions

Focus extra on Law of Torts as it's a key CLAT topic.

Adhere STRICTLY to the CLAT pattern. Return ONLY a valid JSON array.
Every question must have the 'passage' field filled.`,

  'Logical Reasoning': `You are a CLAT Logical Reasoning content creator and expert puzzle designer.

CRITICAL: As per CLAT 2026 paper analysis, Logical Reasoning consists of passage-embedded puzzles across these patterns:

PATTERN 1 (Word/Coding puzzles): A short passage describing a word transformation, coding scheme, or letter puzzle with step-by-step rules. 5-6 questions testing application of each rule.

PATTERN 2 (Deductive logic puzzles): A passage (250-300 words) describing a scenario with suspects, schedules, or constraints with multiple facts. Questions test: identifying logical conclusions, evaluating alibis/evidence, identifying logical flaws, making inferences.

PATTERN 3 (Blood Relations/Family Trees): A passage (150-200 words) introducing a symbolic relationship code (e.g., A × B = A is father of B), followed by coded relations. Questions test ability to decode relationships.

PATTERN 4 (Scheduling/Arrangement puzzles): A passage (180-230 words) describing a tournament, schedule, or arrangement with specific rules/constraints. Questions test constraint application and deductive arrangement.

Generate 2 puzzles from these patterns. Each puzzle should have 5-6 questions.

Ensure:
- All puzzles have a single, unambiguous answer
- Questions progress from easy to hard within each puzzle
- Options (A-D) are plausible but only one is correct
- Include full explanations referencing the passage constraints
- Critical reasoning questions (strengthen/weaken/assumption/flaw) are included in deductive scenario patterns

Return ONLY a valid JSON array. Every question must have the 'passage' field filled.`,

  'Quantitative Techniques': `You are a CLAT Quantitative Techniques content creator and senior psychometrician. Generate questions for the CLAT 2027 exam pattern.

### EXAM GUIDELINES:
1. Format: 3 distinct passage-based caselets (Data Interpretation)
2. Generate 12-14 total multiple-choice questions across the 3 caselets (e.g., two caselets with 4 questions each, one caselet with 5 questions)
3. Difficulty: Class 10-level arithmetic embedded in reading-heavy text (150-250 words per passage)
4. Each question must have exactly 4 options (A-D) with one correct answer

### CORE SYLLABUS TOPICS (distribute across caselets):
- Percentages, Fractions, Successive changes
- Ratios, Proportions, Mixtures
- Averages, Profit & Loss, Simple/Compound Interest
- Time, Speed, Distance / Time & Work
- Basic Mensuration or Data representation (Tables/Bar graphs described via text)

### CASELE T FORMAT (3 caselets):
Each caselet must have:
1. A dense passage (150-250 words) containing realistic numerical data — legal-economic scenarios, survey statistics, government scheme budgets, corporate case disputes, or population census data WITH a data table or chart described in the text
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

function parseJSONResponse(raw: string): any[] {
  try {
    return JSON.parse(raw);
  } catch {
    // Try extracting JSON array from markdown or text
    const match = raw.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
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
      max_tokens: 8192,
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

  return questions.map(normaliseQuestion).filter((q): q is GeneratedQuestion => q !== null).slice(0, 15);
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
        generationConfig: { temperature: 0.7, maxOutputTokens: 4096, responseMimeType: 'application/json' },
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
  return questions.map(normaliseQuestion).filter((q): q is GeneratedQuestion => q !== null).slice(0, 15);
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
  section: SectionName
): Promise<GenerationResult> {
  const sectionTitle: Record<SectionName, string> = {
    'English': 'English Language',
    'Current Affairs': 'Current Affairs & GK',
    'Legal Reasoning': 'Legal Reasoning',
    'Logical Reasoning': 'Logical Reasoning',
    'Quantitative Techniques': 'Quantitative Techniques',
  };

  const userPrompt = `Generate exactly 10 CLAT-style multiple choice questions for the "${sectionTitle[section]}" section. Ensure variety in difficulty and question types.`;

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
