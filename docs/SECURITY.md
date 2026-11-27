# Security & privacy

## Rules
- **No code execution from data**: content, translations, AI output and imports are parsed and validated (zod),
  never executed. `eval`/`new Function` are lint errors. Expressions use the engine's safe parser.
- **HTML safety**: lesson markdown is rendered by `@barruu/ui` `renderInlineMarkdown`, which escapes HTML first and
  only adds a fixed set of tags; links must be `https://`; KaTeX runs with `trust: false`.
- **Pure packages** can't touch the network or storage (lint-enforced), limiting where data can leak.
- **Secrets** never in the client or the repo; AI keys live behind a server proxy (when built). `.env*` is ignored.
- **Future code runner** (CS lessons): isolated worker/iframe, no network, CPU/memory/time limits.
- **Imports** (course packages, `.bipy`): size, entry-count and decompressed-size limits before parsing (to build).

## Minors' privacy (grades 9–12 → many users under 18)
- No account needed to learn; no third-party analytics or ads in the learning app.
- Learning data stays on the device by default. Any upload (sync, calibration data, AI tutor) is opt-in, minimal,
  and documented; calibration data must be anonymous.
- Before launch: review COPPA (US, under 13), GDPR-K / age-appropriate design codes as applicable to target regions.

## Before any public source release
Full-history secret scan; dependency licence audit; font/asset licences (Inter, Fraunces: OFL; KaTeX: MIT);
content licences; remove private infrastructure details; owner approval.
