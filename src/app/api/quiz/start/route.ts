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
      'English', 'Current Affairs', 'Legal Reasoning',
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
        .select('id')
        .eq('section', section),
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
      // If all exhausted, keep all IDs (start a fresh cycle)
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

    if (questionIds.length === 0) {
      return NextResponse.json({
        session_id: null,
        question: null,
        needs_seeding: true,
      });
    }

    // Pick a random first question
    const firstId = questionIds[Math.floor(Math.random() * questionIds.length)];

    // Fetch first question + create session in parallel
    const [questionResult, sessionResult] = await Promise.all([
      supabase
        .from('practice_questions')
        .select('id, section, topic, question_text, passage, options, correct_option, difficulty, explanation, tags')
        .eq('id', firstId)
        .single(),
      supabase
        .from('quiz_sessions')
        .insert({
          student_id: user.id,
          section,
          topic,
          questions_answered: 0,
          correct_count: 0,
        })
        .select('id')
        .single(),
    ]);

    if (sessionResult.error || !sessionResult.data) {
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    return NextResponse.json({
      session_id: sessionResult.data.id,
      question: questionResult.data,
      question_ids: questionIds, // Client uses this for fast PK-based next-question lookup
      daily_remaining: profile.subscription_plan === 'free'
        ? (profile.daily_free_questions ?? 10)
        : 'unlimited',
    });

  } catch (err) {
    console.error('Quiz start error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
