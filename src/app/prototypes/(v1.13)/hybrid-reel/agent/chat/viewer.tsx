"use client";

/* 素材预览:对话里点上传的缩略图,或素材拆解里点某一段时弹出。
   - 原生 <dialog>:自带焦点圈定、Esc 关闭、背后页面不可操作;挂到 body 上,滚轮不会带着对话列表滚
   - 多个素材(或同一条视频的多段)用 ← / → 切换
   - 只看一段(start / end):打开就从这一段开头播到结尾自动停;之后手动拖进度条或继续播就不再拦,
     「Replay」重新从头播这一段 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, RotateCcw, X } from "lucide-react";
import { Tip } from "../../canvas/tip";

export type ViewerItem = {
  kind: "video" | "image";
  src: string;
  /** 顶部标题,一般是文件名 */
  title: string;
  /** 只看一段:在素材里的起止秒数 */
  start?: number;
  end?: number;
  /** 这一段能不能用(决定小标前面圆点的颜色,和素材拆解的时间条一致) */
  usable?: boolean;
  /** 小标:能当什么镜头 / 废片 */
  tag?: string;
  /** 说明:这一段拍了什么,或为什么是废片 */
  caption?: string;
  /** 补充一行:这一段证明了什么卖点 */
  note?: string;
};

const RING = "outline-none focus-visible:ring-2 focus-visible:ring-white/70";

export function MediaViewer({
  items,
  index,
  onIndex,
  onClose,
}: {
  items: ViewerItem[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  /* 点 Replay 换一个 key,播放器重新挂载,从这一段开头再播一遍 */
  const [replay, setReplay] = useState(0);
  const item = items[index];
  const segment = item.end !== undefined;
  const hasPrev = index > 0;
  const hasNext = index < items.length - 1;

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!d.open) d.showModal();
    /* 焦点放在弹窗本身:方向键切换、空格播放 / 暂停都能直接用 */
    d.focus();
    return () => {
      if (d.open) d.close();
      /* 弹窗是直接卸载的,浏览器不会自己还焦点:手动回到点开它的缩略图 */
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);

  const go = (i: number) => {
    onIndex(i);
    /* 点到头时那一侧的按钮会消失,焦点收回弹窗,键盘操作不断 */
    ref.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDialogElement>) => {
    const t = e.target as HTMLElement;
    /* 焦点在播放器上时,方向键和空格交给播放器(快进 / 暂停) */
    if (t.tagName === "VIDEO") return;
    if (e.key === "ArrowLeft" && hasPrev) {
      e.preventDefault();
      go(index - 1);
    } else if (e.key === "ArrowRight" && hasNext) {
      e.preventDefault();
      go(index + 1);
    } else if (e.key === " " && t === e.currentTarget) {
      const v = videoRef.current;
      if (!v) return;
      e.preventDefault();
      if (v.paused) void v.play().catch(() => {});
      else v.pause();
    }
  };

  const range = segment ? `${item.start ?? 0}–${item.end}s` : null;
  const count = items.length > 1 ? `${segment ? "Segment " : ""}${index + 1} of ${items.length}` : null;
  const meta = [range, count].filter(Boolean).join(" · ");

  return createPortal(
    <dialog
      ref={ref}
      tabIndex={-1}
      aria-label={`Preview: ${item.title}`}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        /* 点画面以外的暗色区域关闭;点播放器、图片、文字不算 */
        const t = e.target as HTMLElement;
        if (t === e.currentTarget || t.dataset.backdrop !== undefined) onClose();
      }}
      onKeyDown={onKeyDown}
      className="fixed inset-0 m-0 h-dvh max-h-none w-dvw max-w-none bg-[#0c0c12]/95 p-0 text-white outline-none backdrop:bg-transparent motion-safe:animate-[hr-viewer-in_160ms_ease-out]"
    >
      <style href="hr-viewer" precedence="default">{`@keyframes hr-viewer-in{from{opacity:0}to{opacity:1}}@keyframes hr-viewer-media{from{opacity:0;transform:scale(.985)}to{opacity:1;transform:none}}`}</style>
      <div data-backdrop className="flex h-full flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 pl-6 pr-4">
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold">{item.title}</p>
            {meta && <p className="mt-0.5 text-[12.5px] tabular-nums text-white/60">{meta}</p>}
          </div>
          <Tip label="Close" kbd="Esc" side="bottom" align="end" className="ml-auto">
            <button
              type="button"
              aria-label="Close preview"
              onClick={onClose}
              className={`grid size-9 place-items-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white ${RING}`}
            >
              <X className="size-5" />
            </button>
          </Tip>
        </header>

        <div className="relative min-h-0 flex-1">
          <div data-backdrop className="absolute inset-0 flex items-center justify-center px-20 py-2">
            <Stage key={`${index}-${replay}`} item={item} videoRef={videoRef} />
          </div>
          {hasPrev && <NavButton dir="prev" onClick={() => go(index - 1)} />}
          {hasNext && <NavButton dir="next" onClick={() => go(index + 1)} />}
        </div>

        {segment ? (
          <footer data-backdrop className="flex shrink-0 justify-center px-6 pb-7 pt-4">
            <div className="flex max-w-[64ch] flex-col items-center gap-3 text-center">
              {(item.tag || item.caption) && (
                <p className="text-[13.5px] leading-relaxed text-white/85 [text-wrap:pretty]">
                  {item.tag && (
                    <span className="mr-2 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2 py-0.5 align-[1px] text-[12px] font-semibold text-white/85">
                      <span className="size-1.5 rounded-full" style={{ background: item.usable ? "#ff9563" : "#9a9bb0" }} />
                      {item.tag}
                    </span>
                  )}
                  {item.caption}
                  {item.note && <span className="mt-1 block text-[12.5px] text-white/60">{item.note}</span>}
                </p>
              )}
              {item.kind === "video" && (
                <button
                  type="button"
                  onClick={() => setReplay((n) => n + 1)}
                  className={`flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[12.5px] font-semibold text-white/90 transition-colors hover:bg-white/15 ${RING}`}
                >
                  <RotateCcw className="size-3.5" /> Replay
                </button>
              )}
            </div>
          </footer>
        ) : (
          <div data-backdrop className="h-10 shrink-0" />
        )}
      </div>
    </dialog>,
    document.body,
  );
}

function NavButton({ dir, onClick }: { dir: "prev" | "next"; onClick: () => void }) {
  const prev = dir === "prev";
  return (
    <Tip
      label={prev ? "Previous" : "Next"}
      kbd={prev ? "←" : "→"}
      side="top"
      className={`absolute top-1/2 -translate-y-1/2 ${prev ? "left-5" : "right-5"}`}
    >
      <button
        type="button"
        aria-label={prev ? "Previous" : "Next"}
        onClick={onClick}
        className={`grid size-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 ${RING}`}
      >
        {prev ? <ChevronLeft className="size-5" /> : <ChevronRight className="size-5" />}
      </button>
    </Tip>
  );
}

/** 播到这一段结尾就停。检查慢了(比如标签页在后台、逐帧回调被降频)多播出去一截的话,退回这一段的最后一帧 */
function stopAtEnd(v: HTMLVideoElement, end: number | undefined, armed: React.RefObject<boolean>) {
  if (end === undefined || !armed.current || v.paused || v.currentTime < end - 0.03) return;
  v.pause();
  armed.current = false;
  if (v.currentTime > end + 0.05) v.currentTime = end;
}

function Stage({ item, videoRef }: { item: ViewerItem; videoRef: React.RefObject<HTMLVideoElement | null> }) {
  const [failed, setFailed] = useState(false);
  /* 这一段还没播完:播到结尾自动停。停过一次、或用户拖到这一段外面,就不再拦 */
  const armed = useRef(item.end !== undefined);
  const { start = 0, end } = item;

  useEffect(() => {
    if (end === undefined) return;
    let raf = 0;
    /* timeupdate 一秒只来四次,会多播出去一截;逐帧检查才停得准,timeupdate 留作兜底 */
    const tick = () => {
      if (videoRef.current) stopAtEnd(videoRef.current, end, armed);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [end, videoRef]);

  if (failed) return <p className="text-[13.5px] text-white/70">This file can’t be previewed.</p>;

  const media = "max-h-full max-w-full rounded-xl object-contain motion-safe:animate-[hr-viewer-media_200ms_cubic-bezier(0.22,1,0.36,1)]";
  if (item.kind === "image") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={item.src} alt={item.title} onError={() => setFailed(true)} className={media} />;
  }
  return (
    <video
      ref={videoRef}
      /* 起点用媒体片段参数,打开时直接停在这一段开头,不会先闪一下第 0 秒 */
      src={start > 0 ? `${item.src}#t=${start}` : item.src}
      controls
      autoPlay
      playsInline
      preload="auto"
      onLoadedMetadata={(e) => {
        const v = e.currentTarget;
        if (start > 0 && v.currentTime < start - 0.05) v.currentTime = start;
      }}
      onTimeUpdate={(e) => stopAtEnd(e.currentTarget, end, armed)}
      onSeeking={(e) => {
        if (end === undefined) return;
        const t = e.currentTarget.currentTime;
        if (t < start - 0.2 || t > end + 0.2) armed.current = false;
      }}
      onError={() => setFailed(true)}
      className={`${media} bg-black`}
    />
  );
}
