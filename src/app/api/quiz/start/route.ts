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

    // Parallel: fetch profile
    const [profileResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('daily_free_questions, last_practice_date, subscription_plan')
        .eq('id', user.id)
        .single(),
    ]);

    const profile = profileResult.data;
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
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

    // Fetch already-answered question IDs for this user+section (to skip completed passages)
    let answeredQuestionIds = new Set<string>();
    const { data: allSessions } = await supabase
      .from('quiz_sessions')
      .select('id')
      .eq('student_id', user.id)
      .eq('section', section);

    const existingSessionIds = (allSessions ?? []).map(s => s.id);
    if (existingSessionIds.length > 0) {
      const { data: answeredData } = await supabase
        .from('quiz_responses')
        .select('question_id')
        .in('session_id', existingSessionIds);
      answeredQuestionIds = new Set((answeredData ?? []).map(r => r.question_id));
    }

    // ── Fetch all passage-linked questions for passage-grouped queue ──
    const { data: allPassageQuestions } = await supabase
      .from('practice_questions')
      .select('id, section, topic, question_text, passage, passage_id, options, correct_option, difficulty, explanation, tags, created_at')
      .eq('section', section)
      .eq('validation_status', 'passed')
      .not('passage_id', 'is', null);

    if (!allPassageQuestions || allPassageQuestions.length === 0) {
      return NextResponse.json({
        session_id: null,
        questions: [],
        needs_seeding: true,
      });
    }

    // Get passage titles to deduplicate by title (avoid cron-regenerated duplicates)
    const passageIds = [...new Set(allPassageQuestions.map(q => q.passage_id))];
    const { data: passages } = await supabase
      .from('practice_passages')
      .select('id, title')
      .in('id', passageIds);

    const passageTitleMap: Record<string, string> = {};
    if (passages) {
      for (const p of passages) {
        passageTitleMap[p.id] = p.title;
      }
    }

    // Group by passage, keep only the newest passage per unique (section, title)
    const tempMap: Record<string, any[]> = {};
    const titleFirstSeen: Record<string, string> = {}; // title -> first passage_id we saw
    for (const q of allPassageQuestions) {
      if (!tempMap[q.passage_id]) tempMap[q.passage_id] = [];
      tempMap[q.passage_id].push(q);
    }

    // Sort passages by newest question's created_at (descending)
    const sortedByNewest = Object.keys(tempMap).sort((a, b) => {
      const maxA = Math.max(...tempMap[a].map(q => new Date(q.created_at).getTime()));
      const maxB = Math.max(...tempMap[b].map(q => new Date(q.created_at).getTime()));
      return maxB - maxA;
    });

    // Deduplicate: keep only the first (newest) passage per unique title
    const keptPassageIds = new Set<string>();
    for (const pid of sortedByNewest) {
      const title = passageTitleMap[pid];
      if (!title) {
        keptPassageIds.add(pid); // no title info, keep it
        continue;
      }
      if (!titleFirstSeen[title]) {
        titleFirstSeen[title] = pid;
        keptPassageIds.add(pid);
      }
      // else: duplicate title, skip this older passage
    }

    // Build final passage map with only kept passages, exclude fully-answered passages
    const passageMap: Record<string, any[]> = {};
    for (const [pid, qs] of Object.entries(tempMap)) {
      if (!keptPassageIds.has(pid)) continue;
      // Exclude passage only if ALL its questions have been answered
      const unanswered = qs.filter((q: any) => !answeredQuestionIds.has(q.id));
      if (unanswered.length > 0) {
        passageMap[pid] = unanswered;
      }
    }

    // Sort kept passages by newest created_at (descending)
    const sortedKeptIds = Object.keys(passageMap).sort((a, b) => {
      const maxA = Math.max(...passageMap[a].map(q => new Date(q.created_at).getTime()));
      const maxB = Math.max(...passageMap[b].map(q => new Date(q.created_at).getTime()));
      return maxB - maxA;
    });

    // Build ordered queue with deterministic sort + dedup by text
    const orderedQueue: any[] = [];
    for (const pid of sortedKeptIds) {
      const sortedQ = [...passageMap[pid]].sort((a: any, b: any) => {
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        if (timeA === timeB) {
          return (a.question_number || 0) - (b.question_number || 0);
        }
        return timeA - timeB;
      });
      // Deduplicate by question text within passage (defensive — catches cron-generated near-duplicates)
      const seen = new Set<string>();
      for (const q of sortedQ) {
        const key = (q.question_text || '').trim().toLowerCase().slice(0, 100);
        if (seen.has(key)) continue;
        seen.add(key);
        orderedQueue.push(q);
      }
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

    // Return all questions with explanation parsed, keep correct_option for client-side checking
    const queue = orderedQueue.map(q => ({
      ...q,
      explanation: (() => {
        const raw = q.explanation;
        if (typeof raw === 'string') {
          try { return JSON.parse(raw); } catch { return raw; }
        }
        return raw;
      })(),
    }));

    return NextResponse.json({
      session_id: sessionResult.data.id,
      questions: queue,
      total: queue.length,
      daily_remaining: profile.subscription_plan === 'free'
        ? (profile.daily_free_questions ?? 10)
        : 'unlimited',
    });

  } catch (err) {
    console.error('Quiz start error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
