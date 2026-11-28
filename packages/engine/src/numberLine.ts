/**
 * Number line: points on one or more stacked lines, snapped to equal divisions.
 *
 * The IES fractions guide names the number line as the central representation for
 * rational numbers. Learners drag points (or use the arrow keys); answers are checked
 * by declarative goals, exactly and offline. Values are numbers; authors may write
 * goal values as fractions ("3/4") so content stays readable.
 */
import { z } from 'zod';
import type { FeedbackMessage } from './assessment';

const EPS = 1e-9;

/** "3/4", "-1/2", "2" or a number → number. */
export const FractionValue = z.union([
  z.number(),
  z.string().regex(/^-?\d+(\/\d+)?$/, 'write values as integers or fractions like "3/4"'),
]).transform((v) => {
  if (typeof v === 'number') return v;
  const [n, d] = v.split('/').map(Number);
  return d === undefined ? n : n / d;
}).refine((v) => Number.isFinite(v), 'denominator cannot be zero');

export const NumberLineGoalSchema = z.object({
  point: z.string().min(1),
  op: z.enum(['eq', 'lt', 'lte', 'gt', 'gte']).default('eq'),
  /** Compare with a value… */
  value: FractionValue.optional(),
  /** …or with another point. */
  other: z.string().optional(),
  message: z.string().optional(),
}).refine((g) => (g.value === undefined) !== (g.other === undefined), { message: 'give exactly one of value or other' });
export type NumberLineGoal = z.infer<typeof NumberLineGoalSchema>;

/** point id → value, or null while the point is not on the line yet. */
export type NumberLinePoints = Record<string, number | null>;

export interface NumberLineFormat {
  /** Divisions per unit on the point's line (used to write values as fractions). */
  divisions: Record<string, number>;
  labels: Record<string, string>;
}

/** Write v as a fraction over d when it lies on that grid (e.g. 0.75, 4 → "3/4"); integers stay whole. */
export function formatFraction(v: number, d = 1): string {
  if (Math.abs(v - Math.round(v)) < EPS) return String(Math.round(v));
  const n = v * d;
  if (Math.abs(n - Math.round(n)) < 1e-6) return `${Math.round(n)}/${d}`;
  for (let den = 2; den <= 24; den++) { const k = v * den; if (Math.abs(k - Math.round(k)) < 1e-6) return `${Math.round(k)}/${den}`; }
  return String(Number(v.toFixed(3)));
}

export const snap = (v: number, divisions: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Math.round(v * divisions) / divisions));

function compare(a: number, op: NumberLineGoal['op'], b: number): boolean {
  switch (op) {
    case 'eq': return Math.abs(a - b) < 1e-6;
    case 'lt': return a < b - 1e-6;
    case 'lte': return a <= b + 1e-6;
    case 'gt': return a > b + 1e-6;
    case 'gte': return a >= b - 1e-6;
  }
}
const OP_TEXT = { eq: 'at', lt: 'less than', lte: 'at most', gt: 'more than', gte: 'at least' } as const;

export interface NumberLineGoalResult { goal: NumberLineGoal; met: boolean; feedback: FeedbackMessage }

export function evaluateNumberLineGoals(goals: NumberLineGoal[], points: NumberLinePoints, fmt: NumberLineFormat = { divisions: {}, labels: {} }) {
  const name = (id: string) => fmt.labels[id] || id;
  const show = (id: string, v: number) => formatFraction(v, fmt.divisions[id] ?? 1);
  const results = goals.map((goal): NumberLineGoalResult => {
    const v = points[goal.point];
    if (v === null || v === undefined) {
      const text = `Put ${name(goal.point)} on the line first.`;
      return { goal, met: false, feedback: { code: 'numberLine.unplaced', params: { point: name(goal.point) }, text } };
    }
    const target = goal.other !== undefined ? points[goal.other] : goal.value!;
    if (target === null || target === undefined) {
      const text = `Put ${name(goal.other!)} on the line first.`;
      return { goal, met: false, feedback: { code: 'numberLine.unplaced', params: { point: name(goal.other!) }, text } };
    }
    const met = compare(v, goal.op, target);
    if (met) return { goal, met, feedback: { code: 'correct', params: {}, text: '' } };
    if (goal.message) return { goal, met, feedback: { code: 'custom', params: {}, text: goal.message } };
    if (goal.other !== undefined) {
      const text = `${name(goal.point)} needs to be ${OP_TEXT[goal.op]} ${name(goal.other)}.`;
      return { goal, met, feedback: { code: 'numberLine.compare', params: { point: name(goal.point), op: goal.op, other: name(goal.other) }, text } };
    }
    const params = { point: name(goal.point), actual: show(goal.point, v), op: goal.op, value: show(goal.point, target) };
    const text = goal.op === 'eq'
      ? `${params.point} is at ${params.actual}, but it needs to be at ${params.value}.`
      : `${params.point} is at ${params.actual}; it needs to be ${OP_TEXT[goal.op]} ${params.value}.`;
    return { goal, met, feedback: { code: goal.op === 'eq' ? 'numberLine.value' : 'numberLine.bound', params, text } };
  });
  return { met: results.every((r) => r.met), results };
}
