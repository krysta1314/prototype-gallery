"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import type { DayCell, RecordsResponse } from "@/lib/punch/api-types";
import { STATUS_LABEL } from "@/lib/punch/types";
import { downloadCsv, toCsv } from "../_components/csv";
import { EditDayDialog } from "../_components/edit-day-dialog";

const WEEKDAY = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

function weekdayOf(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return WEEKDAY[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

export default function RecordsPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getUTCFullYear());
  const [month, setMonth] = useState(now.getUTCMonth() + 1);
  const [data, setData] = useState<RecordsResponse | null>(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<DayCell | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/punch/records?year=${year}&month=${month}`, { cache: "no-store" });
      if (!res.ok) throw new Error();
      setData(await res.json());
      setError("");
    } catch {
      setError("读取失败，请重试");
    }
  }, [year, month]);

  useEffect(() => {
    void load();
  }, [load]);

  function shift(delta: number) {
    const m = month + delta;
    if (m < 1) {
      setYear(year - 1);
      setMonth(12);
    } else if (m > 12) {
      setYear(year + 1);
      setMonth(1);
    } else {
      setMonth(m);
    }
  }

  return (
    <main className="space-y-4 px-4 pt-8">
      <header className="flex items-center justify-between px-2">
        <button onClick={() => shift(-1)} aria-label="上个月" className="p-2">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-lg font-semibold">
          {year} 年 {month} 月
        </h1>
        <button onClick={() => shift(1)} aria-label="下个月" className="p-2">
          <ChevronRight size={20} />
        </button>
      </header>

      {error && <p className="text-center text-sm text-red-600">{error}</p>}

      {data && (
        <>
          <section className="grid grid-cols-4 gap-2 rounded-2xl bg-white p-4 text-center shadow-sm">
            {[
              ["出勤", `${data.summary.attendedDays} 天`],
              ["迟到", `${data.summary.lateDays} 次`],
              ["缺卡", `${data.summary.missingDays} 天`],
              ["平均", `${(data.summary.avgWorkedMinutes / 60).toFixed(1)} h`],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs text-neutral-400">{label}</p>
                <p className="mt-0.5 font-medium tabular-nums">{value}</p>
              </div>
            ))}
          </section>

          <button
            onClick={() => downloadCsv(`打卡记录-${year}-${String(month).padStart(2, "0")}.csv`, toCsv(data.days))}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm shadow-sm"
          >
            <Download size={16} />
            导出 CSV
          </button>

          <ul className="overflow-hidden rounded-2xl bg-white shadow-sm">
            {data.days.map((d) => {
              const r = d.record;
              const dim = d.weekend && !r;
              return (
                <li key={d.date}>
                  <button
                    onClick={() => setEditing(d)}
                    className="flex w-full items-center gap-3 border-b border-neutral-100 px-4 py-3 text-left last:border-0"
                  >
                    <span className={`w-20 shrink-0 text-sm tabular-nums ${dim ? "text-neutral-300" : ""}`}>
                      {d.date.slice(5)} {weekdayOf(d.date)}
                    </span>

                    <span className={`flex-1 font-mono text-sm tabular-nums ${dim ? "text-neutral-300" : ""}`}>
                      {r && r.status !== "normal"
                        ? STATUS_LABEL[r.status]
                        : r?.in || r?.out
                          ? `${r.in ?? "--:--"} — ${r.out ?? "--:--"}`
                          : "—"}
                    </span>

                    <span className="flex shrink-0 items-center gap-1.5">
                      {d.workedMinutes != null && (
                        <span className="text-sm tabular-nums text-neutral-500">
                          {(d.workedMinutes / 60).toFixed(1)}h
                        </span>
                      )}
                      {d.late && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700">迟到</span>
                      )}
                      {d.missing && (
                        <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] text-red-700">缺卡</span>
                      )}
                      {r?.manual && (
                        <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-500">手动</span>
                      )}
                      {d.weekend && r && (
                        <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] text-sky-700">周末</span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {editing && (
        <EditDayDialog cell={editing} onClose={() => setEditing(null)} onSaved={() => void load()} />
      )}
    </main>
  );
}
