import { describe, expect, it } from 'vitest';
import { checkAnswer } from '@barruu/engine';
import {
  SKILLS, SUBJECTS, ITEMS, validateSkillGraph, getSkill, estimateAbility, startPlacement, nextItem, recordResponse,
  isFinished, placementResult, answerItem, bandOf, gradeToTheta, thetaToGrade, type Item,
} from '@barruu/curriculum';

describe('skill map', () => {
  it('is a valid DAG whose prerequisites are never taught later', () => {
    expect(validateSkillGraph()).toEqual([]);
    expect(validateSkillGraph([{ id: 'a.x', title: 'x', subject: 'Physics', grade: 9, prerequisites: ['a.y'] }, { id: 'a.y', title: 'y', subject: 'Physics', grade: 10, prerequisites: ['a.x'] }]).length).toBeGreaterThan(0);
  });
  it('covers every subject at grades 9–12', () => {
    for (const s of SUBJECTS) expect(SKILLS.filter((k) => k.subject === s && k.grade >= 9 && k.grade <= 12).length, s).toBeGreaterThanOrEqual(4);
  });
});

describe('item bank', () => {
  it('has unique ids, known skills, and enough items per subject', () => {
    expect(new Set(ITEMS.map((i) => i.id)).size).toBe(ITEMS.length);
    for (const it of ITEMS) expect(getSkill(it.skill), it.id).toBeDefined();
    for (const s of SUBJECTS) expect(ITEMS.filter((i) => getSkill(i.skill)!.subject === s).length, s).toBeGreaterThanOrEqual(5);
  });

  it('every choice item has exactly one correct option', () => {
    for (const it of ITEMS) if (it.question.kind === 'choice') expect(it.question.options.filter((o) => o.correct).length, it.id).toBe(1);
  });

  it('formula-based answers match an independent recomputation', () => {
    const answer = (id: string) => { const q = ITEMS.find((i) => i.id === id)!.question; if (q.kind !== 'numeric') throw new Error(id); return q.answer; };
    expect(answer('ph-kin-v')).toBe(2 * 5);
    expect(answer('ph-kin-d')).toBe(0.5 * 2 * 5 ** 2);
    expect(answer('ph-ke')).toBe(0.5 * 2 * 3 ** 2);
    expect(Math.abs(answer('ph-drop') - Math.sqrt(2 * 9.8 * 5))).toBeLessThan(0.05);
    expect(answer('ph-mom')).toBe((2 * 3) / (2 + 1));
    expect(answer('ph-parallel')).toBe(1 / (1 / 6 + 1 / 6));
    expect(answer('ph-proj')).toBe(Math.sqrt((2 * 20) / 10));
    expect(answer('en-torque')).toBe((40 * 1.5) / 30);
    expect(answer('en-led')).toBeCloseTo((9 - 2) / 0.02, 9);
    expect(answer('en-stress')).toBeCloseTo(1000 / 0.01, 6);
    expect(answer('ma-units')).toBeCloseTo((72 * 1000) / 3600, 9);
    expect(answer('ma-trig')).toBeCloseTo(10 * Math.sin(Math.PI / 6), 9);
    expect(answer('ma-vec')).toBe(Math.hypot(5, 12));
    expect(answer('cs-bin')).toBe(parseInt('1011', 2));
    expect(answer('cs-halving')).toBe(Math.log2(1024));
    expect(answer('cs-bits')).toBe(2 ** 8);
    expect(answer('ch-ph')).toBe(-Math.log10(1e-3));
  });

  it('answers are gradable by the shared engine', () => {
    const it = ITEMS.find((i) => i.id === 'ma-lineq')!;
    expect(checkAnswer(it.question, { kind: 'numeric', value: '5' }).correct).toBe(true);
    expect(checkAnswer(it.question, { kind: 'numeric', value: '6' }).correct).toBe(false);
  });
});

describe('ability estimation', () => {
  it('maps grades and thetas consistently', () => {
    expect(thetaToGrade(gradeToTheta(11))).toBeCloseTo(11);
    expect(bandOf(8)).toBe('below'); expect(bandOf(9.4)).toBe(9); expect(bandOf(11.6)).toBe(12); expect(bandOf(13)).toBe('beyond');
  });
  it('EAP moves up with correct answers, down with wrong ones, and is finite for all-correct runs', () => {
    const base = estimateAbility([]);
    expect(base.theta).toBeCloseTo(0, 5);
    const up = estimateAbility([{ b: 0, correct: true }, { b: 1, correct: true }, { b: 2, correct: true }]);
    const down = estimateAbility([{ b: 0, correct: false }, { b: -1, correct: false }]);
    expect(up.theta).toBeGreaterThan(0.5);
    expect(down.theta).toBeLessThan(-0.5);
    expect(Number.isFinite(up.theta)).toBe(true);
    expect(up.se).toBeLessThan(base.se);
  });
});

/** Deterministic PRNG for simulations. */
function rng(seed: number) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

function simulate(trueTheta: number, seed: number) {
  const rand = rng(seed);
  let s = startPlacement();
  let guard = 0;
  while (!isFinished(s) && guard++ < 50) {
    const it = nextItem(s)!;
    const correct = rand() < 1 / (1 + Math.exp(-(trueTheta - it.b)));
    s = recordResponse(s, it.id, correct);
  }
  return { state: s, result: placementResult(s) };
}

describe('adaptive placement (simulated learners)', () => {
  const levels = [gradeToTheta(9), gradeToTheta(10), gradeToTheta(11), gradeToTheta(12)];

  it('recovers simulated ability within ~half a grade on average and orders learners correctly', () => {
    const means: number[] = [];
    for (const th of levels) {
      let err = 0, sum = 0;
      for (let k = 0; k < 150; k++) { const { result } = simulate(th, 1000 * k + Math.round(th * 100)); err += Math.abs(result.theta - th); sum += result.theta; }
      means.push(sum / 150);
      expect(err / 150, `mean abs error at θ=${th}`).toBeLessThan(0.6);
    }
    for (let i = 1; i < means.length; i++) expect(means[i]).toBeGreaterThan(means[i - 1]);
  });

  it('respects stopping rules and never repeats an item', () => {
    for (let k = 0; k < 40; k++) {
      const { state } = simulate(gradeToTheta(10.5), k);
      expect(state.responses.length).toBeGreaterThanOrEqual(state.config.minItems);
      expect(state.responses.length).toBeLessThanOrEqual(state.config.maxItems);
      expect(new Set(state.responses.map((r) => r.itemId)).size).toBe(state.responses.length);
    }
  });

  it('balances subjects and honours the learner\'s subject choice', () => {
    const s = startPlacement({ subjects: ['Physics', 'Chemistry'], maxItems: 10, minItems: 10 });
    let st = s;
    while (!isFinished(st)) st = recordResponse(st, nextItem(st)!.id, true);
    const subjects = st.responses.map((r) => getSkill(ITEMS.find((i) => i.id === r.itemId)!.skill)!.subject);
    expect(new Set(subjects)).toEqual(new Set(['Physics', 'Chemistry']));
    expect(Math.abs(subjects.filter((x) => x === 'Physics').length - subjects.filter((x) => x === 'Chemistry').length)).toBeLessThanOrEqual(2);
  });

  it('produces skill mastery seeds and prerequisite-respecting recommendations', () => {
    const strong = simulate(gradeToTheta(12.3), 7).result;
    const weak = simulate(gradeToTheta(8.8), 7).result;
    expect(strong.grade).toBeGreaterThan(weak.grade);
    expect(strong.skillMastery['math.linear-equations']).toBeGreaterThan(weak.skillMastery['math.linear-equations']);
    for (const r of [strong, weak]) for (const id of r.recommendedSkills) {
      for (const pre of getSkill(id)!.prerequisites) expect(r.skillMastery[pre], `${id} needs ${pre}`).toBeGreaterThanOrEqual(0.6);
    }
  });

  it('treats "I don\'t know yet" as incorrect evidence and rejects unreadable answers', () => {
    const s0 = startPlacement();
    const item = nextItem(s0) as Item;
    const skipped = answerItem(s0, item, 'skip');
    expect(skipped.state.responses[0]).toMatchObject({ correct: false, skipped: true });
    const bad = answerItem(s0, ITEMS.find((i) => i.question.kind === 'numeric')!, { kind: 'numeric', value: 'abc' });
    expect(bad.invalid).toBe(true);
    expect(bad.state.responses).toHaveLength(0);
  });
});
