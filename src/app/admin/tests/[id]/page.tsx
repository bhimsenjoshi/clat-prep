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

// CLAT 2027 question targets per section
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

    try {
      const res = await fetch('/api/generate-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId: activeSection,
          sectionName: currentSection.name,
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-pulse flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Loading editor...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50/30">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/tests" className="text-gray-400 hover:text-gray-600 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{test.title}</h1>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                test.status === 'published' ? 'bg-green-100 text-green-700' :
                test.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {test.status}
              </span>
            </div>
          </div>
          <div className="text-right text-sm text-gray-500">
            <span className="font-semibold text-indigo-600">{allQuestions.length}</span>
            <span className="mx-1">/</span>
            <span>{totalQuestionsTarget}</span>
            <span className="ml-1">questions</span>
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
                className={`relative overflow-hidden rounded-xl p-3 text-left transition-all duration-200 ${
                  isActive
                    ? 'bg-white shadow-md ring-2 ring-indigo-500 scale-[1.02]'
                    : 'bg-white/80 hover:bg-white hover:shadow-sm border border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-lg">{s.target.icon}</span>
                  {isFull && <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">✓ Full</span>}
                </div>
                <p className="text-xs font-semibold text-gray-800 leading-tight mb-1">{s.name}</p>
                <p className="text-sm font-bold">
                  <span className={isFull ? 'text-green-600' : 'text-indigo-600'}>{s.count}</span>
                  <span className="text-gray-400 text-xs font-normal">/{s.target.label}</span>
                </p>
                {/* Progress bar */}
                <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isFull ? 'bg-green-500' : 'bg-indigo-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Actions bar */}
        <div className="bg-white rounded-xl border shadow-sm p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!reviewAll && activeTarget && (
              <span className="text-sm text-gray-500">
                <span className="font-semibold text-gray-800">{activeQuestions.length}</span>
                <span className="mx-1">of</span>
                <span className="font-medium text-indigo-600">{activeTarget.label}</span>
                <span className="ml-2 text-gray-400">questions</span>
              </span>
            )}
            {reviewAll && (
              <span className="text-sm text-gray-500">
                <span className="font-semibold text-gray-800">{allQuestions.length}</span>
                <span className="mx-1">total</span>
                <span className="text-yellow-600 ml-2">{totalPending} pending review</span>
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setReviewAll(!reviewAll); setActiveSection(''); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                reviewAll
                  ? 'bg-green-100 text-green-800 ring-1 ring-green-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 ring-1 ring-gray-200'
              }`}
            >
              📋 All Sections
            </button>
            {reviewAll && (
              <button
                onClick={handleMarkAllReviewed}
                disabled={allReviewed}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {allReviewed ? '✅ All Done' : '✅ Mark All Reviewed'}
              </button>
            )}
            {!reviewAll && (
              <button
                onClick={handleGenerate}
                disabled={generating || activeQuestions.length >= (activeTarget?.max ?? 10)}
                className="px-4 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
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
          </div>
        </div>

        {/* Question list */}
        <div className="space-y-3">
          {displayQs.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-gray-500 font-medium mb-1">
                {reviewAll ? 'No questions yet' : 'No questions in this section'}
              </p>
              <p className="text-gray-400 text-sm mb-4">
                {reviewAll
                  ? 'Generate questions for each section using the tabs above.'
                  : `Click "Generate with AI" to create ${activeTarget?.label ?? '10'} CLAT-style questions.`}
              </p>
              {!reviewAll && (
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 disabled:opacity-40 transition shadow-sm"
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
              <div key={q.id} className="bg-white border rounded-xl shadow-sm hover:shadow transition-shadow overflow-hidden">
                {/* Question header */}
                <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 bg-white border rounded-full w-6 h-6 flex items-center justify-center">
                      {idx + 1}
                    </span>
                    {reviewAll && section && (
                      <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                        {section.name}
                      </span>
                    )}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      q.reviewed
                        ? 'bg-green-50 text-green-700 ring-1 ring-green-200'
                        : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                    }`}>
                      {q.reviewed ? 'Reviewed' : 'Pending'}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      q.difficulty === 'hard' ? 'bg-red-50 text-red-600' :
                      q.difficulty === 'easy' ? 'bg-green-50 text-green-600' :
                      'bg-blue-50 text-blue-600'
                    }`}>
                      {q.difficulty || 'medium'}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => updateQuestion(q.id, 'reviewed', !q.reviewed)}
                      className={`text-[11px] px-2.5 py-1 rounded-md font-medium transition ${
                        q.reviewed
                          ? 'text-amber-600 hover:bg-amber-50'
                          : 'text-green-600 hover:bg-green-50'
                      }`}>
                      {q.reviewed ? '↩ Unreview' : '✓ Review'}
                    </button>
                    {deleteConfirm === q.id ? (
                      <div className="flex gap-1">
                        <button onClick={() => deleteQuestion(q.id)}
                          className="text-[11px] px-2.5 py-1 rounded-md font-medium bg-red-600 text-white hover:bg-red-700 transition">
                          Confirm
                        </button>
                        <button onClick={() => setDeleteConfirm(null)}
                          className="text-[11px] px-2.5 py-1 rounded-md font-medium bg-gray-200 text-gray-600 hover:bg-gray-300 transition">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(q.id)}
                        className="text-[11px] px-2.5 py-1 rounded-md font-medium text-red-500 hover:bg-red-50 transition">
                        🗑 Delete
                      </button>
                    )}
                  </div>
                </div>

                {/* Passage area */}
                {q.passage && (
                  <div className="px-5 py-3 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 border-b">
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-indigo-400 mt-0.5">📄</span>
                      <div>
                        <p className="text-[11px] font-medium text-indigo-500 mb-1 uppercase tracking-wider">Passage</p>
                        <textarea value={q.passage}
                          onChange={(e) => updateQuestion(q.id, 'passage', e.target.value)}
                          className="w-full bg-transparent text-xs text-gray-600 leading-relaxed resize-none focus:outline-none focus:ring-0"
                          rows={2} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Question body */}
                <div className="px-5 py-3">
                  <textarea value={q.question_text}
                    onChange={(e) => updateQuestion(q.id, 'question_text', e.target.value)}
                    className="w-full text-sm font-medium text-gray-800 bg-transparent resize-none focus:outline-none focus:ring-0 mb-3"
                    rows={2} />

                  {/* Options */}
                  <div className="grid grid-cols-2 gap-2">
                    {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                      <label key={opt}
                        className={`flex items-center gap-2 border rounded-lg px-3 py-2 text-sm cursor-pointer transition ${
                          q.correct_option === opt
                            ? 'border-green-400 bg-green-50 ring-1 ring-green-300'
                            : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                        }`}>
                        <input type="radio" name={`correct_${q.id}`} checked={q.correct_option === opt}
                          onChange={() => updateQuestion(q.id, 'correct_option', opt)}
                          className="accent-green-600 w-3.5 h-3.5" />
                        <span className={`font-bold text-xs mr-1 ${
                          q.correct_option === opt ? 'text-green-700' : 'text-gray-400'
                        }`}>
                          {opt}.
                        </span>
                        <input type="text" value={q.options[opt]}
                          onChange={(e) => {
                            const newOpts = { ...q.options, [opt]: e.target.value };
                            updateQuestion(q.id, 'options', JSON.stringify(newOpts));
                          }}
                          className={`flex-1 bg-transparent text-sm focus:outline-none ${
                            q.correct_option === opt ? 'text-green-800 font-medium' : 'text-gray-700'
                          }`} />
                        {q.correct_option === opt && (
                          <span className="text-[10px] font-bold text-green-600">✓</span>
                        )}
                      </label>
                    ))}
                  </div>

                  {/* Explanation */}
                  <div className="mt-3">
                    <p className="text-[10px] font-medium text-gray-400 mb-1 uppercase tracking-wider">Explanation</p>
                    <textarea value={q.explanation ?? ''}
                      onChange={(e) => updateQuestion(q.id, 'explanation', e.target.value)}
                      placeholder="Add explanation..."
                      className="w-full border border-dashed border-gray-200 rounded-lg p-2 text-xs text-gray-500 bg-gray-50/50 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-300 focus:border-indigo-300 transition"
                      rows={2} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
