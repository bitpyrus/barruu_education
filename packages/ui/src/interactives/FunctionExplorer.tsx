import { useMemo, useRef, useState } from 'react';
import { compile, derivative } from '@barruu/engine';
import { findRoots, type FunctionExplorerConfig, type FunctionExplorerState } from '@barruu/engine';
import type { InteractiveProps } from './types';
import { ParamSlider } from './ParamSlider';

const W = 640, H = 400;

function niceStep(range: number): number {
  const raw = range / 10;
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const m = raw / p;
  return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
}

const fmt = (v: number) => (Math.abs(v) < 1e-9 ? '0' : Number(v.toFixed(2)).toString());

export function FunctionExplorer({ config, state, onChange, readOnly }: InteractiveProps<FunctionExplorerConfig, FunctionExplorerState>) {
  const { expression, parameters, xRange, yRange, reference, allowDerivativeToggle } = config;
  const [x0, x1] = xRange, [y0, y1] = yRange;
  const sx = (x: number) => ((x - x0) / (x1 - x0)) * W;
  const sy = (y: number) => H - ((y - y0) / (y1 - y0)) * H;
  const [hoverX, setHoverX] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const names = parameters.map((p) => p.name);
  const f = useMemo(() => compile(expression, ['x', ...parameters.map((p) => p.name)]), [expression, parameters]);
  const g = (x: number) => f({ ...state.params, x });
  const ref = useMemo(() => (reference ? compile(reference, ['x']) : null), [reference]);

  const path = (fn: (x: number) => number) => {
    let d = '', pen = false;
    const n = 400;
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n;
      const y = fn(x);
      if (!Number.isFinite(y) || y < y0 - (y1 - y0) * 2 || y > y1 + (y1 - y0) * 2) { pen = false; continue; }
      d += `${pen ? 'L' : 'M'}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`;
      pen = true;
    }
    return d;
  };

  const roots = findRoots(g, x0, x1);
  const turning = findRoots((x) => derivative(g, x), x0, x1).slice(0, 4);
  const xs = niceStep(x1 - x0), ys = niceStep(y1 - y0);
  const gridX: number[] = []; for (let v = Math.ceil(x0 / xs) * xs; v <= x1; v += xs) gridX.push(+v.toFixed(10));
  const gridY: number[] = []; for (let v = Math.ceil(y0 / ys) * ys; v <= y1; v += ys) gridY.push(+v.toFixed(10));

  const values = names.map((n) => `${n}=${fmt(state.params[n])}`).join(', ');
  const ariaLabel = `Graph of f(x) = ${expression}${values ? ` with ${values}` : ''}. ${roots.length ? `Crosses the x-axis at ${roots.map(fmt).join(', ')}.` : 'Does not cross the x-axis in view.'}`;

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    setHoverX(x0 + ((e.clientX - rect.left) / rect.width) * (x1 - x0));
  };
  const hy = hoverX !== null ? g(hoverX) : NaN;

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_240px]">
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-3 py-2 border-b border-slate-100 text-sm font-mono text-slate-700 flex items-center justify-between gap-2">
          <span>f(x) = {expression.replace(/\*/g, '·')}</span>
          {hoverX !== null && Number.isFinite(hy) && <span className="text-slate-500 tabular-nums">({fmt(hoverX)}, {fmt(hy)})</span>}
        </div>
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto touch-none select-none" role="img" aria-label={ariaLabel}
             onPointerMove={onMove} onPointerLeave={() => setHoverX(null)}>
          {gridX.map((v) => <line key={`gx${v}`} x1={sx(v)} x2={sx(v)} y1={0} y2={H} stroke="#f1f5f9" />)}
          {gridY.map((v) => <line key={`gy${v}`} y1={sy(v)} y2={sy(v)} x1={0} x2={W} stroke="#f1f5f9" />)}
          {y0 < 0 && y1 > 0 && <line x1={0} x2={W} y1={sy(0)} y2={sy(0)} stroke="#94a3b8" strokeWidth={1.5} />}
          {x0 < 0 && x1 > 0 && <line y1={0} y2={H} x1={sx(0)} x2={sx(0)} stroke="#94a3b8" strokeWidth={1.5} />}
          {gridX.filter((v) => v !== 0 && v > x0 && v < x1).map((v) => <text key={`tx${v}`} x={sx(v)} y={Math.min(H - 4, Math.max(12, sy(0) + 14))} fontSize={11} fill="#94a3b8" textAnchor="middle">{fmt(v)}</text>)}
          {gridY.filter((v) => v !== 0 && v > y0 && v < y1).map((v) => <text key={`ty${v}`} x={Math.min(W - 4, Math.max(14, sx(0) - 6))} y={sy(v) + 4} fontSize={11} fill="#94a3b8" textAnchor="end">{fmt(v)}</text>)}
          {ref && <path d={path((x) => ref({ x }))} fill="none" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="6 5" />}
          {state.showDerivative && <path d={path((x) => derivative(g, x))} fill="none" stroke="#f59e0b" strokeWidth={2} strokeDasharray="2 4" />}
          <path d={path(g)} fill="none" stroke="#7c3aed" strokeWidth={3} strokeLinejoin="round" />
          {roots.map((r) => <circle key={`r${r}`} cx={sx(r)} cy={sy(0)} r={5} fill="#fff" stroke="#7c3aed" strokeWidth={2.5} />)}
          {turning.map((t) => Number.isFinite(g(t)) && <circle key={`t${t}`} cx={sx(t)} cy={sy(g(t))} r={5.5} fill="#7c3aed" />)}
          {Number.isFinite(g(0)) && x0 < 0 && x1 > 0 && <circle cx={sx(0)} cy={sy(g(0))} r={4} fill="#0ea5e9" />}
          {hoverX !== null && Number.isFinite(hy) && <>
            <line x1={sx(hoverX)} x2={sx(hoverX)} y1={0} y2={H} stroke="#7c3aed" strokeOpacity={0.15} />
            <circle cx={sx(hoverX)} cy={sy(hy)} r={4} fill="#7c3aed" />
          </>}
        </svg>
        <div className="px-3 py-2 border-t border-slate-100 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full border-2 border-violet-600 bg-white" />roots {roots.length ? roots.map(fmt).join(', ') : 'none in view'}</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-violet-600" />turning point{turning.length !== 1 ? 's' : ''} {turning.length ? turning.map((t) => `(${fmt(t)}, ${fmt(g(t))})`).join(' ') : 'none'}</span>
          {x0 < 0 && x1 > 0 && <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-500" />y-intercept {fmt(g(0))}</span>}
          {ref && <span className="inline-flex items-center gap-1.5"><span className="w-4 border-t-2 border-dashed border-slate-300" />reference {reference}</span>}
          {state.showDerivative && <span className="inline-flex items-center gap-1.5"><span className="w-4 border-t-2 border-dotted border-amber-500" />f′(x)</span>}
        </div>
      </div>
      {(parameters.length > 0 || allowDerivativeToggle) && (
        <div className="flex flex-col gap-4">
          {parameters.map((p) => (
            <ParamSlider key={p.name} label={p.label || p.name} min={p.min} max={p.max} step={p.step}
                         value={state.params[p.name]} disabled={readOnly}
                         onChange={(v) => onChange({ ...state, params: { ...state.params, [p.name]: v } }, `set ${p.name} to ${fmt(v)}`)} />
          ))}
          {allowDerivativeToggle && (
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input type="checkbox" className="accent-amber-500 w-4 h-4" checked={state.showDerivative} disabled={readOnly}
                     onChange={(e) => onChange({ ...state, showDerivative: e.target.checked }, e.target.checked ? 'showed the derivative' : 'hid the derivative')} />
              Show derivative f′(x)
            </label>
          )}
          {parameters.length > 0 && !readOnly && (
            <button type="button" className="self-start text-xs text-slate-500 hover:text-violet-700 underline underline-offset-2"
                    onClick={() => onChange({ ...state, params: Object.fromEntries(parameters.map((p) => [p.name, p.default])) }, 'reset the parameters')}>
              Reset
            </button>
          )}
        </div>
      )}
    </div>
  );
}
