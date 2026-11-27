/**
 * Tutor actions: the ONLY way the AI tutor can affect the learning
 * environment. Each action is a small, schema-validated request that the
 * application chooses to execute (or refuse). The tutor never runs code,
 * never touches user data directly, and never decides correctness itself —
 * calculations are delegated to the deterministic engine.
 */
import { z } from 'zod';
import { QuestionSchema, type Stage } from '../schema';
import { evalSafe, parseExpr } from '../expr';

export const TutorActionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('highlight'), target: z.enum(['interactive', 'question', 'hint', 'explanation']) }),
  z.object({ type: z.literal('set_parameter'), name: z.string().min(1).max(32), value: z.number().finite() }),
  z.object({ type: z.literal('reveal_hint') }),
  z.object({ type: z.literal('show_equation'), latex: z.string().min(1).max(400), caption: z.string().max(200).optional() }),
  z.object({
    type: z.literal('plot_function'),
    expression: z.string().min(1).max(200),
    xRange: z.tuple([z.number(), z.number()]).optional(),
    caption: z.string().max(200).optional(),
  }),
  z.object({ type: z.literal('calculate'), expression: z.string().min(1).max(200), label: z.string().max(120).optional() }),
  z.object({ type: z.literal('create_practice'), question: QuestionSchema }),
  z.object({ type: z.literal('recommend_review'), concept: z.string().min(1).max(64), reason: z.string().max(200).optional() }),
]);
export type TutorAction = z.infer<typeof TutorActionSchema>;
export type TutorActionType = TutorAction['type'];

const ALL: TutorActionType[] = ['highlight', 'set_parameter', 'reveal_hint', 'show_equation', 'plot_function', 'calculate', 'create_practice', 'recommend_review'];

/**
 * Permission policy by pedagogical stage. During predictions and mastery
 * assessments the tutor can orient the learner but cannot do the work for
 * them (no parameter changes, no calculations, no extra hints).
 */
export function allowedActions(stage: Stage): Set<TutorActionType> {
  if (stage === 'assess' || stage === 'predict') return new Set(['highlight', 'recommend_review']);
  return new Set(ALL);
}

export interface ActionValidation { valid: TutorAction[]; rejected: { raw: unknown; reason: string }[]; }

/** Validate raw model output against the schema and the stage policy. */
export function validateActions(raw: unknown, stage: Stage, maxActions = 4): ActionValidation {
  const list = Array.isArray(raw) ? raw : raw == null ? [] : [raw];
  const allowed = allowedActions(stage);
  const out: ActionValidation = { valid: [], rejected: [] };
  for (const item of list.slice(0, maxActions)) {
    const r = TutorActionSchema.safeParse(item);
    if (!r.success) { out.rejected.push({ raw: item, reason: r.error.issues[0]?.message ?? 'invalid action' }); continue; }
    if (!allowed.has(r.data.type)) { out.rejected.push({ raw: item, reason: `"${r.data.type}" is not permitted during the ${stage} stage` }); continue; }
    if (r.data.type === 'plot_function') {
      try { parseExpr(r.data.expression, ['x']); } catch (e) { out.rejected.push({ raw: item, reason: (e as Error).message }); continue; }
    }
    out.valid.push(r.data);
  }
  for (const item of list.slice(maxActions)) out.rejected.push({ raw: item, reason: 'too many actions in one response' });
  return out;
}

/** Deterministic calculation requested by the tutor. */
export function runCalculation(expression: string): { ok: true; value: number } | { ok: false; error: string } {
  const value = evalSafe(expression);
  return Number.isFinite(value) ? { ok: true, value } : { ok: false, error: 'Could not evaluate that expression' };
}

/**
 * Split a model reply into prose and an optional ```actions [...]``` block.
 * Tolerates a missing block, malformed JSON, and stray fences.
 */
export function parseTutorReply(reply: string): { text: string; rawActions: unknown[] } {
  const re = /```(?:actions|json)\s*([\s\S]*?)```/i;
  const m = re.exec(reply);
  if (!m) return { text: reply.trim(), rawActions: [] };
  const text = (reply.slice(0, m.index) + reply.slice(m.index + m[0].length)).trim();
  try {
    const parsed = JSON.parse(m[1]);
    return { text, rawActions: Array.isArray(parsed) ? parsed : [parsed] };
  } catch {
    return { text, rawActions: [] };
  }
}
