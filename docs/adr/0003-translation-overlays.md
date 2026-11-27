# 0003 — Course translations as source-pinned overlays

**Context.** Courses must be available in many languages without forking content, without ever changing answers,
and without showing outdated translations when the English is edited.

**Decision.** Author in English. Each translation is an overlay mapping string paths to `{ text, source }`. Only
prose keys are translatable. An entry applies only if `source` equals the current English; otherwise it's stale and
English is shown. Coverage/stale/orphaned reported by `npm run content:check`.

**Consequences.** Content model untouched; assessment identical across languages (tested); AI drafting and human
review fit naturally (`machine-draft` → `reviewed`). Restructuring lessons (moving steps) orphans translations — the
check reports them.
