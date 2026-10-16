/* 出方案 / 出片之后的几种后续操作(异常处理 spec 第 17、19、20 条):对话里补加素材、发送失败、成片里只重做某几镜。
   这里只放文案与计算,开发原型与评审原型同一份。 */

import type { Outline } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";
import type { ClipProfile } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";
import { shotCost } from "./credits";
import type { Lang } from "../store";

/** 发送失败气泡下的那行字 */
export const NOT_SENT = "Not sent";

/** 补加素材后读文件时的思考行 */
export function addedReadingText(n: number, lang: Lang): string {
  return lang === "zh" ? `正在读新加的 ${n} 个文件…` : `Reading ${n} new ${n === 1 ? "file" : "files"}…`;
}

/** 补加素材后排新一版分镜时,交给模型的改稿要求(不显示给用户) */
export const ADDED_FOOTAGE_CHANGE = "The user just added more footage. Re-check the storyboard: use the new clips wherever they fit, and replace AI shots they can cover.";

/** 读完新素材后 Agent 的那一句:有方案就说要重排,还没到方案就只说读完了 */
export function addedText(n: number, replan: boolean, lang: Lang): string {
  if (lang === "zh") return replan ? `新加的 ${n} 个文件读完了,我按新素材重排一版分镜。` : `新加的 ${n} 个文件读完了,排分镜时一起用上。`;
  const files = `${n} new ${n === 1 ? "file" : "files"}`;
  return replan
    ? `I've read the ${files}. Here's an updated storyboard.`
    : `I've read the ${files} and will use them in the storyboard.`;
}

/** 合并新读到的素材:按 label 去重,已有的保留 */
export function mergeProfiles(prev: ClipProfile[], next: ClipProfile[]): ClipProfile[] {
  const seen = new Set(prev.map((p) => p.label));
  return [...prev, ...next.filter((p) => !seen.has(p.label))];
}

/** 只重做某几镜的积分:每个 AI 镜头一份 */
export function redoCost(outline: Outline, shots: number[]): number {
  return shotCost(outline) * shots.length;
}

/** 开始重做后 Agent 的那一句 */
export function redoText(shots: number[], lang: Lang): string {
  if (lang === "zh") return `重新生成第 ${shots.join("、")} 镜,其余镜头不动,好了重新剪一版。`;
  const list = shots.length === 1 ? `shot ${shots[0]}` : `shots ${shots.slice(0, -1).join(", ")} and ${shots.at(-1)}`;
  return `Redoing ${list} and keeping everything else, then I'll re-cut the reel.`;
}
