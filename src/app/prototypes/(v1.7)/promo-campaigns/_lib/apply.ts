import { resolveStatus } from './store';
import { offerOn } from './types';
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


/* 同时段多个弹窗 live 时只能弹一个:先按优先级(1 最高,数字越小越优先),优先级相同再按开始时间,最新的赢。
   这里不能用 [...].reverse() —— 稳定排序下会把「同 key 时的原始顺序」也一起倒过来,
   导致新建的弹窗(admin 里 unshift 到数组最前面)反而排到旧弹窗后面。 */
function livePopupsByPriority(campaigns: Campaign[], now: number): Campaign[] {
  return campaigns
    .filter(c => resolveStatus(c, now) === 'live')
    .sort((a, b) => a.priority - b.priority || new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
}

/** 同时段所有 live 且开了弹窗的记录,按生效顺序排。首页据此做「这次弹哪个」的轮转。 */
export function popupQueue(campaigns: Campaign[], now: number): Campaign[] {
  return livePopupsByPriority(campaigns, now).filter(c => c.popup.enabled);
}

/** 单个活动 → 定价页效果。用于后台「在客户端看这一个」的强制预览,绕过状态与优先级。 */
export function effectFromCampaign(c: Campaign): PromoEffect | null {
  if (!offerOn(c) || c.rule.kind !== 'bonus_credits') return null;
  return { ...EMPTY, bonusPercent: c.rule.percent, bonusPlans: [...c.rule.plans] };
}

/** live 活动 → 定价页展示效果。没有任何生效活动时返回 null。 */
export function buildPromoEffect(campaigns: Campaign[], now: number): PromoEffect | null {
  // 必须和 banner / 弹窗取同一个活动:两边排序方向不一致时,会出现「横幅写 35%、套餐卡按 50% 算」
  // 这种自相矛盾的画面(多个加赠活动同时 live 时必然发生)。
  // 价格与额度只看「Offer 段有没有启用」,不看弹窗类型 —— 类型只是默认值
  const live = livePopupsByPriority(campaigns, now).filter(offerOn);
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

/** 首页这次弹哪个:队列头部 */
export function popupCampaign(campaigns: Campaign[], now: number): Campaign | null {
  return popupQueue(campaigns, now)[0] ?? null;
}

/** 定价页横幅:取优先级最高且开了横幅的那条 */
export function bannerCampaign(campaigns: Campaign[], now: number): Campaign | null {
  return livePopupsByPriority(campaigns, now).find(c => c.pricingBanner.enabled) ?? null;
}
