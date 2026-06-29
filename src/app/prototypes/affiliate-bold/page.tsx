"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Plus,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  MoveHorizontal,
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
// 跑马灯视频:外链 URL,竖屏 9:16。整行统一高度,宽度按比例走。
const CDN = "https://asset.buzzvideo.ai/buzzvideo/video";
const VIDEOS: { src: string; ratio: number }[] = [
  { src: `${CDN}/2026/06/26/c889902a-2b0f-445e-9131-e9ecd454693e_39984ab3.mp4`, ratio: 9 / 16 },
  { src: `${CDN}/2026/05/29/2d4a2eff-b274-4ee0-a765-817e7c69e8b1_471ed688.mp4`, ratio: 9 / 16 },
  { src: `${CDN}/2026/05/29/d4328730-24af-46ee-bc89-e26bbe325a32_a2a4cd65.mp4`, ratio: 9 / 16 },
  { src: `${CDN}/2026/05/29/c6279d82-5ec4-4dc0-89d9-76956d194de4_2f7f618f.mp4`, ratio: 9 / 16 },
  { src: `${CDN}/2026/05/29/ac645d80-7f01-42d0-9088-b671bc8c9036_05b81499.mp4`, ratio: 9 / 16 },
  { src: `${CDN}/2026/05/29/c945fe67-451e-45c5-b366-f87163cb4dc4_475816e0.mp4`, ratio: 9 / 16 },
  { src: `${CDN}/2026/05/29/46ed3ab0-b8d9-44f6-af63-573e7ddd2c09_f2b9e478.mp4`, ratio: 9 / 16 },
  { src: `${CDN}/2026/05/29/c7f3d1ba-206f-4dc4-bddd-283f3487471f_3f5ed6a1.mp4`, ratio: 9 / 16 },
  { src: `${CDN}/2026/05/29/9bfad240-2a88-4c13-bbd1-40270292c083_aab1787b.mp4`, ratio: 9 / 16 },
  { src: `${CDN}/2026/05/29/63856cf7-367d-403a-8dea-e2df80488850_61460b08.mp4`, ratio: 9 / 16 },
  { src: `${CDN}/2026/05/29/2d0829c4-69f9-4321-95ef-20cb998ccc01_a1905c91.mp4`, ratio: 9 / 16 },
  { src: `${CDN}/2026/05/29/c74a1c85-be68-429f-9d19-b8e132ce379a_d0ec8bc8.mp4`, ratio: 9 / 16 },
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
  // 真实宽高比:加载元数据后按 videoWidth/Height 自适应(9:16 / 16:9 混排都正确)
  const [ratio, setRatio] = useState(cfg.ratio);

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
      style={{ aspectRatio: ratio }}
      className="relative h-[382px] shrink-0"
    >
      <video
        ref={ref}
        src={cfg.src}
        onLoadedMetadata={(e) => {
          const v = e.currentTarget;
          if (v.videoWidth && v.videoHeight)
            setRatio(v.videoWidth / v.videoHeight);
        }}
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
          {/* 整行统一高度,竖屏 9:16。12 唯一 ×2 = 24 瓦片(A+A 两份等长),无缝环绕。
              ScrollRow:自动滚 + 触控板/触摸滑动 + 左右箭头,hover/拖动暂停。 */}
          <ScrollRow ariaLabel="Creator videos" speed={0.5}>
            <div className="flex w-max items-stretch gap-4 px-4">
              {Array.from({ length: VIDEOS.length * 2 }, (_, i) => (
                <MarqueeVideo key={i} idx={i % VIDEOS.length} eager={i < VIDEOS.length} />
              ))}
            </div>
          </ScrollRow>
        </div>
      </div>
    </section>
  );
}

/* ---------- Stats:两项居中数字带,等宽双栏,静态(无入场跳数) ---------- */
const STATS = [
  { text: "50%", l: "top commission rate" },
  { text: "$2M+", l: "paid out to partners" },
];

function Stats() {
  const numCls =
    "block leading-none tracking-[-0.035em] text-[clamp(60px,9vw,132px)] font-extrabold tabular-nums";

  return (
    <section className="border-b border-white/8 px-6 py-20 md:py-28">
      <div className="mx-auto max-w-[1280px]">
        <div className="grid gap-y-12 md:grid-cols-2 md:gap-y-0">
          {STATS.map((s, i) => (
            <Reveal
              key={i}
              delay={i * 120}
              className={`flex flex-col items-center text-center border-t border-white/10 pt-7 md:border-t-0 md:pt-0 ${
                i > 0 ? "md:border-l md:border-white/10" : ""
              }`}
            >
              {/* 固定数字行高度 → 两个数字底边落在同一基线 */}
              <div className="flex min-h-[clamp(60px,9vw,132px)] items-end">
                <span className={numCls} style={{ ...head, color: ORANGE }}>
                  {s.text}
                </span>
              </div>
              <div className="mt-5 text-[15px] leading-snug text-white/50">
                {s.l}
              </div>
            </Reveal>
          ))}
        </div>
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

/* 阶梯佣金时间轴:沿一条横轨拖动旋钮,经过各档位标记(Gold → Sapphire → Diamond),
   收益/招募数浮在旋钮上下,右侧当前档徽章随档位变色。配色为创意阶梯:
   暖金 → 冷青 → 品牌橙(顶档点亮品牌色)。经济模型固定 $15/mo × 12 个月。 */
const PER_SIGNUP_YEAR = 15 * 12; // $15/mo,前 12 个月 = $180/签约
const MAX_SIGNUPS = 300;
type CTier = { name: string; share: number; label: string; from: number; color: string };
const CTIERS: CTier[] = [
  { name: "Gold", share: 0.3, label: "30%", from: 0, color: "#ffc53d" },
  { name: "Sapphire", share: 0.4, label: "40%", from: 50, color: "#38bdf8" },
  { name: "Diamond", share: 0.5, label: "50%", from: 150, color: ORANGE },
];
const tierFor = (s: number) =>
  CTIERS.reduce((acc, t) => (s >= t.from ? t : acc), CTIERS[0]);

/* 卡片配色方案(对比用)。统一暖黑底,差异只在「色彩如何出现」: */
export type CardVariant =
  | "restrained" // A 克制:暖黑 + 顶边高光,无彩
  | "tier-wash" // B 推荐:暖黑 + 右下角随档位变色晕染
  | "gradient-border" // C 渐变描边:顶部鳞光吃品牌橙
  | "tinted-number"; // D 巨数染色:收益/招募数 = 当前档色
const WARM_BG = "linear-gradient(157deg,#100d0a 0%,#0b0908 52%,#080706 100%)";
const CARD_VARIANTS: Record<
  CardVariant,
  { wash: boolean; topAccent: boolean; tintNumber: boolean }
> = {
  restrained: { wash: false, topAccent: false, tintNumber: false },
  "tier-wash": { wash: true, topAccent: false, tintNumber: false },
  "gradient-border": { wash: false, topAccent: true, tintNumber: false },
  "tinted-number": { wash: false, topAccent: false, tintNumber: true },
};

export function Calculator({
  variant = "tier-wash",
  autoSlide = true,
  initial = 0,
}: {
  variant?: CardVariant;
  autoSlide?: boolean;
  initial?: number;
} = {}) {
  const [signups, setSignups] = useState(autoSlide ? 0 : initial);
  const tier = tierFor(signups);
  const earnings = Math.round(signups * PER_SIGNUP_YEAR * tier.share);
  const pct = (signups / MAX_SIGNUPS) * 100;
  const cfg = CARD_VARIANTS[variant];
  const numColor = cfg.tintNumber ? tier.color : undefined;
  // 浮标跟着旋钮(同一条竖线);右端仅收 2rem,刚好避开右侧徽章,偏移肉眼几乎无感
  const floatLeft = `min(${pct}%, calc(100% - 2rem))`;
  const trackRef = useRef<HTMLDivElement>(null);

  // 滚动进入视口时:旋钮从 0 自动缓动滑到最大(easeOutCubic),一次性;
  // 尊重 prefers-reduced-motion(直接落到最大);带 rAF 清理。
  useEffect(() => {
    if (!autoSlide) return;
    const el = trackRef.current;
    if (!el) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) {
      setSignups(MAX_SIGNUPS);
      return;
    }
    let raf = 0;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          io.disconnect();
          let start = 0;
          const duration = 1600;
          const tick = (t: number) => {
            if (!start) start = t;
            const p = Math.min((t - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setSignups(Math.round(MAX_SIGNUPS * eased));
            if (p < 1) raf = requestAnimationFrame(tick);
          };
          raf = requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [autoSlide]);

  return (
    <section className="px-3 pb-24 pt-20 md:px-6 md:pb-32 md:pt-28">
      <div className="mx-auto max-w-[1640px]">
        <Reveal>
          <div
            className="relative overflow-hidden rounded-[44px] border border-white/10 p-8 pb-32 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] md:p-16 md:pb-40 lg:p-24 lg:pb-48"
            style={{ background: WARM_BG }}
          >
            {/* 方案 B:当前档位色从右下角斜铺极淡晕染(随档位 gold→cyan→orange,状态驱动) */}
            {cfg.wash && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 transition-[background] duration-500"
                style={{
                  background: `radial-gradient(880px 520px at 100% 100%, ${tier.color}12, transparent 58%)`,
                }}
              />
            )}
            {/* 方案 C:顶部渐变描边,中段吃一点品牌橙 */}
            {cfg.topAccent && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,106,31,0.6) 40%, rgba(255,106,31,0.6) 60%, transparent)",
                }}
              />
            )}
            {/* 头部:左标题 / 右说明(贴合参考的双栏 header) */}
            <div className="relative grid gap-6 lg:grid-cols-[1fr_minmax(360px,540px)] lg:items-start lg:gap-16">
              <div>
                <div className="text-[clamp(13px,1vw,15px)] font-medium uppercase tracking-[0.24em] text-white/45">
                  Calculate your future commission
                </div>
                <h2
                  className="mt-4 text-[clamp(54px,7.5vw,132px)] font-extrabold leading-[0.88] tracking-[-0.035em]"
                  style={{ ...head, WebkitTextStroke: "1px currentColor" }}
                >
                  Earn big.
                </h2>
              </div>
              <p className="text-[clamp(15px,1.15vw,18px)] leading-relaxed text-white/65 lg:ml-auto lg:max-w-[480px] lg:pt-6">
                Turn your influence into income with our{" "}
                <span className="font-semibold text-white">
                  industry-leading 50/50 split
                </span>
                . With our{" "}
                <span className="font-semibold text-white">
                  uncapped commission model
                </span>
                , there&rsquo;s no ceiling on how much you can earn!
              </p>
            </div>

            {/* 时间轴 + 右侧当前档徽章 */}
            <div
              ref={trackRef}
              className="relative mt-20 grid gap-y-20 lg:mt-48 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-x-7"
            >
              {/* 轨道区:桌面浮标时间轴;移动端拆成竖排避免重叠 */}
              <div className="relative">
                {/* 移动端:收益数(在流内,不浮动) */}
                <div className="mb-9 md:hidden">
                  <div
                    className="text-[clamp(34px,11vw,52px)] font-extrabold leading-none tabular-nums"
                    style={{ ...head, color: numColor }}
                  >
                    ${earnings.toLocaleString("en-US")}
                  </div>
                  <div className="mt-1.5 text-[14px] uppercase tracking-[0.22em] text-white">
                    Earnings
                  </div>
                </div>

                {/* 横轨(浮标 / 档位标记 / 旋钮 / 透明 Radix 滑块) */}
                <div className="relative h-14 pt-1">
                {/* 收益浮标(轨道上方,仅桌面) */}
                <div
                  className="pointer-events-none absolute bottom-full left-0 mb-8 hidden -translate-x-1/2 text-center md:block"
                  style={{ left: floatLeft }}
                >
                  <div
                    className="text-[clamp(36px,4vw,72px)] font-extrabold leading-none tabular-nums"
                    style={{ ...head, color: numColor }}
                  >
                    ${earnings.toLocaleString("en-US")}
                  </div>
                  <div className="mt-1.5 whitespace-nowrap text-[14px] uppercase tracking-[0.22em] text-white">
                    Earnings
                  </div>
                </div>

                {/* 基线 */}
                <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 bg-white/15" />
                {/* 已达成区(当前档色) */}
                <div
                  className="absolute left-0 top-1/2 h-[7px] -translate-y-1/2 rounded-full transition-[background] duration-300"
                  style={{ width: `${pct}%`, background: tier.color }}
                />

                {/* 档位标记 */}
                {CTIERS.map((t, i) => {
                  const ml = (t.from / MAX_SIGNUPS) * 100;
                  return (
                    <div
                      key={t.name}
                      className="pointer-events-none absolute top-1/2 z-10"
                      style={{ left: `${ml}%` }}
                    >
                      <span className="absolute left-0 -top-[42px] hidden -translate-x-1/2 whitespace-nowrap text-[14px] tracking-wide text-white md:block">
                        Tier {i + 1}
                      </span>
                      {/* 竖杠:一条,跨过 slider 线(容器 z-10,层级在轨道之上) */}
                      <span className="absolute left-0 -top-[24px] hidden h-[42px] w-px -translate-x-1/2 bg-white/70 md:block" />
                      <span
                        className="absolute top-[28px] hidden items-center gap-2.5 whitespace-nowrap md:flex"
                        style={{ left: "-8px" }}
                      >
                        <span
                          className="block size-4 shrink-0 rotate-45 rounded-[2px]"
                          style={{ background: t.color }}
                        />
                        <span className="text-[14px] text-white/65">
                          {t.name}
                        </span>
                      </span>
                    </div>
                  );
                })}

                {/* 旋钮(视觉,随档位变色) */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 z-20 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full transition-[background] duration-150 md:size-14"
                  style={{
                    left: `${pct}%`,
                    background: tier.color,
                  }}
                >
                  <MoveHorizontal
                    className="size-5 text-[#0a0a0a]"
                    strokeWidth={2.25}
                  />
                </div>

                {/* 透明 Radix 滑块:承担拖拽 + 键盘交互,视觉全部隐藏 */}
                <Slider
                  value={[signups]}
                  onValueChange={(v) => setSignups(v[0])}
                  min={0}
                  max={MAX_SIGNUPS}
                  step={1}
                  aria-label="Sign-ups you bring"
                  className="absolute inset-x-0 top-1/2 z-30 -translate-y-1/2 [&_[data-slot=slider-range]]:bg-transparent [&_[data-slot=slider-thumb]]:size-12 [&_[data-slot=slider-thumb]]:border-0 [&_[data-slot=slider-thumb]]:bg-transparent [&_[data-slot=slider-thumb]]:opacity-0 [&_[data-slot=slider-thumb]]:shadow-none [&_[data-slot=slider-thumb]]:md:size-14 [&_[data-slot=slider-track]]:bg-transparent"
                />

                {/* 招募数浮标(轨道下方,仅桌面) */}
                <div
                  className="pointer-events-none absolute top-full left-0 mt-8 hidden -translate-x-1/2 text-center md:block"
                  style={{ left: floatLeft }}
                >
                  <div
                    className="text-[clamp(36px,4vw,72px)] font-extrabold leading-none tabular-nums"
                    style={{ ...head, color: numColor }}
                  >
                    {signups}
                  </div>
                  <div className="mt-1.5 whitespace-nowrap text-[14px] uppercase tracking-[0.22em] text-white">
                    Sign-ups
                  </div>
                </div>
                </div>

                {/* 移动端:招募数 + 档位图例 */}
                <div className="mt-9 md:hidden">
                  <div
                    className="text-[clamp(34px,11vw,52px)] font-extrabold leading-none tabular-nums"
                    style={{ ...head, color: numColor }}
                  >
                    {signups}
                  </div>
                  <div className="mt-1.5 text-[14px] uppercase tracking-[0.22em] text-white">
                    Sign-ups
                  </div>
                  <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
                    {CTIERS.map((t) => (
                      <span
                        key={t.name}
                        className="flex items-center gap-2 text-[13px] text-white/65"
                      >
                        <span
                          className="block size-3 shrink-0 rotate-45 rounded-[2px]"
                          style={{ background: t.color }}
                        />
                        {t.name} {t.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* 右:当前档徽章(随档位变色) */}
              {/* items-center:菱形与两行标题居中;注释绝对定位挂在下方,
                  不参与高度计算 → 整个 badge 的垂直中心(即菱形)对齐到轨道中线 */}
              <div className="flex items-center gap-3 lg:pl-1">
                <span
                  className="block size-4 shrink-0 rotate-45 rounded-[2px] transition-[background] duration-300"
                  style={{ background: tier.color }}
                />
                <div className="relative">
                  <div
                    className="text-[clamp(22px,2vw,32px)] font-bold leading-[1.12]"
                    style={head}
                  >
                    {tier.label} share
                  </div>
                  <div
                    className="text-[clamp(22px,2vw,32px)] font-bold leading-[1.12]"
                    style={head}
                  >
                    {tier.name} tier
                  </div>
                  <p className="absolute left-0 top-full mt-4 max-w-[260px] text-[13px] leading-relaxed text-white/40">
                    Revenue share for first 12 months based on $15/mo
                    subscription
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
