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
    const sec = sections[currentSectionIdx];
    const secQs = questions.filter((q) => q.section_id === sec?.id);
    const q = secQs[currentQIdx];
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
  }, [attemptId, sections, currentSectionIdx, questions, currentQIdx, questionTimes, answers, supabase]);

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
    <div className="min-h-screen flex items-center justify-center bg-page">
      <div className="animate-pulse flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-secondary text-sm">Loading test...</p>
      </div>
    </div>
  );
  if (!test) return <div className="p-8 text-center text-secondary">Test not found.</div>;

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="bg-success/10 border border-success/50 rounded-2xl p-8 mb-6 text-center">
          <p className="text-5xl mb-4">🎉</p>
          <h2 className="text-2xl font-bold text-primary mb-2">Test Submitted!</h2>
          <p className="text-xs text-secondary mb-2">Attempt #{attemptNumber}</p>
          <p className="text-5xl font-bold text-accent mt-4 mb-1">{resultTotal}%</p>
          <p className="text-sm text-secondary">Overall Score</p>
        </div>

        <div className="bg-card border border-theme rounded-xl p-6 mb-6 shadow-theme-sm">
          <h3 className="font-semibold text-primary mb-4">Section-wise Breakdown</h3>
          <div className="space-y-3">
            {resultScores.map((rs) => (
              <div key={rs.section} className="flex items-center justify-between">
                <span className="text-sm font-medium text-primary">{rs.section}</span>
                <span className="text-sm font-bold text-accent">
                  {rs.score}/{rs.total}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <Link
            href={`/student/tests/${test.id}/review?attempt=${attemptId}`}
            className="bg-accent text-white px-6 py-2.5 rounded-lg font-medium hover:bg-accent-hover transition"
          >
            📝 Review Answers
          </Link>
          <Link
            href="/student/dashboard"
            className="border border-theme px-6 py-2.5 rounded-lg font-medium hover:bg-elevated transition"
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
    <div className="min-h-screen bg-page">
      {/* Top bar */}
      <div className="bg-card border-b border-theme shadow-theme-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/student/dashboard" className="text-muted hover:text-secondary">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-sm font-bold text-primary">{test.title}</h1>
              <p className="text-[10px] text-secondary">Attempt #{attemptNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-secondary">
              <span className="font-semibold">{questionsAnswered}</span>/{totalQuestions} answered
            </span>
            <span className={`font-mono text-lg font-bold ${timeLeft < 300 ? 'text-danger' : ''}`}>
              {formatTime(timeLeft)}
            </span>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-success text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-success-hover disabled:opacity-50 transition"
            >
              {submitting ? 'Submitting...' : 'Submit Test'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-6">
          {/* Main content */}
          <div>
            {/* Section indicator */}
            <div className="flex items-center gap-2 mb-4">
              {sections.map((s, i) => (
                <span key={s.id} className={`text-xs px-2 py-0.5 rounded-full ${
                  i === currentSectionIdx
                    ? 'bg-accent-subtle text-accent font-medium'
                    : 'bg-card-hover text-secondary'
                }`}>
                  {s.name}
                </span>
              ))}
            </div>

            {/* Passage */}
            {currentQuestion?.passage && (
              <div className="bg-card border border-theme rounded-xl p-5 mb-4 shadow-theme-sm">
                <p className="font-medium text-xs text-accent uppercase tracking-wide mb-2">Passage</p>
                <p className="text-sm text-secondary leading-relaxed">{currentQuestion.passage}</p>
              </div>
            )}

            {/* Question */}
            <div className="bg-card border border-theme rounded-xl p-6 mb-4 shadow-theme-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-medium text-muted">
                  Question {currentQIdx + 1} of {sectionQuestions.length}
                  <span className="ml-2 text-accent">· {currentSection?.name}</span>
                </span>
                <span className="text-[10px] text-muted">
                  {currentQuestion?.difficulty && (
                    <span className={`px-1.5 py-0.5 rounded ${
                      currentQuestion.difficulty === 'hard' ? 'bg-danger/10 text-danger' :
                      currentQuestion.difficulty === 'easy' ? 'bg-success/10 text-success' :
                      'bg-info/10 text-info'
                    }`}>
                      {currentQuestion.difficulty}
                    </span>
                  )}
                </span>
              </div>
              <p className="font-medium text-base text-primary mb-5">{currentQuestion?.question_text}</p>
              <div className="space-y-2">
                {currentQuestion &&
                  Object.entries(currentQuestion.options).map(([key, value]) => (
                    <button
                      key={key}
                      onClick={() => handleAnswer(currentQuestion.id, key)}
                      className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition ${
                        answers[currentQuestion.id] === key
                          ? 'border-accent bg-accent-subtle text-accent font-medium ring-1 ring-accent/50'
                          : 'border-theme hover:border-theme hover:bg-elevated'
                      }`}
                    >
                      <span className="font-semibold mr-2 text-secondary">{key}.</span>
                      <span className="text-primary">{value}</span>
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
                className="border border-theme px-4 py-2 rounded-lg text-sm disabled:opacity-30 hover:bg-elevated transition"
              >
                ← Previous
              </button>
              <span className="text-xs text-muted">
                {sectionQuestions.filter((q) => answers[q.id]).length}/{sectionQuestions.length} in this section
              </span>
              <button
                onClick={() => {
                  if (currentQIdx < sectionQuestions.length - 1) navigateTo(currentSectionIdx, currentQIdx + 1);
                  else if (currentSectionIdx < sections.length - 1) navigateTo(currentSectionIdx + 1, 0);
                }}
                disabled={currentSectionIdx === sections.length - 1 && currentQIdx === sectionQuestions.length - 1}
                className="bg-accent text-white px-4 py-2 rounded-lg text-sm disabled:opacity-30 hover:bg-accent-hover transition"
              >
                Next →
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="md:order-last space-y-4">
            {/* Section nav */}
            <div className="bg-card border border-theme rounded-xl p-4 shadow-theme-sm">
              <p className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2">Sections</p>
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
                          ? 'bg-accent-subtle text-accent font-medium'
                          : 'hover:bg-elevated'
                      }`}
                    >
                      <span className="text-primary">{s.name}</span>
                      <span className="float-right text-muted">{answered}/{sectionQ.length}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Question grid */}
            <div className="bg-card border border-theme rounded-xl p-4 shadow-theme-sm">
              <p className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2">
                {currentSection?.name}
              </p>
              <div className="grid grid-cols-5 gap-1.5">
                {sectionQuestions.map((q, i) => (
                  <button
                    key={q.id}
                    onClick={() => navigateTo(currentSectionIdx, i)}
                    className={`w-8 h-8 rounded text-xs font-medium transition ${
                      i === currentQIdx
                        ? 'bg-accent text-white'
                        : answers[q.id]
                        ? 'bg-success/10 text-success border border-success/50'
                        : 'bg-card-hover text-secondary hover:bg-elevated'
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
