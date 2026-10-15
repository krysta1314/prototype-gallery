"use client";

/* Hybrid Reel Agent · 对话界面(开发原型与评审原型共用,必须放在 AgentProvider 里)。
   状态与异步流程在 provider;这里只管渲染、草稿和滚动。
   前半:analyze → brief(只问 assumed 里的项 + 素材缺口)→ outline(一版分镜表)。
   后半演示:Generate 走一遍折叠工具调用行,成片卡放 DEMO_REEL(或 provider 注入的 reelSrc)。
   spec: 2026-10-14-hybrid-reel-agent-design.md */

import { useEffect, useRef, useState, type MutableRefObject } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, ChevronRight, RotateCcw, Sparkles, X } from "lucide-react";
import { FootageBreakdown } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/footage";
import { Markdown } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/markdown";
import { APPLE_FONT, Composer, HistoryRail, IconRail, TopBar } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/shell";
import type { Brief, ClipProfile, Outline } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";
import type { Answers, Question } from "./logic/questions";
import { storyboardRows } from "./logic/storyboard";
import { brandOf, deliveryNotes, outlineSec, reelFileName } from "./logic/delivery";
import { skippedLine } from "./logic/errors";
import { QuestionCard } from "./components/QuestionCard";
import { Storyboard } from "./components/StoryboardTable";
import { ToolRuns } from "./components/ToolRuns";
import { ReelCard } from "./components/ReelCard";
import { AgentDialog, AgentToast } from "./components/Overlays";
import { DEMO_REEL } from "./reel";
import { useAgent, type AgentActions } from "./provider";
import { analysedFileCount, findRun, retryVisible, shotRetryable, type Lang, type Msg } from "./store";

export function AgentChat() {
  const { state, actions, reelSrc, runClock } = useAgent();
  const { messages, profiles, brief, busy, generating, lang, empty, files, media, credits, dialog, toast } = state;
  /* 正在跑的工具区:最后一个、在生成中、没被停止 */
  const liveRun = findRun(messages);
  const liveRunId = generating && liveRun && liveRun.stoppedAtMs === undefined ? liveRun.id : null;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState("");
  const T = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const refs = files.map((f, i) => ({
    key: media[i]?.key ?? `${i}`,
    url: f.kind === "image" ? f.url : undefined,
    label: f.name,
  }));

  const scrollToBottom = () =>
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });

  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    /* 成片卡出现时让卡片顶部可见,而不是跳到最底下;其余消息照旧滚到底 */
    if (lastMsg?.kind === "reel") {
      scrollRef.current
        ?.querySelector(`[data-msg-id="${lastMsg.id}"]`)
        ?.scrollIntoView({ block: "start", behavior: "smooth" });
    } else
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
  }, [messages]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    actions.send(text);
  };

  if (empty) {
    return (
      <div
        className="grid h-dvh place-items-center bg-white"
        style={{ fontFamily: APPLE_FONT }}
      >
        <div className="text-center">
          <p className="text-[15px] text-[#1a1a2e]">
            Start from the home page to add your footage.
          </p>
          <Link
            href="/prototypes/hybrid-reel-agent"
            className="mt-3 inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#ff5e1a]"
          >
            Go to home <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh bg-white" style={{ fontFamily: APPLE_FONT }}>
      <IconRail />
      <HistoryRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar credits={credits} />
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-6">
          <div className="mx-auto max-w-[880px] space-y-5 py-4">
            {messages.map((m, i) => (
              <div key={m.id} data-msg-id={m.id}>
                <Row
                  m={m}
                  profiles={profiles}
                  brief={brief}
                  fileCount={files.length}
                  last={retryVisible(messages, i)}
                  busy={busy || generating}
                  actions={actions}
                  onProgress={scrollToBottom}
                  live={m.id === liveRunId}
                  runClock={runClock}
                  canRetryShot={m.kind === "agent" && m.retryShot !== undefined && shotRetryable(state, m.retryShot)}
                  lang={lang}
                  reelSrc={reelSrc}
                />
              </div>
            ))}
          </div>
        </div>
        <Composer
          value={draft}
          onChange={setDraft}
          onSend={send}
          references={refs}
          disabled={busy}
          onStop={liveRunId ? actions.stop : undefined}
          placeholder={T("想改哪里直接告诉我…", "Tell me what to change…")}
        />
      </div>
      <AgentDialog
        dialog={dialog}
        onClose={actions.closeDialog}
        onTopUp={actions.topUp}
        onRegenerate={actions.confirmRegenerate}
        onDelete={actions.confirmDelete}
      />
      <AgentToast toast={toast} onDismiss={actions.dismissToast} onUndo={actions.undoDelete} />
    </div>
  );
}

function Row({
  m,
  profiles,
  brief,
  fileCount,
  last,
  busy,
  actions,
  onProgress,
  live,
  runClock,
  canRetryShot,
  lang,
  reelSrc,
}: {
  m: Msg;
  profiles: ClipProfile[];
  brief: Brief | null;
  fileCount: number;
  last: boolean;
  busy: boolean;
  actions: AgentActions;
  onProgress: () => void;
  /** 这个工具区正在跑 */
  live: boolean;
  runClock: MutableRefObject<() => number>;
  /** 这条单镜失败回复的 Retry shot 现在可点 */
  canRetryShot: boolean;
  lang: Lang;
  reelSrc?: string;
}) {
  const onAnswer = (id: string, q: Question[], a: Answers) => actions.answer(id, q, a);
  const onGenerate = (o: Outline) => actions.generate(o);
  const onOpenCanvas = (o: Outline) => actions.openCanvas(o);
  const [open, setOpen] = useState(false);
  const T = (zh: string, en: string) => (lang === "zh" ? zh : en);
  switch (m.kind) {
    case "files":
      return (
        <div className="flex flex-wrap justify-end gap-2">
          {m.files.map((f) => (
            <span
              key={f.url}
              title={f.name}
              className="size-[88px] overflow-hidden rounded-xl border border-[#ececf1] bg-[#f4f4f7]"
            >
              {f.kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.url} alt="" className="size-full object-cover" />
              ) : f.kind === "video" ? (
                <video
                  src={`${f.url}#t=0.5`}
                  muted
                  preload="metadata"
                  className="size-full object-cover"
                />
              ) : (
                <span className="grid size-full place-items-center p-2 text-center text-[11px] text-[#6a6b7b]">
                  {f.name}
                </span>
              )}
            </span>
          ))}
        </div>
      );
    case "user":
      return (
        <div className="flex justify-end">
          <div className="max-w-[62ch] whitespace-pre-wrap rounded-2xl bg-[#f6f5f8] px-4 py-3 text-[14.5px] leading-relaxed text-[#1a1a2e]">
            {m.text}
          </div>
        </div>
      );
    case "thinking":
      return (
        <div className="flex items-center gap-3 text-[14px]">
          <p className="animate-pulse text-[#9a9bb0]">{m.text}</p>
          {m.cancellable && (
            <button
              type="button"
              onClick={actions.cancel}
              className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#6a6b7b] transition hover:text-[#1a1a2e]"
            >
              <X className="size-3.5" /> Cancel
            </button>
          )}
        </div>
      );
    case "agent":
      return (
        <div className="text-[14.5px] leading-relaxed text-[#1a1a2e]">
          {m.text}
          {m.retry && last && (
            <button
              type="button"
              onClick={() => actions.retry(m.retry!)}
              className="ml-2 inline-flex items-center gap-1 text-[13px] font-semibold text-[#ff5e1a]"
            >
              <RotateCcw className="size-3.5" /> Retry
            </button>
          )}
          {m.startOver && last && (
            <button
              type="button"
              onClick={actions.startOver}
              className="ml-3 text-[13px] font-semibold text-[#6a6b7b] underline underline-offset-2 transition hover:text-[#1a1a2e]"
            >
              Start over
            </button>
          )}
          {m.retryShot !== undefined && canRetryShot && (
            <button
              type="button"
              onClick={() => actions.retryShot(m.retryShot!)}
              className="ml-2 inline-flex items-center gap-1 text-[13px] font-semibold text-[#ff5e1a]"
            >
              <RotateCcw className="size-3.5" /> {T(`重试第 ${m.retryShot} 镜`, `Retry shot ${m.retryShot}`)}
            </button>
          )}
          {m.details && (
            <div className="mt-1">
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                className="flex items-center gap-1 text-[12.5px] text-[#9a9bb0] hover:text-[#6a6b7b]"
              >
                Details
                {open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
              </button>
              {open && (
                <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-[#f6f5f8] px-3 py-2 font-mono text-[12px] leading-relaxed text-[#6a6b7b]">
                  {m.details}
                </pre>
              )}
            </div>
          )}
        </div>
      );
    case "analysis": {
      const analysed = analysedFileCount(fileCount, m.skipped);
      return (
        <div className="space-y-3 text-[14.5px] leading-relaxed text-[#1a1a2e]">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="flex items-center gap-1 text-[13px] text-[#9a9bb0] hover:text-[#6a6b7b]"
          >
            Read {analysed} {analysed === 1 ? "file" : "files"}
            {open ? (
              <ChevronDown className="size-3.5" />
            ) : (
              <ChevronRight className="size-3.5" />
            )}
          </button>
          {open && <FootageBreakdown profiles={profiles} />}
          <Markdown text={m.markdown} />
          {m.skipped?.length ? (
            <ul className="space-y-0.5 text-[13.5px] text-[#6a6b7b]">
              {m.skipped.map((x) => (
                <li key={x.name}>{skippedLine(x, lang)}</li>
              ))}
            </ul>
          ) : null}
        </div>
      );
    }
    case "questions":
      return (
        <QuestionCard
          questions={m.questions}
          onSubmit={(a) => onAnswer(m.id, m.questions, a)}
        />
      );
    case "plan": {
      const dim = m.superseded || busy;
      return (
        <div>
          <div className={m.superseded ? "opacity-55" : undefined}>
            {m.outline.direction.trim() && (
              <div className="mb-3 text-[14.5px] leading-relaxed text-[#1a1a2e]">
                <Markdown text={m.outline.direction} />
              </div>
            )}
            <Storyboard
              rows={storyboardRows(m.outline, profiles)}
              credits={m.outline.credits.total}
              footer={
                m.superseded ? undefined : <>
                  <button
                    type="button"
                    disabled={dim}
                    onClick={() => onOpenCanvas(m.outline)}
                    className="rounded-full border border-[#ececf1] px-4 py-2 text-[13px] font-semibold text-[#1a1a2e] transition hover:bg-[#f6f7f9] disabled:opacity-40"
                  >
                    Edit in canvas
                  </button>
                  <button
                    type="button"
                    disabled={dim}
                    onClick={() => onGenerate(m.outline)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-4 py-2 text-[13px] font-semibold text-white transition hover:brightness-105 disabled:opacity-40"
                  >
                    <Sparkles className="size-4" /> Generate
                  </button>
                </>
              }
            />
          </div>
          {m.superseded && (
            <button
              type="button"
              disabled={busy}
              onClick={() => actions.useVersion(m.id)}
              className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[#ececf1] px-4 py-2 text-[13px] font-semibold text-[#1a1a2e] transition hover:bg-[#f6f7f9] disabled:opacity-40"
            >
              <RotateCcw className="size-3.5" /> {T("用这一版", "Use this version")}
            </button>
          )}
        </div>
      );
    }
    case "runs":
      return (
        <ToolRuns
          run={m}
          live={live}
          clockRef={runClock}
          onDone={() => actions.runsDone(m.outline, m.id)}
          onShotFailed={(shot) => actions.shotFailed(m.id, shot)}
          onProgress={onProgress}
        />
      );
    case "reel": {
      const d = brief ? deliveryNotes(m.outline, brief, profiles, lang) : null;
      const fileName = reelFileName({ brand: brandOf(profiles), platform: brief?.platform, durationSec: outlineSec(m.outline) });
      return (
        <div className="space-y-4 text-[14.5px] leading-relaxed text-[#1a1a2e]">
          <ReelCard
            onEdit={() => onOpenCanvas(m.outline)}
            onRegenerate={() => actions.regenerate(m.outline)}
            onDelete={() => actions.deleteReel(m.id)}
            onToast={actions.toast}
            disabled={busy}
            src={reelSrc}
            fileName={fileName}
          />
          {m.missingShots?.length ? (
            <p className="text-[13.5px] text-[#b4540c]">
              {T(
                `第 ${m.missingShots.join("、")} 镜生成失败,成片里暂用占位画面。`,
                `Shot ${m.missingShots.join(", ")} didn't generate — the reel uses a placeholder there for now.`,
              )}
            </p>
          ) : null}
          <p>
            {T("成片做好了:", "The reel is ready: ")}
            <strong className="font-semibold">
              {fileName}
            </strong> · {DEMO_REEL.width}×{DEMO_REEL.height} · {DEMO_REEL.fps}
            fps · {DEMO_REEL.durationSec}s · {T("响度约", "about")}{" "}
            {DEMO_REEL.lufs} LUFS{T("。", ".")}
          </p>
          <div>
            <p className="mb-2 font-semibold">Storyboard</p>
            <Storyboard rows={storyboardRows(m.outline, profiles)} />
          </div>
          {d && (
            <>
              <div>
                <p className="mb-1 font-semibold">Models, voice & credits</p>
                <ul className="list-disc space-y-1 pl-5">
                  {d.usage.map((u) => (
                    <li key={u}>{u}</li>
                  ))}
                  <li>
                    {T(`合计 · ${d.total} 积分`, `Total · ${d.total} credits`)}
                  </li>
                </ul>
              </div>
              {d.checks.length > 0 && (
                <div>
                  <p className="mb-1 font-semibold">Needs your check</p>
                  <ol className="list-decimal space-y-1 pl-5">
                    {d.checks.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ol>
                </div>
              )}
            </>
          )}
        </div>
      );
    }
  }
}
