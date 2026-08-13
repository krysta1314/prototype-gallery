import type { PlanId } from '../../pricing/_src/lib/pricing/pricing';

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
};
