import { ArrowRight, Compass } from 'lucide-react';
import type { Course } from '@barruu/engine';
import { SUBJECTS } from '@barruu/curriculum';
import { useI18n } from '../i18n';
import { CourseCard, Page } from '../components/Layout';
import { Link } from '../components/Link';
import { paths } from '../router';
import { courseProgress, loadPlacement } from '../storage';

export function Home({ courses }: { courses: Course[] }) {
  const { t } = useI18n();
  const placement = loadPlacement();
  return (
    <Page>
      <section className="grid items-center gap-10 pb-14 pt-12 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="text-[14px] font-semibold uppercase tracking-[0.14em] text-teal-700">{t('home.eyebrow')}</p>
          <h1 className="mt-4 text-[44px] leading-[1.05] sm:text-[60px]">{t('home.title')}</h1>
          <p className="mt-6 max-w-xl text-[19px] leading-relaxed text-stone-600">{t('home.subtitle')}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to={paths.placement()} className="inline-flex items-center gap-2 rounded-2xl bg-stone-900 px-7 py-4 text-[17px] font-bold text-white shadow-[0_4px_0_0_#000] active:translate-y-[3px] active:shadow-none">
              {t('home.cta.placement')} <ArrowRight size={19} className="rtl:rotate-180" />
            </Link>
            <Link to={paths.courses()} className="inline-flex items-center rounded-2xl px-6 py-4 text-[17px] font-semibold text-stone-700 ring-1 ring-stone-300 hover:bg-white hover:ring-stone-900">{t('home.cta.browse')}</Link>
          </div>
        </div>
        <div className="rounded-[28px] bg-white p-7 ring-1 ring-stone-200">
          <Compass size={30} className="text-teal-700" />
          <p className="mt-4 text-[19px] font-semibold leading-snug">{t('home.placementPitch')}</p>
          <ul className="mt-6 flex flex-wrap gap-2">
            {SUBJECTS.map((s) => (
              <li key={s}><Link to={paths.courses({ subject: s })} className="inline-block rounded-full bg-stone-100 px-3.5 py-1.5 text-[14px] text-stone-700 hover:bg-stone-200">{t(`subject.${s}`)}</Link></li>
            ))}
          </ul>
          {placement && <p className="mt-6 text-sm text-stone-500"><Link to={paths.placement()} className="font-semibold text-teal-800 underline">{t('placement.resultTitle')}</Link></p>}
        </div>
      </section>

      <section className="py-10">
        <h2 className="text-[34px]">{t('home.how.title')}</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {(['predict', 'build', 'understand'] as const).map((k, i) => (
            <div key={k} className="rounded-3xl bg-white p-6 ring-1 ring-stone-200">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-stone-900 font-bold text-white">{i + 1}</span>
              <h3 className="mt-4 text-[22px]">{t(`home.how.${k}`)}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-stone-600">{t(`home.how.${k}.body`)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-10">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-[30px]">{t('nav.courses')}</h2>
          <Link to={paths.courses()} className="font-semibold text-teal-800 hover:underline">{t('home.cta.browse')}</Link>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => <CourseCard key={c.id} course={c} progress={courseProgress(c)} />)}
        </div>
      </section>
    </Page>
  );
}
