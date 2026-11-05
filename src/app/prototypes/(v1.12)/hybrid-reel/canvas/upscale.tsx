"use client";

/* 画布上图片节点的放大入口:选中就绪的图片节点时,节点上方的悬浮 toolbar(Upscale / Download Image / 删除),
   点 Upscale 弹出锚在节点右侧的浮层:参数面板(和 Agent 放大模式共用 UpscalePanel)+ 预计积分 + Upscale 按钮。
   只有传了 upscaleApi 的画布才出现(hybrid-reel 原画布不显示,保持原样)。 */

import { ArrowUp, Download, Heart, Loader2, Scaling, Trash2, X } from "lucide-react";
import { UpscalePanel } from "../../ai-tools/app/components/UpscalePanel";
import { outputSize, upscaleCredits, type UpscaleParams } from "../../ai-tools/app/logic";
import { formatBytes } from "../../ai-tools/app/files";
import { formatCredits } from "./credits";
import { Tip } from "./tip";

export type PixelSize = { width: number; height: number };

/** 这张图按这组参数放大要扣多少积分(宽高必须是已知正数) */
export function upscaleCost(src: PixelSize, params: UpscaleParams): number {
  const out = outputSize(src.width, src.height, params);
  return upscaleCredits(out.w, out.h);
}

export const NO_SIZE_HINT = "Image size isn't available yet.";

/** 选中图片节点时浮在节点上方的一条工具栏 */
export function ImageToolbar({
  style,
  canUpscale,
  upscaleOpen,
  downloadPct,
  fileSize,
  favorite,
  onUpscale,
  onDownload,
  onToggleFavorite,
  onDelete,
}: {
  style: React.CSSProperties;
  /** 图片真实像素尺寸已知才能放大 */
  canUpscale: boolean;
  upscaleOpen: boolean;
  /** null = 没在下载;0 = 刚开始 / 不知道总大小;1–100 = 进度(和 Agent 结果卡一样显示 Downloading NN%) */
  downloadPct: number | null;
  /** 文件大小已知(放大结果)时,下载提示带上大小 */
  fileSize?: number;
  favorite: boolean;
  onUpscale: () => void;
  onDownload: () => void;
  onToggleFavorite: () => void;
  onDelete?: () => void;
}) {
  const downloading = downloadPct !== null;
  const btn =
    "grid size-8 place-items-center rounded-lg text-[#4a4b5c] outline-none transition hover:bg-[#f3f4f6] hover:text-[#1a1a2e] focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40 disabled:opacity-40 disabled:hover:bg-transparent";
  return (
    <div
      role="toolbar"
      aria-label="Image actions"
      data-image-tools
      data-nodrag
      onPointerDown={(e) => e.stopPropagation()}
      className="absolute z-30 flex -translate-x-1/2 -translate-y-full items-center gap-0.5 rounded-xl border border-[#ececf1] bg-white p-1 shadow-[0_8px_24px_rgba(26,26,46,0.12)]"
      style={style}
    >
      <span title={canUpscale ? undefined : NO_SIZE_HINT}>
        <button
          type="button"
          onClick={onUpscale}
          disabled={!canUpscale}
          aria-expanded={upscaleOpen}
          aria-haspopup="dialog"
          className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40 disabled:opacity-40 ${
            upscaleOpen ? "bg-[#fff1ea] text-[#e2500f]" : "text-[#1a1a2e] hover:bg-[#f3f4f6]"
          }`}
        >
          <Scaling className="size-4" />
          Upscale
        </button>
      </span>
      <span className="mx-0.5 h-5 w-px bg-[#ececf1]" aria-hidden />
      <Tip label={fileSize ? `Download Image · ${formatBytes(fileSize)}` : "Download Image"}>
        {downloading ? (
          <button
            type="button"
            aria-label="Downloading"
            aria-live="polite"
            disabled
            className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-semibold tabular-nums text-[#4a4b5c]"
          >
            <Loader2 className="size-4 animate-spin" />
            {downloadPct > 0 ? `Downloading ${downloadPct}%` : "Downloading…"}
          </button>
        ) : (
          <button type="button" aria-label="Download Image" onClick={onDownload} className={btn}>
            <Download className="size-4" />
          </button>
        )}
      </Tip>
      <Tip label={favorite ? "Remove from Favorites" : "Add to Favorites"}>
        <button type="button" aria-label="Favorites" aria-pressed={favorite} onClick={onToggleFavorite} className={btn}>
          <Heart className={`size-4 ${favorite ? "fill-[#ff5e1a] text-[#ff5e1a]" : ""}`} />
        </button>
      </Tip>
      {onDelete && (
        <Tip label="Delete" kbd="⌫">
          <button type="button" aria-label="Delete" onClick={onDelete} className={btn}>
            <Trash2 className="size-4" />
          </button>
        </Tip>
      )}
    </div>
  );
}

/** 点 Upscale 弹出的参数浮层 */
export function UpscalePopover({
  style,
  source,
  params,
  onChange,
  onConfirm,
  onClose,
}: {
  style: React.CSSProperties;
  /** 源图真实像素;不知道(null)时 Upscale 置灰 */
  source: PixelSize | null;
  params: UpscaleParams;
  onChange: (p: UpscaleParams) => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const cost = source ? upscaleCost(source, params) : null;
  return (
    <div
      role="dialog"
      aria-label="Upscale image"
      data-upscale-pop
      data-nodrag
      onPointerDown={(e) => e.stopPropagation()}
      className="absolute z-40 flex w-[332px] cursor-default flex-col overflow-hidden rounded-[20px] border border-[#ececf1] bg-white shadow-[0_16px_36px_rgba(26,26,46,0.2)]"
      style={style}
    >
      <div className="flex items-center gap-2 px-4 pb-2 pt-3.5">
        <Scaling className="size-4 text-[#ff5e1a]" />
        <h2 className="text-[14px] font-bold text-[#1a1a2e]">Upscale</h2>
        {/* 模型小标和工具页标题旁的一样 */}
        <span className="rounded-full bg-[#fff3ec] px-2 py-[2px] text-[11px] font-bold text-[#ff5e1a]" title="Model">SeedVR</span>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="ml-auto grid size-7 place-items-center rounded-lg text-[#6a6b7b] transition hover:bg-[#f3f4f6] hover:text-[#1a1a2e]"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-3 [scrollbar-gutter:stable] [scrollbar-width:thin]">
        <UpscalePanel compact params={params} onChange={onChange} source={source} sizeEmptyText={NO_SIZE_HINT} />
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-[#f1f1f4] px-4 py-3">
        {/* 2026-11-05:积分 + 提交和画布视频节点底栏一样(橙色积分块 + 圆形箭头按钮) */}
        <span
          className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-[#ffd8c2] bg-[#fff7f1] px-2.5 text-[13px] font-bold tabular-nums text-[#ff5e1a]"
          aria-label={cost === null ? "Estimated credits: unknown" : `Estimated credits: ${cost}`}
        >
          <span className="grid size-4 place-items-center rounded-full bg-gradient-to-b from-[#ff5255] to-[#ffa73c] text-[9px] text-white">✦</span>
          {cost === null ? "–" : formatCredits(cost)}
        </span>
        <span title={source ? undefined : NO_SIZE_HINT}>
          <button
            type="button"
            aria-label="Upscale"
            onClick={onConfirm}
            disabled={!source}
            className="grid size-9 place-items-center rounded-full bg-gradient-to-b from-[#ff5255] to-[#ffa73c] text-white shadow-[0_2px_0_#b65a42] transition hover:brightness-105 disabled:opacity-40 disabled:shadow-none"
          >
            <ArrowUp className="size-4" strokeWidth={2.5} />
          </button>
        </span>
      </div>
    </div>
  );
}
