/** Minimal client-side router (no dependency; works offline). */
import { useEffect, useState } from 'react';

export type Route =
  | { page: 'home' }
  | { page: 'courses'; subject?: string; grade?: number }
  | { page: 'course'; courseId: string }
  | { page: 'lesson'; courseId: string; lessonId: string }
  | { page: 'placement' }
  | { page: 'progress' }
  | { page: 'not-found' };

export function parseRoute(pathname: string, search = ''): Route {
  const parts = pathname.split('/').filter(Boolean).map(decodeURIComponent);
  const q = new URLSearchParams(search);
  if (parts.length === 0) return { page: 'home' };
  if (parts[0] === 'courses') {
    if (parts.length === 1) {
      const g = Number(q.get('grade'));
      return { page: 'courses', subject: q.get('subject') ?? undefined, grade: Number.isInteger(g) && g > 0 ? g : undefined };
    }
    if (parts.length === 2) return { page: 'course', courseId: parts[1] };
    if (parts.length === 3) return { page: 'lesson', courseId: parts[1], lessonId: parts[2] };
  }
  if (parts[0] === 'placement' && parts.length === 1) return { page: 'placement' };
  if (parts[0] === 'progress' && parts.length === 1) return { page: 'progress' };
  return { page: 'not-found' };
}

export const paths = {
  home: () => '/',
  courses: (opts: { subject?: string; grade?: number } = {}) => {
    const q = new URLSearchParams();
    if (opts.subject) q.set('subject', opts.subject);
    if (opts.grade) q.set('grade', String(opts.grade));
    const s = q.toString();
    return s ? `/courses?${s}` : '/courses';
  },
  course: (id: string) => `/courses/${id}`,
  lesson: (courseId: string, lessonId: string) => `/courses/${courseId}/${lessonId}`,
  placement: () => '/placement',
  progress: () => '/progress',
};

const listeners = new Set<() => void>();

export function navigate(to: string, opts: { replace?: boolean } = {}) {
  if (opts.replace) window.history.replaceState(null, '', to);
  else window.history.pushState(null, '', to);
  window.scrollTo(0, 0);
  listeners.forEach((l) => l());
}

export function useRoute(): Route {
  const read = () => parseRoute(window.location.pathname, window.location.search);
  const [route, setRoute] = useState<Route>(read);
  useEffect(() => {
    const update = () => setRoute(read());
    listeners.add(update);
    window.addEventListener('popstate', update);
    return () => { listeners.delete(update); window.removeEventListener('popstate', update); };
  }, []);
  return route;
}
