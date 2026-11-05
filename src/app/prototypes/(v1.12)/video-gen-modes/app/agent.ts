// Marketing Agent:从对话里的提示词 + 文件定模式、选模型，把文件放进对应素材位(原型演示规则，真实产品由 agent 判断)。

import type { Asset } from "./assets";
import type { ModeKey } from "./capabilities";
import { inferMode, pickModel } from "./infer";
import { autoPlace, emptySlots, initialComposer, selectMode, selectModel, type ComposerState } from "./state";
import type { ModelKey } from "./capabilities";

export type AgentPlan = { state: ComposerState; reason: string };

/** 按模式把文件放进素材位 */
export function placeFiles(base: ComposerState, mode: ModeKey, files: Asset[]): ComposerState {
  const s = selectMode(base, mode);
  const images = files.filter((a) => a.kind === "image");
  const videos = files.filter((a) => a.kind === "video");
  const slots = { ...s.slots };
  if (mode === "frames") slots.frames = { ...slots.frames, start: images[0], end: images[1] };
  else if (mode === "edit") slots.edit = { source: videos[0], refs: images };
  else if (mode === "extend") slots.extend = { ...slots.extend, source: videos[0] };
  else if (mode === "omni") slots.omni = { ...slots.omni, refs: files };
  else {
    /* Keyframes / 专项模式：清空这个模式的素材位，再按「+」的规则放(首中尾帧、各输入格) */
    const empty = emptySlots();
    if (mode === "keyframes") slots.keyframes = empty.keyframes;
    else slots.tools = { ...slots.tools, [mode]: undefined };
    return autoPlace({ ...s, slots }, files);
  }
  return { ...s, slots };
}

export function planFromChat(prompt: string, files: Asset[]): AgentPlan {
  const { mode, reason } = inferMode(prompt, files);
  const state = placeFiles({ ...initialComposer(pickModel(mode)), prompt }, mode, files);
  return { state, reason };
}

/** Video plan 卡上改模型 / 模式:用对话里的原始文件重新放进新模式的素材位 */
export function replan(s: ComposerState, change: { model?: ModelKey; mode?: ModeKey }, files: Asset[]): ComposerState {
  let next = s;
  if (change.model) next = selectModel(next, change.model).state;
  const mode = change.mode ?? next.mode;
  return { ...placeFiles(next, mode, files), fallbackFrom: undefined };
}
