import type { Question } from '@barruu/engine';

export interface Draft { selected: string[]; text: string; order: number[] }

export function emptyDraft(q: Question): Draft {
  return { selected: [], text: '', order: q.kind === 'order' ? q.items.map((_, i) => i) : [] };
}

export function draftReady(q: Question, d: Draft): boolean {
  switch (q.kind) {
    case 'choice': return d.selected.length > 0;
    case 'numeric': case 'expression': return d.text.trim().length > 0;
    default: return true;
  }
}

