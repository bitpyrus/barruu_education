# The Barruu mathematics curriculum

The plan is data in [`packages/curriculum/src/math.ts`](../packages/curriculum/src/math.ts) and is tested. The research
behind it, with sources, is in [`docs/research/world-class-math-curriculum.md`](research/world-class-math-curriculum.md).
This page covers the decisions and the build order. The data file has every chapter.

## Principles (from the research)
1. **One coherent skill graph instead of one national syllabus.**
   - Every course chapter is one skill, with prerequisites and a typical US grade.
   - The graph is validated as a DAG: prerequisites are never taught later than the skills that need them.
   - National syllabi are *views* of the graph through versioned alignment tags (ADR 0008).
2. **Structure like Singapore and Japan.** A few strands, revisited with more depth each year, in strict prerequisite
   order (focus, rigor and coherence).
3. **Scope like England, Singapore and Cambridge.**
   - Learners get 2D vectors, the sine and cosine rules, set notation, iteration and first differentiation by age 15–16.
   - Common Core marks these optional or leaves them out.
   - We keep Common Core's strengths: statistics from grade 6, and modelling as a cross-cutting practice.
4. **The grade-8 hinge first.** Functions, irrationals, exponents, linear systems, transformations and Pythagoras all
   converge there.
5. **Covariation before calculus.** Validated calculus-readiness instruments are mostly about how quantities change
   together. V5 *Rates of change* is a deliberate precalculus bridge.

## Strands and courses
Strands: **N** number and proportion · **A** algebra and functions · **G** geometry, trigonometry and vectors ·
**D** data, probability and statistics · **C** calculus · **P** logic, proof and discrete maths · **L** linear algebra.

| Band | Courses |
|---|---|
| Foundations (gr 6–7) | F1 Numbers on the line · F2 Ratio, rate and proportion · F3 Expressions and equations · F4 Shape and measure (*Mathematical Thinking*) · F5 Data and chance |
| Hinge (gr 8–9) | H1 Linear relationships and the function idea · H2 Powers, roots and real numbers · H3 Systems and inequalities · H4 Transformations, congruence and proof · H5 Similarity, Pythagoras and right-triangle trig |
| Core (gr 9–10) | K1 Quadratics and polynomials · K2 Probability · K3 Statistics · K4 Coordinate geometry and 2D vectors |
| Advanced (gr 10–12) | V1 Function toolkit · V2 Exponentials and logarithms · V3 Circular functions · V4 Sequences and series · V5 Rates of change · V6 Statistical inference · V7 Logic and proof |
| University yr 1 | U1 Calculus I · U2 Calculus II · U3 Series, parametric and polar · U4 Linear algebra (linear maps first) · U5 Discrete maths · U6 Complex numbers and matrices |

That is 27 courses and 137 chapter skills. Each course has 3–7 chapters of 3–5 short lessons.

Further decisions:
- **Mechanics stays in physics**, cross-tagged rather than duplicated.
- **A statistics path runs alongside calculus.**
- **"Get ready" bridges** (short prerequisite refreshers) will be generated from the graph, not written by hand.

## Interactives (ranked by reach)
Available now: grid board, function explorer, pendulum lab and circuit builder.

Planned, in this order:
1. number line
2. balance scale → algebra tiles
3. linked function lab (table ↔ graph ↔ equation, "drive the graph", secant/tangent, Riemann sums)
4. transformation and construction board
5. probability simulator
6. vector and matrix board (shared with physics forces)
7. unit circle ↔ sinusoid
8. data plotter
9. proof builder
10. graph/network board

Each needs a deterministic checker in the engine. `MATH_INTERACTIVES` in `math.ts` tracks their status.

## Lesson design rules
These map onto the stages in docs/CONTENT_AND_LESSONS.md.
- **Try first, from about grade 8.** A real "try it before we explain" problem for conceptual lessons. Lead with the
  explanation for younger learners and for pure skills; the effect reverses for grades 2–5.
- **Concreteness fading with named steps:** tiles → tiles beside symbols → symbols.
- **Worked examples, then broken ones.** Show correct solved problems, then incorrect ones to diagnose. Fade the worked
  examples as the learner model's mastery estimate rises (expertise reversal).
- **A solo "compare solutions" synthesis.** Two or three contrasting solutions, one of them flawed, with a menu-based
  self-explanation. This replaces the teacher-led discussion a classroom would have.
- **Interleaved, spaced practice.** No two consecutive review items share a strategy. Top mastery is awarded only on
  mixed, delayed checks.
- **Step-level, informative hints:** principle → partial step → bottom-out step.
- **Misconception-tagged distractors.**
  - Every distractor names an entry in `packages/curriculum/src/misconceptions.ts`; a test enforces this.
  - Entries are marked `research` (cited), `classic` (citation pending) or `authored`.
  - Judge error-analysis items on delayed checks, not on how much learners enjoy them.

## Placement (planned)
- **Stage 1:** the existing Rasch/EAP test, extended down to grade 6, picks a coarse band.
- **Stage 2:** a knowledge-space search on the skill graph.
  - Ask the skill whose mastery is closest to 0.5.
  - A correct answer raises the probability of its ancestors; a wrong answer lowers that of its descendants.
  - Explicit slip and guess rates.
  - About 20–30 items. This cap is a design choice, to be tuned.
  - Output: the "ready to learn" fringe. It seeds the learner model.
- **Calculus gateway:** covariation items, plus one held-out item per test to check calibration.

## Build order
0. **Infrastructure.**
   - ✅ Math skill graph, course plan, alignment tags, misconception catalogue, lesson concepts mapped to skills.
   - Still to do: key translation paths by id, seed the learner model from placement, extend placement items to grade 6.
1. **The hinge.**
   - Number line, then F1 *Numbers on the line*.
   - Balance/tiles, then F3 *Expressions and equations*.
   - Function lab, then H1 *Linear relationships*.
2. **Geometry spine.** Extend *Mathematical Thinking* (F4). Transformation board for H4/H5. Vector board with physics
   forces, so K4 ships early.
3. **Quadratics and data:** K1 (tiles), probability simulator and data plotter (F5, K2, K3).
4. **Advanced and calculus:** V1–V7 (unit circle, proof builder), then U1–U2.
5. **University:** U3–U6 and the generated "Get ready" bridges.

## Caveats
- Check these alignment codes before they are shown to learners (they are flagged `verified: false` in `FRAMEWORKS`):
  - Singapore 2020 syllabus details;
  - IB topic lists (new courses arrive for first assessment in 2029);
  - parts of Cambridge 9709.
- The Achieve the Core Coherence Map dataset names no licence. Confirm one before importing its edges.
- No study validates a whole prerequisite chain end to end. Edges are expert judgement until learner data can refine
  them.
