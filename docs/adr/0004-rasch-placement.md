# 0004 — Rasch/EAP adaptive placement anchored to grade

**Context.** We need automatic level detection for grades 9–12 in ~10 questions, explainable and deterministic,
before we have response data.

**Decision.** 1-parameter IRT (Rasch), EAP estimation on a grid with a grade-10 prior, maximum-information selection
with subject balancing, SE-based stopping. Difficulty scale anchored to grade (`θ = (grade − 10.5) × 0.8`). Item
difficulties start as expert estimates and are flagged `estimated`.

**Consequences.** Works now with sensible behaviour (verified by simulation); precision is limited until calibrated
from real (opt-in, anonymous) responses. 2PL/3PL can be considered after calibration data exists.
