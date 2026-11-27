/**
 * Builds the structured snapshot the tutor reasons over, so that when a
 * learner asks "why did this happen?" the tutor already knows what "this" is:
 * the step, the interactive's live state, previous attempts, hints shown,
 * known misconceptions and prerequisite gaps.
 */
import type { Course, Lesson, Question, Stage, Step } from '../schema';
import { getDescriptor, type InteractiveState } from '../registry';
import { activeMisconceptions, effectiveMastery, type LearnerProfile } from '../learnerModel';
import type { ConceptGraph } from '../conceptGraph';

export interface AttemptRecord { answer: string; correct: boolean; feedback: string; }

export interface LearningEvent { at: number; text: string; }

export interface StepRuntime {
  interactiveState?: InteractiveState;
  attempts: AttemptRecord[];
  hintsRevealed: number;
  solved: boolean;
}

export interface TutorContext {
  course: { id: string; title: string; subject: string };
  lesson: { id: string; title: string; objectives: string[] };
  step: { index: number; total: number; stage: Stage; title?: string; body: string };
  question?: {
    kind: Question['kind'];
    prompt: string;
    options?: string[];
    hintsRevealed: string[];
    hintsRemaining: number;
    attempts: AttemptRecord[];
    solved: boolean;
    /** Only included once the learner has engaged, and never in assessment steps. */
    answerKey?: string;
  };
  interactive?: {
    kind: string;
    label: string;
    state: string;
    parameters: { name: string; label: string; value: number; min: number; max: number; unit?: string }[];
    assumptions: string[];
  };
  learner: {
    mastery: { concept: string; title: string; pKnown: number }[];
    misconceptions: string[];
    prerequisiteGaps: string[];
    track: LearnerProfile['preferences']['track'];
    guidance: LearnerProfile['preferences']['guidance'];
  };
  recentEvents: string[];
}

function answerKey(q: Question): string {
  switch (q.kind) {
    case 'choice': return q.options.filter((o) => o.correct).map((o) => o.text).join('; ');
    case 'numeric': return `${q.answer}${q.unit ? ` ${q.unit}` : ''} (±${q.tolerance})`;
    case 'expression': return q.answer;
    case 'order': return q.correctOrder.map((i) => q.items[i]).join(' → ');
    case 'construction': return 'Any shape meeting: ' + q.goals.map((g) => `${g.shape}.${g.metric} ${g.op} ${g.value}`).join(', ');
  }
}

function stepQuestion(step: Step): Question | undefined {
  return step.type === 'question' ? step.question : undefined;
}

export function buildTutorContext(args: {
  course: Course;
  lesson: Lesson;
  stepIndex: number;
  runtime: StepRuntime;
  profile: LearnerProfile;
  graph: ConceptGraph;
  events: LearningEvent[];
}): TutorContext {
  const { course, lesson, stepIndex, runtime, profile, graph, events } = args;
  const step = lesson.steps[stepIndex];
  const q = stepQuestion(step);
  const spec = step.type === 'interactive' || step.type === 'question' ? step.interactive : undefined;

  let interactive: TutorContext['interactive'];
  if (spec) {
    const d = getDescriptor(spec.kind);
    const parsed = d?.configSchema.safeParse(spec.config);
    if (d && parsed?.success) {
      const state = runtime.interactiveState ?? d.initialState(parsed.data);
      const params = d.parameters(parsed.data).map((p) => {
        const raw = spec.kind === 'functionExplorer' ? (state.params as Record<string, number>)[p.name] : (state[p.name] as number);
        return { name: p.name, label: p.label, value: raw, min: p.min, max: p.max, unit: p.unit };
      });
      interactive = { kind: spec.kind, label: d.label, state: d.describeState(parsed.data, state), parameters: params, assumptions: d.assumptions ?? [] };
    }
  }

  const lessonConcepts = new Set([...lesson.concepts, ...(q?.concepts ?? [])]);
  const gaps = new Set<string>();
  for (const c of lessonConcepts) for (const g of graph.gapsFor(c, profile)) gaps.add(g);

  const engaged = runtime.attempts.length > 0 || runtime.hintsRevealed > 0;
  return {
    course: { id: course.id, title: course.title, subject: course.subject },
    lesson: { id: lesson.id, title: lesson.title, objectives: lesson.objectives },
    step: { index: stepIndex, total: lesson.steps.length, stage: step.stage, title: step.title, body: step.body.slice(0, 1200) },
    question: q && {
      kind: q.kind,
      prompt: q.prompt,
      options: q.kind === 'choice' ? q.options.map((o) => o.text) : q.kind === 'order' ? q.items : undefined,
      hintsRevealed: q.hints.slice(0, runtime.hintsRevealed),
      hintsRemaining: Math.max(0, q.hints.length - runtime.hintsRevealed),
      attempts: runtime.attempts.slice(-5),
      solved: runtime.solved,
      answerKey: engaged && step.stage !== 'assess' && step.stage !== 'predict' ? answerKey(q) : undefined,
    },
    interactive,
    learner: {
      mastery: [...lessonConcepts].map((c) => ({ concept: c, title: graph.get(c)?.title ?? c, pKnown: Number(effectiveMastery(profile.concepts[c]).toFixed(2)) })),
      misconceptions: activeMisconceptions(profile).slice(0, 5).map((m) => m.id),
      prerequisiteGaps: [...gaps].map((g) => graph.get(g)?.title ?? g),
      track: profile.preferences.track,
      guidance: profile.preferences.guidance,
    },
    recentEvents: events.slice(-8).map((e) => e.text),
  };
}
