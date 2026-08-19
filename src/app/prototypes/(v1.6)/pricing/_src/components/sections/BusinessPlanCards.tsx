'use client';

import { BUSINESS_PLANS, BUSINESS_PLAN_ORDER, type BusinessPlanId } from '../../lib/pricing/business';
import type { BillingCycle } from '../../lib/pricing/pricing';
import { BusinessPlanCard } from './BusinessPlanCard';

export type SeatMap = Record<BusinessPlanId, number>;

interface BusinessPlanCardsProps {
  cycle: BillingCycle;
  seats: SeatMap;
  onSeatsChange: (plan: BusinessPlanId, n: number) => void;
  /** 当前团队所在档位;'none' = 还没有团队 */
  currentPlan?: 'none' | BusinessPlanId;
}

export function BusinessPlanCards({ cycle, seats, onSeatsChange, currentPlan = 'none' }: BusinessPlanCardsProps) {
  return (
    <>
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 items-start">
        {BUSINESS_PLAN_ORDER.map(planId => (
          <BusinessPlanCard
            key={planId}
            plan={BUSINESS_PLANS[planId]}
            cycle={cycle}
            seats={seats[planId]}
            onSeatsChange={n => onSeatsChange(planId, n)}
            currentPlan={currentPlan}
          />
        ))}
      </section>
      <ul className="text-[11px] text-neutral-500 mt-5 max-w-[920px] leading-relaxed list-disc pl-4 space-y-1">
        <li>Credits are fixed per seat on Team and Scale — they are not pooled and cannot be moved between people. Enterprise runs on a shared pool that admins allocate per member.</li>
        <li>Credits are issued monthly on all plans, whether billed monthly or annually, and reset at the beginning of each monthly cycle.</li>
        <li>Seats can be added at any time — new seats are billed pro rata for the rest of the cycle.</li>
      </ul>
    </>
  );
}
