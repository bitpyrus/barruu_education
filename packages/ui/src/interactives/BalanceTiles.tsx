/**
 * BalanceTiles — an equation as a balance scale.
 *
 * x-tiles (unknown weight) and 1-tiles sit on two pans; the beam tilts toward the
 * heavier side and the equation underneath shows "=" only when the pans are level.
 * Free mode: add/remove tiles on editable pans. Moves mode: only moves that do the
 * same thing to both sides, so the scale stays level until x stands alone.
 * All controls are buttons (keyboard, touch, screen reader).
 */
import { allowedMoves, applyMove, equationText, isBalanced, isSolved, value, type BalanceMove, type BalanceSides, type BalanceTilesConfig, type BalanceTilesState, type Pan } from '@barruu/engine';
import type { InteractiveProps } from './types';
import { useUiText } from '../UiText';
import { cn } from '../cn';

const W = 640, H = 290, PX = 320, PY = 64, ARM = 210;

function Tiles({ pan, cx, baseY }: { pan: Pan; cx: number; baseY: number }) {
  const items: ('x' | '1')[] = [...Array(pan.x).fill('x'), ...Array(pan.units).fill('1')];
  const perRow = 7, gap = 4;
  return (
    <g>
      {items.map((t, i) => {
        const row = Math.floor(i / perRow), col = i % perRow;
        const inRow = Math.min(perRow, items.length - row * perRow);
        const w = 22;
        const x = cx - (inRow * (w + gap) - gap) / 2 + col * (w + gap);
        const h = t === 'x' ? 44 : 22;
        const y = baseY - (row + 1) * 48 + (48 - h) - 2;
        return t === 'x'
          ? <g key={i}><rect x={x} y={y} width={w} height={h} rx={6} fill="#0f766e" /><text x={x + w / 2} y={y + h / 2 + 5} textAnchor="middle" fontSize={15} fontStyle="italic" fontWeight={700} fill="#fff">x</text></g>
          : <rect key={i} x={x} y={y} width={w} height={h} rx={5} fill="#f59e0b" stroke="#b45309" strokeWidth={1.5} />;
      })}
    </g>
  );
}

export function BalanceTiles({ config, state, onChange, readOnly, reducedMotion }: InteractiveProps<BalanceTilesConfig, BalanceTilesState>) {
  const tx = useUiText();
  const sides: BalanceSides = { left: state.left, right: state.right };
  const xv = config.xValue;
  const diff = value(sides.right, xv) - value(sides.left, xv);
  const angle = Math.max(-11, Math.min(11, diff * 2.5));
  const rad = (angle * Math.PI) / 180;
  const anim = reducedMotion ? undefined : 'transform 450ms cubic-bezier(.3,1.4,.5,1)';
  const balanced = isBalanced(sides, xv);
  const solved = balanced && isSolved(sides);
  const solvedValue = solved ? (sides.left.x === 1 ? sides.right.units : sides.left.units) : 0;
  const eq = equationText(sides, xv);

  const commit = (next: BalanceSides, event: string) => onChange({ ...next, past: [...state.past, sides] }, event);
  const move = (m: BalanceMove) => commit(applyMove(sides, m), m.type === 'divide' ? `shared both sides into ${m.k}` : m.type === 'removeX' ? 'took an x from both sides' : 'took 1 from both sides');
  const edit = (side: 'left' | 'right', field: 'x' | 'units', d: number) => {
    const pan = { ...sides[side], [field]: sides[side][field] + d };
    commit({ ...sides, [side]: pan }, `${d > 0 ? 'added' : 'removed'} ${field === 'x' ? 'an x' : 'a 1'} ${d > 0 ? 'to' : 'from'} the ${side} pan`);
  };
  const moves = allowedMoves(sides);
  const can = (t: BalanceMove['type']) => moves.find((m) => m.type === t);
  const divide = can('divide') as Extract<BalanceMove, { type: 'divide' }> | undefined;

  const status = solved ? tx('ui.bal.solved', { value: solvedValue }) : balanced ? tx('ui.bal.balanced') : diff < 0 ? tx('ui.bal.tippedLeft') : tx('ui.bal.tippedRight');
  const btn = 'rounded-xl border-2 px-3 py-2 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-35';

  return (
    <div className="select-none rounded-2xl border border-stone-200 bg-white p-3 sm:p-4" dir="ltr">
      <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block w-full max-w-[600px]" role="img" aria-label={tx('ui.bal.aria', { equation: eq })}>
        <path d={`M ${PX - 50} ${H - 12} L ${PX + 50} ${H - 12} L ${PX} ${PY + 6} Z`} fill="#e7e5e4" />
        <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: `${PX}px ${PY}px`, transition: anim }}>
          <line x1={PX - ARM} y1={PY} x2={PX + ARM} y2={PY} stroke="#44403c" strokeWidth={8} strokeLinecap="round" />
        </g>
        {(['left', 'right'] as const).map((side, i) => {
          const d = i === 0 ? -1 : 1;
          const bx = PX + d * ARM, dishY = PY + 120;
          const dx = d * ARM * (Math.cos(rad) - 1), dy = d * ARM * Math.sin(rad);
          return (
            <g key={side} style={{ transform: `translate(${dx}px, ${dy}px)`, transition: anim }}>
              <line x1={bx} y1={PY} x2={bx - 70} y2={dishY} stroke="#a8a29e" strokeWidth={2} />
              <line x1={bx} y1={PY} x2={bx + 70} y2={dishY} stroke="#a8a29e" strokeWidth={2} />
              <path d={`M ${bx - 95} ${dishY} Q ${bx} ${dishY + 26} ${bx + 95} ${dishY}`} fill="#d6d3d1" stroke="#78716c" strokeWidth={3} />
              <Tiles pan={sides[side]} cx={bx} baseY={dishY + 4} />
            </g>
          );
        })}
        <circle cx={PX} cy={PY} r={9} fill="#44403c" />
      </svg>

      {config.showEquation && (
        <div className="mt-1 text-center font-mono text-2xl font-bold tracking-wide text-stone-900" data-testid="balance-equation">{eq}</div>
      )}
      <div role="status" aria-live="polite"
           className={cn('mx-auto mt-2 w-fit rounded-full px-3 py-1 text-sm font-semibold', solved ? 'bg-teal-100 text-teal-900' : balanced ? 'bg-stone-100 text-stone-700' : 'bg-amber-100 text-amber-900')}>
        {status}
      </div>

      {!readOnly && config.mode === 'free' && (
        <div className="mt-3 flex flex-wrap justify-center gap-6">
          {config.editable.map((side) => (
            <div key={side} className="flex items-center gap-2">
              <span className="text-sm font-semibold text-stone-600">{tx(side === 'left' ? 'ui.bal.leftPan' : 'ui.bal.rightPan')}</span>
              <button type="button" className={cn(btn, 'border-amber-300 text-amber-900 hover:bg-amber-50')} aria-label={tx('ui.bal.addUnit', { side: tx(`ui.bal.${side}`) })}
                      disabled={sides[side].units >= config.maxUnits} onClick={() => edit(side, 'units', 1)}>+1</button>
              <button type="button" className={cn(btn, 'border-amber-300 text-amber-900 hover:bg-amber-50')} aria-label={tx('ui.bal.removeUnit', { side: tx(`ui.bal.${side}`) })}
                      disabled={sides[side].units <= config[side].units} onClick={() => edit(side, 'units', -1)}>−1</button>
              {config.allowX && (
                <>
                  <button type="button" className={cn(btn, 'border-teal-300 text-teal-900 hover:bg-teal-50')} aria-label={tx('ui.bal.addX', { side: tx(`ui.bal.${side}`) })}
                          disabled={sides[side].x >= 8} onClick={() => edit(side, 'x', 1)}>+x</button>
                  <button type="button" className={cn(btn, 'border-teal-300 text-teal-900 hover:bg-teal-50')} aria-label={tx('ui.bal.removeX', { side: tx(`ui.bal.${side}`) })}
                          disabled={sides[side].x <= config[side].x} onClick={() => edit(side, 'x', -1)}>−x</button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
      {!readOnly && config.mode === 'moves' && (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <button type="button" className={cn(btn, 'border-amber-300 text-amber-900 hover:bg-amber-50')} disabled={!can('removeUnit')} onClick={() => move({ type: 'removeUnit' })}>{tx('ui.bal.moveUnit')}</button>
          <button type="button" className={cn(btn, 'border-teal-300 text-teal-900 hover:bg-teal-50')} disabled={!can('removeX')} onClick={() => move({ type: 'removeX' })}>{tx('ui.bal.moveX')}</button>
          <button type="button" className={cn(btn, 'border-violet-300 text-violet-900 hover:bg-violet-50')} disabled={!divide} onClick={() => divide && move(divide)}>
            {divide ? tx('ui.bal.moveDivide', { k: divide.k }) : tx('ui.bal.moveDivideOff')}
          </button>
        </div>
      )}
      {!readOnly && (
        <div className="mt-2 flex justify-center gap-3 text-sm">
          <button type="button" className="font-semibold text-stone-500 hover:text-stone-800 disabled:opacity-35" disabled={!state.past.length}
                  onClick={() => onChange({ ...state.past[state.past.length - 1], past: state.past.slice(0, -1) }, 'undid a move')}>{tx('ui.bal.undo')}</button>
          <button type="button" className="font-semibold text-stone-500 hover:text-stone-800 disabled:opacity-35" disabled={!state.past.length}
                  onClick={() => onChange({ left: { ...config.left }, right: { ...config.right }, past: [] }, 'started again')}>{tx('ui.bal.reset')}</button>
        </div>
      )}
    </div>
  );
}
