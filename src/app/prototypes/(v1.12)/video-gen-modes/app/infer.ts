// Marketing Agent 的模式 / 模型选择(原型里用关键词 + 素材类型的简单规则演示;真实产品由 agent 判断)
// 以及结果卡「继续做」按钮:按生成它的模型支持什么给什么。

import type { Asset } from "./assets";
import { MODELS, supports, type ModeKey, type ModelKey } from "./capabilities";

export function inferMode(prompt: string, assets: Asset[]): { mode: ModeKey; reason: string } {
  const p = prompt.toLowerCase();
  const images = assets.filter((a) => a.kind === "image").length;
  const hasVideo = assets.some((a) => a.kind === "video");
  if (hasVideo && /\b(edit|replace|remove|change|swap)\b/.test(p))
    return { mode: "edit", reason: "you uploaded a video and asked to change what's in it" };
  if (hasVideo && /\b(extend|continue|longer|keep going)\b/.test(p))
    return { mode: "extend", reason: "you uploaded a video and asked to keep it going" };
  if (images >= 2 && /(from .+ to |transform|turn(s)? into|morph)/.test(p))
    return { mode: "frames", reason: `you uploaded ${images} images and asked to go from one to the other` };
  if (images === 1 && /(animate|bring .*to life|make it move)/.test(p))
    return { mode: "frames", reason: "you uploaded one image and asked to bring it to life, so it becomes the first frame" };
  return {
    mode: "omni",
    reason: assets.length ? "your files work best as references for the look, subject and motion" : "there are no files to anchor frames to, so it's generated from your description",
  };
}

const PREFERRED: ModelKey = "seedance-2.5";

export function pickModel(mode: ModeKey): ModelKey {
  if (supports(PREFERRED, mode)) return PREFERRED;
  return MODELS.find((m) => m.modes.includes(mode))!.key;
}

export type ResultAction = "extend" | "edit" | "lastFrame";

export function resultActions(model: ModelKey): ResultAction[] {
  const out: ResultAction[] = [];
  if (supports(model, "extend")) out.push("extend");
  if (supports(model, "edit")) out.push("edit");
  if (supports(model, "frames")) out.push("lastFrame");
  return out;
}

export const RESULT_ACTION_LABEL: Record<ResultAction, string> = { extend: "Extend", edit: "Edit", lastFrame: "Use last frame" };
