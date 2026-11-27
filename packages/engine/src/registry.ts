/**
 * Interactive Knowledge Registry.
 *
 * Every interactive kind declares, in one place:
 *   - a zod schema for its configuration (so AI-generated or imported content
 *     is validated before it ever renders),
 *   - its adjustable parameters (so the tutor can change them through a
 *     validated action instead of arbitrary code),
 *   - how to describe its current state in words (so the tutor knows what
 *     "this" refers to),
 *   - its model assumptions and limitations (so simplified models are never
 *     presented as professional-grade simulators).
 *
 * This module is framework-free; React components are bound separately in
 * `ui/interactives/index.ts`.
 */
import { z } from 'zod';
import { compile, derivative, parseExpr } from './expr';
import { exactPeriod, PENDULUM_ASSUMPTIONS, smallAnglePeriod } from './sim/pendulum';
import type { SortAlgorithm } from './sim/sorting';
import { area, boundingBox, perimeter, rectPoints, type Point } from './geometry';
import {
  CIRCUIT_ASSUMPTIONS, EdgeIdSchema, PART_KINDS, edgeInBounds, solveCircuit, type CircuitBoard, type CircuitPart,
} from './sim/circuit';

export interface ParameterDef {
  name: string;
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
}

export type InteractiveState = Record<string, unknown>;

export interface InteractiveDescriptor<C = unknown, S extends InteractiveState = InteractiveState> {
  kind: string;
  label: string;
  category: 'math' | 'physics' | 'computer-science' | 'chemistry' | 'biology' | 'ai' | 'economics' | 'universal';
  description: string;
  configSchema: z.ZodType<C>;
  initialState(config: C): S;
  parameters(config: C): ParameterDef[];
  /** Plain-language snapshot for the tutor and screen readers. */
  describeState(config: C, state: S): string;
  assumptions?: string[];
  /** A ready-to-use configuration for open-ended Explore labs and the editor. */
  exampleConfig: Record<string, unknown>;
}

const clamp = (v: number, d: ParameterDef) => Math.min(d.max, Math.max(d.min, v));

// ── Function explorer ────────────────────────────────────────────────────────

const ParamSchema = z.object({
  name: z.string().regex(/^[a-zA-Z]$/, 'parameter names are single letters'),
  label: z.string().default(''),
  min: z.number(), max: z.number(), step: z.number().positive().default(0.1),
  default: z.number(),
});

export const FunctionExplorerConfig = z.object({
  expression: z.string().min(1),
  parameters: z.array(ParamSchema).max(6).default([]),
  xRange: z.tuple([z.number(), z.number()]).default([-10, 10]),
  yRange: z.tuple([z.number(), z.number()]).default([-10, 10]),
  showDerivative: z.boolean().default(false),
  allowDerivativeToggle: z.boolean().default(true),
  /** Optional faint reference curve, e.g. the parent function x^2. */
  reference: z.string().optional(),
}).superRefine((c, ctx) => {
  try { parseExpr(c.expression, ['x', ...c.parameters.map((p) => p.name)]); }
  catch (e) { ctx.addIssue({ code: 'custom', path: ['expression'], message: (e as Error).message }); }
});
export type FunctionExplorerConfig = z.infer<typeof FunctionExplorerConfig>;

export interface FunctionExplorerState extends InteractiveState { params: Record<string, number>; showDerivative: boolean; }

/** Real roots of f on [lo, hi] by sign-change bisection. */
export function findRoots(f: (x: number) => number, lo: number, hi: number, n = 800): number[] {
  const roots: number[] = [];
  let px = lo, py = f(lo);
  for (let i = 1; i <= n; i++) {
    const x = lo + ((hi - lo) * i) / n, y = f(x);
    if (Number.isFinite(py) && Number.isFinite(y)) {
      if (py === 0) roots.push(px);
      else if (py * y < 0) {
        let a = px, b = x;
        for (let k = 0; k < 50; k++) { const m = (a + b) / 2; if (f(a) * f(m) <= 0) b = m; else a = m; }
        roots.push((a + b) / 2);
      }
    }
    px = x; py = y;
  }
  return roots.filter((r, i) => i === 0 || Math.abs(r - roots[i - 1]) > 1e-6);
}

const fmt = (v: number) => (Math.abs(v) < 1e-9 ? '0' : Number(v.toFixed(3)).toString());

const functionExplorer: InteractiveDescriptor<FunctionExplorerConfig, FunctionExplorerState> = {
  kind: 'functionExplorer',
  label: 'Function explorer',
  category: 'math',
  description: 'Plot a function with adjustable coefficients, its roots, and optionally its derivative.',
  configSchema: FunctionExplorerConfig as z.ZodType<FunctionExplorerConfig>,
  initialState: (c) => ({ params: Object.fromEntries(c.parameters.map((p) => [p.name, p.default])), showDerivative: c.showDerivative }),
  parameters: (c) => c.parameters.map((p) => ({ name: p.name, label: p.label || p.name, min: p.min, max: p.max, step: p.step })),
  describeState(c, s) {
    const names = c.parameters.map((p) => p.name);
    const f = compile(c.expression, ['x', ...names]);
    const g = (x: number) => f({ ...s.params, x });
    const roots = findRoots(g, c.xRange[0], c.xRange[1]);
    const values = names.map((n) => `${n} = ${fmt(s.params[n])}`).join(', ');
    const parts = [
      `Plotting f(x) = ${c.expression.replace(/\*/g, '·')}${values ? ` with ${values}` : ''}.`,
      `f(0) = ${fmt(g(0))}.`,
      roots.length ? `Real roots in view: x ≈ ${roots.map(fmt).join(', ')}.` : 'No real roots in the visible range.',
    ];
    // Turning points (where f' changes sign) are meaningful for any smooth function.
    const turning = findRoots((x) => derivative(g, x), c.xRange[0], c.xRange[1]);
    if (turning.length && turning.length <= 4) parts.push(`Turning points near x ≈ ${turning.map(fmt).join(', ')}.`);
    if (s.showDerivative) parts.push('The derivative curve is currently shown.');
    return parts.join(' ');
  },
  exampleConfig: {
    expression: 'a*x^2 + b*x + c',
    parameters: [
      { name: 'a', label: 'a', min: -3, max: 3, step: 0.1, default: 1 },
      { name: 'b', label: 'b', min: -6, max: 6, step: 0.1, default: 0 },
      { name: 'c', label: 'c', min: -6, max: 6, step: 0.1, default: 0 },
    ],
    xRange: [-8, 8], yRange: [-8, 8], showDerivative: false,
  },
};

// ── Pendulum lab ─────────────────────────────────────────────────────────────

export const PendulumLabConfig = z.object({
  length: z.number().min(0.1).max(10).default(1),
  gravity: z.number().min(0.5).max(30).default(9.81),
  amplitudeDeg: z.number().min(1).max(170).default(15),
  damping: z.number().min(0).max(2).default(0),
  /** Which parameters the learner may change. */
  adjustable: z.array(z.enum(['length', 'gravity', 'amplitudeDeg', 'damping'])).default(['length', 'gravity', 'amplitudeDeg']),
  showPlanetPresets: z.boolean().default(true),
});
export type PendulumLabConfig = z.infer<typeof PendulumLabConfig>;
export interface PendulumLabState extends InteractiveState { length: number; gravity: number; amplitudeDeg: number; damping: number; }

const PENDULUM_PARAMS: Record<string, ParameterDef> = {
  length: { name: 'length', label: 'Length', min: 0.1, max: 10, step: 0.1, unit: 'm' },
  gravity: { name: 'gravity', label: 'Gravity', min: 0.5, max: 30, step: 0.01, unit: 'm/s²' },
  amplitudeDeg: { name: 'amplitudeDeg', label: 'Release angle', min: 1, max: 170, step: 1, unit: '°' },
  damping: { name: 'damping', label: 'Damping', min: 0, max: 2, step: 0.01, unit: '1/s' },
};

const pendulumLab: InteractiveDescriptor<PendulumLabConfig, PendulumLabState> = {
  kind: 'pendulumLab',
  label: 'Pendulum lab',
  category: 'physics',
  description: 'A simulated simple pendulum with adjustable length, gravity, release angle and damping, and a period timer.',
  configSchema: PendulumLabConfig as z.ZodType<PendulumLabConfig>,
  initialState: (c) => ({ length: c.length, gravity: c.gravity, amplitudeDeg: c.amplitudeDeg, damping: c.damping }),
  parameters: (c) => c.adjustable.map((k) => PENDULUM_PARAMS[k]),
  describeState(_c, s) {
    const t0 = smallAnglePeriod(s), t = exactPeriod(s);
    return [
      `Pendulum with length ${fmt(s.length)} m, gravity ${fmt(s.gravity)} m/s², released from ${fmt(s.amplitudeDeg)}°${s.damping > 0 ? `, damping ${fmt(s.damping)}/s` : ''}.`,
      `Small-angle formula predicts a period of ${t0.toFixed(3)} s; the full nonlinear model gives ${t.toFixed(3)} s` +
        (Math.abs(t - t0) / t0 > 0.01 ? ` (${(((t - t0) / t0) * 100).toFixed(1)}% longer, because the release angle is large).` : ' (the approximation is good at this angle).'),
    ].join(' ');
  },
  assumptions: PENDULUM_ASSUMPTIONS,
  exampleConfig: { length: 1, gravity: 9.81, amplitudeDeg: 20, adjustable: ['length', 'gravity', 'amplitudeDeg', 'damping'] },
};

// ── Sorting lab ──────────────────────────────────────────────────────────────

export const SortingLabConfig = z.object({
  array: z.array(z.number().int().min(1).max(99)).min(2).max(16).default([5, 2, 8, 1, 9, 3]),
  algorithm: z.enum(['bubble', 'insertion', 'selection']).default('bubble'),
  allowAlgorithmChange: z.boolean().default(true),
  allowShuffle: z.boolean().default(true),
});
export type SortingLabConfig = z.infer<typeof SortingLabConfig>;
export interface SortingLabState extends InteractiveState { array: number[]; algorithm: SortAlgorithm; frame: number; }

const sortingLab: InteractiveDescriptor<SortingLabConfig, SortingLabState> = {
  kind: 'sortingLab',
  label: 'Sorting lab',
  category: 'computer-science',
  description: 'Step through bubble, insertion or selection sort and watch comparisons and swaps.',
  configSchema: SortingLabConfig as z.ZodType<SortingLabConfig>,
  initialState: (c) => ({ array: c.array, algorithm: c.algorithm, frame: 0 }),
  parameters: () => [],
  describeState: (_c, s) => `Running ${s.algorithm} sort on [${s.array.join(', ')}], currently at step ${s.frame}.`,
  exampleConfig: { array: [7, 3, 9, 1, 6, 2, 8, 4], algorithm: 'insertion' },
};

// ── Registry ─────────────────────────────────────────────────────────────────

// ── Grid board (construction activities) ────────────────────────────────────

const PointSchema = z.tuple([z.number().int(), z.number().int()]);
export const SHAPE_COLORS = ['violet', 'teal', 'amber', 'rose', 'sky', 'slate'] as const;

const GridShapeSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]+$/),
  label: z.string().default(''),
  /** `rect` shapes stay axis-aligned rectangles; `polygon` shapes have free vertices. */
  kind: z.enum(['rect', 'polygon']),
  points: z.array(PointSchema).min(3).max(8),
  /** none = fixed; resize = drag the corner handle (rect); vertices = drag every corner (polygon). */
  editable: z.enum(['none', 'resize', 'vertices']).default('none'),
  color: z.enum(SHAPE_COLORS).default('violet'),
  showArea: z.boolean().default(false),
  showPerimeter: z.boolean().default(false),
  showTiles: z.boolean().default(false),
  showBoundingBox: z.boolean().default(false),
});
export type GridShape = z.infer<typeof GridShapeSchema>;

export const GridBoardConfig = z.object({
  cols: z.number().int().min(4).max(24).default(12),
  rows: z.number().int().min(4).max(16).default(8),
  shapes: z.array(GridShapeSchema).min(1).max(4),
  /** Lets the learner reveal unit squares inside every shape. */
  allowTileToggle: z.boolean().default(false),
}).superRefine((c, ctx) => {
  const ids = new Set<string>();
  c.shapes.forEach((s, i) => {
    if (ids.has(s.id)) ctx.addIssue({ code: 'custom', path: ['shapes', i, 'id'], message: `duplicate shape id "${s.id}"` });
    ids.add(s.id);
    if (s.kind === 'rect' && s.points.length !== 4) ctx.addIssue({ code: 'custom', path: ['shapes', i, 'points'], message: 'rect shapes need exactly 4 points' });
    if (s.editable === 'resize' && s.kind !== 'rect') ctx.addIssue({ code: 'custom', path: ['shapes', i, 'editable'], message: '"resize" only applies to rect shapes' });
    s.points.forEach(([x, y], j) => {
      if (x < 0 || y < 0 || x > c.cols || y > c.rows) ctx.addIssue({ code: 'custom', path: ['shapes', i, 'points', j], message: 'point lies outside the grid' });
    });
  });
});
export type GridBoardConfig = z.infer<typeof GridBoardConfig>;
export interface GridBoardState extends InteractiveState { shapes: Record<string, { points: Point[] }>; tilesVisible: boolean }

/** Build a rect from two integer corners, never smaller than 1×1. */
export function resizeRect(anchor: Point, corner: Point): Point[] {
  const [ax, ay] = anchor; let [cx, cy] = corner;
  if (cx === ax) cx = ax + 1;
  if (cy === ay) cy = ay + 1;
  const x = Math.min(ax, cx), y = Math.min(ay, cy);
  return rectPoints(x, y, Math.abs(cx - ax), Math.abs(cy - ay));
}

const gridBoard: InteractiveDescriptor<GridBoardConfig, GridBoardState> = {
  kind: 'gridBoard',
  label: 'Grid board',
  category: 'math',
  description: 'Shapes on a square grid. Learners can count unit squares, resize rectangles and drag polygon corners; constructions are checked exactly.',
  configSchema: GridBoardConfig as z.ZodType<GridBoardConfig>,
  initialState: (c) => ({ shapes: Object.fromEntries(c.shapes.map((s) => [s.id, { points: s.points.map((p) => [p[0], p[1]] as Point) }])), tilesVisible: false }),
  parameters: () => [],
  describeState(c, s) {
    return c.shapes.map((sh) => {
      const pts = s.shapes[sh.id]?.points ?? sh.points;
      const name = sh.label || `Shape ${sh.id}`;
      const bb = boundingBox(pts);
      const dims = sh.kind === 'rect' ? ` ${bb.width} wide and ${bb.height} tall,` : ` with corners at ${pts.map((p) => `(${p[0]}, ${p[1]})`).join(', ')},`;
      return `${name}:${dims} area ${fmt(area(pts))} square units, perimeter ${fmt(perimeter(pts))} units.`;
    }).join(' ') + (s.tilesVisible ? ' Unit squares are visible.' : '');
  },
  exampleConfig: {
    cols: 12, rows: 8, allowTileToggle: true,
    shapes: [{ id: 'r', label: 'Rectangle', kind: 'rect', points: [[1, 1], [5, 1], [5, 4], [1, 4]], editable: 'resize', showArea: true, showPerimeter: true }],
  },
};


// ── Circuit board (circuit builder) ─────────────────────────────────────────

const PartFields = {
  kind: z.enum(PART_KINDS),
  volts: z.number().min(0.5).max(24).optional(),
  ohms: z.number().min(0.5).max(1000).optional(),
  closed: z.boolean().optional(),
  positive: z.enum(['a', 'b']).optional(),
};
const PartTemplateSchema = z.object(PartFields);
export type CircuitPartTemplate = z.infer<typeof PartTemplateSchema>;

export const CircuitBoardConfig = z.object({
  /** Nodes across and down (the board has cols × rows dots). */
  cols: z.number().int().min(2).max(7).default(4),
  rows: z.number().int().min(2).max(5).default(3),
  /** Parts placed by the author. Switches with `toggleable` can be flipped by the learner. */
  parts: z.array(z.object({
    id: z.string().regex(/^[a-zA-Z0-9_-]+$/),
    label: z.string().default(''),
    at: EdgeIdSchema,
    toggleable: z.boolean().default(false),
    ...PartFields,
  })).max(30),
  /** Gaps the learner fills: tap to cycle empty → each option → empty. */
  slots: z.array(z.object({
    id: z.string().regex(/^[a-zA-Z0-9_-]+$/),
    label: z.string().default(''),
    at: EdgeIdSchema,
    options: z.array(PartTemplateSchema).min(1).max(5),
    /** Index into options of the starting part; -1 = empty. */
    start: z.number().int().min(-1).default(-1),
  })).max(8).default([]),
  /** Sliders for a fixed part's voltage or resistance. */
  adjustable: z.array(z.object({
    part: z.string(),
    property: z.enum(['volts', 'ohms']),
    label: z.string().default(''),
    min: z.number(), max: z.number(), step: z.number().positive().default(1),
  })).max(3).default([]),
  /** Show current and voltage for every part under the board. */
  showReadings: z.boolean().default(true),
  /** Animate moving charge along wires carrying current. */
  showFlow: z.boolean().default(true),
}).superRefine((c, ctx) => {
  const ids = new Set<string>();
  const edges = new Set<string>();
  const check = (id: string, at: string, path: (string | number)[]) => {
    if (ids.has(id)) ctx.addIssue({ code: 'custom', path: [...path, 'id'], message: `duplicate part id "${id}"` });
    ids.add(id);
    if (edges.has(at)) ctx.addIssue({ code: 'custom', path: [...path, 'at'], message: `two parts on edge "${at}"` });
    edges.add(at);
    if (!edgeInBounds(at, c.cols, c.rows)) ctx.addIssue({ code: 'custom', path: [...path, 'at'], message: `edge "${at}" is outside the board` });
  };
  c.parts.forEach((p, i) => {
    check(p.id, p.at, ['parts', i]);
    if (p.toggleable && p.kind !== 'switch') ctx.addIssue({ code: 'custom', path: ['parts', i, 'toggleable'], message: 'only switches can be toggleable' });
  });
  c.slots.forEach((s, i) => {
    check(s.id, s.at, ['slots', i]);
    if (s.start >= s.options.length) ctx.addIssue({ code: 'custom', path: ['slots', i, 'start'], message: 'start must index an option' });
  });
  c.adjustable.forEach((a, i) => {
    const part = c.parts.find((p) => p.id === a.part);
    if (!part) ctx.addIssue({ code: 'custom', path: ['adjustable', i, 'part'], message: `unknown part "${a.part}"` });
    else if ((a.property === 'volts') !== (part.kind === 'battery') || (a.property === 'ohms' && !['bulb', 'resistor'].includes(part.kind))) {
      ctx.addIssue({ code: 'custom', path: ['adjustable', i, 'property'], message: `"${a.property}" does not apply to a ${part.kind}` });
    }
  });
});
export type CircuitBoardConfig = z.infer<typeof CircuitBoardConfig>;
export interface CircuitBoardState extends InteractiveState { board: CircuitBoard }

/** A part as placed on the board (drops authoring-only fields). */
export function placePart(id: string, label: string, t: CircuitPartTemplate): CircuitPart {
  const p: CircuitPart = { id, kind: t.kind };
  if (label) p.label = label;
  if (t.volts !== undefined) p.volts = t.volts;
  if (t.ohms !== undefined) p.ohms = t.ohms;
  if (t.kind === 'switch') p.closed = t.closed ?? false;
  if (t.positive) p.positive = t.positive;
  return p;
}

export function initialCircuitBoard(c: CircuitBoardConfig): CircuitBoard {
  const board: CircuitBoard = {};
  for (const p of c.parts) board[p.at] = placePart(p.id, p.label, p);
  for (const s of c.slots) if (s.start >= 0) board[s.at] = placePart(s.id, s.label, s.options[s.start]);
  return board;
}

const PART_NAME: Record<CircuitPart['kind'], string> = { wire: 'Wire', battery: 'Battery', bulb: 'Bulb', resistor: 'Resistor', switch: 'Switch' };

const circuitBoard: InteractiveDescriptor<CircuitBoardConfig, CircuitBoardState> = {
  kind: 'circuitBoard',
  label: 'Circuit builder',
  category: 'physics',
  description: 'Build DC circuits from batteries, wires, bulbs, resistors and switches; currents and voltages are computed exactly and checked against goals.',
  configSchema: CircuitBoardConfig as z.ZodType<CircuitBoardConfig>,
  initialState: (c) => ({ board: initialCircuitBoard(c) }),
  parameters: (c) => c.adjustable.map((a) => ({
    name: `${a.part}.${a.property}`, label: a.label || `${a.part} ${a.property}`, min: a.min, max: a.max, step: a.step,
    unit: a.property === 'volts' ? 'V' : 'Ω',
  })),
  describeState(_c, s) {
    const sol = solveCircuit(s.board);
    if (sol.status === 'short') return 'Short circuit: a battery\'s two ends are joined by wire alone.';
    const parts = Object.values(s.board).filter((p) => p.kind !== 'wire').map((p) => {
      const r = sol.readings[p.id];
      const name = `${PART_NAME[p.kind]}${p.label ? ` ${p.label}` : ''}`;
      if (p.kind === 'switch') return `${name} is ${p.closed ? 'closed' : 'open'}`;
      const value = p.kind === 'battery' ? ` (${fmt(p.volts ?? 3)} V)` : p.kind === 'resistor' || p.kind === 'bulb' ? ` (${fmt(p.ohms ?? (p.kind === 'bulb' ? 6 : 10))} Ω)` : '';
      return `${name}${value}: ${fmt(Math.abs(r.current))} A, ${fmt(r.voltage)} V${p.kind === 'bulb' ? (r.lit ? `, lit at ${Math.round(r.brightness * 100)}%` : ', dark') : ''}`;
    });
    return `${parts.join('; ')}. ${sol.litBulbs} bulb(s) lit.`;
  },
  assumptions: CIRCUIT_ASSUMPTIONS,
  exampleConfig: {
    cols: 4, rows: 3,
    parts: [
      { id: 'bat', label: '', at: 'v:0,0', kind: 'battery', volts: 3 },
      { id: 'w1', at: 'v:0,1', kind: 'wire' }, { id: 'w2', at: 'h:0,0', kind: 'wire' },
      { id: 'A', label: 'A', at: 'h:1,0', kind: 'bulb' },
      { id: 'w3', at: 'v:3,0', kind: 'wire' }, { id: 'w4', at: 'v:3,1', kind: 'wire' },
      { id: 'w5', at: 'h:0,2', kind: 'wire' }, { id: 'w6', at: 'h:1,2', kind: 'wire' }, { id: 'w7', at: 'h:2,2', kind: 'wire' },
    ],
    slots: [{ id: 'B', label: 'B', at: 'h:2,0', options: [{ kind: 'wire' }, { kind: 'bulb' }, { kind: 'resistor', ohms: 6 }], start: 0 }],
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const REGISTRY = new Map<string, InteractiveDescriptor<any, any>>(
  [functionExplorer, pendulumLab, sortingLab, gridBoard, circuitBoard].map((d) => [d.kind, d]),
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getDescriptor(kind: string): InteractiveDescriptor<any, any> | undefined {
  return REGISTRY.get(kind);
}

export function listDescriptors() { return [...REGISTRY.values()]; }

export type ConfigResult<C> = { ok: true; config: C } | { ok: false; errors: string[] };

/** Validate an interactive's config against its registry schema. */
export function validateConfig<C = unknown>(kind: string, config: unknown): ConfigResult<C> {
  const d = REGISTRY.get(kind);
  if (!d) return { ok: false, errors: [`Unknown interactive kind "${kind}"`] };
  const r = d.configSchema.safeParse(config ?? {});
  if (!r.success) return { ok: false, errors: r.error.issues.map((i) => `${i.path.join('.') || kind}: ${i.message}`) };
  return { ok: true, config: r.data as C };
}

/**
 * Apply a parameter change requested by the learner UI or the tutor.
 * Only declared parameters can change, and values are clamped to their range.
 */
export function applyParameter(
  kind: string, config: unknown, state: InteractiveState, name: string, value: number,
): { ok: true; state: InteractiveState; applied: number } | { ok: false; error: string } {
  const d = REGISTRY.get(kind);
  if (!d) return { ok: false, error: `Unknown interactive kind "${kind}"` };
  const def = d.parameters(config).find((p) => p.name === name);
  if (!def) return { ok: false, error: `"${name}" is not an adjustable parameter of ${d.label}` };
  if (!Number.isFinite(value)) return { ok: false, error: 'Value must be a finite number' };
  const applied = clamp(value, def);
  if (kind === 'functionExplorer') {
    const s = state as FunctionExplorerState;
    return { ok: true, applied, state: { ...s, params: { ...s.params, [name]: applied } } };
  }
  if (kind === 'circuitBoard') {
    const s = state as CircuitBoardState;
    const [partId, prop] = name.split('.') as [string, 'volts' | 'ohms'];
    const edge = Object.keys(s.board).find((e) => s.board[e].id === partId);
    if (!edge) return { ok: false, error: `part "${partId}" is not on the board` };
    return { ok: true, applied, state: { ...s, board: { ...s.board, [edge]: { ...s.board[edge], [prop]: applied } } } };
  }
  return { ok: true, applied, state: { ...state, [name]: applied } };
}
