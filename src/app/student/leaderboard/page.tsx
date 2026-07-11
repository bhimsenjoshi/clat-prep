'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';

export default function LeaderboardPage() {
  const [ranked, setRanked] = useState<{ rank: number; name: string; score: number }[]>([]);
  const [tests, setTests] = useState<{ id: string; title: string }[]>([]);
  const [perTestLeaderboards, setPerTestLeaderboards] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const loadData = async () => {
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

      const rankedData = Array.from(bestPerStudent.entries())
        .sort((a, b) => b[1].score - a[1].score)
        .slice(0, 50)
        .map(([_, v], i) => ({ rank: i + 1, ...v }));
      setRanked(rankedData);

      // Per-test leaderboards — use the view
      const { data: testsData } = await supabase
        .from('tests')
        .select('id, title')
        .eq('status', 'published')
        .order('created_at', { ascending: false });
      setTests(testsData ?? []);

      // Pre-fetch top 5 per test
      const leaderboards: Record<string, any[]> = {};
      if (testsData) {
        for (const test of testsData) {
          const { data: ranks } = await supabase
            .from('leaderboard')
            .select('*')
            .eq('test_id', test.id)
            .order('test_rank')
            .limit(5);
          leaderboards[test.id] = ranks ?? [];
        }
      }
      setPerTestLeaderboards(leaderboards);
      setLoading(false);
    };
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-page text-primary">
      <PageHeader title="Leaderboard" navItems={[{ href: '/student/dashboard', label: 'Dashboard', icon: '📊' }]} />

      {loading ? (
        <div className="max-w-4xl mx-auto px-4 py-16 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <main className="max-w-4xl mx-auto px-4 py-8">
          {/* All-time leaderboard */}
          <div className="bg-card border border-theme shadow-theme-sm mb-8">
            <div className="px-6 py-4 border-b border-theme">
              <h2 className="font-semibold text-primary">All-Time Rankings</h2>
            </div>
            {ranked.length === 0 ? (
              <div className="p-6 text-center text-muted">No tests completed yet.</div>
            ) : (
              <div className="divide-y divide-theme">
                {ranked.map((entry) => (
                  <div key={entry.rank} className="px-6 py-3.5 flex items-center gap-4">
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        entry.rank === 1
                          ? 'bg-warning/10 text-warning'
                          : entry.rank === 2
                          ? 'bg-elevated text-secondary'
                          : entry.rank === 3
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-elevated text-secondary'
                      }`}
                    >
                      {entry.rank}
                    </span>
                    <span className="flex-1 font-medium text-primary">{entry.name}</span>
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
              <div className="divide-y divide-theme">
                {tests.map((test) => {
                  const ranks = perTestLeaderboards[test.id] ?? [];
                  return (
                    <div key={test.id} className="px-6 py-4">
                      <h3 className="font-medium text-sm mb-2 text-primary">{test.title}</h3>
                      {ranks.length === 0 ? (
                        <p className="text-xs text-muted">No submissions yet.</p>
                      ) : (
                        <div className="flex flex-wrap gap-4 text-xs text-secondary">
                          {ranks.map((r: any) => (
                            <span key={r.full_name + r.test_rank} className="bg-elevated rounded-full px-3 py-1 text-primary">
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
        </main>
      )}
    </div>
  );
}
