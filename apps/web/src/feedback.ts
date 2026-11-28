/**
 * Turn the engine's language-neutral feedback (`{ code, params }`) into text in
 * the learner's language. `custom` = author-written text, already translated
 * through content overlays, shown as-is.
 */
import type { FeedbackMessage } from '@barruu/engine';

type T = (key: string, params?: Record<string, string | number>) => string;

export function formatFeedback(t: T, m: FeedbackMessage): string {
  if (m.code === 'custom') return m.text;
  if (m.code === 'goal.metric') {
    return t('feedback.goal.metric', { ...m.params, metric: t(`metric.${m.params.metric}`), op: t(`op.${m.params.op}`) });
  }
  if (m.code === 'numberLine.bound' || m.code === 'numberLine.compare') {
    return t(`feedback.${m.code}`, { ...m.params, op: t(`op.${m.params.op}`) });
  }
  if (m.code === 'circuit.metric' || m.code === 'circuit.total' || m.code === 'circuit.litBulbs') {
    const metric = m.params.metric !== undefined ? t(`metric.${m.params.metric}`) : '';
    return t(`feedback.${m.code}`, { ...m.params, metric, op: t(`op.${m.params.op}`) });
  }
  const key = `feedback.${m.code}`;
  const s = t(key, m.params);
  return s === key ? m.text : s;
}
