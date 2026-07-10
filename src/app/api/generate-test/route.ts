import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { generateSection, type SectionName } from '@/lib/ai/generate';

export async function POST(request: NextRequest) {
  try {
    const { sectionId, sectionName, maxQuestions } = await request.json();

    if (!sectionId || !sectionName) {
      return NextResponse.json(
        { error: 'sectionId and sectionName are required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // Read auth tokens from custom cookies
    const cookieStore = await cookies();
    let accessToken = cookieStore.get('clat-at')?.value;
    const refreshToken = cookieStore.get('clat-rt')?.value;

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized — no session' }, { status: 401 });
    }

    // Verify the token — try refreshing if expired
    const supabase = createClient(supabaseUrl, supabaseKey);
    let { data: { user } } = await supabase.auth.getUser(accessToken);

    if (!user && refreshToken) {
      // Token expired — try refreshing with the refresh token
      const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
      if (!refreshError && refreshed?.session?.access_token) {
        accessToken = refreshed.session.access_token;
        // Update cookies for subsequent requests
        const maxAge = 60 * 60 * 24 * 7;
        cookieStore.set('clat-at', refreshed.session.access_token, {
          path: '/', maxAge, secure: true, sameSite: 'lax',
        });
        if (refreshed.session.refresh_token) {
          cookieStore.set('clat-rt', refreshed.session.refresh_token, {
            path: '/', maxAge, secure: true, sameSite: 'lax',
          });
        }
        // Retry with the refreshed access token
        const { data: retry } = await supabase.auth.getUser(accessToken);
        user = retry?.user ?? null;
      }
    }

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
    const result = await generateSection(sectionName as SectionName, maxQuestions);

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
