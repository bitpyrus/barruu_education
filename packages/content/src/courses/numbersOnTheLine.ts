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
              id: 'predict', type: 'question', stage: 'predict', title: 'A number is a place',
              question: {
                kind: 'choice', prompt: 'Every number has a place on the line. Where does $\\frac{1}{3}$ go?',
                options: [
                  { id: 'near0', text: 'Closer to 0', correct: true, feedback: 'Let\'s check.' },
                  { id: 'middle', text: 'In the middle', misconception: 'fraction-as-halfway', feedback: 'Let\'s check.' },
                  { id: 'near1', text: 'Closer to 1', misconception: 'whole-number-bias', feedback: 'Let\'s check.' },
                ],
                concepts: ['fractions-on-line'],
              },
            },
            {
              id: 'thirds', type: 'interactive', stage: 'explore', title: 'Split it in three',
              body: '0 to 1 is cut into 3 equal parts. Drag **P** one jump from 0. Was your guess right?',
              interactive: { ...nl([{ id: 'l', divisions: 3 }], [{ id: 'P', label: 'P', line: 'l' }], { showValues: true }), goal: 'Put P one jump from 0, then two jumps.' },
            },
            {
              id: 'rule', type: 'narrative', stage: 'explain', title: 'Cut, then count',
              body: '$\\frac{2}{3}$: cut each whole into **3** equal parts, then take **2** jumps from 0.\n\nThe bottom number cuts; the top number counts.',
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
              id: 'past-one', type: 'question', stage: 'practice', title: 'Past 1',
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
              id: 'which-bigger', type: 'question', stage: 'predict', title: 'Guess again',
              question: {
                kind: 'choice', prompt: 'Which is bigger, $\\frac{1}{4}$ or $\\frac{1}{6}$?',
                options: [
                  { id: 'quarter', text: '$\\frac{1}{4}$', correct: true, feedback: 'Let\'s check.' },
                  { id: 'sixth', text: '$\\frac{1}{6}$', misconception: 'whole-number-bias', feedback: 'Let\'s check.' },
                  { id: 'same', text: 'They\'re the same', misconception: 'unit-fractions-equal', feedback: 'Let\'s check.' },
                ],
                concepts: ['compare-fractions'],
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
                hints: ['How many equal parts does each line have between 0 and 1?', 'One jump on each line.'],
                successFeedback: 'A is further from 0, so $\\frac{1}{4} > \\frac{1}{6}$. More parts, smaller parts.',
                explanation: 'One quarter-jump on the top line, one sixth-jump on the bottom.',
                concepts: ['compare-fractions'],
              },
            },
            {
              id: 'big-idea', type: 'narrative', stage: 'explain', title: 'The bottom number',
              body: 'The bottom number (the **denominator**) says how small each part is. More parts, smaller parts.',
            },
            {
              id: 'same-spot', type: 'question', stage: 'transfer', title: 'Two names, one place',
              interactive: nl([{ id: 'h', divisions: 2 }, { id: 'e', divisions: 8 }], [
                { id: 'A', label: 'A', line: 'h', value: '1/2', draggable: false, color: 'amber' },
                { id: 'B', label: 'B', line: 'e', color: 'sky' },
              ]),
              question: {
                kind: 'numberLine', prompt: 'A is at $\\frac{1}{2}$. Put B on the eighths line at exactly the same spot.',
                goals: [{ point: 'B', other: 'A', message: 'Not the same spot yet. Look straight down from A.' }],
                hints: ['Look straight down from A.', 'How many eighth-jumps is that from 0?'],
                successFeedback: 'B is at $\\frac{4}{8}$. Same spot, same number: $\\frac{1}{2} = \\frac{4}{8}$.',
                explanation: 'Halfway is 4 of the 8 jumps, so $\\frac{1}{2} = \\frac{4}{8}$. These are called equivalent fractions.',
                concepts: ['equivalent-fractions'],
              },
            },
            {
              id: 'broken', type: 'question', stage: 'reflect', title: 'Spot the slip',
              interactive: nl([{ id: 'l', divisions: 6 }], [{ id: 'P', label: 'P', line: 'l', value: '4/6', draggable: false, color: 'rose' }]),
              question: {
                kind: 'choice', prompt: 'Kai says P is at $\\frac{4}{5}$: "I counted 5 marks between 0 and 1." What went wrong?',
                options: [
                  { id: 'spaces', text: 'Kai counted marks, not spaces. There are 6 spaces, so P is at $\\frac{4}{6}$.', correct: true, feedback: 'Yes. Count the gaps, not the marks.' },
                  { id: 'fine', text: 'Nothing. P is at $\\frac{4}{5}$.', misconception: 'counts-ticks-not-spaces', feedback: 'Count the gaps between 0 and 1: there are 6, not 5.' },
                ],
                explanation: 'The bottom number counts equal **spaces**. 5 marks inside the line make 6 spaces.',
                concepts: ['fractions-on-line'],
              },
            },
            {
              id: 'check', type: 'question', stage: 'assess', title: 'Mastery check',
              interactive: nl([{ id: 'l', divisions: 5 }], [{ id: 'P', label: 'P', line: 'l', value: '3/5', draggable: false, color: 'rose' }]),
              question: {
                kind: 'choice', prompt: 'Which number is at P?',
                options: [
                  { id: 'a', text: '$\\frac{3}{5}$', correct: true },
                  { id: 'b', text: '$\\frac{3}{4}$', misconception: 'counts-ticks-not-spaces', feedback: 'You counted the 4 marks inside the line. Count the spaces: there are 5.' },
                  { id: 'c', text: '$\\frac{3}{6}$', misconception: 'counts-ticks-not-spaces', feedback: 'You counted all 6 marks. Count the spaces between them: there are 5.' },
                  { id: 'd', text: '$\\frac{2}{5}$', misconception: 'counts-from-wrong-end', feedback: 'P is 3 spaces from 0, not 2. Count from 0.' },
                ],
                explanation: 'There are 5 equal **spaces** between 0 and 1. P is 3 spaces along: $\\frac{3}{5}$.',
                concepts: ['fractions-on-line'],
              },
            },
            {
              id: 'check-equal', type: 'question', stage: 'assess', title: 'One more',
              interactive: nl([{ id: 't', divisions: 3 }, { id: 's', divisions: 6 }], [
                { id: 'A', label: 'A', line: 't', value: '2/3', draggable: false, color: 'violet' },
                { id: 'B', label: 'B', line: 's', color: 'teal' },
              ]),
              question: {
                kind: 'numberLine', prompt: 'Put B at the sixth that equals $\\frac{2}{3}$.',
                goals: [{ point: 'B', value: '4/6' }],
                explanation: '$\\frac{2}{3} = \\frac{4}{6}$: each third is two sixths.',
                concepts: ['equivalent-fractions', 'compare-fractions'],
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
