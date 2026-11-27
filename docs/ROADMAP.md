# Roadmap

✅ done · 🔶 in progress · ⬜ next

## Phase 0 — Foundation (this PR)
✅ Monorepo, CI, lint guardrails · ✅ engine port + tests · ✅ i18n (UI, overlays, RTL) · ✅ grade 9–12 skill map +
adaptive placement · ✅ web app (home, placement, catalog, course, lesson player, language switcher) · ✅ AI-native
dev setup (AGENTS.md, commands, reviewer agents, ADRs)

## Phase 1 — A complete science & engineering starter path
- ⬜ **Offline PWA** (port service worker + verified offline test)
- ⬜ Engine feedback as message codes → fully localized feedback and aria labels
- ⬜ New interactives: **circuit builder**, **force/vector diagram**, **projectile launcher**
- ⬜ Courses: *Electric Circuits* (physics/engineering, grades 10–11), *Forces & Motion* (grades 10–11),
  *Moles & Reactions* (chemistry, grade 10); upgrade preview courses to the lesson standard
- ⬜ Placement: translate items; ≥ 3 items per skill; placement → learner-model seeding
- ⬜ Accessibility audit (keyboard, screen reader, contrast)

## Phase 2 — AI & languages
- ⬜ `packages/ai` provider layer (hosted proxy + local WebGPU/desktop)
- ⬜ Optional tutor (port, localized)
- ⬜ AI translation drafting workflow; first human-reviewed language (owner chooses)
- ⬜ AI course generation with validation gate + review UI

## Phase 3 — Local-first platform
- ⬜ IndexedDB/SQLite storage · ⬜ portable course packages (+ `.bipy` import) · ⬜ Tauri desktop app ·
  ⬜ optional sync

## Phase 4 — Calibration & personalization
- ⬜ Opt-in anonymous response collection → Rasch calibration → calibrated items
- ⬜ Spaced review, prerequisite remediation, adaptive practice

## Phase 5 — Open-source readiness (owner decision)
- ⬜ Licence choice (code and content) · security & licence audits · contribution guide · public release
