---
description: Add a new interactive kind (engine logic + React renderer)
argument-hint: <kind name> <what the learner manipulates>
---
Add an interactive: $ARGUMENTS

1. Read `docs/ARCHITECTURE.md` → "Adding an interactive". Build it because a real lesson needs it.
2. Engine (`packages/engine/src/registry.ts`, plus `sim/` for simulations): zod config schema, `initialState`,
   adjustable `parameters`, `describeState` (plain words — the tutor and screen readers use it), `assumptions` for
   simplified models, `exampleConfig`. Pure TypeScript, no DOM.
3. If learners can *answer* with it, add goal metrics and an assessment branch, and extend
   `findConstructionSolution` so content lint can prove challenges solvable.
4. Renderer in `packages/ui/src/interactives/`, registered in `InteractiveHost.tsx`: pointer, touch **and**
   keyboard; meaningful aria labels; report events via `onChange(next, event)`.
5. Unit tests for all logic; a lesson step using it; browser check.
6. Update `docs/ARCHITECTURE.md` (primitive table) and `docs/STATE.md`.
