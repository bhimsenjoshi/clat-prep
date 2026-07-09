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
  explanation?: string;
}

interface AnswerResult {
  is_correct: boolean;
  correct_option: string;
  explanation: string;
  your_answer: string;
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
      setResult(data.result);

      if (data.next_question) {
        setQuestion(data.next_question);
        setRemainingIds(data.remaining_ids);
      } else {
        setSessionComplete(true);
      }
    } catch (err) {
      console.error('Respond error:', err);
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
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <p className="text-5xl mb-4">🎉</p>
          <h2 className="text-2xl font-bold mb-2">Session Complete!</h2>
          <p className="text-gray-400 mb-6">
            You answered questions across all available questions in this section.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={startNew} className="bg-indigo-600 px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition">
              🔄 Practice Again
            </button>
            <Link href="/student/dashboard" className="border border-gray-700 px-6 py-2.5 rounded-xl font-medium hover:bg-gray-800 transition">
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
