"use client";

/* /canvas 落地页(2026-11-25 Monica 批注:「这个落地页要跟 higgsfield 的页面一模一样做」)
   照 higgsfield.ai/canvas 的版式一比一：深色点阵底 + 顶部节点连线拼贴(标题放在一个被选中的节点框里)
   + All Canvases / Templates 两个标签 + 模板卡片网格。未登录时 All Canvases 显示「登录后查看你的画布」。
   文案、素材、品牌色都是自己的(LUMEA 精华这组：产品图 → 模特手持 → UGC 视频)。 */

import { useEffect, useRef, useState } from "react";
import { Search, Plus } from "lucide-react";
import type { OnLink } from "../../site-nav/SiteNavHeader";
import { appOf } from "../../site-nav/SiteNavHeader";

const T = "/prototypes/site/tools";
const P = "/prototypes/site/pages";
const ORANGE = "#FF744D";

type Tpl = { title: string; img?: string; video?: string; grid?: string[] };
const TEMPLATES: Tpl[] = [
  { title: "Product to UGC Ad", img: `${T}/ugc-product-review.jpg`, video: `${T}/ugc-product-review.mp4` },
  { title: "Product Photo Set", img: `${P}/ai-product-photography/2.webp` },
  { title: "Image to Video", img: `${P}/image-to-video/v2-before.webp`, video: `${P}/image-to-video/v2-after.mp4` },
  { title: "Unboxing Video", img: `${T}/unboxing-ugc.jpg`, video: `${T}/unboxing-ugc.mp4` },
  {
    title: "Storyboard to Video",
    grid: [`${P}/jewelry-ads/1.webp`, `${P}/jewelry-ads/2.webp`, `${P}/jewelry-ads/3.webp`, `${P}/ai-product-photography/1.webp`, `${P}/ai-product-photography/3.webp`, `${P}/seedream-5-5/1.webp`],
  },
];

/** 节点卡：圆角白边小卡，左右各一个连线端点 */
function Node({ x, y, w, h, children, dots = "both" }: { x: number; y: number; w: number; h: number; children: React.ReactNode; dots?: "both" | "left" | "right" }) {
  return (
    <div className="absolute" style={{ left: x, top: y, width: w, height: h }}>
      <div className="size-full overflow-hidden rounded-[10px] shadow-[0_10px_30px_rgba(0,0,0,0.45)] ring-[3px] ring-white/15">{children}</div>
      {dots !== "right" && <span className="absolute -left-[3px] top-1/2 size-[6px] -translate-y-1/2 rounded-full bg-white/50" />}
      {dots !== "left" && <span className="absolute -right-[3px] top-1/2 size-[6px] -translate-y-1/2 rounded-full bg-white/50" />}
    </div>
  );
}

/** 顶部节点连线拼贴(设计稿 1000×240,窄屏按比例缩小) */
function NodeHero() {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [w, setW] = useState(1000);
  useEffect(() => {
    /* 窄屏最小按 0.62 缩放，左右两侧节点裁掉，保证标题读得清 */
    const fit = () => { const cw = box.current?.clientWidth ?? 1000; setW(cw); setScale(Math.max(0.62, Math.min(1, cw / 1000))); };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  const line = "stroke-white/25";
  return (
    <div ref={box} className="relative mx-auto w-full max-w-[1000px] overflow-hidden" style={{ height: 200 * scale }}>
      <div className="absolute top-0 origin-top-left" style={{ left: (w - 1000 * scale) / 2, width: 1000, height: 240, transform: `scale(${scale})` }}>
        {/* 连线 */}
        <svg className="pointer-events-none absolute inset-0" width="1000" height="240" fill="none" strokeWidth="1.2">
          <path className={line} d="M64 32 C 140 32, 150 70, 216 72" />
          <path className={line} d="M88 120 C 150 120, 150 76, 216 72" />
          <path className={line} d="M290 70 C 315 70, 320 72, 336 72" />
          <path className={line} d="M626 72 C 645 72, 655 74, 672 76" />
          <path className={line} d="M780 76 C 820 76, 840 128, 880 132" />
        </svg>

        {/* 产品图 */}
        <Node x={8} y={8} w={56} h={52} dots="right">
          <img src={`${T}/product-ad.jpg`} alt="LUMEA serum product photo used as a reference node" className="size-full bg-white object-cover" />
        </Node>
        {/* 提示词节点 */}
        <div className="absolute left-0 top-[96px] w-[86px] rounded-[8px] bg-white/[0.07] p-[7px] text-[6.5px] leading-[1.45] text-white/60 ring-1 ring-white/10">
          A young woman holds the serum bottle up to the camera in a bright bathroom, natural light, talking to her phone.
          <span className="absolute -right-[3px] top-1/2 size-[6px] -translate-y-1/2 rounded-full bg-white/50" />
        </div>
        {/* 评论气泡 */}
        <div className="absolute left-[96px] top-[52px] flex items-start gap-1">
          <svg width="9" height="9" viewBox="0 0 10 10" className="mt-[-4px]"><path d="M0 0 L10 4 L4 5 L3 10 Z" fill={ORANGE} /></svg>
          <span className="rounded-[5px] px-[6px] py-[3px] text-[7px] font-semibold leading-tight text-white" style={{ background: ORANGE }}>
            <span className="block text-[5.5px] font-medium opacity-80">Lena</span>That&apos;s cool!
          </span>
        </div>
        {/* 生成的模特图 */}
        <Node x={216} y={20} w={74} h={104}>
          <img src={`${T}/ugc-product-review.jpg`} alt="AI image of a woman holding the serum, generated from the product node" className="size-full object-cover" />
        </Node>

        {/* 被选中的标题节点 */}
        <div className="absolute left-[336px] top-[30px] w-[290px] border border-[#5B8CFF] px-4 py-3 text-center">
          {[["-left-[3px]", "-top-[3px]"], ["-right-[3px]", "-top-[3px]"], ["-left-[3px]", "-bottom-[3px]"], ["-right-[3px]", "-bottom-[3px]"]].map(([a, b]) => (
            <span key={a + b} className={`absolute ${a} ${b} size-[6px] rounded-[1px] border border-[#5B8CFF] bg-white`} />
          ))}
          <p className="font-mono text-[7.5px] uppercase tracking-[0.2em] text-white/55">BuzzVideo Canvas</p>
          <h1 className="mt-1.5 whitespace-nowrap text-[22px] font-black uppercase leading-[1.02] tracking-[-0.01em] text-white">
            Images, video &amp; audio<br />on one AI Canvas
          </h1>
        </div>

        {/* 视频节点 */}
        <Node x={672} y={40} w={108} h={72}>
          <video src={`${T}/ugc-product-review.mp4`} poster={`${T}/ugc-product-review.jpg`} muted loop autoPlay playsInline className="size-full object-cover" />
        </Node>
        {/* 手写批注 + 协作者光标 */}
        <svg className="absolute left-[818px] top-[14px]" width="34" height="18" viewBox="0 0 34 18" fill="none" stroke={ORANGE} strokeWidth="1.4" strokeLinecap="round">
          <path d="M3 9 C 3 3, 11 3, 11 9 C 11 15, 3 15, 3 9 Z M16 3 L16 15 M16 10 L23 4 M18 8 L24 15 M27 12 L31 6" />
        </svg>
        <div className="absolute left-[850px] top-[26px] flex items-start gap-0.5">
          <svg width="8" height="8" viewBox="0 0 10 10"><path d="M0 0 L10 4 L4 5 L3 10 Z" fill={ORANGE} /></svg>
          <span className="rounded-[4px] px-[5px] py-[1.5px] text-[6.5px] font-semibold text-white" style={{ background: ORANGE }}>Mia</span>
        </div>
        {/* 第二段视频 */}
        <Node x={880} y={96} w={112} h={70} dots="left">
          <video src={`${T}/product-ad.mp4`} poster={`${T}/product-ad.jpg`} muted loop autoPlay playsInline className="size-full object-cover" />
        </Node>
      </div>
    </div>
  );
}

function TemplateThumb({ t }: { t: Tpl }) {
  const [hover, setHover] = useState(false);
  if (t.grid)
    return (
      <div className="grid size-full grid-cols-3 grid-rows-2 gap-px bg-black">
        {t.grid.map((g) => <img key={g} src={g} alt="" className="size-full object-cover" />)}
      </div>
    );
  return (
    <div className="relative size-full" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <img src={t.img} alt={`${t.title} canvas template preview`} className="size-full object-cover" />
      {t.video && hover && <video src={t.video} muted loop autoPlay playsInline className="absolute inset-0 size-full object-cover" />}
    </div>
  );
}

export function CanvasLanding({ onLink }: { onLink: OnLink }) {
  const [tab, setTab] = useState<"all" | "templates">("all");
  const app = appOf("/canvas") ?? "/prototypes/site/canvas";
  const go = (label: string) => (e: React.MouseEvent) => {
    if (app.startsWith("/prototypes/site")) {
      e.preventDefault();
      onLink({ label, href: "/canvas" } as Parameters<OnLink>[0]);
    }
  };

  return (
    <main
      className="relative min-h-[100dvh] overflow-hidden text-white"
      style={{
        background: "radial-gradient(ellipse 90% 60% at 50% 0%, #17306b 0%, #0f1c3d 45%, #0b0d12 80%)",
      }}
    >
      {/* 点阵底纹 */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:radial-gradient(rgba(255,255,255,0.55)_1px,transparent_1px)] [background-size:14px_14px] [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" />

      <div className="relative px-4 pt-[92px] sm:px-6">
        <NodeHero />

        <section className="mx-auto mt-6 max-w-[720px]" aria-label="Canvases">
          <div className="flex items-center gap-2">
            <div role="tablist" className="flex items-center gap-1.5">
              <button role="tab" aria-selected={tab === "all"} onClick={() => setTab("all")} className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition ${tab === "all" ? "bg-white/[0.12] text-white" : "text-white/55 hover:text-white"}`}>
                All Canvases
              </button>
              <span className="h-3.5 w-px bg-white/15" />
              <button role="tab" aria-selected={tab === "templates"} onClick={() => setTab("templates")} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition ${tab === "templates" ? "bg-white/[0.12] text-white" : "text-white/55 hover:text-white"}`}>
                Templates
                <span className="rounded-[4px] px-1.5 py-px text-[9px] font-semibold text-[#240A03]" style={{ background: ORANGE }}>Quick Start</span>
              </button>
            </div>
            <button aria-label="Search canvases" className="ml-auto grid size-8 place-items-center rounded-full text-white/55 transition hover:bg-white/10 hover:text-white">
              <Search className="size-4" />
            </button>
          </div>

          {tab === "all" ? (
            <div className="flex flex-col items-center py-20 text-center">
              <p className="text-[14px] text-white/60">Sign in to view your canvases</p>
              <a href={app} onClick={go("Get started")} className="mt-4 rounded-[10px] px-5 py-2.5 text-[14px] font-semibold text-[#240A03] transition hover:brightness-110" style={{ background: ORANGE }}>
                Get started
              </a>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3">
              <a href={app} onClick={go("Create new canvas")} className="group">
                <div className="grid aspect-[2.2/1] place-items-center rounded-[10px] bg-white/[0.06] ring-1 ring-white/[0.06] transition group-hover:bg-white/[0.1]">
                  <span className="grid size-8 place-items-center rounded-full bg-white/15"><Plus className="size-4" /></span>
                </div>
                <p className="mt-2 text-[13px] font-semibold">Create new canvas</p>
                <p className="text-[11px] text-white/35">Blank board</p>
              </a>
              {TEMPLATES.map((t) => (
                <a key={t.title} href={app} onClick={go(t.title)} className="group">
                  <div className="aspect-[2.2/1] overflow-hidden rounded-[10px] ring-1 ring-white/[0.06] transition group-hover:ring-white/25">
                    <TemplateThumb t={t} />
                  </div>
                  <p className="mt-2 text-[13px] font-semibold">{t.title}</p>
                  <p className="text-[11px] text-white/35">Canvas template</p>
                </a>
              ))}
            </div>
          )}
        </section>
      </div>
      <div className="h-24" />
    </main>
  );
}
