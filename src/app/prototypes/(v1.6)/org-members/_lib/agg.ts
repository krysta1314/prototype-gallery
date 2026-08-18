import { DAYS, MEMBERS, TODAY } from "./seed";
import type {
  Agg,
  MemberWithUsage,
  Period,
  PeriodKey,
  Row,
  SortKey,
  StatusFilter,
} from "./types";

export function dOffset(n: number) {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - n);
  return d;
}

export function idxOfDate(d: Date) {
  return DAYS - 1 - Math.round((TODAY.getTime() - d.getTime()) / 86400000);
}

export const PERIODS: Record<PeriodKey, Period> = {
  "7": { label: "Last 7 days", short: "Last 7 days", from: dOffset(6), to: TODAY, prevFrom: dOffset(13), prevTo: dOffset(7) },
  "30": { label: "Last 30 days", short: "Last 30 days", from: dOffset(29), to: TODAY, prevFrom: dOffset(59), prevTo: dOffset(30) },
  lm: { label: "Last month (Jul 2026)", short: "Last month", from: new Date(2026, 6, 1), to: new Date(2026, 6, 31), prevFrom: new Date(2026, 5, 1), prevTo: new Date(2026, 5, 30) },
  tm: { label: "This month (Aug 2026)", short: "This month", from: new Date(2026, 7, 1), to: TODAY, prevFrom: new Date(2026, 6, 1), prevTo: new Date(2026, 6, 13) },
  all: { label: "All time", short: "All time", from: dOffset(DAYS - 1), to: TODAY, prevFrom: dOffset(DAYS - 1), prevTo: dOffset(DAYS - 1) },
};

export const PERIOD_KEYS = Object.keys(PERIODS) as PeriodKey[];

export function agg(m: MemberWithUsage, from: Date, to: Date): Agg {
  const a = Math.max(0, idxOfDate(from));
  const b = Math.min(DAYS - 1, idxOfDate(to));
  let credits = 0;
  let usd = 0;
  let v = 0;
  let img = 0;
  let usdV = 0;
  let usdI = 0;
  let ag = 0;
  let fail = 0;
  const sessions = new Set<string>();
  const series: number[] = [];
  for (let i = a; i <= b; i++) series.push(0);
  m.events.forEach((e) => {
    if (e.day < a || e.day > b) return;
    credits += e.credits;
    usd += e.usd;
    sessions.add(e.sess);
    if (e.kind === "video") {
      v++;
      usdV += e.usd;
    } else if (e.kind === "image") {
      img++;
      usdI += e.usd;
    } else ag++;
    if (e.status === "failed") fail++;
    series[e.day - a] += e.credits;
  });
  return {
    credits: Math.round(credits),
    usd,
    videos: v,
    images: img,
    usdVideos: usdV,
    usdImages: usdI,
    agent: ag,
    fail,
    sessions: sessions.size,
    series,
    costPerVideo: v ? usd / v : 0,
  };
}

export type Totals = {
  credits: number;
  usd: number;
  videos: number;
  images: number;
  usdVideos: number;
  usdImages: number;
  fail: number;
  sessions: number;
};

export function totals(list: Row[], which: "a" | "p"): Totals {
  return list.reduce<Totals>(
    (t, r) => {
      const s = r[which];
      t.credits += s.credits;
      t.usd += s.usd;
      t.videos += s.videos;
      t.images += s.images;
      t.usdVideos += s.usdVideos;
      t.usdImages += s.usdImages;
      t.fail += s.fail;
      t.sessions += s.sessions;
      return t;
    },
    { credits: 0, usd: 0, videos: 0, images: 0, usdVideos: 0, usdImages: 0, fail: 0, sessions: 0 },
  );
}

export function delta(now: number, prev: number): number | null {
  if (!prev) return null;
  return ((now - prev) / prev) * 100;
}

/** 主表的筛选 + 排序。budgetOf 走 overrides,所以改额度后按「预算使用率」排序会立刻变 */
export function buildRows(opts: {
  period: PeriodKey;
  status: StatusFilter;
  q: string;
  sort: SortKey;
  dir: number;
  budgetOf: (m: MemberWithUsage) => { budget: number; isOverride: boolean };
}): Row[] {
  const P = PERIODS[opts.period];
  let list: Row[] = MEMBERS.map((m) => {
    const b = opts.budgetOf(m);
    return {
      m,
      a: agg(m, P.from, P.to),
      p: agg(m, P.prevFrom, P.prevTo),
      budget: b.budget,
      isOverride: b.isOverride,
    };
  });
  if (opts.status === "active+")
    list = list.filter((r) => r.m.status === "active" || r.m.status === "dormant");
  else if (opts.status !== "all") list = list.filter((r) => r.m.status === opts.status);
  if (opts.q) {
    const q = opts.q.toLowerCase();
    list = list.filter((r) => (r.m.name + r.m.email + r.m.dept).toLowerCase().includes(q));
  }
  const key: Record<SortKey, (r: Row) => number | string> = {
    usd: (r) => r.a.usd,
    credits: (r) => r.a.credits,
    videos: (r) => r.a.videos,
    name: (r) => r.m.name.toLowerCase(),
    util: (r) => r.a.credits / r.budget,
    cpv: (r) => r.a.costPerVideo,
  };
  const f = key[opts.sort] ?? key.usd;
  list.sort((x, y) => {
    const a = f(x);
    const b = f(y);
    return (a > b ? 1 : a < b ? -1 : 0) * opts.dir;
  });
  return list;
}

export type FlagTone = "ok" | "warn" | "bad" | "info";
export type Flag = { t: string; c: FlagTone; v: string };

/** 「Attention needed」面板 —— 全部从当期数据推,改额度后前两行会跟着变 */
export function flags(list: Row[]): Flag[] {
  const names = (rs: Row[]) => rs.map((r) => r.m.name).join(", ");
  const over = list.filter((r) => r.a.credits > r.budget);
  const near = list.filter((r) => r.a.credits <= r.budget && r.a.credits > r.budget * 0.8);
  const idle = list.filter((r) => r.m.status !== "invited" && r.a.credits === 0);
  const withV = list
    .filter((r) => r.a.videos > 2)
    .map((r) => r.a.costPerVideo)
    .sort((a, b) => a - b);
  const med = withV.length ? withV[Math.floor(withV.length / 2)] : 0;
  const ineff = list.filter((r) => r.a.videos > 2 && r.a.costPerVideo > med * 1.8);
  const failers = list.filter((r) => r.a.fail >= 3);
  return [
    { t: "Over monthly budget", c: over.length ? "bad" : "ok", v: over.length ? names(over) : "none" },
    { t: "Above 80% of budget", c: near.length ? "warn" : "ok", v: near.length ? names(near) : "none" },
    { t: "Seats with zero usage", c: idle.length ? "warn" : "ok", v: idle.length ? names(idle) : "none" },
    { t: "Cost/video > 1.8× median", c: ineff.length ? "warn" : "ok", v: ineff.length ? names(ineff) : "none" },
    { t: "3+ failed generations", c: failers.length ? "info" : "ok", v: failers.length ? names(failers) : "none" },
  ];
}

/** 最后一次有实质用量的日子 */
export function lastActiveStr(m: MemberWithUsage) {
  for (let i = DAYS - 1; i >= 0; i--) {
    if (m.daily[i] > 1) {
      const d = dOffset(DAYS - 1 - i);
      const days = Math.round((TODAY.getTime() - d.getTime()) / 86400000);
      return days === 0 ? "today" : days === 1 ? "yesterday" : days + "d ago";
    }
  }
  return "—";
}

/* ---------- 格式化 ---------- */
export const fmt = (n: number) => n.toLocaleString("en-US");
export const money = (n: number) =>
  "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const money0 = (n: number) => "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
export const dstr = (d: Date) => d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });

export function initials(n: string) {
  const p = n.replace(/[_.]/g, " ").split(" ").filter(Boolean);
  return ((p[0] || "")[0] + ((p[1] || "")[0] || "")).toUpperCase();
}

export function avColor(seed: number) {
  const h = (seed * 47) % 360;
  return `linear-gradient(135deg,hsl(${h} 72% 62%),hsl(${(h + 38) % 360} 66% 48%))`;
}

/** 把一条日序列压成 n 根柱子 */
export function bucketize(series: number[], target: number) {
  const step = Math.max(1, Math.ceil(series.length / target));
  const out: number[] = [];
  for (let i = 0; i < series.length; i += step) {
    out.push(series.slice(i, i + step).reduce((a, b) => a + b, 0));
  }
  return out;
}
