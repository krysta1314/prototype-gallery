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
      {/* 2026-11-27 Monica「去掉这四个」:选中节点只留橙色描边，不再画四角缩放点 */}
    </div>
  );
}

/* 2026-11-27 Monica「头像和鼠标配色好看一点，绿色，黄色，紫色」:协作者各用一色(不再全是品牌橙),头像和光标同色 */
const PEOPLE: Record<string, { bg: string; fg: string }> = {
  Lena: { bg: "#3DD68C", fg: "#06301C" },
  Mia: { bg: "#FFD23F", fg: "#3A2A00" },
  Jo: { bg: "#A78BFA", fg: "#FFFFFF" },
  Sarah: { bg: "#A78BFA", fg: "#FFFFFF" },
};
/* 2026-11-27 Monica 给参考图「样式是图 1 这样」「鼠标摇动来动去」:
   光标 + 右下方一枚单行胶囊「名字 · 内容」(不再两行气泡);光标带着胶囊在附近慢慢游走，每人路线和节奏不同。减少动态效果时不动 */
const WANDER = `
@keyframes cv-wander-a { 0%,100% { transform: translate(0,0) } 25% { transform: translate(26px,-14px) } 50% { transform: translate(44px,10px) } 75% { transform: translate(12px,22px) } }
@keyframes cv-wander-b { 0%,100% { transform: translate(0,0) } 30% { transform: translate(-30px,12px) } 60% { transform: translate(-8px,-18px) } 80% { transform: translate(18px,6px) } }
@keyframes cv-wander-c { 0%,100% { transform: translate(0,0) } 35% { transform: translate(20px,18px) } 70% { transform: translate(-22px,8px) } }
@media (prefers-reduced-motion: reduce) { .cv-wander { animation: none !important } }`;
const PATHS = ["cv-wander-a 7s", "cv-wander-b 8.5s", "cv-wander-c 6.5s"];
function Cursor({ x, y, name, text, path = 0 }: { x: number | string; y: number | string; name: string; text?: string; path?: number }) {
  const c = PEOPLE[name] ?? { bg: ORANGE, fg: "#FFFFFF" };
  return (
    <div className="cv-wander absolute" style={{ left: x, top: y, animation: `${PATHS[path % PATHS.length]} ease-in-out infinite` }}>
      <svg width="18" height="18" viewBox="0 0 10 10" aria-hidden className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
        <path d="M0.5 0.5 L9.5 4 L5 5 L4 9.5 Z" fill={c.bg} stroke={c.bg} strokeWidth="0.6" strokeLinejoin="round" />
      </svg>
      <span className="absolute left-[14px] top-[18px] whitespace-nowrap rounded-[6px] px-2.5 py-1 text-[13px] font-semibold leading-tight shadow-lg" style={{ background: c.bg, color: c.fg }}>
        {name}
        {text && ` · ${text}`}
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
    /* 2026-11-27 Monica「需要带点 border，但是要样式好看」:画板外面加一圈产品窗口(细描边 + 顶栏：文件名、在线的协作者、缩放) */
    <div className="overflow-hidden rounded-[24px] bg-[#0b0b0b] shadow-[0_40px_120px_rgba(0,0,0,0.6)] ring-1 ring-white/[0.12]">
    <div className="relative bg-[#0d0d0d] [background-image:radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:22px_22px] px-2 py-6 md:py-8">
      {/* 2026-11-27 Monica 划掉顶栏文件名，协作者头像 + 缩放挪进画布右上角(浮在画布上) */}
      <div className="absolute right-4 top-4 z-10 flex items-center gap-3 text-[12px] text-white/60">
        <div className="flex -space-x-1.5">
          {["Lena", "Mia", "Sarah"].map((n) => (
            <span key={n} title={n} className="grid size-6 place-items-center rounded-full text-[10px] font-bold ring-2 ring-[#141414]" style={{ background: PEOPLE[n].bg, color: PEOPLE[n].fg }}>{n[0]}</span>
          ))}
        </div>
        <span className="hidden rounded-md bg-white/[0.06] px-2 py-1 tabular-nums sm:inline">100%</span>
      </div>
    <div ref={box} className={`relative w-full ${scrolls ? "overflow-x-auto [scrollbar-width:none]" : "overflow-hidden"}`} style={{ height: BH * scale + 8 }}>
      <div className="relative" style={{ width: Math.max(inner, cw), height: BH * scale }}>
        <div className="absolute top-0 origin-top-left" style={{ left: Math.max(0, (cw - inner) / 2), width: BW, height: BH, transform: `scale(${scale})` }}>
          {/* 2026-11-27 Monica「这完全没有逻辑，就展示我们 enterprise 用的那个冲凉的」:换成 Silkwave 洗发水那条真实工作流(~/Desktop/模板封面/04-Silkwave)——
              产品图 + 白瓶原片 → 提示词换瓶得到中间图 → 生成成片，配音接进成片;前后是同一个人、同一个浴室，每一步都接得上 */}
          <svg className="pointer-events-none absolute inset-0" width={BW} height={BH} fill="none" strokeWidth="1.6" aria-hidden>
            <path className={line} d="M174 135 C 232 135, 232 245, 290 245" />
            <path className={line} d="M184 346 C 237 346, 237 245, 290 245" />
            <path className={line} d="M420 114 C 420 138, 440 136, 440 160" />
            <path className={line} d="M590 245 C 676 245, 674 222, 760 222" />
            <path className="stroke-[#FF744D]/70" d="M740 408 C 752 408, 748 222, 760 222" />
          </svg>

          <BoardNode x={24} y={40} w={150} h={190} label="Product photo" icon={<ImageIcon className="size-3.5" />} ports="right">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={HERO_MEDIA.product} alt="Silkwave shampoo bottle product photo used as a reference node" className="size-full bg-white object-cover" />
          </BoardNode>
          {/* 2026-11-27 Monica「这个不是 original clip，因为跟成片一样了;换成 AI 模特，就是这个模特的脸截一张，不要产品出现」 */}
          <BoardNode x={24} y={262} w={160} h={168} label="AI model" icon={<ImageIcon className="size-3.5" />} ports="right">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={HERO_MEDIA.model} alt="AI model portrait used as the character reference" className="size-full object-cover" />
          </BoardNode>
          <BoardNode x={300} y={22} w={240} h={92} label="Prompt" icon={<Type className="size-3.5" />} ports="none">
            <p className="p-3 text-[12px] leading-[1.5] text-white/75">She pumps the Silkwave shampoo into her palm in a steamy marble shower. Close-up, soft light.</p>
          </BoardNode>
          <BoardNode x={290} y={160} w={300} h={169} label="Image · GPT Image 2.5" icon={<ImageIcon className="size-3.5" />}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={HERO_MEDIA.image} alt="The same shower frame with the Silkwave bottle swapped in" className="size-full object-cover" />
          </BoardNode>
          <BoardNode x={560} y={364} w={180} h={88} label="Voiceover" icon={<AudioLines className="size-3.5" />}>
            <div className="flex size-full items-center gap-[3px] px-3">
              {WAVE.slice(0, 26).map((h, i) => (
                <span key={i} className="w-[3px] shrink-0 rounded-full" style={{ height: h * 1.3, background: i < 11 ? ORANGE : "rgba(255,255,255,0.35)" }} />
              ))}
            </div>
          </BoardNode>
          <BoardNode x={760} y={110} w={416} h={234} label="Shampoo ad · Seedance 2.5 · 16:9" icon={<Video className="size-3.5" />} selected ports="left">
            <AutoVideo src={HERO_MEDIA.final.src} poster={HERO_MEDIA.final.poster} alt="Finished Silkwave shampoo ad generated from the connected nodes" />
          </BoardNode>

          <style>{WANDER}</style>
          <Cursor x={596} y={150} name="Lena" text="Love this shot!" path={0} />
          <Cursor x={930} y={372} name="Mia" text="More foam in the close-up?" path={1} />
          {/* 2026-11-27 Monica「还少了一个紫色的」:右上角紫色头像对应的第三位协作者 */}
          <Cursor x={300} y={348} name="Sarah" text="Marketing" path={2} />
        </div>
      </div>
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
      <div className="absolute inset-x-[5%] top-[17%] grid grid-cols-3 gap-[3%]">{/* 2026-11-27 三张图加高，铺满卡片下半部分(原来底下空一截，看着比别的配图小) */}
        {imgs.map((s, i) => (
          <figure key={s} className={`overflow-hidden rounded-[12px] ${i === 1 ? "ring-2 ring-[#FF744D]" : "ring-1 ring-white/15"}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s} alt={`Shot ${i + 1} of a serum ad under review on a shared canvas`} loading="lazy" className="aspect-[3/4] w-full object-cover" />
          </figure>
        ))}
      </div>
      <p className="absolute left-[6%] top-[7%] text-[12px] font-semibold text-white/60">LUMEA launch · 3 shots</p>
      <div className="absolute left-[40%] top-[6%] flex -space-x-2">
        {["Lena", "Mia", "Jo"].map((n) => (
          <span key={n} title={n} className="grid size-7 place-items-center rounded-full border-2 border-[#0d0d0d] text-[11px] font-bold" style={{ background: PEOPLE[n].bg, color: PEOPLE[n].fg }}>
            {n[0]}
          </span>
        ))}
      </div>
      <div className="absolute left-[42%] top-[66%] max-w-[44%] rounded-[12px] rounded-tl-[2px] bg-white px-3 py-2 text-[12px] leading-snug text-[#240A03] shadow-xl">
        <span className="block text-[10.5px] font-bold text-[#FF5255]">Client · Jo</span>
        Approved. Can shot 2 open on the dropper?
      </div>
      <style>{WANDER}</style>
      <Cursor x="80%" y="10%" name="Mia" path={2} />
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
