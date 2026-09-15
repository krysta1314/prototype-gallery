import { isLate, isWeekendKey, workedMinutes } from "./time";
import type { DayRecord, Settings } from "./types";

const pad = (n: number) => String(n).padStart(2, "0");

export function monthDateKeys(year: number, month: number): string[] {
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return Array.from({ length: days }, (_, i) => `${year}-${pad(month)}-${pad(i + 1)}`);
}

/**
 * 缺卡 = 该日已经到来（<= 今天）、不是周末且无记录，或有记录但状态正常却缺了上班或下班任一张卡。
 * 请假与假期永远不算缺卡。
 */
export function isMissingPunch(
  rec: DayRecord | undefined,
  dateKey: string,
  todayKey: string
): boolean {
  if (dateKey > todayKey) return false;
  if (!rec) return !isWeekendKey(dateKey);
  if (rec.status !== "normal") return false;
  return !rec.in || !rec.out;
}

export type MonthSummary = {
  attendedDays: number;
  lateDays: number;
  missingDays: number;
  avgWorkedMinutes: number;
};

export function summarizeMonth(
  year: number,
  month: number,
  records: DayRecord[],
  settings: Settings,
  todayKey: string
): MonthSummary {
  const byDate = new Map(records.map((r) => [r.date, r]));
  const normal = records.filter((r) => r.status === "normal");

  const attended = normal.filter((r) => r.in || r.out);
  const late = normal.filter((r) => r.in && !isWeekendKey(r.date) && isLate(r.in, settings.clockInDeadline));
  const complete = normal.filter((r) => r.in && r.out);

  const totalWorked = complete.reduce((sum, r) => sum + workedMinutes(r.in!, r.out!), 0);

  const missingDays = monthDateKeys(year, month).filter((k) =>
    isMissingPunch(byDate.get(k), k, todayKey)
  ).length;

  return {
    attendedDays: attended.length,
    lateDays: late.length,
    missingDays,
    avgWorkedMinutes: complete.length ? Math.round(totalWorked / complete.length) : 0,
  };
}
