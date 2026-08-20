export type CostModel = {
  k: "video_pro" | "video_std" | "video_fast" | "image" | "llm";
  label: string;
  credits: number;
  usd: number;
  /** 抽样权重 */
  w: number;
};

export type MemberStatus = "active" | "dormant" | "invited" | "suspended";

export type Member = {
  id: string;
  name: string;
  email: string;
  dept: string;
  role: string;
  status: MemberStatus;
  /** 月度额度(种子值;运行时以 overrides 为准) */
  budget: number;
  /** 累计消耗 credits,用来归一化生成的日序列 */
  allTime: number;
  seed: number;
  /** 种子数据里是否已有 per-user override */
  override: boolean;
};

export type GenKind = "video" | "image" | "agent";

export type GenEvent = {
  /** 距今 150 天窗口内的下标,0 = 最早 */
  day: number;
  model: CostModel;
  prompt: string;
  tag: string;
  credits: number;
  usd: number;
  kind: GenKind;
  hue: number;
  hue2: number;
  dur: string;
  sess: string;
  status: "done" | "failed" | "running";
};

export type MemberWithUsage = Member & {
  daily: number[];
  events: GenEvent[];
};

export type PeriodKey = "7" | "30" | "lm" | "tm" | "all";

export type Period = {
  label: string;
  short: string;
  from: Date;
  to: Date;
  prevFrom: Date;
  prevTo: Date;
};

export type Agg = {
  credits: number;
  usd: number;
  videos: number;
  images: number;
  /** 视频 / 图片各自的真实现金成本 */
  usdVideos: number;
  usdImages: number;
  agent: number;
  fail: number;
  sessions: number;
  series: number[];
  costPerVideo: number;
};

export type Row = { m: MemberWithUsage; a: Agg; p: Agg; budget: number; isOverride: boolean };

/** Adjust budget 弹窗写入的那一层 */
export type Override = { budget: number; isOverride: boolean };

export type ViewKey = "members" | "detail" | "projects";
export type TabKey = "gen" | "canvas" | "tag" | "tx";
export type GenFilter = "all" | GenKind;
export type SortKey = "usd" | "credits" | "videos" | "name" | "util" | "cpv";
export type StatusFilter = "active+" | "all" | MemberStatus;
export type ModalKind = "invite" | "budget" | "topup" | "export" | "domains";

/* ------------------------------------------------------------------ *
 * 组织层 —— 这一页不再是「内部专用后台」,而是 Enterprise 组织的管理视图。
 * PressLogic 只是其中一个组织(用自己的产品管自己人),客户组织用同一套界面。
 *
 * 唯一必须分内外的东西是**成本换算率**:
 *   internal → 我们的 COGS,绝不能出现在客户界面上
 *   customer → 客户自己的有效单价 = 合同月费 ÷ 月度池额度
 * 其余能力(部门归属、按人分配、作品明细、财务导出、域名自动加入)全部通用。
 * ------------------------------------------------------------------ */

export type RateBasis = "internal" | "customer";

export type Org = {
  id: string;
  name: string;
  /** Enterprise 档位 —— 决定审计日志与 SSO 是否开放 */
  tier: "E1" | "E2" | "E3";
  /** 组织月度共享池额度 */
  poolCredits: number;
  /** 合同年付月价;internal 组织为 0（不对自己收费） */
  monthlyPrice: number;
  /**
   * $ 列的换算口径。
   * internal 用 COGS;customer 用 monthlyPrice / poolCredits 反推有效单价。
   */
  rateBasis: RateBasis;
  /** 域名自动加入规则 —— 命中的邮箱注册即入组织,拿组织默认额度 */
  autoJoinDomains: string[];
  /** 组织默认月度分配额度,新成员按它起步,可按人 override */
  defaultBudget: number;
};

/** 审计能力自 E2 起 —— 与 rate card §6.6 同口径 */
export function canAudit(org: Org) {
  return org.tier !== "E1";
}

/** 每 credit 折多少钱 —— 整页所有 $ 都过这一个函数 */
export function rateOf(org: Org, cogsPerCredit: number) {
  if (org.rateBasis === "internal") return cogsPerCredit;
  return org.poolCredits === 0 ? 0 : org.monthlyPrice / org.poolCredits;
}
