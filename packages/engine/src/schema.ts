/**
 * Canonical content model for Barruu Learn.
 *
 * Three layers are kept deliberately separate:
 *   1. Content (this file) — what an author or the AI writes: courses, lessons,
 *      steps, interactive configurations and questions. Serializable, versioned,
 *      validated with zod, and safe to store in course packages.
 *   2. Registry (registry.ts) — what the platform knows about each interactive
 *      kind: its parameter schema, interactions, how to summarise its state for
 *      the tutor, and its declared model assumptions.
 *   3. Runtime learning state (learnerModel.ts / progress.ts) — what a specific
 *      learner has done: attempts, hints used, mastery estimates, misconceptions.
 *
 * Content never contains runtime state, and runtime state never contains code.
 */
import { z } from 'zod';
import { GoalSchema } from './geometry';

export const SCHEMA_VERSION = 1;

/** Pedagogical stage of a lesson step. Not every lesson uses every stage. */
export const StageSchema = z.enum([
  'motivate',   // a question or phenomenon that creates a reason to learn
  'predict',    // commit to a prediction before seeing the result
  'explore',    // manipulate an interactive freely
  'explain',    // visual / verbal explanation
  'challenge',  // guided problem with hints
  'practice',   // independent problem
  'reflect',    // metacognitive prompt
  'transfer',   // apply to a new context
  'assess',     // mastery check
]);
export type Stage = z.infer<typeof StageSchema>;

export const ConceptSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/, 'concept ids are kebab-case'),
  title: z.string().min(1),
  subject: z.string().min(1),
  summary: z.string().default(''),
  prerequisites: z.array(z.string()).default([]),
});
export type Concept = z.infer<typeof ConceptSchema>;

// ── Questions (deterministically checkable) ──────────────────────────────────

const ChoiceOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  correct: z.boolean().default(false),
  /** Shown when the learner picks this option. */
  feedback: z.string().optional(),
  /** Misconception this distractor is designed to detect. */
  misconception: z.string().optional(),
});

const QuestionBase = z.object({
  prompt: z.string().min(1),
  /** Progressive hints, least to most revealing. */
  hints: z.array(z.string()).default([]),
  explanation: z.string().default(''),
  concepts: z.array(z.string()).default([]),
});

export const QuestionSchema = z.discriminatedUnion('kind', [
  QuestionBase.extend({
    kind: z.literal('choice'),
    options: z.array(ChoiceOptionSchema).min(2),
    multiple: z.boolean().default(false),
  }),
  QuestionBase.extend({
    kind: z.literal('numeric'),
    answer: z.number(),
    /** Absolute tolerance. */
    tolerance: z.number().nonnegative().default(0),
    unit: z.string().optional(),
  }),
  QuestionBase.extend({
    kind: z.literal('expression'),
    /** Any expression equivalent to this is accepted. */
    answer: z.string().min(1),
    variables: z.array(z.string()).default(['x']),
  }),
  QuestionBase.extend({
    kind: z.literal('order'),
    items: z.array(z.string()).min(2),
    /** Correct order expressed as indices into `items`. */
    correctOrder: z.array(z.number().int().nonnegative()),
  }),
  QuestionBase.extend({
    /** The answer is what the learner builds on the step's grid board. */
    kind: z.literal('construction'),
    goals: z.array(GoalSchema).min(1),
    /** Shown when every goal is met. */
    successFeedback: z.string().optional(),
  }),
]);
export type Question = z.infer<typeof QuestionSchema>;

// ── Interactive educational objects ──────────────────────────────────────────

export const InteractiveSpecSchema = z.object({
  /** Registry key, e.g. 'functionExplorer'. */
  kind: z.string().min(1),
  schemaVersion: z.number().int().positive().default(SCHEMA_VERSION),
  title: z.string().default(''),
  /** Kind-specific configuration; validated by the registry entry's schema. */
  config: z.record(z.string(), z.unknown()).default({}),
  /** Optional goal shown to the learner while exploring ("Make the parabola open downward"). */
  goal: z.string().optional(),
});
export type InteractiveSpec = z.infer<typeof InteractiveSpecSchema>;

// ── Lesson steps ─────────────────────────────────────────────────────────────

const StepBase = z.object({
  id: z.string().min(1),
  stage: StageSchema,
  title: z.string().optional(),
  /** Markdown with $inline$ and $$display$$ math. */
  body: z.string().default(''),
});

export const StepSchema = z.discriminatedUnion('type', [
  StepBase.extend({ type: z.literal('narrative') }),
  StepBase.extend({ type: z.literal('interactive'), interactive: InteractiveSpecSchema }),
  StepBase.extend({ type: z.literal('question'), question: QuestionSchema, interactive: InteractiveSpecSchema.optional() }),
  StepBase.extend({
    type: z.literal('block'),
    /** A legacy Barruu document block (from `.bipy`). Runtimes render what they support (e.g. `math`). */
    block: z.object({ block_type: z.string(), content: z.string(), style: z.string().default('{}') }),
  }),
]);
export type Step = z.infer<typeof StepSchema>;

export const ProvenanceSchema = z.object({
  source: z.enum(['human', 'ai', 'ai-reviewed']),
  author: z.string().optional(),
  reviewedBy: z.string().optional(),
  createdAt: z.string().optional(),
});

export const LessonSchema = z.object({
  id: z.string().min(1),
  schemaVersion: z.number().int().positive().default(SCHEMA_VERSION),
  title: z.string().min(1),
  summary: z.string().default(''),
  objectives: z.array(z.string()).default([]),
  concepts: z.array(z.string()).default([]),
  estimatedMinutes: z.number().positive().default(10),
  provenance: ProvenanceSchema.default({ source: 'human' }),
  steps: z.array(StepSchema).min(1),
});
export type Lesson = z.infer<typeof LessonSchema>;

export const ChapterSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  title: z.string().min(1),
  summary: z.string().default(''),
  /** `planned` chapters are listed on the course page but have no playable lessons yet. */
  status: z.enum(['available', 'planned']).default('available'),
  lessons: z.array(LessonSchema).default([]),
  /** Titles of lessons that are planned but not yet written (shown as "coming soon"). */
  plannedLessons: z.array(z.string()).default([]),
}).refine((c) => c.status === 'planned' || c.lessons.length > 0, { message: 'available chapters need at least one lesson' });
export type Chapter = z.infer<typeof ChapterSchema>;

/**
 * Course manifest. This is the shape stored in a `.bipy` course package
 * (see docs/education/CONTENT_AND_BIPY.md) and rendered by every Barruu runtime.
 */
export const CourseSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  /** Content version (semver). Downloads are invalidated when it changes. */
  version: z.string().regex(/^\d+\.\d+\.\d+$/).default('1.0.0'),
  title: z.string().min(1),
  tagline: z.string().default(''),
  subject: z.enum(['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Engineering', 'Computer Science', 'Artificial Intelligence', 'Other']),
  /** US-style grade band this course targets, e.g. [9, 10]. 13+ = university. */
  grades: z.tuple([z.number().int().min(1).max(16), z.number().int().min(1).max(16)]).optional(),
  /** Curriculum skill ids (packages/curriculum) this course teaches. */
  skills: z.array(z.string()).default([]),
  level: z.enum(['Foundations', 'Intermediate', 'Advanced']).default('Foundations'),
  language: z.string().default('en'),
  authors: z.array(z.string()).default(['Barruu']),
  /** Licensing is decided by the content owner; default is conservative. */
  license: z.string().default('All rights reserved'),
  summary: z.string().default(''),
  outcomes: z.array(z.string()).default([]),
  prerequisites: z.array(z.string()).default([]),
  /** Key of an original illustration bundled with the runtime (no remote images). */
  illustration: z.string().default('generic'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#6d28d9'),
  /** `preview` courses are early drafts shown with a badge. */
  status: z.enum(['available', 'preview']).default('available'),
  featured: z.boolean().default(false),
  provenance: ProvenanceSchema.default({ source: 'human' }),
  chapters: z.array(ChapterSchema).min(1),
});
export type Course = z.infer<typeof CourseSchema>;

/** Playable lessons in reading order. */
export function courseLessons(course: Course): Lesson[] {
  return course.chapters.flatMap((c) => (c.status === 'available' ? c.lessons : []));
}

export interface ValidationIssue { path: string; message: string; }

export function formatIssues(err: z.ZodError): ValidationIssue[] {
  return err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
}
