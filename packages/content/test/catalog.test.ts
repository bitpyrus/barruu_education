import { describe, expect, it } from 'vitest';
import {
  createProfile, recordEvidence, ConceptGraph, validateConfig, courseLessons, buildTutorContext,
  buildTutorSystemPrompt, offlineTutorReply, recommend, lintCourse, parseTutorReply, validateActions, runCalculation,
} from '@barruu/engine';
import { COURSES, CONCEPT_GRAPH, CONCEPTS } from '../src/catalog';

describe('concept graph', () => {
  it('has a valid built-in curriculum graph', () => {
    expect(CONCEPT_GRAPH.validate()).toEqual([]);
    const lessonConcepts = COURSES.flatMap((c) => courseLessons(c).flatMap((l) => [...l.concepts, ...l.steps.flatMap((s) => (s.type === 'question' ? s.question.concepts : []))]));
    const known = new Set(CONCEPTS.map((c) => c.id));
    for (const id of lessonConcepts) expect(known.has(id), id).toBe(true);
  });

  it('orders prerequisites and detects cycles and gaps', () => {
    expect(CONCEPT_GRAPH.prerequisitesOf('parabola-vertex')).toEqual(['variables-expressions', 'linear-functions', 'quadratic-functions']);
    const cyclic = new ConceptGraph([
      { id: 'a', title: 'A', subject: 's', summary: '', prerequisites: ['b'] },
      { id: 'b', title: 'B', subject: 's', summary: '', prerequisites: ['a'] },
    ]);
    expect(cyclic.validate().some((p) => p.startsWith('cycle'))).toBe(true);
    const struggling = recordEvidence(createProfile(), { concepts: ['linear-functions'], correct: false, weight: 1 });
    expect(CONCEPT_GRAPH.gapsFor('parabola-vertex', struggling)).toEqual(['linear-functions']);
  });
});

describe('built-in content is internally consistent', () => {
  it('every interactive config validates', () => {
    for (const course of COURSES) for (const lesson of courseLessons(course)) for (const step of lesson.steps) {
      const spec = step.type === 'interactive' || step.type === 'question' ? step.interactive : undefined;
      if (spec) expect(validateConfig(spec.kind, spec.config).ok, `${lesson.id}/${step.id}`).toBe(true);
    }
  });

  it('numeric answers match the deterministic engine', () => {
    expect(2 * Math.PI * Math.sqrt(1 / 1.62)).toBeCloseTo(4.937, 2);
    expect(9.81 / (Math.PI * Math.PI)).toBeCloseTo(0.994, 2);
  });
});

describe('tutor', () => {
  const course = COURSES.find((c) => c.id === 'functions-you-can-touch')!;
  const lesson = courseLessons(course)[0];
  const ctxFor = (stepIndex: number, attempts = 0) => buildTutorContext({
    course, lesson, stepIndex,
    runtime: { attempts: Array.from({ length: attempts }, () => ({ answer: '3', correct: false, feedback: 'Not quite.' })), hintsRevealed: 0, solved: false },
    profile: createProfile(), graph: CONCEPT_GRAPH, events: [{ at: 0, text: 'changed a to -1' }],
  });

  it('includes live interactive state and hides the answer key until the learner engages', () => {
    const vertex = lesson.steps.findIndex((s) => s.id === 'vertex');
    const before = ctxFor(vertex);
    expect(before.interactive?.state).toMatch(/x\^2 - 4·x \+ 3/);
    expect(before.question?.answerKey).toBeUndefined();
    expect(ctxFor(vertex, 1).question?.answerKey).toMatch(/^2/);
    const assess = lesson.steps.findIndex((s) => s.stage === 'assess');
    expect(ctxFor(assess, 2).question?.answerKey).toBeUndefined();
    expect(buildTutorSystemPrompt(ctxFor(assess))).toMatch(/do NOT reveal/);
  });

  it('parses and validates actions against schema and stage policy', () => {
    const { text, rawActions } = parseTutorReply('Try this.\n```actions\n[{"type":"set_parameter","name":"a","value":-1},{"type":"run_code","code":"x"}]\n```');
    expect(text).toBe('Try this.');
    const v = validateActions(rawActions, 'explore');
    expect(v.valid).toEqual([{ type: 'set_parameter', name: 'a', value: -1 }]);
    expect(v.rejected).toHaveLength(1);
    expect(validateActions([{ type: 'reveal_hint' }], 'assess').valid).toHaveLength(0);
    expect(validateActions([{ type: 'plot_function', expression: 'x +' }], 'explain').valid).toHaveLength(0);
    expect(parseTutorReply('```actions\nnot json```').rawActions).toEqual([]);
    expect(runCalculation('2*pi*sqrt(1/1.62)')).toEqual({ ok: true, value: expect.closeTo(4.937, 2) });
  });

  it('offline tutor still answers "why did this happen" from context', () => {
    const explore = lesson.steps.findIndex((s) => s.stage === 'explore');
    expect(offlineTutorReply(ctxFor(explore), 'why did this happen?')).toMatch(/Plotting f\(x\)/);
  });
});

describe('recommendations', () => {
  it('suggests starting lessons for a new learner and review for fading concepts', () => {
    const r = recommend(createProfile(), {}, COURSES, CONCEPT_GRAPH);
    expect(r.next.length).toBeGreaterThan(0);
    expect(r.continue).toBeNull();
  });
});

describe('built-in courses pass content lint (schema + solvability)', () => {
  it('has no issues in any course', async () => {
        for (const c of COURSES) expect(lintCourse(c), c.id).toEqual([]);
  });

});

describe('translations', () => {
  it('Spanish overlay is current (no stale strings) and never changes answer data', async () => {
    const { localizedCourse, overlayFor } = await import('../src/translations');
    const { translationCoverage } = await import('@barruu/i18n');
    const c = COURSES.find((x) => x.id === 'mathematical-thinking')!;
    const cov = translationCoverage(c, overlayFor('es', c.id));
    expect(cov.stale).toEqual([]);
    expect(cov.orphaned).toEqual([]);
    const es = localizedCourse(c, 'es');
    expect(es.title).toBe('Pensamiento matemático');
    const strip = (x: unknown) => JSON.stringify(x, (k, v) => (typeof v === 'string' && !['id', 'kind', 'type', 'stage', 'shape', 'metric', 'op', 'color'].includes(k) ? undefined : v));
    expect(strip(es)).toBe(strip(c)); // identical structure, ids, numbers and goals
    expect(lintCourse(es)).toEqual([]);
  });
});
