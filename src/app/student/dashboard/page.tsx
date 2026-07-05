'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Profile } from '@/types';

const SECTION_NAMES = [
  'English',
  'Current Affairs',
  'Legal Reasoning',
  'Logical Reasoning',
  'Quantitative Techniques',
] as const;

export default function StudentDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const loadDashboard = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(prof);

      const { data: allAttempts } = await supabase
        .from('attempts')
        .select('*, tests(title)')
        .eq('student_id', user.id)
        .order('started_at', { ascending: false });

      if (allAttempts) {
        setAttempts(
          (allAttempts as any[]).map((a) => ({
            ...a,
            test_title: a.tests?.title ?? 'Unknown',
          }))
        );
      }

      setLoading(false);
    };
    loadDashboard();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  const completed = attempts.filter((a) => a.submitted_at);
  const avgScore = completed.length
    ? Math.round(completed.reduce((s, a) => s + (a.total_score ?? 0), 0) / completed.length)
    : 0;
  const bestScore = completed.length ? Math.max(...completed.map((a) => a.total_score ?? 0)) : 0;
  const worstScore = completed.length ? Math.min(...completed.map((a) => a.total_score ?? 0)) : 0;

  // Section-wise stats
  const sectionStats = SECTION_NAMES.map((name) => {
    const scores = completed
      .map((a) => a.section_scores?.[name])
      .filter((s) => s !== undefined && s !== null);
    const avg = scores.length ? Math.round(scores.reduce((s, c) => s + c, 0) / scores.length) : 0;
    const max = scores.length ? Math.max(...scores) : 0;
    return { name, avg, max, count: scores.length };
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Welcome{profile?.full_name ? `, ${profile.full_name}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/student/leaderboard" className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-100 transition">
            🏆 Leaderboard
          </Link>
          <Link href="/student/tests" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
            Available Tests
          </Link>
          <button
            onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
            className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-100 transition"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Tests Taken', value: completed.length },
          { label: 'Avg Score', value: `${avgScore}%`, color: avgScore >= 70 ? 'text-green-600' : avgScore >= 40 ? 'text-yellow-600' : 'text-red-600' },
          { label: 'Best Score', value: completed.length ? `${bestScore}%` : '-', color: 'text-green-600' },
          { label: 'Worst Score', value: completed.length ? `${worstScore}%` : '-', color: worstScore >= 40 ? 'text-yellow-600' : 'text-red-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white border rounded-xl p-4 shadow-sm">
            <p className={`text-3xl font-bold ${s.color || 'text-indigo-600'}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Section-wise performance */}
      {completed.length > 0 && (
        <div className="bg-white border rounded-xl shadow-sm mb-6">
          <div className="px-6 py-4 border-b">
            <h2 className="font-semibold">Section-wise Performance (avg per test)</h2>
          </div>
          <div className="p-6 space-y-4">
            {sectionStats.map((s) => {
              const pct = s.avg / 10 * 100;
              return (
                <div key={s.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{s.name}</span>
                    <span className="text-gray-500">{s.avg}/10 avg · best {s.max}/10</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Score trend */}
      {completed.length > 1 && (
        <div className="bg-white border rounded-xl shadow-sm mb-6">
          <div className="px-6 py-4 border-b">
            <h2 className="font-semibold">Score Trend</h2>
          </div>
          <div className="p-6 overflow-x-auto">
            <div className="flex gap-3 min-w-max">
              {completed.reverse().map((a) => (
                <div key={a.id} className="text-center">
                  <div className="w-16 bg-indigo-100 rounded-t-lg flex items-end justify-center" style={{ height: '100px' }}>
                    <div
                      className="w-10 bg-indigo-500 rounded-t-lg"
                      style={{ height: `${a.total_score}%`, minHeight: '4px' }}
                    />
                  </div>
                  <p className="text-xs font-medium mt-1">{a.total_score}%</p>
                  <p className="text-[10px] text-gray-400">{new Date(a.started_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Attempt history */}
      <div className="bg-white border rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold">Attempt History</h2>
        </div>
        {attempts.length === 0 ? (
          <div className="p-6 text-center text-gray-400">
            <p className="mb-3">No test attempts yet.</p>
            <Link href="/student/tests" className="text-indigo-600 hover:underline text-sm">
              Take your first test →
            </Link>
          </div>
        ) : (
          <div className="divide-y">
            {attempts.map((a) => (
              <div key={a.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{a.test_title}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(a.started_at).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="text-right">
                  {a.submitted_at ? (
                    <div>
                      <span className={`font-bold ${(a.total_score ?? 0) >= 70 ? 'text-green-600' : (a.total_score ?? 0) >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {a.total_score}%
                      </span>
                      {a.section_scores && (
                        <div className="flex gap-1 mt-1">
                          {SECTION_NAMES.map((n) => (
                            <span key={n} className={`text-[10px] px-1 py-0.5 rounded ${
                              (a.section_scores?.[n] ?? 0) >= 7 ? 'bg-green-100 text-green-700' :
                              (a.section_scores?.[n] ?? 0) >= 4 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {n.slice(0, 4)}: {a.section_scores?.[n] ?? '-'}/10
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link href={`/student/tests/${a.test_id}`} className="text-indigo-600 text-sm font-medium hover:underline">
                      Resume →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
