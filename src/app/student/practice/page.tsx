'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const SECTIONS = [
  { id: 'English', label: 'English', icon: '📖', color: 'indigo' },
  { id: 'Current Affairs', label: 'Current Affairs', icon: '📰', color: 'emerald' },
  { id: 'Legal Reasoning', label: 'Legal Reasoning', icon: '⚖️', color: 'amber' },
  { id: 'Logical Reasoning', label: 'Logical Reasoning', icon: '🧠', color: 'purple' },
  { id: 'Quantitative Techniques', label: 'Quantitative Techniques', icon: '📊', color: 'rose' },
] as const;

interface Question {
  id: string;
  section: string;
  topic: string;
  question_text: string;
  passage: string | null;
  options: Record<string, string>;
  difficulty: string;
  correct_option?: string;
  explanation?: string;
}

interface AnswerResult {
  is_correct: boolean;
  correct_option: string;
  explanation: string;
  your_answer: string;
  time_taken_seconds?: number;
}

interface TrackedResponse {
  question: Question;
  result: AnswerResult;
}

export default function PracticeQuiz() {
  const router = useRouter();
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [questionIds, setQuestionIds] = useState<string[]>([]);
  const [remainingIds, setRemainingIds] = useState<string[] | null>(null);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [dailyRemaining, setDailyRemaining] = useState<number | string>(10);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [authCheckDone, setAuthCheckDone] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [trackedResponses, setTrackedResponses] = useState<TrackedResponse[]>([]);
  const timerRef = useRef<number>(Date.now());

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

  const startQuiz = async (section: string) => {
    setLoading(true);
    setSelectedSection(section);
    setResult(null);
    setSelectedOption(null);
    setSessionComplete(false);
    setCompleted(false);
    timerRef.current = Date.now();

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
          setSelectedSection(null);
          return;
        }
        throw new Error(data.error || 'Failed to start');
      }

      if (data.needs_seeding) {
        alert('No questions available for this section yet. Questions are being generated daily!');
        setLoading(false);
        setSelectedSection(null);
        return;
      }

      setSessionId(data.session_id);
      setQuestion(data.question);
      setQuestionIds(data.question_ids || []);
      setRemainingIds((data.question_ids || []).filter((id: string) => id !== data.question?.id));
      setDailyRemaining(data.daily_remaining);
      setStarted(true);
    } catch (err) {
      console.error('Start error:', err);
      alert('Failed to start quiz. Please try again.');
      setSelectedSection(null);
    }
    setLoading(false);
  };

  const answerQuestion = async (option: string) => {
    if (!question || !sessionId || selectedOption) return;
    setSelectedOption(option);
    const timeTaken = Math.round((Date.now() - timerRef.current) / 1000);

    // ── Instant client-side check ──
    const isCorrectLocally = option === question.correct_option;
    const localResult: AnswerResult = {
      is_correct: isCorrectLocally,
      correct_option: question.correct_option ?? '?',
      explanation: question.explanation ?? '',
      your_answer: option,
      time_taken_seconds: timeTaken,
    };
    setResult(localResult);
    if (question) {
      setTrackedResponses(prev => [...prev, { question, result: localResult }]);
    }

    // ── Fire API call in background to record response + fetch next question ──
    try {
      const res = await fetch('/api/quiz/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          question_id: question.id,
          selected_option: option,
          time_taken_seconds: timeTaken,
          remaining_ids: remainingIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit answer');

      if (data.next_question) {
        setQuestion(data.next_question);
        setRemainingIds(data.remaining_ids);
      } else {
        setSessionComplete(true);
      }
    } catch (err) {
      console.error('Background respond error:', err);
    }
  };

  const nextQuestion = () => {
    setResult(null);
    setSelectedOption(null);
    timerRef.current = Date.now();
  };

  const endSession = async () => {
    if (sessionId) {
      const supabase = createClient();
      await supabase
        .from('quiz_sessions')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', sessionId);
    }
    setCompleted(true);
  };

  const startNew = () => {
    setStarted(false);
    setCompleted(false);
    setSelectedSection(null);
    setSessionId(null);
    setQuestion(null);
    setResult(null);
    setSelectedOption(null);
    setSessionComplete(false);
    setShowReview(false);
    setTrackedResponses([]);
  };

  if (!authCheckDone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  // ── Section Selector ──
  if (!started) {
    return (
      <div className="min-h-screen bg-page text-primary">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <h1 className="text-2xl font-bold mb-2 text-heading">📝 Practice Quiz</h1>
          <p className="text-secondary text-sm mb-8">
            Pick a section to practice. Instant feedback on every answer.
            {typeof dailyRemaining === 'number' && (
              <span className="ml-2 text-accent">({dailyRemaining} free questions remaining today)</span>
            )}
          </p>

          {/* Upgrade banner for free users */}
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

  // ── Completed Screen ──
  if (completed) {
    const correct = trackedResponses.filter(r => r.result.is_correct).length;
    const total = trackedResponses.length;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const icon = pct >= 70 ? '🎉' : pct >= 40 ? '💪' : '📚';

    if (showReview) {
      return (
        <div className="min-h-screen bg-page text-primary">
          <div className="border-b border-theme bg-card-hover backdrop-blur-sm sticky top-0 z-10">
            <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
              <button onClick={() => setShowReview(false)} className="text-muted hover:text-primary transition text-sm">
                ← Back to Results
              </button>
              <span className="text-xs text-secondary">
                {SECTIONS.find(s => s.id === selectedSection)?.icon} {selectedSection}
              </span>
            </div>
          </div>
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
            {trackedResponses.map((r, idx) => (
              <div key={r.question.id} className={`border rounded-xl overflow-hidden ${
                r.result.is_correct ? 'border-success/50' : 'border-danger/50'
              }`}>
                <div className={`px-4 py-2 flex items-center gap-2 ${
                  r.result.is_correct ? 'bg-success/20' : 'bg-danger/20'
                }`}>
                  <span>{r.result.is_correct ? '✅' : '❌'}</span>
                  <span className="text-xs font-medium text-secondary">Q{idx + 1}</span>
                  {r.question.difficulty && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      r.question.difficulty === 'hard' ? 'bg-danger/50 text-danger' :
                      r.question.difficulty === 'easy' ? 'bg-success/50 text-success' :
                      'bg-info/50 text-info'
                    }`}>{r.question.difficulty}</span>
                  )}
                  <span className="ml-auto text-xs text-secondary flex items-center gap-2">
                    <span>⏱ {r.result.time_taken_seconds}s</span>
                    <span>·</span>
                    <span>Your: {r.result.your_answer} · Correct: {r.result.correct_option}</span>
                  </span>
                </div>
                {/* Passage */}
                {r.question.passage && (
                  <div className="px-4 py-3 bg-card-hover border-b border-theme/50">
                    <p className="text-[10px] font-medium text-accent uppercase tracking-wider mb-1">Passage</p>
                    <p className="text-xs text-secondary leading-relaxed">{r.question.passage}</p>
                  </div>
                )}
                <div className="px-4 py-3">
                  <p className="text-sm font-medium mb-3 text-primary">{r.question.question_text}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(r.question.options).map(([key, value]) => {
                      const isSelected = r.result.your_answer === key;
                      const isCorrectOpt = r.result.correct_option === key;
                      return (
                        <div key={key} className={`flex items-center gap-2 border rounded-lg px-3 py-2 text-sm ${
                          isCorrectOpt
                            ? 'border-success bg-success/30 ring-1 ring-success/50'
                            : isSelected
                            ? 'border-danger bg-danger/30 ring-1 ring-danger/50'
                            : 'border-theme'
                        }`}>
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isCorrectOpt ? 'bg-success text-white' :
                            isSelected ? 'bg-danger text-white' :
                            'bg-theme-subtle text-secondary'
                          }`}>
                            {isCorrectOpt ? '✓' : isSelected ? '✗' : key}
                          </span>
                          <span className={`flex-1 ${
                            isCorrectOpt ? 'text-success font-medium' :
                            isSelected ? 'text-danger' :
                            'text-primary'
                          }`}>
                            {value}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {r.result.explanation && (
                    <div className="mt-3 p-3 bg-info/20 border border-info/50 rounded-lg">
                      <p className="text-[10px] font-medium text-info uppercase tracking-wider mb-1">Explanation</p>
                      <p className="text-xs text-secondary leading-relaxed">{r.result.explanation}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div className="flex gap-3 justify-center pb-8">
              <button onClick={() => setShowReview(false)} className="bg-card border border-theme px-6 py-2.5 rounded-xl font-medium hover:bg-card-hover transition">
                ← Back to Results
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-page text-primary flex items-center justify-center">
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
                Avg ⏱ {Math.round(trackedResponses.reduce((s, r) => s + (r.result.time_taken_seconds ?? 0), 0) / trackedResponses.length)}s per question
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
                {selectedSection} · {total} question{total !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            {trackedResponses.length > 0 && (
              <button onClick={() => setShowReview(true)}
                className="bg-accent text-white px-5 py-2.5 rounded-xl font-medium hover:bg-accent-hover transition">
                📋 Review Answers
              </button>
            )}
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

  return (
    <div className="min-h-screen bg-page text-primary">
      {/* Top bar */}
      <div className="border-b border-theme bg-card-hover backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={startNew} className="text-muted hover:text-primary transition text-sm">
            ← {SECTIONS.find(s => s.id === selectedSection)?.icon} {selectedSection}
          </button>
          <span className="text-xs text-secondary">
            {typeof dailyRemaining === 'number' ? `${dailyRemaining} free today` : '♾️ Unlimited'}
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Passage */}
        {question?.passage && !result && (
          <div className="bg-card border border-theme rounded-xl p-5 mb-4">
            <p className="text-xs text-accent uppercase tracking-wide font-medium mb-2">Passage</p>
            <p className="text-sm text-secondary leading-relaxed">{question.passage}</p>
          </div>
        )}

        {/* Question */}
        {question && !result && (
          <div className="bg-card border border-theme rounded-xl p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-secondary">
                {selectedSection}
                {question.difficulty && (
                  <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] ${
                    question.difficulty === 'hard' ? 'bg-danger/50 text-danger' :
                    question.difficulty === 'easy' ? 'bg-success/50 text-success' :
                    'bg-info/50 text-info'
                  }`}>
                    {question.difficulty}
                  </span>
                )}
              </span>
            </div>
            <p className="font-medium text-base mb-5 leading-relaxed text-primary">{question.question_text}</p>
            <div className="space-y-2">
              {Object.entries(question.options).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => answerQuestion(key)}
                  disabled={!!selectedOption}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition ${
                    selectedOption === key
                      ? 'border-accent bg-accent-subtle text-accent ring-1 ring-accent/50'
                      : 'border-theme hover:border-theme-subtle hover:bg-card-hover'
                  } disabled:opacity-60`}
                >
                  <span className="font-semibold mr-3 text-secondary">{key}.</span>
                  <span className="text-primary">{value}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Result / Feedback */}
        {result && (
          <div className={`border rounded-xl p-6 mb-4 ${
            result.is_correct ? 'bg-success/20 border-success' : 'bg-danger/20 border-danger'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{result.is_correct ? '✅' : '❌'}</span>
              <div>
                <p className="font-bold text-lg text-heading">{result.is_correct ? 'Correct!' : 'Incorrect'}</p>
                <p className="text-xs text-secondary">
                  Your answer: {result.your_answer} · Correct: {result.correct_option}
                  {result.time_taken_seconds != null && <span className="ml-2">· ⏱ {result.time_taken_seconds}s</span>}
                </p>
              </div>
            </div>
            {result.explanation && (
              <div className="text-sm text-secondary leading-relaxed bg-card-hover rounded-lg p-4 mt-2">
                <p className="text-xs text-muted uppercase tracking-wide font-medium mb-1">Explanation</p>
                <p>{result.explanation}</p>
              </div>
            )}
            <div className="mt-6 flex justify-between gap-3">
              <button onClick={startNew} className="flex-1 bg-card border border-theme px-5 py-2.5 rounded-xl font-medium hover:bg-card-hover transition">
                🔄 Practice New Section
              </button>
              <button onClick={nextQuestion} disabled={sessionComplete} className="flex-1 bg-accent text-white px-5 py-2.5 rounded-xl font-medium hover:bg-accent-hover transition disabled:opacity-50">
                {sessionComplete ? 'Session Complete' : 'Next Question'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
