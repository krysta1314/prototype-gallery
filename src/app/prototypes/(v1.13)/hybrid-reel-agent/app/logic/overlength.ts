/* 成片超时长 / 字幕溢出(异常处理 spec 第 9 条):Agent 自己调,不问用户,交付说明里写改了什么。
   - 旁白预估(英文 2.5 词/秒、中日韩 4 字/秒,同画布 estimateSpeechSec)超过分镜在屏总时长:先旁白提速(≤ 1.1×)+ 压缩镜头停留;
   - 提速后仍超:按「次要句优先、长句优先」删旁白句(开场钩子和片尾行动号召不删),直到装得下;
   - 有字幕一屏放不下(超过两行):自动断行拆成几屏(画布里已经这样做),交付说明里提一句。
   纯函数;只决定交付说明里那几句话,原型不真的改成片。 */

import { onScreenSec, type Outline } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";
import { breakSubtitle, estimateSpeechSec } from "@/app/prototypes/(v1.13)/hybrid-reel/canvas/project";
import type { Lang } from "../store";

/** 旁白最多提速到 1.1× */
export const MAX_SPEEDUP = 1.1;
/** 删句时不动的角色:开场钩子、片尾行动号召 */
const KEEP_ROLES = new Set(["hook", "cta"]);

export type LengthFix = {
  /** 分镜在屏总时长(取整),交付说明里的 {N} */
  limitSec: number;
  /** 旁白预估总时长(原速) */
  estimateSec: number;
  /** 提速 + 压缩停留 */
  sped: boolean;
  /** 删掉的旁白句(原文,按镜头顺序) */
  dropped: string[];
  /** 有字幕要拆成几屏 */
  split: boolean;
};

const round1 = (n: number) => Math.round(n * 10) / 10;

export function lengthFix(outline: Outline): LengthFix {
  const limit = outline.shots.reduce((t, s) => t + onScreenSec(s), 0);
  const lines = outline.voiceover?.on
    ? outline.shots.flatMap((s, i) => (s.subtitle?.source === "authored" && s.subtitle.text.trim() ? [{ i, role: s.role, text: s.subtitle.text.trim(), sec: estimateSpeechSec(s.subtitle.text) }] : []))
    : [];
  const estimate = round1(lines.reduce((t, l) => t + l.sec, 0));
  const sped = estimate > limit + 1e-6;
  const dropped = new Set<number>();
  if (sped) {
    let left = estimate;
    const cap = limit * MAX_SPEEDUP;
    /* 次要句里最长的先删 */
    const order = lines.filter((l) => !KEEP_ROLES.has(l.role)).sort((a, b) => b.sec - a.sec || a.i - b.i);
    for (const l of order) {
      if (left <= cap + 1e-6) break;
      dropped.add(l.i);
      left -= l.sec;
    }
  }
  /* 字幕溢出:删掉的句子不再显示,不算 */
  const split = outline.shots.some((s, i) => !dropped.has(i) && !!s.subtitle?.text.trim() && breakSubtitle(s.subtitle.text.trim()).length > 1);
  return {
    limitSec: Math.round(limit),
    estimateSec: estimate,
    sped,
    dropped: lines.filter((l) => dropped.has(l.i)).map((l) => l.text),
    split,
  };
}

/** 交付说明里「我改了什么」的几句(跟回复语言);没调整返回空数组 */
export function lengthNotes(fix: LengthFix, lang: Lang): string[] {
  const n = fix.limitSec;
  const out: string[] = [];
  if (lang === "zh") {
    if (fix.sped) out.push(`旁白稍微提速(${MAX_SPEEDUP}×)并压缩了镜头停留,保持在 ${n} 秒。`);
    for (const d of fix.dropped) out.push(`删掉了「${d}」这句旁白,控制在 ${n} 秒内。`);
    if (fix.split) out.push("较长的字幕自动断行,拆成几屏显示。");
    return out;
  }
  if (fix.sped) out.push(`I sped the voiceover up slightly (${MAX_SPEEDUP}×) and trimmed shot holds to keep it at ${n}s.`);
  for (const d of fix.dropped) out.push(`I dropped the line "${d}" to stay within ${n}s.`);
  if (fix.split) out.push("Long subtitle lines are split across screens.");
  return out;
}
