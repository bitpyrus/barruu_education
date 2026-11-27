/**
 * DC circuit model for the circuit builder.
 *
 * A board is a small lattice of nodes. Each edge between two neighbouring nodes
 * holds at most one part: a wire, battery, bulb, resistor or switch. Edge ids are
 * `h:x,y` (from node (x,y) to (x+1,y)) and `v:x,y` (from (x,y) to (x,y+1)); the
 * first node is end `a`, the second end `b`.
 *
 * The circuit is solved with modified nodal analysis (MNA):
 *  - batteries are ideal voltage sources,
 *  - bulbs and resistors are ohmic resistors,
 *  - wires and closed switches are tiny resistors (R_WIRE), so loops of wire and
 *    the current in every wire are well defined; open switches are removed.
 * A battery whose terminals are joined by wires alone is reported as a short
 * circuit; a shorted battery is given a small internal resistance so its voltage collapses
 * (as a real battery's does) instead of driving an impossible current. Deterministic and offline.
 */
import { z } from 'zod';
import type { FeedbackMessage } from '../assessment';

export const PART_KINDS = ['wire', 'battery', 'bulb', 'resistor', 'switch'] as const;
export type PartKind = (typeof PART_KINDS)[number];

/** Resistance used for wires and closed switches (Ω). Small enough to be invisible at 2 decimals. */
export const R_WIRE = 1e-6;
export const BULB_OHMS = 6;
/** Power at which a bulb shines at full brightness (W): a 6 Ω bulb on 3 V. */
export const BULB_RATED_WATTS = 1.5;
export const DEFAULT_VOLTS = 3;
export const DEFAULT_OHMS = 10;
/** Bulbs below this fraction of rated power look dark. */
export const LIT_THRESHOLD = 0.02;
/** Internal resistance given to a shorted battery, so its voltage collapses as a real one's does (Ω). */
export const R_SHORT_INTERNAL = 0.1;

export const CIRCUIT_ASSUMPTIONS = [
  'Batteries are ideal (fixed voltage, no internal resistance), except that a shorted battery\'s voltage collapses',
  'Bulbs behave like fixed resistors (6 Ω); real filaments change resistance as they heat up',
  'Wires and closed switches have (almost) no resistance',
  'Steady direct current only: no capacitors, inductors or changing signals',
];

export const EdgeIdSchema = z.string().regex(/^[hv]:\d,\d$/, 'edge ids look like "h:1,0" or "v:0,2"');

export interface CircuitPart {
  /** Stable id used by goals and readings. */
  id: string;
  kind: PartKind;
  label?: string;
  volts?: number;
  ohms?: number;
  /** Switches only. */
  closed?: boolean;
  /** Batteries only: which end is the + terminal (`a` = top/left). */
  positive?: 'a' | 'b';
}

/** Edge id → part. */
export type CircuitBoard = Record<string, CircuitPart>;

export interface PartReading {
  id: string;
  edge: string;
  kind: PartKind;
  /** Current in amperes, positive from end a to end b. For batteries: positive when the battery delivers current. */
  current: number;
  /** |voltage| across the part, in volts. */
  voltage: number;
  /** Power in watts (dissipated by loads, delivered by batteries). */
  power: number;
  /** Bulbs: 0–1 of full brightness. */
  brightness: number;
  lit: boolean;
}

export interface CircuitSolution {
  status: 'ok' | 'short' | 'invalid';
  readings: Record<string, PartReading>;
  /** Ids of batteries shorted by wires alone. */
  shorted: string[];
  litBulbs: number;
  /** Sum of the current delivered by all batteries (A). */
  totalCurrent: number;
}

type Node = [number, number];

export function edgeEnds(edge: string): [Node, Node] {
  const m = /^([hv]):(\d),(\d)$/.exec(edge);
  if (!m) throw new Error(`bad edge id "${edge}"`);
  const x = Number(m[2]), y = Number(m[3]);
  return m[1] === 'h' ? [[x, y], [x + 1, y]] : [[x, y], [x, y + 1]];
}

export function edgeInBounds(edge: string, cols: number, rows: number): boolean {
  const [, [bx, by]] = edgeEnds(edge);
  return bx < cols && by < rows;
}

const key = ([x, y]: Node) => `${x},${y}`;
const conducts = (p: CircuitPart) => p.kind === 'wire' || (p.kind === 'switch' && p.closed === true);

class UnionFind {
  private parent = new Map<string, string>();
  find(a: string): string {
    if (!this.parent.has(a)) this.parent.set(a, a);
    let r = a;
    while (this.parent.get(r) !== r) r = this.parent.get(r)!;
    this.parent.set(a, r);
    return r;
  }
  union(a: string, b: string) { this.parent.set(this.find(a), this.find(b)); }
}

/** Solve A·x = b by Gaussian elimination with partial pivoting; null if singular. */
function solveLinear(A: number[][], b: number[]): number[] | null {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < 1e-12) return null;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = c + 1; r < n; r++) {
      const f = M[r][c] / M[c][c];
      if (f !== 0) for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  const x = new Array<number>(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = M[r][n];
    for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k];
    x[r] = s / M[r][r];
  }
  return x;
}

export function partOhms(p: CircuitPart): number {
  if (p.kind === 'bulb') return p.ohms ?? BULB_OHMS;
  if (p.kind === 'resistor') return p.ohms ?? DEFAULT_OHMS;
  return R_WIRE;
}

export function solveCircuit(board: CircuitBoard): CircuitSolution {
  const edges = Object.entries(board).filter(([, p]) => !(p.kind === 'switch' && !p.closed));
  const allBatteries = edges.filter(([, p]) => p.kind === 'battery');

  // Short circuits: battery terminals joined by wires / closed switches only.
  const wires = new UnionFind();
  for (const [e, p] of edges) if (conducts(p)) { const [a, b] = edgeEnds(e); wires.union(key(a), key(b)); }
  const shorted = allBatteries.filter(([e]) => { const [a, b] = edgeEnds(e); return wires.find(key(a)) === wires.find(key(b)); }).map(([, p]) => p.id);

  // Shorted batteries become a source with internal resistance (Norton form); the rest stay ideal sources.
  const isShorted = (p: CircuitPart) => shorted.includes(p.id);
  const batteries = allBatteries.filter(([, p]) => !isShorted(p));
  const terminals = (e: string, p: CircuitPart): [Node, Node] => { const [a, b] = edgeEnds(e); return (p.positive ?? 'a') === 'a' ? [a, b] : [b, a]; };

  // One ground node per connected piece of the circuit.
  const all = new UnionFind();
  const nodes = new Set<string>();
  for (const [e] of edges) { const [a, b] = edgeEnds(e); nodes.add(key(a)); nodes.add(key(b)); all.union(key(a), key(b)); }
  const grounds = new Set<string>();
  const seen = new Set<string>();
  for (const n of [...nodes].sort()) { const r = all.find(n); if (!seen.has(r)) { seen.add(r); grounds.add(n); } }
  const index = new Map<string, number>();
  for (const n of [...nodes].sort()) if (!grounds.has(n)) index.set(n, index.size);
  const n = index.size, m = batteries.length, size = n + m;

  const A = Array.from({ length: size }, () => new Array<number>(size).fill(0));
  const rhs = new Array<number>(size).fill(0);
  const at = (k: string) => index.get(k) ?? -1;
  for (const [e, p] of edges) {
    if (p.kind === 'battery' && !isShorted(p)) continue;
    const [a, b] = p.kind === 'battery' ? terminals(e, p) : edgeEnds(e), ia = at(key(a)), ib = at(key(b));
    const g = 1 / (p.kind === 'battery' ? R_SHORT_INTERNAL : partOhms(p));
    if (p.kind === 'battery') { const j = (p.volts ?? DEFAULT_VOLTS) * g; if (ia >= 0) rhs[ia] += j; if (ib >= 0) rhs[ib] -= j; }
    if (ia >= 0) A[ia][ia] += g;
    if (ib >= 0) A[ib][ib] += g;
    if (ia >= 0 && ib >= 0) { A[ia][ib] -= g; A[ib][ia] -= g; }
  }
  batteries.forEach(([e, p], k) => {
    const [plus, minus] = terminals(e, p);
    const ip = at(key(plus)), im = at(key(minus)), row = n + k;
    // Unknown x[row] = current flowing out of the + terminal into the circuit.
    if (ip >= 0) { A[ip][row] -= 1; A[row][ip] += 1; }
    if (im >= 0) { A[im][row] += 1; A[row][im] -= 1; }
    rhs[row] = p.volts ?? DEFAULT_VOLTS;
  });

  const x = size ? solveLinear(A, rhs) : [];
  const readings: Record<string, PartReading> = {};
  const empty = (e: string, p: CircuitPart): PartReading => ({ id: p.id, edge: e, kind: p.kind, current: 0, voltage: 0, power: 0, brightness: 0, lit: false });
  if (!x) {
    for (const [e, p] of Object.entries(board)) readings[p.id] = empty(e, p);
    return { status: 'invalid', readings, shorted, litBulbs: 0, totalCurrent: 0 };
  }
  const volt = (k: string) => { const i = at(k); return i >= 0 ? x[i] : 0; };
  let litBulbs = 0, totalCurrent = 0;
  const batteryIndex = new Map(batteries.map(([e], k) => [e, k]));
  for (const [e, p] of Object.entries(board)) {
    const r = empty(e, p);
    if (!(p.kind === 'switch' && !p.closed)) {
      const [a, b] = edgeEnds(e);
      const va = volt(key(a)), vb = volt(key(b));
      if (p.kind === 'battery') {
        const [plus, minus] = terminals(e, p);
        const V = p.volts ?? DEFAULT_VOLTS;
        const I = isShorted(p) ? (V - (volt(key(plus)) - volt(key(minus)))) / R_SHORT_INTERNAL : x[n + batteryIndex.get(e)!];
        r.current = I; r.voltage = Math.abs(va - vb); r.power = I * V;
        totalCurrent += I;
      } else {
        const I = (va - vb) / partOhms(p);
        r.current = I; r.voltage = Math.abs(va - vb); r.power = I * I * partOhms(p);
        if (p.kind === 'wire' || p.kind === 'switch') { r.voltage = 0; r.power = 0; }
        if (p.kind === 'bulb') {
          r.brightness = Math.min(1, r.power / BULB_RATED_WATTS);
          r.lit = r.brightness >= LIT_THRESHOLD;
          if (r.lit) litBulbs++;
        }
      }
    }
    readings[p.id] = r;
  }
  return { status: shorted.length ? 'short' : 'ok', readings, shorted, litBulbs, totalCurrent };
}

// ── Goals ────────────────────────────────────────────────────────────────────

export const CircuitMetricSchema = z.enum(['current', 'voltage', 'power', 'brightness', 'lit', 'litBulbs', 'totalCurrent']);
export type CircuitMetric = z.infer<typeof CircuitMetricSchema>;
const BOARD_METRICS: CircuitMetric[] = ['litBulbs', 'totalCurrent'];

export const CircuitGoalSchema = z.object({
  /** Part id (fixed part or slot). Not used by board-wide metrics (litBulbs, totalCurrent). */
  part: z.string().optional(),
  metric: CircuitMetricSchema,
  op: z.enum(['eq', 'ne', 'lt', 'lte', 'gt', 'gte']).default('eq'),
  /** For `lit`, 1 = lit and 0 = dark. Brightness is 0–1. */
  value: z.number(),
  /** Absolute tolerance for `eq`; default 0.5% of the value. */
  tolerance: z.number().nonnegative().optional(),
  /** Feedback shown when this goal is not met. */
  message: z.string().optional(),
}).refine((g) => BOARD_METRICS.includes(g.metric) || !!g.part, { message: 'this metric needs a part id' });
export type CircuitGoal = z.infer<typeof CircuitGoalSchema>;

const UNIT: Record<CircuitMetric, string> = { current: 'A', voltage: 'V', power: 'W', brightness: '%', lit: '', litBulbs: '', totalCurrent: 'A' };
const fmt = (v: number) => Number(v.toFixed(2)).toString();
const show = (metric: CircuitMetric, v: number) => fmt(metric === 'brightness' ? v * 100 : v);

function compare(a: number, op: CircuitGoal['op'], b: number, tol: number): boolean {
  switch (op) {
    case 'eq': return Math.abs(a - b) <= tol;
    case 'ne': return Math.abs(a - b) > tol;
    case 'lt': return a < b - 1e-9;
    case 'lte': return a <= b + tol;
    case 'gt': return a > b + 1e-9;
    case 'gte': return a >= b - tol;
  }
}
const OP_TEXT = { eq: 'exactly', ne: 'different from', lt: 'less than', lte: 'at most', gt: 'more than', gte: 'at least' } as const;

export interface CircuitGoalResult { goal: CircuitGoal; actual: number; met: boolean; feedback: FeedbackMessage }

export function measureCircuit(sol: CircuitSolution, goal: CircuitGoal): number {
  if (goal.metric === 'litBulbs') return sol.litBulbs;
  if (goal.metric === 'totalCurrent') return sol.totalCurrent;
  const r = goal.part ? sol.readings[goal.part] : undefined;
  if (!r) return NaN;
  switch (goal.metric) {
    case 'current': return Math.abs(r.current);
    case 'voltage': return r.voltage;
    case 'power': return Math.abs(r.power);
    case 'brightness': return r.brightness;
    case 'lit': return r.lit ? 1 : 0;
  }
}

/** Evaluate goals against a board. A short circuit or unsolvable board never meets any goal. */
export function evaluateCircuitGoals(goals: CircuitGoal[], board: CircuitBoard, names: Record<string, string> = {}): { met: boolean; solution: CircuitSolution; results: CircuitGoalResult[] } {
  const solution = solveCircuit(board);
  const nameOf = (id?: string) => (id ? names[id] || board[Object.keys(board).find((e) => board[e].id === id) ?? '']?.label || id : '');
  if (solution.status !== 'ok') {
    const text = solution.status === 'short'
      ? 'Short circuit! The battery\'s two ends are joined by wire alone, so current rushes around that path and skips everything else. Remove the shortcut.'
      : 'These batteries are working against each other, so the circuit can\'t settle. Rearrange them.';
    const feedback: FeedbackMessage = { code: solution.status === 'short' ? 'circuit.short' : 'circuit.invalid', params: {}, text };
    return { met: false, solution, results: goals.map((goal) => ({ goal, actual: NaN, met: false, feedback })) };
  }
  const results = goals.map((goal): CircuitGoalResult => {
    const actual = measureCircuit(solution, goal);
    const tol = goal.tolerance ?? Math.max(1e-6, 0.005 * Math.abs(goal.value));
    const met = Number.isFinite(actual) && compare(actual, goal.op, goal.value, tol);
    if (met) return { goal, actual, met, feedback: { code: 'correct', params: {}, text: '' } };
    if (goal.message) return { goal, actual, met, feedback: { code: 'custom', params: {}, text: goal.message } };
    const part = nameOf(goal.part);
    if (goal.metric === 'lit') {
      const shouldLight = goal.value >= 0.5;
      const text = shouldLight ? `Bulb ${part} isn't lit yet. Current needs a complete loop through it.` : `Bulb ${part} is lit, but it should be dark.`;
      return { goal, actual, met, feedback: { code: shouldLight ? 'circuit.dark' : 'circuit.lit', params: { part }, text } };
    }
    if (goal.metric === 'litBulbs') {
      const text = `${actual} bulb(s) lit; you need ${OP_TEXT[goal.op]} ${goal.value}.`;
      return { goal, actual, met, feedback: { code: 'circuit.litBulbs', params: { actual, op: goal.op, value: goal.value }, text } };
    }
    const unit = UNIT[goal.metric];
    const params = { part, metric: goal.metric, actual: show(goal.metric, actual), op: goal.op, value: show(goal.metric, goal.value), unit };
    if (goal.metric === 'totalCurrent') {
      const text = `The battery delivers ${params.actual} A, but it needs to be ${OP_TEXT[goal.op]} ${params.value} A.`;
      return { goal, actual, met, feedback: { code: 'circuit.total', params, text } };
    }
    const text = `${part}: the ${goal.metric} is ${params.actual} ${unit}, but it needs to be ${OP_TEXT[goal.op]} ${params.value} ${unit}.`;
    return { goal, actual, met, feedback: { code: 'circuit.metric', params, text } };
  });
  return { met: results.every((r) => r.met), solution, results };
}
