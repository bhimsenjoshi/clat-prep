'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Test, Section, Question } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

const SECTION_NAMES = [
  'English',
  'Current Affairs',
  'Legal Reasoning',
  'Logical Reasoning',
  'Quantitative Techniques',
] as const;

// CLAT 2026 question targets per section
const SECTION_TARGETS: Record<string, { min: number; max: number; label: string; icon: string }> = {
  'English':               { min: 22, max: 26, label: '22-26', icon: '📖' },
  'Current Affairs':       { min: 28, max: 32, label: '28-32', icon: '🌍' },
  'Legal Reasoning':       { min: 28, max: 32, label: '28-32', icon: '⚖️' },
  'Logical Reasoning':     { min: 22, max: 26, label: '22-26', icon: '🧠' },
  'Quantitative Techniques': { min: 10, max: 14, label: '10-14', icon: '📊' },
};

export default function AdminTestEditPage({ params }: PageProps) {
  const [test, setTest] = useState<Test | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [questionsBySection, setQuestionsBySection] = useState<Record<string, Question[]>>({});
  const [activeSection, setActiveSection] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [reviewAll, setReviewAll] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [composition, setComposition] = useState<Record<string, { picked: number; total: number; questions: Question[] }> | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const { id } = await params;

      const { data: t } = await supabase.from('tests').select('*').eq('id', id).single();
      if (!t) { router.push('/admin/tests'); return; }
      setTest(t);

      const { data: secs } = await supabase
        .from('sections')
        .select('*')
        .eq('test_id', id)
        .order('order_index');
      setSections(secs ?? []);
      if (secs?.length) setActiveSection(secs[0].id);

      // Load questions per section
      const qMap: Record<string, Question[]> = {};
      for (const s of secs ?? []) {
        const { data: qs } = await supabase
          .from('questions')
          .select('*')
          .eq('section_id', s.id);
        qMap[s.id] = qs ?? [];
      }
      setQuestionsBySection(qMap);
      setLoading(false);
    };
    init();
  }, []);

  const handleGenerate = async () => {
    if (!test || generating) return;
    setGenerating(true);

    const currentSection = sections.find((s) => s.id === activeSection);
    if (!currentSection) { setGenerating(false); return; }

    const existing = questionsBySection[activeSection] ?? [];
    const target = SECTION_TARGETS[currentSection.name] ?? { min: 10, max: 10, label: '10' };
    if (existing.length >= target.max) {
      alert(`This section already has ${existing.length} questions (target: ${target.label}). Delete some first.`);
      setGenerating(false);
      return;
    }

    // Only ask for what we still need — never overshoot the target
    const remaining = Math.min(target.max - existing.length, 12);

    try {
      const res = await fetch('/api/generate-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId: activeSection,
          sectionName: currentSection.name,
          maxQuestions: remaining,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(`Generation failed: ${data.error || 'Unknown error'}`);
        setGenerating(false);
        return;
      }

      if (data.questions) {
        setQuestionsBySection((prev) => ({
          ...prev,
          [activeSection]: [...(prev[activeSection] ?? []), ...data.questions],
        }));
      }
    } catch (err: any) {
      alert(`Failed to generate: ${err.message}`);
    }
    setGenerating(false);
  };

  const handleComposePaper = async () => {
    if (composing) return;
    setComposing(true);
    setComposition(null);

    // Check available questions per section
    const available: Record<string, { questions: Question[]; target: typeof SECTION_TARGETS[string] }> = {};
    let minSum = 0;
    let allEnough = true;
    const issues: string[] = [];

    for (const s of sections) {
      const qs = questionsBySection[s.id] ?? [];
      const target = getTarget(s.name);
      available[s.name] = { questions: qs, target };
      minSum += target.min;
      if (qs.length < target.min) {
        allEnough = false;
        issues.push(`${s.name}: need ${target.min}, have ${qs.length}`);
      }
    }

    if (!allEnough) {
      alert(`Not enough questions to compose a full paper:\n${issues.join('\n')}\n\nGenerate more questions first.`);
      setComposing(false);
      return;
    }

    // Algorithm: start at mins, distribute remaining randomly within max bounds
    const picks: Record<string, number> = {};
    let remaining = 120;

    // Phase 1: allocate mins
    for (const s of sections) {
      picks[s.name] = available[s.name].target.min;
      remaining -= available[s.name].target.min;
    }

    // Phase 2: distribute remaining randomly, respecting max per section
    const shuffled = [...sections].sort(() => Math.random() - 0.5);
    for (const s of shuffled) {
      if (remaining <= 0) break;
      const target = available[s.name].target;
      const maxExtra = Math.min(target.max - picks[s.name], remaining);
      if (maxExtra > 0) {
        const extra = Math.floor(Math.random() * (maxExtra + 1));
        picks[s.name] += extra;
        remaining -= extra;
      }
    }

    // Phase 3: if still remaining after round-robin, give to sections with headroom
    if (remaining > 0) {
      for (const s of shuffled) {
        if (remaining <= 0) break;
        const target = available[s.name].target;
        const headroom = target.max - picks[s.name];
        if (headroom > 0) {
          const extra = Math.min(headroom, remaining);
          picks[s.name] += extra;
          remaining -= extra;
        }
      }
    }

    // Phase 4: pick random questions from each section
    const result: Record<string, { picked: number; total: number; questions: Question[] }> = {};
    for (const s of sections) {
      const qs = available[s.name].questions;
      const count = picks[s.name];
      // Shuffle and pick
      const shuffledQs = [...qs].sort(() => Math.random() - 0.5);
      result[s.name] = {
        picked: count,
        total: qs.length,
        questions: shuffledQs.slice(0, count),
      };
    }

    setComposition(result);
    setComposing(false);
  };

  const clearComposition = () => setComposition(null);

  const updateQuestion = async (qId: string, field: string, value: string | boolean) => {
    await supabase.from('questions').update({ [field]: value }).eq('id', qId);
    setQuestionsBySection((prev) => ({
      ...prev,
      [activeSection]: (prev[activeSection] ?? []).map((q) =>
        q.id === qId ? { ...q, [field]: value } : q
      ),
    }));
  };

  const deleteQuestion = async (qId: string) => {
    await supabase.from('questions').delete().eq('id', qId);
    setQuestionsBySection((prev) => ({
      ...prev,
      [activeSection]: (prev[activeSection] ?? []).filter((q) => q.id !== qId),
    }));
    setDeleteConfirm(null);
  };

  const handleMarkAllReviewed = async () => {
    const allQuestions = Object.values(questionsBySection).flat();
    const unreviewed = allQuestions.filter((q) => !q.reviewed);
    for (const q of unreviewed) {
      await supabase.from('questions').update({ reviewed: true }).eq('id', q.id);
    }
    const updated: Record<string, Question[]> = {};
    for (const [secId, qs] of Object.entries(questionsBySection)) {
      updated[secId] = qs.map((q) => ({ ...q, reviewed: true }));
    }
    setQuestionsBySection(updated);
  };

  const getTarget = (sectionName: string) =>
    SECTION_TARGETS[sectionName] ?? { min: 10, max: 10, label: '10', icon: '📝' };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-page">
      <div className="animate-pulse flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-secondary text-sm">Loading editor...</p>
      </div>
    </div>
  );
  if (!test) return null;

  const activeSectionObj = sections.find((s) => s.id === activeSection);
  const activeTarget = activeSectionObj ? getTarget(activeSectionObj.name) : null;
  const activeQuestions = questionsBySection[activeSection] ?? [];
  const allQuestions = Object.values(questionsBySection).flat();
  const totalPending = allQuestions.filter((q) => !q.reviewed).length;
  const allReviewed = allQuestions.length > 0 && totalPending === 0;
  const displayQs = reviewAll ? allQuestions : activeQuestions;

  // Summary stats
  const sectionStats = sections.map((s) => ({
    ...s,
    count: (questionsBySection[s.id] ?? []).length,
    target: getTarget(s.name),
  }));
  const totalQuestionsTarget = sectionStats.reduce((sum, s) => sum + s.target.max, 0);

  return (
    <div className="min-h-screen bg-page">
      {/* Header */}
      <div className="bg-card border-b border-theme shadow-theme-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/tests" className="text-muted hover:text-secondary transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-primary">{test.title}</h1>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                test.status === 'published' ? 'bg-tint-success text-success' :
                test.status === 'draft' ? 'bg-tint-warning text-warning' :
                'bg-elevated text-secondary'
              }`}>
                {test.status}
              </span>
            </div>
          </div>
          <div className="text-right text-sm text-secondary">
            <span className="font-semibold text-primary">{allQuestions.length}</span>
            <span className="mx-1 text-muted">/</span>
            <span>{totalQuestionsTarget}</span>
            <span className="ml-1 text-muted">questions</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Section progress cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {sectionStats.map((s) => {
            const isActive = s.id === activeSection;
            const pct = Math.min(Math.round((s.count / s.target.max) * 100), 100);
            const isFull = s.count >= s.target.max;
            return (
              <button
                key={s.id}
                onClick={() => { setActiveSection(s.id); setReviewAll(false); }}
                className={`relative overflow-hidden rounded-xl p-3 text-left transition-all duration-200 border border-theme ${
                  isActive
                    ? 'bg-card shadow-theme-md ring-2 ring-accent scale-[1.02]'
                    : 'bg-card hover:bg-card-hover hover:shadow-theme-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-lg">{s.target.icon}</span>
                  {isFull && <span className="text-[10px] font-bold text-success bg-tint-success px-1.5 py-0.5 rounded-full">✓ Full</span>}
                </div>
                <p className="text-xs font-semibold text-primary leading-tight mb-1">{s.name}</p>
                <p className="text-sm font-bold">
                  <span className={isFull ? 'text-success' : 'text-accent'}>{s.count}</span>
                  <span className="text-muted text-xs font-normal">/{s.target.label}</span>
                </p>
                {/* Progress bar */}
                <div className="mt-1.5 h-1.5 bg-elevated rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isFull ? 'bg-success' : 'bg-accent'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Actions bar */}
        <div className="bg-card rounded-xl border border-theme shadow-theme-sm p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!reviewAll && activeTarget && (
              <span className="text-sm text-secondary">
                <span className="font-semibold text-primary">{activeQuestions.length}</span>
                <span className="mx-1">of</span>
                <span className="font-medium text-accent">{activeTarget.label}</span>
                <span className="ml-2 text-muted">questions</span>
              </span>
            )}
            {reviewAll && (
              <span className="text-sm text-secondary">
                <span className="font-semibold text-primary">{allQuestions.length}</span>
                <span className="mx-1">total</span>
                <span className="text-warning ml-2">{totalPending} pending review</span>
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setReviewAll(!reviewAll); setActiveSection(''); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                reviewAll
                  ? 'bg-tint-success text-success ring-1 ring-success/50'
                  : 'bg-elevated text-secondary hover:bg-elevated ring-1 ring-theme'
              }`}
            >
              📋 All Sections
            </button>
            {reviewAll && (
              <button
                onClick={handleMarkAllReviewed}
                disabled={allReviewed}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-success text-white hover:bg-success-hover disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {allReviewed ? '✅ All Done' : '✅ Mark All Reviewed'}
              </button>
            )}
            {!reviewAll && (
              <button
                onClick={handleGenerate}
                disabled={generating || activeQuestions.length >= (activeTarget?.max ?? 10)}
                className="px-4 py-1.5 rounded-lg text-xs font-medium bg-gradient-accent text-white hover:bg-gradient-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
              >
                {generating ? (
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </span>
                ) : (
                  '🪄 Generate with AI'
                )}
              </button>
            )}
            {!reviewAll && (
              <button
                onClick={handleComposePaper}
                disabled={composing}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-warm text-white hover:bg-gradient-warm-hover disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
              >
                {composing ? (
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Composing...
                  </span>
                ) : (
                  '🎯 Compose 120Q Paper'
                )}
              </button>
            )}
          </div>
        </div>

        {/* Composition result */}
        {composition && (
          <div className="bg-tint-warning border border-warning/50 rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎯</span>
                <h3 className="font-bold text-primary">120-Question Paper Composed</h3>
              </div>
              <button onClick={clearComposition}
                className="text-xs px-2.5 py-1 rounded-md font-medium bg-card border border-theme text-warning hover:bg-tint-warning transition">
                ✕ Dismiss
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
              {Object.entries(composition).map(([name, info]) => (
                <div key={name} className="bg-card/80 rounded-lg p-3 border border-warning/50">
                  <p className="text-[10px] font-semibold text-secondary uppercase tracking-wider mb-1">{name}</p>
                  <p className="text-lg font-bold text-warning">{info.picked}</p>
                  <p className="text-[10px] text-muted">of {info.total} available</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-sm">
              <p className="text-secondary">
                <span className="font-bold text-warning">{Object.values(composition).reduce((s, i) => s + i.picked, 0)}</span>
                <span className="mx-1">questions total</span>
                <span className="text-muted">· random selection from each section</span>
              </p>
              <p className="text-xs text-muted">Click "Dismiss" to re-randomize</p>
            </div>
          </div>
        )}

        {/* Question list */}
        <div className="space-y-3">
          {displayQs.length === 0 ? (
            <div className="bg-card border-2 border-dashed border-theme rounded-xl p-12 text-center">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-secondary font-medium mb-1">
                {reviewAll ? 'No questions yet' : 'No questions in this section'}
              </p>
              <p className="text-muted text-sm mb-4">
                {reviewAll
                  ? 'Generate questions for each section using the tabs above.'
                  : `Click "Generate with AI" to create ${activeTarget?.label ?? '10'} CLAT-style questions.`}
              </p>
              {!reviewAll && (
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-accent text-white hover:bg-gradient-accent-hover disabled:opacity-40 transition shadow-sm"
                >
                  {generating ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating...
                    </span>
                  ) : (
                    <>🪄 Generate First Questions</>
                  )}
                </button>
              )}
            </div>
          ) : displayQs.map((q, idx) => {
            const section = sections.find((s) => s.id === q.section_id);
            return (
              <div key={q.id} className="bg-card border border-theme rounded-xl shadow-theme-sm hover:shadow transition-shadow overflow-hidden">
                {/* Question header */}
                <div className="flex items-center justify-between px-5 py-3 bg-elevated border-b border-theme">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted bg-card border border-theme rounded-full w-6 h-6 flex items-center justify-center">
                      {idx + 1}
                    </span>
                    {reviewAll && section && (
                      <span className="text-[10px] font-medium text-accent bg-tint-indigo px-2 py-0.5 rounded-full">
                        {section.name}
                      </span>
                    )}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      q.reviewed
                        ? 'bg-tint-success text-success ring-1 ring-success/50'
                        : 'bg-tint-warning text-warning ring-1 ring-warning/50'
                    }`}>
                      {q.reviewed ? 'Reviewed' : 'Pending'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDeleteConfirm(q.id)}
                      className="text-xs font-medium text-danger hover:underline"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => updateQuestion(q.id, 'reviewed', !q.reviewed)}
                      className={`text-xs px-2.5 py-1 rounded-md font-medium ${
                        q.reviewed
                          ? 'bg-elevated text-secondary hover:bg-card-hover'
                          : 'bg-success text-white hover:bg-success-hover'
                      }`}
                    >
                      {q.reviewed ? 'Unmark Reviewed' : 'Mark Reviewed'}
                    </button>
                  </div>
                </div>

                {/* Passage */}
                {q.passage && (
                  <div className="px-5 py-3 bg-card-hover border-b border-theme">
                    <p className="text-[10px] font-medium text-accent uppercase tracking-wider mb-1">Passage</p>
                    <p className="text-sm text-secondary leading-relaxed">{q.passage}</p>
                  </div>
                )}

                {/* Question Text */}
                <div className="px-5 py-4">
                  <p className="text-sm font-medium text-primary mb-3">{q.question_text}</p>
                  <div className="space-y-2">
                    {Object.entries(q.options).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-3">
                        <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-elevated flex items-center justify-center text-sm font-bold text-secondary">
                          {key}
                        </span>
                        <span className="text-sm text-primary">{value}</span>
                        {q.correct_option === key && (
                          <span className="ml-auto text-success text-sm font-medium">✓ Correct</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Explanation */}
                  {q.explanation && (
                    <div className="mt-4 p-3 bg-tint-info border border-info/50 rounded-lg">
                      <p className="text-[10px] font-medium text-info uppercase tracking-wider mb-1">Explanation</p>
                      <p className="text-xs text-secondary leading-relaxed">{q.explanation}</p>
                    </div>
                  )}
                </div>

                {/* Delete confirmation */}
                {deleteConfirm === q.id && (
                  <div className="bg-danger/10 border-t border-danger/50 p-4 flex items-center justify-between text-sm">
                    <p className="text-danger">Are you sure you want to delete this question?</p>
                    <div className="flex gap-2">
                      <button onClick={() => setDeleteConfirm(null)} className="text-secondary hover:underline">Cancel</button>
                      <button onClick={() => deleteQuestion(q.id)} className="text-danger font-medium hover:underline">Delete</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
