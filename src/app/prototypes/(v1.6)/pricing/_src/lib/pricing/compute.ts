import {
  PAID_PLANS,
  MODEL_BY_ID,
  SCALE_DISCOUNTS,
  type BillingCycle,
  type ModelId,
  type PaidPlanId,
  type PlanId,
  type Scale,
} from '../../lib/pricing/pricing';

export interface PriceBreakdown {
  /** Retail reference: base monthly × scale, no discounts. Used for the strike-through. */
  referencePrice: number;
  /** Monthly equivalent with bulk discount applied. Used for "Save $X compared to monthly". */
  monthlyPrice: number;
  /** Headline price displayed per "/ mo". */
  displayPrice: number;
  /** Annual total (only meaningful in yearly state). */
  annualTotal: number;
}

export function computePrice(planId: PaidPlanId, scale: Scale, cycle: BillingCycle): PriceBreakdown {
  const p = PAID_PLANS[planId];
  // Cycle-specific bulk discount(monthly 比 yearly bulk 大,因为 yearly 已经叠加 30% 周期折扣)
  const bulkMultiplier = 1 - SCALE_DISCOUNTS[cycle][scale];
  // monthlyPrice 用 monthly bulk 算(用于 Save / Compare to monthly 文案)
  const monthlyBulkMultiplier = 1 - SCALE_DISCOUNTS.monthly[scale];
  const referencePrice = p.baseMonthlyPrice * scale;
  const monthlyPrice = referencePrice * monthlyBulkMultiplier;
  if (cycle === 'monthly') {
    return { referencePrice, monthlyPrice, displayPrice: monthlyPrice, annualTotal: monthlyPrice * 12 };
  }
  return {
    referencePrice,
    monthlyPrice,
    displayPrice: p.baseYearlyMonthlyPrice * scale * bulkMultiplier,
    annualTotal: p.baseYearlyAnnualTotal * scale * bulkMultiplier,
  };
}

/** Credits available in this billing cycle for a paid plan */
export function computeCredits(planId: PaidPlanId, scale: Scale, cycle: BillingCycle): number {
  const base = PAID_PLANS[planId].baseMonthlyCredits * scale;
  return cycle === 'monthly' ? base : base * 12;
}

/** Compare table cell: how many generations of a given model can be produced */
export function computeGenerations(credits: number, modelId: ModelId): number {
  return Math.floor(credits / MODEL_BY_ID[modelId].pricePerUnit);
}

/** Credits available in Plan Cards for any plan (free returns one-time amount) */
export function computeCreditsForPlan(
  planId: PlanId,
  scaleOrUndefined: Scale | undefined,
  cycle: BillingCycle,
  freeOneTimeCredits: number,
): { credits: number; isOneTime: boolean } {
  if (planId === 'free') return { credits: freeOneTimeCredits, isOneTime: true };
  return { credits: computeCredits(planId, scaleOrUndefined ?? 1, cycle), isOneTime: false };
}
