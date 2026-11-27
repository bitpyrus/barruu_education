import type { Course } from '@barruu/engine';
import { useI18n } from '../i18n';
import { CourseCard, Page } from '../components/Layout';
import { Link } from '../components/Link';
import { paths } from '../router';
import { courseProgress, loadPlacement } from '../storage';

export function Progress({ courses }: { courses: Course[] }) {
  const { t } = useI18n();
  const started = courses.map((c) => ({ c, p: courseProgress(c) })).filter((x) => x.p.started);
  const placement = loadPlacement();
  return (
    <Page className="pt-10">
      <h1 className="text-[40px]">{t('nav.progress')}</h1>
      {placement && (
        <p className="mt-4 text-[16px] text-stone-600"><Link to={paths.placement()} className="font-semibold text-teal-800 underline">{t('placement.resultTitle')}</Link></p>
      )}
      {started.length === 0 ? (
        <div className="mt-8 rounded-3xl bg-white p-8 ring-1 ring-stone-200">
          <p className="text-[17px] text-stone-600">{t('home.placementPitch')}</p>
          <Link to={paths.placement()} className="mt-5 inline-block rounded-xl bg-stone-900 px-6 py-3 font-bold text-white">{t('home.cta.placement')}</Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{started.map(({ c, p }) => <CourseCard key={c.id} course={c} progress={p} />)}</div>
      )}
    </Page>
  );
}
