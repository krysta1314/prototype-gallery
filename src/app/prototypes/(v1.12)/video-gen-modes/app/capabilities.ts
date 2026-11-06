// 视频模型 → 输入模式能力表。唯一数据源:底栏下拉、素材位、校验、测试都读它。
// 数值来自各模型官方 API(Notion「视频模型输入模式对照(v1.12)」第三节,2026-11-03 逐字段复核)。
// modes 的第一个是该模型的默认模式;不放任何素材 = 文生视频，不单独算一种模式。

import { TOOL_HINT, TOOL_LABEL, type ToolModeKey } from "./tools";

export type BaseModeKey = "omni" | "frames" | "keyframes" | "edit" | "extend";
/** 基础模式 + 生成类专项模式(运镜、风格，定义在 tools.ts)。
    加工类(Motion Control、Lip Sync、Talking Avatar、Reframe、Relight、Recast、3D to Video)2026-11-05 拆成独立工具页(ai-tools/app/model-tools) */
export type ModeKey = BaseModeKey | ToolModeKey;
export type ModelKey =
  | "kling-4.0"
  | "wan-3.0"
  | "omni-flash-1.2"
  | "omni-flash"
  | "h3-max"
  | "h3"
  | "seedance-2.5"
  | "seedance-2.0-mini"
  | "seedance-2.0-fast"
  | "seedance-2.0"
  | "kling-3.0"
  | "kling-3.0-omni"
  | "wan-3.0-prime"
  | "h3-max-turbo"
  | "vidu-q3"
  | "grok-1.5"
  | "flux-3-video"
  | "flux-3-max-video";

export type Limits = {
  images: number;
  videos: number;
  audios: number;
  /** 图 + 视频 + 音频合计上限(MiniMax 是 12) */
  total?: number;
  /** 参考视频合计秒数 */
  videoSecs?: number;
  /** 参考音频合计秒数 */
  audioSecs?: number;
  /** 单段参考视频最长秒数(Omni Flash 是 3s) */
  maxVideoClipSecs?: number;
  /** 成片超过 secs 秒时参考视频最多 max 段(Gemini Omni 1.2 Flash:11–15s 只能 1 段) */
  videosWhenLong?: { secs: number; max: number };
  /** 能否只放音频 */
  audioOnly: boolean;
  /** Kling:角色 / 物体主体 */
  elements?: number;
  /** Kling:音色(voice_id) */
  voices?: number;
  /** Wan 3.0:可以贴一个公开网页链接或传一份文档(file_url / web_url,自动开 enable_thinking) */
  webSource?: boolean;
  /** 参考生必须写提示词(Vidu Q3) */
  promptRequired?: boolean;
  /** 这个模式自己的分辨率(Grok 1.5 参考生只有 480p / 720p) */
  resolutions?: string[];
};

export type ModelCaps = {
  key: ModelKey;
  label: string;
  vendor: string;
  /** 厂商 logo;没有就显示首字母 */
  icon?: string;
  modes: ModeKey[];
  durations: { min: number; max: number; step: 0.5 | 1 | 2; default: number };
  ratios: string[];
  resolutions: string[];
  omni?: Limits;
  frames?: { startRequired: boolean; /** 放了尾帧时成片最长秒数(Gemini Omni 1.2 Flash 首尾帧只支持 3–10s) */ endMaxSecs?: number; elements?: boolean; maxElements?: number; elementImages?: [number, number]; soundtrack?: boolean; /** 只有首帧，没有尾帧(Grok 1.5) */ noEnd?: boolean; /** 放了尾帧时不能用的分辨率(Vidu:带尾帧不能 360p) */ endBlocksRes?: string[]; /** 放了首帧(或尾帧)后比例跟随画面，API 不收比例(Vidu / Grok / Kling / MiniMax 图生;Seedance 2.5 只能 adaptive) */ ratioFromFrame?: boolean };
  keyframes?: { maxMiddle: number; timed: boolean; references?: number; resolutions?: string[] };
  edit?: { sourceMin: number; sourceMax: number; references: boolean; /** 编辑上传的视频在英国 / 欧洲经济区 / 瑞士不可用(Gemini Omni Flash) */ ukUploadBlocked?: boolean };
  extend?: { sourceMax: number; maxAdded?: number; direction: boolean; ukUploadBlocked?: boolean; /** 延长自己的分辨率(H3 Max 延长可到 2K) */ resolutions?: string[] };
  multiShot?: { shotMin: number; shotMax: number; totalMin: number; totalMax: number; smart: boolean; maxShots?: number; firstFrameOnly?: boolean };
  /** 「With Audio」开关(API 有生成音频的布尔参数) */
  audioToggle?: boolean;
};

export const MODE_LABEL: Record<ModeKey, string> = {
  omni: "Omni Reference",
  frames: "First & Last Frame",
  keyframes: "Keyframes",
  edit: "Edit Video",
  extend: "Extend Video",
  ...TOOL_LABEL,
};

/** 模式下拉里每项的一句话说明 */
export const MODE_HINT: Record<ModeKey, string> = {
  omni: "Mix images, videos and audio as references",
  frames: "Set the first frame, the last frame, or both",
  keyframes: "Pin frames along the way between start and end",
  edit: "Change what's in an existing video",
  extend: "Keep a video going from where it ends",
  ...TOOL_HINT,
};

const ICON = "/prototypes/starter-guide/icons";
const LOGO = "/prototypes/video-gen-modes/icons";
const ALL_RATIOS = ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"];

export const MODELS: ModelCaps[] = [
  seedance("seedance-2.5", "Seedance 2.5", { min: 4, max: 30 }, ["480p", "720p", "1080p"], {
    /* 2.5 图生(首帧 / 首尾帧)比例只能 adaptive,跟随首帧;2.0 系列可以指定 */
    frames: { startRequired: true, ratioFromFrame: true },
    omni: { images: 30, videos: 10, audios: 10, videoSecs: 30, audioSecs: 30, audioOnly: true },
    edit: { sourceMin: 4, sourceMax: 30, references: true },
    extend: { sourceMax: 30, direction: true },
  }),
  seedance("seedance-2.0-mini", "Seedance 2.0 Mini", { min: 4, max: 15 }, ["480p", "720p"]),
  seedance("seedance-2.0-fast", "Seedance 2.0 Fast", { min: 4, max: 15 }, ["480p", "720p"]),
  seedance("seedance-2.0", "Seedance 2.0", { min: 4, max: 15 }, ["480p", "720p", "1080p", "4K"]),
  {
    key: "kling-4.0",
    label: "Kling 4.0",
    vendor: "fal",
    icon: `${ICON}/kling-color.svg`,
    /* 对口型、数字人走 Kling 的独立模型(Kling LipSync / Kling AI Avatar v2 Pro),不算 Kling 4.0 的模式 */
    modes: ["omni", "frames", "keyframes", "edit"],
    durations: { min: 3, max: 30, step: 1, default: 5 },
    ratios: ["16:9", "9:16", "1:1", "21:9"],
    resolutions: ["720p", "1080p"],
    omni: { images: 10, videos: 5, audios: 0, videoSecs: 30, audioOnly: false, elements: 7, voices: 3 },
    frames: { startRequired: false, ratioFromFrame: true },
    keyframes: { maxMiddle: 8, timed: false, references: 10 },
    edit: { sourceMin: 3, sourceMax: 30, references: true },
    multiShot: { shotMin: 1, shotMax: 30, totalMin: 3, totalMax: 30, smart: false },
  },
  {
    /* 走 kie(不是 fal):kling-3.0/video。动作迁移是独立模型「Kling 3.0 Motion Control」(见下一项) */
    key: "kling-3.0",
    label: "Kling 3.0",
    vendor: "kie",
    icon: `${ICON}/kling-color.svg`,
    modes: ["frames"],
    durations: { min: 3, max: 15, step: 1, default: 5 },
    ratios: ["16:9", "9:16", "1:1"],
    resolutions: ["720p", "1080p", "4K"],
    frames: { startRequired: true, elements: true, maxElements: 3, elementImages: [2, 4], ratioFromFrame: true },
    multiShot: { shotMin: 1, shotMax: 12, totalMin: 3, totalMax: 15, smart: false, maxShots: 5, firstFrameOnly: true },
    audioToggle: true,
  },
  {
    /* Kling O3 = Kling 3.0 Omni(fal-ai/kling-video/o3/pro/*):文生 / 图生(首帧必填，尾帧可选)/ 参考生 / 视频编辑。
       参考生：图 + 主体(可绑 voice_id)+ 最多 1 段视频，带视频时图和主体合计 ≤4;编辑：原片 3–15s,可加图和主体，默认保留原声。
       画质是三个端点档位(o3/standard、o3/pro、o3/4k),产品里按分辨率 720p / 1080p / 4K 选;generate_audio 默认关;
       multi_prompt 多镜头，shot_type 可选 intelligent(智能分镜);编辑有 keep_audio(默认保留原声,见 extras.ts)。 */
    key: "kling-3.0-omni",
    label: "Kling 3.0 Omni",
    vendor: "fal",
    icon: `${ICON}/kling-color.svg`,
    modes: ["omni", "frames", "edit"],
    durations: { min: 3, max: 15, step: 1, default: 5 },
    ratios: ["16:9", "9:16", "1:1"],
    resolutions: ["720p", "1080p", "4K"],
    omni: { images: 7, videos: 1, audios: 0, videoSecs: 10, audioOnly: false, elements: 4, voices: 3 },
    frames: { startRequired: true, ratioFromFrame: true },
    edit: { sourceMin: 3, sourceMax: 15, references: true },
    multiShot: { shotMin: 1, shotMax: 15, totalMin: 3, totalMax: 15, smart: true },
    audioToggle: true,
  },
  {
    key: "wan-3.0",
    label: "Wan 3.0",
    vendor: "fal",
    icon: "/prototypes/agent-llm-picker/icons/qwen.png",
    modes: ["omni", "frames"],
    durations: { min: 2, max: 30, step: 1, default: 5 },
    ratios: ["16:9", "9:16", "1:1", "4:3", "3:4"],
    resolutions: ["480p", "720p", "1080p"],
    omni: { images: 10, videos: 5, audios: 5, videoSecs: 15, audioSecs: 15, audioOnly: false, webSource: true },
    frames: { startRequired: true },
    audioToggle: true,
  },
  {
    /* alibaba/wan-3.0-prime/{text,image,reference}-to-video:字段和 Wan 3.0 相同的快速版;尾帧要配首帧 */
    key: "wan-3.0-prime",
    label: "Wan 3.0 Prime",
    vendor: "fal",
    icon: "/prototypes/agent-llm-picker/icons/qwen.png",
    modes: ["omni", "frames"],
    durations: { min: 2, max: 30, step: 1, default: 5 },
    ratios: ["16:9", "9:16", "1:1", "4:3", "3:4"],
    resolutions: ["480p", "720p", "1080p"],
    omni: { images: 10, videos: 5, audios: 5, videoSecs: 15, audioSecs: 15, audioOnly: false, webSource: true },
    frames: { startRequired: true },
    audioToggle: true,
  },
  {
    /* Gemini Omni 1.2 Flash(gemini-omni-1.2-flash,2026-11-06 接入;字段对照 aistudio.google.com/docs/omni):
       时长 / 比例 / 分辨率都在 response_format 里 —— duration "3s"–"15s" 整秒(默认 10s)、aspect_ratio 9:16 / 16:9、resolution 360p / 720p / 1080p / 4k(后两档是放大);
       参考图最多 6 张(每个角色最多 3 张、最多 2 个角色);参考视频每段 ≤3s,成片 3–10s 时最多 3 段、11–15s 时只能 1 段，只用于新生成;不收音频;
       首尾帧只支持 3–10s;编辑 / 延长的源视频 ≤15s,延长每次加 3–10s(默认 10s)、总长 ≤30s,编辑和延长都能带参考图;
       上传视频的编辑 / 延长在英国 / 欧洲经济区 / 瑞士不可用;没有关声音的参数(只能在提示词里写 No dialogue)。
       1.1 从 2026-12-03 起自动转到 1.2。 */
    key: "omni-flash-1.2",
    label: "Gemini Omni 1.2 Flash",
    vendor: "google",
    icon: `${ICON}/gemini.svg`,
    modes: ["omni", "frames", "edit", "extend"],
    durations: { min: 3, max: 15, step: 1, default: 10 },
    ratios: ["16:9", "9:16"],
    resolutions: ["360p", "720p", "1080p", "4K"],
    omni: { images: 6, videos: 3, audios: 0, maxVideoClipSecs: 3, videosWhenLong: { secs: 10, max: 1 }, audioOnly: false },
    frames: { startRequired: true, endMaxSecs: 10 },
    edit: { sourceMin: 1, sourceMax: 15, references: true, ukUploadBlocked: true },
    extend: { sourceMax: 15, maxAdded: 10, direction: false, ukUploadBlocked: true },
  },
  {
    key: "omni-flash",
    label: "Gemini Omni Flash",
    vendor: "google",
    icon: `${ICON}/gemini.svg`,
    modes: ["omni", "frames", "edit", "extend"],
    /* API 本身没有时长参数(只能在提示词里写时间码),产品上照现网给 4 / 6 / 8 / 10s 四档 */
    durations: { min: 4, max: 10, step: 2, default: 4 },
    ratios: ["16:9", "9:16"],
    resolutions: ["360p", "720p", "1080p", "4K"],
    omni: { images: 10, videos: 3, audios: 0, maxVideoClipSecs: 3, audioOnly: false },
    frames: { startRequired: true },
    edit: { sourceMin: 1, sourceMax: 10, references: true, ukUploadBlocked: true },
    extend: { sourceMax: 10, maxAdded: 10, direction: false, ukUploadBlocked: true },
  },
  {
    key: "h3-max",
    label: "MiniMax H3 Max",
    icon: `${LOGO}/hailuo-color.svg`,
    vendor: "fal",
    /* 前四个是生成模式;后两个是 H3 Max 的生成类专项端点(camera-controls、styles/*)。加工类端点(lip-sync、reframe、relight、recast、insert、3d-to-video)在 ai-tools 的工具页 */
    modes: ["omni", "frames", "keyframes", "extend", "camera", "style"],
    durations: { min: 1, max: 15, step: 1, default: 5 },
    ratios: ALL_RATIOS,
    resolutions: ["480p", "768p", "1080p"],
    omni: { images: 9, videos: 3, audios: 3, total: 12, videoSecs: 15, audioSecs: 15, audioOnly: true },
    frames: { startRequired: false, soundtrack: true, ratioFromFrame: true },
    keyframes: { maxMiddle: 1, timed: true, references: 9, resolutions: ["480p", "768p"] },
    extend: { sourceMax: 60, maxAdded: 15, direction: false, resolutions: ["480p", "768p", "1080p", "2K"] },
  },
  {
    /* minimax/h3-max-turbo/{text,image,reference}-to-video、extend-video:字段和 H3 Max 相同的快速版(专项端点没有 Turbo) */
    key: "h3-max-turbo",
    label: "MiniMax H3 Max Turbo",
    icon: `${LOGO}/hailuo-color.svg`,
    vendor: "fal",
    modes: ["omni", "frames", "keyframes", "extend"],
    durations: { min: 1, max: 15, step: 1, default: 5 },
    ratios: ALL_RATIOS,
    resolutions: ["480p", "768p", "1080p"],
    omni: { images: 9, videos: 3, audios: 3, total: 12, videoSecs: 15, audioSecs: 15, audioOnly: true },
    frames: { startRequired: false, soundtrack: true, ratioFromFrame: true },
    keyframes: { maxMiddle: 1, timed: true, references: 9, resolutions: ["480p", "768p"] },
    extend: { sourceMax: 60, maxAdded: 15, direction: false, resolutions: ["480p", "768p", "1080p", "2K"] },
  },
  {
    key: "h3",
    label: "MiniMax H3",
    icon: `${LOGO}/hailuo-color.svg`,
    vendor: "fal",
    modes: ["omni", "frames"],
    durations: { min: 5, max: 15, step: 1, default: 5 },
    ratios: ALL_RATIOS,
    resolutions: ["480p", "768p", "2K", "4K"],
    omni: { images: 9, videos: 3, audios: 3, total: 12, videoSecs: 15, audioSecs: 15, audioOnly: true },
    frames: { startRequired: false, soundtrack: true, ratioFromFrame: true },
  },
  {
    /* fal-ai/vidu/q3/{text,image}-to-video、reference-to-video/mix。fal 上没有单独的「Pro」档，产品名照后台叫 Vidu Q3 Pro。
       参考生只收图(1–4 张，必须有提示词);图生首帧必填、尾帧可选(带尾帧不能 360p),图生没有比例参数 */
    key: "vidu-q3",
    label: "Vidu Q3 Pro",
    icon: `${LOGO}/vidu-color.svg`,
    vendor: "fal",
    modes: ["omni", "frames"],
    durations: { min: 1, max: 16, step: 1, default: 5 },
    ratios: ["16:9", "9:16", "1:1", "4:3", "3:4"],
    resolutions: ["360p", "540p", "720p", "1080p"],
    omni: { images: 4, videos: 0, audios: 0, audioOnly: false, promptRequired: true },
    frames: { startRequired: true, endBlocksRes: ["360p"], ratioFromFrame: true },
    audioToggle: true,
  },
  {
    /* xai/grok-imagine-video/v1.5/{text,image,reference}-to-video。图生只有首帧(没有尾帧、没有比例);
       参考生 1–7 张图，分辨率只有 480p / 720p;三个端点都没有音频开关。编辑 / 延长只有 v1,没有 1.5 版本 */
    key: "grok-1.5",
    label: "Grok Imagine Video 1.5",
    icon: `${LOGO}/grok.svg`,
    vendor: "fal",
    modes: ["omni", "frames"],
    durations: { min: 1, max: 15, step: 1, default: 6 },
    ratios: ["16:9", "9:16", "1:1", "4:3", "3:4", "3:2", "2:3"],
    resolutions: ["480p", "720p", "1080p"],
    omni: { images: 7, videos: 0, audios: 0, audioOnly: false, resolutions: ["480p", "720p"] },
    frames: { startRequired: true, noEnd: true, ratioFromFrame: true },
  },
  {
    /* blackforestlabs/flux-3/*:没有参考图;图生(首帧)/ 首尾帧(两张都必填)/ 关键帧(1–10 张，按 24fps 帧号)/
       编辑(原片 <15s)/ 延长(原片 <15s,续写 5–20s)。时长 5–20s(另有 auto);1080p 以上走放大 */
    key: "flux-3-video",
    label: "FLUX 3 Video",
    icon: `${LOGO}/flux.svg`,
    vendor: "fal",
    modes: ["frames", "keyframes", "edit", "extend"],
    durations: { min: 5, max: 20, step: 1, default: 5 },
    /* fal 比例还有 2:1 */
    ratios: ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9", "2:1"],
    resolutions: ["720p", "1080p", "1440p", "2160p"],
    frames: { startRequired: true },
    keyframes: { maxMiddle: 8, timed: false },
    edit: { sourceMin: 1, sourceMax: 15, references: false },
    extend: { sourceMax: 15, maxAdded: 20, direction: false },
    audioToggle: true,
  },
  {
    /* blackforestlabs/flux-3-max/*(2026-11-05 Monica 定：和 FLUX 3 Video 并列，不替换):只有 text / image / keyframes-to-video 三个端点。
       首尾帧走 image-to-video 的 end_image_url(尾帧选填);关键帧 1–10 张，按 24fps 帧号;没有编辑 / 延长;
       时长 5–20s(没有 auto);分辨率只有 720p / 1080p;多一个 reasoning_level(low / high,见 extras.ts) */
    key: "flux-3-max-video",
    label: "FLUX 3 Max Video",
    icon: `${LOGO}/flux.svg`,
    vendor: "fal",
    modes: ["frames", "keyframes"],
    durations: { min: 5, max: 20, step: 1, default: 5 },
    ratios: ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9", "2:1"],
    resolutions: ["720p", "1080p"],
    frames: { startRequired: true },
    keyframes: { maxMiddle: 8, timed: false },
    audioToggle: true,
  },
];

/** Seedance 2.x 一族(BytePlus):四种任务相同，2.0 Mini / Fast 只有 480p / 720p */
function seedance(key: ModelKey, label: string, d: { min: number; max: number }, resolutions: string[], over: Partial<ModelCaps> = {}): ModelCaps {
  return {
    key,
    label,
    vendor: "bytedance",
    icon: `${ICON}/bytedance.svg`,
    modes: ["omni", "frames", "edit", "extend"],
    durations: { ...d, step: 1, default: 5 },
    ratios: ALL_RATIOS,
    resolutions,
    omni: { images: 9, videos: 3, audios: 3, videoSecs: 15, audioSecs: 15, audioOnly: false },
    frames: { startRequired: true },
    edit: { sourceMin: 2, sourceMax: 15, references: true },
    extend: { sourceMax: 15, direction: false },
    audioToggle: true,
    ...over,
  };
}

/** 模型所属公司(模型下拉按公司分组;vendor 是调用渠道 fal / kie,不是公司) */
export const MODEL_COMPANY: Record<ModelKey, string> = {
  "seedance-2.5": "ByteDance",
  "seedance-2.0-mini": "ByteDance",
  "seedance-2.0-fast": "ByteDance",
  "seedance-2.0": "ByteDance",
  "kling-4.0": "Kuaishou",
  "kling-3.0": "Kuaishou",
  "kling-3.0-omni": "Kuaishou",
  "wan-3.0": "Alibaba",
  "wan-3.0-prime": "Alibaba",
  "omni-flash-1.2": "Google",
  "omni-flash": "Google",
  "h3-max": "MiniMax",
  "h3-max-turbo": "MiniMax",
  h3: "MiniMax",
  "vidu-q3": "ShengShu",
  "grok-1.5": "xAI",
  "flux-3-video": "Black Forest Labs",
  "flux-3-max-video": "Black Forest Labs",
};

/** 按公司分组的模型列表，组的顺序 = 公司在 MODELS 里第一次出现的顺序 */
export const MODEL_GROUPS: { company: string; models: ModelCaps[] }[] = MODELS.reduce<{ company: string; models: ModelCaps[] }[]>((acc, m) => {
  const company = MODEL_COMPANY[m.key];
  const g = acc.find((x) => x.company === company);
  if (g) g.models.push(m);
  else acc.push({ company, models: [m] });
  return acc;
}, []);

export const modelCaps = (k: ModelKey): ModelCaps => MODELS.find((m) => m.key === k)!;
export const supports = (k: ModelKey, m: ModeKey): boolean => modelCaps(k).modes.includes(m);

/** API 支持「跟随素材 / adaptive」比例的模型:比例里多一个 Auto(state 里存 "adaptive") */
export const AUTO_RATIO = new Set<ModelKey>(["kling-4.0", "wan-3.0", "wan-3.0-prime", "h3-max-turbo", "flux-3-video", "flux-3-max-video", "h3-max", "h3", "seedance-2.5", "seedance-2.0-mini", "seedance-2.0-fast", "seedance-2.0"]);
