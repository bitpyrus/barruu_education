/**
 * Connected knowledge: a prerequisite graph across courses and subjects.
 */
import type { Concept } from './schema';
import { effectiveMastery, type LearnerProfile, MASTERY_THRESHOLD } from './learnerModel';

export class ConceptGraph {
  readonly concepts: Map<string, Concept>;

  constructor(concepts: Concept[]) {
    this.concepts = new Map(concepts.map((c) => [c.id, c]));
  }

  get(id: string): Concept | undefined { return this.concepts.get(id); }

  /** Problems with the graph: unknown prerequisites and cycles. */
  validate(): string[] {
    const problems: string[] = [];
    for (const c of this.concepts.values()) {
      for (const p of c.prerequisites) if (!this.concepts.has(p)) problems.push(`${c.id} requires unknown concept ${p}`);
    }
    const state = new Map<string, 0 | 1 | 2>();
    const visit = (id: string, path: string[]) => {
      if (state.get(id) === 2) return;
      if (state.get(id) === 1) { problems.push(`cycle: ${[...path, id].join(' → ')}`); return; }
      state.set(id, 1);
      for (const p of this.concepts.get(id)?.prerequisites ?? []) if (this.concepts.has(p)) visit(p, [...path, id]);
      state.set(id, 2);
    };
    for (const id of this.concepts.keys()) visit(id, []);
    return problems;
  }

  /** All transitive prerequisites, in an order where each comes after its own prerequisites. */
  prerequisitesOf(id: string): string[] {
    const out: string[] = [];
    const seen = new Set<string>();
    const visit = (cid: string) => {
      for (const p of this.concepts.get(cid)?.prerequisites ?? []) {
        if (seen.has(p)) continue;
        seen.add(p);
        visit(p);
        out.push(p);
      }
    };
    visit(id);
    return out;
  }

  /** Concepts that directly build on `id`. */
  dependentsOf(id: string): string[] {
    return [...this.concepts.values()].filter((c) => c.prerequisites.includes(id)).map((c) => c.id);
  }

  /**
   * Prerequisite gaps for a target concept: prerequisites the learner has
   * evidence of struggling with (or has never practised, if `includeUnseen`).
   */
  gapsFor(target: string, profile: LearnerProfile, opts: { includeUnseen?: boolean; now?: number } = {}): string[] {
    return this.prerequisitesOf(target).filter((p) => {
      const m = profile.concepts[p];
      if (!m) return !!opts.includeUnseen;
      return effectiveMastery(m, opts.now) < MASTERY_THRESHOLD * 0.75;
    });
  }

  /** Concepts whose prerequisites are all mastered but which are not yet mastered: the learner's frontier. */
  frontier(profile: LearnerProfile, now?: number): string[] {
    return [...this.concepts.values()]
      .filter((c) => effectiveMastery(profile.concepts[c.id], now) < MASTERY_THRESHOLD)
      .filter((c) => c.prerequisites.every((p) => effectiveMastery(profile.concepts[p], now) >= MASTERY_THRESHOLD * 0.75))
      .map((c) => c.id);
  }
}
