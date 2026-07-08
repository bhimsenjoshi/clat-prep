import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { session_id, question_id, selected_option, time_taken_seconds } = await req.json() as {
      session_id: string;
      question_id: string;
      selected_option: string;
      time_taken_seconds: number;
    };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify session belongs to user
    const { data: session } = await supabase
      .from('quiz_sessions')
      .select('id, section, topic')
      .eq('id', session_id)
      .eq('student_id', user.id)
      .single();

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Fetch the question to check answer
    const { data: question } = await supabase
      .from('practice_questions')
      .select('id, correct_option, explanation')
      .eq('id', question_id)
      .single();

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const is_correct = selected_option === question.correct_option;

    // Check if this question was already answered in this session
    const { data: existing } = await supabase
      .from('quiz_responses')
      .select('id')
      .eq('session_id', session_id)
      .eq('question_id', question_id)
      .maybeSingle();

    if (!existing) {
      // Record response
      await supabase.from('quiz_responses').insert({
        session_id,
        question_id,
        selected_option,
        is_correct,
        time_taken_seconds,
      });

      // Update session counts (fetch current, then increment)
      const { data: curSession } = await supabase
        .from('quiz_sessions')
        .select('questions_answered, correct_count')
        .eq('id', session_id)
        .single();

      await supabase
        .from('quiz_sessions')
        .update({
          questions_answered: (curSession?.questions_answered ?? 0) + 1,
          correct_count: (curSession?.correct_count ?? 0) + (is_correct ? 1 : 0),
        })
        .eq('id', session_id);
    }

    // Fetch next random question (exclude already answered ones)
    const { data: answeredIds } = await supabase
      .from('quiz_responses')
      .select('question_id')
      .eq('session_id', session_id);

    const excludeIds = (answeredIds ?? []).map(r => r.question_id);

    let nextQuestionQuery = supabase
      .from('practice_questions')
      .select('id, section, topic, question_text, passage, options, difficulty, explanation, tags')
      .eq('section', session.section);

    if (excludeIds.length > 0) {
      nextQuestionQuery = nextQuestionQuery.not('id', 'in', `(${excludeIds.join(',')})`);
    }

    // Random ordering
    const { data: nextQuestion } = await nextQuestionQuery
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      result: {
        is_correct,
        correct_option: question.correct_option,
        explanation: question.explanation,
        your_answer: selected_option,
      },
      next_question: nextQuestion ?? null, // null = no more questions in this section
      session_complete: !nextQuestion,
    });

  } catch (err) {
    console.error('Quiz respond error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
