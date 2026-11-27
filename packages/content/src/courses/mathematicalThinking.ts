/**
 * Flagship course: Mathematical Thinking.
 *
 * Original Barruu content. Chapter 1 ("Area and shape") is complete; later
 * chapters are listed as planned. Each lesson teaches through construction:
 * learners count, resize and drag, and their constructions are the answers —
 * checked exactly by the geometry engine, offline.
 */
type Pt = [number, number];

const rect = (x: number, y: number, w: number, h: number): Pt[] => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
const shift = (pts: Pt[], dx: number, dy: number): Pt[] => pts.map(([x, y]) => [x + dx, y + dy]);

// Two "gardens" with the same area but very different outlines.
const L_SHAPE: Pt[] = shift([[0, 0], [6, 0], [6, 1], [1, 1], [1, 4], [0, 4]], 1, 1); // area 9, perimeter 20
const SQUARE: Pt[] = rect(9, 1, 3, 3); // area 9, perimeter 12
const T_SHAPE: Pt[] = shift([[2, 0], [3, 0], [3, 3], [5, 3], [5, 4], [0, 4], [0, 3], [2, 3]], 1, 1); // area 8

const gardens = (extra: Record<string, unknown> = {}) => ({
  kind: 'gridBoard',
  config: {
    cols: 13, rows: 6, ...extra,
    shapes: [
      { id: 'a', label: 'A', kind: 'polygon', points: L_SHAPE, color: 'teal' },
      { id: 'b', label: 'B', kind: 'rect', points: SQUARE, color: 'amber' },
    ],
  },
});

export const MATHEMATICAL_THINKING = {
  id: 'mathematical-thinking',
  version: '0.1.0',
  title: 'Mathematical Thinking',
  tagline: 'Reason with shapes, numbers and patterns — by building them.',
  subject: 'Mathematics',
  level: 'Foundations',
  grades: [8, 9],
  skills: ['math.area-perimeter', 'math.pythagorean'],
  summary: 'A hands-on introduction to thinking like a mathematician. Instead of memorising formulas, you build shapes, test ideas and discover why the rules work.',
  outcomes: [
    'Measure area by covering shapes with unit squares',
    'Explain why a rectangle\'s area is width × height',
    'Tell area and perimeter apart, and predict how they change',
    'Find the area of any triangle on a grid',
  ],
  prerequisites: ['Counting and multiplying whole numbers'],
  illustration: 'area',
  color: '#0f766e',
  featured: true,
  chapters: [
    {
      id: 'area-and-shape',
      title: 'Area and shape',
      summary: 'What it means for one shape to be "bigger" than another.',
      lessons: [
        {
          id: 'what-is-area',
          title: 'Which garden is bigger?',
          summary: 'Discover what area measures by covering shapes with unit squares.',
          objectives: ['Measure area by counting unit squares', 'Find the area of a rectangle without counting every square'],
          concepts: ['area-measurement', 'rectangle-area'],
          estimatedMinutes: 8,
          steps: [
            {
              id: 'predict', type: 'question', stage: 'predict', title: 'Two gardens',
              body: 'You need grass seed for two gardens. Seed is sold by how much ground it covers.',
              interactive: gardens(),
              question: {
                kind: 'choice', prompt: 'Which garden needs **more** seed?',
                options: [
                  { id: 'a', text: 'Garden A', misconception: 'bigger-outline-means-bigger-area', feedback: 'A certainly looks bigger. Let\'s measure.' },
                  { id: 'b', text: 'Garden B', misconception: 'compact-means-bigger', feedback: 'Let\'s measure and find out.' },
                  { id: 'same', text: 'They need the same amount', correct: true, feedback: 'Let\'s check your hunch.' },
                ],
                concepts: ['area-measurement'],
              },
            },
            {
              id: 'cover', type: 'interactive', stage: 'explore', title: 'Cover them with squares',
              body: 'Mathematicians measure how much surface a shape covers by counting how many **unit squares** fit inside it. Reveal the squares and count each garden.',
              interactive: { ...gardens({ allowTileToggle: true }), goal: 'Show the unit squares and count both gardens.' },
            },
            {
              id: 'area-defined', type: 'narrative', stage: 'explain', title: 'That count is the area',
              body: 'Both gardens cover exactly **9 unit squares**, so they have the same **area**: 9 square units.\n\nGarden A *looks* bigger because it stretches further — its outline is much longer. The length of the outline is a different measurement called the **perimeter**. You\'ll meet it again in the next lesson.',
            },
            {
              id: 'count-t', type: 'question', stage: 'practice', title: 'Count without the squares',
              body: 'This time there\'s no "show squares" button. Use the grid lines.',
              interactive: { kind: 'gridBoard', config: { cols: 8, rows: 6, shapes: [{ id: 't', label: '', kind: 'polygon', points: T_SHAPE, color: 'violet' }] } },
              question: {
                kind: 'numeric', prompt: 'How many unit squares does this shape cover?', answer: 8, tolerance: 0,
                hints: ['Split the shape into two rectangles: the bar across the top and the stem.', 'The top bar is 5 squares. How many are in the stem below it?'],
                explanation: 'The top bar covers 5 squares and the stem covers 3 more: $5 + 3 = 8$. Splitting shapes into rectangles is a powerful trick.',
                concepts: ['area-measurement'],
              },
            },
            {
              id: 'build-12', type: 'question', stage: 'challenge', title: 'Build an area',
              body: 'Drag the round handle to resize the rectangle.',
              interactive: { kind: 'gridBoard', config: { cols: 13, rows: 7, shapes: [{ id: 'r', label: '', kind: 'rect', points: rect(1, 1, 2, 2), editable: 'resize', color: 'violet' }] } },
              question: {
                kind: 'construction', prompt: 'Make a rectangle that covers exactly **12** unit squares.',
                goals: [{ shape: 'r', metric: 'area', value: 12 }],
                hints: ['A rectangle is made of equal rows of squares.', 'How many rows of 4 squares make 12? Or rows of 6?'],
                successFeedback: 'Exactly 12. A rectangle is rows × columns of squares, so its area is **width × height** — no need to count one by one.',
                explanation: 'Any rectangle whose width × height is 12 works: 1 × 12, 2 × 6, 3 × 4 (or turned on its side).',
                concepts: ['rectangle-area'],
              },
            },
            {
              id: 'check', type: 'question', stage: 'assess', title: 'Quick check',
              body: 'No grid this time.',
              question: {
                kind: 'numeric', prompt: 'A rectangular rug is 7 units long and 3 units wide. What is its area, in square units?', answer: 21, tolerance: 0,
                explanation: '$7 \\times 3 = 21$ square units: 3 rows of 7 squares.',
                concepts: ['rectangle-area'],
              },
            },
          ],
        },
        {
          id: 'area-and-perimeter',
          title: 'Same area, different shape',
          summary: 'Build rectangles with equal areas and watch what happens to the fence around them.',
          objectives: ['Distinguish area from perimeter', 'Predict which rectangles have the smallest and largest perimeter for a given area'],
          concepts: ['area-perimeter'],
          estimatedMinutes: 10,
          steps: [
            {
              id: 'fence', type: 'question', stage: 'predict', title: 'Fencing a garden',
              body: 'A gardener wants a rectangular vegetable patch covering **12 square metres**, with a fence all the way around it.',
              question: {
                kind: 'choice', prompt: 'Does the shape of the rectangle change how much fence is needed?',
                options: [
                  { id: 'no', text: 'No — same area means the same amount of fence', misconception: 'same-area-same-perimeter', feedback: 'A very common idea. Test it next.' },
                  { id: 'yes', text: 'Yes — some shapes need more fence', correct: true, feedback: 'Let\'s find out how much it varies.' },
                ],
                concepts: ['area-perimeter'],
              },
            },
            {
              id: 'explore', type: 'interactive', stage: 'explore', title: 'Try every rectangle',
              body: 'The board shows both measurements as you resize. Find all the rectangles with an area of 12 and compare their perimeters.',
              interactive: {
                kind: 'gridBoard', goal: 'Find every rectangle with area 12. Which needs the least fence?',
                config: { cols: 14, rows: 7, shapes: [{ id: 'r', label: '', kind: 'rect', points: rect(1, 1, 3, 4), editable: 'resize', color: 'teal', showArea: true, showPerimeter: true }] },
              },
            },
            {
              id: 'longest', type: 'question', stage: 'challenge', title: 'The most fence',
              body: 'The area must stay 12.',
              interactive: { kind: 'gridBoard', config: { cols: 14, rows: 7, shapes: [{ id: 'r', label: '', kind: 'rect', points: rect(1, 1, 3, 4), editable: 'resize', color: 'teal', showArea: true, showPerimeter: true }] } },
              question: {
                kind: 'construction', prompt: 'Build the rectangle with area 12 that needs the **most** fence.',
                goals: [
                  { shape: 'r', metric: 'area', value: 12, message: 'Keep the area at exactly 12.' },
                  { shape: 'r', metric: 'perimeter', value: 26, message: 'Area 12 — good. But there\'s a rectangle with an even longer fence. Try stretching it out.' },
                ],
                hints: ['Long and thin shapes have long outlines.', 'Try a rectangle only 1 unit tall.'],
                successFeedback: 'A 1 × 12 strip needs 26 m of fence — more than double the 3 × 4 rectangle\'s 14 m.',
                explanation: 'The perimeter of a 1 × 12 rectangle is $12 + 1 + 12 + 1 = 26$.',
                concepts: ['area-perimeter'],
              },
            },
            {
              id: 'least', type: 'question', stage: 'challenge', title: 'The least fence',
              body: 'Now a bigger patch: **16 square metres**.',
              interactive: { kind: 'gridBoard', config: { cols: 14, rows: 7, shapes: [{ id: 'r', label: '', kind: 'rect', points: rect(1, 1, 8, 2), editable: 'resize', color: 'teal', showArea: true, showPerimeter: true }] } },
              question: {
                kind: 'construction', prompt: 'Build the rectangle with area 16 that needs the **least** fence.',
                goals: [
                  { shape: 'r', metric: 'area', value: 16, message: 'Keep the area at exactly 16.' },
                  { shape: 'r', metric: 'perimeter', value: 16, message: 'Area 16 — good. Can you use less fence? Look at how the perimeter changed in the last two challenges.' },
                ],
                hints: ['Thin shapes waste fence. What\'s the opposite of thin?', 'Make the width and the height equal.'],
                successFeedback: 'A 4 × 4 square. For a given area, the closer a rectangle is to a square, the shorter its perimeter.',
                explanation: 'Area 16 rectangles: 1 × 16 (perimeter 34), 2 × 8 (20) and 4 × 4 (16). The square wins.',
                concepts: ['area-perimeter'],
              },
            },
            {
              id: 'why', type: 'narrative', stage: 'explain', title: 'Two different measurements',
              body: '- **Area** counts the squares inside a shape.\n- **Perimeter** measures the length of its edge.\n- Shapes with the same area can have very different perimeters: stretching a rectangle keeps its area but lengthens its edge.\n- For a fixed area, a square has the shortest perimeter of any rectangle.',
            },
            {
              id: 'fence-20', type: 'question', stage: 'transfer', title: 'Turn it around',
              body: 'Now the fence is fixed and the area can change.',
              question: {
                kind: 'choice', prompt: 'You have exactly **20 m** of fence. Which rectangle gives you the **most** garden?',
                options: [
                  { id: '1x9', text: '1 m × 9 m', misconception: 'same-perimeter-same-area', feedback: 'That uses all 20 m of fence but only encloses 9 m².' },
                  { id: '4x6', text: '4 m × 6 m', feedback: 'Close: 24 m². There\'s one slightly better.' },
                  { id: '5x5', text: '5 m × 5 m', correct: true, feedback: 'Yes — 25 m². The square wins again.' },
                ],
                hints: ['Each option uses 20 m of fence. Work out the area of each.'],
                explanation: 'All three rectangles have perimeter 20, with areas 9, 24 and 25. The square encloses the most.',
                concepts: ['area-perimeter'],
              },
            },
            {
              id: 'check', type: 'question', stage: 'assess', title: 'Mastery check',
              body: 'Use what you know about both measurements.',
              interactive: { kind: 'gridBoard', config: { cols: 14, rows: 7, shapes: [{ id: 'r', label: '', kind: 'rect', points: rect(1, 1, 2, 2), editable: 'resize', color: 'violet' }] } },
              question: {
                kind: 'construction', prompt: 'Build a rectangle with an area of **10** and a perimeter of **14**.',
                goals: [
                  { shape: 'r', metric: 'area', value: 10 },
                  { shape: 'r', metric: 'perimeter', value: 14 },
                ],
                successFeedback: '2 × 5: area 10, perimeter 2 + 5 + 2 + 5 = 14.',
                explanation: 'The rectangles with area 10 are 1 × 10 (perimeter 22) and 2 × 5 (perimeter 14).',
                concepts: ['area-perimeter'],
              },
            },
          ],
        },
        {
          id: 'triangle-area',
          title: 'Triangles are half rectangles',
          summary: 'Drag corners to discover why every triangle\'s area is half of a rectangle.',
          objectives: ['Explain why a triangle\'s area is ½ × base × height', 'Construct triangles with a given area'],
          concepts: ['triangle-area'],
          estimatedMinutes: 12,
          steps: [
            {
              id: 'predict', type: 'question', stage: 'predict', title: 'A triangle in a box',
              body: 'The dashed rectangle fits snugly around the triangle.',
              interactive: { kind: 'gridBoard', config: { cols: 9, rows: 6, shapes: [{ id: 't', label: '', kind: 'polygon', points: [[1, 1], [7, 1], [3, 5]], color: 'rose', showBoundingBox: true }] } },
              question: {
                kind: 'choice', prompt: 'How much of the dashed rectangle does the triangle cover?',
                options: [
                  { id: 'half', text: 'Exactly half', correct: true, feedback: 'Let\'s test whether that\'s always true.' },
                  { id: 'third', text: 'About a third', misconception: 'triangle-is-a-third', feedback: 'Let\'s measure it.' },
                  { id: 'depends', text: 'It depends on where the top corner is', misconception: 'apex-position-changes-area', feedback: 'Good question to test — try it next.' },
                ],
                concepts: ['triangle-area'],
              },
            },
            {
              id: 'slide', type: 'interactive', stage: 'explore', title: 'Slide the top corner',
              body: 'Drag the **top** corner left and right, keeping it on the same height. Watch the area. Then try moving it up and down.',
              interactive: {
                kind: 'gridBoard', goal: 'Keep the top corner on the top line. Does the area change?',
                config: { cols: 12, rows: 7, shapes: [{ id: 't', label: '', kind: 'polygon', points: [[2, 1], [8, 1], [4, 5]], editable: 'vertices', color: 'rose', showArea: true, showBoundingBox: true }] },
              },
            },
            {
              id: 'half', type: 'narrative', stage: 'explain', title: 'Why half?',
              body: 'Draw a line straight down from the top corner. It cuts the dashed rectangle into two smaller rectangles — and cuts the triangle into two pieces, each **exactly half** of its small rectangle.\n\nSo the triangle is half of the big rectangle:\n\n$$\\text{area} = \\tfrac{1}{2} \\times \\text{base} \\times \\text{height}$$\n\nSliding the top corner sideways doesn\'t change the base or the height, so the area stays the same. Moving it up or down changes the height — and the area with it.',
            },
            {
              id: 'build-6', type: 'question', stage: 'challenge', title: 'Build a triangle',
              body: 'Drag any of the three corners.',
              interactive: { kind: 'gridBoard', config: { cols: 10, rows: 7, shapes: [{ id: 't', label: '', kind: 'polygon', points: [[1, 1], [3, 1], [1, 3]], editable: 'vertices', color: 'rose' }] } },
              question: {
                kind: 'construction', prompt: 'Make a triangle with an area of exactly **6** square units.',
                goals: [{ shape: 't', metric: 'area', value: 6 }],
                hints: ['½ × base × height = 6 means base × height = 12.', 'Try a horizontal base of 4 and a height of 3.'],
                successFeedback: 'Area 6. Any base and height that multiply to 12 work.',
                explanation: 'For example base 4, height 3: $\\tfrac{1}{2} \\times 4 \\times 3 = 6$. Base 6 and height 2 also works.',
                concepts: ['triangle-area'],
              },
            },
            {
              id: 'tilted', type: 'question', stage: 'challenge', title: 'No straight sides',
              body: 'Harder: none of the triangle\'s sides may run along a grid line. The area is shown to help you.',
              interactive: { kind: 'gridBoard', config: { cols: 10, rows: 7, shapes: [{ id: 't', label: '', kind: 'polygon', points: [[1, 1], [5, 1], [2, 4]], editable: 'vertices', color: 'sky', showArea: true, showBoundingBox: true }] } },
              question: {
                kind: 'construction', prompt: 'Make a triangle with area **6** where **no side** is horizontal or vertical.',
                goals: [
                  { shape: 't', metric: 'axisAlignedSides', value: 0, message: 'One of your sides still runs along a grid line. Tilt every side.' },
                  { shape: 't', metric: 'area', value: 6 },
                ],
                hints: [
                  'Without a horizontal base you can\'t use ½ × base × height directly. Look at the dashed box instead.',
                  'The triangle\'s area is the box\'s area minus the three right-angled triangles in its corners.',
                  'Try corners at (1, 1), (6, 2) and (4, 4), then adjust.',
                ],
                successFeedback: 'Tricky! Subtracting the corner triangles from the surrounding box works for any triangle on a grid.',
                explanation: 'Corners at (1, 1), (6, 2), (4, 4): the box is 5 × 3 = 15, the corner triangles are 2.5, 2 and 4.5, and $15 - 9 = 6$.',
                concepts: ['triangle-area'],
              },
            },
            {
              id: 'compute', type: 'question', stage: 'practice', title: 'Use the formula',
              body: '',
              interactive: { kind: 'gridBoard', config: { cols: 9, rows: 5, shapes: [{ id: 't', label: '', kind: 'polygon', points: [[1, 1], [6, 1], [5, 4]], color: 'amber' }] } },
              question: {
                kind: 'numeric', prompt: 'What is the area of this triangle?', answer: 7.5, tolerance: 0.001,
                hints: ['The base runs along the bottom. How long is it?', 'The base is 5 and the height is 3.'],
                explanation: '$\\tfrac{1}{2} \\times 5 \\times 3 = 7.5$ square units — triangles on a grid can have half squares.',
                concepts: ['triangle-area'],
              },
            },
            {
              id: 'check', type: 'question', stage: 'assess', title: 'Mastery check',
              body: '',
              question: {
                kind: 'choice', prompt: 'A triangle has base 8 and height 5. A rectangle is 4 wide and 5 tall. Which has the larger area?',
                options: [
                  { id: 'tri', text: 'The triangle', misconception: 'forgot-half' },
                  { id: 'rect', text: 'The rectangle', misconception: 'triangle-is-small' },
                  { id: 'same', text: 'They\'re equal', correct: true },
                ],
                explanation: 'Triangle: $\\tfrac{1}{2} \\times 8 \\times 5 = 20$. Rectangle: $4 \\times 5 = 20$.',
                concepts: ['triangle-area'],
              },
            },
          ],
        },
      ],
    },
    { id: 'fractions-as-areas', title: 'Fractions as areas', status: 'planned', summary: 'Cut shapes into equal parts and compare pieces.', plannedLessons: ['Fair shares', 'Comparing fractions by area', 'Adding pieces'] },
    { id: 'patterns', title: 'Patterns and growth', status: 'planned', summary: 'Predict what comes next — and prove it.', plannedLessons: ['Growing patterns', 'Counting without counting', 'Square and triangular numbers'] },
    { id: 'algebra-pictures', title: 'Algebra from pictures', status: 'planned', summary: 'Turn shapes and patterns into equations.', plannedLessons: ['Balancing', 'Unknowns as boxes', 'Area models for multiplication'] },
    { id: 'logic', title: 'Logical problem-solving', status: 'planned', summary: 'Puzzles that reward careful reasoning.', plannedLessons: ['Working backwards', 'Invariants', 'Proof by picture'] },
  ],
};
