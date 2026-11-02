/* 评审旅程:每一步 = 用产品自己的 reducer 回放一串真实动作得到的状态,保证评审画面就是产品真实会出现的画面。 */

import { FIXTURE_ITEMS } from "../app/fixture/files";
import { shapeOutline } from "../app/fixture/api";
import { unusableProfiles } from "../app/fixture/transform";
import type { FixtureData } from "../app/fixture/types";
import type { HomeItem } from "../app/api";
import type { CreationType } from "../app/components/CreationTypePicker";
import { answerRows, answerTranscript, applyAnswers, buildQuestions } from "../app/logic/questions";
import { failText, friendlyError } from "../app/logic/errors";
import { reelCost, shotCost, stoppedText } from "../app/logic/credits";
import { applyPrompts, applyScript, continueText, editCost, editFailText, editFailureQuestion, editRetryText, failureQuestion, promptRewrite, rewriteGenerateText, scriptRewrite, voiceFailureQuestion } from "../app/logic/failure";
import { schedule, shotFail, stopRefund, toolRuns, type ShotFail, type ShotFailKind, type VoiceFailKind } from "../app/logic/runs";
import { voiceCost, voiceLines } from "../app/logic/voice";
import { aiShotNumbers } from "../app/logic/storyboard";
import { UPLOAD_INTERRUPTED, pickFiles } from "../app/logic/upload";
import { footageQuestion, summaryFill, unusableText } from "../app/logic/footage";
import { ADDED_FOOTAGE_CHANGE, addedReadingText, addedText } from "../app/logic/followup";
import { CONFIRM_TEXT, INITIAL_STATE, agentReducer, creditGate, readingText, type AgentAction, type AgentState, type Lang } from "../app/store";
import { EDITOR_JOURNEYS, LOW_CREDITS, type EditorStepId } from "./editorJourneys";

/** 前 25 步:Agent 对话流程 */
export type AgentStepId =
  | "picked" | "creationType" | "analyzing" | "questions" | "partial" | "plan" | "revised" | "addFootage"
  | "generating" | "stopped" | "reel"
  | "uploadLimit" | "failAnalyze" | "uploadInterrupted" | "unusable" | "noCredits" | "genFailed" | "genModeration" | "genRewrite" | "genVoiceFailed" | "editFailed" | "failVideo" | "answerFirst" | "sendFailed" | "empty";

/** 全部 54 步:Agent 25 步 + 剪辑器 29 步(editorJourneys.ts,第 1 步进画布、第 2 步剪辑器引导);左栏两部分各自从 1 编号,Inspector 按位置算 */
export type StepId = AgentStepId | EditorStepId;

export type Journey = { id: StepId; group: string; title: string };

export const isEditorStep = (s: StepId): s is EditorStepId => EDITOR_JOURNEYS.some((j) => j.id === s);

export const JOURNEYS: Journey[] = [
  { id: "creationType", group: "开始", title: "切换创作类型" },
  { id: "picked", group: "开始", title: "已选素材" },
  { id: "analyzing", group: "分析", title: "分析中" },
  { id: "questions", group: "分析", title: "提问卡" },
  { id: "partial", group: "分析", title: "提问卡只问缺项" },
  { id: "plan", group: "方案", title: "生成计划" },
  { id: "revised", group: "方案", title: "改稿后" },
  { id: "addFootage", group: "方案", title: "对话里补加素材" },
  { id: "generating", group: "生成", title: "生成中" },
  { id: "stopped", group: "生成", title: "用户手动停止" },
  { id: "reel", group: "交付", title: "成片" },
  { id: "uploadLimit", group: "异常", title: "上传超限" },
  { id: "failAnalyze", group: "异常", title: "分析失败" },
  { id: "uploadInterrupted", group: "异常", title: "上传中断" },
  { id: "unusable", group: "异常", title: "素材不可用" },
  { id: "noCredits", group: "异常", title: "积分不足" },
  { id: "genFailed", group: "异常", title: "生成失败(单镜)" },
  { id: "genModeration", group: "异常", title: "镜头审核未过" },
  { id: "genRewrite", group: "异常", title: "改写 prompt 确认" },
  { id: "genVoiceFailed", group: "异常", title: "配音生成失败" },
  { id: "editFailed", group: "异常", title: "剪辑失败" },
  { id: "failVideo", group: "异常", title: "视频加载失败" },
  { id: "answerFirst", group: "异常", title: "未答题先发消息" },
  { id: "sendFailed", group: "异常", title: "消息发送失败" },
  { id: "empty", group: "异常", title: "空态" },
  ...EDITOR_JOURNEYS,
];

/** 「生成失败(Agent)」的几种:无 / 镜头·繁忙 / 镜头·审核 / 配音·繁忙 / 配音·敏感词 */
export type AgentFail = "none" | "shotBusy" | "shotModeration" | "voiceBusy" | "voiceScript";

/** noCredits:「积分不足」开关,Agent 与剪辑器起始余额都改成 LOW_CREDITS;agentFail:「生成失败(Agent)」,
    Generate 时补拍镜头 agentFailShotFor() 或配音按选的原因失败(只对 Agent 步骤生效);failShot:「补拍生成失败」只对剪辑器生效 */
export type ReviewOpts = {
  lang: Lang;
  voiceover: boolean;
  aiShots: "recorded" | 0;
  failAnalyze: boolean;
  failOutline: boolean;
  failVideo: boolean;
  failShot: boolean;
  noCredits: boolean;
  agentFail: AgentFail;
  /** 「剪辑失败」:生成都成功之后,第一次走到剪辑时失败(只对 Agent 步骤生效) */
  failEdit: boolean;
  /** 「旁白超长」:旁白稿换成更长的一版,成片交付说明里出提速 / 删句 / 字幕拆屏(只对 Agent 步骤生效) */
  longScript: boolean;
  /** 「发送失败」:下一条消息像断网一样发不出去(只对 Agent 步骤生效) */
  failSend: boolean;
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
  agentFail: "none",
  failEdit: false,
  longScript: false,
  failSend: false,
  creationType: "hybrid",
};

export { LOW_CREDITS };

export type Preset = { state: AgentState; items: HomeItem[]; homePrompt?: string; homeNotices?: string[]; homeTypeMenuOpen?: boolean; autorun?: "analyze" };

/** 落地页的步骤:「创作类型」开关只对这些生效 */
export const LANDING_STEPS: StepId[] = ["picked", "creationType", "uploadLimit"];

/** 评审演示会失败的补拍镜头号(从 1 起):第 2 个 AI 补拍,只有一个就第 1 个;没有补拍 = undefined */
export function agentFailShotFor(opts: ReviewOpts, data: FixtureData): number | undefined {
  const set = data[opts.lang];
  const fx = { lang: opts.lang, voiceover: opts.voiceover, aiShots: opts.aiShots, failAnalyze: false, failOutline: false };
  const ai = aiShotNumbers(shapeOutline(set.outline, set, fx));
  return ai[1] ?? ai[0];
}

/** 这一步 / 这组开关下,Generate 时什么会失败:shot + shotKind = 补拍镜头(和原因),voice = 配音(和原因)。
    异常步骤自带失败(生成失败(单镜)= 镜头·繁忙;镜头审核未过 / 改写 prompt 确认 = 镜头·审核;配音生成失败 = 配音·繁忙,开关选「配音·敏感词」时按敏感词);
    剪辑失败这一步只演示剪辑失败(生成都成功);其他 Agent 步骤看「生成失败(Agent)」开关。没有补拍 / 旁白关掉时对应的失败不会发生 */
export function agentFailFor(step: StepId, opts: ReviewOpts, data: FixtureData): { shot?: number; shotKind?: ShotFailKind; voice?: VoiceFailKind } {
  const mode: AgentFail =
    step === "genFailed"
      ? "shotBusy"
      : step === "genModeration" || step === "genRewrite"
        ? "shotModeration"
        : step === "genVoiceFailed"
          ? opts.agentFail === "voiceScript"
            ? "voiceScript"
            : "voiceBusy"
          : step === "editFailed"
            ? "none"
            : opts.agentFail;
  if (mode === "shotBusy" || mode === "shotModeration") {
    const shot = agentFailShotFor(opts, data);
    return shot === undefined ? {} : { shot, shotKind: mode === "shotModeration" ? "moderation" : "busy" };
  }
  if ((mode === "voiceBusy" || mode === "voiceScript") && opts.voiceover) return { voice: mode === "voiceScript" ? "script" : "busy" };
  return {};
}

/** 「上传超限」一次选进来的不合规文件(过 upload.ts 的 pickFiles,提示就是产品原话) */
export const OVER_LIMIT_FILES = [
  { name: "launch-event-full.mov", type: "video/quicktime", size: 1.2 * 1024 ** 3, durationSec: 1460 },
  { name: "factory-tour.mp4", type: "video/mp4", size: 320 * 1024 ** 2, durationSec: 14 * 60 },
  { name: "lookbook-raw.png", type: "image/png", size: 36 * 1024 ** 2 },
  { name: "brand-guidelines.pdf", type: "application/pdf", size: 4 * 1024 ** 2 },
  /* 文件损坏:浏览器打不开、文件头也不是视频容器(选中时探测,见 app/probe.ts) */
  { name: "unboxing-final.mp4", type: "video/mp4", size: 86 * 1024 ** 2, unreadable: true },
];

/** 「风险要求绕开」那一步用户的 prompt:点名明星 + 竞品 + 没法证实的功效(按录好的分镜回放,方案总结末尾加一句) */
export const RISKY_PROMPT: Record<Lang, string> = {
  zh: "制作一条广告,请杨幂出镜,说比兰蔻好用,3天告别干皮,100%有效",
  en: "Make an ad with Taylor Swift in it. Say it works better than La Mer, cures dry skin in 3 days and is 100% effective",
};

/** 「对话里补加素材」那一步补加的文件(复用录好的实拍预览,换个文件名) */
export const ADDED_ITEM: HomeItem = { name: "mist-closeup.mp4", url: "/prototypes/hybrid-reel-agent/fixture/IMG_3716.mp4", kind: "video" };

/** 「对话里补加素材」新一版方案的总结 */
const ADDED_DIRECTION: Record<Lang, string> = {
  zh: "新加的 mist-closeup.mp4 是喷雾的近景实拍,我把它放进了产品特写那一段;它拍不到干皮、黏腻这些痛点画面,所以这两个 AI 补拍镜头保留,其余节奏和卖点不变。",
  en: "The new mist-closeup.mp4 is a close-up of the spray, so I've used it for the product close-up. It doesn't show the dry-skin and sticky-serum pain points, so those two AI shots stay. Everything else is unchanged.",
};

/** 「上传中断」:这个文件断网后自动重传一次仍失败,被跳过 */
export const INTERRUPTED_FILE = 0;

export function buildPreset(id: AgentStepId, opts: ReviewOpts, data: FixtureData): Preset {
  const set = data[opts.lang];
  const zh = opts.lang === "zh";
  const fx = { lang: opts.lang, voiceover: opts.voiceover, aiShots: opts.aiShots, failAnalyze: false, failOutline: false, longScript: opts.longScript };
  let n = 0;
  const id_ = () => `${id}-${(n += 1)}`;
  const acts: AgentAction[] = [];
  const items = FIXTURE_ITEMS;
  /* 与 fixture 出错开关抛的错误一致,经 friendlyError 得到产品显示的那句 + Details 原文 */
  const simErr = friendlyError(new Error("The model service timed out (simulated)"), undefined, opts.lang);
  /* 「积分不足」步骤自身就是余额 LOW_CREDITS;开关打开时 ReviewApp 另外给 AgentProvider 传 initialCredits */
  const start: AgentState = id === "noCredits" ? { ...INITIAL_STATE, credits: LOW_CREDITS } : INITIAL_STATE;
  const play = () => acts.reduce(agentReducer, start);

  /* 落地页 + Creation type 弹层打开:看各创作类型的说明;选哪个,大标题和提示语就换成哪个 */
  if (id === "creationType") return { state: INITIAL_STATE, items: [], homeTypeMenuOpen: true };
  if (id === "picked") return { state: INITIAL_STATE, items, homePrompt: set.prompt };
  if (id === "uploadLimit") {
    /* 已选好素材后又选了一批不合规的:不合规的不加入,顶部出可关闭的提示 toast(评审步骤里不自动消失) */
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
  const b = stated ? set.briefStated : set.brief;
  if (id === "unusable") {
    /* 素材不可用:录好的素材改成大多不可用(fixture/transform.ts),与 provider.analyze 一致 —— 不出常规提问卡,先说哪些不能用、为什么,再问怎么继续 */
    const profiles = unusableProfiles(set.profiles, opts.lang);
    acts.push({ type: "analyzed", profiles });
    const followUp = {
      ai: buildQuestions(b.assumed, b.brief, profiles, opts.lang, { gaps: ["hook", "pain", "proof", "usage", "cta"] }),
      use: buildQuestions(b.assumed, b.brief, profiles, opts.lang),
    };
    acts.push({
      type: "briefed",
      thinkingId: t1,
      analysisId: id_(),
      reply: b.reply,
      brief: b.brief,
      questions: [footageQuestion()],
      questionsId: id_(),
      unusable: { text: unusableText(profiles, opts.lang), followUp },
    });
    return { state: play(), items };
  }
  /* 上传中断:第一个文件断网、自动重传一次仍失败 → 跳过它,其余照常;停在提问卡上 */
  const skippedName = items[INTERRUPTED_FILE].name;
  const profiles = id === "uploadInterrupted" ? set.profiles.filter((p) => p.label !== skippedName) : set.profiles;
  acts.push({ type: "analyzed", profiles });
  /* 提问卡与产品一致,不随 AI 补拍开关变化;该开关只影响分镜表(见 fixture shapeOutline) */
  const questions = buildQuestions(b.assumed, b.brief, profiles, opts.lang);
  const fillTo = summaryFill(questions, b.brief, profiles);
  const qid = id_();
  acts.push({
    type: "briefed",
    thinkingId: t1,
    analysisId: id_(),
    reply: b.reply,
    brief: b.brief,
    questions,
    questionsId: qid,
    ...(fillTo ? { fillTo } : {}),
    ...(id === "uploadInterrupted" ? { skipped: [{ name: skippedName, reason: UPLOAD_INTERRUPTED[opts.lang] }] } : {}),
  });
  if (id === "uploadInterrupted") return { state: play(), items };
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
  const outline = shapeOutline(set.outline, set, fx);
  const planId = id_();
  acts.push({ type: "outlineOk", thinkingId: t2, planId, outline });
  /* 风险要求绕开:分镜就是录好的那一版,方案总结末尾那句由对话页按用户说过的话算出来(logic/risk.ts) */
  if (id === "plan" || id === "partial") return { state: play(), items };
  if (id === "addFootage") {
    /* 与 provider.addFiles 一致:出素材缩略图 → 读新文件 → Agent 一句 → 按新素材重排一版分镜(旧卡变旧版) */
    acts.push({ type: "filesAdded", id: id_(), files: [{ name: ADDED_ITEM.name, url: ADDED_ITEM.url, kind: ADDED_ITEM.kind }], media: [{ key: "fixture:added", url: ADDED_ITEM.url }] });
    const t = id_();
    acts.push({ type: "thinking", id: t, text: addedReadingText(1, opts.lang) });
    acts.push({ type: "addedRead", thinkingId: t, agentId: id_(), text: addedText(1, true, opts.lang) });
    const t3 = id_();
    acts.push({ type: "outlineRequested", req: { brief, profiles: set.profiles, revise: { current: outline, change: ADDED_FOOTAGE_CHANGE } }, thinkingId: t3, text: zh ? "正在排分镜…" : "Laying out the storyboard…" });
    /* 录制数据里没有「补加素材」那一版:沿用原分镜,方案总结换成按新素材重排的说法 */
    acts.push({ type: "outlineOk", thinkingId: t3, planId: id_(), outline: { ...outline, direction: ADDED_DIRECTION[opts.lang] } });
    return { state: play(), items: [...items, ADDED_ITEM] };
  }
  if (id === "sendFailed") {
    /* 与 provider.send 一致:断网时这句标红留在对话里,Agent 不处理 */
    acts.push({ type: "sendFailed", userId: id_(), text: set.revision });
    return { state: play(), items };
  }
  if (id === "noCredits") {
    /* 方案卡点 Confirm:余额不够,不扣费、不开跑,输入框上方出积分不足横条 + Upgrade 键(与 provider.startRun 一致) */
    const blocked = creditGate(LOW_CREDITS, reelCost(outline));
    if (blocked) acts.push(blocked);
    return { state: play(), items };
  }

  if (id === "revised") {
    acts.push({ type: "said", userId: id_(), text: set.revision });
    const t3 = id_();
    acts.push({ type: "outlineRequested", req: { brief, profiles: set.profiles, revise: { current: outline, change: set.revision } }, thinkingId: t3, text: zh ? "正在排分镜…" : "Laying out the storyboard…" });
    acts.push({ type: "outlineOk", thinkingId: t3, planId: id_(), outline: shapeOutline(set.revised, set, fx) });
    return { state: play(), items };
  }

  /* 与 provider.startRun 一致:分镜卡点 Confirm 先出用户气泡 "Confirm";扣分镜预估;异常步骤 / 「生成失败(Agent)」开关带上会失败的补拍镜头或配音 */
  const cost = reelCost(outline);
  const af = agentFailFor(id, opts, data);
  const fail: ShotFail[] = af.shot !== undefined && outline.shots[af.shot - 1]?.source.kind === "generate" ? [shotFail(af.shot, af.shotKind)] : [];
  const voiceFail: VoiceFailKind | undefined = af.voice && voiceLines(outline).length ? af.voice : undefined;
  /* 剪辑失败:本步自带,或「剪辑失败」开关;落在第一轮走到剪辑的那一轮上(这一轮有生成失败就落在续跑上) */
  const editFail = id === "editFailed" || opts.failEdit;
  const firstEdits = !fail.length && !voiceFail;
  const runsId = id_();
  acts.push({
    type: "generate",
    agentId: id_(),
    runsId,
    outline,
    cost,
    ...(fail.length ? { fail } : {}),
    ...(voiceFail ? { voiceFail } : {}),
    ...(editFail && firstEdits ? { editFail: true } : {}),
    confirm: { id: id_(), text: CONFIRM_TEXT },
    text: zh ? "好，开始生成。AI 补拍在跑的同时，我先把实拍片段、标题卡和片尾卡准备好。" : "Meanwhile, I'll prepare the live footage segments, title card and end card.",
  });
  if (id === "generating") return { state: play(), items };
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
  /* 与 provider.runsDone 一致:失败项退回积分;生成结算完有失败就停下来出提问卡(不出带占位的成片) */
  for (const f of fail) acts.push({ type: "shotFailed", runsId, shot: f.shot, refund: shotCost(outline) });
  if (voiceFail) acts.push({ type: "voiceFailed", runsId, refund: voiceCost(outline) });
  let lastRun = runsId;
  let finalOutline = outline;
  if (fail.length || voiceFail) {
    const shots = fail.map((f) => f.shot);
    const shotKind = af.shotKind ?? "busy";
    const question = voiceFail ? voiceFailureQuestion(outline, voiceFail) : failureQuestion(outline, shots, set.profiles, shotKind);
    const askId = id_();
    acts.push({ type: "askFailure", runsId, askId, shots, question, ...(voiceFail ? { voice: voiceFail } : { shotKind }) });
    /* 异常步骤:停在提问卡上,等评审自己选 */
    if (id === "genFailed" || id === "genModeration" || id === "genVoiceFailed") return { state: play(), items };
    /* 其余步骤(改写 prompt 确认 / 成片 / 视频加载失败 + 开关):按推荐项答完 */
    const answers = { failure: { picked: question.defaults, other: "" } };
    acts.push({ type: "failureAnswered", askId, userId: id_(), transcript: answerTranscript([question], answers), rows: answerRows([question], answers) });
    const rewrite = question.defaults[0] === "rewrite";
    if (rewrite) {
      /* 审核没过 / 敏感词:推荐项是改写 → 出改写卡;改写 prompt 确认这一步停在这里等 Generate */
      const p = voiceFail ? scriptRewrite(outline, voiceLines(outline), opts.lang) : promptRewrite(outline, shots, opts.lang);
      const rewriteId = id_();
      acts.push({ type: "rewriteProposed", id: rewriteId, text: p.text, shots, outline, items: p.items, cost: p.cost });
      if (id === "genRewrite") return { state: play(), items };
      finalOutline = voiceFail ? applyScript(outline, p.items[0]?.after ?? "") : applyPrompts(outline, p.items);
      lastRun = id_();
      acts.push({
        type: "continueRun",
        runsId: lastRun,
        agentId: id_(),
        text: rewriteGenerateText(shots, opts.lang),
        outline: finalOutline,
        cost: p.cost,
        ...(voiceFail ? { voiceOnly: true } : { only: shots }),
        ...(editFail ? { editFail: true } : {}),
        resolves: rewriteId,
      });
    } else {
      /* 繁忙:按推荐项 Retry,只重跑失败的镜头 / 配音再剪成片 */
      lastRun = id_();
      acts.push({
        type: "continueRun",
        runsId: lastRun,
        agentId: id_(),
        text: continueText("retry", shots, opts.lang),
        outline,
        cost: voiceFail ? voiceCost(outline) : shotCost(outline) * shots.length,
        ...(voiceFail ? { voiceOnly: true } : { only: shots }),
        ...(editFail ? { editFail: true } : {}),
      });
    }
  }
  if (editFail) {
    /* 与 provider.runsDone 一致:剪辑失败先退基础费,Agent 说一句,出「剪辑失败」那一问 */
    const failedOutline = finalOutline;
    const refund = editCost(failedOutline);
    acts.push({ type: "editFailed", runsId: lastRun, refund });
    const question = editFailureQuestion(failedOutline);
    const askId = id_();
    acts.push({ type: "askFailure", runsId: lastRun, askId, shots: [], edit: true, question, lead: { id: id_(), text: editFailText(failedOutline, refund, opts.lang) } });
    if (id === "editFailed") return { state: play(), items };
    /* 开关打开的其余步骤:按推荐项「Retry the edit」答完,只重剪(扣基础费)再出成片 */
    const answers = { failure: { picked: question.defaults, other: "" } };
    acts.push({ type: "failureAnswered", askId, userId: id_(), transcript: answerTranscript([question], answers), rows: answerRows([question], answers) });
    lastRun = id_();
    acts.push({ type: "continueRun", runsId: lastRun, agentId: id_(), text: editRetryText(opts.lang), outline: failedOutline, cost: refund, editOnly: true });
  }
  acts.push({ type: "runsDone", reelId: id_(), outline: finalOutline, runsId: lastRun });
  return { state: play(), items }; // reel / failVideo;异常步骤里对应的失败没发生(没有补拍 / 旁白关掉)时也落到成片(视频失败由 ReviewApp 传坏的 reelSrc 触发)
}
