'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { persistSessionToCookie } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import ExplanationBlock from '@/components/ExplanationBlock';
import type { SectionName } from '@/types';

interface QuestionData {
  id: string;
  section: SectionName;
  topic: string;
  question_text: string;
  passage: string | null;
  passage_id: string | null;
  options: Record<string, string>;
  difficulty: string;
  explanation: string | null;
  tags: string[];
}

interface AnswerResult {
  is_correct: boolean;
  correct_option: string;
  explanation: string | Record<string, any>;
  your_answer: string;
}

const SECTION_MAP: Record<string, SectionName> = {
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [passageText, setPassageText] = useState<string | null>(null);
  const [passageExpanded, setPassageExpanded] = useState(true);
  const [fullQueue, setFullQueue] = useState<QuestionData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const prevPassageIdRef = useRef<string | null>(null);

  const questionStartTime = useRef<number>(Date.now());

  // Start session on mount
  useEffect(() => {
    if (!sectionName) return;
    startSession();
  }, [sectionName]);

  // Fetch passage text from practice_passages when passage_id changes
  useEffect(() => {
    if (!question?.passage_id) {
      setPassageText(null);
      prevPassageIdRef.current = null;
      return;
    }
    if (question.passage_id === prevPassageIdRef.current && passageText) return;
    prevPassageIdRef.current = question.passage_id;

    supabase
      .from('practice_passages')
      .select('content')
      .eq('id', question.passage_id)
      .single()
      .then(({ data }) => {
        if (data?.content) setPassageText(data.content);
      });
  }, [question?.passage_id, supabase]);

  const startSession = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // Refresh the clat-at cookie so the server can authenticate
      await persistSessionToCookie(supabase);

      const res = await fetch('/api/quiz/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: sectionName }),
      });

      let data: any;
      try {
        data = await res.json();
      } catch {
        setErrorMsg(`Response not JSON (status ${res.status})`);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setErrorMsg(data?.error || `Error ${res.status}: ${res.statusText}`);
        setLoading(false);
        return;
      }

      if (data.code === 'DAILY_LIMIT_REACHED') {
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
      setDailyRemaining(data.daily_remaining);

      // Store the full queue from API
      if (data.questions && data.questions.length > 0) {
        setFullQueue(data.questions);
        setCurrentIndex(0);
        const { correct_option, ...safeFirst } = data.questions[0];
        setQuestion(safeFirst as QuestionData);
      } else {
        setSessionComplete(true);
      }

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
          remaining_ids: fullQueue.length > 0 && currentIndex < fullQueue.length - 1
            ? fullQueue.slice(currentIndex + 1).map(q => q.id)
            : [],
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
        setTimeout(() => setShowExplanation(true), 200);
      } else {
        setSessionComplete(true);
      }
    } catch (err) {
      console.error('Failed to submit answer:', err);
    }
    setAnswering(false);
  };

  // Serve next question using single-queue + index
  const nextQuestion = useCallback(() => {
    const nextIdx = currentIndex + 1;
    if (nextIdx < fullQueue.length) {
      setSelected(null);
      setResult(null);
      setShowExplanation(false);
      questionStartTime.current = Date.now();
      setCurrentIndex(nextIdx);
      const { correct_option, ...safeQ } = fullQueue[nextIdx] as any;
      setQuestion(safeQ as QuestionData);
    } else {
      setSessionComplete(true);
    }
  }, [currentIndex, fullQueue]);

  // Fetch all unasked questions for the section at start, grouped by passage
  const buildPassageQueue = useCallback(async (extraExcludeIds: string[] = []) => {
    if (!sessionId || !sectionName) return null;
    try {
      const { data: answeredIds } = await supabase
        .from('quiz_responses')
        .select('question_id')
        .eq('session_id', sessionId);

      const excludeIds = new Set((answeredIds ?? []).map(r => r.question_id));
      // Also exclude questions already served from a previous batch
      for (const eid of extraExcludeIds) { if (eid) excludeIds.add(eid); }

      const { data: allQuestions } = await supabase
        .from('practice_questions')
        .select('id, section, topic, question_text, passage, passage_id, options, difficulty, explanation, tags, created_at')
        .eq('section', sectionName)
        .order('created_at', { ascending: false });

      if (!allQuestions || allQuestions.length === 0) return [];

      // Split into passage and standalone questions
      const passageMap: Record<string, any[]> = {};
      const standalone: any[] = [];

      for (const q of allQuestions) {
        if (excludeIds.has(q.id)) continue;
        if (q.passage_id) {
          if (!passageMap[q.passage_id]) passageMap[q.passage_id] = [];
          passageMap[q.passage_id].push(q);
        } else {
          standalone.push(q);
        }
      }

      // Build queue: newest passages first → then standalone sorted by newest
      const passageIds = Object.keys(passageMap);
      // Sort passages by their newest question's created_at (descending)
      passageIds.sort((a, b) => {
        const maxA = Math.max(...passageMap[a].map((q: any) => new Date(q.created_at).getTime()));
        const maxB = Math.max(...passageMap[b].map((q: any) => new Date(q.created_at).getTime()));
        return maxB - maxA;
      });
      const sortedStandalone = standalone.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const queue: any[] = [];
      for (const pid of passageIds) {
        queue.push(...passageMap[pid]);
      }
      queue.push(...sortedStandalone);

      return queue;
    } catch {
      return [];
    }
  }, [sessionId, sectionName, supabase]);

  const endSession = async () => {
    if (sessionId) {
      await supabase
        .from('quiz_sessions')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', sessionId);

      // Send result to WhatsApp (async — don't block navigation)
      fetch('/api/whatsapp/send-quiz-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: sectionName,
          correct: stats.correct,
          total: stats.total,
        }),
      }).catch(() => {});
    }
    router.push('/student/quiz');
  };

  // Section not found
  if (!sectionName) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page">
        <div className="text-center">
          <p className="text-5xl mb-4">❌</p>
          <h2 className="text-xl font-bold text-primary mb-2">Section Not Found</h2>
          <Link href="/student/quiz" className="text-accent hover:text-accent-hover">
            ← Back to sections
          </Link>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-page">
      <div className="animate-pulse flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-secondary text-sm">Starting your quiz...</p>
      </div>
    </div>
  );

  // Daily limit reached
  if (dailyRemaining === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page">
        <div className="text-center max-w-md">
          <p className="text-5xl mb-4">😅</p>
          <h2 className="text-xl font-bold text-primary mb-2">Daily Limit Reached</h2>
          <p className="text-secondary mb-6">
            You&apos;ve used all 10 free questions today. Come back tomorrow or upgrade to premium for unlimited practice!
          </p>
          <Link href="/student/quiz"
            className="inline-flex px-6 py-3 rounded-xl font-medium bg-accent text-white hover:bg-accent-hover transition">
            ← Back to sections
          </Link>
        </div>
      </div>
    );
  }

  // No questions seeded
  if (needsSeeding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page">
        <div className="text-center max-w-md">
          <p className="text-5xl mb-4">🛠️</p>
          <h2 className="text-xl font-bold text-primary mb-2">Questions Coming Soon</h2>
          <p className="text-secondary mb-6">
            We&apos;re generating practice questions for this section. Check back shortly!
          </p>
          <Link href="/student/quiz"
            className="inline-flex px-6 py-3 rounded-xl font-medium bg-accent text-white hover:bg-accent-hover transition">
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
      <div className="min-h-screen flex items-center justify-center bg-page">
        <div className="text-center max-w-md">
          <p className="text-5xl mb-4">🎉</p>
          <h2 className="text-2xl font-bold text-primary mb-2">Session Complete!</h2>
          <div className="bg-card rounded-xl p-6 mb-6 border border-theme">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-3xl font-bold text-success">{stats.correct}</p>
                <p className="text-sm text-secondary">Correct</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-danger">{stats.total - stats.correct}</p>
                <p className="text-sm text-secondary">Incorrect</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-theme">
              <p className={`text-4xl font-bold ${pct >= 70 ? 'text-success' : pct >= 40 ? 'text-warning' : 'text-danger'}`}>
                {pct}%
              </p>
              <p className="text-sm text-secondary">Accuracy</p>
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={endSession}
              className="px-6 py-3 rounded-xl font-medium bg-card text-secondary hover:bg-card-hover transition">
              ← Back to Sections
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page">
      <PageHeader title="Section Quiz" />
      {/* Top bar */}
      <div className="border-b border-theme bg-card-hover backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>{SECTION_ICONS[sectionName]}</span>
            <span className="text-sm font-medium text-primary">{sectionName}</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-secondary">
              ✅ {stats.correct}/{stats.total}
            </span>
            <span className="text-secondary">
              {dailyRemaining === 'unlimited' ? '♾️' : `📅 ${dailyRemaining}`}
            </span>
            <button onClick={endSession}
              className="text-muted hover:text-primary transition">
              ✕ End
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Error message */}
        {errorMsg && (
          <div className="mb-4 p-4 bg-danger/20 border border-danger/50 rounded-xl">
            <p className="text-danger text-sm font-medium">⚠️ {errorMsg}</p>
          </div>
        )}

        {question && !showExplanation ? (
          // ─── Question View ───
          <div className="space-y-6">
            {/* Question card */}
            <div className="bg-card rounded-xl p-6 border border-theme">
              {/* Difficulty badge */}
              <div className="flex items-center gap-2 mb-4">
                <span className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  question.difficulty === 'easy' ? 'bg-success/50 text-success' :
                  question.difficulty === 'hard' ? 'bg-danger/50 text-danger' :
                  'bg-warning/50 text-warning'
                }`}>
                  {question.difficulty}
                </span>
                {question.tags?.length > 0 && question.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="text-[10px] text-muted bg-card-hover px-2 py-0.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Passage — collapsible (from practice_passages or inline) */}
              {(passageText || question.passage) && (
                <div className="mb-4 bg-card border border-theme rounded-xl overflow-hidden">
                  <button
                    onClick={() => setPassageExpanded(!passageExpanded)}
                    className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-card-hover transition"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-xs text-accent uppercase tracking-wide">Passage</span>
                    </div>
                    <svg className={`w-4 h-4 text-secondary transition-transform ${passageExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {passageExpanded && (
                    <div className="px-5 pb-5 max-h-60 overflow-y-auto">
                      <p className="text-sm text-secondary leading-relaxed whitespace-pre-wrap">
                        {passageText || question.passage}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Question text */}
              <p className="text-lg font-medium text-primary leading-relaxed mb-6">{question.question_text}</p>

              {/* Options */}
              <div className="space-y-3">
                {Object.entries(question.options).map(([key, value]) => (
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
        ) : question && result ? (
          // ─── Result + Explanation View ───
          <div className="space-y-4">
            {/* Result banner */}
            <div className={`rounded-xl p-4 border ${
              result.is_correct
                ? 'bg-success/20 border-success/50'
                : 'bg-danger/20 border-danger/50'
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{result.is_correct ? '✅' : '❌'}</span>
                <div>
                  <p className={`font-bold ${result.is_correct ? 'text-success' : 'text-danger'}`}>
                    {result.is_correct ? 'Correct!' : 'Incorrect'}
                  </p>
                  <p className="text-xs text-secondary mt-0.5">
                    Your answer: <span className="font-mono">{result.your_answer}</span>
                    {!result.is_correct && (
                      <> · Correct answer: <span className="font-mono text-success">{result.correct_option}</span></>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Explanation */}
            {result.explanation && (
              <ExplanationBlock
                explanation={result.explanation}
                isCorrect={result.is_correct}
                showPointer={!result.is_correct}
              />
            )}

            {/* Next button */}
            <button
              onClick={nextQuestion}
              disabled={answering}
              className="w-full py-4 rounded-xl font-medium bg-gradient-accent text-white hover:bg-accent-hover transition shadow-lg shadow-accent/20 disabled:opacity-50"
            >
              {answering ? 'Loading...' : 'Next Question →'}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
