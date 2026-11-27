/**
 * @barruu/i18n — multilingual support.
 * UI strings: `createTranslator` + `MESSAGES`. Course content: overlays
 * (`localizeContent`, `translationCoverage`, `overlayTemplate`).
 */
import en from './messages/en.json';
import es from './messages/es.json';
import ar from './messages/ar.json';
import type { LocaleCode } from './locales';
import type { Messages } from './translator';

export * from './locales';
export * from './translator';
export * from './contentLocalization';

export const MESSAGES: Record<LocaleCode, Messages> = { en, es, ar };
