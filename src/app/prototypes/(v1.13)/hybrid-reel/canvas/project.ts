/* 画布 / 剪辑器的数据层。
   画布上每个素材是一个节点(图片 / 视频 / AI 补拍 / AI 配乐),全部连进一个剪辑器节点;
   剪辑器里是单条视频轨 + 字幕轨 + 音乐轨,一条 clip 引用一个素材节点的某一段。 */

import type { Handoff, Role, Segment as FootageSegment } from "../agent/chat/types";
import { VOICES, VOICE_COST } from "@/lib/hybrid-reel/voices";

export type AssetStatus = "ready" | "idle" | "generating";

export type Asset = {
  id: string;
  kind: "video" | "image" | "audio";
  origin: "upload" | "ai";
  label: string;
  url?: string;
  /** 素材本身的长度;图片没有长度,按可停留的上限算 */
  durationSec: number;
  /** 宽 / 高 */
  aspect: number;
  prompt?: string;
  /** AI 补拍镜头的一句话描述(分镜表里那句),没生成前显示在时间线片段上 */
  summary?: string;
  /** Audio Generator(AI 配音)的音色预设 id */
  voiceId?: string;
  /** 上一次生成失败的原因(显示在 Settings 里) */
  error?: string;
  /** 正在跑的 Seedance 任务:刷新页面后按这个 id 接着查结果,不重新建任务(否则会再扣一次钱) */
  taskId?: string;
  /** 任务开始的时间(ms),估进度和判断超时用 */
  taskStartedAt?: number;
  status: AssetStatus;
  progress?: number;
  role?: Role;
  hasVoice?: boolean;
  /** 已生成过几次,重生时换一条结果 */
  takes?: number;
  /* ── 生成节点的设置(点节点时右侧 Settings 面板里的参数) ── */
  /** 参考图(Input Source),比如封面节点带入的那一帧 */
  refSrc?: string;
  /** 视频生成节点的参考素材(上传素材的 id)。从 Agent 带过来时 = 执行计划里这一镜的参考;
      右键「AI generate」建的只有那一段。不填按默认(前 3 个上传素材) */
  refIds?: string[];
  /** 上传视频的场记(Agent 分析出的片段:哪几段能用、能当什么镜头);画布上显示在节点下方,Media 里推荐没用上的好片段 */
  segments?: FootageSegment[];
  /** 视频参考取哪一秒的画面当参考图(按参考素材 id) */
  refAt?: Record<string, number>;
  model?: string;
  genAspect?: AspectId;
  /** 图片:Low / Medium / High;视频:480p / 720p / 1080p */
  resolution?: string;
  /** 视频节点:生成时是否带声音 */
  withAudio?: boolean;
  background?: "Auto" | "Transparent" | "Opaque";
  /** 这个节点生成一次扣多少 credits */
  cost?: number;
  /** 由封面「Design with AI」创建的节点 */
  /** cover = AI 封面;voice = 用户上传的配音文件(放在音频轨上) */
  purpose?: "cover" | "voice";
  x: number;
  y: number;
};

export type Clip = {
  id: string;
  /** null = 这一镜既没有素材也不生成(blocked),时间线上留空位等用户补 */
  assetId: string | null;
  role: Role;
  inSec: number;
  outSec: number;
  speed: number;
  /** 关掉这一段的原声 */
  muted: boolean;
  /** 这一段原声的音量 0–100,不填 = 100 */
  volume?: number;
  subtitle: string;
  subtitleSource: "stt" | "authored";
  /** 方案里给这一镜设计好的台词:不直接当字幕(字幕只来自语音识别),加配音时拼成配音文案 */
  line?: string;
  /** 字幕在这一段里的起止(相对片段开头,单位是时间线秒);不填 = 整段都显示 */
  subIn?: number;
  subOut?: number;
  /* ── 画面处理:素材宽高比和成片不一样时 ── */
  /** auto = 按比例差自动选;fill = 填满裁切;fit = 完整显示 */
  framing?: Framing;
  /** fit 时空出来的地方铺什么 */
  fitBg?: FitBg;
  /** fill 时保留画面的哪一部分(0–1,0.5 = 居中) */
  panX?: number;
  panY?: number;
  note?: string;
};

export type Framing = "auto" | "fill" | "fit";
export type FitBg = "blur" | "black" | "white";

/** 比例差超过这个倍数就自动改成完整显示(比如横屏素材进竖屏成片) */
const FIT_THRESHOLD = 1.25;

/** 这一段实际用 fill 还是 fit:手动选了就按手动,否则按素材和成片的比例差判断 */
export function resolveFraming(clip: Clip, asset: Asset | undefined, aspect: AspectId): "fill" | "fit" {
  if (clip.framing === "fill" || clip.framing === "fit") return clip.framing;
  if (!asset || asset.kind === "audio") return "fill";
  const target = ASPECTS[aspect];
  const ratio = Math.max(asset.aspect, target) / Math.min(asset.aspect, target);
  return ratio > FIT_THRESHOLD ? "fit" : "fill";
}

export type AspectId = "9:16" | "1:1" | "16:9";

/** 视频封面:时间线上的一帧 / 画布上的图片节点(含 AI 生成的封面) / 资产库里的图 */
export type CoverRef =
  | { kind: "frame"; src: string; t: number }
  | { kind: "asset"; assetId: string }
  | { kind: "library"; src: string; label: string };

export type Project = {
  v: 1;
  assets: Asset[];
  clips: Clip[];
  /** 字幕预设 id(见 subtitles.tsx);旧工程是 1 / 2 / 3 */
  subtitleStyle: string | number;
  /** 字幕在画面里的位置(字幕块中心,占画框宽高的比例);不填 = 底部居中。在预览里拖动,对全部字幕生效 */
  subtitlePos?: { x: number; y: number };
  musicId: string | null;
  /** 背景音乐在成片里从哪一秒放到哪一秒(在音乐轨上拖两头 trim);不填 = 从头放到尾。曲子和成片同步走,掐头就是开头那几秒不放 */
  musicIn?: number;
  musicOut?: number;
  /** 音乐块整段拖动过多少秒(往后为正):曲子的开头跟着挪。trim 不改它 */
  musicShift?: number;
  /** 0–100 */
  musicVol: number;
  voiceVol: number;
  /** 视频轨原声总开关 */
  originalOn: boolean;
  aspect: AspectId;
  /** 用户拖过节点之后就不再自动排版 */
  autoLayout: boolean;
  editor: { x: number; y: number };
  bgmPrompt: string;
  creditsPerShot: number;
  spentCredits: number;
  cover?: CoverRef;
  /** 加在时间线上的音效(播放到那一刻响) */
  sfx?: SfxCue[];
  /** 音频轨:用户的配音文件,可以放在时间线任意位置 */
  voice?: VoiceClip[];
  /** 上次自动生成字幕时,按镜头分段的配音是哪一版(voiceKey);和现在对不上 = 配音改过了,字幕可能过时 */
  subsVoiceKey?: string;
};

export const ASPECTS: Record<AspectId, number> = { "9:16": 9 / 16, "1:1": 1, "16:9": 16 / 9 };

export const IMAGE_HOLD_MAX = 10;

/** 资产库(Assets)里已有的图,原型用几张站内图代替 */
export const LIBRARY_IMAGES = [
  { label: "Product hero", src: "https://assets.presslogic.com/buzzvideo/public/2026-07-30/341142771702226944.png" },
  { label: "Lifestyle", src: "https://assets.presslogic.com/buzzvideo/public/2026-07-22/338150973748862976.png" },
  { label: "Studio", src: "https://assets.presslogic.com/buzzvideo/public/2026-07-29/340764226748473344.png" },
  { label: "Campaign", src: "https://assets.presslogic.com/buzzvideo/public/2026-07-03/331328468790861824.png" },
];

/** 资产库里已有的视频(用户以前上传或生成过的),原型用几条站内的 Seedance 成片代替 */
export const LIBRARY_VIDEOS = [
  { label: "Serum texture close-up", src: "https://assets.presslogic.com/aigc/tasks/videos/5aa41036-7a0b-479b-aa81-687043ee33df/2026-08-13/51b6568d-3e79-467c-9127-7681bb1e1099.mp4" },
  { label: "Product on vanity", src: "https://assets.presslogic.com/aigc/tasks/videos/5aa41036-7a0b-479b-aa81-687043ee33df/2026-09-16/a662fa70-6c59-491a-9a2d-12d112f1b157.mp4" },
  { label: "Skincare routine", src: "https://assets.presslogic.com/aigc/tasks/videos/5aa41036-7a0b-479b-aa81-687043ee33df/2026-09-17/6be48a5d-d159-4e41-a500-7a57144b363c.mp4" },
];

export const IMAGE_MODELS = ["GPT Image 2.5 Sunburst", "Seedream 4.0", "Nano Banana Pro"];
export const VIDEO_MODELS = ["Seedance 2.0", "Seedance 2.0 Fast", "Seedance 2.5", "Veo 3"];
export const IMAGE_COST = 3;

export const COVER_PROMPT =
  "Use the selected frame as reference and design a scroll-stopping, viral-style video cover. Landscape 16:9. All text on the cover must be in English.";
export const MIN_CLIP = 0.3;

/* 原型里不真调 Seedance(一条几分钟、要扣费),生成结果从这几条已有的 Seedance 成片里轮换 */
export const MOCK_AI_RESULTS = [
  "https://assets.presslogic.com/aigc/tasks/videos/5aa41036-7a0b-479b-aa81-687043ee33df/2026-08-13/51b6568d-3e79-467c-9127-7681bb1e1099.mp4",
  "https://assets.presslogic.com/aigc/tasks/videos/5aa41036-7a0b-479b-aa81-687043ee33df/2026-09-16/a662fa70-6c59-491a-9a2d-12d112f1b157.mp4",
  "https://assets.presslogic.com/aigc/tasks/videos/5aa41036-7a0b-479b-aa81-687043ee33df/2026-09-17/6be48a5d-d159-4e41-a500-7a57144b363c.mp4",
];

/* 免版税曲库;原型只有一条示例音频,几首共用它 */
export const DEMO_MUSIC_URL = "/prototypes/asset-library/audio/audio-01.mp3";
const DEMO_AUDIO = DEMO_MUSIC_URL;
export type MusicCategory = "tiktok" | "promo" | "beat" | "marketing" | "upbeat" | "energetic" | "cute" | "emotional";

export const MUSIC_CATEGORIES: { id: MusicCategory; name: string; color: string }[] = [
  { id: "tiktok", name: "TikTok", color: "#1a1a2e" },
  { id: "promo", name: "Promo", color: "#3b4a5a" },
  { id: "beat", name: "Beat sync", color: "#6d3fd6" },
  { id: "marketing", name: "Marketing", color: "#2f6fb0" },
  { id: "upbeat", name: "Upbeat", color: "#1f9d6b" },
  { id: "energetic", name: "Energetic", color: "#d0342c" },
  { id: "cute", name: "Cute", color: "#e0719a" },
  { id: "emotional", name: "Emotional", color: "#4a5a78" },
];

/* 免版税曲库;原型只有一条示例音频,几首共用它 */
export const MUSIC_LIBRARY: {
  id: string;
  name: string;
  artist: string;
  durationSec: number;
  categories: MusicCategory[];
  color: string;
  mood: string;
  url: string;
}[] = [
  { id: "m-bright", name: "Morning Dew", artist: "Lumen Audio", durationSec: 17, categories: ["upbeat", "marketing"], color: "#ffb347", mood: "Bright · 118 BPM", url: DEMO_AUDIO },
  { id: "m-calm", name: "Soft Focus", artist: "Kiri Beats", durationSec: 26, categories: ["emotional", "promo"], color: "#8aa4b8", mood: "Calm · 92 BPM", url: DEMO_AUDIO },
  { id: "m-pop", name: "Glow Up", artist: "Neon Parade", durationSec: 30, categories: ["tiktok", "upbeat"], color: "#ff5e1a", mood: "Upbeat · 124 BPM", url: DEMO_AUDIO },
  { id: "m-drop", name: "Drop Zone", artist: "Pulse Co.", durationSec: 22, categories: ["beat", "energetic"], color: "#6d3fd6", mood: "Beat drop · 128 BPM", url: DEMO_AUDIO },
  { id: "m-launch", name: "Launch Day", artist: "Northbound", durationSec: 45, categories: ["promo", "marketing"], color: "#2f6fb0", mood: "Cinematic · 100 BPM", url: DEMO_AUDIO },
  { id: "m-bubble", name: "Bubble Tea", artist: "Mochi Mochi", durationSec: 19, categories: ["cute", "tiktok"], color: "#e0719a", mood: "Playful · 110 BPM", url: DEMO_AUDIO },
  { id: "m-rush", name: "Rush Hour", artist: "Voltline", durationSec: 28, categories: ["energetic", "beat"], color: "#d0342c", mood: "Energetic · 140 BPM", url: DEMO_AUDIO },
  { id: "m-home", name: "Coming Home", artist: "Paper Lantern", durationSec: 34, categories: ["emotional"], color: "#4a5a78", mood: "Warm · 84 BPM", url: DEMO_AUDIO },
];

/** 音效:原型用 Web Audio 现场合成,不需要音频文件 */
export type SfxKind = "whoosh" | "pop" | "ding" | "click" | "shutter" | "riser" | "boom" | "sparkle";
export const SFX_LIBRARY: { id: SfxKind; name: string; group: "Transitions" | "UI" | "Impact"; durationSec: number }[] = [
  { id: "whoosh", name: "Whoosh", group: "Transitions", durationSec: 0.6 },
  { id: "riser", name: "Riser", group: "Transitions", durationSec: 1.2 },
  { id: "pop", name: "Pop", group: "UI", durationSec: 0.2 },
  { id: "click", name: "Click", group: "UI", durationSec: 0.1 },
  { id: "ding", name: "Ding", group: "UI", durationSec: 0.9 },
  { id: "sparkle", name: "Sparkle", group: "UI", durationSec: 0.8 },
  { id: "shutter", name: "Camera shutter", group: "Impact", durationSec: 0.3 },
  { id: "boom", name: "Boom", group: "Impact", durationSec: 1 },
];

/** 音效:库里的(kind,现场合成)或用户上传的(url + name + len) */
/** 音效:at 秒响;len 是在轨道上放多长(不写就是整段),offset 是掐掉的开头(秒)—— 在轨道上拖两头 trim 时改这两个;srcLen 是音效本来多长 */
export type SfxCue = { id: string; kind: SfxKind; at: number; url?: string; name?: string; len?: number; offset?: number; srcLen?: number };
/** 音频轨上的一段配音:从成片的 at 秒开始,放 len 秒(从文件开头算)。
    按镜头分段的配音(从方案带过来的台词)还带着 clipId / text / url:
    - clipId:跟着哪个镜头走 —— 起点永远对齐这个镜头的开头,镜头挪了、前面剪短了,配音跟着挪;在轨道上手动拖过就不再跟
    - text:这一句的文案;url:这一句生成好的音频(每句单独生成)
    在轨道上拖两头 trim:offset = 掐掉的开头(秒),len 跟着变短;srcLen 记下音频本来多长,往回拖不超过它。重新生成会清掉这两个 */
export type VoiceClip = {
  id: string;
  assetId: string;
  at: number;
  len: number;
  clipId?: string;
  text?: string;
  url?: string;
  offset?: number;
  srcLen?: number;
};

/** 配音段的实际起点:跟着镜头走的取镜头在时间线上的开头 */
export function voiceAt(v: VoiceClip, segs: Segment[]): number {
  if (!v.clipId) return v.at;
  /* 掐了开头的,起点跟着往后挪同样的秒数,还是对得上原来那一句的位置 */
  const shot = segs.find((s) => s.clip.id === v.clipId);
  return shot ? shot.start + (v.offset ?? 0) : v.at;
}

/** 按镜头分段的配音「现在是哪一版」:每句跟着哪个镜头 + 用的哪条音频。重新生成、改文案、删句都会变 */
export const voiceKey = (p: Project) =>
  (p.voice ?? [])
    .filter((v) => v.clipId)
    .map((v) => `${v.clipId}:${v.url ?? ""}`)
    .sort()
    .join("|");

/** 这个 Audio Generator 是不是按镜头分段的 */
export const isSegmentedVoice = (p: Project, assetId: string) => (p.voice ?? []).some((v) => v.assetId === assetId && v.text !== undefined);

/** 按镜头分段配音:每个有台词的镜头一段,起点对齐镜头开头,先按镜头长度占位,生成后换成真实长度。
    原声镜头(本来就有人在说话)没有台词,不配 */
export function voiceSegments(p: Project, assetId: string): VoiceClip[] {
  const { segs } = layoutClips(p.clips);
  return segs
    .filter((s) => s.clip.line?.trim())
    .map((s) => ({ id: newId("vc"), assetId, at: s.start, len: s.len, clipId: s.clip.id, text: s.clip.line!.trim() }));
}

/** 一句配音一个 Audio Generator 节点(和一个 AI 镜头一个 Video Generator 一样):节点里就是这一句的文案、音频 */
function lineAsset(id: string, v: VoiceClip, voiceId: string, cost: number, extra: Partial<Asset> = {}): Asset {
  return {
    id,
    kind: "audio",
    origin: "ai",
    purpose: "voice",
    label: "Audio Generator",
    prompt: v.text ?? "",
    voiceId,
    cost,
    durationSec: v.len,
    aspect: 1,
    status: v.url ? "ready" : "idle",
    url: v.url,
    takes: v.url ? 1 : 0,
    x: 0,
    y: 0,
    ...extra,
  };
}

/** 按镜头分段加配音:每个有台词的镜头一句、一个节点(还没生成,不扣费);没有任何台词就原样返回 */
export function withVoiceover(p: Project, voiceId: string, cost: number): Project {
  const voice = voiceSegments(p, "").map((v) => ({ ...v, assetId: newId("vo") }));
  if (!voice.length) return p;
  return {
    ...p,
    assets: [...p.assets, ...voice.map((v) => lineAsset(v.assetId, v, voiceId, cost))],
    voice: [...(p.voice ?? []), ...voice],
  };
}

/** 旧工程:一个节点里装着好几句的,拆成一句一个节点;音色、状态沿用原来那个节点 */
export function splitVoiceLines(p: Project): Project {
  const multi = p.assets.filter((a) => a.purpose === "voice" && (p.voice ?? []).filter((v) => v.assetId === a.id && v.text !== undefined).length > 1);
  if (!multi.length) return p;
  const ids = new Set(multi.map((a) => a.id));
  const born: Asset[] = [];
  const voice = (p.voice ?? []).map((v) => {
    if (!ids.has(v.assetId) || v.text === undefined) return v;
    const src = multi.find((a) => a.id === v.assetId)!;
    const id = newId("vo");
    /* 没开自动排版的工程:从原节点的位置往下一个个排开 */
    const k = born.filter((b) => b.x === src.x).length;
    const probe = lineAsset(id, v, src.voiceId ?? "", VOICE_COST, { error: src.error });
    born.push({ ...probe, x: src.x, y: src.y + k * (nodeSize(probe).h + LABEL_H + 28) });
    return { ...v, assetId: id };
  });
  return { ...p, assets: [...p.assets.filter((a) => !ids.has(a.id)), ...born], voice };
}

export const clipLen = (c: Clip) => Math.max(0.1, (c.outSec - c.inSec) / c.speed);

export type Segment = { clip: Clip; index: number; start: number; len: number };

export const MIN_SUB = 0.3;

/** 字幕在片段里实际显示的区间;片段被剪短时自动收进片段范围 */
export function subSpan(clip: Clip, len: number): { from: number; to: number } {
  const to = Math.min(clip.subOut ?? len, len);
  const from = Math.min(Math.max(0, clip.subIn ?? 0), Math.max(0, to - MIN_SUB));
  return { from, to };
}

export function layoutClips(clips: Clip[]): { segs: Segment[]; total: number } {
  let t = 0;
  const segs = clips.map((clip, index) => {
    const len = clipLen(clip);
    const seg = { clip, index, start: t, len };
    t += len;
    return seg;
  });
  return { segs, total: t };
}

export function segmentAt(segs: Segment[], t: number): Segment | undefined {
  return segs.find((s) => t >= s.start && t < s.start + s.len) ?? segs[segs.length - 1];
}

export const fmt = (sec: number) => {
  const s = Math.max(0, Math.floor(sec));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

let uid = 0;
export const newId = (p: string) => `${p}-${Date.now().toString(36)}-${(uid += 1)}`;

function aspectFor(platform: string): AspectId {
  return /youtube(?!.*short)|16:9|landscape/i.test(platform) ? "16:9" : "9:16";
}

/** 从 agent 带过来的分镜建出第一版工程 */
export function buildProject(h: Handoff): Project {
  const aspect = aspectFor(h.brief.platform ?? "");
  const uploads: Asset[] = h.profiles.map((p, i) => {
    const usedOut = Math.max(
      0,
      ...h.outline.shots.map((s) => (s.source.kind === "clip" && s.source.clipIndex === i ? s.source.outSec : 0)),
    );
    return {
      id: `up-${i}`,
      kind: p.kind === "image" ? "image" : "video",
      origin: "upload",
      label: p.label,
      url: p.objectUrl,
      durationSec: p.kind === "image" ? IMAGE_HOLD_MAX : Math.max(p.durationSec ?? 0, usedOut, 3),
      aspect: p.kind === "image" ? 1 : 9 / 16,
      status: "ready",
      hasVoice: p.hasVoice,
      segments: p.kind === "video" ? p.segments : undefined,
      x: 0,
      y: 0,
    };
  });

  const assets: Asset[] = [...uploads];
  const clips: Clip[] = h.outline.shots.map((s, i) => {
    /* 字幕一开始是空的:字幕只来自语音识别(字幕轨上的 Auto-generate subtitles),不带分镜里写的台词 */
    const base = {
      id: `c-${i}`,
      role: s.role,
      speed: 1,
      muted: false,
      subtitle: "",
      subtitleSource: "stt",
      /* 原声段本来就有人在说话,不再配一遍 */
      line: s.subtitle?.source !== "stt" ? s.subtitle?.text || undefined : undefined,
    } as const;
    if (s.source.kind === "clip") {
      const a = uploads[s.source.clipIndex] ?? uploads[0];
      const inSec = a.kind === "image" ? 0 : Math.max(0, s.source.inSec);
      const outSec = a.kind === "image" ? s.durationSec : Math.max(inSec + MIN_CLIP, s.source.outSec);
      return { ...base, assetId: a?.id ?? null, inSec, outSec };
    }
    if (s.source.kind === "generate") {
      const ai: Asset = {
        id: `ai-${i}`,
        kind: "video",
        origin: "ai",
        label: `AI shot ${assets.filter((x) => x.origin === "ai").length + 1}`,
        durationSec: s.durationSec,
        aspect: ASPECTS[aspect],
        prompt: s.source.prompt,
        summary: s.source.summary,
        /* 和执行计划里这一镜的参考缩略图一致:分镜给了就用分镜挑的(不含带人脸的),没给按前 3 个 */
        refIds: s.source.refs?.length
          ? s.source.refs.map((r) => uploads[r.clipIndex]?.id).filter((x): x is string => !!x)
          : uploads.filter((u) => u.url).slice(0, 3).map((u) => u.id),
        refAt: Object.fromEntries((s.source.refs ?? []).filter((r) => uploads[r.clipIndex]).map((r) => [uploads[r.clipIndex].id, r.atSec ?? 0])),
        status: "idle",
        role: s.role,
        takes: 0,
        x: 0,
        y: 0,
      };
      assets.push(ai);
      return { ...base, assetId: ai.id, inSec: 0, outSec: s.durationSec };
    }
    return { ...base, assetId: null, inSec: 0, outSec: s.durationSec, note: s.source.suggestion || s.source.reason };
  });

  const project: Project = {
    v: 1,
    assets,
    clips,
    subtitleStyle: "none",
    musicId: null,
    musicVol: 35,
    voiceVol: 100,
    originalOn: true,
    aspect,
    autoLayout: true,
    editor: { x: 0, y: 0 },
    bgmPrompt: h.outline.bgmPrompt ?? "",
    creditsPerShot: h.outline.credits?.perGenerateShot ?? 50,
    spentCredits: 0,
  };
  /* 方案里写好的台词,进画布就按镜头配成一段段配音(先不生成、不扣费),用户直接点生成就行 */
  return arrange(withVoiceover(project, VOICES[0].id, VOICE_COST));
}

/* ── 节点尺寸与自动排版 ── */
export const LABEL_H = 26;
export const EDITOR_W = 980;

/** 视频生成节点实际用到的参考素材,和执行计划里的参考缩略图一致(默认前 3 个上传素材) */
export function aiRefs(p: Project, a: Asset): Asset[] {
  if (a.origin !== "ai" || a.kind !== "video") return [];
  const uploads = p.assets.filter((x) => x.origin === "upload" && x.kind !== "audio" && x.url);
  if (a.refIds) return a.refIds.map((id) => uploads.find((x) => x.id === id)).filter((x): x is Asset => !!x);
  return uploads.slice(0, 3);
}

export function nodeSize(a: Asset): { w: number; h: number } {
  if (a.kind === "audio") return { w: 240, h: 132 };
  /* AI 图片节点(Image Generator)按生成比例排,横屏封面给宽一点 */
  if (a.origin === "ai" && a.kind === "image") {
    const w = a.aspect > 1 ? 300 : 220;
    return { w, h: Math.round(w / a.aspect) };
  }
  const w = a.aspect < 1 ? 160 : a.aspect === 1 ? 200 : 260;
  return { w, h: Math.round(w / a.aspect) };
}

/** 按时间线顺序排(先出现的在上);没用到的素材和配乐节点排在最后。
   有 AI 生成节点引用素材时排成三栏:素材 → 生成节点 → 剪辑器。每个素材只出现一次,
   它连到引用它的生成节点,也连到剪辑器;没有参考关系时还是一列 */
export function arrange(p: Project): Project {
  if (!p.autoLayout) return p;
  const GAP = 28;
  const COL_GAP = 120;
  const order = new Map<string, number>();
  p.clips.forEach((c, i) => {
    if (c.assetId && !order.has(c.assetId)) order.set(c.assetId, i);
  });
  /* 每句配音的节点排在它那个镜头后面,画布上从上往下读就是成片的顺序 */
  for (const v of p.voice ?? []) {
    const i = v.clipId ? p.clips.findIndex((c) => c.id === v.clipId) : -1;
    if (i >= 0 && !order.has(v.assetId)) order.set(v.assetId, i + 0.5);
  }
  const byTimeline = (list: Asset[]) =>
    [...list].sort(
      (x, y) => (order.get(x.id) ?? 1000 + p.assets.indexOf(x)) - (order.get(y.id) ?? 1000 + p.assets.indexOf(y)),
    );
  const refIds = new Set(p.assets.flatMap((a) => aiRefs(p, a).map((r) => r.id)));
  const sources = byTimeline(p.assets.filter((a) => refIds.has(a.id)));
  const rest = byTimeline(p.assets.filter((a) => !refIds.has(a.id)));
  const cols = sources.length ? [sources, rest] : [rest];

  const colH = (list: Asset[]) => list.reduce((n, a) => n + nodeSize(a).h + LABEL_H + GAP, -GAP);
  const tallest = Math.max(...cols.map(colH));
  const pos = new Map<string, { x: number; y: number }>();
  let x = 0;
  cols.forEach((list) => {
    const w = Math.max(200, ...list.map((a) => nodeSize(a).w));
    /* 每栏和最高的那栏垂直居中 */
    let y = (tallest - colH(list)) / 2;
    list.forEach((a) => {
      pos.set(a.id, { x: x + (w - nodeSize(a).w) / 2, y });
      y += nodeSize(a).h + LABEL_H + GAP;
    });
    x += w + COL_GAP;
  });
  return {
    ...p,
    assets: p.assets.map((a) => ({ ...a, ...(pos.get(a.id) ?? {}) })),
    editor: { x: x - COL_GAP + 180, y: Math.max(0, tallest / 2 - 280) },
  };
}

/** 素材里被时间线用到的区间(源素材时间),合并重叠 */
export function usedRanges(p: Project, assetId: string): [number, number][] {
  const r = p.clips
    .filter((c) => c.assetId === assetId)
    .map((c) => [c.inSec, c.outSec] as [number, number])
    .sort((a, b) => a[0] - b[0]);
  const out: [number, number][] = [];
  for (const x of r) {
    const last = out[out.length - 1];
    if (last && x[0] <= last[1]) last[1] = Math.max(last[1], x[1]);
    else out.push([...x]);
  }
  return out;
}

/** 能用、但时间线上还没用到(被用到的部分不到一半)的片段 —— Media 面板里当「推荐片段」 */
export function unusedTakes(p: Project): { asset: Asset; seg: FootageSegment }[] {
  const out: { asset: Asset; seg: FootageSegment }[] = [];
  for (const a of p.assets) {
    if (a.kind !== "video" || !a.segments?.length) continue;
    const used = usedRanges(p, a.id);
    for (const seg of a.segments) {
      if (!seg.usable) continue;
      const overlap = used.reduce((n, [s, e]) => n + Math.max(0, Math.min(e, seg.end) - Math.max(s, seg.start)), 0);
      if (overlap < (seg.end - seg.start) / 2) out.push({ asset: a, seg });
    }
  }
  return out;
}
