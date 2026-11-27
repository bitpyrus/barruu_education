/**
 * Recommendations for the Learn hub: what to continue, what's next on the
 * learner's frontier, and what to review before it fades.
 */
import { courseLessons, type Course, type Lesson } from './schema';
import type { ConceptGraph } from './conceptGraph';
import { conceptsDueForReview, effectiveMastery, MASTERY_THRESHOLD, type LearnerProfile } from './learnerModel';
import type { LessonProgress } from './progress';

export interface LessonRef { course: Course; lesson: Lesson; reason: string; }

export interface Recommendations {
  continue: (LessonRef & { progress: LessonProgress }) | null;
  next: LessonRef[];
  review: { conceptId: string; title: string; lesson?: LessonRef }[];
}

export function recommend(
  profile: LearnerProfile,
  progress: Record<string, LessonProgress | null>,
  courses: Course[],
  graph: ConceptGraph,
  now = Date.now(),
): Recommendations {
  const all = courses.flatMap((course) => courseLessons(course).map((lesson) => ({ course, lesson })));

  const inProgress = all
    .map((r) => ({ ...r, progress: progress[r.lesson.id] }))
    .filter((r): r is typeof r & { progress: LessonProgress } => !!r.progress && !r.progress.completedAt)
    .sort((a, b) => b.progress.updatedAt - a.progress.updatedAt);

  const frontier = new Set(graph.frontier(profile, now));
  const next = all
    .filter((r) => !progress[r.lesson.id]?.completedAt && !inProgress.some((p) => p.lesson.id === r.lesson.id))
    .map((r) => {
      const notMastered = r.lesson.concepts.filter((c) => effectiveMastery(profile.concepts[c], now) < MASTERY_THRESHOLD);
      const gaps = new Set(r.lesson.concepts.flatMap((c) => graph.gapsFor(c, profile, { now })));
      const onFrontier = r.lesson.concepts.some((c) => frontier.has(c) || graph.prerequisitesOf(c).some((p) => frontier.has(p)));
      const score = notMastered.length * 2 + (onFrontier ? 1 : 0) - gaps.size * 3;
      const reason = gaps.size
        ? `Builds on ${[...gaps].map((g) => graph.get(g)?.title ?? g).join(', ')} — worth a quick review first`
        : notMastered.length ? `Covers ${notMastered.map((c) => graph.get(c)?.title ?? c).slice(0, 2).join(' and ')}` : 'Revisit to stay sharp';
      return { ...r, reason, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ course, lesson, reason }) => ({ course, lesson, reason }));

  const review = conceptsDueForReview(profile, now).slice(0, 4).map((conceptId) => {
    const found = all.find((r) => r.lesson.concepts.includes(conceptId));
    return { conceptId, title: graph.get(conceptId)?.title ?? conceptId, lesson: found && { ...found, reason: 'Review' } };
  });

  const c = inProgress[0];
  return {
    continue: c ? { course: c.course, lesson: c.lesson, progress: c.progress, reason: `Step ${c.progress.stepIndex + 1} of ${c.lesson.steps.length}` } : null,
    next,
    review,
  };
}
