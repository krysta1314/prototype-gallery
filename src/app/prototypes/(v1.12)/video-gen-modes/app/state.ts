// 输入框状态(纯函数):模型、模式、各模式各自的素材位、提示词、比例 / 分辨率 / 时长、Multi-shot。
// 每个模式记住自己的素材;换模型被迫换模式时不动 slots,换回来就还原。

import type { Asset } from "./assets";
import { AUTO_RATIO, modelCaps, supports, type ModeKey, type ModelKey } from "./capabilities";
import { isToolMode, optionValue, toolSpec, visibleInputs, type ToolModeKey } from "./tools";

export type Shot = { id: string; prompt: string; secs: number };
export type WebSource = { kind: "url" | "doc"; value: string };
export type Element = { id: string; front: Asset; angles: Asset[] };

export type ModeSlots = {
  omni: { refs: Asset[]; elements: Element[]; voices: string[]; /** Wan 3.0:网页链接或文档 */ source?: WebSource };
  frames: { start?: Asset; end?: Asset; elements: Element[]; soundtrack?: Asset };
  keyframes: { start?: Asset; middle: Asset[]; end?: Asset; middleTime?: number; refs: Asset[] };
  edit: { source?: Asset; refs: Asset[] };
  extend: { source?: Asset; direction: "forward" | "backward" };
  /** 额外能力模式：每个模式按 tools.ts 的输入 id 存素材，按选项 id 存选项值 */
  tools: Partial<Record<ToolModeKey, ToolSlot>>;
};

export type ToolSlot = { files: Record<string, Asset[]>; opts: Record<string, string> };
export const toolSlot = (s: ComposerState, m: ToolModeKey): ToolSlot => s.slots.tools[m] ?? { files: {}, opts: {} };

export type ComposerState = {
  model: ModelKey;
  mode: ModeKey;
  slots: ModeSlots;
  prompt: string;
  ratio: string;
  resolution: string;
  secs: number;
  multiShot: { on: boolean; smart: boolean; shots: Shot[] };
  /** 一次生成几条(底栏「1」) */
  count: number;
  /** With Audio(只有 audioToggle 的模型显示) */
  audio: boolean;
  /** 模型的额外参数(extras.ts):键是 `${model}.${id}`,没设过用默认值 */
  extras: Record<string, string | boolean>;
  /** 换模型被迫回退前的模式;换回支持它的模型时自动还原，用户手动选模式就清掉 */
  fallbackFrom?: ModeKey;
};

export const emptySlots = (): ModeSlots => ({
  omni: { refs: [], elements: [], voices: [] },
  frames: { elements: [] },
  keyframes: { middle: [], refs: [] },
  edit: { refs: [] },
  extend: { direction: "forward" },
  tools: {},
});

const pick = (list: string[], want: string, fallback?: string) => (!list.length || list.includes(want) ? want : fallback && list.includes(fallback) ? fallback : list[0]);

/** 分辨率按清晰度排序，取不超过原值的最高一档(没有就取最低档) */
const RES_ORDER = ["360p", "480p", "540p", "720p", "768p", "1080p", "1440p", "2K", "2160p", "4K"];
const pickRes = (list: string[], want: string) => {
  /* 没有分辨率选项时保留原值，换回别的模型时不丢 */
  if (!list.length || list.includes(want)) return want;
  const rank = RES_ORDER.indexOf(want);
  const lower = list.filter((r) => RES_ORDER.indexOf(r) <= rank).sort((a, b) => RES_ORDER.indexOf(b) - RES_ORDER.indexOf(a));
  return lower[0] ?? list[0];
};

/** 比例 / 分辨率 / 时长夹进模型(和模式)允许的范围 */
/** 时长夹到模型范围内，并对齐到它的档位(Omni Flash 只有 4 / 6 / 8 / 10s) */
const snapSecs = (v: number, d: { min: number; max: number; step: number }) => {
  const clamped = Math.min(d.max, Math.max(d.min, v));
  return Math.min(d.max, d.min + Math.round((clamped - d.min) / d.step) * d.step);
};

/** 当前模型 + 模式可选的分辨率(模式自己的优先:专项模式 / Keyframes / Omni / Extend) */
export function modeResolutions(model: ModelKey, mode: ModeKey): string[] {
  const caps = modelCaps(model);
  const spec = toolSpec(model, mode);
  return (
    spec?.resolutions ??
    (mode === "keyframes" && caps.keyframes?.resolutions
      ? caps.keyframes.resolutions
      : mode === "omni" && caps.omni?.resolutions
          ? caps.omni.resolutions
          : mode === "extend" && caps.extend?.resolutions
            ? caps.extend.resolutions
            : caps.resolutions)
  );
}

function clampSettings(s: ComposerState): ComposerState {
  const caps = modelCaps(s.model);
  const spec = toolSpec(s.model, s.mode);
  const res = modeResolutions(s.model, s.mode);
  return {
    ...s,
    ratio: s.ratio === "adaptive" && AUTO_RATIO.has(s.model) ? s.ratio : pick(caps.ratios, s.ratio),
    resolution: pickRes(res, s.resolution),
    secs: snapSecs(s.secs, spec?.durations ?? caps.durations),
    multiShot: caps.multiShot ? { ...s.multiShot, smart: caps.multiShot.smart && s.multiShot.smart } : { ...s.multiShot, on: false },
  };
}

export function initialComposer(model: ModelKey = "seedance-2.5"): ComposerState {
  const caps = modelCaps(model);
  return clampSettings({
    model,
    mode: caps.modes[0],
    slots: emptySlots(),
    prompt: "",
    ratio: "9:16",
    resolution: "720p",
    secs: caps.durations.default,
    multiShot: { on: false, smart: false, shots: [] },
    count: 1,
    audio: true,
    extras: {},
  });
}

export function selectModel(s: ComposerState, k: ModelKey): { state: ComposerState; switchedFrom?: ModeKey; restored?: ModeKey } {
  if (s.fallbackFrom && supports(k, s.fallbackFrom))
    return { state: clampSettings({ ...s, model: k, mode: s.fallbackFrom, fallbackFrom: undefined }), restored: s.fallbackFrom };
  if (supports(k, s.mode)) return { state: clampSettings({ ...s, model: k }) };
  return {
    state: clampSettings({ ...s, model: k, mode: modelCaps(k).modes[0], fallbackFrom: s.fallbackFrom ?? s.mode }),
    switchedFrom: s.mode,
  };
}

export function selectMode(s: ComposerState, m: ModeKey): ComposerState {
  return clampSettings({ ...s, mode: m, fallbackFrom: undefined });
}

/** Multi-shot 只在 Omni Reference / First & Last Frame / Keyframes 下生效 */
export const shotsActive = (s: ComposerState): boolean =>
  !!modelCaps(s.model).multiShot && s.multiShot.on && (s.mode === "omni" || s.mode === "frames" || s.mode === "keyframes");

/** 真正会生成的时长:编辑跟原片;Multi-shot 是各段之和 */
export function effectiveSecs(s: ComposerState): number {
  const spec = toolSpec(s.model, s.mode);
  if (spec?.secsFromOption && isToolMode(s.mode)) return parseFloat(optionValue(spec, toolSlot(s, s.mode).opts, spec.secsFromOption.option)) || s.secs;
  if (spec?.secsFrom && isToolMode(s.mode)) {
    const a = toolSlot(s, s.mode).files[spec.secsFrom.input]?.[0];
    return a?.secs ? Math.max(1, Math.round(a.secs)) : s.secs;
  }
  if (s.mode === "edit" && s.slots.edit.source?.secs) return Math.round(s.slots.edit.source.secs);
  if (shotsActive(s) && !s.multiShot.smart && s.multiShot.shots.length) return s.multiShot.shots.reduce((t, x) => t + x.secs, 0);
  return s.secs;
}

/** 当前模式里放了的全部素材(给 @ 引用、Marketing Agent 判断用) */
export function modeAssets(s: ComposerState): Asset[] {
  const x = s.slots;
  const caps = modelCaps(s.model);
  switch (s.mode) {
    case "omni":
      return [...x.omni.refs, ...(caps.omni?.elements !== undefined ? x.omni.elements.flatMap((e) => [e.front, ...e.angles]) : [])];
    case "frames":
      return [x.frames.start, x.frames.end, caps.frames?.soundtrack ? x.frames.soundtrack : undefined, ...(caps.frames?.elements ? x.frames.elements.map((e) => e.front) : [])].filter(Boolean) as Asset[];
    case "keyframes":
      return [x.keyframes.start, ...x.keyframes.middle, x.keyframes.end, ...(caps.keyframes?.references !== undefined ? x.keyframes.refs : [])].filter(Boolean) as Asset[];
    case "edit":
      return [x.edit.source, ...(caps.edit?.references ? x.edit.refs : [])].filter(Boolean) as Asset[];
    case "extend":
      return [x.extend.source].filter(Boolean) as Asset[];
    default: {
      const spec = toolSpec(s.model, s.mode);
      if (!spec || !isToolMode(s.mode)) return [];
      const t = toolSlot(s, s.mode);
      return visibleInputs(spec, t.opts).flatMap((i) => t.files[i.id] ?? []);
    }
  }
}

/** 底栏「+」:把选的文件放进当前模式的空位(放不下的忽略) */
export function autoPlace(s: ComposerState, files: Asset[]): ComposerState {
  const images = files.filter((a) => a.kind === "image");
  const videos = files.filter((a) => a.kind === "video");
  const x = s.slots;
  const slots = { ...x };
  switch (s.mode) {
    case "omni":
      slots.omni = { ...x.omni, refs: [...x.omni.refs, ...files] };
      break;
    case "frames": {
      const q = [...images];
      slots.frames = { ...x.frames, start: x.frames.start ?? q.shift(), end: x.frames.end ?? q.shift() };
      break;
    }
    case "keyframes": {
      const q = [...images];
      const start = x.keyframes.start ?? q.shift();
      const end = x.keyframes.end ?? q.pop();
      slots.keyframes = { ...x.keyframes, start, end, middle: [...x.keyframes.middle, ...q] };
      break;
    }
    case "edit":
      slots.edit = { source: x.edit.source ?? videos[0], refs: [...x.edit.refs, ...images] };
      break;
    case "extend":
      slots.extend = { ...x.extend, source: x.extend.source ?? videos[0] };
      break;
    default: {
      /* 额外能力模式：按输入顺序，把同类型文件放进还有空位的格子 */
      const spec = toolSpec(s.model, s.mode);
      if (!spec || !isToolMode(s.mode)) break;
      const t = toolSlot(s, s.mode);
      const files2 = { ...t.files };
      const queue = [...files];
      for (const inp of visibleInputs(spec, t.opts)) {
        const cur = files2[inp.id] ?? [];
        const room = inp.max - cur.length;
        const take = queue.filter((a) => a.kind === inp.kind).slice(0, Math.max(0, room));
        take.forEach((a) => queue.splice(queue.indexOf(a), 1));
        files2[inp.id] = [...cur, ...take];
      }
      slots.tools = { ...x.tools, [s.mode]: { ...t, files: files2 } };
    }
  }
  return { ...s, slots };
}
