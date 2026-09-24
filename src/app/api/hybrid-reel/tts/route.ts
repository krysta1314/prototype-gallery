/* POST /api/hybrid-reel/tts
   AI 配音:画布上的 Audio Generator 节点点 Generate 时调这里,转给 BytePlus Seed-Audio。 */

import { NextResponse } from "next/server";
import { synthesize } from "@/lib/hybrid-reel/tts";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  let body: { text?: string; voice?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求体不是 JSON" }, { status: 400 });
  }
  if (!body.text?.trim()) return NextResponse.json({ error: "缺配音文案" }, { status: 400 });

  try {
    return NextResponse.json(await synthesize(body.text, body.voice));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
