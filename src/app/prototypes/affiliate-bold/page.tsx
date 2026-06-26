"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Plus,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Reveal } from "@/components/reveal";

const TOLT_URL = "https://buzzvideo.tolt.com/login";
function openTolt() {
  window.open(TOLT_URL, "_blank", "noopener");
}

/* 彻底换皮版:深色影院风 · Bricolage 编辑体 · 橙色单一强调
   跳出 design.md 的居中卡片体系,品牌只保留「橙」这一可识别符号。 */
const ORANGE = "#ff6a1f";
const head = { fontFamily: "var(--font-bricolage)" } as const;
const ASSET = "/prototypes/2026-06-09-affiliate/assets";
// 混合比例:竖屏 9:16 与横屏 16:9 都支持。整行统一高度,宽度按各自比例走、不裁切。
const VIDEOS: { file: string; ratio: number }[] = [
  { file: "广告视频1", ratio: 9 / 16 },
  { file: "广告视频2", ratio: 9 / 16 },
  { file: "广告视频3", ratio: 9 / 16 },
  { file: "广告视频4", ratio: 9 / 16 },
  { file: "广告视频5", ratio: 9 / 16 },
  { file: "广告视频6", ratio: 9 / 16 },
  { file: "324742732310437888", ratio: 16 / 9 },
];

// 跑马灯单个视频:默认静音播放;点喇叭出声,鼠标离开立即静音
function MarqueeVideo({
  idx,
  eager,
}: {
  idx: number;
  eager: boolean;
}) {
  const cfg = VIDEOS[idx];
  const ref = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [sound, setSound] = useState(false);

  // 离屏自动暂停:只有进入视口的视频才解码播放,大幅降低同时解码数、消除滚动卡顿
  useEffect(() => {
    const el = wrapRef.current;
    const vid = ref.current;
    if (!el || !vid) return;
    // React 的 `muted` JSX 属性不可靠(只设 attribute),必须用 ref 设 DOM property,
    // 否则视频可能带声音自动播放、弹出系统媒体控制条。
    vid.muted = true;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) vid.play().catch(() => {});
        else vid.pause();
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const v = ref.current;
    if (!v) return;
    const next = !sound;
    v.muted = !next;
    if (next) v.play().catch(() => {});
    setSound(next);
  };

  const muteOnLeave = () => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    setSound(false);
  };

  return (
    <div
      ref={wrapRef}
      onMouseLeave={muteOnLeave}
      style={{ aspectRatio: cfg.ratio }}
      className="relative h-[382px] shrink-0"
    >
      <video
        ref={ref}
        src={`${ASSET}/${cfg.file}.mp4`}
        poster={`${ASSET}/poster-${idx + 1}.jpg`}
        autoPlay
        muted
        loop
        playsInline
        disablePictureInPicture
        controls={false}
        preload={eager ? "metadata" : "none"}
        className="size-full rounded-2xl bg-white/5 object-cover shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
      />
      <button
        onClick={toggleSound}
        aria-label={sound ? "Mute video" : "Play sound"}
        className="absolute bottom-3 right-3 z-10 grid size-9 place-items-center rounded-full bg-white/10 text-white shadow-sm backdrop-blur-md transition hover:scale-105 hover:bg-white/20 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      >
        {sound ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
      </button>
    </div>
  );
}

function Cta({
  children,
  full = false,
}: {
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <button
      onClick={openTolt}
      className={`group inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#ff6a1f] px-8 py-4 text-[15px] font-semibold text-[#15110c] transition hover:bg-[#ff7d3a] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6a1f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0c10] ${
        full ? "w-full" : ""
      }`}
    >
      {children}
      <ArrowUpRight className="size-[18px] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </button>
  );
}

// 键盘焦点环(a11y):橙色环 + 深色 offset,贴合页面
const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6a1f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0c10]";

export default function AffiliateBoldPage() {
  return (
    <main
      className="bg-[#0d0c10] text-[#f4f1ec] selection:bg-[#ff6a1f] selection:text-[#15110c]"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <style>{`
        /* 标题揭示:仅 opacity + 上升(GPU 合成),不再用 clip-path——
           clip-path 走主线程,刷新时被视频加载抢线程会卡半截。 */
        @keyframes bold-reveal {
          from { opacity: 0; transform: translateY(0.5em); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .bold-reveal { animation: bold-reveal 0.9s cubic-bezier(0.16, 1, 0.3, 1) both; }
        /* 视频墙基于「加载」淡入(非滚动触发),刷新即出现,不会因卡在折线下方而不显示 */
        @keyframes bold-fade-up { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }
        .bold-fade-up { animation: bold-fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) both; }
        @media (prefers-reduced-motion: reduce) {
          .bold-reveal { animation: none; }
          .bold-fade-up { animation: none; }
        }
      `}</style>

      <Hero />
      <Stats />
      <HowItWorks />
      <Calculator />
      <Voices />
      <Faq />
      <FinalCta />
    </main>
  );
}

/* 横向滚动行:自动滚 + 触控板/触摸滑动 + 左右箭头 + 无缝循环。
   children 需为「两份等长」内容(A+A),自动/手动都在 scrollWidth/2 处环绕。
   hover 或拖动时暂停自动滚;尊重 prefers-reduced-motion(仅关自动滚,手动仍可用)。 */
function ScrollRow({
  children,
  speed = 0.4,
  ariaLabel,
}: {
  children: React.ReactNode;
  speed?: number;
  ariaLabel: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const paused = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let last = 0;
    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      // 实时读 scrollWidth:滚动时布局不脏,浏览器返回缓存值、无强制重排;
      // 避免挂载时缓存到中途宽度导致 half 失真、自动滚「滚不动」。
      const half = el.scrollWidth / 2;
      if (paused.current || reduce || half === 0) {
        last = t;
        return;
      }
      const dt = last ? Math.min(t - last, 48) : 16;
      last = t;
      el.scrollLeft += speed * (dt / 16);
      if (el.scrollLeft >= half) el.scrollLeft -= half;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [speed]);

  // 手动滚动到两端时无缝环绕
  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const half = el.scrollWidth / 2;
    if (half === 0) return;
    if (el.scrollLeft <= 0) el.scrollLeft += half;
    else if (el.scrollLeft >= half) el.scrollLeft -= half;
  };

  const nudge = (dir: number) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({
      left: dir * Math.min(el.clientWidth * 0.85, 700),
      behavior: "smooth",
    });
  };

  const pause = () => (paused.current = true);
  const resume = () => (paused.current = false);

  return (
    <div
      className="group/row relative"
      onMouseEnter={pause}
      onMouseLeave={resume}
    >
      <div
        ref={ref}
        onScroll={onScroll}
        onPointerDown={pause}
        onPointerUp={resume}
        onPointerCancel={resume}
        onTouchStart={pause}
        onTouchEnd={resume}
        className="overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>

      {([-1, 1] as const).map((dir) => (
        <button
          key={dir}
          onClick={() => nudge(dir)}
          aria-label={dir < 0 ? `${ariaLabel}: previous` : `${ariaLabel}: next`}
          className={`absolute top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/40 text-white opacity-0 backdrop-blur-md transition hover:bg-black/60 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 group-hover/row:opacity-100 sm:grid ${
            dir < 0 ? "left-4" : "right-4"
          }`}
        >
          {dir < 0 ? (
            <ChevronLeft className="size-5" />
          ) : (
            <ChevronRight className="size-5" />
          )}
        </button>
      ))}
    </div>
  );
}

/* ---------- Hero:左对齐巨型字 + 底部视频跑马灯 ---------- */
function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-white/8 2xl:flex 2xl:min-h-[100dvh] 2xl:flex-col">
      {/* 暖色光晕 */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-[10%] -top-[10%] size-[60vw] rounded-full opacity-50 blur-[120px]"
        style={{
          background: `radial-gradient(circle, ${ORANGE}55, transparent 70%)`,
        }}
      />
      {/* 内容自适应高度,不再强行满屏:各屏高比例一致,不留空洞 */}
      <div className="relative mx-auto w-full max-w-[1280px] px-6 pt-16 md:pt-24 2xl:flex 2xl:flex-1 2xl:flex-col 2xl:justify-center 2xl:pt-0">
        <p
          className="bold-reveal text-[13px] font-medium uppercase tracking-[0.3em] text-white/55"
          style={{ animationDelay: "0s" }}
        >
          BuzzVideo Affiliate Program
        </p>
        <h1
          className="mt-7 max-w-[14ch] text-[clamp(48px,9vw,128px)] font-extrabold leading-[0.92] tracking-[-0.03em]"
          style={head}
        >
          <span className="bold-reveal block" style={{ animationDelay: "0.08s" }}>
            Get paid to share
          </span>
          <span
            className="bold-reveal block"
            style={{ color: ORANGE, animationDelay: "0.2s" }}
          >
            BuzzVideo.
          </span>
        </h1>

        {/* 加载触发的 CSS 揭示(同标题机制),不用 IntersectionObserver,刷新必现 */}
        <div
          className="bold-reveal mt-9 flex flex-col gap-7 md:flex-row md:items-end md:justify-between"
          style={{ animationDelay: "0.3s" }}
        >
          <p className="max-w-[860px] text-[clamp(16px,1.8vw,20px)] leading-relaxed text-white/60">
            Earn up to 50% commission for each paying customer you bring in.
            <br />
            There&apos;s no limit to how much you can earn.
          </p>
          <Cta>Become a partner</Cta>
        </div>
      </div>

      {/* 视频跑马灯:跟在内容后;底部不留白。大屏(2xl)上 mt-auto 把它沉到首屏底部,hero 撑满整屏 */}
      <div className="relative overflow-hidden pb-0 pt-14 md:pt-20 2xl:pt-0">
        <div className="bold-fade-up" style={{ animationDelay: "0.3s" }}>
          {/* 整行统一高度,宽度按各视频比例(9:16 / 16:9 混排不裁切)。
              7 唯一 ×4 = 28 瓦片(A+A),单组 14 个无缝环绕。
              ScrollRow:自动滚 + 触控板/触摸滑动 + 左右箭头,hover/拖动暂停。 */}
          <ScrollRow ariaLabel="Creator videos" speed={0.5}>
            <div className="flex w-max items-stretch gap-4 px-4">
              {Array.from({ length: 28 }, (_, i) => (
                <MarqueeVideo key={i} idx={i % VIDEOS.length} eager={i < VIDEOS.length} />
              ))}
            </div>
          </ScrollRow>
        </div>
      </div>
    </section>
  );
}

/* ---------- Stats:编辑式数字行,靠 hairline 分隔 ---------- */
const STATS = [
  { v: "50%", l: "top commission rate" },
  { v: "$2M", suffix: "+", l: "paid out to partners" },
];

function Stats() {
  return (
    <section className="border-b border-white/8 px-6 py-16 md:py-20">
      <div className="mx-auto grid max-w-[1280px] gap-px md:grid-cols-2">
        {STATS.map((s, i) => (
          <Reveal
            key={s.v}
            delay={i * 110}
            className="border-t border-white/10 pt-7 md:border-l md:border-t-0 md:pl-9 md:first:border-l-0 md:first:pl-0"
          >
            <div
              className="text-[clamp(56px,8vw,104px)] font-extrabold leading-none tracking-[-0.03em] tabular-nums"
              style={{ ...head, color: ORANGE }}
            >
              {s.v}
              {"suffix" in s && s.suffix && (
                <span className="inline-block translate-y-[0.13em]">
                  {s.suffix}
                </span>
              )}
            </div>
            <div className="mt-4 max-w-[20ch] text-[15px] leading-snug text-white/50">
              {s.l}
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------- How it works:大号编号列表 ---------- */
const STEPS = [
  {
    no: "01",
    title: "Sign up free",
    desc: "Create your Tolt account to unlock your partner dashboard and a custom tracking link.",
  },
  {
    no: "02",
    title: "Share your link",
    desc: "Drop it in your videos, posts, newsletters or DMs. The more targeted the audience, the better the conversion.",
  },
  {
    no: "03",
    title: "Earn commission",
    desc: "Earn up to 50% commission, and it rises automatically as you refer more.",
  },
];

function HowItWorks() {
  return (
    <section className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1280px]">
        <Reveal>
          <h2
            className="max-w-[16ch] text-[clamp(32px,5vw,64px)] font-extrabold leading-[1.02] tracking-[-0.02em]"
            style={head}
          >
            From link to payout in three moves.
          </h2>
        </Reveal>
        <div className="mt-16">
          {STEPS.map((s, i) => (
            <Reveal key={s.no} delay={i * 80}>
              <div className="grid items-baseline gap-4 border-t border-white/10 py-9 md:grid-cols-[140px_1fr_minmax(0,46ch)] md:gap-10 md:py-12">
                <div
                  className="text-[clamp(40px,5vw,64px)] font-extrabold leading-none tabular-nums text-white/15"
                  style={head}
                >
                  {s.no}
                </div>
                <h3
                  className="text-[clamp(22px,2.6vw,34px)] font-bold tracking-[-0.01em]"
                  style={head}
                >
                  {s.title}
                </h3>
                <p className="text-[16px] leading-relaxed text-white/55">
                  {s.desc}
                </p>
              </div>
            </Reveal>
          ))}
          <div className="border-t border-white/10" />
        </div>
      </div>
    </section>
  );
}

/* ---------- Calculator:收益感优先的阶梯计算器 ----------
   把「收益数字」做成会随拖动滚动跳数的巨型主角 + 下一档解锁助推(游戏化上行)+
   recurring 框定,让用户「看着钱在涨」。阶梯佣金:1-24 → 30%、25-49 → 40%、50+ → 50%。 */

/* 数字滚动:值变化时用 rAF 缓动补间到目标(易出反馈),尊重 prefers-reduced-motion。
   这是一次性短补间(非持续输入追踪),带清理。 */
function useCountUp(value: number, duration = 600) {
  const [display, setDisplay] = useState(value);
  const displayRef = useRef(value);
  const rafRef = useRef(0);
  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) {
      displayRef.current = value;
      setDisplay(value);
      return;
    }
    const from = displayRef.current;
    const to = value;
    if (from === to) return;
    let start = 0;
    const tick = (t: number) => {
      if (!start) start = t;
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      const cur = Math.round(from + (to - from) * eased);
      displayRef.current = cur;
      setDisplay(cur);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);
  return display;
}
const PRICE: Record<string, { monthly: number; yearly: number }> = {
  starter: { monthly: 19, yearly: 168 },
  pro: { monthly: 49, yearly: 420 },
  ultra: { monthly: 89, yearly: 756 },
};
const TIERS = [
  { rate: 0.3, from: 1, label: "30%", range: "1-24" },
  { rate: 0.4, from: 25, label: "40%", range: "25-49" },
  { rate: 0.5, from: 50, label: "50%", range: "50+" },
] as const;
const tierIndex = (refs: number) => (refs >= 50 ? 2 : refs >= 25 ? 1 : 0);

function Calculator() {
  const [plan, setPlan] = useState<keyof typeof PRICE>("pro");
  const [cycle, setCycle] = useState<"monthly" | "yearly">("yearly");
  const [refs, setRefs] = useState(30);
  const ti = tierIndex(refs);
  const rate = TIERS[ti].rate;
  const total = Math.round(PRICE[plan][cycle] * rate * refs);

  const period = cycle === "yearly" ? "year" : "month";
  const displayTotal = useCountUp(total);

  return (
    <section className="px-6 pb-24 pt-20 md:pb-32 md:pt-28">
      <div className="mx-auto max-w-[1100px]">
        <Reveal>
          {/* 头部:竖排(标题 + 一行说明),不用左大右小的分裂式 */}
          <div className="mb-12 max-w-[640px]">
            <div className="text-[12px] font-medium uppercase tracking-[0.22em] text-white/45">
              Commission calculator
            </div>
            <h2
              className="mt-4 text-[clamp(44px,6vw,84px)] font-extrabold leading-[0.92] tracking-[-0.03em]"
              style={head}
            >
              Earn big.
            </h2>
            <p className="mt-5 text-[17px] leading-relaxed text-white/55">
              Earn{" "}
              <span className="font-semibold text-white">
                up to 50% commission
              </span>
              , uncapped. Set your plan and audience, then watch your payout add
              up.
            </p>
          </div>

          {/* 卡片:左输入(克制) | 右收益(橙色焦点面板),CTA 贴在数字下方 */}
          <div className="grid overflow-hidden rounded-[28px] border border-white/10 lg:grid-cols-[0.92fr_1.08fr]">
            {/* 左:输入面板 */}
            <div className="border-b border-white/10 bg-[#0c0b0e] p-8 md:p-10 lg:border-b-0 lg:border-r">
              <Label>Plan</Label>
              <div className="flex flex-wrap gap-2">
                {(["starter", "pro", "ultra"] as const).map((p) => (
                  <Pill key={p} active={plan === p} onClick={() => setPlan(p)}>
                    {p[0].toUpperCase() + p.slice(1)}
                  </Pill>
                ))}
              </div>

              <Label>Billing</Label>
              <div className="flex gap-2">
                {(["monthly", "yearly"] as const).map((c) => (
                  <Pill key={c} active={cycle === c} onClick={() => setCycle(c)}>
                    {c[0].toUpperCase() + c.slice(1)}
                  </Pill>
                ))}
              </div>

              <div className="mt-9 flex items-baseline justify-between">
                <Label inline>Referrals you bring</Label>
                <span
                  className="text-[28px] font-extrabold tabular-nums"
                  style={head}
                >
                  {refs}
                </span>
              </div>

              {/* 推荐数滑轨:不暴露阶梯,只一条干净轨道 + 橙旋钮 */}
              <div className="relative mt-8 h-8">
                <div
                  className="pointer-events-none absolute top-1/2 z-30 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#ff6a1f] shadow-[0_0_0_8px_rgba(255,106,31,0.16)]"
                  style={{ left: `${refs}%` }}
                  aria-hidden
                >
                  <span className="flex gap-[3px]">
                    <span className="h-3.5 w-px bg-[#15110c]/55" />
                    <span className="h-3.5 w-px bg-[#15110c]/55" />
                  </span>
                </div>

                <Slider
                  value={[refs]}
                  onValueChange={(v) => setRefs(v[0])}
                  min={0}
                  max={100}
                  step={1}
                  aria-label="Referrals you bring"
                  className="absolute inset-x-0 top-1/2 z-20 -translate-y-1/2 [&_[data-slot=slider-range]]:bg-[#ff6a1f] [&_[data-slot=slider-thumb]]:size-9 [&_[data-slot=slider-thumb]]:border-0 [&_[data-slot=slider-thumb]]:bg-transparent [&_[data-slot=slider-thumb]]:shadow-none [&_[data-slot=slider-track]]:h-[3px] [&_[data-slot=slider-track]]:bg-white/12"
                />
              </div>

              {/* 助推:只讲「推得越多挣得越多」,不暴露阶梯 */}
              <p className="mt-8 flex items-start gap-2.5 text-[14px] leading-relaxed text-white/55">
                <span className="mt-[6px] block size-2.5 shrink-0 rotate-45 rounded-[2px] bg-[#ff6a1f]" />
                <span>
                  The more you refer, the more you earn,{" "}
                  <span className="font-semibold text-white">up to 50%</span>.
                </span>
              </p>
            </div>

            {/* 右:收益焦点面板(暖色调 + 橙光,视觉重心) */}
            <div className="relative overflow-hidden bg-[#100c09] p-8 md:p-11">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 [background:radial-gradient(560px_320px_at_28%_18%,rgba(255,106,31,0.16),transparent_70%)]"
              />
              <div className="relative flex h-full flex-col">
                <div className="text-[13px] font-medium uppercase tracking-[0.22em] text-white/50">
                  You could earn
                </div>
                <div className="mt-2 flex flex-wrap items-end gap-x-4 gap-y-1">
                  <span
                    className="text-[clamp(52px,7vw,92px)] font-extrabold leading-[0.85] tracking-[-0.04em] tabular-nums"
                    style={{ ...head, color: ORANGE }}
                  >
                    ${displayTotal.toLocaleString("en-US")}
                  </span>
                  <span className="pb-2 text-[clamp(16px,2vw,22px)] font-semibold text-white/45">
                    a {period}
                  </span>
                </div>
                <div className="mt-5 flex items-start gap-2.5 text-[15px] leading-relaxed text-white/60">
                  <span className="mt-[7px] block size-3 shrink-0 rotate-45 rounded-[2px] bg-[#ff6a1f]" />
                  <span>
                    <span className="font-semibold text-white">
                      Up to 50% commission
                    </span>
                    , recurring every {period}.
                  </span>
                </div>

                <div className="mt-auto pt-10">
                  <Cta full>Become a partner</Cta>
                  <p className="mt-3 text-[12px] leading-relaxed text-white/40">
                    Free to join. Track every referral and get paid on schedule.
                    Numbers are illustrative.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Label({
  children,
  inline = false,
}: {
  children: React.ReactNode;
  inline?: boolean;
}) {
  return (
    <div
      className={`text-[12px] font-medium uppercase tracking-[0.18em] text-white/55 ${
        inline ? "" : "mb-3 mt-8 first:mt-7"
      }`}
    >
      {children}
    </div>
  );
}

function Pill({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-5 py-2.5 text-[14px] font-medium transition ${focusRing} ${
        active
          ? "border-[#ff6a1f] bg-[#ff6a1f] text-[#15110c]"
          : "border-white/15 text-white/60 hover:border-white/35 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

/* ---------- Voices:横向滚动证言 ---------- */
const VOICES = [
  {
    name: "Maya Robinson",
    role: "Social media marketer",
    img: "https://randomuser.me/api/portraits/women/68.jpg",
    quote:
      "BuzzVideo makes ad creative so much faster, so recommending it was a no-brainer. Now it pays me too.",
  },
  {
    name: "Daniel Carter",
    role: "Marketing consultant",
    img: "https://randomuser.me/api/portraits/men/32.jpg",
    quote:
      "When other marketers ask what I use, I just share my link. The commissions add up fast.",
  },
  {
    name: "Priya Sharma",
    role: "Newsletter writer",
    img: "https://randomuser.me/api/portraits/women/79.jpg",
    quote:
      "Every video in my newsletter is made with BuzzVideo, so featuring it felt completely natural.",
  },
  {
    name: "Marcus Thompson",
    role: "DTC brand owner",
    img: "https://randomuser.me/api/portraits/men/52.jpg",
    quote:
      "I make all my Shopify ads with BuzzVideo. I tell every store owner I know to try it.",
  },
  {
    name: "Lena Fischer",
    role: "Performance marketer",
    img: "https://randomuser.me/api/portraits/women/44.jpg",
    quote:
      "I test dozens of ad creatives a week and BuzzVideo spins them up fast. Recommending it was an easy call.",
  },
  {
    name: "Omar Haddad",
    role: "In-house marketer",
    img: "https://randomuser.me/api/portraits/men/75.jpg",
    quote:
      "I make all our brand's ad creative in BuzzVideo. It just works, so I've passed my link to half my network.",
  },
];

function Voices() {
  return (
    <section className="border-y border-white/8 py-24 md:py-28">
      <div className="mx-auto mb-12 max-w-[1280px] px-6">
        <Reveal>
          <h2
            className="text-[clamp(32px,5vw,64px)] font-extrabold tracking-[-0.02em]"
            style={head}
          >
            Real partners. Real revenue.
          </h2>
        </Reveal>
      </div>
      {/* 自动滚动 marquee(两份等宽,-50% 无缝循环);reduced-motion 退回手动横滑 */}
      <ScrollRow ariaLabel="Testimonials" speed={0.5}>
        <div className="flex w-max gap-5 px-6 pb-4">
          {[...VOICES, ...VOICES].map((v, i) => (
            <figure
              key={i}
              className="flex w-[86vw] shrink-0 flex-col rounded-[22px] border border-white/10 bg-white/[0.03] p-8 sm:w-[420px]"
            >
              <blockquote
                className="text-[clamp(19px,2.2vw,26px)] font-medium leading-snug tracking-[-0.01em]"
                style={head}
              >
                {v.quote}
              </blockquote>
              <figcaption className="mt-8 flex items-center gap-3 border-t border-white/10 pt-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={v.img}
                  alt={i < VOICES.length ? v.name : ""}
                  aria-hidden={i >= VOICES.length}
                  loading="lazy"
                  className="size-10 shrink-0 rounded-full object-cover ring-1 ring-white/15"
                />
                <span>
                  <span className="block text-[15px] font-semibold">
                    {v.name}
                  </span>
                  <span className="block text-[13px] text-white/55">
                    {v.role}
                  </span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </ScrollRow>
    </section>
  );
}

/* ---------- FAQ:深色 hairline 折叠 ---------- */
const FAQ = [
  {
    q: "How and when do I get paid?",
    a: "Commissions are paid monthly through Tolt via PayPal or bank transfer. Once a referral's first payment clears the 30-day refund window, your commission is approved and paid in the next cycle.",
  },
  {
    q: "Is there a minimum payout?",
    a: "Yes. You can withdraw once your balance reaches $100. Anything below that rolls over to the next cycle.",
  },
  {
    q: "What's the commission?",
    a: "You earn up to 50% commission, and your rate rises automatically as you refer more paying customers. There's no cap on how much you can earn.",
  },
  {
    q: "How long does the referral cookie last?",
    a: "30 days, so you still get credit if your friend signs up within a month of clicking your link.",
  },
  {
    q: "Who can join?",
    a: "Anyone: creators, marketers, agencies and everyday Buzz fans. Signing up is free and takes minutes.",
  },
  {
    q: "Can I run paid ads?",
    a: "You can promote your link across most channels, but bidding on Buzz brand terms in paid search isn't allowed. When in doubt, reach out before running campaigns.",
  },
  {
    q: "Can I refer myself?",
    a: "No. Self-referrals don't qualify for commission. Referrals must be genuine new users.",
  },
  {
    q: "Where do I track earnings?",
    a: "Everything lives in your Tolt dashboard. Track your clicks, conversions and payouts in one place.",
  },
  {
    q: "What terms apply to the program?",
    a: "Full affiliate terms are available on the program page. If you're unsure about any part of the program, contact our team at info@presslogic.com.",
  },
];

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="px-6 py-24 md:py-32">
      <div className="mx-auto grid max-w-[1280px] gap-12 md:grid-cols-[0.8fr_1.2fr]">
        <Reveal>
          <h2
            className="text-[clamp(32px,4vw,56px)] font-extrabold tracking-[-0.02em]"
            style={head}
          >
            Questions, answered.
          </h2>
        </Reveal>
        <Reveal delay={80}>
          <div>
            {FAQ.map((f, i) => {
              const isOpen = open === i;
              return (
                <div key={i} className="border-t border-white/10 last:border-b">
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className={`flex w-full items-center justify-between gap-6 rounded-lg py-6 text-left ${focusRing}`}
                  >
                    <span
                      className="text-[clamp(17px,1.8vw,21px)] font-semibold"
                      style={head}
                    >
                      {f.q}
                    </span>
                    <span
                      className="grid size-7 shrink-0 place-items-center rounded-full border border-white/20 transition"
                      style={{
                        transform: isOpen ? "rotate(45deg)" : "none",
                        borderColor: isOpen ? ORANGE : undefined,
                        color: isOpen ? ORANGE : undefined,
                      }}
                    >
                      <Plus className="size-4" />
                    </span>
                  </button>
                  <div
                    className="grid transition-all duration-300 ease-out"
                    style={{
                      gridTemplateRows: isOpen ? "1fr" : "0fr",
                      opacity: isOpen ? 1 : 0,
                    }}
                  >
                    <div className="overflow-hidden">
                      <p className="max-w-[60ch] pb-6 text-[15px] leading-relaxed text-white/55">
                        {f.a}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- Final CTA:满幅橙色收尾 ---------- */
function FinalCta() {
  return (
    <section className="px-6 pb-6">
      <Reveal>
        <div
          className="relative mx-auto max-w-[1280px] overflow-hidden rounded-[32px] px-8 py-24 text-center md:py-32"
          style={{
            background: `linear-gradient(135deg, ${ORANGE}, #ff8a3d)`,
          }}
        >
          <h2
            className="mx-auto max-w-[18ch] text-[clamp(36px,6vw,80px)] font-extrabold leading-[0.98] tracking-[-0.03em] text-[#15110c]"
            style={head}
          >
            Start earning this month.
          </h2>
          <p className="mx-auto mb-10 mt-6 max-w-[40ch] text-[clamp(16px,2vw,19px)] text-[#15110c]/70">
            Free to join, takes minutes, and there&apos;s no limit on what you
            can make.
          </p>
          <button
            onClick={openTolt}
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#15110c] px-9 py-4 text-[15px] font-semibold text-[#f4f1ec] transition hover:bg-black active:scale-[0.98]"
          >
            Become a partner
            <ArrowUpRight className="size-[18px] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </div>
      </Reveal>
    </section>
  );
}
