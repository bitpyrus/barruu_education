import type { ReactNode } from 'react';
import { Globe } from 'lucide-react';
import { LOCALES, localeInfo, type LocaleCode } from '@barruu/i18n';
import { courseLessons, type Course } from '@barruu/engine';
import { cn } from '@barruu/ui';
import { useI18n } from '../i18n';
import { paths, type Route } from '../router';
import { Link } from './Link';
import { CourseArt } from './CourseArt';

export function Logo() {
  const { t } = useI18n();
  return (
    <span className="flex items-center gap-2.5">
      <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill="#1c1917" />
        <rect x="8" y="8" width="7" height="7" rx="1.5" fill="#5eead4" />
        <rect x="17" y="8" width="7" height="7" rx="1.5" fill="#fff" />
        <rect x="8" y="17" width="7" height="7" rx="1.5" fill="#fff" />
        <path d="M17 24 L24 17 L24 24 Z" fill="#fbbf24" />
      </svg>
      <span className="display text-[21px] text-stone-900">{t('app.name')}</span>
    </span>
  );
}

export function LanguagePicker() {
  const { t, locale, setLocale } = useI18n();
  return (
    <label className="relative inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[14px] text-stone-600 ring-1 ring-stone-300 hover:ring-stone-500">
      <Globe size={15} aria-hidden="true" />
      <span className="sr-only">{t('nav.language')}</span>
      <select value={locale} onChange={(e) => setLocale(e.target.value as LocaleCode)} aria-label={t('nav.language')}
              className="cursor-pointer appearance-none bg-transparent pe-1 outline-none">
        {LOCALES.map((l) => <option key={l.code} value={l.code}>{l.nativeName}</option>)}
      </select>
    </label>
  );
}

const NAV: { to: string; key: string; match: Route['page'][] }[] = [
  { to: paths.courses(), key: 'nav.courses', match: ['courses', 'course'] },
  { to: paths.placement(), key: 'nav.placement', match: ['placement'] },
  { to: paths.progress(), key: 'nav.progress', match: ['progress'] },
];

export function Header({ route }: { route: Route }) {
  const { t } = useI18n();
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-[var(--edu-paper)]/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link to={paths.home()} aria-label={t('app.name')}><Logo /></Link>
        <nav aria-label="Main" className="flex flex-1 items-center gap-1 overflow-x-auto">
          {NAV.map((n) => {
            const active = n.match.includes(route.page);
            return (
              <Link key={n.to} to={n.to} aria-current={active ? 'page' : undefined}
                    className={cn('whitespace-nowrap rounded-full px-3.5 py-2 text-[15px] font-medium', active ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-200/60')}>
                {t(n.key)}
              </Link>
            );
          })}
        </nav>
        <LanguagePicker />
      </div>
    </header>
  );
}

export function DraftNotice() {
  const { t, locale } = useI18n();
  if (localeInfo(locale).status !== 'machine-draft') return null;
  return <div role="note" className="bg-amber-50 px-4 py-2 text-center text-[13px] text-amber-900 ring-1 ring-amber-200">{t('lang.machineDraft')}</div>;
}

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="mt-24 border-t border-stone-200">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-sm text-stone-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Logo />
        <p>{t('footer.local')}</p>
      </div>
    </footer>
  );
}

export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return <main className={cn('mx-auto max-w-6xl px-4 sm:px-6', className)}>{children}</main>;
}

export function GradeLabel({ course }: { course: Course }) {
  const { t } = useI18n();
  if (!course.grades) return null;
  const [a, b] = course.grades;
  return <>{a === b ? t('grade.n', { n: a }) : t('grade.range', { from: a, to: b })}</>;
}

export function CourseCard({ course, progress }: { course: Course; progress?: { completed: number; total: number } }) {
  const { t } = useI18n();
  const lessons = courseLessons(course).length;
  const pct = progress && progress.total ? Math.round((progress.completed / progress.total) * 100) : 0;
  return (
    <Link to={paths.course(course.id)} className="group flex flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-stone-200 transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-12px_rgba(28,25,23,0.25)]">
      <div className="relative aspect-[16/9] overflow-hidden">
        <CourseArt course={course} className="h-full w-full" />
        {course.status === 'preview' && <span className="absolute start-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-stone-700">{t('course.preview')}</span>}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-stone-500">{t(`subject.${course.subject}`)} · <GradeLabel course={course} /></p>
        <h3 dir="auto" className="mt-1.5 text-start text-[21px] leading-snug text-stone-900">{course.title}</h3>
        {course.tagline && <p dir="auto" className="mt-1.5 text-start text-[15px] leading-relaxed text-stone-600">{course.tagline}</p>}
        <div className="mt-auto pt-5">
          {progress && progress.completed > 0 ? (
            <div>
              <div className="h-2 overflow-hidden rounded-full bg-stone-100"><div className="h-full rounded-full bg-[var(--edu-accent)]" style={{ width: `${pct}%` }} /></div>
              <p className="mt-2 text-[13px] text-stone-500">{t('course.progress', { done: progress.completed, total: progress.total })}</p>
            </div>
          ) : <p className="text-[13px] text-stone-500">{t('course.lessons', { count: lessons })}</p>}
        </div>
      </div>
    </Link>
  );
}
