// 预计积分(示意，不是定价规则):每秒积分 × 时长，再按分辨率加成。
// 带参考视频的请求，费用取决于参考视频时长：没上传前显示 0,上传后按视频时长算。
// Seedance 按 token 计费:(输入视频时长 + 输出时长)× 分辨率，带视频输入的单价约为无视频的 0.6 倍(BytePlus $6.40 vs $10.70 / 百万 token)。

import { modelCaps, type ModelKey } from "./capabilities";
import { effectiveSecs, toolSlot, type ComposerState } from "./state";
import { isToolMode, toolSpec } from "./tools";

const PER_SEC: Record<ModelKey, number> = {
  "seedance-2.5": 12,
  "seedance-2.0": 10,
  "seedance-2.0-fast": 7,
  "seedance-2.0-mini": 5,
  "kling-4.0": 14,
  "kling-3.0": 11,
  "kling-3.0-omni": 12,
  "wan-3.0-prime": 6,
  "h3-max-turbo": 6,
  "vidu-q3": 8,
  "grok-1.5": 7,
  "flux-3-video": 9,
  "flux-3-max-video": 12,
  "wan-3.0": 8,
  "h3-max": 9,
  h3: 7,
  "omni-flash": 13,
};
const RES_X: Record<string, number> = { "360p": 0.6, "480p": 0.7, "540p": 0.8, "720p": 1, "768p": 1, "1080p": 1.5, "1440p": 1.8, "2K": 2, "2160p": 3, "4K": 3 };
const VIDEO_INPUT_RATE = 0.6;

/** 这个模式的费用是否取决于参考视频时长(悬停提示用) */
/** 额外能力模式里第一个视频输入(原片 / 3D 渲染等) */
function toolVideo(s: ComposerState): { required: boolean; secs?: number } | undefined {
  const spec = toolSpec(s.model, s.mode);
  if (!spec || !isToolMode(s.mode)) return undefined;
  const inp = spec.inputs.find((i) => i.kind === "video" && i.min > 0);
  if (!inp) return undefined;
  return { required: true, secs: toolSlot(s, s.mode).files[inp.id]?.[0]?.secs };
}

export function dependsOnVideo(s: ComposerState): boolean {
  if (toolVideo(s)) return true;
  if (s.mode === "edit" || s.mode === "extend") return true;
  return s.mode === "omni" && s.slots.omni.refs.some((a) => a.kind === "video");
}

/** 参考视频总时长;必填视频还没上传时返回 undefined */
function videoSecs(s: ComposerState): number | undefined {
  switch (s.mode) {
    case "edit":
      return s.slots.edit.source?.secs;
    case "extend":
      return s.slots.extend.source?.secs;
    case "omni":
      return s.slots.omni.refs.filter((a) => a.kind === "video").reduce((t, a) => t + (a.secs ?? 0), 0);
    default: {
      const tv = toolVideo(s);
      if (tv) return tv.secs;
      /* 成片跟着必填素材走的模式：素材没放前积分显示 0 */
      const spec = toolSpec(s.model, s.mode);
      if (spec?.secsFrom && isToolMode(s.mode) && !toolSlot(s, s.mode).files[spec.secsFrom.input]?.length) return undefined;
      return 0;
    }
  }
}

/** 当前模型(模式)有没有分辨率参数：没有就不按分辨率加价 */
function hasResolution(s: ComposerState): boolean {
  const spec = toolSpec(s.model, s.mode);
  if (spec?.resolutions) return spec.resolutions.length > 0;
  return modelCaps(s.model).resolutions.length > 0;
}

export function estimateCredits(s: ComposerState): number {
  const input = videoSecs(s);
  if (input === undefined) return 0;
  const rate = PER_SEC[s.model] * (hasResolution(s) ? (RES_X[s.resolution] ?? 1) : 1);
  // Edit 的输出时长跟参考视频一样长;Extend 输出是用户选的延长秒数
  const out = s.mode === "edit" || (toolVideo(s) && toolSpec(s.model, s.mode)?.secsFrom) ? input : effectiveSecs(s);
  if (input > 0 && s.model.startsWith("seedance")) return Math.max(1, Math.ceil((input + out) * rate * VIDEO_INPUT_RATE));
  return Math.max(1, Math.ceil(out * rate));
}
