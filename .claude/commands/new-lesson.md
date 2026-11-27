---
description: Author a new interactive lesson (content as validated data)
argument-hint: <course-id> <lesson topic>
---
Create a new lesson for: $ARGUMENTS

1. Read `docs/CONTENT_AND_LESSONS.md` (principles + checklist) and an existing lesson in
   `packages/content/src/courses/` as a model.
2. Identify the curriculum skills it teaches (`packages/curriculum/src/skills.ts`) and the concepts
   (`packages/content/src/catalog.ts`). Add concepts if needed.
3. Design the step sequence first (stages, what the learner *does* in each step). Prefer construction or
   manipulation questions over multiple choice. Predictions first; explanations short; assessment without hints.
4. Write the lesson as data. Every number must be correct: compute it, and add a test in
   `packages/content/test/` for any non-trivial maths.
5. Run `npm run content:check` and `npm test` until clean (constructions must be solvable and not pre-solved).
6. Play it in the browser on desktop and a 390px-wide viewport.
7. Ask the `pedagogy-reviewer` and `content-verifier` agents to review; address findings.
8. Note in `docs/STATE.md` that new translation strings exist (translations become "missing" for other locales).
