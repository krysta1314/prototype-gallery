/* 评审旅程:每一步 = 用产品自己的 reducer 回放一串真实动作得到的状态,保证评审画面就是产品真实会出现的画面。 */

import { FIXTURE_ITEMS } from "../app/fixture/files";
import { shapeOutline } from "../app/fixture/api";
import type { FixtureData } from "../app/fixture/types";
import type { HomeItem } from "../app/api";
import { answerTranscript, applyAnswers, buildQuestions } from "../app/logic/questions";
import { INITIAL_STATE, agentReducer, type AgentAction, type AgentState, type Lang } from "../app/store";
import { EDITOR_JOURNEYS, type EditorStepId } from "./editorJourneys";

/** 前 15 步:Agent 对话流程 */
export type AgentStepId =
  | "home" | "picked" | "analyzing" | "questions" | "partial" | "plan" | "revised"
  | "generating" | "queued" | "reel" | "failAnalyze" | "failOutline" | "failVideo" | "answerFirst" | "empty";

/** 全部 36 步:Agent 15 步 + 剪辑器 21 步(editorJourneys.ts) */
export type StepId = AgentStepId | EditorStepId;

export type Journey = { id: StepId; group: string; title: string };

export const isEditorStep = (s: StepId): s is EditorStepId => EDITOR_JOURNEYS.some((j) => j.id === s);

export const JOURNEYS: Journey[] = [
  { id: "home", group: "开始", title: "落地页" },
  { id: "picked", group: "开始", title: "已选素材" },
  { id: "analyzing", group: "分析", title: "分析中" },
  { id: "questions", group: "分析", title: "提问卡" },
  { id: "partial", group: "分析", title: "提问卡只问缺项" },
  { id: "plan", group: "方案", title: "分镜表" },
  { id: "revised", group: "方案", title: "改稿后" },
  { id: "generating", group: "生成", title: "生成中" },
  { id: "queued", group: "生成", title: "生成中排队" },
  { id: "reel", group: "交付", title: "成片" },
  { id: "failAnalyze", group: "异常", title: "分析失败" },
  { id: "failOutline", group: "异常", title: "分镜失败" },
  { id: "failVideo", group: "异常", title: "视频加载失败" },
  { id: "answerFirst", group: "异常", title: "未答题先发消息" },
  { id: "empty", group: "异常", title: "空态" },
  ...EDITOR_JOURNEYS,
];

export type ReviewOpts = { lang: Lang; voiceover: boolean; aiShots: "recorded" | 0; failAnalyze: boolean; failOutline: boolean; failVideo: boolean; failShot: boolean };
export const DEFAULT_OPTS: ReviewOpts = { lang: "zh", voiceover: true, aiShots: "recorded", failAnalyze: false, failOutline: false, failVideo: false, failShot: false };

export type Preset = { state: AgentState; items: HomeItem[]; homePrompt?: string; autorun?: "analyze" };

export function buildPreset(id: AgentStepId, opts: ReviewOpts, data: FixtureData): Preset {
  const set = data[opts.lang];
  const zh = opts.lang === "zh";
  const fx = { lang: opts.lang, voiceover: opts.voiceover, aiShots: opts.aiShots, failAnalyze: false, failOutline: false };
  let n = 0;
  const id_ = () => `${id}-${(n += 1)}`;
  const acts: AgentAction[] = [];
  const play = () => acts.reduce(agentReducer, INITIAL_STATE);
  const items = FIXTURE_ITEMS;

  if (id === "home") return { state: INITIAL_STATE, items: [] };
  if (id === "picked") return { state: INITIAL_STATE, items, homePrompt: set.prompt };
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
  acts.push({ type: "thinking", id: t1, text: zh ? `正在看这 ${items.length} 个文件…` : `Reading ${items.length} files…` });
  if (id === "failAnalyze") {
    acts.push({ type: "failed", thinkingId: t1, errId: id_(), retry: "analyze", text: `${zh ? "素材分析失败" : "Couldn't read your footage"}: The model service timed out (simulated)` });
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
    acts.push({ type: "answered", questionsId: qid, brief, userId: id_(), transcript: answerTranscript(questions, answers) });
  }
  const t2 = id_();
  acts.push({ type: "outlineRequested", req: { brief, profiles: set.profiles }, thinkingId: t2, text: zh ? "正在排分镜…" : "Laying out the storyboard…" });
  if (id === "failOutline") {
    acts.push({ type: "failed", thinkingId: t2, errId: id_(), retry: "outline", text: `${zh ? "分镜没排出来" : "Couldn't lay out the storyboard"}: The model service timed out (simulated)` });
    return { state: play(), items };
  }
  const outline = shapeOutline(set.outline, set, fx);
  acts.push({ type: "outlineOk", thinkingId: t2, planId: id_(), outline });
  if (id === "plan" || id === "partial") return { state: play(), items };

  if (id === "revised") {
    acts.push({ type: "said", userId: id_(), text: set.revision });
    const t3 = id_();
    acts.push({ type: "outlineRequested", req: { brief, profiles: set.profiles, revise: { current: outline, change: set.revision } }, thinkingId: t3, text: zh ? "正在排分镜…" : "Laying out the storyboard…" });
    acts.push({ type: "outlineOk", thinkingId: t3, planId: id_(), outline: shapeOutline(set.revised, set, fx) });
    return { state: play(), items };
  }

  acts.push({
    type: "generate",
    agentId: id_(),
    runsId: id_(),
    outline,
    text: zh ? "好，开始生成。AI 补拍在跑的同时，我先把实拍片段、标题卡和片尾卡准备好。" : "Meanwhile, I'll prepare the live footage segments, title card and end card.",
  });
  if (id === "generating") return { state: play(), items };
  if (id === "queued") {
    acts.push({ type: "queued", userId: id_(), text: set.revision });
    return { state: play(), items };
  }
  acts.push({ type: "runsDone", reelId: id_(), outline });
  return { state: play(), items }; // reel / failVideo(失败由 ReviewApp 传坏的 reelSrc 触发)
}
