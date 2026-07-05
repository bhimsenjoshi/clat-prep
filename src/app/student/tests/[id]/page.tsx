'use client';

import { useEffect, useState, useCallback } from 'react';
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
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(120 * 60); // 120 min default
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resultScores, setResultScores] = useState<{ section: string; score: number; total: number }[]>([]);
  const [resultTotal, setResultTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

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
      if (sectionIds.length) {
        const { data: qData } = await supabase
          .from('questions')
          .select('*')
          .in('section_id', sectionIds);
        setQuestions(qData ?? []);
      }

      // Find or create attempt
      const { data: existingAttempt } = await supabase
        .from('attempts')
        .select('*')
        .eq('test_id', id)
        .eq('student_id', user.id)
        .single();

      if (existingAttempt) {
        setAttemptId(existingAttempt.id);
        if (existingAttempt.submitted_at) {
          setSubmitted(true);
        }

        // Load existing responses
        const { data: responses } = await supabase
          .from('responses')
          .select('*')
          .eq('attempt_id', existingAttempt.id);

        if (responses) {
          const answerMap: Record<string, string> = {};
          responses.forEach((r) => {
            if (r.selected_option) answerMap[r.question_id] = r.selected_option;
          });
          setAnswers(answerMap);
        }

        if (existingAttempt.submitted_at) {
          setSubmitted(true);
        }
      } else {
        const { data: attempt } = await supabase
          .from('attempts')
          .insert({ test_id: id, student_id: user.id })
          .select()
          .single();
        if (attempt) {
          setAttemptId(attempt.id);
        }
      }

      setLoading(false);
    };
    init();
  }, []);

  // Timer
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

  const handleAnswer = (questionId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = useCallback(async () => {
    if (!attemptId || submitting) return;
    setSubmitting(true);

    // Grade the test
    let totalCorrect = 0;
    const sectionScores: Record<string, number> = {};

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
      };
    });

    const totalScore = Math.round((totalCorrect / questions.length) * 100);

    // Upsert responses
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
        total: questions.filter((q) => q.section_id === s.id).length,
      }))
    );
    setResultTotal(totalScore);
    setSubmitted(true);
    setSubmitting(false);
  }, [attemptId, questions, sections, answers, submitting]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading test...</div>;
  if (!test) return <div className="p-8 text-center text-gray-500">Test not found.</div>;

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 mb-6 text-center">
          <p className="text-5xl mb-4">🎉</p>
          <h2 className="text-2xl font-bold mb-2">Test Submitted!</h2>
          <p className="text-5xl font-bold text-indigo-600 mt-4 mb-1">{resultTotal}%</p>
          <p className="text-sm text-gray-500">Overall Score</p>
        </div>

        {/* Section breakdown */}
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
            href="/student/dashboard"
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/student/tests"
            className="border px-6 py-2.5 rounded-lg font-medium hover:bg-gray-100 transition"
          >
            More Tests
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
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b">
        <div>
          <h1 className="text-lg font-bold">{test.title}</h1>
          <p className="text-sm text-gray-500">
            {currentSection?.name} — Question {currentQIdx + 1} of {sectionQuestions.length}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            {questionsAnswered}/{totalQuestions} answered
          </span>
          <span className={`font-mono text-lg font-bold ${timeLeft < 300 ? 'text-red-600' : ''}`}>
            {formatTime(timeLeft)}
          </span>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition"
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_220px] gap-6">
        {/* Main content */}
        <div>
          {/* Passage */}
          {currentQuestion?.passage && (
            <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 mb-4 text-sm text-gray-700">
              <p className="font-medium text-xs text-yellow-700 uppercase tracking-wide mb-1">Passage</p>
              <p>{currentQuestion.passage}</p>
            </div>
          )}

          {/* Question */}
          <div className="bg-white border rounded-xl p-6 mb-4 shadow-sm">
            <p className="font-medium text-base mb-5">{currentQuestion?.question_text}</p>
            <div className="space-y-2">
              {currentQuestion &&
                Object.entries(currentQuestion.options).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => handleAnswer(currentQuestion.id, key)}
                    className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition ${
                      answers[currentQuestion.id] === key
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-800 font-medium'
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
                if (currentQIdx > 0) setCurrentQIdx(currentQIdx - 1);
                else if (currentSectionIdx > 0) {
                  setCurrentSectionIdx(currentSectionIdx - 1);
                  setCurrentQIdx(0);
                }
              }}
              disabled={currentSectionIdx === 0 && currentQIdx === 0}
              className="border px-4 py-2 rounded-lg text-sm disabled:opacity-30 hover:bg-gray-50 transition"
            >
              ← Previous
            </button>
            <button
              onClick={() => {
                if (currentQIdx < sectionQuestions.length - 1) setCurrentQIdx(currentQIdx + 1);
                else if (currentSectionIdx < sections.length - 1) {
                  setCurrentSectionIdx(currentSectionIdx + 1);
                  setCurrentQIdx(0);
                }
              }}
              disabled={currentSectionIdx === sections.length - 1 && currentQIdx === sectionQuestions.length - 1}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-30 hover:bg-indigo-700 transition"
            >
              Next →
            </button>
          </div>
        </div>

        {/* Sidebar — section/question nav */}
        <div className="space-y-4">
          {/* Section tabs */}
          <div className="bg-white border rounded-xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Sections</p>
            <div className="space-y-1">
              {sections.map((s, i) => {
                const sectionQ = questions.filter((q) => q.section_id === s.id);
                const answered = sectionQ.filter((q) => answers[q.id]).length;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      setCurrentSectionIdx(i);
                      setCurrentQIdx(0);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition ${
                      i === currentSectionIdx
                        ? 'bg-indigo-100 text-indigo-800 font-medium'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <span>{s.name}</span>
                    <span className="float-right text-gray-400">
                      {answered}/{sectionQ.length}
                    </span>
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
                  onClick={() => setCurrentQIdx(i)}
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
  );
}
