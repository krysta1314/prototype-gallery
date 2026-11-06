"use client";
import { zoomable } from "./MediaPreview";

/* 放大结果卡(2026-11-05 Monica 定):直接展示放大后的图，不做前后对比;
   卡片标题行(参考图 + 模型 · 参数)由调用方画，这里只有图 + 操作按钮
   Download(原文件原格式,下载中显示百分比)/ Favorites / Upscale again / Open in canvas。
   下载状态、收藏态由调用方管(toast 也在调用方)。 */

import { useRef, useState } from "react";
import { Download, Frame, Heart, Scaling } from "lucide-react";
import type { UpscaleResult, UpscaleSource } from "../api";

/** 结果图 / 生成中占位的最大高度(竖图按比例收窄) */
export const RESULT_MAX_H = 260;

/** Before / After 对比:After(结果)垫底,Before(原图)盖在上面按滑块裁左半。
    拖动用 pointer 事件(鼠标 / 手指都行,按下哪里分割线就跳到哪里);touch-action: pan-y 让手指上下划仍然滚页面、左右划才拖分割线。
    透明 range 只管键盘(←→ 调整)和读屏,不接指针。 */
export function CompareSlider({ before, after, afterAlt = "Upscaled result", initial = 50 }: { before: string; after: Pick<UpscaleResult, "url" | "width" | "height">; afterAlt?: string; /** 分割线起始位置(%) */ initial?: number }) {
  const [pos, setPos] = useState(initial);
  const boxRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const ratio = after.width / after.height;
  const moveTo = (clientX: number) => {
    const r = boxRef.current?.getBoundingClientRect();
    if (!r || r.width <= 0) return;
    setPos(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)));
  };
  return (
    <div
      ref={boxRef}
      onPointerDown={(e) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        dragging.current = true;
        e.currentTarget.setPointerCapture?.(e.pointerId);
        moveTo(e.clientX);
      }}
      onPointerMove={(e) => dragging.current && moveTo(e.clientX)}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
      className="relative w-full cursor-ew-resize touch-pan-y select-none overflow-hidden rounded-2xl bg-[#f1f2f5] ring-1 ring-[#ececf1]"
      /* 竖图不超过 560px 高:按比例限制宽度 */
      style={{ aspectRatio: `${after.width} / ${after.height}`, maxWidth: `min(100%, ${Math.round(560 * ratio)}px)` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={after.url} alt={afterAlt} draggable={false} className="absolute inset-0 size-full object-cover" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={before}
        alt="Original"
        draggable={false}
        className="absolute inset-0 size-full object-cover"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      />
      <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-[#1a1a2e]/70 px-2 py-[3px] text-[11px] font-semibold text-white">Before</span>
      <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-[#1a1a2e]/70 px-2 py-[3px] text-[11px] font-semibold text-white">After</span>
      {/* 分割线 + 把手 */}
      <span className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_6px_rgba(26,26,46,0.35)]" style={{ left: `${pos}%` }}>
        <span className="absolute left-1/2 top-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-[#1a1a2e] shadow-[0_2px_8px_rgba(26,26,46,0.25)]">
          <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M6 4 2 8l4 4M10 4l4 4-4 4" />
          </svg>
        </span>
      </span>
      <input
        type="range"
        min={0}
        max={100}
        step={0.5}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label="Compare before and after"
        className="pointer-events-none absolute inset-0 size-full appearance-none bg-transparent opacity-0"
      />
    </div>
  );
}

const ACTION =
  "inline-flex h-10 items-center justify-center gap-1.5 whitespace-nowrap max-sm:flex-1 sm:h-9 rounded-lg border border-[#ececf1] bg-white px-3 text-[13px] font-semibold text-[#1a1a2e] transition hover:border-[#ffbd99] hover:bg-[#fffaf7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40 disabled:cursor-default disabled:opacity-60";

export function ResultCard({
  source,
  result,
  favorite,
  downloadPct,
  onDownload,
  onToggleFavorite,
  onUpscaleAgain,
  onOpenInCanvas,
  extra,
  onPreview,
}: {
  source: UpscaleSource;
  result: UpscaleResult;
  favorite: boolean;
  /** null = 没在下载;0 = 刚开始 / 不知道总大小;1–100 = 进度 */
  downloadPct: number | null;
  onDownload: () => void;
  onToggleFavorite: () => void;
  onUpscaleAgain: () => void;
  onOpenInCanvas: () => void;
  /** 操作行末尾追加(团队工作区的 Share) */
  extra?: React.ReactNode;
  /** 点图片全屏查看 */
  onPreview?: () => void;
}) {
  const downloading = downloadPct !== null;
  return (
    <div className="w-full">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={result.url}
        alt={`Upscaled from ${source.name}`}
        {...(onPreview ? zoomable(onPreview) : {})}
        className={`block w-full rounded-2xl bg-[#f1f2f5] object-cover ring-1 ring-[#ececf1] ${onPreview ? "cursor-zoom-in" : ""}`}
        style={{ aspectRatio: `${result.width} / ${result.height}`, maxWidth: `min(100%, ${Math.round((RESULT_MAX_H * result.width) / result.height)}px)` }}
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={onDownload} disabled={downloading} aria-live="polite" className={`${ACTION} max-sm:basis-full sm:min-w-[164px]`}>
          <Download className="size-4" />
          {downloading ? (downloadPct > 0 ? `Downloading ${downloadPct}%` : "Downloading…") : "Download"}
        </button>
        <button type="button" onClick={onToggleFavorite} aria-pressed={favorite} className={ACTION}>
          <Heart className={`size-4 ${favorite ? "fill-[#ff5e1a] text-[#ff5e1a]" : ""}`} />
          Favorites
        </button>
        <button type="button" onClick={onUpscaleAgain} className={ACTION}>
          <Scaling className="size-4" />
          Upscale again
        </button>
        <button type="button" onClick={onOpenInCanvas} className={ACTION}>
          <Frame className="size-4" />
          Open in canvas
        </button>
        {extra}
      </div>
    </div>
  );
}
