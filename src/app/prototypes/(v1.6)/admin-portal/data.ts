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
  /** 审计日志所有商业档都有;这里指的是「可导出」—— 采购必问项,Enterprise 才给 */
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

/* ------------------------------------------------------------------ *
 * 组织列表 —— sales 模块的骨架。
 *
 * 参照真实后台(uat-admin)的形态:一张组织总表,按名称 / 归属 sales /
 * 组织状态 / 试用状态 / 套餐筛选,列出创建时间、生效日、到期日、归属 sales、套餐。
 * 开户只是这张表上的一个动作,不是整个后台。
 *
 * 数据确定性:全部由序号算出,不碰 Math.random / Date.now,SSR 与客户端一致。
 * ------------------------------------------------------------------ */

export type OrgStatus = "active" | "trial" | "expiring" | "expired" | "suspended";
export type OrgPlan = "Free" | "Team" | "Scale" | "Enterprise";

export type AdminOrg = {
  id: string;
  name: string;
  plan: OrgPlan;
  status: OrgStatus;
  /** 席位数;Free 恒为 1 */
  seats: number;
  /** 月度额度:per-seat 档是席位 × 每席,Enterprise 是池 */
  credits: number;
  /** 本月已消耗 */
  used: number;
  createdAt: string;
  /** 生效日 / 到期日 —— Free 没有 */
  effectiveAt: string | null;
  expiresAt: string | null;
  /** 归属 sales;自助注册的没有归属 */
  sales: string | null;
  /** 月度合同金额(年付折算);Free 为 0 */
  mrr: number;
  ownerEmail: string;
};

export const SALES_REPS = ["Ryan Cheung", "Florence Ho", "Parry Lam", "Wilson Tsang"];

const ORG_WORDS = [
  "Atlas Media", "Northwind Studio", "Lumen Collective", "Beacon Retail", "Harbour Foods",
  "Vertex Labs", "Aurora Beauty", "Kite Digital", "Solstice Group", "Ember Agency",
  "Meridian Toys", "Cascade Health", "Orchid Cosmetics", "Pioneer Motors", "Quarry Films",
  "Sable Fashion", "Terrace Living", "Umbra Gaming", "Verdant Farms", "Wren Interiors",
];

const STATUS_CYCLE: OrgStatus[] = ["active", "active", "trial", "active", "expiring", "active", "expired", "suspended"];
const PLAN_CYCLE: OrgPlan[] = ["Free", "Team", "Scale", "Free", "Enterprise", "Team", "Free", "Scale"];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];

/** 从序号造一个 2026 年内的日期字符串,确定性 */
function dateFrom(n: number, offsetDays = 0) {
  const day = ((n * 7 + offsetDays) % 27) + 1;
  const month = MONTHS[(n + Math.floor(offsetDays / 28)) % MONTHS.length]!;
  return `${month} ${String(day).padStart(2, "0")}, 2026`;
}

/** 到期日:生效日推一年,只在有合同的档出现 */
function expiryFrom(n: number) {
  const day = ((n * 7) % 27) + 1;
  const month = MONTHS[n % MONTHS.length]!;
  return `${month} ${String(day).padStart(2, "0")}, 2027`;
}

export const ADMIN_ORGS: AdminOrg[] = Array.from({ length: 64 }, (_, index) => {
  const n = index + 1;
  const plan = PLAN_CYCLE[n % PLAN_CYCLE.length]!;
  const status = plan === "Free" ? (n % 5 === 0 ? "trial" : "active") : STATUS_CYCLE[n % STATUS_CYCLE.length]!;
  const base = ORG_WORDS[index % ORG_WORDS.length]!;
  const name = index < ORG_WORDS.length ? base : `${base} ${Math.floor(index / ORG_WORDS.length) + 1}`;

  const seats = plan === "Free" ? 1 : plan === "Team" ? ((n % 8) + 2) : plan === "Scale" ? ((n % 26) + 5) : ((n % 40) + 25);
  const perSeat = plan === "Team" ? 8_900 : plan === "Scale" ? 16_900 : 0;
  const credits = plan === "Free" ? 2_000 : plan === "Enterprise" ? 84_500 + (n % 4) * 84_500 : seats * perSeat;
  const used = Math.round(credits * (((n * 13) % 90) + 5) / 100);
  const mrr =
    plan === "Free" ? 0 : plan === "Team" ? seats * 63 : plan === "Scale" ? seats * 119 : [799, 2_399, 3_999][n % 3]!;

  // 自助注册的组织没有归属 sales —— 只有开过户的才有
  const sales = plan === "Enterprise" || (plan !== "Free" && n % 3 === 0) ? SALES_REPS[n % SALES_REPS.length]! : null;

  return {
    id: `org-${String(n).padStart(3, "0")}`,
    name,
    plan,
    status,
    seats,
    credits,
    used,
    createdAt: dateFrom(n),
    effectiveAt: plan === "Free" ? null : dateFrom(n, 2),
    expiresAt: plan === "Free" ? null : expiryFrom(n),
    sales,
    mrr,
    ownerEmail: `owner@${name.toLowerCase().replace(/[^a-z0-9]+/g, "")}.com`,
  };
});

export const STATUS_LABEL: Record<OrgStatus, string> = {
  active: "Active",
  trial: "Free trial",
  expiring: "Expiring soon",
  expired: "Expired",
  suspended: "Suspended",
};

/** 状态色 —— 需要注意的状态一眼看得出,不用读文字 */
export const STATUS_TONE: Record<OrgStatus, { bg: string; fg: string }> = {
  active: { bg: "#e6f7f0", fg: "#0f7a5a" },
  trial: { bg: "#eef2ff", fg: "#4557c9" },
  expiring: { bg: "#fff3ec", fg: "#b06a1c" },
  expired: { bg: "#fdeced", fg: "#c9432a" },
  suspended: { bg: "#f1eff3", fg: "#7b7480" },
};

export function money(n: number) {
  return `$${n.toLocaleString("en-US")}`;
}
