/**
 * Learner input for a question step. Controlled: the player owns the draft and
 * decides when to check it. Construction questions have no input here — the
 * learner's shape on the board above *is* the answer.
 */
import { ArrowDown, ArrowUp, Hand } from 'lucide-react';
import { useI18n } from '../i18n';
import type { Question } from '@barruu/engine';
import { RichInline, cn } from '@barruu/ui';

import type { Draft } from './draft';

interface Props {
  question: Question;
  draft: Draft;
  onDraft: (d: Draft) => void;
  locked: boolean;
  /** Show which option is correct (after the question is resolved). */
  reveal: boolean;
  onSubmit: () => void;
}

const LETTERS = 'ABCDEFGH';

export function AnswerArea({ question: q, draft, onDraft, locked, reveal, onSubmit }: Props) {
  const { t } = useI18n();
  if (q.kind === 'construction') {
    if (locked) return null;
    return (
      <p className="flex items-center gap-2 text-[15px] text-stone-500">
        <Hand size={18} className="shrink-0" /> {t('lesson.buildHint')}
      </p>
    );
  }

  if (q.kind === 'choice') {
    return (
      <div role={q.multiple ? 'group' : 'radiogroup'} aria-label="Answer options" className="grid gap-3">
        {q.options.map((o, i) => {
          const selected = draft.selected.includes(o.id);
          const correct = reveal && o.correct;
          const wrongPick = reveal && selected && !o.correct;
          return (
            <button key={o.id} type="button" role={q.multiple ? 'checkbox' : 'radio'} aria-checked={selected} disabled={locked}
                    onClick={() => onDraft({ ...draft, selected: q.multiple ? (selected ? draft.selected.filter((s) => s !== o.id) : [...draft.selected, o.id]) : [o.id] })}
                    className={cn('group flex items-center gap-4 rounded-2xl border-2 bg-white px-4 py-4 text-left text-[17px] transition-all',
                      correct ? 'border-green-600 bg-green-50' : wrongPick ? 'border-amber-500 bg-amber-50' :
                      selected ? 'border-stone-900 shadow-[0_2px_0_0_#1c1917]' : 'border-stone-200 hover:border-stone-400',
                      locked ? 'cursor-default' : 'active:translate-y-px')}>
              <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-lg border-2 text-sm font-bold',
                selected || correct ? 'border-transparent bg-stone-900 text-white' : 'border-stone-300 text-stone-500', correct && 'bg-green-600')}>
                {LETTERS[i]}
              </span>
              <RichInline text={o.text} />
            </button>
          );
        })}
      </div>
    );
  }

  if (q.kind === 'numeric' || q.kind === 'expression') {
    return (
      <div className="flex items-center gap-3">
        <input value={draft.text} disabled={locked} aria-label="Your answer" autoComplete="off" spellCheck={false}
               inputMode={q.kind === 'numeric' ? 'decimal' : 'text'}
               placeholder={q.kind === 'numeric' ? t('lesson.answerPlaceholder') : 'x^2 + 3x'}
               onChange={(e) => onDraft({ ...draft, text: e.target.value })}
               onKeyDown={(e) => { if (e.key === 'Enter' && draft.text.trim()) { e.preventDefault(); onSubmit(); } }}
               dir="ltr" className="w-full max-w-xs rounded-2xl border-2 border-stone-200 bg-white px-5 py-3.5 text-xl font-medium tabular-nums outline-none focus:border-stone-900 disabled:bg-stone-50" />
        {q.kind === 'numeric' && q.unit && <span className="text-lg text-stone-500">{q.unit}</span>}
      </div>
    );
  }

  // order
  const move = (pos: number, dir: -1 | 1) => {
    const next = [...draft.order];
    const t = pos + dir;
    if (t < 0 || t >= next.length) return;
    [next[pos], next[t]] = [next[t], next[pos]];
    onDraft({ ...draft, order: next });
  };
  return (
    <ol className="grid gap-2.5" aria-label="Put these in order">
      {draft.order.map((itemIdx, pos) => (
        <li key={itemIdx} className="flex items-center gap-3 rounded-2xl border-2 border-stone-200 bg-white px-4 py-3">
          <span className="w-6 text-center font-bold text-stone-400">{pos + 1}</span>
          <span className="flex-1 font-mono text-[16px]"><RichInline text={q.items[itemIdx]} /></span>
          <button type="button" aria-label={`Move ${q.items[itemIdx]} up`} disabled={locked || pos === 0} onClick={() => move(pos, -1)} className="rounded-lg p-2 hover:bg-stone-100 disabled:opacity-25"><ArrowUp size={18} /></button>
          <button type="button" aria-label={`Move ${q.items[itemIdx]} down`} disabled={locked || pos === draft.order.length - 1} onClick={() => move(pos, 1)} className="rounded-lg p-2 hover:bg-stone-100 disabled:opacity-25"><ArrowDown size={18} /></button>
        </li>
      ))}
    </ol>
  );
}
