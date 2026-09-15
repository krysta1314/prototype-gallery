import { NextResponse } from "next/server";
import { sendPush } from "@/lib/punch/push";

export const runtime = "nodejs";

export async function POST() {
  const result = await sendPush({
    title: "测试推送",
    body: "能看到这条就说明提醒配好了。",
  });
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
