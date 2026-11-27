/**
 * Deterministic answer checking. The AI is never the judge of correctness
 * when a deterministic check is possible — it only explains the result.
 */
import type { Question } from './schema';
import { areEquivalent, evalSafe, ExprError, parseExpr } from './expr';
import { evaluateGoals, type ShapeState } from './geometry';

export type Answer =
  | { kind: 'choice'; selected: string[] }
  | { kind: 'numeric'; value: string }
  | { kind: 'expression'; value: string }
  | { kind: 'order'; order: number[] }
  | { kind: 'construction'; shapes: Record<string, ShapeState> };

export interface CheckResult {
  correct: boolean;
  /** 0–1 partial credit. */
  score: number;
  feedback: string;
  /** Misconceptions evidenced by this answer (from distractor tags). */
  misconceptions: string[];
  /** True when the input could not be interpreted (not counted as an attempt). */
  invalid?: boolean;
}

function parseNumber(raw: string): number {
  const s = raw.trim().replace(/,/g, '');
  if (s === '') return NaN;
  // Allow simple arithmetic like "2*pi" or "3/4" via the safe evaluator.
  return evalSafe(s);
}

export function checkAnswer(q: Question, a: Answer): CheckResult {
  switch (q.kind) {
    case 'choice': {
      if (a.kind !== 'choice' || a.selected.length === 0) return { correct: false, score: 0, feedback: 'Choose an option first.', misconceptions: [], invalid: true };
      const correctIds = new Set(q.options.filter((o) => o.correct).map((o) => o.id));
      const chosen = q.options.filter((o) => a.selected.includes(o.id));
      const misconceptions = chosen.filter((o) => !o.correct && o.misconception).map((o) => o.misconception!);
      const hits = chosen.filter((o) => correctIds.has(o.id)).length;
      const wrong = chosen.length - hits;
      const correct = hits === correctIds.size && wrong === 0;
      const score = q.multiple ? Math.max(0, (hits - wrong) / correctIds.size) : correct ? 1 : 0;
      const wrongChoice = chosen.find((o) => !o.correct);
      const feedback = correct
        ? chosen.find((o) => o.feedback)?.feedback ?? 'Correct!'
        : wrongChoice?.feedback ?? (q.multiple && hits > 0 ? 'Partly right — check your selection again.' : 'Not quite.');
      return { correct, score, feedback, misconceptions };
    }
    case 'numeric': {
      if (a.kind !== 'numeric') return { correct: false, score: 0, feedback: 'Enter a number.', misconceptions: [], invalid: true };
      const v = parseNumber(a.value);
      if (!Number.isFinite(v)) return { correct: false, score: 0, feedback: 'That doesn\'t look like a number.', misconceptions: [], invalid: true };
      const tol = Math.max(q.tolerance, 1e-9 * Math.max(1, Math.abs(q.answer)));
      const correct = Math.abs(v - q.answer) <= tol;
      let feedback = correct ? 'Correct!' : 'Not quite.';
      if (!correct && q.answer !== 0) {
        const ratio = v / q.answer;
        if (Math.abs(ratio + 1) < 0.01) feedback = 'Check the sign of your answer.';
        else if ([10, 100, 1000, 0.1, 0.01, 0.001].some((r) => Math.abs(ratio - r) < r * 0.01)) feedback = 'Right digits, wrong magnitude — check your units or decimal point.';
      }
      return { correct, score: correct ? 1 : 0, feedback, misconceptions: [] };
    }
    case 'expression': {
      if (a.kind !== 'expression' || !a.value.trim()) return { correct: false, score: 0, feedback: 'Enter an expression.', misconceptions: [], invalid: true };
      try { parseExpr(a.value, q.variables); } catch (e) {
        return { correct: false, score: 0, feedback: e instanceof ExprError ? `Couldn't read that: ${e.message}` : 'Couldn\'t read that expression.', misconceptions: [], invalid: true };
      }
      const correct = areEquivalent(a.value, q.answer, { variables: q.variables });
      return { correct, score: correct ? 1 : 0, feedback: correct ? 'Correct — your expression is equivalent.' : 'Not equivalent to the expected expression.', misconceptions: [] };
    }
    case 'order': {
      if (a.kind !== 'order') return { correct: false, score: 0, feedback: 'Arrange the items.', misconceptions: [], invalid: true };
      const n = q.correctOrder.length;
      let inPlace = 0;
      for (let i = 0; i < n; i++) if (a.order[i] === q.correctOrder[i]) inPlace++;
      const correct = inPlace === n && a.order.length === n;
      return { correct, score: inPlace / n, feedback: correct ? 'Correct order!' : `${inPlace} of ${n} in the right place.`, misconceptions: [] };
    }
    case 'construction': {
      if (a.kind !== 'construction') return { correct: false, score: 0, feedback: 'Build your shape first.', misconceptions: [], invalid: true };
      const r = evaluateGoals(q.goals, a.shapes);
      const metCount = r.results.filter((x) => x.met).length;
      return {
        correct: r.met,
        score: metCount / r.results.length,
        feedback: r.met ? q.successFeedback ?? 'That works!' : r.results.find((x) => !x.met)!.message,
        misconceptions: [],
      };
    }
  }
}

/**
 * Credit for mastery purposes. Using hints is fine — it's how people learn —
 * but an answer reached after every hint is weaker evidence of independent mastery.
 */
export function evidenceWeight(hintsUsed: number, totalHints: number, attempt: number): number {
  const hintPenalty = totalHints > 0 ? 0.5 * (hintsUsed / totalHints) : 0;
  const attemptPenalty = Math.min(0.3, 0.15 * (attempt - 1));
  return Math.max(0.2, 1 - hintPenalty - attemptPenalty);
}
