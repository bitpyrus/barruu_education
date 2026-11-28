/**
 * F3 Expressions and Equations (docs/MATH_CURRICULUM.md).
 *
 * Original Barruu content. "=" is taught as balance (same value on both sides), not
 * "the answer comes next" (Knuth et al. 2006; McNeil et al. 2006). The balance scale
 * fades to symbols: the equation under the scale updates live and shows "≠" when tipped.
 */
type Pan = { x?: number; units?: number };
const balance = (left: Pan, right: Pan, extra: Record<string, unknown> = {}) => ({
  kind: 'balanceTiles',
  config: { left, right, ...extra },
});

export const EXPRESSIONS_AND_EQUATIONS = {
  id: 'expressions-and-equations',
  version: '0.1.0',
  title: 'Expressions and Equations',
  tagline: 'Keep it balanced. Find the unknown.',
  subject: 'Mathematics',
  level: 'Foundations',
  grades: [6, 7],
  skills: ['math.equals-sign', 'math.two-step-equations'],
  summary: 'An equation is a balance. Learn what "=" really means, then solve for the unknown by doing the same thing to both sides, first with tiles on a scale, then with symbols.',
  outcomes: [
    'Read "=" as "both sides have the same value"',
    'Keep an equation balanced while changing it',
    'Solve one- and two-step equations',
  ],
  prerequisites: ['Adding and multiplying whole numbers'],
  illustration: 'balance',
  color: '#0e7490',
  featured: true,
  chapters: [
    {
      id: 'what-equals-means',
      title: 'What "=" means',
      summary: 'Equal means balanced.',
      lessons: [
        {
          id: 'the-balance',
          title: 'What does = mean?',
          summary: 'Balance a scale, then find a hidden weight without ever tipping it.',
          objectives: ['Read "=" as "same value on both sides"', 'Solve equations by doing the same thing to both sides'],
          concepts: ['equals-sign', 'solving-equations'],
          estimatedMinutes: 8,
          steps: [
            {
              id: 'predict', type: 'question', stage: 'predict', title: 'Fill the box',
              question: {
                kind: 'choice', prompt: '$8 + 4 = \\square + 5$. What goes in the box?',
                options: [
                  { id: 'seven', text: '7', correct: true, feedback: 'Let\'s check.' },
                  { id: 'twelve', text: '12', misconception: 'equals-means-compute', feedback: 'Let\'s check.' },
                  { id: 'seventeen', text: '17', misconception: 'add-all-numbers', feedback: 'Let\'s check on a scale.' },
                ],
                concepts: ['equals-sign'],
              },
            },
            {
              id: 'level', type: 'question', stage: 'explore', title: 'Make it level',
              body: 'The left pan holds 8 + 4. The right pan holds 5. Add 1-tiles to the right: the number you add is the box.',
              interactive: balance({ units: 12 }, { units: 5 }, { mode: 'free', editable: ['right'], maxUnits: 20 }),
              question: {
                kind: 'balance', prompt: 'Make the scale level. How many tiles did you add?',
                goals: [{ kind: 'balanced' }],
                hints: ['How much is the left pan worth?', 'You need 12 on the right. It already has 5.'],
                successFeedback: '5 + 7 = 12. The box is **7**, not 12 (that\'s the left side) or 17 (that adds everything).',
                explanation: 'Both sides must be worth 12, so the box is 7.',
                concepts: ['equals-sign'],
              },
            },
            {
              id: 'meaning', type: 'narrative', stage: 'explain', title: '= means balanced',
              body: '"=" says both sides are worth **the same**. It does not mean "the answer comes next".',
            },
            {
              id: 'true-or-not', type: 'question', stage: 'practice', title: 'True or not?',
              question: {
                kind: 'choice', prompt: 'Which are true? Pick all.', multiple: true,
                options: [
                  { id: 'a', text: '$7 = 3 + 4$', correct: true, feedback: 'True. The "answer" can come first: both sides are worth 7.' },
                  { id: 'b', text: '$5 + 2 = 2 + 5$', correct: true },
                  { id: 'c', text: '$3 + 4 = 7 + 2$', misconception: 'equals-means-compute', feedback: 'The right side is 9, not 7. Both sides must match.' },
                  { id: 'd', text: '$3 + 4 = 7$', correct: true },
                ],
                hints: ['Work out each side separately.'],
                explanation: 'True means both sides have the same value. $7 = 3 + 4$ is true even with the single number first. $3 + 4 = 7 + 2$ is false: it says 7 = 9.',
                concepts: ['equals-sign'],
              },
            },
            {
              id: 'mystery', type: 'interactive', stage: 'explore', title: 'A mystery tile',
              body: 'The green **x** has a hidden weight. You can only do the **same thing to both sides**.',
              interactive: { ...balance({ x: 1, units: 3 }, { units: 7 }, { xValue: 4 }), goal: 'Get x alone. What does it weigh?' },
            },
            {
              id: 'rule', type: 'narrative', stage: 'explain', title: 'Same to both sides',
              body: 'Do the same thing to both sides and the scale stays level.\n\n$x + 3 = 7$ → take 3 from both → $x = 4$.',
            },
            {
              id: 'two-x', type: 'question', stage: 'challenge', title: 'Two of them',
              interactive: balance({ x: 2, units: 3 }, { units: 11 }, { xValue: 4 }),
              question: {
                kind: 'balance', prompt: 'Solve $2x + 3 = 11$ on the scale.',
                goals: [{ kind: 'solved' }],
                hints: ['First get rid of the 1-tiles next to the x\'s.', 'Two x\'s weigh 8. Share both sides into 2.'],
                successFeedback: '$2x = 8$, so $x = 4$.',
                explanation: 'Take 3 from both sides ($2x = 8$), then share both sides into 2 ($x = 4$).',
                concepts: ['solving-equations'],
              },
            },
            {
              id: 'predict-x', type: 'question', stage: 'practice', title: 'Guess, then check',
              interactive: balance({ x: 2, units: 5 }, { units: 13 }, { xValue: 4 }),
              question: {
                kind: 'numeric', prompt: 'Before you touch the scale: in $2x + 5 = 13$, what is $x$?', answer: 4, tolerance: 0,
                hints: ['What can you take from both sides so only x\'s are left on the left?', 'Take 5 from both: $2x = 8$.', 'Share both sides into 2: $x = 4$.'],
                explanation: '$2x + 5 = 13$ → take 5 from both → $2x = 8$ → share into 2 → $x = 4$. Use the scale to check.',
                concepts: ['solving-equations'],
              },
            },
            {
              id: 'slip', type: 'question', stage: 'reflect', title: 'Spot the slip',
              interactive: balance({ x: 1 }, { units: 9 }, { xValue: 4, mode: 'free', editable: ['left'] }),
              question: {
                kind: 'choice', prompt: 'Sam took 5 from the **left side only** of $x + 5 = 9$ and got this. What went wrong?',
                options: [
                  { id: 'both', text: 'Sam changed one side only, so the sides are no longer equal. Take 5 from both: $x = 4$.', correct: true, feedback: 'Yes. Whatever you do, do it to both sides.' },
                  { id: 'fine', text: 'Nothing. Taking 5 away gets x alone.', misconception: 'one-side-operation', feedback: 'Look at the scale: it tipped. Taking 5 from one pan makes the sides unequal.' },
                  { id: 'add', text: 'Sam should have added 5 to the right instead.', misconception: 'equation-solving-moves', feedback: 'That gives x = 14, still one-sided. Take 5 from both sides.' },
                ],
                explanation: 'Changing one side breaks the balance. $x + 5 = 9$ → $x = 4$.',
                concepts: ['solving-equations'],
              },
            },
            {
              id: 'check', type: 'question', stage: 'assess', title: 'Mastery check',
              question: {
                kind: 'numeric', prompt: 'No scale this time. Solve $3x + 2 = 17$. $x = ?$', answer: 5, tolerance: 0,
                explanation: 'Take 2 from both sides: $3x = 15$. Share both sides into 3: $x = 5$.',
                concepts: ['solving-equations'],
              },
            },
            {
              id: 'check-box', type: 'question', stage: 'assess', title: 'One more',
              question: {
                kind: 'choice', prompt: '$4 + 6 = \\square + 3$. What goes in the box?',
                options: [
                  { id: 'a', text: '7', correct: true },
                  { id: 'b', text: '10', misconception: 'equals-means-compute', feedback: '10 is the left side. The right side must also make 10: □ + 3 = 10.' },
                  { id: 'c', text: '13', misconception: 'add-all-numbers', feedback: 'That adds every number. Both sides must be worth 10.' },
                ],
                explanation: 'The left side is 10, so $\\square + 3 = 10$ and the box is 7.',
                concepts: ['equals-sign'],
              },
            },
          ],
        },
      ],
    },
    { id: 'equivalent-expressions', title: 'Equivalent expressions', summary: 'Different-looking, same value.', status: 'planned', plannedLessons: ['Collecting like terms', 'The distributive property'] },
    { id: 'two-step-equations', title: 'One- and two-step equations', summary: 'From tiles to symbols.', status: 'planned', plannedLessons: ['Undo in reverse', 'Negative tiles'] },
    { id: 'both-sides', title: 'Variables on both sides', summary: 'x on both pans.', status: 'planned', plannedLessons: ['Take x from both', 'No solution or every solution'] },
    { id: 'inequalities', title: 'Inequalities', summary: 'When the scale is meant to tip.', status: 'planned', plannedLessons: ['Heavier or lighter?', 'Solutions on the number line'] },
    { id: 'writing-equations', title: 'Writing equations', summary: 'From stories to symbols.', status: 'planned', plannedLessons: ['Say it with x', 'Check it makes sense'] },
  ],
};
