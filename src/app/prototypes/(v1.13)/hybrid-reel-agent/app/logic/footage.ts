/* 素材够不够用(异常处理 spec 第 5、6 条),纯函数,开发原型与评审原型共用。
   - 能剪进片子的素材秒数:可剪身份(footage / showcase / evidence)的视频里 usable 的片段加起来;没有场记的视频按整条时长算。
   - 素材不可用:没有产品图,且能用的素材不到 3 秒(含一秒都没有)→ 不出常规提问卡,先说清哪些不能用、为什么,再问怎么继续。
     有产品图时不算不可用:产品图能做动态镜头,AI 再补其余部分。
   - 时长与素材:可用秒数不够所选 / 默认时长时,提问卡时长题下写「能撑多少秒、其余 AI 补」(questions.ts 调 coverNote)。 */

import type { Brief, ClipProfile } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";
import type { Answer, Question } from "./questions";
import type { Lang } from "../store";

const CUTTABLE = new Set(["footage", "showcase", "evidence"]);
/** 能用的素材少于这么多秒(且没有产品图)就算素材不可用 */
export const MIN_USABLE_SEC = 3;

const cuttable = (p: ClipProfile) => p.kind !== "audio" && CUTTABLE.has(p.identity ?? "footage");

/** 能剪进片子的素材秒数(保留一位小数) */
export function usableFootageSec(profiles: ClipProfile[]): number {
  let sec = 0;
  for (const p of profiles) {
    if (p.kind !== "video" || !cuttable(p)) continue;
    if (p.segments?.length) sec += p.segments.filter((g) => g.usable).reduce((n, g) => n + Math.max(0, g.end - g.start), 0);
    else sec += p.durationSec ?? 0;
  }
  return Math.round(sec * 10) / 10;
}

/** 有没有能用的产品图(图片、身份是产品 / 素材,没被标成不用) */
export const hasProductImage = (profiles: ClipProfile[]) => profiles.some((p) => p.kind === "image" && (p.identity ?? "footage") !== "evidence" && cuttable(p));

/** 素材不可用:没有产品图,且能用的素材不到 MIN_USABLE_SEC 秒 */
export const footageUnusable = (profiles: ClipProfile[]) => !hasProductImage(profiles) && usableFootageSec(profiles) < MIN_USABLE_SEC;

export type UnusableWhy = "blurry" | "short" | "noProduct" | "other";
const WHY_EN: Record<UnusableWhy, string> = { blurry: "is too blurry", short: "is too short", noProduct: "doesn't show the product", other: "has nothing usable" };
const WHY_ZH: Record<UnusableWhy, string> = { blurry: "太糊", short: "太短", noProduct: "看不到产品", other: "没有能用的画面" };

/** 从分析结果的 issues 和不可用片段的 reason 里归类:太糊 / 太短 / 看不到产品 / 其他 */
export function unusableWhy(p: ClipProfile): UnusableWhy {
  const text = [...(p.issues ?? []), ...(p.segments ?? []).filter((g) => !g.usable).map((g) => g.reason ?? "")].join(" ").toLowerCase();
  if (/blur|out of focus|shaky|模糊|糊|虚焦|抖/.test(text)) return "blurry";
  if (/product not visible|no product|can'?t see the product|not show(?:ing)? the product|看不到产品|没有产品|不见产品/.test(text)) return "noProduct";
  if (/too short|太短/.test(text) || (p.kind === "video" && p.durationSec !== undefined && p.durationSec < 1)) return "short";
  return "other";
}

/** 哪些文件用不上:视频没有可用片段 / 图片被标成不用;音频、品牌 logo、参考不算(它们本来就不剪进片子) */
export function unusableFiles(profiles: ClipProfile[]): { name: string; why: UnusableWhy }[] {
  return profiles.flatMap((p) => {
    if (p.kind === "audio" || p.identity === "brand" || p.identity === "reference") return [];
    const dead = p.kind === "video" ? !cuttable(p) || (p.segments?.length ? !p.segments.some((g) => g.usable) : false) : p.identity === "unused";
    return dead ? [{ name: p.label, why: unusableWhy(p) }] : [];
  });
}

const listEn = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`);

/** Agent 的那一段话:哪些文件不能用、为什么(最多列 4 个,其余合成「另外 n 个」) */
export function unusableText(profiles: ClipProfile[], lang: Lang): string {
  const bad = unusableFiles(profiles);
  const shown = bad.slice(0, 4);
  const more = bad.length - shown.length;
  const sec = usableFootageSec(profiles);
  if (lang === "zh") {
    const list = shown.map((b) => `${b.name} ${WHY_ZH[b.why]}`).join(";");
    const rest = more > 0 ? `;另外 ${more} 个也用不上` : "";
    const tail = sec > 0 ? `能剪进片子的只有大约 ${Math.round(sec)} 秒。` : "没有能剪进片子的画面。";
    return `素材看完了,但大多用不上:${list || "没有能用的视频或产品图"}${rest}。${tail}`;
  }
  const list = shown.map((b) => `${b.name} ${WHY_EN[b.why]}`);
  if (more > 0) list.push(`${more} more ${more === 1 ? "file has" : "files have"} nothing usable`);
  const tail = sec > 0 ? `That leaves only about ${Math.round(sec)}s I can cut into the ad.` : "That leaves nothing I can cut into the ad.";
  return `I've gone through your footage, but most of it won't work: ${list.length ? listEn(list) : "there's no usable video or product image"}. ${tail}`;
}

/** 素材不可用时的那一问(产品界面英文) */
export const FOOTAGE_TITLE = "Your footage doesn't give me enough to work with. How should I continue?";
export function footageQuestion(): Question {
  return {
    id: "footage",
    title: FOOTAGE_TITLE,
    multi: false,
    options: [
      { value: "more", label: "Add more footage", description: "Upload clips that show the product clearly" },
      { value: "ai", label: "Let AI create the missing shots", description: "Every beat becomes an AI shot · more credits" },
      { value: "use", label: "Use what I have", description: "Cut the ad from this footage as it is" },
    ],
    defaults: ["more"],
  };
}

export type FootageChoice = "more" | "ai" | "use";
/** 那一问的回答:选项之一,或 Other 写的话(按改稿要求处理,带着它继续走常规提问) */
export function footageChoice(a: Answer | undefined): { choice: FootageChoice } | { other: string } {
  const other = a?.other?.trim();
  if (other) return { other };
  const pick = a?.picked[0];
  return { choice: pick === "ai" || pick === "use" ? pick : "more" };
}

/** 答完后写回 brief.notes 的一句(分镜接口照 notes 排);补传素材不走到这里 */
export function footageBrief(brief: Brief, ans: { choice: FootageChoice } | { other: string }): Brief {
  const line =
    "other" in ans
      ? `Footage: ${ans.other}`
      : ans.choice === "ai"
        ? "Footage: the uploaded footage is unusable; AI-shoot every beat."
        : ans.choice === "use"
          ? "Footage: use the uploaded footage as it is, even the weak parts."
          : "";
  if (!line) return brief;
  return { ...brief, notes: [brief.notes, line].filter(Boolean).join("\n") };
}

/** 时长与素材:可用秒数 < 时长时的那一句;够用返回 null */
export function coverNote(footageSec: number, durationSec: number, lang: Lang): string | null {
  if (!(footageSec < durationSec)) return null;
  const s = Math.round(footageSec);
  if (lang === "zh") return s > 0 ? `素材大约能撑 ${s} 秒,其余由 AI 补。` : "素材撑不起任何一段,全部由 AI 补。";
  return s > 0 ? `Your footage covers about ${s}s — AI will fill the rest.` : "Your footage doesn't cover any of it — AI will fill the rest.";
}

/** 读完素材那句总结要不要带「能撑多少秒」:时长题没问(用户写明了时长)且能用的素材不够 brief 时长时返回 footageSummary 的 fillTo */
export function summaryFill(questions: Question[], brief: Brief, profiles: ClipProfile[]): { footageSec: number; durationSec: number } | undefined {
  if (questions.some((q) => q.id === "duration")) return undefined;
  const footageSec = usableFootageSec(profiles);
  return footageSec < brief.durationSec ? { footageSec, durationSec: brief.durationSec } : undefined;
}
