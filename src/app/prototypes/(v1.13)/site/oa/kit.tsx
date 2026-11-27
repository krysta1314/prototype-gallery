"use client";

/* 落地页区块(2026-11-19,Monica:工具页和模型页都照 openart.ai/ai-image-generator 的版式做)。
   OpenArt 的骨架：黑底首屏(居中大写大标题 + 一句话 + 发光提示词框 + 散开的作品拼贴)→ 示例与提示词(分类标签 + 横向竖卡)
     → 关键功能(左右交替：大图 + 标题 + 一段话 + Try it now)→ 整块品牌色底：更多玩法卡片 + 背后的模型
     → 浅底：三步教程卡 + 按人群的用途 → 黑底:FAQ 两列 → 博客 → 相关工具标签 → 发光收尾卡。
   和 OpenArt 不同的地方(故意):
     - 配色只用官方色板：品牌色整块底 = #FF744D(OpenArt 是品红),浅底 = #F6F6F6,正文 #240A03;
     - 不放用户评价(我们没有真实评价，不编);
     - 画面只用 BuzzVideo 真实成片，知道模型就标模型名。 */

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ArrowRight, ArrowUpRight, Check, ChevronLeft, ChevronRight, Copy, Plus, Volume2, VolumeX } from "lucide-react";
import type { Pic, Post } from "./pool";
import { isTextHeavy } from "./pool";
import { HeroDevelop } from "./hero";
import { InsetCard } from "./inset";
import { isRemoved } from "../redirects";

export const OA_WRAP = "mx-auto max-w-[1240px] px-4 sm:px-6";
/* OpenArt 的大写粗体标题(全站一个层级，不是每节小 kicker) */
/* 2026-11-19 照 openart.ai/ai-video-generator 实测：区块标题 40px / 700 / 行高 1.2,首字母大写(不全大写);
   品牌色整块里的「更多玩法」用 64px / 900 全大写，模型标题 50px */
export const OA_H2 = "font-bold leading-[1.2] tracking-[-0.01em] [text-wrap:balance] text-[clamp(28px,2.8vw,40px)]";
export const OA_H2_XL = "font-black uppercase leading-[1.1] tracking-[-0.01em] [text-wrap:balance] text-[clamp(36px,4.4vw,64px)]";
export const OA_H2_L = "font-bold leading-[1.12] tracking-[-0.01em] [text-wrap:balance] text-[clamp(30px,3.5vw,50px)]";
export const OA_CTA =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-5 py-3 text-[15px] font-bold text-white shadow-[0_10px_30px_rgba(255,82,85,0.3)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white";
const ratio = (a?: string) => {
  const [w, h] = (a ?? "1:1").split(":").map(Number);
  return w && h ? w / h : 1;
};
export type LinkProps = { href: string; onClick: (e: React.MouseEvent) => void };

/* ── 单张成片：视频进入视口才播(静音循环,减少动态效果时不播) ── */
/* 2026-11-25 Monica:所有视频加声音按钮。只在视频真的带音轨时出现(没声音的不显示按钮);同一时间只开一条的声音 */
type AudioProbe = HTMLVideoElement & { mozHasAudio?: boolean; webkitAudioDecodedByteCount?: number; audioTracks?: { length: number } };
const hasAudio = (v: AudioProbe) => !!v.mozHasAudio || (v.webkitAudioDecodedByteCount ?? 0) > 0 || (v.audioTracks?.length ?? 0) > 0;
function SoundToggle({ video }: { video: React.RefObject<HTMLVideoElement | null> }) {
  const [audible, setAudible] = useState(false);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const v = video.current as AudioProbe | null;
    if (!v) return;
    const check = () => { if (hasAudio(v)) { setAudible(true); v.removeEventListener("timeupdate", check); } };
    const sync = () => setOn(!v.muted);
    const others = (e: Event) => { if ((e as CustomEvent).detail !== v) { v.muted = true; } };
    v.addEventListener("timeupdate", check);
    v.addEventListener("loadedmetadata", check);
    v.addEventListener("volumechange", sync);
    window.addEventListener("oa-sound-on", others);
    return () => { v.removeEventListener("timeupdate", check); v.removeEventListener("loadedmetadata", check); v.removeEventListener("volumechange", sync); window.removeEventListener("oa-sound-on", others); };
  }, [video]);
  if (!audible) return null;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const v = video.current;
        if (!v) return;
        v.muted = !v.muted;
        if (!v.muted) { window.dispatchEvent(new CustomEvent("oa-sound-on", { detail: v })); v.play().catch(() => {}); }
      }}
      aria-label={on ? "Mute video" : "Unmute video"}
      aria-pressed={on}
      className="absolute bottom-3 right-3 z-20 flex size-9 items-center justify-center rounded-full bg-[#240A03]/75 text-white shadow-[0_6px_18px_rgba(0,0,0,0.35)] backdrop-blur transition-transform duration-200 ease-out hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF744D] motion-reduce:transition-none"
    >
      {on ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
    </button>
  );
}

export function PicView({ p, className = "", cover = true, forceCover = false }: { p: Pic; className?: string; cover?: boolean; forceCover?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: 0.2 });
    io.observe(v);
    return () => io.disconnect();
  }, []);
  /* 2026-11-27 审图：海报 / 横幅这类字多的图在卡片里被 object-cover 裁成半截(「sugar. z.」「…dline」「sorted.」)→ 完整显示。
     透明底抠图直接透明显示(Monica:「之前的透明的就很好啊，干嘛做马赛克」),不垫棋盘格 */
  const fit = forceCover || (cover && !(p.kind === "image" && isTextHeavy(p))) ? "object-cover" : "object-contain"; /* 前后对比两张必须同样铺满才对得齐，不留白边(forceCover) */
  const bg = "";
  if (p.kind === "video")
    return (
      <div className="relative size-full">
        <video ref={ref} src={p.poster ? p.src : `${p.src}#t=1`} poster={p.poster} muted loop playsInline preload={p.poster ? "none" : "metadata"} aria-label={p.alt} className={`size-full ${fit} ${className}`} />
        {p.inset && <InsetCard p={p.inset} label={p.insetLabel} />}
        <SoundToggle video={ref} />
      </div>
    );
  if (p.inset && p.kind === "image")
    return (
      <div className="relative size-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.src} alt={p.alt} loading="lazy" className={`size-full ${fit} ${className}`} />
        <InsetCard p={p.inset} label={p.insetLabel} />
      </div>
    );
  if (p.kind === "audio")
    return (
      <div className={`flex size-full flex-col justify-end bg-[#1C1C1C] p-5 ${className}`}>
        <p className="text-[14px] font-bold leading-snug text-white">{p.alt}</p>
        <audio src={p.src} controls className="mt-3 w-full" />
      </div>
    );
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={p.src} alt={p.alt} loading="lazy" className={`size-full ${fit} ${bg} ${className}`} />;
}

function ModelChip({ p, dark = true }: { p: Pic; dark?: boolean }) {
  if (!p.model) return null;
  return <span className={`rounded-full px-2.5 py-1 text-[11.5px] font-semibold backdrop-blur ${dark ? "bg-black/55 text-white" : "bg-white/85 text-[#240A03]"}`}>{p.model}</span>;
}

/* ── 首屏(2026-11-19 Monica:照 openart.ai/ai-image-generator 的首屏布局)──
   5 张大图错落铺在输入框后面：最左、最右两张方图靠上;中间三张更大、往下沉，中间那张最低;输入框压在中间三张上面。
   滚动时有一点视差(两边往外上方散开、中间往上浮),「减少动态效果」时静止。
   标题和一句话在图片上方，完整可见(不让图片压字，也不让字压图里的主体)。手机宽改成横排。 */
export function OAHero({
  chip,
  title,
  accent,
  lead,
  box,
  note,
  pics,
  onPrompt,
  feature,
  split,
  oneLine,
}: {
  /** 2026-11-27 Monica「一行」:模型页标题(模型名)桌面端不折行，长名字自动缩字号 */
  oneLine?: boolean;
  /** 2026-11-26 单个主画面(单视频 / 前后对比)代替 5 张拼贴 */
  feature?: ReactNode;
  /** 2026-11-27 Monica「MCP 这几页 HERO 分成左右」:左边标题 + 说明 + 输入框，右边主画面 */
  split?: boolean;
  onPrompt?: (s: string) => void;
  chip?: ReactNode;
  title: string;
  accent?: string;
  lead: string;
  box: ReactNode;
  note?: ReactNode;
  pics: Pic[];
}) {
  if (split && feature)
    return (
      <section className="relative isolate overflow-hidden">
        {/* 2026-11-27 Monica「这种布局 hero 高度改小一点，露出下面的模块」:不再占满一屏，上下只留适度留白 */}
        <div aria-hidden className="pointer-events-none absolute left-[78%] top-[-200px] -z-10 h-[520px] w-[760px] -translate-x-1/2 rounded-full bg-[#FF744D]/[0.16] blur-[120px]" />
        {/* 2026-11-27 Monica 框出宽度：首屏左右两块和下面模块同宽对齐(OA_WRAP),不再撑满屏 */}
        {/* 2026-11-27 Monica「尺寸大点」:左边画面加宽(1.55 : 1),整块比下面版心略宽(最宽 1440) */}
        <div className="relative z-10 mx-auto grid w-full max-w-[1440px] items-center gap-10 px-4 py-12 sm:px-6 md:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] md:gap-12 md:pb-[clamp(40px,4vw,96px)] md:pt-[clamp(96px,8vw,180px)] lg:px-10">
          <div className="text-left">
            {chip && <div className="mb-6">{chip}</div>}
            <h1 className="font-black uppercase tracking-[-0.035em] [text-wrap:balance] text-[clamp(34px,calc(10px+2.3vw),54px)] leading-[0.98]">
              <span className="block">{title}</span>
              {accent && " "}
              {accent && <span className="block text-[#FF744D]">{accent}</span>}
            </h1>
            <p className="mt-5 max-w-[560px] text-[15px] leading-[24px] text-white/75 [text-wrap:pretty]">{lead}</p>
            {note && <div className="mt-2 text-[12px] text-white/50">{note}</div>}
            <div className="relative z-20 mt-8 max-w-[600px]">{box}</div>
          </div>
          {/* 2026-11-27 Monica 画箭头「替换一下」:演示画面换到左边，标题 + 输入框到右边(手机上仍是文字在上) */}
          <div className="min-w-0 md:order-first">{feature}</div>
        </div>
      </section>
    );
  return (
    <section className="relative isolate flex flex-col overflow-hidden md:min-h-[calc(100svh-64px)] md:justify-end md:pb-[9vh]">
      {/* 2026-11-19 Monica:首屏占满一屏(减去 64px 顶栏),下一节不提前露出;内容整组靠下，底部留 9vh(Monica:整组再往上一些)(Monica:下面别空太多) */}
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-[-240px] -z-10 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[#FF744D]/[0.16] blur-[120px]" />
      {/* 2026-11-19 Monica:「人家的 hero section 一模一样做」—— 竖向节奏全部照 openart.ai/ai-image-generator 实测(1440 / 1920):
          标签→标题顶 68px;标题 88→104px / 900 / 全大写 / 行高 0.92 / 字距 -0.035em;标题底→说明 18px;说明 14/22px 宽 640;说明底→输入框 52px */}
      <div className={`${OA_WRAP} relative z-10 w-full pt-10 text-center md:pt-[104px]`}>
        {chip && <div className="flex justify-center">{chip}</div>}
        {/* 2026-11-25 手机端审核：最小字号 53→43px，PHOTOGRAPHY / DROPSHIPPING 这类长单词在 375px 屏不再被裁掉;1440 以上基本不变 */}
        {/* 2026-11-27 Monica「一行」:桌面端模型名不折行;长名字(如 GPT IMAGE 2.5 SUNBURST)按字数缩字号，保证放进版心(1192px) */}
        <h1
          style={oneLine ? ({ "--fit": `calc(min(1192px, 100vw - 48px) / ${(title.length * 0.58).toFixed(2)})` } as CSSProperties) : undefined}
          className={`mx-auto max-w-[min(1320px,94vw)] font-black uppercase leading-[0.92] tracking-[-0.035em] [text-wrap:balance] text-[clamp(40px,calc(27px+4.2vw),104px)] ${oneLine ? "md:whitespace-nowrap md:text-[min(clamp(40px,calc(27px+4.2vw),104px),var(--fit))]" : ""} ${chip ? "mt-10" : "md:mt-[68px]"}`}
        >
          <span className="block">{title}</span>
          {accent && " "}
          {accent && <span className="block text-[#FF744D]">{accent}</span>}
        </h1>
        <p className="mx-auto mt-[18px] max-w-[640px] text-[14px] leading-[22px] text-white/75 [text-wrap:pretty]">{lead}</p>
        {note && <div className="mt-2 text-[12px] text-white/50">{note}</div>}
      </div>
      {/* 2026-11-19 Monica:副标题到输入框的间距 = 标题到副标题的间距(18px) */}
      <div className="relative mt-[18px] pb-16 md:pb-4">
        {feature ? (
          <>
            <div className="relative z-20 mx-auto max-w-[44rem] px-4 md:max-w-[min(max(calc(38.2vw+32px),600px),852px)]">{box}</div>
            <div className="mx-auto mt-8 w-[min(1080px,calc(100vw-32px))] md:mt-10">{feature}</div>
          </>
        ) : (
          <HeroDevelop pics={pics} box={box} onPrompt={onPrompt} />
        )}
      </div>
    </section>
  );
}

/* 发光的提示词框(OpenArt 首屏的样子;内容由页面传入) */
export function OAPromptBox({ children, onSubmit }: { children: ReactNode; onSubmit: () => void }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="rounded-[24px] bg-[#0B0B0B] p-4 text-left shadow-[0_0_0_1px_rgba(255,116,77,0.55),0_0_44px_rgba(255,116,77,0.32)] transition focus-within:shadow-[0_0_0_1.5px_rgba(255,116,77,0.9),0_0_60px_rgba(255,116,77,0.45)]"
    >
      {children}
    </form>
  );
}

/* ── 示例与提示词：分类标签 + 横向竖卡;悬停露出提示词，可复制 / 填回首屏 ── */
export function OAExamples({ title, sub, tabs, onUse }: { title: string; sub: string; tabs: { label: string; pics: Pic[] }[]; onUse?: (prompt: string) => void }) {
  const [t, setT] = useState(0);
  const row = useRef<HTMLDivElement>(null);
  const pics = tabs[t]?.pics ?? [];
  const scroll = (d: number) => row.current?.scrollBy({ left: d * 420, behavior: "smooth" });
  return (
    <section id="examples" className="scroll-mt-28 py-20 md:py-28">
      <div className={OA_WRAP}>
        <h2 className={OA_H2}>{title}</h2>
        <p className="mt-5 max-w-[60rem] text-[18px] leading-[28px] text-[#CACACA]">{sub}</p>
        <div className="mt-8 flex items-center justify-between gap-4">
          {tabs.length > 1 ? (
            <div role="tablist" className="flex flex-wrap gap-2">
              {tabs.map((x, i) => (
                <button
                  key={x.label}
                  type="button"
                  role="tab"
                  aria-selected={i === t}
                  onClick={() => setT(i)}
                  className={`h-10 rounded-full px-4 text-[14px] font-semibold transition ${i === t ? "bg-white text-[#240A03]" : "bg-white/[0.07] text-[#CACACA] hover:bg-white/[0.12] hover:text-white"}`}
                >
                  {x.label}
                </button>
              ))}
            </div>
          ) : (
            <span />
          )}
          <div className="hidden gap-2 md:flex">
            <button type="button" aria-label="Scroll left" onClick={() => scroll(-1)} className="grid size-10 place-items-center rounded-full bg-white/[0.07] text-white transition hover:bg-white/15">
              <ChevronLeft className="size-5" />
            </button>
            <button type="button" aria-label="Scroll right" onClick={() => scroll(1)} className="grid size-10 place-items-center rounded-full bg-white/[0.07] text-white transition hover:bg-white/15">
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>
      </div>
      <div ref={row} className="mt-8 flex snap-x gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:px-6 lg:px-[max(24px,calc((100vw-1240px)/2+24px))]">
        {pics.map((p) => (
          <figure key={p.src} className="group relative h-[420px] shrink-0 snap-start overflow-hidden rounded-[20px] bg-[#111] md:h-[480px]" style={{ aspectRatio: p.kind === "audio" ? "4 / 5" : `${Math.min(1.4, Math.max(0.56, ratio(p.aspect)))}` }}>
            <PicView p={p} />
            <div className="absolute left-3 top-3">
              <ModelChip p={p} />
            </div>
            {p.prompt && p.kind !== "audio" && (
              <figcaption className="absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 pt-16 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
                <p className="line-clamp-4 text-[13.5px] leading-relaxed text-white/90">{p.prompt}</p>
                <div className="mt-3 flex gap-2">
                  {onUse && (
                    <button type="button" onClick={() => onUse(p.prompt)} className="rounded-lg bg-white px-3 py-2 text-[12.5px] font-bold text-[#240A03] transition hover:bg-[#FFF3EC]">
                      Try this prompt
                    </button>
                  )}
                  <CopyBtn text={p.prompt} />
                </div>
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </section>
  );
}

export function CopyBtn({ text, light = false }: { text: string; light?: boolean }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() =>
        navigator.clipboard?.writeText(text).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        })
      }
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12.5px] font-semibold transition ${light ? "bg-[#240A03]/[0.06] text-[#240A03] hover:bg-[#240A03]/10" : "bg-white/15 text-white hover:bg-white/25"}`}
    >
      {done ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {done ? "Copied" : "Copy prompt"}
    </button>
  );
}

/* ── 关键功能：左右交替大图 ── */
export type OARow = { key: string; title: string; body: ReactNode; media: ReactNode; cta?: { label: string; link: LinkProps } };
/** 功能行区的宽度：比版心宽，最宽 1320,电脑上两侧至少 64px */
const ROW_W = "relative left-1/2 w-[min(1320px,calc(100vw-32px))] -translate-x-1/2 sm:w-[min(1320px,calc(100vw-48px))] md:w-[min(1320px,calc(100vw-128px))]";

export function OAFeatureRows({ id, title, sub, rows, tone = "dark" }: { id?: string; title: string; sub?: string; rows: OARow[]; tone?: "dark" | "light" }) {
  const light = tone === "light";
  return (
    <section id={id} className={`scroll-mt-28 py-20 md:py-28 ${light ? "bg-[#F6F6F6] text-[#240A03]" : ""}`}>
      <div className={OA_WRAP}>
        <div className={light ? ROW_W /* 左对齐的标题和下面的图卡左边缘对齐 */ : "mx-auto max-w-[48rem] text-center"}>
          <h2 className={OA_H2}>{title}</h2>
          {sub && <p className={`mt-5 text-[18px] leading-[28px] ${light ? "max-w-[46rem] text-[#240A03]/80" : "text-[#CACACA]"}`}>{sub}</p>}
        </div>
        {/* 行区比全站版心(1240)宽一些(最宽 1320);电脑上两侧至少留 64px —— 2026-11-26 Monica 先说「两边间距小一点」,贴到 24px 后又说「有点太小了」 */}
        <div className={`${ROW_W} mt-14 space-y-20 md:mt-20 md:space-y-28`}>
          {rows.map((r, i) => (
            /* 2026-11-26 Monica:「这些地方全部都要用统一尺寸，不要一会大一会小」→ 先统一了列宽;
               又画了一条中线:「对齐，两边间距小一点，不要错落，要对齐」—— 左右各占一半，分界线永远在页面正中，图卡左右交替时不再越过中线 */
            <div key={r.key} className={`grid items-center gap-10 md:grid-cols-2 md:gap-14 ${i % 2 ? "md:[&>*:first-child]:order-2" : ""}`}>
              <div className={`overflow-hidden rounded-[24px] ${light ? "bg-white shadow-[0_24px_60px_rgba(36,10,3,0.10)]" : "bg-[#111] ring-1 ring-white/10"}`}>{r.media}</div>
              <div>
                <h3 className="text-[clamp(26px,3vw,40px)] font-extrabold leading-[1.08] tracking-[-0.02em] [text-wrap:balance]">{r.title}</h3>
                <div className={`mt-5 max-w-[34rem] text-[16.5px] leading-relaxed ${light ? "text-[#240A03]/80" : "text-[#CACACA]"}`}>{r.body}</div>
                {r.cta && (
                  <a {...r.cta.link} className={`mt-7 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-[15px] font-bold transition ${light ? "bg-[#240A03] text-white hover:bg-black" : "bg-white text-[#240A03] hover:bg-[#FFF3EC]"}`}>
                    {r.cta.label} <ArrowRight className="size-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── 前后对比滑杆(2026-11-25 Monica:功能行配图用前后对比滑杆，参考 Higgsfield)──
   底层是「之后」(图或视频),上层是「之前」,用 clip-path 按滑杆位置裁开。
   拖动和键盘操作都交给一个透明的 range 输入框：鼠标 / 触屏可拖，方向键可调，读屏软件能读出当前比例。 */
export function OACompare({ before, after, start = 50, beforeLabel = "Before", afterLabel = "After" }: { before: Pic; after: Pic; start?: number; beforeLabel?: string; afterLabel?: string }) {
  const [x, setX] = useState(start);
  /* 2026-11-27 Monica「所有页面带这种 slider 的要自动左右滑动」:进入视口后滑杆自己慢慢左右扫;
     鼠标移上去 / 拖过 / 键盘操作就停下交给用户，移出视口暂停;系统开了减少动态时不动 */
  const box = useRef<HTMLDivElement>(null);
  const [touched, setTouched] = useState(false);
  useEffect(() => {
    const el = box.current;
    if (!el || touched || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let t0 = 0;
    const tick = (t: number) => {
      if (!t0) t0 = t;
      setX(start + 32 * Math.sin((t - t0) / 700)); /* 2026-11-27 Monica「所有 slider 有点慢」:约 4.4 秒一个来回，18%↔82% */
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf);
      if (e.isIntersecting) { t0 = 0; raf = requestAnimationFrame(tick); }
    }, { threshold: 0.3 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [touched, start]);
  /* 2026-11-25 Monica:图生视频这类「之后」是视频的，滑杆看不出动作 —— 改成视频铺满，原图做小卡叠在左上角(参考 OpenArt) */
  if (after.kind === "video")
    return (
      <div className="relative size-full">
        <PicView p={after} />
        <figure className="absolute left-4 top-4 w-[30%] overflow-hidden rounded-[14px] bg-black shadow-[0_12px_30px_rgba(0,0,0,0.55)] ring-2 ring-white/90">
          <div className="aspect-[4/3]"><PicView p={before} /></div>
          <figcaption className="absolute left-2 top-2 rounded-full bg-[#240A03]/75 px-2 py-0.5 text-[11px] font-bold text-white">{beforeLabel}</figcaption>
        </figure>
        <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-[#240A03]/75 px-2.5 py-1 text-[12px] font-bold text-white">{afterLabel}</span>
      </div>
    );
  const chip = "pointer-events-none absolute top-3 rounded-full bg-[#240A03]/75 px-2.5 py-1 text-[12px] font-bold text-white";
  return (
    <div ref={box} onPointerEnter={() => setTouched(true)} onFocus={() => setTouched(true)} className="group relative size-full select-none overflow-hidden">
      <PicView p={after} forceCover />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - x}% 0 0)` }}>
        <PicView p={before} forceCover />
      </div>
      <span className={`${chip} left-3`} style={{ opacity: x > 14 ? 1 : 0 }}>{beforeLabel}</span>
      <span className={`${chip} right-3`} style={{ opacity: x < 86 ? 1 : 0 }}>{afterLabel}</span>
      <input
        type="range"
        min={0}
        max={100}
        value={x}
        onChange={(e) => (setTouched(true), setX(Number(e.target.value)))}
        aria-label={`Compare ${beforeLabel.toLowerCase()} and ${afterLabel.toLowerCase()}`}
        className="peer absolute inset-0 z-10 size-full cursor-ew-resize opacity-0"
      />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 w-[2px] -translate-x-1/2 bg-white" style={{ left: `${x}%` }}>
        <span className="absolute left-1/2 top-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#240A03] shadow-[0_6px_18px_rgba(0,0,0,0.45)] transition-transform duration-200 ease-out group-hover:scale-110 motion-reduce:transition-none">
          <ChevronLeft className="-mr-0.5 size-4" />
          <ChevronRight className="-ml-0.5 size-4" />
        </span>
      </div>
      {/* 键盘聚焦时给整块描一圈品牌橙 */}
      <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit] ring-0 ring-inset ring-[#FF744D] peer-focus-visible:ring-4" />
    </div>
  );
}

/* ── 品牌色整块底(OpenArt 的品红段;我们用 #FF744D):更多玩法 + 背后的模型 ── */
export type OACard = { key: string; title: string; desc?: string; tag?: string; meta?: string; pic?: Pic; link: LinkProps };
export function OADrench({ ways, models }: { ways: { title: string; cards: OACard[] }; models?: { title: string; sub: string; cards: OACard[] } }) {
  const row = useRef<HTMLDivElement>(null);
  return (
    <section className="bg-[#FF744D] py-20 text-[#240A03] md:py-28">
      <div className={OA_WRAP}>
        <div className="flex items-end justify-between gap-6">
          <h2 className={OA_H2_XL}>{ways.title}</h2>
          <div className="hidden shrink-0 gap-2 md:flex">
            <button type="button" aria-label="Scroll left" onClick={() => row.current?.scrollBy({ left: -340, behavior: "smooth" })} className="grid size-10 place-items-center rounded-full bg-[#240A03] text-white transition hover:bg-black">
              <ChevronLeft className="size-5" />
            </button>
            <button type="button" aria-label="Scroll right" onClick={() => row.current?.scrollBy({ left: 340, behavior: "smooth" })} className="grid size-10 place-items-center rounded-full bg-[#240A03] text-white transition hover:bg-black">
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>
      </div>
      <div ref={row} className="mt-10 flex snap-x gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:px-6 lg:px-[max(24px,calc((100vw-1240px)/2+24px))]">
        {ways.cards.map((c) => (
          <a key={c.key} {...c.link} className="group w-[270px] shrink-0 snap-start rounded-[22px] bg-[#240A03] p-2.5 text-white transition hover:-translate-y-1 md:w-[300px]">
            <div className="aspect-[4/5] overflow-hidden rounded-[16px] bg-[#111]">{c.pic && <PicView p={c.pic} className="transition duration-500 group-hover:scale-[1.04]" />}</div>
            <p className="mt-3 px-1.5 text-[17px] font-bold">{c.title}</p>
            {c.desc && <p className="mt-1 px-1.5 pb-2 text-[13.5px] leading-snug text-[#CACACA]">{c.desc}</p>}
          </a>
        ))}
      </div>

      {models && (
      <div className={`${OA_WRAP} mt-24 md:mt-32`}>
        <div className="mx-auto max-w-[52rem] text-center">
          <h2 className={OA_H2_L}>{models.title}</h2>
          <p className="mt-5 text-[18px] leading-[28px] text-[#240A03]/85">{models.sub}</p>
        </div>
        {/* 2026-11-27 Monica「不管几个要居中」:1 张、2 张、不满一行的最后一排都居中 */}
        <div className="mt-12 flex flex-wrap justify-center gap-4">
          {models.cards.map((c) => (
            <a key={c.key} {...c.link} className="group w-full overflow-hidden rounded-[24px] bg-[#240A03] text-white transition hover:-translate-y-1 md:w-[calc((100%-2rem)/3)]">
              <div className="relative aspect-[4/3] overflow-hidden bg-[#1C1C1C]">
                {c.pic ? (
                  <PicView p={c.pic} className="transition duration-500 group-hover:scale-[1.04]" />
                ) : (
                  /* 这个模型还没有成片：用名字做画面，不借别的模型的图 */
                  <div className="flex size-full items-end bg-[radial-gradient(120%_90%_at_20%_10%,rgba(255,116,77,0.45),transparent_60%)] p-6">
                    <span className="text-[34px] font-extrabold leading-none tracking-[-0.02em]">{c.title}</span>
                  </div>
                )}
                {c.tag && <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[12px] font-semibold text-white backdrop-blur">{c.tag}</span>}
              </div>
              <div className="p-5">
                <p className="flex items-baseline justify-between gap-3">
                  <span className="text-[19px] font-extrabold">{c.title}</span>
                  {c.meta && <span className="shrink-0 text-[13px] font-semibold tabular-nums text-[#CACACA]">{c.meta}</span>}
                </p>
                {c.desc && <p className="mt-1.5 text-[14.5px] leading-relaxed text-[#CACACA]">{c.desc}</p>}
              </div>
            </a>
          ))}
        </div>
      </div>
      )}
    </section>
  );
}

/* ── 三步教程(浅底卡片，卡里是产品界面示意)── */
export function OASteps({ id = "how", title, steps }: { id?: string; title: string; steps: { title: string; body: string; visual: ReactNode }[] }) {
  return (
    <section id={id} className="scroll-mt-28 bg-[#F6F6F6] py-20 text-[#240A03] md:py-28">
      <div className={OA_WRAP}>
        <h2 className={`${OA_H2} text-center`}>{title}</h2>
        <ol className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title}>
              <div className="flex aspect-[4/3.4] items-center justify-center overflow-hidden rounded-[24px] bg-[radial-gradient(110%_90%_at_10%_0%,#FFF3EC,transparent_55%),radial-gradient(110%_90%_at_100%_100%,rgba(255,116,77,0.22),transparent_50%)] bg-white p-3">
                {/* 2026-11-26 Monica:「这里间距可以调小一点，这样里面内容大一点」—— 外框内边距 24→12,里面的小界面占满更多 */}
                <div className="w-full">{s.visual}</div>
              </div>
              <p className="mt-6 text-center text-[12.5px] font-bold uppercase tracking-[0.08em] text-[#FF5255]">Step 0{i + 1}</p>
              <h3 className="mt-2 text-center text-[18px] font-extrabold uppercase tracking-[-0.005em]">{s.title}</h3>
              <p className="mx-auto mt-2 max-w-[34ch] text-center text-[15px] leading-relaxed text-[#240A03]/80">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ── FAQ 两列卡片(答案收起时仍在 HTML)── */
export function OAFaq({ id = "faq", title = "Frequently asked questions", items }: { id?: string; title?: string; items: { q: string; a: string }[] }) {
  const half = Math.ceil(items.length / 2);
  const col = (list: { q: string; a: string }[], start: number) => (
    <div className="space-y-3">
      {list.map((q, i) => (
        <details key={q.q} open={start + i === 0} className="group rounded-[16px] bg-white/[0.05] ring-1 ring-white/[0.06]">
          <summary className="flex cursor-pointer list-none items-start gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
            <Plus className="mt-0.5 size-4 shrink-0 text-[#FF744D] transition group-open:rotate-45" />
            <h3 className="text-[15.5px] font-bold leading-snug">{q.q}</h3>
          </summary>
          <p className="px-5 pb-5 pl-[52px] text-[15px] leading-relaxed text-[#CACACA]">{q.a}</p>
        </details>
      ))}
    </div>
  );
  return (
    <section id={id} className="scroll-mt-28 py-20 md:py-28">
      <div className={OA_WRAP}>
        <h2 className={`${OA_H2} text-center`}>{title}</h2>
        <div className="mt-12 grid gap-3 md:grid-cols-2">
          {col(items.slice(0, half), 0)}
          {col(items.slice(half), half)}
        </div>
      </div>
    </section>
  );
}

/* ── 博客(线上真实文章)── */
export function OABlog({ posts, all, link }: { posts: Post[]; all: LinkProps; link: (p: Post) => LinkProps }) {
  return (
    <section className="py-16 md:py-24">
      <div className={`${OA_WRAP} grid gap-10 lg:grid-cols-[0.75fr_2.25fr] lg:gap-12`}>
        <div>
          <h2 className="text-[clamp(28px,3vw,40px)] font-extrabold uppercase leading-[1.05] tracking-[-0.01em]">More guides from the BuzzVideo blog</h2>
          <a {...all} className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-white/[0.08] px-4 py-2.5 text-[14px] font-semibold text-white transition hover:bg-white/15">
            All AI video guides <ArrowRight className="size-4" />
          </a>
        </div>
        <ul className="grid gap-4 sm:grid-cols-3">
          {posts.map((p) => (
            <li key={p.href}>
              <a {...link(p)} className="group block h-full overflow-hidden rounded-[18px] bg-white/[0.05] ring-1 ring-white/[0.06] transition hover:-translate-y-1">
                <div className="aspect-[16/10] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.cover} alt="" loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-[1.04]" />
                </div>
                <div className="p-4">
                  <p className="text-[12px] text-[#9F9F9F]">{p.date}</p>
                  <p className="mt-1.5 text-[15.5px] font-bold leading-snug">{p.title}</p>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ── 相关工具标签 ── */
export function OAChips({ title, chips, more }: { title: string; chips: { label: string; link: LinkProps; soon?: boolean }[]; /** 列表下方的「查看全部」按钮 */ more?: { label: string; link: LinkProps } }) {
  return (
    <section className="py-16 md:py-20">
      <div className={`${OA_WRAP} text-center`}>
        <h2 className="text-[clamp(28px,3.2vw,44px)] font-extrabold uppercase leading-[1.05] tracking-[-0.01em]">{title}</h2>
        <ul className="mx-auto mt-10 flex max-w-[64rem] flex-wrap justify-center gap-2.5">
          {/* 2026-11-25:合并页的链接会指到同一个目标页，按网址去重 */}
          {chips.filter((c, i) => !isRemoved((c.link as { href?: string }).href ?? "") && chips.findIndex((x) => (x.link as { href?: string }).href === (c.link as { href?: string }).href) === i).map((c) => (
            <li key={c.label}>
              {/* 2026-11-26 Monica:「换个样式，跟背景融合了」—— 原来 5% 白底 + 8% 描边在黑底上几乎看不见;改成清楚的描边胶囊，悬停反白 */}
              <a {...c.link} className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] px-5 py-2.5 text-[14px] font-semibold text-white ring-1 ring-white/30 transition hover:bg-white hover:text-[#240A03] hover:ring-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF744D]">
                {c.label}
                {c.soon && <span className="rounded-full bg-white/10 px-1.5 text-[10.5px] font-bold text-[#CACACA]">Soon</span>}
              </a>
            </li>
          ))}
        </ul>
        {more && (
          <a {...more.link} className="mt-8 inline-flex items-center gap-1.5 text-[15px] font-semibold text-white underline decoration-white/30 decoration-2 underline-offset-[6px] transition hover:decoration-[#FF744D]">
            {more.label}
            <ArrowRight aria-hidden className="size-4" />
          </a>
        )}
      </div>
    </section>
  );
}

/* ── 收尾发光卡 ── */
export function OACta({ title, sub, cta }: { title: string; sub: string; cta: { label: string; link: LinkProps } }) {
  return (
    <section className="pb-10 pt-6">
      <div className={OA_WRAP}>
        <div className="relative overflow-hidden rounded-[28px] bg-white/[0.04] px-6 py-20 text-center ring-1 ring-white/[0.08] md:py-28">
          <div aria-hidden className="pointer-events-none absolute left-1/2 top-[-180px] h-[360px] w-[760px] -translate-x-1/2 rounded-full bg-[#FF744D]/40 blur-[110px]" />
          <h2 className="relative text-[clamp(32px,4.4vw,60px)] font-extrabold leading-[1.02] tracking-[-0.02em] [text-wrap:balance]">{title}</h2>
          <p className="relative mx-auto mt-4 max-w-[36rem] text-[18px] leading-[28px] text-[#CACACA]">{sub}</p>
          <a {...cta.link} className={`${OA_CTA} relative mt-8 px-6 py-3.5`}>
            {cta.label} <ArrowUpRight className="size-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

/* ── 规格 / 价格 / 对比这类模型页专有的段，用同一套黑底卡片 ── */
export function OAPanel({ id, title, children, sub }: { id?: string; title: string; sub?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28 py-20 md:py-28">
      <div className={OA_WRAP}>
        <h2 className={OA_H2}>{title}</h2>
        {sub && <div className="mt-5 max-w-[46rem] text-[18px] leading-[28px] text-[#CACACA]">{sub}</div>}
        <div className="mt-12">{children}</div>
      </div>
    </section>
  );
}

/* 2026-11-27 逐页审图：模板卡 / 选择标准卡大量排成 3+2、3+1,最后一排空着格子。
   按张数选排法：3 的倍数 → 三列;4 张 → 两列;5 张 → 六格网格，前三张各占 2 格、后两张各占 3 格，两排都铺满 */
export function evenGrid(n: number): { wrap: string; item: (i: number) => string } {
  if (n === 4 || n === 2) return { wrap: "grid gap-4 md:grid-cols-2", item: () => "" };
  if (n === 5) return { wrap: "grid gap-4 md:grid-cols-2 lg:grid-cols-6", item: (i) => (i < 3 ? "lg:col-span-2" : "lg:col-span-3") + (i === 4 ? " md:col-span-2 lg:col-span-3" : "") };
  if (n === 7) return { wrap: "grid gap-4 md:grid-cols-2 lg:grid-cols-12", item: (i) => (i < 3 ? "lg:col-span-4" : "lg:col-span-3") + (i === 6 ? " md:col-span-2 lg:col-span-3" : "") };
  return { wrap: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", item: (i) => (n % 2 === 1 && i === n - 1 && n % 3 !== 0 ? "md:col-span-2 lg:col-span-1" : "") };
}
