"use client";

/* 画布第二行「Video」(2026-11-06 Monica 定：独立工具页的能力搬到画布上，做法和图片节点的 Upscale 一样)。
   - 视频节点 / 音频节点(样例：一段口播、一段动作视频、一段配音;工具生成的结果也落在这一行);
   - 选中视频节点 → 上方工具栏：Upscale Video | Lip Sync | Character Swap | Motion Control | 3D to Video | 下载 / 收藏 / 删除;
   - 选中音频节点 → Lip Sync | Talking Avatar | 下载 / 收藏 / 删除(没有 Upscale;音频自动填进语音位);
   - 点一个工具 → 节点下方出参数浮层(Upscale = 和 Upscale Video 工具页同一套参数;其余 = CanvasToolPopover,和工具页同一套 specs),
     当前节点自动填进素材位，其余素材在浮层里上传或点画布上已有的节点;
   - 生成 → 在来源右边第一个空位新建一个连线的结果节点(生成中 → 结果)。原型不真跑模型，结果规则同工具页。 */

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Box, Drama, Film, MessageSquareText, MonitorUp, Pause, Play, PersonStanding, Scaling, Speech, X } from "lucide-react";
import { ImageToolbar } from "@/app/prototypes/(v1.12)/hybrid-reel/canvas/upscale";
import { formatCredits } from "@/app/prototypes/(v1.12)/hybrid-reel/canvas/credits";
import { CanvasToolPopover } from "@/app/prototypes/(v1.12)/ai-tools/app/model-tools/CanvasToolPopover";
import { CANVAS_TOOLS, CANVAS_TOOL_LABEL } from "@/app/prototypes/(v1.12)/ai-tools/app/model-tools/canvasTools";
import type { Media, ToolState } from "@/app/prototypes/(v1.12)/ai-tools/app/model-tools/logic";
import { VideoUpscaleParamsPanel } from "@/app/prototypes/(v1.12)/ai-tools/app/video-upscale/VideoUpscaleTool";
import { DEFAULT_VIDEO_PARAMS, videoOutputSize, videoUpscaleCredits, type VideoUpscaleParams } from "@/app/prototypes/(v1.12)/ai-tools/app/video-upscale/logic";
import { IMG_H, IMG_W, Section } from "./ImageRow";

export type VItem = {
  id: string;
  x: number;
  media: Media;
  status: "ready" | "running";
  /** 同一行里的来源节点(画连线) */
  from?: string;
  /** 节点标题：Video / Audio / 工具名 */
  title: string;
  w?: number;
  h?: number;
};

/** 工具按钮的图标 = 侧边栏菜单里同一个工具的图标(sidebarMenus.ts),两边要一致 */
export const TOOL_ICON: Record<string, typeof Scaling> = {
  "lip-sync": MessageSquareText,
  "character-swap": Drama,
  "motion-control": PersonStanding,
  "render-3d": Box,
  "talking-avatar": Speech,
};

/** 工具栏里的一个工具按钮(和 Upscale 按钮同一个样子) */
export function ToolButton({ tool, open, onClick }: { tool: string; open: boolean; onClick: () => void }) {
  const Icon = TOOL_ICON[tool] ?? Film;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-haspopup="dialog"
      className={`flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 text-[13px] font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40 ${
        open ? "bg-[#fff1ea] text-[#e2500f]" : "text-[#1a1a2e] hover:bg-[#f3f4f6]"
      }`}
    >
      <Icon className="size-4" />
      {CANVAS_TOOL_LABEL[tool]}
    </button>
  );
}

/** 视频节点的 Upscale 浮层(参数 = Upscale Video 工具页同一套) */
function VideoUpscalePopover({ item, onClose, onConfirm }: { item: VItem; onClose: () => void; onConfirm: (p: VideoUpscaleParams, credits: number | null) => void }) {
  const [params, setParams] = useState<VideoUpscaleParams>(DEFAULT_VIDEO_PARAMS);
  const known = item.w && item.h && item.media.secs;
  const out = known ? videoOutputSize(item.w!, item.h!, params) : null;
  const credits = out ? videoUpscaleCredits(out.w, out.h, item.media.secs!) : null;
  return (
    <div
      role="dialog"
      aria-label="Upscale video"
      data-upscale-pop
      onClick={(e) => e.stopPropagation()}
      className="absolute z-40 flex w-[332px] cursor-default flex-col overflow-hidden rounded-[20px] border border-[#ececf1] bg-white shadow-[0_16px_36px_rgba(26,26,46,0.2)]"
      style={{ left: 0, top: 178, maxHeight: 520 }}
    >
      <div className="flex items-center gap-2 px-4 pb-2 pt-3.5">
        <MonitorUp className="size-4 text-[#ff5e1a]" />
        <h2 className="text-[14px] font-bold text-[#1a1a2e]">Upscale Video</h2>
        <span className="rounded-full bg-[#fff3ec] px-2 py-[2px] text-[11px] font-bold text-[#ff5e1a]" title="Model">
          SeedVR
        </span>
        <button type="button" aria-label="Close" onClick={onClose} className="ml-auto grid size-7 place-items-center rounded-lg text-[#6a6b7b] transition hover:bg-[#f3f4f6] hover:text-[#1a1a2e]">
          <X className="size-4" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-3 thin-scroll">
        {out && (
          <p className="mb-3 text-[12px] tabular-nums text-[#6a6b7b]">
            {item.w} × {item.h} → <span className="font-semibold text-[#1a1a2e]">{out.w} × {out.h}</span>
          </p>
        )}
        <VideoUpscaleParamsPanel params={params} onChange={(p) => setParams((x) => ({ ...x, ...p }))} />
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-[#f1f1f4] px-4 py-3">
        <span className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-[#ffd8c2] bg-[#fff7f1] px-2.5 text-[13px] font-bold tabular-nums text-[#ff5e1a]" aria-label={`Estimated credits: ${credits ?? "unknown"}`}>
          <span className="grid size-4 place-items-center rounded-full bg-gradient-to-b from-[#ff5255] to-[#ffa73c] text-[9px] text-white">✦</span>
          {credits === null ? "–" : formatCredits(credits)}
        </span>
        <button
          type="button"
          aria-label="Upscale"
          onClick={() => onConfirm(params, credits)}
          className="grid size-9 place-items-center rounded-full bg-gradient-to-b from-[#ff5255] to-[#ffa73c] text-white shadow-[0_2px_0_#b65a42] transition hover:brightness-105"
        >
          <ArrowUp className="size-4" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

/** 音频节点高度(照线上画布：一条波形播放条，比视频节点矮) */
export const AUD_H = 78;
/** 节点中线(连线从这里进出):音频节点比视频矮 */
const midOf = (m: VItem) => 22 + (m.media.kind === "audio" ? AUD_H : IMG_H) / 2;

const WAVE = [5, 9, 14, 8, 17, 12, 20, 11, 7, 15, 19, 10, 6, 13, 18, 9, 14, 7, 11, 16, 8, 12, 6, 10, 14, 7, 5];
const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/** 音频节点：照线上画布 Audio Generator 节点——橙色渐变播放键 + 波形(播过的部分变橙)+ 时间 */
function AudioPill({ url, secs }: { url: string; secs?: number }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const [dur, setDur] = useState(secs ?? 0);
  useEffect(() => () => ref.current?.pause(), []);
  const pct = dur ? t / dur : 0;
  return (
    <div className="flex w-full items-center gap-3 rounded-xl bg-[#f6f5f3] px-2.5 py-2" onClick={(e) => e.stopPropagation()}>
      <audio
        ref={ref}
        src={url}
        preload="metadata"
        onLoadedMetadata={(e) => setDur(e.currentTarget.duration || dur)}
        onTimeUpdate={(e) => setT(e.currentTarget.currentTime)}
        onEnded={() => (setPlaying(false), setT(0))}
      />
      <button
        type="button"
        aria-label={playing ? "Pause" : "Play"}
        onClick={() => {
          const a = ref.current;
          if (!a) return;
          if (playing) a.pause();
          else void a.play();
          setPlaying(!playing);
        }}
        className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#ff8a3c] to-[#ff4d4d] text-white shadow-[0_4px_10px_rgba(255,94,26,0.35)] transition hover:brightness-105"
      >
        {playing ? <Pause className="size-4 fill-current" /> : <Play className="ml-0.5 size-4" />}
      </button>
      <div
        className="flex h-6 flex-1 cursor-pointer items-center gap-[2px]"
        aria-hidden
        onClick={(e) => {
          const a = ref.current;
          const r = e.currentTarget.getBoundingClientRect();
          if (a && dur) a.currentTime = ((e.clientX - r.left) / r.width) * dur;
        }}
      >
        {WAVE.map((h, i) => (
          <span key={i} className={`w-[2px] rounded-full ${i / WAVE.length < Math.max(pct, playing || t ? pct : 0.3) ? "bg-[#ff5e1a]" : "bg-[#cfcdd6]"}`} style={{ height: h }} />
        ))}
      </div>
      <span className="shrink-0 text-[12px] tabular-nums text-[#4a4b5c]">
        {fmtTime(t)} / {fmtTime(dur)}
      </span>
    </div>
  );
}

export function VideoRow({
  x0,
  y,
  items,
  setItems,
  selected,
  onSelect,
  canvasMedia,
  onRunTool,
  onUpscale,
  onDuplicate,
  expanded = false,
}: {
  x0: number;
  y: number;
  items: VItem[];
  setItems: (f: (all: VItem[]) => VItem[]) => void;
  selected: string | null;
  onSelect: (id: string) => void;
  canvasMedia: Media[];
  onRunTool: (tool: string, from: VItem, state: ToolState) => void;
  onUpscale: (from: VItem, params: VideoUpscaleParams) => void;
  /** 复制节点(下载 / 收藏 / 复制 / 删除是所有节点固定的 4 个) */
  onDuplicate: (src: VItem) => void;
  /** true = 和图片行一样，每个视频节点都直接展开工具栏 + 浮层(默认 Upscale Video),评审一眼看全 */
  expanded?: boolean;
}) {
  /** 每个节点打开的浮层(upscale 或 specs 的工具 key;null = 关着;没记录 = 展开模式下默认 upscale) */
  const [pops, setPops] = useState<Record<string, string | null>>({});
  /* 展开模式只展开一开始的样例节点(间隔够宽);工具生成的结果节点选中时才出工具栏，不然相邻工具栏会叠在一起 */
  const autoOpen = (id: string) => expanded && !items.find((x) => x.id === id)?.from;
  /* 展开模式默认打开第一个工具：视频 = Upscale Video,音频 = Lip Sync */
  const openOf = (id: string, video: boolean) => (id in pops ? pops[id] : autoOpen(id) ? (video ? "upscale" : CANVAS_TOOLS.audio[0]) : null);
  const setPop = (id: string, tool: string | null) => setPops((p) => ({ ...p, [id]: tool }));
  const [fav, setFav] = useState<Set<string>>(new Set());
  const readMeta = (id: string, el: HTMLVideoElement) =>
    setItems((all) => all.map((x) => (x.id === id && !x.w ? { ...x, w: el.videoWidth, h: el.videoHeight, media: { ...x.media, secs: x.media.secs ?? el.duration } } : x)));
  /* 非展开模式下同一时间只开一个浮层 */
  const toggle = (id: string, video: boolean, tool: string) =>
    setPops((p) => ({ ...(expanded ? p : {}), [id]: openOf(id, video) === tool ? null : tool }));

  const right = items.length ? Math.max(...items.map((m) => m.x)) + IMG_W + 12 + 332 + 30 : x0 + IMG_W + 400;
  return (
    <>
      <Section label="Video" count={items.length || undefined} left={x0 - 210} top={y - 64} width={right - (x0 - 210)} height={770} />
      <svg className="pointer-events-none absolute inset-0 size-full overflow-visible" aria-hidden>
        {items
          .filter((m) => m.from)
          .map((m) => {
            const a = items.find((x) => x.id === m.from);
            if (!a) return null;
            /* 音频节点比视频矮：连线从各自的中线进出 */
            const ya = y + midOf(a);
            const yy = y + midOf(m);
            /* 来源和结果中间隔着别的节点时，连线从节点下方绕过去，不从中间节点上穿过(否则看起来像一条链) */
            const blocked = items.some((x) => x.x > a.x && x.x < m.x);
            const by = y + 22 + IMG_H + 16;
            const mx = (a.x + IMG_W + m.x) / 2;
            const d = blocked
              ? `M${a.x + IMG_W},${ya} C${a.x + IMG_W + 40},${ya} ${a.x + IMG_W + 40},${by} ${a.x + IMG_W + 80},${by} L${m.x - 80},${by} C${m.x - 40},${by} ${m.x - 40},${yy} ${m.x},${yy}`
              : `M${a.x + IMG_W},${ya} C${mx},${ya} ${mx},${yy} ${m.x},${yy}`;
            return <path key={m.id} d={d} stroke="#ff8a4c" strokeWidth={2} fill="none" />;
          })}
      </svg>
      {items.map((m) => {
        const on = m.id === selected;
        const isVideo = m.media.kind === "video";
        const shown = m.status === "ready" && (on || autoOpen(m.id));
        const open = shown ? openOf(m.id, isVideo) : null;
        return (
          /* 选中的节点压在上面：它的工具栏 / 浮层不会被旁边展开的盖住 */
          <div key={m.id} className="absolute" style={{ left: m.x, top: y, width: IMG_W, zIndex: on ? 20 : undefined }} onClick={(e) => (e.stopPropagation(), onSelect(m.id))}>
            <div className="mb-1.5 flex items-center justify-between gap-2 text-[12px]">
              <span className="shrink-0 font-semibold text-[#4a4b5c]">{m.title}</span>
              {/* 2026-11-06 Monica:右上角不写尺寸 / 时长 */}
            </div>
            <div style={{ height: isVideo || m.status === "running" ? IMG_H : AUD_H }} className={`relative grid place-items-center overflow-hidden rounded-2xl bg-white transition ${isVideo ? "" : "px-2.5"} ${on ? "border-2 border-[#ff6a3d] shadow-[0_8px_24px_rgba(255,94,26,0.12)]" : "border border-[#e4e3ea]"}`}>
              {m.status === "running" ? (
                <div className="text-center">
                  <Film className="mx-auto size-4 animate-pulse text-[#ff5e1a]" />
                  <p className="mt-1.5 text-[13px] font-semibold text-[#1a1a2e]">Generating…</p>
                </div>
              ) : isVideo ? (
                <video
                  src={m.media.url}
                  muted
                  loop
                  playsInline
                  controls={on}
                  preload="metadata"
                  className="size-full bg-black object-contain"
                  /* 读宽高(Upscale 算积分用);页面加载前就读完元数据时 loadedmetadata 不会再触发，所以 ref 里也补读一次 */
                  ref={(el) => {
                    if (el && !m.w && el.readyState >= 1) queueMicrotask(() => readMeta(m.id, el));
                  }}
                  onLoadedMetadata={(e) => readMeta(m.id, e.currentTarget)}
                />
              ) : (
                <AudioPill url={m.media.url} secs={m.media.secs} />
              )}
            </div>
            {shown && (
              <ImageToolbar
                label={isVideo ? "Video" : "Audio"}
                showUpscale={isVideo}
                onDuplicate={() => onDuplicate(m)}
                upscaleLabel="Upscale Video"
                upscaleIcon={MonitorUp}
                style={{ left: IMG_W / 2, top: -10 }}
                canUpscale={isVideo}
                upscaleOpen={open === "upscale"}
                downloadPct={null}
                favorite={fav.has(m.id)}
                onToggleFavorite={() =>
                  setFav((s) => {
                    const n = new Set(s);
                    if (n.has(m.id)) n.delete(m.id);
                    else n.add(m.id);
                    return n;
                  })
                }
                onUpscale={() => toggle(m.id, isVideo, "upscale")}
                extra={CANVAS_TOOLS[isVideo ? "video" : "audio"].map((t) => <ToolButton key={t} tool={t} open={open === t} onClick={() => toggle(m.id, isVideo, t)} />)}
                onDownload={() => {
                  const a = document.createElement("a");
                  a.href = m.media.url;
                  a.download = m.media.name;
                  a.click();
                }}
                onDelete={() => {
                  setPop(m.id, null);
                  setItems((all) => all.filter((x) => x.id !== m.id));
                }}
              />
            )}
            {open === "upscale" && (
              <VideoUpscalePopover
                item={m}
                onClose={() => setPop(m.id, null)}
                onConfirm={(p) => {
                  setPop(m.id, null);
                  onUpscale(m, p);
                }}
              />
            )}
            {open && open !== "upscale" && (
              <CanvasToolPopover
                key={open}
                tool={open}
                node={m.media}
                canvasMedia={canvasMedia}
                /* 音频节点：浮层在节点正下方居中(2026-11-18 Monica) */
                style={isVideo ? { left: 0, top: 178, maxHeight: 520 } : { left: "50%", transform: "translateX(-50%)", top: 22 + AUD_H + 10, maxHeight: 520 }}
                onClose={() => setPop(m.id, null)}
                onConfirm={(s) => {
                  setPop(m.id, null);
                  onRunTool(open, m, s);
                }}
              />
            )}
          </div>
        );
      })}
    </>
  );
}
