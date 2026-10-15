/* 成片卡下面的几段:Agent 自己调整了什么(超时长 / 字幕溢出,logic/overlength.ts)、用到的模型 / 配音 / 积分,
   和需要用户确认的几点(含绕开的功效宣称,logic/risk.ts)。按规则拼,不调模型。 */

import type { Brief, ClipProfile, Outline } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";
import { onScreenSec } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";
import { VOICES } from "@/lib/hybrid-reel/voices";
import { aiShotNumbers } from "./storyboard";
import { reelCost } from "./credits";
import { voiceCost, voiceLines } from "./voice";
import { lengthFix, lengthNotes } from "./overlength";
import { riskChecks, type RiskFound } from "./risk";

export const AI_VIDEO_MODEL = "Seedance 2.5";
/** adjusted:Agent 为了装进时长 / 字幕放得下自己改了什么(没改 = 空) */
export type Delivery = { usage: string[]; checks: string[]; total: number; adjusted: string[] };

const CJK = /[\u3400-\u9fff]/;
const strip = (t: string) => t.toLowerCase().replace(/[\s\p{P}\p{S}]+/gu, "");
const bigrams = (t: string) => Array.from({ length: Math.max(0, t.length - 1) }, (_, i) => t.slice(i, i + 2));
/* 宣称的 ≥50% 在素材文字里出现就算「展示了」。CJK 按二元字组(逐个分句算,免得「添加X,深层补水」这种长宣称被后半句拖垮),其它按 ≥3 字符的词。 */
const overlaps = (point: string, text: string) => {
  const hay = strip(text);
  if (CJK.test(point)) {
    return point.split(/[\s\p{P}\p{S}]+/u).some((clause) => {
      const grams = bigrams(strip(clause));
      return grams.length > 0 && grams.filter((g) => hay.includes(g)).length / grams.length >= 0.5;
    });
  }
  const words = point.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w.length >= 3);
  const low = text.toLowerCase();
  return words.length > 0 && words.filter((w) => low.includes(w)).length / words.length >= 0.5;
};
const shown = (point: string, profiles: ClipProfile[]) => {
  if (!strip(point)) return true;
  return profiles.some(
    (c) => overlaps(point, c.description) || (c.segments ?? []).some((g) => g.usable && overlaps(point, g.sellingPoint ?? "")),
  );
};

/** risks:用户需求里绕开的风险要求(功效类在 Needs your check 里再提醒一次) */
export function deliveryNotes(outline: Outline, brief: Brief, profiles: ClipProfile[], lang: "zh" | "en" = "en", risks?: RiskFound): Delivery {
  const zh = lang === "zh";
  const usage: string[] = [];
  outline.shots.forEach((s, i) => {
    if (s.source.kind !== "generate") return;
    /* 失败后换模型重跑的镜头写实际用的模型 */
    const model = s.source.model ?? AI_VIDEO_MODEL;
    usage.push(zh ? `镜头 ${i + 1} · ${model} · ${s.durationSec}s · ${outline.credits.perGenerateShot} 积分` : `Shot ${i + 1} · ${model} · ${s.durationSec}s · ${outline.credits.perGenerateShot} credits`);
  });
  /* 旁白开着且有台词才真的生成配音;积分 = VOICE_COST × 句数 */
  if (voiceLines(outline).length) {
    const v = voiceCost(outline);
    usage.push(zh ? `配音 · ${voiceLabel(outline.voiceover?.voice) ?? "默认音色"} · ${v} 积分` : `Voiceover · ${voiceLabel(outline.voiceover?.voice) ?? "Default voice"} · ${v} credits`);
  }
  usage.push(zh ? `最终合成 · ${outline.credits.base} 积分` : `Final render · ${outline.credits.base} credits`);

  const checks: string[] = [];
  for (const point of brief.sellingPoints) {
    if (!shown(point, profiles)) checks.push(zh ? `「${point}」在你的素材里看不清 —— 投放前请核实这条宣称。` : `“${point}” isn't clearly shown in your footage — confirm the claim before the ad runs.`);
  }
  const ai = aiShotNumbers(outline);
  if (ai.length) checks.push(zh ? `AI 镜头可能把包装小字或 logo 生成得模糊 —— 请对照实物检查第 ${ai.join("、")} 镜。` : `AI can blur small packaging text or the logo — compare shot ${ai.join(", ")} with the real product.`);
  if (outline.music?.source !== "upload") checks.push(zh ? "背景音乐是占位音乐 —— 发布前请换成有授权的曲子。" : "The background music is a placeholder — swap in a licensed track before you publish.");
  if (risks) checks.push(...riskChecks(risks, lang));

  return { usage, checks, total: reelCost(outline), adjusted: lengthNotes(lengthFix(outline), lang) };
}

/** 音色 id → 音色表里的可读名;表里没有就原样显示 id */
export function voiceLabel(id?: string): string | undefined {
  if (!id) return undefined;
  return VOICES.find((v) => v.id === id)?.label ?? id;
}

const slug = (t: string) =>
  t
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** 品牌名:素材里「品牌素材」的描述里那个全大写的拉丁词(如 "Blue RELLET 颐莲 brand logo" → RELLET);找不到返回 undefined */
export function brandOf(profiles: ClipProfile[]): string | undefined {
  for (const p of profiles) {
    if (p.identity !== "brand") continue;
    const hit = (p.description ?? "").match(/\b[A-Z][A-Z0-9&]{2,}\b/);
    if (hit) return hit[0];
  }
  return undefined;
}

/** 成片下载文件名:{brand}-{platform}-{duration}s.mp4;无品牌用 hybrid-reel,时长按分镜实际在屏时长取整 */
export function reelFileName(p: { brand?: string; platform?: string; durationSec: number }): string {
  const brand = slug(p.brand ?? "") || "hybrid-reel";
  const platform = slug(p.platform ?? "");
  const sec = Math.max(1, Math.round(p.durationSec));
  return [brand, platform, `${sec}s`].filter(Boolean).join("-") + ".mp4";
}

/** 分镜的实际在屏总时长 */
export const outlineSec = (outline: Outline) => outline.shots.reduce((t, s) => t + onScreenSec(s), 0);
