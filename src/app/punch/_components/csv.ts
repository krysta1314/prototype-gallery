import type { DayCell } from "@/lib/punch/api-types";
import { STATUS_LABEL } from "@/lib/punch/types";

const WEEKDAY = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

function weekdayOf(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return WEEKDAY[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

function escape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function toCsv(days: DayCell[]): string {
  const header = "日期,星期,上班,下班,工时,状态,备注";
  const rows = days.map((d) => {
    const r = d.record;
    const hours = d.workedMinutes != null ? (d.workedMinutes / 60).toFixed(1) : "";
    const status = r ? (r.status === "normal" ? "正常" : STATUS_LABEL[r.status]) : "";
    return [
      d.date,
      weekdayOf(d.date),
      r?.in ?? "",
      r?.out ?? "",
      hours,
      status,
      r?.note ?? "",
    ]
      .map(escape)
      .join(",");
  });
  return [header, ...rows].join("\n");
}

export function downloadCsv(filename: string, csv: string): void {
  // BOM 让 Excel 正确识别 UTF-8 中文
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
