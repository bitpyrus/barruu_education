import { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { initialState, PLANET_GRAVITY, smallAnglePeriod, exactPeriod, step, type PendulumState } from '@barruu/engine';
import type { PendulumLabConfig, PendulumLabState } from '@barruu/engine';
import type { InteractiveProps } from './types';
import { ParamSlider } from './ParamSlider';
import { cn } from '../cn';

const W = 360, H = 250, PIVOT = { x: 180, y: 24 };
const TRACE_SECONDS = 12;

const LABELS: Record<string, { label: string; min: number; max: number; step: number; unit: string }> = {
  length: { label: 'Length', min: 0.1, max: 10, step: 0.1, unit: 'm' },
  gravity: { label: 'Gravity', min: 0.5, max: 30, step: 0.01, unit: 'm/s²' },
  amplitudeDeg: { label: 'Release angle', min: 1, max: 170, step: 1, unit: '°' },
  damping: { label: 'Damping', min: 0, max: 2, step: 0.01, unit: '1/s' },
};

export function PendulumLab({ config, state, onChange, readOnly, reducedMotion }: InteractiveProps<PendulumLabConfig, PendulumLabState>) {
  const [running, setRunning] = useState(false);
  const [sim, setSim] = useState<PendulumState>(() => initialState(state));
  const [measured, setMeasured] = useState<number | null>(null);
  const [trace, setTrace] = useState<{ t: number; theta: number }[]>([]);
  const simRef = useRef(sim);
  const crossings = useRef<number[]>([]);
  const paramsRef = useRef(state);
  useEffect(() => { paramsRef.current = state; }, [state]);

  // Reset the simulation whenever a parameter changes (derived-state pattern: adjust during render).
  const paramsKey = `${state.length}|${state.gravity}|${state.amplitudeDeg}|${state.damping}`;
  const [prevKey, setPrevKey] = useState(paramsKey);
  if (prevKey !== paramsKey) {
    setPrevKey(paramsKey);
    setSim(initialState(state));
    setMeasured(null);
    setTrace([]);
    setRunning(false);
  }
  // Refs used by the animation loop are reset outside render.
  useEffect(() => { simRef.current = initialState(paramsRef.current); crossings.current = []; }, [paramsKey]);

  useEffect(() => {
    if (!running) return;
    let raf = 0, last = performance.now();
    const loop = (now: number) => {
      const elapsed = Math.min(0.05, (now - last) / 1000);
      last = now;
      let s = simRef.current;
      const substeps = 8, dt = elapsed / substeps;
      for (let i = 0; i < substeps; i++) {
        const n = step(s, paramsRef.current, dt);
        if (s.theta < 0 && n.theta >= 0) {
          crossings.current.push(s.t + (-s.theta / (n.theta - s.theta)) * dt);
          const c = crossings.current;
          if (c.length >= 2) setMeasured(c[c.length - 1] - c[c.length - 2]);
        }
        s = n;
      }
      simRef.current = s;
      setSim(s);
      setTrace((tr) => [...tr.filter((p) => p.t > s.t - TRACE_SECONDS), { t: s.t, theta: s.theta }]);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  const t0 = smallAnglePeriod(state);
  const tExact = exactPeriod(state);
  // Scale the rod so lengths up to 10 m fit; keep a sense of relative size.
  const pxPerM = Math.min(180, 190 / Math.max(1, state.length));
  const rod = Math.max(20, state.length * pxPerM);
  const bob = { x: PIVOT.x + rod * Math.sin(sim.theta), y: PIVOT.y + rod * Math.cos(sim.theta) };
  const amp = (state.amplitudeDeg * Math.PI) / 180;

  const set = (k: keyof typeof LABELS, v: number, label?: string) => {
    setRunning(false);
    onChange({ ...state, [k]: v }, `set ${LABELS[k].label.toLowerCase()} to ${label ?? `${v} ${LABELS[k].unit}`}`);
  };

  const planet = Object.entries(PLANET_GRAVITY).find(([, g]) => Math.abs(g - state.gravity) < 0.005)?.[0];
  const traceT0 = sim.t - TRACE_SECONDS;
  const tracePath = trace.map((p, i) => `${i ? 'L' : 'M'}${(((p.t - traceT0) / TRACE_SECONDS) * 320).toFixed(1)},${(40 - (p.theta / Math.max(amp, 0.01)) * 32).toFixed(1)}`).join('');

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_260px]">
      <div className="rounded-xl border border-slate-200 bg-gradient-to-b from-sky-50 to-white overflow-hidden">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img"
             aria-label={`Pendulum, length ${state.length} metres, gravity ${state.gravity} metres per second squared, currently at ${(sim.theta * 180 / Math.PI).toFixed(0)} degrees.`}>
          <line x1={PIVOT.x - 60} x2={PIVOT.x + 60} y1={PIVOT.y} y2={PIVOT.y} stroke="#334155" strokeWidth={4} strokeLinecap="round" />
          <path d={`M${PIVOT.x + rod * Math.sin(-amp)},${PIVOT.y + rod * Math.cos(amp)} A${rod},${rod} 0 0 0 ${PIVOT.x + rod * Math.sin(amp)},${PIVOT.y + rod * Math.cos(amp)}`}
                fill="none" stroke="#cbd5e1" strokeDasharray="4 4" />
          <line x1={PIVOT.x} y1={PIVOT.y} x2={PIVOT.x} y2={PIVOT.y + rod} stroke="#e2e8f0" strokeDasharray="3 5" />
          <line x1={PIVOT.x} y1={PIVOT.y} x2={bob.x} y2={bob.y} stroke="#475569" strokeWidth={2} />
          <circle cx={PIVOT.x} cy={PIVOT.y} r={4} fill="#334155" />
          <circle cx={bob.x} cy={bob.y} r={14} fill="#0891b2" stroke="#155e75" strokeWidth={2} />
          {state.length > 1.15 && <text x={12} y={H - 12} fontSize={11} fill="#94a3b8">scaled to fit · {state.length} m rod</text>}
        </svg>
        <div className="border-t border-slate-100 px-3 py-2">
          <div className="text-[11px] uppercase tracking-wide text-slate-400 mb-1">angle over time</div>
          <svg viewBox="0 0 320 80" className="w-full h-14" aria-hidden="true">
            <line x1={0} x2={320} y1={40} y2={40} stroke="#e2e8f0" />
            <path d={tracePath} fill="none" stroke="#0891b2" strokeWidth={2} />
          </svg>
        </div>
        <div className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100 text-center">
          <Stat label="Formula 2π√(L/g)" value={`${t0.toFixed(2)} s`} />
          <Stat label="Full model" value={`${tExact.toFixed(2)} s`} highlight={Math.abs(tExact - t0) / t0 > 0.02} />
          <Stat label="Measured" value={measured ? `${measured.toFixed(2)} s` : running ? 'timing…' : '—'} />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <button type="button" onClick={() => setRunning((r) => !r)} disabled={readOnly}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold py-2 disabled:opacity-50">
            {running ? <><Pause size={16} /> Pause</> : <><Play size={16} /> {sim.t > 0 ? 'Resume' : 'Release'}</>}
          </button>
          <button type="button" aria-label="Reset pendulum" onClick={() => { setRunning(false); const s = initialState(state); simRef.current = s; setSim(s); setMeasured(null); setTrace([]); crossings.current = []; }}
                  className="rounded-lg border border-slate-200 px-3 text-slate-600 hover:bg-slate-50"><RotateCcw size={16} /></button>
        </div>
        {reducedMotion && <p className="text-xs text-slate-500">Reduced motion is on — the periods above are still computed exactly.</p>}
        {config.adjustable.map((k) => (
          <ParamSlider key={k} label={LABELS[k].label} unit={LABELS[k].unit} min={LABELS[k].min} max={LABELS[k].max} step={LABELS[k].step}
                       value={state[k]} disabled={readOnly} onChange={(v) => set(k, v)} />
        ))}
        {config.showPlanetPresets && config.adjustable.includes('gravity') && (
          <div>
            <div className="text-xs font-medium text-slate-500 mb-1.5">Gravity presets</div>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(PLANET_GRAVITY).map(([name, g]) => (
                <button key={name} type="button" disabled={readOnly} onClick={() => set('gravity', g, `${name} (${g} m/s²)`)}
                        className={cn('rounded-full border px-2.5 py-1 text-xs', planet === name ? 'bg-cyan-600 border-cyan-600 text-white' : 'border-slate-200 text-slate-600 hover:border-cyan-400')}>
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="px-2 py-2">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className={cn('font-mono tabular-nums text-sm font-semibold', highlight ? 'text-amber-600' : 'text-slate-800')}>{value}</div>
    </div>
  );
}
