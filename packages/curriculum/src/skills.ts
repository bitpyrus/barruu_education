/**
 * Grade 9–12 science & engineering skill map.
 *
 * Organised like Brilliant's catalogue — by subject and topic, with US-style
 * grade bands — rather than by any single national syllabus. Each skill has a
 * typical grade and prerequisites; together they form the graph used for
 * placement, recommendations and prerequisite remediation.
 *
 * Grades are a guide, not a gate: 8 = "before high school", 13+ = university.
 * Extending downward or upward means adding skills with grades outside 9–12.
 */
import { z } from 'zod';

export const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Engineering', 'Computer Science'] as const;
export type Subject = (typeof SUBJECTS)[number];

export const SkillSchema = z.object({
  id: z.string().regex(/^[a-z]+(\.[a-z0-9-]+)+$/),
  title: z.string().min(1),
  subject: z.enum(SUBJECTS),
  /** Typical US grade in which this skill is learned. */
  grade: z.number().int().min(6).max(16),
  prerequisites: z.array(z.string()).default([]),
});
export type Skill = z.infer<typeof SkillSchema>;

const S = (id: string, title: string, subject: Subject, grade: number, prerequisites: string[] = []) => ({ id, title, subject, grade, prerequisites });

const RAW: ReturnType<typeof S>[] = [
  // Mathematics — the language of science
  S('math.area-perimeter', 'Area and perimeter', 'Mathematics', 8),
  S('math.proportional-reasoning', 'Ratios and proportional reasoning', 'Mathematics', 8),
  S('math.linear-equations', 'Solving linear equations', 'Mathematics', 9, ['math.proportional-reasoning']),
  S('math.units', 'Units and unit conversion', 'Mathematics', 9, ['math.proportional-reasoning']),
  S('math.scientific-notation', 'Scientific notation', 'Mathematics', 9),
  S('math.pythagorean', 'The Pythagorean theorem', 'Mathematics', 9, ['math.area-perimeter']),
  S('math.linear-functions', 'Linear functions and slope', 'Mathematics', 9, ['math.linear-equations']),
  S('math.quadratics', 'Quadratic functions', 'Mathematics', 10, ['math.linear-functions']),
  S('math.statistics', 'Mean, spread and data', 'Mathematics', 10),
  S('math.trigonometry', 'Right-triangle trigonometry', 'Mathematics', 10, ['math.pythagorean']),
  S('math.exponents-logs', 'Exponents and logarithms', 'Mathematics', 11, ['math.scientific-notation', 'math.linear-equations']),
  S('math.vectors', 'Vectors', 'Mathematics', 11, ['math.trigonometry']),
  S('math.derivatives', 'Rates of change and derivatives', 'Mathematics', 12, ['math.quadratics', 'math.linear-functions']),

  // Physics
  S('phys.kinematics', 'Motion: velocity and acceleration', 'Physics', 10, ['math.linear-functions', 'math.units']),
  S('phys.forces', "Forces and Newton's laws", 'Physics', 10, ['phys.kinematics']),
  S('phys.energy', 'Work and energy', 'Physics', 11, ['phys.forces']),
  S('phys.momentum', 'Momentum and collisions', 'Physics', 11, ['phys.forces']),
  S('phys.waves', 'Waves', 'Physics', 11, ['math.trigonometry']),
  S('phys.circuits', "Electric circuits and Ohm's law", 'Physics', 11, ['math.linear-equations']),
  S('phys.projectiles', 'Projectile motion', 'Physics', 11, ['phys.kinematics', 'math.vectors']),
  S('phys.oscillations', 'Pendulums and oscillation', 'Physics', 11, ['phys.forces', 'math.trigonometry']),
  S('phys.gravitation', 'Gravitation', 'Physics', 12, ['phys.forces', 'math.exponents-logs']),

  // Chemistry
  S('chem.atoms', 'Atoms and the periodic table', 'Chemistry', 9),
  S('chem.moles', 'Moles and molar mass', 'Chemistry', 10, ['chem.atoms', 'math.scientific-notation']),
  S('chem.bonding', 'Chemical bonding', 'Chemistry', 10, ['chem.atoms']),
  S('chem.gas-laws', 'Gas laws', 'Chemistry', 11, ['chem.moles', 'math.proportional-reasoning']),
  S('chem.acids', 'Acids, bases and pH', 'Chemistry', 11, ['chem.moles', 'math.exponents-logs']),
  S('chem.equilibrium', 'Chemical equilibrium', 'Chemistry', 12, ['chem.acids']),

  // Engineering
  S('eng.design-process', 'The engineering design process', 'Engineering', 9),
  S('eng.statics', 'Statics: torque and balance', 'Engineering', 11, ['phys.forces']),
  S('eng.circuit-design', 'Designing circuits', 'Engineering', 11, ['phys.circuits']),
  S('eng.materials', 'Stress, strain and materials', 'Engineering', 12, ['phys.forces', 'math.units']),
  S('eng.control', 'Feedback and control systems', 'Engineering', 12, ['eng.design-process']),

  // Computer science
  S('cs.binary', 'Binary numbers', 'Computer Science', 9),
  S('cs.algorithms', 'Algorithms: sorting and searching', 'Computer Science', 9),
  S('cs.logic', 'Boolean logic and gates', 'Computer Science', 10, ['cs.binary']),
  S('cs.complexity', 'Counting the cost of algorithms', 'Computer Science', 11, ['cs.algorithms', 'math.exponents-logs']),
];

export const SKILLS: Skill[] = RAW.map((s) => SkillSchema.parse(s));
const BY_ID = new Map(SKILLS.map((s) => [s.id, s]));

export function getSkill(id: string): Skill | undefined { return BY_ID.get(id); }

/** Structural problems: unknown prerequisites, cycles, prerequisites taught later than the skill. */
export function validateSkillGraph(skills: Skill[] = SKILLS): string[] {
  const ids = new Map(skills.map((s) => [s.id, s]));
  const problems: string[] = [];
  for (const s of skills) for (const p of s.prerequisites) {
    const pre = ids.get(p);
    if (!pre) problems.push(`${s.id}: unknown prerequisite ${p}`);
    else if (pre.grade > s.grade) problems.push(`${s.id} (grade ${s.grade}) requires ${p} taught later (grade ${pre.grade})`);
  }
  const state = new Map<string, number>();
  const visit = (id: string, path: string[]) => {
    if (state.get(id) === 2) return;
    if (state.get(id) === 1) { problems.push(`cycle: ${[...path, id].join(' → ')}`); return; }
    state.set(id, 1);
    for (const p of ids.get(id)?.prerequisites ?? []) if (ids.has(p)) visit(p, [...path, id]);
    state.set(id, 2);
  };
  skills.forEach((s) => visit(s.id, []));
  return problems;
}
