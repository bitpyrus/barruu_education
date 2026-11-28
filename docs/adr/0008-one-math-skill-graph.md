# 0008 — One mathematics skill graph; syllabi are views of it

**Context.** Barruu serves learners following many national syllabi (US CCSS/AP, England, Singapore, IB, Cambridge,
…) and must find each learner's level automatically. Writing a course per syllabus would multiply content. Copying any
one syllabus would inherit its gaps; CCSS, for example, makes vectors and non-right trigonometry optional.

**Decision.**
- **One graph.** The math curriculum is one skill graph in `packages/curriculum/src/math.ts`.
  - Every course chapter is a skill, with a typical US grade and its prerequisites.
  - Courses are grouped into five bands and seven strands.
- **Old ids kept.** Existing math skill ids are kept as chapter skills. Their grades are re-placed to match the
  research: `math.pythagorean` 9 → 8, `math.statistics` 10 → 6.
- **Alignment tags.** Each course carries tags per framework. Frameworks carry a version and a `verified` flag.
  Syllabus "views" will be produced by filtering the graph.
- **Shared vocabulary.** Lesson concepts map to curriculum skills (`Concept.skill`). Misconceptions are a catalogue
  attached to skills; tests require every content tag to be in it.

**Consequences.**
- Placement, recommendations, the learner model and course planning read the same nodes.
- Grade re-placement changes placement mastery seeds for those skills. Placement tests still pass.
- The graph is expert judgement until learner data can refine edges (planned: item-tree analysis).
- New math content must name a chapter skill. New distractor tags must be added to the catalogue.
