# Curriculum & automatic level detection

## Skill map (`packages/curriculum/src/skills.ts`)

- Subjects: Mathematics, Physics, Chemistry, Engineering, Computer Science.
- Each skill: `id` (`subject.topic`), title, subject, **typical US grade** (8 = before high school, 9–12, 13+ =
  university), prerequisites.
- Rules (tested by `validateSkillGraph`): prerequisites exist, no cycles, a prerequisite is never taught at a later
  grade than the skill.
- Courses declare `grades: [from, to]` and `skills: [...]`; the content check verifies the skills exist.
- Lesson-level `concepts` (finer-grained, in `packages/content`) and curriculum `skills` are separate for now; see
  STATE.md known issues for unification.

Extending to other grades = adding skills with grades outside 9–12 and courses tagged accordingly.

## Placement ("Find your level") (`packages/curriculum/src/placement.ts`)

**Model.** Rasch (1-parameter IRT): `P(correct) = 1 / (1 + e^-(θ − b))`, learner ability θ and item difficulty b
on the same logit scale, anchored to grade: `θ = (grade − 10.5) × 0.8` (grade 9 ≈ −1.2, grade 12 ≈ +1.2).

**Estimation.** EAP (posterior mean) on a grid from −4 to 4 with a normal prior centred on grade 10. Always
defined (even for all-correct runs), with a posterior SD used as the standard error.

**Item selection.** Maximum Fisher information `p(1−p)` at the current estimate, minus penalties that balance the
learner's chosen subjects and avoid repeating a skill. The first two items are deliberately a little easier.

**Stopping.** After 15 items, or after 8 items once SE ≤ 0.5. "I don't know yet" counts as incorrect evidence.

**Result.** Overall θ, SE, continuous grade and a band (before 9 / 9 / 10 / 11 / 12 / beyond 12); per-subject
estimates (shrunk towards the overall estimate when a subject has few answers); per-skill mastery seeds (logistic
on the subject estimate vs the skill's grade, overridden by direct evidence); recommended next skills (not yet known,
prerequisites known, easiest first). The web app maps those to courses.

**Evidence it works (simulation tests).** For simulated learners at grades 9, 10, 11 and 12 (150 runs each), the
mean absolute error is below 0.6 logits (≈ ¾ grade) and mean estimates are correctly ordered; stopping rules and
subject balancing are enforced. Browser check: a learner who skips everything places "Before grade 9", one who
answers correctly places "Beyond grade 12".

## ⚠ Calibration (important)

Item difficulties are **expert estimates** (`calibration: 'estimated'`): each item's `b` is its skill's grade
anchor plus a small hand-chosen delta. Real precision requires calibration from learner data:

1. Collect anonymous `(item, correct)` responses with consent (opt-in; minors' privacy — SECURITY.md).
2. Fit Rasch difficulties (joint or marginal maximum likelihood) once each item has ~200+ responses.
3. Check item fit (infit/outfit), retire misfitting items, mark refitted items `calibration: 'calibrated'`.
4. Re-run the simulation tests with the new difficulties.

Until then, present results as an estimate ("gets sharper as you learn") — the UI already does.

## Item bank rules

- Deterministic `numeric` or `choice` questions only (no AI judging), exactly one correct option.
- Formula-based answers have an independent recomputation in `packages/curriculum/test/`.
- ≥ 5 items per subject (tested); aim for ≥ 3 items per skill over time, spread in difficulty.
- Items are translatable like any content (overlay support for items: see STATE.md next steps).
