import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { cookies } from 'next/headers';

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
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Auth: set up supabase client with cookie session (same pattern as start route)
    const supabase = createClient();
    const cookieStore = await cookies();
    const clatAt = cookieStore.get('clat-at')?.value;
    const clatRt = cookieStore.get('clat-rt')?.value;

    if (!clatAt) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(clatAt);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Set the session so subsequent queries have auth context for RLS
    await supabase.auth.setSession({
      access_token: clatAt,
      refresh_token: clatRt ?? '',
    });

    // ── Step 1: Fetch the question ──
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

    // ── Step 3: Upsert response ──
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
      console.error('Upsert error:', upsertError);
      return NextResponse.json({ error: 'Failed to record response' }, { status: 500 });
    }

    // ── Step 4: Update session counts ──
    const { data: session } = await supabase
      .from('visual_math_sessions')
      .select('questions_answered, correct_count')
      .eq('id', session_id)
      .single();

    if (session) {
      await supabase
        .from('visual_math_sessions')
        .update({
          questions_answered: (session.questions_answered ?? 0) + 1,
          correct_count: (session.correct_count ?? 0) + (is_correct ? 1 : 0),
        })
        .eq('id', session_id);
    }

    // ── Step 5: Return result ──
    return NextResponse.json({
      is_correct,
      correct_option: question.correct_option,
      explanation: (() => {
        const raw = question.explanation;
        if (typeof raw === 'string') {
          try { return JSON.parse(raw); } catch { return raw; }
        }
        return raw;
      })(),
    });

  } catch (err) {
    console.error('Quant Foundations respond error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
