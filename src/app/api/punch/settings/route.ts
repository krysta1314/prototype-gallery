import { NextResponse } from "next/server";
import { cancelClockOutReminder, scheduleClockOutReminder, syncMorningSchedule } from "@/lib/punch/schedule";
import { getDay, getSettings, putSettings } from "@/lib/punch/store";
import { beijingDateKey, beijingEpochMs, parseHHMM } from "@/lib/punch/time";
import type { Settings } from "@/lib/punch/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getSettings());
}

export async function PUT(request: Request) {
  let body: Partial<Settings>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  const current = await getSettings();
  const next: Settings = { ...current, ...body };

  for (const field of ["clockInDeadline", "morningReminder"] as const) {
    try {
      parseHHMM(next[field]);
    } catch {
      return NextResponse.json({ error: "时间格式不对" }, { status: 400 });
    }
  }

  if (!Number.isInteger(next.workMinutes) || next.workMinutes < 1 || next.workMinutes > 1440) {
    return NextResponse.json({ error: "工时必须是 1 到 1440 之间的分钟数" }, { status: 400 });
  }

  for (const field of ["morningEnabled", "eveningEnabled"] as const) {
    if (typeof next[field] !== "boolean") {
      return NextResponse.json({ error: "开关字段必须是布尔值" }, { status: 400 });
    }
  }

  await putSettings(next);

  const result: { ok: true; settings: Settings; morningSynced?: boolean; eveningRescheduled?: boolean } = {
    ok: true,
    settings: next,
  };

  if (next.morningReminder !== current.morningReminder || next.morningEnabled !== current.morningEnabled) {
    result.morningSynced = await syncMorningSchedule(next.morningReminder, next.morningEnabled);
  }

  if (next.workMinutes !== current.workMinutes || next.eveningEnabled !== current.eveningEnabled) {
    const today = beijingDateKey(new Date());
    const rec = await getDay(today);
    if (next.eveningEnabled && rec?.status === "normal" && rec.in && !rec.out) {
      const fireAt = beijingEpochMs(today, rec.in) + next.workMinutes * 60_000;
      result.eveningRescheduled = (await scheduleClockOutReminder(today, fireAt)) !== null;
    } else if (!next.eveningEnabled) {
      await cancelClockOutReminder(today);
      result.eveningRescheduled = true;
    }
  }

  return NextResponse.json(result);
}
