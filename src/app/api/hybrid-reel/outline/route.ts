/* POST /api/hybrid-reel/outline
   在用户选定的那一版分镜上,按他的一句话修改(结构不变)。
   首次出方案走 /api/hybrid-reel/options(按投放目的出 3 种结构)。 */

import { NextResponse } from "next/server";
import { generateOutline, type Brief, type Profile, type StructureRef } from "@/lib/hybrid-reel/outline";
import { DEFAULT_PICKS, STRUCTURES, type StructureId } from "@/lib/hybrid-reel/structures";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  let body: { profiles?: Profile[]; brief?: Brief; structure?: StructureRef; current?: unknown; change?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求体不是 JSON" }, { status: 400 });
  }

  const { profiles, brief } = body;
  if (!profiles?.length || !brief) {
    return NextResponse.json({ error: "缺 profiles 或 brief" }, { status: 400 });
  }
  const id = (body.structure?.id && STRUCTURES[body.structure.id as StructureId] ? body.structure.id : DEFAULT_PICKS[0]) as StructureId;
  const structure: StructureRef = { id, name: body.structure?.name ?? STRUCTURES[id].en, why: body.structure?.why ?? "" };

  try {
    const outline = await generateOutline({ profiles, brief, structure, current: body.current, change: body.change });
    return NextResponse.json(outline);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
