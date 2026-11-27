import { describe, expect, it } from 'vitest';
import {
  checkAnswer, courseLessons, findCircuitSolution, initialCircuitBoard, placePart, solveCircuit, validateConfig,
  type CircuitBoard, type CircuitBoardConfig, type Question, type Step,
} from '@barruu/engine';
import { findCourse } from '../src/catalog';

const course = findCourse('electric-circuits')!;
const step = (lessonId: string, stepId: string): Step => courseLessons(course).find((l) => l.id === lessonId)!.steps.find((s) => s.id === stepId)!;
function setup(lessonId: string, stepId: string) {
  const s = step(lessonId, stepId);
  if (s.type !== 'question' && s.type !== 'interactive') throw new Error('no interactive');
  const v = validateConfig<CircuitBoardConfig>('circuitBoard', s.interactive!.config);
  if (!v.ok) throw new Error(v.errors.join());
  return { config: v.config, question: s.type === 'question' ? s.question : undefined };
}
/** Fill slots by id with an option index (or -1 for empty). */
function fill(config: CircuitBoardConfig, choice: Record<string, number>, closeSwitches = false): CircuitBoard {
  const b = initialCircuitBoard(config);
  for (const s of config.slots) {
    delete b[s.at];
    const i = choice[s.id] ?? -1;
    if (i >= 0) b[s.at] = placePart(s.id, s.label, s.options[i]);
  }
  if (closeSwitches) for (const e of Object.keys(b)) if (b[e].kind === 'switch') b[e] = { ...b[e], closed: true };
  return b;
}
const answer = (q: Question | undefined, board: CircuitBoard) => checkAnswer(q!, { kind: 'circuit', board });

describe('Electric Circuits lessons are physically right', () => {
  it('lesson 1: the loop lights only when complete; the switch must be closed', () => {
    const { config } = setup('complete-the-loop', 'loop');
    expect(solveCircuit(fill(config, { g1: 0, g2: 0 })).readings.A.lit).toBe(false);
    expect(solveCircuit(fill(config, { g1: 0, g2: 0, g3: 0 })).readings.A.lit).toBe(true);
    const sw = setup('complete-the-loop', 'switch');
    expect(answer(sw.question, fill(sw.config, { g1: 0 })).correct).toBe(false);
    expect(answer(sw.question, fill(sw.config, { g1: 0 }, true)).correct).toBe(true);
  });

  it('lesson 1: filling the trap gap is a short circuit; the only solution leaves it empty', () => {
    const { config, question } = setup('complete-the-loop', 'trap');
    const all = answer(question, fill(config, { g1: 0, g2: 0, g3: 0 }));
    expect(all.correct).toBe(false);
    expect(all.message.code).toBe('circuit.short');
    expect(answer(question, fill(config, { g1: 0, g3: 0 })).correct).toBe(true);
    const sol = findCircuitSolution(config, question as Extract<Question, { kind: 'circuit' }>)!;
    expect(sol['h:1,1']).toBeUndefined();
  });

  it('lesson 1: closing the bypass switch puts the bulb out', () => {
    const { config } = setup('complete-the-loop', 'bypass');
    expect(solveCircuit(initialCircuitBoard(config)).readings.A.lit).toBe(true);
    const shorted = solveCircuit(fill(config, {}, true));
    expect(shorted.status).toBe('short');
    expect(shorted.readings.A.lit).toBe(false);
  });

  it('lesson 2: series numbers match the solver (0.5 A alone, 0.25 A in both bulbs)', () => {
    const { config, question } = setup('series-and-parallel', 'series-current');
    expect(solveCircuit(fill(config, { B: 0 })).readings.A.current).toBeCloseTo(0.5, 4);
    const two = solveCircuit(fill(config, { B: 1 }));
    expect(two.readings.A.current).toBeCloseTo(0.25, 4);
    // The "is current used up?" question: the correct option must match the meters (same current in A and B).
    expect(two.readings.B.current).toBeCloseTo(two.readings.A.current, 6);
    expect(question?.kind === 'choice' && question.options.find((o) => o.correct)?.id).toBe('same');
  });

  it('lesson 2: only "one bulb + one wire" in the middle branch passes the parallel challenge', () => {
    const { config, question } = setup('series-and-parallel', 'parallel');
    expect(answer(question, fill(config, { m1: 1, m2: 0 })).correct).toBe(true);
    expect(answer(question, fill(config, { m1: 0, m2: 1 })).correct).toBe(true);
    const both = answer(question, fill(config, { m1: 1, m2: 1 })); // two dim bulbs in the branch
    expect(both.correct).toBe(false);
    expect(both.message.text).toMatch(/Three bulbs are lit/);
    expect(answer(question, fill(config, { m1: 0, m2: 0 })).message.code).toBe('circuit.short');
    expect(answer(question, fill(config, { m1: 1 })).message.text).toMatch(/Only bulb A is lit/); // branch left open
    expect(solveCircuit(fill(config, { m1: 1, m2: 0 })).totalCurrent).toBeCloseTo(1, 4); // the assess answer
  });

  it('lesson 3: the design challenges hide the meter, so they need R = V/I rather than trial and error', () => {
    expect(setup('ohms-law', 'design').config.showReadings).toBe(false);
    expect(setup('ohms-law', 'two').config.showReadings).toBe(false);
  });

  it("lesson 3: Ohm's law values (6 V / 4 Ω lab, 6 V / 3 Ω, 12 Ω for 0.5 A, 8 Ω total for 0.75 A)", () => {
    expect(solveCircuit(initialCircuitBoard(setup('ohms-law', 'lab').config)).readings.R.current).toBeCloseTo(1.5, 4);
    expect(solveCircuit(initialCircuitBoard(setup('ohms-law', 'calc').config)).readings.R.current).toBeCloseTo(2, 4);
    const pick = setup('ohms-law', 'design');
    const passing = pick.config.slots[0].options.map((_, i) => i).filter((i) => answer(pick.question, fill(pick.config, { R: i })).correct);
    expect(passing.map((i) => pick.config.slots[0].options[i].ohms)).toEqual([12]);
    const two = setup('ohms-law', 'two');
    const ohms = [2, 4, 6];
    const pairs: string[] = [];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (answer(two.question, fill(two.config, { R1: i, R2: j })).correct) pairs.push(`${ohms[i]}+${ohms[j]}`);
    expect(pairs).toEqual(['2+6', '4+4', '6+2']);
  });
});
