/**
 * WhatsApp Interactive Quiz Bot — Session Manager
 *
 * Handles the full interactive flow:
 *   User "start english" → sends question → user replies "A" → result + next → ... → final score
 */

import { createClient } from '@supabase/supabase-js';
import { WhatsAppClient } from './whatsapp';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const QUESTIONS_PER_SESSION = 5;

// ─── Types ───

export interface WaUser {
  id: string;
  full_name: string | null;
}

interface ActiveSession {
  id: string;
  user_id: string;
  section: string;
  current_index: number;
  question_order: string[];
  correct_count: number;
  total_questions: number;
}

interface QuestionData {
  id: string;
  question_text: string;
  passage: string | null;
  options: Record<string, string>;
  correct_option: string;
  explanation: string | null;
  difficulty: string;
}

// ─── Helpers ───

function getDb() {
  return createClient(SUPABASE_URL, SERVICE_KEY);
}

function formatOptions(options: Record<string, string>): string {
  return Object.entries(options)
    .map(([key, val]) => `${key}) ${val}`)
    .join('\n');
}

function formatQuestion(q: QuestionData, index: number, total: number): string {
  const lines: string[] = [
    `📖 *Q${index + 1}/${total}*`,
    ``,
    q.passage ? `📄 ${q.passage}\n` : '',
    q.question_text,
    ``,
    formatOptions(q.options),
    ``,
    `_Reply with A, B, C, or D_`,
  ];
  return lines.filter(Boolean).join('\n');
}

// ─── Bot Logic ───

const BOT_NAME = 'CLAT Prep Bot';

const HELP_TEXT = [
  `🤖 *${BOT_NAME}*`,
  ``,
  `Commands:`,
  `• \`start <section>\` — start a quiz (e.g. "start english")`,
  `• \`cancel\` — stop current quiz`,
  `• \`sections\` — list available sections`,
  `• \`help\` — show this message`,
  ``,
  `Sections: English, Current Affairs, Legal Reasoning, Logical Reasoning, Quantitative Techniques`,
  ``,
  `During a quiz, just reply with A, B, C, or D to answer.`,
].join('\n');

const SECTIONS = [
  'English', 'Current Affairs', 'Legal Reasoning',
  'Logical Reasoning', 'Quantitative Techniques',
];

export class WaQuizBot {
  private wa: WhatsAppClient;

  constructor(wa?: WhatsAppClient) {
    this.wa = wa ?? new WhatsAppClient();
  }

  /** Called when we receive a text message from a user */
  async handleIncoming(phone: string, text: string) {
    // Log the incoming message
    const db = getDb();
    await db.from('whatsapp_incoming').insert({
      phone,
      message_body: text.slice(0, 500),
      message_type: 'text',
    }).maybeSingle();

    const lower = text.toLowerCase().trim();

    // ─── Commands ───

    // Help
    if (lower === 'help' || lower === 'bot') {
      return this.send(phone, HELP_TEXT);
    }

    // Sections list
    if (lower === 'sections' || lower === 'list') {
      return this.send(phone, [
        `📚 *Available Sections*`,
        ``,
        ...SECTIONS.map(s => `• ${s}`),
        ``,
        `Reply: \`start <section>\` to begin`,
      ].join('\n'));
    }

    // Cancel
    if (lower === 'cancel' || lower === 'stop' || lower === 'quit') {
      const { data: active } = await db
        .from('whatsapp_quiz_sessions')
        .select('id')
        .eq('phone', phone)
        .eq('status', 'active')
        .maybeSingle();

      if (active) {
        await db.from('whatsapp_quiz_sessions')
          .update({ status: 'cancelled', completed_at: new Date().toISOString() })
          .eq('id', active.id);

        return this.send(phone, '❌ Quiz cancelled. Reply `start <section>` to begin a new one.');
      }

      return this.send(phone, 'No active quiz to cancel.');
    }

    // Start quiz
    if (lower.startsWith('start ') || lower.startsWith('begin ') || lower.startsWith('quiz ')) {
      const sectionName = this.parseSection(text);
      if (!sectionName) {
        return this.send(phone, [
          `❌ Section not found. Available sections:`,
          ``,
          ...SECTIONS.map(s => `• ${s}`),
          ``,
          `Example: \`start english\``,
        ].join('\n'));
      }
      return this.startQuiz(phone, sectionName);
    }

    // ─── Answer processing (if active session) ───
    const isOption = /^[abcd]$/i.test(lower);
    if (isOption) {
      const handled = await this.processAnswer(phone, lower.toUpperCase());
      if (handled) return;
    }

    // ─── Unrecognized ───
    // Check if user has an active session (means they probably tried to answer but typed wrong)
    const { data: activeCheck } = await db
      .from('whatsapp_quiz_sessions')
      .select('id, section, current_index, total_questions')
      .eq('phone', phone)
      .eq('status', 'active')
      .maybeSingle();

    if (activeCheck) {
      return this.send(phone,
        `Reply with *A, B, C, or D* to answer Q${activeCheck.current_index + 1}/${activeCheck.total_questions}.`
      );
    }

    // New user — welcome
    return this.send(phone,
      `👋 Welcome to *${BOT_NAME}*!\n\nReply \`sections\` to see available topics or \`start english\` to begin practicing!\n\n_Or type help for all commands._`
    );
  }

  // ─── Start a new quiz ───

  private async startQuiz(phone: string, section: string) {
    const db = getDb();

    // Cancel any existing active session
    await db.from('whatsapp_quiz_sessions')
      .update({ status: 'cancelled', completed_at: new Date().toISOString() })
      .eq('phone', phone)
      .eq('status', 'active');

    // Find the user by phone
    const { data: profile } = await db
      .from('profiles')
      .select('id, full_name')
      .eq('phone', phone)
      .maybeSingle();

    if (!profile) {
      return this.send(phone,
        `❌ You're not registered with CLAT Prep yet.\n\nSign up at clatly.com and add your phone number in the Dashboard to use WhatsApp quizzes!`
      );
    }

    // Fetch random questions for this section
    const { data: questions } = await db
      .from('practice_questions')
      .select('id')
      .eq('section', section)
      .limit(QUESTIONS_PER_SESSION);

    if (!questions || questions.length === 0) {
      return this.send(phone, `❌ No questions available for *${section}* yet. Try another section!`);
    }

    const questionIds = questions.map(q => q.id);
    const actualCount = questionIds.length;

    // Create session
    const { data: session, error } = await db
      .from('whatsapp_quiz_sessions')
      .insert({
        user_id: profile.id,
        phone,
        section,
        question_order: questionIds,
        current_index: 0,
        total_questions: actualCount,
      })
      .select()
      .single();

    if (error || !session) {
      console.error('Failed to create session:', error);
      return this.send(phone, '❌ Something went wrong. Please try again.');
    }

    // Send first question
    await this.sendQuestion(phone, section, 0, questionIds);
  }

  // ─── Send a question ───

  private async sendQuestion(phone: string, section: string, index: number, questionIds: string[]) {
    const db = getDb();
    const qId = questionIds[index];
    if (!qId) return;

    const { data: question } = await db
      .from('practice_questions')
      .select('*')
      .eq('id', qId)
      .single();

    if (!question) {
      return this.send(phone, '❌ Error loading question. Please start a new quiz.');
    }

    const msg = formatQuestion(question, index, questionIds.length);
    await this.send(phone, msg);
  }

  // ─── Process an answer ───

  private async processAnswer(phone: string, answer: string): Promise<boolean> {
    const db = getDb();

    const { data: session } = await db
      .from('whatsapp_quiz_sessions')
      .select('*')
      .eq('phone', phone)
      .eq('status', 'active')
      .maybeSingle();

    if (!session) return false;

    const currentQId = session.question_order[session.current_index];
    if (!currentQId) return false;

    // Fetch the question
    const { data: question } = await db
      .from('practice_questions')
      .select('*')
      .eq('id', currentQId)
      .single();

    if (!question) return false;

    const is_correct = answer === question.correct_option;

    // Log the response
    await db.from('whatsapp_quiz_responses').insert({
      session_id: session.id,
      question_id: currentQId,
      selected_option: answer,
      is_correct,
    });

    // Send result
    const resultMsg = is_correct
      ? `✅ *Correct!*`
      : `❌ *Incorrect* — the answer was *${question.correct_option}*`;

    await this.send(phone, question.explanation
      ? `${resultMsg}\n\n💡 ${question.explanation}`
      : resultMsg
    );

    // Update session
    const newIndex = session.current_index + 1;
    const newCorrect = session.correct_count + (is_correct ? 1 : 0);

    if (newIndex >= session.question_order.length) {
      // Quiz complete!
      await db.from('whatsapp_quiz_sessions').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        correct_count: newCorrect,
        current_index: newIndex,
      }).eq('id', session.id);

      const pct = Math.round((newCorrect / session.total_questions) * 100);
      const emoji = pct >= 70 ? '🎉' : pct >= 40 ? '👍' : '💪';
      const advice = pct >= 70
        ? 'Great job! Keep it up! 🚀'
        : pct >= 40
          ? 'Good effort! Review your mistakes and try again.'
          : 'Keep practicing — you\'ll get better!';

      const summary = [
        `📊 *Quiz Complete — ${session.section}*`,
        ``,
        `${emoji} ${newCorrect}/${session.total_questions} correct (${pct}%)`,
        ``,
        advice,
        ``,
        `Reply \`start <section>\` to try another!`,
      ].join('\n');

      return this.send(phone, summary) as unknown as boolean;
    }

    // Continue — send next question
    await db.from('whatsapp_quiz_sessions').update({
      current_index: newIndex,
      correct_count: newCorrect,
    }).eq('id', session.id);

    await this.sendQuestion(phone, session.section, newIndex, session.question_order);
    return true;
  }

  // ─── Parse section from user text ───

  private parseSection(text: string): string | null {
    const lower = text.toLowerCase();
    for (const s of SECTIONS) {
      const key = s.toLowerCase();
      if (lower.includes(key)) return s;
    }
    // Fuzzy match
    if (lower.includes('english') || lower.includes('eng')) return 'English';
    if (lower.includes('current') || lower.includes('ca') || lower.includes('gk') || lower.includes('affair')) return 'Current Affairs';
    if (lower.includes('legal') || lower.includes('law')) return 'Legal Reasoning';
    if (lower.includes('logical') || lower.includes('lr') || lower.includes('reasoning')) return 'Logical Reasoning';
    if (lower.includes('quant') || lower.includes('math') || lower.includes('numerical')) return 'Quantitative Techniques';
    return null;
  }

  // ─── Send a WhatsApp message ───

  private async send(phone: string, message: string) {
    return this.wa.sendText(phone, message);
  }
}
