/**
 * 打卡 app 的时间基准：固定北京时间 UTC+8，不读运行环境时区。
 * 实现手法：把时间戳整体 +8h 后一律用 getUTC* 读字段，等价于在 UTC+8 下读本地时间。
 * 北京时间没有夏令时，所以这个固定偏移是精确的。
 */
export const TZ_OFFSET_MS = 8 * 60 * 60 * 1000;

export type BeijingParts = {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  weekday: number; // 0 = 周日
};

export function beijingParts(d: Date): BeijingParts {
  const s = new Date(d.getTime() + TZ_OFFSET_MS);
  return {
    year: s.getUTCFullYear(),
    month: s.getUTCMonth() + 1,
    day: s.getUTCDate(),
    hour: s.getUTCHours(),
    minute: s.getUTCMinutes(),
    weekday: s.getUTCDay(),
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

export function beijingDateKey(d: Date): string {
  const p = beijingParts(d);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

export function beijingHHMM(d: Date): string {
  const p = beijingParts(d);
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

export function parseHHMM(s: string): number {
  const m = /^(\d{2}):(\d{2})$/.exec(s);
  if (!m) throw new Error(`非法时间格式: ${s}`);
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) throw new Error(`非法时间: ${s}`);
  return h * 60 + min;
}

export function formatHHMM(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}

/** dateKey 已经是北京日期，直接当 UTC 日期算周几即可 */
export function isWeekendKey(dateKey: string): boolean {
  const [y, mo, d] = dateKey.split("-").map(Number);
  const wd = new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
  return wd === 0 || wd === 6;
}

/** 返回自当天零点起的分钟数，可能 >= 1440（跨天下班） */
export function computeLeaveMinutes(clockIn: string, workMinutes: number): number {
  return parseHHMM(clockIn) + workMinutes;
}

export function isLate(clockIn: string, deadline: string): boolean {
  return parseHHMM(clockIn) > parseHHMM(deadline);
}

export function workedMinutes(clockIn: string, clockOut: string): number {
  const a = parseHHMM(clockIn);
  const b = parseHHMM(clockOut);
  return b >= a ? b - a : b + 1440 - a;
}

/** 把「北京时间某天某时刻」转成 epoch 毫秒 */
export function beijingEpochMs(dateKey: string, hhmm: string): number {
  const [y, mo, d] = dateKey.split("-").map(Number);
  return Date.UTC(y, mo - 1, d) + parseHHMM(hhmm) * 60_000 - TZ_OFFSET_MS;
}
