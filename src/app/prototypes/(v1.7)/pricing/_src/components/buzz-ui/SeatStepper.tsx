'use client';

import { Minus, Plus } from 'lucide-react';
import type { SeatRange } from '../../lib/pricing/business';

interface SeatStepperProps {
  value: number;
  onChange: (next: number) => void;
  range: SeatRange;
  ariaLabel: string;
}

export function SeatStepper({ value, onChange, range, ariaLabel }: SeatStepperProps) {
  const dec = () => onChange(Math.max(range.min, value - 1));
  const inc = () => onChange(Math.min(range.max, value + 1));
  const atMin = value <= range.min;
  const atMax = value >= range.max;

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[12px] font-medium text-neutral-700">Seats</span>
      <div className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white p-1">
        <StepButton onClick={dec} disabled={atMin} label={`Remove a seat from ${ariaLabel}`}>
          <Minus className="w-3.5 h-3.5" />
        </StepButton>
        <input
          type="number"
          value={value}
          min={range.min}
          max={range.max}
          aria-label={`${ariaLabel} seats`}
          onChange={e => {
            const n = Number(e.target.value);
            if (Number.isNaN(n)) return;
            onChange(Math.min(range.max, Math.max(range.min, Math.round(n))));
          }}
          className="w-10 text-center text-[14px] font-bold text-[#0a0a0a] bg-transparent outline-none
            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <StepButton onClick={inc} disabled={atMax} label={`Add a seat to ${ariaLabel}`}>
          <Plus className="w-3.5 h-3.5" />
        </StepButton>
      </div>
    </div>
  );
}

function StepButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="w-6 h-6 rounded-md flex items-center justify-center transition-colors
        text-neutral-700 hover:bg-neutral-100 disabled:text-neutral-300 disabled:hover:bg-transparent disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}
