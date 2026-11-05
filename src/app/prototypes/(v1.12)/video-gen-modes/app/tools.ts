// 生成类专项模式:MiniMax H3 Max 的运镜(Camera Control)和风格化(Style Presets)。
// 加工类(对口型、数字人、重新构图、重新打光、换人、插入片段、3D 转视频、动作迁移)2026-11-05 拆成独立工具页:ai-tools/app/model-tools。
// 一张表驱动：每个「模型 × 模式」写清要哪些素材格、每格几个 / 多长、Model Settings 里有哪些选项。
// 素材格出现在输入框(和其他模式一样 56×56、「+」+ 文字);选项放 Model Settings(不占输入框)。
// 字段来自各端点官方 schema(fal,2026-11-03 核对)。

import type { AssetKind } from "./assets";
import type { ModelKey } from "./capabilities";

export type ToolModeKey = "camera" | "style";
export const TOOL_MODES: ToolModeKey[] = ["camera", "style"];
export const isToolMode = (m: string): m is ToolModeKey => (TOOL_MODES as string[]).includes(m);

export const TOOL_LABEL: Record<ToolModeKey, string> = {
  camera: "Camera Control",
  style: "Style Presets",
};

export const TOOL_HINT: Record<ToolModeKey, string> = {
  camera: "Move the camera around a still scene, like an orbit or push-in",
  style: "One-tap looks: VHS, hand-drawn, 70s toon, 16-bit, low-poly",
};

export type ToolInput = {
  id: string;
  kind: AssetKind;
  /** 格子里的文字(56px 内，可两行) */
  caption: string;
  /** 悬停提示 */
  hint: string;
  min: number;
  max: number;
  secsMin?: number;
  secsMax?: number;
  /** 只在某个选项取某个值时出现(如 Lip Sync 选 Audio file 才要音频) */
  showIf?: { option: string; value: string };
};

export type ToolOption = {
  id: string;
  label: string;
  values: string[];
  default: string;
  /** 数字输入(秒)而不是选项 */
  numeric?: { min: number; max: number; step: number };
  showIf?: { option: string; value: string };
};

export type ToolSpec = {
  inputs: ToolInput[];
  options?: ToolOption[];
  placeholder: string;
  /** 成片时长跟某个输入走(Model Settings 里时长显示成固定说明) */
  secsFrom?: { input: string; label: string };
  /** 成片时长由某个选项决定:Model Settings 的 Duration 显示成固定说明 */
  secsFromOption?: { option: string; label: string };
  /** 这个模式自己的时长 / 分辨率 / 比例(覆盖模型的) */
  durations?: { min: number; max: number; step: 1; default: number };
  resolutions?: string[];
  ratios?: string[];
  /** 必须写提示词(风格化;Lip Sync 选 Typed script 时提示词就是台词) */
  promptRequired?: boolean | { option: string; value: string };
  /** 没有比例参数(画面跟随素材) */
  ratioFollows?: string;
};

const img = (id: string, caption: string, hint: string, min = 1, max = 1): ToolInput => ({ id, kind: "image", caption, hint, min, max });


export const CAMERA_PRESETS = [
  "Dolly in",
  "Dolly out",
  "Truck left",
  "Truck right",
  "Pan left",
  "Pan right",
  "Tilt up",
  "Tilt down",
  "Pedestal up",
  "Pedestal down",
  "Roll left",
  "Roll right",
  "S-curve forward",
];

export const STYLE_PRESETS = ["VHS", "Hand-drawn", "Retro Toon 70s", "16-bit Pixel", "Low Poly"];

export const TOOL_SPECS: Partial<Record<ModelKey, Partial<Record<ToolModeKey, ToolSpec>>>> = {
  "h3-max": {
    /* minimax/h3-max/camera-controls:预设镜头运动(或 2–12 个轨迹点,原型只做预设) */
    camera: {
      inputs: [img("image", "Start\nframe", "The scene to move the camera around")],
      options: [{ id: "move", label: "Camera Move", values: CAMERA_PRESETS, default: "Dolly in" }],
      placeholder: "Optional: describe the scene. The scene stays still, only the camera moves",
      ratioFollows: "Follows your start frame",
    },
    /* minimax/h3-max/styles/{vhs,hand-drawn,retro-toon-70s,16bit-pixel,low-poly}:prompt + 可选首帧;5–15s;768p 带声;VHS 多 damage_level */
    style: {
      inputs: [img("image", "Start\nframe", "Optional start frame", 0, 1)],
      options: [
        { id: "style", label: "Style", values: STYLE_PRESETS, default: "VHS" },
        { id: "damage", label: "Tape Damage", values: ["Light", "Medium", "Heavy"], default: "Medium", showIf: { option: "style", value: "VHS" } },
      ],
      placeholder: "Describe the scene, such as a skateboarder at golden hour",
      promptRequired: true,
      durations: { min: 5, max: 15, step: 1, default: 5 },
      resolutions: ["768p"],
    },
  },
};

export const toolSpec = (model: ModelKey, mode: string): ToolSpec | undefined => (isToolMode(mode) ? TOOL_SPECS[model]?.[mode] : undefined);

/** 某个选项当前的值(没选过用默认) */
export const optionValue = (spec: ToolSpec, opts: Record<string, string>, id: string): string => opts[id] ?? spec.options?.find((o) => o.id === id)?.default ?? "";

const shown = (spec: ToolSpec, opts: Record<string, string>, showIf?: { option: string; value: string }) => !showIf || optionValue(spec, opts, showIf.option) === showIf.value;
export const visibleInputs = (spec: ToolSpec, opts: Record<string, string>) => spec.inputs.filter((i) => shown(spec, opts, i.showIf));
export const visibleOptions = (spec: ToolSpec, opts: Record<string, string>) => (spec.options ?? []).filter((o) => shown(spec, opts, o.showIf));

/** 这个模式现在是否必须写提示词 */
export function promptRequiredFor(spec: ToolSpec, opts: Record<string, string>): boolean {
  const r = spec.promptRequired;
  if (!r) return false;
  return r === true || optionValue(spec, opts, r.option) === r.value;
}
