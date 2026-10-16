"use client";

/* Generate 后的「生成中」宫格(Claude / BuzzVideo 式):只放真正要生成的 —— 每个 AI 补拍一张 9:16 卡 + 旁白开着时一张配音卡,三列。
   实拍素材不出卡(Agent 自己剪)。没好的卡是暖色渐变 + 「Generating...」小胶囊;好了换成一张视频卡(和成片卡同一个 ReelCard:右上收藏 / 下载 / 重新生成这一镜 / 剪辑 / 更多,中间播放,底部控制条,不带「Shot n · AI」标签),
   配音卡好了显示一条波形 + 「Voiceover · {s}s」。
   宫格下一行灰字进度(Filming in progress... 等),由 logic/genGrid.ts 按 runs.ts 的排程算出。
   live 时挂载即开始计时:把计时器登记给 provider(Stop 读它),失败镜头到点报 onShotFailed,结束调用 onDone 一次
   (有镜头失败时生成结算完就结束,provider 接着出提问卡)。
   已结算(成片已出 / 预置回放)静态显示最终状态,完整网格一直显示。
   剪辑失败(run.editFail):卡片都是好的,进度行停在红字「Couldn't finish the edit.」。 */

import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { Image as ImageIcon } from "lucide-react";
import type { Outline } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";
import { SHOT_FAIL_REASON, genShot, runEndMs, schedule, toolRuns } from "../logic/runs";
import { genGrid, runPauses, type GridCard } from "../logic/genGrid";
import { DEMO_REEL } from "../reel";
import { voiceScript } from "../logic/voice";
import { AudioCard } from "./AudioCard";
import { ReelCard } from "./ReelCard";
import { planAssembly, reelPrompts } from "../logic/plan";
import { ROLE_META } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";
import type { RunsMsg } from "../store";

const CSS = `
/* 生成中卡片与三点:与 v1.11 generation-queue-upsell 的 GeneratingCard 同一套动画(斜向重复渐变 5s 平移、三点依次闪) */
.gen-anim { background: repeating-linear-gradient(135deg, rgba(255,219,179,0.95) 0%, rgba(255,179,180,0.9) 25%, rgba(255,219,179,0.95) 50%); background-size: 200% 200%; animation: gradient-shift 5s linear infinite; }
@keyframes gradient-shift { 0% { background-position: 0% 0%; } 100% { background-position: 100% 100%; } }
.gg-d2 { animation: gg-d2 1.2s steps(1) infinite; }
.gg-d3 { animation: gg-d3 1.2s steps(1) infinite; }
@keyframes gg-d2 { 0% { opacity: 0; } 33% { opacity: 1; } }
@keyframes gg-d3 { 0% { opacity: 0; } 66% { opacity: 1; } }
.gen-dot { animation: gen-dot-blink 1.4s infinite both; }
.gen-dot:nth-child(2) { animation-delay: 0.2s; }
.gen-dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes gen-dot-blink { 0%, 60%, 100% { opacity: 0.2; } 30% { opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .gen-anim, .gen-dot { animation: none; } .gen-dot { opacity: 1; } .gg-d2, .gg-d3 { animation: none; opacity: 1; } }
`;

type Still = { url: string; kind: "video" | "image"; at: number } | null;

/** 生成都结束后的剪辑合成阶段:这时成片区出一张「Rendering...」的成片卡 */
const RENDER_PHASES = new Set(["cutting", "assembling", "subtitles", "mixing", "checking"]);

/** AI 镜头卡「好了」之后显示的画面(按镜头号):原型里用演示成片里错开的一帧 */
function stillsFor(outline: Outline): Record<number, Still> {
  let k = 0;
  const out: Record<number, Still> = {};
  outline.shots.forEach((s, i) => {
    if (s.source.kind !== "generate") return;
    out[i + 1] = { url: DEMO_REEL.src, kind: "video", at: (1 + k++ * 4.5) % DEMO_REEL.durationSec };
  });
  return out;
}

export function GenGrid({
  run,
  live,
  clockRef,
  onDone,
  onShotFailed,
  onVoiceFailed,
  onProgress,
  onRetry,
  onRetryFailed,
  onEdit,
  onRedoShot,
  onDownload,
  busy,
}: {
  run: RunsMsg;
  /** 正在跑(否则按结算状态静态显示:跑完 / 停在 stoppedAtMs) */
  live: boolean;
  clockRef?: MutableRefObject<() => number>;
  onDone: () => void;
  onShotFailed?: (shot: number) => void;
  /** 配音失败(到了它的结束时间):provider 退回配音的积分 */
  onVoiceFailed?: () => void;
  onProgress?: () => void;
  /** 停止后的卡片上显示 Retry(重新整体生成);生成中 / 忙时不传,不显示 */
  onRetry?: () => void;
  /** 失败卡(补拍 / 配音)上的 Retry = 下面提问卡的推荐项;没有待回答的提问时不传,不显示 */
  onRetryFailed?: () => void;
  /** 配音卡 / 镜头卡上的剪辑图标:进画布 */
  onEdit?: () => void;
  /** 好了的镜头卡上的「重新生成」:只重做这一镜(打开 Redo a shot,预先勾好这一镜) */
  onRedoShot?: (shot: number) => void;
  /** 镜头卡上的下载 */
  onDownload?: (url: string, fileName: string) => void;
  /** 有生成在跑 / 请求在途:镜头卡上的重新生成、剪辑置灰 */
  busy?: boolean;
}) {
  const slots = useMemo(
    () => schedule(toolRuns(run.outline, { only: run.only, editOnly: run.editOnly, voiceOnly: run.voiceOnly })),
    [run.outline, run.only, run.editOnly, run.voiceOnly],
  );
  const stills = useMemo(() => stillsFor(run.outline), [run.outline]);
  /* 失败卡上写退了多少 */
  const [now, setNow] = useState(0);
  const done = useRef(false);
  const reported = useRef(new Set<number>());
  const voiceReported = useRef(false);
  /* 有失败(镜头 / 配音,或还有没解决的配音失败):生成结算完就结束(不进剪辑),provider 接着出提问卡 */
  /* 剪辑会失败(生成都成功之后):跑到拼接那一步就结束,provider 接着出「剪辑失败」那一问 */
  const total = runEndMs(slots, run.fail, runPauses(run), Boolean(run.editFail) && !runPauses(run));

  useEffect(() => {
    if (!live) return; // 已结算:不计时、不回调
    const t0 = performance.now();
    if (clockRef) clockRef.current = () => performance.now() - t0;
    const timer = window.setInterval(() => {
      const t = performance.now() - t0;
      setNow(t);
      for (const f of run.fail ?? []) {
        const slot = slots.find((s) => genShot(s.id) === f.shot);
        if (slot && t >= slot.endMs && !reported.current.has(f.shot)) {
          reported.current.add(f.shot);
          onShotFailed?.(f.shot);
        }
      }
      const audio = slots.find((s) => s.id === "audio");
      if (run.voiceFail && audio && t >= audio.endMs && !voiceReported.current) {
        voiceReported.current = true;
        onVoiceFailed?.();
      }
      if (t >= total && !done.current) {
        done.current = true;
        window.clearInterval(timer);
        onDone();
      }
    }, 100);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live]);

  const grid = genGrid(run, live ? now : Infinity);
  useEffect(() => {
    if (live) onProgress?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid.phase]);

  /* 跑完且已结算(成片卡已在下面):完整网格一直显示,不收起、不带标题行;只剪不生成的一轮没有卡,整块不显示 */
  if (!live && grid.phase === "done") {
    if (!grid.cards.length) return null;
    return (
      <div>
        <style>{CSS}</style>
        <Grid cards={grid.cards} stills={stills} script={voiceScript(run.outline)} shotCard={{ outline: run.outline, onRedo: onRedoShot, onEdit, onDownload, disabled: busy || live }} onEdit={onEdit} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <style>{CSS}</style>
      {grid.cards.length > 0 && <Grid cards={grid.cards} stills={stills} script={voiceScript(run.outline)} shotCard={{ outline: run.outline, onRedo: onRedoShot, onEdit, onDownload, disabled: busy || live }} onRetry={grid.phase === "stopped" ? onRetry : undefined} onRetryFailed={onRetryFailed} onEdit={onEdit} />}
      {/* 要生成的都好了、进入剪辑合成:下面先出成片区,一张 9:16 的成片卡在渲染中(同一套渐变动画),出片后换成真正的成片卡 */}
      {RENDER_PHASES.has(grid.phase) && grid.cards.every((c) => c.status === "done") && (
        <div>
          <p className="text-[14.5px] font-semibold text-[#1a1a2e]">Final ad</p>
          <div className="relative mt-2 aspect-[9/16] w-[280px] overflow-hidden rounded-2xl">
            <div className="gen-anim absolute inset-0" />
            <span className="absolute left-2 top-2 rounded-full bg-white/55 px-2 py-[3px] text-[11px] font-semibold leading-none text-[#1a1a2e] backdrop-blur-sm">
              Rendering<span>.</span>
              <span className="gg-d2">.</span>
              <span className="gg-d3">.</span>
            </span>
          </div>
        </div>
      )}
      {grid.phase !== "done" && grid.phase !== "paused" && (
        <p className={`flex items-center gap-2 text-[13px] ${grid.phase === "editFailed" ? "text-[#e5484d]" : "text-[#9a9bb0]"}`} aria-live="polite">
          {grid.phase !== "stopped" && grid.phase !== "editFailed" && (
            <span className="flex items-center gap-[3px]" aria-hidden>
              {[0, 1, 2].map((i) => (
                <span key={i} className="gen-dot size-[5px] rounded-full bg-[#b4b5c4]" />
              ))}
            </span>
          )}
          {grid.status}
        </p>
      )}
    </div>
  );
}

/* 补拍镜头排三列竖卡;配音单独一张横向音频卡放在下面(好了是播放条,同产品里的音频结果卡) */
type ShotCardOpts = { outline: Outline; onRedo?: (shot: number) => void; onEdit?: () => void; onDownload?: (url: string, fileName: string) => void; disabled?: boolean };

function Grid({ cards, stills, script, onRetry, onRetryFailed, onEdit, shotCard }: { cards: GridCard[]; stills: Record<number, Still>; script: string; onRetry?: () => void; onRetryFailed?: () => void; onEdit?: () => void; shotCard?: ShotCardOpts }) {
  const shots = cards.filter((c) => c.kind === "ai");
  const voice = cards.find((c) => c.kind === "voice");
  const outline = shotCard?.outline;
  const voiceTitle = outline ? planAssembly(outline, []).voiceover?.title : undefined;
  return (
    /* 素材区:标题「Generated assets」,每个生成项上方一行名字 + 一句介绍(和 Generation plan 里的那一项对应),下面是卡片 */
    <div className="space-y-3">
      <p className="text-[14.5px] font-semibold text-[#1a1a2e]">Generated assets</p>
      {shots.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {shots.map((c) => (
            <div key={c.key} className="min-w-0">
              {c.kind === "ai" && outline && <ShotCaption outline={outline} shot={c.shot} />}
              {shotBody(c)}
            </div>
          ))}
        </div>
      )}
      {voice?.kind === "voice" && (
        <div>
          <p className="text-[13.5px] font-semibold text-[#1a1a2e]">{voiceTitle ?? `Voiceover (${voice.sec}s)`}</p>
          <p className="mb-2 line-clamp-1 text-[12.5px] leading-snug text-[#6a6b7b]">{script.split("\n")[0]}</p>
          {voice.status === "done" ? (
            <AudioCard src={DEMO_REEL.src} sec={voice.sec} script={script} onEdit={onEdit} />
          ) : (
            <VoicePending card={voice} onRetry={voice.status === "failed" ? onRetryFailed : onRetry} />
          )}
        </div>
      )}
    </div>
  );

  function shotBody(c: GridCard) {
    /* 好了的镜头 = 一张视频卡,和成片卡同一个组件:右上收藏 / 下载 / 重新生成(只重做这一镜)/ 剪辑 / 更多(View prompt),中间播放,底部控制条 */
    return c.kind === "ai" && c.status === "done" && shotCard && stills[c.shot] ? (
      <ShotVideo shot={c.shot} still={stills[c.shot]!} opts={shotCard} />
    ) : (
      <div className="overflow-hidden rounded-xl border border-[#ececf1]">
        <Card card={c} still={c.kind === "ai" ? stills[c.shot] : null} onRetry={c.status === "failed" ? onRetryFailed : onRetry} />
      </div>
    );
  }
}

/** 镜头卡上方的介绍:和 Generation plan 里那一项同名(「AI shot · Pain (4s)」)+ 一句画面描述 */
function ShotCaption({ outline, shot }: { outline: Outline; shot: number }) {
  const s = outline.shots[shot - 1];
  if (!s) return null;
  const role = ROLE_META[s.role]?.label ?? String(s.role);
  const summary = s.source.kind === "generate" ? s.source.summary : undefined;
  return (
    <div className="mb-2 min-h-[44px]">
      <p className="text-[13.5px] font-semibold text-[#1a1a2e]">
        AI shot · {role} ({s.durationSec}s)
      </p>
      {summary && <p className="line-clamp-2 text-[12.5px] leading-snug text-[#6a6b7b]">{summary}</p>}
    </div>
  );
}

function ShotVideo({ shot, still, opts }: { shot: number; still: NonNullable<Still>; opts: ShotCardOpts }) {
  const sec = opts.outline.shots[shot - 1]?.durationSec ?? 4;
  const prompts = reelPrompts(opts.outline).filter((p) => p.title === `Shot ${shot} · AI`);
  return (
    <ReelCard
      wide
      src={still.url}
      clip={{ start: still.at, sec }}
      fileName={`shot-${shot}.mp4`}
      prompts={prompts}
      disabled={opts.disabled}
      onRegenerate={() => opts.onRedo?.(shot)}
      onEdit={() => opts.onEdit?.()}
      onDownload={opts.onDownload}
    />
  );
}

/* 配音还没好 / 停了 / 失败:和音频卡同宽的一条;生成中用同一套渐变动画 */
function VoicePending({ card, onRetry }: { card: Extract<GridCard, { kind: "voice" }>; onRetry?: () => void }) {
  return (
    /* 无外框,和好了之后的音频卡一样高(约 112px) */
    <div className="w-full max-w-[440px]">
      {card.status === "generating" ? (
        <div className="relative h-[112px] overflow-hidden rounded-2xl">
          <div className="gen-anim absolute inset-0" />
          <span className="absolute left-3 top-3 rounded-full bg-white/55 px-2 py-[3px] text-[11px] font-semibold text-[#1a1a2e]">
            Generating<span>.</span>
            <span className="gg-d2">.</span>
            <span className="gg-d3">.</span>
          </span>
        </div>
      ) : (
        <p className="grid h-[112px] place-items-center rounded-2xl bg-[#fff7f5] px-4 text-center text-[13px] text-[#e5484d]">
          {card.status === "failed" ? `${(card.reason ?? "The voiceover didn't generate").replace(/\.?$/, ".")}` : "Stopped by user"}
          {onRetry && (
            <>
              {" "}
              <button type="button" onClick={onRetry} className="font-semibold underline underline-offset-2 hover:text-[#c22f32]">
                Retry
              </button>
            </>
          )}
        </p>
      )}
    </div>
  );
}

/* 配音卡「好了」:一条静态波形占位(高度固定的一串竖条) */
const WAVE = [18, 34, 52, 28, 64, 40, 72, 46, 30, 58, 80, 50, 36, 62, 44, 26, 54, 70, 38, 22, 48, 66, 32, 20];
function Waveform({ compact }: { compact?: boolean }) {
  return (
    <div className={`flex h-full items-center justify-center ${compact ? "gap-px px-0.5" : "gap-[3px] px-4"}`} aria-hidden>
      {WAVE.map((h, i) => (
        <span key={i} className={`${compact ? "w-px" : "w-[3px]"} rounded-full bg-[#ff8a4c]`} style={{ height: `${h * (compact ? 0.35 : 1)}%`, opacity: 0.55 + (h / 80) * 0.45 }} />
      ))}
    </div>
  );
}

function Card({ card, still, compact, onRetry }: { card: GridCard; still: Still; compact?: boolean; onRetry?: () => void }) {
  const pill = "absolute left-2 top-2 rounded-full px-2 py-[3px] text-[11px] font-semibold leading-none backdrop-blur-sm";
  if (card.status === "done" && card.kind === "voice") {
    return (
      <div className="relative aspect-[9/16] bg-gradient-to-b from-[#fff7f1] to-[#ffeee4]">
        <Waveform compact={compact} />
        {!compact && <span className={`${pill} bg-black/45 text-white`}>Voiceover · {card.sec}s</span>}
      </div>
    );
  }
  if (card.status === "done" && card.kind === "ai") {
    return (
      <div className="relative aspect-[9/16] bg-[#f1f1f4]">
        {still?.kind === "video" ? (
          <video src={`${still.url}#t=${still.at}`} muted playsInline preload="metadata" className="size-full object-cover" />
        ) : still?.kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={still.url} alt="" className="size-full object-cover" />
        ) : null}
        {!compact && (
          <span className={`${pill} bg-black/45 text-white`}>
            Shot {card.shot} · AI
          </span>
        )}
      </div>
    );
  }
  if (card.status === "generating") {
    return (
      <div className="relative aspect-[9/16]">
        <div className="gen-anim absolute inset-0" />
        {!compact && (
          <span className={`${pill} bg-white/55 text-[#1a1a2e]`}>
            Generating<span>.</span>
            <span className="gg-d2">.</span>
            <span className="gg-d3">.</span>
          </span>
        )}
      </div>
    );
  }
  /* stopped / failed:同产品里的样式 —— 浅粉底 + 灰色图片图标 + 红字一句话 + 下划线 Retry。
     停止写「Stopped by user」;失败写原因(产品界面,一律英文),Retry 只重做这一镜 */
  const failed = card.status === "failed";
  const raw = "reason" in card ? card.reason : undefined;
  const reason = raw === SHOT_FAIL_REASON.zh ? SHOT_FAIL_REASON.en : raw;
  const text = failed ? `${(reason ?? "Generation failed").replace(/\.?$/, ".")}` : "Stopped by user";
  return compact ? (
    <div className="relative aspect-[9/16] bg-[#fff7f5]">{failed && <span className="absolute inset-x-0 bottom-0 h-1 bg-[#e5484d]" aria-label="Failed" />}</div>
  ) : (
    <div className="relative grid aspect-[9/16] place-items-center bg-[#fff7f5]">
      <div className="flex flex-col items-center gap-3 px-4 text-center">
        <ImageIcon className="size-9 text-[#d9d6dd]" strokeWidth={1.5} />
        <p className="text-[13px] leading-relaxed text-[#e5484d]">
          {text}
          {onRetry && (
            <>
              {" "}
              <button type="button" onClick={onRetry} className="font-semibold underline underline-offset-2 hover:text-[#c22f32]">
                Retry
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
