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

export type Outline = {
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
};

/** agent → canvas 的单向 handoff 载体,存 sessionStorage */
export const HANDOFF_KEY = "hybrid-reel-handoff";

export type Handoff = {
  brief: Brief;
  profiles: ClipProfile[];
  outline: Outline;
};
