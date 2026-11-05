// 结果卡 / 画布节点上的「继续做」:切到生成它的模型 + 对应模式，把这条视频(或它的最后一帧)放进素材位。
// 放进去的素材标 source: "generated"(Omni Flash 在英国只限制上传的视频)。

import { newId, type Asset } from "./assets";
import type { ResultAction } from "./infer";
import { RESULT_VIDEO } from "./samples";
import { selectMode, selectModel, type ComposerState } from "./state";
import type { Job } from "./useFakeGeneration";

export function followUp(base: ComposerState, job: Job, action: ResultAction): ComposerState {
  const onModel = selectModel(base, job.model).state;
  const video: Asset = { id: newId("g"), kind: "video", url: job.url ?? RESULT_VIDEO.url, poster: job.poster, name: "generated.mp4", secs: job.secs, source: "generated" };
  if (action === "extend") {
    const s = selectMode(onModel, "extend");
    return { ...s, slots: { ...s.slots, extend: { ...s.slots.extend, source: video } } };
  }
  if (action === "edit") {
    const s = selectMode(onModel, "edit");
    return { ...s, slots: { ...s.slots, edit: { ...s.slots.edit, source: video } } };
  }
  const frame: Asset = { id: newId("g"), kind: "image", url: RESULT_VIDEO.lastFrame, name: "last-frame.jpg", source: "generated" };
  const s = selectMode(onModel, "frames");
  return { ...s, slots: { ...s.slots, frames: { ...s.slots.frames, start: frame } } };
}
