# Current state · capabilities · known issues · next task

_Last updated: 2026-11-28 — branch `claude/comparing-fractions` (PR to `main`)._

## Snapshot
The foundation is in place:
- A monorepo with a pure learning engine, ported from `barruu_website` with its tests.
- A grade 9–12 science and engineering skill map, with an adaptive placement test ("Find your level").
- Multilingual support: English, plus Spanish and Arabic as machine drafts, including right-to-left layout.
  Translation is overlay-based.
- Six courses: *Numbers on the Line* (4 lessons: where fractions live; closer to 1; decimals; ordering), the flagships *Mathematical Thinking* and *Electric Circuits*, plus
  three previews.
- A number line interactive (`numberLine`): stacked lines, snapping points, fraction feedback, keyboard.
- A researched **mathematics curriculum** (docs/MATH_CURRICULUM.md, research in docs/research/): 27 courses and
  137 chapter skills, grade 6 to university year 1, with alignment tags, a misconception catalogue and a validated skill
  graph (ADR 0008).
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
| Number line: point goals, lint search, renderer (keyboard + touch), fraction feedback | ✅ | `numberLine.test.ts`, `web-check.cjs` |
| *Numbers on the Line* 4 lessons + Spanish draft | ✅ en · 🔶 es machine draft (239/239) | content:check, reviewer agents |
| Circuit builder: solver, goals, lint, renderer (keyboard + touch) | ✅ | `circuit.test.ts` (hand-computed values), `circuits.test.ts` (lesson physics), `web-check.cjs` |
| *Electric Circuits* chapter 1 (3 lessons) + Spanish draft | ✅ en · 🔶 es machine draft (185/185) | content:check, reviewer agents |
| Skill map valid (DAG, grade order) | ✅ incl. 137 math chapter skills (grades 6–14) | `curriculum.test.ts`, `math.test.ts` |
| Math curriculum plan (courses, chapters, alignment tags, interactives) | ✅ data; 🔶 alignment codes for Singapore/IB unverified | `math.test.ts` |
| Misconception catalogue; content tags + concept→skill mapping enforced | ✅ | `math.test.ts`, `catalog.test.ts` |
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
4. Lesson `concepts` now map to curriculum skills (`Concept.skill`), but the learner model still updates concepts only.
   Next: when a concept's evidence is recorded, also update its skill (or key the learner model by skill).
5. The placement result doesn't yet seed the learner model.
6. No bundled Arabic font. It falls back to system fonts, so rendering varies offline.
7. Each deploy re-downloads the whole app (~1.3 MB) on the next online visit. That's fine at today's size.
9. ~~Index-based overlay paths~~ fixed: paths use ids (`steps.#predict.body`); `migrateOverlayPaths` converted old
   files.
10. Electric Circuits: no Arabic course overlay yet (UI and feedback are translated); pedagogy-review suggestions
   still open: a transfer step for lesson 1, a stronger transfer step for lesson 2 (kitchen/house wiring).
8. Lesson-player features from `barruu_website` not yet ported: My Learning "mistakes to revisit", the Library and
   `.bipy` import, and the homepage live challenge.

## Next task (do this next)
**Phase 1 of the math plan continues (docs/MATH_CURRICULUM.md → Build order).**
1. Build **balance scale → algebra tiles** (`balanceTiles`): an equation as a balance whose state is checked as
   equivalent through `expr`, with the scaffold fading from tiles to symbols. Then F3 *Expressions and equations*,
   chapter 1 *What "=" means* (`equals-means-compute`).
2. Then F1 chapter 3, *Adding with a sense of size* (`add-tops-and-bottoms`). It reuses the number line with jumps.
3. Finish the rest of Phase 0:
   - seed the learner model from placement (known issue 5);
   - add grade 6–8 placement items.

Lesson style the owner asked for: **not verbose, interesting, like Brilliant**. That means:
- short screens, with the learner acting first;
- one- or two-line explanations;
- feedback written in the learner's own answer.

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
- Number line: goal values may be written as fractions (`'3/4'`) or decimals (`'0.25'`); `labels: 'decimals'` lines
  label tenths and show/feed back decimals. The lint search prunes each point by its own goals, so 4-point tasks stay fast.
- Number line: goal values may be written as fractions (`'3/4'`). Point values must sit on a tick (validated). Feedback
  writes values on the point's own line (2/4 stays 2/4).
- Math curriculum: add chapters and skills in `packages/curriculum/src/math.ts`, not in `skills.ts`. Within a course, a
  chapter may only depend on earlier chapters (tested). New distractor tags go in `misconceptions.ts`.
- React-hooks v7 lint flags setState in effects and ref writes during render. Use the derived-state pattern instead
  (see `PendulumLab.tsx` and `SortingLab.tsx`).
