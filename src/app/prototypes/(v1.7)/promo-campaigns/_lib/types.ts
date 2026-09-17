import type { PlanId } from '../../../(v1.6)/pricing/_src/lib/pricing/pricing';

export type { PlanId };

export type CampaignType = 'bonus_credits' | 'discount' | 'unlock' | 'promo_code';
export type CampaignStatus = 'draft' | 'scheduled' | 'live' | 'ended';

export type CampaignRule =
  | { kind: 'bonus_credits'; percent: number; plans: PlanId[]; includeTopup: boolean }
  | { kind: 'discount'; percent: number; plans: PlanId[]; billing: 'monthly' | 'yearly' | 'both' }
  | { kind: 'unlock'; models: string[]; forPlans: PlanId[] }
  | { kind: 'promo_code'; code: string; percent: number; totalQuota: number; perUserLimit: number };

export type PopupHighlight = {
  name: string;
  status: 'LIVE NOW' | 'COMING SOON';
  icon: 'image' | 'video';
};

export type PopupConfig = {
  enabled: boolean;
  badgeLeft: string;
  badgeRight: string;
  headlineNumber: string;
  headlineText: string;
  highlights: PopupHighlight[];
  ctaText: string;
  ctaHref: string;
};

/** 定价页顶部配图。用 CSS 画,换成真图时只要替换这层。 */
export type ArtKey = 'none' | 'newuser' | 'halloween' | 'blackfriday';

/** 兑换码。拆成独立实体(而不是塞在 campaign.rule 里),对齐 Stripe 的 coupon / promotion code 分层:
    活动负责「什么时候展示、怎么展示」,码负责「折多少、发多少、谁能用」。一个码可以被多个活动引用。 */
export type RedeemCode = {
  id: string;
  code: string;
  /** 内部备注,不对用户展示 */
  note: string;
  percent: number;
  /** 0 = 不限量 */
  maxRedemptions: number;
  redeemed: number;
  perUserLimit: number;
  /** 仅限从未付费过的用户 */
  firstTimeOnly: boolean;
  /** 空字符串 = 跟随所绑活动的结束时间 */
  expiresAt: string;
  active: boolean;
};

export type PricingBannerConfig = {
  enabled: boolean;
  text: string;
  showCountdown: boolean;
};

export type Campaign = {
  id: string;
  name: string;
  /** false = 草稿，从未发布 */
  published: boolean;
  startAt: string;
  endAt: string;
  type: CampaignType;
  rule: CampaignRule;
  popup: PopupConfig;
  pricingBanner: PricingBannerConfig;
  frequency: { maxPerUser: number; intervalDays: number };
  /** 绑定的兑换码。结账时由 Stripe Checkout 自动带入,客户端不需要输入框。 */
  codeId?: string | null;
  /** 定价页配图 */
  art?: ArtKey;
};
