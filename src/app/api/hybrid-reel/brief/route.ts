/* POST /api/hybrid-reel/brief
   用户在 composer 里写的一句话 → 六项 brief 里能抽出来的先抽出来,抽不出的置 null。
   对应 PRD F2.3「已有 brief 直接引用,只补问缺项」:对话里只追问 null 的那几项。 */

import { NextResponse } from "next/server";
import { ARK_MODELS, arkChat, extractJson } from "@/lib/ark";

export const runtime = "nodejs";
export const maxDuration = 60;

type Extracted = {
  platform: "IG Reels" | "FB Reels" | "TikTok" | null;
  durationSec: 15 | 20 | 30 | null;
  audience: string | null;
  sellingPoints: string[] | null;
  cta: string | null;
  subtitleLang: string | null;
};

const PROMPT = (text: string) => `A small business owner typed this into a marketing tool, alongside some raw footage:

"""${text}"""

Pull out whatever they already told you about the ad they want. Return ONLY JSON with exactly these keys; use null for anything they did not say (do not guess):
{
  "platform": "IG Reels" | "FB Reels" | "TikTok" | null,
  "durationSec": 15 | 20 | 30 | null,
  "audience": string | null,
  "sellingPoints": string[] | null,
  "cta": string | null,
  "subtitleLang": string | null
}
Map Instagram / Reels / IG to "IG Reels", Facebook to "FB Reels". Round any duration to the nearest of 15, 20, 30. Keep the user's own wording for audience, selling points and cta.`;

export async function POST(request: Request) {
  let prompt = "";
  try {
    const body = await request.json();
    prompt = String(body?.prompt ?? "").trim();
  } catch {
    return NextResponse.json({ error: "请求体不是 JSON" }, { status: 400 });
  }

  const empty: Extracted = {
    platform: null,
    durationSec: null,
    audience: null,
    sellingPoints: null,
    cta: null,
    subtitleLang: null,
  };
  if (!prompt) return NextResponse.json({ brief: empty });

  try {
    const raw = await arkChat({
      model: ARK_MODELS.understand,
      messages: [{ role: "user", content: PROMPT(prompt) }],
      maxTokens: 400,
    });
    const parsed = extractJson<Partial<Extracted>>(raw);
    return NextResponse.json({ brief: { ...empty, ...parsed } });
  } catch (error) {
    /* 抽取失败不阻塞流程 —— 退回全部追问 */
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ brief: empty, warning: message });
  }
}
