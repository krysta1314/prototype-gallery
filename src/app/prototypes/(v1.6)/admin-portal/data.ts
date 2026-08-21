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

/**
 * 加购创作席位自带的月度额度(rate card 第 10 行:含额度/月 = 2,000)。
 *
 * 注意口径:额度**不挂在**这个人头上,还是进组织共享池 —— 但池会随加购席位增长。
 * 表格那句「额度不挂席位;+2,000 是让随人数增长」讲的就是这件事,
 * 两句不矛盾:不挂人 ≠ 不增加。之前原型把它理解成「加席位不影响池」,是错的。
 */
export const EXTRA_SEAT_CREDITS = 2_000;

export function grossMargin(tier: { monthlyPrice: number; poolCredits: number }) {
  const cost = tier.poolCredits * COST_PER_CREDIT;
  return (tier.monthlyPrice - cost) / tier.monthlyPrice;
}

/**
 * 直销成本 —— rate card 里「减直销后」那一列。
 *
 * 三档都正好是毛利率减 15 个百分点($799 / $2,399 / $3,999 各减 15% 收入),
 * 所以按「收入的 15%」建模。这个口径是我从表格反推的,不是表格明写的 ——
 * 如果实际是按人头或按单量算,改这一个常量就行。
 */
export const DIRECT_SALES_RATE = 0.15;

/** 减直销后的毛利率 —— sales 谈折扣时该看的是这个,不是 72% */
export function marginAfterSales(tier: { monthlyPrice: number; poolCredits: number }) {
  return grossMargin(tier) - DIRECT_SALES_RATE;
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

/**
 * 开户的三段状态 —— sales 填完表不等于客户能用。
 *
 *   awaiting_payment  合同签了、发票开了,钱还没到。Owner 登不进去,订阅还不存在
 *   active            确认收款之后才真正开通:Owner 可登录、订阅是 Enterprise、可邀请人分额度
 *   lapsed            合同到期未续 —— 与 team / scale 同样处理:退回 Free,数据全留、不再发额度
 *
 * 把 awaiting_payment 单独立成一个状态,是因为它是 enterprise 单最容易出事的一环:
 * sales 以为开好了,客户那边登不进来,来回扯两天。所以后台要明确显示「在等钱」。
 */
export type ProvisionState = "awaiting_payment" | "active" | "lapsed";

export const PROVISION_LABEL: Record<ProvisionState, string> = {
  awaiting_payment: "Awaiting payment",
  active: "Provisioned",
  lapsed: "Lapsed to Free",
};

/** 付款条件 —— 企业单基本都是转账 + 账期,信用卡是例外 */
export type PaymentTerms = "invoice_30" | "invoice_60" | "card";

export const PAYMENT_TERMS_LABEL: Record<PaymentTerms, string> = {
  invoice_30: "Invoice · Net 30",
  invoice_60: "Invoice · Net 60",
  card: "Credit card",
};
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
  /* ---- 以下几个字段只有 Enterprise(sales 开户)才有意义 ---- */
  /** 合同签署日 —— 与生效日不一定同一天,采购流程常常先签后启用 */
  signedAt?: string | null;
  /** 合同期限(月) */
  termMonths?: number;
  /** 到期是否自动续约。关掉就意味着到期退回 Free,后台要能一眼看出来 */
  autoRenew?: boolean;
  /** 开通进度 */
  provision?: ProvisionState;
  paymentTerms?: PaymentTerms;
  /** 客户的采购单号,开发票要用 */
  poNumber?: string;
  /** 确认收款并真正开通的时间;没开通就是 null */
  activatedAt?: string | null;
  /** 月度合同金额(年付折算);Free 为 0 */
  mrr: number;
  ownerEmail: string;
};

export const SALES_REPS = ["Ivan Lau", "Florence Ho", "Parry Lam", "Wilson Tsang"];

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

  const isEnterprise = plan === "Enterprise";
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
    // 合同字段只有 Enterprise 才有 —— 自助档没有签约这回事
    signedAt: isEnterprise ? dateFrom(n, -3) : null,
    termMonths: isEnterprise ? (n % 3 === 0 ? 24 : 12) : undefined,
    // 每 4 家里有 1 家关掉了自动续约 —— 这正是续约看板该优先捞出来的
    autoRenew: isEnterprise ? n % 4 !== 0 : undefined,
    provision: isEnterprise ? (n % 7 === 0 ? "awaiting_payment" : status === "expired" ? "lapsed" : "active") : undefined,
    paymentTerms: isEnterprise ? (["invoice_30", "invoice_60", "card"] as PaymentTerms[])[n % 3]! : undefined,
    poNumber: isEnterprise ? `PO-${2026}${String(n).padStart(4, "0")}` : undefined,
    activatedAt: isEnterprise ? (n % 7 === 0 ? null : dateFrom(n, 2)) : null,
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

/**
 * 演示用的「今天」—— 写死而不是读系统时间,原因有两个:
 * 1. 种子数据全在 2026 年,读真实时间会算出与列表其它行对不上的日期;
 * 2. SSR 与客户端要一致,当场 new Date() 会 hydration 不匹配。
 */
export const DEMO_TODAY = { day: 21, month: 7, year: 2026 } as const;

const MONTHS_FULL = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatDemoDate(day: number, month: number, year: number) {
  return `${MONTHS_FULL[month]} ${String(day).padStart(2, "0")}, ${year}`;
}

export const TODAY_LABEL = formatDemoDate(DEMO_TODAY.day, DEMO_TODAY.month, DEMO_TODAY.year);

/** 合同到期日 = 演示今天 + N 个月。合同字段里必须是真日期,写「Today + 12 months」太糙 */
export function termEndLabel(months: number) {
  const total = DEMO_TODAY.month + months;
  return formatDemoDate(DEMO_TODAY.day, total % 12, DEMO_TODAY.year + Math.floor(total / 12));
}

/**
 * 到期提醒节奏 —— 提前 60 / 30 / 7 天各一封。
 *
 * 为什么是三个点而不是一个:60 天是给采购走流程的时间(企业续约要走审批,
 * 提前两周通知等于逼客户走特批);30 天是决策点;7 天是最后一次拦停。
 *
 * 自动续约开着的组织只发 60 天那一封 —— 它是通知而不是催促,
 * 再发两封会让客户以为要断服。
 */
export const RENEWAL_REMINDERS = [60, 30, 7] as const;

export type ReminderState = "sent" | "scheduled" | "skipped";

/**
 * 某个提醒点现在是什么状态。
 * daysLeft 是这家还剩几天到期 —— 已经过了的提醒点算「已发」。
 */
export function reminderState(daysLeft: number, at: number, autoRenew: boolean): ReminderState {
  // 自动续约开着就只保留 60 天那一封
  if (autoRenew && at !== 60) return "skipped";
  return daysLeft <= at ? "sent" : "scheduled";
}

/** 演示用:从状态与序号推一个「还剩几天」,确定性 */
export function daysLeftOf(org: { id: string; status: OrgStatus }) {
  const n = Number(org.id.replace(/\D/g, "")) || 1;
  if (org.status === "expired") return 0;
  if (org.status === "expiring") return [5, 18, 26][n % 3]!;
  return 90 + (n % 120);
}

/** 到期后不续约会发生什么 —— 与 team / scale 完全一致,这句话在后台和合同里都要说得出 */
export const LAPSE_POLICY =
  "If the contract is not renewed, the organisation moves to Free on the expiry date: everything they created stays and stays viewable, members keep their accounts, but the monthly pool stops and nobody can create until a new contract starts.";

export function money(n: number) {
  return `$${n.toLocaleString("en-US")}`;
}
