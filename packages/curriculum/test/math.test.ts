import { describe, expect, it } from 'vitest';
import {
  FRAMEWORKS, MATH_COURSES, MATH_INTERACTIVES, MISCONCEPTIONS, SKILLS, getSkill, mathChapters, validateSkillGraph,
} from '@barruu/curriculum';

describe('math curriculum plan', () => {
  it('has unique course ids and codes, and unique chapter skills', () => {
    expect(new Set(MATH_COURSES.map((c) => c.id)).size).toBe(MATH_COURSES.length);
    expect(new Set(MATH_COURSES.map((c) => c.code)).size).toBe(MATH_COURSES.length);
    const chapters = mathChapters();
    expect(new Set(chapters.map((c) => c.skill)).size).toBe(chapters.length);
  });

  it('spans grade 6 to university year 1 across all seven strands', () => {
    const grades = mathChapters().map((c) => c.grade);
    expect(Math.min(...grades)).toBe(6);
    expect(Math.max(...grades)).toBeGreaterThanOrEqual(13);
    expect(new Set(MATH_COURSES.flatMap((c) => c.strands))).toEqual(new Set(['N', 'A', 'G', 'D', 'C', 'P', 'L']));
  });

  it('every chapter is a skill in the skill map, and the whole graph is a valid DAG', () => {
    for (const ch of mathChapters()) expect(getSkill(ch.skill), ch.skill).toBeDefined();
    expect(validateSkillGraph()).toEqual([]);
  });

  it('within a course, a chapter only depends on chapters that come before it', () => {
    for (const c of MATH_COURSES) {
      const order = c.chapters.map((ch) => ch.skill);
      c.chapters.forEach((ch, i) => {
        for (const p of ch.prerequisites) if (order.includes(p)) expect(order.indexOf(p), `${c.code} ${ch.skill} needs ${p}`).toBeLessThan(i);
      });
    }
  });

  it('every course is topic-sized and names only known interactives and frameworks', () => {
    for (const c of MATH_COURSES) {
      expect(c.chapters.length, c.code).toBeGreaterThanOrEqual(3);
      expect(c.chapters.length, c.code).toBeLessThanOrEqual(7);
      for (const i of c.interactives) expect(MATH_INTERACTIVES[i], `${c.code} ${i}`).toBeDefined();
      for (const f of Object.keys(c.alignment)) expect(FRAMEWORKS[f as keyof typeof FRAMEWORKS], `${c.code} ${f}`).toBeDefined();
    }
  });

  it('keeps the skills that placement items and physics depend on', () => {
    for (const id of ['math.linear-equations', 'math.linear-functions', 'math.pythagorean', 'math.trigonometry', 'math.vectors', 'math.exponents-logs', 'math.units', 'math.derivatives']) {
      expect(getSkill(id), id).toBeDefined();
    }
  });

  it('every course chapter is reachable: nothing depends on a skill outside the map', () => {
    const ids = new Set(SKILLS.map((s) => s.id));
    for (const ch of mathChapters()) for (const p of ch.prerequisites) expect(ids.has(p), `${ch.skill} → ${p}`).toBe(true);
  });
});

describe('misconception catalogue', () => {
  it('has unique ids attached to real skills', () => {
    expect(new Set(MISCONCEPTIONS.map((m) => m.id)).size).toBe(MISCONCEPTIONS.length);
    for (const m of MISCONCEPTIONS) expect(getSkill(m.skill), `${m.id} → ${m.skill}`).toBeDefined();
  });
  it('research-backed entries cite at least one source', () => {
    for (const m of MISCONCEPTIONS.filter((x) => x.basis === 'research')) expect(m.sources?.length, m.id).toBeGreaterThan(0);
  });
});
