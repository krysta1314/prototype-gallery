/* Generation plan 卡的内容(纯函数):整条广告在出方案时就定好 ——
   上半「要生成的」(带积分):每个 AI 补拍一项 + 旁白开着时一项整条配音;实拍素材不是生成项。
   下半「Then I'll edit it together」(不计积分):Agent 自己剪的部分 —— 你的素材、字幕、屏幕文字、音乐、成片。
   底部合计 = credits.ts 的 reelCost(基础费 40 + 补拍 + 配音)。 */

import type { ClipProfile, Outline } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";
import type { PlanAssembly } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/plancard";
import { voiceOf } from "@/lib/hybrid-reel/voices";
import { aiShotCount } from "./credits";
import { AI_VIDEO_MODEL, outlineSec, voiceLabel } from "./delivery";
import { VOICE_MODEL, voiceCost, voiceLines, voiceScript, voiceSec } from "./voice";

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export function planAssembly(outline: Outline, profiles: ClipProfile[]): PlanAssembly {
  const lines = voiceLines(outline);
  const clips = outline.shots.flatMap((s) => (s.source.kind === "clip" ? [s.source.clipIndex] : []));
  const names = [...new Set(clips)].map((i) => profiles[i]?.label ?? `clip ${i + 1}`);
  const cards = outline.shots.flatMap((s) => s.cards ?? []);
  const hasSpeech = outline.shots.some((s) => s.subtitle?.text?.trim());
  const music = outline.music;
  const edit: PlanAssembly["edit"] = [];
  if (clips.length) edit.push({ kind: "footage", label: `Your footage · ${plural(clips.length, "clip")}`, detail: names.join(", ") });
  if (hasSpeech) edit.push({ kind: "subtitles", label: "Subtitles", detail: lines.length ? "Same words as the voiceover" : "From what's said in your footage" });
  if (cards.length) edit.push({ kind: "text", label: `On-screen text · ${plural(cards.length, "card")}`, detail: cards.map((c) => c.text).join(" · ") });
  edit.push({
    kind: "music",
    label: music?.title?.trim() || "Background music",
    detail: [music?.source === "upload" ? "Your track" : music?.source === "library" ? "From library" : "AI-generated", music?.beatSync !== false ? "cuts on the beat" : ""].filter(Boolean).join(" · "),
  });
  edit.push({ kind: "cut", label: `Final cut · ${Math.round(outlineSec(outline))}s · 9:16` });
  return {
    voiceover: lines.length
      ? { title: `Voiceover · ${voiceLabel(outline.voiceover?.voice) ?? voiceOf().label} (${voiceSec(outline)}s)`, model: VOICE_MODEL, script: voiceScript(outline), credits: voiceCost(outline) }
      : undefined,
    edit,
  };
}

/** 方案卡头部「N items」:只数要生成的(补拍 + 配音) */
export const generatedItemCount = (outline: Outline) => aiShotCount(outline) + (voiceLines(outline).length ? 1 : 0);

/** 成片卡「View prompt」:这条成片实际用到的生成 prompt —— 每个 AI 补拍镜头(按成片里的镜头号)+ 旁白稿 */
export function reelPrompts(outline: Outline): { title: string; meta?: string; text: string }[] {
  const out: { title: string; meta?: string; text: string }[] = [];
  outline.shots.forEach((shot, i) => {
    if (shot.source.kind !== "generate") return;
    out.push({ title: `Shot ${i + 1} · AI`, meta: `${shot.source.model ?? AI_VIDEO_MODEL} · ${shot.durationSec}s`, text: shot.source.prompt });
  });
  const script = voiceScript(outline);
  if (script.trim()) out.push({ title: "Voiceover", meta: `${VOICE_MODEL} · ${voiceSec(outline)}s`, text: script });
  return out;
}
