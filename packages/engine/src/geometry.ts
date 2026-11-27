/**
 * Lattice geometry and construction goals.
 *
 * Construction activities ("build a rectangle with area 12") are assessed by
 * evaluating declarative goals against the learner's actual shapes. This is
 * deterministic and runs offline — no AI, no network. The same functions are
 * used by the lesson player, the editor preview and (in future) any other
 * Barruu runtime that reads the same `.bipy` content.
 */
import { z } from 'zod';

export type Point = [number, number];

export interface ShapeState { points: Point[] }

/** Signed area via the shoelace formula (positive for counter-clockwise). */
export function signedArea(points: Point[]): number {
  let s = 0;
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    s += x1 * y2 - x2 * y1;
  }
  return s / 2;
}

export const area = (points: Point[]) => Math.abs(signedArea(points));

export function perimeter(points: Point[]): number {
  let p = 0;
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    p += Math.hypot(x2 - x1, y2 - y1);
  }
  return p;
}

export function boundingBox(points: Point[]) {
  const xs = points.map((p) => p[0]), ys = points.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY };
}

/** Number of sides that are horizontal or vertical. */
export function axisAlignedSides(points: Point[]): number {
  let n = 0;
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    if ((x1 === x2) !== (y1 === y2)) n++;
  }
  return n;
}

/** Rectangle stored as two opposite corners → polygon. */
export function rectPoints(x: number, y: number, w: number, h: number): Point[] {
  return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
}

/** A unit square [cx, cx+1]×[cy, cy+1] lies inside a simple polygon (centre test). */
export function pointInPolygon([px, py]: Point, points: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i], [xj, yj] = points[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Unit cells whose centre lies inside the polygon (used to draw tiles). */
export function coveredCells(points: Point[]): Point[] {
  const bb = boundingBox(points);
  const cells: Point[] = [];
  for (let x = Math.floor(bb.minX); x < Math.ceil(bb.maxX); x++)
    for (let y = Math.floor(bb.minY); y < Math.ceil(bb.maxY); y++)
      if (pointInPolygon([x + 0.5, y + 0.5], points)) cells.push([x, y]);
  return cells;
}

/** True if no two non-adjacent edges intersect and no edge has zero length. */
export function isSimplePolygon(points: Point[]): boolean {
  const n = points.length;
  if (n < 3) return false;
  const seg = (i: number): [Point, Point] => [points[i], points[(i + 1) % n]];
  const orient = (a: Point, b: Point, c: Point) => Math.sign((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]));
  for (let i = 0; i < n; i++) {
    const [a, b] = seg(i);
    if (a[0] === b[0] && a[1] === b[1]) return false;
    for (let j = i + 1; j < n; j++) {
      if (Math.abs(i - j) <= 1 || (i === 0 && j === n - 1)) continue;
      const [c, d] = seg(j);
      if (orient(a, b, c) !== orient(a, b, d) && orient(c, d, a) !== orient(c, d, b)) return false;
    }
  }
  return true;
}

// ── Construction goals ───────────────────────────────────────────────────────

export const MetricSchema = z.enum(['area', 'perimeter', 'width', 'height', 'axisAlignedSides', 'vertexCount']);
export type Metric = z.infer<typeof MetricSchema>;

export const GoalSchema = z.object({
  shape: z.string().min(1),
  metric: MetricSchema,
  op: z.enum(['eq', 'ne', 'lt', 'lte', 'gt', 'gte']).default('eq'),
  value: z.number(),
  /** Feedback shown when this goal is not met. */
  message: z.string().optional(),
});
export type Goal = z.infer<typeof GoalSchema>;

export function measure(points: Point[], metric: Metric): number {
  switch (metric) {
    case 'area': return area(points);
    case 'perimeter': return perimeter(points);
    case 'width': return boundingBox(points).width;
    case 'height': return boundingBox(points).height;
    case 'axisAlignedSides': return axisAlignedSides(points);
    case 'vertexCount': return points.length;
  }
}

const EPS = 1e-9;
function compare(a: number, op: Goal['op'], b: number): boolean {
  switch (op) {
    case 'eq': return Math.abs(a - b) < EPS;
    case 'ne': return Math.abs(a - b) >= EPS;
    case 'lt': return a < b - EPS;
    case 'lte': return a <= b + EPS;
    case 'gt': return a > b + EPS;
    case 'gte': return a >= b - EPS;
  }
}

const METRIC_LABEL: Record<Metric, string> = {
  area: 'area', perimeter: 'perimeter', width: 'width', height: 'height',
  axisAlignedSides: 'number of horizontal or vertical sides', vertexCount: 'number of corners',
};

export interface GoalResult { goal: Goal; actual: number; met: boolean; message: string }

const fmt = (v: number) => Number(v.toFixed(2)).toString();

export function evaluateGoals(goals: Goal[], shapes: Record<string, ShapeState>): { met: boolean; results: GoalResult[] } {
  const results = goals.map((goal) => {
    const s = shapes[goal.shape];
    if (!s || s.points.length < 3 || !isSimplePolygon(s.points) || area(s.points) < EPS) {
      return { goal, actual: NaN, met: false, message: 'That shape is flat or crosses itself — spread its corners apart.' };
    }
    const actual = measure(s.points, goal.metric);
    const met = compare(actual, goal.op, goal.value);
    const message = met ? '' : goal.message ?? `Its ${METRIC_LABEL[goal.metric]} is ${fmt(actual)}, but it needs to be ${opText(goal.op)} ${fmt(goal.value)}.`;
    return { goal, actual, met, message };
  });
  return { met: results.every((r) => r.met), results };
}

function opText(op: Goal['op']): string {
  return { eq: 'exactly', ne: 'different from', lt: 'less than', lte: 'at most', gt: 'more than', gte: 'at least' }[op];
}
