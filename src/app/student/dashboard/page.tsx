'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { ExtendedProfile } from '@/types';

const CLAT_DATE = new Date('2026-12-06T09:00:00+05:30');

const SECTION_ICONS: Record<string, string> = {
  'English': '📖',
  'Current Affairs': '📰',
  'Legal Reasoning': '⚖️',
  'Logical Reasoning': '🧠',
  'Quantitative Techniques': '📐',
};

const SECTIONS = [
  { id: 'English', label: 'English', icon: '📖', color: 'indigo', desc: 'Reading comprehension' },
  { id: 'Current Affairs', label: 'Current Affairs', icon: '📰', color: 'emerald', desc: 'GK & news' },
  { id: 'Legal Reasoning', label: 'Legal Reasoning', icon: '⚖️', color: 'amber', desc: 'Legal principles' },
  { id: 'Logical Reasoning', label: 'Logical Reasoning', icon: '🧠', color: 'purple', desc: 'Critical thinking' },
  { id: 'Quantitative Techniques', label: 'Quantitative Techniques', icon: '📊', color: 'rose', desc: 'Data & math' },
] as const;

const LEGAL_MAXIMS = [
  { maxim: 'Actus non facit reum nisi mens sit rea', meaning: 'An act does not make one guilty unless the mind is guilty' },
  { maxim: 'Audi alteram partem', meaning: 'Hear the other side — no one shall be condemned unheard' },
  { maxim: 'Bona fide', meaning: 'In good faith — honest intent without malice' },
  { maxim: 'Caveat emptor', meaning: 'Let the buyer beware — buyer must inspect before purchase' },
  { maxim: 'De minimis non curat lex', meaning: 'The law does not concern itself with trifles' },
  { maxim: 'Ex post facto', meaning: 'From after the fact — retrospective legislation is invalid' },
  { maxim: 'Habeas corpus', meaning: 'You shall have the body — right against unlawful detention' },
  { maxim: 'Ignorantia juris non excusat', meaning: 'Ignorance of law is not an excuse' },
  { maxim: 'In pari delicto', meaning: 'In equal fault — neither party can claim relief' },
  { maxim: 'Locus standi', meaning: 'Right to bring an action — standing to sue' },
  { maxim: 'Mens rea', meaning: 'Guilty mind — necessary for criminal liability' },
  { maxim: 'Nemo debet bis vexari', meaning: 'No one shall be tried twice for the same offence' },
  { maxim: 'Prima facie', meaning: 'On the face of it — sufficient to establish a fact' },
  { maxim: 'Quantum meruit', meaning: 'As much as earned — payment for work done' },
  { maxim: 'Res ipsa loquitur', meaning: 'The thing speaks for itself — negligence inferred' },
  { maxim: 'Stare decisis', meaning: 'To stand by decided matters — precedent binding' },
  { maxim: 'Ubi jus ibi remedium', meaning: 'Where there is a right there is a remedy' },
  { maxim: 'Volenti non fit injuria', meaning: 'Injury cannot be done to a willing person' },
];

// ─── Announcements ───
const ANNOUNCEMENTS = [
  {
    id: 'ai-mentor',
    icon: '🤖',
    title: 'AI Mentor Launching Soon!',
    body: 'Get personalized answer explanations & performance insights with our AI Mentor — coming to Max plan.',
  },
  {
    id: 'leaderboard',
    icon: '🏆',
    title: 'Leaderboard is Live!',
    body: 'Compete with other CLAT aspirants. See your rank across all sections.',
  },
];

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

interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function StudentDashboard() {
  const [profile, setProfile] = useState<ExtendedProfile | null>(null);
  const [attempts, setAttempts] = useState<AttemptWithMeta[]>([]);
  const [practiceSessions, setPracticeSessions] = useState<any[]>([]);
  const [weakestSection, setWeakestSection] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [countdown, setCountdown] = useState<Countdown>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [maximIndex, setMaximIndex] = useState(0);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<Set<string>>(new Set());
  const [editorialItems, setEditorialItems] = useState<any[]>([]);
  const [editorialsLoading, setEditorialsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  // ─── Load dismissed announcements from localStorage ───
  useEffect(() => {
    try {
      const saved = localStorage.getItem('clatly_dismissed');
      if (saved) setDismissedAnnouncements(new Set(JSON.parse(saved)));
    } catch {}
  }, []);

  // ─── Countdown timer ───
  useEffect(() => {
    const tick = () => {
      const diff = CLAT_DATE.getTime() - Date.now();
      if (diff <= 0) return setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      setCountdown({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  // ─── Random legal maxim for the day ───
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const dayNum = today.split('-').reduce((s, n) => s + parseInt(n), 0);
    setMaximIndex(dayNum % LEGAL_MAXIMS.length);
  }, []);

  // ─── Load data ───
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

      // ─── Today's practice count ───
      const today = new Date().toISOString().split('T')[0];
      const { count: todayQCount } = await supabase
        .from('quiz_responses')
        .select('*', { count: 'exact', head: true })
        .gte('answered_at', today);
      setTodayCount(todayQCount ?? 0);

      // ─── Load practice quiz sessions ───
      const { data: sessions } = await supabase
        .from('quiz_sessions')
        .select('id, section, questions_answered, correct_count, started_at, ended_at')
        .eq('student_id', user.id)
        .order('started_at', { ascending: false })
        .limit(50);

      if (sessions && sessions.length > 0) {
        const sessionIds = sessions.map((s: any) => s.id);

        const { data: quizResponses } = await supabase
          .from('quiz_responses')
          .select('session_id, is_correct, time_taken_seconds')
          .in('session_id', sessionIds);

        // Build a section lookup from the sessions data we already have
        const sessionSection: Record<string, string> = {};
        for (const s of sessions) {
          sessionSection[s.id] = s.section;
        }

        // Index responses by session
        const respBySession: Record<string, any> = {};
        for (const r of (quizResponses ?? []) as any[]) {
          if (!respBySession[r.session_id]) {
            respBySession[r.session_id] = { correct: 0, total: 0, totalTime: 0 };
          }
          respBySession[r.session_id].total++;
          if (r.is_correct) respBySession[r.session_id].correct++;
          respBySession[r.session_id].totalTime += (r.time_taken_seconds ?? 0);
        }

        const enriched = sessions
          .filter((s: any) => {
            const rs = respBySession[s.id];
            return rs && rs.total > 0;
          })
          .map((s: any) => {
            const rs = respBySession[s.id] || { correct: 0, total: 0, totalTime: 0 };
            return { ...s, response_count: rs.total, correct_count_from_resp: rs.correct, total_time: rs.totalTime };
          });

        setPracticeSessions(enriched);

        // ─── Compute weakest section ───
        const sectionStats: Record<string, { correct: number; total: number }> = {};
        for (const r of (quizResponses ?? []) as any[]) {
          const section = sessionSection[r.session_id] || 'Unknown';
          if (!sectionStats[section]) sectionStats[section] = { correct: 0, total: 0 };
          sectionStats[section].total++;
          if (r.is_correct) sectionStats[section].correct++;
        }

        let worst = '';
        let worstPct = 100;
        for (const [sec, stats] of Object.entries(sectionStats)) {
          if (stats.total >= 3) {
            const pct = (stats.correct / stats.total) * 100;
            if (pct < worstPct) {
              worstPct = pct;
              worst = sec;
            }
          }
        }
        setWeakestSection(worst || null);

        // ─── Compute streak from practice data ───
        // Get distinct practice dates sorted desc
        const dates = new Set<string>();
        for (const s of sessions) {
          if (s.ended_at) {
            dates.add(s.ended_at.split('T')[0]);
          }
        }
        let streakCount = 0;
        const d = new Date();
        while (true) {
          const ds = d.toISOString().split('T')[0];
          if (dates.has(ds)) {
            streakCount++;
            d.setDate(d.getDate() - 1);
          } else {
            break;
          }
        }
        setStreak(streakCount);
      }

      // ─── Fetch test attempts ───
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

  // ─── Fetch RSS editorials ───
  useEffect(() => {
    fetch('/api/editorials')
      .then(r => r.json())
      .then(data => {
        setEditorialItems(data.items || []);
        setEditorialsLoading(false);
      })
      .catch(() => setEditorialsLoading(false));
  }, []);

  const completed = attempts.filter(a => a.submitted_at);
  const inProgress = attempts.filter(a => !a.submitted_at);
  const avgScore = completed.length
    ? Math.round(completed.reduce((s, a) => s + (a.total_score ?? 0), 0) / completed.length)
    : 0;
  const bestScore = completed.length ? Math.max(...completed.map(a => a.total_score ?? 0)) : 0;

  const totalPracticeQ = practiceSessions.reduce((s, p) => s + p.response_count, 0);
  const totalPracticeCorrect = practiceSessions.reduce((s, p) => s + p.correct_count_from_resp, 0);
  const practiceAccuracy = totalPracticeQ > 0 ? Math.round((totalPracticeCorrect / totalPracticeQ) * 100) : 0;

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m`;
    return `${seconds}s`;
  };

  const todayStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="animate-pulse flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Loading your dashboard...</p>
      </div>
    </div>
  );

  const maxim = LEGAL_MAXIMS[maximIndex];
  const noActivity = attempts.length === 0 && practiceSessions.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      {/* ─── Header ─── */}
      <header className="bg-slate-900/80 border-b border-slate-800/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xl shrink-0">🎯</span>
            <div className="truncate">
              <h1 className="text-base font-bold text-white truncate">CLAT Prep</h1>
              <p className="text-[11px] text-slate-400 truncate">
                {todayStr}
              </p>
            </div>
            {/* Plan badge + Upgrade CTA */}
            {profile?.subscription_plan === 'max' ? (
              <div className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-purple-900/60 text-purple-300 border border-purple-700/50">
                MAX ✨
              </div>
            ) : profile?.is_promo_user ? (
              <div className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
                PREMIUM 🎁
              </div>
            ) : (
              <Link href="/student/profile"
                className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition ${
                  profile?.subscription_plan === 'premium'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 shadow-sm'
                    : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 shadow-sm'
                }`}>
                {profile?.subscription_plan === 'premium' ? '🚀 Go Max' : '⭐ Upgrade'}
              </Link>
            )}
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-2">
            <Link href="/student/practice"
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 transition shadow-sm">
              🎯 Practice
            </Link>
            <Link href="/student/analytics"
              className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 transition">
              📊 Analytics
            </Link>
            <Link href="/student/leaderboard"
              className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 transition">
              🏆 Leaderboard
            </Link>
            <Link href="/student/tests"
              className="px-3 py-2 rounded-lg text-sm font-medium text-indigo-400 hover:bg-slate-800 transition">
              📝 Tests
            </Link>
            <Link href="/student/profile"
              className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 transition">
              👤 Profile
            </Link>
            <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
              className="px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-red-400 hover:bg-red-900/30 transition">
              Sign Out
            </button>
          </nav>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-800 transition"
            aria-label="Menu"
          >
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 py-3 space-y-1">
            <Link href="/student/practice" onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-amber-900/50 to-orange-900/50 text-amber-300">
              🎯 Practice Questions
            </Link>
            <Link href="/student/analytics" onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800">
              📊 Performance Analytics
            </Link>
            <Link href="/student/leaderboard" onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800">
              🏆 Leaderboard
            </Link>
            <Link href="/student/tests" onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-indigo-400 hover:bg-slate-800">
              📝 Available Tests
            </Link>
            <hr className="my-1 border-slate-800" />
            <Link href="/student/profile" onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800">
              👤 My Profile
            </Link>
            <button onClick={() => { setMobileMenuOpen(false); supabase.auth.signOut().then(() => router.push('/')); }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-900/30 w-full text-left">
              🚪 Sign Out
            </button>
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-5">

        {/* ════════════════════════════════════════════ */}
        {/* #1 — CLAT 2026 COUNTDOWN                     */}
        {/* ════════════════════════════════════════════ */}
        <div className="bg-gradient-to-r from-indigo-900/60 via-purple-900/50 to-indigo-900/60 border border-indigo-700/40 rounded-2xl p-6 md:p-8 text-center shadow-lg shadow-indigo-900/30">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-2xl">⏳</span>
            <span className="text-xs font-semibold text-indigo-300 uppercase tracking-widest">CLAT 2026</span>
          </div>
          <p className="text-xl md:text-2xl font-bold text-white mb-1">
            {countdown.days > 0
              ? `${countdown.days} days ${countdown.hours}h ${countdown.minutes}m ${countdown.seconds}s`
              : 'Exam Day! 🚀'}
          </p>
          <p className="text-xs text-indigo-300/70">Sunday, 6 December 2026</p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <div className="h-1.5 bg-indigo-800/50 rounded-full max-w-xs w-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                style={{ width: `${Math.max(0, Math.min(100, ((CLAT_DATE.getTime() - Date.now()) / (CLAT_DATE.getTime() - new Date('2025-07-01').getTime())) * 100))}%` }}
              />
            </div>
            <span className="text-[10px] text-indigo-400/60 shrink-0">
              {countdown.days > 0 ? `${countdown.days}d left` : 'D-Day!'}
            </span>
          </div>
        </div>

        {/* ════════════════════════════════════════════ */}
        {/* #2 — STREAK + TODAY STATS                     */}
        {/* ════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 text-center">
            <div className="text-2xl mb-1">{streak > 0 ? '🔥' : '❄️'}</div>
            <p className="text-2xl font-bold text-white">{streak}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Day Streak</p>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 text-center">
            <div className="text-2xl mb-1">📝</div>
            <p className="text-2xl font-bold text-white">{todayCount}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Today</p>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 text-center">
            <div className="text-2xl mb-1">📊</div>
            <p className="text-2xl font-bold text-white">
              {totalPracticeQ > 0 ? `${practiceAccuracy}%` : '—'}
            </p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Accuracy</p>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 text-center">
            <div className="text-2xl mb-1">📚</div>
            <p className="text-2xl font-bold text-white">{totalPracticeQ}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Total Q</p>
          </div>
        </div>

        {/* ════════════════════════════════════════════ */}
        {/* #3 — ANNOUNCEMENTS                            */}
        {/* ════════════════════════════════════════════ */}
        {ANNOUNCEMENTS.filter(a => !dismissedAnnouncements.has(a.id)).slice(0, 2).map(a => (
          <div key={a.id} className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-700/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0 mt-0.5">{a.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-blue-300">{a.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{a.body}</p>
              </div>
              <button
                onClick={() => {
                  const next = new Set(dismissedAnnouncements);
                  next.add(a.id);
                  setDismissedAnnouncements(next);
                  try { localStorage.setItem('clatly_dismissed', JSON.stringify([...next])); } catch {}
                }}
                className="shrink-0 text-slate-500 hover:text-slate-300 transition p-1"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        ))}

        {/* ════════════════════════════════════════════ */}
        {/* #4 — LEGAL MAXIM OF THE DAY                   */}
        {/* ════════════════════════════════════════════ */}
        <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-4 md:p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-amber-800/40 flex items-center justify-center text-xl shrink-0">
              ⚖️
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-amber-400/70 font-semibold uppercase tracking-wider">Legal Maxim of the Day</p>
              <p className="text-sm font-bold text-white mt-0.5 italic">&ldquo;{maxim.maxim}&rdquo;</p>
              <p className="text-xs text-slate-400 mt-1">{maxim.meaning}</p>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════ */}
        {/* #5 — TODAY'S FOCUS (smart recommendation)    */}
        {/* ════════════════════════════════════════════ */}
        {weakestSection && totalPracticeQ >= 10 && (
          <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-purple-700/40 rounded-xl p-4 md:p-5">
            <div className="flex items-start md:items-center gap-4 flex-col md:flex-row">
              <div className="w-12 h-12 rounded-xl bg-purple-800/50 flex items-center justify-center text-2xl shrink-0">
                💡
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-purple-300 font-semibold uppercase tracking-wider">Today's Focus</p>
                <p className="text-base font-bold text-white mt-0.5">
                  Your weakest section is <span className="text-purple-300">{SECTION_ICONS[weakestSection]} {weakestSection}</span>
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  You've answered {totalPracticeQ} practice questions — let's improve that score!
                </p>
              </div>
              <Link
                href="/student/practice"
                onClick={() => sessionStorage.setItem('practiceSection', weakestSection)}
                className="shrink-0 px-5 py-2.5 rounded-xl font-medium bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 transition shadow-lg shadow-purple-900/30 text-sm"
              >
                Practice Now →
              </Link>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════ */}
        {/* #6 — TODAY'S EDITORIALS (RSS-powered 3x3)     */}
        {/* ════════════════════════════════════════════ */}
        <div>
          <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <span>📰</span> Today's Editorials
            {editorialsLoading && <span className="text-[10px] font-normal text-slate-500">Loading...</span>}
          </h2>

          {editorialsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(row => (
                <div key={row}>
                  <div className="h-3 bg-slate-700/30 rounded w-24 mb-2 animate-pulse" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    {[1, 2, 3].map(col => (
                      <div key={col} className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-4 animate-pulse">
                        <div className="h-3 bg-slate-700/50 rounded w-16 mb-3" />
                        <div className="h-4 bg-slate-700/50 rounded w-full mb-2" />
                        <div className="h-3 bg-slate-700/50 rounded w-3/4" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : editorialItems.length === 0 ? (
            <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-4 text-center">
              <p className="text-sm text-slate-500">Could not load editorials. Check back later.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {(() => {
                // Group by source, keep 3 per source
                const bySource: Record<string, any[]> = {};
                const sourceOrder = ['the-hindu', 'indian-express', 'livelaw'];
                const sourceMeta: Record<string, { name: string; icon: string }> = {
                  'the-hindu': { name: 'The Hindu', icon: '📰' },
                  'indian-express': { name: 'Indian Express', icon: '📰' },
                  'livelaw': { name: 'LiveLaw', icon: '⚖️' },
                };

                for (const item of editorialItems) {
                  if (!bySource[item.sourceId]) bySource[item.sourceId] = [];
                  if (bySource[item.sourceId].length < 3) bySource[item.sourceId].push(item);
                }

                return sourceOrder.map(sourceId => {
                  const items = bySource[sourceId] || [];
                  if (items.length === 0) return null;
                  const meta = sourceMeta[sourceId];

                  return (
                    <div key={sourceId}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm">{meta?.icon}</span>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{meta?.name}</span>
                        <span className="text-[10px] text-slate-600">· {items.length} article{items.length !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                        {items.map((item: any) => (
                          <a
                            key={`${item.sourceId}-${item.link}`}
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 hover:border-indigo-600/50 hover:bg-slate-800 transition group flex flex-col"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              {item.pubDate && (
                                <span className="text-[10px] text-slate-500">
                                  {(() => {
                                    const d = new Date(item.pubDate);
                                    const now = new Date();
                                    const diff = Math.round((now.getTime() - d.getTime()) / 3600000);
                                    if (diff < 1) return 'Just now';
                                    if (diff < 24) return `${diff}h ago`;
                                    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                                  })()}
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-medium text-white group-hover:text-indigo-300 transition leading-snug line-clamp-3">
                              {item.title}
                            </p>
                            <div className="mt-auto pt-2">
                              <span className="text-[10px] text-indigo-400/70 group-hover:text-indigo-300 transition">
                                Read full ↗
                              </span>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>

        {/* ════════════════════════════════════════════ */}
        {/* #7 — QUICK PRACTICE SECTION CARDS             */}
        {/* ════════════════════════════════════════════ */}
        <div>
          <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <span>⚡</span> Quick Practice
            {profile?.subscription_plan === 'free' && (
              <span className="text-xs font-normal text-slate-500 ml-auto">
                {(profile.daily_free_questions ?? 10)} free questions remaining
              </span>
            )}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
            {SECTIONS.map(s => (
              <Link
                key={s.id}
                href={`/student/practice`}
                onClick={() => sessionStorage.setItem('practiceSection', s.id)}
                className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3.5 hover:border-indigo-600/50 hover:bg-slate-800 transition text-center group"
              >
                <span className="text-xl block mb-1 group-hover:scale-110 transition-transform">{s.icon}</span>
                <p className="text-xs font-semibold text-white truncate">{s.label}</p>
                <p className="text-[10px] text-slate-500 truncate">{s.desc}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* ════════════════════════════════════════════ */}
        {/* #8 — RECENT ACTIVITY                           */}
        {/* ════════════════════════════════════════════ */}
        {noActivity ? (
          <div className="bg-slate-800/40 border-2 border-dashed border-slate-700/50 rounded-xl p-12 text-center">
            <div className="text-4xl mb-3">📭</div>
            <h2 className="text-lg font-bold text-white mb-1">No Practice Yet</h2>
            <p className="text-sm text-slate-400 mb-5 max-w-sm mx-auto">
              Pick a section above and start practicing with instant feedback!
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/student/practice"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition shadow-sm">
                🎯 Start Practicing
              </Link>
              <Link href="/student/tests"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-slate-800 border border-slate-600 text-slate-300 hover:bg-slate-700 transition shadow-sm">
                📝 Browse Tests
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <span>📋</span> Recent Activity
                <span className="text-xs font-normal text-slate-500">
                  {practiceSessions.length > 0 ? `· ${totalPracticeQ} practice Q` : ''}
                  {attempts.length > 0 ? ` · ${attempts.length} tests` : ''}
                </span>
              </h2>
              <Link href="/student/analytics" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                View Analytics →
              </Link>
            </div>

            <div className="space-y-2.5">
              {/* Practice sessions first (most recent) */}
              {practiceSessions.slice(0, 5).map(s => {
                const pct = s.response_count > 0
                  ? Math.round((s.correct_count_from_resp / s.response_count) * 100) : 0;
                return (
                  <div key={s.id} className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden hover:border-slate-600/50 transition">
                    <div className="px-4 py-3 flex items-center gap-3">
                      <span className="text-xl shrink-0">{SECTION_ICONS[s.section] || '📝'}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white truncate">{s.section}</p>
                        <p className="text-[10px] text-slate-500">
                          {new Date(s.started_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          {s.total_time > 0 && <> · ⏱ {Math.round(s.total_time / s.response_count)}s/q</>}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-slate-400">
                          {s.correct_count_from_resp}/{s.response_count}
                        </span>
                        <span className={`text-sm font-bold ${
                          pct >= 70 ? 'text-green-400' : pct >= 40 ? 'text-amber-400' : 'text-red-400'
                        }`}>
                          {pct}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Test attempts (if any) */}
              {attempts.slice(0, 5).map(a => {
                const done = !!a.submitted_at;
                const pct = a.total_score ?? 0;
                return (
                  <div key={a.id} className={`bg-slate-800/60 border rounded-xl overflow-hidden transition ${
                    done ? 'border-slate-700/50 hover:border-slate-600/50' : 'border-amber-700/40 hover:border-amber-600/50'
                  }`}>
                    <div className="px-4 py-3 flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                        done ? 'bg-green-900/50 text-green-400' : 'bg-amber-900/50 text-amber-400'
                      }`}>
                        #{a.attempt_number}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white truncate">{a.test_title}</p>
                        <p className="text-[10px] text-slate-500">
                          {new Date(a.started_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          {done && a.submitted_at && (
                            <> · {formatTime(Math.round((new Date(a.submitted_at).getTime() - new Date(a.started_at).getTime()) / 1000))}</>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {done ? (
                          <>
                            <span className={`text-sm font-bold ${
                              pct >= 70 ? 'text-green-400' : pct >= 40 ? 'text-amber-400' : 'text-red-400'
                            }`}>{pct}%</span>
                            <Link href={`/student/tests/${a.test_id}/review?attempt=${a.id}`}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-indigo-900/40 text-indigo-300 hover:bg-indigo-800/50 transition">
                              Review
                            </Link>
                          </>
                        ) : (
                          <>
                            <span className="text-[10px] font-medium text-amber-400 bg-amber-900/30 px-2 py-1 rounded-full">
                              ⏳ In Progress
                            </span>
                            <Link href={`/student/tests/${a.test_id}`}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-amber-900/30 text-amber-300 hover:bg-amber-800/40 transition">
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
