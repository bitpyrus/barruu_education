# Content model & lesson design

## Content model (`packages/engine/src/schema.ts`)

```
Course   { id, version, title, tagline, subject, grades, skills[], level, language, authors[], license,
           summary, outcomes[], prerequisites[], illustration, color, status, featured, provenance, chapters[] }
Chapter  { id, title, summary, status: available|planned, lessons[], plannedLessons[] }
Lesson   { id, title, summary, objectives[], concepts[], estimatedMinutes, provenance, steps[] }
Step     = narrative | interactive{spec} | question{question, spec?} | block{math}
Question = choice | numeric | expression | order | construction{goals[]}
```

Validated by zod at import; semantically linted by `lintCourse` (solvable constructions, starting board not
already solved, correct options present, permutations valid, assessments hint-free). Course `license` defaults to
"All rights reserved" until the owner decides content licensing.

## Lesson design principles

1. **Do, then explain.** Open with a prediction or manipulation; explanations are short and name what was just seen.
2. **The interaction carries the concept.** If an interactive could be removed without loss, redesign the step.
3. **Construction beats selection** where the concept allows (`kind: 'construction'`).
4. **Predict before revealing.** Predictions never lower mastery.
5. **Feedback describes the learner's actual answer**; wrong = "Not yet" (amber), never red.
6. **Progressive hints**; worked solution after two misses; assessments show no hints.
7. **Ramp difficulty**: warm-up → guided challenge → independent → transfer → check.
8. **Completion ≠ mastery**: mastery comes from weighted evidence.
9. **Everything checkable**: every number verified by a test.
10. **International & inclusive** examples (units in SI; currency-neutral where possible).

Stages: `motivate · predict · explore · explain · challenge · practice · reflect · transfer · assess`.

## Current catalogue

| Course | Subject | Grades | Lessons | Status |
|---|---|---|---|---|
| Mathematical Thinking | Mathematics | 8–9 | 3 (Area and shape) + 4 planned chapters | flagship |
| Functions You Can Touch | Mathematics | 9–10 | 1 | preview |
| Pendulums & Planets | Physics | 10–11 | 1 | preview |
| Algorithms in Motion | Computer Science | 9–11 | 1 | preview |

Gaps vs the vision: no chemistry or engineering courses yet; physics has one lesson. See ROADMAP.md.

## Authoring checklist
- [ ] Skills (curriculum) and concepts set; course `grades` set
- [ ] Opens with a prediction or manipulation; ≥ 1 construction/manipulation question where feasible
- [ ] Hints progressive; assessment hint-free
- [ ] `npm run content:check` and `npm test` pass; non-trivial maths has a test
- [ ] Played on desktop and 390px mobile; reviewed by `pedagogy-reviewer` and `content-verifier`
