---
description: Update docs/STATE.md so the next agent can continue
---
Update `docs/STATE.md` before ending the session:

1. "Snapshot": what exists now (one short paragraph).
2. Capability matrix: change any row your work affected; every ✅ needs evidence (test name or check script).
3. Baseline checks: paste the current results of `npm run check` and `npm run build`.
4. Known issues: add anything you found but didn't fix; remove what you fixed.
5. **Next task**: the single most valuable next step, specific enough to start immediately.
6. Handoff notes: non-obvious things you learned.
Then commit the update with the rest of your work.
