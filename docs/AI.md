# AI — native to how we build, optional for how learners learn

## 1. AI-native development (how this repo is built)

This repository is designed so AI coding agents can do most of the work safely:

- **One source of truth for agents:** `AGENTS.md` (rules, map, workflow) + `docs/STATE.md` (current state, next
  task). `CLAUDE.md` imports `AGENTS.md`.
- **Machine-checkable quality gates:** `npm run check` = typecheck + lint + tests + content check. CI runs the same.
  Agents iterate until green instead of relying on judgement.
- **Guardrails as code:** ESLint bans `eval`/`new Function` everywhere and DOM/network/storage globals in pure
  packages; zod validates all content; `lintCourse` proves construction challenges are solvable; translation
  coverage detects stale strings; simulation tests check the placement engine statistically.
- **Shared workflows:** `.claude/commands/` (`/check`, `/new-lesson`, `/new-interactive`, `/translate`,
  `/add-placement-items`, `/handoff`).
- **Reviewer agents:** `.claude/agents/` — `content-verifier` (recomputes numbers), `pedagogy-reviewer`,
  `translation-reviewer`. Use them before merging content.
- **Decisions are recorded** in `docs/adr/` so agents don't re-litigate them.
- **Permissions:** `.claude/settings.json` pre-allows the routine checks and denies force-push, repo visibility
  changes and publishing.

## 2. AI features in the product (planned, in order)

### 2.1 Provider layer (`packages/ai`, not yet built)
A small interface so every AI feature works with any backend, chosen by the user/deployment:

```ts
interface AIProvider { id: string; chat(messages, opts): AsyncIterable<string>; available(): Promise<boolean> }
```

Backends: a hosted model via a server proxy (keys never in the client); **local models** — in-browser via WebGPU
(e.g. WebLLM / Transformers.js) and on desktop via a local runtime (e.g. Ollama). Local models are weaker,
especially in lower-resource languages, so features must degrade gracefully and the deterministic fallback
(below) always exists.

### 2.2 Optional tutor (port from `barruu_website`)
The engine already contains the tutor contracts (`buildTutorContext`, schema-validated stage-gated actions,
`offlineTutorReply`). The tutor sees the step, live interactive state, attempts, hints, mastery and gaps; it never
reveals answers in predict/assess steps; it can only act through validated actions; it answers in the learner's
language.

### 2.3 Translation drafting
`overlayTemplate()` → model drafts `text` for each entry (placeholders/LaTeX preserved, verified automatically) →
`status: machine-draft` → human review → `reviewed`.

### 2.4 Interactive course generation (for creators)
Plan → design (only registry-supported interactions) → generate `Lesson` JSON → **validation gate** (zod,
`lintLesson`, numeric recomputation, no remote assets, accessibility) → repair loop → human review → publish.
Provenance `ai` until reviewed. Generated courses never need a model to be played.

### 2.5 Placement & practice generation
Generate candidate placement items and practice variants; same validation; new items start `estimated` and enter
calibration.

## Rules
- No AI-generated code is executed. AI output is data, validated before use.
- Correctness is decided by the engine, not a model.
- Learner data sent to a model: lesson context only, no identity; opt-in for minors' data (SECURITY.md).
