import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { session_id, question_id, selected_option, time_taken_seconds, next_index, total } = await req.json() as {
      session_id: string;
      question_id: string;
      selected_option: string;
      time_taken_seconds: number;
      next_index: number;
      total: number;
    };

    const { user, supabase } = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch question + session in parallel
    const [questionRes, sessionRes] = await Promise.all([
      supabase
        .from('practice_questions')
        .select('id, correct_option, explanation')
        .eq('id', question_id)
        .single(),
      supabase
        .from('quiz_sessions')
        .select('id, questions_answered, correct_count')
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
    const today = new Date().toISOString().split('T')[0];
    const isLast = next_index >= total;

    // Record response
    const insertRes = await supabase
      .from('quiz_responses')
      .insert({
        session_id,
        question_id,
        selected_option,
        is_correct,
        time_taken_seconds,
      })
      .select('id');

    const wasInserted = !insertRes.error && insertRes.data && insertRes.data.length > 0;

    // Update session counts
    if (wasInserted) {
      await supabase
        .from('quiz_sessions')
        .update({
          questions_answered: (sessionRes.data.questions_answered ?? 0) + 1,
          correct_count: (sessionRes.data.correct_count ?? 0) + (is_correct ? 1 : 0),
          ...(isLast ? { ended_at: new Date().toISOString() } : {}),
        })
        .eq('id', session_id);
    }

    // Update daily count for free users
    const { data: profile } = await supabase
      .from('profiles')
      .select('daily_free_questions, last_practice_date, subscription_plan')
      .eq('id', user.id)
      .single();

    if (profile?.subscription_plan === 'free') {
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

    return NextResponse.json({
      result: {
        is_correct,
        correct_option: questionRes.data.correct_option,
        explanation: (() => {
          const raw = questionRes.data.explanation;
          if (typeof raw === 'string') {
            try { return JSON.parse(raw); } catch { return raw; }
          }
          return raw;
        })(),
        your_answer: selected_option,
        time_taken_seconds,
      },
      session_complete: isLast,
    });

  } catch (err) {
    console.error('QuickFire respond error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
