import { NextResponse } from "next/server";
import { cancelClockOutReminder, scheduleClockOutReminder } from "@/lib/punch/schedule";
import { getDay, getSettings, putDay } from "@/lib/punch/store";
import { beijingDateKey, beijingEpochMs, beijingHHMM } from "@/lib/punch/time";
import type { DayRecord } from "@/lib/punch/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let type: "in" | "out";
  try {
    ({ type } = await request.json());
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
  if (type !== "in" && type !== "out") {
    return NextResponse.json({ error: "type 只能是 in 或 out" }, { status: 400 });
  }

  const now = new Date();
  const today = beijingDateKey(now);
  const hhmm = beijingHHMM(now);

  const existing = await getDay(today);

  // 幂等：已经打过的卡不覆盖，直接把现有记录还回去
  if (existing?.[type]) {
    return NextResponse.json({ ok: true, record: existing });
  }

  const record: DayRecord = {
    date: today,
    status: "normal",
    ...existing,
    [type]: hhmm,
    // 人来打上班卡了，就不可能还是请假/假期；不覆盖的话 notify 会因 status 非 normal 静默跳过提醒
    ...(type === "in" ? { status: "normal" as const } : {}),
    updatedAt: now.toISOString(),
  };

  await putDay(record);

  let scheduled: boolean | undefined;

  if (type === "in") {
    // 排下班提醒。周末也排 —— 补班那天打了上班卡同样需要提醒下班。
    const settings = await getSettings();
    if (settings.eveningEnabled) {
      const fireAt = beijingEpochMs(today, hhmm) + settings.workMinutes * 60_000;
      scheduled = (await scheduleClockOutReminder(today, fireAt)) !== null;
    }
    // 关闭下班提醒时 scheduled 保持 undefined：这是用户主动关的，不该在主页弹警告
  } else {
    // 提前下班：把还没投递的那条提醒取消掉
    await cancelClockOutReminder(today);
  }

  return NextResponse.json({ ok: true, record, scheduled });
}
