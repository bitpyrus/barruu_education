/**
 * Balance scale with algebra tiles.
 *
 * An equation is a balance: each pan holds x-tiles (an unknown weight) and 1-tiles.
 * The pans balance exactly when both sides are worth the same, so "=" means "same value",
 * not "the answer comes next" (equals-sign research: Knuth et al. 2006).
 *
 * Two modes:
 *  - free:  the learner adds or removes tiles on editable pans until it balances;
 *  - moves: the learner may only do the same thing to both sides (take a 1, take an x,
 *           share equally), which keeps it balanced, until one x stands alone.
 * Deterministic and offline.
 */
import { z } from 'zod';
import type { FeedbackMessage } from './assessment';

export interface Pan { x: number; units: number }
export interface BalanceSides { left: Pan; right: Pan }

export type BalanceMove =
  | { type: 'removeUnit' }
  | { type: 'removeX' }
  | { type: 'divide'; k: number };

export const value = (p: Pan, xValue: number) => p.x * xValue + p.units;
export const isBalanced = (s: BalanceSides, xValue: number) => value(s.left, xValue) === value(s.right, xValue);

/** One x alone on one side, only 1-tiles on the other. */
export function isSolved(s: BalanceSides): boolean {
  const alone = (a: Pan, b: Pan) => a.x === 1 && a.units === 0 && b.x === 0;
  return alone(s.left, s.right) || alone(s.right, s.left);
}

function gcd(a: number, b: number): number { return b === 0 ? Math.abs(a) : gcd(b, a % b); }

/** Moves that keep the balance and are possible right now. */
export function allowedMoves(s: BalanceSides): BalanceMove[] {
  const moves: BalanceMove[] = [];
  if (s.left.units > 0 && s.right.units > 0) moves.push({ type: 'removeUnit' });
  if (s.left.x > 0 && s.right.x > 0) moves.push({ type: 'removeX' });
  // Share equally: split both pans into k equal groups and keep one (k = number of x's on the x side).
  const xs = s.left.x > 0 && s.right.x === 0 ? s.left.x : s.right.x > 0 && s.left.x === 0 ? s.right.x : 0;
  if (xs >= 2) {
    const all = [s.left.x, s.left.units, s.right.x, s.right.units].reduce((g, n) => gcd(g, n), 0);
    if (all % xs === 0) moves.push({ type: 'divide', k: xs });
  }
  return moves;
}

export function applyMove(s: BalanceSides, m: BalanceMove): BalanceSides {
  switch (m.type) {
    case 'removeUnit': return { left: { ...s.left, units: s.left.units - 1 }, right: { ...s.right, units: s.right.units - 1 } };
    case 'removeX': return { left: { ...s.left, x: s.left.x - 1 }, right: { ...s.right, x: s.right.x - 1 } };
    case 'divide': return {
      left: { x: s.left.x / m.k, units: s.left.units / m.k },
      right: { x: s.right.x / m.k, units: s.right.units / m.k },
    };
  }
}

/** "2x + 3 = 11", with "≠" while the pans are not level. */
export function equationText(s: BalanceSides, xValue: number): string {
  const side = (p: Pan) => {
    const parts = [p.x ? (p.x === 1 ? 'x' : `${p.x}x`) : '', p.units ? String(p.units) : ''].filter(Boolean);
    return parts.length ? parts.join(' + ') : '0';
  };
  return `${side(s.left)} ${isBalanced(s, xValue) ? '=' : '≠'} ${side(s.right)}`;
}

// ── Goals ────────────────────────────────────────────────────────────────────

export const BalanceGoalSchema = z.object({
  /** balanced: both pans worth the same. solved: one x alone, balanced. */
  kind: z.enum(['balanced', 'solved']),
  message: z.string().optional(),
});
export type BalanceGoal = z.infer<typeof BalanceGoalSchema>;

export interface BalanceGoalResult { goal: BalanceGoal; met: boolean; feedback: FeedbackMessage }

export function evaluateBalanceGoals(goals: BalanceGoal[], s: BalanceSides, xValue: number) {
  const balanced = isBalanced(s, xValue);
  const results = goals.map((goal): BalanceGoalResult => {
    const met = goal.kind === 'balanced' ? balanced : balanced && isSolved(s);
    if (met) return { goal, met, feedback: { code: 'correct', params: {}, text: '' } };
    if (goal.message) return { goal, met, feedback: { code: 'custom', params: {}, text: goal.message } };
    if (!balanced && (s.left.x > 0 || s.right.x > 0)) {
      // Don't reveal what x is worth.
      const text = 'The pans aren\'t level, so the two sides aren\'t equal.';
      return { goal, met, feedback: { code: 'balance.tipped', params: {}, text } };
    }
    if (!balanced) {
      const l = value(s.left, xValue), r = value(s.right, xValue);
      const text = `The pans aren't level: the left side is worth ${l} and the right side ${r}.`;
      return { goal, met, feedback: { code: 'balance.unbalanced', params: { left: l, right: r }, text } };
    }
    const text = 'Balanced, but x isn\'t alone yet. Keep doing the same thing to both sides.';
    return { goal, met, feedback: { code: 'balance.notSolved', params: {}, text } };
  });
  return { met: results.every((r) => r.met), results };
}
