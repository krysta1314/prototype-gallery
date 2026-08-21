export type Role = "owner" | "admin" | "finance" | "member";

/**
 * 额度模型 —— 整个原型分叉的根。
 *
 * per-seat（个人 / Team / Scale）：每个席位每月拿到固定额度，归该席位本人。
 *   不汇成池、用不完不转给同事、管理员不能在人之间分配。
 *   额度不够只有两条路：升档，或者给这个席位单独买 top-up。
 *
 * pool（Enterprise）：整个组织一个共享池，管理员按人分配额度，
 *   未分配的额度回流池中（pourOver 可关）。top-up 可以整体充进池，也可以按人充。
 */
export type CreditModel = "per-seat" | "pool";

/**
 * 分配额度 —— 从共享池里切一块给某个人,所以叫 allocation 而不是 limit / budget。
 *
 * 为什么不叫 budget:老板评审里骂过「Fixed Balance」听起来像钱包余额、实际是每周期上限;
 * budget 有同样的毛病(听起来像一笔钱,实际每月重置)。allocation 说的是「从池里分给你的份额」,
 * 与池模型自洽,也与定价页矩阵那行 Credit allocation per member 对上。
 *
 * 只在 pool 模式（Enterprise）存在;per-seat 模式恒为 null —— 每席固定额度本身就是上限。
 */
export type Allocation = { credits: number; mode: "soft" | "hard" };

export type Member = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "active" | "invited" | "expired";
  joinedAt: string;
  color: string;
  /** 本计费周期已消耗 */
  usedThisCycle: number;
  /**
   * 买给这个席位的 top-up 余额 —— 两种模型下都可以按人充。
   * 不共享、不回流、12 个月有效；席位当月固定额度（或分配额度）用尽后才开始扣。
   */
  seatTopUp: number;
  /** pool 模式：管理员分配给他的额度（null = 不限，随池花到底）。per-seat 模式恒 null */
  allocation: Allocation | null;
  /**
   * 距今多少天前活跃过。0 = 今天,null = 从未登录(邀请还没接受)。
   * 席位制产品里 admin 最常做的事是回收闲置席位,所以这个字段要在成员列表里直接看得到。
   */
  lastActiveDays: number | null;
};

/** 闲置多少天算「该回收了」—— 列表里到这个数就变灰并标出来 */
export const IDLE_DAYS = 30;

/** Last active 的展示口径 —— 从不显示精确时间戳,只说「多久没来了」 */
export function lastActiveLabel(days: number | null) {
  if (days === null) return "Never";
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} ${Math.floor(days / 7) === 1 ? "week" : "weeks"} ago`;
  return `${Math.floor(days / 30)} ${Math.floor(days / 30) === 1 ? "month" : "months"} ago`;
}

/** pool 模式的池级自动充值 —— per-seat 团队没有池，这块整体不适用 */
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

/**
 * 空出来的席位 —— 成员被移除后留下的壳,身上带着当月没花完的额度。
 *
 * 规则:Team / Scale 的 credits 跟着席位走,不跟着人走。所以人走了,
 * 那个席位当月剩下的额度**保留在席位上**,下一个被邀请的人可以「接手这个席位」
 * 连额度一起拿走;也可以选「开一个新席位」拿全新的一份(那要占一个新席位)。
 * 多人离开就会有多个空席位,邀请时逐个可选。
 */
export type VacantSeat = {
  id: string;
  /** 原来坐这个席位的人,界面上要说清额度是从谁那儿剩下的 */
  fromName: string;
  /** 当月还剩多少订阅额度（每席固定额度 − 他已用） */
  creditsLeft: number;
  /** 席位上还挂着多少 top-up（买给这个席位的,不随人走） */
  topUpLeft: number;
  freedAt: string;
};

export type Team = {
  id: string;
  name: string;
  personal: boolean;
  /** 付费席位总数（Finance 的 billing-only 席位不占） */
  seatsTotal: number;
  planId: PlanId;
  /** 从套餐推导，缓存在团队上方便直接判断 */
  creditModel: CreditModel;

  /* ---- 以下四个字段只在 creditModel === "pool" 时有意义（Enterprise） ---- */
  /** 组织共享池月度额度 */
  poolTotal: number;
  poolUsed: number;
  /** 充进池的 top-up 余额，12 个月过期、可结转 */
  topupRemaining: number;
  topupExpires: string;
  autoTopUp: AutoTopUp;
  /** 成员未用完的分配额度是否回流池中 */
  pourOver: boolean;

  /** 内部口径,不对 Client 端暴露（界面上已隐藏,字段保留） */
  aiTokens: number;
  aiTokensTotal: number;
  /** true = 已申请取消,账期结束前照常可用。团队不会掉回 Free —— 团队没有免费档 */
  cancelAtPeriodEnd?: boolean;
  color: string;
  /** 组织 logo(data URL)—— 没上传就退回首字母方块 */
  logo?: string;
  /** 纯邮箱,不占席位、不进成员表 */
  billingContacts: string[];
  /** 成员移除后留下的空席位,带着当月剩余额度,等下一个人接手 */
  vacantSeats: VacantSeat[];
};

/**
 * 成员/管理员发起的申请（撞墙时要有站内回路，不能只提示「去找管理员」）。
 *
 * per-seat 团队：kind = "topup"（给我的席位充值）或 "seats"。
 *   没有 "limit" —— 每席固定额度不存在「提上限」这回事。
 * pool 团队：额外有 "limit"（申请追加分配额度）。
 */
export type TeamRequest = {
  id: string;
  kind: "topup" | "seats" | "limit";
  fromId: string;
  fromName: string;
  /** topup = 申请的积分数,seats = 申请的席位数,limit = 申请的分配额度 */
  amount?: number;
  reason?: string;
  at: string;
  /** expired = 过了有效期没人处理,自动失效,不再占用冷却 */
  status: "pending" | "approved" | "dismissed" | "expired";
};

/** 同一人同类型申请的冷却时间,防止连点刷屏 */
export const REQUEST_COOLDOWN_HOURS = 24;

/** 站内操作日志条目 */
export type ActivityKind = "member" | "role" | "limit" | "billing" | "credits" | "team";

export type ActivityEntry = {
  id: string;
  at: string;
  actor: string;
  /** 动作短句,英文产品文案 */
  action: string;
  kind: ActivityKind;
};

/**
 * 订阅成功后的交接口 —— pricing 原型的收银台把刚买下的团队写进这个 key,
 * 工作区一加载就把它落成真实团队并清空。两个原型不共享 React state,只共享这一格 localStorage。
 */
export const PENDING_TEAM_KEY = "buzz-pending-team";

export type PendingTeam = { name: string; planId: PlanId; seats: number };

/**
 * 订阅页(pricing 原型)—— 所有 Upgrade 入口都跳这里,不再直接开设置里的 Billing。
 * 升档要先看价格和档位对比,产品内的 Billing 面板是给「已经订了之后」看账单用的。
 * 个人账户落在 Individual tab,团队账户落在 Business tab。
 */
export function pricingUrl(personal: boolean) {
  return `/prototypes/pricing?group=${personal ? "individual" : "business"}`;
}

export const CURRENT_USER_ID = "u-monica";
export const CURRENT_USER = { id: CURRENT_USER_ID, name: "Monica Zhou", email: "monica.zhou@presslogic.com", color: "#ff7955" };

/* ---------- 套餐 ---------- */

/** 与定价页 `(v1.6)/pricing` 的 business.ts 同口径 —— 改价格只改那边，这里跟着抄 */
export type PlanId = "free" | "team" | "scale" | "enterprise";

export type Plan = {
  id: PlanId;
  name: string;
  price: string;
  /** per-seat 档是「每席位每月」，月付价即定价（没有永久折扣）；Enterprise 谈定 */
  priceValue: number;
  /** 年付时每席位每月折算价 —— 与定价页同口径，统一 30% off */
  priceValueAnnual: number;
  creditModel: CreditModel;
  /** per-seat 档：每席位每月固定额度 */
  creditsPerSeat: number;
  /** pool 档：组织共享池月度额度（Enterprise 实际按合同定，这里给个演示值） */
  poolCredits: number;
  seatsMin: number;
  /** 套餐的席位区间上限 */
  seatsMax: number;
  /**
   * 撞到 seatsMax 之后怎么办 —— 两种走法,不能混:
   *   "upgrade"   → 必须换更高档才能再加人（Team 想要第 10 人得升 Scale,不支持单买第 10 席）
   *   "buy-seats" → 没有下一档了,按每席价继续买,并引导联系 sales 谈 Enterprise
   */
  beyondMax: "upgrade" | "buy-seats";
  aiTokensTotal: number;
  blurb: string;
};

export const PLANS: Plan[] = [
  // Free 只属于个人空间。团队没有免费档 —— 团队是被「购买」这个动作创建出来的。
  {
    id: "free",
    name: "Free",
    price: "Free",
    priceValue: 0,
    priceValueAnnual: 0,
    creditModel: "per-seat",
    creditsPerSeat: 2_000,
    poolCredits: 0,
    seatsMin: 1,
    seatsMax: 1,
    beyondMax: "upgrade",
    aiTokensTotal: 500_000,
    blurb: "For solo work in your personal space.",
  },
  {
    id: "team",
    name: "Team",
    price: "$89/seat",
    priceValue: 89,
    priceValueAnnual: 63,
    creditModel: "per-seat",
    creditsPerSeat: 8_900,
    poolCredits: 0,
    seatsMin: 2,
    seatsMax: 9,
    // Team 上面还有 Scale,所以第 10 人走升档,不给单买
    beyondMax: "upgrade",
    aiTokensTotal: 1_000_000,
    blurb: "For agencies and small teams to create faster.",
  },
  {
    id: "scale",
    name: "Scale",
    price: "$169/seat",
    priceValue: 169,
    priceValueAnnual: 119,
    creditModel: "per-seat",
    creditsPerSeat: 16_900,
    poolCredits: 0,
    seatsMin: 5,
    seatsMax: 30,
    // Scale 是自助档的顶,没有下一档 —— 超过 30 席按每席价继续买,同时引导 Enterprise
    beyondMax: "buy-seats",
    aiTokensTotal: 5_000_000,
    blurb: "Designed for growing creative teams.",
  },
  {
    // 唯一的 pool 档：由 sales 在 admin portal 开户，不走自助购买
    id: "enterprise",
    name: "Enterprise",
    price: "Let's talk",
    priceValue: 0,
    priceValueAnnual: 0,
    creditModel: "pool",
    creditsPerSeat: 0,
    poolCredits: 420_000,
    seatsMin: 25,
    seatsMax: 999,
    beyondMax: "buy-seats",
    aiTokensTotal: 20_000_000,
    blurb: "Shared credit pool you allocate per member.",
  },
];

/**
 * Top-up 包 —— 与 rate card 同口径，12 个月有效期。
 * per-seat 团队买给指定席位；pool 团队可整体充进池，也可以按人充。
 */
export const CREDIT_PACKS = [
  { credits: 50_000, price: "$500" },
  { credits: 200_000, price: "$1,900" },
  { credits: 500_000, price: "$4,500" },
];

/** 每席位月费 —— 按席位计价，所以加席位的价钱就是套餐单价 */
export function seatPriceOf(plan: Plan, cycle: BillingCycle = "monthly") {
  return cycle === "yearly" ? plan.priceValueAnnual : plan.priceValue;
}

/** 计费周期 —— 与定价页一致：月付即定价，年付统一 30% off */
export type BillingCycle = "monthly" | "yearly";

/**
 * 可自助购买的团队套餐 —— 不含 Free，也不含 Enterprise。
 * 团队只能通过购买创建；Enterprise 由 sales 开户，所以任何「选套餐」的界面都从这里取值。
 */
export const TEAM_PLANS: Plan[] = PLANS.filter((plan) => plan.id === "team" || plan.id === "scale");

/** 购买向导里默认选中的档位 */
export const DEFAULT_TEAM_PLAN_ID: PlanId = "team";

export function planOf(team: Team) {
  return PLANS.find((p) => p.id === team.planId) ?? PLANS[0]!;
}

/** 这个团队是不是共享池模型（只有 Enterprise 是） */
export function isPoolTeam(team: Team) {
  return team.creditModel === "pool";
}

/** 某个席位每月拿到的固定额度 —— per-seat 模型下人人相同 */
export function seatCreditsOf(team: Team) {
  return planOf(team).creditsPerSeat;
}

/** 当前账期起点 —— 只为账单页显示 "Current cycle: A – B" */
export const CYCLE_START: Record<string, string> = {
  "t-personal": "—",
  "t-growth": "Aug 1, 2026",
  "t-beauty": "Jul 18, 2026",
  "t-atlas": "Aug 1, 2026",
};

/** 账单日 —— 席位额度与池额度都在这天重置 */
export const NEXT_BILL: Record<string, string> = {
  "t-personal": "—",
  "t-growth": "Sep 1, 2026",
  "t-beauty": "Aug 18, 2026",
  "t-atlas": "Sep 1, 2026",
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

/** per-seat 团队没有池，这些字段一律置零，避免任何地方误读成「团队还有余额」 */
const NO_POOL = {
  poolTotal: 0,
  poolUsed: 0,
  topupRemaining: 0,
  topupExpires: "—",
  autoTopUp: NO_AUTO_TOPUP,
  pourOver: false,
} as const;

/* ---------- 团队 ---------- */
export const TEAMS: Team[] = [
  {
    // 个人账户,不是团队。注册后只有这个,团队必须手动创建。
    // 个人账户就是「一个席位」——所以它天然走 per-seat 模型。
    id: "t-personal",
    name: CURRENT_USER.name,
    personal: true,
    seatsTotal: 1,
    planId: "free",
    creditModel: "per-seat",
    ...NO_POOL,
    aiTokens: 120_000,
    aiTokensTotal: 500_000,
    color: "#ff7955",
    billingContacts: [],
    vacantSeats: [],
  },
  {
    // Scale · per-seat：每席 16,900，谁的额度谁花
    id: "t-growth",
    name: "PressLogic Growth",
    personal: false,
    seatsTotal: 10,
    planId: "scale",
    creditModel: "per-seat",
    ...NO_POOL,
    aiTokens: 2_100_000,
    aiTokensTotal: 5_000_000,
    color: "#5b6cff",
    billingContacts: ["finance@presslogic.com"],
    // 种子里先放一个:Noah 七月离开时席位上还剩 11,300 —— 邀请弹窗一进去就能演示「接手席位」
    vacantSeats: [
      { id: "vs-noah", fromName: "Noah Fisher", creditsLeft: 11_300, topUpLeft: 0, freedAt: "Jul 07, 2026" },
    ],
  },
  {
    // Team · per-seat：当前用户在这里是 Member，且自己那份快用完 —— 天然演示「个人额度撞墙」
    id: "t-beauty",
    name: "Beauty Squad",
    personal: false,
    seatsTotal: 3,
    planId: "team",
    creditModel: "per-seat",
    ...NO_POOL,
    aiTokens: 40_000,
    aiTokensTotal: 1_000_000,
    color: "#12a594",
    billingContacts: [],
    vacantSeats: [],
  },
  {
    // Enterprise · pool：由 sales 开户，共享池 + 按人分配 + pour-over
    id: "t-atlas",
    name: "Atlas Media Group",
    personal: false,
    seatsTotal: 28,
    planId: "enterprise",
    creditModel: "pool",
    poolTotal: 420_000,
    poolUsed: 331_600,
    topupRemaining: 50_000,
    topupExpires: "Jun 2027",
    autoTopUp: {
      enabled: true,
      threshold: 40_000,
      amount: 200_000,
      monthlyCap: 600_000,
      spentThisMonth: 200_000,
      status: "active",
      failures: 0,
    },
    pourOver: true,
    aiTokens: 9_400_000,
    aiTokensTotal: 20_000_000,
    color: "#8a5cf6",
    billingContacts: ["ap@atlasmedia.com"],
    // Enterprise 走共享池,额度不挂席位,所以这里永远是空的
    vacantSeats: [],
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
  allocation: Allocation | null = null,
  status: Member["status"] = "active",
  seatTopUp = 0,
  lastActiveDays: number | null = 0,
): Member => ({ id, name, email, role, status, joinedAt, color, usedThisCycle, seatTopUp, allocation, lastActiveDays });

/* ---------- 成员:按团队分 ----------
 * 付费席位占用 = active + invited 且 role !== finance;当前用户角色也从这里取。
 * per-seat 团队：allocation 一律 null（每席固定额度就是上限），额度不够靠 seatTopUp。
 * pool 团队（t-atlas）：allocation 就是管理员分配的额度。 */
export const MEMBERS_BY_TEAM: Record<string, Member[]> = {
  "t-personal": [m(CURRENT_USER_ID, CURRENT_USER.name, CURRENT_USER.email, "owner", "Jan 04, 2026", CURRENT_USER.color, 760, null, "active", 0, 0)],
  // Scale · 每席 16,900。6 active + 1 invited = 7/10 付费席位;Ivy 是 billing-only 不占席位;Tom 已过期不占
  "t-growth": [
    m("u-alex", "Alex Chen", "alex.chen@presslogic.com", "owner", "Jan 12, 2026", "#1a1a2e", 12_400, null, "active", 0, 0),
    m(CURRENT_USER_ID, CURRENT_USER.name, CURRENT_USER.email, "admin", "Feb 03, 2026", CURRENT_USER.color, 9_800, null, "active", 0, 0),
    m("u-vera", "Vera Lam", "vera.lam@presslogic.com", "admin", "Feb 20, 2026", "#5b6cff", 7_200, null, "active", 0, 2),
    // Kenji 自己那份已经用尽，靠买给他席位的 top-up 续命 —— 演示 per-seat 的加油路径
    m("u-kenji", "Kenji Ito", "kenji.ito@presslogic.com", "member", "Mar 08, 2026", "#12a594", 16_900, null, "active", 20_000, 1),
    m("u-daniel", "Daniel Park", "daniel.park@presslogic.com", "member", "May 02, 2026", "#8a5cf6", 2_300, null, "active", 0, 12),
    m("u-liam", "Liam Novak", "liam.novak@presslogic.com", "member", "Jul 07, 2026", "#3aa3e3", 1_184, null, "active", 0, 45),
    m("u-ivy", "Ivy Tan", "ivy.tan@presslogic.com", "finance", "Apr 02, 2026", "#e0568a", 0, null, "active", 0, 6),
    m("i-priya", "priya.singh@presslogic.com", "priya.singh@presslogic.com", "member", "Aug 01, 2026", "#9a9bb0", 0, null, "invited", 0, null),
    m("i-tom", "tom.baker@presslogic.com", "tom.baker@presslogic.com", "admin", "Jul 20, 2026", "#9a9bb0", 0, null, "expired", 0, null),
  ],
  // Team · 每席 8,900。3 active = 3/3(已满)。当前用户是 Member 且用到 8,700/8,900
  "t-beauty": [
    m("u-sofia", "Sofia Ruiz", "sofia.ruiz@presslogic.com", "owner", "Apr 14, 2026", "#e0568a", 6_100, null, "active", 0, 0),
    m("u-mei", "Mei Wong", "mei.wong@presslogic.com", "admin", "Jun 19, 2026", "#f0a020", 4_500, null, "active", 0, 3),
    m(CURRENT_USER_ID, CURRENT_USER.name, CURRENT_USER.email, "member", "Jun 25, 2026", CURRENT_USER.color, 8_700, null, "active", 0, 0),
  ],
  // Enterprise · pool。allocation = 管理员分配的额度；当前用户是 Admin
  "t-atlas": [
    m("u-hana", "Hana Sato", "hana.sato@atlasmedia.com", "owner", "Feb 02, 2026", "#8a5cf6", 42_000, { credits: 60_000, mode: "soft" }, "active", 0, 1),
    m(CURRENT_USER_ID, CURRENT_USER.name, CURRENT_USER.email, "admin", "Mar 15, 2026", CURRENT_USER.color, 28_400, { credits: 40_000, mode: "soft" }, "active", 0, 0),
    m("u-omar", "Omar Haddad", "omar.haddad@atlasmedia.com", "admin", "Mar 20, 2026", "#1a1a2e", 31_200, { credits: 40_000, mode: "soft" }, "active", 0, 4),
    m("u-lena", "Lena Fischer", "lena.fischer@atlasmedia.com", "member", "Apr 08, 2026", "#12a594", 20_000, { credits: 20_000, mode: "hard" }, "active", 0, 9),
    m("u-rui", "Rui Costa", "rui.costa@atlasmedia.com", "member", "Apr 22, 2026", "#3aa3e3", 14_800, { credits: 20_000, mode: "hard" }, "active", 0, 38),
    m("u-nia", "Nia Bello", "nia.bello@atlasmedia.com", "member", "May 06, 2026", "#e0568a", 9_300, null, "active", 0, 21),
    m("u-pierre", "Pierre Roy", "pierre.roy@atlasmedia.com", "finance", "Feb 10, 2026", "#f0a020", 0, null, "active", 0, 15),
  ],
};

/** Activity Log 种子数据:按团队分,最新在前 */
export const ACTIVITY_BY_TEAM: Record<string, ActivityEntry[]> = {
  "t-personal": [{ id: "a-p1", at: "Jan 04, 2026", actor: "Monica Zhou", action: "created this personal space", kind: "team" }],
  "t-growth": [
    { id: "a-g1", at: "Aug 14, 2026 · 16:20", actor: "Monica Zhou", action: "bought 20,000 top-up credits for Kenji Ito's seat", kind: "credits" },
    { id: "a-g4", at: "Aug 05, 2026 · 15:12", actor: "Monica Zhou", action: "invited priya.singh@presslogic.com as a member", kind: "member" },
    { id: "a-g5", at: "Aug 01, 2026 · 10:30", actor: "Alex Chen", action: "added 2 seats to Scale", kind: "billing" },
    { id: "a-g6", at: "Jul 22, 2026 · 14:55", actor: "Alex Chen", action: "changed Vera Lam's role from Member to Admin", kind: "role" },
    { id: "a-g7", at: "Jul 20, 2026 · 08:26", actor: "Monica Zhou", action: "invited tom.baker@presslogic.com as an admin", kind: "member" },
    { id: "a-g8", at: "Jul 07, 2026 · 17:02", actor: "Vera Lam", action: "removed Noah Fisher from the team — their projects and assets moved to Alex Chen", kind: "member" },
    { id: "a-g9", at: "Jun 30, 2026 · 12:41", actor: "Alex Chen", action: "added finance@presslogic.com as a billing admin", kind: "billing" },
    { id: "a-g12", at: "Jan 12, 2026 · 10:00", actor: "Alex Chen", action: "created PressLogic Growth", kind: "team" },
  ],
  "t-beauty": [
    { id: "a-b2", at: "Jun 25, 2026 · 11:18", actor: "Sofia Ruiz", action: "invited monica.zhou@presslogic.com as a member", kind: "member" },
    { id: "a-b3", at: "Jun 19, 2026 · 16:02", actor: "Sofia Ruiz", action: "changed Mei Wong's role from Member to Admin", kind: "role" },
    { id: "a-b4", at: "Apr 14, 2026 · 09:30", actor: "Sofia Ruiz", action: "created Beauty Squad", kind: "team" },
  ],
  "t-atlas": [
    { id: "a-a1", at: "Aug 16, 2026 · 09:12", actor: "Monica Zhou", action: "allocated 20,000 credits to Lena Fischer (hard cap)", kind: "limit" },
    { id: "a-a2", at: "Aug 12, 2026 · 14:03", actor: "System", action: "auto top-up added 200,000 credits — the pool fell below 40,000", kind: "credits" },
    { id: "a-a3", at: "Aug 08, 2026 · 11:40", actor: "Hana Sato", action: "turned on pour-over — unspent allocations return to the pool", kind: "credits" },
    { id: "a-a4", at: "Jul 30, 2026 · 16:55", actor: "Hana Sato", action: "raised the monthly pool to 420,000 credits", kind: "billing" },
    { id: "a-a5", at: "Feb 02, 2026 · 10:00", actor: "Buzz Sales", action: "opened Atlas Media Group on Enterprise", kind: "team" },
  ],
};

/** 待处理申请种子数据:切到 Owner 角色时铃铛里就有东西,不用先自己提一条 */
export const REQUESTS_BY_TEAM: Record<string, TeamRequest[]> = {
  "t-personal": [],
  "t-growth": [
    { id: "r-g1", kind: "topup", fromId: "u-kenji", fromName: "Kenji Ito", amount: 50_000, reason: "Reshooting the BuzzMilk cutdowns — my seat is out for the month.", at: "Aug 15, 2026 · 10:12", status: "pending" },
    { id: "r-g2", kind: "seats", fromId: "u-vera", fromName: "Vera Lam", amount: 2, reason: "Two new designers start Monday.", at: "Aug 14, 2026 · 17:40", status: "pending" },
    { id: "r-g3", kind: "topup", fromId: "u-daniel", fromName: "Daniel Park", amount: 50_000, reason: "Client revisions.", at: "Jul 28, 2026 · 09:05", status: "expired" },
  ],
  "t-beauty": [],
  "t-atlas": [
    { id: "r-a1", kind: "limit", fromId: "u-lena", fromName: "Lena Fischer", amount: 40_000, reason: "Q3 brand film needs another pass — my allocation is spent.", at: "Aug 16, 2026 · 11:20", status: "pending" },
  ],
};

export const ROLE_LABEL: Record<Role, string> = { owner: "Owner", admin: "Admin", finance: "Billing Admin", member: "Member" };

/**
 * 角色能做什么 —— 产品里的权限页与评审清单共用这一份口径。
 * 角色固定四个,但**每个能力对每个角色是否开放可以编辑**(Owner / Admin 可改);
 * 结构性权限(转让、删除、换套餐、授予 Billing Admin、Billing Admin 的产品权限)带锁,不可改。
 */
export type PermissionRow = {
  /** 稳定 id —— 覆盖值与代码里的权限判断都按它索引,改文案不会丢配置 */
  id: string;
  label: string;
  note?: string;
  /** 默认允许的角色 */
  roles: Role[];
  /** 这些角色的格子不可改(结构性权限),给出理由用于 tooltip */
  lock?: { roles: Role[]; reason: string };
  /** 只在某种额度模型下出现的能力（分配额度只有 pool 团队才有） */
  onlyModel?: CreditModel;
};
export type PermissionGroup = { title: string; rows: PermissionRow[] };

/** Owner 永远拥有全部权限,这一列不参与编辑 */
export const PERMISSION_EDIT_ROLES: Role[] = ["admin", "finance", "member"];

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    title: "Workspace",
    rows: [
      {
        id: "product.use",
        label: "Use the product — create and publish work",
        roles: ["owner", "admin", "member"],
        lock: { roles: ["finance"], reason: "Billing Admin is a billing-only role and uses no seat." },
      },
      { id: "team.rename", label: "Rename the team", roles: ["owner", "admin"] },
      { id: "usage.visibility", label: "Turn teammate usage visibility on or off", roles: ["owner"] },
      {
        id: "team.transfer",
        label: "Transfer ownership",
        roles: ["owner"],
        lock: { roles: ["admin", "finance", "member"], reason: "Ownership can only be handed over by the owner." },
      },
      {
        id: "team.delete",
        label: "Delete the team",
        note: "Cancel the plan first",
        roles: ["owner"],
        lock: { roles: ["admin", "finance", "member"], reason: "Only the owner can delete the team." },
      },
    ],
  },
  {
    title: "Members and roles",
    rows: [
      { id: "members.invite", label: "Invite members", roles: ["owner", "admin"] },
      { id: "members.invitations", label: "Resend or revoke an invitation", roles: ["owner", "admin"] },
      { id: "members.role", label: "Change a member's role", roles: ["owner", "admin"] },
      {
        id: "members.grantBilling",
        label: "Grant or revoke Billing Admin",
        roles: ["owner"],
        lock: { roles: ["admin", "finance", "member"], reason: "Billing access is the owner's call." },
      },
      { id: "members.remove", label: "Remove a member", roles: ["owner", "admin"] },
      { id: "permissions.edit", label: "Edit permissions on this page", roles: ["owner", "admin"] },
    ],
  },
  {
    title: "Credits and limits",
    rows: [
      {
        id: "limits.set",
        label: "Allocate credits to a member",
        note: "Enterprise only — the other plans give every seat a fixed amount",
        roles: ["owner", "admin"],
        onlyModel: "pool",
      },
      { id: "credits.request", label: "Request a top-up or a bigger allocation", roles: ["admin", "member"] },
      { id: "credits.approve", label: "Approve top-up and seat requests", roles: ["owner", "finance"] },
      { id: "credits.buy", label: "Buy top-up credits", roles: ["owner", "finance"] },
      {
        id: "credits.autoTopUp",
        label: "Change auto top-up settings",
        note: "Enterprise only — auto top-up refills the shared pool",
        roles: ["owner", "finance"],
        onlyModel: "pool",
      },
    ],
  },
  {
    title: "Plans and billing",
    rows: [
      {
        id: "plan.change",
        label: "Change or cancel the plan",
        roles: ["owner"],
        lock: { roles: ["admin", "finance", "member"], reason: "The plan is a contractual commitment — owner only." },
      },
      { id: "seats.add", label: "Add seats", roles: ["owner"] },
      { id: "billing.payment", label: "Payment method and invoices", roles: ["owner", "finance"] },
    ],
  },
  {
    title: "Visibility",
    rows: [
      {
        id: "usage.seeAll",
        label: "See every teammate's usage",
        note: "Members see their own, or everyone's once the owner opens it up",
        roles: ["owner", "admin", "finance"],
      },
      { id: "activity.read", label: "Read the activity log", roles: ["owner", "admin", "finance"] },
    ],
  },
];

export const PERMISSION_ROWS: PermissionRow[] = PERMISSION_GROUPS.flatMap((group) => group.rows);

/** rowId → 默认允许的角色 */
export const DEFAULT_PERMISSIONS: Record<string, Role[]> = Object.fromEntries(
  PERMISSION_ROWS.map((row) => [row.id, row.roles]),
);

export const ROLE_BLURB: Record<Role, string> = {
  owner: "Billing and everything else",
  admin: "Members and limits, no payment changes",
  finance: "Invoices, payment method, top-ups — no product access",
  member: "Create and publish work",
};

/** Finance 走 billing-only 免费席位,不计入付费席位 */
export function takesPaidSeat(member: Member) {
  return member.role !== "finance" && member.status !== "expired";
}

/** 人物头像统一只取首字母 */
export function initials(name: string) {
  return name.trim()[0]?.toUpperCase() ?? "";
}

export function formatNumber(n: number) {
  return n.toLocaleString("en-US");
}

export function formatTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1000)}K`;
  return String(n);
}
