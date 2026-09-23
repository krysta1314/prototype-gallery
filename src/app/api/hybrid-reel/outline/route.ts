/* POST /api/hybrid-reel/outline
   ClipProfile[] + brief → Story Outline(底层就是 EDL JSON,PRD F3.1)。

   这一步是整个产品唯一站得住的差异化:每格挂一个广告叙事角色,
   缺口 = 某个角色没素材可填,而不是「节奏不好看」。补拍 prompt 按受众和卖点写。
   撞上「需要复刻真人长相」的缺口一律不生成,标注让用户自己补拍。 */

import { NextResponse } from "next/server";
import { ARK_MODELS, arkChat, extractJson } from "@/lib/ark";

export const runtime = "nodejs";
export const maxDuration = 300;

/** credits 口径照 Ryan 提案 §8.2:成片基础费 + Σ 补拍段,不按生成时长。系数暂定,待实测校准。 */
export const CREDITS = { base: 40, perGenerateShot: 50 };

const SKELETON: Record<number, string[]> = {
  15: ["hook", "proof", "cta"],
  20: ["hook", "proof", "usage", "cta"],
  30: ["hook", "pain", "proof", "usage", "cta"],
};

type Brief = {
  platform: string;
  durationSec: number;
  audience: string;
  sellingPoints: string[];
  cta: string;
  subtitleLang: string;
  /** 用户六项之外的要求,原话 —— 排分镜时是硬约束 */
  notes?: string;
};

type Profile = {
  label: string;
  kind: string;
  description: string;
  tags: string[];
  hasVoice: boolean;
  voiceSummary?: string;
  faceVisible: boolean;
};

function buildPrompt(profiles: Profile[], brief: Brief) {
  const roles = SKELETON[brief.durationSec] ?? SKELETON[30];
  const inventory = profiles
    .map(
      (p, i) =>
        `[${i}] ${p.label} (${p.kind}) — ${p.description} | tags: ${p.tags.join(", ")} | speech: ${
          p.hasVoice ? p.voiceSummary || "yes" : "none"
        } | face on screen: ${p.faceVisible}`,
    )
    .join("\n");

  return `You are planning a ${brief.durationSec}-second vertical ad for ${brief.platform}.

BRIEF
Audience: ${brief.audience}
Selling points: ${brief.sellingPoints.join("; ")}
Call to action: ${brief.cta}
Subtitle language: ${brief.subtitleLang}
${brief.notes ? `Extra instructions from the advertiser (hard constraints, obey them): ${brief.notes}\n` : ""}
FOOTAGE THE ADVERTISER ALREADY SHOT
${inventory}

Build the cut along these narrative beats, in this order: ${roles.join(" → ")}.
hook = stops the scroll. pain = names the problem. proof = why believe you. usage = the product doing its job. cta = what to do next.
"role" MUST be exactly one of: hook, pain, proof, usage, cta. A transition or bridge shot is NOT a role — give it the role of the beat it serves.

Rules:
1. Fill every beat you can from the footage above. Pick in/out points inside the clip's real length.
2. A beat with nothing suitable is a GAP. For a gap, decide if it can be generated:
   - CAN be generated: transitions, product-only shots, texture macros, environment or mood shots, hands-only action with no face.
   - CANNOT be generated: anything needing a recognisable human face, spoken dialogue, a person performing to camera.
   The test is whether it can be made WITHOUT recreating a real person's likeness.
3. At most 3 generated shots.
4. Write the generation prompt from the audience and selling points, not from "what looks nice".
5. Subtitles: if the chosen clip has speech, set source "stt" and use what is said. Otherwise write the line yourself, in ${brief.subtitleLang}.
6. Shot durations must add up to about ${brief.durationSec} seconds.

Return ONLY JSON:
{
  "shots": [
    {
      "role": "hook|pain|proof|usage|cta",
      "durationSec": number,
      "source": { "kind": "clip", "clipIndex": number, "inSec": number, "outSec": number }
                | { "kind": "generate", "genType": "bridge|broll", "prompt": "..." }
                | { "kind": "blocked", "reason": "why we won't generate it", "suggestion": "what to shoot, in one line" },
      "subtitle": { "text": "...", "source": "stt|authored" }
    }
  ],
  "direction": "two sentences on the angle this cut takes and why — written in ${/中文|chinese/i.test(brief.subtitleLang) ? "Simplified Chinese" : "the same language as the subtitle language"}",
  "bgmPrompt": "one line describing the music to generate for this cut"
}`;
}

export async function POST(request: Request) {
  let body: { profiles?: Profile[]; brief?: Brief; current?: unknown; change?: string };
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
    /* 用户对分镜回了一句话要改:在现有方案上只动他提到的,其余原样 */
    const revision =
      body.current && body.change
        ? `\n\nCURRENT STORYBOARD (JSON):\n${JSON.stringify(body.current)}\n\nThe advertiser replied: """${body.change}"""\nApply ONLY what they asked. Keep every other shot exactly as it is (same order, sources, durations, subtitles). Return the full storyboard in the same JSON shape, with "direction" rewritten in one sentence to note what changed.`
        : "";
    const raw = await arkChat({
      model: ARK_MODELS.understand,
      messages: [{ role: "user", content: buildPrompt(profiles, brief) + revision }],
      maxTokens: 3000,
    });

    const edl = extractJson<{ shots: { role?: string; source: { kind: string; genType?: string } }[] }>(raw);

    /* 模型偶尔会把 role 写成 "bridge" / "transition" 这类五环节之外的词;
       归一到骨架里对应位置的环节,实在对不上就按镜头顺序落到最近的环节 */
    const roles = SKELETON[brief.durationSec] ?? SKELETON[30];
    const VALID = new Set(["hook", "pain", "proof", "usage", "cta"]);
    edl.shots = edl.shots.map((shot, i) => {
      const r = String(shot.role ?? "").toLowerCase();
      if (VALID.has(r)) return { ...shot, role: r };
      const fallback = roles[Math.min(i, roles.length - 1)];
      return { ...shot, role: fallback };
    });

    const generated = edl.shots.filter((s) => s.source.kind === "generate").length;

    return NextResponse.json({
      ...edl,
      credits: {
        base: CREDITS.base,
        perGenerateShot: CREDITS.perGenerateShot,
        generatedShots: generated,
        total: CREDITS.base + CREDITS.perGenerateShot * generated,
      },
      model: ARK_MODELS.understand,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
