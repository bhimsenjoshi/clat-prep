'use client';

import { useEffect, useState, useMemo } from 'react';
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

interface AttemptWithMeta {
  id: string;
  test_id: string;
  test_title: string;
  attempt_number: number;
  started_at: string;
  submitted_at: string | null;
  total_score: number | null;
  section_scores: Record<string, number> | null;
  total_questions: number;
  answered_count: number;
  correct_count: number;
  total_time_seconds: number;
  section_time: Record<string, number>;
  section_totals: Record<string, number>;
}

export default function StudentDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [attempts, setAttempts] = useState<AttemptWithMeta[]>([]);
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

      // Fetch all attempts with test info
      const { data: rawAttempts } = await supabase
        .from('attempts')
        .select('*, tests(title)')
        .eq('student_id', user.id)
        .order('started_at', { ascending: false });

      if (!rawAttempts || rawAttempts.length === 0) {
        setLoading(false);
        return;
      }

      // Enrich each attempt with response stats
      const enriched: AttemptWithMeta[] = [];
      for (const a of rawAttempts as any[]) {
        const { data: responses } = await supabase
          .from('responses')
          .select('*')
          .eq('attempt_id', a.id);

        const respList = responses ?? [];
        const totalQuestions = respList.length;
        const answeredCount = respList.filter((r: any) => r.selected_option !== null).length;
        const correctCount = respList.filter((r: any) => r.is_correct === true).length;
        const totalTimeSeconds = respList.reduce((s: number, r: any) => s + (r.time_taken_seconds ?? 0), 0);

        // Calculate time per section by fetching question -> section mapping
        const qIds = respList.map((r: any) => r.question_id);
        const sectionTime: Record<string, number> = {};
        let sectionTotals: Record<string, number> = {};
        if (qIds.length > 0) {
          const { data: questions } = await supabase
            .from('questions')
            .select('id, section_id')
            .in('id', qIds);
          const qToSection = new Map((questions ?? []).map((q: any) => [q.id, q.section_id]));

          // Also fetch section names and total question counts per section
          const sectionIds = [...new Set((questions ?? []).map((q: any) => q.section_id))];
          const { data: secs } = await supabase
            .from('sections')
            .select('id, name')
            .in('id', sectionIds);

          // Get actual question count per section for this test
          const { data: allTestQuestions } = await supabase
            .from('questions')
            .select('section_id', { count: 'exact' })
            .in('section_id', sectionIds);

          const sectionNames = new Map((secs ?? []).map((s: any) => [s.id, s.name]));
          // Count questions per section from the fetched data
          const qCountBySection: Record<string, number> = {};
          for (const q of questions ?? []) {
            qCountBySection[q.section_id] = (qCountBySection[q.section_id] ?? 0) + 1;
          }
          // Get totals by fetching ALL questions for these sections (not just the answered ones)
          const { data: allQs } = await supabase
            .from('questions')
            .select('section_id')
            .in('section_id', sectionIds);
          for (const q of allQs ?? []) {
            const name = sectionNames.get(q.section_id) || q.section_id;
            sectionTotals[name] = (sectionTotals[name] ?? 0) + 1;
          }

          for (const r of respList) {
            const secId = qToSection.get(r.question_id);
            const secName = secId ? (sectionNames.get(secId) || secId) : 'Unknown';
            sectionTime[secName] = (sectionTime[secName] ?? 0) + (r.time_taken_seconds ?? 0);
          }
        }

        // Count attempts for this test
        const { count: attemptCount } = await supabase
          .from('attempts')
          .select('id', { count: 'exact', head: true })
          .eq('test_id', a.test_id)
          .eq('student_id', user.id);

        enriched.push({
          id: a.id,
          test_id: a.test_id,
          test_title: a.tests?.title ?? 'Unknown Test',
          attempt_number: attemptCount ?? 1,
          started_at: a.started_at,
          submitted_at: a.submitted_at,
          total_score: a.total_score,
          section_scores: a.section_scores,
          total_questions: totalQuestions,
          answered_count: answeredCount,
          correct_count: correctCount,
          total_time_seconds: totalTimeSeconds,
          section_time: sectionTime,
          section_totals: sectionTotals,
        });
      }

      setAttempts(enriched);
      setLoading(false);
    };
    loadDashboard();
  }, []);

  // Stats
  const completed = attempts.filter((a) => a.submitted_at);
  const inProgress = attempts.filter((a) => !a.submitted_at);
  const avgScore = completed.length
    ? Math.round(completed.reduce((s, a) => s + (a.total_score ?? 0), 0) / completed.length)
    : 0;
  const bestScore = completed.length ? Math.max(...completed.map((a) => a.total_score ?? 0)) : 0;

  // Unique tests
  const uniqueTests = useMemo(() => {
    const seen = new Set<string>();
    return attempts.filter((a) => {
      if (seen.has(a.test_id)) return false;
      seen.add(a.test_id);
      return true;
    });
  }, [attempts]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-pulse flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Loading dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50/30">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎯</span>
            <div>
              <h1 className="text-xl font-bold text-gray-900">My Dashboard</h1>
              <p className="text-xs text-gray-500">
                Welcome{profile?.full_name ? `, ${profile.full_name}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/student/leaderboard"
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
              🏆 Leaderboard
            </Link>
            <Link href="/student/quiz"
              className="px-4 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 transition shadow-sm">
              🎯 Practice
            </Link>
            <Link href="/student/tests"
              className="px-4 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition shadow-sm">
              + Available Tests
            </Link>
            <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 transition">
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Tests Completed', value: completed.length, icon: '✅', color: 'text-green-600' },
            { label: 'In Progress', value: inProgress.length, icon: '⏳', color: 'text-amber-600' },
            { label: 'Avg Score', value: `${avgScore}%`, icon: '📊', color: avgScore >= 70 ? 'text-green-600' : avgScore >= 40 ? 'text-amber-600' : 'text-red-600' },
            { label: 'Best Score', value: completed.length ? `${bestScore}%` : '-', icon: '🏆', color: 'text-indigo-600' },
            { label: 'Unique Tests', value: uniqueTests.length, icon: '📚', color: 'text-purple-600' },
          ].map((s) => (
            <div key={s.label} className="bg-white border rounded-xl p-4 shadow-sm hover:shadow transition">
              <div className="flex items-center justify-between mb-1">
                <span className="text-lg">{s.icon}</span>
                <span className={`text-2xl font-bold ${s.color}`}>{s.value}</span>
              </div>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ─── WhatsApp Integration Card ─── */}
        <WhatsAppCard userId={profile?.id} supabase={supabase} />

        {attempts.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-16 text-center">
            <div className="text-5xl mb-4">📭</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">No Test Attempts Yet</h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Start your CLAT preparation by taking your first practice test.
            </p>
            <Link href="/student/tests"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition shadow-sm">
              Browse Available Tests →
            </Link>
          </div>
        ) : (
          <>
            {/* Attempt history */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span>📋</span> Attempt History
                <span className="text-sm font-normal text-gray-400 ml-1">({attempts.length} total)</span>
              </h2>

              {attempts.map((a) => {
                const isCompleted = !!a.submitted_at;
                const pct = a.total_score ?? 0;
                return (
                  <div key={a.id} className={`bg-white border rounded-xl shadow-sm hover:shadow transition overflow-hidden ${
                    !isCompleted ? 'ring-1 ring-amber-200' : ''
                  }`}>
                    {/* Header */}
                    <div className={`px-5 py-3 flex items-center justify-between border-b ${
                      isCompleted ? 'bg-gray-50' : 'bg-amber-50'
                    }`}>
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                          isCompleted ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          #{a.attempt_number}
                        </span>
                        <div>
                          <p className="font-semibold text-gray-900">{a.test_title}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(a.started_at).toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                            {isCompleted && a.submitted_at && (
                              <>
                                <span className="mx-1.5">·</span>
                                Duration: {formatTime(
                                  Math.round((new Date(a.submitted_at).getTime() - new Date(a.started_at).getTime()) / 1000)
                                )}
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {isCompleted && (
                          <div className="text-right">
                            <p className={`text-xl font-bold ${
                              pct >= 70 ? 'text-green-600' : pct >= 40 ? 'text-amber-600' : 'text-red-600'
                            }`}>
                              {pct}%
                            </p>
                            <p className="text-[10px] text-gray-400">score</p>
                          </div>
                        )}
                        {!isCompleted && (
                          <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                            ⏳ In Progress
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stats grid */}
                    <div className="px-5 py-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                          <p className="text-lg font-bold text-gray-800">{a.answered_count}</p>
                          <p className="text-[10px] text-gray-500">Attempted</p>
                          <p className="text-[10px] text-gray-400">of {a.total_questions} total</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                          <p className="text-lg font-bold text-green-600">{a.correct_count}</p>
                          <p className="text-[10px] text-gray-500">Correct</p>
                          <p className="text-[10px] text-gray-400">
                            {a.answered_count > 0
                              ? `${Math.round((a.correct_count / a.answered_count) * 100)}% accuracy`
                              : '—'}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                          <p className="text-lg font-bold text-amber-600">{a.answered_count - a.correct_count}</p>
                          <p className="text-[10px] text-gray-500">Incorrect</p>
                          <p className="text-[10px] text-gray-400">{a.total_questions > 0 ? `${a.total_questions - a.answered_count} unanswered` : ''}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                          <p className="text-lg font-bold text-indigo-600">{formatTime(a.total_time_seconds)}</p>
                          <p className="text-[10px] text-gray-500">Total Time</p>
                          <p className="text-[10px] text-gray-400">
                            {a.answered_count > 0
                              ? `${Math.round(a.total_time_seconds / a.answered_count)}s per question`
                              : '—'}
                          </p>
                        </div>
                      </div>

                      {/* Section breakdown */}
                      {isCompleted && a.section_scores && (
                        <div className="mb-4">
                          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Section Breakdown
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                            {SECTION_NAMES.map((name) => {
                              const correct = a.section_scores?.[name] ?? 0;
                              const total = a.section_totals[name] ?? Math.round(a.total_questions / 5);
                              const time = a.section_time[name] ?? 0;
                              return (
                                <div key={name} className="bg-white border border-gray-100 rounded-lg p-2.5">
                                  <p className="text-[10px] font-semibold text-gray-500 truncate">{name}</p>
                                  <p className="text-sm font-bold text-gray-800">{correct}<span className="text-xs font-normal text-gray-400">/{total}</span></p>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                      <div className={`h-full rounded-full ${
                                        total > 0 && (correct / total) >= 0.7 ? 'bg-green-500' :
                                        total > 0 && (correct / total) >= 0.4 ? 'bg-amber-500' : 'bg-red-500'
                                      }`} style={{ width: `${total > 0 ? (correct / total) * 100 : 0}%` }} />
                                    </div>
                                    <span className="text-[9px] text-gray-400">{time > 0 ? `${Math.round(time / 60)}m` : '-'}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                        {isCompleted && (
                          <Link href={`/student/tests/${a.test_id}/review?attempt=${a.id}`}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition">
                            📝 Review Paper
                          </Link>
                        )}
                        {isCompleted && (
                          <Link href={`/student/tests/${a.test_id}`}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 transition">
                            🔄 Retake Test
                          </Link>
                        )}
                        {!isCompleted && (
                          <Link href={`/student/tests/${a.test_id}`}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 transition">
                            ▶️ Resume Test
                          </Link>
                        )}
                        <span className="ml-auto text-[10px] text-gray-400">
                          Attempt #{a.attempt_number}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Section-wise aggregate performance */}
            {completed.length > 0 && (
              <div className="bg-white border rounded-xl shadow-sm">
                <div className="px-6 py-4 border-b">
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                    <span>📈</span> Section Performance (across all attempts)
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  {(() => {
                    const sectionAggs = SECTION_NAMES.map((name) => {
                      const scores = completed
                        .map((a) => a.section_scores?.[name])
                        .filter((s): s is number => s !== undefined && s !== null);
                      const times = SECTION_NAMES.map((n) =>
                        completed.map((a) => a.section_time[n] ?? 0).reduce((s, t) => s + t, 0)
                      );
                      const totalTime = times.reduce((s, t) => s + t, 0);
                      const avg = scores.length ? Math.round(scores.reduce((s, c) => s + c, 0) / scores.length) : 0;
                      const max = scores.length ? Math.max(...scores) : 0;
                      const avgTime = scores.length
                        ? Math.round(completed
                            .map((a) => a.section_time[name] ?? 0)
                            .filter((t) => t > 0)
                            .reduce((s, t) => s + t, 0) / completed.filter((a) => (a.section_time[name] ?? 0) > 0).length)
                        : 0;
                      return { name, avg, max, count: scores.length, avgTime };
                    });

                    const maxAvg = Math.max(...sectionAggs.map((s) => s.avg), 1);

                    return sectionAggs.map((s) => {
                      // Get typical total for this section from latest attempt
                      const latestWithTotal = completed.find((a) => a.section_totals?.[s.name]);
                      const sectionTotal = latestWithTotal?.section_totals?.[s.name] ?? 10;
                      const pct = sectionTotal > 0 ? (s.avg / sectionTotal) * 100 : 0;
                      return (
                        <div key={s.name}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-medium text-gray-800">{s.name}</span>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span className="font-semibold text-indigo-600">{s.avg}<span className="text-gray-400 font-normal">/{sectionTotal} avg</span></span>
                              <span className="font-semibold text-green-600">{s.max}<span className="text-gray-400 font-normal"> max</span></span>
                              {s.avgTime > 0 && <span>{Math.round(s.avgTime / 60)}m avg</span>}
                            </div>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2.5">
                            <div
                              className={`h-2.5 rounded-full transition-all ${
                                pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── WhatsApp Card Component ───

function WhatsAppCard({ supabase }: { supabase: any; userId?: string }) {
  const [phone, setPhone] = useState('');
  const [registered, setRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ ok?: boolean; msg: string } | null>(null);
  const businessPhone = process.env.NEXT_PUBLIC_WHATSAPP_BUSINESS_PHONE ?? '';

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/api/whatsapp/register');
        if (!res.ok) { setLoading(false); return; }
        const data = await res.json();
        if (data.registered) {
          setRegistered(true);
          setPhone(data.phone ?? '');
        }
      } catch {}
      setLoading(false);
    };
    check();
  }, []);

  const registerPhone = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch('/api/whatsapp/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (res.ok) {
        setRegistered(true);
        setStatus({ ok: true, msg: data.message ?? 'Registered! Check your WhatsApp 📱' });
      } else {
        setStatus({ ok: false, msg: data.error ?? 'Failed to register' });
      }
    } catch {
      setStatus({ ok: false, msg: 'Network error' });
    }
    setSaving(false);
  };

  if (loading) return null;

  return (
    <div className="bg-white border rounded-xl p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">📱</span>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">WhatsApp Updates</h3>
            <p className="text-xs text-gray-500">Get quiz results &amp; daily practice summaries on WhatsApp</p>
          </div>
        </div>
        {registered && (
          <span className="text-[10px] font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">ACTIVE</span>
        )}
      </div>

      {registered ? (
        <div className="space-y-3">
          <div className="text-sm text-gray-600">
            ✅ Receiving updates on <span className="font-mono text-gray-800">{phone?.replace(/^91/, '+91 ')}</span>
          </div>
          {businessPhone && (
            <a
              href={`https://wa.me/${businessPhone}?text=${encodeURIComponent('start english')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition"
            >
              📱 Start Quiz on WhatsApp →
            </a>
          )}
          <p className="text-xs text-gray-400">Reply STOP to opt out anytime</p>
        </div>
      ) : (
        <div className="space-y-3">
          <input
            type="tel"
            placeholder="Enter your 10-digit mobile number"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <button
            onClick={registerPhone}
            disabled={saving || phone.length !== 10}
            className="w-full py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Registering...' : '🔔 Get Updates on WhatsApp'}
          </button>
          {status && (
            <p className={`text-xs ${status.ok ? 'text-green-600' : 'text-red-500'}`}>
              {status.msg}
            </p>
          )}
          <p className="text-[10px] text-gray-400">Free tier — no spam, only your practice results</p>
        </div>
      )}
    </div>
  );
}
