import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { user, supabase } = await getServerUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { action, source_id, article_url, article_title, correct, total } = await req.json();

    if (!action || !source_id || !article_url || !article_title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (action === 'read') {
      // Upsert: mark as read
      const { data: existing } = await supabase
        .from('editorial_activity')
        .select('id')
        .eq('student_id', user.id)
        .eq('article_url', article_url)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('editorial_activity')
          .update({ read_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('editorial_activity')
          .insert({
            student_id: user.id,
            source_id,
            article_url,
            article_title,
            read_at: new Date().toISOString(),
          });
      }

      return NextResponse.json({ success: true, action: 'read' });
    }

    if (action === 'quiz') {
      // Upsert: update quiz scores
      const { data: existing } = await supabase
        .from('editorial_activity')
        .select('id, quiz_correct, quiz_total, read_at')
        .eq('student_id', user.id)
        .eq('article_url', article_url)
        .maybeSingle();

      const now = new Date().toISOString();

      if (existing) {
        await supabase
          .from('editorial_activity')
          .update({
            quiz_correct: (existing.quiz_correct || 0) + (correct || 0),
            quiz_total: (existing.quiz_total || 0) + (total || 0),
            last_quiz_at: now,
            read_at: existing.read_at || now, // also mark read if not already
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('editorial_activity')
          .insert({
            student_id: user.id,
            source_id,
            article_url,
            article_title,
            read_at: now,
            last_quiz_at: now,
            quiz_correct: correct || 0,
            quiz_total: total || 0,
          });
      }

      return NextResponse.json({ success: true, action: 'quiz', correct, total });
    }

    return NextResponse.json({ error: 'Invalid action. Use "read" or "quiz".' }, { status: 400 });
  } catch (err: any) {
    console.error('Editorial activity error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper: get IST date string from a UTC date value
const toISTDate = (dateVal: string | null): string | null => {
  if (!dateVal) return null;
  const d = new Date(dateVal);
  // IST is UTC+5:30
  const istOffset = 5.5 * 60 * 60 * 1000;
  return new Date(d.getTime() + istOffset).toISOString().split('T')[0];
};

export async function GET(req: NextRequest) {
  try {
    const { user, supabase } = await getServerUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Log user for debugging editorial stats issue
    console.log('[editorial/activity] GET for user:', user.id.slice(0, 8), user.email);

    const { data: activities, error } = await supabase
      .from('editorial_activity')
      .select('*')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Compute stats
    const totalRead = activities.length;
    const uniqueSources = new Set(activities.map(a => a.source_id)).size;
    const totalQuizCorrect = activities.reduce((s, a) => s + (a.quiz_correct || 0), 0);
    const totalQuizTotal = activities.reduce((s, a) => s + (a.quiz_total || 0), 0);
    const quizAccuracy = totalQuizTotal > 0 ? Math.round((totalQuizCorrect / totalQuizTotal) * 100) : 0;
    const quizedArticles = activities.filter(a => (a.quiz_total || 0) > 0).length;

    // Compute streak (consecutive days with read_at)
    const readDates = activities
      .filter(a => a.read_at)
      .map(a => toISTDate(a.read_at)!)
      .filter((v, i, arr) => arr.indexOf(v) === i) // unique dates
      .sort()
      .reverse();

    let streak = 0;
    const today = toISTDate(new Date().toISOString())!;
    const yesterday = toISTDate(new Date(Date.now() - 86400000).toISOString())!;
    if (readDates[0] === today || readDates[0] === yesterday) {
      streak = 1;
      for (let i = 1; i < readDates.length; i++) {
        const prev = new Date(readDates[i - 1]);
        const curr = new Date(readDates[i]);
        const diff = (prev.getTime() - curr.getTime()) / 86400000;
        if (Math.round(diff) === 1) streak++;
        else break;
      }
    }

    // Extract topics from article titles (simple keyword extraction)
    const topicKeywords = ['polity', 'economy', 'environment', 'international', 'legal', 'supreme court', 'health', 'education', 'technology', 'sports', 'science'];
    const topics = new Set<string>();
    for (const a of activities) {
      const lower = a.article_title.toLowerCase();
      for (const kw of topicKeywords) {
        if (lower.includes(kw)) topics.add(kw.charAt(0).toUpperCase() + kw.slice(1));
      }
    }

    // Compute daily read counts for last 30 days (line chart data)
    const dailyReadMap: Record<string, number> = {};
    for (const a of activities) {
      if (a.read_at) {
        const day = toISTDate(a.read_at);
        if (day) dailyReadMap[day] = (dailyReadMap[day] || 0) + 1;
      }
    }
    const dailyReadData: { date: string; reads: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      // Use IST-based dates for the x-axis labels
      const istNow = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
      istNow.setDate(istNow.getDate() - i);
      const key = istNow.toISOString().split('T')[0];
      dailyReadData.push({ date: key, reads: dailyReadMap[key] || 0 });
    }

    return NextResponse.json({
      activities,
      stats: {
        totalRead,
        uniqueSources,
        totalQuizCorrect,
        totalQuizTotal,
        quizAccuracy,
        quizedArticles,
        streak,
        topics: [...topics],
      },
      dailyReadData,
    });
  } catch (err: any) {
    console.error('Editorial activity GET error:', err);

    // If table doesn't exist, return empty stats gracefully
    if (err.code === '42P01') {
      return NextResponse.json({
        activities: [],
        stats: { totalRead: 0, uniqueSources: 0, totalQuizCorrect: 0, totalQuizTotal: 0, quizAccuracy: 0, quizedArticles: 0, streak: 0, topics: [] },
      });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
