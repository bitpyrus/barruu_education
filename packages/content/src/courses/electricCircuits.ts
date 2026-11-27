/**
 * Electric Circuits.
 *
 * Original Barruu content. Learners build circuits on the circuit board; the
 * engine's DC solver computes every current and voltage, and circuit goals are
 * checked exactly, offline. Numbers used throughout: 3 V battery, 6 Ω bulbs
 * (0.5 A and full brightness on their own), so series and parallel give clean
 * values (0.25 A each in series; 1 A total for two in parallel).
 */
type Part = Record<string, unknown>;

const wire = (at: string): Part => ({ id: `w-${at.replace(/[:,]/g, '')}`, at, kind: 'wire' });
const wires = (...at: string[]) => at.map(wire);
const battery = (volts = 3, at = 'v:0,0'): Part => ({ id: 'bat', at, kind: 'battery', volts });
const bulb = (id: string, at: string, label = id): Part => ({ id, label, at, kind: 'bulb' });
const WIRE = { kind: 'wire' };
const BULB = { kind: 'bulb' };

const board = (parts: Part[], extra: Record<string, unknown> = {}) => ({ kind: 'circuitBoard', config: { cols: 4, rows: 3, parts, ...extra } });

// Lesson 1 boards ───────────────────────────────────────────────────────────
const completeTheLoop = board(
  [battery(), bulb('A', 'h:1,0'), ...wires('v:0,1', 'h:0,2', 'h:1,2', 'h:2,2', 'v:3,1')],
  { slots: [{ id: 'g1', label: '1', at: 'h:0,0', options: [WIRE] }, { id: 'g2', label: '2', at: 'h:2,0', options: [WIRE] }, { id: 'g3', label: '3', at: 'v:3,0', options: [WIRE] }], showReadings: false },
);
const switchBoard = board(
  [battery(), bulb('A', 'h:1,0'), { id: 'S', label: '', at: 'v:3,0', kind: 'switch', toggleable: true }, ...wires('v:0,1', 'h:0,0', 'h:2,0', 'v:3,1', 'h:1,2', 'h:2,2')],
  { slots: [{ id: 'g1', label: '', at: 'h:0,2', options: [WIRE] }], showReadings: false },
);
// Wires drop from both ends of bulb A; a wire in the trap gap would join them under the bulb.
const trapBoard = board(
  [battery(), bulb('A', 'h:1,0'), ...wires('v:0,1', 'v:1,0', 'v:2,0', 'h:2,0', 'v:3,1', 'h:0,2', 'h:1,2', 'h:2,2')],
  { slots: [
    { id: 'g1', label: '1', at: 'h:0,0', options: [WIRE] },
    { id: 'g2', label: '2', at: 'h:1,1', options: [WIRE] },
    { id: 'g3', label: '3', at: 'v:3,0', options: [WIRE] },
  ], showReadings: false },
);
const bypassBoard = board(
  [battery(), bulb('A', 'h:1,0'), { id: 'S', label: '', at: 'h:1,1', kind: 'switch', toggleable: true }, ...wires('v:0,1', 'h:0,0', 'v:1,0', 'v:2,0', 'h:2,0', 'v:3,0', 'v:3,1', 'h:0,2', 'h:1,2', 'h:2,2')],
);

// Lesson 2 boards ───────────────────────────────────────────────────────────
const seriesParts = [battery(), bulb('A', 'h:1,0'), ...wires('v:0,1', 'h:0,0', 'v:3,0', 'v:3,1', 'h:0,2', 'h:1,2', 'h:2,2')];
const seriesBoard = (start: number) => board(seriesParts, { slots: [{ id: 'B', label: 'B', at: 'h:2,0', options: [WIRE, BULB], start }] });
const parallelBoard = board(
  [battery(), bulb('A', 'v:3,0'), ...wires('v:0,1', 'h:0,0', 'h:1,0', 'h:2,0', 'v:3,1', 'h:0,2', 'h:1,2', 'h:2,2')],
  { slots: [
    { id: 'm1', label: '1', at: 'v:2,0', options: [WIRE, BULB] },
    { id: 'm2', label: '2', at: 'v:2,1', options: [WIRE, BULB] },
  ] },
);

// Lesson 3 boards ───────────────────────────────────────────────────────────
const loopWires = wires('v:0,1', 'h:0,0', 'h:2,0', 'v:3,0', 'v:3,1', 'h:0,2', 'h:1,2', 'h:2,2');
const ohmLab = board(
  [battery(6), { id: 'R', label: '', at: 'h:1,0', kind: 'resistor', ohms: 4 }, ...loopWires],
  { adjustable: [
    { part: 'bat', property: 'volts', label: 'Battery voltage', min: 1, max: 12, step: 1 },
    { part: 'R', property: 'ohms', label: 'Resistance', min: 1, max: 12, step: 1 },
  ] },
);
const ohmFixed = board([battery(6), { id: 'R', label: '', at: 'h:1,0', kind: 'resistor', ohms: 3 }, ...loopWires], { showReadings: false });
const R = (ohms: number) => ({ kind: 'resistor', ohms });
const pickResistor = board([battery(6), ...loopWires], { slots: [{ id: 'R', label: 'R', at: 'h:1,0', options: [R(2), R(4), R(8), R(12)] }], showReadings: false });
const twoResistors = board(
  [battery(6), ...wires('v:0,1', 'h:0,0', 'v:3,0', 'v:3,1', 'h:0,2', 'h:1,2', 'h:2,2')],
  { slots: [
    { id: 'R1', label: '1', at: 'h:1,0', options: [R(2), R(4), R(6)] },
    { id: 'R2', label: '2', at: 'h:2,0', options: [R(2), R(4), R(6)] },
  ], showReadings: false },
);

export const ELECTRIC_CIRCUITS = {
  id: 'electric-circuits',
  version: '0.1.0',
  title: 'Electric Circuits',
  tagline: 'Build circuits, light bulbs and discover the rules current follows.',
  subject: 'Physics',
  level: 'Foundations',
  grades: [9, 11],
  skills: ['phys.circuits', 'eng.circuit-design'],
  summary: 'Wire up batteries, bulbs, switches and resistors on a live circuit board. Every current and voltage is computed as you build, so you can test ideas the way an engineer does — and find out why your home is wired the way it is.',
  outcomes: [
    'Explain why current needs a complete loop',
    'Spot and avoid short circuits',
    'Predict how bulbs behave in series and in parallel',
    'Use Ohm\'s law, V = IR, to calculate current, voltage and resistance',
  ],
  prerequisites: ['Multiplying and dividing decimals'],
  illustration: 'circuit',
  color: '#b45309',
  featured: true,
  chapters: [
    {
      id: 'current-and-circuits',
      title: 'Current and circuits',
      summary: 'Loops, switches, series and parallel, and the law that ties them together.',
      lessons: [
        {
          id: 'complete-the-loop',
          title: 'What makes a bulb light?',
          summary: 'Discover that current only flows around a complete loop — and what happens when it finds a shortcut.',
          objectives: ['Build a complete circuit that lights a bulb', 'Use a switch to open and close a circuit', 'Recognise a short circuit'],
          concepts: ['closed-circuit', 'short-circuit'],
          estimatedMinutes: 12,
          steps: [
            {
              id: 'hook', type: 'narrative', stage: 'motivate', title: 'A torch in the dark',
              body: 'Press the button on a torch (a flashlight) and light appears instantly. Inside there is only a battery, a bulb, some metal strips and a switch.\n\nWhat does the switch actually do? Let\'s build one and find out.',
            },
            {
              id: 'predict', type: 'question', stage: 'predict', title: 'One wire',
              body: 'A wire joins the **+** end of a battery to a bulb. Nothing is connected to the **−** end of the battery.',
              question: {
                kind: 'choice', prompt: 'Does the bulb light?',
                options: [
                  { id: 'yes', text: 'Yes — current flows out of the + end into the bulb', misconception: 'current-one-way-to-load', feedback: 'Many people expect that. Let\'s test it.' },
                  { id: 'dim', text: 'Only dimly', misconception: 'current-one-way-to-load', feedback: 'Let\'s test it.' },
                  { id: 'no', text: 'No — there has to be a path back to the battery', correct: true, feedback: 'Let\'s check your hunch.' },
                ],
                concepts: ['closed-circuit'],
              },
            },
            {
              id: 'loop', type: 'interactive', stage: 'explore', title: 'Complete the loop',
              body: 'Tap a dashed gap to put a wire in it (tap again to take it out). Watch the bulb, and the moving dots that show the current.',
              interactive: { ...completeTheLoop, goal: 'Fill only gap 1 first: that is the one-wire setup from your prediction. Does the bulb light? How many gaps must you fill before it does?' },
            },
            {
              id: 'explain-loop', type: 'narrative', stage: 'explain', title: 'Current goes round, not out',
              body: 'The bulb only lit once **every** gap was filled. Current is a flow of charge, and it has to travel **all the way round**: out of the battery, through the bulb and back into the battery. That complete path is called a **closed circuit**.\n\nLeave one gap and the whole circuit is **open**: no current flows anywhere, not even in the wires that are connected.\n\nThe dots move from **+** round to **−**. This direction is called *conventional current*. (The electrons in the wire actually drift the other way, but every circuit rule works the same.)',
            },
            {
              id: 'switch', type: 'question', stage: 'practice', title: 'Add a switch',
              body: 'A switch is a gap you can open and close. Tap it to flip it.',
              interactive: switchBoard,
              question: {
                kind: 'circuit', prompt: 'Make bulb A light.',
                goals: [{ part: 'A', metric: 'lit', value: 1 }],
                hints: ['Is there still a gap anywhere in the loop?', 'A switch only lets current through when it is closed.'],
                successFeedback: 'A closed switch completes the loop. Opening it breaks the circuit, which is exactly what a torch button does.',
                explanation: 'The gap needs a wire **and** the switch needs to be closed, so the loop is complete.',
                concepts: ['closed-circuit'],
              },
            },
            {
              id: 'trap', type: 'question', stage: 'challenge', title: 'Not every gap',
              body: 'This board has an extra gap underneath the bulb.',
              interactive: trapBoard,
              question: {
                kind: 'circuit', prompt: 'Light bulb A.',
                goals: [{ part: 'A', metric: 'lit', value: 1 }],
                hints: ['Follow the path from + to − with your finger. Does the current have to go through the bulb?', 'A wire in gap 2 gives the current a route that skips the bulb.'],
                successFeedback: 'Gap 2 had to stay empty. A wire there would let the current skip the bulb.',
                explanation: 'Fill gaps 1 and 3 and leave gap 2 empty. A wire in gap 2 joins both ends of the bulb, so the current takes that path instead: a short circuit.',
                concepts: ['short-circuit', 'closed-circuit'],
              },
            },
            {
              id: 'predict-bypass', type: 'question', stage: 'predict', title: 'A switch under the bulb',
              body: 'On the next board, bulb A is lit and a wire with a switch runs underneath it, from one end of the bulb to the other.',
              question: {
                kind: 'choice', prompt: 'You close the switch. What happens to bulb A?',
                options: [
                  { id: 'brighter', text: 'It gets brighter', misconception: 'more-wire-more-current', feedback: 'Let\'s test it.' },
                  { id: 'same', text: 'It stays the same', misconception: 'short-circuit-shares-current', feedback: 'Let\'s test it.' },
                  { id: 'dimmer', text: 'It gets dimmer but stays lit', misconception: 'short-circuit-shares-current', feedback: 'Let\'s test it.' },
                  { id: 'dark', text: 'It goes dark', correct: true, feedback: 'Let\'s check your hunch.' },
                ],
                concepts: ['short-circuit'],
              },
            },
            {
              id: 'bypass', type: 'interactive', stage: 'explore', title: 'Watch a short circuit',
              body: 'Here the gap under the bulb is a switch. Close it and watch the bulb and the dots.',
              interactive: { ...bypassBoard, goal: 'Close the switch, then open it again.' },
            },
            {
              id: 'explain-short', type: 'narrative', stage: 'explain', title: 'Why short circuits are dangerous',
              body: 'With the switch closed, current has a path made of wire alone. Wire has almost no resistance, so nearly all the current takes that path and **the bulb goes dark**.\n\nWith nothing to hold it back, the current becomes very large: look at the battery\'s reading, about 30 A instead of 0.5 A. A real battery gets hot and drains fast, and in a house the wires could overheat. That is why homes have **fuses** and **circuit breakers**, which cut the power when the current gets too big.',
            },
            {
              id: 'check', type: 'question', stage: 'assess', title: 'Mastery check',
              body: 'A bulb is wired to a battery in a complete loop and is shining. Then someone connects an extra wire directly from one end of the bulb to its other end.',
              question: {
                kind: 'choice', prompt: 'What happens?',
                options: [
                  { id: 'out', text: 'The bulb goes out, and a large current flows through the extra wire', correct: true },
                  { id: 'brighter', text: 'The bulb gets brighter because there is more wire', misconception: 'more-wire-more-current' },
                  { id: 'same', text: 'Nothing changes; the bulb still gets its share of current', misconception: 'short-circuit-shares-current' },
                  { id: 'half', text: 'The bulb glows at half brightness', misconception: 'short-circuit-shares-current' },
                ],
                explanation: 'The extra wire is a path with almost no resistance, so the current goes round it instead of through the bulb: a short circuit.',
                concepts: ['short-circuit'],
              },
            },
          ],
        },
        {
          id: 'series-and-parallel',
          title: 'Series and parallel',
          summary: 'Add a second bulb in two different ways and find out why your home is wired in parallel.',
          objectives: ['Predict brightness and current for bulbs in series', 'Build a parallel circuit', 'Explain why currents add in parallel'],
          concepts: ['series-circuits', 'parallel-circuits'],
          estimatedMinutes: 15,
          steps: [
            {
              id: 'hook', type: 'narrative', stage: 'motivate', title: 'One broken bulb',
              body: 'In some strings of fairy lights (string lights), one broken bulb makes the **whole string** go dark. In others, the rest keep shining.\n\nThe bulbs are the same. The difference is how they are connected.',
            },
            {
              id: 'predict', type: 'question', stage: 'predict', title: 'A second bulb',
              body: 'Bulb A shines on its own in a loop with a battery. You add an identical bulb B **in the same loop**, one after the other.',
              question: {
                kind: 'choice', prompt: 'What happens to bulb A?',
                options: [
                  { id: 'same', text: 'It stays just as bright: the battery gives each bulb the same current', misconception: 'battery-constant-current', feedback: 'Let\'s test it.' },
                  { id: 'dimmer', text: 'It gets dimmer', correct: true, feedback: 'Let\'s check your hunch.' },
                  { id: 'brighter', text: 'It gets brighter', misconception: 'more-bulbs-more-light', feedback: 'Let\'s test it.' },
                  { id: 'off', text: 'It goes out', misconception: 'series-bulb-blocks-current', feedback: 'Let\'s test it.' },
                ],
                concepts: ['series-circuits'],
              },
            },
            {
              id: 'series-lab', type: 'interactive', stage: 'explore', title: 'One bulb or two?',
              body: 'Tap the gap to cycle through a wire, bulb B and an empty gap. Compare bulb A\'s brightness and the meter readings below the board.',
              interactive: { ...seriesBoard(0), goal: 'Add bulb B and watch A. Then tap again to leave an empty gap, like a broken bulb. What happens to A?' },
            },
            {
              id: 'series-current', type: 'question', stage: 'practice', title: 'Is current used up?',
              body: 'Both bulbs are in the loop now. Look at the meter readings under the board.',
              interactive: seriesBoard(1),
              question: {
                kind: 'choice', prompt: 'Compare the current through bulb B with the current through bulb A.',
                options: [
                  { id: 'less', text: 'Less flows through B, because bulb A uses some of it up', misconception: 'current-consumed', feedback: 'The meters show the same current in both. Charge isn\'t used up: it carries energy round and returns to the battery.' },
                  { id: 'same', text: 'The same current flows through both', correct: true, feedback: 'Right: 0.25 A through each. In a single loop, every part carries the same current.' },
                  { id: 'more', text: 'More flows through B', misconception: 'current-consumed', feedback: 'The meters show the same current in both.' },
                ],
                hints: ['Read the current for bulb A and for bulb B under the board.'],
                explanation: 'Both meters read 0.25 A. Charge isn\'t used up in a bulb: the same current flows all the way round the loop.',
                concepts: ['series-circuits'],
              },
            },
            {
              id: 'explain-series', type: 'narrative', stage: 'explain', title: 'In series, current has one path',
              body: 'Bulbs one after another are **in series**. There is only one path, so:\n\n- the **same current** flows through every part,\n- each bulb holds the current back (it has **resistance**), and in series these add up, so two bulbs halve the current from 0.5 A to 0.25 A,\n- the battery\'s 3 V is **shared**: 1.5 V across each bulb.\n\nWith half the current and half the voltage, each bulb gets only a quarter of the energy each second, so it glows much more dimly. And if one bulb breaks, the single path is broken and **every** bulb goes out.',
            },
            {
              id: 'parallel', type: 'question', stage: 'challenge', title: 'Two bright bulbs',
              body: 'Bulb A is on the right. The two gaps in the middle make a second path from the top wire to the bottom wire.',
              interactive: parallelBoard,
              question: {
                kind: 'circuit', prompt: 'Add one bulb so that **two** bulbs light up, both at **full** brightness.',
                goals: [
                  { metric: 'litBulbs', op: 'gte', value: 2, message: 'Only bulb A is lit. The middle path has a gap, so no current flows through it.' },
                  { metric: 'litBulbs', op: 'lte', value: 2, message: 'Three bulbs are lit, but the two in the middle are dim: they share one path and its 3 V. Give one bulb a path of its own.' },
                ],
                hints: ['The middle column is a second path from the top wire to the bottom wire. Current only uses it if it has no gaps.', 'Two bulbs on the same path share the voltage. Put a bulb in one middle gap and a wire in the other.'],
                successFeedback: 'Both bulbs shine at full brightness, because each one is connected straight across the battery.',
                explanation: 'Put a bulb in one middle gap and a wire in the other. Each bulb then has its own path across the full 3 V. Two wires would make a short circuit.',
                concepts: ['parallel-circuits'],
              },
            },
            {
              id: 'explain-parallel', type: 'narrative', stage: 'explain', title: 'In parallel, each branch gets the full voltage',
              body: 'Bulbs on separate paths are **in parallel**. Each branch is connected straight across the battery, so:\n\n- every branch gets the **full 3 V**, and each bulb shines as brightly as it would on its own,\n- the branch currents **add up**: $0.5 + 0.5 = 1$ A from the battery (look at the battery\'s reading),\n- if one branch breaks, the others keep working.\n\nThat is why the power sockets (outlets) in a home are wired in parallel. The price: the battery delivers twice the current, so it runs down twice as fast.',
            },
            {
              id: 'fairy-lights', type: 'question', stage: 'transfer', title: 'Back to the fairy lights',
              body: 'One bulb in a string of lights breaks and leaves a gap. **Every** bulb in the string goes dark.',
              question: {
                kind: 'choice', prompt: 'How are the bulbs connected?',
                options: [
                  { id: 'series', text: 'In series', correct: true, feedback: 'Right: one path, so one gap stops the current everywhere.' },
                  { id: 'parallel', text: 'In parallel', misconception: 'parallel-single-path', feedback: 'In parallel, the other branches would still have their own path to the battery.' },
                ],
                concepts: ['series-circuits', 'parallel-circuits'],
              },
            },
            {
              id: 'check', type: 'question', stage: 'assess', title: 'Mastery check',
              body: 'On its own, a bulb connected to a 3 V battery carries 0.5 A. Two of these bulbs are connected in parallel across the same battery.',
              question: {
                kind: 'numeric', prompt: 'What total current does the battery deliver?', answer: 1, tolerance: 0.01, unit: 'A',
                explanation: 'Each bulb gets the full 3 V, so each carries the same 0.5 A it would on its own. The battery delivers the sum: 1 A.',
                concepts: ['parallel-circuits'],
              },
            },
          ],
        },
        {
          id: 'ohms-law',
          title: 'Ohm\'s law',
          summary: 'Find the rule that links voltage, current and resistance, and use it to design a circuit.',
          objectives: ['Describe how current depends on voltage and resistance', 'Calculate current, voltage or resistance with V = IR', 'Choose resistors to get a target current'],
          concepts: ['ohms-law'],
          estimatedMinutes: 15,
          steps: [
            {
              id: 'hook', type: 'narrative', stage: 'motivate', title: 'Push and hold back',
              body: 'A battery\'s **voltage** is how hard it pushes charge around a circuit. A **resistor** holds the current back, and its **resistance** is measured in ohms (Ω).\n\nSo how much current do you get from a given push against a given resistance? Engineers need the exact answer, so let\'s find it.',
            },
            {
              id: 'predict', type: 'question', stage: 'predict', title: 'Double the push',
              body: 'A battery drives a current through a resistor. You swap in a battery with **twice** the voltage and keep the same resistor.',
              question: {
                kind: 'choice', prompt: 'What happens to the current?',
                options: [
                  { id: 'same', text: 'It stays the same', misconception: 'battery-constant-current', feedback: 'Let\'s test it.' },
                  { id: 'double', text: 'It doubles', correct: true, feedback: 'Let\'s check your hunch.' },
                  { id: 'half', text: 'It halves', misconception: 'current-inverse-voltage', feedback: 'Let\'s test it.' },
                  { id: 'four', text: 'It becomes four times as big', feedback: 'Let\'s test it.' },
                ],
                concepts: ['ohms-law'],
              },
            },
            {
              id: 'predict-r', type: 'question', stage: 'predict', title: 'Double the hold-back',
              body: 'This time you keep the battery and swap in a resistor with **twice** the resistance.',
              question: {
                kind: 'choice', prompt: 'What happens to the current?',
                options: [
                  { id: 'same', text: 'It stays the same', misconception: 'battery-constant-current', feedback: 'Let\'s test it.' },
                  { id: 'double', text: 'It doubles', misconception: 'resistance-increases-current', feedback: 'Let\'s test it.' },
                  { id: 'half', text: 'It halves', correct: true, feedback: 'Let\'s check your hunch.' },
                ],
                concepts: ['ohms-law'],
              },
            },
            {
              id: 'lab', type: 'interactive', stage: 'explore', title: 'The Ohm\'s law lab',
              body: 'Use the sliders to change the battery voltage and the resistance. Read the current from the meter.',
              interactive: { ...ohmLab, goal: 'Double the voltage, then double the resistance. What happens to the current each time?' },
            },
            {
              id: 'explain', type: 'narrative', stage: 'explain', title: 'Ohm\'s law',
              body: 'Doubling the voltage doubled the current, and doubling the resistance halved it. The current is the voltage divided by the resistance:\n\n$$ I = \\frac{V}{R} \\qquad\\text{or, rearranged,}\\qquad V = I R $$\n\nVoltage $V$ is in volts (V), current $I$ in amperes (A) and resistance $R$ in ohms (Ω). For example, 6 V across 4 Ω gives $6 / 4 = 1.5$ A.\n\nThis rule is **Ohm\'s law**. It holds for resistors, and (in this simplified model) for bulbs too.',
            },
            {
              id: 'calc', type: 'question', stage: 'practice', title: 'Calculate it',
              body: 'The meter is switched off this time, so you\'ll have to work it out.',
              interactive: ohmFixed,
              question: {
                kind: 'numeric', prompt: 'A 6 V battery is connected to a 3 Ω resistor. What current flows?', answer: 2, tolerance: 0.001, unit: 'A',
                hints: ['Use $I = V / R$.', '$I = 6 / 3$'],
                explanation: '$I = \\dfrac{6\\text{ V}}{3\\ \\Omega} = 2$ A.',
                concepts: ['ohms-law'],
              },
            },
            {
              id: 'design', type: 'question', stage: 'challenge', title: 'Design for a target',
              body: 'A 6 V heater pad must draw exactly **0.5 A**. Tap the gap to choose its heating element. The meter is off, so work it out first.',
              interactive: pickResistor,
              question: {
                kind: 'circuit', prompt: 'Choose the resistor that makes the current exactly 0.5 A.',
                goals: [{ part: 'R', metric: 'current', value: 0.5 }],
                hints: ['Rearrange Ohm\'s law: $R = V / I$.', '$6 / 0.5 = $ ?'],
                successFeedback: '$R = 6 / 0.5 = 12\\ \\Omega$. Engineers pick resistors with exactly this calculation.',
                explanation: '$R = \\dfrac{V}{I} = \\dfrac{6}{0.5} = 12\\ \\Omega$.',
                concepts: ['ohms-law'],
              },
            },
            {
              id: 'two', type: 'question', stage: 'challenge', title: 'Two resistors',
              body: 'Now there are two gaps in series. Each can hold a 2 Ω, 4 Ω or 6 Ω resistor. The meter is off again.',
              interactive: twoResistors,
              question: {
                kind: 'circuit', prompt: 'Make the battery deliver exactly **0.75 A**.',
                goals: [{ metric: 'totalCurrent', value: 0.75 }],
                hints: ['What total resistance gives 0.75 A from 6 V?', '$R = 6 / 0.75 = 8\\ \\Omega$, and resistances in series add up.'],
                successFeedback: 'Any pair that adds up to 8 Ω works: 2 + 6, 6 + 2 or 4 + 4.',
                explanation: 'You need $R = 6 / 0.75 = 8\\ \\Omega$ in total. In series resistances add, so 2 Ω + 6 Ω or 4 Ω + 4 Ω both work.',
                concepts: ['ohms-law', 'series-circuits'],
              },
            },
            {
              id: 'headlight', type: 'question', stage: 'transfer', title: 'A car headlight',
              body: 'A car headlight has a resistance of 3 Ω and draws 4 A from the car\'s battery.',
              question: {
                kind: 'numeric', prompt: 'What voltage does the battery supply?', answer: 12, tolerance: 0.001, unit: 'V',
                hints: ['Use $V = I R$.', '$V = 4 \\times 3$'],
                explanation: '$V = I R = 4\\ \\text{A} \\times 3\\ \\Omega = 12$ V.',
                concepts: ['ohms-law'],
              },
            },
            {
              id: 'check', type: 'question', stage: 'assess', title: 'Mastery check',
              body: 'A 9 V battery drives a current of 0.5 A through a resistor.',
              question: {
                kind: 'numeric', prompt: 'What is the resistance?', answer: 18, tolerance: 0.001, unit: 'Ω',
                explanation: '$R = \\dfrac{V}{I} = \\dfrac{9}{0.5} = 18\\ \\Omega$.',
                concepts: ['ohms-law'],
              },
            },
          ],
        },
      ],
    },
    {
      id: 'power-and-energy',
      title: 'Power and energy',
      summary: 'Why bulbs get hot, what an electricity bill measures, and how fuses keep you safe.',
      status: 'planned',
      plannedLessons: ['Why do bulbs get hot?', 'Paying for electricity', 'Fuses and safe circuits'],
    },
  ],
};
