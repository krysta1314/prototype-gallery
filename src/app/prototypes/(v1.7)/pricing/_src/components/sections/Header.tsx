'use client';

import { BillingToggle } from '../../components/buzz-ui/BillingToggle';
import { PlanControls } from '../../components/buzz-ui/PlanControls';
import { SubscriptionStatusCard } from './SubscriptionStatusCard';
import type { BillingCycle } from '../../lib/pricing/pricing';
import type { PlanGroup } from '../../lib/pricing/business';
import type { UserRole } from '../../hooks/useUserRole';

interface HeaderProps {
  cycle: BillingCycle;
  onCycleChange: (c: BillingCycle) => void;
  role: UserRole;
  /** v1.5 起：Individual / Business 切换。不传则不渲染（v1.2 – v1.4 行为不变） */
  group?: PlanGroup;
  onGroupChange?: (g: PlanGroup) => void;
  /** Yearly 标签上的折扣文案，Business 组用 "UP TO 30% OFF" */
  savingLabel?: string;
  /** 页面主标题。只在没有 group 切换时生效（v1.2 – v1.4） */
  title?: string;
}

/**
 * 带 Individual / Business 切换时，标题和副标题跟着 tab 走。
 * 两个标题都以 "AI Ad Generator" + "Pricing" 开头，保证不管落在哪个 tab
 * 搜索引擎抓到的都是同一组核心关键词；business 再补 "Teams & Agencies"。
 */
const GROUP_TITLE: Record<PlanGroup, string> = {
  individual: 'AI Ad Generator Pricing & Plans',
  business: 'AI Ad Generator Pricing for Teams & Agencies',
};

const SUBTITLE: Record<PlanGroup, string> = {
  individual: 'Scale creativity with higher limits, priority access, and early features',
  business:
    'Per-seat plans for marketing teams and agencies. One shared credit pool, shared brand assets, and a single invoice.',
};

export function Header({
  cycle,
  onCycleChange,
  role,
  group,
  onGroupChange,
  savingLabel,
  title = 'Choose a plan that fits your needs',
}: HeaderProps) {
  const isPaid = role !== 'free';
  const hasGroups = group !== undefined && onGroupChange !== undefined;
  const heading = hasGroups ? GROUP_TITLE[group] : title;
  return (
    <header className={`text-center ${hasGroups ? 'mb-6' : 'mb-10 sm:mb-14'}`}>
      <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-bold tracking-tight text-balance">
        {heading}
      </h1>
      <p className="mt-3 text-base text-neutral-500 max-w-2xl mx-auto text-balance">
        {SUBTITLE[group ?? 'individual']}
      </p>
      {isPaid && <SubscriptionStatusCard role={role} />}
      {hasGroups ? (
        <div className="mt-7">
          <PlanControls
            group={group}
            onGroupChange={onGroupChange}
            cycle={cycle}
            onCycleChange={onCycleChange}
            savingLabel={savingLabel}
          />
        </div>
      ) : (
        <div className="mt-7 inline-flex">
          <BillingToggle
            value={cycle}
            onChange={onCycleChange}
            ariaLabel="Plan cards billing cycle"
            savingLabel={savingLabel}
          />
        </div>
      )}
    </header>
  );
}
