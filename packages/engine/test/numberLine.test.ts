import { describe, expect, it } from 'vitest';
import {
  QuestionSchema, LessonSchema, checkAnswer, evaluateNumberLineGoals, findNumberLineSolution, formatFraction, getDescriptor,
  lintLesson, numberLineFormat, snap, validateConfig, type NumberLineConfig,
} from '../src';

const cfg = (extra: Record<string, unknown> = {}) => ({
  lines: [{ id: 'q', min: 0, max: 1, divisions: 4 }],
  points: [{ id: 'p', label: 'P', line: 'q' }],
  ...extra,
});

describe('number line', () => {
  it('formats values as fractions on the point\'s own grid', () => {
    expect(formatFraction(0.75, 4)).toBe('3/4');
    expect(formatFraction(0.5, 4)).toBe('2/4');
    expect(formatFraction(1, 4)).toBe('1');
    expect(formatFraction(1.25, 4)).toBe('5/4');
    expect(formatFraction(1 / 3, 1)).toBe('1/3');
    expect(snap(0.6, 4, 0, 1)).toBe(0.5);
    expect(snap(9, 4, 0, 1)).toBe(1);
  });

  it('accepts fraction strings in goals and point values', () => {
    const q = QuestionSchema.parse({ kind: 'numberLine', prompt: 'p', goals: [{ point: 'p', value: '3/4' }] });
    expect(q.kind === 'numberLine' && q.goals[0].value).toBe(0.75);
    expect(() => QuestionSchema.parse({ kind: 'numberLine', prompt: 'p', goals: [{ point: 'p', value: '3/0' }] })).toThrow();
    expect(() => QuestionSchema.parse({ kind: 'numberLine', prompt: 'p', goals: [{ point: 'p' }] })).toThrow();
  });

  it('validates configs: values on ticks, known lines, fixed points need values', () => {
    expect(validateConfig('numberLine', cfg()).ok).toBe(true);
    expect(validateConfig('numberLine', cfg({ points: [{ id: 'p', line: 'q', value: '1/3' }] })).ok).toBe(false);
    expect(validateConfig('numberLine', cfg({ points: [{ id: 'p', line: 'nope' }] })).ok).toBe(false);
    expect(validateConfig('numberLine', cfg({ points: [{ id: 'p', line: 'q', draggable: false }] })).ok).toBe(false);
  });

  it('checks placements and explains misses in fractions', () => {
    const v = validateConfig<NumberLineConfig>('numberLine', cfg());
    if (!v.ok) throw new Error();
    const format = numberLineFormat(v.config);
    const q = QuestionSchema.parse({ kind: 'numberLine', prompt: 'p', goals: [{ point: 'p', value: '3/4' }] });
    expect(checkAnswer(q, { kind: 'numberLine', points: { p: 0.75 }, format }).correct).toBe(true);
    const miss = checkAnswer(q, { kind: 'numberLine', points: { p: 0.5 }, format });
    expect(miss.message).toMatchObject({ code: 'numberLine.value', params: { point: 'P', actual: '2/4', value: '3/4' } });
    expect(checkAnswer(q, { kind: 'numberLine', points: { p: null }, format }).message.code).toBe('numberLine.unplaced');
  });

  it('compares points with each other (1/4 vs 1/6 on stacked lines)', () => {
    const r = evaluateNumberLineGoals([{ point: 'a', op: 'gt', other: 'b' }], { a: 1 / 4, b: 1 / 6 });
    expect(r.met).toBe(true);
    expect(evaluateNumberLineGoals([{ point: 'a', op: 'eq', other: 'b' }], { a: 2 / 4, b: 1 / 2 }).met).toBe(true);
  });

  it('lint finds a placement, rejects impossible goals and pre-solved boards', () => {
    const lesson = (goals: unknown[], points?: unknown[]) => LessonSchema.parse({ id: 'l', title: 't', steps: [{
      id: 's', type: 'question', stage: 'practice', interactive: { kind: 'numberLine', config: cfg(points ? { points } : {}) },
      question: { kind: 'numberLine', prompt: 'p', goals },
    }] });
    expect(lintLesson(lesson([{ point: 'p', value: '3/4' }]))).toEqual([]);
    expect(lintLesson(lesson([{ point: 'p', value: '1/3' }])).map((i) => i.message)).toContain('no reachable placement satisfies every goal');
    expect(lintLesson(lesson([{ point: 'p', value: '1/4' }], [{ id: 'p', line: 'q', value: '1/4' }])).map((i) => i.message)).toContain('the starting line already satisfies every goal');
    const v = validateConfig<NumberLineConfig>('numberLine', cfg());
    if (!v.ok) throw new Error();
    const q = QuestionSchema.parse({ kind: 'numberLine', prompt: 'p', goals: [{ point: 'p', value: 1 }] });
    if (q.kind !== 'numberLine') throw new Error();
    expect(findNumberLineSolution(v.config, q)).toEqual({ p: 1 });
  });

  it('describes its state in words', () => {
    const v = validateConfig<NumberLineConfig>('numberLine', cfg());
    if (!v.ok) throw new Error();
    expect(getDescriptor('numberLine')!.describeState(v.config, { points: { p: 0.75 } })).toContain('P is at 3/4');
  });
});
