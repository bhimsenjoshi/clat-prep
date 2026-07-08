'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import type { SectionName } from '@/types';

interface QuestionData {
  id: string;
  section: SectionName;
  topic: string;
  question_text: string;
  passage: string | null;
  options: Record<string, string>;
  difficulty: string;
  explanation: string | null;
  tags: string[];
}

interface AnswerResult {
  is_correct: boolean;
  correct_option: string;
  explanation: string;
  your_answer: string;
}

const SECTION_MAP: Record<string, SectionName> = {
  'english': 'English',
  'current-affairs': 'Current Affairs',
  'legal-reasoning': 'Legal Reasoning',
  'logical-reasoning': 'Logical Reasoning',
  'quantitative-techniques': 'Quantitative Techniques',
};

const SECTION_ICONS: Record<string, string> = {
  'English': '📖',
  'Current Affairs': '📰',
  'Legal Reasoning': '⚖️',
  'Logical Reasoning': '🧠',
  'Quantitative Techniques': '📐',
};

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const sectionSlug = params.section as string;
  const sectionName = SECTION_MAP[sectionSlug];

  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [answering, setAnswering] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [stats, setStats] = useState({ correct: 0, total: 0 });
  const [sessionComplete, setSessionComplete] = useState(false);
  const [dailyRemaining, setDailyRemaining] = useState<number | 'unlimited'>(10);
  const [needsSeeding, setNeedsSeeding] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const questionStartTime = useRef<number>(Date.now());

  // Start session on mount
  useEffect(() => {
    if (!sectionName) return;
    startSession();
  }, [sectionName]);

  const startSession = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/quiz/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: sectionName }),
      });

      const data = await res.json();

      if (res.status === 403 && data.code === 'DAILY_LIMIT_REACHED') {
        setDailyRemaining(0);
        setLoading(false);
        return;
      }

      if (data.needs_seeding) {
        setNeedsSeeding(true);
        setLoading(false);
        return;
      }

      setSessionId(data.session_id);
      setQuestion(data.question);
      setDailyRemaining(data.daily_remaining);
      questionStartTime.current = Date.now();

      // Get user id from session
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    } catch (err) {
      console.error('Failed to start session:', err);
    }
    setLoading(false);
  };

  const submitAnswer = async (option: string) => {
    if (!sessionId || !question || answering) return;
    setAnswering(true);
    setSelected(option);

    const timeTaken = Math.round((Date.now() - questionStartTime.current) / 1000);

    try {
      const res = await fetch('/api/quiz/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          question_id: question.id,
          selected_option: option,
          time_taken_seconds: timeTaken,
        }),
      });

      const data = await res.json();
      setResult(data.result);
      setStats(prev => ({
        correct: prev.correct + (data.result.is_correct ? 1 : 0),
        total: prev.total + 1,
      }));

      if (data.session_complete) {
        setSessionComplete(true);
      } else if (data.next_question) {
        // Preload next question but don't show yet
        setTimeout(() => setShowExplanation(true), 200);
      } else {
        setSessionComplete(true);
      }
    } catch (err) {
      console.error('Failed to submit answer:', err);
    }
    setAnswering(false);
  };

  const nextQuestion = () => {
    setSelected(null);
    setResult(null);
    setShowExplanation(false);
    questionStartTime.current = Date.now();

    // We need to fetch a new question. The respond API returned the next one,
    // but we don't have it stored. Let's get a fresh one.
    fetchNextQuestion();
  };

  const fetchNextQuestion = useCallback(async () => {
    if (!sessionId || !sectionName) return;
    try {
      // Get a random unanswered question for this session
      const { data: answeredIds } = await supabase
        .from('quiz_responses')
        .select('question_id')
        .eq('session_id', sessionId);

      const excludeIds = (answeredIds ?? []).map(r => r.question_id);

      let query = supabase
        .from('practice_questions')
        .select('*')
        .eq('section', sectionName);

      if (excludeIds.length > 0) {
        query = query.not('id', 'in', `(${excludeIds.join(',')})`);
      }

      const { data: nextQ } = await query.limit(1).maybeSingle();

      if (nextQ) {
        const { correct_option, ...safeQ } = nextQ;
        setQuestion(safeQ as QuestionData);
      } else {
        setSessionComplete(true);
      }
    } catch (err) {
      console.error('Failed to fetch next question:', err);
    }
  }, [sessionId, sectionName, supabase]);

  const endSession = async () => {
    if (sessionId) {
      await supabase
        .from('quiz_sessions')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', sessionId);
    }
    router.push('/student/quiz');
  };

  // Section not found
  if (!sectionName) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900">
        <div className="text-center">
          <p className="text-5xl mb-4">❌</p>
          <h2 className="text-xl font-bold text-white mb-2">Section Not Found</h2>
          <Link href="/student/quiz" className="text-indigo-400 hover:text-indigo-300">
            ← Back to sections
          </Link>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900">
      <div className="animate-pulse flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Starting your quiz...</p>
      </div>
    </div>
  );

  // Daily limit reached
  if (dailyRemaining === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900">
        <div className="text-center max-w-md">
          <p className="text-5xl mb-4">😅</p>
          <h2 className="text-xl font-bold text-white mb-2">Daily Limit Reached</h2>
          <p className="text-gray-400 mb-6">
            You&apos;ve used all 10 free questions today. Come back tomorrow or upgrade to premium for unlimited practice!
          </p>
          <Link href="/student/quiz"
            className="inline-flex px-6 py-3 rounded-xl font-medium bg-indigo-600 text-white hover:bg-indigo-500 transition">
            ← Back to sections
          </Link>
        </div>
      </div>
    );
  }

  // No questions seeded
  if (needsSeeding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900">
        <div className="text-center max-w-md">
          <p className="text-5xl mb-4">🛠️</p>
          <h2 className="text-xl font-bold text-white mb-2">Questions Coming Soon</h2>
          <p className="text-gray-400 mb-6">
            We&apos;re generating practice questions for this section. Check back shortly!
          </p>
          <Link href="/student/quiz"
            className="inline-flex px-6 py-3 rounded-xl font-medium bg-indigo-600 text-white hover:bg-indigo-500 transition">
            ← Back to sections
          </Link>
        </div>
      </div>
    );
  }

  // Session complete
  if (sessionComplete) {
    const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900">
        <div className="text-center max-w-md">
          <p className="text-5xl mb-4">🎉</p>
          <h2 className="text-2xl font-bold text-white mb-2">Session Complete!</h2>
          <div className="bg-gray-800/50 rounded-xl p-6 mb-6 border border-gray-700/50">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-3xl font-bold text-green-400">{stats.correct}</p>
                <p className="text-sm text-gray-400">Correct</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-red-400">{stats.total - stats.correct}</p>
                <p className="text-sm text-gray-400">Incorrect</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-700/50">
              <p className={`text-4xl font-bold ${pct >= 70 ? 'text-green-400' : pct >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                {pct}%
              </p>
              <p className="text-sm text-gray-400">Accuracy</p>
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={endSession}
              className="px-6 py-3 rounded-xl font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 transition">
              ← Back to Sections
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900">
      {/* Top bar */}
      <div className="bg-gray-800/50 border-b border-gray-700/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>{SECTION_ICONS[sectionName]}</span>
            <span className="text-sm font-medium text-white">{sectionName}</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-gray-400">
              ✅ {stats.correct}/{stats.total}
            </span>
            <span className="text-gray-500">
              {dailyRemaining === 'unlimited' ? '♾️' : `📅 ${dailyRemaining}`}
            </span>
            <button onClick={endSession}
              className="text-gray-500 hover:text-gray-300 transition">
              ✕ End
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {question && !showExplanation ? (
          // ─── Question View ───
          <div className="space-y-6">
            {/* Question card */}
            <div className="bg-gray-800/40 rounded-xl p-6 border border-gray-700/40">
              {/* Difficulty badge */}
              <div className="flex items-center gap-2 mb-4">
                <span className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  question.difficulty === 'easy' ? 'bg-green-900/50 text-green-300' :
                  question.difficulty === 'hard' ? 'bg-red-900/50 text-red-300' :
                  'bg-amber-900/50 text-amber-300'
                }`}>
                  {question.difficulty}
                </span>
                {question.tags?.length > 0 && question.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="text-[10px] text-gray-500 bg-gray-700/50 px-2 py-0.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Passage */}
              {question.passage && (
                <div className="mb-4 p-4 bg-gray-900/50 rounded-lg border-l-2 border-indigo-500/50">
                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{question.passage}</p>
                </div>
              )}

              {/* Question text */}
              <p className="text-lg font-medium text-white leading-relaxed mb-6">{question.question_text}</p>

              {/* Options */}
              <div className="space-y-3">
                {Object.entries(question.options).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => submitAnswer(key)}
                    disabled={answering}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-150 ${
                      answering
                        ? 'opacity-50 cursor-not-allowed border-gray-700/50'
                        : 'border-gray-700/50 hover:border-indigo-500/50 hover:bg-indigo-500/10 cursor-pointer'
                    } bg-gray-800/30`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-700/50 flex items-center justify-center text-sm font-bold text-gray-300">
                        {key}
                      </span>
                      <span className="text-sm text-gray-200 pt-1">{value}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : question && result ? (
          // ─── Result + Explanation View ───
          <div className="space-y-4">
            {/* Result banner */}
            <div className={`rounded-xl p-4 border ${
              result.is_correct
                ? 'bg-green-900/20 border-green-700/50'
                : 'bg-red-900/20 border-red-700/50'
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{result.is_correct ? '✅' : '❌'}</span>
                <div>
                  <p className={`font-bold ${result.is_correct ? 'text-green-400' : 'text-red-400'}`}>
                    {result.is_correct ? 'Correct!' : 'Incorrect'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Your answer: <span className="font-mono">{result.your_answer}</span>
                    {!result.is_correct && (
                      <> · Correct answer: <span className="font-mono text-green-400">{result.correct_option}</span></>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Explanation */}
            {result.explanation && (
              <div className="bg-gray-800/40 rounded-xl p-5 border border-gray-700/40">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Explanation</p>
                <p className="text-sm text-gray-300 leading-relaxed">{result.explanation}</p>
              </div>
            )}

            {/* Next button */}
            <button
              onClick={nextQuestion}
              disabled={answering}
              className="w-full py-4 rounded-xl font-medium bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 transition shadow-lg shadow-indigo-500/20 disabled:opacity-50"
            >
              {answering ? 'Loading...' : 'Next Question →'}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
