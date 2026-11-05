// 模型的额外参数:fal API 里有、会影响成片、但不属于比例 / 时长 / 分辨率 / 声音的开关和选项。
// 2026-11-05 按 fal OpenAPI schema 逐个端点核对(审计记录:docs/marketing-agent/_api-param-audit-2026-11-05.md)。
// 只收用户该看到的;seed、enable_safety_checker、sync_mode、safety_tolerance 这类调试 / 平台参数后端写死，不进界面。

import type { ModeKey, ModelKey } from "./capabilities";
import type { ComposerState } from "./state";

export type ExtraParam = {
  id: string;
  label: string;
  /** 对应的 API 字段(给 Marketing Agent / 后端) */
  api: string;
  kind: "toggle" | "choice";
  /** choice 的选项(界面文案);apiValues 与之一一对应 */
  values?: string[];
  apiValues?: (string | boolean | null)[];
  default: string | boolean;
  /** 一句话说明(界面上显示在标题下) */
  hint: string;
  /** 只在这些模式显示;不填 = 模型的所有模式 */
  modes?: ModeKey[];
  /** 开关打开时分辨率锁成这个值(Seedance Draft 只能 480p) */
  lockResolution?: string;
  /** 某些情况下必须是某个值(锁住并说明原因) */
  force?: (s: ComposerState) => { value: string | boolean; reason: string } | undefined;
};

/** Wan:传了网页 / 文档,API 要求 enable_thinking = true */
const wanThinkingForce = (s: ComposerState) =>
  s.mode === "omni" && s.slots.omni.source ? { value: true, reason: "Required when the video is based on a web page or document" } : undefined;

const wan: ExtraParam[] = [
  {
    id: "thinking",
    label: "Thinking",
    api: "enable_thinking",
    kind: "toggle",
    default: false,
    hint: "Plans the video before generating. Slower, better for detailed briefs",
    force: wanThinkingForce,
  },
  {
    id: "enhance",
    label: "Prompt Enhance",
    api: "enable_prompt_expansion",
    kind: "toggle",
    default: true,
    hint: "Rewrites your prompt for better results. Turn off to save 20–60s",
  },
  {
    id: "autoLength",
    label: "Smart Duration",
    api: "duration = null",
    kind: "toggle",
    default: false,
    hint: "Let the model pick the length from your prompt and references",
  },
];

/** MiniMax H3 系列生成端点:prompt_expansion_mode disabled / balanced / quality */
const h3Enhance: ExtraParam = {
  id: "enhanceMode",
  label: "Prompt Enhance",
  api: "prompt_expansion_mode",
  kind: "choice",
  values: ["Off", "Balanced", "Quality"],
  apiValues: ["disabled", "balanced", "quality"],
  default: "Balanced",
  hint: "Balanced takes about a second. Quality spends up to 30s on a richer prompt",
  modes: ["frames", "keyframes", "omni", "camera"],
};

/** MiniMax 延长:enable_prompt_expansion + output(extended / continuation) */
const h3Extend: ExtraParam[] = [
  {
    id: "extendOutput",
    label: "Output",
    api: "output",
    kind: "choice",
    values: ["Full video", "New part only"],
    apiValues: ["extended", "continuation"],
    default: "Full video",
    hint: "Full video joins your clip and the new footage. New part only returns just the added footage",
    modes: ["extend"],
  },
  {
    id: "extendEnhance",
    label: "Prompt Enhance",
    api: "enable_prompt_expansion",
    kind: "toggle",
    default: true,
    hint: "Rewrites your prompt for better results",
    modes: ["extend"],
  },
];

/* Seedance(BytePlus)接口有 duration = -1(模型定时长)、2.5 还有 Draft / MOV 输出;2026-11-05 评审决定都不做，Seedance 没有额外参数 */

export const EXTRAS: Partial<Record<ModelKey, ExtraParam[]>> = {
    "wan-3.0": wan,
  "wan-3.0-prime": wan,
  "h3-max": [h3Enhance, ...h3Extend],
  "h3-max-turbo": [h3Enhance, ...h3Extend],
  h3: [h3Enhance],
  "kling-3.0-omni": [
    {
      id: "keepAudio",
      label: "Keep Original Audio",
      api: "keep_audio",
      kind: "toggle",
      default: true,
      hint: "Keep the sound from the video you're editing",
      modes: ["edit"],
    },
  ],
  "flux-3-video": [
    {
      id: "autoLength",
      label: "Smart Duration",
      api: "duration = \"auto\"",
      kind: "toggle",
      default: false,
      hint: "Let the model pick how much to add",
      modes: ["extend"],
    },
  ],
  "flux-3-max-video": [
    {
      id: "reasoning",
      label: "Reasoning",
      api: "reasoning_level",
      kind: "choice",
      values: ["High", "Low"],
      apiValues: ["high", "low"],
      default: "High",
      hint: "High plans the shot more carefully but takes longer",
    },
  ],
};

/** 当前模型 + 模式要显示的额外参数 */
export const extrasFor = (s: ComposerState): ExtraParam[] => (EXTRAS[s.model] ?? []).filter((p) => !p.modes || p.modes.includes(s.mode));

/** 参数现在的值(被锁住时取锁定值) */
export function extraValue(s: ComposerState, p: ExtraParam): string | boolean {
  const forced = p.force?.(s);
  if (forced) return forced.value;
  return s.extras?.[`${s.model}.${p.id}`] ?? p.default;
}

/** 写入一个额外参数(打开 Draft 这类开关时顺带把分辨率锁过去) */
export function setExtra(s: ComposerState, id: string, v: string | boolean): Partial<ComposerState> {
  const p = (EXTRAS[s.model] ?? []).find((x) => x.id === id);
  const patch: Partial<ComposerState> = { extras: { ...s.extras, [`${s.model}.${id}`]: v } };
  if (p?.lockResolution && v === true) patch.resolution = p.lockResolution;
  return patch;
}

/** 有开关把分辨率锁住时，返回锁定值 */
export function lockedResolution(s: ComposerState): string | undefined {
  return extrasFor(s).find((p) => p.lockResolution && extraValue(s, p) === true)?.lockResolution;
}

/** 开了 Smart Duration:时长交给模型 */
export function smartDuration(s: ComposerState): boolean {
  const p = extrasFor(s).find((x) => x.id === "autoLength");
  return !!p && extraValue(s, p) === true;
}

/** 给 API 的值(Marketing Agent / 后端拼请求用) */
export function extraApiValue(s: ComposerState, p: ExtraParam): string | boolean | null {
  const v = extraValue(s, p);
  if (p.kind === "toggle") return v;
  const i = p.values?.indexOf(v as string) ?? -1;
  return i >= 0 && p.apiValues ? p.apiValues[i] : (v as string);
}
