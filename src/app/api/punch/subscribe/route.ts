import { NextResponse } from "next/server";
import { putSub } from "@/lib/punch/store";
import type { PushSub } from "@/lib/punch/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let sub: PushSub;
  try {
    sub = await request.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    return NextResponse.json({ error: "订阅数据不完整" }, { status: 400 });
  }

  await putSub({ endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } });
  return NextResponse.json({ ok: true });
}
