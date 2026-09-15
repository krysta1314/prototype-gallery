import { NextResponse } from "next/server";
import { sendPush } from "@/lib/punch/push";
import { verifyQstash } from "@/lib/punch/schedule";
import { getDay, getSettings } from "@/lib/punch/store";
import { computeLeaveMinutes, formatHHMM } from "@/lib/punch/time";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!(await verifyQstash(request, rawBody))) {
    return NextResponse.json({ error: "签名校验失败" }, { status: 401 });
  }

  let date: string | undefined;
  try {
    date = JSON.parse(rawBody).date;
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
  if (!date) return NextResponse.json({ error: "缺少 date" }, { status: 400 });

  const rec = await getDay(date);

  // 已经打了下班卡、或当天被标成请假/假期 —— 静默丢弃，不推
  if (!rec || rec.out || rec.status !== "normal" || !rec.in) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const settings = await getSettings();
  const leaveAt = formatHHMM(computeLeaveMinutes(rec.in, settings.workMinutes));

  const result = await sendPush({
    title: "该打下班卡了",
    body: `今天 ${rec.in} 上班，${leaveAt} 可以走了。别忘了打卡。`,
  });

  if (!result.ok && result.retryable) {
    // 网络/APNs 抖动等瞬时故障：返回 500 让 QStash 重试，避免这一天的提醒永久丢失
    return NextResponse.json({ ok: false, pushed: false, error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, pushed: result.ok });
}
