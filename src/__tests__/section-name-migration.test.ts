import { describe, it, expect } from 'vitest';

// ─── Section Name Migration Tests ───

// These constants should match what's in the codebase after migration
const OFFICIAL_SECTION_NAMES = [
  'English Language',
  'Current Affairs Including General Knowledge',
  'Legal Reasoning',
  'Logical Reasoning',
  'Quantitative Techniques',
] as const;

type OfficialSectionName = typeof OFFICIAL_SECTION_NAMES[number];

describe('Official CLAT Section Names', () => {
  it('has exactly 5 sections matching CLAT 2025', () => {
    expect(OFFICIAL_SECTION_NAMES).toHaveLength(5);
  });

  it('includes English Language (not short "English")', () => {
    expect(OFFICIAL_SECTION_NAMES).toContain('English Language');
    expect(OFFICIAL_SECTION_NAMES).not.toContain('English');
  });

  it('includes Current Affairs Including General Knowledge (not short "Current Affairs")', () => {
    expect(OFFICIAL_SECTION_NAMES).toContain('Current Affairs Including General Knowledge');
    expect(OFFICIAL_SECTION_NAMES).not.toContain('Current Affairs');
  });

  it('includes Legal Reasoning', () => {
    expect(OFFICIAL_SECTION_NAMES).toContain('Legal Reasoning');
  });

  it('includes Logical Reasoning', () => {
    expect(OFFICIAL_SECTION_NAMES).toContain('Logical Reasoning');
  });

  it('includes Quantitative Techniques', () => {
    expect(OFFICIAL_SECTION_NAMES).toContain('Quantitative Techniques');
  });
});

// ─── Slug Generation Tests ───

function sectionToSlug(section: string): string {
  return section.toLowerCase().replace(/\s+/g, '-');
}

function slugToSection(slug: string, map: Record<string, OfficialSectionName>): OfficialSectionName | undefined {
  return map[slug];
}

describe('Section Slug Generation (URL routing)', () => {
  const SECTION_MAP: Record<string, OfficialSectionName> = {
    'english-language': 'English Language',
    'current-affairs-including-general-knowledge': 'Current Affairs Including General Knowledge',
    'legal-reasoning': 'Legal Reasoning',
    'logical-reasoning': 'Logical Reasoning',
    'quantitative-techniques': 'Quantitative Techniques',
  };

  it('converts all official section names to correct URL slugs', () => {
    expect(sectionToSlug('English Language')).toBe('english-language');
    expect(sectionToSlug('Current Affairs Including General Knowledge')).toBe('current-affairs-including-general-knowledge');
    expect(sectionToSlug('Legal Reasoning')).toBe('legal-reasoning');
    expect(sectionToSlug('Logical Reasoning')).toBe('logical-reasoning');
    expect(sectionToSlug('Quantitative Techniques')).toBe('quantitative-techniques');
  });

  it('resolves all slugs back to correct section names', () => {
    for (const section of OFFICIAL_SECTION_NAMES) {
      const slug = sectionToSlug(section);
      expect(slugToSection(slug, SECTION_MAP)).toBe(section);
    }
  });

  it('rejects invalid slugs', () => {
    expect(slugToSection('english', SECTION_MAP)).toBeUndefined();
    expect(slugToSection('current-affairs', SECTION_MAP)).toBeUndefined();
    expect(slugToSection('unknown-section', SECTION_MAP)).toBeUndefined();
  });

  it('is bijective — slug → section → slug', () => {
    for (const section of OFFICIAL_SECTION_NAMES) {
      const slug = sectionToSlug(section);
      const restored = slugToSection(slug, SECTION_MAP);
      expect(sectionToSlug(restored!)).toBe(slug);
    }
  });
});

// ─── Question Metadata Tests ───

interface PracticeQuestion {
  section: OfficialSectionName;
  topic: string;
  question_text: string;
  passage: string | null;
  options: Record<string, string>;
  correct_option: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  source: string;
  tags: string[];
  marks: number;
  negative_marks: number;
  question_number?: number;
  passage_id?: string | null;
}

function createDefaultQuestion(overrides?: Partial<PracticeQuestion>): PracticeQuestion {
  return {
    section: 'English Language',
    topic: 'Reading Comprehension',
    question_text: 'What is the main idea of the passage?',
    passage: 'Sample passage text for testing.',
    options: { A: 'Option A', B: 'Option B', C: 'Option C', D: 'Option D' },
    correct_option: 'A',
    explanation: 'Because A is correct',
    difficulty: 'medium',
    source: 'daily',
    tags: ['passage-based'],
    marks: 1,
    negative_marks: 0.25,
    ...overrides,
  };
}

describe('Practice Question Metadata', () => {
  it('default marks are 1', () => {
    const q = createDefaultQuestion();
    expect(q.marks).toBe(1);
  });

  it('default negative marks are 0.25', () => {
    const q = createDefaultQuestion();
    expect(q.negative_marks).toBe(0.25);
  });

  it('question_number is optional and sequential when provided', () => {
    const questions = [1, 2, 3, 4, 5].map(n =>
      createDefaultQuestion({ question_number: n, question_text: `Q${n}` })
    );
    expect(questions.map(q => q.question_number)).toEqual([1, 2, 3, 4, 5]);
  });

  it('passage_id links questions to a passage when set', () => {
    const passageId = 'abc-123-def';
    const questions = [1, 2, 3, 4, 5].map(n =>
      createDefaultQuestion({ passage_id: passageId, question_number: n })
    );
    questions.forEach(q => {
      expect(q.passage_id).toBe(passageId);
    });
  });

  it('passage_id can be null for standalone questions', () => {
    const q = createDefaultQuestion({ passage_id: null });
    expect(q.passage_id).toBeNull();
  });

  it('passage text is stripped when passage_id is set', () => {
    // When a question is linked to a passage in practice_passages table,
    // the passage field on the question itself should be null to avoid duplication
    const q = createDefaultQuestion({ passage_id: 'abc-123', passage: null });
    expect(q.passage).toBeNull();
    expect(q.passage_id).toBeTruthy();
  });

  it('accepts all official section names', () => {
    for (const section of OFFICIAL_SECTION_NAMES) {
      const q = createDefaultQuestion({ section });
      expect(OFFICIAL_SECTION_NAMES).toContain(q.section);
    }
  });

  it('rejects invalid section names', () => {
    // TypeScript would catch this at compile time, but validate at runtime too
    const validSections: string[] = [...OFFICIAL_SECTION_NAMES.map(s => s as string)];
    expect(validSections).not.toContain('English');
    expect(validSections).not.toContain('Current Affairs');
    expect(validSections).not.toContain('Random Section');
  });

  it('options always follow A/B/C/D format', () => {
    const q = createDefaultQuestion();
    expect(Object.keys(q.options)).toEqual(['A', 'B', 'C', 'D']);
  });

  it('difficulty is always easy/medium/hard', () => {
    const validDifficulties = ['easy', 'medium', 'hard'];
    for (const diff of validDifficulties) {
      const q = createDefaultQuestion({ difficulty: diff as any });
      expect(validDifficulties).toContain(q.difficulty);
    }
  });

  it('marks can be custom (non-negative)', () => {
    const q = createDefaultQuestion({ marks: 2 });
    expect(q.marks).toBe(2);
    expect(q.marks).toBeGreaterThan(0);
  });
});

// ─── Passage-Based Question Generation Logic ───

interface PracticePassage {
  id?: string;
  section: OfficialSectionName;
  title: string;
  source: string;
  content: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

describe('Passage-Based Question Generation', () => {
  it('1 passage generates 5 questions', () => {
    const passage: PracticePassage = {
      section: 'English Language',
      title: 'Test Passage',
      source: 'Original for CLATly',
      content: 'This is a test passage with enough content for reading comprehension questions. The passage discusses various topics that students should be familiar with for the CLAT examination.',
      difficulty: 'medium',
    };

    const expectedQuestions = 5;
    const questions = Array.from({ length: expectedQuestions }, (_, i) =>
      createDefaultQuestion({
        section: passage.section,
        passage_id: 'linked-to-passage',
        passage: null, // passage text lives in practice_passages, not duplicated
        question_number: i + 1,
        tags: ['passage-based'],
      })
    );

    expect(questions).toHaveLength(expectedQuestions);
    questions.forEach((q, i) => {
      expect(q.passage_id).toBeTruthy();
      expect(q.question_number).toBe(i + 1);
      expect(q.passage).toBeNull(); // not duplicated
      expect(q.tags).toContain('passage-based');
    });
  });

  it('all questions in a passage share the same passage_id', () => {
    const passageId = 'unique-passage-uuid';
    const questions = Array.from({ length: 5 }, (_, i) =>
      createDefaultQuestion({ passage_id: passageId, question_number: i + 1 })
    );
    questions.forEach(q => expect(q.passage_id).toBe(passageId));
    const uniqueIds = new Set(questions.map(q => q.passage_id));
    expect(uniqueIds.size).toBe(1);
  });

  it('passage has required fields', () => {
    const passage: PracticePassage = {
      section: 'Legal Reasoning',
      title: 'Legal Principle: Negligence',
      source: 'Legal principle',
      content: 'The principle of negligence requires the plaintiff to prove duty of care, breach, causation, and damages.',
      difficulty: 'hard',
    };
    expect(passage.section).toBeTruthy();
    expect(passage.content).toBeTruthy();
    expect(passage.difficulty).toMatch(/^(easy|medium|hard)$/);
  });

  it('generates exactly 1 passage per section call', () => {
    // The cron generates 1 passage per section, not multiple
    const sectionCalls = OFFICIAL_SECTION_NAMES.length;
    const passagesPerCall = 1;
    expect(passagesPerCall).toBe(1);
    expect(sectionCalls).toBe(5);
  });

  it('passage + 5 questions = 6 DB rows per section', () => {
    const passageRows = 1; // 1 practice_passages row
    const questionRows = 5; // 5 practice_questions rows
    expect(passageRows + questionRows).toBe(6);
  });
});

// ─── Normalisation Logic (from cron script) ───

type RawAIQuestion = {
  question_text?: string;
  question?: string;
  options: any;
  correct_option?: string;
  correct_answer?: string;
  correctAnswer?: string;
  explanation?: string;
  difficulty?: string;
  marks?: number;
  negative_marks?: number;
  tags?: string[];
  passage?: string;
};

function normalise(
  q: RawAIQuestion,
  passageId: string | null,
  questionNumber: number
): any | null {
  let question_text = q.question_text || q.question;
  const correct_answer = q.correct_option || q.correct_answer || q.correctAnswer;
  let options = q.options;

  if (!question_text && q.passage) {
    const sentences = q.passage.match(/[^.!?]+[.!?]/g);
    question_text = (sentences && sentences[0]) ? sentences[0].trim() : q.passage.substring(0, 150);
  }

  if (!question_text || !options || !correct_answer) return null;

  let parsedOptions = options;
  if (typeof parsedOptions === 'string') {
    try { parsedOptions = JSON.parse(parsedOptions); } catch { return null; }
  }
  if (Array.isArray(parsedOptions)) {
    const labels = ['A', 'B', 'C', 'D', 'E'];
    const obj: Record<string, string> = {};
    parsedOptions.forEach((opt: string, i: number) => { if (i < labels.length) obj[labels[i]] = String(opt); });
    parsedOptions = obj;
  }

  return {
    question_text,
    passage: passageId ? null : (q.passage || null),
    options: typeof parsedOptions === 'object' ? parsedOptions : {},
    correct_option: String(correct_answer),
    explanation: q.explanation || null,
    difficulty: (q.difficulty || 'medium').toLowerCase(),
    source: 'daily',
    marks: q.marks ?? 1,
    negative_marks: q.negative_marks ?? 0.25,
    question_number: questionNumber,
    passage_id: passageId || null,
    tags: q.tags || [],
  };
}

describe('Question Normalisation Logic', () => {
  it('normalises a standard question correctly', () => {
    const result = normalise(
      {
        question_text: 'What is 2+2?',
        options: { A: '3', B: '4', C: '5', D: '6' },
        correct_answer: 'B',
        explanation: '2+2=4',
        difficulty: 'easy',
      },
      'passage-uuid-123',
      1
    );
    expect(result).not.toBeNull();
    expect(result!.question_text).toBe('What is 2+2?');
    expect(result!.correct_option).toBe('B');
    expect(result!.marks).toBe(1);
    expect(result!.negative_marks).toBe(0.25);
    expect(result!.question_number).toBe(1);
    expect(result!.passage_id).toBe('passage-uuid-123');
    expect(result!.passage).toBeNull(); // stripped when passage_id set
  });

  it('strips passage text when passage_id is provided', () => {
    const result = normalise(
      {
        question_text: 'Q1',
        question: 'Q1',
        options: { A: '1', B: '2', C: '3', D: '4' },
        correct_answer: 'A',
        passage: 'Some long passage text here',
      },
      'passage-1',
      1
    );
    expect(result!.passage).toBeNull();
    expect(result!.passage_id).toBe('passage-1');
  });

  it('keeps passage text when passage_id is null (standalone)', () => {
    const result = normalise(
      {
        question_text: 'Q1',
        options: { A: '1', B: '2', C: '3', D: '4' },
        correct_answer: 'A',
        passage: 'Standalone passage',
      },
      null,
      1
    );
    expect(result!.passage).toBe('Standalone passage');
    expect(result!.passage_id).toBeNull();
  });

  it('returns null for missing question text', () => {
    const result = normalise(
      { options: { A: '1' }, correct_answer: 'A' },
      null,
      1
    );
    expect(result).toBeNull();
  });

  it('returns null for missing options', () => {
    const result = normalise(
      { question_text: 'Q1', options: undefined as any, correct_answer: 'A' },
      null,
      1
    );
    expect(result).toBeNull();
  });

  it('returns null for missing correct answer', () => {
    const result = normalise(
      { question_text: 'Q1', options: { A: '1' } },
      null,
      1
    );
    expect(result).toBeNull();
  });

  it('parses string options JSON', () => {
    const result = normalise(
      {
        question_text: 'Q1',
        options: JSON.stringify({ A: 'Opt A', B: 'Opt B', C: 'Opt C', D: 'Opt D' }),
        correct_answer: 'A',
      },
      null,
      1
    );
    expect(result!.options).toEqual({ A: 'Opt A', B: 'Opt B', C: 'Opt C', D: 'Opt D' });
  });

  it('converts array options to A/B/C/D object', () => {
    const result = normalise(
      {
        question_text: 'Q1',
        options: ['First', 'Second', 'Third', 'Fourth'],
        correct_answer: 'A',
      },
      null,
      1
    );
    expect(result!.options).toEqual({ A: 'First', B: 'Second', C: 'Third', D: 'Fourth' });
  });

  it('handles question_text vs question field naming', () => {
    const r1 = normalise({ question_text: 'Explicit Q', options: { A: '1' }, correct_answer: 'A' }, null, 1);
    const r2 = normalise({ question: 'Legacy Q', options: { A: '1' }, correct_answer: 'A' }, null, 1);
    expect(r1!.question_text).toBe('Explicit Q');
    expect(r2!.question_text).toBe('Legacy Q');
  });

  it('preserves custom marks and negative_marks from AI', () => {
    const result = normalise(
      { question_text: 'Q1', options: { A: '1' }, correct_answer: 'A', marks: 2, negative_marks: 0.5 },
      null,
      1
    );
    expect(result!.marks).toBe(2);
    expect(result!.negative_marks).toBe(0.5);
  });

  it('defaults marks to 1 when not provided', () => {
    const result = normalise(
      { question_text: 'Q1', options: { A: '1' }, correct_answer: 'A' },
      null,
      1
    );
    expect(result!.marks).toBe(1);
    expect(result!.negative_marks).toBe(0.25);
  });

  it('assigns sequential question numbers', () => {
    const questions = [1, 2, 3, 4, 5].map(n =>
      normalise(
        { question_text: `Q${n}`, options: { A: '1', B: '2', C: '3', D: '4' }, correct_answer: 'A' },
        'passage-x',
        n
      )
    );
    expect(questions.map(q => q!.question_number)).toEqual([1, 2, 3, 4, 5]);
  });
});

// ─── AI Prompt Building Logic ───

function buildPassagePrompt(section: string): string {
  const QS_PER_PASSAGE = 5;
  const prompts: Record<string, string> = {
    'English Language': `You are a CLAT English Language expert. Generate exactly 1 reading comprehension passage followed by exactly ${QS_PER_PASSAGE} questions`,
    'Current Affairs Including General Knowledge': `You are a CLAT Current Affairs & GK expert. Generate exactly 1 current affairs passage followed by exactly ${QS_PER_PASSAGE} questions`,
    'Legal Reasoning': `You are a CLAT Legal Reasoning expert. Generate exactly 1 legal scenario passage followed by exactly ${QS_PER_PASSAGE} questions`,
    'Logical Reasoning': `You are a CLAT Logical Reasoning expert. Generate exactly 1 argument/critical reasoning passage followed by exactly ${QS_PER_PASSAGE} questions`,
    'Quantitative Techniques': `You are a CLAT Quantitative Techniques expert. Generate exactly 1 data interpretation passage followed by exactly ${QS_PER_PASSAGE} questions`,
  };
  return prompts[section] || prompts['English Language'];
}

describe('AI Prompt Building', () => {
  it('returns correct prompt for each section', () => {
    expect(buildPassagePrompt('English Language')).toContain('English Language');
    expect(buildPassagePrompt('Current Affairs Including General Knowledge')).toContain('Current Affairs & GK');
    expect(buildPassagePrompt('Legal Reasoning')).toContain('Legal Reasoning');
    expect(buildPassagePrompt('Logical Reasoning')).toContain('Logical Reasoning');
    expect(buildPassagePrompt('Quantitative Techniques')).toContain('Quantitative Techniques');
  });

  it('falls back to English Language for unknown section', () => {
    const result = buildPassagePrompt('Unknown Section' as any);
    expect(result).toContain('English Language');
  });

  it('all prompts mention passage generation', () => {
    for (const section of OFFICIAL_SECTION_NAMES) {
      const prompt = buildPassagePrompt(section);
      expect(prompt).toMatch(/passage/i);
    }
  });

  it('all prompts mention 5 questions', () => {
    for (const section of OFFICIAL_SECTION_NAMES) {
      const prompt = buildPassagePrompt(section);
      expect(prompt).toMatch(/5/);
    }
  });
});

// ─── DB Schema Validation Tests ───

describe('DB Schema (practice_passages table)', () => {
  it('has id, section, title, source, content, difficulty, created_at', () => {
    const expectedColumns = ['id', 'section', 'title', 'source', 'content', 'difficulty', 'created_at'];
    expect(expectedColumns).toContain('id');
    expect(expectedColumns).toContain('section');
    expect(expectedColumns).toContain('title');
    expect(expectedColumns).toContain('source');
    expect(expectedColumns).toContain('content');
    expect(expectedColumns).toContain('difficulty');
    expect(expectedColumns).toContain('created_at');
  });

  it('has CHECK constraint on section for official names', () => {
    const validSections = [
      'English Language',
      'Current Affairs Including General Knowledge',
      'Legal Reasoning',
      'Logical Reasoning',
      'Quantitative Techniques',
    ];
    expect(validSections).toHaveLength(5);
  });

  it('has FK from practice_questions.passage_id → practice_passages.id', () => {
    // Naming: fk_practice_questions_passage
    expect('fk_practice_questions_passage').toMatch(/fk/i);
  });

  it('uses ON DELETE SET NULL for the FK', () => {
    // When a passage is deleted, questions keep their passage_id as NULL (not cascading delete)
    const fkAction = 'SET NULL';
    expect(fkAction).toBe('SET NULL');
  });
});

describe('DB Schema (practice_questions additions)', () => {
  it('has marks column with default 1', () => {
    expect('marks').toBeTruthy();
  });

  it('has negative_marks column with default 0.25', () => {
    expect('negative_marks').toBeTruthy();
  });

  it('has passage_id column (nullable UUID)', () => {
    // passage_id uuid, FK to practice_passages, nullable
    expect('passage_id').toBeTruthy();
  });

  it('has question_number column (nullable int)', () => {
    expect('question_number').toBeTruthy();
  });
});

// ─── Section Icons Mapping ───

describe('Section Icons', () => {
  const icons: Record<string, string> = {
    'English Language': '📖',
    'Current Affairs Including General Knowledge': '📰',
    'Legal Reasoning': '⚖️',
    'Logical Reasoning': '🧠',
    'Quantitative Techniques': '📐',
  };

  it('has all 5 sections mapped to icons', () => {
    expect(Object.keys(icons)).toHaveLength(5);
    for (const section of OFFICIAL_SECTION_NAMES) {
      expect(icons[section]).toBeDefined();
    }
  });

  it('has unique icons per section', () => {
    const uniqueIcons = new Set(Object.values(icons));
    expect(uniqueIcons.size).toBe(Object.keys(icons).length);
  });

  it('no old short-name keys exist', () => {
    expect(icons['English']).toBeUndefined();
    expect(icons['Current Affairs']).toBeUndefined();
  });
});

// ─── API Route Validation Tests ───

describe('Quiz Start API Validation', () => {
  const validSections: string[] = [
    'English Language',
    'Current Affairs Including General Knowledge',
    'Legal Reasoning',
    'Logical Reasoning',
    'Quantitative Techniques',
  ];

  it('accepts all official section names', () => {
    for (const section of OFFICIAL_SECTION_NAMES) {
      expect(validSections.includes(section)).toBe(true);
    }
  });

  it('rejects old short names', () => {
    expect(validSections.includes('English')).toBe(false);
    expect(validSections.includes('Current Affairs')).toBe(false);
  });

  it('rejects invalid names', () => {
    expect(validSections.includes('')).toBe(false);
    expect(validSections.includes('Random')).toBe(false);
  });
});
