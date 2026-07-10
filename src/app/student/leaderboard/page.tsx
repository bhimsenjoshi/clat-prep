import { createServerSupabaseClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function LeaderboardPage() {
  const supabase = await createServerSupabaseClient();

  // All-time: best score per student
  const { data: allTime } = await supabase
    .from('attempts')
    .select('student_id, total_score, profiles(full_name)')
    .not('submitted_at', 'is', null)
    .order('total_score', { ascending: false });

  const bestPerStudent = new Map<string, { name: string; score: number }>();
  (allTime ?? []).forEach((a: any) => {
    const existing = bestPerStudent.get(a.student_id);
    if (!existing || (a.total_score ?? 0) > existing.score) {
      bestPerStudent.set(a.student_id, {
        name: a.profiles?.full_name ?? 'Unknown',
        score: a.total_score ?? 0,
      });
    }
  });

  const ranked = Array.from(bestPerStudent.entries())
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 50)
    .map(([_, v], i) => ({ rank: i + 1, ...v }));

  // Per-test leaderboards — use the view
  const { data: tests } = await supabase
    .from('tests')
    .select('id, title')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  // Pre-fetch top 5 per test
  const perTestLeaderboards: Record<string, any[]> = {};
  if (tests) {
    for (const test of tests) {
      const { data: ranks } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('test_id', test.id)
        .order('test_rank')
        .limit(5);
      perTestLeaderboards[test.id] = ranks ?? [];
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <Link href="/student/dashboard" className="text-sm text-accent hover:underline">
          ← Dashboard
        </Link>
      </div>

      {/* All-time leaderboard */}
      <div className="bg-card border border-theme shadow-theme-sm mb-8">
        <div className="px-6 py-4 border-b border-theme">
          <h2 className="font-semibold text-primary">All-Time Rankings</h2>
        </div>
        {ranked.length === 0 ? (
          <div className="p-6 text-center text-muted">No tests completed yet.</div>
        ) : (
          <div className="divide-y">
            {ranked.map((entry) => (
              <div key={entry.rank} className="px-6 py-3.5 flex items-center gap-4">
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    entry.rank === 1
                      ? 'bg-yellow-100 text-yellow-700'
                      : entry.rank === 2
                      ? 'bg-elevated text-secondary'
                      : entry.rank === 3
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-elevated text-secondary'
                  }`}
                >
                  {entry.rank}
                </span>
                <span className="flex-1 font-medium">{entry.name}</span>
                <span className="text-accent font-bold">{entry.score}%</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Per-test leaderboards */}
      <div className="bg-card border border-theme shadow-theme-sm">
        <div className="px-6 py-4 border-b border-theme">
          <h2 className="font-semibold text-primary">Per-Test Rankings</h2>
        </div>
        {!tests || tests.length === 0 ? (
          <div className="p-6 text-center text-muted">No published tests.</div>
        ) : (
          <div className="divide-y">
            {tests.map((test) => {
              const ranks = perTestLeaderboards[test.id] ?? [];
              return (
                <div key={test.id} className="px-6 py-4">
                  <h3 className="font-medium text-sm mb-2">{test.title}</h3>
                  {ranks.length === 0 ? (
                    <p className="text-xs text-muted">No submissions yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-4 text-xs text-secondary">
                      {ranks.map((r: any) => (
                        <span key={r.full_name + r.test_rank} className="bg-elevated rounded-full px-3 py-1">
                          <strong>#{r.test_rank}</strong> {r.full_name} ({r.total_score}%)
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
