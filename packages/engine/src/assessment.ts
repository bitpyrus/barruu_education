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

/**
 * Feedback is returned twice: as English `feedback` (fallback, logs, tutor) and as
 * a language-neutral `message` that UIs localize: `{ code, params }`. Code
 * `custom` means the text came from the course author (already translated via
 * content overlays) and should be shown as-is.
 */
export type FeedbackCode =
  | 'custom'
  | 'correct'
  | 'choice.empty' | 'choice.partial' | 'choice.incorrect'
  | 'numeric.empty' | 'numeric.unreadable' | 'numeric.sign' | 'numeric.magnitude' | 'numeric.incorrect'
  | 'expression.empty' | 'expression.unreadable' | 'expression.equivalent' | 'expression.notEquivalent'
  | 'order.empty' | 'order.correct' | 'order.partial'
  | 'construction.empty' | 'construction.correct'
  | 'goal.degenerate' | 'goal.metric';

export type MessageParams = Record<string, string | number>;

export interface FeedbackMessage { code: FeedbackCode; params: MessageParams; text: string }

export interface CheckResult {
  correct: boolean;
  /** 0–1 partial credit. */
  score: number;
  /** English feedback (fallback). Prefer `message` in UIs. */
  feedback: string;
  /** Localizable feedback. */
  message: FeedbackMessage;
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

const msg = (code: FeedbackCode, text: string, params: MessageParams = {}): FeedbackMessage => ({ code, params, text });
const custom = (text: string): FeedbackMessage => msg('custom', text);

function result(correct: boolean, score: number, message: FeedbackMessage, misconceptions: string[] = [], invalid?: boolean): CheckResult {
  return { correct, score, feedback: message.text, message, misconceptions, ...(invalid ? { invalid } : {}) };
}

export function checkAnswer(q: Question, a: Answer): CheckResult {
  switch (q.kind) {
    case 'choice': {
      if (a.kind !== 'choice' || a.selected.length === 0) return result(false, 0, msg('choice.empty', 'Choose an option first.'), [], true);
      const correctIds = new Set(q.options.filter((o) => o.correct).map((o) => o.id));
      const chosen = q.options.filter((o) => a.selected.includes(o.id));
      const misconceptions = chosen.filter((o) => !o.correct && o.misconception).map((o) => o.misconception!);
      const hits = chosen.filter((o) => correctIds.has(o.id)).length;
      const wrong = chosen.length - hits;
      const correct = hits === correctIds.size && wrong === 0;
      const score = q.multiple ? Math.max(0, (hits - wrong) / correctIds.size) : correct ? 1 : 0;
      if (correct) {
        const fb = chosen.find((o) => o.feedback)?.feedback;
        return result(true, score, fb ? custom(fb) : msg('correct', 'Correct!'), misconceptions);
      }
      const wrongChoice = chosen.find((o) => !o.correct);
      if (wrongChoice?.feedback) return result(false, score, custom(wrongChoice.feedback), misconceptions);
      return result(false, score, q.multiple && hits > 0 ? msg('choice.partial', 'Partly right — check your selection again.') : msg('choice.incorrect', 'Not quite.'), misconceptions);
    }
    case 'numeric': {
      if (a.kind !== 'numeric' || !a.value.trim()) return result(false, 0, msg('numeric.empty', 'Enter a number.'), [], true);
      const v = parseNumber(a.value);
      if (!Number.isFinite(v)) return result(false, 0, msg('numeric.unreadable', 'That doesn\'t look like a number.'), [], true);
      const tol = Math.max(q.tolerance, 1e-9 * Math.max(1, Math.abs(q.answer)));
      if (Math.abs(v - q.answer) <= tol) return result(true, 1, msg('correct', 'Correct!'));
      if (q.answer !== 0) {
        const ratio = v / q.answer;
        if (Math.abs(ratio + 1) < 0.01) return result(false, 0, msg('numeric.sign', 'Check the sign of your answer.'));
        if ([10, 100, 1000, 0.1, 0.01, 0.001].some((r) => Math.abs(ratio - r) < r * 0.01)) {
          return result(false, 0, msg('numeric.magnitude', 'Right digits, wrong magnitude — check your units or decimal point.'));
        }
      }
      return result(false, 0, msg('numeric.incorrect', 'Not quite.'));
    }
    case 'expression': {
      if (a.kind !== 'expression' || !a.value.trim()) return result(false, 0, msg('expression.empty', 'Enter an expression.'), [], true);
      try { parseExpr(a.value, q.variables); } catch (e) {
        const detail = e instanceof ExprError ? e.message : '';
        return result(false, 0, msg('expression.unreadable', detail ? `Couldn't read that: ${detail}` : 'Couldn\'t read that expression.', { detail }), [], true);
      }
      const correct = areEquivalent(a.value, q.answer, { variables: q.variables });
      return result(correct, correct ? 1 : 0, correct
        ? msg('expression.equivalent', 'Correct — your expression is equivalent.')
        : msg('expression.notEquivalent', 'Not equivalent to the expected expression.'));
    }
    case 'order': {
      if (a.kind !== 'order') return result(false, 0, msg('order.empty', 'Arrange the items.'), [], true);
      const n = q.correctOrder.length;
      let inPlace = 0;
      for (let i = 0; i < n; i++) if (a.order[i] === q.correctOrder[i]) inPlace++;
      const correct = inPlace === n && a.order.length === n;
      return result(correct, inPlace / n, correct ? msg('order.correct', 'Correct order!') : msg('order.partial', `${inPlace} of ${n} in the right place.`, { inPlace, total: n }));
    }
    case 'construction': {
      if (a.kind !== 'construction') return result(false, 0, msg('construction.empty', 'Build your shape first.'), [], true);
      const r = evaluateGoals(q.goals, a.shapes);
      const metCount = r.results.filter((x) => x.met).length;
      if (r.met) return result(true, 1, q.successFeedback ? custom(q.successFeedback) : msg('construction.correct', 'That works!'));
      return result(false, metCount / r.results.length, r.results.find((x) => !x.met)!.feedback);
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
