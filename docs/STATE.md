# Current state · capabilities · known issues · next task

_Last updated: 2026-11-27 — branch `claude/localized-feedback-offline` (PR to `main`)._

## Snapshot
The foundation is in place:
- A monorepo with a pure learning engine, ported from `barruu_website` with its tests.
- A grade 9–12 science and engineering skill map, with an adaptive placement test ("Find your level").
- Multilingual support: English, plus Spanish and Arabic as machine drafts, including right-to-left layout.
  Translation is overlay-based.
- Four courses: the flagship *Mathematical Thinking* plus three previews.
- A web app with home, placement, catalog, course and lesson player pages, and a language switcher.
- AI-native development setup: `AGENTS.md`, slash commands, reviewer agents, ADRs, CI.
- Engine feedback, goal messages, sorting notes and interactive labels are localized in en, es and ar. The engine
  returns codes and params; the UI formats them.
- The app works offline after one visit: a service worker precaches the whole app (ADR 0006).

## Capability matrix
| Capability | State | Evidence |
|---|---|---|
| Engine: assessment, geometry/constructions, learner model, sims, tutor contracts | ✅ | `packages/engine/test`, `packages/content/test` |
| Content lint (solvable constructions, etc.) | ✅ | `npm run content:check`, catalog tests |
| Skill map valid (DAG, grade order) | ✅ | `curriculum.test.ts` |
| Adaptive placement | ✅ engine; ⚠ item difficulties estimated | simulation tests; `web-check.cjs` (weak → "Before grade 9", strong → "Beyond grade 12") |
| UI translations en/es/ar complete, plurals incl. Arabic | ✅ | `i18n.test.ts` |
| Engine feedback + interactive labels localized (codes + params) | ✅ | `engine.test.ts`, `i18n.test.ts`, `web-check.cjs` (Spanish goal feedback) |
| Course translation overlays (fallback, stale detection) | ✅ | `i18n.test.ts`, catalog translation test |
| Spanish course content | 🔶 Mathematical Thinking lesson 1 + course page (65/160 strings) | content:check |
| RTL layout (Arabic) | ✅ visually checked | `web-check.cjs` screenshots |
| Web app pages + lesson player + construction answers | ✅ | `web-check.cjs` |
| Local progress storage | ✅ localStorage via injected store | manual + player |
| Offline reload, deep links, progress (service worker, whole-app precache) | ✅ Chromium | `offline-check.cjs` (with negative control) |
| AI provider / tutor in app | ❌ | contracts only (engine) |
| Chemistry / engineering courses | ❌ | skills + placement items exist |
| Accessibility audit | ❌ | keyboard + ARIA basics in place |

## Baseline checks
- `npm run check`: typecheck ✅, lint ✅ (0 problems), tests ✅, content check ✅
- `npm run build`: ✅
- Browser: `node scripts/e2e/web-check.cjs` ✅ and `node scripts/e2e/offline-check.cjs` ✅ (against `npm run preview`)

## Known issues
1. Offline is verified in Chromium only. Firefox and Safari (and Safari's storage eviction) are untested. There
   is no install manifest, icons, or "available offline" indicator yet.
2. Placement item prompts aren't translatable yet.
3. Placement difficulties are expert estimates. Calibration is needed (docs/CURRICULUM_AND_PLACEMENT.md).
4. Lesson `concepts` (content) and curriculum `skills` are two separate vocabularies. Unify or map them so lesson
   evidence updates curriculum skills.
5. The placement result doesn't yet seed the learner model.
6. No bundled Arabic font. It falls back to system fonts, so rendering varies offline.
7. Each deploy re-downloads the whole app (~1.3 MB) on the next online visit. That's fine at today's size.
8. Lesson-player features from `barruu_website` not yet ported: My Learning "mistakes to revisit", the Library and
   `.bipy` import, and the homepage live challenge.

## Next task (do this next)
**Phase 1 content: the circuit builder and the *Electric Circuits* course.**
1. Add a `circuitBuilder` interactive (`/new-interactive`):
   - pure DC solver in `packages/engine/src/sim/circuit.ts` (nodal analysis for series and parallel resistors,
     batteries, bulbs and switches), with tests against hand-computed values;
   - React renderer in `packages/ui`, keyboard-operable, with every label through `useUiText()`;
   - goals checked by the engine (e.g. "current through R2 is 0.5 A").
2. Author *Electric Circuits* lessons 1–3 (`/new-lesson`), covering what current is, series vs parallel, and Ohm's
   law. Tag them with curriculum skills, run `content-verifier` and `pedagogy-reviewer`, and draft Spanish (`/translate`).
3. Then: placement item translations (known issue 2) and seeding the learner model from placement (known issue 5).

## Handoff notes
- Deploy: Cloudflare Workers via root `wrangler.jsonc` (static assets from `apps/web/dist`); see docs/LOCAL_AND_OFFLINE.md.
  Cloudflare Builds must point at this repo with production branch `main`. If builds stop seeing new commits,
  reconnect the GitHub integration in the Worker's Settings → Builds.
- Offline: `public/sw.js` is plain JS (linted with service-worker globals). Bump nothing by hand: the build id comes
  from the file hashes. To debug, use DevTools → Application → Service workers / Cache storage (`barruu-app-<id>`).
- Scripts use `tsx` (`npx tsx scripts/...`). Node can't run the extensionless TypeScript imports directly.
- `vite preview` serves on :4173 by default. The e2e script reads `BASE_URL`.
- GridBoard rectangles resize from their first authored point (the anchor).
- When you change English lesson text, the matching Spanish overlay entries become stale (content check warns).
  Update them, or let them fall back to English.
- React-hooks v7 lint flags setState in effects and ref writes during render. Use the derived-state pattern instead
  (see `PendulumLab.tsx` and `SortingLab.tsx`).
