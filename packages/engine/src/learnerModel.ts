/**
 * Evidence-based learner model.
 *
 * Mastery is estimated per concept with Bayesian Knowledge Tracing (Corbett &
 * Anderson, 1995): a hidden "knows it" probability updated after each piece of
 * evidence, accounting for guessing and slipping. Evidence is weighted (hints,
 * repeated attempts) so independent success counts more than assisted success.
 *
 * Deliberately NOT modelled: fixed "learning styles" (visual/auditory/...) —
 * there is no good evidence that matching instruction to them improves
 * learning. Personalisation here is driven by what the learner has shown they
 * can and cannot do, plus explicit preferences they set themselves.
 */

export interface BktParams { pInit: number; pLearn: number; pGuess: number; pSlip: number; }

export const DEFAULT_BKT: BktParams = { pInit: 0.2, pLearn: 0.15, pGuess: 0.2, pSlip: 0.1 };

export const MASTERY_THRESHOLD = 0.85;

export interface ConceptMastery {
  conceptId: string;
  pKnown: number;
  attempts: number;
  correct: number;
  lastPracticedAt: number;
}

export interface MisconceptionRecord { id: string; count: number; lastSeenAt: number; }

export interface LearnerPreferences {
  /** Learner-chosen depth: more intuition or more formal rigour. */
  track: 'intuitive' | 'balanced' | 'rigorous';
  /** How much the tutor should volunteer vs. wait to be asked. */
  guidance: 'minimal' | 'standard' | 'supportive';
  reducedMotion: boolean;
  language: string;
}

export interface LearnerProfile {
  version: 1;
  concepts: Record<string, ConceptMastery>;
  misconceptions: Record<string, MisconceptionRecord>;
  preferences: LearnerPreferences;
  goals: string[];
}

export function createProfile(): LearnerProfile {
  return {
    version: 1,
    concepts: {},
    misconceptions: {},
    preferences: { track: 'balanced', guidance: 'standard', reducedMotion: false, language: 'en' },
    goals: [],
  };
}

/**
 * One BKT update. `weight` ∈ (0,1] blends the posterior with the prior so weak
 * evidence (answer reached after all hints) moves the estimate less.
 */
export function bktUpdate(pKnown: number, correct: boolean, weight = 1, p: BktParams = DEFAULT_BKT): number {
  const posterior = correct
    ? (pKnown * (1 - p.pSlip)) / (pKnown * (1 - p.pSlip) + (1 - pKnown) * p.pGuess)
    : (pKnown * p.pSlip) / (pKnown * p.pSlip + (1 - pKnown) * (1 - p.pGuess));
  const blended = pKnown + weight * (posterior - pKnown);
  const learned = blended + (1 - blended) * p.pLearn * (correct ? weight : 0.5 * weight);
  return Math.min(0.999, Math.max(0.001, learned));
}

export interface Evidence {
  concepts: string[];
  correct: boolean;
  weight: number;
  misconceptions?: string[];
  at?: number;
}

/** Pure: returns a new profile with the evidence applied. */
export function recordEvidence(profile: LearnerProfile, ev: Evidence): LearnerProfile {
  const at = ev.at ?? Date.now();
  const concepts = { ...profile.concepts };
  for (const id of ev.concepts) {
    const prev = concepts[id] ?? { conceptId: id, pKnown: DEFAULT_BKT.pInit, attempts: 0, correct: 0, lastPracticedAt: 0 };
    concepts[id] = {
      ...prev,
      pKnown: bktUpdate(prev.pKnown, ev.correct, ev.weight),
      attempts: prev.attempts + 1,
      correct: prev.correct + (ev.correct ? 1 : 0),
      lastPracticedAt: at,
    };
  }
  const misconceptions = { ...profile.misconceptions };
  for (const m of ev.misconceptions ?? []) {
    const prev = misconceptions[m] ?? { id: m, count: 0, lastSeenAt: 0 };
    misconceptions[m] = { ...prev, count: prev.count + 1, lastSeenAt: at };
  }
  return { ...profile, concepts, misconceptions };
}

const DAY = 86_400_000;

/**
 * Mastery adjusted for forgetting. Retention decays with time since practice;
 * stronger mastery decays more slowly. Used for review scheduling, not for
 * erasing evidence.
 */
export function effectiveMastery(m: ConceptMastery | undefined, now = Date.now()): number {
  if (!m) return 0;
  const days = Math.max(0, (now - m.lastPracticedAt) / DAY);
  const halfLife = 2 + 28 * m.pKnown * m.pKnown; // 2 days for shaky, ~30 for solid knowledge
  return m.pKnown * Math.pow(0.5, days / halfLife / 3);
}

export function isMastered(m: ConceptMastery | undefined, now = Date.now()): boolean {
  return effectiveMastery(m, now) >= MASTERY_THRESHOLD;
}

/** Concepts that were learned but are fading — candidates for review. */
export function conceptsDueForReview(profile: LearnerProfile, now = Date.now()): string[] {
  return Object.values(profile.concepts)
    .filter((m) => m.pKnown >= 0.6 && effectiveMastery(m, now) < m.pKnown * 0.85)
    .sort((a, b) => effectiveMastery(a, now) - effectiveMastery(b, now))
    .map((m) => m.conceptId);
}

/** Recurring misconceptions, most frequent first. */
export function activeMisconceptions(profile: LearnerProfile, minCount = 1): MisconceptionRecord[] {
  return Object.values(profile.misconceptions).filter((m) => m.count >= minCount).sort((a, b) => b.count - a.count);
}
