---
description: Add placement items or curriculum skills
argument-hint: <subject or skill ids>
---
Extend the curriculum / placement bank for: $ARGUMENTS

1. Read `docs/CURRICULUM_AND_PLACEMENT.md`.
2. Skills (`packages/curriculum/src/skills.ts`): id `subject.topic`, typical US grade, prerequisites (must be
   taught at the same grade or earlier). `validateSkillGraph()` must stay empty.
3. Items (`packages/curriculum/src/items.ts`): deterministic numeric or choice questions with exactly one correct
   option; difficulty via the grade-relative `delta` (±0.4 ≈ half a grade); mark `calibration: 'estimated'`.
4. Add an independent recomputation for every formula-based answer in `packages/curriculum/test/`.
5. Keep at least 5 items per subject; run the simulation tests (`npx vitest run packages/curriculum`).
