/**
 * 用量时间序列 —— 给 Credits & usage 页的堆叠面积图供数。
 *
 * 两条硬约束:
 * 1. **确定性**。同一个团队 / 同一个区间每次渲染必须一模一样,否则 SSR 与客户端会不一致,
 *    评审时也没法对着截图讨论。所以用种子伪随机(mulberry32),不碰 Date.now / Math.random。
 * 2. **对得上现有数字**。区间落在当前账期时,各序列之和会被缩放到 quota.used,
 *    免得图上的总量和上面进度条里的数字互相打脸。
 */

/** 原型里的「今天」—— 与 NEXT_BILL 那套固定日期同一条时间线 */
export const TODAY: { year: number; month: number; day: number } = { year: 2026, month: 8, day: 18 };
export const UPDATED_AT = "Aug 18, 2026, 09:40 UTC";

export type UsageRangeKey = "7d" | "30d" | "cycle";
export const USAGE_RANGES: { key: UsageRangeKey; label: string; days: number }[] = [
  { key: "7d", label: "Last 7 days", days: 7 },
  { key: "30d", label: "Last 30 days", days: 30 },
  { key: "cycle", label: "This cycle", days: 18 },
];

export type UsageSeries = { key: string; color: string; total: number; points: number[] };

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** 从「今天」往前数 n 天的短标签(Jul 24 这种),不依赖 Date */
function dayLabels(count: number) {
  const labels: string[] = [];
  let month = TODAY.month;
  let day = TODAY.day;
  for (let index = 0; index < count; index += 1) {
    labels.unshift(`${MONTH_NAMES[month - 1]} ${day}`);
    day -= 1;
    if (day < 1) {
      month = month === 1 ? 12 : month - 1;
      day = DAYS_IN_MONTH[month - 1]!;
    }
  }
  return labels;
}

/** mulberry32 —— 小、快、确定性够用 */
function prng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(text: string) {
  let value = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

/**
 * 生成一组堆叠序列。
 * `weight` 决定这条序列大致占多少份额;形状是「工作日高、周末低 + 两个自然爆发期」,
 * 因为创作类产品的真实用量就是这样,平铺的随机噪声看着假。
 */
export function buildUsageSeries({
  seed,
  days,
  entries,
  total,
}: {
  seed: string;
  days: number;
  entries: { key: string; color: string; weight: number }[];
  total: number;
}): { labels: string[]; series: UsageSeries[]; total: number } {
  const labels = dayLabels(days);
  const weightSum = entries.reduce((sum, entry) => sum + entry.weight, 0) || 1;

  const raw = entries.map((entry) => {
    const random = prng(hash(`${seed}:${entry.key}`));
    const burstA = Math.floor(days * 0.55) + Math.floor(random() * 3);
    const burstB = days - 2 - Math.floor(random() * 3);
    const points = Array.from({ length: days }, (_, index) => {
      const weekend = (index + 2) % 7 < 2 ? 0.35 : 1;
      const nearA = Math.exp(-((index - burstA) ** 2) / 6);
      const nearB = Math.exp(-((index - burstB) ** 2) / 10);
      const base = 0.12 + random() * 0.18;
      return Math.max(0, (base + nearA * 0.9 + nearB * 1.1) * weekend);
    });
    return { key: entry.key, color: entry.color, points };
  });

  // 缩放:让所有序列之和等于给定 total,单条序列内部保持自己的形状
  const rawTotal = raw.reduce((sum, item) => sum + item.points.reduce((a, b) => a + b, 0), 0) || 1;
  const series: UsageSeries[] = raw.map((item, index) => {
    const share = (entries[index]!.weight / weightSum) * total;
    const own = item.points.reduce((a, b) => a + b, 0) || 1;
    const points = item.points.map((value) => Math.round((value / own) * share));
    return { key: item.key, color: item.color, total: points.reduce((a, b) => a + b, 0), points };
  });

  return {
    labels,
    series,
    total: series.reduce((sum, item) => sum + item.total, 0) || Math.round(rawTotal),
  };
}
