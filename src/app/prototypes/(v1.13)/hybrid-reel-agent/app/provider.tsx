"use client";

/* Hybrid Reel Agent 的状态容器与动作函数。reducer 在 store.ts;这里只做异步编排:
   调 api、生成 id、按顺序 dispatch。开发原型注入 liveApi,评审原型注入 fixtureApi —— 两边走的是同一套动作。 */

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { putMedia } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/handoff";
import { HANDOFF_KEY, type Handoff, type Outline } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";
import type { AgentApi, HomeItem } from "./api";
import { answerTranscript, applyAnswers, buildQuestions, type Answers, type Question } from "./logic/questions";
import { INITIAL_STATE, agentReducer, detectLang, latestOutline, type AgentState, type OutlineReq } from "./store";

export type AgentActions = {
  start(items: HomeItem[], prompt: string): void;
  analyze(): void;
  answer(questionsId: string, questions: Question[], a: Answers): void;
  send(text: string): void;
  generate(outline: Outline): void;
  runsDone(outline: Outline): void;
  retry(kind: "analyze" | "outline"): void;
  openCanvas(outline: Outline): void;
  showEmpty(): void;
};

type Ctx = { state: AgentState; actions: AgentActions; reelSrc?: string };
const AgentContext = createContext<Ctx | null>(null);

let seq = 0;
const nextId = () => `m${Date.now().toString(36)}-${(seq += 1)}`;
const errText = (e: unknown) => (e instanceof Error ? e.message : String(e));

export function AgentProvider({
  api,
  initialState = INITIAL_STATE,
  initialItems = [],
  autorun,
  reelSrc,
  onOpenCanvas,
  children,
}: {
  api: AgentApi;
  initialState?: AgentState;
  initialItems?: HomeItem[];
  autorun?: "analyze";
  reelSrc?: string;
  /** 评审原型注入:Edit in canvas 不跳页,交给外层切到剪辑器步骤;不传时照旧写 sessionStorage 跳画布 */
  onOpenCanvas?: (handoff: Handoff) => void;
  children: ReactNode;
}) {
  const router = useRouter();
  const [state, dispatch] = useReducer(agentReducer, initialState);
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

  const requestOutline = useCallback(
    async (req: OutlineReq, lang: AgentState["lang"]) => {
      inFlight.current = true;
      const thinkingId = nextId();
      dispatch({ type: "outlineRequested", req, thinkingId, text: lang === "zh" ? "正在排分镜…" : "Laying out the storyboard…" });
      try {
        const outline = await api.outline(req);
        dispatch({ type: "outlineOk", thinkingId, planId: nextId(), outline });
      } catch (e) {
        dispatch({
          type: "failed",
          thinkingId,
          errId: nextId(),
          retry: "outline",
          text: `${lang === "zh" ? "分镜没排出来" : "Couldn't lay out the storyboard"}: ${errText(e)}`,
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
    dispatch({ type: "thinking", id: thinkingId, text: lang === "zh" ? `正在看这 ${items.length} 个文件…` : `Reading ${items.length} files…` });
    try {
      const profiles = await api.analyze(items, lang);
      dispatch({ type: "analyzed", profiles });
      const b = await api.brief(prompt, profiles, lang);
      const questions = buildQuestions(b.assumed, b.brief, profiles, lang);
      dispatch({ type: "briefed", thinkingId, analysisId: nextId(), reply: b.reply, brief: b.brief, questions, questionsId: nextId() });
      if (!questions.length) await requestOutline({ brief: b.brief, profiles }, lang);
    } catch (e) {
      dispatch({
        type: "failed",
        thinkingId,
        errId: nextId(),
        retry: "analyze",
        text: `${lang === "zh" ? "素材分析失败" : "Couldn't read your footage"}: ${errText(e)}`,
      });
    } finally {
      inFlight.current = false;
    }
  }, [api, requestOutline]);

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
        dispatch({ type: "answered", questionsId, brief, userId: nextId(), transcript: answerTranscript(questions, a) });
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
        if (runningRef.current || inFlight.current) return;
        runningRef.current = true;
        const zh = stateRef.current.lang === "zh";
        dispatch({
          type: "generate",
          agentId: nextId(),
          runsId: nextId(),
          outline,
          text: zh
            ? "好，开始生成。AI 补拍在跑的同时，我先把实拍片段、标题卡和片尾卡准备好。"
            : "Meanwhile, I'll prepare the live footage segments, title card and end card.",
        });
      },
      runsDone(outline) {
        if (!runningRef.current) return;
        runningRef.current = false;
        const s = stateRef.current;
        const queued = s.queue;
        dispatch({ type: "runsDone", reelId: nextId(), outline });
        /* 生成中排队的话:合成一句改稿要求,基于刚交付的这一版 */
        if (queued.length && s.brief) void requestOutline({ brief: s.brief, profiles: s.profiles, revise: { current: outline, change: queued.join("\n") } }, s.lang);
      },
      retry(kind) {
        if (inFlight.current) return;
        const s = stateRef.current;
        dispatch({ type: "retryStarted" });
        if (kind === "analyze") void analyze();
        else if (s.lastOutlineReq) void requestOutline(s.lastOutlineReq, s.lang);
      },
      openCanvas(outline) {
        const s = stateRef.current;
        if (!s.brief) return;
        const handoff: Handoff = { brief: s.brief, profiles: s.profiles, outline, media: s.media };
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
    [analyze, requestOutline, router, onOpenCanvas],
  );

  const autoran = useRef(false);
  useEffect(() => {
    if (autorun !== "analyze" || autoran.current) return;
    autoran.current = true;
    void analyze();
  }, [autorun, analyze]);

  return <AgentContext.Provider value={{ state, actions, reelSrc }}>{children}</AgentContext.Provider>;
}

export function useAgent(): Ctx {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error("useAgent must be used inside <AgentProvider>");
  return ctx;
}
