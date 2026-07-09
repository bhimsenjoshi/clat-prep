'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const SECTION_NAMES = [
  'English', 'Current Affairs', 'Legal Reasoning',
  'Logical Reasoning', 'Quantitative Techniques',
] as const;

interface AttemptWithScores {
  id: string;
  test_id: string;
  test_title: string;
  attempt_number: number;
  submitted_at: string | null;
  total_score: number | null;
  section_scores: Record<string, number> | null;
  section_time: Record<string, number>;
  section_totals: Record<string, number>;
  answered_count: number;
  correct_count: number;
  total_time_seconds: number;
  started_at: string;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);
  const [attempts, setAttempts] = useState<AttemptWithScores[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(prof);

      const { data: rawAttempts } = await supabase
        .from('attempts')
        .select('*, tests(title)')
        .eq('student_id', user.id)
        .not('submitted_at', 'is', null)
        .order('started_at', { ascending: false });

      if (!rawAttempts || rawAttempts.length === 0) {
        setLoading(false);
        return;
      }

      const enriched: AttemptWithScores[] = [];
      for (const a of rawAttempts as any[]) {
        const { data: responses } = await supabase
          .from('responses')
          .select('*, questions!inner(section_id), sections!inner(name)')
          .eq('attempt_id', a.id);

        const rList = responses ?? [];
        const answered = rList.filter((r: any) => r.selected_option !== null).length;
        const correct = rList.filter((r: any) => r.is_correct === true).length;
        const totalTime = rList.reduce((s: number, r: any) => s + (r.time_taken_seconds ?? 0), 0);

        const sectionTime: Record<string, number> = {};
        const sectionCorrect: Record<string, number> = {};

        for (const r of rList) {
          const secName = r.questions?.section_id || 'Unknown';
          sectionTime[secName] = (sectionTime[secName] ?? 0) + (r.time_taken_seconds ?? 0);
          if (r.is_correct) sectionCorrect[secName] = (sectionCorrect[secName] ?? 0) + 1;
        }

        enriched.push({
          id: a.id,
          test_id: a.test_id,
          test_title: a.tests?.title ?? 'Practice Test',
          attempt_number: a.attempt_number ?? 1,
          submitted_at: a.submitted_at,
          total_score: a.total_score,
          section_scores: a.section_scores,
          section_time: sectionTime,
          section_totals: {},
          answered_count: answered,
          correct_count: correct,
          total_time_seconds: totalTime,
          started_at: a.started_at,
        });
      }

      setAttempts(enriched);
      setLoading(false);
    };
    load();
  }, []);

  const completed = attempts;
  const totalQuestions = completed.reduce((s, a) => s + a.answered_count, 0);
  const totalCorrect = completed.reduce((s, a) => s + a.correct_count, 0);
  const overallAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const avgScore = completed.length
    ? Math.round(completed.reduce((s, a) => s + (a.total_score ?? 0), 0) / completed.length)
    : 0;

  // Section aggregates
  const sectionAggs = SECTION_NAMES.map(name => {
    const scores = completed
      .map(a => a.section_scores?.[name])
      .filter((s): s is number => s !== undefined && s !== null);
    const avg = scores.length ? Math.round(scores.reduce((s, c) => s + c, 0) / scores.length) : 0;
    const max = scores.length ? Math.max(...scores) : 0;
    const totalTime = completed
      .map(a => a.section_time[name] ?? 0)
      .reduce((s, t) => s + t, 0);
    const attemptsWithSection = completed.filter(a => (a.section_time[name] ?? 0) > 0).length;
    return { name, avg, max, count: scores.length, totalTime, attemptsWithSection };
  });

  const maxAvg = Math.max(...sectionAggs.map(s => s.avg), 1);
  const bestSection = sectionAggs.reduce((best, s) => s.avg > (best?.avg ?? 0) ? s : best, sectionAggs[0]);
  const weakSection = sectionAggs.reduce((worst, s) => s.avg < (worst?.avg ?? Infinity) ? s : worst, sectionAggs[sectionAggs.length - 1]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50/30">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/student/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Dashboard</span>
          </Link>
          <h1 className="text-sm font-bold text-gray-900">📊 Performance Analytics</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {completed.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-16 text-center">
            <div className="text-5xl mb-4">📊</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">No Data Yet</h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Complete some practice tests to see your performance analytics here.
            </p>
            <Link href="/student/practice"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition shadow-sm">
              🎯 Start Practicing
            </Link>
          </div>
        ) : (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Tests Completed', value: completed.length, icon: '✅', color: 'text-green-600' },
                { label: 'Overall Accuracy', value: `${overallAccuracy}%`, icon: '🎯', color: overallAccuracy >= 70 ? 'text-green-600' : overallAccuracy >= 40 ? 'text-amber-600' : 'text-red-600' },
                { label: 'Avg Score', value: `${avgScore}%`, icon: '📊', color: avgScore >= 70 ? 'text-green-600' : avgScore >= 40 ? 'text-amber-600' : 'text-red-600' },
                { label: 'Total Q Answered', value: totalQuestions, icon: '📝', color: 'text-indigo-600' },
              ].map(s => (
                <div key={s.label} className="bg-white border rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-lg">{s.icon}</span>
                    <span className={`text-2xl font-bold ${s.color}`}>{s.value}</span>
                  </div>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Best / Weak Section Highlight */}
            {bestSection && weakSection && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-xs text-green-600 font-medium uppercase tracking-wider">✅ Strongest Section</p>
                  <p className="text-lg font-bold text-green-800 mt-1">{bestSection.name}</p>
                  <p className="text-sm text-green-600">Avg {bestSection.avg} · {bestSection.count} attempts</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-xs text-red-600 font-medium uppercase tracking-wider">🎯 Needs Focus</p>
                  <p className="text-lg font-bold text-red-800 mt-1">{weakSection.name}</p>
                  <p className="text-sm text-red-600">Avg {weakSection.avg} · {weakSection.count} attempts</p>
                </div>
              </div>
            )}

            {/* Section Performance */}
            <div className="bg-white border rounded-xl shadow-sm">
              <div className="px-6 py-4 border-b">
                <h2 className="font-semibold text-gray-900">📈 Section-wise Performance</h2>
              </div>
              <div className="p-6 space-y-5">
                {sectionAggs.map(s => {
                  // Estimate section total from last attempt that has it
                  const lastWithTotal = completed.find(a => a.section_scores?.[s.name] !== undefined);
                  const sectionTotal = lastWithTotal?.total_score
                    ? Math.round(lastWithTotal.total_score / 5) // estimate
                    : 10;
                  const pct = sectionTotal > 0 ? (s.avg / sectionTotal) * 100 : 0;
                  const avgTime = s.attemptsWithSection > 0
                    ? Math.round(s.totalTime / s.attemptsWithSection / 60)
                    : 0;

                  return (
                    <div key={s.name}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-gray-800">{s.name}</span>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="font-semibold text-indigo-600">{s.avg}<span className="text-gray-400 font-normal"> avg</span></span>
                          <span className="font-semibold text-green-600">{s.max}<span className="text-gray-400 font-normal"> best</span></span>
                          {avgTime > 0 && <span>{avgTime}m avg</span>}
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full transition-all ${
                            pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">{s.count} test{s.count !== 1 ? 's' : ''} attempted</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Attempt History */}
            <div className="bg-white border rounded-xl shadow-sm">
              <div className="px-6 py-4 border-b">
                <h2 className="font-semibold text-gray-900">📋 Attempt History</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {completed.slice(0, 20).map(a => (
                  <div key={a.id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50 transition">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {a.test_title}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        Attempt #{a.attempt_number} · {new Date(a.started_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className={`text-sm font-bold ${
                        (a.total_score ?? 0) >= 70 ? 'text-green-600' :
                        (a.total_score ?? 0) >= 40 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {a.total_score ?? '—'}%
                      </span>
                      <Link href={`/student/tests/${a.test_id}/review?attempt=${a.id}`}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                        Review →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
