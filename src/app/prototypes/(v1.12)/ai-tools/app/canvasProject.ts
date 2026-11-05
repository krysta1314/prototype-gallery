// Upscale 原型的画布入口:把 Agent 带来的图建成一个只有图片节点的画布工程(没有分镜、没有剪辑片段)。
import type { Handoff } from "@/app/prototypes/(v1.12)/hybrid-reel/agent/chat/types";
import { arrange, type Asset, type Project } from "@/app/prototypes/(v1.12)/hybrid-reel/canvas/project";
import type { Stored } from "@/app/prototypes/(v1.12)/hybrid-reel/canvas/workspace";
import type { UpscaleSource } from "./api";

/** Agent 的 Open in canvas 把图带过来(sessionStorage) */
export const CANVAS_KEY = "upscale-image:canvas";

export type CanvasPayload = { images: UpscaleSource[]; /** 进画布时 Agent 里的余额 */ credits?: number };

const isSource = (x: unknown): x is UpscaleSource => {
  const s = x as UpscaleSource | null;
  return !!s && typeof s.url === "string" && !!s.url && s.width > 0 && s.height > 0 && typeof s.name === "string";
};

/** 读 CANVAS_KEY 的内容;空 / 坏 / 没有一张合格的图 = null(页面退回样图)。兼容直接存数组的写法 */
export function parseCanvasPayload(raw: string | null): CanvasPayload | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as unknown;
    const list = Array.isArray(v) ? v : (v as { images?: unknown } | null)?.images;
    if (!Array.isArray(list) || !list.length || !list.every(isSource)) return null;
    const credits = Array.isArray(v) ? undefined : (v as { credits?: unknown }).credits;
    return { images: list, ...(typeof credits === "number" && Number.isFinite(credits) ? { credits } : {}) };
  } catch {
    return null;
  }
}

/** 空分镜的最小交接:画布只认它的 brief / profiles / outline / credits,这里全是空壳 */
function emptyHandoff(credits?: number): Stored {
  const h: Handoff = {
    brief: { platform: "", durationSec: 0, audience: "", sellingPoints: [], cta: "", subtitleLang: "" },
    profiles: [],
    outline: { shots: [], direction: "", bgmPrompt: "", credits: { base: 0, perGenerateShot: 0, generatedShots: 0, total: 0 }, model: "" },
    ...(credits !== undefined ? { credits } : {}),
  };
  return h;
}

/** 每张图一个「上传的、已就绪」的图片节点;aspect 和 pixels 用真实宽高(Upscale 浮层按 pixels 算输出尺寸) */
export function upscaleCanvas(images: UpscaleSource[], credits?: number): { handoff: Stored; project: Project } {
  const assets: Asset[] = images.map((im, i) => ({
    id: `up-${i}`,
    kind: "image",
    origin: "upload",
    label: im.name,
    url: im.url,
    durationSec: 5,
    aspect: im.width / im.height,
    pixels: { width: im.width, height: im.height },
    status: "ready",
    identity: "footage",
    x: 0,
    y: 0,
  }));
  const project = arrange({
    v: 1,
    assets,
    clips: [],
    subtitleStyle: "none",
    musicId: null,
    musicVol: 35,
    voiceVol: 100,
    originalOn: true,
    aspect: "original",
    autoLayout: true,
    editor: { x: 0, y: 0 },
    bgmPrompt: "",
    creditsPerShot: 0,
    spentCredits: 0,
    cards: [],
    sfx: [],
  });
  return { handoff: { ...emptyHandoff(credits), project }, project };
}
