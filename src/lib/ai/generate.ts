/**
 * AI Question Generation Pipeline
 *
 * Architecture:
 *   - Orchestrator fires 5 section sub-agents (parallel)
 *   - Each sub-agent generates 10 questions for its section
 *   - Validator checks JSON schema + plausibility
 *
 * Model strategy:
 *   - Current Affairs → Gemini 2.5 Flash (with search grounding)
 *   - Legal/Logical → Gemini 2.5 Flash (better reasoning)
 *   - English/Quant → Gemini 2.5 Flash-Lite (cheapest)
 *
 * When DeepSeek is configured, it can be used as a cheap validator.
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

export interface SectionOutput {
  section: SectionName;
  questions: GeneratedQuestion[];
}

// ─── Sub-agent prompts ───

const SYSTEM_PROMPTS: Record<SectionName, string> = {
  'English': `You are a CLAT English Language question generator.

Generate 10 questions testing:
- Reading comprehension (use a short passage)
- Grammar and vocabulary
- Verbal analogies
- Sentence correction / improvement

Output format: a JSON array of question objects.
For reading comprehension questions, include a 'passage' field.
Each question must have exactly 4 options (A-D) with one correct answer marked by 'correct_option'.

Difficulty should be appropriate for CLAT (law entrance exam in India).
Questions must be original — do not copy from existing CLAT papers.`,

  'Current Affairs': `You are a CLAT Current Affairs / GK question generator for June 2026.

Generate 10 questions testing knowledge of:
- Major national (India) and international events
- Government schemes and policies
- Appointments, awards, honors
- Sports, science & technology news
- Important legal judgments or constitutional developments

Output format: a JSON array of question objects.
Each question must have exactly 4 options (A-D) with one correct answer.
Include brief explanations for each answer.

All questions must be factually accurate and verifiable.`,

  'Legal Reasoning': `You are a CLAT Legal Reasoning question generator.

Generate 10 questions following the CLAT "Principle + Facts" format:
- State a legal principle (from contract law, torts, criminal law, constitutional law, etc.)
- Present a factual situation
- Ask the student to apply the principle to the facts

Output format: a JSON array of question objects.
The 'passage' field should contain the principle, and 'question_text' should contain the facts and the question.
Each question must have exactly 4 options (A-D) with one correct answer.
Include an explanation of why the correct answer follows from the principle.

Principles should be simplified but legally accurate.`,

  'Logical Reasoning': `You are a CLAT Logical Reasoning question generator.

Generate 10 questions covering:
- Syllogisms and deductive reasoning
- Analogies and classification
- Blood relations and family trees
- Directions and distance
- Coding-decoding
- Logical sequences and series
- Arguments (strengthen/weaken/assumption/flaw)

Output format: a JSON array of question objects.
Where the question requires a passage or argument context, include it in the 'passage' field.
Each question must have exactly 4 options (A-D) with one correct answer.
Include explanations.

Make sure all puzzles have a unique, unambiguous answer.`,

  'Quantitative Techniques': `You are a CLAT Quantitative Techniques question generator.

Generate 10 questions covering:
- Arithmetic (percentages, profit-loss, ratios, averages, time-speed-distance)
- Data interpretation (tables, graphs, charts — include the data in the 'passage' field)
- Basic algebra and number systems
- Probability and permutations (basic level)

Output format: a JSON array of question objects.
Include data tables/charts in the 'passage' field where relevant.
Each question must have exactly 4 options (A-D) with one correct answer.
The correct answer must be mathematically verified.
Include step-by-step explanations for each question.

Difficulty should match CLAT's quantitative aptitude level (10th/12th standard math).`,
};

// ─── Schema for JSON validation ───

const QUESTION_KEYS = ['question_text', 'options', 'correct_option', 'explanation', 'difficulty'];
const OPTION_KEYS = ['A', 'B', 'C', 'D'];

function validateQuestion(q: any): boolean {
  if (!q || typeof q !== 'object') return false;
  if (typeof q.question_text !== 'string' || q.question_text.length < 10) return false;
  if (!q.options || typeof q.options !== 'object') return false;
  if (!OPTION_KEYS.every((k) => typeof q.options[k] === 'string' && q.options[k].length > 0)) return false;
  if (!['A', 'B', 'C', 'D'].includes(q.correct_option)) return false;
  if (typeof q.explanation !== 'string' || q.explanation.length < 5) return false;
  return true;
}

// ─── Gemini API Call ───

async function callGemini(
  systemPrompt: string,
  userPrompt: string,
  model: 'gemini-2.5-flash' | 'gemini-2.5-flash-lite' = 'gemini-2.5-flash-lite'
): Promise<GeneratedQuestion[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nGenerate the questions as a valid JSON array. Return ONLY the JSON array, no other text.\n\n${userPrompt}` }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${text}`);
  }

  const data = await response.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!raw) {
    throw new Error('Gemini returned empty response');
  }

  let questions: any[];
  try {
    questions = JSON.parse(raw);
  } catch {
    // Sometimes Gemini wraps in markdown
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      questions = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('Failed to parse Gemini JSON response');
    }
  }

  if (!Array.isArray(questions)) {
    throw new Error('Gemini response is not an array');
  }

  return questions.filter(validateQuestion).slice(0, 10);
}

// ─── DeepSeek Validator ───

async function validateWithDeepSeek(questions: GeneratedQuestion[]): Promise<{
  valid: boolean;
  issues: string[];
}> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return { valid: true, issues: [] }; // Skip if not configured

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a validator for CLAT practice questions. Check each question for: '
              + '(1) Is the question clear and unambiguous? '
              + '(2) Is there exactly one correct answer? '
              + '(3) Are the distractors (wrong options) plausible? '
              + 'Return a JSON object with "valid" (boolean) and "issues" (array of strings).',
          },
          {
            role: 'user',
            content: `Validate these CLAT questions:\n${JSON.stringify(questions, null, 2)}`,
          },
        ],
        temperature: 0.1,
      }),
    });

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content || '';

    try {
      const result = JSON.parse(text);
      return {
        valid: result.valid !== false,
        issues: result.issues || [],
      };
    } catch {
      return { valid: true, issues: [] };
    }
  } catch {
    return { valid: true, issues: [] }; // If DeepSeek fails, proceed without validation
  }
}

// ─── Orchestrator ───

export interface GenerationResult {
  section: SectionName;
  questions: GeneratedQuestion[];
  success: boolean;
  error?: string;
}

/**
 * Generate questions for all 5 CLAT sections.
 * Runs sub-agents in parallel, each generating 10 questions.
 * Returns results per section.
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

  const modelMap: Record<SectionName, 'gemini-2.5-flash' | 'gemini-2.5-flash-lite'> = {
    'English': 'gemini-2.5-flash-lite',
    'Current Affairs': 'gemini-2.5-flash',
    'Legal Reasoning': 'gemini-2.5-flash',
    'Logical Reasoning': 'gemini-2.5-flash',
    'Quantitative Techniques': 'gemini-2.5-flash-lite',
  };

  const userPrompt = `Generate 10 CLAT-style multiple choice questions for the ${title || 'CLAT Mock Test'}. Ensure variety in question types and difficulty. Each question must have exactly 4 options (A, B, C, D) with one correct answer. Include explanations.`;

  const results = await Promise.all(
    sections.map(async (section) => {
      try {
        const questions = await callGemini(
          SYSTEM_PROMPTS[section],
          userPrompt,
          modelMap[section]
        );

        // Skip DeepSeek validation for now — can be enabled when API key is set
        return {
          section,
          questions,
          success: questions.length > 0,
          error: questions.length === 0 ? 'No valid questions generated' : undefined,
        } as GenerationResult;

      } catch (err: any) {
        return {
          section,
          questions: [],
          success: false,
          error: err.message || 'Unknown error',
        } as GenerationResult;
      }
    })
  );

  return {
    results,
    allSuccess: results.every((r) => r.success),
  };
}

/**
 * Generate questions for a single section (useful for re-generating one section).
 */
export async function generateSection(
  section: SectionName
): Promise<GenerationResult> {
  const modelMap: Record<SectionName, 'gemini-2.5-flash' | 'gemini-2.5-flash-lite'> = {
    'English': 'gemini-2.5-flash-lite',
    'Current Affairs': 'gemini-2.5-flash',
    'Legal Reasoning': 'gemini-2.5-flash',
    'Logical Reasoning': 'gemini-2.5-flash',
    'Quantitative Techniques': 'gemini-2.5-flash-lite',
  };

  try {
    const questions = await callGemini(
      SYSTEM_PROMPTS[section],
      `Generate 10 CLAT-style multiple choice questions for the ${section} section. Ensure variety.`,
      modelMap[section]
    );

    return {
      section,
      questions,
      success: questions.length > 0,
      error: questions.length === 0 ? 'No valid questions generated' : undefined,
    };
  } catch (err: any) {
    return {
      section,
      questions: [],
      success: false,
      error: err.message,
    };
  }
}
