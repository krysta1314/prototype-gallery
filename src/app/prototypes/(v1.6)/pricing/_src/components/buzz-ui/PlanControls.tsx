'use client';

import { Switch } from '../../components/ui/switch';
import type { BillingCycle } from '../../lib/pricing/pricing';
import type { PlanGroup } from '../../lib/pricing/business';

interface PlanControlsProps {
  group: PlanGroup;
  onGroupChange: (g: PlanGroup) => void;
  cycle: BillingCycle;
  onCycleChange: (c: BillingCycle) => void;
  /** Annual 后面的折扣徽章，Business 组用 "UP TO 30% OFF" */
  savingLabel?: string;
}

const GROUPS: { value: PlanGroup; label: string }[] = [
  { value: 'individual', label: 'Individual plans' },
  { value: 'business', label: 'Business plans' },
];

/**
 * 套餐区控制条：左边 Individual / Business 分段切换，
 * 右边描边容器里的 Monthly / Annual 开关。
 * 只有 v1.5 用（v1.2 – v1.4 仍是居中的 BillingToggle）。
 */
export function PlanControls({
  group,
  onGroupChange,
  cycle,
  onCycleChange,
  savingLabel = '30% OFF',
}: PlanControlsProps) {
  const isAnnual = cycle === 'yearly';

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 text-left">
      <div
        role="tablist"
        aria-label="Plan group"
        className="inline-flex gap-1 rounded-xl border border-neutral-200 bg-neutral-100 p-1"
      >
        {GROUPS.map(g => {
          const active = g.value === group;
          return (
            <button
              key={g.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onGroupChange(g.value)}
              className={`whitespace-nowrap rounded-[9px] px-4 py-2 text-[13px] font-semibold transition-colors ${
                active ? 'bg-[#0a0a0a] text-white' : 'text-neutral-500 hover:text-[#0a0a0a]'
              }`}
            >
              {g.label}
            </button>
          );
        })}
      </div>

      <div className="inline-flex items-center gap-3.5 rounded-xl border border-neutral-200 px-4 py-2.5">
        <span
          className={`text-[14px] font-medium transition-colors ${
            isAnnual ? 'text-neutral-500' : 'text-[#0a0a0a]'
          }`}
        >
          Monthly
        </span>
        <Switch
          checked={isAnnual}
          onCheckedChange={checked => onCycleChange(checked ? 'yearly' : 'monthly')}
          aria-label="Bill annually"
          // `!` 是必需的：shadcn Switch 用 data-[size=…] 变体设尺寸，优先级高于普通工具类
          className="h-6! w-11! px-0.5 data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-neutral-300 [&>span]:size-5!"
        />
        <span
          className={`text-[14px] font-medium transition-colors ${
            isAnnual ? 'text-[#0a0a0a]' : 'text-neutral-500'
          }`}
        >
          Annual
          <span className="ml-2 inline-block rounded-full bg-emerald-600 px-2 py-[3px] align-middle text-[11px] font-extrabold tracking-wide text-white">
            {savingLabel}
          </span>
        </span>
      </div>
    </div>
  );
}
