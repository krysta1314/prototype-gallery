"use client";

/* 结果的全屏查看(2026-11-06 Monica 定：点结果图要能放大看)。
   图片：点图片本身打开;视频：右上角放大按钮打开(点视频本身留给播放控件)。
   全屏层：黑底，媒体按比例铺满(最大 92vw × 88vh),右上角 ✕;Esc 或点空白处关闭。My Results 和 Team Results 共用。 */

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Maximize2, X } from "lucide-react";

type Item = { kind: "image" | "video"; url: string; alt: string; poster?: string };

function Overlay({ item, onClose }: { item: Item; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  return (
    <div role="dialog" aria-modal="true" aria-label={item.alt} className="fixed inset-0 z-[70] grid place-items-center bg-black/85 p-6" onClick={onClose}>
      <button type="button" autoFocus onClick={onClose} aria-label="Close" className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white/15 text-white transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
        <X className="size-5" />
      </button>
      <div onClick={(e) => e.stopPropagation()} className="max-h-[88vh] max-w-[92vw]">
        {item.kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.url} alt={item.alt} className="block max-h-[88vh] max-w-[92vw] rounded-xl object-contain" />
        ) : (
          <video src={item.url} poster={item.poster} controls autoPlay playsInline className="block max-h-[88vh] max-w-[92vw] rounded-xl bg-black" />
        )}
      </div>
    </div>
  );
}

/** 每个结果列表一个:open(item) 打开全屏;把 preview 放进页面里 */
export function useMediaPreview(): { open: (item: Item) => void; preview: ReactNode } {
  const [item, setItem] = useState<Item | null>(null);
  const close = useCallback(() => setItem(null), []);
  return { open: setItem, preview: item ? <Overlay item={item} onClose={close} /> : null };
}

/** 图片：可点击放大的属性(放在 <img> 上;鼠标样式另加 cursor-zoom-in) */
export const zoomable = (open: () => void) => ({
  role: "button" as const,
  tabIndex: 0,
  title: "View full size",
  onClick: open,
  onKeyDown: (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
    }
  },
});

/** 视频右上角的放大按钮(外层要 relative) */
export function ExpandButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="View full screen"
      title="View full screen"
      className="absolute right-2 top-2 z-10 grid size-8 place-items-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
    >
      <Maximize2 className="size-4" />
    </button>
  );
}
