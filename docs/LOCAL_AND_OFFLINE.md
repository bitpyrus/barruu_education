# Local-first & offline

## Today
- Everything runs in the browser; there is no server dependency for learning.
- Progress, learner profile, placement result and language choice are stored on the device (`localStorage`), via
  the engine's injected store (`configureStorage`).
- Fonts (Inter, Fraunces, KaTeX) are bundled — no CDN.
- **Offline after one visit** (ADR 0006): production builds register `apps/web/public/sw.js`, which precaches the
  whole app. The list comes from `offline-manifest.json`, which the build writes with each file's size and SHA-256.
  Every file is verified, and a build is cached only if every file arrives. Deep links, fonts and KaTeX work offline.
  Verified by `node scripts/e2e/offline-check.cjs` against `npm run preview`. The check runs a negative control
  first: a browser that never visited the site must fail to load it offline.
- Service-worker rules learned in `barruu_website`:
  - Write the manifest in `writeBundle`, not `generateBundle`, so hashes match the files on disk.
  - Cache lookups need `ignoreVary` because the server sends `Vary: Origin`.
  - Activate deletes only older `barruu-app-*` caches.

## Deployment (Cloudflare Workers, static assets)
`wrangler.jsonc` at the repo root deploys `apps/web/dist` as a static-assets Worker with single-page-app fallback.
Cloudflare build settings: build command `npm run build`, deploy command `npx wrangler deploy --config wrangler.jsonc`, both from the
repository root, production branch `main`. The Worker `name` in `wrangler.jsonc` must match the Worker's name in the dashboard. Without this
file Wrangler tries to auto-detect an app and refuses to in a monorepo root.

## Plan
1. ~~Offline PWA~~ ✅ done (whole-app precache). Next: a web app manifest and icons for "install", an "available
   offline" indicator, `navigator.storage.persist()`, and a bundled Arabic font.
2. **Storage upgrade:** move from `localStorage` to IndexedDB or SQLite-on-OPFS (wa-sqlite) when data grows
   (history, spaced repetition, downloaded course packages). Swap via `configureStorage`.
3. **Course packages:** portable files (compatible with or importable from `.bipy`) so courses can be shared and
   played anywhere. Format decision: ADR pending.
4. **Desktop app:** Tauri shell around the same web build; file-based storage; optional local AI runtime.
5. **Optional sync:** account-based progress sync, per-lesson records (conflict-free merge), opt-in.

## Limits to remember
Browsers may evict storage (request `navigator.storage.persist()`; Safari is strict for non-installed sites);
cross-browser offline must be tested, not assumed.
