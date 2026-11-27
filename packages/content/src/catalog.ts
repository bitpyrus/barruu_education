/**
 * Built-in starter curriculum. Authored as plain data and validated against
 * the content schema at load time, exactly as AI-generated or creator-made
 * lessons will be.
 */
import { ConceptGraph, ConceptSchema, CourseSchema, courseLessons, type Concept, type Course, type Lesson } from '@barruu/engine';
import { MATHEMATICAL_THINKING } from './courses/mathematicalThinking';

const RAW_CONCEPTS: Concept[] = [
  // Mathematics
  { id: 'variables-expressions', title: 'Variables & expressions', subject: 'Mathematics', summary: 'Using letters to stand for numbers.', prerequisites: [] },
  { id: 'linear-functions', title: 'Linear functions', subject: 'Mathematics', summary: 'Straight-line relationships y = mx + b.', prerequisites: ['variables-expressions'] },
  { id: 'quadratic-functions', title: 'Quadratic functions', subject: 'Mathematics', summary: 'Parabolas y = ax² + bx + c.', prerequisites: ['linear-functions'] },
  { id: 'parabola-vertex', title: 'The vertex of a parabola', subject: 'Mathematics', summary: 'The turning point at x = −b/2a.', prerequisites: ['quadratic-functions'] },
  { id: 'roots-factoring', title: 'Roots & factoring', subject: 'Mathematics', summary: 'Where a function crosses zero.', prerequisites: ['quadratic-functions'] },
  { id: 'square-root-scaling', title: 'Square-root scaling', subject: 'Mathematics', summary: 'Quadrupling the input doubles the output of √x.', prerequisites: ['variables-expressions'] },
  // Physics
  { id: 'periodic-motion', title: 'Periodic motion', subject: 'Physics', summary: 'Motion that repeats with a fixed period.', prerequisites: [] },
  { id: 'gravity', title: 'Gravitational acceleration', subject: 'Physics', summary: 'Why g differs from planet to planet.', prerequisites: [] },
  { id: 'pendulum-period', title: 'Pendulum period', subject: 'Physics', summary: 'T = 2π√(L/g) for small swings.', prerequisites: ['periodic-motion', 'gravity', 'square-root-scaling'] },
  { id: 'model-assumptions', title: 'Models & assumptions', subject: 'Physics', summary: 'When a simplified model stops being accurate.', prerequisites: ['pendulum-period'] },
  // Computer science
  { id: 'arrays', title: 'Arrays', subject: 'Computer Science', summary: 'Ordered collections indexed by position.', prerequisites: [] },
  { id: 'compare-swap', title: 'Compare & swap', subject: 'Computer Science', summary: 'The basic operations of comparison sorts.', prerequisites: ['arrays'] },
  { id: 'bubble-sort', title: 'Bubble sort', subject: 'Computer Science', summary: 'Repeatedly swapping adjacent out-of-order pairs.', prerequisites: ['compare-swap'] },
  { id: 'area-measurement', title: 'Measuring area', subject: 'Mathematics', summary: 'Area counts the unit squares a shape covers.', prerequisites: [] },
  { id: 'rectangle-area', title: 'Area of a rectangle', subject: 'Mathematics', summary: 'Width × height.', prerequisites: ['area-measurement'] },
  { id: 'area-perimeter', title: 'Area vs. perimeter', subject: 'Mathematics', summary: 'Same area, different outlines.', prerequisites: ['rectangle-area'] },
  { id: 'triangle-area', title: 'Area of a triangle', subject: 'Mathematics', summary: 'Half of a surrounding rectangle.', prerequisites: ['rectangle-area'] },
  { id: 'algorithm-cost', title: 'Counting algorithm cost', subject: 'Computer Science', summary: 'How work grows with input size.', prerequisites: ['bubble-sort', 'variables-expressions'] },
];

const RAW_COURSES: unknown[] = [
  MATHEMATICAL_THINKING,
  {
    id: 'functions-you-can-touch',
    grades: [9, 10],
    skills: ['math.linear-functions', 'math.quadratics'],
    title: 'Functions You Can Touch',
    subject: 'Mathematics',
    summary: 'Build intuition for functions by grabbing their coefficients and watching the graph respond.',
    color: '#7c3aed',
    level: 'Intermediate',
    status: 'preview',
    illustration: 'function',
    prerequisites: ['Comfortable with expressions like 3x + 2'],
    chapters: [{ id: 'parabolas', title: 'Parabolas', lessons: [{
      id: 'shaping-parabolas',
      title: 'How coefficients shape a parabola',
      summary: 'Discover what a, b and c do to y = ax² + bx + c — then use it.',
      objectives: [
        'Predict how the sign and size of a change a parabola',
        'Locate the vertex using x = −b/2a',
        'Build a quadratic from its roots',
      ],
      concepts: ['quadratic-functions', 'parabola-vertex', 'roots-factoring'],
      estimatedMinutes: 12,
      steps: [
        {
          id: 'hook', type: 'narrative', stage: 'motivate', title: 'A shape you already know',
          body: 'Throw a ball, aim a fountain, or bend a satellite dish — the same curve appears every time: the **parabola**.\n\nEvery parabola can be written as $y = ax^2 + bx + c$. Three numbers control the whole shape. Your job in this lesson is to find out *how*.',
        },
        {
          id: 'predict-a', type: 'question', stage: 'predict', title: 'Make a prediction',
          body: 'Commit to a guess before you experiment — predictions you can check are how scientists learn fastest. There\'s no penalty for being wrong here.',
          question: {
            kind: 'choice',
            prompt: 'What do you think happens to $y = ax^2$ when $a$ becomes negative?',
            options: [
              { id: 'flip', text: 'It flips and opens downward', correct: true, feedback: 'Let\'s test it in the next step.' },
              { id: 'shift', text: 'It slides to the left', misconception: 'coefficient-a-shifts-graph', feedback: 'Interesting guess — test it in the next step and see.' },
              { id: 'narrow', text: 'It only gets narrower', misconception: 'sign-irrelevant', feedback: 'Keep that in mind and test it next.' },
              { id: 'nothing', text: 'Nothing changes', misconception: 'sign-irrelevant', feedback: 'Let\'s find out in the next step.' },
            ],
            concepts: ['quadratic-functions'],
          },
        },
        {
          id: 'explore', type: 'interactive', stage: 'explore', title: 'Grab the coefficients',
          body: 'Drag the sliders. Watch the vertex (the turning point) and where the curve crosses the x-axis. Try to complete the goal.',
          interactive: {
            kind: 'functionExplorer',
            goal: 'Make the parabola open downward and cross the y-axis at 3.',
            config: {
              expression: 'a*x^2 + b*x + c',
              parameters: [
                { name: 'a', label: 'a — stretch & direction', min: -3, max: 3, step: 0.1, default: 1 },
                { name: 'b', label: 'b — tilt the vertex', min: -6, max: 6, step: 0.1, default: 0 },
                { name: 'c', label: 'c — vertical shift', min: -6, max: 6, step: 0.1, default: 0 },
              ],
              xRange: [-8, 8], yRange: [-8, 8], reference: 'x^2',
            },
          },
        },
        {
          id: 'explain', type: 'narrative', stage: 'explain', title: 'What each coefficient does',
          body: '- **a** sets direction and width: $a>0$ opens up, $a<0$ opens down, and larger $|a|$ makes it narrower.\n- **c** is the y-intercept, because $y = c$ when $x = 0$.\n- **b** moves the vertex sideways *and* up or down together. The vertex sits at\n\n$$x = -\\frac{b}{2a}$$\n\nThat\'s why $b$ felt harder to predict: its effect depends on $a$.',
        },
        {
          id: 'vertex', type: 'question', stage: 'challenge', title: 'Find the turning point',
          body: 'Use the explorer to check your reasoning — it\'s set to the function in the question.',
          interactive: {
            kind: 'functionExplorer',
            config: { expression: 'x^2 - 4*x + 3', parameters: [], xRange: [-2, 6], yRange: [-3, 6] },
          },
          question: {
            kind: 'numeric',
            prompt: 'For $y = x^2 - 4x + 3$, at what value of $x$ is the vertex?',
            answer: 2, tolerance: 0.01,
            hints: ['Here $a = 1$ and $b = -4$.', 'Substitute into $x = -\\frac{b}{2a}$.', '$-\\frac{-4}{2 \\cdot 1} = \\,?$'],
            explanation: '$x = -\\frac{-4}{2\\cdot 1} = 2$. The graph confirms the turning point at $x = 2$.',
            concepts: ['parabola-vertex'],
          },
        },
        {
          id: 'build', type: 'question', stage: 'practice', title: 'Build one yourself',
          body: 'Any equivalent form is accepted — factored or expanded.',
          question: {
            kind: 'expression',
            prompt: 'Write a quadratic with $a = 1$ whose roots are $x = 1$ and $x = 5$.',
            answer: '(x-1)*(x-5)', variables: ['x'],
            hints: ['A root at $x = r$ means $(x - r)$ is a factor.', 'Multiply the two factors together.'],
            explanation: '$(x-1)(x-5) = x^2 - 6x + 5$. Both forms describe the same parabola.',
            concepts: ['roots-factoring'],
          },
        },
        {
          id: 'reflect', type: 'narrative', stage: 'reflect', title: 'Look back',
          body: 'Compare your prediction from the start with what you saw. Which coefficient surprised you most — and can you explain *why* it behaves that way?',
        },
        {
          id: 'check', type: 'question', stage: 'assess', title: 'Mastery check',
          body: 'No hints on this one — show what you know.',
          question: {
            kind: 'choice',
            prompt: 'Which parabola has its vertex at $x = -3$?',
            options: [
              { id: 'a', text: '$y = x^2 + 6x$', correct: true },
              { id: 'b', text: '$y = x^2 - 6x$', misconception: 'vertex-sign-error' },
              { id: 'c', text: '$y = x^2 + 3x$', misconception: 'vertex-forgot-2a' },
              { id: 'd', text: '$y = 3x^2$', misconception: 'coefficient-a-shifts-graph' },
            ],
            explanation: 'For $y = x^2 + 6x$: $x = -\\frac{6}{2} = -3$.',
            concepts: ['parabola-vertex'],
          },
        },
      ],
    }] }],
  },
  {
    id: 'pendulums-and-planets',
    grades: [10, 11],
    skills: ['phys.oscillations', 'phys.gravitation'],
    title: 'Pendulums & Planets',
    subject: 'Physics',
    summary: 'Run experiments on a simulated pendulum on Earth, the Moon and Jupiter — and find the law behind its rhythm.',
    color: '#0891b2',
    level: 'Foundations',
    status: 'preview',
    illustration: 'pendulum',
    prerequisites: ['Square roots'],
    chapters: [{ id: 'oscillation', title: 'Oscillation', lessons: [{
      id: 'pendulum-rhythm',
      title: 'What sets the rhythm of a pendulum?',
      summary: 'Experiment with length, gravity and release angle to discover T = 2π√(L/g) — and where it breaks.',
      objectives: [
        'Predict how a pendulum\'s period scales with its length',
        'Calculate the period on another world',
        'Recognise when the small-angle model stops being accurate',
      ],
      concepts: ['pendulum-period', 'model-assumptions'],
      estimatedMinutes: 15,
      steps: [
        {
          id: 'hook', type: 'narrative', stage: 'motivate', title: 'A clock without gears',
          body: 'For nearly three centuries the most accurate clocks on Earth were pendulum clocks. They work because a pendulum keeps a remarkably steady rhythm.\n\nBut what decides that rhythm — and would a pendulum clock still keep time on the Moon?',
        },
        {
          id: 'predict-length', type: 'question', stage: 'predict', title: 'Make a prediction',
          body: 'Commit first, then test it in the lab.',
          question: {
            kind: 'choice',
            prompt: 'You make a pendulum **4 times longer**. Its period (time for one full swing) will…',
            options: [
              { id: 'double', text: 'double', correct: true, feedback: 'Go test it in the lab.' },
              { id: 'quadruple', text: 'become 4 times longer', misconception: 'period-linear-in-length', feedback: 'Test it in the lab next.' },
              { id: 'half', text: 'halve', misconception: 'longer-is-faster', feedback: 'Test it in the lab next.' },
              { id: 'same', text: 'stay the same', misconception: 'period-independent-of-length', feedback: 'Test it in the lab next.' },
            ],
            concepts: ['pendulum-period'],
          },
        },
        {
          id: 'lab', type: 'interactive', stage: 'explore', title: 'The pendulum lab',
          body: 'Start the pendulum and time it. Change one variable at a time — that\'s how you find out which one matters.',
          interactive: {
            kind: 'pendulumLab',
            goal: 'Compare the period at L = 1 m and L = 4 m. Then try the Moon.',
            config: { length: 1, gravity: 9.81, amplitudeDeg: 10 },
          },
        },
        {
          id: 'law', type: 'block', stage: 'explain', title: 'The law behind the rhythm',
          body: 'For small swings, the period depends only on length $L$ and gravitational acceleration $g$ — not on the mass, and (almost) not on how far you pull it back. Because of the square root, 4× the length gives $\\sqrt{4} = 2$× the period.',
          block: {
            block_type: 'math',
            content: JSON.stringify({ latex: 'T = 2\\pi\\sqrt{\\dfrac{L}{g}}', caption: 'Small-angle period of a simple pendulum', align: 'center', fontSize: '1.4rem', color: '#0f172a', bgColor: '#ffffff', showNumber: false, number: '', label: '' }),
            style: '{}',
          },
        },
        {
          id: 'moon', type: 'question', stage: 'challenge', title: 'A clock on the Moon',
          body: 'You can use the lab to check — set gravity to the Moon\'s value.',
          interactive: { kind: 'pendulumLab', config: { length: 1, gravity: 1.62, amplitudeDeg: 10, adjustable: ['gravity', 'amplitudeDeg'] } },
          question: {
            kind: 'numeric',
            prompt: 'What is the period of a 1 m pendulum on the Moon, where $g = 1.62\\ \\text{m/s}^2$? (in seconds)',
            answer: 4.937, tolerance: 0.05, unit: 's',
            hints: ['Use $T = 2\\pi\\sqrt{L/g}$ with $L = 1$.', '$\\sqrt{1/1.62} \\approx 0.786$.', 'Multiply $0.786$ by $2\\pi \\approx 6.283$.'],
            explanation: '$T = 2\\pi\\sqrt{1/1.62} \\approx 4.94\\ \\text{s}$ — about 2.5× slower than on Earth.',
            concepts: ['pendulum-period', 'gravity'],
          },
        },
        {
          id: 'big-swing', type: 'question', stage: 'transfer', title: 'When the model breaks',
          body: 'In the lab, set the release angle to 150° and compare the measured period with the formula.',
          interactive: { kind: 'pendulumLab', config: { length: 1, gravity: 9.81, amplitudeDeg: 150, adjustable: ['amplitudeDeg'] } },
          question: {
            kind: 'choice',
            prompt: 'At a 150° release angle, the formula $2\\pi\\sqrt{L/g}$…',
            options: [
              { id: 'under', text: 'underestimates the real period', correct: true, feedback: 'Right — big swings take noticeably longer. The formula assumes sin θ ≈ θ, which fails at large angles.' },
              { id: 'over', text: 'overestimates the real period', misconception: 'large-angle-faster', feedback: 'Check the lab: the measured period is longer than the formula predicts.' },
              { id: 'exact', text: 'is still exact', misconception: 'model-always-exact', feedback: 'Compare the two numbers in the lab — they differ a lot at 150°.' },
            ],
            hints: ['Read both the "formula" and "measured" periods in the lab.'],
            explanation: 'The small-angle formula relies on $\\sin\\theta \\approx \\theta$. At 150° that approximation fails and the true period is roughly 76% longer.',
            concepts: ['model-assumptions'],
          },
        },
        {
          id: 'check', type: 'question', stage: 'assess', title: 'Mastery check',
          body: 'Design a "seconds pendulum" — one that takes exactly 2 s per full swing on Earth.',
          question: {
            kind: 'numeric',
            prompt: 'How long must it be? Use $g = 9.81\\ \\text{m/s}^2$ and give your answer in metres.',
            answer: 0.994, tolerance: 0.01, unit: 'm',
            explanation: 'Rearranging: $L = g\\left(\\frac{T}{2\\pi}\\right)^2 = 9.81 \\cdot \\frac{1}{\\pi^2} \\approx 0.994\\ \\text{m}$.',
            concepts: ['pendulum-period'],
          },
        },
      ],
    }] }],
  },
  {
    id: 'algorithms-in-motion',
    grades: [9, 11],
    skills: ['cs.algorithms', 'cs.complexity'],
    title: 'Algorithms in Motion',
    subject: 'Computer Science',
    summary: 'Step through real algorithms one comparison at a time and see why some are faster than others.',
    color: '#ea580c',
    level: 'Foundations',
    status: 'preview',
    illustration: 'sorting',
    prerequisites: ['None'],
    chapters: [{ id: 'sorting', title: 'Sorting', lessons: [{
      id: 'sorting-by-swapping',
      title: 'Sorting by swapping',
      summary: 'Watch bubble, insertion and selection sort work — then count what they cost.',
      objectives: [
        'Trace bubble sort by hand',
        'Explain what one bubble-sort pass guarantees',
        'Count comparisons in the worst case',
      ],
      concepts: ['bubble-sort', 'algorithm-cost'],
      estimatedMinutes: 12,
      steps: [
        {
          id: 'hook', type: 'narrative', stage: 'motivate', title: 'Computers can only compare two things at once',
          body: 'Sorting a hand of cards feels instant to you. A computer can\'t "see" the whole hand — it can only compare **two** values and maybe swap them.\n\nSo how do you sort anything using only *compare* and *swap*?',
        },
        {
          id: 'predict-pass', type: 'question', stage: 'predict', title: 'Make a prediction',
          body: 'Bubble sort walks through the list comparing neighbours, swapping any pair that is out of order.',
          question: {
            kind: 'choice',
            prompt: 'After **one** full pass of bubble sort, what is guaranteed?',
            options: [
              { id: 'largest', text: 'The largest value is at the end', correct: true, feedback: 'Check it in the lab.' },
              { id: 'smallest', text: 'The smallest value is at the start', misconception: 'bubble-moves-smallest-first', feedback: 'Check it in the lab.' },
              { id: 'sorted', text: 'The whole list is sorted', misconception: 'one-pass-sorts', feedback: 'Check it in the lab.' },
              { id: 'nothing', text: 'Nothing is guaranteed', feedback: 'Check it in the lab.' },
            ],
            concepts: ['bubble-sort'],
          },
        },
        {
          id: 'lab', type: 'interactive', stage: 'explore', title: 'The sorting lab',
          body: 'Step forward one comparison at a time. Highlighted bars are being compared. Bars turn green once they are in their final place.',
          interactive: { kind: 'sortingLab', goal: 'Watch where the 9 ends up after the first pass.', config: { array: [5, 2, 8, 1, 9, 3], algorithm: 'bubble' } },
        },
        {
          id: 'explain', type: 'narrative', stage: 'explain', title: 'Why the biggest value "bubbles up"',
          body: 'Once the largest value is reached, it wins every comparison after it, so it gets carried all the way to the end. Each pass fixes one more value in place, so a list of $n$ items needs at most $n-1$ passes.\n\nPass 1 makes $n-1$ comparisons, pass 2 makes $n-2$, and so on:\n\n$$ (n-1) + (n-2) + \\dots + 1 = \\frac{n(n-1)}{2} $$',
        },
        {
          id: 'trace', type: 'question', stage: 'challenge', title: 'Trace it by hand',
          body: 'Put the states of the list in the order bubble sort produces them.',
          question: {
            kind: 'order',
            prompt: 'Bubble sort on $[3, 1, 2]$ — order these states from first to last:',
            items: ['[1, 2, 3]', '[3, 1, 2]', '[1, 3, 2]'],
            correctOrder: [1, 2, 0],
            hints: ['The starting state comes first.', 'First comparison: 3 and 1 — are they out of order?'],
            explanation: '[3,1,2] → swap 3,1 → [1,3,2] → swap 3,2 → [1,2,3].',
            concepts: ['bubble-sort'],
          },
        },
        {
          id: 'count', type: 'question', stage: 'practice', title: 'Count the cost',
          body: 'Try a reversed list in the lab, like [6, 5, 4, 3, 2, 1], and watch the comparison counter.',
          interactive: { kind: 'sortingLab', config: { array: [6, 5, 4, 3, 2, 1], algorithm: 'bubble', allowAlgorithmChange: false } },
          question: {
            kind: 'numeric',
            prompt: 'How many comparisons does bubble sort make on a reversed list of **6** items?',
            answer: 15, tolerance: 0,
            hints: ['Pass 1 compares 5 pairs.', 'Add 5 + 4 + 3 + 2 + 1.'],
            explanation: '$\\frac{6 \\cdot 5}{2} = 15$ comparisons.',
            concepts: ['algorithm-cost'],
          },
        },
        {
          id: 'check', type: 'question', stage: 'assess', title: 'Mastery check',
          body: 'This version of bubble sort stops early if a pass makes no swaps.',
          question: {
            kind: 'choice',
            prompt: 'Which input makes it do the **fewest** comparisons?',
            options: [
              { id: 'sorted', text: 'An already-sorted list', correct: true },
              { id: 'reversed', text: 'A reversed list', misconception: 'reverse-is-best-case' },
              { id: 'random', text: 'A random list', misconception: 'input-order-irrelevant' },
              { id: 'same', text: 'They all cost the same', misconception: 'input-order-irrelevant' },
            ],
            explanation: 'On a sorted list the first pass makes no swaps, so it stops after $n-1$ comparisons.',
            concepts: ['algorithm-cost'],
          },
        },
      ],
    }] }],
  },
];

export const CONCEPTS: Concept[] = RAW_CONCEPTS.map((c) => ConceptSchema.parse(c));
export const COURSES: Course[] = RAW_COURSES.map((c) => CourseSchema.parse(c));
export const CONCEPT_GRAPH = new ConceptGraph(CONCEPTS);

export function findCourse(courseId: string): Course | undefined {
  return COURSES.find((c) => c.id === courseId);
}

export interface LessonLocation { course: Course; chapterIndex: number; lesson: Lesson; next?: Lesson; }

export function findLesson(courseId: string, lessonId: string): LessonLocation | null {
  const course = findCourse(courseId);
  if (!course) return null;
  const all = courseLessons(course);
  const idx = all.findIndex((l) => l.id === lessonId);
  if (idx < 0) return null;
  const chapterIndex = course.chapters.findIndex((c) => c.lessons.some((l) => l.id === lessonId));
  return { course, chapterIndex, lesson: all[idx], next: all[idx + 1] };
}

/** Find the course containing a lesson id (lesson ids are unique across the catalog). */
export function courseOfLesson(lessonId: string): Course | undefined {
  return COURSES.find((c) => courseLessons(c).some((l) => l.id === lessonId));
}
