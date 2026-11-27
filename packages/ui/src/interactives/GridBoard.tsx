/**
 * GridBoard — reusable construction surface.
 *
 * Learners resize rectangles and drag polygon corners on a square lattice.
 * Every interaction works with pointer, touch and keyboard (focus a handle,
 * then use the arrow keys). Measurements are always computed by the shared
 * geometry engine, so what the learner sees is exactly what gets assessed.
 */
import { useMemo, useRef, useState } from 'react';
import { Grid3x3 } from 'lucide-react';
import { area, boundingBox, coveredCells, perimeter, type Point } from '@barruu/engine';
import { resizeRect, type GridBoardConfig, type GridBoardState, type GridShape } from '@barruu/engine';
import type { InteractiveProps } from './types';
import { cn } from '../cn';

const CELL = 40;
const PAD = 22;

const PALETTE: Record<GridShape['color'], { stroke: string; fill: string; tile: string }> = {
  violet: { stroke: '#6d28d9', fill: 'rgba(124,58,237,0.16)', tile: 'rgba(124,58,237,0.28)' },
  teal: { stroke: '#0f766e', fill: 'rgba(13,148,136,0.16)', tile: 'rgba(13,148,136,0.30)' },
  amber: { stroke: '#b45309', fill: 'rgba(217,119,6,0.16)', tile: 'rgba(217,119,6,0.30)' },
  rose: { stroke: '#be123c', fill: 'rgba(225,29,72,0.14)', tile: 'rgba(225,29,72,0.28)' },
  sky: { stroke: '#0369a1', fill: 'rgba(2,132,199,0.15)', tile: 'rgba(2,132,199,0.28)' },
  slate: { stroke: '#334155', fill: 'rgba(71,85,105,0.12)', tile: 'rgba(71,85,105,0.25)' },
};

const fmt = (v: number) => Number(v.toFixed(2)).toString();

interface Drag { shapeId: string; vertex: number }

export function GridBoard({ config, state, onChange, readOnly }: InteractiveProps<GridBoardConfig, GridBoardState>) {
  const { cols, rows } = config;
  const W = cols * CELL + PAD * 2, H = rows * CELL + PAD * 2;
  const sx = (x: number) => PAD + x * CELL;
  const sy = (y: number) => PAD + (rows - y) * CELL;
  const svgRef = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  // Rectangles resize from the corner they were authored with, so their position stays stable.
  const anchors = useMemo(() => Object.fromEntries(config.shapes.map((s) => [s.id, s.points[0] as Point])), [config.shapes]);

  const pointsOf = (s: GridShape): Point[] => state.shapes[s.id]?.points ?? (s.points as Point[]);

  const handlesOf = (s: GridShape): number[] => {
    if (readOnly || s.editable === 'none') return [];
    const pts = pointsOf(s);
    if (s.editable === 'vertices') return pts.map((_, i) => i);
    // resize: the corner farthest from the anchor
    const a = anchors[s.id];
    let best = 0, bestD = -1;
    pts.forEach((p, i) => { const d = Math.abs(p[0] - a[0]) + Math.abs(p[1] - a[1]); if (d > bestD) { bestD = d; best = i; } });
    return [best];
  };

  const describe = (s: GridShape, pts: Point[]) => {
    const name = s.label || 'shape';
    if (s.kind === 'rect') { const bb = boundingBox(pts); return `${name} to ${bb.width}×${bb.height} (area ${area(pts)})`; }
    return `${name} to area ${fmt(area(pts))}`;
  };

  const move = (s: GridShape, vertex: number, target: Point) => {
    const x = Math.max(0, Math.min(cols, target[0])), y = Math.max(0, Math.min(rows, target[1]));
    const pts = pointsOf(s);
    let next: Point[];
    if (s.kind === 'rect') next = resizeRect(anchors[s.id], [x, y]);
    else {
      if (pts.some((p, i) => i !== vertex && p[0] === x && p[1] === y)) return; // don't stack corners
      next = pts.map((p, i) => (i === vertex ? [x, y] : p));
    }
    if (next.every((p, i) => p[0] === pts[i]?.[0] && p[1] === pts[i]?.[1])) return;
    onChange({ ...state, shapes: { ...state.shapes, [s.id]: { points: next } } }, `${s.kind === 'rect' ? 'resized' : 'reshaped'} ${describe(s, next)}`);
  };

  const toGrid = (e: React.PointerEvent): Point | null => {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    return [Math.round((p.x - PAD) / CELL), Math.round(rows - (p.y - PAD) / CELL)];
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag) return;
    const g = toGrid(e);
    const s = config.shapes.find((x) => x.id === drag.shapeId);
    if (g && s) {
      // For rects the handle index changes as the rect flips; track the new farthest corner.
      move(s, drag.vertex, g);
    }
  };

  const onKey = (s: GridShape, vertex: number, e: React.KeyboardEvent) => {
    const d: Record<string, Point> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
    const delta = d[e.key];
    if (!delta) return;
    e.preventDefault();
    const p = pointsOf(s)[vertex];
    move(s, vertex, [p[0] + delta[0], p[1] + delta[1]]);
  };

  const showTiles = (s: GridShape) => s.showTiles || state.tilesVisible;

  return (
    <div className="select-none">
      <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className={cn('w-full h-auto touch-none', drag && 'cursor-grabbing')}
             onPointerMove={onPointerMove} onPointerUp={() => setDrag(null)} onPointerCancel={() => setDrag(null)}
             role="group" aria-label={`Grid board, ${cols} by ${rows} squares`}>
          {/* lattice */}
          {Array.from({ length: cols + 1 }, (_, i) => <line key={`v${i}`} x1={sx(i)} x2={sx(i)} y1={sy(0)} y2={sy(rows)} stroke="#e7e5e4" strokeWidth={1} />)}
          {Array.from({ length: rows + 1 }, (_, i) => <line key={`h${i}`} y1={sy(i)} y2={sy(i)} x1={sx(0)} x2={sx(cols)} stroke="#e7e5e4" strokeWidth={1} />)}
          {Array.from({ length: (cols + 1) * (rows + 1) }, (_, k) => {
            const x = k % (cols + 1), y = Math.floor(k / (cols + 1));
            return <circle key={`d${k}`} cx={sx(x)} cy={sy(y)} r={1.6} fill="#d6d3d1" />;
          })}

          {config.shapes.map((s) => {
            const pts = pointsOf(s);
            const c = PALETTE[s.color];
            const bb = boundingBox(pts);
            const d = pts.map((p, i) => `${i ? 'L' : 'M'}${sx(p[0])},${sy(p[1])}`).join('') + 'Z';
            const a = area(pts), per = perimeter(pts);
            const labelY = sy(bb.maxY) - 10;
            return (
              <g key={s.id}>
                {s.showBoundingBox && (
                  <rect x={sx(bb.minX)} y={sy(bb.maxY)} width={bb.width * CELL} height={bb.height * CELL}
                        fill="none" stroke={c.stroke} strokeOpacity={0.45} strokeDasharray="6 5" strokeWidth={1.5} />
                )}
                <path d={d} fill={c.fill} stroke={c.stroke} strokeWidth={3} strokeLinejoin="round" />
                {showTiles(s) && coveredCells(pts).map(([x, y]) => (
                  <rect key={`${x},${y}`} x={sx(x) + 3} y={sy(y + 1) + 3} width={CELL - 6} height={CELL - 6} rx={5} fill={c.tile} />
                ))}
                {s.kind === 'rect' && (s.showArea || s.showPerimeter || s.editable !== 'none') && (
                  <>
                    <text x={sx(bb.minX + bb.width / 2)} y={sy(bb.minY) + 17} textAnchor="middle" fontSize={14} fontWeight={600} fill={c.stroke}>{bb.width}</text>
                    <text x={sx(bb.minX) - 9} y={sy(bb.minY + bb.height / 2) + 5} textAnchor="end" fontSize={14} fontWeight={600} fill={c.stroke}>{bb.height}</text>
                  </>
                )}
                {(s.label || s.showArea || s.showPerimeter) && (
                  <text x={sx(bb.minX + bb.width / 2)} y={Math.max(16, labelY)} textAnchor="middle" fontSize={15} fontWeight={700} fill={c.stroke}>
                    {[s.label, s.showArea ? `area ${fmt(a)}` : '', s.showPerimeter ? `perimeter ${fmt(per)}` : ''].filter(Boolean).join(' · ')}
                  </text>
                )}
              </g>
            );
          })}

          {/* handles on top */}
          {config.shapes.map((s) => handlesOf(s).map((i) => {
            const p = pointsOf(s)[i];
            const key = `${s.id}:${i}`;
            const c = PALETTE[s.color];
            const active = (drag?.shapeId === s.id && drag.vertex === i) || focused === key;
            return (
              <g key={key} tabIndex={0} role="button"
                 aria-label={`${s.label || 'Shape'} ${s.kind === 'rect' ? 'corner' : `corner ${i + 1}`} at ${p[0]}, ${p[1]}. Use arrow keys to move.`}
                 className="cursor-grab outline-none" onKeyDown={(e) => onKey(s, i, e)}
                 onFocus={() => setFocused(key)} onBlur={() => setFocused(null)}
                 onPointerDown={(e) => { svgRef.current?.setPointerCapture(e.pointerId); setDrag({ shapeId: s.id, vertex: i }); }}>
                <circle cx={sx(p[0])} cy={sy(p[1])} r={22} fill="transparent" />
                <circle cx={sx(p[0])} cy={sy(p[1])} r={active ? 12 : 10} fill="#fff" stroke={c.stroke} strokeWidth={3.5} />
                {active && <circle cx={sx(p[0])} cy={sy(p[1])} r={18} fill="none" stroke={c.stroke} strokeOpacity={0.3} strokeWidth={4} />}
              </g>
            );
          }))}
        </svg>
      </div>
      {config.allowTileToggle && !readOnly && (
        <button type="button" onClick={() => onChange({ ...state, tilesVisible: !state.tilesVisible }, state.tilesVisible ? 'hid the unit squares' : 'showed the unit squares')}
                aria-pressed={state.tilesVisible}
                className={cn('mt-3 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
                  state.tilesVisible ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-300 bg-white text-stone-700 hover:border-stone-500')}>
          <Grid3x3 size={16} /> {state.tilesVisible ? 'Hide unit squares' : 'Show unit squares'}
        </button>
      )}
    </div>
  );
}
