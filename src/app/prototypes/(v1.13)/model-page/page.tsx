"use client";

/* 模型页模板(2026-11-18,SEO / GEO)。样例:Kling 4.0 → 真实网址 /kling-4-0(2026-11-19 起落地页是一级网址)。
   同一套模板换 ModelPageContent 就是另一个模型(model-data.ts);参数读 capabilities.ts,价格读线上定价接口快照。
   第二版(同日,过 /impeccable 审核后重做,Monica 定的方向):
   - 去 AI 套路：不用渐变字、section 头顶不放全大写 kicker、不用 ✨、步骤编号是纯墨色数字、不排一组接一组的等大卡片;
   - 视觉靠「真实成片 + 实色色块」:首屏一条真实 Kling 4.0 成片立在实色橙块上;「什么时候别用」做成整块纯橙的高点;
   - 速查表和规格表合并;价格做成「时长 × 分辨率」矩阵;对比表统一 10 秒基准、手机上第一列吸附;
   - 次要文字最浅 #6a6b7b(审核测得 #9a9aab 只有 2.8:1);FAQ 正文限 70 字符宽;吸顶目录随滚动高亮当前区块。
   演示条「标出 SEO / GEO 作用」给每个区块加中文角标(演示用,不属于产品)。 */

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowRight, ArrowUpRight, Check, ChevronDown, Copy, Pause, Play } from "lucide-react";
import { useToast } from "../../(v1.7)/blog/toast";
import { APPLE_FONT } from "../../(v1.12)/hybrid-reel/agent/chat/shell";
import { SiteNavHeader, type OnLink } from "../site-nav/SiteNavHeader";
import { SiteFooter } from "../site-nav/SiteFooter";
import { credits, KLING_4, PLANS, PRICING_SOURCE, specsOf, type Media, type ModelPageContent } from "./model-data";

const ctaBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-6 py-3.5 text-[15px] font-bold text-white shadow-[0_10px_30px_rgba(255,82,85,0.28)] transition hover:brightness-105 hover:shadow-[0_14px_38px_rgba(255,82,85,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40 focus-visible:ring-offset-2";
const textLink = "inline-flex items-center gap-1 font-bold text-[#1a1a2e] underline decoration-[#ff5e1a] decoration-2 underline-offset-[5px] transition hover:text-[#ff5e1a]";
const h2 = "text-[clamp(30px,4.4vw,48px)] font-extrabold leading-[1.05] tracking-[-0.025em] text-[#1a1a2e] [text-wrap:balance]";
const muted = "text-[#5d5e6e]";

/* ───────── 演示:SEO / GEO 角标 ───────── */
const AnnoCtx = createContext(false);
function Anno({ children }: { children: ReactNode }) {
  if (!useContext(AnnoCtx)) return null;
  return <p className="mb-4 flex w-fit max-w-full items-start gap-1.5 rounded-lg bg-[#1a1a2e] px-2.5 py-1.5 text-[12px] font-medium leading-snug text-white">🔎 {children}</p>;
}

/* 尊重「减少动态效果」:开着就不自动播放 */
function useReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setR(m.matches);
    const on = () => setR(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return r;
}

/** 自动播放的视频都带暂停键(Nielsen #3 用户控制);controls=true 用浏览器原生控件 */
function Video({ m, controls = false, className = "", label }: { m: Media; controls?: boolean; className?: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduced = useReducedMotion();
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const v = ref.current;
    if (!v || controls) return;
    if (reduced) v.pause();
    else void v.play().catch(() => {});
  }, [reduced, controls]);
  return (
    <div className={`relative overflow-hidden bg-[#1a1a2e] ${className}`} style={{ aspectRatio: m.ratio }}>
      <video
        ref={ref}
        src={m.video}
        poster={m.poster}
        muted
        loop
        playsInline
        controls={controls}
        preload="metadata"
        aria-label={label}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className="size-full object-cover"
      />
      {!controls && (
        <button
          type="button"
          onClick={() => {
            const v = ref.current;
            if (!v) return;
            if (v.paused) void v.play();
            else v.pause();
          }}
          aria-label={playing ? "Pause video" : "Play video"}
          className="absolute bottom-3 right-3 grid size-9 place-items-center rounded-full bg-black/45 text-white backdrop-blur transition hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
        </button>
      )}
    </div>
  );
}

function Section({ id, anno, children, className = "" }: { id: string; anno: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={`scroll-mt-28 px-4 sm:px-6 ${className}`}>
      <div className="mx-auto max-w-[1120px]">
        <Anno>{anno}</Anno>
        {children}
      </div>
    </section>
  );
}

/* ───────── Try it:页内生成框(价格随设置实时算,读定价接口) ───────── */

function TryBox({ c, notify }: { c: ModelPageContent; notify: (t: string) => void }) {
  const [ratio, setRatio] = useState("9:16");
  const [dur, setDur] = useState("10");
  const [res, setRes] = useState("720p");
  const [prompt, setPrompt] = useState(
    'A woman in her late 20s holds a sage-green tumbler up to the camera in a sunny kitchen and says: "This is the only cup that keeps my coffee hot all morning." One continuous handheld take, native sound.',
  );
  const price = credits(c.pricingName, { duration: dur, resolution: res });
  const seg = (on: boolean) =>
    `h-9 min-w-11 rounded-lg px-2.5 text-[13px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40 ${on ? "bg-[#1a1a2e] text-white" : "text-[#3a3b4f] hover:bg-[#f3f3f6]"}`;
  const group = (name: string, opts: string[], v: string, set: (s: string) => void, suffix = "") => (
    <div className="flex items-center gap-2">
      <span className="w-[64px] shrink-0 text-[12.5px] font-semibold text-[#5d5e6e]">{name}</span>
      <div className="flex gap-0.5 rounded-[10px] border border-[#ececf1] p-0.5" role="group" aria-label={name}>
        {opts.map((o) => (
          <button key={o} type="button" onClick={() => set(o)} className={seg(v === o)} aria-pressed={v === o}>
            {o}
            {suffix}
          </button>
        ))}
      </div>
    </div>
  );
  return (
    <div className="rounded-[24px] border border-[#ececf1] bg-white p-4 shadow-[0_18px_44px_rgba(26,26,46,0.10)] sm:p-6">
      <label htmlFor="try-prompt" className="text-[14px] font-bold text-[#1a1a2e]">
        Describe your video
      </label>
      <textarea
        id="try-prompt"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={4}
        className="mt-2 w-full resize-none rounded-xl border border-[#e1e3e9] bg-white p-3.5 text-[15px] leading-relaxed text-[#1a1a2e] outline-none transition focus-visible:border-[#ff5e1a] focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/20"
      />
      <div className="mt-4 space-y-2.5">
        {group("Ratio", ["9:16", "16:9", "1:1"], ratio, setRatio)}
        {group("Length", ["5", "10", "15", "30"], dur, setDur, " s")}
        {group("Quality", ["720p", "1080p"], res, setRes)}
      </div>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-[#f1f1f4] pt-5">
        <div aria-live="polite">
          <p className="text-[26px] font-extrabold leading-none tabular-nums text-[#1a1a2e]">
            {price?.toLocaleString("en-US")} <span className="text-[15px] font-bold">credits</span>
          </p>
          <p className={`mt-1.5 text-[13px] ${muted}`}>Ratio doesn&apos;t change the price.</p>
        </div>
        <button type="button" onClick={() => notify("登录 / 注册后进入生成器：预选 Kling 4.0,带上提示词和设置(app 内跳转，不参与 SEO)")} className={ctaBtn}>
          Create with {c.name}
        </button>
      </div>
    </div>
  );
}

/* ───────── 页面主体 ───────── */

const TOC: [string, string][] = [
  ["overview", "Overview"],
  ["try", "Try it"],
  ["features", "What it does"],
  ["examples", "Prompts"],
  ["pricing", "Pricing"],
  ["compare", "Compare"],
  ["faq", "FAQ"],
];

/** 吸顶目录跟着滚动高亮当前区块:取「顶部已经越过吸顶栏的最后一个区块」(复审:原 IntersectionObserver 在手机长页面上会停在 Try it) */
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const line = 140; // 顶栏 64 + 目录 48 + 余量
      let cur = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) cur = id;
      }
      setActive(cur);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [ids]);
  return active;
}

function ModelPage({ c, notify, onLink }: { c: ModelPageContent; notify: (t: string) => void; onLink: OnLink }) {
  const s = specsOf(c);
  const [copied, setCopied] = useState<number | null>(null);
  const tocIds = useMemo(() => TOC.map(([id]) => id), []);
  const active = useActiveSection(tocIds);
  const tocRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    const ul = tocRef.current;
    const li = ul?.querySelector<HTMLElement>(`[data-toc="${active}"]`);
    if (!ul || !li) return;
    ul.scrollTo({ left: li.offsetLeft - ul.clientWidth / 2 + li.clientWidth / 2, behavior: "smooth" });
  }, [active]);
  const from = credits(c.pricingName, { duration: "5", resolution: "720p" })!;
  const a = (labelText: string, href: string) => ({
    href,
    onClick: (e: React.MouseEvent) => {
      e.preventDefault();
      onLink({ label: labelText, href, status: "new" });
    },
  });
  /* 速查表 + 规格表合并成一份(审核:三处重复同一批数字) */
  const facts: [string, string][] = [
    ["Developer", c.developer],
    ["Released", c.released],
    ["Video length", s.length],
    ["Resolution", s.resolutions],
    ["Aspect ratios", s.ratios],
    ["Sound", "Native audio and lip sync, always on"],
    ["Input modes", s.modes.join(", ")],
    ["References", s.references],
    ["Multi-shot", s.multiShot],
    ["Plans", c.plans],
  ];
  const withMedia = c.capabilities.filter((f) => f.media);
  const textOnly = c.capabilities.filter((f) => !f.media);

  return (
    <main className="text-[#1a1a2e]">
      {/* 面包屑 + 页内目录(吸顶,当前区块高亮) */}
      <div className="sticky top-16 z-30 border-b border-[#ececf1] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-12 max-w-[1120px] items-center gap-6 px-4 sm:px-6">
          <nav aria-label="Breadcrumb" className="hidden shrink-0 text-[13px] text-[#5d5e6e] lg:block">
            <ol className="flex items-center gap-1.5">
              <li>
                <a className="hover:text-[#1a1a2e]" {...a("Home", "/")}>
                  Home
                </a>
              </li>
              <li aria-hidden>/</li>
              <li>
                <a className="hover:text-[#1a1a2e]" {...a("AI Models", "/models")}>
                  AI Models
                </a>
              </li>
              <li aria-hidden>/</li>
              <li>
                <a className="hover:text-[#1a1a2e]" {...a(c.family.name, c.family.href)}>
                  {c.family.name}
                </a>
              </li>
              <li aria-hidden>/</li>
              <li aria-current="page" className="font-semibold text-[#1a1a2e]">
                {c.name}
              </li>
            </ol>
          </nav>
          <ul ref={tocRef} className="-mx-1 flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto text-[13.5px] font-semibold [scrollbar-width:none] [mask-image:linear-gradient(to_right,black_85%,transparent)] lg:justify-end lg:[mask-image:none]">
            {TOC.map(([id, l]) => (
              <li key={id} data-toc={id}>
                <a
                  href={`#${id}`}
                  aria-current={active === id ? "location" : undefined}
                  className={`relative block whitespace-nowrap px-2.5 py-3 transition ${active === id ? "text-[#1a1a2e]" : "text-[#5d5e6e] hover:text-[#1a1a2e]"}`}
                >
                  {l}
                  <span className={`absolute inset-x-2.5 bottom-0 h-0.5 rounded-full bg-[#ff5e1a] transition-opacity ${active === id ? "opacity-100" : "opacity-0"}`} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Hero:真实成片立在实色橙块上 */}
      <section id="overview" className="scroll-mt-28 overflow-hidden px-4 pb-20 pt-10 sm:px-6 md:pb-28 md:pt-16">
        <div className="mx-auto grid max-w-[1120px] items-center gap-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
          <div>
            <Anno>H1 = 模型名(大号墨色)+ AI Video Generator(第二行轻一级);首段 2 句答案优先定义，AI 搜索整句引用;橙色只出现一次 —— 落在起价上</Anno>
            <p className="text-[14px] font-semibold text-[#5d5e6e]">
              {c.developer} · Released {c.released}
            </p>
            <h1 className="mt-4 [text-wrap:balance]">
              <span className="block text-[clamp(52px,8.4vw,96px)] font-extrabold leading-[0.95] tracking-[-0.035em]">{c.name}</span>
              <span className="mt-2 block text-[clamp(26px,3.6vw,40px)] font-bold leading-tight tracking-[-0.02em] text-[#3a3b4f]">AI Video Generator</span>
            </h1>
            <p className="mt-6 max-w-[34rem] text-[18px] leading-relaxed text-[#3a3b4f] [text-wrap:pretty]">{c.definition}</p>
            <p className="mt-6 text-[17px] font-bold">
              <span className="text-[#b8400e]">{from} credits</span> for a 5 s 720p clip <span className={`font-medium ${muted}`}>· on {c.plans}</span>
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4">
              <a href="#try" className={ctaBtn}>
                Try {c.name} <ArrowRight className="size-4" />
              </a>
              <a href="#examples" className={textLink}>
                See the prompt behind it
              </a>
            </div>
          </div>
          <figure className="relative mx-auto w-full max-w-[340px]">
            {/* 实色橙块(品牌 Committed 用色):成片立在上面，不用渐变 */}
            <div aria-hidden className="absolute -inset-x-8 -bottom-8 top-16 rounded-[36px] bg-[#ff5e1a] sm:-inset-x-12" />
            <Video m={c.hero} label={`${c.name} example video`} className="relative rounded-[28px] shadow-[0_30px_70px_rgba(26,26,46,0.35)] ring-1 ring-black/5" />
            <figcaption className="relative mt-4 px-2 text-center text-[13px] font-semibold leading-snug text-[#1a1a2e]">{c.heroCaption}</figcaption>
          </figure>
        </div>
      </section>

      {/* At a glance(速查 + 规格合并) */}
      <Section id="glance" className="border-y border-[#ececf1] bg-white py-14" anno="速查 + 规格合并成一份 dl(审核:原来三处重复);AI 回答「多长 / 多少钱 / 支持什么」直接摘;数字全部来自 capabilities.ts 和定价接口">
        <h2 className="text-[22px] font-extrabold tracking-tight">{c.name} at a glance</h2>
        <dl className="mt-6 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
          {facts.map(([k2, v]) => (
            <div key={k2} className="flex gap-4 border-t border-[#ececf1] py-3.5 sm:block">
              <dt className="w-28 shrink-0 text-[13px] font-semibold text-[#5d5e6e] sm:w-auto">{k2}</dt>
              <dd className="text-[15.5px] font-semibold leading-snug sm:mt-1">{v}</dd>
            </div>
          ))}
        </dl>
      </Section>

      {/* Try it */}
      <Section id="try" className="bg-[#fff3ec] py-20 md:py-24" anno="页内直接试：停留和转化;积分随设置实时算(读定价接口);按钮进 app 预选模型">
        <div className="grid items-start gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div>
            <h2 className={h2}>Make a {c.name} video right here</h2>
            <p className={`mt-4 max-w-[30rem] text-[17px] leading-relaxed ${muted}`}>Write the take, pick the length, and see the exact price before you create.</p>
            <p className="mt-10 text-[15px] font-bold">{c.name} is at its best for</p>
            <ul className="mt-4 space-y-5">
              {c.bestFor.map((b) => (
                <li key={b.title} className="flex gap-3">
                  <Check className="mt-1 size-4 shrink-0 text-[#ff5e1a]" strokeWidth={3} />
                  <span>
                    <span className="block text-[16px] font-bold">{b.title}</span>
                    <span className={`mt-0.5 block text-[15px] leading-relaxed ${muted}`}>{b.body}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <TryBox c={c} notify={notify} />
        </div>
      </Section>

      {/* What it does:一节一个能力，左右交错，不排卡片格 */}
      <Section id="features" className="py-20 md:py-28" anno="每个能力一节(H3 = 长尾词，如 kling 4.0 omni reference);左右交错的「说明 + 成片」,不排等大卡片;只写产品真支持的(读 capabilities.ts 的 modes)">
        <h2 className={`${h2} max-w-[16ch]`}>What {c.name} can do on BuzzVideo</h2>
        <div className="mt-14 space-y-16 md:space-y-24">
          {withMedia.map((f, i) => (
            <article key={f.title} className="grid items-center gap-8 md:grid-cols-2 md:gap-16">
              <div className={i % 2 ? "md:order-2" : ""}>
                <h3 className="text-[clamp(24px,2.6vw,32px)] font-extrabold leading-tight tracking-[-0.02em]">{f.title}</h3>
                <p className={`mt-3 max-w-[32rem] text-[17px] leading-relaxed ${muted}`}>{f.body}</p>
              </div>
              <Video m={f.media!} label={f.title} className="rounded-[22px] shadow-[0_18px_44px_rgba(26,26,46,0.16)]" />
            </article>
          ))}
        </div>
        <div className="mt-20 grid gap-x-12 gap-y-8 border-t border-[#ececf1] pt-10 md:grid-cols-2 lg:grid-cols-4">
          {textOnly.map((f) => (
            <div key={f.title}>
              <h3 className="text-[17px] font-extrabold">{f.title}</h3>
              <p className={`mt-2 text-[15px] leading-relaxed ${muted}`}>{f.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Prompts:成片背后的提示词 + 草稿 + 用法 */}
      <Section id="examples" className="bg-[#faf8f6] py-20 md:py-28" anno="提示词模板(可复制)+ 草稿成片(VideoObject);下面 4 步 = HowTo 结构化数据;回答「how to prompt kling 4.0」">
        <h2 className={`${h2} max-w-[18ch]`}>The prompt behind the video</h2>
        {c.examples.map((ex, i) => (
          <figure key={ex.title} className="mt-12 grid items-start gap-8 md:grid-cols-[240px_1fr] md:gap-12">
            <div>
              <Video m={ex.media} controls label={ex.title} className="mx-auto max-w-[240px] rounded-[22px]" />
              <figcaption className="mt-4">
                <p className="text-[16px] font-extrabold">{ex.title}</p>
                <p className="mt-1 text-[13.5px] font-semibold tabular-nums">
                  {ex.settings} · {ex.credits.toLocaleString("en-US")} credits
                </p>
                <p className={`mt-2 text-[14px] leading-relaxed ${muted}`}>{ex.caption}</p>
              </figcaption>
            </div>
            {ex.prompt && (
              <div className="rounded-[22px] bg-white p-6 shadow-[0_4px_16px_rgba(26,26,46,0.06)] sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[15px] font-bold">{ex.prompt.label}</p>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard?.writeText(ex.prompt!.text);
                      setCopied(i);
                      notify("Prompt copied");
                    }}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#ececf1] px-3 text-[13px] font-bold transition hover:border-[#ff5e1a] hover:bg-[#fff7f1]"
                  >
                    {copied === i ? <Check className="size-4 text-[#1a7f4b]" /> : <Copy className="size-4" />} {copied === i ? "Copied" : "Copy prompt"}
                  </button>
                </div>
                <p className="mt-4 max-w-[68ch] text-[15.5px] leading-[1.75] text-[#2a2b3d]">{ex.prompt.text}</p>
                <p className={`mt-5 text-[13.5px] ${muted}`}>Replace everything in [brackets]. Set the model to {c.name}, 9:16, 15 s.</p>
              </div>
            )}
          </figure>
        ))}

        <h3 id="how-to" className="mt-20 scroll-mt-28 text-[clamp(24px,2.6vw,32px)] font-extrabold tracking-[-0.02em]">How to use {c.name} on BuzzVideo</h3>
        <ol className="mt-8 grid gap-x-10 gap-y-8 md:grid-cols-2 lg:grid-cols-4">
          {c.howTo.map((st, i) => (
            <li key={st.title} className="border-t-2 border-[#1a1a2e] pt-4">
              <span className="text-[34px] font-extrabold leading-none tabular-nums">{i + 1}</span>
              <h4 className="mt-3 text-[17px] font-extrabold">{st.title}</h4>
              <p className={`mt-1.5 text-[15px] leading-relaxed ${muted}`}>{st.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-14 grid gap-x-12 gap-y-3 md:grid-cols-[200px_1fr]">
          <p className="text-[15px] font-bold">Prompt tips</p>
          <ul className="grid gap-x-10 gap-y-3 sm:grid-cols-2">
            {c.promptTips.map((t) => (
              <li key={t} className="flex gap-2.5 text-[15px] leading-relaxed text-[#3a3b4f]">
                <Check className="mt-1 size-4 shrink-0 text-[#ff5e1a]" strokeWidth={3} /> {t}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* Pricing:时长 × 分辨率矩阵 */}
      <Section id="pricing" className="py-20 md:py-28" anno="价格矩阵(时长 × 分辨率),比原来混排的 6 行好读;「kling 4.0 price / cost」高意图词;服务端读定价接口，改价自动更新">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <h2 className={h2}>How much does {c.name} cost?</h2>
            <p className="mt-5 max-w-[32rem] text-[17px] leading-relaxed text-[#3a3b4f]">
              Billed by length and resolution, and the price shows before you press Create. A Pro month ({PLANS.pro.credits.toLocaleString("en-US")} credits) covers about{" "}
              <strong>{Math.floor(PLANS.pro.credits / credits(c.pricingName, { duration: "10", resolution: "720p" })!)} ten-second 720p clips</strong>.
            </p>
            <ul className="mt-6 space-y-2 text-[15px] text-[#3a3b4f]">
              {[PLANS.starter, PLANS.pro, PLANS.ultra].map((p) => (
                <li key={p.name} className="flex justify-between gap-4 border-b border-[#ececf1] pb-2 tabular-nums">
                  <span className="font-bold text-[#1a1a2e]">{p.name}</span>
                  <span>
                    ${p.perMonth}/mo · {p.credits.toLocaleString("en-US")} credits
                  </span>
                </li>
              ))}
            </ul>
            <p className={`mt-3 text-[13.5px] ${muted}`}>Billed yearly. Free credits work on Seedream 4.5, Seedream 5.0 Lite and Seed Audio 1.0.</p>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
              <a {...a("Pricing", "/pricing")} className={textLink}>
                Compare plans
              </a>
              <a {...a(c.spokes[1].label, c.spokes[1].href)} className={textLink}>
                Full price list
              </a>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[320px] text-left tabular-nums">
              <caption className="sr-only">
                {c.name} credits per clip by length and resolution, with approximate cost on the Pro yearly plan
              </caption>
              <thead>
                <tr className="border-b-2 border-[#1a1a2e] text-[14px]">
                  <th scope="col" className="py-3 pr-4 font-bold">
                    Length
                  </th>
                  {c.priceGrid.resolutions.map((r) => (
                    <th key={r} scope="col" className="px-4 py-3 text-right font-bold">
                      {r}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {c.priceGrid.durations.map((d) => (
                  <tr key={d} className="border-b border-[#ececf1]">
                    <th scope="row" className="py-4 pr-4 text-[17px] font-bold">
                      {d} s
                    </th>
                    {c.priceGrid.resolutions.map((r) => {
                      const cr = credits(c.pricingName, { duration: d, resolution: r });
                      return (
                        <td key={r} className="px-4 py-4 text-right">
                          {cr ? (
                            <>
                              <span className="block text-[20px] font-extrabold">{cr.toLocaleString("en-US")}</span>
                            </>
                          ) : (
                            <span className={muted}>—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className={`mt-3 text-[13px] ${muted}`}>Credits per clip. You see the exact price in the generator before you press Create.</p>
          </div>
        </div>
      </Section>

      {/* Compare */}
      <Section id="compare" className="pb-20 md:pb-28" anno="同类模型对比，统一 10 秒基准;手机上第一列吸附;每个模型名链到它自己的模型页(站内互链)">
        <h2 className={`${h2} max-w-[20ch]`}>{c.name} vs other video models</h2>
        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-[15px]">
            <thead>
              <tr className="border-b-2 border-[#1a1a2e] text-[14px]">
                <th scope="col" className="sticky left-0 z-10 bg-white py-3 pl-3 pr-4 font-bold">
                  Model
                </th>
                <th scope="col" className="px-4 py-3 font-bold">
                  Length
                </th>
                <th scope="col" className="px-4 py-3 font-bold">
                  10 s clip · credits
                </th>
                <th scope="col" className="px-4 py-3 font-bold">
                  Plans
                </th>
                <th scope="col" className="px-4 py-3 font-bold">
                  Best for
                </th>
              </tr>
            </thead>
            <tbody>
              {c.compare.map((r) => {
                const tint = r.self ? "bg-[#fff3ec]" : "";
                const typical = r.typical.replace(/^10 s (720p|standard) · /, "") + (r.typical.includes("standard") ? " (standard)" : "");
                return (
                  <tr key={r.model} className="border-b border-[#ececf1]">
                    <th scope="row" className={`sticky left-0 z-10 py-4 pl-3 pr-4 font-bold ${r.self ? "bg-[#fff3ec]" : "bg-white"}`}>
                      {r.self ? (
                        r.model
                      ) : (
                        <a {...a(r.model, r.href)} className="underline decoration-[#d4d3df] decoration-2 underline-offset-4 transition hover:decoration-[#ff5e1a]">
                          {r.model}
                        </a>
                      )}
                    </th>
                    <td className={`px-4 py-4 ${tint}`}>{r.length}</td>
                    <td className={`px-4 py-4 tabular-nums ${tint} ${r.self ? "font-bold" : ""}`}>{typical}</td>
                    <td className={`px-4 py-4 ${tint}`}>{r.plans}</td>
                    <td className={`px-4 py-4 ${muted} ${tint}`}>{r.bestFor}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className={`mt-3 text-[13px] ${muted}`}>720p unless noted. Starter+ = Starter, Pro and Ultra; Pro+ = Pro and Ultra.</p>
      </Section>

      {/* When not:整块纯橙，诚实变成页面高点 */}
      <section className="bg-[#ff5e1a] px-4 py-20 sm:px-6 md:py-28">
        <div className="mx-auto max-w-[1120px]">
          <Anno>「什么时候别用」做成整块纯橙的视觉高点(审核:诚实是最好的可信度时刻，原来被埋成普通卡片);墨色字在橙底对比度约 6:1</Anno>
          <h2 className="max-w-[18ch] text-[clamp(32px,5vw,56px)] font-extrabold leading-[1.02] tracking-[-0.03em] text-[#1a1a2e] [text-wrap:balance]">
            {`When ${c.name} isn't the right pick`}
          </h2>
          <p className="mt-5 max-w-[36rem] text-[18px] leading-relaxed text-[#1a1a2e]">We run every major video model, so there&apos;s no reason to oversell one. Here&apos;s where another model does the job better.</p>
          <div className="mt-12 grid gap-x-12 sm:grid-cols-2">
            {c.notFor.map((n) => (
              <div key={n.title} className="border-t-2 border-[#1a1a2e] py-6">
                <h3 className="text-[20px] font-extrabold text-[#1a1a2e]">{n.title}</h3>
                <p className="mt-2 max-w-[30rem] text-[16px] leading-relaxed text-[#1a1a2e]">{n.body}</p>
                {n.alt && (
                  <a {...a(n.alt.label, n.alt.href)} className="mt-3 inline-flex items-center gap-1 text-[15px] font-extrabold text-[#1a1a2e] underline decoration-2 underline-offset-[5px] hover:text-white">
                    Use {n.alt.label} instead <ArrowRight className="size-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Guides + FAQ */}
      <Section id="faq" className="py-20 md:py-28" anno="左：模型子页(提示词指南 / 价格 / 教程 / vs),专题群;右:FAQ 用 details 原生折叠，收起时答案仍在 HTML 里,FAQPage 结构化数据;正文限 70 字符宽">
        <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div className="lg:order-2">
            <h2 className={h2}>{c.name} FAQ</h2>
            <div className="mt-8 border-t border-[#ececf1]">
              {c.faq.map((f, i) => (
                <details key={f.q} open={i === 0} className="group border-b border-[#ececf1]">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 [&::-webkit-details-marker]:hidden">
                    <h3 className="text-[17px] font-bold leading-snug">{f.q}</h3>
                    <ChevronDown className="size-5 shrink-0 text-[#5d5e6e] transition group-open:rotate-180" />
                  </summary>
                  <p className="max-w-[70ch] pb-6 text-[16px] leading-relaxed text-[#3a3b4f]">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
          <div className="lg:order-1">
            <h2 className="text-[clamp(24px,2.6vw,32px)] font-extrabold tracking-[-0.02em]">More about {c.name}</h2>
            <ul className="mt-6 border-t border-[#ececf1]">
              {c.spokes.map((sp) => (
                <li key={sp.href}>
                  <a {...a(sp.label, sp.href)} className="group flex items-center justify-between gap-4 border-b border-[#ececf1] py-4">
                    <span>
                      <span className="block text-[16px] font-bold transition group-hover:text-[#ff5e1a]">{sp.label}</span>
                      <span className={`block text-[14px] ${muted}`}>{sp.desc}</span>
                    </span>
                    <ArrowRight className="size-4 shrink-0 transition group-hover:translate-x-0.5 group-hover:text-[#ff5e1a]" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* More models */}
      <section className="border-t border-[#ececf1] bg-[#faf8f6] px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-[1120px] gap-12 md:grid-cols-[0.8fr_1.2fr] md:gap-20">
          <div>
            <Anno>同家族其他版本 + 其他厂商模型：站内互链把权重分给整个模型页群</Anno>
            <h2 className="text-[20px] font-extrabold">More from {c.family.name}</h2>
            <ul className="mt-4 space-y-3">
              {c.siblings.map((sb) => (
                <li key={sb.href}>
                  <a {...a(sb.label, sb.href)} className="group block">
                    <span className="text-[16px] font-bold underline decoration-[#d4d3df] decoration-2 underline-offset-4 transition group-hover:decoration-[#ff5e1a]">{sb.label}</span>
                    <span className={`block text-[14px] ${muted}`}>{sb.desc}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-[20px] font-extrabold">Other AI video models on BuzzVideo</h2>
            <ul className="mt-4 grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
              {c.others.map((o) => (
                <li key={o.href}>
                  <a {...a(o.label, o.href)} className="group block">
                    <span className="text-[16px] font-bold underline decoration-[#d4d3df] decoration-2 underline-offset-4 transition group-hover:decoration-[#ff5e1a]">{o.label}</span>
                    <span className={`block text-[13.5px] ${muted}`}>by {o.vendor}</span>
                  </a>
                </li>
              ))}
            </ul>
            <a {...a("All AI models", "/models")} className={`${textLink} mt-6 text-[15px]`}>
              All AI models
            </a>
          </div>
        </div>
      </section>

      {/* Final CTA + sources */}
      <section className="px-4 pb-16 pt-20 sm:px-6 md:pt-28">
        <div className="mx-auto max-w-[1120px]">
          <div className="grid items-end gap-8 md:grid-cols-[1.3fr_0.7fr]">
            <h2 className="text-[clamp(36px,6vw,72px)] font-extrabold leading-[0.98] tracking-[-0.035em] [text-wrap:balance]">Draft 5 seconds. Then make the full take.</h2>
            <div className="md:justify-self-end">
              <p className="text-[17px] font-bold">
                {c.name} from <span className="text-[#b8400e]">{from} credits</span>
              </p>
              <a href="#try" className={`${ctaBtn} mt-4`}>
                Try {c.name} <ArrowRight className="size-4" />
              </a>
            </div>
          </div>
          <div className={`mt-20 border-t border-[#ececf1] pt-6 text-[13.5px] leading-relaxed ${muted}`}>
            <Anno>来源 + 核对日期：可信度信号，AI 更愿意引用标了出处和日期的页面</Anno>
            <p className="font-bold text-[#1a1a2e]">Sources</p>
            <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
              {c.sources.map((so) => (
                <li key={so.url}>
                  <a href={so.url} target="_blank" rel="noopener" className="inline-flex items-center gap-1 underline decoration-[#d4d3df] underline-offset-4 hover:text-[#1a1a2e]">
                    {so.label} <ArrowUpRight className="size-3.5" />
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-3 max-w-[80ch]">
              Last verified {c.lastVerified} against BuzzVideo&apos;s live generator and pricing. Features {c.developer} has announced but BuzzVideo doesn&apos;t offer yet are not listed.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ───────── 结构化数据 ───────── */

function jsonLd(c: ModelPageContent) {
  const url = `https://buzzvideo.ai/${c.slug}`;
  const from = credits(c.pricingName, { duration: "5", resolution: "720p" })!;
  const video = (name: string, description: string, m: Media) => ({
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name,
    description,
    thumbnailUrl: `https://buzzvideo.ai${m.poster}`,
    contentUrl: `https://buzzvideo.ai${m.video}`,
    uploadDate: "2026-11-02",
  });
  return [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        ["Home", "https://buzzvideo.ai/"],
        ["AI Models", "https://buzzvideo.ai/models"],
        [c.family.name, `https://buzzvideo.ai${c.family.href}`],
        [c.name, url],
      ].map(([name, item], i) => ({ "@type": "ListItem", position: i + 1, name, item })),
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: `${c.name} AI Video Generator on BuzzVideo`,
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Web",
      url,
      description: c.definition,
      offers: { "@type": "Offer", price: PLANS.starter.perMonth, priceCurrency: "USD", description: `Starter plan, billed yearly. ${c.name} from ${from} credits per 5-second 720p clip.` },
      publisher: { "@type": "Organization", name: "BuzzVideo AI", url: "https://buzzvideo.ai" },
    },
    {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: `How to use ${c.name} on BuzzVideo`,
      step: c.howTo.map((st, i) => ({ "@type": "HowToStep", position: i + 1, name: st.title, text: st.body })),
    },
    video(`${c.name} example: one-take UGC ad`, c.heroCaption, c.hero),
    ...c.examples.map((ex) => video(`${ex.title} · made with ${c.name}`, ex.caption, ex.media)),
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: c.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ];
}

/* ───────── 交接说明 ───────── */

const SECTIONS: [string, string, string][] = [
  ["面包屑 + 页内目录", "吸顶，滚动时当前区块下方橙线高亮;BreadcrumbList", "Google 结果显示路径;锚点可能成为搜索结果跳转链接"],
  ["Hero", "元信息行(厂商 · 发布)→ H1 两行(模型名大号 + AI Video Generator)→ 2 句定义 → 起价(全页少数橙字之一)→ CTA;右侧真实成片立在实色橙块上，下方写清设置和积分", "主关键词;定义句和 llms.txt 一致，AI 整句引用;真实成片是最强证据"],
  ["At a glance", "速查 + 规格合并的 dl(10 项)", "AI 回答事实类问题直接摘;数据自动带出"],
  ["Try it", "浅橙底;左 Best for,右生成框(积分随设置实时算)", "停留与转化"],
  ["What it does", "有成片的能力左右交错成节;没成片的 4 列文字", "能力类长尾词;不排等大卡片"],
  ["Prompts + How to use", "成片背后的提示词(可复制)+ 草稿;4 步墨色大数字;提示词技巧", "「<model> prompt」;HowTo"],
  ["Pricing", "时长 × 分辨率矩阵 + 套餐", "「<model> price / cost / free」"],
  ["Compare", "10 秒基准对比表，手机第一列吸附", "站内互链"],
  ["When not", "整块纯橙 + 墨色字，替代模型链接", "平衡内容更易被引用;页面视觉高点"],
  ["Guides + FAQ", "子页链接列表 + 8 问 details", "专题群;FAQPage"],
  ["More models / CTA / Sources", "同家族 + 其他模型;大字 CTA;来源与核对日期", "站内互链;可信度"],
];

const MEDIA_TODO: [string, string][] = [
  ["Hero(9:16)", "现为 11-02 博客的 15 秒 UGC 成片(真实 Kling 4.0)。计划换成一条 30 秒单镜头成片"],
  ["30-second single takes", "现为上新宣传片里的片段(字卡动画)。计划换成真实长镜头成片"],
  ["Omni Reference", "现为宣传片片段。计划换成「参考图 → 成片」并排"],
  ["First & last frame / Keyframes / Edit", "现在没有视频，只有文字。计划各配一组「输入 → 输出」"],
];

function Notes({ c }: { c: ModelPageContent }) {
  const ld = useMemo(() => jsonLd(c), [c]);
  return (
    <section className="border-t-8 border-[#1a1a2e] bg-white px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-[1040px] space-y-12 text-[#1a1a2e]">
        <div>
          <h2 className="text-[26px] font-extrabold tracking-tight">交接说明 · 模型页模板</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-[#5d5e6e]">
            一套模板服务所有模型：换一份 <code className="rounded bg-[#f5f5f7] px-1.5 py-0.5 text-[13px]">ModelPageContent</code>(model-data.ts)就是另一个模型。参数读 v1.12 的 capabilities.ts(和生成器同一份数据),价格读线上定价接口(原型用 {PRICING_SOURCE.fetched} 快照;真实页面在服务端拉接口 + ISR 缓存)。第二版已过 /impeccable 审核并按 design.md 新规则去掉渐变字、每节小标签和 ✨。
          </p>
        </div>
        <div>
          <h3 className="text-[18px] font-extrabold">区块顺序与 SEO / GEO 作用</h3>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-[#ececf1]">
            <table className="w-full min-w-[720px] text-left text-[14px]">
              <thead className="bg-[#faf8f6] text-[13px] font-bold text-[#5d5e6e]">
                <tr>
                  <th className="px-4 py-3">区块</th>
                  <th className="px-4 py-3">内容</th>
                  <th className="px-4 py-3">作用</th>
                </tr>
              </thead>
              <tbody>
                {SECTIONS.map(([x, y, z]) => (
                  <tr key={x} className="border-t border-[#ececf1] align-top">
                    <td className="px-4 py-3 font-semibold">{x}</td>
                    <td className="px-4 py-3 text-[#3a3b4f]">{y}</td>
                    <td className="px-4 py-3 text-[#5d5e6e]">{z}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <h3 className="text-[18px] font-extrabold">素材位(待 dev 生成的真实成片替换)</h3>
          <ul className="mt-3 space-y-1.5 text-[14.5px] leading-relaxed text-[#3a3b4f]">
            {MEDIA_TODO.map(([x, y]) => (
              <li key={x}>
                <span className="font-semibold">{x}</span>:{y}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-[18px] font-extrabold">Meta、网址与异常</h3>
          <ul className="mt-3 space-y-1.5 text-[14.5px] leading-relaxed text-[#3a3b4f]">
            <li>
              网址 <code className="text-[13px]">/models/{c.slug}</code>,家族总页 <code className="text-[13px]">{c.family.href}</code>;子页挂在版本页下(/prompt-guide、/pricing、/how-to-use),模型对比在 /compare/models/。
            </li>
            <li>
              Title:<span className="font-semibold">{c.metaTitle}</span>({c.metaTitle.length} 字符)
            </li>
            <li>
              Description:{c.metaDescription}({c.metaDescription.length} 字符)
            </li>
            <li>模型下架：页面不删，改成「&lt;Model&gt; alternatives」并在顶部写明下架;导航撤掉该模型。</li>
            <li>定价接口拉不到：显示上次缓存的价格并隐藏美元换算;某档位没有价格就显示「—」。</li>
            <li>视频加载失败：显示 poster 图;开了「减少动态效果」不自动播放;所有自动播放视频右下角有暂停键。</li>
          </ul>
        </div>
        <div>
          <h3 className="text-[18px] font-extrabold">结构化数据(JSON-LD,已写进本页 &lt;script&gt;)</h3>
          <pre className="mt-3 max-h-[420px] overflow-auto rounded-2xl bg-[#14141f] p-5 text-[12px] leading-relaxed text-[#e6e6ef]">{JSON.stringify(ld, null, 2)}</pre>
        </div>
      </div>
    </section>
  );
}

export default function ModelPageTemplate() {
  const [notify, toast] = useToast();
  const [anno, setAnno] = useState(false);
  const c = KLING_4;
  const info = (t: string) => notify(t, "info");
  const onLink: OnLink = (l) => info(`${l.label} → ${l.href}`);
  return (
    <AnnoCtx.Provider value={anno}>
      <div className="min-h-dvh bg-white text-[#1a1a2e]" style={{ fontFamily: APPLE_FONT }}>
        {toast}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(c)) }} />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-[#1a1a2e] px-4 py-2.5 text-white">
          <span className="text-[13px] font-bold">演示 · 模型页模板</span>
          <span className="rounded-lg bg-white/10 px-2.5 py-1 text-[12.5px] font-semibold">样例:{c.name} → /models/{c.slug}</span>
          <label className="flex cursor-pointer items-center gap-2 text-[13px] font-semibold">
            <input type="checkbox" checked={anno} onChange={(e) => setAnno(e.target.checked)} className="size-4 accent-[#ff5e1a]" />
            标出每个区块的 SEO / GEO 作用
          </label>
        </div>
        <SiteNavHeader mark={false} onLink={onLink} onAuth={(w) => info(w === "login" ? "Log in 将打开登录弹窗" : "Start free 将打开注册弹窗")} />
        <ModelPage c={c} notify={info} onLink={onLink} />
        <SiteFooter mark={false} onLink={onLink} notify={info} />
        <Notes c={c} />
      </div>
    </AnnoCtx.Provider>
  );
}
