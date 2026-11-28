/**
 * Content validation beyond schema shape: is a lesson actually playable?
 *
 * Used by tests for the built-in catalog today, and intended as the gate for
 * AI-generated and imported content (see docs/education/AI_CREATION.md).
 */
import { courseLessons, type Course, type Lesson, type Question } from './schema';
import { validateConfig, resizeRect, initialCircuitBoard, placePart, numberLineFormat, type GridBoardConfig, type CircuitBoardConfig, type NumberLineConfig } from './registry';
import { evaluateNumberLineGoals, type NumberLinePoints } from './numberLine';
import { evaluateCircuitGoals, type CircuitBoard } from './sim/circuit';
import { evaluateGoals, type Point } from './geometry';

export interface ContentIssue { lesson: string; step: string; message: string }

const MAX_SEARCH = 400_000;

/**
 * Searches for a construction that satisfies every goal, given what the
 * learner is allowed to edit. Returns a witness or null if none exists.
 */
export function findConstructionSolution(config: GridBoardConfig, q: Extract<Question, { kind: 'construction' }>): Record<string, { points: Point[] }> | null {
  const base = Object.fromEntries(config.shapes.map((s) => [s.id, { points: s.points as Point[] }]));
  const target = q.goals[0].shape;
  const shape = config.shapes.find((s) => s.id === target);
  if (!shape || q.goals.some((g) => g.shape !== target)) return null; // multi-shape goals: not searched yet
  const tryShape = (points: Point[]) => {
    const shapes = { ...base, [target]: { points } };
    return evaluateGoals(q.goals, shapes).met ? shapes : null;
  };
  if (shape.editable === 'none') return tryShape(shape.points as Point[]);
  if (shape.editable === 'resize') {
    const anchor = shape.points[0] as Point;
    for (let x = 0; x <= config.cols; x++) for (let y = 0; y <= config.rows; y++) {
      const r = tryShape(resizeRect(anchor, [x, y]));
      if (r) return r;
    }
    return null;
  }
  // vertices: brute-force lattice polygons with the same number of corners (triangles in practice)
  const n = shape.points.length;
  const lattice: Point[] = [];
  for (let x = 0; x <= config.cols; x++) for (let y = 0; y <= config.rows; y++) lattice.push([x, y]);
  if (n !== 3) return null;
  let tried = 0;
  for (let i = 0; i < lattice.length; i++) for (let j = i + 1; j < lattice.length; j++) for (let k = j + 1; k < lattice.length; k++) {
    if (++tried > MAX_SEARCH) return null;
    const r = tryShape([lattice[i], lattice[j], lattice[k]]);
    if (r) return r;
  }
  return null;
}

const MAX_CIRCUITS = 50_000;

/**
 * Searches every board the learner can reach (each slot empty or filled with one of
 * its options; each toggleable switch open or closed) for one meeting every goal.
 */
export function findCircuitSolution(config: CircuitBoardConfig, q: Extract<Question, { kind: 'circuit' }>): CircuitBoard | null {
  const base = initialCircuitBoard(config);
  for (const s of config.slots) delete base[s.at];
  type Choice = (b: CircuitBoard) => void;
  const dims: Choice[][] = [
    ...config.slots.map((s) => [() => {}, ...s.options.map((o): Choice => (b) => { b[s.at] = placePart(s.id, s.label, o); })]),
    ...config.parts.filter((p) => p.toggleable).map((p) => [false, true].map((closed): Choice => (b) => { b[p.at] = { ...b[p.at], closed }; })),
  ];
  const total = dims.reduce((n, d) => n * d.length, 1);
  if (total > MAX_CIRCUITS) return null;
  for (let i = 0; i < total; i++) {
    const board: CircuitBoard = { ...base };
    let rest = i;
    for (const d of dims) { d[rest % d.length](board); rest = Math.floor(rest / d.length); }
    if (evaluateCircuitGoals(q.goals, board).met) return board;
  }
  return null;
}

/** Searches every placement of the draggable points (on ticks) for one meeting every goal. */
export function findNumberLineSolution(config: NumberLineConfig, q: Extract<Question, { kind: 'numberLine' }>): NumberLinePoints | null {
  const lines = new Map(config.lines.map((l) => [l.id, l]));
  const fixed: NumberLinePoints = Object.fromEntries(config.points.map((p) => [p.id, p.value ?? null]));
  const movable = config.points.filter((p) => p.draggable).map((p) => {
    const l = lines.get(p.line)!;
    return { id: p.id, values: Array.from({ length: (l.max - l.min) * l.divisions + 1 }, (_, i) => l.min + i / l.divisions) };
  });
  const total = movable.reduce((n, m) => n * m.values.length, 1);
  if (total > MAX_CIRCUITS) return null;
  const fmt = numberLineFormat(config);
  for (let i = 0; i < total; i++) {
    const pts: NumberLinePoints = { ...fixed };
    let rest = i;
    for (const m of movable) { pts[m.id] = m.values[rest % m.values.length]; rest = Math.floor(rest / m.values.length); }
    if (evaluateNumberLineGoals(q.goals, pts, fmt).met) return pts;
  }
  return null;
}

/** Problems that would make a lesson unplayable or wrongly assessed. */
export function lintLesson(lesson: Lesson): ContentIssue[] {
  const issues: ContentIssue[] = [];
  for (const step of lesson.steps) {
    const at = (message: string) => issues.push({ lesson: lesson.id, step: step.id, message });
    const spec = step.type === 'interactive' || step.type === 'question' ? step.interactive : undefined;
    let boardConfig: GridBoardConfig | undefined;
    let circuitConfig: CircuitBoardConfig | undefined;
    let lineConfig: NumberLineConfig | undefined;
    if (spec) {
      const v = validateConfig<GridBoardConfig>(spec.kind, spec.config);
      if (!v.ok) { v.errors.forEach(at); continue; }
      if (spec.kind === 'gridBoard') boardConfig = v.config;
      if (spec.kind === 'circuitBoard') circuitConfig = v.config as unknown as CircuitBoardConfig;
      if (spec.kind === 'numberLine') lineConfig = v.config as unknown as NumberLineConfig;
    }
    if (step.type !== 'question') continue;
    const q = step.question;
    if (q.kind === 'construction') {
      if (!boardConfig) { at('construction question needs a gridBoard interactive'); continue; }
      const shapeIds = new Set(boardConfig.shapes.map((s) => s.id));
      q.goals.forEach((g) => { if (!shapeIds.has(g.shape)) at(`goal refers to unknown shape "${g.shape}"`); });
      if (evaluateGoals(q.goals, Object.fromEntries(boardConfig.shapes.map((s) => [s.id, { points: s.points as Point[] }]))).met) {
        at('the starting board already satisfies every goal');
      }
      if (!findConstructionSolution(boardConfig, q)) at('no reachable construction satisfies every goal');
    }
    if (q.kind === 'circuit') {
      if (!circuitConfig) { at('circuit question needs a circuitBoard interactive'); continue; }
      const ids = new Set([...circuitConfig.parts.map((p) => p.id), ...circuitConfig.slots.map((s) => s.id)]);
      q.goals.forEach((g) => { if (g.part && !ids.has(g.part)) at(`goal refers to unknown part "${g.part}"`); });
      if (evaluateCircuitGoals(q.goals, initialCircuitBoard(circuitConfig)).met) at('the starting circuit already satisfies every goal');
      if (!findCircuitSolution(circuitConfig, q)) at('no reachable circuit satisfies every goal');
    }
    if (q.kind === 'numberLine') {
      if (!lineConfig) { at('numberLine question needs a numberLine interactive'); continue; }
      const ids = new Set(lineConfig.points.map((p) => p.id));
      q.goals.forEach((g) => { [g.point, g.other].forEach((id) => { if (id && !ids.has(id)) at(`goal refers to unknown point "${id}"`); }); });
      const start = Object.fromEntries(lineConfig.points.map((p) => [p.id, p.value ?? null]));
      if (evaluateNumberLineGoals(q.goals, start, numberLineFormat(lineConfig)).met) at('the starting line already satisfies every goal');
      if (!findNumberLineSolution(lineConfig, q)) at('no reachable placement satisfies every goal');
    }
    if (q.kind === 'choice' && !q.options.some((o) => o.correct)) at('choice question has no correct option');
    if (q.kind === 'order' && [...q.correctOrder].sort().join() !== q.items.map((_, i) => i).join()) at('correctOrder is not a permutation of the items');
    if (step.stage === 'assess' && q.hints.length > 0) at('assessment steps should not have hints (they are hidden)');
  }
  return issues;
}

export function lintCourse(course: Course): ContentIssue[] {
  const ids = new Set<string>();
  const issues: ContentIssue[] = [];
  for (const lesson of courseLessons(course)) {
    if (ids.has(lesson.id)) issues.push({ lesson: lesson.id, step: '-', message: 'duplicate lesson id' });
    ids.add(lesson.id);
    issues.push(...lintLesson(lesson));
  }
  return issues;
}
