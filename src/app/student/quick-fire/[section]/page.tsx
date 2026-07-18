'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import { createClient } from '@/lib/supabase/client';

interface QuestionData {
  id: string;
  section: string;
  topic: string;
  question_text: string;
  options: Record<string, string>;
  difficulty: string;
  explanation?: any;
  tags: string[];
}

interface AnswerResult {
  is_correct: boolean;
  correct_option: string;
  explanation: string | Record<string, any>;
  your_answer: string;
}

interface TrackedResponse {
  question: QuestionData;
  result: AnswerResult;
  selected_option: string;
}

const SECTION_MAP: Record<string, string> = {
  'english-language': 'English Language',
  'current-affairs-including-general-knowledge': 'Current Affairs Including General Knowledge',
  'legal-reasoning': 'Legal Reasoning',
  'logical-reasoning': 'Logical Reasoning',
  'quantitative-techniques': 'Quantitative Techniques',
};

const SECTION_ICONS: Record<string, string> = {
  'English Language': '📖',
  'Current Affairs Including General Knowledge': '📰',
  'Legal Reasoning': '⚖️',
  'Logical Reasoning': '🧠',
  'Quantitative Techniques': '📐',
};

export default function QuickFireQuiz() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const sectionSlug = params.section as string;
  const sectionName = SECTION_MAP[sectionSlug];

  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [answering, setAnswering] = useState(false);
  const [stats, setStats] = useState({ correct: 0, total: 0 });
  const [sessionComplete, setSessionComplete] = useState(false);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [trackedResponses, setTrackedResponses] = useState<TrackedResponse[]>([]);
  const [historyPos, setHistoryPos] = useState<number | null>(null);
  const [timerPaused, setTimerPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<number>(Date.now());
  const pauseAccumulatedRef = useRef<number>(0);

  useEffect(() => {
    if (!sectionName) return;
    startSession();
  }, [sectionName]);

  // ── Live timer tick ──
  useEffect(() => {
    if (!sessionId || loading || sessionComplete || result) return;
    const interval = setInterval(() => {
      if (!timerPaused) {
        setElapsedSeconds(Math.floor((Date.now() - timerRef.current) / 1000));
      }
    }, 250);
    return () => clearInterval(interval);
  }, [sessionId, loading, sessionComplete, result, timerPaused]);

  const startSession = async () => {
    setLoading(true);
    try {
      await supabase.auth.getSession();

      const res = await fetch('/api/quiz/quickfire/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: sectionName }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'DAILY_LIMIT_REACHED') {
          alert(data.message);
          router.push('/student/quick-fire');
          return;
        }
        throw new Error(data.error || 'Failed to start');
      }

      if (data.needs_seeding || !data.questions || data.questions.length === 0) {
        alert('No questions available yet. Questions are being generated daily!');
        router.push('/student/quick-fire');
        return;
      }

      setSessionId(data.session_id);
      setQuestions(data.questions);
      setTotalQuestions(data.questions.length);
      setCurrentIdx(0);
      timerRef.current = Date.now();
      pauseAccumulatedRef.current = 0;
      setElapsedSeconds(0);
      setTimerPaused(false);
    } catch (err) {
      console.error('Start error:', err);
      alert('Failed to start. Please try again.');
      router.push('/student/quick-fire');
    }
    setLoading(false);
  };

  const submitAnswer = async (option: string) => {
    if (!sessionId || answering) return;
    // Derive current question from trackedResponses (if browsing history) or questions array
    const question = currentIdx < questions.length ? questions[currentIdx] : null;
    if (!question) return;

    setAnswering(true);
    setSelected(option);
    setTimerPaused(true);
    pauseAccumulatedRef.current += Math.floor((Date.now() - timerRef.current) / 1000) - elapsedSeconds;

    const timeTaken = Math.round((Date.now() - (timerRef.current + pauseAccumulatedRef.current * 1000 - elapsedSeconds * 1000)) / 1000);
    const nextIdx = currentIdx + 1;

    try {
      const res = await fetch('/api/quiz/quickfire/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          question_id: question.id,
          selected_option: option,
          time_taken_seconds: Math.max(1, timeTaken),
          next_index: nextIdx,
          total: totalQuestions,
        }),
      });

      const data = await res.json();
      setResult(data.result);

      const newResponse: TrackedResponse = {
        question,
        result: data.result,
        selected_option: option,
      };

      setTrackedResponses(prev => [...prev, newResponse]);
      setStats(prev => ({
        correct: prev.correct + (data.result.is_correct ? 1 : 0),
        total: prev.total + 1,
      }));

      if (data.session_complete) {
        setSessionComplete(true);
      }
    } catch (err) {
      console.error('Submit error:', err);
      setTimerPaused(false);
    }
    setAnswering(false);
  };

  // ── Navigation ──
  const nextQuestion = () => {
    const nextPos = (historyPos !== null ? historyPos : trackedResponses.length - 1) + 1;

    if (nextPos >= trackedResponses.length) {
      // Move to next unanswered question
      const newIdx = currentIdx + 1;
      if (newIdx < questions.length) {
        setCurrentIdx(newIdx);
        setHistoryPos(null);
        setSelected(null);
        setResult(null);
        timerRef.current = Date.now();
        pauseAccumulatedRef.current = 0;
        setTimerPaused(false);
        setElapsedSeconds(0);
      }
    } else {
      // Move forward within trackedResponses
      setHistoryPos(nextPos);
      setResult(trackedResponses[nextPos].result);
      setSelected(trackedResponses[nextPos].selected_option);
    }
  };

  const prevQuestion = () => {
    if (trackedResponses.length === 0) return;
    const prevPos = (historyPos !== null ? historyPos : trackedResponses.length - 1) - 1;
    if (prevPos < 0) return;

    setHistoryPos(prevPos);
    setResult(trackedResponses[prevPos].result);
    setSelected(trackedResponses[prevPos].selected_option);
  };

  const endSession = async () => {
    if (sessionId) {
      await supabase
        .from('quiz_sessions')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', sessionId);
    }
    router.push('/student/quick-fire');
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const TimerDisplay = () => (
    <span className={`text-xs font-mono font-semibold tabular-nums flex items-center gap-1 ${
      timerPaused ? 'text-amber-400' : 'text-accent'
    }`}>
      <span>{timerPaused ? '⏸️' : '⏱️'}</span>
      {formatTime(elapsedSeconds)}
    </span>
  );

  // Determine which question/result to display
  const displayQuestion = historyPos !== null
    ? trackedResponses[historyPos]?.question ?? null
    : currentIdx < questions.length
      ? questions[currentIdx]
      : null;

  const displayResult = historyPos !== null
    ? trackedResponses[historyPos]?.result ?? null
    : result;

  const displaySelected = historyPos !== null
    ? trackedResponses[historyPos]?.selected_option ?? null
    : selected;

  const hasNext = historyPos !== null
    ? historyPos + 1 < trackedResponses.length
    : currentIdx + 1 < questions.length;

  const hasPrev = historyPos !== null
    ? historyPos > 0
    : trackedResponses.length > 0;

  // Section not found
  if (!sectionName) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page">
        <div className="text-center">
          <p className="text-5xl mb-4">❌</p>
          <h2 className="text-xl font-bold text-primary mb-2">Section Not Found</h2>
          <Link href="/student/quick-fire" className="text-accent hover:text-accent-hover">
            ← Back to Quick Fire
          </Link>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-page">
      <div className="animate-pulse flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-secondary text-sm">Loading Quick Fire...</p>
      </div>
    </div>
  );

  // Session complete
  if (sessionComplete) {
    const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
    return (
      <div className="min-h-screen flex items-center justify-center bg-page">
        <div className="text-center max-w-md">
          <p className="text-5xl mb-4">⚡</p>
          <h2 className="text-2xl font-bold text-primary mb-2">Quick Fire Complete!</h2>
          <div className="bg-card rounded-xl p-6 mb-6 border border-theme">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-3xl font-bold text-success">{stats.correct}</p>
                <p className="text-sm text-secondary">Correct</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-danger">{stats.total - stats.correct}</p>
                <p className="text-sm text-secondary">Incorrect</p>
              </div>
              <div>
                <p className={`text-3xl font-bold ${pct >= 70 ? 'text-success' : pct >= 40 ? 'text-warning' : 'text-danger'}`}>
                  {pct}%
                </p>
                <p className="text-sm text-secondary">Accuracy</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={endSession}
              className="px-6 py-3 rounded-xl font-medium bg-card text-secondary hover:bg-card-hover transition">
              ← Back to Quick Fire
            </button>
            <button onClick={() => router.push('/student/analytics')}
              className="px-6 py-3 rounded-xl font-medium bg-accent text-white hover:bg-accent-hover transition">
              📊 View Analytics
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page">
      <PageHeader title="Quick Fire" />
      {/* Top bar */}
      <div className="border-b border-theme bg-card-hover backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>⚡</span>
            <span className="text-sm font-medium text-primary">{sectionName}</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-secondary">
              <span className="font-medium text-accent">{currentIdx + 1}</span>/{totalQuestions}
            </span>
            <span className="text-secondary">
              ✅ {stats.correct}/{stats.total}
            </span>
            {/* Timer — visible during answering, not while viewing result */}
            {!displayResult && <TimerDisplay />}
            <button onClick={endSession}
              className="text-muted hover:text-primary transition">
              ✕ End
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {displayQuestion && !displayResult ? (
          // ─── Question View (no passage) ───
          <div className="space-y-6">
            <div className="bg-card rounded-xl p-6 border border-theme">
              {/* Difficulty + tags */}
              <div className="flex items-center gap-2 mb-4">
                <span className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  displayQuestion.difficulty === 'easy' ? 'bg-success/50 text-success' :
                  displayQuestion.difficulty === 'hard' ? 'bg-danger/50 text-danger' :
                  'bg-warning/50 text-warning'
                }`}>
                  {displayQuestion.difficulty}
                </span>
                {displayQuestion.tags?.length > 0 && displayQuestion.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="text-[10px] text-muted bg-card-hover px-2 py-0.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Question text — no passage display */}
              <p className="text-lg font-medium text-primary leading-relaxed mb-6">
                {displayQuestion.question_text}
              </p>

              {/* Options */}
              <div className="space-y-3">
                {Object.entries(displayQuestion.options).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => submitAnswer(key)}
                    disabled={answering}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-150 bg-card ${
                      answering
                        ? 'opacity-50 cursor-not-allowed border-theme'
                        : 'border-theme hover:border-accent hover:bg-card-hover cursor-pointer'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-card-hover flex items-center justify-center text-sm font-bold text-secondary">
                        {key}
                      </span>
                      <span className="text-sm text-primary pt-1">{value}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : displayQuestion && displayResult ? (
          // ─── Result + Explanation View ───
          <div className="space-y-4">
            {/* Result banner */}
            <div className={`rounded-xl p-4 border ${
              displayResult.is_correct
                ? 'bg-success/20 border-success/50'
                : 'bg-danger/20 border-danger/50'
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{displayResult.is_correct ? '✅' : '❌'}</span>
                <div>
                  <p className={`font-bold ${displayResult.is_correct ? 'text-success' : 'text-danger'}`}>
                    {displayResult.is_correct ? 'Correct!' : 'Incorrect'}
                  </p>
                  <p className="text-xs text-secondary mt-0.5">
                    Your answer: <span className="font-mono">{displayResult.your_answer}</span>
                    {!displayResult.is_correct && (
                      <> · Correct answer: <span className="font-mono text-success">{displayResult.correct_option}</span></>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Explanation */}
            {displayResult.explanation && (() => {
              const exp = displayResult.explanation;
              if (typeof exp === 'string') {
                return (
                  <div className="bg-card rounded-xl p-5 border border-theme">
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Explanation</p>
                    <p className="text-sm text-secondary leading-relaxed whitespace-pre-wrap">{exp}</p>
                  </div>
                );
              }
              return (
                <div className="space-y-3">
                  <div className="bg-success/20 border border-success/50 rounded-xl p-4">
                    <p className="text-[11px] font-semibold text-success uppercase tracking-wider mb-1">✅ Why this is correct</p>
                    <p className="text-sm text-secondary leading-relaxed">{exp.correct_answer_rationale || ''}</p>
                  </div>
                  {exp.incorrect_option_analysis && (
                    <div className="bg-danger/20 border border-danger/50 rounded-xl p-4">
                      <p className="text-[11px] font-semibold text-danger uppercase tracking-wider mb-2">❌ Why others are wrong</p>
                      {Object.entries(exp.incorrect_option_analysis as Record<string, string>).map(([opt, reason]) => (
                        <p key={opt} className="text-sm text-secondary leading-relaxed mb-1.5 last:mb-0">
                          <span className="font-mono font-bold text-secondary">{opt}:</span> {reason}
                        </p>
                      ))}
                    </div>
                  )}
                  {!displayResult.is_correct && exp.wrong_answer_guidance && (
                    <div className="bg-amber-900/30 border border-warning/50 rounded-xl p-4">
                      <p className="text-[11px] font-semibold text-warning uppercase tracking-wider mb-1">💡 Pointer</p>
                      <p className="text-sm text-secondary leading-relaxed">{exp.wrong_answer_guidance}</p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Navigation buttons */}
            <div className="flex gap-3">
              {hasPrev && (
                <button
                  onClick={prevQuestion}
                  className="flex-1 py-4 rounded-xl font-medium bg-card text-secondary border border-theme hover:bg-card-hover transition"
                >
                  ← Previous
                </button>
              )}
              {hasNext ? (
                <button
                  onClick={nextQuestion}
                  className={`${hasPrev ? 'flex-1' : 'w-full'} py-4 rounded-xl font-medium bg-gradient-accent text-white hover:bg-accent-hover transition shadow-lg shadow-accent/20`}
                >
                  {historyPos !== null ? 'Next →' : 'Next Question →'}
                </button>
              ) : (
                <button
                  onClick={endSession}
                  className={`${hasPrev ? 'flex-1' : 'w-full'} py-4 rounded-xl font-medium bg-gradient-accent text-white hover:bg-accent-hover transition shadow-lg shadow-accent/20`}
                >
                  📊 View Results
                </button>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
