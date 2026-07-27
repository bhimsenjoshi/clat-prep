import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { subsection } = await req.json() as { subsection?: string };

    if (!subsection || typeof subsection !== 'string' || subsection.trim() === '') {
      return NextResponse.json({ error: 'subsection is required' }, { status: 400 });
    }

    // Set up supabase client and authenticate from cookie
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

    // Fetch all questions matching the subsection
    const { data: questions, error: questionsError } = await supabase
      .from('visual_math_questions')
      .select('*')
      .eq('subsection', subsection);

    if (questionsError) {
      console.error('[quant-foundations/start] Error fetching questions:', questionsError);
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }

    const safeQuestions = (questions ?? []).map(q => ({
      ...q,
      explanation: (() => {
        const raw = q.explanation;
        if (typeof raw === 'string') {
          try { return JSON.parse(raw); } catch { return raw; }
        }
        return raw;
      })(),
    }));

    // Shuffle questions (Fisher-Yates)
    const shuffled = [...safeQuestions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Create the session
    const { data: sessionData, error: sessionError } = await supabase
      .from('visual_math_sessions')
      .insert({
        student_id: user.id,
        subsection,
        topic: 'general',
        started_at: new Date().toISOString(),
        questions_answered: 0,
        correct_count: 0,
      })
      .select('id')
      .single();

    if (sessionError || !sessionData) {
      console.error('[quant-foundations/start] Error creating session:', sessionError);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    return NextResponse.json({
      session_id: sessionData.id,
      questions: shuffled,
      total: shuffled.length,
    });

  } catch (err) {
    console.error('[quant-foundations/start] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
