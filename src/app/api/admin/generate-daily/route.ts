import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateSection, type SectionName } from '@/lib/ai/generate';
import { cookies } from 'next/headers';

const SECTIONS: SectionName[] = [
  'English', 'Current Affairs', 'Legal Reasoning',
  'Logical Reasoning', 'Quantitative Techniques',
];
const QS_PER_SECTION = 5; // 25 total per run

export async function POST(request: NextRequest) {
  try {
    // Auth: admin cookie OR cron API key
    const cronApiKey = request.headers.get('x-cron-key');
    if (cronApiKey === process.env.CRON_API_KEY) {
      return await generateAllSections();
    }

    // Cookie-based admin auth
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('clat-at')?.value;
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: { user } } = await supabase.auth.getUser(accessToken);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return await generateAllSections(adminClient);
  } catch (err) {
    console.error('Generate daily error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}

// ─── Shared generation logic (used by admin UI + cron) ───

async function generateAllSections(db?: ReturnType<typeof createClient>) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const adminClient = db ?? createClient(supabaseUrl, serviceKey);

  const results: { section: string; count: number; ok: boolean; error?: string }[] = [];

  for (const section of SECTIONS) {
    try {
      const result = await generateSection(section, QS_PER_SECTION);

      if (!result.success || result.questions.length === 0) {
        results.push({ section, count: 0, ok: false, error: result.error || 'No questions generated' });
        continue;
      }

      // Insert into practice_questions with source = 'daily'
      const rows = result.questions.map((q) => ({
        section,
        question_text: q.question_text,
        passage: q.passage || null,
        options: q.options,
        correct_option: q.correct_option,
        explanation: q.explanation || null,
        difficulty: q.difficulty || 'medium',
        source: 'daily',
        generated_by: result.aiService || 'deepseek',
        reviewed: false,
      }));

      const { error: insertError } = await adminClient
        .from('practice_questions')
        .insert(rows);

      results.push({
        section,
        count: rows.length,
        ok: !insertError,
        error: insertError?.message,
      });
    } catch (err) {
      results.push({
        section,
        count: 0,
        ok: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  const totalGenerated = results.filter((r) => r.ok).reduce((s, r) => s + r.count, 0);

  return NextResponse.json({
    success: true,
    total_generated: totalGenerated,
    results,
    message: `✅ Generated ${totalGenerated} new practice questions!`,
  });
}
