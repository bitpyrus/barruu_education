# Architecture

## Packages and boundaries

```
apps/web ──► @barruu/ui ──► @barruu/engine
   │            ▲
   ├──► @barruu/content ──► @barruu/engine, @barruu/i18n
   ├──► @barruu/curriculum ──► @barruu/engine
   └──► @barruu/i18n
```

| Package | Rules |
|---|---|
| `engine` | Pure TypeScript + zod. No DOM/React/network/storage globals (ESLint-enforced). Storage is injected (`configureStorage`). This is the reference implementation every runtime must match; its tests are the conformance suite. |
| `curriculum` | Pure. Skill map, item bank, placement. Depends only on `engine`. |
| `i18n` | Pure. Locales, translator, content overlays. |
| `content` | Data only (+ overlays). Must pass `npm run content:check`. |
| `ui` | React renderers. No business rules — logic lives in `engine`. |
| `apps/web` | Composition, routing, storage wiring, pages. |

Packages are consumed as **TypeScript source** through npm workspaces (`exports` → `src/index.ts`); Vite, Vitest
and `tsx` compile them. No build step per package. (ADR 0001.)

## Data flow in a lesson

1. `@barruu/content` provides a `Course` (validated at import). `localizedCourse(course, locale)` applies the
   translation overlay (ADR 0003).
2. The player walks `lesson.steps`. Interactives render via `InteractiveHost` → registry validates config → React component.
3. On "Check", the player builds an `Answer` (for constructions: the board's shapes) → `checkAnswer` (engine) →
   feedback. Evidence goes into the learner model (BKT) weighted by hints/attempts.
4. Progress and profile are saved through the injected key-value store (web: `localStorage`).

## Placement flow

`startPlacement` → `nextItem` (max information, subject balancing) → `answerItem` (engine grading) → … →
`isFinished` → `placementResult` (grade band, per-subject estimates, skill mastery seeds, recommended skills). See
`CURRICULUM_AND_PLACEMENT.md` and ADR 0004.

## Interaction primitives

| Primitive | Status | Where |
|---|---|---|
| Lattice board: resize rectangles, drag polygon corners, snapping, keyboard, unit-square tiles, live measures | ✅ | `ui/GridBoard`, engine `gridBoard` kind + `geometry.ts` goals |
| Parameter sliders + function plots + derivative | ✅ | `ui/FunctionExplorer` |
| Time-stepped simulation (pendulum, RK4) | ✅ | `ui/PendulumLab`, `engine/sim/pendulum` |
| Step-through algorithm traces | ✅ | `ui/SortingLab`, `engine/sim/sorting` |
| Choice / numeric / expression / ordering questions | ✅ | `apps/web/player/AnswerArea` |
| Circuit builder (series/parallel, Ohm's law) | ⬜ high priority for physics/engineering | — |
| Force/vector diagrams (free-body, vector addition) | ⬜ high priority | — |
| Projectile launcher with target | ⬜ | — |
| Molecule / stoichiometry balancer | ⬜ chemistry | — |
| Logic-gate builder | ⬜ CS | — |
| Sandboxed code runner | ⬜ needs isolated worker with limits (SECURITY.md) | — |

### Adding an interactive

1. **Engine:** zod config, `initialState`, `parameters`, `describeState` (plain words), `assumptions`,
   `exampleConfig` in `registry.ts`; simulation maths in `engine/src/sim/`. Unit tests.
2. **Answers:** if it can be an answer, add goal metrics + an `assessment.ts` branch + a solver in `validate.ts`
   so content lint proves solvability.
3. **UI:** component in `packages/ui/src/interactives/`, register in `InteractiveHost.tsx`. Pointer, touch and
   keyboard; aria labels; `onChange(next, event)`. Keep boards `direction: ltr` inside RTL pages.
4. A real lesson step uses it; browser check passes.

## Technology choices

TypeScript 5.9 · React 19 · Vite 8 · Tailwind CSS 4 · Vitest 5 · ESLint 10 (+ typescript-eslint, react-hooks) ·
zod 4 · KaTeX · Fontsource (bundled OFL fonts, offline). Node 22+. npm workspaces.

Planned: service-worker offline caching (port from `barruu_website`), SQLite/OPFS for larger local data, Tauri
desktop shell, AI provider layer (see AI.md).
