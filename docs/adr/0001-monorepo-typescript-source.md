# 0001 — npm-workspaces monorepo, packages consumed as TypeScript source

**Context.** We need a pure engine, curriculum, i18n, content and UI shared by a web app now and a desktop app later,
with minimal tooling friction for AI agents.

**Decision.** One repo, npm workspaces (`packages/*`, `apps/*`). Each package's `exports` points at `src/index.ts`;
Vite, Vitest and `tsx` compile on the fly. One root `tsconfig` with path aliases typechecks everything.

**Consequences.** No per-package build or publish step; instant cross-package changes; simple for agents. If packages
are ever published (open source), add a build (e.g. tsup) per package then.
