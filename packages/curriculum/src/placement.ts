/**
 * Adaptive level detection ("Find your level").
 *
 * Model: Rasch / 1-parameter IRT. P(correct | θ, b) = 1 / (1 + e^-(θ − b)).
 * Estimation: EAP (posterior mean) on a grid with a N(μ0, 1) prior, so the
 * estimate is always defined — even after a single answer or all-correct runs.
 * Selection: most informative item at the current estimate (p(1−p)), balanced
 * across the learner's chosen subjects, never repeating a skill back-to-back.
 * Stopping: after `maxItems`, or once `minItems` are answered and the standard
 * error is below `targetSE`.
 *
 * "I don't know yet" is recorded as incorrect evidence: honest, and it keeps
 * the test short for learners who haven't met a topic.
 *
 * Pure and deterministic — no randomness, no I/O — so every runtime places
 * a learner identically for the same answers.
 */
import { checkAnswer, type Answer } from '@barruu/engine';
import { ITEMS, gradeToTheta, thetaToGrade, type Item } from './items';
import { SKILLS, getSkill, type Subject } from './skills';

export interface PlacementConfig {
  subjects: Subject[];
  minItems: number;
  maxItems: number;
  targetSE: number;
  /** Prior mean (default: grade 10). */
  priorMean: number;
}

export const DEFAULT_PLACEMENT: PlacementConfig = { subjects: ['Mathematics', 'Physics', 'Chemistry', 'Engineering', 'Computer Science'], minItems: 8, maxItems: 15, targetSE: 0.5, priorMean: gradeToTheta(10) };

export interface PlacementResponse { itemId: string; correct: boolean; skipped: boolean }

export interface PlacementState { config: PlacementConfig; responses: PlacementResponse[] }

const GRID: number[] = Array.from({ length: 161 }, (_, i) => -4 + i * 0.05);
const p = (theta: number, b: number) => 1 / (1 + Math.exp(-(theta - b)));

export function startPlacement(config: Partial<PlacementConfig> = {}): PlacementState {
  const c = { ...DEFAULT_PLACEMENT, ...config };
  if (c.subjects.length === 0) c.subjects = [...DEFAULT_PLACEMENT.subjects];
  return { config: c, responses: [] };
}

/** EAP estimate and posterior SD for a set of (item difficulty, correct) observations. */
export function estimateAbility(obs: { b: number; correct: boolean }[], priorMean = 0, priorSD = 1): { theta: number; se: number } {
  let sum = 0, mean = 0;
  const w = GRID.map((t) => {
    let l = Math.exp(-0.5 * ((t - priorMean) / priorSD) ** 2);
    for (const o of obs) { const pr = p(t, o.b); l *= o.correct ? pr : 1 - pr; }
    return l;
  });
  for (let i = 0; i < GRID.length; i++) { sum += w[i]; mean += w[i] * GRID[i]; }
  mean /= sum;
  let v = 0;
  for (let i = 0; i < GRID.length; i++) v += w[i] * (GRID[i] - mean) ** 2;
  return { theta: mean, se: Math.sqrt(v / sum) };
}

function itemById(id: string, items: Item[]): Item {
  const it = items.find((x) => x.id === id);
  if (!it) throw new Error(`unknown placement item ${id}`);
  return it;
}

function subjectOf(item: Item): Subject { return getSkill(item.skill)!.subject; }

export function currentEstimate(state: PlacementState, items: Item[] = ITEMS) {
  return estimateAbility(state.responses.map((r) => ({ b: itemById(r.itemId, items).b, correct: r.correct })), state.config.priorMean);
}

export function isFinished(state: PlacementState, items: Item[] = ITEMS): boolean {
  const n = state.responses.length;
  if (n >= state.config.maxItems) return true;
  if (n >= state.config.minItems && currentEstimate(state, items).se <= state.config.targetSE) return true;
  return nextItem(state, items) === null;
}

export function nextItem(state: PlacementState, items: Item[] = ITEMS): Item | null {
  const { config, responses } = state;
  if (responses.length >= config.maxItems) return null;
  const asked = new Set(responses.map((r) => r.itemId));
  const askedSkills = responses.map((r) => itemById(r.itemId, items).skill);
  const lastSkill = askedSkills[askedSkills.length - 1];
  const pool = items.filter((it) => !asked.has(it.id) && config.subjects.includes(subjectOf(it)));
  if (pool.length === 0) return null;
  const { theta } = currentEstimate(state, items);
  // Warm-up: the first two items are slightly easier than the current estimate.
  const target = responses.length < 2 ? theta - 0.6 : theta;
  const counts = new Map<Subject, number>(config.subjects.map((s) => [s, 0]));
  for (const r of responses) { const s = subjectOf(itemById(r.itemId, items)); counts.set(s, (counts.get(s) ?? 0) + 1); }
  const score = (it: Item) => {
    const pr = p(target, it.b);
    const info = pr * (1 - pr);
    const balance = 0.06 * (counts.get(subjectOf(it)) ?? 0);
    const repeat = it.skill === lastSkill ? 0.2 : askedSkills.includes(it.skill) ? 0.05 : 0;
    return info - balance - repeat;
  };
  return pool.reduce((best, it) => (score(it) > score(best) ? it : best));
}

export function recordResponse(state: PlacementState, itemId: string, correct: boolean, skipped = false): PlacementState {
  return { ...state, responses: [...state.responses, { itemId, correct: skipped ? false : correct, skipped }] };
}

/** Grade an item through the shared engine and record it. */
export function answerItem(state: PlacementState, item: Item, answer: Answer | 'skip'): { state: PlacementState; correct: boolean; invalid: boolean } {
  if (answer === 'skip') return { state: recordResponse(state, item.id, false, true), correct: false, invalid: false };
  const r = checkAnswer(item.question, answer);
  if (r.invalid) return { state, correct: false, invalid: true };
  return { state: recordResponse(state, item.id, r.correct), correct: r.correct, invalid: false };
}

export interface SubjectEstimate { subject: Subject; theta: number; se: number; grade: number; answered: number }

export interface PlacementResult {
  theta: number;
  se: number;
  /** Continuous grade estimate (e.g. 10.6). */
  grade: number;
  /** Display band: 'below' (< 9), 9, 10, 11, 12 or 'beyond' (> 12). */
  band: 'below' | 9 | 10 | 11 | 12 | 'beyond';
  bySubject: SubjectEstimate[];
  /** Initial mastery estimate (0–1) per curriculum skill, to seed the learner model. */
  skillMastery: Record<string, number>;
  /** Next skills to learn: not yet known, prerequisites known, easiest first. */
  recommendedSkills: string[];
  answered: number;
}

export function bandOf(grade: number): PlacementResult['band'] {
  if (grade < 8.5) return 'below';
  if (grade >= 12.5) return 'beyond';
  return Math.min(12, Math.max(9, Math.round(grade))) as 9 | 10 | 11 | 12;
}

export function placementResult(state: PlacementState, items: Item[] = ITEMS): PlacementResult {
  const overall = currentEstimate(state, items);
  const bySubject: SubjectEstimate[] = state.config.subjects.map((subject) => {
    const obs = state.responses.filter((r) => subjectOf(itemById(r.itemId, items)) === subject)
      .map((r) => ({ b: itemById(r.itemId, items).b, correct: r.correct }));
    // Shrink towards the overall estimate: few answers per subject → stay close to overall.
    const e = estimateAbility(obs, overall.theta, 0.8);
    return { subject, theta: e.theta, se: e.se, grade: thetaToGrade(e.theta), answered: obs.length };
  });
  const thetaFor = (s: Subject) => bySubject.find((x) => x.subject === s)?.theta ?? overall.theta;
  const skillMastery: Record<string, number> = {};
  for (const skill of SKILLS) {
    let m = 1 / (1 + Math.exp(-1.7 * (thetaFor(skill.subject) - gradeToTheta(skill.grade))));
    // Direct evidence on this skill overrides the model, in the observed direction.
    for (const r of state.responses) {
      if (itemById(r.itemId, items).skill !== skill.id) continue;
      m = r.correct ? Math.max(m, 0.8) : Math.min(m, 0.35);
    }
    skillMastery[skill.id] = Number(Math.min(0.95, Math.max(0.05, m)).toFixed(3));
  }
  const known = (id: string) => (skillMastery[id] ?? 0) >= 0.6;
  const recommendedSkills = SKILLS
    .filter((s) => state.config.subjects.includes(s.subject))
    .filter((s) => skillMastery[s.id] < 0.7 && s.prerequisites.every(known))
    .sort((a, b) => a.grade - b.grade || skillMastery[b.id] - skillMastery[a.id])
    .slice(0, 6)
    .map((s) => s.id);
  const grade = thetaToGrade(overall.theta);
  return { theta: overall.theta, se: overall.se, grade, band: bandOf(grade), bySubject, skillMastery, recommendedSkills, answered: state.responses.length };
}
