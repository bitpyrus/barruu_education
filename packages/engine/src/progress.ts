/**
 * Persistence for the learner profile and lesson progress.
 *
 * The engine never touches browser APIs directly: the host app injects a
 * key-value store (`configureStorage(localStorage)` on the web, a file- or
 * SQLite-backed store on desktop). Until configured, an in-memory store is used,
 * which keeps tests and other runtimes working. Data stays on the device unless
 * a sync layer is explicitly enabled by the learner.
 */
import { createProfile, type LearnerProfile } from './learnerModel';
import type { StepRuntime } from './tutor/context';

export interface LessonProgress {
  lessonId: string;
  stepIndex: number;
  /** Furthest step reached. */
  maxStepIndex: number;
  runtime: Record<string, StepRuntime>;
  startedAt: number;
  updatedAt: number;
  completedAt?: number;
}

export interface KeyValueStore { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem(k: string): void; }

const PROFILE_KEY = 'barruu_learn_profile_v1';
const PROGRESS_KEY = (lessonId: string) => `barruu_learn_progress_v1_${lessonId}`;

export function memoryStore(): KeyValueStore {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
}

let configured: KeyValueStore = memoryStore();

/** Set the store used by default (call once at app start-up). */
export function configureStorage(store: KeyValueStore): void { configured = store; }

function defaultStore(): KeyValueStore | null { return configured; }

export function loadProfile(store: KeyValueStore | null = defaultStore()): LearnerProfile {
  try {
    const raw = store?.getItem(PROFILE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as LearnerProfile;
      if (p.version === 1) return { ...createProfile(), ...p, preferences: { ...createProfile().preferences, ...p.preferences } };
    }
  } catch { /* corrupted — start fresh */ }
  return createProfile();
}

export function saveProfile(p: LearnerProfile, store: KeyValueStore | null = defaultStore()): void {
  try { store?.setItem(PROFILE_KEY, JSON.stringify(p)); } catch { /* quota — ignore */ }
}

export function loadProgress(lessonId: string, store: KeyValueStore | null = defaultStore()): LessonProgress | null {
  try {
    const raw = store?.getItem(PROGRESS_KEY(lessonId));
    return raw ? (JSON.parse(raw) as LessonProgress) : null;
  } catch { return null; }
}

export function saveProgress(p: LessonProgress, store: KeyValueStore | null = defaultStore()): void {
  try { store?.setItem(PROGRESS_KEY(p.lessonId), JSON.stringify({ ...p, updatedAt: Date.now() })); } catch { /* ignore */ }
}

export function resetProgress(lessonId: string, store: KeyValueStore | null = defaultStore()): void {
  try { store?.removeItem(PROGRESS_KEY(lessonId)); } catch { /* ignore */ }
}

export function newProgress(lessonId: string): LessonProgress {
  const now = Date.now();
  return { lessonId, stepIndex: 0, maxStepIndex: 0, runtime: {}, startedAt: now, updatedAt: now };
}
