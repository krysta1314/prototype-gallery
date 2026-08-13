'use client';

import type { AccessValue } from '../../lib/pricing/features-v2';
import type { PlanId } from '../../lib/pricing/pricing';
import { Tag } from '../../components/buzz-ui/Tag';
import { useFeatureSections } from '../../lib/pricing/features-context';
import { cn } from '../../lib/utils';

interface FeatureMatrixProps {
  planId: PlanId;
}

export function FeatureMatrix({ planId }: FeatureMatrixProps) {
  const sections = useFeatureSections();
  return (
    <div className="flex flex-col gap-5">
      {sections.map(section => (
        <div key={section.title}>
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#0a0a0a] mb-3">
            {section.title}
          </div>
          <ul className="flex flex-col gap-2">
            {section.rows.map(row => {
              const value = row.values[planId];
              const disabled = value.kind === 'no';
              return (
                <li
                  key={row.label}
                  className={`flex items-start gap-2 text-[12px] leading-snug ${disabled ? 'text-neutral-400' : ''}`}
                >
                  <span className={`flex-1 min-w-0 ${disabled ? 'text-neutral-400' : 'text-neutral-800'}`}>
                    {row.label}
                  </span>
                  <span className="flex-shrink-0 flex justify-end items-start">
                    <Value value={value} />
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function emphasizeDigits(s: string) {
  const parts = s.split(/(\d+)/);
  return (
    <span>
      {parts.map((p, i) =>
        /^\d+$/.test(p)
          ? <span key={i} className="font-bold text-[13px]">{p}</span>
          : p
      )}
    </span>
  );
}

export const SPEED_TAG_STYLES: Record<string, string> = {
  'Standard': 'bg-sky-100 text-[#0a0a0a]',
  'Fast':     'bg-[#99E22F] text-[#0a0a0a]',
};

export function SpeedBadge({ label }: { label: string }) {
  const style = SPEED_TAG_STYLES[label];
  return (
    <span className={cn('inline-flex items-center px-1.5 py-[2px] rounded text-[10px] font-semibold leading-tight whitespace-nowrap', style)}>
      {label}
    </span>
  );
}

function Value({ value }: { value: AccessValue }) {
  switch (value.kind) {
    case 'yes':
      return <span aria-label="included" className="text-emerald-600 font-bold text-[14px] leading-none">✓</span>;
    case 'no':
      return <span aria-label="not included" className="text-neutral-300 font-bold text-[13px] leading-none">✗</span>;
    case 'value': {
      if (SPEED_TAG_STYLES[value.label]) {
        return <SpeedBadge label={value.label} />;
      }
      const isUnlimited = value.label === 'Unlimited';
      // 只在字符串包含字母 + 数字混合时加粗数字（如 "Up to 4"），纯数字（如 "10"）不强调
      const hasMixedDigits = /\d/.test(value.label) && /[A-Za-z]/.test(value.label);
      return (
        <Tag variant={isUnlimited ? 'unlimited' : 'count'}>
          {hasMixedDigits ? emphasizeDigits(value.label) : value.label}
        </Tag>
      );
    }
    case 'full':
      return <Tag variant="unlimited">Unlimited</Tag>;
  }
}
