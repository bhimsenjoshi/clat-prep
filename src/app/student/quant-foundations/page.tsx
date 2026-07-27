'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { persistSessionToCookie } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import ExplanationBlock from '@/components/ExplanationBlock';

const SUBSECTIONS = [
  { id: 'Percentages', label: 'Percentages', icon: '💯', color: 'blue', desc: 'Grids, pie charts, and mental % calculations' },
  { id: 'Ratios & Proportions', label: 'Ratios & Proportions', icon: '📐', color: 'purple', desc: 'Tape diagrams, scaling, and visual ratios' },
  { id: 'Fractions & Decimals', label: 'Fractions & Decimals', icon: '🔢', color: 'emerald', desc: 'Number lines, area models, and visual fractions' },
  { id: 'Data Basics', label: 'Data Basics', icon: '📊', color: 'amber', desc: 'Charts, trends, and visual data interpretation' },
] as const;

const SUBSECTION_ICONS: Record<string, string> = {
  'Percentages': '💯',
  'Ratios & Proportions': '📐',
  'Fractions & Decimals': '🔢',
  'Data Basics': '📊',
};

// ─── SVG Visual Models ───
function VisualModel({ type }: { type: string }) {
  const baseClass = "w-full max-w-xs mx-auto bg-card rounded-xl p-4 border border-theme";

  switch (type) {
    case 'grid':
      return (
        <div className={baseClass}>
          <svg viewBox="0 0 200 200" className="w-full" fill="none">
            <rect x="0" y="0" width="200" height="200" fill="#1e293b" rx="4" />
            {/* 10×10 grid with ~43% shaded */}
            {Array.from({ length: 100 }).map((_, i) => {
              const row = Math.floor(i / 10);
              const col = i % 10;
              const shaded = i < 43;
              return (
                <rect
                  key={i}
                  x={col * 20 + 1} y={row * 20 + 1}
                  width={18} height={18}
                  rx={2}
                  fill={shaded ? '#6366f1' : '#334155'}
                  stroke={shaded ? '#818cf8' : '#475569'}
                  strokeWidth="0.5"
                />
              );
            })}
          </svg>
          <p className="text-[10px] text-center text-muted mt-2">10×10 Grid · Shaded cells = %</p>
        </div>
      );

    case 'pie_chart':
      return (
        <div className={baseClass}>
          <svg viewBox="0 0 200 200" className="w-full">
            {/* Pie with 4 segments, 3 shaded */}
            <circle cx="100" cy="100" r="85" fill="#1e293b" />
            <path d="M100,100 L100,15 A85,85 0 0,1 185,100 Z" fill="#6366f1" stroke="#818cf8" strokeWidth="1" />
            <path d="M100,100 L185,100 A85,85 0 0,1 100,185 Z" fill="#6366f1" stroke="#818cf8" strokeWidth="1" />
            <path d="M100,100 L100,185 A85,85 0 0,1 15,100 Z" fill="#6366f1" stroke="#818cf8" strokeWidth="1" />
            <path d="M100,100 L15,100 A85,85 0 0,1 100,15 Z" fill="#334155" stroke="#475569" strokeWidth="1" />
            <circle cx="100" cy="100" r="15" fill="#1e293b" stroke="#475569" strokeWidth="1" />
          </svg>
          <p className="text-[10px] text-center text-muted mt-2">3 of 4 quarters shaded = 75%</p>
        </div>
      );

    case 'bar_diagram':
      return (
        <div className={baseClass}>
          <svg viewBox="0 0 200 160" className="w-full" fill="none">
            {/* Axis */}
            <line x1="30" y1="10" x2="30" y2="130" stroke="#475569" strokeWidth="1.5" />
            <line x1="30" y1="130" x2="190" y2="130" stroke="#475569" strokeWidth="1.5" />
            {/* 3 bars: heights 64, 40, 56 out of max 130px */}
            <rect x="45" y="66" width="35" height="64" rx="3" fill="#6366f1" stroke="#818cf8" strokeWidth="1" />
            <rect x="100" y="90" width="35" height="40" rx="3" fill="#a855f7" stroke="#c084fc" strokeWidth="1" />
            <rect x="155" y="74" width="35" height="56" rx="3" fill="#3b82f6" stroke="#60a5fa" strokeWidth="1" />
            {/* Labels */}
            <text x="62" y="148" textAnchor="middle" fill="#94a3b8" fontSize="10">A</text>
            <text x="117" y="148" textAnchor="middle" fill="#94a3b8" fontSize="10">B</text>
            <text x="172" y="148" textAnchor="middle" fill="#94a3b8" fontSize="10">C</text>
          </svg>
          <p className="text-[10px] text-center text-muted mt-2">Compare bar heights visually</p>
        </div>
      );

    case 'tape_diagram':
      return (
        <div className={baseClass}>
          <svg viewBox="0 0 220 100" className="w-full" fill="none">
            {/* Tape A — 5 parts */}
            <text x="5" y="20" fill="#94a3b8" fontSize="10">A</text>
            {[0,1,2,3,4].map(i => (
              <rect key={i} x={20 + i*36} y="10" width="34" height="18" rx="2"
                fill={i < 3 ? '#6366f1' : '#334155'} stroke="#818cf8" strokeWidth="0.8" />
            ))}
            {/* Tape B — 3 parts */}
            <text x="5" y="58" fill="#94a3b8" fontSize="10">B</text>
            {[0,1,2].map(i => (
              <rect key={i} x={20 + i*36} y="48" width="34" height="18" rx="2"
                fill="#a855f7" stroke="#c084fc" strokeWidth="0.8" />
            ))}
          </svg>
          <p className="text-[10px] text-center text-muted mt-2">Equal blocks · find one block first</p>
        </div>
      );

    case 'number_line':
      return (
        <div className={baseClass}>
          <svg viewBox="0 0 220 50" className="w-full" fill="none">
            {/* Number line 0 to 1 with 4 segments */}
            <line x1="20" y1="25" x2="200" y2="25" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
            {/* Tick marks */}
            {[0,1,2,3,4].map(i => (
              <line key={i} x1={20 + i*45} y1="19" x2={20 + i*45} y2="31" stroke="#64748b" strokeWidth="1.5" />
            ))}
            {/* Labels */}
            <text x="20" y="44" textAnchor="middle" fill="#94a3b8" fontSize="10">0</text>
            <text x="65" y="44" textAnchor="middle" fill="#94a3b8" fontSize="10">¼</text>
            <text x="110" y="44" textAnchor="middle" fill="#94a3b8" fontSize="10">½</text>
            <text x="155" y="44" textAnchor="middle" fill="#94a3b8" fontSize="10">¾</text>
            <text x="200" y="44" textAnchor="middle" fill="#94a3b8" fontSize="10">1</text>
            {/* Dot at ¾ */}
            <circle cx="155" cy="25" r="5" fill="#6366f1" stroke="#818cf8" strokeWidth="1.5" />
          </svg>
          <p className="text-[10px] text-center text-muted mt-2">Position on the number line</p>
        </div>
      );

    default:
      return null;
  }
}

interface QuestionData {
  id: string;
  subsection: string;
  topic: string;
  question_text: string;
  passage: string | null;
  options: Record<string, string>;
  difficulty: string;
  explanation: string | null;
  visual_type: string;
  tags: string[];
}

interface AnswerResult {
  is_correct: boolean;
  correct_option: string;
  explanation: string | Record<string, any>;
  your_answer: string;
}

type Phase = 'select' | 'answering' | 'result' | 'complete';

export default function QuantFoundationsPage() {
  const router = useRouter();
  const supabase = createClient();
  const questionStartRef = useRef<number>(Date.now());

  const [phase, setPhase] = useState<Phase>('select');
  const [selectedSubsection, setSelectedSubsection] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [answering, setAnswering] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [stats, setStats] = useState({ correct: 0, total: 0 });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [passageExpanded, setPassageExpanded] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const currentQuestion = questions[currentIndex];
  const safeOptions = currentQuestion
    ? (typeof currentQuestion.options === 'string' ? JSON.parse(currentQuestion.options) : currentQuestion.options)
    : {};

  // Timer tick
  useEffect(() => {
    if (phase !== 'answering') return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - questionStartRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  const startSession = async (subsection: string) => {
    setLoading(true);
    setErrorMsg(null);
    setSelectedSubsection(subsection);
    try {
      await persistSessionToCookie(supabase);

      const res = await fetch('/api/quant-foundations/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subsection }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to start session');
        setLoading(false);
        return;
      }

      setSessionId(data.session_id);
      setQuestions(data.questions);
      setCurrentIndex(0);
      setSelected(null);
      setResult(null);
      setShowExplanation(false);
      setStats({ correct: 0, total: 0 });
      setPhase('answering');
      questionStartRef.current = Date.now();
      setElapsedSeconds(0);
    } catch (e) {
      setErrorMsg('Network error. Please try again.');
    }
    setLoading(false);
  };

  const submitAnswer = async () => {
    if (!selected || !sessionId || !currentQuestion || answering) return;
    setAnswering(true);

    const timeTaken = Math.floor((Date.now() - questionStartRef.current) / 1000);

    try {
      await persistSessionToCookie(supabase);

      const res = await fetch('/api/quant-foundations/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          question_id: currentQuestion.id,
          selected_option: selected,
          time_taken_seconds: Math.max(1, timeTaken),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to submit');
        setAnswering(false);
        return;
      }

      setResult({
        is_correct: data.is_correct,
        correct_option: data.correct_option,
        explanation: data.explanation,
        your_answer: selected,
      });
      setStats(prev => ({
        correct: prev.correct + (data.is_correct ? 1 : 0),
        total: prev.total + 1,
      }));
      setPhase('result');
    } catch {
      setErrorMsg('Network error');
    }
    setAnswering(false);
  };

  const nextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
      setSelected(null);
      setResult(null);
      setShowExplanation(false);
      setPhase('answering');
      questionStartRef.current = Date.now();
      setElapsedSeconds(0);
      setPassageExpanded(true);
    } else {
      setPhase('complete');
    }
  };

  const formatTime = (s: number) => {
    if (s >= 60) return `${Math.floor(s / 60)}m ${s % 60}s`;
    return `${s}s`;
  };

  const backToSelect = () => {
    setPhase('select');
    setSelectedSubsection(null);
    setSessionId(null);
    setQuestions([]);
    setCurrentIndex(0);
    setErrorMsg(null);
  };

  const restartSame = () => {
    if (selectedSubsection) startSession(selectedSubsection);
  };

  // ─── Phase: Select subsection ───
  if (phase === 'select') {
    return (
      <div className="min-h-screen bg-page">
        <PageHeader title="Quant Foundations" navItems={[
          { href: '/student/dashboard', label: 'Dashboard', icon: '🏛️' },
          { href: '/student/analytics?tab=quant_foundations', label: 'Analytics', icon: '📊' },
        ]} />
        <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          <div className="text-center mb-2">
            <h1 className="text-2xl font-bold text-primary">🧮 Quant Foundations</h1>
            <p className="text-sm text-secondary mt-1">
              Build your visualization skills — picture the math before you solve it
            </p>
          </div>

          {errorMsg && (
            <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 text-sm text-danger">{errorMsg}</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SUBSECTIONS.map(sub => (
              <button
                key={sub.id}
                onClick={() => startSession(sub.id)}
                disabled={loading}
                className="bg-card border border-theme rounded-xl p-5 text-left hover:bg-elevated hover:border-accent/30 transition-all shadow-theme-sm active:scale-[0.98] disabled:opacity-50"
              >
                <div className="text-3xl mb-2">{sub.icon}</div>
                <h3 className="font-semibold text-primary text-base">{sub.label}</h3>
                <p className="text-xs text-secondary mt-1 leading-relaxed">{sub.desc}</p>
              </button>
            ))}
          </div>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-accent border-t-transparent rounded-full" />
              <span className="ml-3 text-sm text-secondary">Loading questions...</span>
            </div>
          )}
        </main>
      </div>
    );
  }

  // ─── Phase: Complete ───
  if (phase === 'complete') {
    const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
    return (
      <div className="min-h-screen bg-page">
        <PageHeader title="Session Complete" />
        <main className="max-w-lg mx-auto px-4 py-12">
          <div className="bg-card border border-theme rounded-2xl shadow-theme-lg p-8 text-center">
            <div className="text-5xl mb-4">{pct >= 70 ? '🎉' : pct >= 40 ? '💪' : '📚'}</div>
            <h2 className="text-2xl font-bold text-primary mb-2">Session Complete!</h2>
            <p className="text-sm text-secondary mb-6">{SUBSECTION_ICONS[selectedSubsection!] || '📐'} {selectedSubsection}</p>

            <div className="flex justify-center gap-8 mb-6">
              <div>
                <p className="text-3xl font-bold text-accent">{stats.correct}/{stats.total}</p>
                <p className="text-xs text-secondary mt-1">Correct</p>
              </div>
              <div>
                <p className={`text-3xl font-bold ${pct >= 70 ? 'text-success' : pct >= 40 ? 'text-warning' : 'text-danger'}`}>{pct}%</p>
                <p className="text-xs text-secondary mt-1">Accuracy</p>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <button onClick={restartSame} className="px-6 py-3 rounded-xl font-medium bg-accent text-white hover:bg-accent-hover transition shadow-sm">
                🔄 Practice Again
              </button>
              <button onClick={backToSelect} className="px-6 py-3 rounded-xl font-medium bg-card border border-theme text-secondary hover:bg-elevated transition">
                📂 Choose Topic
              </button>
              <Link href="/student/analytics?tab=quant_foundations" className="px-6 py-3 rounded-xl font-medium bg-card border border-theme text-accent hover:bg-elevated transition">
                📊 See Progress
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ─── Phase: Answering / Result ───
  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto" />
          <p className="text-sm text-secondary mt-3">Loading question...</p>
        </div>
      </div>
    );
  }

  const isResult = phase === 'result';
  const isCorrect = result?.is_correct === true;
  const isWrong = result?.is_correct === false;

  const getVisualBadge = (vt: string) => {
    const badges: Record<string, string> = {
      'pie_chart': '🥧',
      'bar_diagram': '📊',
      'tape_diagram': '📏',
      'grid': '🔲',
      'number_line': '📈',
      'none': '',
    };
    return badges[vt] || '';
  };

  return (
    <div className="min-h-screen bg-page">
      <PageHeader title="Quant Foundations" />

      {/* Progress bar */}
      <div className="bg-card border-b border-theme">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between text-xs text-secondary mb-1.5">
            <span>{SUBSECTION_ICONS[selectedSubsection!]} {selectedSubsection}</span>
            <span>Q{currentIndex + 1}/{questions.length} · ✅ {stats.correct}/{stats.total}</span>
          </div>
          <div className="w-full bg-elevated rounded-full h-1.5">
            <div className="h-1.5 rounded-full bg-accent transition-all" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Timer */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {getVisualBadge(currentQuestion.visual_type) && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                {getVisualBadge(currentQuestion.visual_type)} {currentQuestion.visual_type.replace('_', ' ')}
              </span>
            )}
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              currentQuestion.difficulty === 'easy' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
            }`}>{currentQuestion.difficulty}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted">
            <span>⏱</span>
            <span className="font-mono">{formatTime(elapsedSeconds)}</span>
          </div>
        </div>

        {/* Error */}
        {errorMsg && (
          <div className="bg-danger/10 border border-danger/30 rounded-xl p-3 text-sm text-danger mb-4">{errorMsg}</div>
        )}

        {/* Visual passage */}
        {currentQuestion.passage && (
          <div className="bg-card-hover border border-theme rounded-xl mb-4 overflow-hidden">
            <button
              onClick={() => setPassageExpanded(!passageExpanded)}
              className="w-full px-5 py-3 flex items-center justify-between text-xs font-medium text-accent uppercase tracking-wider"
            >
              <span>🧠 Visualize this</span>
              <span className="transition-transform" style={{ transform: passageExpanded ? 'rotate(180deg)' : '' }}>▼</span>
            </button>
            {passageExpanded && (
              <div className="px-5 pb-4">
                <p className="text-sm text-secondary leading-relaxed mb-4">{currentQuestion.passage}</p>
                {/* SVG Visualization based on visual_type */}
                <VisualModel type={currentQuestion.visual_type} />
              </div>
            )}
          </div>
        )}

        {/* Question */}
        <div className="bg-card border border-theme rounded-xl shadow-theme-sm p-5 mb-4">
          <p className="text-sm font-medium text-primary leading-relaxed">{currentQuestion.question_text}</p>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 gap-3 mb-6">
          {Object.entries(safeOptions).map(([key, value]) => {
            const optValue = value as string;
            let borderColor = 'border-theme bg-card';
            let textColor = 'text-primary';
            let ring = '';
            let icon = key;

            if (isResult) {
              if (key === result?.correct_option) {
                borderColor = 'border-success bg-success/10';
                textColor = 'text-success font-medium';
                ring = 'ring-1 ring-success/50';
                icon = '✓ ' + key;
              } else if (key === selected && !isCorrect) {
                borderColor = 'border-danger bg-danger/10';
                textColor = 'text-danger';
                ring = 'ring-1 ring-danger/50';
                icon = '✗ ' + key;
              } else {
                borderColor = 'border-theme bg-card opacity-50';
                textColor = 'text-muted';
                icon = key;
              }
            } else {
              if (key === selected) {
                borderColor = 'border-accent bg-accent/5';
                textColor = 'text-accent font-medium';
                ring = 'ring-1 ring-accent/50';
              }
            }

            return (
              <button
                key={key}
                onClick={() => !isResult && setSelected(key)}
                disabled={isResult}
                className={`flex items-center gap-3 border rounded-xl px-4 py-3 text-sm transition ${borderColor} ${ring} ${isResult || isResult ? '' : 'hover:bg-elevated hover:border-accent/30'} ${isResult ? '' : 'cursor-pointer'}`}
              >
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  isResult && key === result?.correct_option ? 'bg-success text-white' :
                  isResult && key === selected && !isCorrect ? 'bg-danger text-white' :
                  key === selected ? 'bg-accent text-white' : 'bg-elevated text-secondary'
                }`}>{icon}</span>
                <span className={`flex-1 text-left ${textColor}`}>{optValue}</span>
              </button>
            );
          })}
        </div>

        {/* Submit button */}
        {!isResult && (
          <button
            onClick={submitAnswer}
            disabled={!selected || answering}
            className="w-full py-3.5 rounded-xl text-sm font-semibold bg-gradient-accent text-white hover:bg-accent-hover transition disabled:opacity-40 disabled:cursor-not-allowed shadow-theme-sm"
          >
            {answering ? 'Submitting...' : selected ? 'Check Answer ✓' : 'Select an option first'}
          </button>
        )}

        {/* Result & explanation */}
        {isResult && (
          <div className="space-y-4 mt-4">
            <div className={`rounded-xl p-4 border ${
              isCorrect ? 'bg-success/10 border-success/50' : 'bg-danger/10 border-danger/50'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{isCorrect ? '✅' : '❌'}</span>
                <span className={`font-semibold text-sm ${isCorrect ? 'text-success' : 'text-danger'}`}>
                  {isCorrect ? 'Correct!' : 'Incorrect'}
                </span>
                <span className="text-[10px] text-muted ml-auto">⏱ {formatTime(elapsedSeconds)}</span>
              </div>
              <ExplanationBlock explanation={result?.explanation} compact />
            </div>

            <div className="flex justify-between gap-3">
              <button
                onClick={() => setShowExplanation(!showExplanation)}
                className="px-5 py-2.5 rounded-xl text-xs font-medium bg-card border border-theme text-secondary hover:bg-elevated transition"
              >
                {showExplanation ? '🙈 Hide Tips' : '💡 Visual Tip'}
              </button>
              <button
                onClick={nextQuestion}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gradient-accent text-white hover:bg-accent-hover transition shadow-sm"
              >
                {currentIndex + 1 < questions.length ? 'Next Question →' : '📊 See Results'}
              </button>
            </div>
          </div>
        )}

        {/* Back navigation */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-theme">
          <button onClick={backToSelect} className="text-xs text-secondary hover:text-primary transition flex items-center gap-1">
            ← Back to topics
          </button>
          <Link href="/student/analytics?tab=quant_foundations" className="text-xs text-accent hover:text-accent/80 transition">
            📊 Analytics
          </Link>
        </div>
      </main>
    </div>
  );
}
