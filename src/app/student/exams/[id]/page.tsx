'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Test, Section, Question } from '@/types';

interface TestPageProps {
  params: Promise<{ id: string }>;
}

function groupByPassage(qs: Question[]): { passage: string | null; questions: Question[] }[] {
  const map = new Map<string, Question[]>();
  for (const q of qs) {
    const key = q.passage ?? '__no_passage__';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(q);
  }
  const groups: { passage: string | null; questions: Question[] }[] = [];
  const noPassageGroup: { passage: string | null; questions: Question[] } = { passage: null, questions: [] };
  for (const [key, qlist] of map) {
    if (key === '__no_passage__') {
      noPassageGroup.questions = qlist;
    } else {
      groups.push({ passage: key, questions: qlist });
    }
  }
  if (noPassageGroup.questions.length) groups.push(noPassageGroup);
  return groups;
}

export default function ExamTakingPage({ params }: TestPageProps) {
  const [test, setTest] = useState<Test | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [currentGroupIdx, setCurrentGroupIdx] = useState(0);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questionTimes, setQuestionTimes] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState<number>(7200);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resultScores, setResultScores] = useState<{ section: string; score: number; total: number }[]>([]);
  const [resultTotal, setResultTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [passageExpanded, setPassageExpanded] = useState(true);
  const [userName, setUserName] = useState('');
  const [showExitModal, setShowExitModal] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const questionStartRef = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentSection = sections[currentSectionIdx];
  const sectionQuestions = useMemo(
    () => questions.filter((q) => q.section_id === currentSection?.id),
    [questions, currentSection]
  );
  const passageGroups = useMemo(() => groupByPassage(sectionQuestions), [sectionQuestions]);
  const currentGroup = passageGroups[currentGroupIdx];
  const allQuestionsInGroup = currentGroup?.questions ?? [];
  const currentQuestion = allQuestionsInGroup[currentQIdx];

  const sectionQuestionCount = sectionQuestions.length;
  const totalGroupCount = passageGroups.length;

  // ─── Init ───
  useEffect(() => {
    const init = async () => {
      const { id } = await params;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      // Load user profile
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
      if (profile?.full_name) setUserName(profile.full_name);

      const { data: testData } = await supabase.from('tests').select('*').eq('id', id).single();
      if (!testData) { router.push('/student/exams'); return; }
      setTest(testData);

      const { data: sectionsData } = await supabase.from('sections').select('*').eq('test_id', id).order('order_index');
      setSections(sectionsData ?? []);

      const sectionIds = (sectionsData ?? []).map((s: any) => s.id);
      if (sectionIds.length) {
        const { data: qData } = await supabase.from('questions').select('*').in('section_id', sectionIds);
        setQuestions(qData ?? []);
      }

      // Reset all state to defaults
      setAttemptId(null);
      setTimeLeft(7200);
      setAnswers({});
      setQuestionTimes({});
      setCurrentSectionIdx(0);
      setCurrentGroupIdx(0);
      setCurrentQIdx(0);
      setShowExitModal(false);
      setSubmitted(false);
      setSubmitting(false);
      setPassageExpanded(true);

      // Fetch existing attempts
      const { data: existingAttempts } = await supabase
        .from('attempts')
        .select('*')
        .eq('test_id', id)
        .eq('student_id', user.id)
        .order('started_at', { ascending: false });

      const unsubmitted = (existingAttempts ?? []).find((a: any) => !a.submitted_at);

      if (unsubmitted) {
        // Check if it's stale (older than 150 min) — delete and start fresh
        const startedAtTime = new Date(unsubmitted.started_at).getTime();
        if (!isNaN(startedAtTime) && (Date.now() - startedAtTime) > 150 * 60 * 1000) {
          await supabase.from('attempts').delete().eq('id', unsubmitted.id);
          const { data: attempt } = await supabase.from('attempts').insert({
            test_id: id, student_id: user.id,
          }).select().single();
          if (attempt) {
            setAttemptId(attempt.id);
            setTimeLeft(7200);
          }
          setLoading(false);
          return;
        }

        setAttemptId(unsubmitted.id);

        // Calculate remaining time from started_at
        const started = new Date(unsubmitted.started_at).getTime();
        if (!isNaN(started)) {
          const elapsed = Math.floor((Date.now() - started) / 1000);
          const remaining = Math.max(0, 7200 - elapsed);
          setTimeLeft(remaining);
        }

        // Restore answers
        const { data: responses } = await supabase.from('responses').select('*').eq('attempt_id', unsubmitted.id);
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
        const { data: attempt } = await supabase.from('attempts').insert({
          test_id: id, student_id: user.id,
        }).select().single();
        if (attempt) {
          setAttemptId(attempt.id);
          setTimeLeft(7200);
        }
      }

      setLoading(false);
    };
    init();
  }, []);

  // ─── Time tracking ───
  useEffect(() => {
    if (submitted || loading || !attemptId) return;
    questionStartRef.current = Date.now();
  }, [currentSectionIdx, currentGroupIdx, currentQIdx, submitted, loading, attemptId]);

  const recordTimeForCurrentQuestion = useCallback(async () => {
    if (!attemptId || !currentQuestion?.id) return;
    const elapsed = Math.round((Date.now() - questionStartRef.current) / 1000);
    if (elapsed < 1) return;
    const prevTime = questionTimes[currentQuestion.id] ?? 0;
    const totalTime = prevTime + elapsed;
    setQuestionTimes((p) => ({ ...p, [currentQuestion.id]: totalTime }));
    await supabase.from('responses').upsert({
      attempt_id: attemptId,
      question_id: currentQuestion.id,
      selected_option: answers[currentQuestion.id] ?? null,
      time_taken_seconds: totalTime,
    }, { onConflict: 'attempt_id, question_id' });
    questionStartRef.current = Date.now();
  }, [attemptId, currentQuestion, questionTimes, answers, supabase]);

  // ─── Timer Countdown ───
  useEffect(() => {
    if (submitted || loading || !test || !attemptId) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [submitted, loading, test, attemptId]);

  // ─── Quit / Exit ───
  const handleQuit = () => setShowExitModal(true);

  const confirmExit = async () => {
    // Kill timer first
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    // Delete attempt from DB
    if (attemptId) {
      const { error } = await supabase.from('attempts').delete().eq('id', attemptId);
      if (error) console.error('Exit delete failed:', error);
    }
    setShowExitModal(false);
    router.push('/student/dashboard');
  };

  const cancelExit = () => setShowExitModal(false);

  // ─── Navigation ───
  const navigateTo = async (sectionIdx: number, groupIdx: number, qIdx: number) => {
    await recordTimeForCurrentQuestion();
    setCurrentSectionIdx(sectionIdx);
    setCurrentGroupIdx(groupIdx);
    setCurrentQIdx(qIdx);
    if (sectionIdx !== currentSectionIdx || groupIdx !== currentGroupIdx) {
      setPassageExpanded(true);
    } else {
      setPassageExpanded(false);
    }
  };

  const handleAnswer = (questionId: string, option: string) => {
    const newVal = answers[questionId] === option ? '' : option;
    setAnswers((prev) => ({ ...prev, [questionId]: newVal }));
    if (attemptId) {
      supabase.from('responses').upsert({
        attempt_id: attemptId, question_id: questionId, selected_option: newVal || null,
      }, { onConflict: 'attempt_id, question_id' });
    }
  };

  // ─── Submit ───
  const handleSubmit = useCallback(async () => {
    if (!attemptId || submitting) return;
    // Kill timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    await recordTimeForCurrentQuestion();
    setSubmitting(true);

    let totalScore = 0;
    const sectionScores: Record<string, { raw: number; attempted: number }> = {};
    const allSectionQuestions: Record<string, Question[]> = {};
    for (const s of sections) allSectionQuestions[s.id] = questions.filter((q) => q.section_id === s.id);

    const responsesToUpsert = questions.map((q) => {
      const selected = answers[q.id] ?? null;
      const correct = selected === q.correct_option;
      const sec = sections.find((s) => s.id === q.section_id);
      if (sec) {
        if (!sectionScores[sec.name]) sectionScores[sec.name] = { raw: 0, attempted: 0 };
        if (selected) {
          sectionScores[sec.name].attempted++;
          if (correct) {
            sectionScores[sec.name].raw++;
            totalScore++;
          } else {
            sectionScores[sec.name].raw -= 0.25;
            totalScore -= 0.25;
          }
        }
      }
      return { attempt_id: attemptId, question_id: q.id, selected_option: selected, is_correct: correct, time_taken_seconds: questionTimes[q.id] ?? null };
    });

    totalScore = Math.max(0, totalScore);
    const totalPct = Math.round((totalScore / questions.length) * 100);
    for (const r of responsesToUpsert) await supabase.from('responses').upsert(r, { onConflict: 'attempt_id, question_id' });
    await supabase.from('attempts').update({ submitted_at: new Date().toISOString(), total_score: totalPct, section_scores: sectionScores }).eq('id', attemptId);

    setResultScores(sections.map((s) => ({ section: s.name, score: Math.max(0, Math.round(sectionScores[s.name]?.raw ?? 0)), total: allSectionQuestions[s.id]?.length ?? 0 })));
    setResultTotal(totalPct);
    setSubmitted(true);
    setSubmitting(false);
  }, [attemptId, questions, sections, answers, questionTimes, submitting]);

  // ─── Auto-submit at 0 (must be after handleSubmit declaration) ───
  useEffect(() => {
    if (submitted || loading || !test || !attemptId || timeLeft > 0) return;
    handleSubmit();
  }, [timeLeft, handleSubmit]);

  // ─── Helpers ───
  const answeredInSection = sectionQuestions.filter((q) => answers[q.id]).length;
  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  let cumulativeQ = 0;
  for (let i = 0; i < currentGroupIdx; i++) cumulativeQ += passageGroups[i]?.questions.length ?? 0;

  const isLastQInGroup = currentQIdx >= allQuestionsInGroup.length - 1;

  // ─── Loading / Submitted ───
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-secondary text-sm">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (!test) return <div className="p-8 text-center text-secondary">Exam not found.</div>;

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="bg-success/10 border border-success/50 rounded-2xl p-8 mb-6 text-center">
          <p className="text-5xl mb-4">🎉</p>
          <h2 className="text-2xl font-bold text-primary mb-2">Exam Submitted!</h2>
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
                <span className="text-sm font-bold text-accent">{rs.score}/{rs.total}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link href={`/student/exams/${test.id}/review?attempt=${attemptId}`}
            className="bg-accent text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-accent-hover transition">📝 Review Answers</Link>
          <a href={`/student/exams/${test.id}`}
            className="bg-amber-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-amber-600 transition">🔄 Retake Exam</a>
          <Link href="/student/dashboard"
            className="border border-theme px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-elevated transition">Exit</Link>
        </div>
      </div>
    );
  }

  // ─── Main UI ───
  return (
    <div className="min-h-screen bg-page">
      {/* Top bar */}
      <div className="bg-card border-b border-theme shadow-theme-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={handleQuit} className="text-muted hover:text-secondary shrink-0" title="Back to dashboard">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="truncate">
              <h1 className="text-sm font-bold text-primary truncate">{test.title}</h1>
              <p className="text-[10px] text-secondary truncate">
                {userName} · Attempt #{attemptNumber}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-secondary hidden sm:inline">
              <span className="font-semibold">{answeredInSection}</span>/{sectionQuestionCount} answered
            </span>
            <span className={`font-mono text-base sm:text-lg font-bold ${timeLeft < 300 ? 'text-danger' : 'text-accent'}`}>
              {formatTime(timeLeft)}
            </span>
            <button onClick={handleSubmit} disabled={submitting}
              className="bg-success text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-success-hover disabled:opacity-50 transition">
              {submitting ? '...' : 'Submit'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-6">
          {/* ─── Main content ─── */}
          <div>
            {/* Section indicator */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto">
              {sections.map((s, i) => (
                <span key={s.id} className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${i === currentSectionIdx ? 'bg-accent-subtle text-accent font-medium' : 'bg-card-hover text-secondary'}`}>{s.name}</span>
              ))}
            </div>

            {/* Passage — collapsible */}
            {currentGroup?.passage && (
              <div className="bg-card border border-theme rounded-xl mb-4 shadow-theme-sm overflow-hidden">
                <button
                  onClick={() => setPassageExpanded(!passageExpanded)}
                  className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-elevated transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-xs text-accent uppercase tracking-wide">Passage</span>
                    <span className="text-[10px] text-muted">({allQuestionsInGroup.length} questions)</span>
                  </div>
                  <svg className={`w-4 h-4 text-secondary transition-transform ${passageExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {passageExpanded && (
                  <div className="px-5 pb-5 max-h-60 overflow-y-auto">
                    <p className="text-sm text-secondary leading-relaxed">{currentGroup.passage}</p>
                  </div>
                )}
              </div>
            )}

            {/* Current question — one at a time */}
            {currentQuestion && (
              <div className="bg-card border border-theme rounded-xl p-6 mb-4 shadow-theme-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-medium text-muted">
                    Q{cumulativeQ + currentQIdx + 1}
                    <span className="ml-2 text-accent">· {currentSection?.name}</span>
                  </span>
                  {currentQuestion.difficulty && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      currentQuestion.difficulty === 'hard' ? 'bg-danger/10 text-danger' :
                      currentQuestion.difficulty === 'easy' ? 'bg-success/10 text-success' : 'bg-info/10 text-info'
                    }`}>{currentQuestion.difficulty}</span>
                  )}
                </div>
                <p className="font-medium text-base text-primary mb-5">{currentQuestion.question_text}</p>
                <div className="space-y-2">
                  {(() => {
                    let opts = currentQuestion.options;
                    if (typeof opts === 'string') { try { opts = JSON.parse(opts); } catch {} }
                    return Object.entries(opts).map(([key, value]) => (
                      <button key={key} onClick={() => handleAnswer(currentQuestion.id, key)}
                        className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition ${
                          answers[currentQuestion.id] === key
                            ? 'border-accent bg-accent-subtle text-accent font-medium ring-1 ring-accent/50'
                            : 'border-theme hover:border-theme hover:bg-elevated'
                        }`}>
                        <span className="font-semibold mr-2 text-secondary">{key}.</span>
                        <span className="text-primary">{value}</span>
                      </button>
                    ));
                  })()}
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between items-center">
              <div>
                {currentQIdx > 0 ? (
                  <button onClick={() => navigateTo(currentSectionIdx, currentGroupIdx, currentQIdx - 1)}
                    className="border border-theme px-4 py-2 rounded-lg text-xs font-medium text-secondary hover:bg-elevated transition">← Previous</button>
                ) : currentGroupIdx > 0 ? (
                  <button onClick={() => {
                    const prevGroupQs = passageGroups[currentGroupIdx - 1].questions;
                    navigateTo(currentSectionIdx, currentGroupIdx - 1, prevGroupQs.length - 1);
                  }} className="border border-theme px-4 py-2 rounded-lg text-xs font-medium text-secondary hover:bg-elevated transition">← Previous Group</button>
                ) : currentSectionIdx > 0 ? (
                  <button onClick={() => {
                    const prevSecQs = questions.filter((q) => q.section_id === sections[currentSectionIdx - 1].id);
                    const prevSecGroups = groupByPassage(prevSecQs);
                    const lastGroupQs = prevSecGroups[prevSecGroups.length - 1].questions;
                    navigateTo(currentSectionIdx - 1, prevSecGroups.length - 1, lastGroupQs.length - 1);
                  }} className="border border-theme px-4 py-2 rounded-lg text-xs font-medium text-secondary hover:bg-elevated transition">← Previous Section</button>
                ) : <div />}
              </div>

              <div>
                {!isLastQInGroup ? (
                  <button onClick={() => navigateTo(currentSectionIdx, currentGroupIdx, currentQIdx + 1)}
                    className="bg-accent text-white px-5 py-2 rounded-lg text-xs font-medium hover:bg-accent-hover transition">Next →</button>
                ) : currentGroupIdx < totalGroupCount - 1 ? (
                  <button onClick={() => navigateTo(currentSectionIdx, currentGroupIdx + 1, 0)}
                    className="bg-accent text-white px-5 py-2 rounded-lg text-xs font-medium hover:bg-accent-hover transition">Next Group →</button>
                ) : currentSectionIdx < sections.length - 1 ? (
                  <button onClick={() => navigateTo(currentSectionIdx + 1, 0, 0)}
                    className="bg-accent text-white px-5 py-2 rounded-lg text-xs font-medium hover:bg-accent-hover transition">Next Section →</button>
                ) : (
                  <button onClick={handleSubmit} disabled={submitting}
                    className="bg-success text-white px-5 py-2 rounded-lg text-xs font-medium hover:bg-success-hover transition">Submit Exam</button>
                )}
              </div>
            </div>
          </div>

          {/* ─── Sidebar / Question Palette ─── */}
          <div>
            <div className="bg-card border border-theme rounded-xl p-4 shadow-theme-sm mb-4">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Sections</h3>
              <div className="space-y-1">
                {sections.map((s, sIdx) => {
                  const secQs = questions.filter((q) => q.section_id === s.id);
                  const answeredCount = secQs.filter((q) => answers[q.id]).length;
                  return (
                    <button key={s.id} onClick={() => navigateTo(sIdx, 0, 0)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition ${sIdx === currentSectionIdx ? 'bg-accent-subtle text-accent font-medium' : 'text-secondary hover:bg-elevated'}`}>
                      <div className="flex justify-between items-center">
                        <span>{s.name}</span>
                        <span className="text-[10px] text-muted">{answeredCount}/{secQs.length}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-card border border-theme rounded-xl p-4 shadow-theme-sm mb-4">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Questions</h3>
              <div className="grid grid-cols-5 gap-1.5">
                {sectionQuestions.map((q, idx) => {
                  const isSelected = q.id === currentQuestion?.id;
                  const isAnswered = !!answers[q.id];

                  let groupIdx = 0;
                  let qIdx = 0;
                  for (let g = 0; g < passageGroups.length; g++) {
                    const qlist = passageGroups[g].questions;
                    const qInListIdx = qlist.findIndex((item) => item.id === q.id);
                    if (qInListIdx !== -1) {
                      groupIdx = g;
                      qIdx = qInListIdx;
                      break;
                    }
                  }

                  return (
                    <button key={q.id} onClick={() => navigateTo(currentSectionIdx, groupIdx, qIdx)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium flex items-center justify-center transition ${
                        isSelected
                          ? 'bg-accent text-white font-bold ring-2 ring-offset-2 ring-accent'
                          : isAnswered
                          ? 'bg-success/20 text-success border border-success/30 hover:bg-success/30'
                          : 'bg-elevated text-secondary hover:bg-card-hover border border-theme'
                      }`}>
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            <button onClick={handleQuit}
              className="w-full border border-theme px-4 py-3 rounded-xl text-sm font-medium text-danger hover:bg-tint-danger transition flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Exit
            </button>
          </div>
        </div>
      </div>

      {/* ─── Exit confirmation modal ─── */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-theme rounded-2xl p-6 max-w-sm w-full mx-4 shadow-theme-xl">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-primary mb-2">Exit Exam?</h3>
              <p className="text-sm text-secondary mb-1">
                Your current progress will be <span className="font-semibold text-danger">lost</span>.
              </p>
              <p className="text-sm text-secondary mb-6">
                All answers and time spent will not be saved.
              </p>
              <div className="flex gap-3">
                <button onClick={cancelExit}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-theme text-sm font-medium text-primary hover:bg-elevated transition">
                  Continue Exam
                </button>
                <button onClick={confirmExit}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-danger text-white text-sm font-medium hover:bg-danger-hover transition">
                  Yes, Exit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
