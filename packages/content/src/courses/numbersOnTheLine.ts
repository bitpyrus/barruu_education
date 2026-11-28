/**
 * F1 Numbers on the Line (docs/MATH_CURRICULUM.md).
 *
 * Original Barruu content. Fractions are taught as places and lengths on the number
 * line (IES fractions guide). Short screens, the learner drags first, explanations stay
 * one or two lines. Distractors carry misconception ids from the curriculum catalogue.
 */
type Line = { id: string; min?: number; max?: number; divisions: number; labels?: 'wholes' | 'fractions' };
type Pt = { id: string; label: string; line: string; value?: string; draggable?: boolean; color?: string };

const nl = (lines: Line[], points: Pt[], extra: Record<string, unknown> = {}) => ({
  kind: 'numberLine',
  config: { lines: lines.map((l) => ({ min: 0, max: 1, labels: 'wholes', ...l })), points, ...extra },
});

export const NUMBERS_ON_THE_LINE = {
  id: 'numbers-on-the-line',
  version: '0.1.0',
  title: 'Numbers on the Line',
  tagline: 'Every number has an address. Find it.',
  subject: 'Mathematics',
  level: 'Foundations',
  grades: [6, 7],
  skills: ['math.fractions-on-line', 'math.compare-fractions'],
  summary: 'Fractions, decimals and negative numbers stop being rules to memorise once you can see where they live. Drag, split and compare on the number line.',
  outcomes: [
    'Place any fraction on a number line',
    'Compare fractions by where they sit',
    'See equivalent fractions as the same point',
  ],
  prerequisites: ['Whole numbers'],
  illustration: 'numberline',
  color: '#6d28d9',
  featured: true,
  chapters: [
    {
      id: 'where-fractions-live',
      title: 'Where fractions live',
      summary: 'Fractions are places on the line, and lengths from zero.',
      lessons: [
        {
          id: 'where-does-three-quarters-live',
          title: 'Where does ¾ live?',
          summary: 'Split the line, count the jumps, and every fraction finds its place.',
          objectives: ['Place fractions between 0 and 2 on a number line', 'Compare unit fractions by size', 'Spot equivalent fractions'],
          concepts: ['fractions-on-line', 'compare-fractions', 'equivalent-fractions'],
          estimatedMinutes: 8,
          steps: [
            {
              id: 'hook', type: 'narrative', stage: 'motivate', title: 'A number is a place',
              body: 'Every number has an address on the number line. Whole numbers are easy to find.\n\nBut what lives **between** 0 and 1?',
            },
            {
              id: 'predict', type: 'question', stage: 'predict', title: 'Guess first',
              question: {
                kind: 'choice', prompt: 'On a line from 0 to 1, where does $\\frac{1}{3}$ go?',
                options: [
                  { id: 'near0', text: 'Closer to 0', correct: true, feedback: 'Let\'s check.' },
                  { id: 'middle', text: 'In the middle', feedback: 'Let\'s check.' },
                  { id: 'near1', text: 'Closer to 1, since 3 is a big number', misconception: 'whole-number-bias', feedback: 'Let\'s check.' },
                ],
                concepts: ['fractions-on-line'],
              },
            },
            {
              id: 'thirds', type: 'interactive', stage: 'explore', title: 'Split it in three',
              body: 'The line from 0 to 1 is cut into 3 equal parts. Drag **P**.',
              interactive: { ...nl([{ id: 'l', divisions: 3 }], [{ id: 'P', label: 'P', line: 'l' }], { showValues: true }), goal: 'Put P on 1/3, then on 2/3.' },
            },
            {
              id: 'rule', type: 'narrative', stage: 'explain', title: 'Cut, then count',
              body: '$\\frac{a}{b}$: cut each whole into **b** equal parts, then take **a** jumps.\n\nSo $\\frac{2}{3}$ is two jumps of $\\frac{1}{3}$.',
            },
            {
              id: 'quarters', type: 'question', stage: 'practice', title: 'Your turn',
              interactive: nl([{ id: 'l', divisions: 4 }], [{ id: 'P', label: 'P', line: 'l' }]),
              question: {
                kind: 'numberLine', prompt: 'Put P at $\\frac{3}{4}$.',
                goals: [{ point: 'P', value: '3/4' }],
                hints: ['How many equal parts between 0 and 1?', 'Take 3 of the 4 jumps.'],
                successFeedback: 'Three jumps of a quarter.',
                explanation: 'The line is cut into 4 parts; $\\frac{3}{4}$ is 3 of them.',
                concepts: ['fractions-on-line'],
              },
            },
            {
              id: 'past-one', type: 'question', stage: 'challenge', title: 'Past 1',
              interactive: nl([{ id: 'l', max: 2, divisions: 4 }], [{ id: 'P', label: 'P', line: 'l' }]),
              question: {
                kind: 'numberLine', prompt: 'Put P at $\\frac{5}{4}$.',
                goals: [{ point: 'P', value: '5/4' }],
                hints: ['Where is $\\frac{4}{4}$?', 'Keep jumping: one more quarter after 1.'],
                successFeedback: 'Fractions don\'t stop at 1: $\\frac{5}{4} = 1 + \\frac{1}{4}$.',
                explanation: '$\\frac{4}{4}$ is 1, so $\\frac{5}{4}$ is one more quarter.',
                concepts: ['fractions-on-line'],
              },
            },
            {
              id: 'race', type: 'question', stage: 'practice', title: 'Quarters vs sixths',
              body: 'Top line: quarters. Bottom line: sixths.',
              interactive: nl([{ id: 'q', divisions: 4 }, { id: 's', divisions: 6 }], [
                { id: 'A', label: 'A', line: 'q', color: 'violet' },
                { id: 'B', label: 'B', line: 's', color: 'teal' },
              ]),
              question: {
                kind: 'numberLine', prompt: 'Put A at $\\frac{1}{4}$ and B at $\\frac{1}{6}$.',
                goals: [{ point: 'A', value: '1/4' }, { point: 'B', value: '1/6' }],
                hints: ['One jump on each line.'],
                successFeedback: 'Look where they landed.',
                explanation: 'One quarter-jump on the top line, one sixth-jump on the bottom.',
                concepts: ['fractions-on-line'],
              },
            },
            {
              id: 'which-bigger', type: 'question', stage: 'practice', title: 'Which is bigger?',
              interactive: nl([{ id: 'q', divisions: 4 }, { id: 's', divisions: 6 }], [
                { id: 'A', label: 'A', line: 'q', value: '1/4', draggable: false, color: 'violet' },
                { id: 'B', label: 'B', line: 's', value: '1/6', draggable: false, color: 'teal' },
              ], { showValues: true }),
              question: {
                kind: 'choice', prompt: 'Which is bigger?',
                options: [
                  { id: 'quarter', text: '$\\frac{1}{4}$', correct: true, feedback: 'Yes: it\'s further from 0.' },
                  { id: 'sixth', text: '$\\frac{1}{6}$, because 6 is bigger than 4', misconception: 'whole-number-bias', feedback: 'Look at the lines: B is closer to 0. More parts means smaller parts.' },
                  { id: 'same', text: 'They\'re the same', feedback: 'Look at the lines: they land in different places.' },
                ],
                explanation: 'Cutting into 6 parts makes smaller parts than cutting into 4.',
                concepts: ['compare-fractions'],
              },
            },
            {
              id: 'big-idea', type: 'narrative', stage: 'explain', title: 'The bottom number',
              body: 'The bottom number says how **small** each part is. More parts, smaller parts.',
            },
            {
              id: 'same-spot', type: 'question', stage: 'transfer', title: 'Two names, one place',
              interactive: nl([{ id: 'h', divisions: 2 }, { id: 'e', divisions: 8 }], [
                { id: 'A', label: 'A', line: 'h', color: 'amber' },
                { id: 'B', label: 'B', line: 'e', color: 'sky' },
              ]),
              question: {
                kind: 'numberLine', prompt: 'Put A at $\\frac{1}{2}$ and B at $\\frac{4}{8}$.',
                goals: [{ point: 'A', value: '1/2' }, { point: 'B', value: '4/8' }],
                hints: ['Count four eighth-jumps on the bottom line.'],
                successFeedback: 'Same spot, same number: $\\frac{1}{2} = \\frac{4}{8}$.',
                explanation: 'Both land halfway, so they are equal. These are called equivalent fractions.',
                concepts: ['equivalent-fractions'],
              },
            },
            {
              id: 'check', type: 'question', stage: 'assess', title: 'Mastery check',
              interactive: nl([{ id: 'l', divisions: 5 }], [{ id: 'P', label: 'P', line: 'l', value: '3/5', draggable: false, color: 'rose' }]),
              question: {
                kind: 'choice', prompt: 'Which number is at P?',
                options: [
                  { id: 'a', text: '$\\frac{3}{5}$', correct: true },
                  { id: 'b', text: '$\\frac{3}{4}$', misconception: 'counts-ticks-not-spaces' },
                  { id: 'c', text: '$\\frac{3}{6}$', misconception: 'counts-ticks-not-spaces' },
                  { id: 'd', text: '$\\frac{2}{5}$' },
                ],
                explanation: 'There are 5 equal **spaces** between 0 and 1 (not 4 or 6 marks). P is 3 spaces along: $\\frac{3}{5}$.',
                concepts: ['fractions-on-line'],
              },
            },
          ],
        },
      ],
    },
    {
      id: 'comparing-and-ordering',
      title: 'Comparing and ordering',
      summary: 'Fractions and decimals side by side.',
      status: 'planned',
      plannedLessons: ['Which is closer to 1?', 'Decimals are fractions too', 'Ordering a mixed list'],
    },
    {
      id: 'adding-with-a-sense-of-size',
      title: 'Adding with a sense of size',
      summary: 'Why ⅛ + ½ isn\'t 2⁄10.',
      status: 'planned',
      plannedLessons: ['Jumps that add', 'Same-size parts first', 'Estimate, then add'],
    },
    {
      id: 'scaling',
      title: 'Scaling',
      summary: 'Multiplying doesn\'t always make bigger.',
      status: 'planned',
      plannedLessons: ['Stretch and shrink', 'Dividing by a fraction'],
    },
    {
      id: 'below-zero',
      title: 'Below zero',
      summary: 'Negative numbers and how they move.',
      status: 'planned',
      plannedLessons: ['Left of zero', 'Adding and subtracting negatives'],
    },
  ],
};
