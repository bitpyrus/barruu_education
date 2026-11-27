# 0002 — The engine is pure and is the reference implementation

**Context.** Assessment and placement must give identical results on every runtime (web, desktop, a possible native
app) and must be trustworthy.

**Decision.** `engine`, `curriculum`, `i18n` contain no DOM, React, network or storage globals (ESLint-enforced).
Storage is injected (`configureStorage`). All grading is deterministic. Their unit tests form the conformance suite
for any other runtime.

**Consequences.** UI packages stay thin; porting to another platform means porting/compiling the engine and passing
its tests. Features needing I/O are composed in apps.
