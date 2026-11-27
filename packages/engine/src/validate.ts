/**
 * Content validation beyond schema shape: is a lesson actually playable?
 *
 * Used by tests for the built-in catalog today, and intended as the gate for
 * AI-generated and imported content (see docs/education/AI_CREATION.md).
 */
import { courseLessons, type Course, type Lesson, type Question } from './schema';
import { validateConfig, resizeRect, type GridBoardConfig } from './registry';
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

/** Problems that would make a lesson unplayable or wrongly assessed. */
export function lintLesson(lesson: Lesson): ContentIssue[] {
  const issues: ContentIssue[] = [];
  for (const step of lesson.steps) {
    const at = (message: string) => issues.push({ lesson: lesson.id, step: step.id, message });
    const spec = step.type === 'interactive' || step.type === 'question' ? step.interactive : undefined;
    let boardConfig: GridBoardConfig | undefined;
    if (spec) {
      const v = validateConfig<GridBoardConfig>(spec.kind, spec.config);
      if (!v.ok) { v.errors.forEach(at); continue; }
      if (spec.kind === 'gridBoard') boardConfig = v.config;
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
