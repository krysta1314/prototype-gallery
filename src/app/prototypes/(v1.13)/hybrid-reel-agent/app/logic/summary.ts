/* 素材读完后 Agent 的那一两句话(像 Claude 那样):有什么素材 → 能撑起哪些广告段落 → 缺哪些要 AI 补拍 → 下一步。
   只用分析结果里确定的东西拼,不让模型再长篇复述 brief;开发原型与评审原型同一份。 */

import type { ClipProfile, Role } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";
import { missingRoles } from "./questions";
import { coverNote } from "./footage";
import type { Lang } from "../store";

const ROLES: Role[] = ["hook", "pain", "proof", "usage", "cta"];
const ROLE_ZH: Record<Role, string> = { hook: "开场钩子", pain: "痛点", proof: "卖点特写", usage: "使用演示", cta: "片尾行动号召" };
const ROLE_EN: Record<Role, string> = { hook: "hook", pain: "pain point", proof: "proof", usage: "usage", cta: "end card" };
const CUTTABLE = new Set(["footage", "showcase", "evidence"]);

const listEn = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`);
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** 素材清单:实拍几段共几秒、产品图、品牌 logo、参考、音频 */
function inventory(profiles: ClipProfile[], lang: Lang): string[] {
  const zh = lang === "zh";
  const clips = profiles.filter((p) => p.kind === "video" && CUTTABLE.has(p.identity ?? "footage"));
  const sec = Math.round(clips.reduce((n, p) => n + (p.durationSec ?? 0), 0));
  const images = profiles.filter((p) => p.kind === "image" && p.identity !== "brand" && p.identity !== "reference" && p.identity !== "unused");
  const brand = profiles.filter((p) => p.identity === "brand");
  const refs = profiles.filter((p) => p.identity === "reference");
  const audio = profiles.filter((p) => p.kind === "audio");
  const out: string[] = [];
  if (clips.length) out.push(zh ? `实拍 ${clips.length} 段${sec ? `共 ${sec} 秒` : ""}` : `${plural(clips.length, "clip")} of footage${sec ? ` (${sec}s)` : ""}`);
  if (images.length) out.push(zh ? `产品图 ${images.length} 张` : plural(images.length, "product image"));
  if (brand.length) out.push(zh ? `品牌 logo ${brand.length} 个` : plural(brand.length, "brand asset"));
  if (refs.length) out.push(zh ? `参考素材 ${refs.length} 个` : plural(refs.length, "reference"));
  if (audio.length) out.push(zh ? `音频 ${audio.length} 条` : plural(audio.length, "audio track"));
  return out;
}

/** asked:后面跟着提问卡(要用户确认几个参数);false = 没缺项,直接排分镜。
    fillTo:时长题没问、但能用的素材不够 brief 时长时传 { footageSec, durationSec },在「下一步」前加一句「素材大约能撑 {s} 秒,其余由 AI 补」 */
export function footageSummary(profiles: ClipProfile[], asked: boolean, lang: Lang, fillTo?: { footageSec: number; durationSec: number }): string {
  const zh = lang === "zh";
  const fill = fillTo ? coverNote(fillTo.footageSec, fillTo.durationSec, lang) : null;
  const gaps = missingRoles(profiles);
  const covered = ROLES.filter((r) => !gaps.includes(r));
  const items = inventory(profiles, lang);
  const next = asked ? (zh ? "确认几个参数后就开始排分镜。" : "Confirm a few settings and I'll lay out the storyboard.") : zh ? "我直接排分镜。" : "Laying out the storyboard now.";
  if (zh) {
    const have = items.length ? `素材看完了:${items.join("、")}。` : "素材看完了。";
    const cover = covered.length ? `能撑起「${covered.map((r) => ROLE_ZH[r]).join("」「")}」` : "";
    const gap = gaps.length ? `缺「${gaps.map((r) => ROLE_ZH[r]).join("」「")}」镜头,这部分需要 AI 补拍。` : "需要的镜头素材里都有,不用 AI 补拍。";
    return `${have}${cover ? `${cover},` : ""}${gap}${fill ?? ""}${next}`;
  }
  const have = items.length ? `I've gone through your footage: ${listEn(items)}.` : "I've gone through your footage.";
  const cover = covered.length ? ` It covers the ${listEn(covered.map((r) => ROLE_EN[r]))}` : "";
  const gap = gaps.length
    ? `${cover ? ", but it's" : " It's"} missing the ${listEn(gaps.map((r) => ROLE_EN[r]))} — AI will shoot those.`
    : `${cover ? "." : ""} Everything the ad needs is already in your footage, so no AI shots.`;
  return `${have}${cover}${gap}${fill ? ` ${fill}` : ""} ${next}`;
}
