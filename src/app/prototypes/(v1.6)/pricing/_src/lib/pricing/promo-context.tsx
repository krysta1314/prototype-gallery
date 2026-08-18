'use client';

import { createContext, useContext } from 'react';
import type { BillingCycle, PlanId } from './pricing';

export type PromoEffect = {
  /** 0 表示无加赠 */
  bonusPercent: number;
  bonusPlans: PlanId[];
  /** 0 表示无折扣 */
  discountPercent: number;
  discountPlans: PlanId[];
  discountBilling: 'monthly' | 'yearly' | 'both';
  /** 被临时解锁的模型行名（与 Compare 表 row.label 一致） */
  unlockModels: string[];
  unlockPlans: PlanId[];
};

const PromoContext = createContext<PromoEffect | null>(null);

export function PromoProvider({
  value,
  children,
}: {
  value: PromoEffect | null;
  children: React.ReactNode;
}) {
  return <PromoContext.Provider value={value}>{children}</PromoContext.Provider>;
}

/** 不包 Provider 时返回 null —— 现有 /prototypes/pricing 行为完全不变 */
export function usePromo(): PromoEffect | null {
  return useContext(PromoContext);
}

export function bonusMultiplier(effect: PromoEffect | null, planId: PlanId): number {
  if (!effect || effect.bonusPercent <= 0) return 1;
  if (!effect.bonusPlans.includes(planId)) return 1;
  return 1 + effect.bonusPercent / 100;
}

export function discountMultiplier(
  effect: PromoEffect | null,
  planId: PlanId,
  cycle: BillingCycle,
): number {
  if (!effect || effect.discountPercent <= 0) return 1;
  if (!effect.discountPlans.includes(planId)) return 1;
  if (effect.discountBilling !== 'both' && effect.discountBilling !== cycle) return 1;
  return 1 - effect.discountPercent / 100;
}

export function isUnlocked(
  effect: PromoEffect | null,
  modelLabel: string,
  planId: PlanId,
): boolean {
  if (!effect) return false;
  return effect.unlockModels.includes(modelLabel) && effect.unlockPlans.includes(planId);
}
