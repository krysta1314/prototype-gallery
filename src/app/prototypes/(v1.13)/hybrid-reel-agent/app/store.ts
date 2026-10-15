/* Hybrid Reel Agent 的对话状态:纯 reducer,开发原型与评审原型共用。
   所有 id 由调用方(provider 的动作函数)生成后传进来,reducer 本身是纯函数,评审原型用它回放出每一步的预置状态。 */

import type { Brief, ClipProfile, Outline } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";
import { START_CREDITS, checkCredits, reelCost } from "./logic/credits";
import type { AnswerRow, Question } from "./logic/questions";
import type { ShotFail, ShotFailKind, VoiceFailKind } from "./logic/runs";
import type { RewriteItem } from "./logic/failure";
import type { PlanStatus } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/plancard";

export type Lang = "zh" | "en";
export type MediaKind = "video" | "image" | "audio";
export type MediaFile = { name: string; url: string; kind: MediaKind };
export type MediaRef = { key: string; url: string };
/** 分析时被跳过的素材(单个失败跳过继续),reason 已过 friendlyError */
export type Skipped = { name: string; reason: string };
export type RetryStep = "analyze" | "outline";

/** 一轮生成的生成中宫格(只放要生成的:每个 AI 补拍一张 + 整条配音一张,计时见 logic/runs.ts + genGrid.ts)。
    charged:开跑时扣的积分;refunded:已退回的(失败镜头 / 停止);refundedShots:已退过款的失败镜头;stoppedAtMs:用户点 Stop 时的进度;
    失败后的续跑:only = 重跑的镜头号(选 Retry / 换模型 / 换参考图 / 改写 prompt),voiceOnly = 只重做配音,editOnly = 不再生成、直接剪(用素材顶上 / 删掉这一镜 / 产品图动态镜头 / 不要配音);
    voiceFail:这一轮配音会失败(voiceRefunded = 已退过配音的积分);held:同一轮镜头和配音都失败时先问镜头,配音的失败带到续跑上,续跑生成结算完再停下来问配音 */
export type RunsMsg = {
  id: string;
  kind: "runs";
  outline: Outline;
  charged: number;
  refunded?: number;
  refundedShots?: number[];
  fail?: ShotFail[];
  stoppedAtMs?: number;
  only?: number[];
  editOnly?: boolean;
  voiceOnly?: boolean;
  voiceFail?: VoiceFailKind;
  voiceRefunded?: boolean;
  held?: VoiceFailKind;
  /** 这一轮剪辑会失败(异常处理 spec 第 8 条,生成都成功之后);editRefunded = 已退过基础费 */
  editFail?: boolean;
  editRefunded?: boolean;
};

/** 分镜卡点「Confirm · N credits」后的用户气泡 */
export const CONFIRM_TEXT = "Confirm";

/** 弹窗:重新生成确认 / 删除成片确认(积分不足不是弹窗,是输入框上方的横条,见 AgentState.outOfCredits) */
export type Dialog =
  | { kind: "regenerate"; outline: Outline; cost: number }
  | { kind: "deleteReel"; reelId: string };
/** 底部 toast;undo = 带 Undo(删除成片);retry = 带 Retry(下载失败,重下这个文件) */
export type Toast = { id: string; text: string; undo?: boolean; retry?: { url: string; fileName: string } };

export type Msg =
  | { id: string; kind: "files"; files: MediaFile[] }
  /** rows:回答提问卡后的那张小卡(题目 / 答案);普通用户消息没有 */
  | { id: string; kind: "user"; text: string; rows?: AnswerRow[] }
  | { id: string; kind: "thinking"; text: string; cancellable?: boolean }
  /* details:原始报错(可展开) */
  | { id: string; kind: "agent"; text: string; retry?: RetryStep; details?: string }
  /** asked:读完素材后跟着提问卡;Agent 的那句总结据此说「确认几个参数」还是「直接排分镜」 */
  /** fillTo:时长题没问、素材不够时总结里加「能撑多少秒」;unusable:素材不可用时代替总结的那段话(logic/footage.ts) */
  | { id: string; kind: "analysis"; markdown: string; skipped?: Skipped[]; asked?: boolean; fillTo?: FillTo; unusable?: string }
  /** followUp:素材不可用那一问的后续 —— 选「Let AI create the missing shots」出 ai,选「Use what I have」/ Other 出 use(空 = 直接排分镜) */
  | { id: string; kind: "questions"; questions: Question[]; followUp?: FootageFollowUp }
  /* superseded:被新一版替代;cancelled:用户在卡上点了 Cancel;confirmed:点了 Confirm 并开始生成 */
  | { id: string; kind: "plan"; outline: Outline; superseded?: boolean; cancelled?: boolean; confirmed?: boolean }
  | RunsMsg
  /** 生成失败后的那一问(logic/failure.ts):runsId = 停下来的那一轮,shots = 失败的镜头号(配音那一问为空),outline = 那一轮的分镜;
      shotKind = 镜头失败按哪一套问;voice = 这是配音那一问(配音失败的原因);held = 镜头问完后还要问的配音失败;edit = 剪辑失败那一问 */
  | { id: string; kind: "ask"; runsId: string; shots: number[]; outline: Outline; question: Question; shotKind?: ShotFailKind; voice?: VoiceFailKind; held?: VoiceFailKind; edit?: boolean }
  /** 改写提案(审核没过选「改写 prompt」/ 旁白稿含敏感词选「改写旁白稿」):Agent 一句 + 新旧对照卡,点 Generate 才扣 cost 重跑。
      shots 为空 = 改写的是旁白稿;status:generated = 已点 Generate,dropped = 用户没点、在输入框改了需求 */
  | { id: string; kind: "rewrite"; text: string; shots: number[]; outline: Outline; items: RewriteItem[]; cost: number; held?: VoiceFailKind; status?: "generated" | "dropped" }
  | { id: string; kind: "reel"; outline: Outline };

export type FillTo = { footageSec: number; durationSec: number };
export type FootageFollowUp = { ai: Question[]; use: Question[] };

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
  /** 积分余额:Generate / Regenerate / 失败后 Retry 扣,失败 / 停止退 */
  credits: number;
  /** 积分不足:Confirm / Regenerate / 失败提问卡的 Retry / 停止后的 Retry 被余额拦下时置 true,输入框上方出横条、发送键换成 Upgrade。
      creditsNeeded = 被拦下的那次要多少;余额 ≥ 它时横条自动收起(见 outOfCreditsShown) */
  outOfCredits: boolean;
  creditsNeeded: number;
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
  credits: START_CREDITS,
  outOfCredits: false,
  creditsNeeded: 0,
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
  | {
      type: "briefed";
      thinkingId: string;
      analysisId: string;
      reply: string;
      brief: Brief;
      questions: Question[];
      questionsId: string;
      skipped?: Skipped[];
      fillTo?: FillTo;
      /** 素材不可用:那段话 + 后续提问(questions 此时是素材那一问) */
      unusable?: { text: string; followUp: FootageFollowUp };
    }
  | { type: "outlineRequested"; req: OutlineReq; thinkingId: string; text: string }
  | { type: "outlineOk"; thinkingId: string; planId: string; outline: Outline }
  /* cancelled:用户点了 Cancel,不算一次失败 */
  | { type: "failed"; thinkingId: string; errId: string; retry: RetryStep; text: string; details?: string; cancelled?: boolean }
  /* follow:答完素材那一问后接着出的常规提问卡 */
  | { type: "answered"; questionsId: string; brief: Brief; userId: string; transcript: string; rows?: AnswerRow[]; follow?: { id: string; questions: Question[] } }
  /* 素材不可用选「Add more footage」:回落地页,已选的素材和 prompt 留着,再 Create 重新分析全部文件 */
  | { type: "backHome" }
  | { type: "said"; userId: string; text: string; hint?: { id: string; text: string } }
  | { type: "queued"; userId: string; text: string }
  /* cost 不传 = 分镜预估(reelCost);fail = 这次会失败的补拍镜头;
     confirm:分镜卡点「Confirm · N credits」时先出一个用户气泡 "Confirm"(Regenerate 不带) */
  | { type: "generate"; agentId: string; runsId: string; text: string; outline: Outline; cost?: number; fail?: ShotFail[]; voiceFail?: VoiceFailKind; editFail?: boolean; confirm?: { id: string; text: string } }
  /* runsId 不传 = 最后一个工具区 */
  | { type: "runsDone"; reelId: string; outline: Outline; runsId?: string }
  /* 某个补拍镜头失败:退回 refund(不出回复;失败卡上写原因和退款) */
  | { type: "shotFailed"; runsId: string; shot: number; refund: number }
  /* 配音失败:退回配音的积分(只退一次) */
  | { type: "voiceFailed"; runsId: string; refund: number }
  /* 剪辑失败:退回基础费(只退一次) */
  | { type: "editFailed"; runsId: string; refund: number }
  /* 一轮的生成都结算完、有镜头失败(或剪辑失败):停下来,出提问卡问怎么继续(不出成片);lead = 提问卡前 Agent 的一句(剪辑失败时说明 + 退款) */
  | { type: "askFailure"; runsId: string; askId: string; shots: number[]; question: Question; shotKind?: ShotFailKind; voice?: VoiceFailKind; held?: VoiceFailKind; edit?: boolean; lead?: { id: string; text: string } }
  /* 选了改写:出 Agent 一句 + 改写卡(不扣费、不开跑,等用户点 Generate) */
  | { type: "rewriteProposed"; id: string; text: string; shots: number[]; outline: Outline; items: RewriteItem[]; cost: number; held?: VoiceFailKind }
  /* 改写卡还没点 Generate 就在输入框说了别的:这一轮放弃(退回没用上的基础费),改写卡标 dropped */
  | { type: "rewriteDropped"; rewriteId: string; refund: number }
  /* 回答了那一问:提问卡换成「题目 / 答案」小卡;refund = 放弃这一轮时退回的基础费(选 Other 改稿) */
  | { type: "failureAnswered"; askId: string; userId: string; transcript: string; rows: AnswerRow[]; refund?: number }
  /* 回答后续跑:only = 重跑这几镜(扣 cost),editOnly = 直接剪;outline = 续跑用的分镜(换素材 / 删镜后的) */
  | {
      type: "continueRun";
      runsId: string;
      agentId: string;
      text: string;
      outline: Outline;
      cost: number;
      only?: number[];
      editOnly?: boolean;
      voiceOnly?: boolean;
      held?: VoiceFailKind;
      editFail?: boolean;
      /** 从改写卡的 Generate 开跑:这张卡标 generated */
      resolves?: string;
    }
  /* 用户点 Stop:停在 atMs,退回 refund */
  | { type: "stopped"; runsId: string; atMs: number; refund: number; agentId: string; text: string }
  /* 方案卡点 Cancel:卡片标 Cancelled,Agent 回一句 */
  | { type: "planCancelled"; planId: string; agentId: string; text: string }
  /* 旧版分镜 "Use this version":以它为最新出一张新卡 */
  | { type: "reusePlan"; fromId: string; planId: string }
  /* 扣费被余额拦下:不扣费、不开跑,进入积分不足状态(needed = 这次要多少) */
  | { type: "outOfCredits"; needed: number }
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
  const next = reduce(s, a);
  /* 余额回到够用(退款等)时退出积分不足状态 */
  return next.outOfCredits && next.credits >= next.creditsNeeded ? { ...next, outOfCredits: false, creditsNeeded: 0 } : next;
}

/** 扣费前的余额关卡:够返回 null(放行);不够返回要 dispatch 的 outOfCredits 动作(不扣费、不开跑)。provider 与评审预置共用 */
export function creditGate(credits: number, cost: number): Extract<AgentAction, { type: "outOfCredits" }> | null {
  const check = checkCredits(credits, cost);
  return check.ok ? null : { type: "outOfCredits", needed: check.needed };
}

/** 积分不足横条 + Upgrade 键是否显示 */
export const outOfCreditsShown = (s: Pick<AgentState, "outOfCredits" | "credits" | "creditsNeeded">) => s.outOfCredits && s.credits < s.creditsNeeded;

function reduce(s: AgentState, a: AgentAction): AgentState {
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
        m.id === a.thinkingId
          ? {
              id: a.analysisId,
              kind: "analysis",
              markdown: a.reply,
              asked: a.questions.length > 0,
              ...(a.skipped?.length ? { skipped: a.skipped } : {}),
              ...(a.fillTo ? { fillTo: a.fillTo } : {}),
              ...(a.unusable ? { unusable: a.unusable.text } : {}),
            }
          : m,
      );
      if (a.questions.length) messages.push({ id: a.questionsId, kind: "questions", questions: a.questions, ...(a.unusable ? { followUp: a.unusable.followUp } : {}) });
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
    case "failed": {
      const row: Msg = {
        id: a.errId,
        kind: "agent",
        retry: a.retry,
        text: a.text,
        ...(a.details ? { details: a.details } : {}),
      };
      return {
        ...s,
        busy: false,
        errRetryId: a.errId,
        messages: s.messages.map((m) => (m.id === a.thinkingId ? row : m)),
      };
    }
    case "answered":
      return {
        ...s,
        brief: a.brief,
        messages: [
          ...s.messages.filter((m) => m.id !== a.questionsId),
          { id: a.userId, kind: "user", text: a.transcript, ...(a.rows ? { rows: a.rows } : {}) },
          ...(a.follow?.questions.length ? [{ id: a.follow.id, kind: "questions" as const, questions: a.follow.questions }] : []),
        ],
      };
    case "backHome":
      /* 对话清掉,素材和 prompt 留着(落地页用它们预填) */
      return { ...INITIAL_STATE, credits: s.credits, prompt: s.prompt, lang: s.lang, files: s.files, media: s.media };
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
      const cost = a.cost ?? reelCost(a.outline);
      const run: RunsMsg = {
        id: a.runsId,
        kind: "runs",
        outline: a.outline,
        charged: cost,
        ...(a.fail?.length ? { fail: a.fail } : {}),
        ...(a.voiceFail ? { voiceFail: a.voiceFail } : {}),
        ...(a.editFail ? { editFail: true } : {}),
      };
      return {
        ...s,
        generating: true,
        dialog: null,
        credits: s.credits - cost,
        messages: [
          /* 从方案卡 Confirm 开跑:当前待确认的那张卡标 Confirmed */
          ...(a.confirm ? s.messages.map((m) => (planAwaiting(m) ? { ...m, confirmed: true } : m)) : s.messages),
          ...(a.confirm ? [{ id: a.confirm.id, kind: "user" as const, text: a.confirm.text }] : []),
          { id: a.agentId, kind: "agent", text: a.text },
          run,
        ],
      };
    }
    case "runsDone": {
      /* 已不在生成中(预置状态直接挂载 runs 行、重复回调)时忽略,避免追加第二张成片卡 */
      if (!s.generating) return s;
      return { ...s, generating: false, queue: [], messages: [...s.messages, { id: a.reelId, kind: "reel", outline: a.outline }] };
    }
    case "shotFailed": {
      const run = findRun(s.messages, a.runsId);
      if (!run || run.refundedShots?.includes(a.shot)) return s;
      return {
        ...s,
        credits: s.credits + a.refund,
        messages: s.messages.map((m) =>
          m.id === run.id && m.kind === "runs" ? { ...m, refunded: (m.refunded ?? 0) + a.refund, refundedShots: [...(m.refundedShots ?? []), a.shot] } : m,
        ),
      };
    }
    case "voiceFailed": {
      const run = findRun(s.messages, a.runsId);
      if (!run || !run.voiceFail || run.voiceRefunded) return s;
      return {
        ...s,
        credits: s.credits + a.refund,
        messages: s.messages.map((m) => (m.id === run.id && m.kind === "runs" ? { ...m, refunded: (m.refunded ?? 0) + a.refund, voiceRefunded: true } : m)),
      };
    }
    case "editFailed": {
      const run = findRun(s.messages, a.runsId);
      if (!run || !run.editFail || run.editRefunded) return s;
      return {
        ...s,
        credits: s.credits + a.refund,
        messages: s.messages.map((m) => (m.id === run.id && m.kind === "runs" ? { ...m, refunded: (m.refunded ?? 0) + a.refund, editRefunded: true } : m)),
      };
    }
    case "rewriteProposed":
      return {
        ...s,
        messages: [
          ...s.messages,
          { id: a.id, kind: "rewrite", text: a.text, shots: a.shots, outline: a.outline, items: a.items, cost: a.cost, ...(a.held ? { held: a.held } : {}) },
        ],
      };
    case "rewriteDropped": {
      const rw = s.messages.find((m) => m.id === a.rewriteId);
      if (rw?.kind !== "rewrite" || rw.status) return s;
      return { ...s, credits: s.credits + a.refund, messages: s.messages.map((m) => (m.id === a.rewriteId && m.kind === "rewrite" ? { ...m, status: "dropped" as const } : m)) };
    }
    case "askFailure": {
      /* 停下来等回答:不再在生成中(Stop 消失、输入框可用),排队的话留着,出片或改稿时再用 */
      const run = findRun(s.messages, a.runsId);
      if (!s.generating || !run || run.stoppedAtMs !== undefined) return s;
      return {
        ...s,
        generating: false,
        messages: [
          ...s.messages,
          ...(a.lead ? [{ id: a.lead.id, kind: "agent" as const, text: a.lead.text }] : []),
          {
            id: a.askId,
            kind: "ask",
            runsId: run.id,
            shots: a.shots,
            outline: run.outline,
            question: a.question,
            ...(a.shotKind ? { shotKind: a.shotKind } : {}),
            ...(a.voice ? { voice: a.voice } : {}),
            ...(a.held ? { held: a.held } : {}),
            ...(a.edit ? { edit: true } : {}),
          },
        ],
      };
    }
    case "failureAnswered": {
      if (!s.messages.some((m) => m.id === a.askId && m.kind === "ask")) return s;
      return {
        ...s,
        credits: s.credits + (a.refund ?? 0),
        messages: s.messages.map((m) => (m.id === a.askId ? { id: a.userId, kind: "user", text: a.transcript, rows: a.rows } : m)),
      };
    }
    case "continueRun": {
      const run: RunsMsg = {
        id: a.runsId,
        kind: "runs",
        outline: a.outline,
        charged: a.cost,
        ...(a.only?.length ? { only: a.only } : {}),
        ...(a.editOnly ? { editOnly: true } : {}),
        ...(a.voiceOnly ? { voiceOnly: true } : {}),
        ...(a.held ? { held: a.held } : {}),
        ...(a.editFail ? { editFail: true } : {}),
      };
      return {
        ...s,
        generating: true,
        dialog: null,
        credits: s.credits - a.cost,
        messages: [
          ...s.messages.map((m) => (m.id === a.resolves && m.kind === "rewrite" ? { ...m, status: "generated" as const } : m)),
          { id: a.agentId, kind: "agent", text: a.text },
          run,
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
    case "planCancelled": {
      const plan = s.messages.find((m) => m.id === a.planId);
      if (!plan || !planAwaiting(plan) || s.generating) return s;
      return {
        ...s,
        messages: [
          ...s.messages.map((m) => (m.id === a.planId && m.kind === "plan" ? { ...m, cancelled: true } : m)),
          { id: a.agentId, kind: "agent", text: a.text },
        ],
      };
    }
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
    case "outOfCredits":
      return { ...s, dialog: null, outOfCredits: true, creditsNeeded: a.needed };
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

/** 方案卡还在等确认(没被替代、没取消、没确认) */
export function planAwaiting(m: Msg): m is Extract<Msg, { kind: "plan" }> {
  return m.kind === "plan" && !m.superseded && !m.cancelled && !m.confirmed;
}

/** 方案卡显示的状态:已确认 > 已取消 > 被替代 > 待确认 */
export function planStatus(m: Extract<Msg, { kind: "plan" }>): PlanStatus {
  if (m.confirmed) return "confirmed";
  if (m.cancelled) return "cancelled";
  if (m.superseded) return "replaced";
  return "awaiting";
}

/** 取消方案后 Agent 的那一句 */
export const planCancelledText = (lang: Lang) =>
  lang === "zh" ? "已取消这版方案。告诉我要改哪里,或者重新确认。" : "Plan cancelled. Tell me what to change, or confirm the plan again.";

/** 按 id 找工具区;不传 id 取最后一个 */
export function findRun(messages: Msg[], id?: string): RunsMsg | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.kind === "runs" && (id === undefined || m.id === id)) return m;
  }
  return undefined;
}

/** 还在等回答的失败提问卡(最多一张) */
export function pendingAsk(messages: Msg[]): Extract<Msg, { kind: "ask" }> | undefined {
  return messages.find((m): m is Extract<Msg, { kind: "ask" }> => m.kind === "ask");
}

/** 还在等点 Generate 的改写卡(最多一张) */
export function pendingRewrite(messages: Msg[]): Extract<Msg, { kind: "rewrite" }> | undefined {
  return messages.find((m): m is Extract<Msg, { kind: "rewrite" }> => m.kind === "rewrite" && !m.status);
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
