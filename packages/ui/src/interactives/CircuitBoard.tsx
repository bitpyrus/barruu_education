/**
 * CircuitBoard — the circuit builder.
 *
 * Parts sit on the edges of a small lattice. Learners fill dashed gaps (tap or
 * Enter cycles through the allowed parts) and flip switches. Every current,
 * voltage and brightness is computed by the engine's circuit solver, so what
 * the learner sees is exactly what gets assessed. Moving dots show current:
 * their speed follows the size of the current (static when reduced motion is on).
 */
import { useMemo, useState, type FocusEvent, type KeyboardEvent } from 'react';
import { AlertTriangle, Lightbulb } from 'lucide-react';
import {
  applyParameter, edgeEnds, placePart, solveCircuit,
  type CircuitBoardConfig, type CircuitBoardState, type CircuitPart, type CircuitPartTemplate, type PartReading,
} from '@barruu/engine';
import type { InteractiveProps } from './types';
import { ParamSlider } from './ParamSlider';
import { useUiText } from '../UiText';
import { cn } from '../cn';

const SP = 104;
const PAD = 44;
const H = SP / 2;
const fmt = (v: number) => Number(Math.abs(v) < 5e-4 ? 0 : v.toFixed(2)).toString();

type Slot = CircuitBoardConfig['slots'][number];

const sameTemplate = (p: CircuitPart | undefined, t: CircuitPartTemplate) =>
  !!p && p.kind === t.kind && p.ohms === t.ohms && p.volts === t.volts && (p.positive ?? 'a') === (t.positive ?? 'a');

/** The part drawn along the x axis from −H to H (rotated into place by the caller). */
function PartGlyph({ part, reading }: { part: CircuitPart; reading?: PartReading }) {
  const line = (x1: number, x2: number) => <line x1={x1} y1={0} x2={x2} y2={0} stroke="#1c1917" strokeWidth={4} strokeLinecap="round" />;
  switch (part.kind) {
    case 'wire': return line(-H, H);
    case 'battery': {
      const flip = (part.positive ?? 'a') === 'b' ? -1 : 1;
      return (
        <g>
          {line(-H, -7)}{line(7, H)}
          <g transform={`scale(${flip},1)`}>
            <line x1={-6} y1={-19} x2={-6} y2={19} stroke="#1c1917" strokeWidth={3} />
            <line x1={6} y1={-10} x2={6} y2={10} stroke="#1c1917" strokeWidth={7} />
          </g>
          <text x={-17 * flip} y={-13} fontSize={15} fontWeight={700} textAnchor="middle" fill="#b91c1c">+</text>
        </g>
      );
    }
    case 'bulb': {
      const b = reading?.brightness ?? 0;
      return (
        <g>
          {line(-H, -17)}{line(17, H)}
          {b > 0.01 && <circle r={18 + 22 * b} fill="#fbbf24" opacity={0.25 + 0.45 * b} />}
          <circle r={17} fill={b > 0.01 ? `rgba(253,224,71,${0.35 + 0.65 * b})` : '#fff'} stroke="#1c1917" strokeWidth={3} />
          <path d="M -11 -11 L 11 11 M -11 11 L 11 -11" stroke="#1c1917" strokeWidth={2.5} />
        </g>
      );
    }
    case 'resistor': {
      const zig = [-24, -18, -10, -2, 6, 14, 20, 24].map((x, i) => `${x},${i === 0 || i === 7 ? 0 : i % 2 ? -9 : 9}`).join(' ');
      return <g>{line(-H, -24)}{line(24, H)}<polyline points={zig} fill="none" stroke="#1c1917" strokeWidth={3.5} strokeLinejoin="round" /></g>;
    }
    case 'switch': {
      const closed = part.closed === true;
      return (
        <g>
          {line(-H, -15)}{line(15, H)}
          <circle cx={-15} cy={0} r={4.5} fill="#1c1917" /><circle cx={15} cy={0} r={4.5} fill="#fff" stroke="#1c1917" strokeWidth={2.5} />
          <line x1={-15} y1={0} x2={closed ? 15 : 10} y2={closed ? 0 : -18} stroke="#1c1917" strokeWidth={4} strokeLinecap="round" />
        </g>
      );
    }
  }
}

export function CircuitBoard({ config, state, onChange, readOnly, reducedMotion }: InteractiveProps<CircuitBoardConfig, CircuitBoardState>) {
  const tx = useUiText();
  const [focused, setFocused] = useState<string | null>(null);
  const board = state.board;
  const sol = useMemo(() => solveCircuit(board), [board]);
  const W = PAD * 2 + (config.cols - 1) * SP, Hh = PAD * 2 + (config.rows - 1) * SP;
  const px = (x: number) => PAD + x * SP, py = (y: number) => PAD + y * SP;

  const slots = useMemo(() => new Map(config.slots.map((s) => [s.at, s])), [config.slots]);
  const toggleable = useMemo(() => new Set(config.parts.filter((p) => p.toggleable).map((p) => p.at)), [config.parts]);
  const partName = (p: Pick<CircuitPart, 'kind' | 'label'>) => `${tx(`ui.circuit.part.${p.kind}`)}${p.label ? ` ${p.label}` : ''}`;
  const value = (p: CircuitPart) => p.kind === 'battery' ? `${fmt(p.volts ?? 3)} V` : p.kind === 'resistor' ? `${fmt(p.ohms ?? 10)} Ω` : p.kind === 'bulb' && p.ohms !== undefined ? `${fmt(p.ohms)} Ω` : '';

  const cycleSlot = (s: Slot) => {
    if (readOnly) return;
    const cur = board[s.at];
    const i = s.options.findIndex((o) => sameTemplate(cur, o));
    const next = { ...board };
    const nextIndex = cur ? i + 1 : 0;
    if (nextIndex >= s.options.length) delete next[s.at];
    else next[s.at] = placePart(s.id, s.label, s.options[nextIndex]);
    const placed = next[s.at];
    onChange({ ...state, board: next }, placed ? `put a ${placed.kind} in gap ${s.label || s.id}` : `emptied gap ${s.label || s.id}`);
  };
  const flip = (edge: string) => {
    if (readOnly) return;
    const p = board[edge];
    onChange({ ...state, board: { ...board, [edge]: { ...p, closed: !p.closed } } }, `${p.closed ? 'opened' : 'closed'} switch ${p.label || p.id}`);
  };
  const onKey = (e: KeyboardEvent, act: () => void) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } };

  const edges = useMemo(() => {
    const all = new Set([...Object.keys(board), ...config.slots.map((s) => s.at)]);
    return [...all].sort();
  }, [board, config.slots]);

  const geometry = (edge: string) => {
    const [[ax, ay], [bx, by]] = edgeEnds(edge);
    const x1 = px(ax), y1 = py(ay), x2 = px(bx), y2 = py(by);
    return { x1, y1, x2, y2, mx: (x1 + x2) / 2, my: (y1 + y2) / 2, vertical: ax === bx };
  };

  const flowLines = config.showFlow && sol.status !== 'invalid' ? edges.flatMap((edge) => {
    const p = board[edge];
    const r = p && sol.readings[p.id];
    if (!p || !r) return [];
    // Current from end a to end b; inside a battery charge moves from − to +.
    const ab = p.kind === 'battery' ? ((p.positive ?? 'a') === 'a' ? -r.current : r.current) : r.current;
    if (Math.abs(ab) < 1e-3) return [];
    const g = geometry(edge);
    const [sx, sy, ex, ey] = ab > 0 ? [g.x1, g.y1, g.x2, g.y2] : [g.x2, g.y2, g.x1, g.y1];
    const dur = Math.min(5, Math.max(0.35, 0.7 / Math.min(Math.abs(ab), 2)));
    return [{ edge, sx, sy, ex, ey, dur }];
  }) : [];

  const nonWire = edges.map((e) => board[e]).filter((p): p is CircuitPart => !!p && p.kind !== 'wire');
  const statusText = sol.status === 'short' ? tx('ui.circuit.short') : sol.status === 'invalid' ? tx('ui.circuit.invalid') : tx('ui.circuit.lit', { count: sol.litBulbs });

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-3 sm:p-4">
      <div dir="ltr" className="ltr-island">
        <svg viewBox={`0 0 ${W} ${Hh}`} className="mx-auto block w-full max-w-[560px] touch-manipulation select-none" role="group"
             aria-label={tx('ui.circuit.aria', { status: statusText })}>
          {/* nodes */}
          {Array.from({ length: config.cols * config.rows }, (_, i) => {
            const x = i % config.cols, y = Math.floor(i / config.cols);
            return <circle key={i} cx={px(x)} cy={py(y)} r={3} fill="#d6d3d1" />;
          })}
          {flowLines.map((f) => (
            <line key={`flow-${f.edge}`} x1={f.sx} y1={f.sy} x2={f.ex} y2={f.ey} stroke={sol.status === 'short' ? '#dc2626' : '#f59e0b'}
                  strokeWidth={6} strokeLinecap="round" strokeDasharray="0 20" strokeDashoffset={0} pointerEvents="none" opacity={0.9}>
              {!reducedMotion && <animate attributeName="stroke-dashoffset" from="20" to="0" dur={`${sol.status === 'short' ? 0.3 : f.dur}s`} repeatCount="indefinite" />}
            </line>
          ))}
          {edges.map((edge) => {
            const g = geometry(edge);
            const p = board[edge];
            const slot = slots.get(edge);
            const canFlip = toggleable.has(edge);
            const interactive = !readOnly && (!!slot || canFlip);
            const isFocus = focused === edge;
            const label = slot
              ? tx('ui.circuit.slot', { name: slot.label ? `${tx('ui.circuit.gap')} ${slot.label}` : tx('ui.circuit.gap'), part: p ? `${partName(p)}${value(p) ? ` ${value(p)}` : ''}` : tx('ui.circuit.empty') })
              : canFlip && p ? tx('ui.circuit.switch', { name: partName(p), state: tx(p.closed ? 'ui.circuit.closed' : 'ui.circuit.open') }) : undefined;
            const rot = g.vertical ? 90 : 0;
            const v = p ? value(p) : '';
            const text = p && p.kind !== 'wire' ? [p.label, v].filter(Boolean).join(' · ') : '';
            return (
              <g key={edge}
                 {...(interactive ? {
                   role: 'button', tabIndex: 0, 'aria-label': label,
                   onClick: () => (slot ? cycleSlot(slot) : flip(edge)),
                   onKeyDown: (e: KeyboardEvent) => onKey(e, () => (slot ? cycleSlot(slot) : flip(edge))),
                   onFocus: (e: FocusEvent<SVGGElement>) => { if (e.currentTarget.matches(':focus-visible')) setFocused(edge); },
                   onBlur: () => setFocused(null),
                   className: 'cursor-pointer outline-none',
                 } : {})}
                 data-edge={edge}>
                <g transform={`translate(${g.mx},${g.my}) rotate(${rot})`}>
                  {interactive && <rect x={-H + 8} y={-24} width={SP - 16} height={48} rx={12}
                                        fill={isFocus ? 'rgba(13,148,136,0.12)' : 'transparent'} stroke={isFocus ? '#0f766e' : 'none'} strokeWidth={2} />}
                  {p ? <PartGlyph part={p} reading={sol.readings[p.id]} /> : (
                    <g>
                      <line x1={-H + 6} y1={0} x2={H - 6} y2={0} stroke="#a8a29e" strokeWidth={3} strokeDasharray="6 7" strokeLinecap="round" />
                      <circle r={12} fill="#fff" stroke="#0f766e" strokeWidth={2.5} />
                      <path d="M -5 0 H 5 M 0 -5 V 5" stroke="#0f766e" strokeWidth={2.5} strokeLinecap="round" />
                    </g>
                  )}
                </g>
                {text && (
                  <text x={g.vertical ? (g.mx < W / 2 ? g.mx + 30 : g.mx - 30) : g.mx} y={g.vertical ? g.my + 5 : g.my - 30} fontSize={16} fontWeight={600}
                        textAnchor={g.vertical ? (g.mx < W / 2 ? 'start' : 'end') : 'middle'} fill="#44403c">{text}</text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div role="status" aria-live="polite"
           className={cn('mt-2 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold',
             sol.status === 'ok' ? 'bg-amber-50 text-amber-900' : 'bg-red-50 text-red-800')}>
        {sol.status === 'ok' ? <Lightbulb size={16} /> : <AlertTriangle size={16} />} <span>{statusText}</span>
      </div>

      {config.adjustable.length > 0 && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {config.adjustable.map((a) => {
            const edge = Object.keys(board).find((e) => board[e].id === a.part);
            const p = edge ? board[edge] : undefined;
            if (!p) return null;
            const name = `${a.part}.${a.property}`;
            return (
              <ParamSlider key={name} label={a.label || partName(p)} min={a.min} max={a.max} step={a.step}
                           unit={a.property === 'volts' ? 'V' : 'Ω'} disabled={readOnly}
                           value={(a.property === 'volts' ? p.volts : p.ohms) ?? (a.property === 'volts' ? 3 : p.kind === 'bulb' ? 6 : 10)}
                           onChange={(val) => {
                             const r = applyParameter('circuitBoard', config, state, name, val);
                             if (r.ok) onChange(r.state as CircuitBoardState, `set ${partName(p)} to ${r.applied} ${a.property === 'volts' ? 'V' : 'Ω'}`);
                           }} />
            );
          })}
        </div>
      )}

      {config.showReadings && nonWire.length > 0 && (
        <div className="mt-3">
          <div className="text-xs font-bold uppercase tracking-wide text-stone-500">{tx('ui.circuit.readings')}</div>
          <ul className="mt-1.5 grid gap-1 text-sm sm:grid-cols-2" data-testid="circuit-readings">
            {nonWire.map((p) => {
              const r = sol.readings[p.id];
              const name = `${partName(p)}${value(p) ? ` (${value(p)})` : ''}`;
              let detail: string;
              if (p.kind === 'switch') detail = tx(p.closed ? 'ui.circuit.closed' : 'ui.circuit.open');
              else if (p.kind === 'battery') detail = tx('ui.circuit.delivers', { current: fmt(r.current) });
              else {
                detail = tx('ui.circuit.reading', { current: fmt(Math.abs(r.current)), voltage: fmt(r.voltage) });
                if (p.kind === 'bulb') detail += ` · ${r.lit ? tx('ui.circuit.brightness', { value: Math.round(r.brightness * 100) }) : tx('ui.circuit.dark')}`;
              }
              return (
                <li key={p.id} className="flex justify-between gap-3 rounded-lg bg-stone-50 px-2.5 py-1.5">
                  <span className="font-medium text-stone-700">{name}</span>
                  <span dir="ltr" className="font-mono tabular-nums text-stone-900">{detail}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {!readOnly && (config.slots.length > 0 || toggleable.size > 0) && (
        <p className="mt-2 text-xs text-stone-500">{tx('ui.circuit.hint')}</p>
      )}
    </div>
  );
}
