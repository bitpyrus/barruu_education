/**
 * Course content localization.
 *
 * Courses are authored once in the source language. Translations are stored as
 * *overlays*: a map from a stable string path (e.g. `chapters.#area.lessons.#gardens.steps.#predict.body`)
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
// Interactive `config` is walked too, so learner-visible labels inside it (slider and shape
// labels) can be translated; its numbers, expressions and ids are never translatable keys.
const SKIP_KEYS = new Set(['id', 'kind', 'answer', 'variables', 'correctOrder', 'concepts', 'skills', 'provenance', 'color', 'illustration', 'block']);

export type StringTable = Record<string, string>;

/**
 * Path segment for an array element. Elements with a unique `id` (chapters, lessons, steps,
 * options, shapes, parts…) are addressed as `#id`, so inserting or reordering steps never
 * shifts their translations. Plain strings and elements without a unique id use the index.
 */
function segments(arr: unknown[]): string[] {
  const ids = arr.map((v) => (v && typeof v === 'object' && typeof (v as { id?: unknown }).id === 'string' ? (v as { id: string }).id : null));
  const count = new Map<string, number>();
  ids.forEach((id) => { if (id) count.set(id, (count.get(id) ?? 0) + 1); });
  return ids.map((id, i) => (id && count.get(id) === 1 ? `#${id}` : String(i)));
}

/**
 * Walk a content object and collect every translatable string by path.
 * `byIndex` reproduces the legacy index-only paths (used to migrate old overlays).
 */
export function extractStrings(value: unknown, path = '', out: StringTable = {}, byIndex = false): StringTable {
  if (Array.isArray(value)) {
    const seg = byIndex ? value.map((_, i) => String(i)) : segments(value);
    value.forEach((v, i) => extractStrings(v, path ? `${path}.${seg[i]}` : seg[i], out, byIndex));
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (SKIP_KEYS.has(k)) continue;
      const p = path ? `${path}.${k}` : k;
      if (TRANSLATABLE_KEYS.has(k)) {
        if (typeof v === 'string' && v.trim()) out[p] = v;
        else if (Array.isArray(v) && v.every((x) => typeof x === 'string')) v.forEach((s, i) => { if (s.trim()) out[`${p}.${i}`] = s; });
        else extractStrings(v, p, out, byIndex);
      } else if (typeof v === 'object') {
        extractStrings(v, p, out, byIndex);
      }
    }
  }
  return out;
}

/** Rename legacy index-based overlay keys to id-based ones (same content, same walk order). */
export function migrateOverlayPaths(content: unknown, strings: Record<string, { text: string; source: string }>) {
  const legacy = Object.keys(extractStrings(content, '', {}, true));
  const current = Object.keys(extractStrings(content));
  const rename = new Map(legacy.map((k, i) => [k, current[i]]));
  return Object.fromEntries(Object.entries(strings).map(([k, v]) => [rename.get(k) ?? k, v]));
}

export const OverlaySchema = z.object({
  locale: z.string().min(2),
  contentId: z.string().min(1),
  /** How the translation was produced; drives the "machine draft" badge. */
  status: z.enum(['machine-draft', 'reviewed']).default('machine-draft'),
  strings: z.record(z.string(), z.object({ text: z.string(), source: z.string() })),
});
export type Overlay = z.infer<typeof OverlaySchema>;

function step(cur: unknown, part: string): unknown {
  if (Array.isArray(cur) && part.startsWith('#')) return cur.find((v) => v && typeof v === 'object' && (v as { id?: unknown }).id === part.slice(1));
  return (cur as Record<string, unknown>)?.[part];
}

function setPath(root: unknown, path: string, text: string): void {
  const parts = path.split('.');
  let cur = root as Record<string, unknown>;
  for (let i = 0; i < parts.length - 1; i++) {
    const next = step(cur, parts[i]);
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
