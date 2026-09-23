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

/** 服务端分析产物(PRD F1.3) */
export type ClipProfile = {
  label: string;
  kind: "video" | "image";
  sizeMB: number;
  description: string;
  tags: string[];
  hasVoice: boolean;
  voiceSummary?: string;
  issues: string[];
  suggestedRole: Role;
  faceVisible: boolean;
  /** 浏览器端补上的,服务端不返回 */
  objectUrl?: string;
  durationSec?: number;
};

export type ShotSource =
  | { kind: "clip"; clipIndex: number; inSec: number; outSec: number }
  | { kind: "generate"; genType: "bridge" | "broll"; prompt: string }
  | { kind: "blocked"; reason: string; suggestion: string };

export type Shot = {
  role: Role;
  durationSec: number;
  source: ShotSource;
  subtitle: { text: string; source: "stt" | "authored" };
};

/** 这版分镜用的叙事结构(按投放目的从结构库里挑的) */
export type OutlineStructure = { id: string; name: string; why: string };

/** 这版方案的创意说明:像 Marketing Agent 出策略方向那样,讲清楚打什么洞察、怎么开场、标语怎么写 */
export type OutlineConcept = { title: string; insight: string; hook: string; taglines: string[]; tone: string };

export type Outline = {
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
};
