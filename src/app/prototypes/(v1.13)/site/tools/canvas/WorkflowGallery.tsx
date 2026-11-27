"use client";

/* /canvas 落地页「Workflows」区(2026-11-27)。
   照产品里 Canvas 首页的 Workflows:分类标签(All / Image / Video / Enterprise Commercial)+ 一行 5 张封面卡;
   点卡片弹出这个 workflow 的画布(节点、连线、每个节点的成片都照线上读出来的原样摆),
   「Use This Workflow」→ 顶部 toast 提示正在去 Canvas 打开，随后进产品里的 Canvas。数据见 ./workflows.ts。 */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AudioLines, ImageIcon, Upload, UserRound, Video, X } from "lucide-react";
import { WORKFLOWS, type Workflow, type WfNode } from "./workflows";

const CATS = ["All", "Image", "Video", "Enterprise Commercial"] as const;
const isVid = (s: string) => /\.mp4($|\?)/.test(s);
const useIso = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** 进入视口才播放的静音循环视频 */
function LazyVideo({ src, className = "" }: { src: string; className?: string }) {
  const r = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = r.current;
    if (!v || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: 0.2 });
    io.observe(v);
    return () => io.disconnect();
  }, []);
  return <video ref={r} src={`${src}#t=0.5`} muted loop playsInline preload="metadata" className={`size-full object-cover ${className}`} />;
}

function NodeIcon({ type }: { type: string }) {
  const c = "size-3.5";
  if (type === "Video Generator") return <Video className={c} />;
  if (type === "Audio Generator") return <AudioLines className={c} />;
  if (type === "Upload") return <Upload className={c} />;
  if (type === "Character") return <UserRound className={c} />;
  return <ImageIcon className={c} />;
}

const WAVE = [8, 16, 26, 12, 30, 20, 10, 24, 32, 14, 22, 28, 12, 18, 26, 10, 20, 30, 16, 8];

function FlowNode({ n, k }: { n: WfNode; k: number }) {
  const [x, y, w, h, type, src, extra] = n;
  return (
    <div className="absolute" style={{ left: x, top: y, width: w, height: h }}>
      <p className="absolute -top-[40px] left-0 flex items-center gap-2 whitespace-nowrap text-[26px] font-semibold text-[#6B6B6B] [&_svg]:size-6">
        <NodeIcon type={type} />
        {type === "Character" && extra ? `Character · ${extra}` : type}
      </p>
      <div className="size-full overflow-hidden rounded-[14px] bg-white shadow-[0_6px_20px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.06]">
        {type === "Audio Generator" ? (
          <div className="flex size-full items-center gap-2 px-5">
            <span className="text-[20px] font-semibold text-[#240A03]">{extra}</span>
            <span className="ml-auto flex items-center gap-[4px]">
              {WAVE.map((v, i) => <span key={i} className="w-[4px] rounded-full bg-[#FF744D]" style={{ height: v * 1.6, opacity: i < 9 ? 1 : 0.35 }} />)}
            </span>
          </div>
        ) : !src ? (
          <div className="grid size-full place-items-center bg-[#F4F4F5] text-[#9F9F9F]"><UserRound className="size-24" strokeWidth={1.2} /></div>
        ) : isVid(src) ? (
          <LazyVideo src={src} />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={src} alt={`${type} node ${k + 1}`} loading="lazy" className="size-full object-cover" />
        )}
      </div>
      <span className="absolute -left-[7px] top-1/2 size-[14px] -translate-y-1/2 rounded-full border-[3px] border-white bg-[#C8C8C8]" />
      <span className="absolute -right-[7px] top-1/2 size-[14px] -translate-y-1/2 rounded-full border-[3px] border-white bg-[#C8C8C8]" />
    </div>
  );
}

/** 弹窗里的只读画布：按节点外框等比缩放到容器里 */
function FlowCanvas({ wf }: { wf: Workflow }) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 1000, h: 600 });
  useIso(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const PAD = 80;
  const minX = Math.min(...wf.n.map((n) => n[0])) - PAD;
  const minY = Math.min(...wf.n.map((n) => n[1])) - PAD - 44;
  const maxX = Math.max(...wf.n.map((n) => n[0] + n[2])) + PAD;
  const maxY = Math.max(...wf.n.map((n) => n[1] + n[3])) + PAD;
  const bw = maxX - minX;
  const bh = maxY - minY;
  const s = Math.min(size.w / bw, size.h / bh);
  return (
    <div ref={box} className="relative size-full overflow-hidden rounded-[16px] bg-[#F4F4F5] [background-image:radial-gradient(rgba(0,0,0,0.09)_1px,transparent_1px)] [background-size:18px_18px]">
      <div className="absolute origin-top-left" style={{ width: bw, height: bh, left: (size.w - bw * s) / 2, top: (size.h - bh * s) / 2, transform: `scale(${s})` }}>
        <div className="absolute" style={{ left: -minX, top: -minY }}>
          <svg className="pointer-events-none absolute left-0 top-0 overflow-visible" width="1" height="1" fill="none" aria-hidden>
            {wf.e.map((d, i) => <path key={i} d={d} stroke="#BDBDBD" strokeWidth={3} />)}
          </svg>
          {wf.n.map((n, i) => <FlowNode key={i} n={n} k={i} />)}
        </div>
      </div>
    </div>
  );
}

export function WorkflowGallery({ onUse }: { onUse: (title: string) => void }) {
  const [cat, setCat] = useState<(typeof CATS)[number]>("All");
  const [open, setOpen] = useState<Workflow | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const list = cat === "All" ? WORKFLOWS : WORKFLOWS.filter((w) => w.cat === cat);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [open]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);
  const use = (w: Workflow) => {
    setOpen(null);
    setToast(`Opening “${w.title}” in Canvas…`);
    setTimeout(() => onUse(w.title), 1400);
  };
  return (
    <>
      <div role="tablist" aria-label="Workflow category" className="flex flex-wrap gap-2">
        {CATS.map((c) => (
          <button key={c} type="button" role="tab" aria-selected={c === cat} onClick={() => setCat(c)} className={`h-10 rounded-full px-4 text-[14px] font-semibold transition ${c === cat ? "bg-white text-[#240A03]" : "bg-white/[0.07] text-[#CACACA] hover:bg-white/[0.12] hover:text-white"}`}>
            {c}
          </button>
        ))}
      </div>
      <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-7 md:grid-cols-3 lg:grid-cols-5">
        {list.map((w) => (
          <li key={w.title}>
            <button type="button" onClick={() => setOpen(w)} className="group block w-full text-left">
              <div className="relative aspect-[16/10] overflow-hidden rounded-[14px] bg-[#1C1C1C] ring-1 ring-white/10 transition group-hover:ring-[#FF744D]/70">
                {isVid(w.cover) ? <LazyVideo src={w.cover} className="transition duration-500 group-hover:scale-[1.04]" /> : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={w.cover} alt={`${w.title} workflow cover`} loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-[1.04]" />
                )}
                <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white opacity-0 backdrop-blur transition group-hover:opacity-100">{w.n.length} nodes</span>
              </div>
              <p className="mt-2.5 text-[14px] font-semibold text-white">{w.title}</p>
            </button>
          </li>
        ))}
      </ul>

      {open && (
        <div role="dialog" aria-modal="true" aria-label={open.title} className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm md:p-8" onClick={() => setOpen(null)}>
          <div className="flex h-[min(88vh,860px)] w-[min(1240px,100%)] flex-col rounded-[20px] bg-white p-4 shadow-2xl md:p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[18px] font-bold text-[#240A03]">{open.title}</h3>
              <button type="button" aria-label="Close" onClick={() => setOpen(null)} className="grid size-9 place-items-center rounded-full text-[#6B6B6B] transition hover:bg-black/5"><X className="size-5" /></button>
            </div>
            <div className="min-h-0 flex-1"><FlowCanvas wf={open} /></div>
            <div className="mt-4 flex justify-center">
              <button type="button" onClick={() => use(open)} className="rounded-[12px] bg-gradient-to-r from-[#FFA73C] to-[#FF5A4E] px-6 py-3 text-[15px] font-bold text-white shadow-[0_8px_24px_rgba(255,116,77,0.4)] transition hover:brightness-105">
                Use This Workflow
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div role="status" className="fixed left-1/2 top-20 z-[90] -translate-x-1/2 rounded-full bg-white px-5 py-2.5 text-[14px] font-semibold text-[#240A03] shadow-[0_12px_32px_rgba(0,0,0,0.35)]">
          {toast}
        </div>
      )}
    </>
  );
}
