# Migration from `barruu_website`

`bitpyrus/barruu_website` (branch `barru_education` there) contains the previous implementation. This repo starts
clean and ports what was proven.

## Ported
| From (`barruu_website`) | To | Notes |
|---|---|---|
| `src/learn/engine/*`, `src/learn/sim/*` | `packages/engine/src` | Storage now injected (`configureStorage`); schema gains `grades`, `skills`, Engineering |
| `src/learn/tutor/{context,actions,prompt}.ts` | `packages/engine/src/tutor` | Pure parts only; client/provider to be rebuilt (AI.md) |
| `src/learn/content/*` | `packages/content/src` | Courses tagged with grades/skills |
| `src/learn/ui/interactives/*`, `Rich.tsx` | `packages/ui/src` | Markdown renderer re-implemented (stricter links); React 19 lint fixes |
| `src/learn/site/player/*` | `apps/web/src/player` | Localized; no tutor yet; math blocks only |
| Tests | `packages/*/test` | Split into engine (pure) and content (catalog) suites |

## Not yet ported (still valuable)
- **Offline**: `src/learn/offline/offline.ts`, `public/sw.js`, `offlineManifest()` Vite plugin, `scripts/e2e/offline-check.cjs`.
- **Site pages**: Library (local `.bipy` import), My Learning (mistakes to revisit, demonstrated skills).
- **Homepage live challenge** (build-a-rectangle).
- **`.bipy` format** (`services/bipy.ts`, `encryption.ts`, `database.ts`): needed for import/compatibility with the
  Flutter app. Note the v1 fixed-key encryption is obfuscation only.
- Docs worth reading: `docs/education/RESEARCH.md` (Brilliant/Khan/PhET/Kolibri research with sources).

## Deliberately left behind
The document editor (Barruu Create), Firebase, Stripe, marketplace, Cloudflare Worker routes — not part of this product's core.
