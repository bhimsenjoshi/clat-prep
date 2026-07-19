'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import PageHeader from '@/components/PageHeader';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const SECTIONS = [
  { id: 'English Language', label: 'English Language', icon: '⚖️', color: 'indigo' },
  { id: 'Current Affairs Including General Knowledge', label: 'Current Affairs Including General Knowledge', icon: '📜', color: 'emerald' },
  { id: 'Legal Reasoning', label: 'Legal Reasoning', icon: '🔨', color: 'amber' },
  { id: 'Logical Reasoning', label: 'Logical Reasoning', icon: '☸️', color: 'purple' },
  { id: 'Quantitative Techniques', label: 'Quantitative Techniques', icon: '📂', color: 'rose' },
] as const;

interface Question {
  id: string;
  section: string;
  topic: string;
  question_text: string;
  passage: string | null;
  passage_id: string | null;
  options: Record<string, string>;
  difficulty: string;
  correct_option: string;
  explanation?: string;
  question_number?: number;
}

interface AnswerResult {
  is_correct: boolean;
  correct_option: string;
  explanation: string | Record<string, any>;
  your_answer: string;
  attempted: boolean;
  time_taken_seconds?: number;
}

interface TrackedResponse {
  question: Question;
  result: AnswerResult;
}

type Phase = 'select' | 'answering' | 'reviewing' | 'complete';

export default function PracticeQuiz() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('select');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dailyRemaining, setDailyRemaining] = useState<number | string>(10);
  const [authCheckDone, setAuthCheckDone] = useState(false);
  const supabase = createClient();

  // Passage-grouped state
  const [passageGroups, setPassageGroups] = useState<Question[][]>([]);
  const [currentPassageIdx, setCurrentPassageIdx] = useState(0);
  const [passageText, setPassageText] = useState<string | null>(null);
  const [passageExpanded, setPassageExpanded] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({}); // question_id -> selected option
  const [results, setResults] = useState<Record<string, AnswerResult>>({}); // question_id -> result after submit
  const [trackedResponses, setTrackedResponses] = useState<TrackedResponse[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerPaused, setTimerPaused] = useState(false);
  const timerRef = useRef<number>(Date.now());
  const pauseAccumulatedRef = useRef<number>(0);
  const passageTimerStartRef = useRef<number>(Date.now());
  const [resetFlag, setResetFlag] = useState(false);
  const [allPassageResults, setAllPassageResults] = useState<Record<number, Record<string, AnswerResult>>>({}); // passageIdx -> results

  // Track answered counts per passage for navigation
  const groupedAnswerCount = useCallback((passageIdx: number) => {
    const qs = passageGroups[passageIdx] || [];
    if (passageIdx === currentPassageIdx) {
      return qs.filter(q => answers[q.id]).length;
    }
    // For already-submitted passages, count from stored results
    const stored = allPassageResults[passageIdx];
    if (stored) return Object.keys(stored).length;
    return 0;
  }, [passageGroups, currentPassageIdx, answers, allPassageResults]);

  // Auth check + auto-start from dashboard card click
  useEffect(() => {
    fetch('/api/me').then(r => {
      if (!r.ok) router.push('/auth/login');
      else {
        setAuthCheckDone(true);
        const storedSection = sessionStorage.getItem('practiceSection');
        if (storedSection && SECTIONS.some(s => s.id === storedSection)) {
          sessionStorage.removeItem('practiceSection');
          startQuiz(storedSection);
        }
      }
    });
  }, [router]);

  // Timer tick
  useEffect(() => {
    if (phase !== 'answering' || timerPaused) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - timerRef.current) / 1000));
    }, 250);
    return () => clearInterval(interval);
  }, [phase, timerPaused]);

  // Fetch passage text when passage changes
  const currentQuestions = passageGroups[currentPassageIdx] || [];
  const currentPassageId = currentQuestions[0]?.passage_id || null;

  useEffect(() => {
    if (!currentPassageId) {
      setPassageText(null);
      setPassageExpanded(true);
      return;
    }
    supabase
      .from('practice_passages')
      .select('content')
      .eq('id', currentPassageId)
      .single()
      .then(({ data }) => {
        if (data?.content) setPassageText(data.content);
      });
  }, [currentPassageId, supabase]);

  // ── Timer controls ──

  const togglePause = () => {
    if (timerPaused) {
      const pauseDuration = Date.now() - pauseAccumulatedRef.current;
      timerRef.current = timerRef.current + pauseDuration;
      pauseAccumulatedRef.current = 0;
      setTimerPaused(false);
    } else {
      pauseAccumulatedRef.current = Date.now();
      setTimerPaused(true);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const TimerDisplay = () => (
    <span className={`text-xs font-mono font-semibold tabular-nums flex items-center gap-1 ${
      timerPaused ? 'text-amber-400' : 'text-accent'
    }`}>
      <span>{timerPaused ? '⏸️' : '⏱️'}</span>
      {formatTime(elapsedSeconds)}
    </span>
  );

  // ── Start quiz ──

  const startQuiz = async (section: string) => {
    setLoading(true);
    setSelectedSection(section);
    setPassageGroups([]);
    setCurrentPassageIdx(0);
    setAnswers({});
    setResults({});
    setTrackedResponses([]);
    setPassageText(null);
    setPhase('select');
    setTimerPaused(false);
    pauseAccumulatedRef.current = 0;
    setElapsedSeconds(0);
    timerRef.current = Date.now();
    passageTimerStartRef.current = Date.now();
    setResetFlag(false);

    try {
      const res = await fetch('/api/quiz/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'DAILY_LIMIT_REACHED') {
          alert(data.message);
          setLoading(false);
          return;
        }
        throw new Error(data.error || 'Failed to start');
      }

      if (data.needs_seeding) {
        if (data.all_exhausted) {
          alert(data.message || "You've completed all questions in this section! New questions coming daily.");
        } else {
          const debugMsg = data.total_questions !== undefined
            ? `\n\nDebug: ${data.total_questions}Q fetched, ${data.kept_passages || '?'} passages kept, ${data.passage_map_passages || '?'} unfiltered, ${data.passage_questions || '?'} unanswered`
            : '';
          alert('No questions available for this section yet. Questions are being generated daily!' + debugMsg);
        }
        setLoading(false);
        return;
      }

      setSessionId(data.session_id);
      setDailyRemaining(data.daily_remaining);
      if (data._debug) console.log('[quiz/start debug]', JSON.stringify(data._debug));

      // Group questions by passage_id
      const questions: Question[] = data.questions || [];
      const groups: Record<string, Question[]> = {};
      for (const q of questions) {
        const pid = q.passage_id || 'standalone';
        if (!groups[pid]) groups[pid] = [];
        groups[pid].push(q);
      }
      const grouped = Object.values(groups)
        .filter(g => g.length > 0)
        .map(g => g.sort((a, b) => (a.question_number || 0) - (b.question_number || 0)));

      setPassageGroups(grouped);
      setCurrentPassageIdx(0);
      setAnswers({});
      setResults({});
      setPhase('answering');
    } catch (err) {
      console.error('Start error:', err);
      alert('Failed to start quiz: ' + (err instanceof Error ? err.message : String(err)));
    }
    setLoading(false);
  };

  // ── Select/deselect answer ──

  const selectAnswer = (questionId: string, option: string) => {
    if (phase !== 'answering') return;
    setAnswers(prev => ({
      ...prev,
      [questionId]: prev[questionId] === option ? '' : option, // toggle off if same
    }));
  };

  // ── Submit current passage ──

  const submitPassage = async () => {
    if (phase !== 'answering' || !sessionId) return;
    const qs = currentQuestions;

    const now = Date.now();
    const timeTaken = Math.round((now - passageTimerStartRef.current) / 1000);

    // Build results client-side
    const newResults: Record<string, AnswerResult> = {};
    const newTracked: TrackedResponse[] = [];
    for (const q of qs) {
      const ans = answers[q.id] || '';
      const attempted = ans !== '';
      const isCorrect = attempted && ans === q.correct_option;
      const exp = typeof q.explanation === 'string'
        ? (() => { try { return JSON.parse(q.explanation); } catch { return q.explanation; } })()
        : q.explanation;
      const r: AnswerResult = {
        is_correct: isCorrect,
        correct_option: q.correct_option,
        explanation: exp,
        your_answer: ans,
        attempted,
        time_taken_seconds: timeTaken,
      };
      newResults[q.id] = r;
      newTracked.push({ question: q, result: r });
    }
    setResults(newResults);
    setTrackedResponses(prev => [...prev, ...newTracked]);
    setAllPassageResults(prev => ({ ...prev, [currentPassageIdx]: newResults }));
    setPhase('reviewing');

    // Fire batch API calls in background
    for (const q of qs) {
      const ans = answers[q.id] || '';
      try {
        await fetch('/api/quiz/respond', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            question_id: q.id,
            selected_option: ans,
            time_taken_seconds: timeTaken,
          }),
        });
      } catch (err) {
        console.error('Failed to record answer:', err);
      }
    }

    // Mark the passage timer for next passage
    passageTimerStartRef.current = now;
  };

  // ── Previous passage (review) ──

  const prevPassage = () => {
    if (currentPassageIdx <= 0) return;
    setCurrentPassageIdx(prev => prev - 1);
    // Load stored results for the previous passage
    const stored = allPassageResults[currentPassageIdx - 1];
    setResults(stored || {});
    setPhase('reviewing');
    setPassageExpanded(true);
  };

  // ── Next passage ──

  const nextPassage = () => {
    if (currentPassageIdx + 1 >= passageGroups.length) {
      // All done — end session
      if (sessionId) {
        supabase
          .from('quiz_sessions')
          .update({ ended_at: new Date().toISOString() })
          .eq('id', sessionId)
          .then();
      }
      setPhase('complete');
      return;
    }
    const nextIdx = currentPassageIdx + 1;
    const stored = allPassageResults[nextIdx];
    if (stored) {
      // Already submitted — go to review
      setCurrentPassageIdx(nextIdx);
      setResults(stored);
      setPhase('reviewing');
    } else {
      // Not yet answered
      setCurrentPassageIdx(nextIdx);
      setAnswers({});
      setResults({});
      setPhase('answering');
    }
    setPassageExpanded(true);
    setTimerPaused(false);
    pauseAccumulatedRef.current = 0;
    setElapsedSeconds(0);
    timerRef.current = Date.now();
  };

  // ── Start new session ──

  const startNew = () => {
    setPhase('select');
    setSelectedSection(null);
    setSessionId(null);
    setPassageGroups([]);
    setCurrentPassageIdx(0);
    setAnswers({});
    setResults({});
    setTrackedResponses([]);
    setPassageText(null);
    setTimerPaused(false);
    pauseAccumulatedRef.current = 0;
    setElapsedSeconds(0);
    setResetFlag(false);
    setAllPassageResults({});
  };

  // ── Share result/explanation component ──

  function ResultBody({ response, question: q, showIds }: { response: AnswerResult; question: Question; showIds?: boolean }) {
    return (
      <>
        <div className="flex items-center gap-2 mb-2">
          {!response.attempted ? (
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-muted bg-opacity-20 text-muted">— Skipped</span>
          ) : (
          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
            response.is_correct ? 'bg-success/30 text-success' : 'bg-danger/30 text-danger'
          }`}>
            {response.is_correct ? '✓ Correct' : '✗ Incorrect'}
          </span>
          )}
          <span className="text-[10px] text-muted font-mono">
            {response.attempted
              ? `Your: ${response.your_answer || '—'} · Correct: ${response.correct_option}`
              : `Correct: ${response.correct_option}`
            }
          </span>
          {showIds && (
            <span className="text-[10px] text-muted font-mono ml-auto" title="Passage ID · Question ID">
              #{q.passage_id?.slice(0, 8)} · q:{q.id.slice(0, 8)}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-1.5 mb-3">
          {(() => {
            let opts = q.options;
            if (typeof opts === 'string') { try { opts = JSON.parse(opts); } catch {} }
            return Object.entries(opts).map(([key, value]) => {
              const isSelected = response.your_answer === key;
              const isCorrectOpt = response.correct_option === key;
              return (
                <div key={key} className={`flex items-center gap-2 border rounded-lg px-3 py-1.5 text-xs ${
                  isCorrectOpt
                    ? 'border-success bg-success/30 ring-1 ring-success/50'
                    : isSelected
                    ? 'border-danger bg-danger/30 ring-1 ring-danger/50'
                    : 'border-theme'
                }`}>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isCorrectOpt ? 'bg-success text-white' :
                    isSelected ? 'bg-danger text-white' :
                    'bg-theme-subtle text-secondary'
                  }`}>
                    {isCorrectOpt ? '✓' : isSelected ? '✗' : key}
                  </span>
                  <span className="flex-1 text-secondary">{value}</span>
                </div>
              );
            });
          })()}
        </div>
        {response.explanation && (
          <div className="space-y-2">
            {(() => {
              const exp = response.explanation;
              if (typeof exp === 'string') {
                return (
                  <div className="p-2.5 bg-info/20 border border-info/50 rounded-lg">
                    <p className="text-[10px] font-medium text-info uppercase tracking-wider mb-1">Explanation</p>
                    <p className="text-xs text-secondary leading-relaxed">{exp}</p>
                  </div>
                );
              }
              return (
                <>
                  <div className="p-2.5 bg-success/20 border border-success/50 rounded-lg">
                    <p className="text-[10px] font-medium text-success uppercase tracking-wider mb-1">✅ Why this is correct</p>
                    <p className="text-xs text-secondary leading-relaxed">{exp.correct_answer_rationale || ''}</p>
                  </div>
                  {response.attempted && !response.is_correct && exp.wrong_answer_guidance && (
                    <div className="p-2.5 bg-amber-900/30 border border-warning/50 rounded-lg">
                      <p className="text-[10px] font-medium text-warning uppercase tracking-wider mb-1">💡 Pointer</p>
                      <p className="text-xs text-secondary leading-relaxed">{exp.wrong_answer_guidance}</p>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </>
    );
  }

  // ══════════════════════════ RENDER ══════════════════════════

  if (!authCheckDone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  // ── SECTION SELECTOR ──

  if (phase === 'select') {
    return (
      <div className="min-h-screen bg-page text-primary">
        <PageHeader title='Practice' navItems={[{href:'/student/dashboard',label:'Dashboard',icon:'🏛️'}]} />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <h1 className="text-2xl font-bold mb-2 text-heading">📋 Practice Questions</h1>
          <p className="text-secondary text-sm mb-8">
            Pick a section to practice. Answer all passage questions together (just like the real CLAT!).
            {typeof dailyRemaining === 'number' && (
              <span className="ml-2 text-accent">({dailyRemaining} free questions remaining today)</span>
            )}
          </p>

          {resetFlag && (
            <div className="mb-6 bg-magenta/20 border border-magenta/50 rounded-xl p-3">
              <p className="text-xs text-magenta font-medium">
                🔄 You've seen all questions! Reiterating for revision.
              </p>
            </div>
          )}

          {dailyRemaining !== 'unlimited' && typeof dailyRemaining === 'number' && dailyRemaining <= 3 && (
            <Link href="/student/profile"
              className="block mb-6 bg-gradient-to-r from-amber-900/30 to-orange-900/30 border border-warning/50 rounded-xl p-4 hover:border-warning transition group">
              <div className="flex items-center gap-3">
                <span className="text-xl">🎁</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-warning">Running low on free questions!</p>
                  <p className="text-xs text-secondary">Get Premium free — limited time offer 🎉</p>
                </div>
                <span className="text-warning group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          )}

          <div className="grid gap-3">
            {SECTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => startQuiz(s.id)}
                disabled={loading}
                className="flex items-center gap-4 p-4 rounded-xl border border-theme bg-card hover:border-accent hover:bg-card-hover transition disabled:opacity-50 text-left"
              >
                <span className="text-2xl">{s.icon}</span>
                <div>
                  <p className="font-medium text-primary">{s.label}</p>
                  <p className="text-xs text-secondary">Practice {s.label.toLowerCase()} questions</p>
                </div>
                {loading && selectedSection === s.id ? (
                  <span className="ml-auto animate-spin w-5 h-5 border-2 border-accent border-t-transparent rounded-full" />
                ) : (
                  <span className="ml-auto text-secondary">→</span>
                )}
              </button>
            ))}
          </div>
          <Link href="/student/dashboard" className="block text-center text-sm text-muted mt-8 hover:text-primary transition">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // ── COMPLETE SCREEN ──

  if (phase === 'complete') {
    const correct = trackedResponses.filter(r => r.result.is_correct).length;
    const total = trackedResponses.length;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const icon = pct >= 70 ? '🎉' : pct >= 40 ? '💪' : '📚';

    return (
      <div className="min-h-screen bg-page text-primary flex items-center justify-center">
        <PageHeader title='Practice' navItems={[{href:'/student/dashboard',label:'Dashboard',icon:'🏛️'}]} />
        <div className="text-center max-w-md px-4">
          <p className="text-5xl mb-4">{icon}</p>
          <h2 className="text-2xl font-bold mb-2 text-heading">Session Complete!</h2>
          <div className="bg-card border border-theme rounded-xl p-6 mb-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-3xl font-bold text-success">{correct}</p>
                <p className="text-sm text-secondary">Correct</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-danger">{total - correct}</p>
                <p className="text-sm text-secondary">Incorrect</p>
              </div>
            </div>
            {trackedResponses.length > 0 && (
              <div className="text-xs text-secondary mb-3">
                Avg ⏱ {Math.round(trackedResponses.reduce((s, r) => s + (r.result.time_taken_seconds ?? 0), 0) / trackedResponses.length)}s per passage
              </div>
            )}
            <div className="pt-4 border-t border-theme">
              <p className={`text-4xl font-bold ${
                pct >= 70 ? 'text-success' : pct >= 40 ? 'text-warning' : 'text-danger'
              }`}>
                {pct}%
              </p>
              <p className="text-sm text-secondary">Accuracy</p>
              <p className="text-xs text-secondary mt-2">
                {selectedSection} · {total} question{total !== 1 ? 's' : ''} · {passageGroups.length} passage{passageGroups.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={startNew} className="border border-theme px-5 py-2.5 rounded-xl font-medium hover:bg-card-hover transition">
              🔄 Practice Again
            </button>
            <Link href="/student/dashboard" className="border border-theme px-5 py-2.5 rounded-xl font-medium hover:bg-card-hover transition">
              📊 Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── ACTIVE: ANSWERING OR REVIEWING ──

  const isReviewing = phase === 'reviewing';
  const totalPassages = passageGroups.length;
  const passageNum = currentPassageIdx + 1;
  const isLastPassage = currentPassageIdx >= totalPassages - 1;

  return (
    <div className="min-h-screen bg-page text-primary">
      <PageHeader title='Practice' navItems={[{href:'/student/dashboard',label:'Dashboard',icon:'🏛️'}]} />

      {/* Top bar */}
      <div className="border-b border-theme bg-card-hover backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={isReviewing ? undefined : startNew} className="text-sm text-muted hover:text-primary transition flex items-center gap-1.5">
            {!isReviewing && <><span className="text-base">←</span> <span className="text-xs">Exit</span></>}
          </button>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-muted font-mono">
              Passage {passageNum}/{totalPassages} · {currentQuestions.length} Q
            </span>
            {!isReviewing && <TimerDisplay />}
            {!isReviewing && (
              <button
                onClick={togglePause}
                className={`text-[10px] font-medium px-2 py-1 rounded-lg transition ${
                  timerPaused
                    ? 'bg-tint-green text-stat-emerald hover:bg-emerald-900/40'
                    : 'bg-tint-amber text-stat-amber hover:bg-amber-900/40'
                }`}
              >
                {timerPaused ? '▶ Resume' : '⏸ Pause'}
              </button>
            )}
            <span className="text-xs text-secondary">
              {typeof dailyRemaining === 'number' ? `${dailyRemaining} free today` : '♾️ Unlimited'}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Passage */}
        {currentQuestions.length > 0 && passageText && (
          <div className="mb-4 bg-card border border-theme rounded-xl overflow-hidden">
            <button
              onClick={() => setPassageExpanded(!passageExpanded)}
              className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-card-hover transition"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-xs text-accent uppercase tracking-wide">Passage</span>
                {isReviewing && <span className="text-[10px] text-muted">(for review)</span>}
              </div>
              <svg className={`w-4 h-4 text-secondary transition-transform ${passageExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {passageExpanded && (
              <div className="px-5 pb-5 max-h-60 overflow-y-auto">
                <p className="text-sm text-secondary leading-relaxed whitespace-pre-wrap">
                  {passageText}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Passage results summary (review only) */}
        {isReviewing && (() => {
          const qs = passageGroups[currentPassageIdx] || [];
          const correct = qs.filter(q => results[q.id]?.is_correct).length;
          const wrong = qs.filter(q => results[q.id]?.attempted && !results[q.id].is_correct).length;
          const unanswered = qs.filter(q => results[q.id] && !results[q.id].attempted).length;
          const marks = correct - wrong * 0.25;
          const timeTaken = qs[0] ? results[qs[0].id]?.time_taken_seconds : 0;
          return (
            <div className="mb-4 bg-card border border-theme rounded-xl p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-medium text-accent uppercase tracking-wide">Passage Results</span>
                {timeTaken != null && (
                  <span className="text-[10px] text-muted font-mono">⏱ {timeTaken}s</span>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-success font-medium">✓ +{correct}</span>
                {wrong > 0 && <span className="text-danger font-medium">✗ -{wrong * 0.25}</span>}
                {unanswered > 0 && <span className="text-muted">— {unanswered} skipped</span>}
                <span className="ml-auto text-xs font-bold tabular-nums text-primary">
                  Score: {marks >= 0 ? '+' : ''}{marks.toFixed(2)}
                </span>
              </div>
            </div>
          );
        })()}

        {/* Questions */}
        <div className="space-y-4">
          {currentQuestions.map((q, qIdx) => (
            <div key={q.id} className={`bg-card border rounded-xl p-4 ${
              isReviewing
                ? (results[q.id]?.is_correct ? 'border-success/50' : 'border-danger/50')
                : 'border-theme'
            }`}>
              {/* Question header */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-secondary flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-theme-subtle text-secondary flex items-center justify-center text-[10px] font-bold">
                    {qIdx + 1}
                  </span>
                  {isReviewing && results[q.id] && q.difficulty && (
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                      q.difficulty === 'hard' ? 'bg-danger/50 text-danger' :
                      q.difficulty === 'easy' ? 'bg-success/50 text-success' :
                      'bg-info/50 text-info'
                    }`}>
                      {q.difficulty}
                    </span>
                  )}
                </span>
                {isReviewing && results[q.id] && (
                  <span className={`text-[10px] font-bold ${
                    results[q.id].is_correct ? 'text-success' : 'text-danger'
                  }`}>
                    {results[q.id].is_correct ? '✓' : '✗'}
                  </span>
                )}
              </div>

              <p className="text-sm font-medium mb-3 text-primary leading-relaxed">{q.question_text}</p>

              {/* Options */}
              {!isReviewing ? (
                <div className="grid grid-cols-2 gap-2">
                  {(() => {
                    let opts = q.options;
                    if (typeof opts === 'string') { try { opts = JSON.parse(opts); } catch {} }
                    return Object.entries(opts).map(([key, value]) => {
                      const selected = answers[q.id] === key;
                      return (
                        <button
                          key={key}
                          onClick={() => selectAnswer(q.id, key)}
                          className={`text-left px-3 py-2 rounded-xl border text-xs transition ${
                            selected
                              ? 'border-accent bg-accent-subtle text-accent ring-1 ring-accent/50'
                              : 'border-theme hover:border-theme-subtle hover:bg-card-hover'
                          }`}
                        >
                          <span className="font-semibold mr-2 text-secondary">{key}.</span>
                          <span className="text-primary">{value}</span>
                        </button>
                      );
                    });
                  })()}
                </div>
              ) : results[q.id] ? (
                <ResultBody response={results[q.id]} question={q} showIds={true} />
              ) : null}
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex justify-center gap-3">
          {isReviewing ? (
            <>
              <button
                onClick={prevPassage}
                disabled={currentPassageIdx <= 0}
                className="bg-card border border-theme px-4 py-2.5 rounded-xl font-medium hover:bg-card-hover transition disabled:opacity-40 text-xs"
              >
                ← Prev Passage
              </button>
              <span className="text-[10px] text-muted self-center">
                {currentPassageIdx + 1}/{totalPassages}
              </span>
              <button
                onClick={nextPassage}
                className="bg-accent text-white px-4 py-2.5 rounded-xl font-medium hover:bg-accent-hover transition text-xs"
              >
                {isLastPassage ? '📊 Results' : 'Next Passage →'}
              </button>
            </>
          ) : (
            <button
              onClick={submitPassage}
              className="bg-accent text-white px-5 py-2.5 rounded-xl font-medium hover:bg-accent-hover transition text-sm"
            >
              📝 Submit Passage ({currentQuestions.filter(q => answers[q.id]).length}/{currentQuestions.length})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
