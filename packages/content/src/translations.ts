/**
 * Course translations (overlays on the English source; see @barruu/i18n).
 * Add a file at `translations/<locale>/<courseId>.json` and register it here.
 * Generate a template with `overlayTemplate(course, locale, course.id)`.
 */
import { localizeContent, OverlaySchema, SOURCE_LOCALE, type LocaleCode, type Overlay } from '@barruu/i18n';
import type { Course } from '@barruu/engine';
import esMathematicalThinking from './translations/es/mathematical-thinking.json';

const RAW: unknown[] = [esMathematicalThinking];

export const OVERLAYS: Overlay[] = RAW.map((o) => OverlaySchema.parse(o));

export function overlayFor(locale: LocaleCode, contentId: string): Overlay | undefined {
  return OVERLAYS.find((o) => o.locale === locale && o.contentId === contentId);
}

/** The course in the requested language, falling back to English string by string. */
export function localizedCourse(course: Course, locale: LocaleCode): Course {
  if (locale === SOURCE_LOCALE) return course;
  return localizeContent(course, overlayFor(locale, course.id));
}
