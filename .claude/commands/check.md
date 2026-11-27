---
description: Run every quality gate (types, lint, tests, content, build) and summarise failures
---
Run, in order, and stop to fix anything that fails before moving on:

1. `npm run typecheck`
2. `npm run lint`
3. `npm test`
4. `npm run content:check`
5. `npm run build`

If any UI changed, also run the browser check against a production build:
`npm run build`, start `npm run preview` in the background, then `node scripts/e2e/web-check.cjs`.

Report each gate as passed or failed, with the exact error for failures. Never skip or weaken a test to make it pass.
