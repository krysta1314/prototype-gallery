import { resolveStatus } from './store';
import type { Campaign } from './types';
import type { PromoEffect } from '../../../(v1.6)/pricing/_src/lib/pricing/promo-context';

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
      // 浅拷贝：effect 里的数组不能是活动源数据的别名，否则消费端就地改动会污染 localStorage 数据
      effect.bonusPlans = [...c.rule.plans];
    }
    if (c.rule.kind === 'discount' && !hasDiscount) {
      hasDiscount = true;
      effect.discountPercent = c.rule.percent;
      effect.discountPlans = [...c.rule.plans];
      effect.discountBilling = c.rule.billing;
    }
    if (c.rule.kind === 'unlock' && !hasUnlock) {
      hasUnlock = true;
      effect.unlockModels = [...c.rule.models];
      effect.unlockPlans = [...c.rule.forPlans];
    }
    // promo_code 本期不影响 client 端展示
  }

  if (!hasBonus && !hasDiscount && !hasUnlock) return null;
  return effect;
}

// 注意：不能用 [...liveCampaigns(...)].reverse() —— liveCampaigns() 按 startAt 升序做的是稳定排序，
// 遇到 startAt 完全相同（例如运营新建的活动恰好也选了跟旧活动一样的开始日期）时，同 key 元素会保留
// 原始 campaigns 数组的相对顺序；对升序结果整体 reverse() 会把这部分「同 key 时的原始顺序」也一起
// 倒过来，导致新建的活动（admin 里 unshift 到数组最前面）反而排到旧活动后面。
// 这里直接对原始 campaigns 数组按 startAt 降序稳定排序：非同 key 部分按时间新→旧，同 key 时保留
// 数组原始顺序（新建/复制的活动通过 unshift 排在数组前面，天然「更新」），两种情况下新活动都会赢。
function liveCampaignsByRecency(campaigns: Campaign[], now: number): Campaign[] {
  return campaigns
    .filter(c => resolveStatus(c, now) === 'live')
    .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
}

/** 弹窗取最近开始的 popup.enabled 的 live 活动 */
export function popupCampaign(campaigns: Campaign[], now: number): Campaign | null {
  return liveCampaignsByRecency(campaigns, now).find(c => c.popup.enabled) ?? null;
}

/** 横幅取最近开始的 pricingBanner.enabled 的 live 活动 */
export function bannerCampaign(campaigns: Campaign[], now: number): Campaign | null {
  return liveCampaignsByRecency(campaigns, now).find(c => c.pricingBanner.enabled) ?? null;
}
