'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Profile } from '@/types';

const SECTIONS = [
  { id: 'English', label: 'English', icon: '📖', color: 'indigo', desc: 'Reading comprehension' },
  { id: 'Current Affairs', label: 'Current Affairs', icon: '📰', color: 'emerald', desc: 'GK & news' },
  { id: 'Legal Reasoning', label: 'Legal Reasoning', icon: '⚖️', color: 'amber', desc: 'Legal principles' },
  { id: 'Logical Reasoning', label: 'Logical Reasoning', icon: '🧠', color: 'purple', desc: 'Critical thinking' },
  { id: 'Quantitative Techniques', label: 'Quantitative Techniques', icon: '📊', color: 'rose', desc: 'Data & math' },
] as const;

interface AttemptWithMeta {
  id: string;
  test_id: string;
  test_title: string;
  attempt_number: number;
  started_at: string;
  submitted_at: string | null;
  total_score: number | null;
  answered_count: number;
  correct_count: number;
  total_questions: number;
}

export default function StudentDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [attempts, setAttempts] = useState<AttemptWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

      // Fetch recent attempts (limited, no heavy enrichment)
      const { data: rawAttempts } = await supabase
        .from('attempts')
        .select('*, tests(title)')
        .eq('student_id', user.id)
        .order('started_at', { ascending: false })
        .limit(20);

      if (!rawAttempts || rawAttempts.length === 0) {
        setLoading(false);
        return;
      }

      // Quick stats only — no heavy section breakdown
      const enriched: AttemptWithMeta[] = (rawAttempts as any[]).map(a => ({
        id: a.id,
        test_id: a.test_id,
        test_title: a.tests?.title ?? 'Practice Test',
        attempt_number: a.attempt_number ?? 1,
        started_at: a.started_at,
        submitted_at: a.submitted_at,
        total_score: a.total_score,
        answered_count: 0,
        correct_count: 0,
        total_questions: 0,
      }));

      // Fetch response counts for each attempt (one batch per attempt, limit 20)
      for (const a of enriched) {
        const { data: responses } = await supabase
          .from('responses')
          .select('selected_option, is_correct')
          .eq('attempt_id', a.id);
        a.answered_count = (responses ?? []).filter(r => r.selected_option !== null).length;
        a.correct_count = (responses ?? []).filter(r => r.is_correct === true).length;
        a.total_questions = (responses ?? []).length;
      }

      setAttempts(enriched);
      setLoading(false);
    };
    loadDashboard();
  }, []);

  const completed = attempts.filter(a => a.submitted_at);
  const inProgress = attempts.filter(a => !a.submitted_at);
  const avgScore = completed.length
    ? Math.round(completed.reduce((s, a) => s + (a.total_score ?? 0), 0) / completed.length)
    : 0;
  const bestScore = completed.length ? Math.max(...completed.map(a => a.total_score ?? 0)) : 0;
  const uniqueTests = new Set(attempts.map(a => a.test_id)).size;

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m`;
    return `${seconds}s`;
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
      {/* ─── Responsive Header ─── */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Left: Logo + Greeting */}
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xl shrink-0">🎯</span>
            <div className="truncate">
              <h1 className="text-base font-bold text-gray-900 truncate">CLAT Prep</h1>
              <p className="text-[11px] text-gray-500 truncate">
                Welcome{profile?.full_name ? `, ${profile.full_name}` : ''} 👋
              </p>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-2">
            <Link href="/student/practice"
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 transition shadow-sm">
              🎯 Practice
            </Link>
            <Link href="/student/analytics"
              className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition">
              📊 Analytics
            </Link>
            <Link href="/student/leaderboard"
              className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition">
              🏆 Leaderboard
            </Link>
            <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
              className="px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-red-600 hover:bg-red-50 transition">
              Sign Out
            </button>
          </nav>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
            aria-label="Menu"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
            <Link href="/student/practice" onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-amber-50 to-orange-50 text-amber-800">
              🎯 Practice Questions
            </Link>
            <Link href="/student/analytics" onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              📊 Performance Analytics
            </Link>
            <Link href="/student/leaderboard" onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              🏆 Leaderboard
            </Link>
            <hr className="my-1 border-gray-100" />
            <button onClick={() => { setMobileMenuOpen(false); supabase.auth.signOut().then(() => router.push('/')); }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 w-full text-left">
              🚪 Sign Out
            </button>
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* ─── Quick Stats Row ─── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Completed', value: completed.length, icon: '✅', color: 'text-green-600' },
            { label: 'In Progress', value: inProgress.length, icon: '⏳', color: 'text-amber-600' },
            { label: 'Avg Score', value: completed.length ? `${avgScore}%` : '—', icon: '📊', color: avgScore >= 70 ? 'text-green-600' : avgScore >= 40 ? 'text-amber-600' : 'text-red-600' },
            { label: 'Best Score', value: completed.length ? `${bestScore}%` : '—', icon: '🏆', color: 'text-indigo-600' },
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

        {/* ─── Quick Practice Section Cards ─── */}
        <div>
          <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <span>⚡</span> Quick Practice
            {profile?.subscription_plan === 'free' && profile?.daily_free_questions !== undefined && (
              <span className="text-xs font-normal text-gray-400 ml-auto">
                {profile.daily_free_questions} free questions remaining
              </span>
            )}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
            {SECTIONS.map(s => (
              <Link
                key={s.id}
                href={`/student/practice`}
                onClick={() => sessionStorage.setItem('practiceSection', s.id)}
                className="bg-white border rounded-xl p-3.5 hover:shadow-md hover:border-gray-300 transition text-center group"
              >
                <span className="text-xl block mb-1 group-hover:scale-110 transition-transform">{s.icon}</span>
                <p className="text-xs font-semibold text-gray-800 truncate">{s.label}</p>
                <p className="text-[10px] text-gray-400 truncate">{s.desc}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* ─── Recent Attempts ─── */}
        {attempts.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
            <div className="text-4xl mb-3">📭</div>
            <h2 className="text-lg font-bold text-gray-800 mb-1">No Practice Yet</h2>
            <p className="text-sm text-gray-500 mb-5 max-w-sm mx-auto">
              Pick a section above and start practicing with instant feedback!
            </p>
            <Link href="/student/practice"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition shadow-sm">
              🎯 Start Practicing
            </Link>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <span>📋</span> Recent Attempts
                <span className="text-xs font-normal text-gray-400">({attempts.length})</span>
              </h2>
              {completed.length > 0 && (
                <Link href="/student/analytics" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                  View Analytics →
                </Link>
              )}
            </div>

            <div className="space-y-2.5">
              {attempts.slice(0, 10).map(a => {
                const done = !!a.submitted_at;
                const pct = a.total_score ?? 0;
                return (
                  <div key={a.id} className={`bg-white border rounded-xl shadow-sm overflow-hidden ${
                    !done ? 'ring-1 ring-amber-200' : ''
                  }`}>
                    <div className="px-4 py-3 flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                        done ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        #{a.attempt_number}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">{a.test_title}</p>
                        <p className="text-[10px] text-gray-500">
                          {new Date(a.started_at).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short'
                          })}
                          {done && a.submitted_at && (
                            <> · {formatTime(Math.round((new Date(a.submitted_at).getTime() - new Date(a.started_at).getTime()) / 1000))}</>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {done ? (
                          <>
                            <span className={`text-sm font-bold ${
                              pct >= 70 ? 'text-green-600' : pct >= 40 ? 'text-amber-600' : 'text-red-600'
                            }`}>{pct}%</span>
                            <Link href={`/student/tests/${a.test_id}/review?attempt=${a.id}`}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition">
                              Review
                            </Link>
                          </>
                        ) : (
                          <>
                            <span className="text-[10px] font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                              ⏳ In Progress
                            </span>
                            <Link href={`/student/tests/${a.test_id}`}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 transition">
                              Resume
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
