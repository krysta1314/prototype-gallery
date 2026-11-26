"use client";

/* /canvas 落地页的画面组件(2026-11-26)。
   首屏节点画板：设计稿 1200×460,按容器宽度等比放大 / 缩小(1440 → ~1.1 倍，1920–2560 → 最大 1.4 倍),
   手机宽最小按 0.46 缩放并可左右滑动，一开始停在正中。连线全部实线(design.md 不用虚线)。 */

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ImageIcon, Video, AudioLines, Type, Plus, LayoutTemplate } from "lucide-react";
import { PicView } from "../../oa/kit";
import type { Pic } from "../../oa/pool";
import { HERO_MEDIA, STEP_MEDIA, type CanvasExample } from "./content";

const ORANGE = "#FF744D";
const useIso = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** 自己控制播放的视频：进入视口才播，减少动态效果时不播 */
function AutoVideo({ src, poster, alt, className = "" }: { src: string; poster?: string; alt: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: 0.15 });
    io.observe(v);
    return () => io.disconnect();
  }, []);
  return <video ref={ref} src={src} poster={poster} muted loop playsInline preload="metadata" aria-label={alt} className={`size-full object-cover ${className}`} />;
}

/* ── 首屏节点画板 ── */
const BW = 1200;
const BH = 460;

function BoardNode({ x, y, w, h, label, icon, children, selected = false, ports = "both" }: { x: number; y: number; w: number; h: number; label: string; icon: ReactNode; children: ReactNode; selected?: boolean; ports?: "both" | "left" | "right" | "none" }) {
  return (
    <div className="absolute" style={{ left: x, top: y, width: w, height: h }}>
      <p className="absolute -top-[22px] left-0 flex items-center gap-1.5 whitespace-nowrap text-[11px] font-semibold text-white/60">
        {icon}
        {label}
      </p>
      <div className={`size-full overflow-hidden rounded-[14px] bg-[#141414] shadow-[0_18px_40px_rgba(0,0,0,0.55)] ${selected ? "ring-2 ring-[#FF744D]" : "ring-1 ring-white/15"}`}>{children}</div>
      {(ports === "both" || ports === "left") && <span className="absolute -left-[5px] top-1/2 size-[10px] -translate-y-1/2 rounded-full border-2 border-[#0b0b0b] bg-white/70" />}
      {(ports === "both" || ports === "right") && <span className="absolute -right-[5px] top-1/2 size-[10px] -translate-y-1/2 rounded-full border-2 border-[#0b0b0b] bg-white/70" />}
      {selected &&
        [
          ["-left-[5px]", "-top-[5px]"],
          ["-right-[5px]", "-top-[5px]"],
          ["-left-[5px]", "-bottom-[5px]"],
          ["-right-[5px]", "-bottom-[5px]"],
        ].map(([a, b]) => <span key={a + b} className={`absolute ${a} ${b} size-[10px] rounded-[2px] border-2 border-[#FF744D] bg-white`} />)}
    </div>
  );
}

function Cursor({ x, y, name, text }: { x: number; y: number; name: string; text?: string }) {
  return (
    <div className="absolute flex items-start gap-1" style={{ left: x, top: y }}>
      <svg width="14" height="14" viewBox="0 0 10 10" aria-hidden>
        <path d="M0 0 L10 4 L4 5 L3 10 Z" fill={ORANGE} />
      </svg>
      <span className="mt-2 rounded-[8px] rounded-tl-[2px] px-2.5 py-1.5 text-[12px] font-semibold leading-tight text-white shadow-lg" style={{ background: ORANGE }}>
        <span className="block text-[10px] font-medium opacity-85">{name}</span>
        {text}
      </span>
    </div>
  );
}

const WAVE = [6, 14, 22, 12, 30, 18, 26, 10, 34, 20, 14, 28, 16, 8, 24, 32, 12, 20, 28, 10, 18, 26, 14, 8, 22, 30, 16, 12, 24, 10];

export function NodeBoard() {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [cw, setCw] = useState(BW);
  useIso(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => {
      const w = el.clientWidth;
      setCw(w);
      setScale(Math.max(0.46, Math.min(1.4, w / BW)));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const inner = BW * scale;
  const scrolls = inner > cw + 1;
  useEffect(() => {
    const el = box.current;
    if (el && scrolls) el.scrollLeft = (inner - cw) / 2;
  }, [scrolls, inner, cw]);
  const line = "stroke-white/35";
  return (
    <div ref={box} className={`relative w-full ${scrolls ? "overflow-x-auto [scrollbar-width:none]" : "overflow-hidden"}`} style={{ height: BH * scale + 8 }}>
      <div className="relative" style={{ width: Math.max(inner, cw), height: BH * scale }}>
        <div className="absolute top-0 origin-top-left" style={{ left: Math.max(0, (cw - inner) / 2), width: BW, height: BH, transform: `scale(${scale})` }}>
          <svg className="pointer-events-none absolute inset-0" width={BW} height={BH} fill="none" strokeWidth="1.6" aria-hidden>
            <path className={line} d="M174 128 C 220 128, 216 227, 262 227" />
            <path className={line} d="M174 346 C 220 346, 216 227, 262 227" />
            <path className={line} d="M458 227 C 510 227, 508 313, 560 313" />
            <path className={line} d="M638 142 C 638 160, 636 160, 636 178" />
            <path className={line} d="M712 250 C 860 250, 880 259, 1020 259" />
            <path className="stroke-[#FF744D]/70" d="M960 348 C 990 348, 990 259, 1020 259" />
          </svg>

          <BoardNode x={24} y={40} w={150} h={176} label="Product photo" icon={<ImageIcon className="size-3.5" />} ports="right">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={HERO_MEDIA.product} alt="LUMEA serum product photo used as a reference node on the AI canvas" className="size-full bg-white object-cover" />
          </BoardNode>
          <BoardNode x={24} y={262} w={150} h={168} label="Character" icon={<ImageIcon className="size-3.5" />} ports="right">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={HERO_MEDIA.character} alt="Character reference portrait reused in every shot" className="size-full object-cover" />
          </BoardNode>
          <BoardNode x={262} y={96} w={196} h={262} label="Image" icon={<ImageIcon className="size-3.5" />}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={HERO_MEDIA.image} alt="AI image of the same woman holding the serum, generated from the product and character nodes" className="size-full object-cover" />
          </BoardNode>
          <BoardNode x={520} y={34} w={236} h={108} label="Prompt" icon={<Type className="size-3.5" />} ports="none">
            <p className="p-3 text-[12px] leading-[1.5] text-white/75">She holds the serum up to her phone in a bright bathroom and talks about her morning routine. Selfie angle, natural light, 9:16.</p>
          </BoardNode>
          <BoardNode x={560} y={178} w={152} h={270} label="Video · 9:16" icon={<Video className="size-3.5" />}>
            <AutoVideo src={HERO_MEDIA.video.src} poster={HERO_MEDIA.video.poster} alt="UGC video node animated from the image node" />
          </BoardNode>
          <BoardNode x={760} y={300} w={200} h={96} label="Voiceover" icon={<AudioLines className="size-3.5" />}>
            <div className="flex size-full items-center gap-[3px] px-3">
              {WAVE.map((h, i) => (
                <span key={i} className="w-[3px] shrink-0 rounded-full" style={{ height: h * 1.4, background: i < 13 ? ORANGE : "rgba(255,255,255,0.35)" }} />
              ))}
            </div>
          </BoardNode>
          <BoardNode x={1020} y={120} w={156} h={278} label="Final ad" icon={<Video className="size-3.5" />} selected ports="left">
            <AutoVideo src={HERO_MEDIA.final.src} poster={HERO_MEDIA.final.poster} alt="Finished serum ad put together from the connected nodes" />
          </BoardNode>

          <Cursor x={340} y={22} name="Lena" text="Love this shot!" />
          <Cursor x={800} y={150} name="Mia" text="Try a warmer light?" />
        </div>
      </div>
    </div>
  );
}

/* ── 功能行配图：一个参考节点 → 三个输出节点 ── */
export function FanOut({ from, outs, fromLabel, outLabel }: { from: string; outs: string[]; fromLabel: string; outLabel: string }) {
  return (
    <div className="relative aspect-video bg-[#0d0d0d] [background-image:radial-gradient(rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:18px_18px]">
      <svg className="pointer-events-none absolute inset-0 size-full" viewBox="0 0 160 90" preserveAspectRatio="none" fill="none" aria-hidden>
        {[16, 45, 74].map((y) => (
          <path key={y} d={`M47 45 C 62 45, 62 ${y}, 77 ${y}`} stroke="rgba(255,255,255,0.35)" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <figure className="absolute left-[6%] top-1/2 w-[23%] -translate-y-1/2">
        <figcaption className="mb-1.5 text-[11px] font-semibold text-white/60">{fromLabel}</figcaption>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={from} alt={`${fromLabel} reference node`} loading="lazy" className="aspect-[4/5] w-full rounded-[12px] object-cover ring-2 ring-[#FF744D]" />
      </figure>
      <div className="absolute right-[6%] top-[6%] flex h-[88%] w-[46%] flex-col justify-between">
        {outs.map((o, i) => (
          <figure key={o} className="flex h-[30%] items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={o} alt={`${outLabel} ${i + 1} generated from the reference`} loading="lazy" className="h-full aspect-[4/3] rounded-[10px] object-cover ring-1 ring-white/15" />
            <figcaption className="text-[12px] font-semibold text-white/70">
              {outLabel} {i + 1}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

/* ── 团队协作：三张草稿 + 评论 + 光标 ── */
export function TeamBoard({ imgs }: { imgs: string[] }) {
  return (
    <div className="relative aspect-video bg-[#0d0d0d] [background-image:radial-gradient(rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:18px_18px]">
      <div className="absolute inset-x-[6%] top-[18%] grid grid-cols-3 gap-[4%]">
        {imgs.map((s, i) => (
          <figure key={s} className={`overflow-hidden rounded-[12px] ${i === 1 ? "ring-2 ring-[#FF744D]" : "ring-1 ring-white/15"}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s} alt={`Shot ${i + 1} of a serum ad under review on a shared canvas`} loading="lazy" className="aspect-[4/5] w-full object-cover" />
          </figure>
        ))}
      </div>
      <p className="absolute left-[6%] top-[7%] text-[12px] font-semibold text-white/60">LUMEA launch · 3 shots</p>
      <div className="absolute left-[40%] top-[6%] flex -space-x-2">
        {["#FF744D", "#5B8CFF", "#22C55E"].map((c, i) => (
          <span key={c} className="grid size-7 place-items-center rounded-full border-2 border-[#0d0d0d] text-[11px] font-bold text-white" style={{ background: c }}>
            {"LMJ"[i]}
          </span>
        ))}
      </div>
      <div className="absolute left-[44%] top-[58%] max-w-[44%] rounded-[12px] rounded-tl-[2px] bg-white px-3 py-2 text-[12px] leading-snug text-[#240A03] shadow-xl">
        <span className="block text-[10.5px] font-bold text-[#FF5255]">Client · Jo</span>
        Approved. Can shot 2 open on the dropper?
      </div>
      <div className="absolute right-[8%] top-[12%] flex items-start gap-1">
        <svg width="13" height="13" viewBox="0 0 10 10" aria-hidden>
          <path d="M0 0 L10 4 L4 5 L3 10 Z" fill="#5B8CFF" />
        </svg>
        <span className="mt-2 rounded-[6px] bg-[#5B8CFF] px-2 py-0.5 text-[11px] font-semibold text-white">Mia</span>
      </div>
    </div>
  );
}

/* ── 三步教程的小界面 ── */
export function StepAdd() {
  const items = [
    { icon: <ImageIcon className="size-4" />, t: "Image", d: "Generate or upload" },
    { icon: <Video className="size-4" />, t: "Video", d: "Text or image to video" },
    { icon: <AudioLines className="size-4" />, t: "Audio", d: "Voiceover, music, SFX" },
    { icon: <LayoutTemplate className="size-4" />, t: "Template", d: "Start from a workflow" },
  ];
  return (
    <div className="mx-auto w-full max-w-[300px] rounded-[18px] bg-[#111] p-3 text-white shadow-[0_20px_40px_rgba(36,10,3,0.18)]">
      <p className="flex items-center gap-2 px-1.5 pb-2 text-[12px] font-semibold text-white/60">
        <span className="grid size-5 place-items-center rounded-full bg-[#FF744D] text-[#240A03]">
          <Plus className="size-3" />
        </span>
        Add node
      </p>
      {items.map((x, i) => (
        <div key={x.t} className={`flex items-center gap-3 rounded-[12px] px-2.5 py-2 ${i === 1 ? "bg-white/10" : ""}`}>
          <span className="grid size-8 place-items-center rounded-[10px] bg-white/[0.08] text-white/80">{x.icon}</span>
          <span>
            <span className="block text-[13.5px] font-semibold">{x.t}</span>
            <span className="block text-[11.5px] text-white/50">{x.d}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

export function StepConnectNodes() {
  return (
    <div className="relative mx-auto flex w-full max-w-[320px] items-center justify-between rounded-[18px] bg-[#111] p-4 shadow-[0_20px_40px_rgba(36,10,3,0.18)]">
      <svg className="pointer-events-none absolute inset-0 size-full" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden>
        <path d="M40 30 C 50 30, 50 30, 60 30" stroke={ORANGE} strokeWidth="0.8" vectorEffect="non-scaling-stroke" fill="none" />
      </svg>
      {[
        { s: STEP_MEDIA.from, l: "Image", alt: "Serum product image node" },
        { s: STEP_MEDIA.to, l: "Video", alt: "Video node using the image as its reference" },
      ].map((n, i) => (
        <figure key={n.s} className="relative w-[38%]">
          <figcaption className="mb-1 text-[11px] font-semibold text-white/60">{n.l}</figcaption>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={n.s} alt={n.alt} loading="lazy" className={`aspect-[4/5] w-full rounded-[10px] object-cover ${i ? "ring-2 ring-[#FF744D]" : "ring-1 ring-white/15"}`} />
          <span className={`absolute top-[55%] size-[9px] rounded-full border-2 border-[#111] bg-white ${i ? "-left-[4px]" : "-right-[4px]"}`} />
        </figure>
      ))}
    </div>
  );
}

export function StepFinish() {
  return (
    <div className="mx-auto w-full max-w-[320px] rounded-[18px] bg-[#111] p-4 text-white shadow-[0_20px_40px_rgba(36,10,3,0.18)]">
      <p className="text-[12px] font-semibold text-white/60">Timeline · 0:15</p>
      <div className="mt-3 grid grid-cols-3 gap-1.5">
        {STEP_MEDIA.timeline.map((s, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={s} src={s} alt={`Shot ${i + 1} on the timeline`} loading="lazy" className={`aspect-[4/5] w-full rounded-[8px] object-cover ${i === 1 ? "ring-2 ring-[#FF744D]" : ""}`} />
        ))}
      </div>
      <div className="mt-2 flex h-6 items-center gap-[2px] rounded-[6px] bg-[#FF744D]/15 px-2">
        {WAVE.slice(0, 26).map((h, i) => (
          <span key={i} className="w-[3px] shrink-0 rounded-full bg-[#FF744D]" style={{ height: Math.max(3, h * 0.5) }} />
        ))}
      </div>
      <div className="mt-3 flex justify-between text-[11.5px]">
        <span className="rounded-full bg-white/10 px-2.5 py-1 font-semibold">Regenerate shot 2</span>
        <span className="rounded-full bg-white px-2.5 py-1 font-semibold text-[#240A03]">Export</span>
      </div>
    </div>
  );
}

/* ── 示例卡片(ai canvas examples):成片 + 节点链 ── */
export function ExampleGrid({ items, onOpen }: { items: CanvasExample[]; onOpen: (title: string) => (e: React.MouseEvent) => void }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {items.map((x) => {
        const p: Pic = { kind: x.kind, src: x.src, poster: x.poster, aspect: "4:5", alt: x.alt, prompt: "", source: "" };
        return (
          <li key={x.key}>
            <a href="/canvas" onClick={onOpen(x.title)} className="group block overflow-hidden rounded-[20px] bg-white/[0.04] ring-1 ring-white/[0.08] transition hover:-translate-y-1 hover:ring-white/25">
              <div className="aspect-[4/5] overflow-hidden bg-[#111]">
                <PicView p={p} className="transition duration-500 group-hover:scale-[1.03]" />
              </div>
              <div className="p-3 sm:p-4">
                <h3 className="text-[15px] font-bold leading-snug sm:text-[16px]">{x.title}</h3>
                <p className="mt-2 flex flex-wrap items-center gap-1 text-[11px] font-semibold text-[#CACACA] sm:text-[11.5px]">
                  {x.chain.map((c, i) => (
                    <span key={c} className="flex items-center gap-1">
                      {i > 0 && <span aria-hidden className="h-px w-2.5 bg-[#FF744D]" />}
                      <span className="rounded-full bg-white/[0.08] px-2 py-0.5">{c}</span>
                    </span>
                  ))}
                </p>
              </div>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
