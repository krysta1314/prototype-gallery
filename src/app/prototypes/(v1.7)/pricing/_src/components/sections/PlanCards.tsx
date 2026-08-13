import { PAID_PLAN_ORDER } from '../../lib/pricing/pricing';
import type { RegionState } from '../../hooks/usePricingState';
import type { UserRole } from '../../hooks/useUserRole';
import { FreePlanCard, PaidPlanCard } from './PlanCard';
import { AutoUpgradeToggle } from '../../components/buzz-ui/AutoUpgradeToggle';

interface PlanCardsProps {
  region: RegionState;
  role: UserRole;
  /** 是否显示自动升级开关（v1.4 起引入，v1.2 / v1.3 不显示） */
  showAutoUpgrade?: boolean;
  /** Free 卡 CTA 下方显示 "No credit card required"（v1.5 起） */
  showNoCardNote?: boolean;
  /** 卡片区下方的说明条目。不传则用 v1.2 – v1.4 的原文案 */
  notes?: string[];
  /** 额度一律按月展示（v1.5 起：年付也是每月发放、每月清零） */
  monthlyCredits?: boolean;
}

const DEFAULT_NOTES = [
  'Yearly plans deliver all credits upfront.',
  'Credits reset at the beginning of each billing cycle.',
];

export function PlanCards({
  region,
  role,
  showAutoUpgrade = false,
  showNoCardNote = false,
  notes = DEFAULT_NOTES,
  monthlyCredits = false,
}: PlanCardsProps) {
  const isSubscribed = role !== 'free';

  return (
    <>
      <section
        className={
          'grid grid-cols-1 sm:grid-cols-2 gap-5 items-start ' +
          (isSubscribed ? 'xl:grid-cols-3' : 'xl:grid-cols-4')
        }
      >
        {!isSubscribed && <FreePlanCard showNoCardNote={showNoCardNote} />}
        {PAID_PLAN_ORDER.map(planId => (
          <PaidPlanCard
            key={planId}
            planId={planId}
            cycle={region.cycle}
            scale={region.scales[planId]}
            onScaleChange={(s) => region.setScale(planId, s)}
            currentRole={role}
            monthlyCredits={monthlyCredits}
          />
        ))}
      </section>
      <ul className="text-[11px] text-neutral-500 mt-5 max-w-[920px] leading-relaxed list-disc pl-4 space-y-1">
        {notes.map(note => (
          <li key={note}>{note}</li>
        ))}
      </ul>
      {showAutoUpgrade && <AutoUpgradeToggle />}
    </>
  );
}
