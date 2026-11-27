# Barruu Education

**Learn science and engineering by doing.** Barruu is an interactive learning platform for grades 9–12 — an
open-source alternative to Brilliant.org (source release planned) — with:

- **Hands-on lessons**: build shapes, run simulations, step through algorithms; answers are checked exactly.
- **Automatic level detection**: a short adaptive quiz places each learner on a grade 9–12 skill map.
- **Multiple languages**: every UI string and course is translatable; right-to-left scripts supported.
- **Local-first**: runs in the browser, progress stays on the device, works offline (desktop app planned).
- **AI-assisted, never AI-dependent**: AI helps create and translate content and (optionally) tutor; learning works without it.

> **Status:** early development, private repository. No licence has been granted yet; the owner will choose one
> before any public release.

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
npm run check        # typecheck + lint + tests + content validation
npm run build && npm run preview   # production build on :4173
```

Requires Node 22+.

## Repository layout

| Path | What |
|---|---|
| `packages/engine` | Platform-independent learning engine (content schema, assessment, geometry, learner model, simulations) |
| `packages/curriculum` | Grade 9–12 science & engineering skill map and adaptive placement |
| `packages/i18n` | Translations (UI messages, course overlays, RTL) |
| `packages/content` | Built-in courses |
| `packages/ui` | React components for interactive activities |
| `apps/web` | The web app |
| `docs/` | Product and engineering documentation — start with [`docs/README.md`](docs/README.md) |

Contributors and AI agents: read [`AGENTS.md`](AGENTS.md) first.
