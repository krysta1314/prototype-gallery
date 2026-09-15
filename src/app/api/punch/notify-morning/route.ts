import { NextResponse } from "next/server";
import { sendPush } from "@/lib/punch/push";
import { verifyQstash } from "@/lib/punch/schedule";
import { getDay, getSettings } from "@/lib/punch/store";
import { beijingDateKey, isWeekendKey } from "@/lib/punch/time";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!(await verifyQstash(request, rawBody))) {
    return NextResponse.json({ error: "签名校验失败" }, { status: 401 });
  }

  const today = beijingDateKey(new Date());

  // cron 本身已排除周末，这里再兜一层，防止时区或 cron 配置出错
  if (isWeekendKey(today)) {
    return NextResponse.json({ ok: true, skipped: "周末" });
  }

  const settings = await getSettings();
  // 理论上关掉时 schedule 已被删，这里作为兜底
  if (!settings.morningEnabled) {
    return NextResponse.json({ ok: true, skipped: "上班提醒已关闭" });
  }

  const rec = await getDay(today);
  if (rec?.in || (rec && rec.status !== "normal")) {
    return NextResponse.json({ ok: true, skipped: "已打卡或已请假" });
  }

  const result = await sendPush({
    title: "该打上班卡了",
    body: `${settings.clockInDeadline} 前要打卡，现在去。`,
  });

  if (!result.ok && result.retryable) {
    // 网络/APNs 抖动等瞬时故障：返回 500 让 QStash 重试，避免这一天的提醒永久丢失
    return NextResponse.json({ ok: false, pushed: false, error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, pushed: result.ok });
}
