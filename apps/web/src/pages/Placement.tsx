/**
 * "Find your level" — adaptive placement (packages/curriculum/placement.ts).
 * No right/wrong feedback during the test (it's a measurement, not a lesson);
 * the result shows a grade band with its uncertainty, a per-subject breakdown
 * and where to start.
 */
import { useMemo, useState } from 'react';
import { ArrowRight, RotateCcw } from 'lucide-react';
import {
  SUBJECTS, answerItem, isFinished, nextItem, placementResult, startPlacement, getSkill,
  type PlacementResult, type PlacementState, type Subject, type Item,
} from '@barruu/curriculum';
import type { Course } from '@barruu/engine';
import { RichInline, cn } from '@barruu/ui';
import { AnswerArea } from '../player/AnswerArea';
import { draftReady, emptyDraft, type Draft } from '../player/draft';
import { useI18n } from '../i18n';
import { CourseCard, Page } from '../components/Layout';
import { loadPlacement, savePlacement, courseProgress } from '../storage';

type Phase = { kind: 'intro' } | { kind: 'test'; state: PlacementState; item: Item; draft: Draft } | { kind: 'result'; result: PlacementResult };

function bandLabel(result: Pick<PlacementResult, 'band'>, t: (k: string, p?: Record<string, string | number>) => string) {
  if (result.band === 'below') return t('grade.below');
  if (result.band === 'beyond') return t('grade.beyond');
  return t('grade.n', { n: result.band });
}

/** Courses that teach the recommended skills, else courses whose grade band contains the estimate. */
export function recommendCourses(result: PlacementResult, courses: Course[]): Course[] {
  const bySkill = courses.filter((c) => c.skills.some((s) => result.recommendedSkills.includes(s)));
  const byGrade = courses.filter((c) => c.grades && result.grade >= c.grades[0] - 0.5 && result.grade <= c.grades[1] + 0.5);
  const picks = [...new Set([...bySkill, ...byGrade])];
  // Beyond the catalogue's range: offer the most advanced courses rather than nothing.
  if (picks.length === 0) return [...courses].sort((a, b) => (b.grades?.[1] ?? 0) - (a.grades?.[1] ?? 0)).slice(0, 3);
  return picks.slice(0, 3);
}

export function Placement({ courses }: { courses: Course[] }) {
  const { t } = useI18n();
  const saved = useMemo(() => loadPlacement(), []);
  const [subjects, setSubjects] = useState<Subject[]>([...SUBJECTS]);
  const [phase, setPhase] = useState<Phase>(() => (saved ? { kind: 'result', result: saved.result } : { kind: 'intro' }));
  const [invalid, setInvalid] = useState<string | null>(null);

  const begin = () => {
    const state = startPlacement({ subjects });
    const item = nextItem(state)!;
    setPhase({ kind: 'test', state, item, draft: emptyDraft(item.question) });
  };

  const submit = (skip: boolean) => {
    if (phase.kind !== 'test') return;
    const { item, draft } = phase;
    const q = item.question;
    const answer = skip ? 'skip' as const
      : q.kind === 'choice' ? { kind: 'choice' as const, selected: draft.selected }
      : q.kind === 'numeric' ? { kind: 'numeric' as const, value: draft.text }
      : q.kind === 'expression' ? { kind: 'expression' as const, value: draft.text }
      : q.kind === 'order' ? { kind: 'order' as const, order: draft.order } : 'skip' as const;
    const r = answerItem(phase.state, item, answer);
    if (r.invalid) { setInvalid(item.id); return; }
    setInvalid(null);
    if (isFinished(r.state)) {
      const result = placementResult(r.state);
      savePlacement(result);
      setPhase({ kind: 'result', result });
      return;
    }
    const next = nextItem(r.state)!;
    setPhase({ kind: 'test', state: r.state, item: next, draft: emptyDraft(next.question) });
  };

  if (phase.kind === 'intro') {
    return (
      <Page className="max-w-2xl pt-12">
        <h1 className="text-[40px] leading-tight sm:text-[48px]">{t('placement.title')}</h1>
        <p className="mt-4 text-[18px] leading-relaxed text-stone-600">{t('placement.intro')}</p>
        <h2 className="mt-10 text-[20px]">{t('placement.subjects')}</h2>
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={t('placement.subjects')}>
          {SUBJECTS.map((s) => {
            const on = subjects.includes(s);
            return (
              <button key={s} type="button" aria-pressed={on} onClick={() => setSubjects(on ? subjects.filter((x) => x !== s) : [...subjects, s])}
                      className={cn('rounded-full px-4 py-2 text-[15px] font-medium ring-1', on ? 'bg-stone-900 text-white ring-stone-900' : 'bg-white text-stone-700 ring-stone-300')}>
                {t(`subject.${s}`)}
              </button>
            );
          })}
        </div>
        <button type="button" onClick={begin} disabled={subjects.length === 0}
                className="mt-10 inline-flex items-center gap-2 rounded-2xl bg-stone-900 px-7 py-4 text-[17px] font-bold text-white shadow-[0_4px_0_0_#000] disabled:opacity-40">
          {t('placement.start')} <ArrowRight size={19} className="rtl:rotate-180" />
        </button>
      </Page>
    );
  }

  if (phase.kind === 'test') {
    const { item, draft, state } = phase;
    const n = state.responses.length + 1;
    const max = state.config.maxItems;
    return (
      <Page className="max-w-2xl pt-10">
        <div className="flex items-center gap-3">
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-teal-700">{t('placement.counter', { n })}</p>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-stone-200" role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={n - 1}>
            <div className="h-full rounded-full bg-[var(--edu-accent)] transition-all" style={{ width: `${((n - 1) / max) * 100}%` }} />
          </div>
        </div>
        <p className="mt-2 text-[13px] text-stone-500">{t(`subject.${getSkill(item.skill)!.subject}`)}</p>
        <div key={item.id} data-item-id={item.id} className="rise mt-6 rounded-3xl bg-white p-6 ring-1 ring-stone-200 sm:p-8">
          <p className="text-[21px] font-semibold leading-snug"><RichInline text={item.question.prompt} /></p>
          <div className="mt-6">
            <AnswerArea question={item.question} draft={draft} locked={false} reveal={false}
                        onDraft={(d) => setPhase({ ...phase, draft: d })} onSubmit={() => draftReady(item.question, draft) && submit(false)} />
          </div>
          {invalid === item.id && <p role="alert" className="mt-3 text-sm text-amber-800">{t('lesson.almost')} — {t('lesson.answerPlaceholder')}</p>}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => submit(true)} className="rounded-xl px-4 py-3 font-semibold text-stone-600 hover:bg-stone-200/60">{t('placement.dontKnow')}</button>
          <button type="button" onClick={() => submit(false)} disabled={!draftReady(item.question, draft)}
                  className="ms-auto rounded-xl bg-stone-900 px-7 py-3 font-bold text-white shadow-[0_3px_0_0_#000] disabled:bg-stone-200 disabled:text-stone-400 disabled:shadow-none">
            {t('placement.check')}
          </button>
        </div>
      </Page>
    );
  }

  const { result } = phase;
  const recs = recommendCourses(result, courses);
  const range = [Math.max(8, result.grade - result.se / 0.8), Math.min(13, result.grade + result.se / 0.8)];
  return (
    <Page className="pt-10">
      <h1 className="text-[40px] leading-tight sm:text-[48px]">{t('placement.resultTitle')}</h1>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-3xl bg-stone-900 p-7 text-white">
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-teal-300">{t('placement.level')}</p>
          <p className="display mt-2 text-[44px] leading-none text-white" data-testid="placement-band">{bandLabel(result, t)}</p>
          {/* Uncertainty band on a grade 8–13 axis */}
          <div className="ltr-island mt-6">
            <div className="relative h-3 rounded-full bg-white/15">
              <div className="absolute inset-y-0 rounded-full bg-teal-400/50" style={{ left: `${((range[0] - 8) / 5) * 100}%`, width: `${((range[1] - range[0]) / 5) * 100}%` }} />
              <div className="absolute -top-1 h-5 w-1.5 rounded-full bg-white" style={{ left: `calc(${((Math.min(13, Math.max(8, result.grade)) - 8) / 5) * 100}% - 3px)` }} />
            </div>
            <div className="mt-2 flex justify-between text-[12px] text-stone-400">{[8, 9, 10, 11, 12, 13].map((g) => <span key={g}>{g}</span>)}</div>
          </div>
          <p className="mt-4 text-[14px] text-stone-300">{t('placement.uncertain')} {t('placement.answered', { count: result.answered })}</p>
        </section>
        <section className="rounded-3xl bg-white p-7 ring-1 ring-stone-200">
          <h2 className="text-[22px]">{t('placement.bySubject')}</h2>
          <ul className="mt-5 space-y-4">
            {result.bySubject.map((s) => (
              <li key={s.subject}>
                <div className="flex justify-between text-[15px]"><span>{t(`subject.${s.subject}`)}</span><span className="text-stone-500">{bandLabel({ band: s.grade < 8.5 ? 'below' : s.grade >= 12.5 ? 'beyond' : (Math.round(s.grade) as 9 | 10 | 11 | 12) }, t)}</span></div>
                <div className="ltr-island mt-1.5 h-2 overflow-hidden rounded-full bg-stone-100"><div className="h-full rounded-full bg-[var(--edu-accent)]" style={{ width: `${Math.min(100, Math.max(4, ((s.grade - 8) / 5) * 100))}%` }} /></div>
              </li>
            ))}
          </ul>
        </section>
      </div>
      {recs.length > 0 && (
        <section className="mt-12">
          <h2 className="text-[26px]">{t('placement.recommended')}</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{recs.map((c) => <CourseCard key={c.id} course={c} progress={courseProgress(c)} />)}</div>
        </section>
      )}
      <button type="button" onClick={() => setPhase({ kind: 'intro' })} className="mt-10 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 font-semibold text-stone-600 ring-1 ring-stone-300 hover:ring-stone-900">
        <RotateCcw size={16} /> {t('placement.retake')}
      </button>
    </Page>
  );
}
