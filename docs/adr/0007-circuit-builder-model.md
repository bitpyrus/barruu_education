# 0007 — Circuit builder: lattice edges, gap slots and an MNA solver

**Context.** Physics and engineering need a circuit builder whose readings are exact and whose challenges the
engine can check and prove solvable. Free-form wire drawing is hard to do well on touch screens and with a
keyboard. It also makes "is this challenge solvable?" an open-ended search.

**Decision.**

*Board.* A board is a small node lattice (at most 7×5). Each edge holds at most one part: wire, battery, bulb,
resistor or switch.

*What learners can change.* Authors place fixed parts and declare **gap slots**. Each slot has a short list of
allowed parts. Learners can only:
- cycle a gap through its options (tap or Enter),
- flip switches marked toggleable,
- move sliders the author declares, for a battery's voltage or a part's resistance.

*Solving.* `engine/sim/circuit.ts` solves the board with modified nodal analysis:
- Batteries are ideal voltage sources.
- Bulbs (6 Ω) and resistors are ohmic.
- Wires and closed switches are 1 µΩ resistors, so loops of wire and the current in every wire are well defined.
- A battery whose ends are joined by wire alone is reported as a **short circuit**. It gets a 0.1 Ω internal
  resistance, so its voltage collapses as a real battery's does. A bypassed bulb therefore goes dark, as it should.

*Answers.* A `circuit` question carries goals: per-part current, voltage, power, brightness or lit, and board-wide
`litBulbs` or `totalCurrent`. A short circuit never meets a goal. `validate.ts` enumerates every reachable board
(each slot and toggleable switch, capped at 50k) to prove a challenge is solvable and not already solved.

**Consequences.**
- Readings are deterministic and identical in every runtime.
- Content lint proves every circuit challenge solvable.
- Every interaction is a button, so it works by keyboard, touch and screen reader.
- Learners compose circuits from slots rather than drawing wires anywhere. A free-wiring mode can come later on the
  same solver.
- The models' simplifications are listed as assumptions in the UI: ideal batteries, ohmic bulbs, DC only.
