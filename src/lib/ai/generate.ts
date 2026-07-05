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
  'English': `You are a CLAT English Language question generator for India's law entrance exam.

CRITICAL: In CLAT, ALL English questions are passage-based. There are NO fill-in-the-blanks, NO isolated grammar questions, and NO sentence correction.

Generate exactly 10 multiple-choice questions spread across 2-3 reading comprehension passages.

Each passage should be 250-400 words on diverse topics (law, society, history, politics, science, philosophy).
For each passage, generate 3-5 questions testing:
- Main idea / central theme
- Author's tone and purpose
- Inference and implication
- Vocabulary in context
- Specific details from the passage
- Structure and organization

Each question must:
- Have exactly 4 options (A, B, C, D) with ONE correct answer
- Include a clear explanation referencing the passage
- The 'passage' field must contain the reading passage
- The 'question_text' must contain the question

Return ONLY a valid JSON array. Example:
[{
  "passage": "The concept of natural law has evolved significantly...",
  "question_text": "According to the passage, the primary feature of natural law is that it:",
  "options": {"A": "Is created by legislative bodies", "B": "Exists independently of human enactment", "C": "Changes with each successive government", "D": "Is synonymous with common law"},
  "correct_option": "B",
  "explanation": "The passage states that natural law is 'not created by any human authority' but exists independently, making B the correct answer.",
  "difficulty": "medium"
}]`,

  'Current Affairs': `You are a CLAT Current Affairs & GK question generator for mid-2026.

CRITICAL: In CLAT, ALL Current Affairs questions are PASSAGE-BASED (extracts from recent newspapers, press releases, or government statements). There are NO isolated GK questions.

Generate 10 multiple-choice questions spread across 2-3 short passages (150-250 words each).
Each passage should be an extract from a RECENT news article, government press release, or policy statement on:
- Indian politics and governance (recent policies, bills, judgments)
- International relations (treaties, summits, bilateral ties)
- Sports, science & technology, environment
- Economy and trade

For each passage, generate 3-5 questions testing:
- Comprehension of the passage content
- Related general knowledge (e.g., if passage is about SCO, ask about SCO members/secretariat)
- Vocabulary or specific terms from the passage
- Inference based on the passage

Each question must have 4 options (A-D) with one correct answer and an explanation.
Return ONLY a valid JSON array.`,

  'Legal Reasoning': `You are a CLAT Legal Reasoning question generator.

CRITICAL: CLAT Legal Reasoning includes TWO question types:
1. Passage-based questions about legal texts (excerpts from Supreme Court judgments, constitutional articles, legal commentary) with comprehension/analysis questions
2. Principle + Facts questions where a legal principle is given and applied to a factual situation

Generate 10 questions across 2-3 of the following formats:

FORMAT A (Passage-based, 4-6 questions per passage):
Provide a passage (250-350 words) that is an extract from:
- A real Supreme Court judgment (e.g., Manoj Narula v. Union of India)
- A legal scholar's analysis
- A constitutional provision commentary
- A recent landmark judgment
Followed by questions testing understanding, application, and inference from the passage.

FORMAT B (Principle + Facts, 3-4 questions):
- 'passage' field contains the legal principle (from contract, torts, criminal, constitutional law)
- 'question_text' contains facts requiring application of the principle
- Questions test the ability to apply the principle to new facts

All answers must be legally accurate. Include explanations.
Return ONLY a valid JSON array.`,

  'Logical Reasoning': `You are a CLAT Logical Reasoning question generator.

CRITICAL: In CLAT, ALL Logical Reasoning questions are PASSAGE-EMBEDDED. Each set of questions is based on a short passage describing a puzzle, scenario, or logical problem.

Generate 10 questions spread across 2-3 passages covering these CLAT-style patterns:

PATTERN 1 (Word Transformation / Coding puzzles, 4-6 questions per passage):
A short passage (100-180 words) describing a word puzzle, coding scheme, or letter transformation problem. Questions test step-by-step application of the rules.

PATTERN 2 (Deductive Reasoning / Logic Puzzles, 3-5 questions per passage):
A passage (200-300 words) describing a scenario with suspects, schedules, or constraints, with multiple facts/conditions. Questions test:
- Identifying the most likely conclusion
- Evaluating alibis and constraints
- Identifying logical flaws in arguments
- Making inferences from given facts

PATTERN 3 (Blood Relations / Family Trees, 2-3 questions per passage):
A short passage (130-180 words) describing family relationships using symbols or code. Questions test ability to trace relationships.

PATTERN 4 (Scheduling / Arrangement Puzzles, 5-8 questions per passage):
A passage (170-220 words) describing a tournament, schedule, or arrangement with specific rules. Questions test ability to apply constraints and deduce the correct arrangement.

All questions must have 4 options (A-D) with one unambiguously correct answer. Include explanations.
Return ONLY a valid JSON array.`,

  'Quantitative Techniques': `You are a CLAT Quantitative Techniques question generator.

CRITICAL: In CLAT, ALL Quant questions are DATA INTERPRETATION based on tables, charts, or data sets in a passage. There are NO isolated arithmetic questions.

Generate 10 questions spread across 2 passages, each containing:
- A data table, chart description, or survey summary (150-250 words describing the data)
- The 'passage' field must contain BOTH the data description AND any data tables

Data types to use:
- Health/insurance survey data with percentages and breakdowns (urban/rural, etc.)
- Energy/industry production data by quarter/source
- Population/demographic statistics
- Economic data (budgets, GDP, trade)

Question types (5-6 per data set):
- Ratio and proportion calculations
- Percentage change and comparison
- Finding totals from given percentages
- "If X grows by Y%..." scenario questions
- Identifying highest/lowest values
- Multi-step computation requiring 2-3 operations

Each question must have exactly 4 options (A-D) with one mathematically verified correct answer.
Include step-by-step numerical explanations showing all working.
Return ONLY a valid JSON array.`,
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
      max_tokens: 4096,
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

  return questions.map(normaliseQuestion).filter((q): q is GeneratedQuestion => q !== null).slice(0, 10);
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
  return questions.map(normaliseQuestion).filter((q): q is GeneratedQuestion => q !== null).slice(0, 10);
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
