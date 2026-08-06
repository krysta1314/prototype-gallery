export type Role = "owner" | "admin" | "finance" | "member";

/** 12.3 per-member 月度上限 */
export type MemberLimit = { credits: number; mode: "soft" | "hard" };

export type Member = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "active" | "invited" | "expired";
  joinedAt: string;
  color: string;
  /** 本计费周期已消耗（12.1 按成员计量） */
  usedThisCycle: number;
  /** null = 不限 */
  limit: MemberLimit | null;
};

/** 12.5 池级自动充值 */
export type AutoTopUp = {
  enabled: boolean;
  /** 池余额低于此值触发 */
  threshold: number;
  /** 每次充值额度 */
  amount: number;
  /** 月度充值封顶（金额上的护栏,企业财务的前提） */
  monthlyCap: number;
  spentThisMonth: number;
  status: "active" | "paused" | "cap-reached";
  /** status=paused 时的失败原因 */
  failureReason?: string;
  /** 已连续失败次数,满 3 次转 paused */
  failures: number;
};

export type Team = {
  id: string;
  name: string;
  personal: boolean;
  /** 付费席位总数（Finance 的 billing-only 席位不占） */
  seatsTotal: number;
  /** 订阅积分:每月按账单日重置,不结转 */
  subTotal: number;
  subUsed: number;
  /** 充值积分:12 个月过期,可结转 */
  topupRemaining: number;
  topupExpires: string;
  aiTokens: number;
  aiTokensTotal: number;
  planId: PlanId;
  color: string;
  autoTopUp: AutoTopUp;
  /** 12.9 第一层:纯邮箱,不占席位、不进成员表 */
  billingContacts: string[];
};

export const CURRENT_USER_ID = "u-monica";
export const CURRENT_USER = { id: CURRENT_USER_ID, name: "Monica Zhou", email: "monica.zhou@presslogic.com", color: "#ff7955" };

/* ---------- 套餐 ---------- */
export type PlanId = "starter" | "basic" | "pro" | "scale";

export type Plan = {
  id: PlanId;
  name: string;
  price: string;
  priceValue: number;
  seatsTotal: number;
  creditsTotal: number;
  aiTokensTotal: number;
  blurb: string;
};

export const PLANS: Plan[] = [
  { id: "starter", name: "Starter", price: "Free", priceValue: 0, seatsTotal: 1, creditsTotal: 2_000, aiTokensTotal: 500_000, blurb: "For solo work in your personal space." },
  { id: "basic", name: "Team Basic", price: "$39/mo", priceValue: 39, seatsTotal: 3, creditsTotal: 20_000, aiTokensTotal: 1_000_000, blurb: "A small team getting started." },
  { id: "pro", name: "Team Pro", price: "$99/mo", priceValue: 99, seatsTotal: 10, creditsTotal: 100_000, aiTokensTotal: 5_000_000, blurb: "Growing teams shipping campaigns weekly." },
  { id: "scale", name: "Team Scale", price: "$299/mo", priceValue: 299, seatsTotal: 30, creditsTotal: 400_000, aiTokensTotal: 20_000_000, blurb: "High-volume production across brands." },
];

export const CREDIT_PACKS = [
  { credits: 10_000, price: "$29" },
  { credits: 50_000, price: "$129" },
  { credits: 150_000, price: "$349" },
];

export const SEAT_PRICE = 19;

export function planOf(team: Team) {
  return PLANS.find((p) => p.id === team.planId) ?? PLANS[0]!;
}

/** 账单日 —— 订阅积分与 per-member 上限都在这天重置（12.3） */
export const NEXT_BILL: Record<string, string> = {
  "t-personal": "—",
  "t-growth": "Sep 1, 2026",
  "t-beauty": "Aug 18, 2026",
};

const NO_AUTO_TOPUP: AutoTopUp = {
  enabled: false,
  threshold: 5_000,
  amount: 20_000,
  monthlyCap: 100_000,
  spentThisMonth: 0,
  status: "active",
  failures: 0,
};

/* ---------- 团队 ---------- */
export const TEAMS: Team[] = [
  {
    id: "t-personal",
    name: "Monica's team",
    personal: true,
    seatsTotal: 1,
    subTotal: 2_000,
    subUsed: 760,
    topupRemaining: 0,
    topupExpires: "—",
    aiTokens: 120_000,
    aiTokensTotal: 500_000,
    planId: "starter",
    color: "#ff7955",
    autoTopUp: NO_AUTO_TOPUP,
    billingContacts: [],
  },
  {
    id: "t-growth",
    name: "PressLogic Growth",
    personal: false,
    seatsTotal: 10,
    subTotal: 100_000,
    subUsed: 36_984,
    topupRemaining: 12_400,
    topupExpires: "Jun 2027",
    aiTokens: 2_100_000,
    aiTokensTotal: 5_000_000,
    planId: "pro",
    color: "#5b6cff",
    autoTopUp: {
      enabled: true,
      threshold: 10_000,
      amount: 50_000,
      monthlyCap: 200_000,
      spentThisMonth: 50_000,
      status: "active",
      failures: 0,
    },
    billingContacts: ["finance@presslogic.com"],
  },
  {
    // 池已用 99%,天然演示 100% 告警态
    id: "t-beauty",
    name: "Beauty Squad",
    personal: false,
    seatsTotal: 3,
    subTotal: 20_000,
    subUsed: 19_790,
    topupRemaining: 0,
    topupExpires: "—",
    aiTokens: 40_000,
    aiTokensTotal: 1_000_000,
    planId: "basic",
    color: "#12a594",
    autoTopUp: NO_AUTO_TOPUP,
    billingContacts: [],
  },
];

const m = (
  id: string,
  name: string,
  email: string,
  role: Role,
  joinedAt: string,
  color: string,
  usedThisCycle: number,
  limit: MemberLimit | null = null,
  status: Member["status"] = "active",
): Member => ({ id, name, email, role, status, joinedAt, color, usedThisCycle, limit });

/* ---------- 成员:按团队分 ----------
 * 付费席位占用 = active + invited 且 role !== finance;当前用户角色也从这里取。 */
export const MEMBERS_BY_TEAM: Record<string, Member[]> = {
  "t-personal": [m(CURRENT_USER_ID, CURRENT_USER.name, CURRENT_USER.email, "owner", "Jan 04, 2026", CURRENT_USER.color, 760)],
  // 6 active + 1 invited = 7/10 付费席位;Ivy 是 billing-only 不占席位;Tom 已过期不占
  "t-growth": [
    m("u-alex", "Alex Chen", "alex.chen@presslogic.com", "owner", "Jan 12, 2026", "#1a1a2e", 12_400),
    m(CURRENT_USER_ID, CURRENT_USER.name, CURRENT_USER.email, "admin", "Feb 03, 2026", CURRENT_USER.color, 9_800),
    m("u-vera", "Vera Lam", "vera.lam@presslogic.com", "admin", "Feb 20, 2026", "#5b6cff", 7_200),
    m("u-kenji", "Kenji Ito", "kenji.ito@presslogic.com", "member", "Mar 08, 2026", "#12a594", 4_100, { credits: 5_000, mode: "hard" }),
    m("u-daniel", "Daniel Park", "daniel.park@presslogic.com", "member", "May 02, 2026", "#8a5cf6", 2_300, { credits: 3_000, mode: "soft" }),
    m("u-liam", "Liam Novak", "liam.novak@presslogic.com", "member", "Jul 07, 2026", "#3aa3e3", 1_184),
    m("u-ivy", "Ivy Tan", "ivy.tan@presslogic.com", "finance", "Apr 02, 2026", "#e0568a", 0),
    m("i-priya", "priya.singh@presslogic.com", "priya.singh@presslogic.com", "member", "Aug 01, 2026", "#9a9bb0", 0, null, "invited"),
    m("i-tom", "tom.baker@presslogic.com", "tom.baker@presslogic.com", "admin", "Jul 20, 2026", "#9a9bb0", 0, null, "expired"),
  ],
  // 3 active = 3/3(已满)
  "t-beauty": [
    m("u-sofia", "Sofia Ruiz", "sofia.ruiz@presslogic.com", "owner", "Apr 14, 2026", "#e0568a", 11_000),
    m("u-mei", "Mei Wong", "mei.wong@presslogic.com", "admin", "Jun 19, 2026", "#f0a020", 6_500),
    m(CURRENT_USER_ID, CURRENT_USER.name, CURRENT_USER.email, "member", "Jun 25, 2026", CURRENT_USER.color, 2_290, { credits: 2_500, mode: "hard" }),
  ],
};

export const ROLE_LABEL: Record<Role, string> = { owner: "Owner", admin: "Admin", finance: "Finance", member: "Member" };

export const ROLE_BLURB: Record<Role, string> = {
  owner: "Billing and everything else",
  admin: "Members and limits, no payment changes",
  finance: "Invoices, payment method, auto top-up — no product access",
  member: "Create and publish work",
};

/** Finance 走 billing-only 免费席位,不计入付费席位 */
export function takesPaidSeat(member: Member) {
  return member.role !== "finance" && member.status !== "expired";
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export function formatNumber(n: number) {
  return n.toLocaleString("en-US");
}

export function formatTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1000)}K`;
  return String(n);
}
