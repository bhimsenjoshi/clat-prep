'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const SECTION_NAMES = [
  'English', 'Current Affairs', 'Legal Reasoning',
  'Logical Reasoning', 'Quantitative Techniques',
] as const;

const SECTION_ICONS: Record<string, string> = {
  'English': '📖',
  'Current Affairs': '📰',
  'Legal Reasoning': '⚖️',
  'Logical Reasoning': '🧠',
  'Quantitative Techniques': '📐',
};

// ─── Types ───
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

interface PracticeSession {
  id: string;
  section: string;
  questions_answered: number;
  correct_count: number;
  started_at: string;
  ended_at: string | null;
  avg_time_seconds: number;
}

interface SectionPracticeStats {
  name: string;
  icon: string;
  totalQuestions: number;
  correct: number;
  incorrect: number;
  accuracy: number;
  avgTimeSeconds: number;
  sessions: number;
}

// ─── Locked Section Overlay ───
function LockedSection({ children, title, icon, isPremium }: {
  children: React.ReactNode;
  title: string;
  icon: string;
  isPremium: boolean;
}) {
  if (isPremium) return <>{children}</>;

  return (
    <div className="relative bg-white border rounded-xl shadow-sm overflow-hidden">
      {/* Blurred preview of the actual content */}
      <div className="blur-sm pointer-events-none select-none opacity-40">
        {children}
      </div>
      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[2px] p-6">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 text-center max-w-sm shadow-lg">
          <div className="text-4xl mb-3">🔒</div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">{icon} {title}</h3>
          <p className="text-sm text-gray-600 mb-5">
            Unlock detailed analytics — section-wise breakdowns, time tracking, and session history.
          </p>
          <Link
            href="/student/profile"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 transition shadow-md shadow-amber-200"
          >
            ⭐ Upgrade to Premium
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);
  const [attempts, setAttempts] = useState<AttemptWithScores[]>([]);
  const [practiceSessions, setPracticeSessions] = useState<PracticeSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'practice' | 'tests'>('practice');

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(prof);

      // ─── Load Practice Quiz Data (quiz_sessions + quiz_responses) ───
      const { data: sessions } = await supabase
        .from('quiz_sessions')
        .select('*')
        .eq('student_id', user.id)
        .order('started_at', { ascending: false })
        .limit(100);

      if (sessions && sessions.length > 0) {
        const sessionIds = sessions.map((s: any) => s.id);

        // Fetch responses for all sessions in one go
        const { data: responses } = await supabase
          .from('quiz_responses')
          .select('session_id, is_correct, time_taken_seconds')
          .in('session_id', sessionIds);

        // Index responses by session
        const respBySession: Record<string, { correct: number; total: number; totalTime: number }> = {};
        for (const r of (responses ?? []) as any[]) {
          if (!respBySession[r.session_id]) {
            respBySession[r.session_id] = { correct: 0, total: 0, totalTime: 0 };
          }
          respBySession[r.session_id].total++;
          if (r.is_correct) respBySession[r.session_id].correct++;
          respBySession[r.session_id].totalTime += (r.time_taken_seconds ?? 0);
        }

        const enriched: PracticeSession[] = sessions
          .filter((s: any) => {
            const rs = respBySession[s.id];
            return rs && rs.total > 0; // skip abandoned sessions
          })
          .map((s: any) => {
          const rs = respBySession[s.id] || { correct: 0, total: 0, totalTime: 0 };
          return {
            id: s.id,
            section: s.section,
            questions_answered: rs.total || s.questions_answered,
            correct_count: rs.correct || s.correct_count,
            started_at: s.started_at,
            ended_at: s.ended_at,
            avg_time_seconds: rs.total > 0 ? Math.round(rs.totalTime / rs.total) : 0,
          };
        });

        setPracticeSessions(enriched);
      }

      // ─── Load Test Attempt Data ───
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

  // ─── Subscription check ───
  const isPremium = profile?.subscription_plan === 'premium'
    || profile?.subscription_plan === 'max'
    || profile?.is_promo_user === true;

  // ─── Compute Practice Analytics ───
  const totalPracticeQuestions = practiceSessions.reduce((s, p) => s + p.questions_answered, 0);
  const totalPracticeCorrect = practiceSessions.reduce((s, p) => s + p.correct_count, 0);
  const practiceAccuracy = totalPracticeQuestions > 0
    ? Math.round((totalPracticeCorrect / totalPracticeQuestions) * 100) : 0;
  const totalPracticeTime = practiceSessions.reduce((s, p) => s + (p.avg_time_seconds * p.questions_answered), 0);
  const avgPracticeTimePerQ = totalPracticeQuestions > 0
    ? Math.round(totalPracticeTime / totalPracticeQuestions) : 0;

  // Per-section practice stats
  const sectionPracticeStats: SectionPracticeStats[] = SECTION_NAMES.map(name => {
    const sSessions = practiceSessions.filter(p => p.section === name);
    const totalQ = sSessions.reduce((s, p) => s + p.questions_answered, 0);
    const correct = sSessions.reduce((s, p) => s + p.correct_count, 0);
    const totalTime = sSessions.reduce((s, p) => s + (p.avg_time_seconds * p.questions_answered), 0);
    return {
      name,
      icon: SECTION_ICONS[name] || '📝',
      totalQuestions: totalQ,
      correct,
      incorrect: totalQ - correct,
      accuracy: totalQ > 0 ? Math.round((correct / totalQ) * 100) : 0,
      avgTimeSeconds: totalQ > 0 ? Math.round(totalTime / totalQ) : 0,
      sessions: sSessions.length,
    };
  });

  // ─── Compute Test Analytics ───
  const completed = attempts;
  const totalQuestions = completed.reduce((s, a) => s + a.answered_count, 0);
  const totalCorrect = completed.reduce((s, a) => s + a.correct_count, 0);
  const overallAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const avgScore = completed.length
    ? Math.round(completed.reduce((s, a) => s + (a.total_score ?? 0), 0) / completed.length)
    : 0;

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

  const formatTime = (seconds: number) => {
    if (seconds >= 60) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
    </div>
  );

  const hasPracticeData = practiceSessions.length > 0;
  const hasTestData = completed.length > 0;

  // ─── Shared detailed content sections (used with LockedSection wrapper) ───

  const PracticeBySectionContent = (
    <div className="bg-white border rounded-xl shadow-sm">
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">📈 Practice by Section</h2>
        <span className="text-xs text-gray-400">Pass / Fail · Avg Time</span>
      </div>
      <div className="p-6 space-y-6">
        {sectionPracticeStats.map(s => (
          <div key={s.name}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{s.icon}</span>
                <span className="text-sm font-medium text-gray-800">{s.name}</span>
                <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                  {s.sessions} session{s.sessions !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="font-semibold text-green-600">{s.correct}<span className="text-gray-400 font-normal">✓</span></span>
                <span className="font-semibold text-red-500">{s.incorrect}<span className="text-gray-400 font-normal">✗</span></span>
                <span className={`font-semibold ${
                  s.accuracy >= 70 ? 'text-green-600' : s.accuracy >= 40 ? 'text-amber-600' : 'text-red-500'
                }`}>
                  {s.accuracy}%
                </span>
                {s.avgTimeSeconds > 0 && <span>⏱ {formatTime(s.avgTimeSeconds)}</span>}
              </div>
            </div>
            {/* Accuracy bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all ${
                    s.accuracy >= 70 ? 'bg-green-500' : s.accuracy >= 40 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(s.accuracy, 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-gray-400 w-16 text-right">
                {s.totalQuestions} Q
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const PracticeBestWeakContent = (
    (() => {
      const sorted = [...sectionPracticeStats].filter(s => s.totalQuestions > 0).sort((a, b) => b.accuracy - a.accuracy);
      const best = sorted[0];
      const worst = sorted[sorted.length - 1];
      if (!best || !worst) return null;
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-xs text-green-600 font-medium uppercase tracking-wider">✅ Strongest Section</p>
            <p className="text-lg font-bold text-green-800 mt-1">{best.icon} {best.name}</p>
            <p className="text-sm text-green-600">{best.accuracy}% accuracy · {best.totalQuestions} questions</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-xs text-red-600 font-medium uppercase tracking-wider">🎯 Needs Practice</p>
            <p className="text-lg font-bold text-red-800 mt-1">{worst.icon} {worst.name}</p>
            <p className="text-sm text-red-600">{worst.accuracy}% accuracy · {worst.totalQuestions} questions</p>
          </div>
        </div>
      );
    })()
  );

  const PracticeRecentContent = (
    <div className="bg-white border rounded-xl shadow-sm">
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">🔄 Recent Practice Sessions</h2>
        <Link href="/student/practice" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
          Practice Now →
        </Link>
      </div>
      <div className="divide-y divide-gray-100">
        {practiceSessions.slice(0, 20).map(s => {
          const pct = s.questions_answered > 0
            ? Math.round((s.correct_count / s.questions_answered) * 100) : 0;
          return (
            <div key={s.id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50 transition">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="text-lg shrink-0">{SECTION_ICONS[s.section] || '📝'}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{s.section}</p>
                  <p className="text-[10px] text-gray-500">
                    {new Date(s.started_at).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                    {s.avg_time_seconds > 0 && <> · ⏱ {formatTime(s.avg_time_seconds)}/q</>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className="text-xs text-gray-400">
                  {s.correct_count}/{s.questions_answered}
                </span>
                <span className={`text-sm font-bold ${
                  pct >= 70 ? 'text-green-600' : pct >= 40 ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const TestBestWeakContent = (
    bestSection && weakSection ? (
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
    ) : null
  );

  const TestSectionPerformanceContent = (
    <div className="bg-white border rounded-xl shadow-sm">
      <div className="px-6 py-4 border-b">
        <h2 className="font-semibold text-gray-900">📈 Section-wise Performance</h2>
      </div>
      <div className="p-6 space-y-5">
        {sectionAggs.map(s => {
          const pct = s.count > 0 ? Math.min((s.avg / 100) * 100, 100) : 0;
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
  );

  const TestHistoryContent = (
    <div className="bg-white border rounded-xl shadow-sm">
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">📋 Attempt History</h2>
        <Link href="/student/tests" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
          All Tests →
        </Link>
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
        {/* Premium status chip for free users */}
        {!isPremium && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">⭐</span>
              <p className="text-xs text-amber-800">
                <span className="font-semibold">Free plan</span> — upgrade for section-wise breakdowns, time tracking &amp; full history
              </p>
            </div>
            <Link href="/student/profile"
              className="text-xs font-bold text-amber-700 bg-amber-200/50 px-3 py-1.5 rounded-lg hover:bg-amber-200 transition shrink-0">
              Upgrade
            </Link>
          </div>
        )}

        {/* ─── Tab Switcher ─── */}
        <div className="flex gap-1 bg-white border rounded-xl p-1 shadow-sm">
          <button
            onClick={() => setActiveTab('practice')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'practice'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            🎯 Practice
          </button>
          <button
            onClick={() => setActiveTab('tests')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'tests'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            📝 Full Tests
          </button>
        </div>

        {/* ════════════════════════════════════════════ */}
        {/* PRACTICE TAB                                    */}
        {/* ════════════════════════════════════════════ */}
        {activeTab === 'practice' && (
          <>
            {!hasPracticeData ? (
              <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-16 text-center">
                <div className="text-5xl mb-4">🎯</div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">No Practice Data Yet</h2>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Complete some practice quizzes to see your performance analytics here.
                </p>
                <Link href="/student/practice"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition shadow-sm">
                  🎯 Start Practicing
                </Link>
              </div>
            ) : (
              <>
                {/* Practice Overview Cards — FREE for everyone */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Practice Sessions', value: practiceSessions.length, icon: '🔄', color: 'text-indigo-600' },
                    { label: 'Questions Attempted', value: totalPracticeQuestions, icon: '📝', color: 'text-blue-600' },
                    { label: 'Overall Accuracy', value: `${practiceAccuracy}%`, icon: '🎯', color: practiceAccuracy >= 70 ? 'text-green-600' : practiceAccuracy >= 40 ? 'text-amber-600' : 'text-red-600' },
                    { label: 'Avg Time / Q', value: formatTime(avgPracticeTimePerQ), icon: '⏱️', color: 'text-gray-700' },
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

                {/* Practice by Section — PREMIUM locked for free users */}
                <LockedSection title="Practice by Section" icon="📈" isPremium={isPremium}>
                  {PracticeBySectionContent}
                </LockedSection>

                {/* Strongest / Weakest — PREMIUM */}
                <LockedSection title="Strongest & Weakest" icon="🎯" isPremium={isPremium}>
                  {PracticeBestWeakContent}
                </LockedSection>

                {/* Recent Practice Sessions — PREMIUM */}
                <LockedSection title="Recent Practice Sessions" icon="🔄" isPremium={isPremium}>
                  {PracticeRecentContent}
                </LockedSection>
              </>
            )}
          </>
        )}

        {/* ════════════════════════════════════════════ */}
        {/* TESTS TAB                                      */}
        {/* ════════════════════════════════════════════ */}
        {activeTab === 'tests' && (
          <>
            {!hasTestData ? (
              <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-16 text-center">
                <div className="text-5xl mb-4">📊</div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">No Test Data Yet</h2>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Complete some full-length tests to see your performance analytics here.
                </p>
                <Link href="/student/tests"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition shadow-sm">
                  📝 Browse Tests
                </Link>
              </div>
            ) : (
              <>
                {/* Overview Cards — FREE for everyone */}
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

                {/* Best / Weak Section — PREMIUM */}
                <LockedSection title="Strongest & Weakest" icon="🎯" isPremium={isPremium}>
                  {TestBestWeakContent}
                </LockedSection>

                {/* Section Performance — PREMIUM */}
                <LockedSection title="Section-wise Performance" icon="📈" isPremium={isPremium}>
                  {TestSectionPerformanceContent}
                </LockedSection>

                {/* Attempt History — PREMIUM */}
                <LockedSection title="Attempt History" icon="📋" isPremium={isPremium}>
                  {TestHistoryContent}
                </LockedSection>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
