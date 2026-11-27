import type { Course } from '@barruu/engine';
import { SUBJECTS } from '@barruu/curriculum';
import { cn } from '@barruu/ui';
import { useI18n } from '../i18n';
import { CourseCard, Page } from '../components/Layout';
import { navigate, paths } from '../router';
import { courseProgress, loadPlacement } from '../storage';
import { recommendCourses } from './Placement';

const GRADES = [9, 10, 11, 12];

export function Catalog({ courses, subject, grade }: { courses: Course[]; subject?: string; grade?: number }) {
  const { t } = useI18n();
  const placement = loadPlacement();
  const shown = courses.filter((c) => (!subject || c.subject === subject) && (!grade || (c.grades && grade >= c.grades[0] && grade <= c.grades[1])));
  const forYou = placement && !subject && !grade ? recommendCourses(placement.result, courses) : [];
  const chip = (on: boolean) => cn('rounded-full px-4 py-2 text-[15px] font-medium ring-1', on ? 'bg-stone-900 text-white ring-stone-900' : 'bg-white text-stone-700 ring-stone-300 hover:ring-stone-900');
  return (
    <Page className="pt-10">
      <h1 className="text-[40px] sm:text-[48px]">{t('catalog.title')}</h1>
      <p className="mt-3 max-w-2xl text-[18px] text-stone-600">{t('catalog.subtitle')}</p>
      <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label={t('home.subjects')}>
        <button type="button" className={chip(!subject)} onClick={() => navigate(paths.courses({ grade }))}>{t('catalog.all')}</button>
        {SUBJECTS.map((s) => <button key={s} type="button" className={chip(subject === s)} onClick={() => navigate(paths.courses({ subject: s, grade }))}>{t(`subject.${s}`)}</button>)}
      </div>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Grade">
        {GRADES.map((g) => <button key={g} type="button" aria-pressed={grade === g} className={cn(chip(grade === g), 'py-1.5 text-sm')} onClick={() => navigate(paths.courses({ subject, grade: grade === g ? undefined : g }))}>{t('grade.n', { n: g })}</button>)}
      </div>
      {forYou.length > 0 && (
        <section className="mt-10">
          <h2 className="text-[24px]">{t('catalog.forYou')}</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{forYou.map((c) => <CourseCard key={c.id} course={c} progress={courseProgress(c)} />)}</div>
        </section>
      )}
      <section className="mt-12">
        {shown.length === 0 ? <p className="text-stone-500">{t('catalog.empty')}</p>
          : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{shown.map((c) => <CourseCard key={c.id} course={c} progress={courseProgress(c)} />)}</div>}
      </section>
    </Page>
  );
}
