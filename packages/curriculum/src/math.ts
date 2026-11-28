/**
 * The Barruu mathematics curriculum: courses, chapters and the math skill graph.
 *
 * Design (docs/MATH_CURRICULUM.md, research in docs/research/):
 *  - one coherent skill graph; every course chapter is one skill with prerequisites;
 *  - seven strands revisited with depth (Singapore/Japan structure) and international
 *    scope (England/Singapore/Cambridge: vectors, sine/cosine rules, early calculus);
 *  - national syllabi are *views* of the graph via versioned alignment tags.
 *
 * Skill ids that existed before this file (math.linear-functions, math.pythagorean, …)
 * are kept as chapter skills so placement items and courses keep working.
 * Grades are typical US grades; 13+ = university.
 */

export const MATH_STRANDS = {
  N: 'Number and proportion',
  A: 'Algebra and functions',
  G: 'Geometry, trigonometry and vectors',
  D: 'Data, probability and statistics',
  C: 'Calculus',
  P: 'Logic, proof and discrete mathematics',
  L: 'Linear algebra',
} as const;
export type MathStrand = keyof typeof MATH_STRANDS;

export const MATH_BANDS = {
  foundations: { title: 'Foundations', grades: [6, 7] },
  hinge: { title: 'The hinge', grades: [8, 9] },
  core: { title: 'Core', grades: [9, 10] },
  advanced: { title: 'Advanced', grades: [10, 12] },
  university: { title: 'Calculus and university year 1', grades: [12, 14] },
} as const;
export type MathBand = keyof typeof MATH_BANDS;

/**
 * Frameworks we align to. Versions matter: syllabi change (IB announced new courses for first
 * assessment in 2029). `verified: false` means the codes were not checked against the current
 * official document during research and must be before they are shown to learners.
 */
export const FRAMEWORKS = {
  ccss: { title: 'US Common Core State Standards (Mathematics)', version: '2010', verified: true },
  ap: { title: 'College Board AP (Precalculus 2023, Calculus AB/BC, Statistics 2026)', version: '2026', verified: true },
  england: { title: 'England KS3 / GCSE / A-level (DfE subject content)', version: '2014-2017', verified: true },
  singapore: { title: 'Singapore MOE / SEAB (O-level, Additional Maths, H2)', version: '2020', verified: false },
  ib: { title: 'IB DP Mathematics AA/AI', version: '2019', verified: false },
  cambridge: { title: 'Cambridge IGCSE 0580 (2025–2027) / A-level 9709', version: '2025', verified: true },
} as const;
export type Framework = keyof typeof FRAMEWORKS;

/**
 * Interactives the math curriculum needs, ranked by reach (docs/MATH_CURRICULUM.md).
 * `available` ones exist in @barruu/engine's registry; the rest are planned.
 */
export const MATH_INTERACTIVES = {
  gridBoard: { status: 'available', rank: 0 },
  functionExplorer: { status: 'available', rank: 0 },
  pendulumLab: { status: 'available', rank: 0 },
  circuitBoard: { status: 'available', rank: 0 },
  numberLine: { status: 'available', rank: 1 },
  balanceTiles: { status: 'planned', rank: 2 },
  functionLab: { status: 'planned', rank: 3 },
  transformationBoard: { status: 'planned', rank: 4 },
  probabilitySimulator: { status: 'planned', rank: 5 },
  vectorBoard: { status: 'planned', rank: 6 },
  unitCircle: { status: 'planned', rank: 7 },
  dataPlotter: { status: 'planned', rank: 8 },
  proofBuilder: { status: 'planned', rank: 9 },
  graphBoard: { status: 'planned', rank: 10 },
} as const;
export type MathInteractive = keyof typeof MATH_INTERACTIVES;

export interface MathChapter {
  /** Skill id taught by this chapter (also the chapter id). */
  skill: string;
  title: string;
  grade: number;
  prerequisites: string[];
}

export interface MathCourse {
  /** Short code from the curriculum plan, e.g. "H1". */
  code: string;
  id: string;
  title: string;
  strands: MathStrand[];
  band: MathBand;
  /** Interactives this course needs (existing or planned; see docs/MATH_CURRICULUM.md). */
  interactives: MathInteractive[];
  /** Alignment tags per framework (codes / topic names). */
  alignment: Partial<Record<Framework, string[]>>;
  /** Built course in packages/content that implements (part of) this plan, if any. */
  implementedBy?: string;
  chapters: MathChapter[];
}

type Ch = [skill: string, title: string, grade: number, prerequisites?: string[]];
const course = (
  code: string, id: string, title: string, strands: MathStrand[], band: MathBand,
  interactives: MathInteractive[], alignment: MathCourse['alignment'], chapters: Ch[], implementedBy?: string,
): MathCourse => ({
  code, id, title, strands, band, interactives, alignment, ...(implementedBy ? { implementedBy } : {}),
  chapters: chapters.map(([skill, t, grade, prerequisites = []]) => ({ skill, title: t, grade, prerequisites })),
});

export const MATH_COURSES: MathCourse[] = [
  // ── Foundations (grades 6–7) ───────────────────────────────────────────────
  course('F1', 'numbers-on-the-line', 'Numbers on the line: fractions, decimals, negatives', ['N'], 'foundations',
    ['numberLine'], { ccss: ['6.NS', '7.NS'], england: ['KS3 Number'], singapore: ['Sec 1 Numbers'], cambridge: ['IGCSE E1'] }, [
      ['math.fractions-on-line', 'Where fractions live', 6],
      ['math.compare-fractions', 'Comparing and ordering fractions and decimals', 6, ['math.fractions-on-line']],
      ['math.add-fractions', 'Adding and subtracting with a sense of size', 6, ['math.compare-fractions']],
      ['math.scale-fractions', 'Scaling: multiplying and dividing fractions and decimals', 6, ['math.add-fractions']],
      ['math.integers', 'Below zero: integers and their operations', 7, ['math.fractions-on-line']],
    ], 'numbers-on-the-line'),
  course('F2', 'ratio-rate-proportion', 'Ratio, rate and proportion', ['N'], 'foundations',
    ['numberLine', 'functionExplorer'], { ccss: ['6.RP', '7.RP'], england: ['KS3 Ratio, proportion and rates of change'], singapore: ['Sec 1 Ratio, rate and speed'], cambridge: ['IGCSE E1.11–E1.12'] }, [
      ['math.ratio-tables', 'Ratio tables and double number lines', 6, ['math.scale-fractions']],
      ['math.units', 'Unit rates and converting units', 7, ['math.ratio-tables']],
      ['math.proportional-reasoning', 'Proportional relationships y = kx', 7, ['math.units']],
      ['math.percent', 'Percent, growth and discount', 7, ['math.proportional-reasoning']],
      ['math.scale-drawings', 'Scale drawings and maps', 7, ['math.proportional-reasoning']],
      ['math.inverse-proportion', 'Inverse proportion', 7, ['math.proportional-reasoning']],
    ]),
  course('F3', 'expressions-and-equations', 'Expressions and equations: the balance', ['A'], 'foundations',
    ['balanceTiles', 'numberLine'], { ccss: ['6.EE', '7.EE', '8.EE.7'], england: ['KS3 Algebra'], singapore: ['Sec 1 Algebra, linear equations'], cambridge: ['IGCSE E2.1–E2.5'] }, [
      ['math.equals-sign', 'What "=" means', 6],
      ['math.equivalent-expressions', 'Equivalent expressions and the properties', 6, ['math.equals-sign']],
      ['math.two-step-equations', 'One- and two-step equations', 7, ['math.equivalent-expressions', 'math.integers']],
      ['math.linear-equations', 'Variables on both sides', 8, ['math.two-step-equations']],
      ['math.inequalities-1d', 'Inequalities on the number line', 7, ['math.two-step-equations']],
      ['math.writing-equations', 'Writing equations from situations', 7, ['math.two-step-equations']],
    ]),
  course('F4', 'shape-and-measure', 'Mathematical Thinking: shape and measure', ['G'], 'foundations',
    ['gridBoard'], { ccss: ['6.G', '7.G'], england: ['KS3 Geometry and measures'], singapore: ['Sec 1 Mensuration'], cambridge: ['IGCSE E5'] }, [
      ['math.area-by-rearranging', 'Area by covering and rearranging', 6],
      ['math.area-perimeter', 'Perimeter versus area', 7, ['math.area-by-rearranging']],
      ['math.triangle-area', 'Area of triangles and polygons', 7, ['math.area-by-rearranging']],
      ['math.angles', 'Angles: parallel lines, triangles and polygons', 7],
      ['math.circles', 'Circles: π, circumference and area', 7, ['math.area-perimeter', 'math.scale-fractions']],
      ['math.volume', 'Surface area and volume', 7, ['math.triangle-area']],
      ['math.scale-factor', 'Scale factor, area and volume', 7, ['math.volume', 'math.scale-drawings']],
    ], 'mathematical-thinking'),
  course('F5', 'data-and-chance', 'Data and chance', ['D'], 'foundations',
    ['probabilitySimulator', 'dataPlotter'], { ccss: ['6.SP', '7.SP'], england: ['KS3 Statistics, Probability'], singapore: ['Sec 1 Statistics'], cambridge: ['IGCSE E8–E9'] }, [
      ['math.data-questions', 'Questions and data', 6],
      ['math.statistics', 'Centre and spread: mean, median, IQR', 6, ['math.data-questions']],
      ['math.data-displays', 'Dot plots, box plots and histograms', 6, ['math.statistics']],
      ['math.chance', 'Chance as long-run frequency', 7, ['math.fractions-on-line']],
      ['math.sample-spaces', 'Sample spaces', 7, ['math.chance']],
    ]),

  // ── The hinge (grades 8–9) ─────────────────────────────────────────────────
  course('H1', 'linear-relationships', 'Linear relationships and the function idea', ['A'], 'hinge',
    ['functionLab', 'functionExplorer'], { ccss: ['8.EE.5–6', '8.F', 'F-IF', 'F-LE'], england: ['GCSE linear graphs, gradients'], singapore: ['Sec 1–2 Functions and graphs'], cambridge: ['IGCSE E2.10, E3'] }, [
      ['math.function-machines', 'Input–output machines', 8, ['math.writing-equations']],
      ['math.slope', 'Slope as rate, justified by similar triangles', 8, ['math.proportional-reasoning', 'math.function-machines']],
      ['math.linear-functions', 'y = mx + b in table, graph, equation and story', 8, ['math.slope', 'math.linear-equations']],
      ['math.covariation', 'Distance–time graphs: how quantities change together', 8, ['math.linear-functions']],
      ['math.linear-vs-nonlinear', 'Linear or not? Equal differences', 8, ['math.linear-functions']],
      ['math.linear-modelling', 'Modelling with lines', 9, ['math.covariation', 'math.linear-vs-nonlinear']],
    ]),
  course('H2', 'powers-and-roots', 'Powers, roots and real numbers', ['N', 'A'], 'hinge',
    ['numberLine'], { ccss: ['8.EE.1–4', '8.NS', 'N-RN'], england: ['GCSE Higher indices, surds'], singapore: ['Sec 2 indices', 'Add Maths surds'], ib: ['Topic 1'], cambridge: ['IGCSE E1.7–E1.9, E1.18'] }, [
      ['math.exponent-laws', 'Exponent laws by pattern', 8, ['math.equivalent-expressions']],
      ['math.negative-exponents', 'Zero and negative exponents', 8, ['math.exponent-laws', 'math.integers']],
      ['math.scientific-notation', 'Scientific notation and orders of magnitude', 8, ['math.negative-exponents']],
      ['math.irrationals', 'Roots and irrational numbers', 8, ['math.exponent-laws', 'math.compare-fractions']],
      ['math.surds', 'Surds and exact values', 9, ['math.irrationals']],
    ]),
  course('H3', 'systems-and-inequalities', 'Systems and inequalities', ['A'], 'hinge',
    ['balanceTiles', 'functionLab', 'circuitBoard'], { ccss: ['8.EE.8', 'A-REI.5–12'], england: ['GCSE simultaneous equations, inequalities'], singapore: ['Sec 2 simultaneous equations'], cambridge: ['IGCSE E2.5–E2.7'] }, [
      ['math.systems-graphing', 'Two lines, one point', 8, ['math.linear-functions']],
      ['math.systems-algebra', 'Elimination and substitution as balance moves', 9, ['math.systems-graphing', 'math.linear-equations']],
      ['math.systems-special', 'No solution or infinitely many', 9, ['math.systems-algebra']],
      ['math.inequalities-2d', 'Inequalities in two variables and feasible regions', 9, ['math.systems-graphing', 'math.inequalities-1d']],
    ]),
  course('H4', 'transformations-and-proof', 'Transformations, congruence and proof', ['G', 'P'], 'hinge',
    ['transformationBoard', 'proofBuilder'], { ccss: ['8.G.1–5', 'G-CO'], england: ['GCSE congruence, transformations'], singapore: ['Sec 2 congruence'], cambridge: ['IGCSE E7.1'] }, [
      ['math.rigid-motions', 'Translate, reflect, rotate', 8, ['math.angles']],
      ['math.congruence', 'Congruence defined by motions', 8, ['math.rigid-motions']],
      ['math.congruence-criteria', 'Triangle congruence criteria', 9, ['math.congruence']],
      ['math.geometric-proof', 'From conjecture to proof', 9, ['math.congruence-criteria']],
      ['math.dilations', 'Dilations', 8, ['math.rigid-motions', 'math.scale-factor']],
    ]),
  course('H5', 'similarity-and-right-triangles', 'Similarity, Pythagoras and right-triangle trigonometry', ['G'], 'hinge',
    ['transformationBoard', 'gridBoard'], { ccss: ['8.G.6–8', 'G-SRT'], england: ['KS3 Pythagoras and trigonometric ratios', 'GCSE similarity'], singapore: ['Sec 2 similarity, Pythagoras, trigonometry'], cambridge: ['IGCSE E6.1–E6.3'] }, [
      ['math.similarity', 'Similarity by dilation', 9, ['math.dilations', 'math.proportional-reasoning']],
      ['math.pythagorean', 'Pythagoras: discover, prove, converse', 8, ['math.area-perimeter', 'math.irrationals']],
      ['math.distance-on-grid', 'Distance on the grid', 9, ['math.pythagorean']],
      ['math.trigonometry', 'Trigonometric ratios from similar triangles', 9, ['math.similarity', 'math.pythagorean']],
      ['math.solve-right-triangles', 'Solving right triangles', 9, ['math.trigonometry']],
    ]),

  // ── Core (grades 9–10) ─────────────────────────────────────────────────────
  course('K1', 'quadratics-and-polynomials', 'Quadratics and polynomials: from tiles to the formula', ['A'], 'core',
    ['balanceTiles', 'functionLab'], { ccss: ['A-SSE', 'A-APR', 'A-REI.4', 'F-IF.8'], england: ['GCSE Higher quadratics, completing the square'], singapore: ['Sec 2–3 quadratics', 'Add Maths polynomials'], cambridge: ['IGCSE E2.4–E2.6'] }, [
      ['math.expanding', 'Area models and tiles: expanding', 9, ['math.equivalent-expressions', 'math.area-by-rearranging']],
      ['math.factoring', 'Factoring as un-tiling', 9, ['math.expanding']],
      ['math.completing-square', 'Completing the square', 10, ['math.factoring']],
      ['math.quadratic-formula', 'The quadratic formula and the discriminant', 10, ['math.completing-square', 'math.surds']],
      ['math.quadratics', 'Parabolas: vertex, roots and turning point', 10, ['math.quadratic-formula', 'math.linear-functions']],
      ['math.polynomials', 'Polynomial division and the factor theorem', 10, ['math.factoring']],
    ]),
  course('K2', 'probability', 'Probability: sets, trees and conditional chance', ['D'], 'core',
    ['probabilitySimulator'], { ccss: ['7.SP.5–8', 'S-CP'], england: ['GCSE probability, Venn diagrams'], singapore: ['Sec 2 sets and probability'], ib: ['Topic 4'], cambridge: ['IGCSE E8'] }, [
      ['math.sets-venn', 'Sets, Venn diagrams and notation', 9, ['math.sample-spaces']],
      ['math.compound-events', 'Tree diagrams and compound events', 9, ['math.sample-spaces', 'math.scale-fractions']],
      ['math.conditional-probability', 'Two-way tables and conditional probability', 10, ['math.compound-events', 'math.sets-venn']],
      ['math.independence', 'Independence', 10, ['math.conditional-probability']],
      ['math.counting', 'Counting: permutations and combinations', 10, ['math.compound-events']],
    ]),
  course('K3', 'statistics', 'Statistics: distributions, spread and bivariate data', ['D'], 'core',
    ['dataPlotter'], { ccss: ['8.SP', 'S-ID', 'S-IC.1'], england: ['GCSE statistics'], singapore: ['Sec 3–4 statistics'], cambridge: ['IGCSE E9'] }, [
      ['math.sampling-bias', 'Sampling and bias', 9, ['math.data-questions']],
      ['math.comparing-distributions', 'Comparing distributions', 9, ['math.data-displays']],
      ['math.cumulative-frequency', 'Cumulative frequency and unequal histograms', 10, ['math.comparing-distributions']],
      ['math.correlation', 'Scatter plots, correlation and lines of fit', 9, ['math.linear-functions', 'math.data-displays']],
      ['math.causation', 'Correlation is not causation', 9, ['math.correlation']],
    ]),
  course('K4', 'coordinate-geometry-and-vectors', 'Coordinate geometry and 2D vectors', ['G'], 'core',
    ['transformationBoard', 'vectorBoard'], { ccss: ['G-GPE', 'N-VM (+)'], england: ['GCSE Higher vectors, equation of a circle'], singapore: ['O-level coordinate geometry, vectors'], ib: ['Topic 3'], cambridge: ['IGCSE E3, E7.3'] }, [
      ['math.coordinate-geometry', 'Gradient, midpoint and distance', 9, ['math.distance-on-grid', 'math.slope']],
      ['math.parallel-perpendicular', 'Parallel and perpendicular lines', 10, ['math.coordinate-geometry']],
      ['math.circle-equation', 'The equation of a circle', 10, ['math.coordinate-geometry', 'math.completing-square']],
      ['math.vectors', 'Vectors as displacements', 10, ['math.distance-on-grid']],
      ['math.vector-geometry', 'Proving with vectors', 10, ['math.vectors', 'math.geometric-proof']],
    ]),

  // ── Advanced (grades 10–12) ────────────────────────────────────────────────
  course('V1', 'function-toolkit', 'The function toolkit', ['A'], 'advanced',
    ['functionLab', 'functionExplorer'], { ccss: ['F-IF', 'F-BF'], ap: ['AP Precalculus Unit 1'], england: ['GCSE Higher inverse and composite functions', 'A-level functions'], singapore: ['H2 functions'], ib: ['Topic 2'], cambridge: ['IGCSE E2.13'] }, [
      ['math.function-notation', 'Domain, range and notation', 10, ['math.linear-functions']],
      ['math.composition', 'Composition as pipelines', 10, ['math.function-notation']],
      ['math.inverse-functions', 'Inverses as undoing', 10, ['math.composition', 'math.linear-equations']],
      ['math.graph-transformations', 'Transforming graphs', 10, ['math.function-notation', 'math.quadratics']],
      ['math.piecewise', 'Piecewise and absolute value', 10, ['math.function-notation']],
      ['math.rational-functions', 'Rational functions and asymptotes', 11, ['math.graph-transformations', 'math.polynomials']],
    ]),
  course('V2', 'exponentials-and-logarithms', 'Exponentials and logarithms', ['A'], 'advanced',
    ['functionLab', 'functionExplorer'], { ccss: ['F-LE', 'F-IF.8b'], ap: ['AP Precalculus Unit 2'], england: ['A-level exponentials and logarithms'], singapore: ['Add Maths exponential and logarithmic functions'], ib: ['Topics 1–2'], cambridge: ['A-level 9709 P2'] }, [
      ['math.exponential-growth', 'Equal factors over equal intervals', 10, ['math.negative-exponents', 'math.linear-vs-nonlinear']],
      ['math.growth-decay', 'Growth, decay, half-life and e', 11, ['math.exponential-growth', 'math.percent']],
      ['math.exponents-logs', 'Logarithms as inverse exponentials', 11, ['math.growth-decay', 'math.inverse-functions', 'math.scientific-notation']],
      ['math.log-laws', 'Laws of logarithms', 11, ['math.exponents-logs']],
      ['math.semi-log', 'Straightening data with semi-log plots', 11, ['math.log-laws', 'math.correlation']],
    ]),
  course('V3', 'circular-functions', 'Circular functions: radians, the unit circle and beyond', ['G', 'A'], 'advanced',
    ['unitCircle', 'functionLab', 'pendulumLab'], { ccss: ['F-TF', 'G-SRT.9–11 (+)'], ap: ['AP Precalculus Unit 3'], england: ['GCSE sine and cosine rules', 'A-level trigonometry, radians'], singapore: ['O-level non-right trigonometry', 'Add Maths trigonometric identities'], ib: ['Topic 3'], cambridge: ['IGCSE E6.4–E6.5', 'A-level 9709 P1, P3'] }, [
      ['math.radians', 'The radian: radius-lengths of arc', 10, ['math.circles', 'math.trigonometry']],
      ['math.unit-circle', 'The unit circle and the sine and cosine graphs', 11, ['math.radians', 'math.function-notation']],
      ['math.exact-trig', 'Exact values', 11, ['math.unit-circle', 'math.surds']],
      ['math.sine-cosine-rules', 'Sine and cosine rules, area ½ab sin C', 10, ['math.solve-right-triangles']],
      ['math.trig-identities', 'Identities and equations', 11, ['math.exact-trig']],
      ['math.sinusoidal-models', 'Sinusoidal models', 11, ['math.unit-circle', 'math.graph-transformations']],
    ]),
  course('V4', 'sequences-and-series', 'Sequences, series and iteration', ['A'], 'advanced',
    ['functionLab', 'graphBoard'], { ccss: ['F-BF.2', 'F-LE.2', 'A-SSE.4'], ap: ['AP Calculus BC Unit 10 (series)'], england: ['GCSE nth term, iteration', 'A-level sequences, series, binomial'], singapore: ['Add Maths binomial theorem', 'H2 sequences and series'], ib: ['Topic 1'], cambridge: ['A-level 9709 P1'] }, [
      ['math.arithmetic-geometric', 'Arithmetic and geometric sequences', 10, ['math.linear-functions', 'math.exponential-growth']],
      ['math.sigma', 'Sigma notation and sums', 11, ['math.arithmetic-geometric']],
      ['math.infinite-series', 'Infinite geometric series', 11, ['math.sigma']],
      ['math.binomial-expansion', 'The binomial expansion', 11, ['math.counting', 'math.expanding']],
      ['math.iteration', 'Iteration and fixed points', 11, ['math.arithmetic-geometric', 'math.function-notation']],
    ]),
  course('V5', 'rates-of-change', 'Rates of change: from gradients to limits', ['C'], 'advanced',
    ['functionLab', 'functionExplorer'], { ccss: ['F-IF.6'], ap: ['AP Precalculus 1.1–1.4', 'AP Calculus Unit 1'], england: ['GCSE gradient at a point, area under a graph', 'A-level first principles'], singapore: ['Add Maths differentiation (introduction)'], ib: ['Topic 5'], cambridge: ['IGCSE E2.12'] }, [
      ['math.average-rate', 'Average rate on intervals', 10, ['math.covariation', 'math.function-notation']],
      ['math.secant-tangent', 'From secant to tangent', 11, ['math.average-rate', 'math.quadratics']],
      ['math.limits', 'Limits, informally', 11, ['math.secant-tangent', 'math.infinite-series']],
      ['math.accumulation', 'Area under a graph as accumulation', 11, ['math.average-rate', 'math.triangle-area']],
    ]),
  course('V6', 'statistical-inference', 'Statistical inference', ['D'], 'advanced',
    ['dataPlotter', 'probabilitySimulator'], { ccss: ['S-IC', 'S-MD'], ap: ['AP Statistics Units 1–5 (2026)'], england: ['A-level statistics (large data set)'], singapore: ['H2 probability and statistics'], ib: ['Topic 4'], cambridge: ['A-level 9709 S1–S2'] }, [
      ['math.random-variables', 'Random variables and expectation', 11, ['math.independence', 'math.statistics']],
      ['math.binomial-distribution', 'The binomial distribution', 11, ['math.random-variables', 'math.counting']],
      ['math.normal-distribution', 'The normal distribution', 11, ['math.random-variables', 'math.comparing-distributions']],
      ['math.sampling-distributions', 'Sampling distributions by simulation', 12, ['math.normal-distribution', 'math.sampling-bias']],
      ['math.hypothesis-tests', 'Hypothesis tests', 12, ['math.sampling-distributions', 'math.binomial-distribution']],
      ['math.regression', 'Regression and residuals', 12, ['math.correlation', 'math.sampling-distributions']],
    ]),
  course('V7', 'logic-and-proof', 'Logic and proof', ['P'], 'advanced',
    ['proofBuilder'], { ccss: ['G-CO.9–11'], england: ['GCSE algebraic proof', 'A-level proof by contradiction', 'Further Maths induction'], singapore: ['Add Maths plane geometry proofs'], ib: ['AA HL proof by induction'] }, [
      ['math.logic', 'Statements, quantifiers and conditionals', 10, ['math.equals-sign']],
      ['math.direct-proof', 'Direct and algebraic proof', 10, ['math.logic', 'math.expanding']],
      ['math.proof-contradiction', 'Proof by contradiction', 11, ['math.direct-proof', 'math.irrationals']],
      ['math.counterexamples', 'Counterexamples', 10, ['math.logic']],
      ['math.induction', 'Proof by induction', 12, ['math.direct-proof', 'math.sigma']],
    ]),

  // ── Calculus and university year 1 ─────────────────────────────────────────
  course('U1', 'calculus-1', 'Calculus I: derivatives', ['C'], 'university',
    ['functionLab', 'functionExplorer'], { ap: ['AP Calculus AB Units 1–5'], england: ['A-level differentiation'], singapore: ['H2 differentiation'], ib: ['Topic 5'], cambridge: ['A-level 9709 P1, P3'] }, [
      ['math.continuity', 'Limits and continuity', 12, ['math.limits']],
      ['math.derivatives', 'The derivative and its rules', 12, ['math.secant-tangent', 'math.continuity']],
      ['math.chain-rule', 'Chain, product, quotient and implicit differentiation', 12, ['math.derivatives', 'math.composition']],
      ['math.derivative-applications', 'Optimisation, related rates and curve sketching', 12, ['math.chain-rule']],
    ]),
  course('U2', 'calculus-2', 'Calculus II: integrals and differential equations', ['C'], 'university',
    ['functionLab'], { ap: ['AP Calculus AB Units 6–8', 'BC Unit 6–8'], england: ['A-level integration', 'Further Maths differential equations'], singapore: ['H2 integration, differential equations'], ib: ['Topic 5'], cambridge: ['A-level 9709 P3'] }, [
      ['math.integration', 'Integration and the fundamental theorem', 12, ['math.derivatives', 'math.accumulation']],
      ['math.integration-techniques', 'Substitution and integration by parts', 13, ['math.integration', 'math.chain-rule']],
      ['math.differential-equations', 'Differential equations', 13, ['math.integration-techniques', 'math.growth-decay']],
      ['math.integral-applications', 'Applications of integration', 13, ['math.integration']],
    ]),
  course('U3', 'series-parametric-polar', 'Series, parametric and polar', ['C'], 'university',
    ['functionLab', 'unitCircle'], { ap: ['AP Calculus BC Units 9–10'], england: ['Further Maths series, polar'], singapore: ['H2 Maclaurin series'], ib: ['AA HL Topic 5'] }, [
      ['math.taylor-series', 'Taylor and Maclaurin series', 13, ['math.derivative-applications', 'math.infinite-series']],
      ['math.convergence', 'Convergence tests', 13, ['math.taylor-series']],
      ['math.parametric-polar', 'Parametric and polar curves', 13, ['math.derivatives', 'math.unit-circle']],
    ]),
  course('U4', 'linear-algebra', 'Linear algebra: linear maps first', ['L'], 'university',
    ['vectorBoard'], { ccss: ['N-VM (+)'], england: ['Further Maths matrices'], singapore: ['H2 vectors'], ib: ['AA HL vectors'], cambridge: ['A-level 9231'] }, [
      ['math.vectors-3d', 'Vectors in two and three dimensions', 12, ['math.vectors']],
      ['math.elimination', 'Systems and elimination', 12, ['math.systems-special', 'math.vectors-3d']],
      ['math.linear-maps', 'Matrices as linear maps; multiplication as composition', 13, ['math.vectors-3d', 'math.composition']],
      ['math.determinants', 'The determinant as area scale factor', 13, ['math.linear-maps']],
      ['math.span-basis', 'Span, independence and basis', 13, ['math.elimination', 'math.linear-maps']],
      ['math.eigenvectors', 'Eigenvectors and eigenvalues', 13, ['math.determinants', 'math.span-basis', 'math.quadratic-formula']],
    ]),
  course('U5', 'discrete-mathematics', 'Discrete mathematics', ['P'], 'university',
    ['graphBoard', 'proofBuilder'], { england: ['Further Maths (options)'], ib: ['AI/AA HL (parts)'] }, [
      ['math.sets-functions', 'Sets and functions, formally', 12, ['math.sets-venn', 'math.function-notation', 'math.logic']],
      ['math.recurrences', 'Induction and recurrences', 13, ['math.induction', 'math.iteration']],
      ['math.combinatorics', 'Counting and the binomial theorem', 13, ['math.counting', 'math.binomial-expansion']],
      ['math.number-theory', 'Number theory: gcd, Euclid, modular arithmetic', 12, ['math.direct-proof']],
      ['math.graph-theory', 'Graphs: paths, trees, Euler and Hamilton', 12, ['math.logic']],
    ]),
  course('U6', 'complex-numbers-and-matrices', 'Complex numbers and matrices', ['A', 'L'], 'university',
    ['vectorBoard', 'unitCircle'], { ccss: ['N-CN (+)', 'N-VM (+)'], england: ['Further Maths core: complex numbers, matrices'], singapore: ['H2 complex numbers'], ib: ['AA HL Topic 1'], cambridge: ['A-level 9231'] }, [
      ['math.complex-numbers', 'Complex numbers and the Argand diagram', 12, ['math.quadratic-formula', 'math.vectors']],
      ['math.complex-polar', 'Polar form and de Moivre', 13, ['math.complex-numbers', 'math.trig-identities']],
      ['math.matrix-transformations', 'Matrices as transformations and invariant lines', 13, ['math.linear-maps', 'math.rigid-motions']],
    ]),
];

export const MATH_COURSE_BY_ID = new Map(MATH_COURSES.map((c) => [c.id, c]));

/** All chapter skills of the math curriculum, in course order. */
export function mathChapters(): (MathChapter & { course: string })[] {
  return MATH_COURSES.flatMap((c) => c.chapters.map((ch) => ({ ...ch, course: c.id })));
}
