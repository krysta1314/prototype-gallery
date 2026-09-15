import { NextResponse } from "next/server";
import { getSettings, putSettings } from "@/lib/punch/store";
import { parseHHMM } from "@/lib/punch/time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getSettings());
}

export async function PUT(request: Request) {
  let body: { clockInDeadline?: string; workMinutes?: number; morningReminder?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  const current = await getSettings();
  const next = { ...current, ...body };

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

  await putSettings(next);
  return NextResponse.json({ ok: true, settings: next });
}
