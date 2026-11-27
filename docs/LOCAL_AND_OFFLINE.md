# Local-first & offline

## Today
- Everything runs in the browser; there is no server dependency for learning.
- Progress, learner profile, placement result and language choice are stored on the device (`localStorage`), via
  the engine's injected store (`configureStorage`).
- Fonts (Inter, Fraunces, KaTeX) are bundled — no CDN.
- **Not yet:** service-worker caching, so a page reload without network fails. (The proven implementation exists
  in `barruu_website` — see MIGRATION.md.)

## Plan
1. **Offline PWA** (port): build-time offline manifest (files + SHA-256), staged atomic downloads, service worker
   with `ignoreVary` cache lookups, offline-reload test with a negative control. Here the whole app is small, so we
   can precache the entire app on first visit instead of per-course downloads.
2. **Storage upgrade:** move from `localStorage` to IndexedDB or SQLite-on-OPFS (wa-sqlite) when data grows
   (history, spaced repetition, downloaded course packages). Swap via `configureStorage`.
3. **Course packages:** portable files (compatible with or importable from `.bipy`) so courses can be shared and
   played anywhere. Format decision: ADR pending.
4. **Desktop app:** Tauri shell around the same web build; file-based storage; optional local AI runtime.
5. **Optional sync:** account-based progress sync, per-lesson records (conflict-free merge), opt-in.

## Limits to remember
Browsers may evict storage (request `navigator.storage.persist()`; Safari is strict for non-installed sites);
cross-browser offline must be tested, not assumed.
