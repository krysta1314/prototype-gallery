/* Hybrid Reel Agent 的对话状态:纯 reducer,开发原型与评审原型共用。
   所有 id 由调用方(provider 的动作函数)生成后传进来,reducer 本身是纯函数,评审原型用它回放出每一步的预置状态。 */

import type { Brief, ClipProfile, Outline } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";
import { START_CREDITS } from "./logic/credits";
import type { Question } from "./logic/questions";
import type { ShotFail } from "./logic/runs";

export type Lang = "zh" | "en";
export type MediaKind = "video" | "image" | "audio";
export type MediaFile = { name: string; url: string; kind: MediaKind };
export type MediaRef = { key: string; url: string };
/** 分析时被跳过的素材(单个失败跳过继续),reason 已过 friendlyError */
export type Skipped = { name: string; reason: string };
export type RetryStep = "analyze" | "outline";
/** 同一步连续失败几次后出 "Start over" */
export const START_OVER_AFTER = 3;

/** 一次生成(整条或单镜重试)的工具区。charged:开跑时扣的积分;refunded:已退回的(失败镜头);
    refundedShots:已退过款的失败镜头;stoppedAtMs:用户点 Stop 时的进度;only:单镜重试时的镜头号,reelId:重试完要更新的成片卡 */
export type RunsMsg = {
  id: string;
  kind: "runs";
  outline: Outline;
  charged: number;
  refunded?: number;
  refundedShots?: number[];
  fail?: ShotFail[];
  stoppedAtMs?: number;
  only?: number;
  reelId?: string;
};

/** 弹窗:积分不足 / 重新生成确认 / 删除成片确认 */
export type Dialog =
  | { kind: "noCredits"; needed: number; balance: number }
  | { kind: "regenerate"; outline: Outline; cost: number }
  | { kind: "deleteReel"; reelId: string };
/** 底部 toast;undo = 带 Undo(删除成片) */
export type Toast = { id: string; text: string; undo?: boolean };

export type Msg =
  | { id: string; kind: "files"; files: MediaFile[] }
  | { id: string; kind: "user"; text: string }
  | { id: string; kind: "thinking"; text: string; cancellable?: boolean }
  /* details:原始报错(可展开);startOver:同一步连续失败到上限,错误行多一个 Start over */
  /* retryShot:单镜失败的回复,带 "Retry shot {n}"(成片里这一镜还是占位时才显示) */
  | { id: string; kind: "agent"; text: string; retry?: RetryStep; details?: string; startOver?: boolean; retryShot?: number }
  | { id: string; kind: "analysis"; markdown: string; skipped?: Skipped[] }
  | { id: string; kind: "questions"; questions: Question[] }
  | { id: string; kind: "plan"; outline: Outline; superseded?: boolean }
  | RunsMsg
  /* missingShots:生成失败、成片里用占位的镜头号 */
  | { id: string; kind: "reel"; outline: Outline; missingShots?: number[] };

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
  /** 当前连续失败的步骤与次数;该步成功后清零,取消不计 */
  failStreak: { step: RetryStep; count: number } | null;
  /** 积分余额:Generate / Regenerate / Retry shot 扣,失败 / 停止退 */
  credits: number;
  dialog: Dialog | null;
  toast: Toast | null;
  /** 刚删除的成片(Undo 用);toast 消失后清空 */
  trash: { msg: Msg; index: number } | null;
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
  failStreak: null,
  credits: START_CREDITS,
  dialog: null,
  toast: null,
  trash: null,
};

export type AgentAction =
  | { type: "start"; prompt: string; lang: Lang; files: MediaFile[]; media: MediaRef[]; ids: { files: string; user: string } }
  | { type: "empty" }
  | { type: "thinking"; id: string; text: string; cancellable?: boolean }
  | { type: "progress"; id: string; text: string }
  | { type: "analyzed"; profiles: ClipProfile[] }
  | { type: "briefed"; thinkingId: string; analysisId: string; reply: string; brief: Brief; questions: Question[]; questionsId: string; skipped?: Skipped[] }
  | { type: "outlineRequested"; req: OutlineReq; thinkingId: string; text: string }
  | { type: "outlineOk"; thinkingId: string; planId: string; outline: Outline }
  /* cancelled:用户点了 Cancel,不算一次失败 */
  | { type: "failed"; thinkingId: string; errId: string; retry: RetryStep; text: string; details?: string; cancelled?: boolean }
  | { type: "answered"; questionsId: string; brief: Brief; userId: string; transcript: string }
  | { type: "said"; userId: string; text: string; hint?: { id: string; text: string } }
  | { type: "queued"; userId: string; text: string }
  /* cost 不传 = 分镜预估(outline.credits.total);fail = 这次会失败的补拍镜头 */
  | { type: "generate"; agentId: string; runsId: string; text: string; outline: Outline; cost?: number; fail?: ShotFail[] }
  /* runsId 不传 = 最后一个工具区;note:单镜重试完的一句回复 */
  | { type: "runsDone"; reelId: string; outline: Outline; runsId?: string; note?: { id: string; text: string } }
  /* 某个补拍镜头失败:退回 refund,追加一句带 Retry shot 的回复 */
  | { type: "shotFailed"; runsId: string; shot: number; refund: number; agentId: string; text: string }
  /* 用户点 Stop:停在 atMs,退回 refund */
  | { type: "stopped"; runsId: string; atMs: number; refund: number; agentId: string; text: string }
  /* 重试单个补拍:扣 cost,开一个只跑这一镜的工具区,跑完更新 reelId 那张成片卡 */
  | { type: "retryShot"; runsId: string; agentId: string; text: string; outline: Outline; shot: number; cost: number; reelId: string }
  /* 旧版分镜 "Use this version":以它为最新出一张新卡 */
  | { type: "reusePlan"; fromId: string; planId: string }
  | { type: "dialog"; dialog: Dialog | null }
  | { type: "toast"; toast: Toast }
  | { type: "toastDismissed"; id: string }
  | { type: "reelDeleted"; reelId: string; toastId: string; text: string }
  | { type: "deleteUndone" }
  | { type: "retryStarted" };

/** 有中文就中文;写了英文就英文;没写 prompt(只传素材)时用 fallback(调用方传浏览器语言) */
export const detectLang = (text: string, fallback: Lang = "en"): Lang =>
  /[一-鿿]/.test(text) ? "zh" : text.trim() ? "en" : fallback;

export function agentReducer(s: AgentState, a: AgentAction): AgentState {
  switch (a.type) {
    case "start":
      return {
        ...INITIAL_STATE,
        credits: s.credits,
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
      return { ...INITIAL_STATE, credits: s.credits, screen: "chat", empty: true };
    case "thinking":
      return {
        ...s,
        busy: true,
        messages: [...s.messages, { id: a.id, kind: "thinking", text: a.text, ...(a.cancellable ? { cancellable: true } : {}) }],
      };
    case "progress":
      return { ...s, messages: s.messages.map((m) => (m.id === a.id && m.kind === "thinking" ? { ...m, text: a.text } : m)) };
    case "analyzed":
      return { ...s, profiles: a.profiles };
    case "briefed": {
      const messages: Msg[] = s.messages.map((m) =>
        m.id === a.thinkingId ? { id: a.analysisId, kind: "analysis", markdown: a.reply, ...(a.skipped?.length ? { skipped: a.skipped } : {}) } : m,
      );
      if (a.questions.length) messages.push({ id: a.questionsId, kind: "questions", questions: a.questions });
      return { ...s, brief: a.brief, busy: false, failStreak: null, messages };
    }
    case "outlineRequested":
      return { ...s, busy: true, lastOutlineReq: a.req, messages: [...s.messages, { id: a.thinkingId, kind: "thinking", text: a.text }] };
    case "outlineOk":
      return {
        ...s,
        busy: false,
        failStreak: null,
        messages: [
          ...s.messages.filter((m) => m.id !== a.thinkingId).map((m) => (m.kind === "plan" ? { ...m, superseded: true } : m)),
          { id: a.planId, kind: "plan", outline: a.outline },
        ],
      };
    case "failed": {
      const prev = s.failStreak;
      const failStreak = a.cancelled ? prev : { step: a.retry, count: prev?.step === a.retry ? prev.count + 1 : 1 };
      const startOver = !a.cancelled && (failStreak?.count ?? 0) >= START_OVER_AFTER;
      const row: Msg = {
        id: a.errId,
        kind: "agent",
        retry: a.retry,
        text: a.text,
        ...(a.details ? { details: a.details } : {}),
        ...(startOver ? { startOver: true } : {}),
      };
      return {
        ...s,
        busy: false,
        errRetryId: a.errId,
        failStreak,
        messages: s.messages.map((m) => (m.id === a.thinkingId ? row : m)),
      };
    }
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
    case "generate": {
      const cost = a.cost ?? a.outline.credits.total;
      const run: RunsMsg = { id: a.runsId, kind: "runs", outline: a.outline, charged: cost, ...(a.fail?.length ? { fail: a.fail } : {}) };
      return {
        ...s,
        generating: true,
        dialog: null,
        credits: s.credits - cost,
        messages: [...s.messages, { id: a.agentId, kind: "agent", text: a.text }, run],
      };
    }
    case "runsDone": {
      /* 已不在生成中(预置状态直接挂载 runs 行、重复回调)时忽略,避免追加第二张成片卡 */
      if (!s.generating) return s;
      const run = findRun(s.messages, a.runsId);
      const failed = (run?.fail ?? []).map((f) => f.shot);
      const note: Msg[] = a.note ? [{ id: a.note.id, kind: "agent", text: a.note.text }] : [];
      if (run?.only !== undefined) {
        /* 单镜重试:这一镜不再是占位,原成片卡就地更新 */
        const only = run.only;
        const messages = s.messages.map((m) =>
          m.id === run.reelId && m.kind === "reel" ? { ...m, missingShots: (m.missingShots ?? []).filter((n) => n !== only || failed.includes(n)) } : m,
        );
        return { ...s, generating: false, queue: [], messages: [...messages, ...note] };
      }
      const reel: Msg = { id: a.reelId, kind: "reel", outline: a.outline, ...(failed.length ? { missingShots: failed } : {}) };
      return { ...s, generating: false, queue: [], messages: [...s.messages, reel, ...note] };
    }
    case "shotFailed": {
      const run = findRun(s.messages, a.runsId);
      if (!run || run.refundedShots?.includes(a.shot)) return s;
      return {
        ...s,
        credits: s.credits + a.refund,
        messages: [
          ...s.messages.map((m) =>
            m.id === run.id && m.kind === "runs" ? { ...m, refunded: (m.refunded ?? 0) + a.refund, refundedShots: [...(m.refundedShots ?? []), a.shot] } : m,
          ),
          { id: a.agentId, kind: "agent", text: a.text, retryShot: a.shot },
        ],
      };
    }
    case "stopped": {
      const run = findRun(s.messages, a.runsId);
      if (!s.generating || !run || run.stoppedAtMs !== undefined) return s;
      return {
        ...s,
        generating: false,
        queue: [],
        credits: s.credits + a.refund,
        messages: [
          ...s.messages.map((m) => (m.id === run.id && m.kind === "runs" ? { ...m, stoppedAtMs: a.atMs, refunded: (m.refunded ?? 0) + a.refund } : m)),
          { id: a.agentId, kind: "agent", text: a.text },
        ],
      };
    }
    case "retryShot":
      return {
        ...s,
        generating: true,
        dialog: null,
        credits: s.credits - a.cost,
        messages: [
          ...s.messages,
          { id: a.agentId, kind: "agent", text: a.text },
          { id: a.runsId, kind: "runs", outline: a.outline, charged: a.cost, only: a.shot, reelId: a.reelId },
        ],
      };
    case "reusePlan": {
      const from = s.messages.find((m) => m.id === a.fromId);
      if (from?.kind !== "plan") return s;
      return {
        ...s,
        messages: [
          ...s.messages.map((m) => (m.kind === "plan" ? { ...m, superseded: true } : m)),
          { id: a.planId, kind: "plan", outline: from.outline },
        ],
      };
    }
    case "dialog":
      return { ...s, dialog: a.dialog };
    case "toast":
      return { ...s, toast: a.toast };
    case "toastDismissed":
      if (s.toast?.id !== a.id) return s;
      return { ...s, toast: null, trash: null };
    case "reelDeleted": {
      /* 生成 / 单镜重试在跑时不删(provider 也拦了;这里兜底) */
      if (s.generating) return { ...s, dialog: null };
      const index = s.messages.findIndex((m) => m.id === a.reelId);
      if (index < 0) return { ...s, dialog: null };
      return {
        ...s,
        dialog: null,
        trash: { msg: s.messages[index], index },
        toast: { id: a.toastId, text: a.text, undo: true },
        messages: s.messages.filter((m) => m.id !== a.reelId),
      };
    }
    case "deleteUndone": {
      if (!s.trash) return s;
      const messages = [...s.messages];
      messages.splice(Math.min(s.trash.index, messages.length), 0, s.trash.msg);
      return { ...s, messages, trash: null, toast: null };
    }
    case "retryStarted":
      return { ...s, errRetryId: null, messages: s.messages.filter((m) => m.id !== s.errRetryId) };
  }
}

/** 按 id 找工具区;不传 id 取最后一个 */
export function findRun(messages: Msg[], id?: string): RunsMsg | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.kind === "runs" && (id === undefined || m.id === id)) return m;
  }
  return undefined;
}

/** 某个失败镜头现在能不能点 "Retry shot {n}":有成片卡还把它当占位,且没在生成 */
export function shotRetryable(s: Pick<AgentState, "messages" | "generating">, shot: number): boolean {
  return !s.generating && s.messages.some((m) => m.kind === "reel" && !!m.missingShots?.includes(shot));
}

/** 带着这一镜占位的最新成片卡 */
export function reelMissing(messages: Msg[], shot: number): string | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.kind === "reel" && m.missingShots?.includes(shot)) return m.id;
  }
  return undefined;
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

/** 当前挂着 Retry 的错误行是哪一步失败的(没有则 undefined);输入框提示据此选文案 */
export function pendingRetry(s: Pick<AgentState, "messages" | "errRetryId">): RetryStep | undefined {
  const m = s.errRetryId ? s.messages.find((x) => x.id === s.errRetryId) : undefined;
  return m?.kind === "agent" ? m.retry : undefined;
}

/** 分析中思考行的文案:"Reading {done}/{n} files…" */
export const readingText = (done: number, total: number, lang: Lang) =>
  lang === "zh" ? `正在看素材 ${done}/${total}…` : `Reading ${done}/${total} files…`;

/** 分析行「Read {n} files」的 n:只数真正读成功的文件,被跳过的不算 */
export const analysedFileCount = (fileCount: number, skipped?: readonly Skipped[]) => Math.max(0, fileCount - (skipped?.length ?? 0));
