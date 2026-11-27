/**
 * Course content localization.
 *
 * Courses are authored once in the source language. Translations are stored as
 * *overlays*: a map from a stable string path (e.g. `chapters.0.lessons.1.steps.2.body`)
 * to `{ text, source }`, where `source` is the source-language text that was
 * translated. This gives us, without touching the content model:
 *  - fallback: anything untranslated shows the source text
 *  - coverage: which strings are missing for a locale
 *  - staleness: which translations were made from source text that has since changed
 *
 * Only learner-visible prose is translatable; ids, numbers, expressions, LaTeX
 * and configs are never touched, so answer checking is identical in every language.
 */
import { z } from 'zod';

/** Object keys whose string values (or arrays of strings) are learner-visible prose. */
export const TRANSLATABLE_KEYS = new Set([
  'title', 'tagline', 'summary', 'body', 'prompt', 'explanation', 'feedback', 'message',
  'successFeedback', 'goal', 'text', 'label', 'caption',
  // arrays of strings:
  'hints', 'objectives', 'outcomes', 'prerequisites', 'plannedLessons', 'items',
]);

/** Keys never descended into (machine data). */
const SKIP_KEYS = new Set(['id', 'kind', 'config', 'answer', 'variables', 'correctOrder', 'concepts', 'skills', 'provenance', 'color', 'illustration', 'block']);

export type StringTable = Record<string, string>;

/** Walk a content object and collect every translatable string by path. */
export function extractStrings(value: unknown, path = '', out: StringTable = {}): StringTable {
  if (Array.isArray(value)) {
    value.forEach((v, i) => extractStrings(v, path ? `${path}.${i}` : String(i), out));
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (SKIP_KEYS.has(k)) continue;
      const p = path ? `${path}.${k}` : k;
      if (TRANSLATABLE_KEYS.has(k)) {
        if (typeof v === 'string' && v.trim()) out[p] = v;
        else if (Array.isArray(v) && v.every((x) => typeof x === 'string')) v.forEach((s, i) => { if (s.trim()) out[`${p}.${i}`] = s; });
        else extractStrings(v, p, out);
      } else if (typeof v === 'object') {
        extractStrings(v, p, out);
      }
    }
  }
  return out;
}

export const OverlaySchema = z.object({
  locale: z.string().min(2),
  contentId: z.string().min(1),
  /** How the translation was produced; drives the "machine draft" badge. */
  status: z.enum(['machine-draft', 'reviewed']).default('machine-draft'),
  strings: z.record(z.string(), z.object({ text: z.string(), source: z.string() })),
});
export type Overlay = z.infer<typeof OverlaySchema>;

function setPath(root: unknown, path: string, text: string): void {
  const parts = path.split('.');
  let cur = root as Record<string, unknown>;
  for (let i = 0; i < parts.length - 1; i++) {
    const next = cur?.[parts[i]];
    if (next === null || typeof next !== 'object') return;
    cur = next as Record<string, unknown>;
  }
  const last = parts[parts.length - 1];
  if (typeof cur?.[last] === 'string') cur[last] = text;
}

/**
 * Apply an overlay to content. Returns a new object; the source is untouched.
 * Translations whose `source` no longer matches the current source text are
 * skipped (stale), so learners never see a translation of outdated content.
 */
export function localizeContent<T>(content: T, overlay: Overlay | undefined): T {
  if (!overlay) return content;
  const copy = structuredClone(content);
  const current = extractStrings(content);
  for (const [path, entry] of Object.entries(overlay.strings)) {
    if (current[path] !== undefined && current[path] === entry.source && entry.text.trim()) setPath(copy, path, entry.text);
  }
  return copy;
}

export interface Coverage {
  total: number;
  translated: number;
  missing: string[];
  stale: string[];
  /** Overlay entries for paths that no longer exist in the source. */
  orphaned: string[];
}

export function translationCoverage(content: unknown, overlay: Overlay | undefined): Coverage {
  const current = extractStrings(content);
  const paths = Object.keys(current);
  const strings = overlay?.strings ?? {};
  const missing = paths.filter((p) => !strings[p]);
  const stale = paths.filter((p) => strings[p] && strings[p].source !== current[p]);
  const orphaned = Object.keys(strings).filter((p) => current[p] === undefined);
  return { total: paths.length, translated: paths.length - missing.length - stale.length, missing, stale, orphaned };
}

/** Build an overlay template (all strings, empty text) for a translator or an AI drafting step. */
export function overlayTemplate(content: unknown, locale: string, contentId: string): Overlay {
  const strings: Overlay['strings'] = {};
  for (const [p, s] of Object.entries(extractStrings(content))) strings[p] = { text: '', source: s };
  return { locale, contentId, status: 'machine-draft', strings };
}
