import { describe, expect, it } from 'vitest';
import {
  createTranslator, formatMessage, MESSAGES, LOCALES, missingKeys, negotiateLocale, localeInfo,
  extractStrings, localizeContent, translationCoverage, overlayTemplate, OverlaySchema, migrateOverlayPaths,
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

  it('extracts learner-visible prose only (never ids, numbers or expressions)', () => {
    const s = extractStrings(course);
    expect(s).toEqual({
      title: 'Area',
      'chapters.#ch.title': 'Shapes',
      'chapters.#ch.lessons.#l.title': 'Gardens',
      'chapters.#ch.lessons.#l.steps.#s.body': 'Which is bigger?',
      'chapters.#ch.lessons.#l.steps.#s.question.prompt': 'How many?',
      'chapters.#ch.lessons.#l.steps.#s.question.hints.0': 'Split it',
      'chapters.#ch.lessons.#l.steps.#s.question.hints.1': 'Count',
      'chapters.#ch.lessons.#l.steps.#b.interactive.config.shapes.#a.label': 'A',
    });
  });

  it('applies translations, falls back for missing ones, and skips stale ones', () => {
    const overlay = OverlaySchema.parse({ locale: 'es', contentId: 'c', strings: {
      title: { text: 'Área', source: 'Area' },
      'chapters.#ch.title': { text: 'Figuras', source: 'Shapes (old text)' },
    } });
    const out = localizeContent(course, overlay);
    expect(out.title).toBe('Área');
    expect(out.chapters[0].title).toBe('Shapes'); // stale → source shown
    expect(out.chapters[0].lessons[0].steps[0].question!.answer).toBe(8);
    expect(course.title).toBe('Area'); // source untouched
    const cov = translationCoverage(course, overlay);
    expect(cov).toMatchObject({ total: 8, translated: 1, stale: ['chapters.#ch.title'] });
    expect(cov.missing).toHaveLength(6);
  });

  it('keeps translations when steps are inserted or reordered (paths use ids)', () => {
    const overlay = OverlaySchema.parse({ locale: 'es', contentId: 'c', strings: {
      'chapters.#ch.lessons.#l.steps.#s.body': { text: '¿Cuál es mayor?', source: 'Which is bigger?' },
    } });
    const moved = structuredClone(course);
    moved.chapters[0].lessons[0].steps.unshift({ id: 'new', type: 'narrative', body: 'Hello' } as never);
    expect(localizeContent(moved, overlay).chapters[0].lessons[0].steps[1].body).toBe('¿Cuál es mayor?');
  });

  it('migrates legacy index-based overlay keys', () => {
    const migrated = migrateOverlayPaths(course, { 'chapters.0.lessons.0.steps.1.interactive.config.shapes.0.label': { text: 'A', source: 'A' } });
    expect(Object.keys(migrated)).toEqual(['chapters.#ch.lessons.#l.steps.#b.interactive.config.shapes.#a.label']);
  });

  it('builds a template for translators / AI drafting', () => {
    const tpl = overlayTemplate(course, 'ar', 'c');
    expect(Object.keys(tpl.strings)).toHaveLength(8);
    expect(tpl.strings.title).toEqual({ text: '', source: 'Area' });
  });
});

describe('UI component strings', () => {
  it('every @barruu/ui default exists in en.json with identical English', async () => {
    const { UI_DEFAULTS } = await import('../../ui/src/uiMessages');
    for (const [k, v] of Object.entries(UI_DEFAULTS)) expect(MESSAGES.en[k], k).toBe(v);
  });

  it('every engine feedback code has a message in every locale', () => {
    const codes = ['correct', 'choice.empty', 'choice.partial', 'choice.incorrect', 'numeric.empty', 'numeric.unreadable', 'numeric.sign',
      'numeric.magnitude', 'numeric.incorrect', 'expression.empty', 'expression.unreadable', 'expression.equivalent', 'expression.notEquivalent',
      'order.empty', 'order.correct', 'order.partial', 'construction.empty', 'construction.correct', 'goal.degenerate', 'goal.metric',
      'circuit.empty', 'circuit.correct', 'circuit.short', 'circuit.invalid', 'circuit.dark', 'circuit.lit', 'circuit.litBulbs', 'circuit.total', 'circuit.metric',
      'numberLine.empty', 'numberLine.correct', 'numberLine.unplaced', 'numberLine.value', 'numberLine.bound', 'numberLine.compare'];
    for (const l of LOCALES) for (const c of codes) expect(MESSAGES[l.code][`feedback.${c}`], `${l.code} feedback.${c}`).toBeTruthy();
    for (const l of LOCALES) for (const m of ['area', 'perimeter', 'width', 'height', 'axisAlignedSides', 'vertexCount', 'current', 'voltage', 'power', 'brightness']) expect(MESSAGES[l.code][`metric.${m}`]).toBeTruthy();
  });

  it('translations keep every {placeholder} of the English message', () => {
    const ph = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
    for (const l of LOCALES) for (const [k, en] of Object.entries(MESSAGES.en)) {
      if (en.includes('plural')) continue; // plural messages are checked by formatting tests
      expect(ph(MESSAGES[l.code][k] ?? ''), `${l.code} ${k}`).toBe(ph(en));
    }
  });
});
