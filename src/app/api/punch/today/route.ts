import { NextResponse } from "next/server";
import { getDay, getSettings } from "@/lib/punch/store";
import {
  beijingDateKey,
  beijingEpochMs,
  beijingHHMM,
  computeLeaveMinutes,
  formatHHMM,
  isLate,
  isWeekendKey,
} from "@/lib/punch/time";
import type { TodayResponse } from "@/lib/punch/api-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const now = new Date();
  const today = beijingDateKey(now);

  const [record, settings] = await Promise.all([getDay(today), getSettings()]);

  let leaveAt: string | null = null;
  let leaveAtMs: number | null = null;
  if (record?.in) {
    const minutes = computeLeaveMinutes(record.in, settings.workMinutes);
    leaveAt = formatHHMM(minutes);
    leaveAtMs = beijingEpochMs(today, record.in) + settings.workMinutes * 60_000;
  }

  const body: TodayResponse = {
    today,
    now: beijingHHMM(now),
    record,
    settings,
    leaveAt,
    leaveAtMs,
    late: record?.in && !isWeekendKey(today) ? isLate(record.in, settings.clockInDeadline) : false,
  };

  return NextResponse.json(body);
}
