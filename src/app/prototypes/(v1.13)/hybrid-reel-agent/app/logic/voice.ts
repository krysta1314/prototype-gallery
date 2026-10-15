/* 旁白(配音)这一项:像 Claude 用 BuzzVideo MCP 那样整条旁白一次 generate_audio。
   旁白开着时,分镜里每句 authored 台词算一句;积分 = VOICE_COST × 句数。纯函数,方案卡、积分、生成宫格共用。 */

import { onScreenSec, type Outline } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";
import { VOICE_COST } from "@/lib/hybrid-reel/voices";

/** 配音模型名(方案卡参数小标签) */
export const VOICE_MODEL = "Seed Audio 1.0";

/** 旁白开着时要念的那几句(按镜头顺序);旁白关着 / 没有台词 = 空 */
export function voiceLines(outline: Outline): string[] {
  if (!outline.voiceover?.on) return [];
  return outline.shots.flatMap((s) => (s.subtitle?.source === "authored" && s.subtitle.text.trim() ? [s.subtitle.text.trim()] : []));
}

/** 整条旁白的文本(View script):每句一行 */
export const voiceScript = (outline: Outline) => voiceLines(outline).join("\n");

/** 旁白覆盖的时长(秒,一位小数):有台词的镜头在屏时长之和 */
export function voiceSec(outline: Outline): number {
  if (!outline.voiceover?.on) return 0;
  const t = outline.shots.reduce((n, s) => n + (s.subtitle?.source === "authored" && s.subtitle.text.trim() ? onScreenSec(s) : 0), 0);
  return Math.round(t * 10) / 10;
}

/** 旁白的积分:VOICE_COST × 句数 */
export const voiceCost = (outline: Outline) => VOICE_COST * voiceLines(outline).length;
