import type { PlanId } from '../../../(v1.6)/pricing/_src/lib/pricing/pricing';

export type { PlanId };

export type CampaignType = 'bonus_credits' | 'discount' | 'unlock' | 'promo_code';

/* 首页弹窗的类型。三种类型共用同一套弹窗模板,类型只决定除弹窗之外还要填什么:
   促销类要填加赠力度与定价页横幅,通知类没有这两段。 */
export type PopupKind = 'promo' | 'model_launch' | 'feature_launch';

export const POPUP_KINDS: { id: PopupKind; group: string; label: string; desc: string }[] = [
  { id: 'promo', group: 'Offer', label: 'Promotion', desc: 'Limited-time bonus credits, plus a pricing page banner.' },
  { id: 'model_launch', group: 'Announcement', label: 'Model launch', desc: 'A new model is live. No offer attached.' },
  { id: 'feature_launch', group: 'Announcement', label: 'Feature launch', desc: 'A new feature is live. No offer attached.' },
];

export type CampaignStatus = 'draft' | 'scheduled' | 'live' | 'ended';

export type CampaignRule =
  | {
      kind: 'bonus_credits';
      percent: number;
      plans: PlanId[];
      /** 单次充值是否参与。当前产品规则:只有订阅参与,恒为 false */
      includeTopup: boolean;
      /** 赠送额度有效期(天)。当前产品规则:赠送的是永久积分,恒为 0。留字段是为了以后要收紧时不用改结构 */
      bonusExpiryDays: number;
      /** 赠送额度优先于付费额度消耗。永久积分下与付费额度等价,恒为 false */
      consumeFirst: boolean;
      /** 是否跟随后续续费继续赠送。当前产品规则:活动期内每人只赠一次,恒为 false */
      recurring: boolean;
      /** 退款时回收未使用的赠送额度。当前产品规则:不退款,因此不做回收,恒为 false */
      clawbackOnRefund: boolean;
      /** 发放方式。当前产品规则:赠送的是永久积分,月付年付一律支付成功后一次性发满,恒为 'once' */
      grantMode: 'once' | 'monthly';
    }
  | { kind: 'discount'; percent: number; plans: PlanId[]; billing: 'monthly' | 'yearly' | 'both' }
  | { kind: 'unlock'; models: string[]; forPlans: PlanId[] }
  | { kind: 'promo_code'; code: string; percent: number; totalQuota: number; perUserLimit: number };

/* 弹窗只有一套模板:媒体 → 标题 → 若干「粗体一行 + 灰色一行」→ 一个大 CTA。
   admin 填内容,前端按模板渲染。类型只决定要不要填 Offer 和定价页横幅,不改弹窗长相。 */

export type PopupMedia = {
  kind: 'image' | 'video';
  /** 图片可以是上传的 data URI 或外链;视频只接外链 —— 视频塞进 localStorage 会直接爆 */
  src: string;
};

/** 模板里的一条卖点:粗体主文案 + 灰色补充说明 */
export type PopupItem = {
  title: string;
  subtitle: string;
};

export type PopupConfig = {
  enabled: boolean;
  media: PopupMedia;
  title: string;
  /** 标题下的一段描述。可留空 */
  description: string;
  items: PopupItem[];
  ctaText: string;
  ctaHref: string;
};

/** 活动卡的配色预设。跟节日解耦 —— 节日是活动的事,配色是设计的事,
    绑在一起会出现「万圣节活动想用蓝色」这种配不出来的情况。 */
export type ArtKey =
  | 'none'
  | 'aurora'
  | 'cobalt'
  | 'lagoon'
  | 'nebula'
  | 'berry'
  | 'sunset'
  | 'citrus'
  | 'clay'
  | 'mint'
  | 'moss'
  | 'graphite'
  | 'onyx';

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

/* 定价页活动卡的文案。之前是从活动数据推导的,但促销文案该运营自己写 ——
   推导只适合当占位默认值,不适合当唯一来源。字段可选是为了兼容已存在的旧记录。 */
export type PricingCardConfig = {
  /** 左上角小标签 */
  tag: string;
  /** 大标题(彩色那行) */
  headline: string;
  /** 第二行(白色那行) */
  subheadline: string;
  /** 下面的小字说明 */
  note: string;
  ctaText: string;
  ctaHref: string;
};

export type PricingBannerConfig = {
  enabled: boolean;
  /** 底色 Hex。细条 banner 放图必然被裁坏,所以用纯色打底,文字颜色按亮度自动取黑/白 */
  bg: string;
  /** CTA 按钮文案。空 = 不显示按钮 */
  ctaText: string;
  ctaHref: string;
  text: string;
  showCountdown: boolean;
  /* 倒计时需要两个时刻:从什么时候开始显示、倒到哪一刻结束。
     只有结束时间的话,预热期的倒计时会提前一直挂在页面上。
     两个都空 = 跟随活动的开始/结束时间。 */
  countdownFrom?: string;
  countdownTo?: string;
};

export type Campaign = {
  id: string;
  name: string;
  /** 弹窗类型,决定要填哪些字段 */
  kind: PopupKind;
  /** 同时段多个弹窗 live 时,只弹优先级最高的那个;没弹到的顺延到下次进首页 */
  priority: number;
  /* 各投放位是否启用。类型只决定默认值,不再按类型直接隐藏整段 ——
     通知类弹窗也可能想挂个加赠,促销活动也可能不要定价页卡片,这是运营的决定不是结构的决定。
     字段可选是为了兼容旧记录:读的时候用 offerOn()/pricingCardOn() 兜默认值。 */
  offerEnabled?: boolean;
  pricingCardEnabled?: boolean;
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
  /** 活动卡的配色预设。没上传 pricingImage 时当卡片背景 */
  art?: ArtKey;
  /** 活动卡的背景图(data URI 或外链) */
  pricingImage: string;
  /** 活动卡的文案。旧记录里没有这个字段,读的时候要走 pricingCardOf() 兜默认值 */
  pricingCard?: PricingCardConfig;
};

/** Offer 段是否启用。旧记录没有这个字段,按类型给默认值 */
export function offerOn(c: Campaign): boolean {
  return c.offerEnabled ?? c.kind === 'promo';
}

/** 定价页活动卡是否启用 */
export function pricingCardOn(c: Campaign): boolean {
  return c.pricingCardEnabled ?? c.kind === 'promo';
}
