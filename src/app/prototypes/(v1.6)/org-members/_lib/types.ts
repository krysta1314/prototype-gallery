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
export type ModalKind = "invite" | "budget" | "topup" | "export";
