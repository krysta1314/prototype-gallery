// 画布上的工具入口(2026-11-06 Monica 定：独立工具页的能力也要在画布上能用)。
// 做法和图片节点的 Upscale 一样：选中节点 → 节点上方工具栏点工具 → 节点下方出参数浮层，
// 当前节点自动填进这个工具对应的素材位，其余素材在浮层里上传或从画布上选 → 生成结果落成画布上的新视频节点。
// 参数、模型、积分全部复用工具页的 specs.ts / logic.ts,画布不另写一套。纯数据 + 纯函数，测试直接读。

import { modelToolSpec, type MediaKind, type ModelToolSpec } from "./specs";
import { initialState, variantOf, type Media, type ToolState } from "./logic";

/** 视频节点工具栏里的模型工具(Upscale 单独一个按钮，见 VideoRow);图片节点上的是 Talking Avatar */
export const CANVAS_TOOLS: Record<"video" | "image", string[]> = {
  video: ["lip-sync", "character-swap", "motion-control", "render-3d"],
  image: ["talking-avatar"],
};

/** 工具栏上的按钮名(Video Character Swap 在画布上简称 Character Swap) */
export const CANVAS_TOOL_LABEL: Record<string, string> = {
  "lip-sync": "Lip Sync",
  "character-swap": "Character Swap",
  "motion-control": "Motion Control",
  "render-3d": "3D to Video",
  "talking-avatar": "Talking Avatar",
};

/** 当前节点填进哪个素材位：这个模型里第一个同类素材位(视频节点 → Lip Sync 的 Video / Motion Control 的 Motion Video;图片节点 → Talking Avatar 的 Photo) */
export function nodeInputId(spec: ModelToolSpec, model: string, kind: MediaKind): string | null {
  return variantOf(spec, model).inputs.find((i) => i.kind === kind)?.id ?? null;
}

/** 打开浮层时的初始状态：默认模型 + 当前节点放进它的素材位 */
export function seedState(key: string, node: Media): ToolState {
  const spec = modelToolSpec(key);
  const s = initialState(spec);
  const id = nodeInputId(spec, s.model, node.kind);
  return id ? { ...s, files: { ...s.files, [id]: [node] } } : s;
}

/** 换模型后当前节点仍在它的素材位里(两个模型的素材位 id 不同时也补上) */
export function keepNode(spec: ModelToolSpec, s: ToolState, node: Media): ToolState {
  const id = nodeInputId(spec, s.model, node.kind);
  if (!id || s.files[id]?.some((m) => m.id === node.id)) return s;
  return { ...s, files: { ...s.files, [id]: [node] } };
}

/** 浮层里「From canvas」可选的素材：同类、不是当前节点本身 */
export function canvasPicks(all: Media[], kind: MediaKind, exclude: string[]): Media[] {
  return all.filter((m) => m.kind === kind && !exclude.includes(m.id));
}

/** 原型不真跑模型：节点是自带样例时播工具页的演示成片，用户自己的素材就回放原视频(和工具页规则一样) */
export function canvasResultUrl(key: string, node: Media): string {
  const spec = modelToolSpec(key);
  return node.url.startsWith("/prototypes/") && spec.demoResult ? spec.demoResult : node.kind === "video" ? node.url : spec.demoResult ?? node.url;
}
