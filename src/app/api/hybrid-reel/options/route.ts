/* POST /api/hybrid-reel/options
   按投放目的挑 3 种叙事结构,各出一版分镜(Ryan 提案 §4:输出 3 个分镜方案,不是 3 条成片)。
   三版并行生成;某一版失败就少一版,全部失败才报错。 */

import { NextResponse } from "next/server";
import { generateOutline, pickStructures, type Brief, type Profile } from "@/lib/hybrid-reel/outline";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  let body: { profiles?: Profile[]; brief?: Brief };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求体不是 JSON" }, { status: 400 });
  }
  const { profiles, brief } = body;
  if (!profiles?.length || !brief) {
    return NextResponse.json({ error: "缺 profiles 或 brief" }, { status: 400 });
  }

  try {
    const picks = await pickStructures(profiles, brief);
    const siblings = picks.map((p) => p.id);
    const settled = await Promise.allSettled(
      picks.map((structure) => generateOutline({ profiles, brief, structure, siblings })),
    );
    const options = settled.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
    /* 三个方案撞了同一个标题(实测新版 prompt 下出现过三版同名):后出现的换成它自己的第一条标语 */
    const seen = new Set<string>();
    for (const o of options as { concept?: { title?: string; taglines?: string[] }; structure?: { name?: string } }[]) {
      const t = o.concept?.title?.trim();
      if (!t || !o.concept) continue;
      if (seen.has(t)) o.concept.title = o.concept.taglines?.find((x) => x && !seen.has(x)) ?? `${t} · ${o.structure?.name ?? ""}`;
      seen.add(o.concept.title!);
    }
    if (options.length === 0) {
      const first = settled.find((r): r is PromiseRejectedResult => r.status === "rejected");
      throw first?.reason ?? new Error("三个方案都没生成出来");
    }
    return NextResponse.json({ options });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
