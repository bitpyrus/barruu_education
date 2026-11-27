import { ArrowRight, Check, CheckCircle2, Circle, CircleDot, Clock } from 'lucide-react';
import { courseLessons, type Course } from '@barruu/engine';
import { cn } from '@barruu/ui';
import { useI18n } from '../i18n';
import { GradeLabel, Page } from '../components/Layout';
import { CourseArt } from '../components/CourseArt';
import { Link } from '../components/Link';
import { navigate, paths } from '../router';
import { courseProgress } from '../storage';

export function CourseDetail({ course }: { course: Course }) {
  const { t } = useI18n();
  const progress = courseProgress(course);
  const lessons = courseLessons(course);
  const minutes = lessons.reduce((m, l) => m + l.estimatedMinutes, 0);
  const startId = progress.started && progress.nextLessonId ? progress.nextLessonId : lessons[0].id;
  return (
    <Page className="pt-8">
      <section className="grid gap-8 lg:grid-cols-[1fr_400px] lg:items-start">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-teal-700">{t(`subject.${course.subject}`)} · <GradeLabel course={course} />{course.status === 'preview' ? ` · ${t('course.preview')}` : ''}</p>
          <h1 className="mt-2 text-[42px] leading-[1.08] sm:text-[52px]">{course.title}</h1>
          {course.tagline && <p className="mt-3 text-[20px] text-stone-600">{course.tagline}</p>}
          <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-stone-700">{course.summary}</p>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[15px] text-stone-500">
            <span>{t('course.lessons', { count: lessons.length })}</span>
            <span className="inline-flex items-center gap-1.5"><Clock size={15} /> {t('course.minutes', { count: minutes })}</span>
          </div>
          <button type="button" onClick={() => navigate(paths.lesson(course.id, startId))}
                  className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-stone-900 px-7 py-3.5 text-[17px] font-bold text-white shadow-[0_4px_0_0_#000]">
            {progress.started ? t('course.continue') : t('course.start')} <ArrowRight size={19} className="rtl:rotate-180" />
          </button>
        </div>
        <div className="overflow-hidden rounded-[28px] ring-1 ring-stone-200">
          <CourseArt course={course} className="aspect-[4/3] w-full" />
          {progress.started && <p className="bg-white p-4 text-[15px] text-stone-600">{t('course.progress', { done: progress.completed, total: progress.total })}</p>}
        </div>
      </section>

      <section className="mt-14 grid gap-10 lg:grid-cols-[1fr_320px]">
        <div>
          <h2 className="text-[28px]">{t('course.outline')}</h2>
          <ol className="mt-6 space-y-5">
            {course.chapters.map((ch, ci) => (
              <li key={ch.id} className={cn('rounded-3xl p-6 ring-1', ch.status === 'available' ? 'bg-white ring-stone-200' : 'ring-stone-200/70')}>
                <div className="flex items-baseline gap-3">
                  <span className="text-[13px] font-semibold uppercase tracking-[0.1em] text-stone-400">{t('course.chapter', { n: ci + 1 })}</span>
                  {ch.status === 'planned' && <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[12px] text-stone-500">{t('course.comingSoon')}</span>}
                </div>
                <h3 className={cn('mt-1 text-[22px]', ch.status !== 'available' && 'text-stone-400')}>{ch.title}</h3>
                {ch.summary && <p className="mt-1 text-[15px] text-stone-500">{ch.summary}</p>}
                <ul className="mt-3 divide-y divide-stone-100">
                  {ch.lessons.map((l) => {
                    const p = progress.byLesson[l.id];
                    return (
                      <li key={l.id}>
                        <Link to={paths.lesson(course.id, l.id)} className="group flex items-center gap-4 py-3.5">
                          {p?.completedAt ? <CheckCircle2 size={24} className="shrink-0 text-teal-700" /> : p ? <CircleDot size={24} className="shrink-0 text-amber-600" /> : <Circle size={24} className="shrink-0 text-stone-300" />}
                          <span className="min-w-0 flex-1"><span className="block text-[17px] font-semibold group-hover:underline">{l.title}</span><span className="block text-[14px] text-stone-500">{l.summary}</span></span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                {ch.plannedLessons.length > 0 && <p className="mt-3 text-sm text-stone-400">{ch.plannedLessons.join(' · ')}</p>}
              </li>
            ))}
          </ol>
        </div>
        <aside className="space-y-8">
          {course.outcomes.length > 0 && (
            <div><h2 className="text-[20px]">{t('course.outcomes')}</h2>
              <ul className="mt-3 space-y-2.5 text-[15px] text-stone-700">{course.outcomes.map((o) => <li key={o} className="flex gap-2.5"><Check size={18} className="mt-0.5 shrink-0 text-teal-700" />{o}</li>)}</ul></div>
          )}
          {course.prerequisites.length > 0 && (
            <div><h2 className="text-[20px]">{t('course.before')}</h2>
              <ul className="mt-3 space-y-1.5 text-[15px] text-stone-600">{course.prerequisites.map((p) => <li key={p}>{p}</li>)}</ul></div>
          )}
        </aside>
      </section>
    </Page>
  );
}
