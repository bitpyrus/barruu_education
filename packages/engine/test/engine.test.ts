import { describe, expect, it } from 'vitest';
import {
  areEquivalent, evalSafe, parseExpr, compile, ExprError, checkAnswer, evidenceWeight, bktUpdate, createProfile,
  recordEvidence, effectiveMastery, conceptsDueForReview, applyParameter, getDescriptor, validateConfig,
  findRoots, listDescriptors, exactPeriod, measurePeriod, smallAnglePeriod, traceSort, QuestionSchema, area, axisAlignedSides, coveredCells, evaluateGoals, isSimplePolygon, perimeter,
  rectPoints, resizeRect, LessonSchema, lintLesson, type Point,
} from '@barruu/engine';

describe('safe expression engine', () => {
  it('evaluates with precedence, implicit multiplication and functions', () => {
    expect(evalSafe('2 + 3 * 4')).toBe(14);
    expect(evalSafe('2^3^2')).toBe(512);
    expect(evalSafe('-x^2', { x: 3 })).toBe(-9);
    expect(evalSafe('2x', { x: 4 })).toBe(8);
    expect(evalSafe('3(x+1)', { x: 1 })).toBe(6);
    expect(evalSafe('(x+1)(x-1)', { x: 3 })).toBe(8);
    expect(evalSafe('2sin(pi/2)')).toBeCloseTo(2);
    expect(evalSafe('sqrt(16) + abs(-2)')).toBe(6);
    expect(evalSafe('x^-1', { x: 4 })).toBe(0.25);
    expect(evalSafe('2**3')).toBe(8);
  });

  it('splits multi-letter identifiers into known variables', () => {
    expect(compile('ax^2', ['a', 'x'])({ a: 2, x: 3 })).toBe(18);
  });

  it('rejects code and malformed input instead of executing it', () => {
    expect(Number.isNaN(evalSafe('alert(1)'))).toBe(true);
    expect(Number.isNaN(evalSafe('constructor.constructor("return 1")()'))).toBe(true);
    expect(() => parseExpr('x +')).toThrow(ExprError);
    expect(() => parseExpr('x; y')).toThrow(ExprError);
    expect(() => parseExpr('sin(1,2)')).toThrow(ExprError);
    expect(() => parseExpr('x'.repeat(600))).toThrow(ExprError);
  });

  it('checks symbolic equivalence numerically', () => {
    expect(areEquivalent('(x-1)(x-5)', 'x^2 - 6x + 5')).toBe(true);
    expect(areEquivalent('2(x+1)', '2x+2')).toBe(true);
    expect(areEquivalent('sin(x)^2 + cos(x)^2', '1')).toBe(true);
    expect(areEquivalent('x^2', 'x^2 + 0.001')).toBe(false);
    expect(areEquivalent('(x-1)(x+5)', 'x^2 - 6x + 5')).toBe(false);
    expect(areEquivalent('not valid (', 'x')).toBe(false);
  });
});

describe('assessment', () => {
  const choice = QuestionSchema.parse({
    kind: 'choice', prompt: 'p',
    options: [{ id: 'a', text: 'A', correct: true }, { id: 'b', text: 'B', misconception: 'm1', feedback: 'nope' }],
  });

  it('grades choices and surfaces misconceptions', () => {
    expect(checkAnswer(choice, { kind: 'choice', selected: ['a'] }).correct).toBe(true);
    const wrong = checkAnswer(choice, { kind: 'choice', selected: ['b'] });
    expect(wrong.correct).toBe(false);
    expect(wrong.misconceptions).toEqual(['m1']);
    expect(wrong.feedback).toBe('nope');
    expect(checkAnswer(choice, { kind: 'choice', selected: [] }).invalid).toBe(true);
  });

  it('grades numeric answers with tolerance and diagnoses sign/magnitude errors', () => {
    const q = QuestionSchema.parse({ kind: 'numeric', prompt: 'p', answer: 4.937, tolerance: 0.05 });
    expect(checkAnswer(q, { kind: 'numeric', value: '4.94' }).correct).toBe(true);
    expect(checkAnswer(q, { kind: 'numeric', value: '2*pi*sqrt(1/1.62)' }).correct).toBe(true);
    expect(checkAnswer(q, { kind: 'numeric', value: '-4.937' }).feedback).toMatch(/sign/);
    expect(checkAnswer(q, { kind: 'numeric', value: '49.37' }).feedback).toMatch(/magnitude/);
    expect(checkAnswer(q, { kind: 'numeric', value: 'abc' }).invalid).toBe(true);
  });

  it('grades expressions by equivalence and order questions by position', () => {
    const q = QuestionSchema.parse({ kind: 'expression', prompt: 'p', answer: '(x-1)*(x-5)' });
    expect(checkAnswer(q, { kind: 'expression', value: 'x^2-6x+5' }).correct).toBe(true);
    expect(checkAnswer(q, { kind: 'expression', value: 'x^2-6x+6' }).correct).toBe(false);
    expect(checkAnswer(q, { kind: 'expression', value: '(x-' }).invalid).toBe(true);
    const o = QuestionSchema.parse({ kind: 'order', prompt: 'p', items: ['a', 'b', 'c'], correctOrder: [1, 2, 0] });
    expect(checkAnswer(o, { kind: 'order', order: [1, 2, 0] }).correct).toBe(true);
    expect(checkAnswer(o, { kind: 'order', order: [1, 0, 2] }).score).toBeCloseTo(1 / 3);
  });

  it('weights assisted evidence lower than independent evidence', () => {
    expect(evidenceWeight(0, 3, 1)).toBe(1);
    expect(evidenceWeight(3, 3, 1)).toBeLessThan(evidenceWeight(1, 3, 1));
    expect(evidenceWeight(3, 3, 5)).toBeGreaterThanOrEqual(0.2);
  });
});

describe('learner model', () => {
  it('raises mastery on correct answers and lowers it on errors', () => {
    expect(bktUpdate(0.5, true)).toBeGreaterThan(0.5);
    expect(bktUpdate(0.5, false)).toBeLessThan(0.5);
    expect(bktUpdate(0.5, true, 0.3)).toBeLessThan(bktUpdate(0.5, true, 1));
  });

  it('records evidence immutably and tracks misconceptions', () => {
    const p0 = createProfile();
    const p1 = recordEvidence(p0, { concepts: ['x'], correct: false, weight: 1, misconceptions: ['m'], at: 0 });
    expect(p0.concepts.x).toBeUndefined();
    expect(p1.concepts.x.attempts).toBe(1);
    expect(p1.misconceptions.m.count).toBe(1);
  });

  it('decays effective mastery over time and schedules review', () => {
    let p = createProfile();
    for (let i = 0; i < 6; i++) p = recordEvidence(p, { concepts: ['c'], correct: true, weight: 1, at: 0 });
    const now = effectiveMastery(p.concepts.c, 0);
    const later = effectiveMastery(p.concepts.c, 90 * 86_400_000);
    expect(now).toBeGreaterThan(0.85);
    expect(later).toBeLessThan(now);
    expect(conceptsDueForReview(p, 90 * 86_400_000)).toContain('c');
    expect(conceptsDueForReview(p, 0)).not.toContain('c');
  });
});

describe('interactive registry', () => {
  it('ships a valid example config for every registered kind', () => {
    for (const d of listDescriptors()) expect(validateConfig(d.kind, d.exampleConfig).ok, d.kind).toBe(true);
  });

  it('validates configs and rejects unsafe or malformed ones', () => {
    expect(validateConfig('functionExplorer', { expression: 'a*x^2', parameters: [{ name: 'a', min: -1, max: 1, default: 1 }] }).ok).toBe(true);
    const bad = validateConfig('functionExplorer', { expression: 'x +* 2' });
    expect(bad.ok).toBe(false);
    expect(validateConfig('pendulumLab', { length: -3 }).ok).toBe(false);
    expect(validateConfig('nope', {}).ok).toBe(false);
  });

  it('applies only declared parameters and clamps to range', () => {
    const cfg = validateConfig('functionExplorer', { expression: 'a*x^2', parameters: [{ name: 'a', min: -3, max: 3, default: 1 }] });
    if (!cfg.ok) throw new Error('config');
    const d = getDescriptor('functionExplorer')!;
    const s = d.initialState(cfg.config);
    const r = applyParameter('functionExplorer', cfg.config, s, 'a', 99);
    expect(r.ok && r.applied).toBe(3);
    expect(applyParameter('functionExplorer', cfg.config, s, 'z', 1).ok).toBe(false);
    const pend = validateConfig('pendulumLab', { adjustable: ['gravity'] });
    if (!pend.ok) throw new Error('config');
    expect(applyParameter('pendulumLab', pend.config, getDescriptor('pendulumLab')!.initialState(pend.config), 'length', 2).ok).toBe(false);
  });

  it('describes state in words the tutor can use', () => {
    const cfg = validateConfig('functionExplorer', { expression: 'x^2 - 4*x + 3' });
    if (!cfg.ok) throw new Error('config');
    const text = getDescriptor('functionExplorer')!.describeState(cfg.config, { params: {}, showDerivative: false });
    expect(text).toMatch(/roots in view: x ≈ 1, 3/);
    expect(text).toMatch(/Turning points near x ≈ 2/);
    expect(findRoots((x) => x * x - 2, -3, 3).map((r) => +r.toFixed(4))).toEqual([-1.4142, 1.4142]);
  });
});

describe('simulations', () => {
  it('pendulum: simulation agrees with exact theory and the small-angle limit', () => {
    const p = { length: 1, gravity: 9.81, amplitudeDeg: 5, damping: 0 };
    expect(measurePeriod(p)).toBeCloseTo(exactPeriod(p), 2);
    expect(exactPeriod(p)).toBeCloseTo(smallAnglePeriod(p), 2);
    const big = { ...p, amplitudeDeg: 150 };
    expect(measurePeriod(big)).toBeCloseTo(exactPeriod(big), 2);
    expect(exactPeriod(big) / smallAnglePeriod(big)).toBeGreaterThan(1.7);
    // 4x length → 2x period
    expect(smallAnglePeriod({ length: 4, gravity: 9.81 }) / smallAnglePeriod({ length: 1, gravity: 9.81 })).toBeCloseTo(2);
  });

  it('sorting traces end sorted and match the lesson\'s claims', () => {
    for (const alg of ['bubble', 'insertion', 'selection'] as const) {
      const t = traceSort([5, 2, 8, 1, 9, 3], alg);
      expect(t.frames.at(-1)!.array).toEqual([1, 2, 3, 5, 8, 9]);
    }
    expect(traceSort([6, 5, 4, 3, 2, 1], 'bubble').comparisons).toBe(15);
    expect(traceSort([1, 2, 3, 4, 5, 6], 'bubble').comparisons).toBe(5);
  });
});

describe('lattice geometry', () => {
  it('measures rectangles, triangles and L-shapes exactly', () => {
    expect(area(rectPoints(0, 0, 3, 4))).toBe(12);
    expect(perimeter(rectPoints(0, 0, 3, 4))).toBe(14);
    expect(area([[0, 0], [4, 0], [1, 3]])).toBe(6);
    const L: Point[] = [[0, 0], [4, 0], [4, 1], [1, 1], [1, 3], [0, 3]];
    expect(area(L)).toBe(6);
    expect(coveredCells(L)).toHaveLength(6);
    expect(coveredCells(rectPoints(1, 1, 3, 2))).toHaveLength(6);
  });

  it('counts axis-aligned sides and rejects self-intersecting polygons', () => {
    expect(axisAlignedSides(rectPoints(0, 0, 2, 2))).toBe(4);
    expect(axisAlignedSides([[0, 0], [4, 0], [1, 3]])).toBe(1);
    expect(axisAlignedSides([[0, 0], [3, 1], [1, 3]])).toBe(0);
    expect(isSimplePolygon([[0, 0], [2, 2], [2, 0], [0, 2]])).toBe(false);
    expect(isSimplePolygon([[0, 0], [0, 0], [1, 1]])).toBe(false);
  });

  it('resizes rectangles from an anchor and never collapses them', () => {
    expect(area(resizeRect([1, 1], [4, 5]))).toBe(12);
    expect(area(resizeRect([1, 1], [1, 1]))).toBe(1);
    expect(area(resizeRect([3, 3], [0, 1]))).toBe(6);
  });
});

describe('construction goals', () => {
  const goals = [
    { shape: 't', metric: 'area' as const, op: 'eq' as const, value: 6 },
    { shape: 't', metric: 'axisAlignedSides' as const, op: 'eq' as const, value: 0, message: 'Tilt every side.' },
  ];

  it('passes only when every goal holds, with a specific message for the first failure', () => {
    expect(evaluateGoals(goals, { t: { points: [[0, 0], [3, 1], [1, 3]] } }).met).toBe(false); // area 4
    const r = evaluateGoals(goals, { t: { points: [[0, 0], [4, 0], [1, 3]] } });
    expect(r.met).toBe(false);
    expect(r.results[1].message).toBe('Tilt every side.');
    expect(evaluateGoals(goals, { t: { points: [[0, 0], [5, 1], [3, 3]] } }).met).toBe(true); // area 6, no axis sides
  });

  it('treats degenerate shapes as failures, not errors', () => {
    const r = evaluateGoals(goals, { t: { points: [[0, 0], [1, 1], [2, 2]] } });
    expect(r.met).toBe(false);
    expect(r.results[0].message).toMatch(/flat/);
  });

  it('grades construction questions through the shared assessment API', () => {
    const q = QuestionSchema.parse({ kind: 'construction', prompt: 'Build area 12', goals: [{ shape: 'r', metric: 'area', value: 12 }], successFeedback: 'Nice.' });
    expect(checkAnswer(q, { kind: 'construction', shapes: { r: { points: rectPoints(0, 0, 3, 4) } } })).toMatchObject({ correct: true, feedback: 'Nice.' });
    const wrong = checkAnswer(q, { kind: 'construction', shapes: { r: { points: rectPoints(0, 0, 3, 3) } } });
    expect(wrong.correct).toBe(false);
    expect(wrong.feedback).toMatch(/area is 9.*exactly 12/);
  });
});

describe('grid board registry entry', () => {
  it('validates shapes and describes them for the tutor', () => {
    expect(validateConfig('gridBoard', { shapes: [{ id: 'a', kind: 'rect', points: [[0, 0], [2, 0], [2, 2]] }] }).ok).toBe(false);
    expect(validateConfig('gridBoard', { cols: 4, rows: 4, shapes: [{ id: 'a', kind: 'polygon', points: [[0, 0], [9, 0], [1, 1]] }] }).ok).toBe(false);
    expect(validateConfig('gridBoard', { shapes: [{ id: 'a', kind: 'polygon', points: [[0, 0], [2, 0], [1, 1]], editable: 'resize' }] }).ok).toBe(false);
    const v = validateConfig('gridBoard', { shapes: [{ id: 'r', label: 'Rectangle', kind: 'rect', points: rectPoints(0, 0, 3, 4) }] });
    if (!v.ok) throw new Error(v.errors.join());
    const d = getDescriptor('gridBoard')!;
    expect(d.describeState(v.config, d.initialState(v.config))).toMatch(/Rectangle: 3 wide and 4 tall, area 12 square units, perimeter 14/);
  });
});

describe('content lint (engine)', () => {
  it('detects unsolvable and already-solved constructions', () => {
        const board = { kind: 'gridBoard', config: { cols: 4, rows: 4, shapes: [{ id: 'r', kind: 'rect', points: rectPoints(0, 0, 2, 2), editable: 'resize' }] } };
    const mk = (value: number) => LessonSchema.parse({ id: 'x', title: 'x', steps: [{ id: 's', type: 'question', stage: 'challenge', interactive: board,
      question: { kind: 'construction', prompt: 'p', goals: [{ shape: 'r', metric: 'area', value }] } }] });
    expect(lintLesson(mk(25)).map((i) => i.message)).toContain('no reachable construction satisfies every goal');
    expect(lintLesson(mk(4)).map((i) => i.message)).toContain('the starting board already satisfies every goal');
    expect(lintLesson(mk(6))).toEqual([]);
  });
});
