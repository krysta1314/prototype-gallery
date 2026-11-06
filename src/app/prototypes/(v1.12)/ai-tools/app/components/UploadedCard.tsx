"use client";

/* 工具页「已上传」的素材卡 —— 所有独立工具页共用(2026-11-06 Monica 定：上传后的样子各页必须一致)。
   样子照 Upscale Image:大预览(最高 220px,按原比例)+ 底部一行「文件名 · 信息」+ Replace,右上角 ✕ 删除。
   图片直接显示;视频静音、可点播放;音频是一条播放器。下面可以再挂一行状态(如 Custom Avatar 的时长检查)。 */

import type { ReactNode } from "react";
import { AudioLines, X } from "lucide-react";

export function UploadedCard({
  kind,
  url,
  poster,
  name,
  meta,
  onReplace,
  onRemove,
  tone = "default",
  children,
}: {
  kind: "image" | "video" | "audio";
  url: string;
  poster?: string;
  name: string;
  /** 文件名后面的补充信息(尺寸、时长等) */
  meta?: string;
  onReplace?: () => void;
  onRemove: () => void;
  /** error:素材不合格时整张卡标红 */
  tone?: "default" | "error";
  /** 卡片最下面的状态行 */
  children?: ReactNode;
}) {
  return (
    <div className={`group relative overflow-hidden rounded-xl ring-1 ${tone === "error" ? "bg-[#fff5f5] ring-[#ffd1d1]" : "bg-[#f1f2f5] ring-[#ececf1]"}`}>
      {kind === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name} className="block max-h-[220px] w-full object-contain" />
      ) : kind === "video" ? (
        <video src={url} poster={poster} muted playsInline controls preload="metadata" className="block max-h-[220px] w-full bg-black object-contain" />
      ) : (
        <div className="flex items-center gap-3 bg-[#fff7f1] px-3 py-4 pr-10">
          <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-[#fff3ec] text-[#ff5e1a]">
            <AudioLines className="size-4" />
          </span>
          <audio src={url} controls className="h-9 min-w-0 flex-1" />
        </div>
      )}
      <div className="flex items-center justify-between gap-2 border-t border-[#ececf1] bg-white px-3 py-2 text-[12px]">
        <span className="min-w-0 truncate text-[#6a6b7b]" title={meta ? `${name} · ${meta}` : name}>
          {name}
          {meta && <span className="tabular-nums"> · {meta}</span>}
        </span>
        {onReplace && (
          <button type="button" onClick={onReplace} className="shrink-0 font-semibold text-[#ff5e1a] hover:underline">
            Replace
          </button>
        )}
      </div>
      {children && <div className="border-t border-[#ececf1] bg-white px-3 py-2 text-[12px]">{children}</div>}
      <button
        type="button"
        aria-label={`Remove ${name}`}
        onClick={onRemove}
        className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-[#1a1a2e]/70 text-white transition hover:bg-[#1a1a2e]"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
