"use client";

/* 落地页区块(2026-11-19,Monica:工具页和模型页都照 openart.ai/ai-image-generator 的版式做)。
   OpenArt 的骨架：黑底首屏(居中大写大标题 + 一句话 + 发光提示词框 + 散开的作品拼贴)→ 示例与提示词(分类标签 + 横向竖卡)
     → 关键功能(左右交替：大图 + 标题 + 一段话 + Try it now)→ 整块品牌色底：更多玩法卡片 + 背后的模型
     → 浅底：三步教程卡 + 按人群的用途 → 黑底:FAQ 两列 → 博客 → 相关工具标签 → 发光收尾卡。
   和 OpenArt 不同的地方(故意):
     - 配色只用官方色板：品牌色整块底 = #FF744D(OpenArt 是品红),浅底 = #F6F6F6,正文 #240A03;
     - 不放用户评价(我们没有真实评价，不编);
     - 画面只用 BuzzVideo 真实成片，知道模型就标模型名。 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, ArrowUpRight, Check, ChevronLeft, ChevronRight, Copy, Plus } from "lucide-react";
import type { Pic, Post } from "./pool";
import { HeroDevelop } from "./hero";

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
export function PicView({ p, className = "", cover = true }: { p: Pic; className?: string; cover?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: 0.2 });
    io.observe(v);
    return () => io.disconnect();
  }, []);
  const fit = cover ? "object-cover" : "object-contain";
  if (p.kind === "video") return <video ref={ref} src={p.src} poster={p.poster} muted loop playsInline preload="none" aria-label={p.alt} className={`size-full ${fit} ${className}`} />;
  if (p.kind === "audio")
    return (
      <div className={`flex size-full flex-col justify-end bg-[#1C1C1C] p-5 ${className}`}>
        <p className="text-[14px] font-bold leading-snug text-white">{p.alt}</p>
        <audio src={p.src} controls className="mt-3 w-full" />
      </div>
    );
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={p.src} alt={p.alt} loading="lazy" className={`size-full ${fit} ${className}`} />;
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
}: {
  onPrompt?: (s: string) => void;
  chip?: ReactNode;
  title: string;
  accent?: string;
  lead: string;
  box: ReactNode;
  note?: ReactNode;
  pics: Pic[];
}) {
  return (
    <section className="relative isolate flex flex-col overflow-hidden md:min-h-[calc(100svh-64px)] md:justify-end md:pb-[9vh]">
      {/* 2026-11-19 Monica:首屏占满一屏(减去 64px 顶栏),下一节不提前露出;内容整组靠下，底部留 9vh(Monica:整组再往上一些)(Monica:下面别空太多) */}
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-[-240px] -z-10 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[#FF744D]/[0.16] blur-[120px]" />
      {/* 2026-11-19 Monica:「人家的 hero section 一模一样做」—— 竖向节奏全部照 openart.ai/ai-image-generator 实测(1440 / 1920):
          标签→标题顶 68px;标题 88→104px / 900 / 全大写 / 行高 0.92 / 字距 -0.035em;标题底→说明 18px;说明 14/22px 宽 640;说明底→输入框 52px */}
      <div className={`${OA_WRAP} relative z-10 w-full pt-10 text-center md:pt-[104px]`}>
        {chip && <div className="flex justify-center">{chip}</div>}
        <h1 className={`mx-auto max-w-[min(1320px,94vw)] font-black uppercase leading-[0.92] tracking-[-0.035em] [text-wrap:balance] text-[clamp(44px,calc(40.9px+3.27vw),104px)] ${chip ? "mt-10" : "md:mt-[68px]"}`}>
          <span className="block">{title}</span>
          {accent && " "}
          {accent && <span className="block text-[#FF744D]">{accent}</span>}
        </h1>
        <p className="mx-auto mt-[18px] max-w-[640px] text-[14px] leading-[22px] text-white/75 [text-wrap:pretty]">{lead}</p>
        {note && <div className="mt-2 text-[12px] text-white/50">{note}</div>}
      </div>
      {/* 2026-11-19 Monica:副标题到输入框的间距 = 标题到副标题的间距(18px) */}
      <div className="relative mt-[18px] pb-16 md:pb-4">
        <HeroDevelop pics={pics} box={box} onPrompt={onPrompt} />
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
export function OAFeatureRows({ id, title, sub, rows, tone = "dark" }: { id?: string; title: string; sub?: string; rows: OARow[]; tone?: "dark" | "light" }) {
  const light = tone === "light";
  return (
    <section id={id} className={`scroll-mt-28 py-20 md:py-28 ${light ? "bg-[#F6F6F6] text-[#240A03]" : ""}`}>
      <div className={OA_WRAP}>
        <div className={light ? "" : "mx-auto max-w-[48rem] text-center"}>
          <h2 className={OA_H2}>{title}</h2>
          {sub && <p className={`mt-5 text-[18px] leading-[28px] ${light ? "max-w-[46rem] text-[#240A03]/80" : "text-[#CACACA]"}`}>{sub}</p>}
        </div>
        <div className="mt-14 space-y-20 md:mt-20 md:space-y-28">
          {rows.map((r, i) => (
            <div key={r.key} className={`grid items-center gap-10 md:grid-cols-[1.15fr_0.85fr] md:gap-16 ${i % 2 ? "md:[&>*:first-child]:order-2 md:grid-cols-[0.85fr_1.15fr]" : ""}`}>
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
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {models.cards.map((c) => (
            <a key={c.key} {...c.link} className="group overflow-hidden rounded-[24px] bg-[#240A03] text-white transition hover:-translate-y-1">
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
              <div className="flex aspect-[4/3.4] items-center justify-center overflow-hidden rounded-[24px] bg-[radial-gradient(110%_90%_at_10%_0%,#FFF3EC,transparent_55%),radial-gradient(110%_90%_at_100%_100%,rgba(255,116,77,0.22),transparent_50%)] bg-white p-6">
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
export function OAFaq({ title = "Frequently asked questions", items }: { title?: string; items: { q: string; a: string }[] }) {
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
    <section id="faq" className="scroll-mt-28 py-20 md:py-28">
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
            Read more <ArrowRight className="size-4" />
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
export function OAChips({ title, chips }: { title: string; chips: { label: string; link: LinkProps; soon?: boolean }[] }) {
  return (
    <section className="py-16 md:py-20">
      <div className={`${OA_WRAP} text-center`}>
        <h2 className="text-[clamp(28px,3.2vw,44px)] font-extrabold uppercase leading-[1.05] tracking-[-0.01em]">{title}</h2>
        <ul className="mx-auto mt-10 flex max-w-[64rem] flex-wrap justify-center gap-2.5">
          {chips.map((c) => (
            <li key={c.label}>
              <a {...c.link} className="inline-flex items-center gap-1.5 rounded-[12px] bg-white/[0.05] px-4 py-3 text-[14px] font-semibold text-white ring-1 ring-white/[0.08] transition hover:bg-white/[0.1]">
                {c.label}
                {c.soon && <span className="rounded-full bg-white/10 px-1.5 text-[10.5px] font-bold text-[#CACACA]">Soon</span>}
              </a>
            </li>
          ))}
        </ul>
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
