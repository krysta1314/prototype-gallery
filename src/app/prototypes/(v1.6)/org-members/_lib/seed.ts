import type { CostModel, GenEvent, Member, MemberWithUsage, Org } from "./types";

/**
 * 数据完全确定性:线性同余伪随机 + 固定种子 + 写死的 TODAY。
 * 所以模块顶层算一次即可,SSR 与浏览器结果一致,不会 hydration mismatch。
 */

/** 写死 13 Aug 2026 —— 不用 new Date(),否则相对日期会一天天漂 */
export const TODAY = new Date(2026, 7, 13);
/** 生成的历史窗口长度 */
export const DAYS = 150;
/** 占位的 credit → USD 混合汇率 */
export const USD_PER_CREDIT = 0.00714;

export const COST_MODEL: CostModel[] = [
  { k: "video_pro", label: "Video · Pro 10s", credits: 679, usd: 4.85, w: 0.04 },
  { k: "video_std", label: "Video · Std 5s", credits: 49, usd: 0.35, w: 0.46 },
  { k: "video_fast", label: "Video · Fast 5s", credits: 28, usd: 0.2, w: 0.16 },
  { k: "image", label: "Image · Keyframe", credits: 8, usd: 0.06, w: 0.22 },
  { k: "llm", label: "Buzz Agent LLM", credits: 3, usd: 0.02, w: 0.12 },
];

export const DEPTS = [
  "Video Production",
  "Content HK",
  "Content GZ",
  "Marketing",
  "Design",
  "Pop Media",
  "Sales",
  "Tech SZ",
  "Management",
];

/** 组织默认月度额度 */
export const ORG_DEFAULT_ALLOCATION = 3000;

const RAW_MEMBERS: Member[] = [
  { id: "338613064876220416", name: "wing.wong", email: "wing.wong@presslogic.com", dept: "Video Production", role: "Team Lead", status: "active", allocation: 20000, allTime: 13957, seed: 11, override: true },
  { id: "338975613224280064", name: "GZ_Sophie Yao", email: "sophie.yao@presslogic.com", dept: "Content GZ", role: "Editor", status: "active", allocation: 8000, allTime: 6468, seed: 23, override: true },
  { id: "339971839197503488", name: "wing.cheng", email: "wing.cheng@popmedia.hk", dept: "Pop Media", role: "Producer", status: "active", allocation: 6000, allTime: 2405, seed: 31, override: false },
  { id: "340105111940423680", name: "jessie.chan", email: "jessie.chan@presslogic.com", dept: "Content HK", role: "Editor", status: "active", allocation: 3000, allTime: 1470, seed: 47, override: false },
  { id: "340702169378381824", name: "anson.cheung", email: "anson.cheung@presslogic.com", dept: "Video Production", role: "Producer", status: "active", allocation: 3000, allTime: 1371, seed: 53, override: false },
  { id: "339981529826516992", name: "Natalie Ho", email: "natalie.ho@presslogic.com", dept: "Marketing", role: "Marketer", status: "active", allocation: 3000, allTime: 650, seed: 61, override: false },
  { id: "342586250982645760", name: "SZ_Zane Yi", email: "zane.yi@presslogic.com", dept: "Tech SZ", role: "Engineer", status: "active", allocation: 5000, allTime: 225, seed: 67, override: true },
  { id: "337786537360023552", name: "Florence Ho", email: "florence.ho@presslogic.com", dept: "Sales", role: "Account Exec", status: "active", allocation: 3000, allTime: 26, seed: 71, override: false },
  { id: "346147398520725504", name: "Jenny Chan", email: "jenny.chan@presslogic.com", dept: "Content HK", role: "Editor", status: "active", allocation: 3000, allTime: 8, seed: 79, override: false },
  { id: "340699529814794240", name: "Viann Wu", email: "viann.wu@presslogic.com", dept: "Marketing", role: "Marketer", status: "dormant", allocation: 3000, allTime: 0, seed: 83, override: false },
  { id: "339989646735892480", name: "Zero Chung", email: "zero.chung@presslogic.com", dept: "Design", role: "Designer", status: "dormant", allocation: 3000, allTime: 0, seed: 89, override: false },
  { id: "—-inv-1", name: "Parry Lam", email: "parry.lam@presslogic.com", dept: "Sales", role: "Director", status: "invited", allocation: 3000, allTime: 0, seed: 97, override: false },
  { id: "—-inv-2", name: "Wilson Tsang", email: "wilson.tsang@presslogic.com", dept: "Sales", role: "Manager", status: "invited", allocation: 3000, allTime: 0, seed: 101, override: false },
  { id: "—-sus-1", name: "test", email: "test@presslogic.com", dept: "Tech SZ", role: "QA", status: "suspended", allocation: 500, allTime: 8, seed: 103, override: false },
  { id: "340000000000000001", name: "Ivan Lau", email: "ivan@presslogic.com", dept: "Management", role: "Owner", status: "active", allocation: 50000, allTime: 4120, seed: 107, override: true },
];

const PROMPTS: [string, string][] = [
  ["GirlStyle 韓系秋冬妝容 15s reel", "GS-2608-Beauty"],
  ["Baby Kingdom 育兒小貼士 · 換季濕疹", "BK-2607-Parenting"],
  ["HolidaySmart 東京隱世咖啡店 Top 5", "HS-2608-Travel"],
  ["TopGlow 診所 · 醫美療程前後對比", "TG-2608-Clinic"],
  ["PopDaily 深水埗新開麵店開箱", "PD-2607-Food"],
  ["Business Focus 季度財報動態圖卡", "BF-2608-Finance"],
  ["UrbanLife 週末市集宣傳片 9:16", "UL-2608-Lifestyle"],
  ["MamiDaily 幼稚園面試準備 carousel", "MD-2607-Parenting"],
  ["GirlStyle 護膚品成分解說 talking head", "GS-2608-Beauty"],
  ["內部測試 · prompt 調參", "INTERNAL-TEST"],
  ["KOL 合作提案 mood video", "SALES-PITCH"],
  ["NextVibe VIP 活動宣傳 teaser", "NV-2608-Community"],
];

/** 线性同余伪随机 —— 同一 seed 永远同一串 */
function rng(seed: number) {
  let s = (seed * 2654435761) % 4294967296;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/** 把每天的 credits 拆成一条条生成事件 */
function buildEvents(m: Member, daily: number[]): GenEvent[] {
  const r = rng(m.seed + 7);
  const out: GenEvent[] = [];
  for (let i = 0; i < DAYS; i++) {
    let left = daily[i];
    let guard = 0;
    while (left > 2 && guard++ < 40) {
      const x = r();
      let acc = 0;
      let pick = COST_MODEL[1];
      for (const c of COST_MODEL) {
        acc += c.w;
        if (x <= acc) {
          pick = c;
          break;
        }
      }
      // 别让一条 Pro 渲染把当天剩余额度撑爆,退回图片
      if (pick.credits > left * 1.6 && left < 200) pick = COST_MODEL[3];
      const [prompt, tag] = PROMPTS[Math.floor(r() * PROMPTS.length)];
      out.push({
        day: i,
        model: pick,
        prompt,
        tag,
        credits: pick.credits,
        usd: pick.usd,
        kind: pick.k === "image" ? "image" : pick.k === "llm" ? "agent" : "video",
        hue: Math.floor(r() * 360),
        hue2: Math.floor(r() * 360),
        dur: pick.k === "video_pro" ? "0:10" : "0:05",
        sess: "S-" + (3446 + Math.floor(r() * 900)),
        status: r() < 0.9 ? "done" : r() < 0.6 ? "failed" : "running",
      });
      left -= pick.credits;
    }
  }
  return out;
}

/** 每人一条 150 天日序列:有人爆发式工作、有人平稳,周末衰减,向今天爬坡 */
function buildDaily(m: Member): number[] {
  const r = rng(m.seed);
  const raw: number[] = [];
  const burst = r() < 0.55;
  const recency = 0.4 + r() * 1.5;
  for (let i = 0; i < DAYS; i++) {
    const dow = (TODAY.getDay() - ((DAYS - 1 - i) % 7) + 70) % 7;
    let v = r();
    if (burst) v = r() < 0.3 ? v * 3.4 : v * 0.22;
    if (dow === 0 || dow === 6) v *= 0.22;
    v *= Math.pow((i + 1) / DAYS, recency);
    raw.push(v);
  }
  const sum = raw.reduce((a, b) => a + b, 0) || 1;
  return raw.map((v) => (m.allTime * v) / sum);
}

/*
 * 老板说内部先管 100 人 —— 只有 15 条种子看不出分页与批量操作撑不撑得住,
 * 所以把这些真人之后再确定性地补一批填充成员。名字带序号,一眼能看出是填充数据。
 * 用途只有一个:验证列表形态(分页、排序、批量勾选)在真实规模下的样子。
 */
const FILLER_COUNT = 88;

const FILLER: Member[] = Array.from({ length: FILLER_COUNT }, (_, index) => {
  const n = index + 1;
  const dept = DEPTS[n % DEPTS.length]!;
  const roles = ["Editor", "Producer", "Designer", "Marketer", "Engineer"];
  // 确定性:所有随机量都由序号算出,不碰 Math.random
  const allTime = ((n * 977) % 9_000) + (n % 7) * 120;
  return {
    id: `filler-${n}`,
    name: `${dept.split(" ")[0]}_Member ${String(n).padStart(2, "0")}`,
    email: `member${String(n).padStart(2, "0")}@presslogic.com`,
    dept,
    role: roles[n % roles.length]!,
    status: n % 17 === 0 ? "dormant" : "active",
    allocation: n % 11 === 0 ? 8_000 : ORG_DEFAULT_ALLOCATION,
    allTime,
    seed: 200 + n * 3,
    override: n % 11 === 0,
  };
});

export const MEMBERS: MemberWithUsage[] = [...RAW_MEMBERS, ...FILLER].map((m) => {
  const daily = buildDaily(m);
  return { ...m, daily, events: buildEvents(m, daily) };
});

export const memberByEmail = (email: string) =>
  MEMBERS.find((m) => m.email === email) ?? MEMBERS[0];

/* ---------- 组织 ---------- */

/** 我们自己的 COGS —— 与 rate card 同一个数字 */
export const COGS_PER_CREDIT = 0.00263;

export const ORGS: Org[] = [
  {
    id: "org-presslogic",
    name: "PressLogic",
    tier: "E3",
    poolCredits: 422_500,
    // 自己不对自己收费,所以 $ 列走 COGS
    monthlyPrice: 0,
    rateBasis: "internal",
    autoJoinDomains: ["presslogic.com", "popmedia.hk"],
    defaultAllocation: ORG_DEFAULT_ALLOCATION,
  },
  {
    // 演示同一套界面给客户看时长什么样:$ 列换成客户的有效单价,COGS 不露出
    id: "org-atlas",
    name: "Atlas Media Group",
    tier: "E2",
    poolCredits: 253_500,
    monthlyPrice: 2_399,
    rateBasis: "customer",
    autoJoinDomains: ["atlasmedia.com"],
    defaultAllocation: 20_000,
  },
];

export const DEFAULT_ORG_ID = "org-presslogic";
