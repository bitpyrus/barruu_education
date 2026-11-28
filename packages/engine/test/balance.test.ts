import { describe, expect, it } from 'vitest';
import {
  LessonSchema, QuestionSchema, allowedMoves, applyMove, checkAnswer, equationText, getDescriptor, isBalanced, isSolved,
  lintLesson, reachableBalanceStates, validateConfig, type BalanceSides, type BalanceTilesConfig,
} from '../src';

const s = (lx: number, lu: number, rx: number, ru: number): BalanceSides => ({ left: { x: lx, units: lu }, right: { x: rx, units: ru } });

describe('balance scale', () => {
  it('balances exactly when both sides are worth the same', () => {
    expect(isBalanced(s(0, 12, 0, 12), 1)).toBe(true);
    expect(isBalanced(s(2, 3, 0, 11), 4)).toBe(true);
    expect(isBalanced(s(2, 3, 0, 10), 4)).toBe(false);
    expect(equationText(s(2, 3, 0, 11), 4)).toBe('2x + 3 = 11');
    expect(equationText(s(0, 12, 0, 9), 1)).toBe('12 ≠ 9');
  });

  it('only offers moves that keep it balanced, and solves 2x + 3 = 11 to x = 4', () => {
    let st = s(2, 3, 0, 11);
    expect(allowedMoves(st).map((m) => m.type)).toEqual(['removeUnit']);
    for (let i = 0; i < 3; i++) { st = applyMove(st, { type: 'removeUnit' }); expect(isBalanced(st, 4)).toBe(true); }
    expect(allowedMoves(st)).toContainEqual({ type: 'divide', k: 2 });
    st = applyMove(st, { type: 'divide', k: 2 });
    expect(st).toEqual(s(1, 0, 0, 4));
    expect(isSolved(st)).toBe(true);
  });

  it('only lets you share equally when every pile divides', () => {
    expect(allowedMoves(s(2, 0, 0, 7)).some((m) => m.type === 'divide')).toBe(false);
    expect(allowedMoves(s(3, 0, 0, 12))).toContainEqual({ type: 'divide', k: 3 });
    expect(allowedMoves(s(2, 1, 1, 5)).map((m) => m.type)).toEqual(['removeUnit', 'removeX']);
  });

  it('checks answers and never reveals x when the pans tip', () => {
    const solved = QuestionSchema.parse({ kind: 'balance', prompt: 'p', goals: [{ kind: 'solved' }] });
    expect(checkAnswer(solved, { kind: 'balance', sides: s(1, 0, 0, 4), xValue: 4 }).correct).toBe(true);
    expect(checkAnswer(solved, { kind: 'balance', sides: s(2, 0, 0, 8), xValue: 4 }).message.code).toBe('balance.notSolved');
    const bal = QuestionSchema.parse({ kind: 'balance', prompt: 'p', goals: [{ kind: 'balanced' }] });
    expect(checkAnswer(bal, { kind: 'balance', sides: s(0, 12, 0, 9), xValue: 1 }).message).toMatchObject({ code: 'balance.unbalanced', params: { left: 12, right: 9 } });
    expect(checkAnswer(bal, { kind: 'balance', sides: s(1, 0, 0, 9), xValue: 4 }).message.code).toBe('balance.tipped');
  });

  it('validates configs and finds reachable states for lint', () => {
    expect(validateConfig('balanceTiles', { left: { x: 2, units: 3 }, right: { units: 10 }, xValue: 4 }).ok).toBe(false); // moves mode must start balanced
    expect(validateConfig('balanceTiles', { left: { units: 12 }, right: { units: 5 }, mode: 'free' }).ok).toBe(false); // free needs editable
    const v = validateConfig<BalanceTilesConfig>('balanceTiles', { left: { units: 12 }, right: { units: 5 }, mode: 'free', editable: ['right'] });
    if (!v.ok) throw new Error(v.errors.join());
    const states = reachableBalanceStates(v.config);
    expect(states.every((x) => x.right.units >= 5)).toBe(true); // never below the starting tiles
    expect(states.some((x) => x.right.units === 12)).toBe(true);
  });

  it('lint proves balance challenges solvable and not pre-solved', () => {
    const lesson = (config: unknown, goals: unknown[]) => LessonSchema.parse({ id: 'l', title: 't', steps: [{
      id: 's', type: 'question', stage: 'practice', interactive: { kind: 'balanceTiles', config }, question: { kind: 'balance', prompt: 'p', goals },
    }] });
    expect(lintLesson(lesson({ left: { x: 3, units: 2 }, right: { units: 14 }, xValue: 4 }, [{ kind: 'solved' }]))).toEqual([]);
    expect(lintLesson(lesson({ left: { x: 1 }, right: { units: 4 }, xValue: 4 }, [{ kind: 'solved' }])).map((i) => i.message)).toContain('the starting balance already satisfies every goal');
    expect(lintLesson(lesson({ left: { x: 2, units: 1 }, right: { units: 7 }, xValue: 3 }, [{ kind: 'solved' }])).map((i) => i.message)).toEqual([]);
  });

  it('describes its state in words', () => {
    const v = validateConfig<BalanceTilesConfig>('balanceTiles', { left: { x: 2, units: 3 }, right: { units: 11 }, xValue: 4 });
    if (!v.ok) throw new Error();
    expect(getDescriptor('balanceTiles')!.describeState(v.config, { left: { x: 2, units: 3 }, right: { x: 0, units: 11 }, past: [] })).toContain('2x + 3 = 11');
  });
});
