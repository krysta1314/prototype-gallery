import { resolveStatus } from './store';
import type { Campaign } from './types';
import type { PromoEffect } from '../../pricing/_src/lib/pricing/promo-context';

const EMPTY: PromoEffect = {
  bonusPercent: 0,
  bonusPlans: [],
  discountPercent: 0,
  discountPlans: [],
  discountBilling: 'both',
  unlockModels: [],
  unlockPlans: [],
};

export function liveCampaigns(campaigns: Campaign[], now: number): Campaign[] {
  return campaigns
    .filter(c => resolveStatus(c, now) === 'live')
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
}

/** live 活动 → 定价页展示效果。没有任何生效活动时返回 null。 */
export function buildPromoEffect(campaigns: Campaign[], now: number): PromoEffect | null {
  const live = liveCampaigns(campaigns, now);
  if (live.length === 0) return null;

  const effect: PromoEffect = { ...EMPTY, bonusPlans: [], discountPlans: [], unlockModels: [], unlockPlans: [] };
  let hasBonus = false;
  let hasDiscount = false;
  let hasUnlock = false;

  for (const c of live) {
    if (c.rule.kind === 'bonus_credits' && !hasBonus) {
      hasBonus = true;
      effect.bonusPercent = c.rule.percent;
      effect.bonusPlans = c.rule.plans;
    }
    if (c.rule.kind === 'discount' && !hasDiscount) {
      hasDiscount = true;
      effect.discountPercent = c.rule.percent;
      effect.discountPlans = c.rule.plans;
      effect.discountBilling = c.rule.billing;
    }
    if (c.rule.kind === 'unlock' && !hasUnlock) {
      hasUnlock = true;
      effect.unlockModels = c.rule.models;
      effect.unlockPlans = c.rule.forPlans;
    }
    // promo_code 本期不影响 client 端展示
  }

  if (!hasBonus && !hasDiscount && !hasUnlock) return null;
  return effect;
}

/** 弹窗只取第一条 popup.enabled 的 live 活动 */
export function popupCampaign(campaigns: Campaign[], now: number): Campaign | null {
  return liveCampaigns(campaigns, now).find(c => c.popup.enabled) ?? null;
}

/** 横幅取第一条 pricingBanner.enabled 的 live 活动 */
export function bannerCampaign(campaigns: Campaign[], now: number): Campaign | null {
  return liveCampaigns(campaigns, now).find(c => c.pricingBanner.enabled) ?? null;
}
