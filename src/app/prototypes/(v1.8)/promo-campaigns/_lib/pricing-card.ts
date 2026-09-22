import type { Campaign, PricingCardConfig } from './types';

export const BLANK_PRICING_CARD: PricingCardConfig = {
  tag: '',
  headline: '',
  subheadline: '',
  note: '',
  ctaText: '',
  ctaHref: '',
};

/* 渲染用:只返回运营填了什么,不做任何推导兜底。
   空字段渲染成空 —— 预览必须显示用户真正会看到的东西,
   拿推导文案顶上去会让运营以为已经配好了。 */
export function pricingCardOf(c: Campaign): PricingCardConfig {
  const cfg = c.pricingCard;
  return {
    tag: cfg?.tag?.trim() ?? '',
    headline: cfg?.headline?.trim() ?? '',
    subheadline: cfg?.subheadline?.trim() ?? '',
    note: cfg?.note?.trim() ?? '',
    ctaText: cfg?.ctaText?.trim() ?? '',
    ctaHref: cfg?.ctaHref?.trim() ?? '',
  };
}

/** 卡里一个字都没配时不渲染这张卡,不留一块空的深色方块 */
export function hasPricingCardCopy(c: Campaign): boolean {
  const v = pricingCardOf(c);
  return Boolean(v.tag || v.headline || v.subheadline || v.note || v.ctaText);
}

/* 后台输入框的 placeholder:按活动数据给一版建议文案。
   只是提示,不会被渲染到客户端 —— 运营不填就是不显示。 */
export function pricingCardHints(c: Campaign): PricingCardConfig {
  const percent = c.rule.kind === 'bonus_credits' ? c.rule.percent : 0;
  const plans = c.rule.kind === 'bonus_credits' ? c.rule.plans : [];
  const scope =
    plans.length >= 3
      ? 'On every paid plan'
      : plans.length > 0
        ? `On ${plans.map(p => p[0].toUpperCase() + p.slice(1)).join(' and ')}`
        : 'On every paid plan';
  const ends = c.endAt
    ? new Date(c.endAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '';

  return {
    tag: 'Extra credits',
    headline: `+${percent}% extra credits on every purchase`,
    subheadline: scope,
    note: `Credits land right after payment and never expire${ends ? ` · Ends ${ends}` : ''}`,
    ctaText: 'Claim bonus credits',
    ctaHref: '#plans',
  };
}
