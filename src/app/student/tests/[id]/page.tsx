'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Test, Section, Question } from '@/types';

interface TestPageProps {
  params: Promise<{ id: string }>;
}

export default function TestTakingPage({ params }: TestPageProps) {
  const [test, setTest] = useState<Test | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questionTimes, setQuestionTimes] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState<number>(120 * 60);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resultScores, setResultScores] = useState<{ section: string; score: number; total: number }[]>([]);
  const [resultTotal, setResultTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();
  const questionStartRef = useRef<number>(Date.now());

  useEffect(() => {
    const init = async () => {
      const { id } = await params;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      // Load test
      const { data: testData } = await supabase
        .from('tests')
        .select('*')
        .eq('id', id)
        .single();
      if (!testData) { router.push('/student/tests'); return; }
      setTest(testData);

      // Load sections (ordered)
      const { data: sectionsData } = await supabase
        .from('sections')
        .select('*')
        .eq('test_id', id)
        .order('order_index');
      setSections(sectionsData ?? []);

      // Load all questions for this test
      const sectionIds = (sectionsData ?? []).map((s) => s.id);
      let allQuestions: Question[] = [];
      if (sectionIds.length) {
        const { data: qData } = await supabase
          .from('questions')
          .select('*')
          .in('section_id', sectionIds);
        allQuestions = qData ?? [];
        setQuestions(allQuestions);
      }

      // Find existing unsubmitted attempt or create a new one
      const { data: existingAttempts } = await supabase
        .from('attempts')
        .select('*')
        .eq('test_id', id)
        .eq('student_id', user.id)
        .order('started_at', { ascending: false });

      const unsubmitted = (existingAttempts ?? []).find((a: any) => !a.submitted_at);
      if (unsubmitted) {
        // Resume existing attempt
        setAttemptId(unsubmitted.id);
        setAttemptNumber(unsubmitted.attempt_number ?? 1);

        // Load existing responses
        const { data: responses } = await supabase
          .from('responses')
          .select('*')
          .eq('attempt_id', unsubmitted.id);

        if (responses) {
          const answerMap: Record<string, string> = {};
          const timeMap: Record<string, number> = {};
          responses.forEach((r: any) => {
            if (r.selected_option) answerMap[r.question_id] = r.selected_option;
            if (r.time_taken_seconds) timeMap[r.question_id] = r.time_taken_seconds;
          });
          setAnswers(answerMap);
          setQuestionTimes(timeMap);
        }
      } else {
        // Create new attempt
        const latestAttempt = (existingAttempts ?? [])[0];
        const nextNum = latestAttempt ? (latestAttempt.attempt_number ?? 1) + 1 : 1;

        const { data: attempt } = await supabase
          .from('attempts')
          .insert({
            test_id: id,
            student_id: user.id,
            attempt_number: nextNum,
          })
          .select()
          .single();
        if (attempt) {
          setAttemptId(attempt.id);
          setAttemptNumber(nextNum);
        }
      }

      setLoading(false);
    };
    init();
  }, []);

  // Track time on current question
  useEffect(() => {
    if (submitted || loading || !attemptId) return;
    // Reset timer whenever current question changes
    questionStartRef.current = Date.now();
  }, [currentSectionIdx, currentQIdx, submitted, loading, attemptId]);

  // Auto-save time when navigating away from a question
  const recordTimeForCurrentQuestion = useCallback(async () => {
    const q = sectionQuestions[currentQIdx];
    if (!attemptId || !q?.id) return;
    const elapsed = Math.round((Date.now() - questionStartRef.current) / 1000);
    if (elapsed < 1) return;

    const qId = q.id;
    const prevTime = questionTimes[qId] ?? 0;

    // Only save if we've spent meaningful time
    if (prevTime === 0 && elapsed < 3) return;

    // Optimistically update local state
    const totalTime = prevTime + elapsed;
    setQuestionTimes((prev) => ({ ...prev, [qId]: totalTime }));

    // Persist to DB
    await supabase.from('responses').upsert({
      attempt_id: attemptId,
      question_id: qId,
      selected_option: answers[qId] ?? null,
      time_taken_seconds: totalTime,
    }, { onConflict: 'attempt_id, question_id' });

    // Reset start time
    questionStartRef.current = Date.now();
  }, [attemptId, sectionQuestions, currentQIdx, questionTimes, answers, supabase]);

  // Timer countdown
  useEffect(() => {
    if (submitted || loading || !test) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [submitted, loading, test]);

  const currentSection = sections[currentSectionIdx];
  const sectionQuestions = questions.filter((q) => q.section_id === currentSection?.id);
  const currentQuestion = sectionQuestions[currentQIdx];

  const navigateTo = async (sectionIdx: number, qIdx: number) => {
    await recordTimeForCurrentQuestion();
    setCurrentSectionIdx(sectionIdx);
    setCurrentQIdx(qIdx);
  };

  const handleAnswer = (questionId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
    // Persist answer immediately
    if (attemptId) {
      supabase.from('responses').upsert({
        attempt_id: attemptId,
        question_id: questionId,
        selected_option: option,
      }, { onConflict: 'attempt_id, question_id' });
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!attemptId || submitting) return;

    // Record final question time
    await recordTimeForCurrentQuestion();

    setSubmitting(true);

    // Grade the test
    let totalCorrect = 0;
    const sectionScores: Record<string, number> = {};
    const allSectionQuestions: Record<string, Question[]> = {};
    for (const s of sections) {
      allSectionQuestions[s.id] = questions.filter((q) => q.section_id === s.id);
    }

    const responsesToUpsert = questions.map((q) => {
      const selected = answers[q.id] ?? null;
      const correct = selected === q.correct_option;
      if (correct) totalCorrect++;
      const section = sections.find((s) => s.id === q.section_id);
      if (section) {
        sectionScores[section.name] = (sectionScores[section.name] ?? 0) + (correct ? 1 : 0);
      }
      return {
        attempt_id: attemptId,
        question_id: q.id,
        selected_option: selected,
        is_correct: correct,
        time_taken_seconds: questionTimes[q.id] ?? null,
      };
    });

    const totalScore = Math.round((totalCorrect / questions.length) * 100);

    // Upsert all responses with final data
    for (const r of responsesToUpsert) {
      await supabase.from('responses').upsert(r, {
        onConflict: 'attempt_id, question_id',
      });
    }

    // Update attempt
    await supabase
      .from('attempts')
      .update({
        submitted_at: new Date().toISOString(),
        total_score: totalScore,
        section_scores: sectionScores,
      })
      .eq('id', attemptId);

    setResultScores(
      sections.map((s) => ({
        section: s.name,
        score: sectionScores[s.name] ?? 0,
        total: allSectionQuestions[s.id]?.length ?? 0,
      }))
    );
    setResultTotal(totalScore);
    setSubmitted(true);
    setSubmitting(false);
  }, [attemptId, questions, sections, answers, questionTimes, submitting]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-pulse flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Loading test...</p>
      </div>
    </div>
  );
  if (!test) return <div className="p-8 text-center text-gray-500">Test not found.</div>;

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 mb-6 text-center">
          <p className="text-5xl mb-4">🎉</p>
          <h2 className="text-2xl font-bold mb-2">Test Submitted!</h2>
          <p className="text-xs text-gray-400 mb-2">Attempt #{attemptNumber}</p>
          <p className="text-5xl font-bold text-indigo-600 mt-4 mb-1">{resultTotal}%</p>
          <p className="text-sm text-gray-500">Overall Score</p>
        </div>

        <div className="bg-white border rounded-xl p-6 mb-6 shadow-sm">
          <h3 className="font-semibold mb-4">Section-wise Breakdown</h3>
          <div className="space-y-3">
            {resultScores.map((rs) => (
              <div key={rs.section} className="flex items-center justify-between">
                <span className="text-sm font-medium">{rs.section}</span>
                <span className="text-sm font-bold text-indigo-600">
                  {rs.score}/{rs.total}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <Link
            href={`/student/tests/${test.id}/review?attempt=${attemptId}`}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition"
          >
            📝 Review Answers
          </Link>
          <Link
            href="/student/dashboard"
            className="border px-6 py-2.5 rounded-lg font-medium hover:bg-gray-100 transition"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const questionsAnswered = Object.keys(answers).length;
  const totalQuestions = questions.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/student/dashboard" className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-sm font-bold">{test.title}</h1>
              <p className="text-[10px] text-gray-500">Attempt #{attemptNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500">
              <span className="font-semibold">{questionsAnswered}</span>/{totalQuestions} answered
            </span>
            <span className={`font-mono text-lg font-bold ${timeLeft < 300 ? 'text-red-600' : ''}`}>
              {formatTime(timeLeft)}
            </span>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition"
            >
              {submitting ? 'Submitting...' : 'Submit Test'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-[1fr_220px] gap-6">
          {/* Main content */}
          <div>
            {/* Section indicator */}
            <div className="flex items-center gap-2 mb-4">
              {sections.map((s, i) => (
                <span key={s.id} className={`text-xs px-2 py-0.5 rounded-full ${
                  i === currentSectionIdx
                    ? 'bg-indigo-100 text-indigo-800 font-medium'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {s.name}
                </span>
              ))}
            </div>

            {/* Passage */}
            {currentQuestion?.passage && (
              <div className="bg-white border rounded-xl p-5 mb-4 shadow-sm">
                <p className="font-medium text-xs text-indigo-500 uppercase tracking-wide mb-2">Passage</p>
                <p className="text-sm text-gray-700 leading-relaxed">{currentQuestion.passage}</p>
              </div>
            )}

            {/* Question */}
            <div className="bg-white border rounded-xl p-6 mb-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-medium text-gray-400">
                  Question {currentQIdx + 1} of {sectionQuestions.length}
                  <span className="ml-2 text-indigo-400">· {currentSection?.name}</span>
                </span>
                <span className="text-[10px] text-gray-400">
                  {currentQuestion?.difficulty && (
                    <span className={`px-1.5 py-0.5 rounded ${
                      currentQuestion.difficulty === 'hard' ? 'bg-red-50 text-red-500' :
                      currentQuestion.difficulty === 'easy' ? 'bg-green-50 text-green-600' :
                      'bg-blue-50 text-blue-600'
                    }`}>
                      {currentQuestion.difficulty}
                    </span>
                  )}
                </span>
              </div>
              <p className="font-medium text-base mb-5">{currentQuestion?.question_text}</p>
              <div className="space-y-2">
                {currentQuestion &&
                  Object.entries(currentQuestion.options).map(([key, value]) => (
                    <button
                      key={key}
                      onClick={() => handleAnswer(currentQuestion.id, key)}
                      className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition ${
                        answers[currentQuestion.id] === key
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-800 font-medium ring-1 ring-indigo-300'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <span className="font-semibold mr-2">{key}.</span>
                      {value}
                    </button>
                  ))}
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => {
                  if (currentQIdx > 0) navigateTo(currentSectionIdx, currentQIdx - 1);
                  else if (currentSectionIdx > 0) {
                    const prevSec = sections[currentSectionIdx - 1];
                    const prevSecQs = questions.filter((q) => q.section_id === prevSec.id);
                    navigateTo(currentSectionIdx - 1, prevSecQs.length - 1);
                  }
                }}
                disabled={currentSectionIdx === 0 && currentQIdx === 0}
                className="border px-4 py-2 rounded-lg text-sm disabled:opacity-30 hover:bg-gray-50 transition"
              >
                ← Previous
              </button>
              <span className="text-xs text-gray-400">
                {sectionQuestions.filter((q) => answers[q.id]).length}/{sectionQuestions.length} in this section
              </span>
              <button
                onClick={() => {
                  if (currentQIdx < sectionQuestions.length - 1) navigateTo(currentSectionIdx, currentQIdx + 1);
                  else if (currentSectionIdx < sections.length - 1) navigateTo(currentSectionIdx + 1, 0);
                }}
                disabled={currentSectionIdx === sections.length - 1 && currentQIdx === sectionQuestions.length - 1}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-30 hover:bg-indigo-700 transition"
              >
                Next →
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Section nav */}
            <div className="bg-white border rounded-xl p-4 shadow-sm">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Sections</p>
              <div className="space-y-1">
                {sections.map((s, i) => {
                  const sectionQ = questions.filter((q) => q.section_id === s.id);
                  const answered = sectionQ.filter((q) => answers[q.id]).length;
                  return (
                    <button
                      key={s.id}
                      onClick={() => navigateTo(i, 0)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition ${
                        i === currentSectionIdx
                          ? 'bg-indigo-100 text-indigo-800 font-medium'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <span>{s.name}</span>
                      <span className="float-right text-gray-400">{answered}/{sectionQ.length}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Question grid */}
            <div className="bg-white border rounded-xl p-4 shadow-sm">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                {currentSection?.name}
              </p>
              <div className="grid grid-cols-5 gap-1.5">
                {sectionQuestions.map((q, i) => (
                  <button
                    key={q.id}
                    onClick={() => navigateTo(currentSectionIdx, i)}
                    className={`w-8 h-8 rounded text-xs font-medium transition ${
                      i === currentQIdx
                        ? 'bg-indigo-600 text-white'
                        : answers[q.id]
                        ? 'bg-green-100 text-green-800 border border-green-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
