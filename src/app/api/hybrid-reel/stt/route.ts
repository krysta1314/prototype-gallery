/* POST /api/hybrid-reel/stt
   自动生成字幕:浏览器把每个片段的原声抽成 16kHz 单声道 wav(base64)发过来,这里转给 BytePlus Seed Speech 识别。 */

import { NextResponse } from "next/server";
import { transcribe } from "@/lib/hybrid-reel/stt";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  let body: { audio?: string; language?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求体不是 JSON" }, { status: 400 });
  }
  if (!body.audio) return NextResponse.json({ error: "缺 audio" }, { status: 400 });

  try {
    return NextResponse.json(await transcribe(body.audio, body.language));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
