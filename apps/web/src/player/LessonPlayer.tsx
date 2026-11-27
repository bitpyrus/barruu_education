/**
 * Lesson player: one step at a time, deterministic checking, progressive hints,
 * construction answers, feedback sheet, completion. All strings localized;
 * works offline (no network at all). The optional AI tutor plugs in later via
 * an AI provider (docs/AI.md) — learning never depends on it.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import katex from 'katex';
import { ArrowLeft, ArrowRight, Check, Lightbulb, RotateCcw, X } from 'lucide-react';
import {
  checkAnswer, evidenceWeight, getDescriptor, loadProgress, newProgress, recordEvidence, resetProgress, saveProgress,
  validateConfig, type Answer, type CheckResult, type Course, type GridBoardState, type InteractiveState, type LearnerProfile,
  type Lesson, type LessonProgress, type Question, type StepRuntime,
} from '@barruu/engine';
import { InteractiveHost, Rich, RichInline, cn } from '@barruu/ui';
import { AnswerArea } from './AnswerArea';
import { draftReady, emptyDraft, type Draft } from './draft';
import { useI18n } from '../i18n';
import { Link } from '../components/Link';
import { navigate, paths } from '../router';

const EMPTY: StepRuntime = { attempts: [], hintsRevealed: 0, solved: false };
type Sheet = { tone: 'correct' | 'wrong' | 'neutral'; title: string; message: string } | null;

function EmbeddedBlock({ block }: { block: { block_type: string; content: string } }) {
  if (block.block_type !== 'math') return null; // only math blocks are supported in lessons
  let c: { latex?: string; caption?: string } = {};
  try { c = JSON.parse(block.content); } catch { /* malformed */ }
  return (
    <figure className="py-2 text-center">
      <div className="overflow-x-auto text-[1.35rem]" dangerouslySetInnerHTML={{ __html: katex.renderToString(c.latex ?? '', { throwOnError: false, displayMode: true }) }} />
      {c.caption && <figcaption className="mt-1 text-sm text-stone-500"><RichInline text={c.caption} /></figcaption>}
    </figure>
  );
}

interface Props { course: Course; lesson: Lesson; nextLesson?: Lesson; profile: LearnerProfile; onProfileChange: (p: LearnerProfile) => void }

export function LessonPlayer({ course, lesson, nextLesson, profile, onProfileChange }: Props) {
  const { t, dir } = useI18n();
  const [progress, setProgress] = useState<LessonProgress>(() => loadProgress(lesson.id) ?? newProgress(lesson.id));
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [sheet, setSheet] = useState<Sheet>(null);
  const [finished, setFinished] = useState(false);
  const profileRef = useRef(profile);
  useEffect(() => { profileRef.current = profile; }, [profile]);

  const idx = Math.min(progress.stepIndex, lesson.steps.length - 1);
  const step = lesson.steps[idx];
  const runtime = progress.runtime[step.id] ?? EMPTY;
  const question: Question | undefined = step.type === 'question' ? step.question : undefined;
  const spec = step.type === 'interactive' || step.type === 'question' ? step.interactive : undefined;
  const draft = drafts[step.id] ?? (question ? emptyDraft(question) : { selected: [], text: '', order: [] });
  const isPredict = step.stage === 'predict';
  const isAssess = step.stage === 'assess';
  const wrongCount = runtime.attempts.filter((a) => !a.correct).length;

  useEffect(() => { saveProgress(progress); }, [progress]);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [idx]);

  const updateRuntime = useCallback((stepId: string, fn: (r: StepRuntime) => StepRuntime) => {
    setProgress((p) => ({ ...p, runtime: { ...p.runtime, [stepId]: fn(p.runtime[stepId] ?? EMPTY) } }));
  }, []);

  const initial = useMemo(() => {
    if (!spec) return null;
    const v = validateConfig(spec.kind, spec.config);
    const d = getDescriptor(spec.kind);
    return v.ok && d ? (d.initialState(v.config) as InteractiveState) : null;
  }, [spec]);

  const onInteractive = useCallback((next: InteractiveState) => {
    updateRuntime(step.id, (r) => ({ ...r, interactiveState: next }));
    setSheet((s) => (s?.tone === 'wrong' ? null : s));
  }, [step.id, updateRuntime]);

  const buildAnswer = (): { answer: Answer; display: string } | null => {
    if (!question) return null;
    switch (question.kind) {
      case 'choice': return { answer: { kind: 'choice', selected: draft.selected }, display: draft.selected.join(',') };
      case 'numeric': return { answer: { kind: 'numeric', value: draft.text }, display: draft.text };
      case 'expression': return { answer: { kind: 'expression', value: draft.text }, display: draft.text };
      case 'order': return { answer: { kind: 'order', order: draft.order }, display: draft.order.join(',') };
      case 'construction': {
        const st = (runtime.interactiveState ?? initial) as GridBoardState | null;
        return st ? { answer: { kind: 'construction', shapes: st.shapes }, display: 'construction' } : null;
      }
    }
  };

  const goto = (i: number) => {
    setSheet(null);
    if (i >= lesson.steps.length) { setProgress((p) => ({ ...p, completedAt: p.completedAt ?? Date.now() })); setFinished(true); return; }
    setProgress((p) => ({ ...p, stepIndex: Math.max(0, i), maxStepIndex: Math.max(p.maxStepIndex, i) }));
  };

  const check = () => {
    const built = buildAnswer();
    if (!question || !built) return;
    const r: CheckResult = checkAnswer(question, built.answer);
    if (r.invalid) { setSheet({ tone: 'neutral', title: t('lesson.almost'), message: r.feedback }); return; }
    const attempt = runtime.attempts.length + 1;
    updateRuntime(step.id, (rt) => ({ ...rt, attempts: [...rt.attempts, { answer: built.display, correct: r.correct, feedback: r.feedback }], solved: rt.solved || isPredict || r.correct }));
    onProfileChange(recordEvidence(profileRef.current, isPredict
      ? { concepts: [], correct: false, weight: 0, misconceptions: r.misconceptions }
      : { concepts: question.concepts, correct: r.correct, weight: evidenceWeight(runtime.hintsRevealed, question.hints.length, attempt), misconceptions: r.misconceptions }));
    if (isPredict) setSheet({ tone: 'neutral', title: t('lesson.predicted'), message: r.feedback });
    else if (r.correct) setSheet({ tone: 'correct', title: attempt === 1 ? t('lesson.correct') : t('lesson.gotIt'), message: r.feedback });
    else if (isAssess) setSheet({ tone: 'wrong', title: t('lesson.notQuite'), message: `${r.feedback}${question.explanation ? `\n\n${question.explanation}` : ''}` });
    else setSheet({ tone: 'wrong', title: t('lesson.notYet'), message: r.feedback });
  };

  const revealHint = () => {
    if (!question || isAssess || isPredict || runtime.hintsRevealed >= question.hints.length) return;
    updateRuntime(step.id, (r) => ({ ...r, hintsRevealed: r.hintsRevealed + 1 }));
    setSheet(null);
  };

  const showSolution = () => {
    updateRuntime(step.id, (r) => ({ ...r, solved: true }));
    setSheet({ tone: 'neutral', title: t('lesson.solution'), message: question?.explanation ?? '' });
  };

  const resolved = !question || runtime.solved || (isAssess && runtime.attempts.length > 0);
  const primary = resolved
    ? { label: idx === lesson.steps.length - 1 ? t('lesson.finish') : t('lesson.continue'), action: () => goto(idx + 1), disabled: false }
    : { label: isPredict ? t('lesson.lockIn') : t('lesson.check'), action: check, disabled: !draftReady(question!, draft) };
  const primaryRef = useRef(primary);
  useEffect(() => { primaryRef.current = primary; });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      const el = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'BUTTON', 'SELECT'].includes(el.tagName) || el.getAttribute('role') === 'button') return;
      if (!primaryRef.current.disabled) { e.preventDefault(); primaryRef.current.action(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (finished) {
    const questions = lesson.steps.filter((s) => s.type === 'question' && s.stage !== 'predict');
    const firstTry = questions.filter((s) => progress.runtime[s.id]?.attempts[0]?.correct).length;
    return (
      <div className="grid min-h-dvh place-items-center px-4 py-12">
        <div className="rise w-full max-w-md text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[var(--edu-accent)] text-white shadow-[0_6px_0_0_#115e59]"><Check size={40} strokeWidth={3} /></div>
          <h1 className="mt-7 text-[34px]">{t('lesson.complete')}</h1>
          <p className="mt-2 text-lg text-stone-600">{lesson.title}</p>
          {questions.length > 0 && (
            <div className="mt-8 grid grid-cols-2 gap-3 text-start">
              <div className="rounded-2xl bg-white p-4 ring-1 ring-stone-200"><div className="text-3xl font-bold tabular-nums" dir="ltr">{firstTry}/{questions.length}</div><div className="mt-1 text-sm text-stone-500">{t('lesson.firstTry')}</div></div>
              <div className="rounded-2xl bg-white p-4 ring-1 ring-stone-200"><div className="text-3xl font-bold tabular-nums">{lesson.estimatedMinutes}</div><div className="mt-1 text-sm text-stone-500">{t('lesson.minutesPractice')}</div></div>
            </div>
          )}
          {lesson.objectives.length > 0 && (
            <div className="mt-4 rounded-2xl bg-white p-5 text-start ring-1 ring-stone-200">
              <p className="text-sm font-semibold">{t('lesson.practised')}</p>
              <ul className="mt-2 space-y-1.5 text-[15px] text-stone-600">{lesson.objectives.map((o) => <li key={o} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-teal-700" />{o}</li>)}</ul>
            </div>
          )}
          <div className="mt-8 flex flex-col gap-3">
            {nextLesson
              ? <button type="button" onClick={() => navigate(paths.lesson(course.id, nextLesson.id))} className="rounded-xl bg-stone-900 px-6 py-3.5 font-bold text-white shadow-[0_3px_0_0_#000]">{t('lesson.next', { title: nextLesson.title })}</button>
              : <button type="button" onClick={() => navigate(paths.course(course.id))} className="rounded-xl bg-stone-900 px-6 py-3.5 font-bold text-white">{t('lesson.backToCourse')}</button>}
            <div className="flex justify-center gap-2">
              <Link to={paths.course(course.id)} className="rounded-xl px-4 py-2.5 font-semibold text-stone-600 hover:bg-stone-200/60">{t('lesson.backToCourse')}</Link>
              <button type="button" onClick={() => { resetProgress(lesson.id); setProgress(newProgress(lesson.id)); setDrafts({}); setFinished(false); }} className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 font-semibold text-stone-600 hover:bg-stone-200/60"><RotateCcw size={16} /> {t('lesson.redo')}</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hints = question && !isAssess && !isPredict ? question.hints.slice(0, runtime.hintsRevealed) : [];
  const hintsLeft = question && !isAssess && !isPredict ? question.hints.length - runtime.hintsRevealed : 0;
  const Forward = dir === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 bg-[var(--edu-paper)]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-4xl items-center gap-4 px-4 sm:px-6">
          <Link to={paths.course(course.id)} aria-label={t('lesson.leave')} className="rounded-full p-2 text-stone-500 hover:bg-stone-200/60"><X size={22} /></Link>
          <div className="flex flex-1 gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={lesson.steps.length} aria-valuenow={idx + 1}>
            {lesson.steps.map((s, i) => (
              <button key={s.id} type="button" disabled={i > progress.maxStepIndex} onClick={() => goto(i)} aria-label={`${i + 1}`}
                      className={cn('h-2.5 flex-1 rounded-full', i < idx || (i === idx && resolved) ? 'bg-[var(--edu-accent)]' : i === idx ? 'bg-stone-400' : i <= progress.maxStepIndex ? 'bg-teal-200' : 'bg-stone-200')} />
            ))}
          </div>
        </div>
      </header>

      <main className="pb-48">
        <div key={step.id} className={cn('rise mx-auto px-4 pt-6 sm:px-6 sm:pt-10', spec ? 'max-w-3xl' : 'max-w-2xl')}>
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-teal-700">{t(`stage.${step.stage}`)}</p>
          {step.title && <h1 className="mt-2 text-[30px] leading-tight sm:text-[36px]">{step.title}</h1>}
          {step.body && <Rich text={step.body} className="prose-lesson mt-4 text-[18px] leading-[1.65] text-stone-700" />}
          {step.type === 'block' && <div className="mt-7 rounded-2xl border border-stone-200 bg-white p-5"><EmbeddedBlock block={step.block} /></div>}
          {spec && <div className="mt-7"><InteractiveHost spec={spec} state={runtime.interactiveState} onChange={onInteractive} reducedMotion={profile.preferences.reducedMotion} /></div>}
          {question && (
            <section className="mt-8" aria-label="Question">
              <p className="mb-4 text-[20px] font-semibold leading-snug"><RichInline text={question.prompt} /></p>
              <AnswerArea question={question} draft={draft} locked={resolved || (sheet?.tone === 'wrong' && question.kind !== 'construction')}
                          reveal={!!question && runtime.solved && !isPredict} onDraft={(d) => setDrafts((m) => ({ ...m, [step.id]: d }))} onSubmit={() => !primary.disabled && primary.action()} />
              {hints.length > 0 && (
                <div className="mt-5 space-y-2.5">
                  {hints.map((h, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-2xl bg-amber-50 px-4 py-3 text-[16px] text-amber-950 ring-1 ring-amber-200">
                      <Lightbulb size={18} className="mt-0.5 shrink-0 text-amber-600" /> <span><RichInline text={h} /></span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30">
        {sheet && (
          <div role="status" aria-live="polite" className={cn('rise border-t-2', sheet.tone === 'correct' ? 'border-green-600 bg-[var(--edu-correct-bg)]' : sheet.tone === 'wrong' ? 'border-amber-500 bg-[var(--edu-wrong-bg)]' : 'border-stone-300 bg-white')}>
            <div className="mx-auto flex max-w-3xl items-start gap-3 px-4 pb-1 pt-4 sm:px-6">
              <span className={cn('mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full text-white', sheet.tone === 'correct' ? 'bg-green-600' : sheet.tone === 'wrong' ? 'bg-amber-500' : 'bg-stone-700')}>
                {sheet.tone === 'correct' ? <Check size={18} strokeWidth={3} /> : sheet.tone === 'wrong' ? <RotateCcw size={16} strokeWidth={3} /> : <Lightbulb size={16} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn('text-[18px] font-bold', sheet.tone === 'correct' ? 'text-green-800' : sheet.tone === 'wrong' ? 'text-amber-900' : 'text-stone-900')}>{sheet.title}</p>
                <Rich text={sheet.message} className="prose-lesson mt-1 max-h-[34vh] overflow-y-auto text-[16px] text-stone-700" />
              </div>
            </div>
          </div>
        )}
        <div className={cn('border-t', sheet ? 'border-transparent' : 'border-stone-200', sheet?.tone === 'correct' ? 'bg-[var(--edu-correct-bg)]' : sheet?.tone === 'wrong' ? 'bg-[var(--edu-wrong-bg)]' : 'bg-white')}>
          <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-3 px-4 py-4 sm:px-6">
            {sheet?.tone === 'wrong' && !resolved ? (
              <>
                {hintsLeft > 0 && <button type="button" onClick={revealHint} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 font-semibold text-amber-900 hover:bg-amber-100"><Lightbulb size={17} /> {t('lesson.hint')}</button>}
                {wrongCount >= 2 && !isAssess && <button type="button" onClick={showSolution} className="rounded-xl px-3 py-2.5 font-semibold text-stone-600 hover:bg-amber-100">{t('lesson.showSolution')}</button>}
                <button type="button" autoFocus onClick={() => setSheet(null)} className="ms-auto rounded-xl bg-amber-500 px-6 py-3 font-bold text-white shadow-[0_3px_0_0_#b45309]">{t('lesson.tryAgain')}</button>
              </>
            ) : (
              <>
                {!resolved && hintsLeft > 0 && <button type="button" onClick={revealHint} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 font-semibold text-stone-600 hover:bg-stone-100"><Lightbulb size={17} /> {runtime.hintsRevealed ? t('lesson.anotherHint') : t('lesson.hint')}</button>}
                {idx > 0 && !sheet && <button type="button" onClick={() => goto(idx - 1)} className="rounded-xl px-3 py-2.5 font-semibold text-stone-500 hover:bg-stone-100">{t('lesson.back')}</button>}
                <button type="button" onClick={primary.action} disabled={primary.disabled} autoFocus={!!sheet}
                        className={cn('ms-auto inline-flex items-center gap-2 rounded-xl px-7 py-3 font-bold transition-all active:translate-y-[2px] disabled:bg-stone-200 disabled:text-stone-400 disabled:shadow-none',
                          sheet?.tone === 'correct' ? 'bg-green-600 text-white shadow-[0_3px_0_0_#166534]' : 'bg-stone-900 text-white shadow-[0_3px_0_0_#000]')}>
                  {primary.label} {resolved && <Forward size={18} />}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
