---
description: Draft or update a course translation overlay for a locale
argument-hint: <locale> <course-id>
---
Translate: $ARGUMENTS

1. Read `docs/I18N.md`. If the locale is new, add it to `packages/i18n/src/locales.ts` and create
   `packages/i18n/src/messages/<locale>.json` with every key from `en.json`.
2. Generate the template: a short `tsx` script calling `overlayTemplate(course, locale, course.id)` from
   `@barruu/i18n`, or update the existing overlay in `packages/content/src/translations/<locale>/<course-id>.json`.
   Keep each entry's `source` exactly equal to the current English text.
3. Translate `text` only. Never translate or alter: LaTeX inside `$…$`, numbers, units, markdown markers, `{placeholders}`.
4. Keep `"status": "machine-draft"` unless a fluent human has reviewed it.
5. Register new overlay files in `packages/content/src/translations.ts`.
6. Run `npm run content:check` (coverage, stale, orphaned) and `npm test`.
7. Ask the `translation-reviewer` agent to review.
