'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { Section, Question } from '@/types';

interface ReviewPageProps {
  params: Promise<{ id: string }>;
}

interface ResponseWithQ extends Question {
  selected_option: string | null;
  is_correct: boolean | null;
  time_taken_seconds: number | null;
}

export default function ReviewPage({ params }: ReviewPageProps) {
  const [testTitle, setTestTitle] = useState('');
  const [sections, setSections] = useState<Section[]>([]);
  const [responses, setResponses] = useState<ResponseWithQ[]>([]);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [attemptInfo, setAttemptInfo] = useState({ attempt_number: 1, total_score: 0 });
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const { id: testId } = await params;
      const attemptId = searchParams.get('attempt');
      if (!attemptId) { router.push('/student/dashboard'); return; }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      // Fetch test
      const { data: test } = await supabase.from('tests').select('title').eq('id', testId).single();
      setTestTitle(test?.title ?? 'Unknown Test');

      // Fetch attempt
      const { data: attempt } = await supabase
        .from('attempts')
        .select('*')
        .eq('id', attemptId)
        .eq('student_id', user.id)
        .single();

      if (!attempt) { router.push('/student/dashboard'); return; }
      setAttemptInfo({ attempt_number: attempt.attempt_number ?? 1, total_score: attempt.total_score ?? 0 });
      setScore(attempt.total_score ?? 0);

      // Fetch sections
      const { data: secs } = await supabase
        .from('sections')
        .select('*')
        .eq('test_id', testId)
        .order('order_index');
      setSections(secs ?? []);
      if (secs?.length) setActiveSection(secs[0].id);

      // Fetch responses + questions
      const { data: respData } = await supabase
        .from('responses')
        .select('*, questions(*)')
        .eq('attempt_id', attemptId);

      if (respData) {
        const enriched: ResponseWithQ[] = respData.map((r: any) => ({
          id: r.questions.id,
          section_id: r.questions.section_id,
          question_text: r.questions.question_text,
          passage: r.questions.passage,
          options: r.questions.options,
          correct_option: r.questions.correct_option,
          explanation: r.questions.explanation,
          difficulty: r.questions.difficulty,
          generated_by: r.questions.generated_by,
          reviewed: r.questions.reviewed,
          selected_option: r.selected_option,
          is_correct: r.is_correct,
          time_taken_seconds: r.time_taken_seconds,
        }));
        setResponses(enriched);
      }

      setLoading(false);
    };
    init();
  }, []);

  const formatTime = (s: number | null) => {
    if (!s) return '-';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    if (m > 0) return `${m}m ${sec}s`;
    return `${sec}s`;
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-page">
      <div className="animate-pulse flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-secondary text-sm">Loading review...</p>
      </div>
    </div>
  );

  const sectionResponses = activeSection
    ? responses.filter((r) => r.section_id === activeSection)
    : responses;
  const correctInSection = sectionResponses.filter((r) => r.is_correct).length;
  const totalInSection = sectionResponses.length;
  const sectionName = sections.find((s) => s.id === activeSection)?.name ?? 'All';

  return (
    <div className="min-h-screen bg-page">
      {/* Header */}
      <div className="bg-card border-b border-theme shadow-theme-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/student/dashboard" className="text-muted hover:text-secondary">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-primary">Review: {testTitle}</h1>
              <p className="text-xs text-secondary">Attempt #{attemptInfo.attempt_number}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className={`text-xl font-bold ${
                score >= 70 ? 'text-green-600' : score >= 40 ? 'text-amber-600' : 'text-red-600'
              }`}>{score}%</p>
              <p className="text-[10px] text-muted">
                {responses.filter((r) => r.is_correct).length}/{responses.length} correct
              </p>
            </div>
            <Link href={`/student/tests/${searchParams.get('attempt')?.split('?')[0] ?? ''}`}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-tint-green text-stat-green hover:bg-tint-green border border-theme transition">
              🔄 Retake
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Section tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveSection(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              !activeSection
                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            📋 All ({responses.filter((r) => r.is_correct).length}/{responses.length})
          </button>
          {sections.map((s) => {
            const secResp = responses.filter((r) => r.section_id === s.id);
            const correct = secResp.filter((r) => r.is_correct).length;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  activeSection === s.id
                    ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {s.name} ({correct}/{secResp.length})
              </button>
            );
          })}
        </div>

        {/* Score summary card */}
        <div className="bg-card border border-theme rounded-xl shadow-theme-sm p-5 mb-6">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold ${
              score >= 70 ? 'bg-green-100 text-green-700' :
              score >= 40 ? 'bg-amber-100 text-amber-700' :
              'bg-red-100 text-red-700'
            }`}>
              {score}%
            </div>
            <div className="flex-1">
              <p className="font-semibold text-primary">Attempt #{attemptInfo.attempt_number}</p>
              <div className="flex items-center gap-4 mt-1 text-xs text-secondary">
                <span>✅ {responses.filter((r) => r.is_correct).length} correct</span>
                <span>❌ {responses.filter((r) => r.is_correct === false).length} incorrect</span>
                <span>⬜ {responses.filter((r) => r.is_correct === null).length} unanswered</span>
                <span className="text-indigo-500">
                  ⏱ {(() => {
                    const total = responses.reduce((s, r) => s + (r.time_taken_seconds ?? 0), 0);
                    return formatTime(total);
                  })()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {sectionResponses.map((r, idx) => {
            const isCorrect = r.is_correct === true;
            const isWrong = r.is_correct === false;
            const isUnanswered = r.selected_option === null;

            return (
              <div key={r.id} className={`bg-card border border-theme rounded-xl shadow-theme-sm overflow-hidden ${
                isCorrect ? 'border-green-200' :
                isWrong ? 'border-red-200' :
                'border-amber-200'
              }`}>
                {/* Status bar */}
                <div className={`px-5 py-2 flex items-center justify-between ${
                  isCorrect ? 'bg-green-50' :
                  isWrong ? 'bg-red-50' :
                  'bg-amber-50'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {isCorrect ? '✅' : isWrong ? '❌' : '⬜'}
                    </span>
                    <span className="text-xs font-medium text-secondary">Q{idx + 1}</span>
                    {r.difficulty && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        r.difficulty === 'hard' ? 'bg-red-100 text-red-600' :
                        r.difficulty === 'easy' ? 'bg-green-100 text-green-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>{r.difficulty}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-muted">
                    <span>⏱ {formatTime(r.time_taken_seconds)}</span>
                    <span>
                      {isCorrect ? 'Correct' : isWrong ? `Your answer: ${r.selected_option} · Correct: ${r.correct_option}` : 'Not answered'}
                    </span>
                  </div>
                </div>

                {/* Passage */}
                {r.passage && (
                  <div className="px-5 py-3 bg-tint-indigo border-b border-theme">
                    <p className="text-[10px] font-medium text-accent uppercase tracking-wider mb-1">Passage</p>
                    <p className="text-xs text-secondary leading-relaxed">{r.passage}</p>
                  </div>
                )}

                {/* Question */}
                <div className="px-5 py-4">
                  <p className="text-sm font-medium text-primary mb-3">{r.question_text}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(r.options).map(([key, value]) => {
                      const isSelected = r.selected_option === key;
                      const isCorrectOpt = r.correct_option === key;
                      return (
                        <div
                          key={key}
                          className={`flex items-center gap-2 border rounded-lg px-3 py-2 text-sm ${
                            isCorrectOpt
                              ? 'border-green-400 bg-green-50 ring-1 ring-green-300'
                              : isSelected && !isCorrectOpt
                              ? 'border-red-400 bg-red-50 ring-1 ring-red-300'
                              : 'border-gray-200'
                          }`}
                        >
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isCorrectOpt ? 'bg-green-500 text-white' :
                            isSelected ? 'bg-red-500 text-white' :
                            'bg-elevated text-secondary'
                          }`}>
                            {isCorrectOpt ? '✓' : isSelected ? '✗' : key}
                          </span>
                          <span className={`flex-1 ${
                            isCorrectOpt ? 'text-green-800 font-medium' :
                            isSelected ? 'text-red-800' :
                            'text-gray-700'
                          }`}>
                            {value}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  {r.explanation && (
                    <div className="mt-3 p-3 bg-tint-blue border border-theme rounded-lg">
                      <p className="text-[10px] font-medium text-info uppercase tracking-wider mb-1">Explanation</p>
                      <p className="text-xs text-secondary leading-relaxed">{r.explanation}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom nav */}
        <div className="flex justify-between items-center mt-8 pb-8">
          <Link href="/student/dashboard" className="text-sm text-accent hover:underline">
            ← Back to Dashboard
          </Link>
          <Link href={`/student/tests/${searchParams.get('attempt')?.split('?')[0] ?? ''}`}
            className="px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 transition shadow-sm">
            🔄 Retake This Test
          </Link>
        </div>
      </div>
    </div>
  );
}
