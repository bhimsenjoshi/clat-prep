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

export default function AdminTestEditPage({ params }: PageProps) {
  const [test, setTest] = useState<Test | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [questionsBySection, setQuestionsBySection] = useState<Record<string, Question[]>>({});
  const [activeSection, setActiveSection] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [reviewAll, setReviewAll] = useState(false);
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
    if (existing.length >= 10) {
      alert('This section already has 10 questions. Delete some first.');
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
  };

  const handleMarkAllReviewed = async () => {
    const allQuestions = Object.values(questionsBySection).flat();
    const unreviewed = allQuestions.filter((q) => !q.reviewed);
    for (const q of unreviewed) {
      await supabase.from('questions').update({ reviewed: true }).eq('id', q.id);
    }
    // Update local state
    const updated: Record<string, Question[]> = {};
    for (const [secId, qs] of Object.entries(questionsBySection)) {
      updated[secId] = qs.map((q) => ({ ...q, reviewed: true }));
    }
    setQuestionsBySection(updated);
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (!test) return null;

  const activeQuestions = questionsBySection[activeSection] ?? [];
  const allQuestions = Object.values(questionsBySection).flat();
  const totalPending = allQuestions.filter((q) => !q.reviewed).length;
  const allReviewed = allQuestions.length > 0 && totalPending === 0;
  const displayQs = reviewAll ? allQuestions : activeQuestions;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{test.title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Status: <span className="font-medium capitalize">{test.status}</span>
          </p>
        </div>
        <Link href="/admin/tests" className="text-sm text-indigo-600 hover:underline">
          ← All Tests
        </Link>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        <button
          onClick={() => { setReviewAll(!reviewAll); setActiveSection(''); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
            reviewAll
              ? 'bg-green-100 text-green-800 border border-green-300'
              : 'bg-white border border-dashed border-gray-400 text-gray-600 hover:bg-gray-50'
          }`}
        >
          📋 Review All ({allQuestions.length}Q, {totalPending} pending)
        </button>
        {!reviewAll && sections.map((s) => {
          const count = (questionsBySection[s.id] ?? []).length;
          return (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                s.id === activeSection
                  ? 'bg-indigo-100 text-indigo-800'
                  : 'bg-white border text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s.name} ({count}/10)
            </button>
          );
        })}
      </div>

      {/* Actions bar */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {reviewAll
            ? `${allQuestions.length} total questions`
            : `${activeQuestions.length} of 10 questions`}
        </p>
        <div className="flex gap-2">
          {reviewAll && (
            <button
              onClick={handleMarkAllReviewed}
              disabled={allReviewed}
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition"
            >
              {allReviewed ? '✅ All Reviewed' : '✅ Mark All Reviewed'}
            </button>
          )}
          {!reviewAll && (
            <button
              onClick={handleGenerate}
              disabled={generating || activeQuestions.length >= 10}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition"
            >
              {generating ? 'Generating...' : '🪄 Generate with AI'}
            </button>
          )}
        </div>
      </div>

      {/* Question list */}
      <div className="space-y-4">
        {displayQs.length === 0 ? (
          <div className="bg-white border rounded-xl p-10 text-center text-gray-400">
            <p className="mb-3">No questions in this section yet.</p>
          </div>
        ) : displayQs.map((q, idx) => (
            <div key={q.id} className="bg-white border rounded-xl p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 bg-gray-100 rounded-full w-6 h-6 flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    q.reviewed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {q.reviewed ? 'Reviewed' : 'Pending'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateQuestion(q.id, 'reviewed', !q.reviewed)}
                    className={`text-xs px-2 py-1 rounded ${
                      q.reviewed ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'
                    }`}
                  >
                    {q.reviewed ? 'Mark Unreviewed' : 'Mark Reviewed'}
                  </button>
                  <button
                    onClick={() => deleteQuestion(q.id)}
                    className="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Editable question text */}
              <textarea
                value={q.question_text}
                onChange={(e) => updateQuestion(q.id, 'question_text', e.target.value)}
                className="w-full border rounded-lg p-2 text-sm mb-3 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-400"
                rows={2}
              />

              {/* Options */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                  <label
                    key={opt}
                    className={`flex items-center gap-2 border rounded-lg px-3 py-2 text-sm cursor-pointer ${
                      q.correct_option === opt
                        ? 'border-green-400 bg-green-50'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`correct_${q.id}`}
                      checked={q.correct_option === opt}
                      onChange={() => updateQuestion(q.id, 'correct_option', opt)}
                      className="accent-green-600"
                    />
                    <span className="font-semibold mr-1">{opt}.</span>
                    <input
                      type="text"
                      value={q.options[opt]}
                      onChange={(e) => {
                        const newOpts = { ...q.options, [opt]: e.target.value };
                        updateQuestion(q.id, 'options', JSON.stringify(newOpts));
                      }}
                      className="flex-1 bg-transparent focus:outline-none"
                    />
                  </label>
                ))}
              </div>

              {/* Explanation */}
              <textarea
                value={q.explanation ?? ''}
                onChange={(e) => updateQuestion(q.id, 'explanation', e.target.value)}
                placeholder="Explanation (optional)"
                className="w-full border rounded-lg p-2 text-xs text-gray-600 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-400"
                rows={2}
              />
            </div>
          ))
      )}
      </div>
    </div>
  );
}
