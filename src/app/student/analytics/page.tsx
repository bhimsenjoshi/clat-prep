'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';

const SECTION_NAMES = [
  'English Language', 'Current Affairs Including General Knowledge', 'Legal Reasoning',
  'Logical Reasoning', 'Quantitative Techniques',
] as const;

const SECTION_ICONS: Record<string, string> = {
  'English Language': '📖',
  'Current Affairs Including General Knowledge': '📰',
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
  question_times: number[];
  session_type?: string;
}

interface SectionPracticeStats {
  name: string;
  icon: string;
  totalQuestions: number;
  correct: number;
  incorrect: number;
  accuracy: number;
  medianTimeSeconds: number;
  q1Time: number;
  q3Time: number;
  minTime: number;
  maxTime: number;
  medianAccuracy: number;
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
  const [activeTab, setActiveTab] = useState<'practice' | 'quick_fire' | 'tests' | 'editorials'>('practice');
  const [editorialStats, setEditorialStats] = useState<any>(null);
  const [editorialStatsLoading, setEditorialStatsLoading] = useState(true);
  const [dailyReadData, setDailyReadData] = useState<{date: string; reads: number}[]>([]);

  // ─── Read ?tab= from URL on mount ───
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab') as 'practice' | 'quick_fire' | 'tests' | 'editorials' | null;
    if (tab && ['practice', 'quick_fire', 'tests', 'editorials'].includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(prof);

      // ─── Load Practice Quiz Data (quiz_sessions + quiz_responses) ───
      const { data: allSessions } = await supabase
        .from('quiz_sessions')
        .select('*')
        .eq('student_id', user.id)
        .order('started_at', { ascending: false })
        .limit(100);

      if (allSessions && allSessions.length > 0) {
        const sessionIds = allSessions.map((s: any) => s.id);

        // Fetch responses for all sessions in one go
        const { data: responses } = await supabase
          .from('quiz_responses')
          .select('session_id, is_correct, time_taken_seconds')
          .in('session_id', sessionIds);

        // Index responses by session — with per-question times
        const respBySession: Record<string, { correct: number; total: number; totalTime: number; questionTimes: number[] }> = {};
        for (const r of (responses ?? []) as any[]) {
          if (!respBySession[r.session_id]) {
            respBySession[r.session_id] = { correct: 0, total: 0, totalTime: 0, questionTimes: [] };
          }
          respBySession[r.session_id].total++;
          if (r.is_correct) respBySession[r.session_id].correct++;
          respBySession[r.session_id].totalTime += (r.time_taken_seconds ?? 0);
          respBySession[r.session_id].questionTimes.push(r.time_taken_seconds ?? 0);
        }

        const enriched: PracticeSession[] = allSessions
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
            question_times: rs.questionTimes || [],
            session_type: s.session_type || 'practice',
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
        setDailyReadData(data.dailyReadData || []);
        setEditorialStatsLoading(false);
      })
      .catch(() => setEditorialStatsLoading(false));
  }, []);

  // ─── Subscription check ───
  const isPremium = profile?.subscription_plan === 'premium'
    || profile?.subscription_plan === 'max'
    || profile?.is_promo_user === true;

  // ─── Compute Practice Analytics (filtered by session_type) ───
  const filteredSessions = practiceSessions.filter(p =>
    activeTab === 'quick_fire' ? p.session_type === 'quick_fire' : p.session_type !== 'quick_fire'
  );
  const totalPracticeQuestions = filteredSessions.reduce((s, p) => s + p.questions_answered, 0);
  const totalPracticeCorrect = filteredSessions.reduce((s, p) => s + p.correct_count, 0);
  const practiceAccuracy = totalPracticeQuestions > 0
    ? Math.round((totalPracticeCorrect / totalPracticeQuestions) * 100) : 0;
  const totalPracticeTime = filteredSessions.reduce((s, p) => s + (p.avg_time_seconds * p.questions_answered), 0);
  const avgPracticeTimePerQ = totalPracticeQuestions > 0
    ? Math.round(totalPracticeTime / totalPracticeQuestions) : 0;

  // Per-section practice stats
  const sectionPracticeStats: SectionPracticeStats[] = SECTION_NAMES.map(name => {
    const sSessions = filteredSessions.filter(p => p.section === name);
    const totalQ = sSessions.reduce((s, p) => s + p.questions_answered, 0);
    const correct = sSessions.reduce((s, p) => s + p.correct_count, 0);

    // Per-session accuracies
    const accs = sSessions
      .filter(p => p.questions_answered > 0)
      .map(p => Math.round((p.correct_count / p.questions_answered) * 100))
      .sort((a, b) => a - b);

    // Per-question times (more granular than per-session averages)
    const allTimes = sSessions
      .flatMap(p => p.question_times || [])
      .filter(t => t > 0)
      .sort((a, b) => a - b);

    const n = accs.length;
    const tn = allTimes.length;

    // Median: average of two middle values when even
    const medianAcc = n > 0
      ? (n % 2 === 1 ? accs[Math.floor(n / 2)] : Math.round((accs[n / 2 - 1] + accs[n / 2]) / 2))
      : 0;
    const medianTime = tn > 0
      ? (tn % 2 === 1 ? allTimes[Math.floor(tn / 2)] : Math.round((allTimes[tn / 2 - 1] + allTimes[tn / 2]) / 2))
      : 0;
    const q1 = tn > 0 ? allTimes[Math.floor(tn * 0.25)] : 0;
    const q3 = tn > 0 ? allTimes[Math.floor(tn * 0.75)] : 0;
    return {
      name,
      icon: SECTION_ICONS[name] || '📝',
      totalQuestions: totalQ,
      correct,
      incorrect: totalQ - correct,
      accuracy: totalQ > 0 ? Math.round((correct / totalQ) * 100) : 0,
      medianTimeSeconds: medianTime,
      q1Time: q1,
      q3Time: q3,
      minTime: tn > 0 ? allTimes[0] : 0,
      maxTime: tn > 0 ? allTimes[tn - 1] : 0,
      medianAccuracy: medianAcc,
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

  const hasPracticeData = filteredSessions.length > 0;
  const hasTestData = completed.length > 0;

  // ─── Shared detailed content sections (used with LockedSection wrapper) ───

  const PracticeBySectionContent = (
    <div className="bg-card border border-theme rounded-xl shadow-theme-sm">
      <div className="px-6 py-4 border-b border-theme">
        <h2 className="font-semibold text-primary">📈 Practice by Section</h2>
      </div>
      {/* Scrollable table on mobile */}
      <div className="overflow-x-auto">
        {/* Header row */}
        <div className="min-w-[780px] px-6 py-2.5 border-b border-theme flex items-center gap-0 text-[11px] text-secondary font-bold uppercase tracking-wider">
          <span className="w-[28px] shrink-0 text-center"></span>
          <span className="w-[140px] shrink-0 text-left">Section</span>
          <span className="w-[80px] shrink-0 text-center">Corr</span>
          <span className="w-[80px] shrink-0 text-center">Wrong</span>
          <span className="w-[60px] shrink-0 text-center">Q</span>
          <span className="w-[80px] shrink-0 text-center">Acc</span>
          <span className="w-[80px] shrink-0 text-center">Med</span>
          <span className="w-[190px] shrink-0 text-left">Time Dist.</span>
        </div>
        <div className="divide-y divide-theme-light">
          {sectionPracticeStats.map(s => {
            const n = s.sessions;
            const accColor = s.accuracy >= 70
              ? 'text-success' : s.accuracy >= 40 ? 'text-warning' : 'text-danger';
            const fmt = (sec: number) => sec >= 60 ? `${Math.floor(sec / 60)}m${sec % 60}s` : `${sec}s`;

            // Abbreviated section names (fixed width)
            const shortName: Record<string, string> = {
              'English Language': 'English',
              'Current Affairs Including General Knowledge': 'Current Affairs',
              'Legal Reasoning': 'Legal',
              'Logical Reasoning': 'Logical',
              'Quantitative Techniques': 'Quant',
            };

            return (
              <div key={s.name} className="min-w-[780px] px-6 py-3.5 flex items-center gap-0 hover:bg-elevated transition">
                {/* Icon */}
                <span className="text-base shrink-0 w-[28px] text-center">{s.icon}</span>
                {/* Section name */}
                <span className="text-sm font-medium text-primary w-[140px] shrink-0 truncate text-left">{shortName[s.name] || s.name}</span>

                {/* Corr */}
                <span className="text-xs text-success shrink-0 w-[80px] text-center font-medium">{s.correct}</span>
                {/* Wrong */}
                <span className="text-xs text-danger shrink-0 w-[80px] text-center font-medium">{s.incorrect}</span>
                {/* Q */}
                <span className="text-xs text-muted shrink-0 w-[60px] text-center">{s.totalQuestions}</span>
                {/* Acc */}
                <span className={`text-sm font-bold shrink-0 w-[80px] text-center ${accColor}`}>{s.accuracy}%</span>
                {/* Med */}
                <span className="text-xs font-semibold text-blue-400 shrink-0 w-[80px] text-center">{n > 0 ? fmt(s.medianTimeSeconds) : '—'}</span>

                {/* Box plot — left-aligned, compact */}
                <div className="w-[190px] shrink-0 flex items-center justify-start">
                  {s.totalQuestions >= 2 ? (
                    <svg viewBox="0 0 100 16" className="w-full h-4 max-w-[100px]" preserveAspectRatio="none">
                      {/* Whisker line */}
                      <line x1={0} y1={8} x2={100} y2={8} stroke="#334155" strokeWidth="1"/>
                      {/* IQR box */}
                      <rect
                        x={Math.min(s.q1Time / 240 * 100, 96)}
                        y={3}
                        width={Math.max(Math.min((s.q3Time - s.q1Time) / 240 * 100, 96), 3)}
                        height={10} rx={1.5}
                        fill="rgba(59,130,246,0.2)"
                        stroke="#60a5fa" strokeWidth="1"
                      >
                        <title>Q₁: {fmt(s.q1Time)} · Q₃: {fmt(s.q3Time)}</title>
                      </rect>
                      {/* Median line */}
                      <line x1={Math.min(s.medianTimeSeconds / 240 * 100, 99)} y1={2} x2={Math.min(s.medianTimeSeconds / 240 * 100, 99)} y2={14} stroke="#60a5fa" strokeWidth="2">
                        <title>Median: {fmt(s.medianTimeSeconds)}</title>
                      </line>
                      {/* Min cap */}
                      <line x1={Math.min(s.minTime / 240 * 100, 99)} y1={5} x2={Math.min(s.minTime / 240 * 100, 99)} y2={11} stroke="#475569" strokeWidth="1">
                        <title>Min: {fmt(s.minTime)}</title>
                      </line>
                      {/* Max cap */}
                      <line x1={Math.min(s.maxTime / 240 * 100, 99)} y1={5} x2={Math.min(s.maxTime / 240 * 100, 99)} y2={11} stroke="#475569" strokeWidth="1">
                        <title>Max: {fmt(s.maxTime)}</title>
                      </line>
                    </svg>
                  ) : s.totalQuestions === 1 ? (
                    <svg viewBox="0 0 16 16" className="w-4 h-4 shrink-0">
                      <circle cx={8} cy={8} r="4" fill="rgba(59,130,246,0.3)" stroke="#60a5fa" strokeWidth="1">
                        <title>Time: {fmt(s.medianTimeSeconds)}</title>
                      </circle>
                    </svg>
                  ) : (
                    <span className="text-[10px] text-muted">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
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
        <h2 className="font-semibold text-primary">🔄 Recent {activeTab === 'quick_fire' ? 'Quick Fire' : 'Practice'} Sessions</h2>
        <Link href={activeTab === 'quick_fire' ? '/student/quick-fire' : '/student/practice'} className="text-xs text-accent hover:text-accent/80 font-medium">
          {activeTab === 'quick_fire' ? 'Quick Fire →' : 'Practice Now →'}
        </Link>
      </div>
      <div className="divide-y divide-theme-light">
        {filteredSessions.slice(0, 20).map(s => {
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
        <Link href="/student/exams" className="text-xs text-accent hover:text-accent/80 font-medium">
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
              <Link href={`/student/exams/${a.test_id}/review?attempt=${a.id}`}
                className="text-xs text-accent hover:text-accent/80 font-medium">
                Review →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const PracticeSummaryContent = (
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
    </div>
  );

  const TestSummaryContent = (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        <><div className="p-6 space-y-4">
          {/* Today & Yesterday read cards */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-tint-info border border-info/20 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-info">{dailyReadData.length >= 1 ? dailyReadData[dailyReadData.length - 1].reads : 0}</p>
              <p className="text-[10px] text-info/70 font-medium uppercase tracking-wider">Today</p>
            </div>
            <div className="bg-tint-warning border border-warning/20 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-warning">{dailyReadData.length >= 2 ? dailyReadData[dailyReadData.length - 2].reads : 0}</p>
              <p className="text-[10px] text-warning/70 font-medium uppercase tracking-wider">Yesterday</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-primary">Total Editorials Read</p>
            <p className="text-sm font-bold text-accent">{editorialStats.totalRead}</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-primary">Quizzes Attempted</p>
            <p className="text-sm font-bold text-accent">{editorialStats.quizedArticles}</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-primary">Average Score</p>
            <p className="text-sm font-bold text-accent">{editorialStats.quizAccuracy}%</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-primary">Reading Streak</p>
            <p className="text-sm font-bold text-success">{editorialStats.streak} day{editorialStats.streak !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="border-t border-theme pt-4">
          <p className="text-[11px] font-semibold text-secondary uppercase tracking-wider mb-3">📈 Daily Reads (30 days)</p>
          <div className="relative h-28">
            {/* SVG line chart */}
            <svg viewBox="0 0 300 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              {(() => {
                const data = dailyReadData;
                if (data.length === 0) return null;
                const maxReads = Math.max(...data.map(d => d.reads), 1);
                const pts = data.map((d, i) => {
                  const x = (i / (data.length - 1)) * 300;
                  const y = 100 - (d.reads / maxReads) * 85 - 5;
                  return `${x},${y}`;
                });
                const line = pts.join(' ');
                const area = `0,100 ${line} 300,100`;
                return (
                  <>
                    <defs>
                      <linearGradient id="editorial-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgb(99 102 241)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="rgb(99 102 241)" stopOpacity="0.02" />
                      </linearGradient>
                    </defs>
                    <path d={`M${line}`} fill="none" stroke="rgb(99 102 241)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                    <path d={`M${area}`} fill="url(#editorial-fill)" />
                  </>
                );
              })()}
            </svg>
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[9px] text-muted pointer-events-none">
              <span>{Math.max(...dailyReadData.map(d => d.reads), 1)}</span>
              <span>0</span>
            </div>
          </div>
          {/* X-axis: show every 5th day label */}
          <div className="flex justify-between text-[8px] text-muted mt-1 px-0">
            {dailyReadData.filter((_, i) => i % 5 === 0 || i === dailyReadData.length - 1).map(d => (
              <span key={d.date}>{new Date(d.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
            ))}
          </div>
        </div>
        </>) : !editorialStatsLoading && !editorialStats ? (
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
      <PageHeader title='Analytics' navItems={[{href:'/student/dashboard',label:'Dashboard',icon:'🏛️'}]} />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Tabs */}
        <div className="flex border-b border-theme mb-6">
          <button
            onClick={() => setActiveTab('practice')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'practice' ? 'border-accent text-accent' : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            📚 Practice
          </button>
          <button
            onClick={() => setActiveTab('quick_fire')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'quick_fire' ? 'border-accent text-accent' : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            ⚡ Quick Fire
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
            <h2 className="text-xl font-bold text-primary">📚 Practice Overview</h2>
            <LockedSection title="Practice Summary" icon="🎯" isPremium={isPremium}>
              {PracticeSummaryContent}
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

        {activeTab === 'quick_fire' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-primary">⚡ Quick Fire Overview</h2>
            <LockedSection title="Quick Fire Summary" icon="⚡" isPremium={isPremium}>
              {PracticeSummaryContent}
            </LockedSection>
            {hasPracticeData ? (
              <>
                <LockedSection title="Quick Fire by Section" icon="📈" isPremium={isPremium}>
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
                <p>No Quick Fire data yet. Fire up a round to see your stats!</p>
                <Link href="/student/quick-fire" className="mt-4 inline-flex px-6 py-3 rounded-xl font-medium bg-accent text-white hover:bg-accent-hover transition">
                  Start Quick Fire ⚡
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tests' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-primary">Test Performance</h2>
            <LockedSection title="Test Summary" icon="📝" isPremium={isPremium}>
              {TestSummaryContent}
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
                <Link href="/student/exams" className="mt-4 inline-flex px-6 py-3 rounded-xl font-medium bg-accent text-white hover:bg-accent-hover transition">
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
            ) : null}
          </div>
        )}

      </main>
    </div>
  );
}
