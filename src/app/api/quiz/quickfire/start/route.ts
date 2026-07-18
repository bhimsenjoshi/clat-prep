import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/supabase/server';
import type { SectionName } from '@/types';

const VALID_SECTIONS: SectionName[] = [
  'English Language', 'Current Affairs Including General Knowledge', 'Legal Reasoning',
  'Logical Reasoning', 'Quantitative Techniques',
];

const QS_PER_SESSION = 10;

export async function POST(req: NextRequest) {
  try {
    const { section } = await req.json() as { section: SectionName };
    if (!VALID_SECTIONS.includes(section)) {
      return NextResponse.json({ error: `Invalid section: ${section}` }, { status: 400 });
    }

    const { user, supabase } = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch profile + standalone questions in parallel
    const [profileRes, questionsRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('daily_free_questions, last_practice_date, subscription_plan')
        .eq('id', user.id)
        .single(),
      supabase
        .from('practice_questions')
        .select('id, section, topic, question_text, passage, passage_id, options, correct_option, difficulty, explanation, tags')
        .eq('section', section)
        .eq('validation_status', 'passed')
        .is('passage_id', null)
        .order('created_at', { ascending: false }),
    ]);

    const profile = profileRes.data;
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Reset daily count if new day
    const today = new Date().toISOString().split('T')[0];
    if (profile.last_practice_date !== today) {
      await supabase
        .from('profiles')
        .update({ daily_free_questions: 10, last_practice_date: today })
        .eq('id', user.id);
      profile.daily_free_questions = 10;
    }

    if (profile.subscription_plan === 'free' && (profile.daily_free_questions ?? 10) <= 0) {
      return NextResponse.json({
        error: 'Daily free limit reached',
        code: 'DAILY_LIMIT_REACHED',
        message: "You've used all 10 free questions today. Upgrade to premium for unlimited!",
      }, { status: 403 });
    }

    const allQuestions = questionsRes.data ?? [];

    // Filter out already-answered questions to avoid repeats
    const { data: answeredSessions } = await supabase
      .from('quiz_sessions')
      .select('id')
      .eq('student_id', user.id)
      .eq('section', section)
      .eq('session_type', 'quick_fire');

    let availableQuestions = allQuestions;
    if (answeredSessions && answeredSessions.length > 0) {
      const { data: answeredData } = await supabase
        .from('quiz_responses')
        .select('question_id')
        .in('session_id', answeredSessions.map(s => s.id));

      const answeredIds = new Set((answeredData ?? []).map(r => r.question_id));
      const fresh = allQuestions.filter(q => !answeredIds.has(q.id));
      if (fresh.length >= QS_PER_SESSION) {
        availableQuestions = fresh;
      }
      // If fewer than QS_PER_SESSION fresh questions remain, cycle back through all
    }

    // Pick newest questions first (up to QS_PER_SESSION)
    const batch = availableQuestions.slice(0, Math.min(QS_PER_SESSION, availableQuestions.length));

    if (batch.length === 0) {
      return NextResponse.json({
        session_id: null,
        questions: [],
        needs_seeding: true,
      });
    }

    // Create session
    const { data: sessionData, error: sessionError } = await supabase
      .from('quiz_sessions')
      .insert({
        student_id: user.id,
        section,
        topic: 'quick_fire',
        questions_answered: 0,
        correct_count: 0,
        session_type: 'quick_fire',
      })
      .select('id')
      .single();

    if (sessionError || !sessionData) {
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    // Strip passage fields (not needed for Quick Fire standalone questions)
    const safeBatch = batch.map(({ passage, passage_id, ...safe }) => ({
      ...safe,
      explanation: (() => {
        if (typeof safe.explanation === 'string') {
          try { return JSON.parse(safe.explanation); } catch { return safe.explanation; }
        }
        return safe.explanation;
      })(),
    }));

    return NextResponse.json({
      session_id: sessionData.id,
      questions: safeBatch,
      total: batch.length,
      daily_remaining: profile.subscription_plan === 'free'
        ? (profile.daily_free_questions ?? 10)
        : 'unlimited',
    });

  } catch (err) {
    console.error('QuickFire start error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
