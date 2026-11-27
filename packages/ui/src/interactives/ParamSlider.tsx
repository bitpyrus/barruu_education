import { useId, useRef } from 'react';

interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  disabled?: boolean;
  onChange: (v: number) => void;
}

const decimals = (step: number) => Math.max(0, Math.min(4, -Math.floor(Math.log10(step))));

/** Labelled slider with a numeric readout. Keyboard accessible via the native range input. */
export function ParamSlider({ label, value, min, max, step, unit, disabled, onChange }: Props) {
  const id = useId();
  const last = useRef(value);
  const d = decimals(step);
  const emit = (v: number) => {
    const rounded = Number(v.toFixed(d));
    if (rounded !== last.current) { last.current = rounded; onChange(rounded); }
  };
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-slate-700">{label}</label>
        <span className="text-sm font-mono tabular-nums text-violet-700">{value.toFixed(d)}{unit ? ` ${unit}` : ''}</span>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} disabled={disabled}
             onChange={(e) => emit(parseFloat(e.target.value))}
             className="w-full accent-violet-600 h-2 cursor-pointer disabled:cursor-not-allowed" />
    </div>
  );
}
