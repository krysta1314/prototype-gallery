"use client";

/* Hybrid Reel Agent · 对话界面(开发原型与评审原型共用,必须放在 AgentProvider 里)。
   状态与异步流程在 provider;这里只管渲染、草稿和滚动。
   前半:analyze → brief(只问 assumed 里的项 + 素材缺口)→ outline(一张 Generation plan 卡,与旧版对话页共用 plancard.tsx)。
   后半演示:点 Confirm 后出生成中宫格(一镜一张卡 + 一行进度,components/GenGrid),成片卡放 DEMO_REEL(或 provider 注入的 reelSrc)。
   spec: 2026-10-14-hybrid-reel-agent-design.md */

import { useEffect, useRef, useState, type MutableRefObject } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, ChevronRight, Film, Image as ImageIcon, Music, RotateCcw } from "lucide-react";
import { Markdown } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/markdown";
import { APPLE_FONT, Composer, HistoryRail, IconRail, TopBar } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/shell";
import type { Brief, ClipProfile, Outline } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";
import type { Answers, Question } from "./logic/questions";
import { storyboardRows } from "./logic/storyboard";
import { AI_VIDEO_MODEL, brandOf, deliveryNotes, outlineSec, reelFileName } from "./logic/delivery";
import { reelCost, shotCost } from "./logic/credits";
import { PlanCard } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/plancard";
import { footageSummary } from "./logic/summary";
import { skippedLine } from "./logic/errors";
import { QuestionCard } from "./components/QuestionCard";
import { RewriteCard } from "./components/RewriteCard";
import { Storyboard } from "./components/StoryboardTable";
import { GenGrid } from "./components/GenGrid";
import { ReelCard } from "./components/ReelCard";
import { AgentDialog, AgentToast, OutOfCreditsBanner, UpgradeButton } from "./components/Overlays";
import { BuzzThinking } from "@/app/prototypes/(v1.13)/buzz-loader/BuzzThinking";
import { DEMO_REEL } from "./reel";
import { useAgent, type AgentActions } from "./provider";
import { analysedFileCount, pendingAsk, findRun, outOfCreditsShown, planStatus, retryVisible, type Lang, type MediaFile, type Msg } from "./store";
import { planAssembly, reelPrompts } from "./logic/plan";
import { riskNote, risksBefore, type RiskFound } from "./logic/risk";
import { ASSETS_TOAST, downloadFile } from "./download";

export function AgentChat() {
  const { state, actions, reelSrc, runClock } = useAgent();
  const { messages, profiles, brief, busy, generating, lang, empty, files, media, credits, dialog, toast } = state;
  /* 正在跑的工具区:最后一个、在生成中、没被停止 */
  const liveRun = findRun(messages);
  const liveRunId = generating && liveRun && liveRun.stoppedAtMs === undefined ? liveRun.id : null;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState("");
  const T = (zh: string, en: string) => (lang === "zh" ? zh : en);
  /* History 里当前这段对话(异常处理 spec 第 3 条):生成中转圈;页面不在前台时成片到了 = 红点,点一下消失。
     真实产品里关页面后生成在后台继续,回来从 History 进入看到进度;完成还会发邮件 */
  const [unread, setUnread] = useState(false);
  const reelCount = messages.filter((m) => m.kind === "reel").length;
  const seenReels = useRef(reelCount);
  useEffect(() => {
    if (reelCount > seenReels.current && document.visibilityState === "hidden") {
      setUnread(true);
    }
    seenReels.current = reelCount;
  }, [reelCount]);
  const historyStatus = generating ? "generating" : unread ? "unread" : null;
  /* 下载:先取文件,取不到出 toast + Retry */
  const download = (url: string, fileName: string) => {
    void downloadFile(url, fileName).then((ok) => {
      if (!ok) actions.downloadFailed(url, fileName);
    });
  };
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

  /* 积分不足:输入框上方出横条,发送键换成 Upgrade;还能打字,但回车不发送 */
  const noCredits = outOfCreditsShown(state);
  const send = () => {
    if (noCredits) return;
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
      <HistoryRail current={{ title: "New Session", status: historyStatus, onOpen: () => setUnread(false) }} />
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
                  files={files}
                  last={retryVisible(messages, i)}
                  busy={busy || generating}
                  actions={actions}
                  onProgress={scrollToBottom}
                  live={m.id === liveRunId}
                  runClock={runClock}
                  lang={lang}
                  reelSrc={reelSrc}
                  risks={m.kind === "plan" || m.kind === "reel" ? risksBefore(messages, i) : undefined}
                  onDownload={download}
                  ask={m.kind === "runs" && pendingAsk(messages)?.runsId === m.id ? pendingAsk(messages) : undefined}
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
          notice={noCredits ? <OutOfCreditsBanner onUpgrade={actions.upgrade} /> : undefined}
          action={noCredits ? <UpgradeButton onUpgrade={actions.upgrade} /> : undefined}
          placeholder={T("想改哪里直接告诉我…", "Tell me what to change…")}
        />
      </div>
      <AgentDialog
        dialog={dialog}
        onClose={actions.closeDialog}
        onRegenerate={actions.confirmRegenerate}
        onDelete={actions.confirmDelete}
      />
      <AgentToast toast={toast} onDismiss={actions.dismissToast} onUndo={actions.undoDelete} onRetry={(r) => download(r.url, r.fileName)} />
    </div>
  );
}

function Row({
  m,
  profiles,
  brief,
  files,
  last,
  busy,
  actions,
  onProgress,
  live,
  runClock,
  lang,
  reelSrc,
  risks,
  onDownload,
  ask,
}: {
  m: Msg;
  profiles: ClipProfile[];
  brief: Brief | null;
  files: MediaFile[];
  last: boolean;
  busy: boolean;
  actions: AgentActions;
  onProgress: () => void;
  /** 这个生成中宫格正在跑 */
  live: boolean;
  runClock: MutableRefObject<() => number>;
  lang: Lang;
  reelSrc?: string;
  /** 这张方案卡 / 成片之前用户提过的风险要求(logic/risk.ts) */
  risks?: RiskFound;
  onDownload: (url: string, fileName: string) => void;
  /** 这一轮生成后待回答的失败提问(只传给对应的 runs 行) */
  ask?: Extract<Msg, { kind: "ask" }>;
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
      /* 回答完提问卡:像 Claude 那样留一张「题目 / 答案」小卡,不再是 Q / A 气泡 */
      if (m.rows?.length)
        return (
          <div className="max-w-[560px] overflow-hidden rounded-2xl border border-[#ececf1] bg-white">
            {m.rows.map((r) => (
              <div key={r.question} className="border-b border-[#f1f1f4] px-4 py-2.5 last:border-b-0">
                <p className="text-[14px] font-semibold text-[#1a1a2e]">{r.question}</p>
                <p className="mt-0.5 text-[13.5px] text-[#6a6b7b]">{r.answer}</p>
              </div>
            ))}
          </div>
        );
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
          <BuzzThinking state="thinking" size={14} label={m.text} baseColor="#9a9bb0" />
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
      const analysed = analysedFileCount(files.length, m.skipped);
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
          {/* 像 Claude 的工具行:点开只看读了哪些文件,不展开逐段场记 */}
          {open && (
            <ul className="space-y-1 border-l-2 border-[#ececf1] pl-3 text-[13px] text-[#6a6b7b]">
              {profiles.map((p) => (
                <li key={p.label} className="flex items-center gap-1.5">
                  {p.kind === "image" ? <ImageIcon className="size-3.5 shrink-0" /> : p.kind === "audio" ? <Music className="size-3.5 shrink-0" /> : <Film className="size-3.5 shrink-0" />}
                  <span className="truncate">{p.label}</span>
                </li>
              ))}
            </ul>
          )}
          {/* 读完素材的一两句话:有什么、缺什么要 AI 补拍、下一步(模型长篇复述 brief 的 m.markdown 不再展示);
              素材不可用时换成「哪些不能用、为什么」那段话,下面跟着那一问 */}
          <p>{m.unusable ?? footageSummary(profiles, m.asked ?? true, lang, m.fillTo)}</p>
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
    case "ask":
      /* 生成失败后的那一问:同一张 Claude 式提问卡,答完换成「题目 / 答案」小卡 */
      return <QuestionCard questions={[m.question]} onSubmit={(a) => actions.answerFailure(m.id, a)} />;
    case "rewrite":
      /* 选了改写:Agent 一句 + 新旧对照卡;点 Generate 才扣费重跑 */
      return (
        <div className="space-y-3">
          <p className="text-[14.5px] leading-relaxed text-[#1a1a2e]">{m.text}</p>
          <RewriteCard items={m.items} cost={m.cost} status={m.status} disabled={busy} onGenerate={(texts) => actions.generateRewrite(m.id, texts)} />
        </div>
      );
    case "plan": {
      /* Generation plan 卡(与旧版对话页共用 plancard.tsx):整条广告一次定好 —— 要生成的(AI 补拍 + 整条配音,带积分)
         + 不计积分的「Then I'll edit it together」;底部 Edit in canvas / Cancel / Confirm · N credits */
      const status = planStatus(m);
      /* 做不了 / 有风险的要求:方案照常出,总结末尾加一句改了什么(异常处理 spec 第 7 条) */
      const note = risks ? riskNote(risks, lang) : undefined;
      return (
        <div>
          {/* 已确认的卡后来被新一版替代:照旧变灰 */}
          <div className={m.superseded && status === "confirmed" ? "opacity-55" : undefined}>
            {(m.outline.direction.trim() || note) && (
              <div className={`mb-3 text-[14.5px] leading-relaxed text-[#1a1a2e] ${status === "cancelled" || status === "replaced" ? "opacity-55" : ""}`}>
                {m.outline.direction.trim() && <Markdown text={m.outline.direction} />}
                {note && <p className={m.outline.direction.trim() ? "mt-2" : undefined}>{note}</p>}
              </div>
            )}
            <PlanCard
              outline={m.outline}
              profiles={profiles}
              status={status}
              credits={{ perShot: shotCost(m.outline), total: reelCost(m.outline) }}
              model={AI_VIDEO_MODEL}
              /* 和产品里的 Generation plan 一样精简:每项只有标题、积分、View prompt、参数小标签 */
              details={false}
              assembly={planAssembly(m.outline, profiles)}
              disabled={busy}
              onEdit={() => onOpenCanvas(m.outline)}
              onCancel={() => actions.cancelPlan(m.id)}
              onConfirm={() => onGenerate(m.outline)}
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
        <GenGrid
          run={m}
          live={live}
          clockRef={runClock}
          onDone={() => actions.runsDone(m.outline, m.id)}
          onShotFailed={(shot) => actions.shotFailed(m.id, shot)}
          onVoiceFailed={() => actions.voiceFailed(m.id)}
          onProgress={onProgress}
          onRetry={busy ? undefined : () => actions.retryRun(m.outline)}
          onEdit={() => onOpenCanvas(m.outline)}
          /* 失败卡(补拍 / 配音)上的 Retry = 在下面那张提问卡里选推荐项(繁忙 → Retry;审核没过 → 改写 prompt) */
          onRetryFailed={ask && !busy ? () => actions.answerFailure(ask.id, { failure: { picked: ask.question.defaults, other: "" } }) : undefined}
        />
      );
    case "reel": {
      const d = brief ? deliveryNotes(m.outline, brief, profiles, lang, risks) : null;
      const fileName = reelFileName({ brand: brandOf(profiles), platform: brief?.platform, durationSec: outlineSec(m.outline) });
      return (
        <div className="space-y-4 text-[14.5px] leading-relaxed text-[#1a1a2e]">
          <ReelCard
            onEdit={() => onOpenCanvas(m.outline)}
            onRegenerate={() => actions.regenerate(m.outline)}
            prompts={reelPrompts(m.outline)}
            disabled={busy}
            src={reelSrc}
            fileName={fileName}
            onDownload={onDownload}
          />
          <p>
            {T("成片做好了:", "The reel is ready: ")}
            <strong className="font-semibold">
              {fileName}
            </strong> · {DEMO_REEL.width}×{DEMO_REEL.height} · {DEMO_REEL.fps}
            fps · {DEMO_REEL.durationSec}s · {T("响度约", "about")}{" "}
            {DEMO_REEL.lufs} LUFS{T("。已存入你的资产库。", ". Saved to your Assets.")}{" "}
            {/* 出片后自动永久存进资产库,不过期(异常处理 spec 第 12 条);原型没有资产库页 */}
            <button type="button" onClick={() => actions.toast(ASSETS_TOAST)} className="font-semibold text-[#ff5e1a] underline-offset-2 hover:underline">
              Open in Assets
            </button>
          </p>
          {/* 超时长 / 字幕溢出时 Agent 自己调了什么(异常处理 spec 第 9 条) */}
          {d && d.adjusted.length > 0 && <p>{d.adjusted.join(" ")}</p>}
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
