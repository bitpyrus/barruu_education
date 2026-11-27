/**
 * Tutor prompt construction and the deterministic offline tutor.
 */
import type { TutorContext } from './context';
import { allowedActions } from './actions';

export function buildTutorSystemPrompt(ctx: TutorContext): string {
  const allowed = [...allowedActions(ctx.step.stage)];
  return [
    'You are Barruu Tutor, a patient teacher embedded inside an interactive lesson.',
    'You can see the learner\'s current step, the live state of the interactive, their attempts, and their learning history (JSON below).',
    'When the learner says "this" or "that", resolve it from the interactive state and the most recent events.',
    '',
    'Teaching principles:',
    '- Help the learner think. Ask one focused question or give the next small hint before giving a full solution.',
    '- Give a direct, complete explanation when the learner explicitly asks for it, or after repeated unsuccessful attempts.',
    '- Ground claims in the interactive\'s actual state. Never invent numbers: if you need one, request a "calculate" action.',
    '- If a simulation is a simplified model, say so when it matters, using the listed assumptions.',
    '- If the learner shows a known misconception, address it gently and specifically.',
    '- If a prerequisite gap explains the difficulty, suggest reviewing it.',
    '- Say so when you are unsure. Keep replies under 120 words. Use $...$ for inline math.',
    ctx.step.stage === 'assess' || ctx.step.stage === 'predict'
      ? '- This is a ' + ctx.step.stage + ' step: do NOT reveal or strongly imply the answer. Clarify the question only.'
      : '',
    ctx.learner.guidance === 'minimal' ? '- The learner prefers minimal guidance: be brief and let them explore.' : '',
    ctx.learner.guidance === 'supportive' ? '- The learner prefers supportive guidance: be warm and more step-by-step.' : '',
    ctx.learner.track === 'rigorous' ? '- The learner prefers rigour: include precise definitions and the underlying mathematics.' : '',
    ctx.learner.track === 'intuitive' ? '- The learner prefers intuition: favour concrete examples and analogies over formalism.' : '',
    '',
    'You may optionally change the learning environment by appending ONE fenced block at the very end:',
    '```actions',
    '[{"type":"set_parameter","name":"a","value":-1}]',
    '```',
    `Allowed action types in this step: ${allowed.join(', ')}.`,
    'Schemas: highlight{target:"interactive"|"question"|"hint"|"explanation"}; set_parameter{name,value}; reveal_hint{};',
    'show_equation{latex,caption?}; plot_function{expression,xRange?,caption?}; calculate{expression,label?};',
    'create_practice{question:{kind:"numeric",prompt,answer,tolerance,hints:[],explanation,concepts:[]} | {kind:"choice",prompt,options:[{id,text,correct,feedback?}],hints:[],explanation,concepts:[]}};',
    'recommend_review{concept,reason?}. Only use parameters listed in the context. Omit the block when no action helps.',
    '',
    'Context:',
    JSON.stringify(ctx),
  ].filter(Boolean).join('\n');
}

/**
 * Deterministic tutor used when the AI service is unavailable (offline,
 * signed out, quota). It can still be genuinely useful because it has the
 * same structured context.
 */
export function offlineTutorReply(ctx: TutorContext, message: string): string {
  const m = message.toLowerCase();
  const q = ctx.question;
  if (/\b(hint|stuck|help)\b/.test(m) && q) {
    if (ctx.step.stage === 'assess') return 'This is a mastery check, so I can\'t give hints here — but you can go back to earlier steps to review.';
    if (q.hintsRemaining > 0) return 'Here\'s a hint — I\'ve revealed the next one under the question.';
    return 'You\'ve seen all the hints for this one. Try re-reading the question and comparing it with what the interactive shows.';
  }
  if (/\b(why|what happened|this|that)\b/.test(m) && ctx.interactive) {
    return `Here's what the ${ctx.interactive.label.toLowerCase()} is showing right now: ${ctx.interactive.state}` +
      (ctx.interactive.assumptions.length ? ` (Model assumptions: ${ctx.interactive.assumptions.join('; ')}.)` : '');
  }
  if (q && q.attempts.length > 0 && !q.solved) {
    const last = q.attempts[q.attempts.length - 1];
    return `Your last answer was "${last.answer}". ${last.feedback} Try changing one thing at a time and checking against the interactive.`;
  }
  if (ctx.learner.prerequisiteGaps.length) {
    return `It might help to review ${ctx.learner.prerequisiteGaps.slice(0, 2).join(' and ')} first.`;
  }
  return 'I\'m in offline mode, so I can only help with hints and describing the interactive. Sign in to chat with the full AI tutor.';
}
