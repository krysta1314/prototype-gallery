import { FAKE_SUBSCRIPTION, PAID_PLANS, type PaidPlanId } from '../../lib/pricing/pricing';

interface SubscriptionStatusCardProps {
  role: PaidPlanId;
}

/**
 * Hero-area status card — shown to subscribed users above the toggle.
 * Replaces the previous "pill" treatment with a more substantial card.
 */
export function SubscriptionStatusCard({ role }: SubscriptionStatusCardProps) {
  const plan = PAID_PLANS[role];
  const sub = FAKE_SUBSCRIPTION[role];

  return (
    <div
      role="status"
      className="mt-6 mx-auto max-w-[480px] bg-white border border-neutral-200 rounded-xl shadow-sm px-5 py-4 text-left"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-[14px] mt-0.5"
        >
          ✓
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-semibold text-[#0a0a0a] leading-tight">
            You&rsquo;re on the {plan.name} plan
          </div>
          <div className="mt-1 text-[13px] text-neutral-500 leading-snug">
            Renews <span className="text-neutral-700 font-medium">{sub.nextChargeDate}</span> · {sub.nextChargeAmount} billed annually
          </div>
        </div>
      </div>
    </div>
  );
}
