/**
 * Placement item bank.
 *
 * Every item is a deterministic engine `Question` tied to one skill, with a
 * difficulty `b` on the same logit scale as learner ability θ (Rasch model).
 * The scale is anchored to grade: θ = (grade − 10.5) × 0.8, so a typical
 * grade-9 item sits near −1.2 and a grade-12 item near +1.2.
 *
 * ⚠ Difficulties are currently EXPERT ESTIMATES (`calibration: 'estimated'`).
 * Once real responses exist they must be re-estimated (see docs/PLACEMENT.md);
 * placement precision depends on it.
 */
import { z } from 'zod';
import { QuestionSchema, type Question } from '@barruu/engine';
import { getSkill } from './skills';

export const gradeToTheta = (grade: number) => (grade - 10.5) * 0.8;
export const thetaToGrade = (theta: number) => theta / 0.8 + 10.5;

export const ItemSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  skill: z.string(),
  /** Difficulty in logits. */
  b: z.number().min(-4).max(4),
  calibration: z.enum(['estimated', 'calibrated']).default('estimated'),
  question: QuestionSchema,
});
export type Item = z.infer<typeof ItemSchema> & { question: Question };

/** Helper: difficulty relative to the skill's grade (delta in logits, ±0.4 ≈ ½ grade). */
function item(id: string, skill: string, delta: number, question: unknown) {
  const s = getSkill(skill);
  if (!s) throw new Error(`item ${id}: unknown skill ${skill}`);
  return { id, skill, b: Number((gradeToTheta(s.grade) + delta).toFixed(2)), question };
}
const num = (prompt: string, answer: number, tolerance = 0, unit?: string) => ({ kind: 'numeric', prompt, answer, tolerance, ...(unit ? { unit } : {}) });
const choice = (prompt: string, options: [string, boolean][]) => ({
  kind: 'choice', prompt, options: options.map(([text, correct], i) => ({ id: String.fromCharCode(97 + i), text, correct })),
});

const RAW = [
  // Mathematics
  item('ma-area', 'math.area-perimeter', 0, num('A rectangle is 7 units wide and 3 units tall. What is its area, in square units?', 21)),
  item('ma-ratio', 'math.proportional-reasoning', 0.2, num('4 notebooks cost $10. How many dollars do 10 notebooks cost?', 25, 0, '$')),
  item('ma-lineq', 'math.linear-equations', -0.2, num('Solve for $x$: $3x + 5 = 20$', 5)),
  item('ma-units', 'math.units', 0.3, num('A car travels at 72 km/h. What is that in metres per second?', 20, 0, 'm/s')),
  item('ma-sci', 'math.scientific-notation', 0, num('$0.00042 = 4.2 \\times 10^{n}$. What is $n$?', -4)),
  item('ma-pyth', 'math.pythagorean', 0, num('A right triangle has legs of length 6 and 8. How long is the hypotenuse?', 10)),
  item('ma-slope', 'math.linear-functions', 0.1, num('What is the slope of the line through $(1, 2)$ and $(3, 8)$?', 3)),
  item('ma-quad', 'math.quadratics', 0, num('$x^2 - 5x + 6 = 0$ has two solutions. What is the larger one?', 3)),
  item('ma-mean', 'math.statistics', -0.3, num('What is the mean of 2, 4 and 9?', 5)),
  item('ma-trig', 'math.trigonometry', 0.2, num('In a right triangle with hypotenuse 10, one angle is 30°. How long is the side opposite that angle?', 5)),
  item('ma-log', 'math.exponents-logs', -0.1, num('What is $\\log_2 32$?', 5)),
  item('ma-exp', 'math.exponents-logs', 0.3, num('Solve $2^x = \\tfrac{1}{8}$.', -3)),
  item('ma-vec', 'math.vectors', 0, num('What is the length (magnitude) of the vector $(5, 12)$?', 13)),
  item('ma-deriv', 'math.derivatives', 0, num('If $f(x) = x^3$, what is $f\'(2)$?', 12)),

  // Physics (g = 9.8 m/s² unless stated)
  item('ph-kin-v', 'phys.kinematics', -0.2, num('A car starts from rest and accelerates at 2 m/s² for 5 s. What is its final speed?', 10, 0, 'm/s')),
  item('ph-kin-d', 'phys.kinematics', 0.3, num('A car starts from rest and accelerates at 2 m/s² for 5 s. How far does it travel?', 25, 0, 'm')),
  item('ph-f-ma', 'phys.forces', -0.3, num('What net force accelerates a 3 kg mass at 4 m/s²?', 12, 0, 'N')),
  item('ph-f-const', 'phys.forces', 0.2, choice('A hockey puck slides across frictionless ice at a constant velocity. What is the net force on it?', [
    ['Zero', true], ['A force in the direction it is moving', false], ['A force opposite to its motion', false]])),
  item('ph-ke', 'phys.energy', -0.2, num('What is the kinetic energy of a 2 kg ball moving at 3 m/s?', 9, 0, 'J')),
  item('ph-drop', 'phys.energy', 0.4, num('A stone is dropped from 5 m. Ignoring air resistance and using $g = 9.8$ m/s², how fast is it moving when it lands? (to 1 decimal place)', 9.9, 0.05, 'm/s')),
  item('ph-mom', 'phys.momentum', 0.2, num('A 2 kg cart moving at 3 m/s hits a 1 kg cart at rest, and they stick together. How fast do they move afterwards?', 2, 0, 'm/s')),
  item('ph-wave', 'phys.waves', -0.2, num('A wave has frequency 5 Hz and wavelength 2 m. What is its speed?', 10, 0, 'm/s')),
  item('ph-ohm', 'phys.circuits', -0.3, num('A 12 V battery is connected across a 4 Ω resistor. What current flows?', 3, 0, 'A')),
  item('ph-parallel', 'phys.circuits', 0.3, num('Two 6 Ω resistors are connected in parallel. What is their combined resistance?', 3, 0, 'Ω')),
  item('ph-proj', 'phys.projectiles', 0.1, num('A ball is thrown horizontally from a 20 m cliff. Using $g = 10$ m/s², how long until it hits the ground?', 2, 0, 's')),
  item('ph-pend', 'phys.oscillations', 0, choice('If you make a pendulum 4 times longer, its period (for small swings)…', [
    ['doubles', true], ['becomes 4 times longer', false], ['halves', false], ['stays the same', false]])),
  item('ph-grav', 'phys.gravitation', 0, choice('If the distance between two masses doubles, the gravitational force between them becomes…', [
    ['¼ as strong', true], ['½ as strong', false], ['twice as strong', false], ['unchanged', false]])),

  // Chemistry (H = 1, O = 16 g/mol)
  item('ch-neutrons', 'chem.atoms', 0, num('Carbon has atomic number 6. How many neutrons are in an atom of carbon-12?', 6)),
  item('ch-molar', 'chem.moles', -0.3, num('Using H = 1 g/mol and O = 16 g/mol, what is the molar mass of water (H₂O)?', 18, 0, 'g/mol')),
  item('ch-moles', 'chem.moles', 0.2, num('How many moles of water are in 36 g of water? (molar mass 18 g/mol)', 2, 0, 'mol')),
  item('ch-bond', 'chem.bonding', 0, choice('Which kind of bond forms when atoms share electrons?', [
    ['Covalent', true], ['Ionic', false], ['Metallic', false]])),
  item('ch-boyle', 'chem.gas-laws', 0, choice('At constant temperature, the pressure on a gas doubles. Its volume becomes…', [
    ['half as large', true], ['twice as large', false], ['unchanged', false]])),
  item('ch-ph', 'chem.acids', 0, num('A solution has $[\\mathrm{H^+}] = 10^{-3}$ mol/L. What is its pH?', 3)),
  item('ch-eq', 'chem.equilibrium', 0, choice('A reaction is at equilibrium. You add more of a product. The equilibrium shifts…', [
    ['towards the reactants', true], ['towards the products', false], ['it doesn\'t shift', false]])),

  // Engineering
  item('en-design', 'eng.design-process', -0.4, choice('What is usually the first step of the engineering design process?', [
    ['Define the problem and its constraints', true], ['Build a prototype', false], ['Test the final product', false]])),
  item('en-torque', 'eng.statics', 0, num('A 40 kg child sits 1.5 m from a seesaw\'s pivot. How far from the pivot must a 30 kg child sit on the other side to balance it?', 2, 0, 'm')),
  item('en-stress', 'eng.materials', 0, num('A rod with cross-section 0.01 m² carries a 1000 N load. What is the stress, in pascals?', 100000, 0, 'Pa')),
  item('en-control', 'eng.control', 0, choice('A thermostat measures the room temperature and switches the heater on or off to keep it near a target. This is…', [
    ['feedback (closed-loop) control', true], ['open-loop control', false], ['not a control system', false]])),
  item('en-led', 'eng.circuit-design', 0.2, num('An LED needs 2 V and 0.02 A. With a 9 V battery, what series resistor value is needed?', 350, 0, 'Ω')),

  // Computer science
  item('cs-bin', 'cs.binary', 0, num('What is the binary number 1011 in decimal?', 11)),
  item('cs-sort', 'cs.algorithms', 0.4, num('How many comparisons does bubble sort make on a reversed list of 6 items?', 15)),
  item('cs-logic', 'cs.logic', 0, num('With A = 1 and B = 0, what is A AND (NOT B)? (answer 0 or 1)', 1)),
  item('cs-halving', 'cs.complexity', 0, num('Binary search halves the list each step. How many halvings take 1024 items down to 1?', 10)),
  item('cs-bits', 'cs.binary', 0.4, num('How many different values can 8 bits represent?', 256)),
  item('cs-linear', 'cs.algorithms', -0.3, num('Searching an unsorted list of 100 items one by one, how many items must you check in the worst case?', 100)),
];

export const ITEMS: Item[] = RAW.map((r) => ItemSchema.parse(r) as Item);
