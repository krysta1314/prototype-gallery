/* Hybrid Reel Agent 的对话状态:纯 reducer,开发原型与评审原型共用。
   所有 id 由调用方(provider 的动作函数)生成后传进来,reducer 本身是纯函数,评审原型用它回放出每一步的预置状态。 */

import type { Brief, ClipProfile, Outline } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";
import type { Question } from "./logic/questions";

export type Lang = "zh" | "en";
export type MediaKind = "video" | "image" | "audio";
export type MediaFile = { name: string; url: string; kind: MediaKind };
export type MediaRef = { key: string; url: string };

export type Msg =
  | { id: string; kind: "files"; files: MediaFile[] }
  | { id: string; kind: "user"; text: string }
  | { id: string; kind: "thinking"; text: string }
  | { id: string; kind: "agent"; text: string; retry?: "analyze" | "outline" }
  | { id: string; kind: "analysis"; markdown: string }
  | { id: string; kind: "questions"; questions: Question[] }
  | { id: string; kind: "plan"; outline: Outline; superseded?: boolean }
  | { id: string; kind: "runs"; outline: Outline }
  | { id: string; kind: "reel"; outline: Outline };

export type OutlineReq = { brief: Brief; profiles: ClipProfile[]; revise?: { current: Outline; change: string } };

export type AgentState = {
  screen: "home" | "chat";
  empty: boolean;
  lang: Lang;
  prompt: string;
  files: MediaFile[];
  media: MediaRef[];
  messages: Msg[];
  profiles: ClipProfile[];
  brief: Brief | null;
  busy: boolean;
  generating: boolean;
  queue: string[];
  lastOutlineReq: OutlineReq | null;
  errRetryId: string | null;
};

export const INITIAL_STATE: AgentState = {
  screen: "home",
  empty: false,
  lang: "en",
  prompt: "",
  files: [],
  media: [],
  messages: [],
  profiles: [],
  brief: null,
  busy: false,
  generating: false,
  queue: [],
  lastOutlineReq: null,
  errRetryId: null,
};

export type AgentAction =
  | { type: "start"; prompt: string; lang: Lang; files: MediaFile[]; media: MediaRef[]; ids: { files: string; user: string } }
  | { type: "empty" }
  | { type: "thinking"; id: string; text: string }
  | { type: "analyzed"; profiles: ClipProfile[] }
  | { type: "briefed"; thinkingId: string; analysisId: string; reply: string; brief: Brief; questions: Question[]; questionsId: string }
  | { type: "outlineRequested"; req: OutlineReq; thinkingId: string; text: string }
  | { type: "outlineOk"; thinkingId: string; planId: string; outline: Outline }
  | { type: "failed"; thinkingId: string; errId: string; retry: "analyze" | "outline"; text: string }
  | { type: "answered"; questionsId: string; brief: Brief; userId: string; transcript: string }
  | { type: "said"; userId: string; text: string; hint?: { id: string; text: string } }
  | { type: "queued"; userId: string; text: string }
  | { type: "generate"; agentId: string; runsId: string; text: string; outline: Outline }
  | { type: "runsDone"; reelId: string; outline: Outline }
  | { type: "retryStarted" };

/** 有中文就中文;写了英文就英文;没写 prompt(只传素材)时用 fallback(调用方传浏览器语言) */
export const detectLang = (text: string, fallback: Lang = "en"): Lang =>
  /[一-鿿]/.test(text) ? "zh" : text.trim() ? "en" : fallback;

export function agentReducer(s: AgentState, a: AgentAction): AgentState {
  switch (a.type) {
    case "start":
      return {
        ...INITIAL_STATE,
        screen: "chat",
        prompt: a.prompt,
        lang: a.lang,
        files: a.files,
        media: a.media,
        messages: [
          { id: a.ids.files, kind: "files", files: a.files },
          ...(a.prompt ? [{ id: a.ids.user, kind: "user" as const, text: a.prompt }] : []),
        ],
      };
    case "empty":
      return { ...INITIAL_STATE, screen: "chat", empty: true };
    case "thinking":
      return { ...s, busy: true, messages: [...s.messages, { id: a.id, kind: "thinking", text: a.text }] };
    case "analyzed":
      return { ...s, profiles: a.profiles };
    case "briefed": {
      const messages: Msg[] = s.messages.map((m) => (m.id === a.thinkingId ? { id: a.analysisId, kind: "analysis", markdown: a.reply } : m));
      if (a.questions.length) messages.push({ id: a.questionsId, kind: "questions", questions: a.questions });
      return { ...s, brief: a.brief, busy: false, messages };
    }
    case "outlineRequested":
      return { ...s, busy: true, lastOutlineReq: a.req, messages: [...s.messages, { id: a.thinkingId, kind: "thinking", text: a.text }] };
    case "outlineOk":
      return {
        ...s,
        busy: false,
        messages: [
          ...s.messages.filter((m) => m.id !== a.thinkingId).map((m) => (m.kind === "plan" ? { ...m, superseded: true } : m)),
          { id: a.planId, kind: "plan", outline: a.outline },
        ],
      };
    case "failed":
      return {
        ...s,
        busy: false,
        errRetryId: a.errId,
        messages: s.messages.map((m) => (m.id === a.thinkingId ? { id: a.errId, kind: "agent", retry: a.retry, text: a.text } : m)),
      };
    case "answered":
      return {
        ...s,
        brief: a.brief,
        messages: [...s.messages.filter((m) => m.id !== a.questionsId), { id: a.userId, kind: "user", text: a.transcript }],
      };
    case "said":
      return {
        ...s,
        messages: [
          ...s.messages,
          { id: a.userId, kind: "user", text: a.text },
          ...(a.hint ? [{ id: a.hint.id, kind: "agent" as const, text: a.hint.text }] : []),
        ],
      };
    case "queued":
      return { ...s, queue: [...s.queue, a.text], messages: [...s.messages, { id: a.userId, kind: "user", text: a.text }] };
    case "generate":
      return {
        ...s,
        generating: true,
        messages: [...s.messages, { id: a.agentId, kind: "agent", text: a.text }, { id: a.runsId, kind: "runs", outline: a.outline }],
      };
    case "runsDone":
      /* 已不在生成中(预置状态直接挂载 runs 行、重复回调)时忽略,避免追加第二张成片卡 */
      if (!s.generating) return s;
      return { ...s, generating: false, queue: [], messages: [...s.messages, { id: a.reelId, kind: "reel", outline: a.outline }] };
    case "retryStarted":
      return { ...s, errRetryId: null, messages: s.messages.filter((m) => m.id !== s.errRetryId) };
  }
}

export function latestOutline(messages: Msg[]): Outline | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.kind === "plan" || m.kind === "reel") return m.outline;
  }
  return undefined;
}

/** Retry 只在其后只有用户气泡或普通 agent 行时显示(后面已有新的请求就不再给重试) */
export function retryVisible(messages: Msg[], index: number): boolean {
  return messages.slice(index + 1).every((x) => x.kind === "user" || (x.kind === "agent" && !x.retry));
}
