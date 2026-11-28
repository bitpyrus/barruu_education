/**
 * Validates an interactive spec against the registry and renders it, with
 * goal, model assumptions and highlight support. Invalid content renders a
 * clear error card instead of crashing the lesson.
 */
import { useMemo, type ComponentType } from 'react';
import { AlertTriangle, Info, Target } from 'lucide-react';
import { getDescriptor, validateConfig, type InteractiveState } from '@barruu/engine';
import type { InteractiveSpec } from '@barruu/engine';
import type { InteractiveProps } from './types';
import { FunctionExplorer } from './FunctionExplorer';
import { PendulumLab } from './PendulumLab';
import { SortingLab } from './SortingLab';
import { GridBoard } from './GridBoard';
import { CircuitBoard } from './CircuitBoard';
import { NumberLine } from './NumberLine';
import { BalanceTiles } from './BalanceTiles';
import { cn } from '../cn';
import { useUiText } from '../UiText';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const COMPONENTS: Record<string, ComponentType<InteractiveProps<any, any>>> = {
  functionExplorer: FunctionExplorer,
  pendulumLab: PendulumLab,
  sortingLab: SortingLab,
  gridBoard: GridBoard,
  circuitBoard: CircuitBoard,
  numberLine: NumberLine,
  balanceTiles: BalanceTiles,
};

export interface InteractiveHostProps {
  spec: InteractiveSpec;
  state?: InteractiveState;
  onChange: (next: InteractiveState, event?: string) => void;
  highlighted?: boolean;
  readOnly?: boolean;
  reducedMotion?: boolean;
}

function useInteractiveInit(spec: InteractiveSpec | undefined) {
  return useMemo(() => {
    if (!spec) return null;
    const v = validateConfig(spec.kind, spec.config);
    const d = getDescriptor(spec.kind);
    if (!v.ok || !d) return { ok: false as const, errors: v.ok ? ['Unknown kind'] : v.errors };
    return { ok: true as const, config: v.config, descriptor: d, initial: d.initialState(v.config) as InteractiveState };
  }, [spec]);
}

export function InteractiveHost({ spec, state, onChange, highlighted, readOnly, reducedMotion }: InteractiveHostProps) {
  const init = useInteractiveInit(spec);
  const tx = useUiText();
  if (!init) return null;
  if (!init.ok) {
    return (
      <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <div className="flex items-center gap-2 font-semibold"><AlertTriangle size={16} /> {tx('ui.loadError')}</div>
        <ul dir="ltr" className="mt-2 list-disc ps-5">{init.errors.map((e) => <li key={e}>{e}</li>)}</ul>
      </div>
    );
  }
  const Component = COMPONENTS[spec.kind];
  if (!Component) return <div className="text-sm text-slate-500">{tx('ui.noRenderer', { kind: spec.kind })}</div>;
  const assumptions = init.descriptor.assumptions ?? [];
  return (
    <div className={cn('rounded-2xl transition-shadow', highlighted && 'ring-4 ring-violet-300 ring-offset-4')}>
      {spec.goal && (
        <div className="mb-3 flex items-start gap-2 rounded-xl bg-stone-100 px-3.5 py-2.5 text-[15px] text-stone-800">
          <Target size={16} className="mt-0.5 shrink-0 text-teal-700" /> <span dir="auto"><b>{tx('ui.goal')}</b> {spec.goal}</span>
        </div>
      )}
      <Component config={init.config} state={state ?? init.initial} onChange={onChange} readOnly={readOnly} reducedMotion={reducedMotion} />
      {assumptions.length > 0 && (
        <details className="mt-3 text-xs text-slate-500 group">
          <summary className="cursor-pointer inline-flex items-center gap-1.5 hover:text-slate-700"><Info size={13} /> {tx('ui.assumptions')}</summary>
          <ul className="mt-1.5 list-disc ps-5 space-y-0.5">{assumptions.map((a, i) => {
            const key = `ui.assumption.${spec.kind}.${i}`;
            const s = tx(key);
            return <li key={a}>{s === key ? a : s}</li>;
          })}</ul>
        </details>
      )}
    </div>
  );
}
