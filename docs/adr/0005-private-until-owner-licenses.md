# 0005 — No licence until the owner decides; develop privately

**Context.** Barruu will be open source, but the owner wants to develop privately first and choose licences
(code and content may differ) later.

**Decision.** No LICENSE file; repository stays private; no packages published; agents must not change visibility or
add licences (`.claude/settings.json` denies `gh repo edit` and `npm publish`). Code is kept free of secrets and
private infrastructure so a future release is practical.

**Consequences.** Contributors are only the owner's collaborators until release. A pre-release audit (SECURITY.md) is
required before going public.
