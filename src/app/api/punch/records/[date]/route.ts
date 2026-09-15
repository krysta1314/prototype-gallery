import { NextResponse } from "next/server";
import { cancelClockOutReminder, scheduleClockOutReminder } from "@/lib/punch/schedule";
import { getDay, getSettings, putDay } from "@/lib/punch/store";
import { beijingDateKey, beijingEpochMs, parseHHMM } from "@/lib/punch/time";
import type { DayRecord, DayStatus } from "@/lib/punch/types";

export const runtime = "nodejs";

type Patch = {
  in?: string | null;
  out?: string | null;
  note?: string | null;
  status?: DayStatus;
};

const STATUSES: DayStatus[] = ["normal", "leave", "holiday"];

export async function PUT(
  request: Request,
  ctx: { params: Promise<{ date: string }> }
) {
  // Next.js 16 起 params 是 Promise，必须 await
  const { date } = await ctx.params;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "日期格式不对" }, { status: 400 });
  }

  let patch: Patch;
  try {
    patch = await request.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  // 校验时间格式，非法输入直接拒绝而不是存进去等到读的时候炸
  for (const field of ["in", "out"] as const) {
    const v = patch[field];
    if (v != null && v !== "") {
      try {
        parseHHMM(v);
      } catch {
        return NextResponse.json({ error: `${field === "in" ? "上班" : "下班"}时间格式不对` }, { status: 400 });
      }
    }
  }

  if (patch.status && !STATUSES.includes(patch.status)) {
    return NextResponse.json({ error: "状态不合法" }, { status: 400 });
  }

  const existing = await getDay(date);

  const next: DayRecord = {
    date,
    status: patch.status ?? existing?.status ?? "normal",
    updatedAt: new Date().toISOString(),
    manual: true,
  };

  // 空字符串或 null 表示清空该字段；未传该字段则沿用原值
  const resolve = (v: string | null | undefined, old: string | undefined) =>
    v === undefined ? old : v === "" || v === null ? undefined : v;

  const inValue = resolve(patch.in, existing?.in);
  const outValue = resolve(patch.out, existing?.out);
  const noteValue = resolve(patch.note, existing?.note);

  if (inValue) next.in = inValue;
  if (outValue) next.out = outValue;
  if (noteValue) next.note = noteValue;

  await putDay(next);

  // 只有改到「今天」才需要动提醒排程 —— 过去的日子排了也没意义
  if (date === beijingDateKey(new Date())) {
    if (next.status === "normal" && next.in && !next.out) {
      const settings = await getSettings();
      await scheduleClockOutReminder(date, beijingEpochMs(date, next.in) + settings.workMinutes * 60_000);
    } else {
      await cancelClockOutReminder(date);
    }
  }

  return NextResponse.json({ ok: true, record: next });
}
