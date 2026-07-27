import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { session_id, question_id, selected_option, time_taken_seconds } = await req.json() as {
      session_id: string;
      question_id: string;
      selected_option: string;
      time_taken_seconds: number;
    };

    // Validate required fields
    if (!session_id || !question_id || !selected_option || time_taken_seconds === undefined) {
      return NextResponse.json({ error: 'Missing required fields: session_id, question_id, selected_option, time_taken_seconds' }, { status: 400 });
    }

    const { user, supabase } = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Step 1: Fetch the question to get correct_option and explanation ──
    const { data: question, error: questionError } = await supabase
      .from('visual_math_questions')
      .select('id, correct_option, explanation')
      .eq('id', question_id)
      .single();

    if (questionError || !question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // ── Step 2: Compute correctness ──
    const is_correct = selected_option === question.correct_option;

    // ── Step 3: Upsert response (unique on session_id + question_id) ──
    const { error: upsertError } = await supabase
      .from('visual_math_responses')
      .upsert(
        {
          session_id,
          question_id,
          selected_option,
          is_correct,
          time_taken_seconds,
          answered_at: new Date().toISOString(),
        },
        {
          onConflict: 'session_id, question_id',
          ignoreDuplicates: false,
        }
      );

    if (upsertError) {
      console.error('Upsert response error:', upsertError);
      return NextResponse.json({ error: 'Failed to record response' }, { status: 500 });
    }

    // ── Step 4: Update session counts ──
    // Fetch current session counts
    const { data: session } = await supabase
      .from('visual_math_sessions')
      .select('questions_answered, correct_count')
      .eq('id', session_id)
      .single();

    if (session) {
      const updateData: Record<string, any> = {
        questions_answered: (session.questions_answered ?? 0) + 1,
        correct_count: (session.correct_count ?? 0) + (is_correct ? 1 : 0),
      };
      await supabase
        .from('visual_math_sessions')
        .update(updateData)
        .eq('id', session_id);
    }

    // ── Step 5: Return result ──
    return NextResponse.json({
      is_correct,
      correct_option: question.correct_option,
      explanation: (() => {
        const raw = question.explanation;
        if (typeof raw === 'string') {
          try {
            return JSON.parse(raw);
          } catch {
            return raw;
          }
        }
        return raw;
      })(),
    });

  } catch (err) {
    console.error('Quant Foundations respond error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
