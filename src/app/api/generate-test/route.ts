import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { generateSection, type SectionName } from '@/lib/ai/generate';

export async function POST(request: NextRequest) {
  try {
    const { sectionId, sectionName } = await request.json();

    if (!sectionId || !sectionName) {
      return NextResponse.json(
        { error: 'sectionId and sectionName are required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // Read auth token from custom cookie
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('clat-at')?.value;

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized — no session' }, { status: 401 });
    }

    // Verify the token
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: { user } } = await supabase.auth.getUser(accessToken);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized — invalid token' }, { status: 401 });
    }

    // Check admin role via service_key
    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: profile } = await adminClient
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

    // Deduplicate against existing questions in this section
    const { data: existingQuestions } = await adminClient
      .from('questions')
      .select('question_text')
      .eq('section_id', sectionId);

    const existingTexts = new Set(
      (existingQuestions ?? []).map((eq: any) =>
        eq.question_text.toLowerCase().trim().slice(0, 60)
      )
    );

    const newQuestions = result.questions.filter(
      (q) => !existingTexts.has(q.question_text.toLowerCase().trim().slice(0, 60))
    );

    const skipped = result.questions.length - newQuestions.length;

    // Insert deduplicated questions into DB
    const questionRows = newQuestions.map((q) => ({
      section_id: sectionId,
      question_text: q.question_text,
      passage: q.passage,
      options: q.options,
      correct_option: q.correct_option,
      explanation: q.explanation,
      difficulty: q.difficulty,
      generated_by: result.aiService || 'manual',
      reviewed: false,
    }));

    const { data: inserted, error: dbError } = await adminClient
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
      skipped,
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
