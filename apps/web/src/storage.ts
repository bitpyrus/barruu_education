/**
 * Local-first persistence. The engine writes through an injected store; on the
 * web that's localStorage. (A desktop build would inject a file/SQLite store.)
 */
import { configureStorage, loadProgress, type LessonProgress } from '@barruu/engine';
import { courseLessons, type Course } from '@barruu/engine';
import type { PlacementResult } from '@barruu/curriculum';

export function initStorage() {
  try { configureStorage(window.localStorage); } catch { /* private mode: in-memory fallback */ }
}

const PLACEMENT_KEY = 'barruu_placement_v1';

export interface SavedPlacement { result: PlacementResult; takenAt: number }

export function savePlacement(result: PlacementResult) {
  localStorage.setItem(PLACEMENT_KEY, JSON.stringify({ result, takenAt: Date.now() } satisfies SavedPlacement));
}

export function loadPlacement(): SavedPlacement | null {
  try { const raw = localStorage.getItem(PLACEMENT_KEY); return raw ? (JSON.parse(raw) as SavedPlacement) : null; } catch { return null; }
}

export interface CourseProgress { total: number; completed: number; started: boolean; nextLessonId?: string; byLesson: Record<string, LessonProgress | null> }

export function courseProgress(course: Course): CourseProgress {
  const lessons = courseLessons(course);
  const byLesson = Object.fromEntries(lessons.map((l) => [l.id, loadProgress(l.id)]));
  const completed = lessons.filter((l) => byLesson[l.id]?.completedAt).length;
  const inProgress = lessons.find((l) => byLesson[l.id] && !byLesson[l.id]!.completedAt);
  const firstUndone = lessons.find((l) => !byLesson[l.id]?.completedAt);
  return { total: lessons.length, completed, started: lessons.some((l) => byLesson[l.id]), nextLessonId: (inProgress ?? firstUndone ?? lessons[0])?.id, byLesson };
}
