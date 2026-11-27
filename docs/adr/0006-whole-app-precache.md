# 0006 — Precache the whole app on first visit

**Context.** `barruu_website` downloads courses one at a time, because it is a large site. This app is small: one JS
chunk, one CSS file and the WOFF2 fonts, about 1.3 MB (roughly 0.4 MB gzipped). Learners in low-connectivity
settings should get offline use without having to find a "download" button.

**Decision.** At build time, a Vite plugin (`apps/web/vite.config.ts`, `writeBundle`) writes
`offline-manifest.json`. It lists every built file with its size and SHA-256, the shell's hash, and a build id.
`apps/web/public/sw.js` handles the rest:
- On install, it downloads the shell and every listed file and verifies each one.
- It stores them in a staging cache, then copies them into `barruu-app-<buildId>`. If anything fails, it deletes
  the staging cache and the install fails, so the previous build keeps working.
- On activate, it removes caches from older builds only.
- Navigations are network-first and fall back to the cached shell.
- Everything else is cache-first.
- Cache lookups use `ignoreVary`.

The service worker is registered only in production builds.

**Consequences.**
- After one online visit the app works fully offline: deep links, fonts and maths included.
- This is checked by `scripts/e2e/offline-check.cjs`, which includes a negative control.
- Every deploy re-downloads the whole app once. That is acceptable at this size. Revisit with per-course packages
  (`docs/LOCAL_AND_OFFLINE.md`) when course media grows.
- `.woff`/`.ttf` fallbacks are not cached, since every browser with service workers supports WOFF2.
