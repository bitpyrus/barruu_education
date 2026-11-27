/**
 * Supported locales.
 *
 * `status` is shown to learners and drives the translation workflow:
 *  - `source`         the language content is authored in (English)
 *  - `reviewed`       translated and approved by a fluent reviewer
 *  - `machine-draft`  AI-drafted, not yet reviewed — usable, but flagged
 *
 * To add a language: add an entry here, add `messages/<code>.json`, then run
 * `npm run content:check` to see which course strings still need translating.
 */
export type LocaleCode = 'en' | 'es' | 'ar';

export interface LocaleInfo {
  code: LocaleCode;
  /** Name in the language itself (shown in the language picker). */
  nativeName: string;
  englishName: string;
  dir: 'ltr' | 'rtl';
  status: 'source' | 'reviewed' | 'machine-draft';
}

export const LOCALES: readonly LocaleInfo[] = [
  { code: 'en', nativeName: 'English', englishName: 'English', dir: 'ltr', status: 'source' },
  { code: 'es', nativeName: 'Español', englishName: 'Spanish', dir: 'ltr', status: 'machine-draft' },
  { code: 'ar', nativeName: 'العربية', englishName: 'Arabic', dir: 'rtl', status: 'machine-draft' },
] as const;

export const SOURCE_LOCALE: LocaleCode = 'en';

export function isLocale(code: string): code is LocaleCode {
  return LOCALES.some((l) => l.code === code);
}

export function localeInfo(code: LocaleCode): LocaleInfo {
  return LOCALES.find((l) => l.code === code)!;
}

/**
 * Pick the best supported locale from a list of preferences (e.g. navigator.languages),
 * matching on the primary subtag ("es-MX" → "es").
 */
export function negotiateLocale(preferred: readonly string[], fallback: LocaleCode = SOURCE_LOCALE): LocaleCode {
  for (const p of preferred) {
    const primary = p.toLowerCase().split('-')[0];
    if (isLocale(primary)) return primary;
  }
  return fallback;
}
