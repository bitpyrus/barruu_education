# Current state · capabilities · known issues · next task

_Last updated: 2026-11-27 — branch `claude/foundation-setup` (PR to `main`)._

## Snapshot
The foundation is in place:
- A monorepo with a pure learning engine, ported from `barruu_website` with its tests.
- A grade 9–12 science and engineering skill map, with an adaptive placement test ("Find your level").
- Multilingual support: English, plus Spanish and Arabic as machine drafts, including right-to-left layout.
  Translation is overlay-based.
- Four courses: the flagship *Mathematical Thinking* plus three previews.
- A web app with home, placement, catalog, course and lesson player pages, and a language switcher.
- AI-native development setup: `AGENTS.md`, slash commands, reviewer agents, ADRs, CI.

## Capability matrix
| Capability | State | Evidence |
|---|---|---|
| Engine: assessment, geometry/constructions, learner model, sims, tutor contracts | ✅ | `packages/engine/test`, `packages/content/test` |
| Content lint (solvable constructions, etc.) | ✅ | `npm run content:check`, catalog tests |
| Skill map valid (DAG, grade order) | ✅ | `curriculum.test.ts` |
| Adaptive placement | ✅ engine; ⚠ item difficulties estimated | simulation tests; `web-check.cjs` (weak → "Before grade 9", strong → "Beyond grade 12") |
| UI translations en/es/ar complete, plurals incl. Arabic | ✅ | `i18n.test.ts` |
| Course translation overlays (fallback, stale detection) | ✅ | `i18n.test.ts`, catalog translation test |
| Spanish course content | 🔶 Mathematical Thinking lesson 1 + course page (65/160 strings) | content:check |
| RTL layout (Arabic) | ✅ visually checked | `web-check.cjs` screenshots |
| Web app pages + lesson player + construction answers | ✅ | `web-check.cjs` |
| Local progress storage | ✅ localStorage via injected store | manual + player |
| Offline reload (service worker) | ❌ not ported yet | — |
| AI provider / tutor in app | ❌ | contracts only (engine) |
| Chemistry / engineering courses | ❌ | skills + placement items exist |
| Accessibility audit | ❌ | keyboard + ARIA basics in place |

## Baseline checks
- `npm run check`: typecheck ✅, lint ✅ (0 problems), tests ✅, content check ✅
- `npm run build`: ✅
- Browser: `node scripts/e2e/web-check.cjs` ✅ (against `npm run preview`)

## Known issues
1. Engine feedback strings and interactive aria labels are English. Fix: have the engine return message codes and
   params, and localize them in the UI.
2. Placement item prompts aren't translatable yet.
3. Placement difficulties are expert estimates. Calibration is needed (docs/CURRICULUM_AND_PLACEMENT.md).
4. Lesson `concepts` (content) and curriculum `skills` are two separate vocabularies. Unify or map them so lesson
   evidence updates curriculum skills.
5. The placement result doesn't yet seed the learner model.
6. No bundled Arabic font. It falls back to system fonts, so rendering varies offline.
7. No service worker, so the app isn't available offline after a reload.
8. Lesson-player features from `barruu_website` not yet ported: My Learning "mistakes to revisit", the Library and
   `.bipy` import, and the homepage live challenge.

## Next task (do this next)
**Make feedback fully localized and port offline support.**
1. Change `checkAnswer` and `evaluateGoals` to return `{ code, params }` alongside today's English `feedback`.
   Localize those codes in the UI via new message keys in all three catalogs, and do the same for GridBoard aria
   labels. Add tests.
2. Port the offline PWA from `barruu_website`, adapting it to precache the whole app:
   - the offline manifest plugin, `public/sw.js` and `ignoreVary` handling;
   - an offline-reload browser test with a negative control.
3. Then start Phase 1 content: the circuit-builder interactive and the *Electric Circuits* course.

## Handoff notes
- Scripts use `tsx` (`npx tsx scripts/...`). Node can't run the extensionless TypeScript imports directly.
- `vite preview` serves on :4173 by default. The e2e script reads `BASE_URL`.
- GridBoard rectangles resize from their first authored point (the anchor).
- When you change English lesson text, the matching Spanish overlay entries become stale (content check warns).
  Update them, or let them fall back to English.
- React-hooks v7 lint flags setState in effects and ref writes during render. Use the derived-state pattern instead
  (see `PendulumLab.tsx` and `SortingLab.tsx`).
