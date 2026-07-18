import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/supabase/server';
import type { SectionName } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { section, topic = 'general' } = await req.json() as {
      section: SectionName;
      topic?: string;
    };

    const validSections: SectionName[] = [
      'English Language', 'Current Affairs Including General Knowledge', 'Legal Reasoning',
      'Logical Reasoning', 'Quantitative Techniques',
    ];
    if (!validSections.includes(section)) {
      return NextResponse.json({ error: `Invalid section: ${section}` }, { status: 400 });
    }

    const { user, supabase } = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parallel: fetch profile + all question IDs + answered session IDs
    const [profileResult, idsResult, sessionIdsResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('daily_free_questions, last_practice_date, subscription_plan')
        .eq('id', user.id)
        .single(),
      supabase
        .from('practice_questions')
        .select('id, created_at')
        .eq('section', section)
        .not('passage_id', 'is', null) // Only CLAT-format passage-linked questions
        .order('created_at', { ascending: false }),
      supabase
        .from('quiz_sessions')
        .select('id')
        .eq('student_id', user.id)
        .eq('section', section),
    ]);

    const profile = profileResult.data;
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Keep IDs in created_at order (newest first) to prioritise today's questions
    let questionIds = (idsResult.data ?? []).map(q => q.id);

    // Filter out already-answered questions to avoid repeats
    const sessionIds = (sessionIdsResult.data ?? []).map(s => s.id);
    if (sessionIds.length > 0) {
      const { data: answeredData } = await supabase
        .from('quiz_responses')
        .select('question_id')
        .in('session_id', sessionIds);
      
      const answeredQuestionIds = new Set((answeredData ?? []).map(r => r.question_id));
      const freshIds = questionIds.filter(id => !answeredQuestionIds.has(id));
      if (freshIds.length > 0) {
        questionIds = freshIds;
      }
      // If all exhausted, keep all IDs (fresh cycle) — still newest-first
    }

    // Reset daily count if new day
    const today = new Date().toISOString().split('T')[0];
    if (profile.last_practice_date !== today) {
      await supabase
        .from('profiles')
        .update({ daily_free_questions: 10, last_practice_date: today })
        .eq('id', user.id);
      profile.daily_free_questions = 10;
    }

    if (profile.subscription_plan === 'free' && (profile.daily_free_questions ?? 10) <= 0) {
      return NextResponse.json({
        error: 'Daily free limit reached',
        code: 'DAILY_LIMIT_REACHED',
        message: "You've used all 10 free questions today. Upgrade to premium for unlimited!",
      }, { status: 403 });
    }

    // ── Fetch all passage-linked questions for passage-grouped queue ──
    const { data: allPassageQuestions } = await supabase
      .from('practice_questions')
      .select('id, section, topic, question_text, passage, passage_id, options, correct_option, difficulty, explanation, tags, created_at')
      .eq('section', section)
      .not('passage_id', 'is', null);

    if (!allPassageQuestions || allPassageQuestions.length === 0) {
      return NextResponse.json({
        session_id: null,
        questions: [],
        needs_seeding: true,
      });
    }

    // Group by passage, newest passages first, questions within passage in created_at order
    const passageMap: Record<string, any[]> = {};
    for (const q of allPassageQuestions) {
      if (!passageMap[q.passage_id]) passageMap[q.passage_id] = [];
      passageMap[q.passage_id].push(q);
    }
    // Sort passages by newest question's created_at (descending)
    const sortedPassageIds = Object.keys(passageMap).sort((a, b) => {
      const maxA = Math.max(...passageMap[a].map(q => new Date(q.created_at).getTime()));
      const maxB = Math.max(...passageMap[b].map(q => new Date(q.created_at).getTime()));
      return maxB - maxA;
    });
    // Build ordered queue: all questions from passage A (in order), then passage B, etc.
    const orderedQueue: any[] = [];
    for (const pid of sortedPassageIds) {
      // Sort questions within each passage by created_at (oldest first = original order)
      passageMap[pid].sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      orderedQueue.push(...passageMap[pid]);
    }

    // Create session
    const sessionResult = await supabase
      .from('quiz_sessions')
      .insert({
        student_id: user.id,
        section,
        topic,
        questions_answered: 0,
        correct_count: 0,
      })
      .select('id')
      .single();

    if (sessionResult.error || !sessionResult.data) {
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    // Strip correct_option from client-bound questions
    const safeQueue = orderedQueue.map(({ correct_option, explanation, ...safe }) => ({
      ...safe,
      explanation: (() => {
        if (typeof explanation === 'string') {
          try { return JSON.parse(explanation); } catch { return explanation; }
        }
        return explanation;
      })(),
    }));

    return NextResponse.json({
      session_id: sessionResult.data.id,
      questions: safeQueue,
      total: safeQueue.length,
      daily_remaining: profile.subscription_plan === 'free'
        ? (profile.daily_free_questions ?? 10)
        : 'unlimited',
    });

  } catch (err) {
    console.error('Quiz start error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
