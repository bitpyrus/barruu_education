import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, Shuffle, SkipBack } from 'lucide-react';
import { traceSort, type SortAlgorithm } from '@barruu/engine';
import type { SortingLabConfig, SortingLabState } from '@barruu/engine';
import type { InteractiveProps } from './types';
import { cn } from '../cn';
import { useUiText } from '../UiText';

const ALGORITHMS: { id: SortAlgorithm; label: string }[] = [
  { id: 'bubble', label: 'Bubble' }, { id: 'insertion', label: 'Insertion' }, { id: 'selection', label: 'Selection' },
];

export function SortingLab({ config, state, onChange, readOnly, reducedMotion }: InteractiveProps<SortingLabConfig, SortingLabState>) {
  const trace = useMemo(() => traceSort(state.array, state.algorithm), [state.array, state.algorithm]);
  const tx = useUiText();
  const [playing, setPlaying] = useState(false);
  const noteText = (f: { noteCode: string; noteParams: Record<string, number>; note: string }) => {
    const s = tx(f.noteCode, f.noteParams);
    return s === f.noteCode ? f.note : s;
  };
  const frameIdx = Math.min(state.frame, trace.frames.length - 1);
  const frame = trace.frames[frameIdx];
  const max = Math.max(...state.array);

  const go = (i: number, event?: string) => onChange({ ...state, frame: Math.max(0, Math.min(trace.frames.length - 1, i)) }, event);

  const atEnd = frameIdx >= trace.frames.length - 1;
  // Playback stops by itself at the last frame (derived, not an effect).
  const isPlaying = playing && !atEnd;
  const goRef = useRef(go);
  useEffect(() => { goRef.current = go; });
  useEffect(() => {
    if (!isPlaying) return;
    const id = setTimeout(() => goRef.current(frameIdx + 1), reducedMotion ? 900 : 550);
    return () => clearTimeout(id);
  }, [isPlaying, frameIdx, reducedMotion]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-slate-100">
        {config.allowAlgorithmChange ? (
          <div role="radiogroup" aria-label={tx('ui.sort.algorithm')} className="inline-flex rounded-lg bg-slate-100 p-0.5">
            {ALGORITHMS.map((a) => (
              <button key={a.id} role="radio" aria-checked={state.algorithm === a.id} disabled={readOnly} type="button"
                      onClick={() => { setPlaying(false); onChange({ ...state, algorithm: a.id, frame: 0 }, `switched to ${a.label.toLowerCase()} sort`); }}
                      className={cn('px-2.5 py-1 text-xs font-medium rounded-md', state.algorithm === a.id ? 'bg-white shadow text-orange-700' : 'text-slate-600')}>
                {tx(`ui.sort.${a.id}`)}
              </button>
            ))}
          </div>
        ) : <span className="text-sm font-medium text-slate-700">{tx(`ui.sort.title.${state.algorithm}`)}</span>}
        <div className="ml-auto flex gap-3 text-xs text-slate-600 tabular-nums">
          <span>{tx('ui.sort.comparisons', { n: frame.comparisons })}</span>
          <span>{tx('ui.sort.swaps', { n: frame.swaps })}</span>
        </div>
      </div>

      <div className="flex items-end justify-center gap-2 h-56 px-4 pt-6" role="img"
           aria-label={tx('ui.sort.aria', { values: frame.array.join(', '), note: noteText(frame) })}>
        {frame.array.map((v, i) => {
          const comparing = frame.compare?.includes(i);
          const done = frame.sorted.includes(i);
          return (
            <div key={i} className="flex flex-col items-center gap-1 flex-1 max-w-14">
              <div className={cn('w-full rounded-t-md transition-all duration-300',
                comparing ? (frame.swapped ? 'bg-rose-500' : 'bg-amber-400') : done ? 'bg-emerald-500' : 'bg-orange-300')}
                   style={{ height: `${(v / max) * 170 + 12}px` }} />
              <span className={cn('text-sm font-mono', comparing ? 'font-bold text-slate-900' : 'text-slate-600')}>{v}</span>
            </div>
          );
        })}
      </div>

      <p className="text-center text-sm text-slate-700 min-h-[2.5rem] px-4 pt-2" aria-live="polite">{noteText(frame)}</p>

      <div className="flex items-center justify-center gap-2 px-3 pb-3">
        <IconBtn label={tx('ui.sort.restart')} disabled={readOnly || frameIdx === 0} onClick={() => { setPlaying(false); go(0, 'restarted the trace'); }}><SkipBack size={16} /></IconBtn>
        <IconBtn label={tx('ui.sort.back')} disabled={readOnly || frameIdx === 0} onClick={() => go(frameIdx - 1)}><ChevronLeft size={18} /></IconBtn>
        <button type="button" disabled={readOnly || frameIdx >= trace.frames.length - 1} onClick={() => setPlaying(!isPlaying)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold px-4 py-2 disabled:opacity-40">
          {isPlaying ? <><Pause size={16} /> {tx('ui.sort.pause')}</> : <><Play size={16} /> {tx('ui.sort.play')}</>}
        </button>
        <IconBtn label={tx('ui.sort.forward')} disabled={readOnly || frameIdx >= trace.frames.length - 1} onClick={() => go(frameIdx + 1, `stepped to step ${frameIdx + 1}: ${trace.frames[frameIdx + 1]?.note}`)}><ChevronRight size={18} /></IconBtn>
        {config.allowShuffle && (
          <IconBtn label={tx('ui.sort.shuffle')} disabled={readOnly} onClick={() => {
            setPlaying(false);
            const arr = [...state.array].sort(() => Math.random() - 0.5);
            onChange({ ...state, array: arr, frame: 0 }, `shuffled to [${arr.join(', ')}]`);
          }}><Shuffle size={16} /></IconBtn>
        )}
      </div>
      <div className="text-center text-xs text-slate-400 pb-2 tabular-nums">{tx('ui.sort.step', { i: frameIdx, n: trace.frames.length - 1 })}</div>
    </div>
  );
}

function IconBtn({ label, children, ...rest }: { label: string; children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" aria-label={label} title={label} {...rest}
            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40">
      {children}
    </button>
  );
}
