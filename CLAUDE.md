# CLAUDE.md

@AGENTS.md

## Claude-specific notes

- Start every session by reading `docs/STATE.md` — it holds the current state and the **next task**.
- Shared slash commands live in `.claude/commands/` (`/check`, `/new-lesson`, `/new-interactive`, `/translate`,
  `/add-placement-items`, `/handoff`); reviewer subagents in `.claude/agents/`.
- Playwright + Chromium are usually pre-installed in cloud sessions; `scripts/e2e/*.cjs` run with plain `node`.
- Scripts run with `tsx` (`npx tsx scripts/...`) because packages are consumed as TypeScript source.
- Never add a licence file or change repository visibility (see AGENTS.md → Status rules).
- Keep `docs/STATE.md` current before you end a session; the next agent depends on it.
