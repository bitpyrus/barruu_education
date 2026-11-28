/**
 * Misconception catalogue.
 *
 * Every `misconception` id used by course content (choice distractors) or emitted by the
 * engine must be listed here, attached to the skill it undermines. A distractor choice is
 * probabilistic evidence of a misconception, not proof (Eedi research), so the learner model
 * should treat these as signals to weigh, never as verdicts.
 *
 * `basis`:
 *  - `research`: documented in the cited research (see docs/research/World class math curriculum.md);
 *  - `classic`:  widely reported, but no citation collected yet. Cite before making claims about it;
 *  - `authored`: a lesson-specific hypothesis written by Barruu authors for a distractor.
 */
export type MisconceptionBasis = 'research' | 'classic' | 'authored';

export interface Misconception {
  id: string;
  skill: string;
  description: string;
  basis: MisconceptionBasis;
  sources?: string[];
}

const M = (id: string, skill: string, basis: MisconceptionBasis, description: string, sources?: string[]): Misconception =>
  ({ id, skill, basis, description, ...(sources ? { sources } : {}) });

export const MISCONCEPTIONS: Misconception[] = [
  // ── Mathematics: research-backed ───────────────────────────────────────────
  M('equals-means-compute', 'math.equals-sign', 'research', 'Reads "=" as "now write the answer" instead of "both sides have the same value".',
    ['https://alibali.psych.wisc.edu/wp-content/uploads/sites/371/2018/02/KnuthStephensMcNeilAlibali2006.pdf']),
  M('add-tops-and-bottoms', 'math.add-fractions', 'research', 'Adds numerators and denominators: 1/8 + 1/2 = 2/10.',
    ['https://dera.ioe.ac.uk/30457/1/KS2_KS3_Maths_Guidance_2017.pdf']),
  M('whole-number-bias', 'math.compare-fractions', 'research', 'Judges fractions by the size of their parts as whole numbers: 1/6 > 1/4 because 6 > 4.',
    ['https://ies.ed.gov/ncee/wwc/PracticeGuide/15']),
  M('multiplication-makes-bigger', 'math.scale-fractions', 'research', 'Believes multiplying always increases and dividing always decreases.',
    ['https://dera.ioe.ac.uk/30457/1/KS2_KS3_Maths_Guidance_2017.pdf']),
  M('longer-decimal-is-larger', 'math.compare-fractions', 'research', 'Thinks a decimal with more digits is larger: 0.125 > 0.3.',
    ['https://dfki.de/web/forschung/projekte-publikationen/publikation/8598']),
  M('slope-height-confusion', 'math.covariation', 'research', 'Reads the height of a graph where the slope is asked (who is faster where two distance–time lines cross).',
    ['https://mste.illinois.edu/murphy/Papers/GraphInterpPaper.html']),
  M('graph-as-picture', 'math.covariation', 'research', 'Treats a graph as a picture of the situation (a speed–time graph shaped like the hill).',
    ['https://mste.illinois.edu/murphy/Papers/GraphInterpPaper.html']),
  M('equation-solving-moves', 'math.linear-equations', 'research', 'Sign, equals and like-term errors when transforming equations.',
    ['https://pact.cs.cmu.edu/pubs/BoothKoedingerCogSci2008.pdf']),
  M('radian-as-conversion', 'math.radians', 'research', 'Sees radians only as a conversion of degrees, not as arc length measured in radius-lengths.',
    ['https://link.springer.com/article/10.1007/s10649-015-9671-6']),
  M('trig-compartments', 'math.unit-circle', 'research', 'Keeps right-triangle trigonometry and unit-circle trigonometry as unrelated ideas (cannot find sin 150°).',
    ['https://link.springer.com/article/10.1007/s10649-015-9671-6']),
  M('conjunction-fallacy', 'math.compound-events', 'research', 'Judges "A and B" as more likely than "A" alone when the combination seems representative.',
    ['https://en.wikipedia.org/wiki/Conjunction_fallacy']),
  M('limit-never-reached', 'math.limits', 'research', 'Believes a limit is something approached but never reached (0.999… < 1); continuity means "no lifting the pen".',
    ['https://link.springer.com/doi/10.1007/BF00305619']),

  // ── Mathematics: classic, citation pending ─────────────────────────────────
  M('fraction-as-halfway', 'math.fractions-on-line', 'authored', 'Places any proper fraction at or near one half.'),
  M('unit-fractions-equal', 'math.compare-fractions', 'authored', 'Thinks all unit fractions (1/n) are the same size.'),
  M('counts-from-wrong-end', 'math.fractions-on-line', 'authored', 'Counts spaces from 1 (or after the point) instead of from 0.'),
  M('one-short-means-equal', 'math.compare-fractions', 'authored', 'Thinks fractions that are each one part short of 1 (7/8, 5/6) are equal.'),
  M('smaller-denominator-bigger', 'math.compare-fractions', 'authored', 'Over-applies "fewer parts means bigger parts" from unit fractions to any fractions (thinks 5/6 > 7/8).'),
  M('shorter-decimal-is-larger', 'math.compare-fractions', 'classic', 'Thinks a decimal with fewer digits is larger because tenths beat hundredths: 0.4 > 0.45.'),
  M('counts-ticks-not-spaces', 'math.fractions-on-line', 'classic', 'Counts tick marks instead of equal spaces to find the denominator (calls the third of five spaces 3/4 or 3/6).'),
  M('negative-square-precedence', 'math.exponent-laws', 'classic', 'Reads −3² as (−3)² = 9.'),
  M('freshman-binomial', 'math.expanding', 'classic', 'Expands (a + b)² as a² + b².'),
  M('root-of-sum', 'math.surds', 'classic', 'Splits roots over addition: √(a + b) = √a + √b.'),
  M('function-notation-product', 'math.function-notation', 'classic', 'Reads f(x) as f times x.'),
  M('power-as-product', 'math.exponent-laws', 'classic', 'Computes 2³ as 2 × 3 = 6.'),
  M('log-of-sum', 'math.log-laws', 'classic', 'Splits logarithms over addition: log(a + b) = log a + log b.'),
  M('divide-by-variable', 'math.factoring', 'classic', 'Divides both sides by x and loses the root x = 0.'),
  M('zero-product-misuse', 'math.factoring', 'classic', 'Applies the zero-product rule to a product equal to a non-zero number ((x − 2)(x − 3) = 6).'),
  M('area-perimeter-conflation', 'math.area-perimeter', 'classic', 'Treats area and perimeter as the same measure, or expects one to determine the other.'),
  M('angle-arm-length', 'math.angles', 'classic', 'Judges angle size by the length of its arms.'),
  M('additive-similarity', 'math.similarity', 'classic', 'Enlarges shapes by adding the same amount to every side instead of multiplying.'),
  M('gamblers-fallacy', 'math.chance', 'classic', 'Expects independent outcomes to "balance out" (after five heads, tails is due).'),
  M('mean-median-skew', 'math.statistics', 'classic', 'Expects the mean and median to agree even for skewed data.'),
  M('integral-only-area', 'math.integration', 'classic', 'Sees the integral only as an area, not as accumulation of a rate.'),

  // ── Mathematics: authored for lessons ──────────────────────────────────────
  M('bigger-outline-means-bigger-area', 'math.area-by-rearranging', 'authored', 'A shape that looks bigger (longer outline) must cover more area.'),
  M('compact-means-bigger', 'math.area-by-rearranging', 'authored', 'A compact shape must cover more area than a spread-out one.'),
  M('same-area-same-perimeter', 'math.area-perimeter', 'authored', 'Shapes with the same area must have the same perimeter.'),
  M('same-perimeter-same-area', 'math.area-perimeter', 'authored', 'Shapes with the same perimeter must have the same area.'),
  M('triangle-is-a-third', 'math.triangle-area', 'authored', 'A triangle covers a third of its bounding rectangle.'),
  M('triangle-is-small', 'math.triangle-area', 'authored', 'A triangle covers much less than half of its bounding rectangle.'),
  M('apex-position-changes-area', 'math.triangle-area', 'authored', 'Sliding a triangle\'s apex parallel to the base changes its area.'),
  M('forgot-half', 'math.triangle-area', 'authored', 'Uses base × height for a triangle, forgetting the ½.'),
  M('coefficient-a-shifts-graph', 'math.graph-transformations', 'authored', 'Thinks the leading coefficient of a quadratic slides the parabola sideways.'),
  M('sign-irrelevant', 'math.graph-transformations', 'authored', 'Thinks the sign of the leading coefficient does not matter.'),
  M('vertex-sign-error', 'math.quadratics', 'authored', 'Gets the sign wrong in x = −b/2a.'),
  M('vertex-forgot-2a', 'math.quadratics', 'authored', 'Uses −b/a instead of −b/2a for the vertex.'),

  // ── Physics ────────────────────────────────────────────────────────────────
  M('current-one-way-to-load', 'phys.circuits', 'classic', 'Thinks current flows from the battery to a bulb along one wire, with no return path needed (unipolar model).'),
  M('current-consumed', 'phys.circuits', 'classic', 'Thinks bulbs use up current, so less returns to the battery.'),
  M('battery-constant-current', 'phys.circuits', 'classic', 'Thinks a battery always delivers the same current, whatever is connected.'),
  M('short-circuit-shares-current', 'phys.circuits', 'authored', 'Thinks a bulb still gets its share of current when a wire bypasses it.'),
  M('more-wire-more-current', 'phys.circuits', 'authored', 'Thinks adding wire increases the current through a bulb.'),
  M('more-bulbs-more-light', 'phys.circuits', 'authored', 'Thinks adding bulbs in series makes each brighter.'),
  M('series-bulb-blocks-current', 'phys.circuits', 'authored', 'Thinks a second bulb in series blocks all current.'),
  M('parallel-single-path', 'phys.circuits', 'authored', 'Thinks bulbs in parallel share one path, so one gap stops them all.'),
  M('current-inverse-voltage', 'phys.circuits', 'authored', 'Thinks more voltage gives less current.'),
  M('resistance-increases-current', 'phys.circuits', 'authored', 'Thinks more resistance gives more current.'),
  M('short-circuit', 'phys.circuits', 'authored', 'Builds a path of wire alone across the battery (emitted by the circuit checker).'),
  M('period-linear-in-length', 'phys.oscillations', 'authored', 'Thinks a pendulum\'s period is proportional to its length.'),
  M('period-independent-of-length', 'phys.oscillations', 'authored', 'Thinks a pendulum\'s length does not affect its period.'),
  M('large-angle-faster', 'phys.oscillations', 'authored', 'Thinks a larger release angle makes a pendulum swing faster.'),
  M('longer-is-faster', 'phys.oscillations', 'authored', 'Thinks a longer pendulum swings faster.'),
  M('model-always-exact', 'phys.oscillations', 'authored', 'Thinks a simplified model is exact in every situation.'),

  // ── Computer science ───────────────────────────────────────────────────────
  M('one-pass-sorts', 'cs.algorithms', 'authored', 'Thinks a single pass of bubble sort sorts the list.'),
  M('bubble-moves-smallest-first', 'cs.algorithms', 'authored', 'Thinks bubble sort moves the smallest value into place first.'),
  M('reverse-is-best-case', 'cs.complexity', 'authored', 'Thinks a reversed list is the best case for early-exit bubble sort.'),
  M('input-order-irrelevant', 'cs.complexity', 'authored', 'Thinks the input order never affects an algorithm\'s cost.'),
];

export const MISCONCEPTION_BY_ID = new Map(MISCONCEPTIONS.map((m) => [m.id, m]));
