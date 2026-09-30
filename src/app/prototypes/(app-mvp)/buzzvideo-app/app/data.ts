import type { Job, Message, Session } from "./store";

export type Mode = "agent" | "image" | "video" | "audio";
export type WorkspaceId = "personal" | "presslogic";

export type IconName =
  | "message-square-text" | "image" | "clapperboard" | "audio-lines" | "menu" | "square-pen" | "list-checks" | "plus"
  | "arrow-up" | "camera" | "images" | "file-text" | "folder-open" | "x" | "chevron-down"
  | "chevron-left" | "chevron-right" | "ellipsis" | "download" | "share" | "message-square" | "rotate-ccw"
  | "copy" | "flag" | "trash" | "settings" | "user-round" | "check" | "bell" | "globe" | "shield"
  | "log-out" | "external-link" | "play" | "search" | "circle-alert" | "compass" | "megaphone" | "square-plus"
  | "volume-2" | "volume-x" | "circle-check" | "loader" | "arrow-up-right" | "info" | "mail" | "pin" | "pin-off";

/** 素材目录 */
export const A = "/prototypes/buzzvideo-app";

export const USER = { name: "Alex Chen", email: "alex@example.com", avatar: `${A}/avatar.jpg` };

export const WORKSPACES: { id: WorkspaceId; name: string; detail: string }[] = [
  { id: "personal", name: "Personal", detail: "Your own credits" },
  { id: "presslogic", name: "PressLogic", detail: "Organization · Member" },
];
export const workspaceName = (id: WorkspaceId) => WORKSPACES.find((w) => w.id === id)!.name;

export const CREDITS_INITIAL: Record<WorkspaceId, number> = { personal: 1240, presslogic: 18400 };
export const MONTHLY_USED: Record<WorkspaceId, number> = { personal: 860, presslogic: 5200 };
/** 每次生成扣的积分(乘以批量数量) */
export const MODE_COST: Record<Mode, number> = { agent: 60, image: 8, video: 45, audio: 5 };

export const MODES: { id: Mode; label: string; short: string; icon: IconName; description: string }[] = [
  { id: "agent", label: "Marketing Agent", short: "Agent", icon: "message-square-text", description: "Plans the strategy and makes images or videos for you" },
  { id: "image", label: "Image", short: "Image", icon: "image", description: "Fast image generation for posts and product shots" },
  { id: "video", label: "Video", short: "Video", icon: "clapperboard", description: "Up to 15s of video with synced audio" },
  { id: "audio", label: "Audio", short: "Audio", icon: "audio-lines", description: "Voiceovers, music and sound effects" },
];
export const modeLabel = (m: Mode) => MODES.find((x) => x.id === m)!.label;

export const MODELS: Record<Exclude<Mode, "agent">, { id: string; label: string }[]> = {
  image: [
    { id: "seedream-5", label: "Seedream 5.0" },
    { id: "nano-banana", label: "Nano Banana" },
    { id: "gpt-image", label: "GPT Image" },
  ],
  video: [
    { id: "seedance-2-5", label: "Seedance 2.5" },
    { id: "seedance-2", label: "Seedance 2.0" },
    { id: "veo-3", label: "Veo 3" },
  ],
  audio: [
    { id: "seed-audio", label: "Seed Audio" },
    { id: "seed-music", label: "Seed Music" },
  ],
};
/** Agent 模式由 Agent 自己选模型,所以是 null */
export const defaultModel = (mode: Mode): string | null => (mode === "agent" ? null : MODELS[mode][0].id);
export const modelLabel = (id: string) =>
  Object.values(MODELS).flat().find((m) => m.id === id)?.label ?? id;

export const readyTitle = (mode: Mode) =>
  mode === "image" ? "Your images are ready" : mode === "audio" ? "Your audio is ready" : "Your video is ready";

export type UseCase = {
  id: string;
  title: string;
  category: string;
  cover: string;
  video?: string;
  tall: boolean;
  prompt: string;
  mode: Mode;
  model?: string;
  attachments: string[];
};

export const CATEGORIES = ["All", "Food & Drink", "Beauty", "Fashion", "Retail"];

export const USE_CASES: UseCase[] = [
  { id: "uc-latte", title: "Iced latte launch", category: "Food & Drink", cover: `${A}/usecase-latte.jpg`, video: `${A}/result-agent.mp4`, tall: true, mode: "agent", attachments: [`${A}/photo-2.jpg`], prompt: "Make a 15s vertical ad for our new iced latte. Open on the ice pour and end with “20% off today”." },
  { id: "uc-skincare", title: "Glow serum reveal", category: "Beauty", cover: `${A}/usecase-skincare.jpg`, video: `${A}/result-video.mp4`, tall: false, mode: "video", model: "seedance-2-5", attachments: [], prompt: "A glass serum bottle on wet stone, slow orbit, soft peach light, water droplets. 8 seconds." },
  { id: "uc-sneaker", title: "Sneaker drop teaser", category: "Fashion", cover: `${A}/usecase-sneaker.jpg`, tall: false, mode: "video", model: "seedance-2-5", attachments: [], prompt: "Our new sneaker floats above a city street at dusk, fast motion, streetwear energy. 6 seconds." },
  { id: "uc-bakery", title: "Morning bakery reel", category: "Food & Drink", cover: `${A}/usecase-bakery.jpg`, tall: true, mode: "agent", attachments: [`${A}/photo-5.jpg`], prompt: "Create a cozy 15s reel for our bakery’s morning pastries. Warm tone, end with our opening hours." },
  { id: "uc-lipstick", title: "Lip tint swatches", category: "Beauty", cover: `${A}/usecase-lipstick.jpg`, tall: true, mode: "image", model: "seedream-5", attachments: [], prompt: "Four product shots of our lip tint shades with swatches on skin, clean pink background." },
  { id: "uc-opening", title: "Grand opening promo", category: "Retail", cover: `${A}/usecase-opening.jpg`, tall: false, mode: "agent", attachments: [`${A}/photo-4.jpg`], prompt: "We’re opening a new shop in Causeway Bay this Saturday. Make a 15s ad inviting people to visit." },
  { id: "uc-florist", title: "Mother’s Day bouquets", category: "Retail", cover: `${A}/usecase-florist.jpg`, tall: false, mode: "image", model: "seedream-5", attachments: [], prompt: "Three Instagram posts for our Mother’s Day peony bouquets, soft pastel style." },
  { id: "uc-ramen", title: "Ramen voiceover", category: "Food & Drink", cover: `${A}/usecase-ramen.jpg`, tall: true, mode: "audio", model: "seed-audio", attachments: [], prompt: "A warm, friendly 30s voiceover for our ramen shop with a light upbeat music bed." },
];

export type Banner = {
  id: string;
  kicker: string;
  title: string;
  subtitle: string;
  image: string;
  action: { type: "useCase"; id: string } | { type: "create"; mode: Mode };
};

export const BANNERS: Banner[] = [
  { id: "b-seedance", kicker: "New model", title: "Seedance 2.5 is here", subtitle: "Sharper motion and longer shots", image: `${A}/banner-seedance.jpg`, action: { type: "create", mode: "video" } },
  { id: "b-audio", kicker: "New", title: "Now with Audio", subtitle: "Voiceovers and music from one prompt", image: `${A}/banner-audio.jpg`, action: { type: "create", mode: "audio" } },
  { id: "b-templates", kicker: "Templates", title: "Autumn café ideas", subtitle: "Ready-to-use ads for your shop", image: `${A}/banner-templates.jpg`, action: { type: "useCase", id: "uc-latte" } },
];

export type RecentPhoto = { id: string; uri: string; kind: "photo" | "video"; duration?: string };
export const RECENT_PHOTOS: RecentPhoto[] = [
  { id: "rp-2", uri: `${A}/photo-2.jpg`, kind: "photo" },
  { id: "rp-3", uri: `${A}/photo-3.jpg`, kind: "video", duration: "0:12" },
  { id: "rp-1", uri: `${A}/photo-1.jpg`, kind: "photo" },
  { id: "rp-8", uri: `${A}/photo-8.jpg`, kind: "photo" },
  { id: "rp-4", uri: `${A}/photo-4.jpg`, kind: "photo" },
  { id: "rp-7", uri: `${A}/photo-7.jpg`, kind: "video", duration: "0:08" },
  { id: "rp-5", uri: `${A}/photo-5.jpg`, kind: "photo" },
  { id: "rp-6", uri: `${A}/photo-6.jpg`, kind: "photo" },
];

export type LibraryAsset = { id: string; uri: string; kind: "photo" | "video"; label: string };
/** 素材库里网页版传过的素材 */
export const LIBRARY_ASSETS: LibraryAsset[] = [
  { id: "la-1", uri: `${A}/usecase-bakery.jpg`, kind: "photo", label: "Bakery hero" },
  { id: "la-2", uri: `${A}/usecase-latte.jpg`, kind: "photo", label: "Latte key visual" },
  { id: "la-3", uri: `${A}/usecase-opening.jpg`, kind: "photo", label: "Shop front" },
  { id: "la-4", uri: `${A}/usecase-florist.jpg`, kind: "photo", label: "Bouquet shoot" },
  { id: "la-5", uri: `${A}/usecase-skincare.jpg`, kind: "video", label: "Serum b-roll" },
  { id: "la-6", uri: `${A}/usecase-ramen.jpg`, kind: "photo", label: "Ramen close-up" },
];

export const PDF_ATTACHMENT = { uri: "", kind: "pdf" as const, label: "Brand guidelines.pdf" };

export type Plan = { text: string; pills: string[] };

/** 各模式的通用方案;Agent 命中关键词时改用 RESULT_RULES 里那组的分镜(见 planFor) */
export const PLANS: Record<Mode, Plan> = {
  agent: { text: "Three beats, 15 seconds, cut vertical for Reels and TikTok.", pills: ["Hook: product close-up", "Scene: your shop in use", "CTA: your offer"] },
  image: { text: "A clean product shot, ready for your feed.", pills: ["Product hero", "Warm daylight", "Clean background"] },
  video: { text: "One continuous shot with synced sound.", pills: ["Slow push-in", "Golden-hour light", "8 seconds"] },
  audio: { text: "Made to sound like your shop, not a stock ad.", pills: ["Friendly voiceover", "Upbeat music bed", "30 seconds"] },
};

export const RESULTS: Record<Mode, { cover: string; video?: string }> = {
  agent: { cover: `${A}/result-agent.jpg`, video: `${A}/result-agent.mp4` },
  image: { cover: `${A}/result-image.jpg` },
  video: { cover: `${A}/result-video.jpg`, video: `${A}/result-video.mp4` },
  audio: { cover: `${A}/result-audio.jpg` },
};

/** 关键词 → 贴题素材 + AI 起的作品标题(真实 APP 由 Agent 生成标题) */
/** 分镜里 Scene / CTA 两帧用的素材(Hook 永远是成片封面);没配 cta 时用用户自己的产品照 */
type Frames = { scene: string; cta?: string };

const RESULT_RULES: { re: RegExp; title: string; cover: string; video?: string; plan: Plan }[] = [
  {
    re: /latte|coffee|café|cafe|espresso/i, title: "Iced Latte Summer Pour", cover: `${A}/result-agent.jpg`, video: `${A}/result-agent.mp4`,
    plan: { text: "Open on the pour, 15 seconds, cut vertical for Reels and TikTok.", pills: ["Hook: ice pour close-up", "Scene: morning café", "CTA: 20% off today"] },
  },
  {
    re: /serum|skincare|skin|beauty|glow/i, title: "Glow Serum Reveal", cover: `${A}/result-video.jpg`, video: `${A}/result-video.mp4`,
    plan: { text: "Let the texture sell it: slow, close and glossy, 15 seconds.", pills: ["Hook: a drop hits the glass", "Scene: dewy skin at the mirror", "CTA: shop the launch"] },
  },
  {
    re: /bakery|croissant|pastry|pastries|bread/i, title: "Morning Croissant Reel", cover: `${A}/usecase-bakery.jpg`,
    plan: { text: "Warm and slow, like the first hour of the day.", pills: ["Hook: steam off fresh croissants", "Scene: sunrise at the counter", "CTA: opening hours"] },
  },
  {
    re: /sneaker|shoe|streetwear/i, title: "Sneaker Drop Teaser", cover: `${A}/usecase-sneaker.jpg`,
    plan: { text: "Fast cuts on the beat, hold the reveal to the end.", pills: ["Hook: laces snap tight", "Scene: dusk on the street", "CTA: drop date"] },
  },
  {
    re: /lip|lipstick|tint|makeup/i, title: "Lip Tint Swatch Set", cover: `${A}/usecase-lipstick.jpg`,
    plan: { text: "Shade by shade, so people can pick theirs.", pills: ["Hook: one swipe, full color", "Scene: four shades on skin", "CTA: find your shade"] },
  },
  {
    re: /flower|florist|bouquet|peony/i, title: "Mother’s Day Bouquets", cover: `${A}/usecase-florist.jpg`,
    plan: { text: "Soft light, real hands, a gift worth ordering early.", pills: ["Hook: peonies opening", "Scene: wrapping at the bench", "CTA: order by Friday"] },
  },
  {
    re: /ramen|noodle|restaurant/i, title: "Late-Night Ramen Voiceover", cover: `${A}/usecase-ramen.jpg`,
    plan: { text: "Steam, sound and a full bowl. 15 seconds that make people hungry.", pills: ["Hook: noodles lifted high", "Scene: the late-night counter", "CTA: open till 2am"] },
  },
  {
    re: /opening|shop|store|boutique/i, title: "Grand Opening Weekend", cover: `${A}/usecase-opening.jpg`,
    plan: { text: "Make it feel like an event people shouldn’t miss.", pills: ["Hook: doors swing open", "Scene: first guests inside", "CTA: this Saturday"] },
  },
];

export type ResultMatch = { cover: string; video?: string; title?: string };

/** 按提示词关键词挑一个贴题的结果素材和标题;没命中就用该模式的默认结果、不带标题 */
export function resultFor(mode: Mode, text: string): ResultMatch {
  const hit = RESULT_RULES.find((r) => r.re.test(text));
  const titled = <T extends object>(x: T) => (hit ? { ...x, title: hit.title } : x);
  // 音频永远用音频封面,但标题照样贴题
  if (mode === "audio") return titled({ cover: RESULTS.audio.cover });
  const base = hit ? { cover: hit.cover, video: hit.video } : RESULTS[mode];
  if (mode === "image" || !base.video) return titled({ cover: base.cover });
  return titled({ cover: base.cover, video: base.video });
}

/** 方案文案 + 三个分镜 beat:Agent 模式按提示词关键词挑同一组的分镜,没命中或非 Agent 用该模式的通用方案 */
export function planFor(mode: Mode, text: string): Plan {
  if (mode !== "agent") return PLANS[mode];
  return RESULT_RULES.find((r) => r.re.test(text))?.plan ?? PLANS.agent;
}

export const SEED_SESSIONS: Session[] = [
  { id: "s-latte", title: "Summer latte promo", updatedAt: 3, pinned: false, workspace: "personal" },
  { id: "s-serum", title: "Glow serum launch", updatedAt: 2, pinned: false, workspace: "personal" },
  { id: "s-opening", title: "Causeway Bay opening", updatedAt: 1, pinned: false, workspace: "presslogic" },
];

export const SEED_JOBS: Job[] = [
  { id: "j-latte", title: "Summer latte promo", prompt: "Make a 15s vertical ad for our new iced latte using these photos", mode: "agent", model: null, status: "done", elapsedMs: 8000, cover: RESULTS.agent.cover, video: RESULTS.agent.video, workspace: "personal", sessionId: "s-latte" },
  { id: "j-serum", title: "Glow serum launch", prompt: "A glass serum bottle on wet stone, slow orbit, soft peach light", mode: "video", model: "seedance-2", status: "failed", elapsedMs: 3000, cover: RESULTS.video.cover, video: RESULTS.video.video, workspace: "personal", sessionId: "s-serum" },
  { id: "j-opening", title: "Causeway Bay opening", prompt: "Three posters for our Causeway Bay shop opening", mode: "image", model: "seedream-5", status: "done", elapsedMs: 8000, cover: RESULTS.image.cover, workspace: "presslogic", sessionId: "s-opening" },
];

export const SEED_MESSAGES: Record<string, Message[]> = {
  "s-latte": [
    { id: "s-latte-u", role: "user", text: "Make a 15s vertical ad for our new iced latte using these photos", attachments: [{ id: "s-latte-a1", uri: `${A}/photo-2.jpg`, kind: "photo" }, { id: "s-latte-a2", uri: `${A}/photo-3.jpg`, kind: "video" }] },
    { id: "s-latte-p", role: "agent", kind: "plan", ...planFor("agent", "iced latte") },
    { id: "s-latte-j", role: "agent", kind: "job", jobId: "j-latte" },
  ],
  "s-serum": [
    { id: "s-serum-u", role: "user", text: "A glass serum bottle on wet stone, slow orbit, soft peach light", attachments: [] },
    { id: "s-serum-p", role: "agent", kind: "plan", text: PLANS.video.text, pills: PLANS.video.pills },
    { id: "s-serum-j", role: "agent", kind: "job", jobId: "j-serum" },
  ],
  "s-opening": [
    { id: "s-opening-u", role: "user", text: "Three posters for our Causeway Bay shop opening", attachments: [] },
    { id: "s-opening-p", role: "agent", kind: "plan", text: PLANS.image.text, pills: PLANS.image.pills },
    { id: "s-opening-j", role: "agent", kind: "job", jobId: "j-opening" },
  ],
};
