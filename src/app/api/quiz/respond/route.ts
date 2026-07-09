import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { session_id, question_id, selected_option, time_taken_seconds, remaining_ids } = await req.json() as {
      session_id: string;
      question_id: string;
      selected_option: string;
      time_taken_seconds: number;
      remaining_ids?: string[];
    };

    const { user, supabase } = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Step 1: Fetch question (PK lookup — fast) + verify session ──
    const [questionRes, sessionRes] = await Promise.all([
      supabase
        .from('practice_questions')
        .select('id, correct_option, explanation')
        .eq('id', question_id)
        .single(),
      supabase
        .from('quiz_sessions')
        .select('id, section, questions_answered, correct_count')
        .eq('id', session_id)
        .eq('student_id', user.id)
        .single(),
    ]);

    if (!questionRes.data) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }
    if (!sessionRes.data) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const is_correct = selected_option === questionRes.data.correct_option;

    // ── Step 2: Record response (idempotent via unique constraint) ──
    await supabase
      .from('quiz_responses')
      .upsert({
        session_id,
        question_id,
        selected_option,
        is_correct,
        time_taken_seconds,
      }, { onConflict: 'session_id, question_id' });

    // ── Step 3: Update session counts (using read values from step 1) ──
    await supabase
      .from('quiz_sessions')
      .update({
        questions_answered: (sessionRes.data.questions_answered ?? 0) + 1,
        correct_count: (sessionRes.data.correct_count ?? 0) + (is_correct ? 1 : 0),
      })
      .eq('id', session_id);

    // ── Step 4: Update daily count (free users) ──
    const { data: profile } = await supabase
      .from('profiles')
      .select('daily_free_questions, last_practice_date, subscription_plan')
      .eq('id', user.id)
      .single();

    if (profile?.subscription_plan === 'free') {
      const today = new Date().toISOString().split('T')[0];
      let current = profile.daily_free_questions ?? 10;
      if (profile.last_practice_date !== today) current = 10;
      await supabase
        .from('profiles')
        .update({
          daily_free_questions: Math.max(0, current - 1),
          last_practice_date: today,
        })
        .eq('id', user.id);
    }

    // ── Step 5: Pick next question from pre-loaded IDs (PK lookup) ──
    let nextQuestion = null;
    let newRemainingIds: string[] | null = null;

    if (remaining_ids && remaining_ids.length > 0) {
      const nextId = remaining_ids[Math.floor(Math.random() * remaining_ids.length)];
      const { data: nq } = await supabase
        .from('practice_questions')
        .select('id, section, topic, question_text, passage, options, difficulty, explanation, tags')
        .eq('id', nextId)
        .single();

      nextQuestion = nq;
      newRemainingIds = remaining_ids.filter(id => id !== nextId);
    }

    return NextResponse.json({
      result: {
        is_correct,
        correct_option: questionRes.data.correct_option,
        explanation: questionRes.data.explanation,
        your_answer: selected_option,
      },
      next_question: nextQuestion,
      remaining_ids: newRemainingIds && newRemainingIds.length > 0 ? newRemainingIds : null,
      session_complete: !nextQuestion,
    });

  } catch (err) {
    console.error('Quiz respond error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
