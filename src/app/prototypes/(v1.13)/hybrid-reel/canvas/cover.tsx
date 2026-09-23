"use client";

/* 视频封面。
   视频轨最前面一格「Cover」:点开选封面 —— 时间线上挑一帧 / 从画布图片与资产库选 / Design with AI。
   Design with AI 不在这里生成,而是在画布上加一个 Image Generator 节点、打开它的 Settings 面板,
   参数预填好(参考这一帧、爆款封面、16:9、英文文案),用户在面板里点生成 —— 和产品里其他生成节点一致。 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Pencil, Sparkles, X } from "lucide-react";
import { Filmstrip } from "./player";
import { LIBRARY_IMAGES, fmt, layoutClips, segmentAt, type CoverRef, type Project } from "./project";
import { AI_STRIPES } from "./ui";

/* ── 取帧 ── */
export function captureFrame(url: string, time: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const v = document.createElement("video");
    v.crossOrigin = "anonymous";
    v.muted = true;
    v.preload = "auto";
    v.src = url;
    v.onerror = () => reject(new Error("frame"));
    v.onloadedmetadata = () => {
      v.currentTime = Math.max(0, Math.min(time, (v.duration || time) - 0.05));
    };
    v.onseeked = () => {
      try {
        const w = Math.min(960, v.videoWidth || 540);
        const h = Math.round((w * (v.videoHeight || 960)) / Math.max(1, v.videoWidth || 540));
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        c.getContext("2d")?.drawImage(v, 0, 0, w, h);
        resolve(c.toDataURL("image/jpeg", 0.82));
      } catch (e) {
        reject(e);
      } finally {
        v.removeAttribute("src");
        v.load();
      }
    };
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/* 原型里不真调生图模型:用参考帧合成一张 16:9、带英文大标题的封面,当作 Image Generator 的产出 */
export async function composeCover(refSrc: string): Promise<string> {
  const W = 1280;
  const H = 720;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  const img = await loadImage(refSrc);
  const cover = Math.max(W / img.width, H / img.height);
  ctx.filter = "blur(28px) brightness(0.55) saturate(1.2)";
  ctx.drawImage(img, (W - img.width * cover) / 2, (H - img.height * cover) / 2, img.width * cover, img.height * cover);
  ctx.filter = "none";
  const g = ctx.createLinearGradient(0, 0, W, 0);
  g.addColorStop(0, "rgba(10,10,20,0.75)");
  g.addColorStop(0.6, "rgba(10,10,20,0.15)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  /* 右侧放原帧 */
  const fh = 620;
  const fw = Math.round((img.width / img.height) * fh);
  const fx = W - fw - 90;
  const fy = (H - fh) / 2;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 40;
  ctx.beginPath();
  ctx.roundRect(fx, fy, fw, fh, 28);
  ctx.clip();
  ctx.drawImage(img, fx, fy, fw, fh);
  ctx.restore();
  /* 左侧英文大标题 */
  const font = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = "#ffffff";
  ctx.font = `900 92px ${font}`;
  ctx.textBaseline = "top";
  ctx.fillText("WAIT TILL", 80, 190);
  ctx.fillText("YOU SEE", 80, 292);
  ctx.fillStyle = "#ff7a36";
  ctx.fillText("THIS", 80, 394);
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.beginPath();
  ctx.roundRect(80, 526, 250, 56, 28);
  ctx.fill();
  ctx.fillStyle = "#1a1a2e";
  ctx.font = `700 26px ${font}`;
  ctx.fillText("▶  Tap to watch", 108, 541);
  return c.toDataURL("image/jpeg", 0.86);
}

/* ── 视频轨最前面的封面格 ── */
export function CoverSlot({
  src,
  pending,
  height,
  onEdit,
  onRemove,
}: {
  src?: string;
  pending?: boolean;
  height: number;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const [hover, setHover] = useState(false);
  const has = !!src || pending;
  return (
    <div
      className="relative w-[52px] shrink-0"
      style={{ height }}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      <button
        type="button"
        onClick={onEdit}
        aria-label={has ? "Edit cover" : "Add cover"}
        className={`relative flex size-full flex-col items-center justify-center gap-1 overflow-hidden rounded-[6px] text-[10.5px] font-semibold transition ${
          has ? "text-white" : "border border-dashed border-[#c9cad4] bg-white text-[#6a6b7b] hover:border-[#9a9bb0] hover:bg-[#f7f8fa] hover:text-[#1a1a2e]"
        }`}
      >
        {src && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" className="absolute inset-0 size-full object-cover" />
        )}
        {pending && !src && <span className={`absolute inset-0 ${AI_STRIPES}`} />}
        {src && <span className="absolute inset-0 bg-black/35" />}
        <span className={`relative flex flex-col items-center gap-0.5 ${pending && !src ? "text-[#4a4b5c]" : ""}`}>
          {pending && !src ? <Loader2 className="size-3.5 animate-spin" /> : <Pencil className="size-3.5" />}
          Cover
        </span>
      </button>
      {has && hover && (
        <button
          type="button"
          aria-label="Remove cover"
          onClick={onRemove}
          className="absolute -right-1.5 -top-1.5 z-30 grid size-4 place-items-center rounded-full bg-white text-[#4a4b5c] shadow ring-1 ring-black/10 hover:text-[#d0342c]"
        >
          <X className="size-2.5" strokeWidth={3} />
        </button>
      )}
      {/* 提示画在上方:封面格在剪辑器卡片最底部,往下会被卡片裁掉 */}
      {hover && (
        <span className="pointer-events-none absolute bottom-[calc(100%+6px)] left-0 z-40 whitespace-nowrap rounded-md bg-[#1a1a2e] px-2 py-1 text-[11px] font-medium text-white shadow">
          {has ? "Click to edit cover" : "Add a cover"}
        </span>
      )}
    </div>
  );
}

/** 封面格当前显示的图:帧 / 资产库图 / 画布节点(AI 封面生成中则 pending) */
export function coverView(project: Project): { src?: string; pending?: boolean } {
  const c = project.cover;
  if (!c) return {};
  if (c.kind === "frame" || c.kind === "library") return { src: c.src };
  const a = project.assets.find((x) => x.id === c.assetId);
  if (!a) return {};
  if (a.status === "ready" && a.url) return { src: a.url };
  return { pending: true };
}

/* ── 封面窗口 ── */
type Candidate = { src: string; cover: CoverRef } | null;

export function CoverDialog({
  project,
  initialTime,
  onSave,
  onDesign,
  onClose,
}: {
  project: Project;
  initialTime: number;
  onSave: (cover: CoverRef) => void;
  /** 用当前选中的帧/图作参考,去画布上开一个 Image Generator 节点 */
  onDesign: (refSrc: string) => void;
  onClose: () => void;
}) {
  const { segs, total } = useMemo(() => layoutClips(project.clips), [project.clips]);
  const [tab, setTab] = useState<"video" | "assets">(project.cover && project.cover.kind !== "frame" ? "assets" : "video");
  const [t, setT] = useState(project.cover?.kind === "frame" ? project.cover.t : Math.min(initialTime, total));
  const [cand, setCand] = useState<Candidate>(null);
  const [busy, setBusy] = useState(false);
  const [noFrame, setNoFrame] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);
  const [stripW, setStripW] = useState(600);

  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setStripW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, [tab]);

  /* 拖到哪一帧就取哪一帧(节流一下,拖动时不每像素都取) */
  useEffect(() => {
    if (tab !== "video") return;
    const id = window.setTimeout(async () => {
      const seg = segmentAt(segs, t);
      const a = seg?.clip.assetId ? project.assets.find((x) => x.id === seg.clip.assetId) : undefined;
      if (!seg || !a || a.status !== "ready" || !a.url) {
        setNoFrame(true);
        setCand(null);
        return;
      }
      setNoFrame(false);
      setBusy(true);
      try {
        const src =
          a.kind === "video" ? await captureFrame(a.url, seg.clip.inSec + (t - seg.start) * seg.clip.speed) : a.url;
        setCand({ src, cover: { kind: "frame", src, t } });
      } catch {
        setCand(null);
        setNoFrame(true);
      } finally {
        setBusy(false);
      }
    }, 140);
    return () => window.clearTimeout(id);
  }, [t, tab, segs, project.assets]);

  const canvasImages = project.assets.filter((a) => a.kind === "image" && a.status === "ready" && a.url);
  const pxPerSec = stripW / Math.max(total, 0.1);

  return (
    <div className="fixed inset-0 z-[210] grid place-items-center bg-black/50 px-4" onClick={onClose}>
      <div
        role="dialog"
        aria-label="Cover"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[720px] rounded-2xl bg-white p-5 text-[#1a1a2e] shadow-[0_24px_60px_rgba(0,0,0,0.35)]"
      >
        <div className="flex items-center">
          <h2 className="text-[16px] font-bold">Cover</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="ml-auto grid size-8 place-items-center rounded-lg text-[#6a6b7b] hover:bg-[#f3f4f6]"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* 预览 */}
        <div className="relative mt-3 grid aspect-video place-items-center overflow-hidden rounded-xl bg-[#EDF1F3]">
          {cand ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cand.src} alt="Cover preview" className="size-full object-contain" />
          ) : (
            <span className="px-6 text-center text-[13px] text-[#6a6b7b]">
              {noFrame ? "This moment has no footage yet — pick another frame." : "Pick a frame or an image."}
            </span>
          )}
          {busy && (
            <span className="absolute right-3 top-3 grid size-7 place-items-center rounded-full bg-white/80">
              <Loader2 className="size-4 animate-spin text-[#ff5e1a]" />
            </span>
          )}
        </div>

        {/* 来源 */}
        <div className="mt-4 flex gap-1 rounded-lg bg-[#f3f4f6] p-1 text-[13px] font-semibold">
          {(
            [
              { id: "video", label: "From video" },
              { id: "assets", label: "From assets" },
            ] as const
          ).map((x) => (
            <button
              key={x.id}
              type="button"
              onClick={() => {
                setTab(x.id);
                setCand(null);
              }}
              className={`flex-1 rounded-md py-1.5 transition ${tab === x.id ? "bg-white shadow-sm" : "text-[#6a6b7b] hover:text-[#1a1a2e]"}`}
            >
              {x.label}
            </button>
          ))}
        </div>

        {tab === "video" ? (
          <div className="mt-3">
            <div className="mb-1.5 flex items-center justify-between text-[12px] text-[#6a6b7b]">
              <span>Drag to pick the frame</span>
              <span className="font-semibold tabular-nums text-[#1a1a2e]">{fmt(t)}</span>
            </div>
            <div ref={stripRef} className="relative h-14 overflow-hidden rounded-lg bg-[#e6e7ec]">
              {segs.map((s) => {
                const a = s.clip.assetId ? project.assets.find((x) => x.id === s.clip.assetId) : undefined;
                return (
                  <div
                    key={s.clip.id}
                    className="absolute inset-y-0 overflow-hidden border-r border-white/60"
                    style={{ left: s.start * pxPerSec, width: s.len * pxPerSec }}
                  >
                    {a?.status === "ready" ? (
                      <Filmstrip asset={a} clip={s.clip} pxPerSec={pxPerSec} height={56} />
                    ) : (
                      <span className="absolute inset-0 bg-[repeating-linear-gradient(135deg,#ffe6d6_0_8px,#fff3ea_8px_16px)]" />
                    )}
                  </div>
                );
              })}
              <span
                className="pointer-events-none absolute inset-y-0 z-10 w-[3px] -translate-x-1/2 rounded bg-[#ff5e1a] shadow-[0_0_0_1px_white]"
                style={{ left: t * pxPerSec }}
              />
              <input
                type="range"
                aria-label="Cover frame"
                min={0}
                max={Math.max(0, total - 0.05)}
                step={0.05}
                value={t}
                onChange={(e) => setT(Number(e.target.value))}
                className="absolute inset-0 z-20 size-full cursor-ew-resize opacity-0"
              />
            </div>
          </div>
        ) : (
          <div className="mt-3 max-h-[220px] space-y-3 overflow-y-auto">
            {canvasImages.length > 0 && (
              <Picker
                title="On this canvas"
                items={canvasImages.map((a) => ({ key: a.id, src: a.url!, label: a.label, cover: { kind: "asset", assetId: a.id } as CoverRef }))}
                selected={cand?.src}
                onPick={(src, cover) => setCand({ src, cover })}
              />
            )}
            <Picker
              title="Asset library"
              items={LIBRARY_IMAGES.map((l) => ({ key: l.src, src: l.src, label: l.label, cover: { kind: "library", src: l.src, label: l.label } as CoverRef }))}
              selected={cand?.src}
              onPick={(src, cover) => setCand({ src, cover })}
            />
          </div>
        )}

        <div className="mt-5 flex items-center gap-2">
          <button
            type="button"
            disabled={!cand}
            onClick={() => cand && onDesign(cand.src)}
            className="flex items-center gap-1.5 rounded-lg border border-[#ffd2b8] bg-[#fff7f1] px-3.5 py-2 text-[13px] font-semibold text-[#d24f14] transition hover:border-[#ff5e1a] disabled:opacity-40"
          >
            <Sparkles className="size-4" /> Design with AI
          </button>
          <span className="hidden text-[11.5px] text-[#9a9bb0] sm:inline">Adds an Image Generator node using this as reference</span>
          <button type="button" onClick={onClose} className="ml-auto rounded-lg px-4 py-2 text-[13px] font-semibold text-[#4a4b5c] hover:bg-[#f3f4f6]">
            Cancel
          </button>
          <button
            type="button"
            disabled={!cand}
            onClick={() => cand && onSave(cand.cover)}
            className="rounded-lg bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-4 py-2 text-[13px] font-semibold text-white transition hover:brightness-105 disabled:opacity-40"
          >
            Set as cover
          </button>
        </div>
      </div>
    </div>
  );
}

function Picker({
  title,
  items,
  selected,
  onPick,
}: {
  title: string;
  items: { key: string; src: string; label: string; cover: CoverRef }[];
  selected?: string;
  onPick: (src: string, cover: CoverRef) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[12px] font-semibold text-[#6a6b7b]">{title}</p>
      <div className="grid grid-cols-4 gap-2">
        {items.map((it) => (
          <button
            key={it.key}
            type="button"
            onClick={() => onPick(it.src, it.cover)}
            title={it.label}
            className={`relative aspect-video overflow-hidden rounded-lg bg-[#eceef2] transition ${
              selected === it.src ? "ring-2 ring-[#ff5e1a]" : "ring-1 ring-[#e6e7ec] hover:ring-[#ffbd99]"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={it.src} alt="" className="size-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
