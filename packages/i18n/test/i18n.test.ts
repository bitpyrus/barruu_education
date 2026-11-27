import { describe, expect, it } from 'vitest';
import {
  createTranslator, formatMessage, MESSAGES, LOCALES, missingKeys, negotiateLocale, localeInfo,
  extractStrings, localizeContent, translationCoverage, overlayTemplate, OverlaySchema,
} from '@barruu/i18n';

describe('message formatting', () => {
  it('interpolates and pluralises with Intl rules', () => {
    expect(formatMessage('Hello {name}', { name: 'Ada' }, 'en')).toBe('Hello Ada');
    const msg = '{count, plural, one {# lesson} other {# lessons}}';
    expect(formatMessage(msg, { count: 1 }, 'en')).toBe('1 lesson');
    expect(formatMessage(msg, { count: 3 }, 'en')).toBe('3 lessons');
    expect(formatMessage('{count, plural, =0 {none} other {# items}}', { count: 0 }, 'en')).toBe('none');
  });

  it('uses Arabic plural categories (zero/one/two/few/many/other)', () => {
    const msg = MESSAGES.ar['course.lessons'];
    expect(formatMessage(msg, { count: 1 }, 'ar')).toBe('درس واحد');
    expect(formatMessage(msg, { count: 2 }, 'ar')).toBe('درسان');
    expect(formatMessage(msg, { count: 3 }, 'ar')).toContain('دروس');
    expect(formatMessage(msg, { count: 11 }, 'ar')).toContain('درسًا');
  });

  it('leaves unknown placeholders visible instead of crashing', () => {
    expect(formatMessage('Hi {who}', {}, 'en')).toBe('Hi {who}');
    expect(formatMessage('broken {', {}, 'en')).toBe('broken {');
  });

  it('falls back to the source locale and reports missing keys', () => {
    const missing: string[] = [];
    const t = createTranslator('es', { 'a': 'uno' }, { a: 'one', b: 'two' }, (k) => missing.push(k));
    expect(t.t('a')).toBe('uno');
    expect(t.t('b')).toBe('two');
    expect(t.t('nope')).toBe('nope');
    expect(missing).toEqual(['b', 'nope']);
  });
});

describe('locales', () => {
  it('every locale has a complete UI catalog', () => {
    for (const l of LOCALES) expect(missingKeys(MESSAGES.en, MESSAGES[l.code]), l.code).toEqual([]);
  });
  it('negotiates from browser preferences and knows text direction', () => {
    expect(negotiateLocale(['es-MX', 'en'])).toBe('es');
    expect(negotiateLocale(['de-DE', 'fr'])).toBe('en');
    expect(localeInfo('ar').dir).toBe('rtl');
  });
});

describe('content overlays', () => {
  const course = {
    id: 'c', title: 'Area', color: '#000000',
    chapters: [{ id: 'ch', title: 'Shapes', lessons: [{ id: 'l', title: 'Gardens', steps: [
      { id: 's', type: 'question', body: 'Which is bigger?', question: { kind: 'numeric', prompt: 'How many?', answer: 8, hints: ['Split it', 'Count'], concepts: ['area'] } },
      { id: 'b', type: 'interactive', interactive: { kind: 'gridBoard', config: { shapes: [{ id: 'a', label: 'A' }] } } },
    ] }] }],
  };

  it('extracts learner-visible prose only (never ids, numbers or configs)', () => {
    const s = extractStrings(course);
    expect(s).toEqual({
      title: 'Area',
      'chapters.0.title': 'Shapes',
      'chapters.0.lessons.0.title': 'Gardens',
      'chapters.0.lessons.0.steps.0.body': 'Which is bigger?',
      'chapters.0.lessons.0.steps.0.question.prompt': 'How many?',
      'chapters.0.lessons.0.steps.0.question.hints.0': 'Split it',
      'chapters.0.lessons.0.steps.0.question.hints.1': 'Count',
    });
  });

  it('applies translations, falls back for missing ones, and skips stale ones', () => {
    const overlay = OverlaySchema.parse({ locale: 'es', contentId: 'c', strings: {
      title: { text: 'Área', source: 'Area' },
      'chapters.0.title': { text: 'Figuras', source: 'Shapes (old text)' },
    } });
    const out = localizeContent(course, overlay);
    expect(out.title).toBe('Área');
    expect(out.chapters[0].title).toBe('Shapes'); // stale → source shown
    expect(out.chapters[0].lessons[0].steps[0].question!.answer).toBe(8);
    expect(course.title).toBe('Area'); // source untouched
    const cov = translationCoverage(course, overlay);
    expect(cov).toMatchObject({ total: 7, translated: 1, stale: ['chapters.0.title'] });
    expect(cov.missing).toHaveLength(5);
  });

  it('builds a template for translators / AI drafting', () => {
    const tpl = overlayTemplate(course, 'ar', 'c');
    expect(Object.keys(tpl.strings)).toHaveLength(7);
    expect(tpl.strings.title).toEqual({ text: '', source: 'Area' });
  });
});
