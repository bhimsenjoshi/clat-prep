import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/supabase/server';
import type { SectionName } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { section, topic = 'general' } = await req.json() as {
      section: SectionName;
      topic?: string;
    };

    // Validate section
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

    // Check daily free limit
    const { data: profile } = await supabase
      .from('profiles')
      .select('daily_free_questions, last_practice_date, subscription_plan')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Reset daily count if new day
    if (profile.last_practice_date !== today) {
      await supabase
        .from('profiles')
        .update({ daily_free_questions: 10, last_practice_date: today })
        .eq('id', user.id);
    }

    // Check limit (free users only)
    if (profile.subscription_plan === 'free' && (profile.daily_free_questions ?? 10) <= 0) {
      return NextResponse.json({
        error: 'Daily free limit reached',
        code: 'DAILY_LIMIT_REACHED',
        message: 'You\'ve used all 10 free questions today. Upgrade to premium for unlimited!',
      }, { status: 403 });
    }

    // Create a new quiz session
    const { data: session, error: sessionError } = await supabase
      .from('quiz_sessions')
      .insert({
        student_id: user.id,
        section,
        topic,
      })
      .select()
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    // Fetch first question
    const { data: question } = await supabase
      .from('practice_questions')
      .select('*')
      .eq('section', section)
      .limit(1)
      .maybeSingle();

    if (!question) {
      // No questions seeded yet — return empty state
      return NextResponse.json({
        session_id: session.id,
        question: null,
        needs_seeding: true,
      });
    }

    // Remove correct answer from response (only show after they answer)
    const { correct_option, ...safeQuestion } = question;

    // Re-fetch profile to get latest daily count (reset may have happened)
    const { data: freshProfile } = await supabase
      .from('profiles')
      .select('daily_free_questions, subscription_plan')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      session_id: session.id,
      question: safeQuestion,
      daily_remaining: freshProfile?.subscription_plan === 'free'
        ? (freshProfile?.daily_free_questions ?? 10)
        : 'unlimited',
    });

  } catch (err) {
    console.error('Quiz start error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
