'use client';

import { useState, useRef, useEffect } from 'react';
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

  const endSession = () => setCompleted(true);

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
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // ── Section Selector ──
  if (!started) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <h1 className="text-2xl font-bold mb-2">📝 Practice Quiz</h1>
          <p className="text-gray-400 text-sm mb-8">
            Pick a section to practice. Instant feedback on every answer.
            {typeof dailyRemaining === 'number' && (
              <span className="ml-2 text-indigo-400">({dailyRemaining} free questions remaining today)</span>
            )}
          </p>

          {/* Upgrade banner for free users */}
          {dailyRemaining !== 'unlimited' && typeof dailyRemaining === 'number' && dailyRemaining <= 3 && (
            <Link href="/student/profile"
              className="block mb-6 bg-gradient-to-r from-amber-900/30 to-orange-900/30 border border-amber-700/50 rounded-xl p-4 hover:border-amber-600 transition group">
              <div className="flex items-center gap-3">
                <span className="text-xl">🎁</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-amber-300">Running low on free questions!</p>
                  <p className="text-xs text-amber-400">Get Premium free — limited time offer 🎉</p>
                </div>
                <span className="text-amber-400 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          )}

          <div className="grid gap-3">
            {SECTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => startQuiz(s.id)}
                disabled={loading}
                className="flex items-center gap-4 p-4 rounded-xl border border-gray-800 bg-gray-900 hover:border-indigo-500 hover:bg-gray-800/50 transition disabled:opacity-50 text-left"
              >
                <span className="text-2xl">{s.icon}</span>
                <div>
                  <p className="font-medium">{s.label}</p>
                  <p className="text-xs text-gray-500">Practice {s.label.toLowerCase()} questions</p>
                </div>
                {loading && selectedSection === s.id ? (
                  <span className="ml-auto animate-spin w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full" />
                ) : (
                  <span className="ml-auto text-gray-600">→</span>
                )}
              </button>
            ))}
          </div>
          <Link href="/student/dashboard" className="block text-center text-sm text-gray-500 mt-8 hover:text-gray-300 transition">
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
        <div className="min-h-screen bg-gray-950 text-white">
          <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
              <button onClick={() => setShowReview(false)} className="text-gray-400 hover:text-white transition text-sm">
                ← Back to Results
              </button>
              <span className="text-xs text-gray-500">
                {SECTIONS.find(s => s.id === selectedSection)?.icon} {selectedSection}
              </span>
            </div>
          </div>
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
            {trackedResponses.map((r, idx) => (
              <div key={r.question.id} className={`border rounded-xl overflow-hidden ${
                r.result.is_correct ? 'border-green-800/50' : 'border-red-800/50'
              }`}>
                <div className={`px-4 py-2 flex items-center gap-2 ${
                  r.result.is_correct ? 'bg-green-900/20' : 'bg-red-900/20'
                }`}>
                  <span>{r.result.is_correct ? '✅' : '❌'}</span>
                  <span className="text-xs font-medium text-gray-400">Q{idx + 1}</span>
                  {r.question.difficulty && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      r.question.difficulty === 'hard' ? 'bg-red-900/50 text-red-400' :
                      r.question.difficulty === 'easy' ? 'bg-green-900/50 text-green-400' :
                      'bg-blue-900/50 text-blue-400'
                    }`}>{r.question.difficulty}</span>
                  )}
                  <span className="ml-auto text-xs text-gray-500 flex items-center gap-2">
                    <span>⏱ {r.result.time_taken_seconds}s</span>
                    <span>·</span>
                    <span>Your: {r.result.your_answer} · Correct: {r.result.correct_option}</span>
                  </span>
                </div>
                {/* Passage */}
                {r.question.passage && (
                  <div className="px-4 py-3 bg-gray-900/50 border-b border-gray-800/50">
                    <p className="text-[10px] font-medium text-indigo-400 uppercase tracking-wider mb-1">Passage</p>
                    <p className="text-xs text-gray-400 leading-relaxed">{r.question.passage}</p>
                  </div>
                )}
                <div className="px-4 py-3">
                  <p className="text-sm font-medium mb-3">{r.question.question_text}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(r.question.options).map(([key, value]) => {
                      const isSelected = r.result.your_answer === key;
                      const isCorrectOpt = r.result.correct_option === key;
                      return (
                        <div key={key} className={`flex items-center gap-2 border rounded-lg px-3 py-2 text-sm ${
                          isCorrectOpt
                            ? 'border-green-700 bg-green-900/30 ring-1 ring-green-600/50'
                            : isSelected
                            ? 'border-red-700 bg-red-900/30 ring-1 ring-red-600/50'
                            : 'border-gray-800'
                        }`}>
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isCorrectOpt ? 'bg-green-600 text-white' :
                            isSelected ? 'bg-red-600 text-white' :
                            'bg-gray-800 text-gray-500'
                          }`}>
                            {isCorrectOpt ? '✓' : isSelected ? '✗' : key}
                          </span>
                          <span className={`flex-1 ${
                            isCorrectOpt ? 'text-green-300 font-medium' :
                            isSelected ? 'text-red-300' :
                            'text-gray-400'
                          }`}>
                            {value}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {r.result.explanation && (
                    <div className="mt-3 p-3 bg-blue-900/20 border border-blue-800/50 rounded-lg">
                      <p className="text-[10px] font-medium text-blue-400 uppercase tracking-wider mb-1">Explanation</p>
                      <p className="text-xs text-gray-300 leading-relaxed">{r.result.explanation}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div className="flex gap-3 justify-center pb-8">
              <button onClick={() => setShowReview(false)} className="bg-gray-800 border border-gray-700 px-6 py-2.5 rounded-xl font-medium hover:bg-gray-700 transition">
                ← Back to Results
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <p className="text-5xl mb-4">{icon}</p>
          <h2 className="text-2xl font-bold mb-2">Session Complete!</h2>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-3xl font-bold text-green-400">{correct}</p>
                <p className="text-sm text-gray-400">Correct</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-red-400">{total - correct}</p>
                <p className="text-sm text-gray-400">Incorrect</p>
              </div>
            </div>
            {trackedResponses.length > 0 && (
              <div className="text-xs text-gray-500 mb-3">
                Avg ⏱ {Math.round(trackedResponses.reduce((s, r) => s + (r.result.time_taken_seconds ?? 0), 0) / trackedResponses.length)}s per question
              </div>
            )}
            <div className="pt-4 border-t border-gray-800">
              <p className={`text-4xl font-bold ${
                pct >= 70 ? 'text-green-400' : pct >= 40 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {pct}%
              </p>
              <p className="text-sm text-gray-400">Accuracy</p>
              <p className="text-xs text-gray-500 mt-2">
                {selectedSection} · {total} question{total !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            {trackedResponses.length > 0 && (
              <button onClick={() => setShowReview(true)}
                className="bg-indigo-600 px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition">
                📋 Review Answers
              </button>
            )}
            <button onClick={startNew} className="border border-gray-700 px-5 py-2.5 rounded-xl font-medium hover:bg-gray-800 transition">
              🔄 Practice Again
            </button>
            <Link href="/student/dashboard" className="border border-gray-700 px-5 py-2.5 rounded-xl font-medium hover:bg-gray-800 transition">
              📊 Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top bar */}
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={startNew} className="text-gray-400 hover:text-white transition text-sm">
            ← {SECTIONS.find(s => s.id === selectedSection)?.icon} {selectedSection}
          </button>
          <span className="text-xs text-gray-500">
            {typeof dailyRemaining === 'number' ? `${dailyRemaining} free today` : '♾️ Unlimited'}
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Passage */}
        {question?.passage && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-4">
            <p className="text-xs text-indigo-400 uppercase tracking-wide font-medium mb-2">Passage</p>
            <p className="text-sm text-gray-300 leading-relaxed">{question.passage}</p>
          </div>
        )}

        {/* Question */}
        {question && !result && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-gray-500">
                {selectedSection}
                {question.difficulty && (
                  <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] ${
                    question.difficulty === 'hard' ? 'bg-red-900/50 text-red-400' :
                    question.difficulty === 'easy' ? 'bg-green-900/50 text-green-400' :
                    'bg-blue-900/50 text-blue-400'
                  }`}>
                    {question.difficulty}
                  </span>
                )}
              </span>
            </div>
            <p className="font-medium text-base mb-5 leading-relaxed">{question.question_text}</p>
            <div className="space-y-2">
              {Object.entries(question.options).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => answerQuestion(key)}
                  disabled={!!selectedOption}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition ${
                    selectedOption === key
                      ? 'border-indigo-500 bg-indigo-900/30 text-indigo-300 ring-1 ring-indigo-500'
                      : 'border-gray-800 hover:border-gray-600 hover:bg-gray-800/50'
                  } disabled:opacity-60`}
                >
                  <span className="font-semibold mr-3 text-gray-400">{key}.</span>
                  {value}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Result / Feedback */}
        {result && (
          <div className={`border rounded-xl p-6 mb-4 ${
            result.is_correct ? 'bg-green-900/20 border-green-800' : 'bg-red-900/20 border-red-800'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{result.is_correct ? '✅' : '❌'}</span>
              <div>
                <p className="font-bold text-lg">{result.is_correct ? 'Correct!' : 'Incorrect'}</p>
                <p className="text-xs text-gray-400">
                  Your answer: {result.your_answer} · Correct: {result.correct_option}
                  {result.time_taken_seconds != null && <span className="ml-2">· ⏱ {result.time_taken_seconds}s</span>}
                </p>
              </div>
            </div>
            {result.explanation && (
              <div className="text-sm text-gray-300 leading-relaxed bg-gray-900/50 rounded-lg p-4 mt-2">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Explanation</p>
                <p>{result.explanation}</p>
              </div>
            )}
            <div className="mt-4">
              {sessionComplete ? (
                <button onClick={endSession} className="bg-indigo-600 px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition w-full">
                  📊 See Results
                </button>
              ) : (
                <button onClick={nextQuestion} className="bg-gray-800 hover:bg-gray-700 border border-gray-700 px-6 py-2.5 rounded-xl font-medium transition w-full">
                  Next Question →
                </button>
              )}
            </div>
          </div>
        )}

        {loading && !question && !result && (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading next question...</p>
          </div>
        )}
      </div>
    </div>
  );
}
