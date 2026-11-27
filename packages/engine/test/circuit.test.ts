import { describe, expect, it } from 'vitest';
import {
  applyParameter, checkAnswer, evaluateCircuitGoals, findCircuitSolution, getDescriptor, initialCircuitBoard, lintLesson,
  LessonSchema, QuestionSchema, solveCircuit, validateConfig, type CircuitBoard, type CircuitBoardConfig, type CircuitPart,
} from '../src';

const W = (id: string): CircuitPart => ({ id, kind: 'wire' });
/** A 4×3 rectangle loop: battery on the left (+ at top), parts along the top, wires elsewhere. */
function loop(top: Record<string, CircuitPart>, volts = 3): CircuitBoard {
  return {
    'v:0,0': { id: 'bat', kind: 'battery', volts }, 'v:0,1': W('w1'),
    'v:3,0': W('w4'), 'v:3,1': W('w5'), 'h:0,2': W('w6'), 'h:1,2': W('w7'), 'h:2,2': W('w8'),
    'h:0,0': W('w2'), 'h:1,0': W('w3'), 'h:2,0': W('w9'),
    ...top,
  };
}
const close = (a: number, b: number, d = 1e-4) => expect(Math.abs(a - b)).toBeLessThan(d);

describe('circuit solver (hand-computed values)', () => {
  it('one 6 Ω bulb on 3 V: I = V/R = 0.5 A, full brightness', () => {
    const s = solveCircuit(loop({ 'h:1,0': { id: 'A', kind: 'bulb' } }));
    expect(s.status).toBe('ok');
    close(s.readings.A.current, 0.5);
    close(s.readings.A.voltage, 3);
    close(s.readings.bat.current, 0.5);
    expect(s.readings.A.lit).toBe(true);
    close(s.readings.A.brightness, 1, 1e-3);
  });

  it('two bulbs in series share the voltage: 0.25 A each, 1.5 V each, quarter brightness', () => {
    const s = solveCircuit(loop({ 'h:1,0': { id: 'A', kind: 'bulb' }, 'h:2,0': { id: 'B', kind: 'bulb' } }));
    close(s.readings.A.current, 0.25); close(s.readings.B.current, 0.25);
    close(s.readings.A.voltage, 1.5);
    close(s.readings.A.brightness, 0.25, 1e-3);
    expect(s.litBulbs).toBe(2);
  });

  it('two bulbs in parallel each get the full voltage; the battery delivers the sum', () => {
    // Branch A on the right edge, branch B in the middle column.
    const board = loop({ 'v:3,0': { id: 'A', kind: 'bulb' }, 'v:2,0': { id: 'B', kind: 'bulb' }, 'v:2,1': W('w10') });
    const s = solveCircuit(board);
    close(s.readings.A.current, 0.5); close(s.readings.B.current, 0.5);
    close(s.totalCurrent, 1);
    close(s.readings.A.brightness, 1, 1e-3);
  });

  it("Ohm's law with resistors: 12 V across 4 Ω gives 3 A; current is the same everywhere in a series loop", () => {
    const s = solveCircuit(loop({ 'h:1,0': { id: 'R', kind: 'resistor', ohms: 4 } }, 12));
    close(s.readings.R.current, 3);
    close(Math.abs(s.readings.w6.current), 3);
    close(s.readings.bat.power, 36, 1e-3);
  });

  it('series resistors add: 2 Ω + 4 Ω on 6 V gives 1 A, with 2 V and 4 V across them', () => {
    const s = solveCircuit(loop({ 'h:1,0': { id: 'R1', kind: 'resistor', ohms: 2 }, 'h:2,0': { id: 'R2', kind: 'resistor', ohms: 4 } }, 6));
    close(s.readings.R1.current, 1); close(s.readings.R1.voltage, 2); close(s.readings.R2.voltage, 4);
  });

  it('a wire across a bulb bypasses it; a wire across the battery is a short circuit', () => {
    const bypass = loop({ 'h:1,0': { id: 'A', kind: 'bulb' }, 'v:1,0': W('x1'), 'h:1,1': W('x2'), 'v:2,0': W('x3') });
    const s = solveCircuit(bypass);
    expect(s.readings.A.lit).toBe(false);
    expect(s.status).toBe('short');
    expect(s.shorted).toEqual(['bat']);
  });

  it('an open switch breaks the loop; closing it lights the bulb', () => {
    const open = loop({ 'h:1,0': { id: 'A', kind: 'bulb' }, 'h:2,0': { id: 'S', kind: 'switch', closed: false } });
    expect(solveCircuit(open).readings.A.lit).toBe(false);
    expect(solveCircuit({ ...open, 'h:2,0': { id: 'S', kind: 'switch', closed: true } }).readings.A.lit).toBe(true);
  });

  it('an incomplete loop carries no current; flipping the battery reverses the current', () => {
    const gap = loop({ 'h:1,0': { id: 'A', kind: 'bulb' } });
    delete gap['v:3,0'];
    expect(solveCircuit(gap).readings.A.current).toBe(0);
    const flipped = solveCircuit(loop({ 'h:1,0': { id: 'A', kind: 'bulb' }, 'v:0,0': { id: 'bat', kind: 'battery', volts: 3, positive: 'b' } }));
    close(flipped.readings.A.current, -0.5);
    close(flipped.readings.bat.current, 0.5);
  });

  it('two batteries in series add their voltages', () => {
    const s = solveCircuit(loop({ 'h:1,0': { id: 'A', kind: 'bulb' }, 'v:0,1': { id: 'bat2', kind: 'battery', volts: 3 } }));
    close(s.readings.A.current, 1);
  });
});

describe('circuit goals and answers', () => {
  const goals = QuestionSchema.parse({ kind: 'circuit', prompt: 'p', goals: [{ part: 'A', metric: 'current', value: 0.5 }] });
  it('meets a current goal within tolerance and explains a miss', () => {
    if (goals.kind !== 'circuit') throw new Error();
    expect(checkAnswer(goals, { kind: 'circuit', board: loop({ 'h:1,0': { id: 'A', kind: 'bulb', label: 'A' } }) }).correct).toBe(true);
    const r = checkAnswer(goals, { kind: 'circuit', board: loop({ 'h:1,0': { id: 'A', kind: 'bulb', label: 'A' }, 'h:2,0': { id: 'B', kind: 'bulb' } }) });
    expect(r.correct).toBe(false);
    expect(r.message).toMatchObject({ code: 'circuit.metric', params: { part: 'A', metric: 'current', actual: '0.25', op: 'eq', value: '0.5', unit: 'A' } });
  });
  it('a short circuit never passes and is tagged as a misconception', () => {
    if (goals.kind !== 'circuit') throw new Error();
    const r = checkAnswer(goals, { kind: 'circuit', board: loop({ 'h:1,0': { id: 'A', kind: 'bulb' }, 'v:1,0': W('x1'), 'h:1,1': W('x2'), 'v:2,0': W('x3') }) });
    expect(r.correct).toBe(false);
    expect(r.message.code).toBe('circuit.short');
    expect(r.misconceptions).toContain('short-circuit');
  });
  it('lit / litBulbs / totalCurrent goals', () => {
    const board = loop({ 'v:3,0': { id: 'A', kind: 'bulb' }, 'v:2,0': { id: 'B', kind: 'bulb' }, 'v:2,1': W('w10') });
    const r = evaluateCircuitGoals([
      { part: 'B', metric: 'lit', op: 'eq', value: 1 },
      { metric: 'litBulbs', op: 'gte', value: 2 },
      { metric: 'totalCurrent', op: 'eq', value: 1 },
    ], board);
    expect(r.met).toBe(true);
    const miss = evaluateCircuitGoals([{ metric: 'litBulbs', op: 'gte', value: 3 }], board);
    expect(miss.results[0].feedback).toMatchObject({ code: 'circuit.litBulbs', params: { actual: 2, op: 'gte', value: 3 } });
  });
  it('rejects goals on per-part metrics without a part', () => {
    expect(() => QuestionSchema.parse({ kind: 'circuit', prompt: 'p', goals: [{ metric: 'current', value: 1 }] })).toThrow();
  });
});

describe('circuitBoard interactive', () => {
  const config = {
    cols: 4, rows: 3,
    parts: [
      { id: 'bat', at: 'v:0,0', kind: 'battery', volts: 3 }, { id: 'w1', at: 'v:0,1', kind: 'wire' },
      { id: 'A', label: 'A', at: 'h:1,0', kind: 'bulb' }, { id: 'S', at: 'v:3,0', kind: 'switch', toggleable: true },
      { id: 'w5', at: 'v:3,1', kind: 'wire' }, { id: 'w6', at: 'h:0,2', kind: 'wire' }, { id: 'w7', at: 'h:1,2', kind: 'wire' }, { id: 'w8', at: 'h:2,2', kind: 'wire' },
      { id: 'w2', at: 'h:0,0', kind: 'wire' },
    ],
    slots: [{ id: 'gap', at: 'h:2,0', options: [{ kind: 'wire' }, { kind: 'bulb' }] }],
  };
  it('validates config: duplicate edges, out-of-bounds edges, bad adjustables', () => {
    expect(validateConfig('circuitBoard', config).ok).toBe(true);
    expect(validateConfig('circuitBoard', { ...config, slots: [{ id: 'gap', at: 'h:1,0', options: [{ kind: 'wire' }] }] }).ok).toBe(false);
    expect(validateConfig('circuitBoard', { ...config, slots: [{ id: 'gap', at: 'h:3,0', options: [{ kind: 'wire' }] }] }).ok).toBe(false);
    expect(validateConfig('circuitBoard', { ...config, adjustable: [{ part: 'A', property: 'volts', min: 1, max: 9 }] }).ok).toBe(false);
  });
  it('starts with slots empty and switches open; the lint solver finds the reachable answer', () => {
    const v = validateConfig<CircuitBoardConfig>('circuitBoard', config);
    if (!v.ok) throw new Error(v.errors.join());
    const board = initialCircuitBoard(v.config);
    expect(board['h:2,0']).toBeUndefined();
    expect(board['v:3,0'].closed).toBe(false);
    const q = QuestionSchema.parse({ kind: 'circuit', prompt: 'p', goals: [{ part: 'A', metric: 'brightness', op: 'gte', value: 0.99 }] });
    if (q.kind !== 'circuit') throw new Error();
    const sol = findCircuitSolution(v.config, q)!;
    expect(sol['h:2,0'].kind).toBe('wire');
    expect(sol['v:3,0'].closed).toBe(true);
    const impossible = QuestionSchema.parse({ kind: 'circuit', prompt: 'p', goals: [{ part: 'A', metric: 'current', value: 2 }] });
    if (impossible.kind !== 'circuit') throw new Error();
    expect(findCircuitSolution(v.config, impossible)).toBeNull();
  });
  it('lint flags unknown goal parts and unsolvable circuit challenges', () => {
    const lesson = LessonSchema.parse({ id: 'l', title: 't', steps: [{
      id: 's', type: 'question', stage: 'practice', interactive: { kind: 'circuitBoard', config },
      question: { kind: 'circuit', prompt: 'p', goals: [{ part: 'Z', metric: 'lit', value: 1 }] },
    }] });
    expect(lintLesson(lesson).map((i) => i.message)).toEqual(expect.arrayContaining(['goal refers to unknown part "Z"', 'no reachable circuit satisfies every goal']));
  });
  it('adjusts a battery voltage through a validated parameter and describes the state in words', () => {
    const cfg = { ...config, adjustable: [{ part: 'bat', property: 'volts', label: 'Battery', min: 1, max: 12 }] };
    const v = validateConfig<CircuitBoardConfig>('circuitBoard', cfg);
    if (!v.ok) throw new Error(v.errors.join());
    const d = getDescriptor('circuitBoard')!;
    const s0 = d.initialState(v.config);
    const r = applyParameter('circuitBoard', v.config, s0, 'bat.volts', 40);
    if (!r.ok) throw new Error(r.error);
    expect(r.applied).toBe(12);
    expect((r.state.board as CircuitBoard)['v:0,0'].volts).toBe(12);
    expect(d.describeState(v.config, s0)).toContain('Switch is open');
  });
});
