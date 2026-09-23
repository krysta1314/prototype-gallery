/* 分镜(Story Outline,底层即 EDL JSON,PRD F3.1)的生成逻辑,供两个接口共用:
   · /api/hybrid-reel/options —— 按投放目的挑 3 种结构,各出一版
   · /api/hybrid-reel/outline —— 在选定的一版上按用户的话修改

   每格挂一个广告叙事环节;缺口 = 某个环节没素材可填。撞上「需要复刻真人长相」的缺口一律不生成。 */

import { ARK_MODELS, arkChat, extractJson } from "@/lib/ark";
import { STRUCTURES, STRUCTURE_IDS, DEFAULT_PICKS, beatsFor, type StructureId } from "./structures";

/** credits 口径照 Ryan 提案 §8.2:成片基础费 + Σ 补拍段,不按生成时长。系数暂定,待实测校准。 */
export const CREDITS = { base: 40, perGenerateShot: 50 };

export type Brief = {
  platform: string;
  durationSec: number;
  audience: string;
  sellingPoints: string[];
  cta: string;
  subtitleLang: string;
  /** 用户六项之外的要求,原话 —— 排分镜时是硬约束 */
  notes?: string;
};

export type Profile = {
  label: string;
  kind: string;
  description: string;
  tags: string[];
  hasVoice: boolean;
  voiceSummary?: string;
  faceVisible: boolean;
};

export type StructureRef = { id: StructureId; name: string; why: string };

const VALID = new Set(["hook", "pain", "proof", "usage", "cta"]);
const isZh = (brief: Brief) => /中文|chinese|粤|繁/i.test(brief.subtitleLang);

function inventory(profiles: Profile[]) {
  return profiles
    .map(
      (p, i) =>
        `[${i}] ${p.label} (${p.kind}) — ${p.description} | tags: ${p.tags.join(", ")} | speech: ${
          p.hasVoice ? p.voiceSummary || "yes" : "none"
        } | face on screen: ${p.faceVisible}`,
    )
    .join("\n");
}

function briefBlock(brief: Brief) {
  return `BRIEF
Platform: ${brief.platform}
Length: ${brief.durationSec}s
Audience: ${brief.audience}
Selling points: ${brief.sellingPoints.join("; ")}
Call to action: ${brief.cta}
Subtitle language: ${brief.subtitleLang}
${brief.notes ? `Extra instructions from the advertiser (hard constraints, obey them): ${brief.notes}\n` : ""}`;
}

/* ── 按投放目的挑 3 种结构 ── */
export async function pickStructures(profiles: Profile[], brief: Brief): Promise<StructureRef[]> {
  const zh = isZh(brief);
  const catalog = STRUCTURE_IDS.map((id) => `- ${id}: ${STRUCTURES[id].en}. Fits when ${STRUCTURES[id].fit}.`).join("\n");
  const name = (id: StructureId) => (zh ? STRUCTURES[id].zh : STRUCTURES[id].en);
  try {
    const raw = await arkChat({
      model: ARK_MODELS.understand,
      maxTokens: 600,
      messages: [
        {
          role: "user",
          content: `You are an ad strategist. Pick the 3 narrative structures that best serve this ad's goal, best first.

${briefBlock(brief)}
FOOTAGE
${inventory(profiles)}

STRUCTURES
${catalog}

Judge by what the ad is trying to achieve (the audience, the selling points, the call to action, any offer) and by what the footage can actually support.
Return ONLY JSON: {"picks":[{"id":"<structure id>","why":"one short sentence on why it fits THIS ad, in ${zh ? "Simplified Chinese" : "English"}"}]}
Exactly 3 different ids from the list.`,
        },
      ],
    });
    const { picks } = extractJson<{ picks: { id: string; why: string }[] }>(raw);
    const seen = new Set<StructureId>();
    const out: StructureRef[] = [];
    for (const p of picks ?? []) {
      const id = p.id as StructureId;
      if (!STRUCTURES[id] || seen.has(id)) continue;
      seen.add(id);
      out.push({ id, name: name(id), why: p.why ?? "" });
    }
    for (const id of DEFAULT_PICKS) {
      if (out.length >= 3) break;
      if (!seen.has(id)) out.push({ id, name: name(id), why: "" });
    }
    return out.slice(0, 3);
  } catch {
    return DEFAULT_PICKS.map((id) => ({ id, name: name(id), why: "" }));
  }
}

/* ── 按一种结构出分镜(或在现有分镜上改) ── */
function buildPrompt(profiles: Profile[], brief: Brief, structure: StructureId, siblings: StructureId[] = []) {
  const s = STRUCTURES[structure];
  const others = siblings.filter((id) => id !== structure);
  const beats = beatsFor(structure, brief.durationSec);
  return `You are planning a ${brief.durationSec}-second vertical ad for ${brief.platform}.

${briefBlock(brief)}
FOOTAGE THE ADVERTISER ALREADY SHOT
${inventory(profiles)}

NARRATIVE STRUCTURE: ${s.en}. ${s.intent}
CREATIVE ANGLE: ${s.angle}${
    others.length
      ? `\nThis is one of ${others.length + 1} routes shown side by side. The others are ${others
          .map((id) => `${STRUCTURES[id].en} (${STRUCTURES[id].angle})`)
          .join("; ")}. Your concept must be clearly different from them: a different insight, a different opening, different taglines.${
          structure === "offer" ? "" : " Do not lead with the discount or price — that belongs to another route; mention it only in the call to action."
        }`
      : ""
  }
Use exactly these beats, one shot per beat, in this order: ${beats.join(" → ")}.
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
  "direction": "two sentences on the angle this cut takes and why — written in ${isZh(brief) ? "Simplified Chinese" : "the same language as the subtitle language"}",
  "bgmPrompt": "one line describing the music to generate for this cut",
  "concept": {
    "title": "a short, evocative creative name for this route (2–6 words)",
    "insight": "one sentence: the consumer insight this route plays on, specific to this audience and product",
    "hook": "one sentence: exactly what happens in the first 2 seconds to stop the scroll",
    "taglines": ["three short on-screen tagline options for this route"],
    "tone": "3–5 words on tone and pace"
  }
}
Write every "concept" field in ${isZh(brief) ? "Simplified Chinese" : "English"}. Make it concrete to THIS product and footage — no generic ad talk.`
}

type Shot = { role?: string; durationSec?: number; source: { kind: string; genType?: string } };

export async function generateOutline({
  profiles,
  brief,
  structure,
  siblings,
  current,
  change,
}: {
  profiles: Profile[];
  brief: Brief;
  structure: StructureRef;
  /** 同时给用户看的其他结构 —— 用来拉开三个方案的创意差距 */
  siblings?: StructureId[];
  current?: unknown;
  change?: string;
}) {
  /* 用户对分镜回了一句话要改:在现有方案上只动他提到的,其余原样 */
  const revision =
    current && change
      ? `\n\nCURRENT STORYBOARD (JSON):\n${JSON.stringify(current)}\n\nThe advertiser replied: """${change}"""\nApply ONLY what they asked. Keep every other shot exactly as it is (same order, sources, durations, subtitles). Return the full storyboard in the same JSON shape, with "direction" rewritten in one sentence to note what changed.`
      : "";
  const beats = beatsFor(structure.id, brief.durationSec);
  const prompt = buildPrompt(profiles, brief, structure.id, siblings) + revision;
  const ask = async (content: string) =>
    extractJson<{ shots: Shot[]; direction?: string; bgmPrompt?: string; concept?: unknown }>(
      await arkChat({ model: ARK_MODELS.understand, messages: [{ role: "user", content }], maxTokens: 3000 }),
    );

  let edl = await ask(prompt);
  /* 首版镜头数必须和结构的环节数一致,否则三个方案会长得差不多;不一致就带着说明重试一次 */
  if (!revision && edl.shots.length !== beats.length) {
    try {
      const retry = await ask(
        `${prompt}\n\nYour previous answer had ${edl.shots.length} shots. It must have EXACTLY ${beats.length} shots, one per beat: ${beats.join(" → ")}.`,
      );
      if (retry.shots.length === beats.length) edl = retry;
    } catch {
      /* 重试失败就用第一版 */
    }
  }

  /* 首版严格按结构的环节走:镜头数对得上就逐格校正 role;
     改稿时用户可能增删镜头,只把五环节之外的词归一到最近的环节 */
  const strict = !revision && edl.shots.length === beats.length;
  edl.shots = edl.shots.map((shot, i) => {
    if (strict) return { ...shot, role: beats[i] };
    const r = String(shot.role ?? "").toLowerCase();
    return { ...shot, role: VALID.has(r) ? r : beats[Math.min(i, beats.length - 1)] };
  });

  const generated = edl.shots.filter((s) => s.source.kind === "generate").length;
  return {
    ...edl,
    structure,
    credits: {
      base: CREDITS.base,
      perGenerateShot: CREDITS.perGenerateShot,
      generatedShots: generated,
      total: CREDITS.base + CREDITS.perGenerateShot * generated,
    },
    model: ARK_MODELS.understand,
  };
}
