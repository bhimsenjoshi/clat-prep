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

Generate 10 multiple-choice questions testing:
- Reading comprehension (include a short passage for 2-3 questions)
- Grammar and vocabulary
- Verbal analogies
- Sentence correction / improvement

Each question must have exactly 4 options (A, B, C, D) with one correct answer.
Include an explanation for the correct answer.
For reading comprehension questions, put the passage in a "passage" field.

Return ONLY a JSON array of question objects. Example format:
[{
  "question_text": "...",
  "passage": null or "...",
  "options": {"A": "...", "B": "...", "C": "...", "D": "..."},
  "correct_option": "A",
  "explanation": "...",
  "difficulty": "medium"
}]`,

  'Current Affairs': `You are a CLAT Current Affairs / GK question generator for mid-2026.

Generate 10 multiple-choice questions testing knowledge of:
- Major national (India) and international events (2025-2026)
- Government schemes and policies
- Appointments, awards, honors
- Sports, science & technology news
- Important legal judgments or constitutional developments

Each question must have exactly 4 options (A, B, C, D) with one correct answer.
Include a brief explanation. All answers must be factually accurate.
Return ONLY a JSON array of question objects.`,

  'Legal Reasoning': `You are a CLAT Legal Reasoning question generator.

Generate 10 questions following the CLAT "Principle + Facts" format:
- State a legal principle (from contract law, torts, criminal law, constitutional law, etc.)
- Present a factual situation
- Ask the student to select the correct application

The 'passage' field should contain the principle.
The 'question_text' should contain the facts and the question.
Each question must have exactly 4 options (A, B, C, D) with one correct answer.
Include an explanation of why the correct answer follows from the principle.

Principles should be simplified but legally accurate for the CLAT level.
Return ONLY a JSON array of question objects.`,

  'Logical Reasoning': `You are a CLAT Logical Reasoning question generator.

Generate 10 questions covering:
- Syllogisms and deductive reasoning
- Analogies and classification
- Blood relations and family trees
- Directions and distance
- Coding-decoding
- Logical sequences
- Argument analysis (strengthen/weaken/assumption/flaw)

Each question must have exactly 4 options (A, B, C, D) with one correct answer.
The correct answer must be unambiguously correct.
Include explanations. Make sure all puzzles have unique answers.
Return ONLY a JSON array of question objects.`,

  'Quantitative Techniques': `You are a CLAT Quantitative Techniques question generator.

Generate 10 questions covering:
- Arithmetic (percentages, profit-loss, ratios, averages, time-speed-distance)
- Data interpretation (include data in the 'passage' field)
- Basic algebra and number systems
- Probability and permutations (basic level)

Each question must have exactly 4 options (A, B, C, D) with one correct answer.
The correct answer must be mathematically verified.
Include step-by-step explanations.
Return ONLY a JSON array of question objects.`,
};

// ─── Validation ───

function validateQuestion(q: any): boolean {
  if (!q || typeof q !== 'object') return false;
  if (typeof q.question_text !== 'string' || q.question_text.length < 10) return false;
  if (!q.options || typeof q.options !== 'object') return false;
  if (!['A', 'B', 'C', 'D'].every((k) => typeof q.options[k] === 'string' && q.options[k].length > 0)) return false;
  if (!['A', 'B', 'C', 'D'].includes(q.correct_option)) return false;
  if (typeof q.explanation !== 'string' || q.explanation.length < 5) return false;
  return true;
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

  return questions.filter(validateQuestion).slice(0, 10);
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
  return questions.filter(validateQuestion).slice(0, 10);
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
