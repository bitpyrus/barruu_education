# Current state · capabilities · known issues · next task

_Last updated: 2026-11-27 — branch `claude/circuits-course` (PR to `main`)._

## Snapshot
The foundation is in place:
- A monorepo with a pure learning engine, ported from `barruu_website` with its tests.
- A grade 9–12 science and engineering skill map, with an adaptive placement test ("Find your level").
- Multilingual support: English, plus Spanish and Arabic as machine drafts, including right-to-left layout.
  Translation is overlay-based.
- Five courses: the flagships *Mathematical Thinking* and *Electric Circuits*, plus three previews.
- A circuit builder (`circuitBoard`): exact DC solver, circuit goals as answers, short-circuit detection (ADR 0007).
- A web app with home, placement, catalog, course and lesson player pages, and a language switcher.
- AI-native development setup: `AGENTS.md`, slash commands, reviewer agents, ADRs, CI.
- Engine feedback, goal messages, sorting notes and interactive labels are localized in en, es and ar. The engine
  returns codes and params; the UI formats them.
- The app works offline after one visit: a service worker precaches the whole app (ADR 0006).

## Capability matrix
| Capability | State | Evidence |
|---|---|---|
| Engine: assessment, geometry/constructions, learner model, sims, tutor contracts | ✅ | `packages/engine/test`, `packages/content/test` |
| Content lint (solvable constructions and circuits, etc.) | ✅ | `npm run content:check`, catalog tests |
| Circuit builder: solver, goals, lint, renderer (keyboard + touch) | ✅ | `circuit.test.ts` (hand-computed values), `circuits.test.ts` (lesson physics), `web-check.cjs` |
| *Electric Circuits* chapter 1 (3 lessons) + Spanish draft | ✅ en · 🔶 es machine draft (185/185) | content:check, reviewer agents |
| Skill map valid (DAG, grade order) | ✅ | `curriculum.test.ts` |
| Adaptive placement | ✅ engine; ⚠ item difficulties estimated | simulation tests; `web-check.cjs` (weak → "Before grade 9", strong → "Beyond grade 12") |
| UI translations en/es/ar complete, plurals incl. Arabic | ✅ | `i18n.test.ts` |
| Engine feedback + interactive labels localized (codes + params) | ✅ | `engine.test.ts`, `i18n.test.ts`, `web-check.cjs` (Spanish goal feedback) |
| Course translation overlays (fallback, stale detection) | ✅ | `i18n.test.ts`, catalog translation test |
| Spanish course content | 🔶 Mathematical Thinking lesson 1 + course page (65/164); Electric Circuits complete (185/185) | content:check |
| RTL layout (Arabic) | ✅ visually checked | `web-check.cjs` screenshots |
| Web app pages + lesson player + construction answers | ✅ | `web-check.cjs` |
| Local progress storage | ✅ localStorage via injected store | manual + player |
| Offline reload, deep links, progress (service worker, whole-app precache) | ✅ Chromium | `offline-check.cjs` (with negative control) |
| AI provider / tutor in app | ❌ | contracts only (engine) |
| Chemistry / engineering courses | ❌ (Electric Circuits covers `eng.circuit-design` basics) | skills + placement items exist |
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
**Connect placement to learning, then the next interactive.**
1. Make placement items translatable (overlays like courses), and translate them to es/ar. Known issue 2.
2. Seed the learner model from the placement result (known issue 5), and map lesson `concepts` to curriculum
   `skills` (known issue 4). Then "Find your level" can recommend a starting lesson, for example *Electric Circuits*
   for learners who show `phys.circuits` gaps.
3. Next interactive: the force/vector diagram, for a *Forces & Motion* course (ROADMAP Phase 1).
4. Electric Circuits chapter 2 (*Power and energy*: P = VI, energy cost, fuses). The circuit board already reports
   power.

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
- Circuit boards: edge ids are `h:x,y` / `v:x,y` (x right, y down). A battery's `+` is end `a` (top/left) unless
  `positive: 'b'`. Bulbs are 6 Ω and reach full brightness at 1.5 W (3 V). Authors give learners **slots** (gaps
  with options) and toggleable switches; content lint enumerates every reachable board to prove a challenge solvable.
- React-hooks v7 lint flags setState in effects and ref writes during render. Use the derived-state pattern instead
  (see `PendulumLab.tsx` and `SortingLab.tsx`).
