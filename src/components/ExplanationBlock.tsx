'use client';

interface ExplanationBlockProps {
  explanation: string | Record<string, any> | null | undefined;
  isCorrect?: boolean;
  showPointer?: boolean;
  compact?: boolean;
}

/**
 * Renders structured explanation (correct_answer_rationale, incorrect_option_analysis, wrong_answer_guidance)
 * or falls back to plain text. Use this everywhere instead of raw {q.explanation}.
 */
export default function ExplanationBlock({
  explanation,
  isCorrect,
  showPointer = true,
  compact = false,
}: ExplanationBlockProps) {
  if (!explanation) return null;

  if (typeof explanation === 'string') {
    // Try to parse as JSON first
    try {
      const parsed = JSON.parse(explanation);
      return (
        <StructuredExplanation
          exp={parsed}
          isCorrect={isCorrect}
          showPointer={showPointer}
          compact={compact}
        />
      );
    } catch {
      // Plain text fallback
      const cls = compact ? 'p-3' : 'p-5';
      return (
        <div className={`bg-card rounded-xl ${cls} border border-theme`}>
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Explanation</p>
          <p className="text-sm text-secondary leading-relaxed whitespace-pre-wrap">{explanation}</p>
        </div>
      );
    }
  }

  return (
    <StructuredExplanation
      exp={explanation}
      isCorrect={isCorrect}
      showPointer={showPointer}
      compact={compact}
    />
  );
}

function StructuredExplanation({
  exp,
  isCorrect,
  showPointer,
  compact,
}: {
  exp: Record<string, any>;
  isCorrect?: boolean;
  showPointer: boolean;
  compact: boolean;
}) {
  const pad = compact ? 'p-3' : 'p-4';
  const textCls = compact ? 'text-xs' : 'text-sm';

  return (
    <div className={`space-y-${compact ? '2' : '3'}`}>
      {/* Correct rationale */}
      {exp.correct_answer_rationale && (
        <div className={`bg-success/20 border border-success/50 rounded-xl ${pad}`}>
          <p className="text-[11px] font-semibold text-success uppercase tracking-wider mb-1">
            ✅ Why this is correct
          </p>
          <p className={`${textCls} text-secondary leading-relaxed`}>
            {exp.correct_answer_rationale}
          </p>
        </div>
      )}

      {/* Incorrect option analysis */}
      {exp.incorrect_option_analysis && (
        <div className={`bg-danger/20 border border-danger/50 rounded-xl ${pad}`}>
          <p className="text-[11px] font-semibold text-danger uppercase tracking-wider mb-2">
            ❌ Why others are wrong
          </p>
          {Object.entries(exp.incorrect_option_analysis as Record<string, string>).map(([opt, reason]) => (
            <p key={opt} className={`${textCls} text-secondary leading-relaxed mb-1.5 last:mb-0`}>
              <span className="font-mono font-bold text-secondary">{opt}:</span> {reason}
            </p>
          ))}
        </div>
      )}

      {/* Wrong answer guidance */}
      {showPointer && !isCorrect && exp.wrong_answer_guidance && (
        <div className={`bg-amber-900/30 border border-warning/50 rounded-xl ${pad}`}>
          <p className="text-[11px] font-semibold text-warning uppercase tracking-wider mb-1">
            💡 Pointer
          </p>
          <p className={`${textCls} text-secondary leading-relaxed`}>
            {exp.wrong_answer_guidance}
          </p>
        </div>
      )}
    </div>
  );
}
