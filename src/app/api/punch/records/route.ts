import { NextResponse } from "next/server";
import { isMissingPunch, monthDateKeys, summarizeMonth } from "@/lib/punch/stats";
import { getSettings, listMonth } from "@/lib/punch/store";
import { beijingDateKey, isLate, isWeekendKey, workedMinutes } from "@/lib/punch/time";
import type { DayCell, RecordsResponse } from "@/lib/punch/api-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const today = beijingDateKey(new Date());

  const year = Number(url.searchParams.get("year") ?? today.slice(0, 4));
  const month = Number(url.searchParams.get("month") ?? today.slice(5, 7));

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: "年月参数不合法" }, { status: 400 });
  }

  const [records, settings] = await Promise.all([listMonth(year, month), getSettings()]);
  const byDate = new Map(records.map((r) => [r.date, r]));

  const days: DayCell[] = monthDateKeys(year, month).map((date) => {
    const record = byDate.get(date) ?? null;
    return {
      date,
      weekend: isWeekendKey(date),
      missing: isMissingPunch(record ?? undefined, date, today),
      record,
      workedMinutes:
        record?.status === "normal" && record?.in && record?.out
          ? workedMinutes(record.in, record.out)
          : null,
      late: Boolean(
        record?.status === "normal" &&
          record?.in &&
          !isWeekendKey(date) &&
          isLate(record.in, settings.clockInDeadline)
      ),
    };
  });

  const body: RecordsResponse = {
    year,
    month,
    today,
    days,
    summary: summarizeMonth(year, month, records, settings, today),
    settings,
  };

  return NextResponse.json(body);
}
