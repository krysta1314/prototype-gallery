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
  /*
   * 年费 = 「取整后的月价」× 12,不是「真实月价 × 12」。
   *
   * 2026-08-25 确认的计费口径:我们收的就是页面上印出来的那个数。
   * Pro 年付展示 $35/mo,实收 $35 × 12 = $420 —— 不是 34.3 × 12 = $411.60。
   *
   * 之前存了一个 baseYearlyAnnualTotal(411.6)当年费,等于「按真实价收、按取整价展示」,
   * 于是用户拿页面上的 $35 乘 12 会算出 $420,和实收对不上,评审时就有人这么算错过。
   * 现在展示与实收同一个数,乘 12 谁都能验算。
   */
  if (cycle === 'monthly') {
    return { referencePrice, monthlyPrice, displayPrice: monthlyPrice, annualTotal: Math.ceil(monthlyPrice) * 12 };
  }
  const yearlyDisplay = p.baseYearlyMonthlyPrice * scale * bulkMultiplier;
  return {
    referencePrice,
    monthlyPrice,
    displayPrice: yearlyDisplay,
    annualTotal: Math.ceil(yearlyDisplay) * 12,
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
