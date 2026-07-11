'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';

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
    <div className="relative bg-card border border-theme rounded-xl shadow-theme-sm overflow-hidden">
      {/* Blurred preview of the actual content */}
      <div className="blur-sm pointer-events-none select-none opacity-40">
        {children}
      </div>
      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/60 backdrop-blur-[2px] p-6">
        <div className="bg-tint-warning border border-warning/50 rounded-2xl p-6 text-center max-w-sm shadow-theme-lg">
          <div className="text-4xl mb-3">🔒</div>
          <h3 className="text-lg font-bold text-primary mb-1">{icon} {title}</h3>
          <p className="text-sm text-secondary mb-5">
            Unlock detailed analytics — section-wise breakdowns, time tracking, and session history.
          </p>
          <Link
            href="/student/profile"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-gradient-warm text-white hover:bg-gradient-warm-hover transition shadow-theme-md"
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
  const [activeTab, setActiveTab] = useState<'practice' | 'tests' | 'editorials'>('practice');
  const [editorialStats, setEditorialStats] = useState<any>(null);
  const [editorialStatsLoading, setEditorialStatsLoading] = useState(true);

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

    // ─── Fetch editorial stats ───
    fetch('/api/editorials/activity')
      .then(r => r.json())
      .then(data => {
        setEditorialStats(data.stats || null);
        setEditorialStatsLoading(false);
      })
      .catch(() => setEditorialStatsLoading(false));
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
    <div className="min-h-screen flex items-center justify-center bg-page">
      <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
    </div>
  );

  const hasPracticeData = practiceSessions.length > 0;
  const hasTestData = completed.length > 0;

  // ─── Shared detailed content sections (used with LockedSection wrapper) ───

  const PracticeBySectionContent = (
    <div className="bg-card border border-theme rounded-xl shadow-theme-sm">
      <div className="px-6 py-4 border-b border-theme flex items-center justify-between">
        <h2 className="font-semibold text-primary">📈 Practice by Section</h2>
        <span className="text-xs text-muted">Pass / Fail · Avg Time</span>
      </div>
      <div className="p-6 space-y-6">
        {sectionPracticeStats.map(s => (
          <div key={s.name}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{s.icon}</span>
                <span className="text-sm font-medium text-primary">{s.name}</span>
                <span className="text-[10px] text-muted bg-elevated px-1.5 py-0.5 rounded-full">
                  {s.sessions} session{s.sessions !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-secondary">
                <span className="font-semibold text-success">{s.correct}<span className="text-muted font-normal">✓</span></span>
                <span className="font-semibold text-danger">{s.incorrect}<span className="text-muted font-normal">✗</span></span>
                <span className={`font-semibold ${
                  s.accuracy >= 70 ? 'text-success' : s.accuracy >= 40 ? 'text-warning' : 'text-danger'
                }`}>
                  {s.accuracy}%
                </span>
                {s.avgTimeSeconds > 0 && <span>⏱ {formatTime(s.avgTimeSeconds)}</span>}
              </div>
            </div>
            {/* Accuracy bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-elevated rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all ${
                    s.accuracy >= 70 ? 'bg-success' : s.accuracy >= 40 ? 'bg-warning' : 'bg-danger'
                  }`}
                  style={{ width: `${Math.min(s.accuracy, 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-muted w-16 text-right">
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
          <div className="bg-tint-success border border-success/50 rounded-xl p-4">
            <p className="text-xs text-success font-medium uppercase tracking-wider">✅ Strongest Section</p>
            <p className="text-lg font-bold text-primary mt-1">{best.icon} {best.name}</p>
            <p className="text-sm text-success">{best.accuracy}% accuracy · {best.totalQuestions} questions</p>
          </div>
          <div className="bg-tint-danger border border-danger/50 rounded-xl p-4">
            <p className="text-xs text-danger font-medium uppercase tracking-wider">🎯 Needs Practice</p>
            <p className="text-lg font-bold text-primary mt-1">{worst.icon} {worst.name}</p>
            <p className="text-sm text-danger">{worst.accuracy}% accuracy · {worst.totalQuestions} questions</p>
          </div>
        </div>
      );
    })()
  );

  const PracticeRecentContent = (
    <div className="bg-card border border-theme rounded-xl shadow-theme-sm">
      <div className="px-6 py-4 border-b border-theme flex items-center justify-between">
        <h2 className="font-semibold text-primary">🔄 Recent Practice Sessions</h2>
        <Link href="/student/practice" className="text-xs text-accent hover:text-accent/80 font-medium">
          Practice Now →
        </Link>
      </div>
      <div className="divide-y divide-theme-light">
        {practiceSessions.slice(0, 20).map(s => {
          const pct = s.questions_answered > 0
            ? Math.round((s.correct_count / s.questions_answered) * 100) : 0;
          return (
            <div key={s.id} className="px-6 py-3 flex items-center justify-between hover:bg-elevated transition">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="text-lg shrink-0">{SECTION_ICONS[s.section] || '📝'}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-primary truncate">{s.section}</p>
                  <p className="text-[10px] text-secondary">
                    {new Date(s.started_at).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                    {s.avg_time_seconds > 0 && <> · ⏱ {formatTime(s.avg_time_seconds)}/q</>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className="text-xs text-muted">
                  {s.correct_count}/{s.questions_answered}
                </span>
                <span className={`text-sm font-bold ${
                  pct >= 70 ? 'text-success' : pct >= 40 ? 'text-warning' : 'text-danger'
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
        <div className="bg-tint-success border border-success/50 rounded-xl p-4">
          <p className="text-xs text-success font-medium uppercase tracking-wider">✅ Strongest Section</p>
          <p className="text-lg font-bold text-primary mt-1">{bestSection.name}</p>
          <p className="text-sm text-success">Avg {bestSection.avg} · {bestSection.count} attempts</p>
        </div>
        <div className="bg-tint-danger border border-danger/50 rounded-xl p-4">
          <p className="text-xs text-danger font-medium uppercase tracking-wider">🎯 Needs Focus</p>
          <p className="text-lg font-bold text-primary mt-1">{weakSection.name}</p>
          <p className="text-sm text-danger">Avg {weakSection.avg} · {weakSection.count} attempts</p>
        </div>
      </div>
    ) : null
  );

  const TestSectionPerformanceContent = (
    <div className="bg-card border border-theme rounded-xl shadow-theme-sm">
      <div className="px-6 py-4 border-b border-theme">
        <h2 className="font-semibold text-primary">📈 Section-wise Performance</h2>
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
                <span className="text-sm font-medium text-primary">{s.name}</span>
                <div className="flex items-center gap-3 text-xs text-secondary">
                  <span className="font-semibold text-accent">{s.avg}<span className="text-muted font-normal"> avg</span></span>
                  <span className="font-semibold text-success">{s.max}<span className="text-muted font-normal"> best</span></span>
                  {avgTime > 0 && <span>{avgTime}m avg</span>}
                </div>
              </div>
              <div className="w-full bg-elevated rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all ${
                    pct >= 70 ? 'bg-success' : pct >= 40 ? 'bg-warning' : 'bg-danger'
                  }`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-muted mt-1">{s.count} test{s.count !== 1 ? 's' : ''} attempted</p>
            </div>
          );
        })}
      </div>
    </div>
  );

  const TestHistoryContent = (
    <div className="bg-card border border-theme rounded-xl shadow-theme-sm">
      <div className="px-6 py-4 border-b border-theme flex items-center justify-between">
        <h2 className="font-semibold text-primary">📋 Attempt History</h2>
        <Link href="/student/tests" className="text-xs text-accent hover:text-accent/80 font-medium">
          All Tests →
        </Link>
      </div>
      <div className="divide-y divide-theme-light">
        {completed.slice(0, 20).map(a => (
          <div key={a.id} className="px-6 py-3 flex items-center justify-between hover:bg-elevated transition">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-primary truncate">
                {a.test_title}
              </p>
              <p className="text-[10px] text-secondary">
                Attempt #{a.attempt_number} · {new Date(a.started_at).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric'
                })}
              </p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <span className={`text-sm font-bold ${
                (a.total_score ?? 0) >= 70 ? 'text-success' :
                (a.total_score ?? 0) >= 40 ? 'text-warning' : 'text-danger'
              }`}>
                {a.total_score ?? '—'}%
              </span>
              <Link href={`/student/tests/${a.test_id}/review?attempt=${a.id}`}
                className="text-xs text-accent hover:text-accent/80 font-medium">
                Review →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const OverallSummaryContent = (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total Practice Questions */}
      <div className="bg-card border border-theme rounded-xl p-4 text-center shadow-theme-sm">
        <p className="text-4xl font-bold text-accent mb-1">{totalPracticeQuestions}</p>
        <p className="text-sm text-secondary">Questions Practiced</p>
      </div>

      {/* Practice Accuracy */}
      <div className="bg-card border border-theme rounded-xl p-4 text-center shadow-theme-sm">
        <p className={`text-4xl font-bold ${
          practiceAccuracy >= 70 ? 'text-success' : practiceAccuracy >= 40 ? 'text-warning' : 'text-danger'
        }`}>
          {practiceAccuracy}%
        </p>
        <p className="text-sm text-secondary">Practice Accuracy</p>
      </div>

      {/* Avg Time Per Question */}
      <div className="bg-card border border-theme rounded-xl p-4 text-center shadow-theme-sm">
        <p className="text-4xl font-bold text-info mb-1">{avgPracticeTimePerQ}s</p>
        <p className="text-sm text-secondary">Avg Time/Q (Practice)</p>
      </div>

      {/* Total Tests Taken */}
      <div className="bg-card border border-theme rounded-xl p-4 text-center shadow-theme-sm">
        <p className="text-4xl font-bold text-accent mb-1">{completed.length}</p>
        <p className="text-sm text-secondary">Tests Taken</p>
      </div>

      {/* Overall Test Accuracy */}
      <div className="bg-card border border-theme rounded-xl p-4 text-center shadow-theme-sm">
        <p className={`text-4xl font-bold ${
          overallAccuracy >= 70 ? 'text-success' : overallAccuracy >= 40 ? 'text-warning' : 'text-danger'
        }`}>
          {overallAccuracy}%
        </p>
        <p className="text-sm text-secondary">Overall Test Accuracy</p>
      </div>

      {/* Average Test Score */}
      <div className="bg-card border border-theme rounded-xl p-4 text-center shadow-theme-sm">
        <p className={`text-4xl font-bold ${
          avgScore >= 70 ? 'text-success' : avgScore >= 40 ? 'text-warning' : 'text-danger'
        }`}>
          {avgScore}%
        </p>
        <p className="text-sm text-secondary">Average Test Score</p>
      </div>
    </div>
  );

  const EditorialActivityContent = (
    <div className="bg-card border border-theme rounded-xl shadow-theme-sm">
      <div className="px-6 py-4 border-b border-theme">
        <h2 className="font-semibold text-primary">📰 Editorial Quiz Activity</h2>
      </div>
      {!editorialStatsLoading && editorialStats ? (
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-primary">Total Editorials Read</p>
            <p className="text-sm font-bold text-accent">{editorialStats.read}</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-primary">Quizzes Attempted</p>
            <p className="text-sm font-bold text-accent">{editorialStats.quizzes}</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-primary">Average Score</p>
            <p className="text-sm font-bold text-accent">{editorialStats.avg_score}%</p>
          </div>
        </div>
      ) : !editorialStatsLoading && !editorialStats ? (
        <div className="p-6 text-center text-muted">
          No editorial activity yet. Start reading from the dashboard!
        </div>
      ) : (
        <div className="p-6 text-center text-muted">
          Loading editorial stats...
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-page">
      <PageHeader title='Analytics' navItems={[{href:'/student/dashboard',label:'Dashboard',icon:'📊'}]} />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Tabs */}
        <div className="flex border-b border-theme mb-6">
          <button
            onClick={() => setActiveTab('practice')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'practice' ? 'border-accent text-accent' : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            Practice
          </button>
          <button
            onClick={() => setActiveTab('tests')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'tests' ? 'border-accent text-accent' : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            Tests
          </button>
          <button
            onClick={() => setActiveTab('editorials')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'editorials' ? 'border-accent text-accent' : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            Editorials
          </button>
        </div>

        {activeTab === 'practice' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-primary">Practice Overview</h2>
            <LockedSection title="Practice Summary" icon="🎯" isPremium={isPremium}>
              {OverallSummaryContent}
            </LockedSection>
            {hasPracticeData ? (
              <>
                <LockedSection title="Practice by Section" icon="📈" isPremium={isPremium}>
                  {PracticeBySectionContent}
                </LockedSection>
                <LockedSection title="Strongest & Weakest" icon="💪" isPremium={isPremium}>
                  {PracticeBestWeakContent}
                </LockedSection>
                <LockedSection title="Recent Sessions" icon="🔄" isPremium={isPremium}>
                  {PracticeRecentContent}
                </LockedSection>
              </>
            ) : (
              <div className="bg-card border border-theme rounded-xl p-10 text-center text-muted">
                <p>No practice data yet. Start a quiz to see your analytics!</p>
                <Link href="/student/practice" className="mt-4 inline-flex px-6 py-3 rounded-xl font-medium bg-accent text-white hover:bg-accent-hover transition">
                  Start Practice →
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tests' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-primary">Test Performance</h2>
            <LockedSection title="Test Summary" icon="📝" isPremium={isPremium}>
              {OverallSummaryContent}
            </LockedSection>
            {hasTestData ? (
              <>
                <LockedSection title="Section-wise Performance" icon="📊" isPremium={isPremium}>
                  {TestSectionPerformanceContent}
                </LockedSection>
                <LockedSection title="Strongest & Weakest Sections" icon="💪" isPremium={isPremium}>
                  {TestBestWeakContent}
                </LockedSection>
                <LockedSection title="Attempt History" icon="📋" isPremium={isPremium}>
                  {TestHistoryContent}
                </LockedSection>
              </>
            ) : (
              <div className="bg-card border border-theme rounded-xl p-10 text-center text-muted">
                <p>No test data yet. Complete a mock test to see your analytics!</p>
                <Link href="/student/tests" className="mt-4 inline-flex px-6 py-3 rounded-xl font-medium bg-accent text-white hover:bg-accent-hover transition">
                  Start Test →
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'editorials' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-primary">Editorial Quizzes</h2>
            <LockedSection title="Editorial Activity" icon="📰" isPremium={isPremium}>
              {EditorialActivityContent}
            </LockedSection>
            {!editorialStatsLoading && !editorialStats ? (
              <div className="bg-card border border-theme rounded-xl p-10 text-center text-muted">
                <p>No editorial quiz activity yet. Read editorials from the dashboard!</p>
                <Link href="/student/dashboard" className="mt-4 inline-flex px-6 py-3 rounded-xl font-medium bg-accent text-white hover:bg-accent-hover transition">
                  Go to Dashboard →
                </Link>
              </div>
            ) : (
              !editorialStatsLoading && editorialStats && EditorialActivityContent // Show content if loaded and exists
            )}
          </div>
        )}

      </main>
    </div>
  );
}
