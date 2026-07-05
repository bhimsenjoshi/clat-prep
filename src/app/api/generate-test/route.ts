import { NextRequest, NextResponse } from 'next/server';
import { generateSection, type SectionName } from '@/lib/ai/generate';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { sectionId, sectionName } = await request.json();

    if (!sectionId || !sectionName) {
      return NextResponse.json(
        { error: 'sectionId and sectionName are required' },
        { status: 400 }
      );
    }

    // Verify admin auth
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Generate questions via AI
    const result = await generateSection(sectionName as SectionName);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate questions' },
        { status: 500 }
      );
    }

    // Insert generated questions into DB
    const questionRows = result.questions.map((q) => ({
      section_id: sectionId,
      question_text: q.question_text,
      passage: q.passage,
      options: q.options,
      correct_option: q.correct_option,
      explanation: q.explanation,
      difficulty: q.difficulty,
      generated_by: 'gemini',
      reviewed: false,
    }));

    const { data: inserted, error: dbError } = await supabase
      .from('questions')
      .insert(questionRows)
      .select();

    if (dbError) {
      return NextResponse.json(
        { error: `DB insert failed: ${dbError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: inserted?.length ?? 0,
      questions: inserted,
    });
  } catch (err: any) {
    console.error('Generate test error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
