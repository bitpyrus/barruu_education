/**
 * Language state for the app: picks the learner's language (saved choice →
 * browser preference → English), sets <html lang/dir>, and exposes `t`.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createTranslator, localeInfo, MESSAGES, negotiateLocale, isLocale, SOURCE_LOCALE, type LocaleCode, type Translator } from '@barruu/i18n';

const KEY = 'barruu_locale_v1';

interface I18n extends Translator { setLocale: (l: LocaleCode) => void; dir: 'ltr' | 'rtl' }

const Ctx = createContext<I18n | null>(null);

function initialLocale(): LocaleCode {
  const saved = localStorage.getItem(KEY);
  if (saved && isLocale(saved)) return saved;
  return negotiateLocale(navigator.languages ?? [navigator.language]);
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>(initialLocale);
  const setLocale = useCallback((l: LocaleCode) => { localStorage.setItem(KEY, l); setLocaleState(l); }, []);
  const value = useMemo<I18n>(() => {
    const tr = createTranslator(locale, MESSAGES[locale], MESSAGES[SOURCE_LOCALE], (k) => {
      if (import.meta.env.DEV) console.warn(`[i18n] missing "${k}" in ${locale}`);
    });
    return { ...tr, setLocale, dir: localeInfo(locale).dir };
  }, [locale, setLocale]);
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = value.dir;
  }, [locale, value.dir]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18n {
  const v = useContext(Ctx);
  if (!v) throw new Error('useI18n outside I18nProvider');
  return v;
}
