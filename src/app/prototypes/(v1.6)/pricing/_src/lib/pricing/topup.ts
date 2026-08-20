// Top-up packs (rate card v1.6 §7) — 与 team-workspace 原型的 CREDIT_PACKS 同口径。
//
// 为什么必须有这条路径:credit_scaling 原来在 Team / Scale 都只写「Add seats」,
// 意味着一个只是额度不够、人数不需要增加的团队,必须买用不上的席位 ——
// 卖了席位却没卖燃料。top-up 按面值销售、零销售成本、客户需求最强时成交。

export interface TopUpPack {
  credits: number;
  /** 面值,不打折 */
  price: number;
  /** 单位 credit 价格,用于卡片上的「$/credit」对比 */
  perCredit: number;
  /** 最省的那一档挂个标 */
  badge?: string;
}

export const TOPUP_PACKS: TopUpPack[] = [
  { credits: 50_000, price: 500, perCredit: 0.01 },
  { credits: 200_000, price: 1_900, perCredit: 0.0095, badge: 'Most bought' },
  { credits: 500_000, price: 4_500, perCredit: 0.009 },
];

/** 有效期与扣减顺序 —— 这两条是 top-up 的全部规则,写在区块副标题里 */
export const TOPUP_RULES = [
  'Valid for 12 months from purchase, so nothing you paid extra for expires at the end of the month.',
  "Spent only after that month's included credits run out — never before.",
  'Available on Team, Scale and Enterprise. Bought per seat on Team and Scale; Enterprise can also add straight to the shared pool.',
];
