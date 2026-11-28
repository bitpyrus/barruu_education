/**
 * F1 Numbers on the Line (docs/MATH_CURRICULUM.md).
 *
 * Original Barruu content. Fractions are taught as places and lengths on the number
 * line (IES fractions guide). Short screens, the learner drags first, explanations stay
 * one or two lines. Distractors carry misconception ids from the curriculum catalogue.
 */
type Line = { id: string; min?: number; max?: number; divisions: number; labels?: 'wholes' | 'fractions' | 'decimals' };
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
    'Compare fractions and decimals by where they sit',
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
      summary: 'Fractions and decimals, side by side.',
      lessons: [
        {
          id: 'closer-to-one',
          title: 'Which is closer to 1?',
          summary: 'Compare fractions by the piece that\'s missing.',
          objectives: ['Compare fractions near 1 by their missing piece', 'Use ½ as a benchmark'],
          concepts: ['compare-fractions'],
          estimatedMinutes: 6,
          steps: [
            {
              id: 'predict', type: 'question', stage: 'predict', title: 'So close',
              question: {
                kind: 'choice', prompt: 'Which is bigger, $\\frac{7}{8}$ or $\\frac{5}{6}$?',
                options: [
                  { id: 'seven-eighths', text: '$\\frac{7}{8}$', correct: true, feedback: 'Let\'s check.' },
                  { id: 'five-sixths', text: '$\\frac{5}{6}$', misconception: 'smaller-denominator-bigger', feedback: 'Let\'s check.' },
                  { id: 'same', text: 'The same: both are one part short of 1', misconception: 'one-short-means-equal', feedback: 'Let\'s check.' },
                ],
                concepts: ['compare-fractions'],
              },
            },
            {
              id: 'race', type: 'question', stage: 'explore', title: 'Race to 1',
              interactive: nl([{ id: 'e', divisions: 8 }, { id: 's', divisions: 6 }], [
                { id: 'A', label: 'A', line: 'e', color: 'violet' },
                { id: 'B', label: 'B', line: 's', color: 'teal' },
              ]),
              question: {
                kind: 'numberLine', prompt: 'Put A at $\\frac{7}{8}$ and B at $\\frac{5}{6}$.',
                goals: [{ point: 'A', value: '7/8' }, { point: 'B', value: '5/6' }],
                hints: ['Count back one part from 1 on each line.'],
                successFeedback: 'A is closer to 1. Its gap, $\\frac{1}{8}$, is smaller than B\'s gap, $\\frac{1}{6}$.',
                explanation: 'One part short of 1 on each line: the eighths line has smaller parts, so A is closer.',
                concepts: ['compare-fractions'],
              },
            },
            {
              id: 'gap', type: 'narrative', stage: 'explain', title: 'Mind the gap',
              body: 'Near 1, compare the **missing piece**. Smaller gap, bigger fraction.',
            },
            {
              id: 'practice', type: 'question', stage: 'practice', title: 'Quick',
              question: {
                kind: 'choice', prompt: 'Which is bigger, $\\frac{3}{4}$ or $\\frac{4}{5}$?',
                options: [
                  { id: 'four-fifths', text: '$\\frac{4}{5}$', correct: true, feedback: 'Yes: its gap is $\\frac{1}{5}$, smaller than $\\frac{1}{4}$.' },
                  { id: 'three-quarters', text: '$\\frac{3}{4}$', misconception: 'smaller-denominator-bigger', feedback: 'Compare the gaps: $\\frac{1}{4}$ is a bigger gap than $\\frac{1}{5}$.' },
                  { id: 'same', text: 'The same', misconception: 'one-short-means-equal', feedback: 'Both are one part short, but the parts are different sizes.' },
                ],
                hints: ['What is missing from each to make 1?'],
                explanation: '$\\frac{3}{4}$ is $\\frac{1}{4}$ short of 1; $\\frac{4}{5}$ is only $\\frac{1}{5}$ short.',
                concepts: ['compare-fractions'],
              },
            },
            {
              id: 'half', type: 'question', stage: 'transfer', title: 'Past halfway?',
              interactive: nl([{ id: 'h', divisions: 2 }, { id: 'v', divisions: 7 }], [
                { id: 'H', label: '½', line: 'h', value: '1/2', draggable: false, color: 'amber' },
                { id: 'P', label: 'P', line: 'v', color: 'violet' },
              ]),
              question: {
                kind: 'numberLine', prompt: 'Put P at $\\frac{4}{7}$. Is it past ½?',
                goals: [{ point: 'P', value: '4/7' }],
                hints: ['Count 4 sevenths from 0.'],
                successFeedback: 'Just past ½: 4 is more than half of 7.',
                explanation: 'Half of 7 is 3.5, so $\\frac{4}{7}$ is a little more than ½.',
                concepts: ['compare-fractions'],
              },
            },
            {
              id: 'check', type: 'question', stage: 'assess', title: 'Mastery check',
              question: {
                kind: 'choice', prompt: 'Which is closest to 1?',
                options: [
                  { id: 'a', text: '$\\frac{4}{5}$', misconception: 'smaller-denominator-bigger', feedback: 'Its gap is $\\frac{1}{5}$, the biggest of the three.' },
                  { id: 'b', text: '$\\frac{5}{6}$', misconception: 'smaller-denominator-bigger', feedback: 'Its gap is $\\frac{1}{6}$; $\\frac{1}{7}$ is smaller.' },
                  { id: 'c', text: '$\\frac{6}{7}$', correct: true },
                  { id: 'd', text: 'All equally close', misconception: 'one-short-means-equal', feedback: 'Each is one part short, but sevenths are the smallest parts.' },
                ],
                explanation: 'The gaps are $\\frac{1}{5}$, $\\frac{1}{6}$ and $\\frac{1}{7}$. The smallest gap is $\\frac{1}{7}$, so $\\frac{6}{7}$ is closest.',
                concepts: ['compare-fractions'],
              },
            },
          ],
        },
        {
          id: 'decimals-are-fractions',
          title: 'Decimals are fractions too',
          summary: 'Tenths and hundredths on the line, and why 0.3 beats 0.25.',
          objectives: ['Place decimals on a number line', 'Read decimals as tenths and hundredths', 'Compare decimals with different numbers of digits'],
          concepts: ['decimals-as-fractions'],
          estimatedMinutes: 7,
          steps: [
            {
              id: 'predict', type: 'question', stage: 'predict', title: 'Guess',
              question: {
                kind: 'choice', prompt: 'Which is bigger, 0.3 or 0.25?',
                options: [
                  { id: 'point3', text: '0.3', correct: true, feedback: 'Let\'s check.' },
                  { id: 'point25', text: '0.25', misconception: 'longer-decimal-is-larger', feedback: 'Let\'s check.' },
                  { id: 'same', text: 'The same', misconception: 'decimal-lengths-equal', feedback: 'Let\'s check.' },
                ],
                concepts: ['decimals-as-fractions'],
              },
            },
            {
              id: 'tenths', type: 'interactive', stage: 'explore', title: 'Tenths',
              body: 'This line is cut into **10** parts. Drag **P**.',
              interactive: { ...nl([{ id: 'd', divisions: 10, labels: 'decimals' }], [{ id: 'P', label: 'P', line: 'd' }], { showValues: true }), goal: 'Put P at 0.3, then at 0.7.' },
            },
            {
              id: 'rule', type: 'narrative', stage: 'explain', title: 'Tenths are tenths',
              body: '0.3 is **3 tenths**: $0.3 = \\frac{3}{10}$.\n\n0.25 is **25 hundredths**, which is $2\\frac{1}{2}$ tenths.',
            },
            {
              id: 'race', type: 'question', stage: 'practice', title: '0.3 vs 0.25',
              body: 'Top line: tenths. Bottom line: twentieths (steps of 0.05).',
              interactive: nl([{ id: 't', divisions: 10, labels: 'decimals' }, { id: 'w', divisions: 20, labels: 'decimals' }], [
                { id: 'A', label: 'A', line: 't', color: 'violet' },
                { id: 'B', label: 'B', line: 'w', color: 'teal' },
              ]),
              question: {
                kind: 'numberLine', prompt: 'Put A at 0.3 and B at 0.25.',
                goals: [{ point: 'A', value: '0.3' }, { point: 'B', value: '0.25' }],
                hints: ['0.25 is halfway between 0.2 and 0.3.'],
                successFeedback: 'A is further right: 0.3 > 0.25.',
                explanation: '0.3 = 0.30, and 30 hundredths is more than 25 hundredths.',
                concepts: ['decimals-as-fractions'],
              },
            },
            {
              id: 'broken', type: 'question', stage: 'reflect', title: 'Spot the slip',
              question: {
                kind: 'choice', prompt: 'Mia says 0.25 > 0.3 "because 25 is bigger than 3". What went wrong?',
                options: [
                  { id: 'places', text: 'The digits are different place values: 0.3 is 0.30, and 30 hundredths beats 25 hundredths.', correct: true, feedback: 'Yes. Line up the places before comparing.' },
                  { id: 'fine', text: 'Nothing. More digits means bigger.', misconception: 'longer-decimal-is-larger', feedback: 'Look back at the line: 0.25 sat left of 0.3.' },
                ],
                explanation: 'Write both with the same number of places (0.30 and 0.25), then compare.',
                concepts: ['decimals-as-fractions'],
              },
            },
            {
              id: 'check', type: 'question', stage: 'assess', title: 'Mastery check',
              question: {
                kind: 'choice', prompt: 'Which is biggest?',
                options: [
                  { id: 'a', text: '0.5', correct: true },
                  { id: 'b', text: '0.45', misconception: 'longer-decimal-is-larger', feedback: '0.45 is 45 hundredths; 0.5 is 50 hundredths.' },
                  { id: 'c', text: '0.125', misconception: 'longer-decimal-is-larger', feedback: '0.125 is just over one tenth, far left of 0.5.' },
                ],
                explanation: 'As hundredths (and thousandths): 0.500, 0.450, 0.125. 0.5 is biggest.',
                concepts: ['decimals-as-fractions'],
              },
            },
            {
              id: 'check-place', type: 'question', stage: 'assess', title: 'One more',
              interactive: nl([{ id: 'w', divisions: 20, labels: 'decimals' }], [{ id: 'P', label: 'P', line: 'w' }]),
              question: {
                kind: 'numberLine', prompt: 'Put P at 0.45.',
                goals: [{ point: 'P', value: '0.45' }],
                explanation: '0.45 is halfway between 0.4 and 0.5.',
                concepts: ['decimals-as-fractions'],
              },
            },
          ],
        },
        {
          id: 'ordering-mixed',
          title: 'Put them in order',
          summary: 'Fractions and decimals on one line.',
          objectives: ['Order a mix of fractions and decimals', 'Find a number between two others'],
          concepts: ['ordering-numbers'],
          estimatedMinutes: 6,
          steps: [
            {
              id: 'place', type: 'question', stage: 'explore', title: 'One line for all',
              interactive: nl([{ id: 'w', divisions: 20, labels: 'decimals' }], [
                { id: 'A', label: 'A', line: 'w', color: 'violet' },
                { id: 'B', label: 'B', line: 'w', color: 'teal' },
                { id: 'C', label: 'C', line: 'w', color: 'amber' },
                { id: 'D', label: 'D', line: 'w', color: 'rose' },
              ]),
              question: {
                kind: 'numberLine', prompt: 'Place A = $\\frac{1}{2}$, B = 0.4, C = $\\frac{3}{4}$ and D = 0.8.',
                goals: [{ point: 'A', value: '1/2' }, { point: 'B', value: '0.4' }, { point: 'C', value: '3/4' }, { point: 'D', value: '0.8' }],
                hints: ['$\\frac{1}{2}$ = 0.5 and $\\frac{3}{4}$ = 0.75.'],
                successFeedback: 'Left to right: B, A, C, D.',
                explanation: 'As decimals: 0.4, 0.5, 0.75, 0.8.',
                concepts: ['ordering-numbers'],
              },
            },
            {
              id: 'rule', type: 'narrative', stage: 'explain', title: 'Left is smaller',
              body: 'To order a mix, put everything in one form, decimals or fractions. Then read the line left to right.',
            },
            {
              id: 'order', type: 'question', stage: 'practice', title: 'Smallest to largest',
              question: {
                kind: 'order', prompt: 'Order from smallest to largest.',
                items: ['0.7', '$\\frac{2}{3}$', '0.65', '$\\frac{3}{5}$'],
                correctOrder: [3, 2, 1, 0],
                hints: ['$\\frac{3}{5}$ = 0.6 and $\\frac{2}{3}$ ≈ 0.67.'],
                explanation: '0.6 < 0.65 < 0.67 < 0.7.',
                concepts: ['ordering-numbers'],
              },
            },
            {
              id: 'between', type: 'question', stage: 'challenge', title: 'Squeeze in',
              interactive: nl([{ id: 'w', divisions: 20, labels: 'decimals' }], [{ id: 'P', label: 'P', line: 'w' }]),
              question: {
                kind: 'numberLine', prompt: 'Put P between $\\frac{2}{5}$ and $\\frac{1}{2}$.',
                goals: [{ point: 'P', op: 'gt', value: '2/5' }, { point: 'P', op: 'lt', value: '1/2' }],
                hints: ['$\\frac{2}{5}$ = 0.4 and $\\frac{1}{2}$ = 0.5.'],
                successFeedback: 'P = 0.45. There\'s always room between two numbers.',
                explanation: 'Between 0.4 and 0.5 on this line there is exactly one mark: 0.45.',
                concepts: ['ordering-numbers'],
              },
            },
            {
              id: 'check', type: 'question', stage: 'assess', title: 'Mastery check',
              question: {
                kind: 'order', prompt: 'Order from smallest to largest.',
                items: ['0.5', '0.45', '$\\frac{3}{8}$', '0.405'],
                correctOrder: [2, 3, 1, 0],
                explanation: '$\\frac{3}{8}$ = 0.375, so: 0.375 < 0.405 < 0.45 < 0.5.',
                concepts: ['ordering-numbers'],
              },
            },
          ],
        },
      ],
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
