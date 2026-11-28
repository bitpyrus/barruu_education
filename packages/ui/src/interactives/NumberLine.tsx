/**
 * NumberLine — drag points onto stacked number lines split into equal parts.
 *
 * Points snap to ticks. The shaded bar shows each point's distance from the start
 * of its line, so a fraction reads as a length (IES fractions guide). Works with
 * pointer, touch and keyboard: focus a point, then use ← → (one part), PageUp /
 * PageDown (one whole), Home / End. Points can start off the line, in a tray.
 */
import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { formatDecimal, formatFraction, snap, type NumberLineConfig, type NumberLineState } from '@barruu/engine';
import type { InteractiveProps } from './types';
import { useUiText } from '../UiText';
import { cn } from '../cn';

const W = 640, PADX = 44, ROW = 104, TRAY = 52;
const COLORS: Record<NumberLineConfig['points'][number]['color'], { main: string; soft: string }> = {
  violet: { main: '#6d28d9', soft: 'rgba(124,58,237,0.22)' },
  teal: { main: '#0f766e', soft: 'rgba(13,148,136,0.24)' },
  amber: { main: '#b45309', soft: 'rgba(217,119,6,0.24)' },
  rose: { main: '#be123c', soft: 'rgba(225,29,72,0.20)' },
  sky: { main: '#0369a1', soft: 'rgba(2,132,199,0.22)' },
};

type Line = NumberLineConfig['lines'][number];
type Pt = NumberLineConfig['points'][number];

export function NumberLine({ config, state, onChange, readOnly }: InteractiveProps<NumberLineConfig, NumberLineState>) {
  const tx = useUiText();
  const svgRef = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const lines = new Map(config.lines.map((l) => [l.id, l]));
  const unplaced = config.points.filter((p) => state.points[p.id] === null || state.points[p.id] === undefined);
  const top = unplaced.length ? TRAY : 8;
  const H = top + config.lines.length * ROW;
  const lineY = (l: Line) => top + config.lines.indexOf(l) * ROW + 62;
  const xOf = (l: Line, v: number) => PADX + ((v - l.min) / (l.max - l.min)) * (W - 2 * PADX);
  const valueAt = (l: Line, x: number) => snap(l.min + ((x - PADX) / (W - 2 * PADX)) * (l.max - l.min), l.divisions, l.min, l.max);
  const fmtOn = (l: Line, v: number) => (l.labels === 'decimals' ? formatDecimal(v) : formatFraction(v, l.divisions));
  const fmt = (p: Pt, v: number) => fmtOn(lines.get(p.line)!, v);

  const move = (p: Pt, v: number) => {
    if (readOnly || !p.draggable || state.points[p.id] === v) return;
    onChange({ ...state, points: { ...state.points, [p.id]: v } }, `moved ${p.label || p.id} to ${fmt(p, v)}`);
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!drag) return;
    const p = config.points.find((x) => x.id === drag)!;
    const ctm = svgRef.current?.getScreenCTM();
    if (!ctm) return;
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    move(p, valueAt(lines.get(p.line)!, pt.x));
  };

  const onKey = (p: Pt, e: KeyboardEvent) => {
    const l = lines.get(p.line)!;
    const v = state.points[p.id];
    const step = 1 / l.divisions;
    const next: Record<string, () => number> = {
      ArrowRight: () => (v == null ? l.min : v + step), ArrowUp: () => (v == null ? l.min : v + step),
      ArrowLeft: () => (v == null ? l.max : v - step), ArrowDown: () => (v == null ? l.max : v - step),
      PageUp: () => (v ?? l.min) + 1, PageDown: () => (v ?? l.max) - 1, Home: () => l.min, End: () => l.max,
    };
    if (!next[e.key]) return;
    e.preventDefault();
    move(p, snap(next[e.key](), l.divisions, l.min, l.max));
  };

  const start = (p: Pt) => (e: PointerEvent) => {
    if (readOnly || !p.draggable) return;
    svgRef.current?.setPointerCapture(e.pointerId);
    setDrag(p.id);
  };

  const ariaFor = (p: Pt) => {
    const v = state.points[p.id];
    const label = p.label || tx('ui.nl.point');
    return v == null ? tx('ui.nl.unplaced', { label }) : tx(p.draggable ? 'ui.nl.placed' : 'ui.nl.fixed', { label, value: fmt(p, v) });
  };

  const pin = (p: Pt, x: number, y: number, active: boolean) => {
    const c = COLORS[p.color];
    return (
      <>
        <circle cx={x} cy={y} r={24} fill="transparent" />
        <path d={`M ${x} ${y + 15} L ${x - 6} ${y + 5} A 14 14 0 1 1 ${x + 6} ${y + 5} Z`} fill={p.draggable ? c.main : '#fff'} stroke={c.main} strokeWidth={p.draggable ? 0 : 3} />
        {active && <circle cx={x} cy={y - 5} r={21} fill="none" stroke={c.main} strokeOpacity={0.3} strokeWidth={4} />}
        <text x={x} y={y} textAnchor="middle" fontSize={13} fontWeight={800} fill={p.draggable ? '#fff' : c.main}>{p.label}</text>
      </>
    );
  };

  return (
    <div className="select-none rounded-2xl border border-stone-200 bg-white p-2 sm:p-3" dir="ltr">
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className={cn('h-auto w-full touch-none', drag && 'cursor-grabbing')}
           onPointerMove={onPointerMove} onPointerUp={() => setDrag(null)} onPointerCancel={() => setDrag(null)}
           role="group" aria-label={tx('ui.nl.aria', { count: config.lines.length })}>
        {unplaced.length > 0 && <text x={PADX - 20} y={30} fontSize={13} fill="#78716c">{tx('ui.nl.tray')}</text>}
        {config.lines.map((l) => {
          const y = lineY(l);
          const ticks = (l.max - l.min) * l.divisions;
          const labelTick = (v: number) => (l.labels === 'fractions' ? ticks <= 24
            : l.labels === 'decimals' ? (l.divisions <= 10 || Math.abs(v * 10 - Math.round(v * 10)) < 1e-9) && ticks <= 24 : false);
          return (
            <g key={l.id}>
              <line x1={PADX - 14} x2={W - PADX + 14} y1={y} y2={y} stroke="#292524" strokeWidth={3} strokeLinecap="round" />
              {Array.from({ length: ticks + 1 }, (_, i) => {
                const v = l.min + i / l.divisions;
                const whole = i % l.divisions === 0;
                const x = xOf(l, v);
                return (
                  <g key={i}>
                    <line x1={x} x2={x} y1={y - (whole ? 12 : 7)} y2={y + (whole ? 12 : 7)} stroke="#292524" strokeWidth={whole ? 3 : 2} />
                    {(whole || labelTick(v)) && (
                      <text x={x} y={y + 32} textAnchor="middle" fontSize={whole ? 16 : 13} fontWeight={whole ? 700 : 500} fill={whole ? '#1c1917' : '#57534e'}>
                        {fmtOn(l, v)}
                      </text>
                    )}
                  </g>
                );
              })}
              {config.points.filter((p) => p.line === l.id && state.points[p.id] != null).map((p) => {
                const v = state.points[p.id]!;
                const from = Math.max(l.min, Math.min(0, l.max));
                return config.showLength && v !== from && (
                  <line key={`len-${p.id}`} x1={xOf(l, from)} x2={xOf(l, v)} y1={y} y2={y} stroke={COLORS[p.color].soft} strokeWidth={14} strokeLinecap="round" />
                );
              })}
            </g>
          );
        })}
        {config.points.map((p) => {
          const l = lines.get(p.line)!;
          const v = state.points[p.id];
          const placed = v != null;
          const x = placed ? xOf(l, v) : PADX + 90 + unplaced.indexOf(p) * 46;
          const y = placed ? lineY(l) - 30 : 24;
          const active = drag === p.id || focused === p.id;
          return (
            <g key={p.id} data-point={p.id} role={p.draggable && !readOnly ? 'slider' : 'img'} tabIndex={p.draggable && !readOnly ? 0 : -1}
               aria-label={ariaFor(p)}
               {...(p.draggable && !readOnly && placed ? { 'aria-valuemin': l.min, 'aria-valuemax': l.max, 'aria-valuenow': v, 'aria-valuetext': fmt(p, v) } : {})}
               className={cn('outline-none', p.draggable && !readOnly && 'cursor-grab')}
               onPointerDown={start(p)} onKeyDown={(e) => onKey(p, e)} onFocus={() => setFocused(p.id)} onBlur={() => setFocused(null)}
>
              {pin(p, x, y, active)}
              {placed && config.showValues && (
                <text x={x} y={y - 24} textAnchor="middle" fontSize={14} fontWeight={700} fill={COLORS[p.color].main}>{fmt(p, v)}</text>
              )}
            </g>
          );
        })}
      </svg>
      {!readOnly && config.points.some((p) => p.draggable) && <p className="px-2 pb-1 text-xs text-stone-500">{tx('ui.nl.hint')}</p>}
    </div>
  );
}
