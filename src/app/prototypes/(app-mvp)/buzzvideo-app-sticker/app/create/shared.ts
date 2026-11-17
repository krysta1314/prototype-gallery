/* 贴纸风 Create 的共用小件:第一版的路径集中在这里转一道 */
export { MODE_COST, MODELS, VOICES, VOICE_BARS, modelLabel, type Mode, type ModelInfo, type Voice, type UseCase } from "../../../buzzvideo-app/app/data";
export { isSubscribed, isEnterprise, modelLocked, MEMBER_ONLY, sessionsFor, composerFromUseCase, nextTier, jobProgress, uploadProgress, type Job, type Message, type PlanItem, type Composer, type GenPrefs, type Attachment } from "../../../buzzvideo-app/app/store";
export { THINKING, isPlanning, stepStatuses } from "../../../buzzvideo-app/app/generation";
export { nextId } from "../../../buzzvideo-app/app/ids";
export { dismissKeyboard } from "../../../buzzvideo-app/app/keyboard";
export { ToolIcon } from "../../../buzzvideo-app/app/components/ToolEntries";
import { useStartTool } from "../../../buzzvideo-app/app/components/ToolEntries";
import { useV2 } from "../store";

import { MODES as V1_MODES, TOOLS as V1_TOOLS, type CreatePick, type Mode, type UseCase } from "../../../buzzvideo-app/app/data";
import { poster as P, video as V } from "../data";

/**
 * 新版设计 Create 的示例内容(2026-11-11):定位是「人人可玩的 AI 视频游乐场」,第一版的冰拿铁 / 精华 / 开业广告示例全部换掉。
 * 封面和成片都用 For You 里的片子;工具改成普通人的说法，去掉 Link to Ad / Product Photo 这类商家工具
 */
export const USE_CASES: UseCase[] = [
  { id: "uc-movie", title: "Your pet, movie star", category: "Pets", cover: P("poodle"), video: V("poodle"), tall: true, mode: "video", model: "seedance-2-5", attachments: [], prompt: "Turn my dog into a 1920s movie star, black-and-white film, dramatic close-ups", made: 4310, tags: ["trending"], format: "showcase" },
  { id: "uc-float", title: "My house floats away", category: "Effects", cover: P("dreamcore"), video: V("dreamcore"), tall: true, mode: "video", model: "seedance-2-5", attachments: [], prompt: "My house floating up into the sky, dreamy pastel clouds, slow camera pull-back", made: 1373, tags: ["new"], format: "showcase" },
  { id: "uc-painting", title: "Step out of a painting", category: "Effects", cover: P("museum"), video: V("museum"), tall: true, mode: "video", model: "seedance-2-5", attachments: [], prompt: "Famous portraits step out of their frames and walk down a rainy Paris street", made: 6110, tags: ["trending"], format: "showcase" },
  { id: "uc-party", title: "1920s party night", category: "Cinematic", cover: P("gatsby"), video: V("gatsby"), tall: false, mode: "video", model: "seedance-2-5", attachments: [], prompt: "A roaring-twenties ballroom party, golden light, a slow turn to the camera", made: 934, format: "showcase" },
  { id: "uc-dance", title: "Everyone does the dance", category: "Dance", cover: P("cows"), video: V("cows"), tall: false, mode: "agent", attachments: [], prompt: "Make a 15s video of my friends doing the NEON dance on a neon stage", made: 2890, tags: ["trending"], format: "showcase" },
  { id: "uc-fruit", title: "Fruit soap opera", category: "Funny", cover: P("fruit"), video: V("fruit"), tall: true, mode: "agent", attachments: [], prompt: "A 15s soap-opera episode starring a dramatic strawberry at a picnic", made: 1820, format: "showcase" },
];
export const CREATE_PICKS: CreatePick[] = [
  { id: "uc-movie", tag: "Trending" },
  { id: "uc-float", tag: "New" },
  { id: "uc-painting", tag: "Top" },
  { id: "uc-dance", tag: "Trending" },
  { id: "uc-party", tag: "New" },
  { id: "uc-fruit", tag: "Top" },
];
export const CREATE_PROMPTS = ["Turn my cat into a Renaissance painting", "Make my selfie dance like a K-pop idol"];

/** 工具：普通人的说法(第一版是给商家的) */
const TOOL_COPY: Record<string, { label?: string; desc: string; prompt: string } | null> = {
  agent: { label: "AI Director", desc: "Plans and makes the whole video", prompt: "Make a 15s video of " },
  image: { desc: "Pictures of anything you imagine", prompt: "Generate an image of " },
  video: { desc: "Clips up to 30s with sound", prompt: "Generate a video of " },
  audio: { label: "Voice & Music", desc: "Voiceovers, songs and sound effects", prompt: "Generate a voiceover that says: " },
  "product-to-video": { label: "Photo to Video", desc: "Bring any photo to life", prompt: "Turn this photo into a video with smooth camera motion" },
  avatar: { label: "Talking Photo", desc: "Make any photo talk", prompt: "Make the person in this photo say: " },
  "lip-sync": { desc: "Make anyone say anything", prompt: "Make the person in this video say: " },
  "remove-bg": { desc: "Clean cutout in one tap", prompt: "Remove the background from this photo" },
  "try-on": { label: "Try-On", desc: "See any outfit on you", prompt: "Show this outfit on me: " },
  upscale: { desc: "Sharpen photos to HD", prompt: "Upscale this photo to high resolution" },
  eraser: { desc: "Remove anything from a photo", prompt: "Remove this from the photo: " },
  expand: { desc: "Extend a photo to any size", prompt: "Expand this photo to 9:16" },
  "edit-video": { label: "Video Editor", desc: "Trim, cut and arrange your clips", prompt: "" },
  "link-to-ad": null,
  "product-photo": null,
};
const V1_LIST = V1_TOOLS.filter((t) => TOOL_COPY[t.id] !== null).map((t) => ({ ...t, ...(TOOL_COPY[t.id] ?? {}) }));
/** 剪辑器的三个入口放在工具最前面：剪辑、自动字幕、AI B-roll(点了进剪辑器，先选素材) */
const EDITOR_TOOLS = [
  { id: "edit-video", label: "Video Editor", desc: "Trim, cut and arrange your clips", icon: "scissors" as const, prompt: "" },
  { id: "auto-captions", label: "Auto Captions", desc: "Turn speech into captions, free", icon: "captions" as const, prompt: "" },
  { id: "ai-broll", label: "AI B-roll", desc: "AI fills in the shots you're missing", icon: "film" as const, prompt: "" },
];
export const TOOLS = [...EDITOR_TOOLS, ...V1_LIST.filter((t) => !EDITOR_TOOLS.some((e) => e.id === t.id))];
const EDITOR_IDS = EDITOR_TOOLS.map((t) => t.id);

/** 工具入口：剪辑类进剪辑器，其他沿用第一版(交给 AI Director) */
export function useStartToolS() {
  const start = useStartTool();
  const { d } = useV2();
  return (t: (typeof TOOLS)[number]) => (EDITOR_IDS.includes(t.id) ? d({ type: "push", route: { name: "editor" } }) : start(t));
}
import type { Message } from "../../../buzzvideo-app/app/store";

/**
 * 成片用哪条示例视频(第二版 POSTS 里的片子):按模式挑合适的一组，再按任务 id 固定选一条。
 * 对话里的结果卡、全屏查看、Post 进发布页都用同一条，前后对得上
 */
const CLIPS: Record<Mode, string[]> = {
  agent: ["camera", "tvc", "fridge", "shades", "chair", "pillow"],
  hybrid: ["fridge", "tvc", "pillow"],
  video: ["safari", "skate", "mecha", "racer", "cityjump", "phonecall"],
  image: ["outfit", "poodle", "gatsby", "hotel", "qipao"],
  audio: ["phonecall"],
};
const pick = (list: string[], id: string) => {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return list[h % list.length];
};
export const clipFor = (job: { id: string; mode: Mode }) => pick(CLIPS[job.mode], job.id);

const PET = ["poodle", "collie", "dogcam", "catfan"];

/** 这条任务让谁出镜(看它前面那条用户消息带的出镜头像):me = 分身，pet = 宠物 */
export function castOf(messages: Message[], jobId: string): string | null {
  const i = messages.findIndex((m) => m.role === "agent" && m.kind === "job" && m.jobId === jobId);
  for (let k = i - 1; k >= 0; k--) {
    const m = messages[k];
    if (m.role === "user") return m.attachments.find((a) => a.id.startsWith("cast-"))?.id.slice(5) ?? null;
  }
  return null;
}

/** 结果卡 / 全屏 / 发布页显示的片子：分身出镜用分身样片，宠物出镜用宠物片，其余按模式挑 */
export function resultClip(job: { id: string; mode: Mode }, cast: string | null, twinReady: boolean) {
  if (cast === "me" && twinReady) return "scooter";
  if (cast === "pet" && job.mode !== "audio") return pick(PET, job.id);
  return clipFor(job);
}

/** 画风(输入框里的画风按钮):发送时接在提示词后面 */
export const STYLES = ["Cinematic", "Anime", "3D cartoon", "Claymation", "Retro film", "Y2K", "Watercolor", "Comic"] as const;
export type StyleName = (typeof STYLES)[number];

export type LocalSheet = "mode" | "model" | "voice" | "style" | "ref" | "tools" | "sessions";

/** 创作模式：Marketing Agent 改叫 AI Director,说明换成普通人的说法(逻辑同第一版) */
const MODE_COPY: Record<string, Partial<(typeof V1_MODES)[number]>> = {
  agent: { label: "AI Director", title: "AI Director", outcome: "From idea to finished video", description: "Plans the scenes and makes the whole video for you" },
  image: { outcome: "Pictures of anything", description: "Fast pictures of anything you can imagine" },
  hybrid: { description: "Mix your own clips with AI shots into one video" },
};
export const MODES = V1_MODES.map((m) => ({ ...m, ...(MODE_COPY[m.id] ?? {}) }));
