"use client";

/* Hybrid Reel Agent 的状态容器与动作函数。reducer 在 store.ts;这里只做异步编排:
   调 api、生成 id、按顺序 dispatch。开发原型注入 liveApi,评审原型注入 fixtureApi —— 两边走的是同一套动作。 */

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type MutableRefObject, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { putMedia } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/handoff";
import { HANDOFF_KEY, type Handoff, type Outline } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";
import type { AgentApi, HomeItem } from "./api";
import { reelCost, shotCost, stoppedText, UPGRADE_TOAST } from "./logic/credits";
import {
  applyPrompts,
  applyScript,
  continueText,
  editCost,
  editFailText,
  editFailureQuestion,
  editPlan,
  editRetryText,
  failureAnswer,
  failureKind,
  failureQuestion,
  promptRewrite,
  rewriteGenerateText,
  scriptRewrite,
  shotPlan,
  voiceFailureQuestion,
  voicePlan,
  type FailureChoice,
  type VoiceChoice,
} from "./logic/failure";
import { failText, friendlyError, isAbort } from "./logic/errors";
import { ADDED_FOOTAGE_CHANGE, addedReadingText, addedText, mergeProfiles, redoCost, redoText } from "./logic/followup";
import { DOWNLOAD_FAILED } from "./download";
import { schedule, shotFail, stopRefund, toolRuns, type ShotFail, type ShotFailKind, type VoiceFailKind } from "./logic/runs";
import { voiceCost, voiceLines } from "./logic/voice";
import { answerRows, answerTranscript, applyAnswers, buildQuestions, type Answers, type Question } from "./logic/questions";
import { footageBrief, footageChoice, footageQuestion, footageUnusable, summaryFill, unusableText } from "./logic/footage";
import {
  CONFIRM_TEXT,
  planCancelledText,
  INITIAL_STATE,
  agentReducer,
  creditGate,
  detectLang,
  findRun,
  latestOutline,
  pendingAsk,
  pendingRetry,
  pendingRewrite,
  readingText,
  type AgentState,
  type OutlineReq,
} from "./store";

export type AgentActions = {
  start(items: HomeItem[], prompt: string): void;
  analyze(): void;
  answer(questionsId: string, questions: Question[], a: Answers): void;
  send(text: string): void;
  /** 发送失败气泡上的 Retry:移走那条,按正常发送再走一遍 */
  resend(userId: string): void;
  /** 对话里用「+」补加素材:读新文件、并入素材;已有方案就按新素材重排一版(异常处理 spec 第 17 条) */
  addFiles(items: HomeItem[]): void;
  /** 成片 ⋯ → Redo a shot:弹勾选框 */
  redoShots(outline: Outline, picked?: number[]): void;
  /** 勾选框里点 Redo:查余额、扣这几镜的积分,只重跑这几镜再剪(异常处理 spec 第 20 条) */
  confirmRedo(shots: number[]): void;
  /** 方案卡的 Generate:先查余额,够就扣分镜预估并开跑;不够不扣费,进入积分不足状态(横条 + Upgrade) */
  generate(outline: Outline): void;
  /** 停止后卡片上的 Retry:按同一份分镜重新整体生成(查余额、扣费;不再出「Confirm」气泡) */
  retryRun(outline: Outline): void;
  /** 成片卡的 Regenerate:先弹确认 */
  regenerate(outline: Outline): void;
  /** 确认弹窗里点 Regenerate:查余额后开跑 */
  confirmRegenerate(): void;
  /** 工具区跑完(runsId = 那个工具区) */
  runsDone(outline: Outline, runsId?: string): void;
  /** 工具区里某个补拍镜头失败(到了它的结束时间):退回这一镜的积分 */
  shotFailed(runsId: string, shot: number): void;
  /** 工具区里配音失败(到了它的结束时间):退回配音的积分 */
  voiceFailed(runsId: string): void;
  /** 生成中点 Stop */
  stop(): void;
  /** 回答失败提问卡(选项见 logic/failure.ts):要生成的(Retry / 换模型 / 换参考图 / 重做配音 / 换音色)查余额、扣费、只重跑那一项再剪;
      不生成的(用素材 / 产品图 / 删掉 / 不要配音)直接剪;改写 → 出改写卡等 Generate;Other = 改稿 */
  answerFailure(askId: string, a: Answers): void;
  /** 改写卡的 Generate:查余额、扣费,用(可能改过的)新 prompt / 新旁白稿重跑那一项再剪。texts = 每项改写后的全文,不传用卡上的 */
  generateRewrite(rewriteId: string, texts?: string[]): void;
  /** 旧版分镜 "Use this version" */
  useVersion(planId: string): void;
  /** 方案卡的 Cancel:卡片标 Cancelled,Agent 回一句 */
  cancelPlan(planId: string): void;
  /** 成片 ⋯ → Delete:先弹确认 */
  deleteReel(reelId: string): void;
  confirmDelete(): void;
  undoDelete(): void;
  closeDialog(): void;
  /** 成片下载失败:toast「Download failed — try again」+ Retry(重下这个文件) */
  downloadFailed(url: string, fileName: string): void;
  /** 积分不足横条的 Upgrade / Upgrade to continue(原型不做升级,只出 toast) */
  upgrade(): void;
  toast(text: string): void;
  dismissToast(id: string): void;
  retry(kind: "analyze" | "outline"): void;
  /** 取消进行中的素材分析 */
  cancel(): void;
  openCanvas(outline: Outline): void;
  showEmpty(): void;
};

/** runClock:当前在跑的工具区登记的计时器(返回已跑了多少 ms),Stop 用它算停在哪一行;
    homeItems:落地页预填的素材(素材不可用选「Add more footage」回落地页时 = 这次的全部素材,带 File) */
type Ctx = { state: AgentState; actions: AgentActions; reelSrc?: string; runClock: MutableRefObject<() => number>; homeItems: HomeItem[] };
const AgentContext = createContext<Ctx | null>(null);

let seq = 0;
const nextId = () => `m${Date.now().toString(36)}-${(seq += 1)}`;

export function AgentProvider({
  api,
  initialState = INITIAL_STATE,
  initialItems = [],
  autorun,
  reelSrc,
  onOpenCanvas,
  initialCredits,
  failShot,
  failKind = "busy",
  failVoice,
  failEdit,
  failSend,
  children,
}: {
  api: AgentApi;
  initialState?: AgentState;
  initialItems?: HomeItem[];
  autorun?: "analyze";
  reelSrc?: string;
  /** 评审原型注入:Edit in canvas 不跳页,交给外层切到剪辑器步骤;不传时照旧写 sessionStorage 跳画布 */
  onOpenCanvas?: (handoff: Handoff) => void;
  /** 起始余额;不传用 initialState.credits(默认 35,600)。评审「积分不足」开关传 LOW_CREDITS(2) */
  initialCredits?: number;
  /** 评审演示用:这个镜头号(从 1 起)的补拍第一次生成时失败。开发原型不传 */
  failShot?: number;
  /** failShot 失败的原因:busy(默认,临时故障)/ moderation(审核没过) */
  failKind?: ShotFailKind;
  /** 评审演示用:配音第一次生成时失败(busy = 服务繁忙 / script = 旁白稿含敏感词)。开发原型不传 */
  failVoice?: VoiceFailKind;
  /** 评审演示用:第一次走到剪辑(所有生成都成功之后)时剪辑失败。开发原型不传 */
  failEdit?: boolean;
  /** 评审演示用:下一条消息发送失败(像断网)。开发原型不传,只看浏览器是否离线 */
  failSend?: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const [state, dispatch] = useReducer(agentReducer, initialState, (s) => (initialCredits === undefined ? s : { ...s, credits: initialCredits }));
  /* 异步流程里读最新状态;动作函数里凡是刚 dispatch 完就要用的值都显式传参,不依赖这个 ref */
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  /* File 对象不进 reducer 状态(评审原型没有 File,只有预览 URL) */
  const itemsRef = useRef<HomeItem[]>(initialItems);
  const [homeItems, setHomeItems] = useState<HomeItem[]>(initialItems);
  /* 防连点:请求在途 / 生成在跑时,用户触发的动作直接忽略。用 ref 而不是 state —— 同一个 tick 里的第二次点击读不到还没渲染的 state */
  const inFlight = useRef(false);
  /* 评审预置可能直接从「生成中」挂上,所以用初始状态起步 */
  const runningRef = useRef(initialState.generating);
  /* 进行中的分析;Cancel 调它的 abort() */
  const abortRef = useRef<AbortController | null>(null);
  /* 工具区登记的计时器;Stop 读它 */
  const runClock = useRef<() => number>(() => 0);
  /* failShot 只在第一次生成这一镜时失败 */
  const failedOnce = useRef(new Set<number>());
  /* failVoice 只在第一次生成配音时失败 */
  const voiceFailedOnce = useRef(false);
  /* failEdit 只在第一次走到剪辑时失败 */
  const editFailedOnce = useRef(false);
  /* failSend 只让第一条消息发送失败,Retry 后照常 */
  const sendFailedOnce = useRef(false);
  /** 这一轮会不会剪辑失败:pauses = 这一轮生成结算完就要停下来问(不会走到剪辑),这时不消耗这次失败 */
  const takeEditFail = useCallback(
    (pauses: boolean) => {
      if (!failEdit || pauses || editFailedOnce.current) return false;
      editFailedOnce.current = true;
      return true;
    },
    [failEdit],
  );

  const requestOutline = useCallback(
    async (req: OutlineReq, lang: AgentState["lang"]) => {
      inFlight.current = true;
      const thinkingId = nextId();
      dispatch({ type: "outlineRequested", req, thinkingId, text: lang === "zh" ? "正在排分镜…" : "Laying out the storyboard…" });
      try {
        const outline = await api.outline(req);
        dispatch({ type: "outlineOk", thinkingId, planId: nextId(), outline });
      } catch (e) {
        const f = friendlyError(e, undefined, lang);
        dispatch({
          type: "failed",
          thinkingId,
          errId: nextId(),
          retry: "outline",
          text: failText(lang === "zh" ? "分镜没排出来" : "Couldn't lay out the storyboard", f, lang),
          details: f.details,
        });
      } finally {
        inFlight.current = false;
      }
    },
    [api],
  );

  /* ctx 只在 start 时传:刚 dispatch 的 prompt / lang 还没同步进 stateRef;Retry 与 autorun 从 state 读 */
  const analyze = useCallback(async (ctx?: { prompt: string; lang: AgentState["lang"] }) => {
    const { prompt, lang } = ctx ?? stateRef.current;
    inFlight.current = true;
    const items = itemsRef.current;
    const thinkingId = nextId();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    dispatch({ type: "thinking", id: thinkingId, text: readingText(0, items.length, lang), cancellable: true });
    try {
      const { profiles, skipped } = await api.analyze(items, lang, {
        signal: ctrl.signal,
        onProgress: (done, total) => {
          if (!ctrl.signal.aborted) dispatch({ type: "progress", id: thinkingId, text: readingText(done, total, lang) });
        },
      });
      ctrl.signal.throwIfAborted();
      dispatch({ type: "analyzed", profiles });
      const b = await api.brief(prompt, profiles, lang);
      /* brief 不支持中途取消:回来后发现已取消就丢掉结果 */
      ctrl.signal.throwIfAborted();
      /* 素材不可用(没有产品图且能用的不到 3 秒):不出常规提问卡,先说清哪些不能用、为什么,问怎么继续;两种继续方式的提问先备好 */
      if (footageUnusable(profiles)) {
        const followUp = {
          ai: buildQuestions(b.assumed, b.brief, profiles, lang, { gaps: ["hook", "pain", "proof", "usage", "cta"] }),
          use: buildQuestions(b.assumed, b.brief, profiles, lang),
        };
        dispatch({
          type: "briefed",
          thinkingId,
          analysisId: nextId(),
          reply: b.reply,
          brief: b.brief,
          questions: [footageQuestion()],
          questionsId: nextId(),
          skipped,
          unusable: { text: unusableText(profiles, lang), followUp },
        });
        abortRef.current = null;
        return;
      }
      const questions = buildQuestions(b.assumed, b.brief, profiles, lang);
      const fillTo = summaryFill(questions, b.brief, profiles);
      dispatch({ type: "briefed", thinkingId, analysisId: nextId(), reply: b.reply, brief: b.brief, questions, questionsId: nextId(), skipped, ...(fillTo ? { fillTo } : {}) });
      abortRef.current = null;
      if (!questions.length) await requestOutline({ brief: b.brief, profiles }, lang);
    } catch (e) {
      const zh = lang === "zh";
      if (ctrl.signal.aborted || isAbort(e)) {
        dispatch({ type: "failed", thinkingId, errId: nextId(), retry: "analyze", text: zh ? "已取消分析" : "Analysis cancelled", cancelled: true });
      } else {
        const f = friendlyError(e, undefined, lang);
        dispatch({
          type: "failed",
          thinkingId,
          errId: nextId(),
          retry: "analyze",
          text: failText(zh ? "素材分析失败" : "Couldn't read your footage", f, lang),
          details: f.details,
        });
      }
    } finally {
      if (abortRef.current === ctrl) abortRef.current = null;
      inFlight.current = false;
    }
  }, [api, requestOutline]);

  /* Generate / Regenerate / Retry 共用:查余额 → 扣费开跑;不够进入积分不足状态(输入框上方横条 + Upgrade),不扣费、不开跑 */
  const startRun = useCallback(
    (outline: Outline, confirm?: boolean) => {
      if (runningRef.current || inFlight.current) return;
      const s = stateRef.current;
      const cost = reelCost(outline);
      const blocked = creditGate(s.credits, cost);
      if (blocked) {
        dispatch(blocked);
        return;
      }
      const zh = s.lang === "zh";
      const fail: ShotFail[] = [];
      if (failShot !== undefined && !failedOnce.current.has(failShot) && outline.shots[failShot - 1]?.source.kind === "generate") {
        failedOnce.current.add(failShot);
        fail.push(shotFail(failShot, failKind));
      }
      let voiceFail: VoiceFailKind | undefined;
      if (failVoice && !voiceFailedOnce.current && voiceLines(outline).length) {
        voiceFailedOnce.current = true;
        voiceFail = failVoice;
      }
      const editFail = takeEditFail(Boolean(fail.length || voiceFail));
      runningRef.current = true;
      dispatch({
        type: "generate",
        agentId: nextId(),
        runsId: nextId(),
        outline,
        cost,
        ...(fail.length ? { fail } : {}),
        ...(voiceFail ? { voiceFail } : {}),
        ...(editFail ? { editFail } : {}),
        /* 分镜卡的 Confirm:像 Claude 那样先留一个用户气泡(按钮文案是英文,气泡也用英文) */
        ...(confirm ? { confirm: { id: nextId(), text: CONFIRM_TEXT } } : {}),
        text: zh
          ? "好，开始生成。AI 补拍在跑的同时，我先把实拍片段、标题卡和片尾卡准备好。"
          : "Meanwhile, I'll prepare the live footage segments, title card and end card.",
      });
    },
    [failShot, failKind, failVoice, takeEditFail],
  );

  /* 单镜失败:退回这一镜的积分(失败卡上写原因和退款,不出回复);同一镜只退一次 */
  const reportShotFailed = useCallback((runsId: string, shot: number) => {
    const s = stateRef.current;
    const run = findRun(s.messages, runsId);
    const f = run?.fail?.find((x) => x.shot === shot);
    if (!run || !f || run.refundedShots?.includes(shot) || run.stoppedAtMs !== undefined) return;
    const act = { type: "shotFailed", runsId, shot, refund: shotCost(run.outline) } as const;
    /* 同步更新 ref,同一个 tick 里紧接着的 stop / runsDone 能看到这次退款 */
    stateRef.current = agentReducer(s, act);
    dispatch(act);
  }, []);

  /* 配音失败:退回配音的积分;只退一次 */
  const reportVoiceFailed = useCallback((runsId: string) => {
    const s = stateRef.current;
    const run = findRun(s.messages, runsId);
    if (!run?.voiceFail || run.voiceRefunded || run.stoppedAtMs !== undefined) return;
    const act = { type: "voiceFailed", runsId, refund: voiceCost(run.outline) } as const;
    stateRef.current = agentReducer(s, act);
    dispatch(act);
  }, []);

  const actions = useMemo<AgentActions>(
    () => {
      /* self:send 在失败提问卡待答时转给 answerFailure */
      const self: AgentActions = {
      start(items, prompt) {
        if (inFlight.current) return;
        const id = `hra-${Date.now().toString(36)}`;
        const media = items.map((it, i) => ({ key: `${id}:${i}`, url: it.url }));
        items.forEach((it, i) => it.file && void putMedia(`${id}:${i}`, it.file));
        itemsRef.current = items;
        /* 没写 prompt 时按浏览器语言回复 */
        const lang = detectLang(prompt, typeof navigator !== "undefined" && /^zh/i.test(navigator.language) ? "zh" : "en");
        dispatch({
          type: "start",
          prompt,
          lang,
          files: items.map(({ name, url, kind }) => ({ name, url, kind })),
          media,
          ids: { files: nextId(), user: nextId() },
        });
        void analyze({ prompt, lang });
      },
      analyze() {
        if (inFlight.current) return;
        void analyze();
      },
      answer(questionsId, questions, a) {
        const s = stateRef.current;
        if (!s.brief || inFlight.current) return;
        /* 素材不可用那一问:补传 → 回落地页(素材留着);AI 补拍全部 / 硬做 / Other → 接着出常规提问卡,没有要问的就直接排分镜 */
        if (questions[0]?.id === "footage") {
          const msg = s.messages.find((m) => m.id === questionsId);
          const ans = footageChoice(a.footage);
          const rows = { transcript: answerTranscript(questions, a), rows: answerRows(questions, a) };
          if ("choice" in ans && ans.choice === "more") {
            setHomeItems(itemsRef.current);
            dispatch({ type: "backHome" });
            return;
          }
          const brief = footageBrief(s.brief, ans);
          const next = msg?.kind === "questions" && msg.followUp ? ("choice" in ans && ans.choice === "ai" ? msg.followUp.ai : msg.followUp.use) : [];
          dispatch({ type: "answered", questionsId, brief, userId: nextId(), ...rows, ...(next.length ? { follow: { id: nextId(), questions: next } } : {}) });
          if (!next.length) void requestOutline({ brief, profiles: s.profiles }, s.lang);
          return;
        }
        const brief = applyAnswers(s.brief, questions, a, s.lang);
        dispatch({ type: "answered", questionsId, brief, userId: nextId(), transcript: answerTranscript(questions, a), rows: answerRows(questions, a) });
        void requestOutline({ brief, profiles: s.profiles }, s.lang);
      },
      send(text) {
        const s = stateRef.current;
        /* 发送失败(断网):消息留在对话里标红,Agent 不处理;点 Retry 再发(异常处理 spec 第 19 条) */
        const offline = typeof navigator !== "undefined" && navigator.onLine === false;
        if (offline || (failSend && !sendFailedOnce.current)) {
          sendFailedOnce.current = true;
          dispatch({ type: "sendFailed", userId: nextId(), text });
          return;
        }
        if (runningRef.current) {
          dispatch({ type: "queued", userId: nextId(), text });
          return;
        }
        if (inFlight.current) return;
        /* 失败提问卡还没回答时在输入框说的话 = 那一问的 Other */
        const ask = pendingAsk(s.messages);
        if (ask) {
          self.answerFailure(ask.id, { failure: { picked: [], other: text } });
          return;
        }
        /* 改写卡还没点 Generate 就说了别的:这一轮放弃(没用上的基础费退回),按改稿处理,基于这一轮的分镜重排 */
        const rw = pendingRewrite(s.messages);
        if (rw) {
          dispatch({ type: "rewriteDropped", rewriteId: rw.id, refund: rw.outline.credits.base });
          dispatch({ type: "said", userId: nextId(), text });
          if (s.brief) void requestOutline({ brief: s.brief, profiles: s.profiles, revise: { current: rw.outline, change: [...s.queue, text].join("\n") } }, s.lang);
          return;
        }
        const current = latestOutline(s.messages);
        if (!s.brief || !current) {
          const hasQuestions = s.messages.some((m) => m.kind === "questions");
          const analyzeFailed = pendingRetry(s) === "analyze";
          const zh = s.lang === "zh";
          dispatch({
            type: "said",
            userId: nextId(),
            text,
            hint: {
              id: nextId(),
              text: hasQuestions
                ? zh
                  ? "先在上面的卡片里选一下,我再排分镜。"
                  : "Pick your answers in the card above and I'll lay out the storyboard."
                : analyzeFailed
                  ? zh
                    ? "素材还没读完,点上面的 Retry 再试一次。"
                    : "I haven't finished reading your footage — hit Retry above."
                  : zh
                  ? "分镜还没排出来,点上面的 Retry 再试一次。"
                  : "The storyboard isn't ready yet — hit Retry above to try again.",
            },
          });
          return;
        }
        dispatch({ type: "said", userId: nextId(), text });
        void requestOutline({ brief: s.brief, profiles: s.profiles, revise: { current, change: text } }, s.lang);
      },
      resend(userId) {
        const m = stateRef.current.messages.find((x) => x.id === userId);
        if (m?.kind !== "user" || !m.failed) return;
        if (typeof navigator !== "undefined" && navigator.onLine === false) return;
        dispatch({ type: "resent", userId });
        self.send(m.text);
      },
      addFiles(items) {
        if (!items.length || runningRef.current || inFlight.current) return;
        const s = stateRef.current;
        const base = `hra-${Date.now().toString(36)}`;
        const media = items.map((it, i) => ({ key: `${base}:${i}`, url: it.url }));
        items.forEach((it, i) => it.file && void putMedia(`${base}:${i}`, it.file));
        itemsRef.current = [...itemsRef.current, ...items];
        dispatch({ type: "filesAdded", id: nextId(), files: items.map(({ name, url, kind }) => ({ name, url, kind })), media });
        void (async () => {
          inFlight.current = true;
          const lang = s.lang;
          const thinkingId = nextId();
          dispatch({ type: "thinking", id: thinkingId, text: addedReadingText(items.length, lang) });
          try {
            const { profiles } = await api.analyze(items, lang);
            const merged = mergeProfiles(stateRef.current.profiles, profiles);
            dispatch({ type: "analyzed", profiles: merged });
            const current = latestOutline(stateRef.current.messages);
            const replan = Boolean(current && s.brief);
            dispatch({ type: "addedRead", thinkingId, agentId: nextId(), text: addedText(items.length, replan, lang) });
            inFlight.current = false;
            if (replan) await requestOutline({ brief: s.brief!, profiles: merged, revise: { current: current!, change: ADDED_FOOTAGE_CHANGE } }, lang);
          } catch (e) {
            const f = friendlyError(e, undefined, lang);
            dispatch({ type: "failed", thinkingId, errId: nextId(), text: failText(lang === "zh" ? "新素材没读出来" : "Couldn't read the new files", f, lang), details: f.details });
          } finally {
            inFlight.current = false;
          }
        })();
      },
      redoShots(outline, picked) {
        if (runningRef.current || inFlight.current) return;
        dispatch({ type: "dialog", dialog: { kind: "redoShots", outline, ...(picked?.length ? { picked } : {}) } });
      },
      confirmRedo(shots) {
        const s = stateRef.current;
        const d = s.dialog;
        if (d?.kind !== "redoShots" || !shots.length || runningRef.current || inFlight.current) return;
        const cost = redoCost(d.outline, shots);
        const blocked = creditGate(s.credits, cost);
        if (blocked) {
          dispatch(blocked);
          return;
        }
        runningRef.current = true;
        dispatch({ type: "continueRun", runsId: nextId(), agentId: nextId(), text: redoText(shots, s.lang), outline: d.outline, cost, only: shots });
      },
      generate(outline) {
        startRun(outline, true);
      },
      retryRun(outline) {
        startRun(outline, false);
      },
      regenerate(outline) {
        if (runningRef.current || inFlight.current) return;
        dispatch({ type: "dialog", dialog: { kind: "regenerate", outline, cost: reelCost(outline) } });
      },
      confirmRegenerate() {
        const d = stateRef.current.dialog;
        if (d?.kind !== "regenerate") return;
        startRun(d.outline);
      },
      runsDone(outline, runsId) {
        if (!runningRef.current) return;
        const s = stateRef.current;
        const run = findRun(s.messages, runsId);
        if (run?.stoppedAtMs !== undefined) return;
        runningRef.current = false;
        /* 失败项的退款兜底:计时器没来得及报的,这里补上 */
        for (const f of run?.fail ?? []) reportShotFailed(run!.id, f.shot);
        if (run?.voiceFail) reportVoiceFailed(run.id);
        /* 有镜头失败:不出带占位的成片,停下来问怎么继续(选项按失败原因变,见 logic/failure.ts);镜头和配音都失败时先问镜头 */
        const failed = (run?.fail ?? []).map((f) => f.shot);
        if (run && failed.length) {
          const shotKind = failureKind(run.fail ?? []);
          dispatch({
            type: "askFailure",
            runsId: run.id,
            askId: nextId(),
            shots: failed,
            shotKind,
            question: failureQuestion(run.outline, failed, s.profiles, shotKind),
            ...(run.voiceFail ? { held: run.voiceFail } : {}),
          });
          return;
        }
        /* 配音失败(或镜头那一问之后带过来的配音失败):问配音怎么办 */
        const voice = run?.voiceFail ?? run?.held;
        if (run && voice) {
          dispatch({ type: "askFailure", runsId: run.id, askId: nextId(), shots: [], voice, question: voiceFailureQuestion(run.outline, voice) });
          return;
        }
        /* 剪辑 / 渲染失败:已生成的镜头和配音留着,先退基础费,问重剪还是进画布(异常处理 spec 第 8 条) */
        if (run?.editFail) {
          const refund = editCost(run.outline);
          if (!run.editRefunded) dispatch({ type: "editFailed", runsId: run.id, refund });
          dispatch({
            type: "askFailure",
            runsId: run.id,
            askId: nextId(),
            shots: [],
            edit: true,
            question: editFailureQuestion(run.outline),
            lead: { id: nextId(), text: editFailText(run.outline, refund, s.lang) },
          });
          return;
        }
        const queued = s.queue;
        dispatch({ type: "runsDone", reelId: nextId(), outline, runsId: run?.id });
        /* 生成中排队的话:合成一句改稿要求,基于刚交付的这一版 */
        if (queued.length && s.brief) void requestOutline({ brief: s.brief, profiles: s.profiles, revise: { current: outline, change: queued.join("\n") } }, s.lang);
      },
      shotFailed(runsId, shot) {
        reportShotFailed(runsId, shot);
      },
      voiceFailed(runsId) {
        reportVoiceFailed(runsId);
      },
      stop() {
        if (!runningRef.current) return;
        const s = stateRef.current;
        const run = findRun(s.messages);
        if (!run || run.stoppedAtMs !== undefined) return;
        const atMs = Math.max(0, runClock.current());
        const runs = toolRuns(run.outline, { only: run.only, editOnly: run.editOnly, voiceOnly: run.voiceOnly });
        const slots = schedule(runs);
        /* 停之前已经到点失败、还没报的镜头 / 配音先退款,免得算两遍 */
        for (const f of run.fail ?? []) {
          const slot = slots.find((x) => x.id === `gen-${f.shot - 1}`);
          if (slot && slot.endMs <= atMs) reportShotFailed(run.id, f.shot);
        }
        const audio = slots.find((x) => x.id === "audio");
        if (run.voiceFail && audio && audio.endMs <= atMs) reportVoiceFailed(run.id);
        const fresh = findRun(stateRef.current.messages, run.id) ?? run;
        const refund = stopRefund({ outline: run.outline, charged: run.charged, refunded: fresh.refunded ?? 0, runs, slots, atMs, fail: run.fail, voiceFail: !!run.voiceFail });
        runningRef.current = false;
        dispatch({ type: "stopped", runsId: run.id, atMs, refund, agentId: nextId(), text: stoppedText(refund, s.lang) });
        const queued = s.queue;
        const current = latestOutline(s.messages);
        if (queued.length && s.brief && current)
          void requestOutline({ brief: s.brief, profiles: s.profiles, revise: { current, change: queued.join("\n") } }, s.lang);
      },
      answerFailure(askId, a) {
        if (runningRef.current || inFlight.current) return;
        const s = stateRef.current;
        const ask = s.messages.find((m) => m.id === askId);
        if (ask?.kind !== "ask") return;
        const ans = failureAnswer(a, ask.question);
        const answered = { type: "failureAnswered", askId, userId: nextId(), transcript: answerTranscript([ask.question], a), rows: answerRows([ask.question], a) } as const;
        if ("other" in ans) {
          /* Other:放弃这一轮(没剪的基础费退回;剪辑失败那一问的基础费失败时已退),按改稿处理 —— 和在输入框里说一样,基于这一轮的分镜重排;生成中排队的话一起带上 */
          dispatch({ ...answered, refund: ask.edit ? 0 : ask.outline.credits.base });
          if (!s.brief) return;
          const change = [...s.queue, ans.other].join("\n");
          void requestOutline({ brief: s.brief, profiles: s.profiles, revise: { current: ask.outline, change } }, s.lang);
          return;
        }
        const zh = s.lang === "zh";
        /* 剪辑失败那一问:进画布 = 带着这一轮的分镜进画布自己剪(不扣费);重剪 = 查余额、扣基础费,只重跑剪辑 */
        if (ask.edit) {
          if (ans.choice === "canvas") {
            dispatch(answered);
            self.openCanvas(ask.outline);
            return;
          }
          const plan = editPlan(ask.outline);
          const blocked = creditGate(s.credits, plan.cost);
          if (blocked) {
            dispatch(blocked);
            return;
          }
          dispatch(answered);
          runningRef.current = true;
          dispatch({ type: "continueRun", runsId: nextId(), agentId: nextId(), text: editRetryText(s.lang), outline: plan.outline, cost: plan.cost, ...plan.mode, ...(takeEditFail(false) ? { editFail: true } : {}) });
          return;
        }
        /* 改写:不扣费、不开跑,出 Agent 一句 + 改写卡,等用户点 Generate */
        if (ans.choice === "rewrite") {
          const p = ask.voice ? scriptRewrite(ask.outline, voiceLines(ask.outline), s.lang) : promptRewrite(ask.outline, ask.shots, s.lang);
          dispatch(answered);
          dispatch({ type: "rewriteProposed", id: nextId(), text: p.text, shots: ask.voice ? [] : ask.shots, outline: ask.outline, items: p.items, cost: p.cost, ...(ask.held ? { held: ask.held } : {}) });
          return;
        }
        const plan = ask.voice ? voicePlan(ans.choice as VoiceChoice, ask.outline) : shotPlan(ans.choice as FailureChoice, ask.outline, ask.shots, s.profiles);
        /* 余额不够:不扣费、提问卡留着,出积分不足横条 */
        const blocked = creditGate(s.credits, plan.cost);
        if (blocked) {
          dispatch(blocked);
          return;
        }
        dispatch(answered);
        runningRef.current = true;
        dispatch({
          type: "continueRun",
          runsId: nextId(),
          agentId: nextId(),
          text: continueText(ans.choice as FailureChoice | VoiceChoice, ask.shots, zh ? "zh" : "en", plan.voiceLabel),
          outline: plan.outline,
          cost: plan.cost,
          ...plan.mode,
          ...(ask.held ? { held: ask.held } : {}),
          ...(takeEditFail(Boolean(ask.held)) ? { editFail: true } : {}),
        });
      },
      generateRewrite(rewriteId, texts) {
        if (runningRef.current || inFlight.current) return;
        const s = stateRef.current;
        const rw = s.messages.find((m) => m.id === rewriteId);
        if (rw?.kind !== "rewrite" || rw.status) return;
        const blocked = creditGate(s.credits, rw.cost);
        if (blocked) {
          dispatch(blocked);
          return;
        }
        const items = rw.items.map((it, i) => ({ ...it, after: texts?.[i]?.trim() || it.after }));
        const voice = !rw.shots.length;
        runningRef.current = true;
        dispatch({
          type: "continueRun",
          runsId: nextId(),
          agentId: nextId(),
          text: rewriteGenerateText(rw.shots, s.lang),
          outline: voice ? applyScript(rw.outline, items[0]?.after ?? "") : applyPrompts(rw.outline, items),
          cost: rw.cost,
          ...(voice ? { voiceOnly: true } : { only: rw.shots }),
          ...(rw.held ? { held: rw.held } : {}),
          ...(takeEditFail(Boolean(rw.held)) ? { editFail: true } : {}),
          resolves: rw.id,
        });
      },
      useVersion(planId) {
        if (runningRef.current || inFlight.current) return;
        dispatch({ type: "reusePlan", fromId: planId, planId: nextId() });
      },
      cancelPlan(planId) {
        if (runningRef.current || inFlight.current) return;
        dispatch({ type: "planCancelled", planId, agentId: nextId(), text: planCancelledText(stateRef.current.lang) });
      },
      deleteReel(reelId) {
        /* 成片(重)生成或单镜重试在跑时不让删:重试会就地改这张卡,删了白扣积分,撤销还会捞回旧片再让人付费重试 */
        if (runningRef.current || inFlight.current) return;
        dispatch({ type: "dialog", dialog: { kind: "deleteReel", reelId } });
      },
      confirmDelete() {
        const d = stateRef.current.dialog;
        if (d?.kind !== "deleteReel" || runningRef.current || inFlight.current) return;
        dispatch({ type: "reelDeleted", reelId: d.reelId, toastId: nextId(), text: "Reel deleted" });
      },
      undoDelete() {
        dispatch({ type: "deleteUndone" });
      },
      closeDialog() {
        dispatch({ type: "dialog", dialog: null });
      },
      downloadFailed(url, fileName) {
        dispatch({ type: "toast", toast: { id: nextId(), text: DOWNLOAD_FAILED, retry: { url, fileName } } });
      },
      upgrade() {
        dispatch({ type: "toast", toast: { id: nextId(), text: UPGRADE_TOAST } });
      },
      toast(text) {
        dispatch({ type: "toast", toast: { id: nextId(), text } });
      },
      dismissToast(id) {
        dispatch({ type: "toastDismissed", id });
      },
      retry(kind) {
        if (inFlight.current) return;
        const s = stateRef.current;
        dispatch({ type: "retryStarted" });
        if (kind === "analyze") void analyze();
        else if (s.lastOutlineReq) void requestOutline(s.lastOutlineReq, s.lang);
      },
      cancel() {
        abortRef.current?.abort();
      },
      openCanvas(outline) {
        /* 与 Regenerate 同一条规矩:成片(重)生成或单镜重试在跑时不进画布 */
        if (runningRef.current || inFlight.current) return;
        const s = stateRef.current;
        if (!s.brief) return;
        const handoff: Handoff = { brief: s.brief, profiles: s.profiles, outline, media: s.media, credits: s.credits };
        if (onOpenCanvas) {
          onOpenCanvas(handoff);
          return;
        }
        try {
          sessionStorage.setItem(HANDOFF_KEY, JSON.stringify(handoff));
        } catch {
          /* 隐私模式写不进去也照样跳,画布退回空态 */
        }
        router.push("/prototypes/hybrid-reel/canvas");
      },
      showEmpty() {
        dispatch({ type: "empty" });
      },
      };
      return self;
    },
    [analyze, api, requestOutline, router, onOpenCanvas, startRun, reportShotFailed, reportVoiceFailed, takeEditFail, failSend],
  );

  /* 卸载(离开页面 / 评审切步骤)时停掉进行中的分析,免得请求回来往已卸载的 provider 里 dispatch。
     开发环境 StrictMode 会「卸载 → 立刻重新挂载」一次:中止推迟到下一拍,重新挂载了就不中止,否则自动开始的分析会被误取消 */
  const alive = useRef(false);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      const ctrl = abortRef.current;
      setTimeout(() => {
        if (!alive.current) ctrl?.abort();
      }, 0);
    };
  }, []);

  const autoran = useRef(false);
  useEffect(() => {
    if (autorun !== "analyze" || autoran.current) return;
    autoran.current = true;
    void analyze();
  }, [autorun, analyze]);

  return <AgentContext.Provider value={{ state, actions, reelSrc, runClock, homeItems }}>{children}</AgentContext.Provider>;
}

export function useAgent(): Ctx {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error("useAgent must be used inside <AgentProvider>");
  return ctx;
}
