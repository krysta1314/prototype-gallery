/* 评审旅程:每一步 = 用产品自己的 reducer 回放一串真实动作得到的状态,保证评审画面就是产品真实会出现的画面。 */

import { FIXTURE_ITEMS } from "../app/fixture/files";
import { shapeOutline } from "../app/fixture/api";
import type { FixtureData } from "../app/fixture/types";
import type { HomeItem } from "../app/api";
import type { CreationType } from "../app/components/CreationTypePicker";
import { answerRows, answerTranscript, applyAnswers, buildQuestions } from "../app/logic/questions";
import { failText, friendlyError } from "../app/logic/errors";
import { checkCredits, reelCost, shotCost, shotFailedText, stoppedText } from "../app/logic/credits";
import { SHOT_FAIL_REASON, schedule, stopRefund, toolRuns, type ShotFail } from "../app/logic/runs";
import { aiShotNumbers } from "../app/logic/storyboard";
import { pickFiles } from "../app/logic/upload";
import { CONFIRM_TEXT, INITIAL_STATE, START_OVER_AFTER, agentReducer, readingText, type AgentAction, type AgentState, type Lang } from "../app/store";
import { EDITOR_JOURNEYS, LOW_CREDITS, type EditorStepId } from "./editorJourneys";

/** 前 22 步:Agent 对话流程 */
export type AgentStepId =
  | "home" | "picked" | "creationType" | "analyzing" | "questions" | "partial" | "plan" | "revised" | "useVersion"
  | "generating" | "queued" | "stopped" | "reel"
  | "uploadLimit" | "failAnalyze" | "startOver" | "failOutline" | "noCredits" | "genFailed" | "failVideo" | "answerFirst" | "empty";

/** 全部 46 步:Agent 22 步 + 剪辑器 24 步(editorJourneys.ts);Inspector 的步骤范围按实际位置算 */
export type StepId = AgentStepId | EditorStepId;

export type Journey = { id: StepId; group: string; title: string };

export const isEditorStep = (s: StepId): s is EditorStepId => EDITOR_JOURNEYS.some((j) => j.id === s);

export const JOURNEYS: Journey[] = [
  { id: "home", group: "开始", title: "落地页" },
  { id: "picked", group: "开始", title: "已选素材" },
  { id: "creationType", group: "开始", title: "切换创作类型" },
  { id: "analyzing", group: "分析", title: "分析中" },
  { id: "questions", group: "分析", title: "提问卡" },
  { id: "partial", group: "分析", title: "提问卡只问缺项" },
  { id: "plan", group: "方案", title: "分镜表" },
  { id: "revised", group: "方案", title: "改稿后" },
  { id: "useVersion", group: "方案", title: "用回旧版分镜" },
  { id: "generating", group: "生成", title: "生成中" },
  { id: "queued", group: "生成", title: "生成中排队" },
  { id: "stopped", group: "生成", title: "已停止生成" },
  { id: "reel", group: "交付", title: "成片" },
  { id: "uploadLimit", group: "异常", title: "上传超限" },
  { id: "failAnalyze", group: "异常", title: "分析失败" },
  { id: "startOver", group: "异常", title: "连续失败 · Start over" },
  { id: "failOutline", group: "异常", title: "分镜失败" },
  { id: "noCredits", group: "异常", title: "积分不足" },
  { id: "genFailed", group: "异常", title: "生成失败(单镜)" },
  { id: "failVideo", group: "异常", title: "视频加载失败" },
  { id: "answerFirst", group: "异常", title: "未答题先发消息" },
  { id: "empty", group: "异常", title: "空态" },
  ...EDITOR_JOURNEYS,
];

/** noCredits:「积分不足」开关,Agent 与剪辑器起始余额都改成 LOW_CREDITS;agentFailShot:「生成失败(Agent)」开关,
    Generate 时补拍镜头 agentFailShotFor() 失败(只对 Agent 步骤生效);failShot:「补拍生成失败」只对剪辑器生效 */
export type ReviewOpts = {
  lang: Lang;
  voiceover: boolean;
  aiShots: "recorded" | 0;
  failAnalyze: boolean;
  failOutline: boolean;
  failVideo: boolean;
  failShot: boolean;
  noCredits: boolean;
  agentFailShot: boolean;
  /** 「创作类型」:落地页选中的创作类型,大标题和提示语跟着换(只对落地页步骤生效) */
  creationType: CreationType;
};
export const DEFAULT_OPTS: ReviewOpts = {
  lang: "zh",
  voiceover: true,
  aiShots: "recorded",
  failAnalyze: false,
  failOutline: false,
  failVideo: false,
  failShot: false,
  noCredits: false,
  agentFailShot: false,
  creationType: "hybrid",
};

export { LOW_CREDITS };

export type Preset = { state: AgentState; items: HomeItem[]; homePrompt?: string; homeNotices?: string[]; homeTypeMenuOpen?: boolean; autorun?: "analyze" };

/** 落地页的步骤:「创作类型」开关只对这些生效 */
export const LANDING_STEPS: StepId[] = ["home", "picked", "creationType", "uploadLimit"];

/** 评审演示会失败的补拍镜头号(从 1 起):第 2 个 AI 补拍,只有一个就第 1 个;没有补拍 = undefined */
export function agentFailShotFor(opts: ReviewOpts, data: FixtureData): number | undefined {
  const set = data[opts.lang];
  const fx = { lang: opts.lang, voiceover: opts.voiceover, aiShots: opts.aiShots, failAnalyze: false, failOutline: false };
  const ai = aiShotNumbers(shapeOutline(set.outline, set, fx));
  return ai[1] ?? ai[0];
}

/** 「上传超限」一次选进来的不合规文件(过 upload.ts 的 pickFiles,提示就是产品原话) */
export const OVER_LIMIT_FILES = [
  { name: "launch-event-full.mov", type: "video/quicktime", size: 1.2 * 1024 ** 3, durationSec: 1460 },
  { name: "factory-tour.mp4", type: "video/mp4", size: 320 * 1024 ** 2, durationSec: 14 * 60 },
  { name: "lookbook-raw.png", type: "image/png", size: 36 * 1024 ** 2 },
  { name: "brand-guidelines.pdf", type: "application/pdf", size: 4 * 1024 ** 2 },
];

export function buildPreset(id: AgentStepId, opts: ReviewOpts, data: FixtureData): Preset {
  const set = data[opts.lang];
  const zh = opts.lang === "zh";
  const fx = { lang: opts.lang, voiceover: opts.voiceover, aiShots: opts.aiShots, failAnalyze: false, failOutline: false };
  let n = 0;
  const id_ = () => `${id}-${(n += 1)}`;
  const acts: AgentAction[] = [];
  const items = FIXTURE_ITEMS;
  /* 与 fixture 出错开关抛的错误一致,经 friendlyError 得到产品显示的那句 + Details 原文 */
  const simErr = friendlyError(new Error("The model service timed out (simulated)"), undefined, opts.lang);
  /* 「积分不足」步骤自身就是余额 LOW_CREDITS;开关打开时 ReviewApp 另外给 AgentProvider 传 initialCredits */
  const start: AgentState = id === "noCredits" ? { ...INITIAL_STATE, credits: LOW_CREDITS } : INITIAL_STATE;
  const play = () => acts.reduce(agentReducer, start);

  if (id === "home") return { state: INITIAL_STATE, items: [] };
  /* 落地页 + Creation type 弹层打开:看各创作类型的说明;选哪个,大标题和提示语就换成哪个 */
  if (id === "creationType") return { state: INITIAL_STATE, items: [], homeTypeMenuOpen: true };
  if (id === "picked") return { state: INITIAL_STATE, items, homePrompt: set.prompt };
  if (id === "uploadLimit") {
    /* 已选好素材后又选了一批不合规的:不合规的不加入,输入框上方出可关闭提示 */
    const { notices } = pickFiles(items.length, OVER_LIMIT_FILES);
    return { state: INITIAL_STATE, items, homePrompt: set.prompt, homeNotices: notices };
  }
  if (id === "empty") return { state: agentReducer(INITIAL_STATE, { type: "empty" }), items: [] };

  const stated = id === "partial";
  const prompt = stated ? set.promptStated : set.prompt;
  acts.push({
    type: "start",
    prompt,
    lang: opts.lang,
    files: items.map(({ name, url, kind }) => ({ name, url, kind })),
    media: items.map((it, i) => ({ key: `fixture:${i}`, url: it.url })),
    ids: { files: id_(), user: id_() },
  });
  if (id === "analyzing") return { state: play(), items, autorun: "analyze" };

  const t1 = id_();
  acts.push({ type: "thinking", id: t1, text: readingText(0, items.length, opts.lang), cancellable: true });
  if (id === "failAnalyze") {
    acts.push({ type: "failed", thinkingId: t1, errId: id_(), retry: "analyze", text: failText(zh ? "素材分析失败" : "Couldn't read your footage", simErr, opts.lang), details: simErr.details });
    return { state: play(), items };
  }
  if (id === "startOver") {
    /* 分析连续失败 START_OVER_AFTER 次:每次 Retry = retryStarted(去掉上一条错误行)+ 重新分析;第 3 次的错误行多一个 Start over */
    let t = t1;
    for (let k = 0; k < START_OVER_AFTER; k++) {
      if (k > 0) {
        acts.push({ type: "retryStarted" });
        t = id_();
        acts.push({ type: "thinking", id: t, text: readingText(0, items.length, opts.lang), cancellable: true });
      }
      acts.push({ type: "failed", thinkingId: t, errId: id_(), retry: "analyze", text: failText(zh ? "素材分析失败" : "Couldn't read your footage", simErr, opts.lang), details: simErr.details });
    }
    return { state: play(), items };
  }

  const b = stated ? set.briefStated : set.brief;
  acts.push({ type: "analyzed", profiles: set.profiles });
  /* 提问卡与产品一致,不随 AI 补拍开关变化;该开关只影响分镜表(见 fixture shapeOutline) */
  const questions = buildQuestions(b.assumed, b.brief, set.profiles, opts.lang);
  const qid = id_();
  acts.push({ type: "briefed", thinkingId: t1, analysisId: id_(), reply: b.reply, brief: b.brief, questions, questionsId: qid });
  if ((id === "questions" || id === "partial") && questions.length) return { state: play(), items };
  if (id === "answerFirst") {
    /* 提问卡还没提交就在输入框发消息:产品 provider.send 不排分镜,回一句提示(文案与 app/provider.tsx 逐字一致)。
       没有提问卡时产品会直接去排分镜,这条提示出不来,就停在提问后的状态 */
    if (questions.length)
      acts.push({
        type: "said",
        userId: id_(),
        text: zh ? "先帮我排分镜吧" : "Just lay out the storyboard",
        hint: { id: id_(), text: zh ? "先在上面的卡片里选一下,我再排分镜。" : "Pick your answers in the card above and I'll lay out the storyboard." },
      });
    return { state: play(), items };
  }

  let brief = b.brief;
  if (questions.length) {
    const answers = Object.fromEntries(questions.map((q) => [q.id, set.answers[q.id] ?? { picked: q.defaults }]));
    brief = applyAnswers(b.brief, questions, answers, opts.lang);
    acts.push({ type: "answered", questionsId: qid, brief, userId: id_(), transcript: answerTranscript(questions, answers), rows: answerRows(questions, answers) });
  }
  const t2 = id_();
  acts.push({ type: "outlineRequested", req: { brief, profiles: set.profiles }, thinkingId: t2, text: zh ? "正在排分镜…" : "Laying out the storyboard…" });
  if (id === "failOutline") {
    acts.push({ type: "failed", thinkingId: t2, errId: id_(), retry: "outline", text: failText(zh ? "分镜没排出来" : "Couldn't lay out the storyboard", simErr, opts.lang), details: simErr.details });
    return { state: play(), items };
  }
  const outline = shapeOutline(set.outline, set, fx);
  const planId = id_();
  acts.push({ type: "outlineOk", thinkingId: t2, planId, outline });
  if (id === "plan" || id === "partial") return { state: play(), items };
  if (id === "noCredits") {
    /* 方案卡点 Generate:余额不够,弹「Not enough credits」,不开跑(与 provider.startRun 一致) */
    const check = checkCredits(LOW_CREDITS, reelCost(outline));
    if (!check.ok) acts.push({ type: "dialog", dialog: { kind: "noCredits", needed: check.needed, balance: check.balance } });
    return { state: play(), items };
  }

  if (id === "revised" || id === "useVersion") {
    acts.push({ type: "said", userId: id_(), text: set.revision });
    const t3 = id_();
    acts.push({ type: "outlineRequested", req: { brief, profiles: set.profiles, revise: { current: outline, change: set.revision } }, thinkingId: t3, text: zh ? "正在排分镜…" : "Laying out the storyboard…" });
    acts.push({ type: "outlineOk", thinkingId: t3, planId: id_(), outline: shapeOutline(set.revised, set, fx) });
    /* 在旧版分镜上点 Use this version:以它为最新出一张新卡,前两张都变旧版 */
    if (id === "useVersion") acts.push({ type: "reusePlan", fromId: planId, planId: id_() });
    return { state: play(), items };
  }

  /* 与 provider.startRun 一致:分镜卡点 Confirm 先出用户气泡 "Confirm";扣分镜预估;「生成失败」步骤 / 开关打开时,带上会失败的补拍镜头 */
  const cost = reelCost(outline);
  const failShot = id === "genFailed" || opts.agentFailShot ? agentFailShotFor(opts, data) : undefined;
  const fail: ShotFail[] = failShot !== undefined && outline.shots[failShot - 1]?.source.kind === "generate" ? [{ shot: failShot, reason: SHOT_FAIL_REASON[opts.lang] }] : [];
  const runsId = id_();
  acts.push({
    type: "generate",
    agentId: id_(),
    runsId,
    outline,
    cost,
    ...(fail.length ? { fail } : {}),
    confirm: { id: id_(), text: CONFIRM_TEXT },
    text: zh ? "好，开始生成。AI 补拍在跑的同时，我先把实拍片段、标题卡和片尾卡准备好。" : "Meanwhile, I'll prepare the live footage segments, title card and end card.",
  });
  if (id === "generating") return { state: play(), items };
  if (id === "queued") {
    acts.push({ type: "queued", userId: id_(), text: set.revision });
    return { state: play(), items };
  }
  if (id === "stopped") {
    /* 补拍跑到一半点 Stop:按 provider.stop 的算法定位停在哪、退多少 */
    const runs = toolRuns(outline);
    const slots = schedule(runs);
    const gen = slots.find((x) => x.id.startsWith("gen-"));
    const atMs = gen ? gen.startMs + 2000 : Math.round(Math.max(...slots.map((x) => x.endMs)) / 2);
    const refund = stopRefund({ outline, charged: cost, refunded: 0, runs, slots, atMs, fail });
    acts.push({ type: "stopped", runsId, atMs, refund, agentId: id_(), text: stoppedText(refund, opts.lang) });
    return { state: play(), items };
  }
  /* 失败镜头到点:退回这一镜 + 一句带 Retry shot 的回复;之后照常交付,成片里这一镜用占位 */
  for (const f of fail) {
    const refund = shotCost(outline);
    acts.push({ type: "shotFailed", runsId, shot: f.shot, refund, agentId: id_(), text: shotFailedText(f.shot, f.reason, refund, opts.lang) });
  }
  acts.push({ type: "runsDone", reelId: id_(), outline, runsId });
  return { state: play(), items }; // reel / genFailed / failVideo(视频失败由 ReviewApp 传坏的 reelSrc 触发)
}
