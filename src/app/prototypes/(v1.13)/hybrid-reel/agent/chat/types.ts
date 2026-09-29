/* Hybrid Reel 对话流里用到的类型。
   Shot / EDL 的形状与工程设计 §4.2 对齐,服务端 /api/hybrid-reel/outline 直接产出这个形状。 */

export type Role = "hook" | "pain" | "proof" | "usage" | "cta";

export const ROLE_META: Record<Role, { label: string; blurb: string; color: string; soft: string }> = {
  hook: { label: "Hook", blurb: "Stops the scroll", color: "#ff5e1a", soft: "#fff3ec" },
  pain: { label: "Pain", blurb: "Names the problem", color: "#ff5255", soft: "#fff0f0" },
  proof: { label: "Proof", blurb: "Why believe you", color: "#3b6fd4", soft: "#eef3fd" },
  usage: { label: "Usage", blurb: "Product doing its job", color: "#1a7f4b", soft: "#e8f7ef" },
  cta: { label: "CTA", blurb: "What to do next", color: "#7c5cd6", soft: "#f3effd" },
};

/* ── 素材身份(spec 2.1):AI 按内容判断,不按文件类型;用户可改 ── */
export type Identity = "footage" | "reference" | "brand" | "showcase" | "evidence" | "audio" | "unused";
export const IDENTITIES: Identity[] = ["footage", "reference", "brand", "showcase", "evidence", "audio", "unused"];
export const IDENTITY_META: Record<Identity, { label: string; blurb: string }> = {
  footage: { label: "Footage", blurb: "Cut into the timeline" },
  reference: { label: "Reference", blurb: "Style only, stays out of the cut" },
  brand: { label: "Brand asset", blurb: "Logo and brand marks" },
  showcase: { label: "Product", blurb: "Product photo, screenshot or recording" },
  evidence: { label: "Evidence", blurb: "Reviews, data, awards, press" },
  audio: { label: "Audio", blurb: "Music, voice or sound" },
  unused: { label: "Not used", blurb: "Left out of this ad" },
};
/** 「产品展示」的子类 */
export type ShowcaseKind = "photo" | "screenshot" | "recording";
export const SHOWCASE_LABEL: Record<ShowcaseKind, string> = { photo: "Product photo", screenshot: "Screenshot", recording: "Screen recording" };
/** 音频素材是什么 */
export type AudioKind = "music" | "voice" | "sfx";
/** 原声是什么声音(spec 2.7),决定保留 / 压低 / 静音 */
export type SoundType = "speech" | "meaningful" | "ambient" | "noise" | "silent";
export const SOUND_META: Record<SoundType, { label: string; plan: string }> = {
  speech: { label: "Speech", plan: "Keep, loudest" },
  meaningful: { label: "Key sound", plan: "Keep, duck under voiceover" },
  ambient: { label: "Ambient", plan: "Turn down" },
  noise: { label: "Noise", plan: "Mute" },
  silent: { label: "Silent", plan: "—" },
};
/** 产品类型(spec §1),brief 的顶层设定 */
/** 配音语速:对应 Seed-Audio 的 speech_rate(见 src/lib/hybrid-reel/tts.ts) */
export type Pace = "slow" | "normal" | "fast";
export const PACE_LABEL: Record<Pace, string> = { slow: "Slow", normal: "Normal", fast: "Fast" };

export type ProductType = "physical" | "saas" | "service";
export const PRODUCT_TYPE_LABEL: Record<ProductType, string> = { physical: "Physical product", saas: "SaaS / App", service: "Service" };

/** 视频场记里的一段:起止、能不能用、能当什么镜头、证明了什么卖点、原声是什么 */
export type Segment = {
  start: number;
  end: number;
  description: string;
  usable: boolean;
  reason?: string;
  roles: string[];
  sellingPoint?: string;
  sound?: SoundType;
};

/** 服务端分析产物(PRD F1.3) */
export type ClipProfile = {
  label: string;
  kind: "video" | "image" | "audio";
  identity?: Identity;
  /** AI 为什么这么判断,一句话 */
  identityWhy?: string;
  /** 用户手动改过身份:AI 的理由不再适用,界面上改显示「Set by you」 */
  identityEdited?: boolean;
  showcase?: ShowcaseKind;
  audioKind?: AudioKind;
  /** 整条素材的原声 */
  sound?: SoundType;
  soundNote?: string;
  sizeMB: number;
  description: string;
  tags: string[];
  hasVoice: boolean;
  voiceSummary?: string;
  issues: string[];
  suggestedRole: Role;
  faceVisible: boolean;
  /** 视频的场记(图片没有) */
  segments?: Segment[];
  /** 浏览器端补上的,服务端不返回 */
  objectUrl?: string;
  durationSec?: number;
};

/* ── 剪辑方案里每个镜头的画面处理(spec 2.2):创作意图写进方案卡,技术细节默认处理 ── */
export type Motion = "none" | "push-in" | "pull-out" | "pan-left" | "pan-right" | "scroll";
export const MOTION_LABEL: Record<Motion, string> = {
  none: "Still",
  "push-in": "Slow push-in",
  "pull-out": "Slow pull-out",
  "pan-left": "Pan left",
  "pan-right": "Pan right",
  scroll: "Scroll down",
};
export type Treatment = {
  /** 1 = 原速;<1 慢放,>1 加速 */
  speed?: number;
  motion?: Motion;
  /** 局部放大:画面里的区域(0–1),target 是放大的是什么;follow = 跟着光标走 */
  zoom?: { x: number; y: number; w: number; h: number; target: string; follow?: boolean };
  /** 框进设备外壳 */
  device?: "phone" | "laptop";
  /** 点击处出现光圈 */
  highlight?: boolean;
  /** 评价 / 数据截图裁成卡片放大居中 */
  asCard?: boolean;
  stabilize?: boolean;
  cutout?: boolean;
  /** 画中画:小窗里叠另一条素材 */
  pip?: { clipIndex: number };
  /** 内容优先,踩点时不许剪短(比如喷雾要喷完) */
  keepWhole?: boolean;
  /** 一句话:这一镜为什么这样处理(方案卡上展示) */
  note?: string;
};

/* ── 字卡(spec 2.6):画面上设计出来的文字,和有没有人说话无关 ── */
export type CardKind = "hook" | "point" | "action" | "stat" | "offer" | "cta" | "tagline";
export const CARD_KIND_LABEL: Record<CardKind, string> = {
  hook: "Hook title",
  point: "Selling point",
  action: "Action cue",
  stat: "Stat",
  offer: "Offer",
  cta: "CTA",
  tagline: "Tagline",
};
export type CardPos = "top" | "upper" | "center" | "lower";
export type CardAnim = "pop" | "slide" | "type" | "fade";
export type CardPlan = {
  kind: CardKind;
  text: string;
  /** 相对这一镜开头的起止(秒) */
  inSec: number;
  outSec: number;
  pos: CardPos;
  /** 字卡样式 id(src/lib/hybrid-reel/cards.ts) */
  style: string;
  anim: CardAnim;
  /** 进场时的强调音效,绑定在这张字卡上 */
  sfx?: string;
};

export type ShotSource =
  | { kind: "clip"; clipIndex: number; inSec: number; outSec: number }
  | {
      kind: "generate";
      genType: "bridge" | "broll";
      /** 分镜表里的一句话描述 */
      summary?: string;
      /** 按 Seedance 2.0 框架写的完整 prompt(全局设定 / 分时分镜 / 画质约束三段) */
      prompt: string;
      /** 参考素材(不含带人脸的),按顺序对应 prompt 里的 @Image 1、@Image 2…;视频取 atSec 那一帧 */
      refs?: { clipIndex: number; atSec?: number }[];
      /** 用某张图当视频的最后一帧(尾帧 logo / 产品图不变形) */
      lastFrame?: { clipIndex: number };
      /** 生成时带声音(镜头里的音效随镜头走) */
      withAudio?: boolean;
    }
  /** 旧会话里的「请自己拍」,新方案不再产出 */
  | { kind: "blocked"; reason: string; suggestion: string };

export type Shot = {
  role: Role;
  durationSec: number;
  source: ShotSource;
  /** stt = 素材里本来有人说话(字幕来自识别);authored = 旁白台词(旁白关着时为空) */
  subtitle: { text: string; source: "stt" | "authored" };
  treatment?: Treatment;
  /** 这一镜原声怎么处理 */
  sound?: { keep: boolean; volume: number; note?: string };
  cards?: CardPlan[];
  /** 这一句旁白单独的语气 / 语速(比如钩子更有冲击力、更快);不写按整条旁白的 */
  delivery?: string;
  pace?: Pace;
  /** 镜头以外的音效(品牌音、加强的拟音);atSec 相对这一镜开头 */
  sfx?: { kind: string; atSec: number }[];
};

/** 这版分镜用的叙事结构(按投放目的从结构库里挑的) */
export type OutlineStructure = { id: string; name: string; why: string };

/** 这版方案的创意说明:像 Marketing Agent 出策略方向那样,讲清楚打什么洞察、怎么开场、标语怎么写 */
export type OutlineConcept = { title: string; insight: string; hook: string; taglines: string[]; tone: string };

export type Outline = {
  productType?: ProductType;
  /** 要不要旁白、什么声音(spec 2.4) */
  /** delivery = 情绪语气(拼进配音 prompt);pace = 语速档(走配音接口的 speech_rate 参数) */
  voiceover?: { on: boolean; why: string; voice?: string; delivery?: string; pace?: Pace };
  /** 音乐(spec 2.8):AI 生成 / 曲库 / 用户上传;beatSync = 剪辑点踩拍 */
  music?: { source: "ai" | "library" | "upload"; /** AI 起的曲名 */ title?: string; prompt: string; clipIndex?: number; libraryId?: string; bpm?: number; beatSync: boolean };
  /** 封面:用第几镜的哪一秒,要不要叠一行标题字卡 */
  /** prompt:设计封面的出图 prompt(英文),进画布预埋在封面的 Image Generator 节点里 */
  cover?: { shot: number; atSec: number; title?: string; prompt?: string };
  /** 字卡的强调色:跟着参考素材或品牌调性走(比如海洋蓝) */
  cardAccent?: string;
  /** 字幕样式 id(subtitles.tsx);有人说话时才用得上 */
  subtitleStyle?: string;
  structure?: OutlineStructure;
  concept?: OutlineConcept;
  shots: Shot[];
  direction: string;
  bgmPrompt: string;
  credits: { base: number; perGenerateShot: number; generatedShots: number; total: number };
  model: string;
};

export type Brief = {
  platform: string;
  durationSec: number;
  audience: string;
  sellingPoints: string[];
  cta: string;
  subtitleLang: string;
  productType?: ProductType;
  /** 用户 prompt 里六项之外的要求,原话 */
  notes?: string;
};

/** agent → canvas 的单向 handoff 载体,存 sessionStorage */
export const HANDOFF_KEY = "hybrid-reel-handoff";

export type Handoff = {
  brief: Brief;
  profiles: ClipProfile[];
  outline: Outline;
  /** 素材 blob URL ↔ IndexedDB key;画布硬刷新后据此换回可用的预览地址 */
  media?: { key: string; url: string }[];
  /** 来自哪个对话:画布按它把工程存一份,下次从这个对话进画布接着用 */
  sessionId?: string;
};

/** 镜头在成片里实际放多久:素材镜头按变速算((out − in) ÷ speed),补拍镜头就是生成时长 */
export function onScreenSec(shot: Shot): number {
  const sp = shot.treatment?.speed && shot.treatment.speed > 0 ? shot.treatment.speed : 1;
  const len = shot.source.kind === "clip" ? shot.durationSec / sp : shot.durationSec;
  return Math.round(len * 10) / 10;
}
