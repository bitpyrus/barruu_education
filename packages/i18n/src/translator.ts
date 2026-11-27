/**
 * Tiny, dependency-free message formatter for UI strings.
 *
 * Supports a safe subset of ICU MessageFormat:
 *   "Hello {name}"                                   interpolation
 *   "{count, plural, one {# lesson} other {# lessons}}"  plurals via Intl.PluralRules (also =0, =1 exact matches)
 *
 * Messages are plain data (never evaluated as code). Missing keys fall back to
 * the source locale, then to the key itself, and are reported via `onMissing`.
 */
import type { LocaleCode } from './locales';

export type Messages = Record<string, string>;
export type Params = Record<string, string | number>;

export interface Translator {
  locale: LocaleCode;
  t: (key: string, params?: Params) => string;
  /** Locale-aware number formatting (e.g. Arabic-Indic digits are NOT forced; uses Intl defaults for the locale). */
  n: (value: number, opts?: Intl.NumberFormatOptions) => string;
}

export function formatMessage(message: string, params: Params, locale: string): string {
  let out = '';
  let i = 0;
  while (i < message.length) {
    const open = message.indexOf('{', i);
    if (open < 0) { out += message.slice(i); break; }
    out += message.slice(i, open);
    const close = matchBrace(message, open);
    if (close < 0) { out += message.slice(open); break; }
    out += formatArgument(message.slice(open + 1, close), params, locale);
    i = close + 1;
  }
  return out;
}

function matchBrace(s: string, open: number): number {
  let depth = 0;
  for (let i = open; i < s.length; i++) {
    if (s[i] === '{') depth++;
    else if (s[i] === '}' && --depth === 0) return i;
  }
  return -1;
}

function formatArgument(arg: string, params: Params, locale: string): string {
  const comma = arg.indexOf(',');
  if (comma < 0) {
    const v = params[arg.trim()];
    return v === undefined ? `{${arg}}` : String(v);
  }
  const name = arg.slice(0, comma).trim();
  const rest = arg.slice(comma + 1);
  const comma2 = rest.indexOf(',');
  const type = rest.slice(0, comma2).trim();
  if (type !== 'plural' || comma2 < 0) return `{${arg}}`;
  const value = Number(params[name]);
  const options = parseOptions(rest.slice(comma2 + 1));
  const exact = options[`=${value}`];
  const category = new Intl.PluralRules(locale).select(value);
  const chosen = exact ?? options[category] ?? options.other ?? '';
  const formatted = new Intl.NumberFormat(locale).format(value);
  return formatMessage(chosen.replace(/#/g, formatted), params, locale);
}

function parseOptions(s: string): Record<string, string> {
  const out: Record<string, string> = {};
  let i = 0;
  while (i < s.length) {
    while (i < s.length && /\s/.test(s[i])) i++;
    const keyStart = i;
    while (i < s.length && s[i] !== '{' && !/\s/.test(s[i])) i++;
    const key = s.slice(keyStart, i);
    while (i < s.length && /\s/.test(s[i])) i++;
    if (s[i] !== '{') break;
    const close = matchBrace(s, i);
    if (close < 0) break;
    out[key] = s.slice(i + 1, close);
    i = close + 1;
  }
  return out;
}

export function createTranslator(
  locale: LocaleCode,
  messages: Messages,
  fallback: Messages,
  onMissing?: (key: string, locale: LocaleCode) => void,
): Translator {
  const nf = new Map<string, Intl.NumberFormat>();
  return {
    locale,
    t: (key, params = {}) => {
      let msg = messages[key];
      if (msg === undefined) {
        onMissing?.(key, locale);
        msg = fallback[key] ?? key;
      }
      return formatMessage(msg, params, locale);
    },
    n: (value, opts) => {
      const k = JSON.stringify(opts ?? {});
      if (!nf.has(k)) nf.set(k, new Intl.NumberFormat(locale, opts));
      return nf.get(k)!.format(value);
    },
  };
}

/** Keys present in `source` but missing from `target` (used by checks and tests). */
export function missingKeys(source: Messages, target: Messages): string[] {
  return Object.keys(source).filter((k) => !(k in target));
}
