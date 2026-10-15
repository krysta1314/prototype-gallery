"use client";

/* Generate 后的「生成中」宫格(Claude / BuzzVideo 式):一镜一张 9:16 卡,三列。
   没好的卡是暖色渐变 + 「Generating...」小胶囊;好了换成这一镜的画面 + 「Shot n · AI / Footage」。
   宫格下一行灰字进度(Filming in progress... 等),由 logic/genGrid.ts 按 runs.ts 的排程算出。
   live 时挂载即开始计时:把计时器登记给 provider(Stop 读它),失败镜头到点报 onShotFailed,全部结束调用 onDone 一次。
   已结算(成片已出 / 预置回放)静态显示最终状态;成片出来后收成一行小缩略图,可展开。 */

import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { ClipProfile, Outline } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";
import { SHOT_FAIL_REASON, genShot, schedule, toolRuns, totalMs } from "../logic/runs";
import { genGrid, type GridCard } from "../logic/genGrid";
import { DEMO_REEL } from "../reel";
import type { MediaFile, RunsMsg } from "../store";

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

/** 卡片「好了」之后显示的画面:实拍 = 那段素材在入点的一帧;AI 补拍 = 演示成片里错开的一帧 */
function stillsFor(outline: Outline, profiles: ClipProfile[], files: MediaFile[]): Still[] {
  let k = 0;
  return outline.shots.map((s) => {
    const src = s.source;
    if (src.kind === "generate") {
      const at = (1 + (k++ * 4.5)) % DEMO_REEL.durationSec;
      return { url: DEMO_REEL.src, kind: "video", at };
    }
    if (src.kind === "clip") {
      const p = profiles[src.clipIndex];
      const f = files[src.clipIndex];
      const url = p?.objectUrl ?? f?.url;
      const kind = p?.kind ?? f?.kind;
      if (!url || (kind !== "video" && kind !== "image")) return null;
      return { url, kind, at: src.inSec + 0.5 };
    }
    return null;
  });
}

export function GenGrid({
  run,
  live,
  profiles,
  files,
  clockRef,
  onDone,
  onShotFailed,
  onProgress,
}: {
  run: RunsMsg;
  /** 正在跑(否则按结算状态静态显示:跑完 / 停在 stoppedAtMs) */
  live: boolean;
  profiles: ClipProfile[];
  files: MediaFile[];
  clockRef?: MutableRefObject<() => number>;
  onDone: () => void;
  onShotFailed?: (shot: number) => void;
  onProgress?: () => void;
}) {
  const slots = useMemo(() => schedule(toolRuns(run.outline, { only: run.only })), [run.outline, run.only]);
  const stills = useMemo(() => stillsFor(run.outline, profiles, files), [run.outline, profiles, files]);
  const [now, setNow] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const done = useRef(false);
  const reported = useRef(new Set<number>());
  const total = totalMs(slots);

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

  /* 跑完且已结算(成片卡已在下面):收成一行小缩略图,点标题展开 */
  if (!live && grid.phase === "done") {
    const ok = grid.cards.filter((c) => c.status === "done").length;
    const title =
      run.only !== undefined
        ? `Regenerated shot ${run.only}`
        : ok === grid.cards.length
          ? `Generated ${ok} ${ok === 1 ? "shot" : "shots"}`
          : `Generated ${ok} of ${grid.cards.length} shots`;
    return (
      <div className="space-y-2">
        <style>{CSS}</style>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="flex items-center gap-1 text-[13px] text-[#9a9bb0] hover:text-[#6a6b7b]"
        >
          {title}
          {expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
        </button>
        {expanded ? (
          <Grid cards={grid.cards} stills={stills} />
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {grid.cards.map((c) => (
              <div key={c.shot} title={`Shot ${c.shot} · ${c.source}`} className="w-9 overflow-hidden rounded-md border border-[#ececf1]">
                <Card card={c} still={stills[c.shot - 1]} compact />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <style>{CSS}</style>
      <Grid cards={grid.cards} stills={stills} />
      {grid.phase !== "done" && (
        <p className="flex items-center gap-2 text-[13px] text-[#9a9bb0]" aria-live="polite">
          {grid.phase !== "stopped" && (
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

function Grid({ cards, stills }: { cards: GridCard[]; stills: Still[] }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {cards.map((c) => (
        <div key={c.shot} className="overflow-hidden rounded-xl border border-[#ececf1]">
          <Card card={c} still={stills[c.shot - 1]} />
        </div>
      ))}
    </div>
  );
}

function Card({ card, still, compact }: { card: GridCard; still: Still; compact?: boolean }) {
  const pill = "absolute left-2 top-2 rounded-full px-2 py-[3px] text-[11px] font-semibold leading-none backdrop-blur-sm";
  if (card.status === "done") {
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
            Shot {card.shot} · {card.source}
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
  /* failed / stopped:灰调渐变 */
  const failed = card.status === "failed";
  return (
    <div className="relative aspect-[9/16] bg-gradient-to-br from-[#EFEDF1] to-[#E3E0E7]">
      {compact ? (
        failed && <span className="absolute inset-x-0 bottom-0 h-1 bg-[#e5484d]" aria-label="Failed" />
      ) : (
        <>
          <span className={`${pill} ${failed ? "bg-[#e5484d] text-white" : "bg-white/70 text-[#6a6b7b]"}`}>{failed ? "Failed" : "Stopped"}</span>
          {/* 卡片是产品界面,原因一律英文(Agent 回复里的那句才跟回复语言) */}
          {failed && card.reason && (
            <p className="absolute inset-x-2 bottom-2 text-[11.5px] leading-snug text-[#b4383c]">
              {card.reason === SHOT_FAIL_REASON.zh ? SHOT_FAIL_REASON.en : card.reason}
            </p>
          )}
          {!failed && <span className="absolute bottom-2 right-2 text-[11px] text-[#9a9bb0]">Shot {card.shot}</span>}
        </>
      )}
    </div>
  );
}
