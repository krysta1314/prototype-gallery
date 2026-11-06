/* 团队工作区里工具页生成结果的可见范围(2026-11-06 Monica 定，照 Canvas 的 My Projects / Team Projects + Share 弹窗):
   - 生成结果默认只有自己可见(My Results);
   - 结果卡上点 Share → 共享弹窗把 General access 从 Restricted 改成「Anyone at <团队>」,就出现在 Team Results,团队里所有人可看可下载、只有本人能改 / 删;
   - 改回 Restricted 或删掉结果，就从 Team Results 消失;
   - 个人账号没有团队，不显示 Share,也没有 Team Results。
   全站一个 store(按工作区 + 工具存),所有工具页共用。 */

import { useSyncExternalStore } from "react";
import type { ToolKey } from "../sidebarMenus";

export type SharedKind = "image" | "video" | "audio";
export type SharedItem = {
  /** 结果 id(本人的 = job id) */
  id: string;
  tool: ToolKey;
  ws: string;
  kind: SharedKind;
  url: string;
  poster?: string;
  /** 卡头一行:「模型 · 参数」 */
  summary: string;
  author: { name: string; color: string; me?: boolean };
  /** 共享 / 生成时间(毫秒) */
  at: number;
};

let items: SharedItem[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

export function shareResult(item: SharedItem) {
  items = [item, ...items.filter((x) => !(x.id === item.id && x.ws === item.ws))];
  emit();
}

export function unshareResult(id: string) {
  if (!items.some((x) => x.id === id)) return;
  items = items.filter((x) => x.id !== id);
  emit();
}

const getItems = () => items;
const EMPTY: SharedItem[] = [];

/** 当前工作区里共享出来的本人结果 */
export function useSharedItems(): SharedItem[] {
  return useSyncExternalStore(subscribe, getItems, () => EMPTY);
}

/** 队友共享出来的结果(演示数据):每个团队两位队友，每个工具两条，媒体按工具的结果类型给 */
const TEAMMATES: Record<string, { name: string; color: string }[]> = {
  "t-growth": [
    { name: "Alex Chen", color: "#1a1a2e" },
    { name: "Vera Lam", color: "#5b6cff" },
  ],
  "t-beauty": [
    { name: "Sofia Ruiz", color: "#e0568a" },
    { name: "Mei Wong", color: "#f0a020" },
  ],
  "t-atlas": [
    { name: "Daniel Park", color: "#12a594" },
    { name: "Priya Shah", color: "#8a5cf6" },
  ],
};

const S = "/prototypes/ai-tools/samples";
const TEAM_MEDIA: Partial<Record<ToolKey, { kind: SharedKind; urls: string[]; summaries: string[] }>> = {
  upscale: { kind: "image", urls: ["/prototypes/ai-tools/upscale-demo-after.jpg", "/prototypes/ai-tools/demo-after.png"], summaries: ["SeedVR · Factor 4x · PNG", "SeedVR · Target 2K · JPG"] },
  "video-upscale": { kind: "video", urls: ["/prototypes/ai-tools/upscale-video-demo.mp4", "/prototypes/asset-library/videos/video-01.mp4"], summaries: ["SeedVR · Target 1080p · MP4", "SeedVR · Factor 2x · MP4"] },
  "motion-control": { kind: "video", urls: [`${S}/avatar-result.mp4`, `${S}/3d-result.mp4`], summaries: ["Kling 3.0 · Like the video · Pro", "Kling 3.0 · Like the image · Standard"] },
  "character-swap": { kind: "video", urls: ["/prototypes/asset-library/videos/video-01.mp4", `${S}/talking-clip.mp4`], summaries: ["MiniMax H3 Max · 1 person", "MiniMax H3 Max · 2 people"] },
  "render-3d": { kind: "video", urls: [`${S}/3d-result.mp4`, `${S}/3d-blockout.mp4`], summaries: ["MiniMax H3 Max · 3 look references", "MiniMax H3 Max · No references"] },
  "lip-sync": { kind: "video", urls: [`${S}/lipsync-result.mp4`, `${S}/talking-clip.mp4`], summaries: ["Kling Lip Sync · Uploaded audio", "Kling Lip Sync · Text to speech"] },
  "talking-avatar": { kind: "video", urls: [`${S}/avatar-result.mp4`, `${S}/lipsync-result.mp4`], summaries: ["Kling Avatar · 16s", "MiniMax H3 Max · 32s"] },
};

const HOUR = 3_600_000;
/** 演示数据的时间以打开页面的时刻为准(模块加载时取一次，不随渲染变化) */
const BASE = Date.now();

export function teammateItems(ws: string, tool: ToolKey): SharedItem[] {
  const people = TEAMMATES[ws];
  const media = TEAM_MEDIA[tool];
  if (!people || !media) return [];
  return people.map((p, i) => ({
    id: `team-${ws}-${tool}-${i}`,
    tool,
    ws,
    kind: media.kind,
    url: media.urls[i] ?? media.urls[0]!,
    summary: media.summaries[i] ?? media.summaries[0]!,
    author: p,
    at: BASE - (i * 5 + 2) * HOUR,
  }));
}
