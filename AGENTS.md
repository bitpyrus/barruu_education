# AGENTS.md — instructions for every AI agent (and human) working on Barruu

## What Barruu is

**Barruu is an open-source alternative to Brilliant.org for science and engineering.** Learners in grades 9–12
(extensible down to middle school and up to university) learn mathematics, physics, chemistry, engineering and
computer science through short, interactive lessons where they **build, manipulate and experiment** — with instant,
deterministic feedback.

Like Brilliant, courses are organised by **subject and topic** with **US-style grade bands**, not by any one national
syllabus. Unlike Brilliant, Barruu is **multilingual**, **finds each learner's level automatically**, runs **locally
in the browser (and later on desktop), offline**, and will be **open source**.

## Status rules (read carefully)

- **The repository is private, and we develop as if it is not open source.** There is deliberately **no licence
  file**. Do not add one, do not change repository visibility, and do not publish code or packages. The owner will
  decide when and how to open-source. Prepare clean boundaries; don't perform a release.
- Branch off `main` for work; open a pull request. Don't push directly to `main`.

## Non-negotiables

1. **No code execution from content.** Lessons, AI output, imports and translations are data. Expressions go through
   `@barruu/engine`'s safe parser — never `eval`, `new Function` (ESLint enforces this).
2. **Correctness is deterministic.** Answers are checked by `@barruu/engine`, never by an AI model.
3. **AI is optional for learners.** Every lesson, hint, explanation and the placement test work with no network and no model.
4. **Engine purity.** `packages/engine`, `packages/curriculum` and `packages/i18n` have no DOM, React, `fetch` or
   storage globals (ESLint enforces this). Every runtime must get identical results from them.
5. **Every learner-visible string is translatable.** UI text goes through `t()`; course text is translated via
   overlays. Never hard-code English in components.
6. **Original content only.** No copied course material, illustrations or code from Brilliant or anyone else.
7. **Verify, don't claim.** Don't mark anything done, correct or compatible without a test or a recorded check.

## Repository map

```
packages/engine       learning engine: schema, safe expressions, assessment, geometry, registry, validation,
                      learner model (BKT), simulations, tutor contracts          (framework-free, tested)
packages/curriculum   grade 9–12 science & engineering skill map, placement item bank, adaptive placement (Rasch/EAP)
packages/i18n         locales, UI translator (plurals, RTL), content translation overlays + coverage
packages/content      built-in courses (validated data) + translation overlays
packages/ui           React renderers: interactives (grid board, function explorer, pendulum, sorting), markdown/KaTeX
apps/web              the learner web app (Vite + React + Tailwind)
scripts/              content-check, answer-key, e2e browser checks
docs/                 vision, architecture, curriculum & placement, i18n, content & lessons, AI, local/offline,
                      security, roadmap, STATE (current state + next task), ADRs
.claude/              shared Claude Code settings, slash commands and reviewer subagents
```

## Workflow (every task)

1. Read this file and **`docs/STATE.md`** (current state, known issues, next task).
2. Read the relevant doc in `docs/` and the code you'll touch. Check `docs/adr/` before changing architecture.
3. Make one complete, scoped change. Add or update tests with it.
4. Run **`npm run check`** (typecheck + lint + tests + content check) and `npm run build`. For UI changes, run the
   browser check: `npm run build && npm run preview` then `node scripts/e2e/web-check.cjs`.
5. Update `docs/STATE.md` (what changed, capability matrix, known issues, next task) and any doc you invalidated.
   Record significant decisions as a new ADR in `docs/adr/`.
6. Commit with a clear message; open a PR using the template.

## How-tos

| I want to… | Read / run |
|---|---|
| Add or edit a lesson | `docs/CONTENT_AND_LESSONS.md`, `/new-lesson`, then `npm run content:check` |
| Add an interactive kind | `docs/ARCHITECTURE.md` → "Adding an interactive", `/new-interactive` |
| Add a language or translate a course | `docs/I18N.md`, `/translate` |
| Add placement items or skills | `docs/CURRICULUM_AND_PLACEMENT.md`, `/add-placement-items` |
| Work on AI features | `docs/AI.md` |
| Hand off at the end of a session | `/handoff` |

## Review agents (`.claude/agents/`)

Use them before merging content or significant UI: `content-verifier` (recomputes every number, runs content
check), `pedagogy-reviewer` (lesson design principles), `translation-reviewer` (fidelity, placeholders, maths
untouched).
