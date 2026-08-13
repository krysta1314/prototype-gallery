'use client';

import type { BillingCycle } from '../../lib/pricing/pricing';
import { Badge } from './Badge';

interface BillingToggleProps {
  value: BillingCycle;
  onChange: (next: BillingCycle) => void;
  /** Accessibility label distinguishing toggles when more than one is on the page */
  ariaLabel: string;
  /** Pill copy on the Yearly tab. Business plans discount differently (v1.5). */
  savingLabel?: string;
}

export function BillingToggle({ value, onChange, ariaLabel, savingLabel = '30% OFF' }: BillingToggleProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="inline-flex bg-neutral-100 rounded-full p-1 gap-1"
    >
      {(['monthly', 'yearly'] as const).map(cycle => {
        const active = value === cycle;
        return (
          <button
            key={cycle}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(cycle)}
            className={`px-4 py-2 rounded-full text-[13px] font-medium transition-colors whitespace-nowrap ${
              active ? 'bg-[#0a0a0a] text-white' : 'text-neutral-600 hover:text-[#0a0a0a]'
            }`}
          >
            {cycle === 'monthly' ? 'Monthly' : 'Yearly'}
            {cycle === 'yearly' && <Badge variant="pill">{savingLabel}</Badge>}
          </button>
        );
      })}
    </div>
  );
}
