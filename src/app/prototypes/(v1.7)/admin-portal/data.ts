/**
 * Admin Portal 的数据层 —— sales 给企业客户开户用的后台。
 *
 * 为什么需要它:Enterprise 不走自助购买(定价页上只有 Contact Sales),
 * 所以「一个 Enterprise 组织是怎么诞生的」在原型里一直是空的。
 * 这里补上那一步:选档 → 配池额度与席位 → 开治理开关 → 开户。
 *
 * 三档的数值来自 rate card v1.6 §8 的校正版 —— 校正的原因是原案对标的是
 * 5 个 Ultra(44.5K / $445),而 Scale 当时还不存在;改为对标同席位数的 Scale 之后,
 * 额度提到与 Scale 持平、价格同步上调以保住 +34% 溢价。
 */

export type EnterpriseTierId = "e1" | "e2" | "e3";

export type EnterpriseTier = {
  id: EnterpriseTierId;
  name: string;
  blurb: string;
  /** 含创作席位 */
  seats: number;
  /** 组织月度共享池额度 */
  poolCredits: number;
  /** 年付月价 */
  monthlyPrice: number;
  /** 加购创作席位单价（每席每月） */
  extraSeatPrice: number;
  /** 加购上限 —— 也就是升档斜坡;null = 不设上限 */
  extraSeatCap: number | null;
  sso: boolean;
  auditLog: boolean;
  /** IP 免赔 / 安全审查 */
  indemnity: boolean;
};

/** 对标基准:同席位数的 Scale 月费与额度,用来在界面上把 +34% 溢价算给 sales 看 */
export const SCALE_SEAT_PRICE = 119;
export const SCALE_CREDITS_PER_SEAT = 16_900;

export const ENTERPRISE_TIERS: EnterpriseTier[] = [
  {
    id: "e1",
    name: "E1 · Team",
    blurb: "First governed deployment — one department, one workflow.",
    seats: 5,
    poolCredits: 84_500,
    monthlyPrice: 799,
    extraSeatPrice: 59,
    extraSeatCap: 5,
    sso: false,
    auditLog: false,
    indemnity: false,
  },
  {
    id: "e2",
    name: "E2 · Growth",
    blurb: "Multiple teams, central governance, SSO required.",
    seats: 15,
    poolCredits: 253_500,
    monthlyPrice: 2_399,
    extraSeatPrice: 49,
    extraSeatCap: 10,
    sso: true,
    auditLog: true,
    indemnity: false,
  },
  {
    id: "e3",
    name: "E3 · Studio",
    blurb: "Org-wide rollout with a security review and indemnity.",
    seats: 25,
    poolCredits: 422_500,
    monthlyPrice: 3_999,
    extraSeatPrice: 39,
    extraSeatCap: null,
    sso: true,
    auditLog: true,
    indemnity: true,
  },
];

/** 成本口径 —— 与 rate card 同一个数字,毛利率直接算给 sales 看 */
export const COST_PER_CREDIT = 0.00263;

export function grossMargin(tier: { monthlyPrice: number; poolCredits: number }) {
  const cost = tier.poolCredits * COST_PER_CREDIT;
  return (tier.monthlyPrice - cost) / tier.monthlyPrice;
}

/** 同等自助配置（同席位数的 Scale）的月费与额度 */
export function scaleEquivalent(seats: number) {
  return { price: seats * SCALE_SEAT_PRICE, credits: seats * SCALE_CREDITS_PER_SEAT };
}

/** 相对同等 Scale 配置的溢价 —— 买的是治理层 + API,不是额度 */
export function premiumOver(tier: { monthlyPrice: number; seats: number }) {
  const base = scaleEquivalent(tier.seats).price;
  return (tier.monthlyPrice - base) / base;
}

export function formatNumber(n: number) {
  return n.toLocaleString("en-US");
}
