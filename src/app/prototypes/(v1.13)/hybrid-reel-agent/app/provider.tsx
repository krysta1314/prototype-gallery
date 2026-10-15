"use client";

/* Hybrid Reel Agent 的状态容器与动作函数。reducer 在 store.ts;这里只做异步编排:
   调 api、生成 id、按顺序 dispatch。开发原型注入 liveApi,评审原型注入 fixtureApi —— 两边走的是同一套动作。 */

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type MutableRefObject, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { putMedia } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/handoff";
import { HANDOFF_KEY, type Handoff, type Outline } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";
import type { AgentApi, HomeItem } from "./api";
import { checkCredits, reelCost, shotCost, shotFailedText, stoppedText, TOP_UP_TOAST } from "./logic/credits";
import { failText, friendlyError, isAbort } from "./logic/errors";
import { SHOT_FAIL_REASON, schedule, stopRefund, toolRuns, type ShotFail } from "./logic/runs";
import { answerRows, answerTranscript, applyAnswers, buildQuestions, type Answers, type Question } from "./logic/questions";
import {
  CONFIRM_TEXT,
  INITIAL_STATE,
  agentReducer,
  detectLang,
  findRun,
  latestOutline,
  pendingRetry,
  readingText,
  reelMissing,
  type AgentState,
  type OutlineReq,
} from "./store";

export type AgentActions = {
  start(items: HomeItem[], prompt: string): void;
  analyze(): void;
  answer(questionsId: string, questions: Question[], a: Answers): void;
  send(text: string): void;
  /** 方案卡的 Generate:先查余额,够就扣分镜预估并开跑,不够弹「Not enough credits」 */
  generate(outline: Outline): void;
  /** 成片卡的 Regenerate:先弹确认 */
  regenerate(outline: Outline): void;
  /** 确认弹窗里点 Regenerate:查余额后开跑 */
  confirmRegenerate(): void;
  /** 工具区跑完(runsId = 那个工具区) */
  runsDone(outline: Outline, runsId?: string): void;
  /** 工具区里某个补拍镜头失败(到了它的结束时间) */
  shotFailed(runsId: string, shot: number): void;
  /** 生成中点 Stop */
  stop(): void;
  /** "Retry shot {n}":查余额,扣这一镜,只重跑它 */
  retryShot(shot: number): void;
  /** 旧版分镜 "Use this version" */
  useVersion(planId: string): void;
  /** 成片 ⋯ → Delete:先弹确认 */
  deleteReel(reelId: string): void;
  confirmDelete(): void;
  undoDelete(): void;
  closeDialog(): void;
  /** 积分不足弹窗的 Top up(原型不做充值,只出 toast) */
  topUp(): void;
  toast(text: string): void;
  dismissToast(id: string): void;
  retry(kind: "analyze" | "outline"): void;
  /** 取消进行中的素材分析 */
  cancel(): void;
  /** 连续失败到上限后的 Start over:回落地页 */
  startOver(): void;
  openCanvas(outline: Outline): void;
  showEmpty(): void;
};

/** runClock:当前在跑的工具区登记的计时器(返回已跑了多少 ms),Stop 用它算停在哪一行 */
type Ctx = { state: AgentState; actions: AgentActions; reelSrc?: string; runClock: MutableRefObject<() => number> };
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
  onStartOver,
  initialCredits,
  failShot,
  children,
}: {
  api: AgentApi;
  initialState?: AgentState;
  initialItems?: HomeItem[];
  autorun?: "analyze";
  reelSrc?: string;
  /** 评审原型注入:Edit in canvas 不跳页,交给外层切到剪辑器步骤;不传时照旧写 sessionStorage 跳画布 */
  onOpenCanvas?: (handoff: Handoff) => void;
  /** 评审原型注入:Start over 回到评审的落地页步骤;不传时跳开发原型落地页 */
  onStartOver?: () => void;
  /** 起始余额;不传用 initialState.credits(默认 35,600)。评审「积分不足」开关传 LOW_CREDITS(2) */
  initialCredits?: number;
  /** 评审演示用:这个镜头号(从 1 起)的补拍第一次生成时失败。开发原型不传 */
  failShot?: number;
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
      const questions = buildQuestions(b.assumed, b.brief, profiles, lang);
      dispatch({ type: "briefed", thinkingId, analysisId: nextId(), reply: b.reply, brief: b.brief, questions, questionsId: nextId(), skipped });
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

  /* Generate / Regenerate 共用:查余额 → 扣费开跑;不够弹「Not enough credits」,不开跑 */
  const startRun = useCallback(
    (outline: Outline, confirm?: boolean) => {
      if (runningRef.current || inFlight.current) return;
      const s = stateRef.current;
      const cost = reelCost(outline);
      const check = checkCredits(s.credits, cost);
      if (!check.ok) {
        dispatch({ type: "dialog", dialog: { kind: "noCredits", needed: check.needed, balance: check.balance } });
        return;
      }
      const zh = s.lang === "zh";
      const fail: ShotFail[] = [];
      if (failShot !== undefined && !failedOnce.current.has(failShot) && outline.shots[failShot - 1]?.source.kind === "generate") {
        failedOnce.current.add(failShot);
        fail.push({ shot: failShot, reason: SHOT_FAIL_REASON[s.lang] });
      }
      runningRef.current = true;
      dispatch({
        type: "generate",
        agentId: nextId(),
        runsId: nextId(),
        outline,
        cost,
        ...(fail.length ? { fail } : {}),
        /* 分镜卡的 Confirm:像 Claude 那样先留一个用户气泡(按钮文案是英文,气泡也用英文) */
        ...(confirm ? { confirm: { id: nextId(), text: CONFIRM_TEXT } } : {}),
        text: zh
          ? "好，开始生成。AI 补拍在跑的同时，我先把实拍片段、标题卡和片尾卡准备好。"
          : "Meanwhile, I'll prepare the live footage segments, title card and end card.",
      });
    },
    [failShot],
  );

  /* 单镜失败:退回这一镜的积分 + 一句带 Retry shot 的回复;同一镜只退一次 */
  const reportShotFailed = useCallback((runsId: string, shot: number) => {
    const s = stateRef.current;
    const run = findRun(s.messages, runsId);
    const f = run?.fail?.find((x) => x.shot === shot);
    if (!run || !f || run.refundedShots?.includes(shot) || run.stoppedAtMs !== undefined) return;
    const refund = shotCost(run.outline);
    const act = { type: "shotFailed", runsId, shot, refund, agentId: nextId(), text: shotFailedText(shot, f.reason, refund, s.lang) } as const;
    /* 同步更新 ref,同一个 tick 里紧接着的 stop / runsDone 能看到这次退款 */
    stateRef.current = agentReducer(s, act);
    dispatch(act);
  }, []);

  const actions = useMemo<AgentActions>(
    () => ({
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
        const brief = applyAnswers(s.brief, questions, a, s.lang);
        dispatch({ type: "answered", questionsId, brief, userId: nextId(), transcript: answerTranscript(questions, a), rows: answerRows(questions, a) });
        void requestOutline({ brief, profiles: s.profiles }, s.lang);
      },
      send(text) {
        const s = stateRef.current;
        if (runningRef.current) {
          dispatch({ type: "queued", userId: nextId(), text });
          return;
        }
        if (inFlight.current) return;
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
      generate(outline) {
        startRun(outline, true);
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
        /* 失败镜头的退款兜底:计时器没来得及报的,交付前补上 */
        for (const f of run?.fail ?? []) reportShotFailed(run!.id, f.shot);
        const queued = s.queue;
        const zh = s.lang === "zh";
        dispatch({
          type: "runsDone",
          reelId: nextId(),
          outline,
          runsId: run?.id,
          ...(run?.only !== undefined
            ? { note: { id: nextId(), text: zh ? `第 ${run.only} 镜已补上,成片已更新。` : `Shot ${run.only} is back in the reel.` } }
            : {}),
        });
        /* 生成中排队的话:合成一句改稿要求,基于刚交付的这一版 */
        if (queued.length && s.brief) void requestOutline({ brief: s.brief, profiles: s.profiles, revise: { current: outline, change: queued.join("\n") } }, s.lang);
      },
      shotFailed(runsId, shot) {
        reportShotFailed(runsId, shot);
      },
      stop() {
        if (!runningRef.current) return;
        const s = stateRef.current;
        const run = findRun(s.messages);
        if (!run || run.stoppedAtMs !== undefined) return;
        const atMs = Math.max(0, runClock.current());
        const runs = toolRuns(run.outline, { only: run.only });
        const slots = schedule(runs);
        /* 停之前已经到点失败、还没报的镜头先退款,免得算两遍 */
        for (const f of run.fail ?? []) {
          const slot = slots.find((x) => x.id === `gen-${f.shot - 1}`);
          if (slot && slot.endMs <= atMs) reportShotFailed(run.id, f.shot);
        }
        const fresh = findRun(stateRef.current.messages, run.id) ?? run;
        const refund = stopRefund({ outline: run.outline, charged: run.charged, refunded: fresh.refunded ?? 0, runs, slots, atMs, fail: run.fail });
        runningRef.current = false;
        dispatch({ type: "stopped", runsId: run.id, atMs, refund, agentId: nextId(), text: stoppedText(refund, s.lang) });
        const queued = s.queue;
        const current = latestOutline(s.messages);
        if (queued.length && s.brief && current)
          void requestOutline({ brief: s.brief, profiles: s.profiles, revise: { current, change: queued.join("\n") } }, s.lang);
      },
      retryShot(shot) {
        if (runningRef.current || inFlight.current) return;
        const s = stateRef.current;
        const reelId = reelMissing(s.messages, shot);
        const reel = s.messages.find((m) => m.id === reelId);
        if (!reelId || reel?.kind !== "reel") return;
        const cost = shotCost(reel.outline);
        const check = checkCredits(s.credits, cost);
        if (!check.ok) {
          dispatch({ type: "dialog", dialog: { kind: "noCredits", needed: check.needed, balance: check.balance } });
          return;
        }
        runningRef.current = true;
        const zh = s.lang === "zh";
        dispatch({
          type: "retryShot",
          runsId: nextId(),
          agentId: nextId(),
          text: zh ? `重新生成第 ${shot} 镜。` : `Retrying shot ${shot}.`,
          outline: reel.outline,
          shot,
          cost,
          reelId,
        });
      },
      useVersion(planId) {
        if (runningRef.current || inFlight.current) return;
        dispatch({ type: "reusePlan", fromId: planId, planId: nextId() });
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
      topUp() {
        dispatch({ type: "dialog", dialog: null });
        dispatch({ type: "toast", toast: { id: nextId(), text: TOP_UP_TOAST } });
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
      startOver() {
        if (onStartOver) {
          onStartOver();
          return;
        }
        router.push("/prototypes/hybrid-reel-agent");
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
    }),
    [analyze, requestOutline, router, onOpenCanvas, onStartOver, startRun, reportShotFailed],
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

  return <AgentContext.Provider value={{ state, actions, reelSrc, runClock }}>{children}</AgentContext.Provider>;
}

export function useAgent(): Ctx {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error("useAgent must be used inside <AgentProvider>");
  return ctx;
}
