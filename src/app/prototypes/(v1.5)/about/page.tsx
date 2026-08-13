"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CircleDollarSign,
  FileText,
  Globe,
  Lightbulb,
  Link2,
  Palette,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  UsersRound,
  Wand,
  Zap,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/* ────────────────────────────────────────────────────────────────
   About · 深色硬派编辑风
   排版骨架参考 higgsfield.ai/about(全大写紧排巨标题 / 近黑底 / 强调色用得极省),
   颜色只保留 BuzzVideo 的橙作唯一强调。刻意避开 design.md 的居中卡片体系,
   也刻意不用 kicker 眉标、渐变字、统计磁贴、等大图标卡网格这些 AI 套路。
   字体 Archivo(工业 grotesk),900 全大写做标题、400 做正文,靠字重落差拉层级。
   ──────────────────────────────────────────────────────────────── */

const BASE = "#0d0d0f";
const BAND = "#ffffff"; // 中段浅色带(纯白),制造节奏;卡片用 black/4% 浮在其上

/* 全页统一苹果系统字体(与仓库其它原型一致) */
const APPLE_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif';
const display = { fontFamily: APPLE_FONT } as const;

/* 通栏容器。1360 是被 What we believe 卡片反推出来的:最长的标题单行需要 352px,
   加卡片内边距 48 → 卡片至少 400px;三列 + 两道 20px 间距 + 容器 80px 内边距 = 1360。
   整页统一拉宽,而不是只拉那一段,否则各段左右边界会对不齐。 */
const wrap = "mx-auto w-full max-w-[1360px] px-6 md:px-10";

/* 全大写巨标题 */
const h2 =
  "font-black uppercase leading-[0.92] tracking-[-0.03em] text-balance";

/* 标题分两档,让 section 之间有主次,而不是一路同一个字号:
   chapter = 主章节 / aside = 支撑性段落 */
const SIZE = {
  chapter: "clamp(30px,4.4vw,54px)",
  aside: "clamp(26px,3.2vw,38px)",
} as const;

const CDN = "https://assets.presslogic.com/buzzvideo/public/2026-06-15";

/* Hero 视频(Monica 指定)。1280×720 · 15s。
   选片标准:全程不能有烧录字幕/产品字标,否则会和 H1 叠字;暗场为佳,压得住白色巨标题。 */
const HERO_VIDEO =
  "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-08-12/345830261637832704.mp4";

/* 首屏文案(定稿):H1 里带 AI studio / marketing 两个品类词,
   搜索引擎一句话能读懂这页卖什么。 */
const HERO_COPY = {
  lines: ["BuzzVideo AI:", "The all-in-one AI studio"],
  accent: "for marketing",
  sub: "BuzzVideo brings together cinematic intelligence and a unified creative workflow — giving creators and marketing agencies the power to produce cinematic-quality ad video and visuals at any scale.",
};

/* 合作模型。logo 文件放 public/prototypes/about/logos/<file>,
   给了 file 就渲染图片,没给就先用字标兜底,方便一个个替换。 */
type Partner = { name: string; file?: string };

const PARTNERS: Partner[] = [
  { name: "ByteDance", file: "bytedance.svg" },
  { name: "Google", file: "google.svg" },
  { name: "Nano Banana", file: "nanobanana.svg" },
  { name: "Kling", file: "kling.svg" },
  { name: "Gemini", file: "gemini.svg" },
  // ChatGPT 与 OpenAI 共用同一个 blossom 标识
  { name: "ChatGPT", file: "openai.svg" },
  { name: "OpenAI", file: "openai.svg" },
];

/* 交错分到两行,让有 logo 的和纯文字的均匀分布,不至于一行全是图、一行全是字 */
const ROW_TOP = PARTNERS.filter((_, i) => i % 2 === 0);
const ROW_BOTTOM = PARTNERS.filter((_, i) => i % 2 === 1);

/* 跑马灯复制份数的下限。一行只有三四家,一份撑不满宽屏、滚动会露空档;
   实际份数在 MarqueeRow 里按视口宽度动态算,这里只保证最少铺 4 份。 */
const MARQUEE_MIN_COPIES = 4;

const MANIFESTO = [
  {
    icon: Wand,
    claim: "Great video should not need a crew.",
    body: "A prompt, a product photo, and an idea are enough. We removed the parts of production that never made the work better — only slower and more expensive.",
  },
  {
    icon: UsersRound,
    claim: "Built from the marketer's point of view.",
    body: "Every agent, template, and model default is designed around how a campaign actually gets made. The goal is not a good-looking demo — it is ads that actually work.",
  },
  {
    icon: CircleDollarSign,
    claim: "Creators should earn from what they make.",
    body: "Our partner program pays real revenue share. When BuzzVideo grows because of the people creating on it, they get paid for it.",
  },
  {
    icon: Globe,
    claim: "Every market deserves native quality.",
    body: "Wherever your audience is, language, format, and platform conventions are handled natively — not translated in at the end.",
  },
  {
    icon: ShieldCheck,
    claim: "Trust is a product feature.",
    // support 口径对齐定价页:Technical Support 是 Pro 及以上的权益,不能写成人人都有
    body: "Credit cost is shown before you generate, not after. Usage is visible, and what you make stays yours. When something goes wrong you reach a real person — technical support is included from Pro up.",
  },
  {
    icon: TrendingUp,
    claim: "Something new every week.",
    body: "The newest models, workflow templates, and features land weekly. You never wait a release cycle to use what just came out.",
  },
];

const AUDIENCES = [
  {
    title: "Marketing & production teams",
    lede: "The idea stops being limited by the budget. Shoot anywhere, change anything, and put more versions in market than a production schedule ever allowed.",
    media: "https://assets.presslogic.com/buzzvideo/public/2026-07-22/338169643640348672.mp4",
    points: [
      { icon: Lightbulb, text: "Pitch the idea you actually want — no location, cast, or crew to book" },
      { icon: CircleDollarSign, text: "A campaign's worth of assets for a fraction of one shoot" },
      { icon: RefreshCw, text: "Change the scene, product, or hook without reshooting anything" },
      { icon: Palette, text: "Every asset stays on brand, whoever on the team made it" },
    ],
  },
  {
    title: "Creators & ecommerce sellers",
    lede: "You have a product and a store page. You do not have an editor, a studio, or three weeks.",
    media: "https://assets.presslogic.com/buzzvideo/public/2026-08-04/342955960098152448.mp4",
    points: [
      { icon: Link2, text: "Paste a product link and get a finished ad back" },
      { icon: FileText, text: "Marketing Agent writes the brief, script, and shot list" },
      { icon: Smartphone, text: "Formats tuned for TikTok, Reels, and Shorts" },
      { icon: Zap, text: "Publishable output on the first generation" },
    ],
  },
];

/* 这一栏是「我们的产出长什么样」——每格都必须是 BuzzVideo 真能交付的投放物料
   (视频或图片),不放流程/能力这种展示不出来的东西(原来的 AI filmmaking、
   Trend research、storyboards 就是因此拿掉的)。
   按参考图,说明文字是「粗体标题. + 灰色描述」同段排布,所以文案写长一点(2–3 句)。
   media 暂缺的条目先渲染占位格,等 Monica 给到 CDN 链接再逐条补。 */
type UseCase = { title: string; desc: string; media?: string };

const USE_CASES: UseCase[] = [
  {
    title: "Product video ads",
    desc: "Upload a product photo and get a finished video ad. Lighting, motion, and packaging stay true to the real thing.",
  },
  {
    title: "Social media content",
    desc: "Optimized for TikTok, Reels, and Shorts. Cinematic quality meets UGC-native pacing, with the hook landing in the first second.",
    media:
      "https://assets.presslogic.com/buzzvideo/public/2026-07-31/341524596786257920.mp4",
  },
  {
    title: "Product demo videos",
    desc: "Show the product in use — what it does, how it works, and why it is worth the click. The format that carries the most weight on a listing page.",
  },
  {
    title: "Seasonal and promo campaigns",
    desc: "Black Friday, holiday, launch week. Turn one offer into a full set of dated creatives instead of waiting a production cycle for a single spot.",
  },
  {
    title: "Product photography",
    desc: "Studio-grade product stills without the studio. Change the surface, the light, or the setting without shooting the product again.",
  },
  {
    title: "Ad creatives and banners",
    desc: "Static creatives sized for every placement — feed, story, display, and marketplace hero images — built from the same product assets.",
  },
  {
    title: "Localization",
    desc: "Adapt one winning creative into every market and language you sell in, without rebuilding the campaign from scratch.",
  },
  {
    title: "Ad variants at scale",
    desc: "Ship ten hooks in an afternoon instead of one a week, then keep the version that actually converts.",
  },
];

/* 数据条:全部是 affiliate 旗舰页里的真实条款,不是编的成绩数字 */
const AFFILIATE_TERMS = [
  { value: "50%", label: "Commission on every sale" },
  { value: "1,500", label: "Free credits for both of you" },
  { value: "30 days", label: "Referral cookie" },
  { value: "Monthly", label: "Payouts through Tolt" },
];

const AFFILIATE_STEPS = [
  {
    title: "Apply",
    body: "Sign up with your channel, newsletter, or agency. Review is manual but fast — most partners are live within two days.",
  },
  {
    title: "Share your link",
    body: "You get a tracked link, ready-made creative, and a dashboard showing clicks, trials, and conversions in real time.",
  },
  {
    title: "Get paid monthly",
    // 口径对齐 affiliate 旗舰页:50% 全额佣金、30 天 cookie、双方各得 1,500 credits、Tolt 月结
    body: "50% commission on every paying customer you bring in, plus 1,500 free credits for both of you. A 30-day referral cookie, no cap on earnings, paid monthly through Tolt.",
  },
];

const FAQ = [
  {
    q: "What is BuzzVideo?",
    a: "An all-in-one AI creative studio for marketing video. Describe a campaign, upload a product image or reference, and get scripts, images, and finished videos in one workspace — without a timeline editor or a production crew.",
  },
  {
    q: "Which models does BuzzVideo run on?",
    a: "Leading video and image models including Seedance and Seedream, plus text models behind the Marketing Agent. You pick the model per generation, or let Auto choose the best fit for the job.",
  },
  {
    q: "Who is it built for?",
    a: "Brand and ecommerce marketers, agencies, and solo creators. First-time users can stay inside the Marketing Agent and templates; production teams use Canvas, brand kits, and team workspaces for volume work.",
  },
  {
    q: "How is this different from a single model tool?",
    a: "Most tools give you one model and one prompt box. BuzzVideo gives you the whole workflow — brief, script, storyboard, generation, asset library, team review — with brand consistency carried across every step.",
  },
  {
    q: "Do I own what I create?",
    // 口径对齐定价页 FAQ:100% 商用权,含 Free;且不拿内容/prompt 训练模型
    a: "Yes — you own 100% of the commercial rights, on every plan including Free. Your prompts, uploads, and outputs stay private to your account, and we do not use them to train our models.",
  },
  {
    q: "Who builds BuzzVideo?",
    a: "PressLogic, a media and technology company operating audience brands across Asia. BuzzVideo started as an internal tool for our own campaigns before opening to everyone.",
  },
];

/* ---------- pieces ---------- */

/* 首帧占位图:ffmpeg 从各视频 0.1s 处抽的帧,放在 public/prototypes/about/posters/。
   慢网下首屏直接出画面,而不是一块素色。 */
const posterFor = (src: string) =>
  `/prototypes/about/posters/${src.split("/").pop()!.replace(".mp4", ".jpg")}`;

function Clip({ src, className }: { src: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  // 离屏暂停:10 支视频同时解码会拖垮移动端和慢网,只让进入视口的播放
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) el.play().catch(() => {});
        else el.pause();
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      src={src}
      poster={posterFor(src)}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden
      /* CDN 挂掉时不至于是一块纯黑:底色兜一层中性灰。
         rounded-[inherit]:video 是独立合成层,父层 overflow-hidden 的圆角裁不干净
         (四角会漏出深色直角、边缘还带锯齿),所以圆角必须画在 video 自己身上。 */
      className={`rounded-[inherit] bg-[#1c1c1f] ${className ?? ""}`}
    />
  );
}

/* 合作方 logo:拿到的都是纯图标(无字标),所以统一「图标 + 名称」成对呈现,
   没图的先只显示名称。图标保留原彩色。 */
function PartnerLogo({ partner }: { partner: Partner }) {
  return (
    <span className="flex items-center gap-2.5 whitespace-nowrap">
      {partner.file && (
        // eslint-disable-next-line @next/next/no-img-element -- 外部 logo 尺寸不一,交给 CSS 统一高度
        <img
          src={`/prototypes/about/logos/${partner.file}`}
          alt=""
          aria-hidden
          className="size-8 shrink-0"
        />
      )}
      <span
        style={display}
        className="text-[22px] font-bold tracking-[-0.02em] text-white/80"
      >
        {partner.name}
      </span>
    </span>
  );
}


/* 单行跑马灯。reverse 时用反向 keyframes,做出两行对流的效果。
   时长按该行实际宽度换算,保证两行视觉速度一致——两行品牌数不同,
   写死秒数会让短的那行明显更慢(实测 44 px/s vs 25 px/s)。 */
const MARQUEE_SPEED = 44; // px/s

function MarqueeRow({
  partners,
  reverse = false,
}: {
  partners: Partner[];
  reverse?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  /* 复制份数按实际宽度算:位移 -50% 意味着「一半的轨道」必须铺满视口,
     否则短的那行(品牌数少)滚到后半程右边会露白。固定 4 份对 3 家的行不够。 */
  const [copies, setCopies] = useState(MARQUEE_MIN_COPIES);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const sync = () => {
      const one = el.firstElementChild as HTMLElement | null;
      const unit = one?.getBoundingClientRect().width ?? 0;
      // 可见宽度取父容器,首帧还没布局(为 0)时退回视口宽
      const viewport =
        el.parentElement?.getBoundingClientRect().width || window.innerWidth;
      if (unit > 0 && viewport > 0) {
        // 半条轨道(copies/2 份)要 ≥ 可见宽度,再多留一份余量
        const half = Math.ceil(viewport / unit) + 1;
        setCopies(Math.max(MARQUEE_MIN_COPIES, half * 2));
      }
      const cycle = el.scrollWidth / 2; // 动画位移 -50%
      el.style.animationDuration = `${cycle / MARQUEE_SPEED}s`;
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    if (el.parentElement) ro.observe(el.parentElement);
    window.addEventListener("resize", sync);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, [copies]);

  return (
    <div
      ref={ref}
      className={`flex w-max items-center ${reverse ? "about-ticker-rev" : "about-ticker"}`}
    >
      {Array.from({ length: copies }, (_, i) => i).map((dup) => (
        <ul
          key={dup}
          aria-hidden={dup > 0}
          className="flex shrink-0 items-center"
        >
          {partners.map((p) => (
            <li key={p.name} className="px-9">
              <PartnerLogo partner={p} />
            </li>
          ))}
        </ul>
      ))}
    </div>
  );
}

/* 卡片媒体既可能是视频也可能是图片,按扩展名分流 */
const isImage = (src: string) => /\.(jpg|jpeg|png|webp|avif)(\?|$)/i.test(src);

function Media({ src, className }: { src: string; className?: string }) {
  if (isImage(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- 外部 CDN 图,尺寸交给 CSS
      <img
        src={src}
        alt=""
        aria-hidden
        className={`rounded-[inherit] bg-[#1c1c1f] ${className ?? ""}`}
      />
    );
  }
  return <Clip src={src} className={className} />;
}

/* 主按钮。深色底上只有三处:hero 两个、affiliate 一个;橙底收尾块再一个(黑底变体) */
function Cta({
  children,
  href,
  variant = "solid",
}: {
  children: React.ReactNode;
  href?: string;
  variant?: "solid" | "quiet";
}) {
  const { skin, ring } = {
    solid: {
      skin: "bg-[#ff5e1a] text-white hover:bg-[#ff7738]",
      ring: "focus-visible:outline-white",
    },
    quiet: {
      skin: "border border-white/20 text-white/80 hover:border-white/60 hover:text-white",
      ring: "focus-visible:outline-white",
    },
  }[variant];
  const inner = (
    <span
      style={display}
      className={`inline-flex items-center gap-2 rounded-full px-7 py-4 text-[13px] font-bold uppercase tracking-[0.12em] transition-colors duration-200 ${skin}`}
    >
      {children}
      <ArrowUpRight
        aria-hidden
        className="size-4 transition-transform duration-300 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
      />
    </span>
  );
  // focus 环挂在真正可聚焦的外壳上,不能挂内层 span——span 永远不会拿到焦点
  const shell = `group inline-flex rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${ring}`;
  return href ? (
    <Link href={href} className={shell}>
      {inner}
    </Link>
  ) : (
    <button type="button" className={shell}>
      {inner}
    </button>
  );
}

/* ---------- page ---------- */

export default function AboutPage() {
  return (
    <main
      className="w-full overflow-x-hidden bg-[#0d0d0f] text-[#f7f7f8]"
      style={{ fontFamily: APPLE_FONT, backgroundColor: BASE }}
    >
      <style>{`
        @keyframes about-ticker { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        @keyframes about-ticker-rev { from { transform: translateX(-50%) } to { transform: translateX(0) } }
        @keyframes about-rise {
          from { opacity: 0; transform: translateY(18px) }
          to   { opacity: 1; transform: translateY(0) }
        }
        .about-ticker { animation: about-ticker 38s linear infinite }
        .about-ticker-rev { animation: about-ticker-rev 44s linear infinite }
        .about-rise { animation: about-rise .9s cubic-bezier(.16,1,.3,1) both }
        @media (prefers-reduced-motion: reduce) {
          .about-ticker, .about-ticker-rev { animation: none; transform: none }
          .about-rise { animation: none }
        }
      `}</style>

      {/* ── 1 · Hero:全幅视频 + 压角巨标题(不设顶栏,视频直接铺满首屏) ── */}
      <section className="relative flex min-h-[92vh] flex-col justify-end overflow-hidden">
        <Clip
          src={HERO_VIDEO}
          className="absolute inset-0 size-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              // 顶部原本压深是为了给顶栏垫底,顶栏去掉后收到 .4,让画面在首屏更亮一点
              "linear-gradient(180deg,rgba(13,13,15,.4) 0%,rgba(13,13,15,.25) 30%,rgba(13,13,15,.9) 74%,#0d0d0f 100%), linear-gradient(90deg,rgba(13,13,15,.6) 0%,rgba(13,13,15,0) 62%)",
          }}
        />
        <div className={`${wrap} relative z-10 pb-16 pt-32 md:pb-24`}>
          {/* 这句比上一版长一倍(31 字符),96px 在 1240 容器里排不下,降到 64px——
             与 higgsfield 的 H1 同档;断行也按它的分法,第二行落彩色 */}
          <h1
            className={`${h2} about-rise max-w-[26ch]`}
            style={{ ...display, fontSize: "clamp(32px,5.6vw,64px)" }}
          >
            {HERO_COPY.lines.map((l) => (
              <span key={l} className="block">
                {l}
              </span>
            ))}
            <span className="block text-[#ff5e1a]">{HERO_COPY.accent}</span>
          </h1>
          <div className="mt-10 grid gap-8 md:grid-cols-12 md:items-end">
            <p className="about-rise max-w-[62ch] text-[17px] leading-[1.6] text-white/70 md:col-span-6 [animation-delay:.12s]">
              {HERO_COPY.sub}
            </p>
            <div className="about-rise flex flex-wrap gap-3 md:col-span-6 md:justify-end [animation-delay:.2s]">
              <Cta>Start creating</Cta>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2 · 合作模型 logo 墙 ──────────────────────────────── */}
      <section className="overflow-hidden pt-20 pb-12">
        <p className="mx-auto mb-10 max-w-[52ch] px-6 text-center text-[17px] leading-relaxed text-white/60 md:text-[19px]">
          Partnering with global industry leaders to power your creativity
          output
        </p>
        {/* 两行反向滚动:上行左移、下行右移。无缝循环靠复制内容实现,
           所以同屏会看到重复的品牌 —— 这是 Monica 确认过的取舍(要动感优先)。 */}
        <div className="grid gap-6">
          <MarqueeRow partners={ROW_TOP} />
          <MarqueeRow partners={ROW_BOTTOM} reverse />
        </div>
        <div className="mt-12 flex justify-center">
          <Cta variant="quiet" href="/prototypes/seedance-2-5/models">
            Explore all models
          </Cta>
        </div>
      </section>

      {/* ── 4 · What we believe(严格按 higgsfield 参考图:药丸眉标 + 居中标题 + 3×2 卡片,
             每张卡左上角编号、背后一枚超大淡色图标、文案压在卡片底部) ─────────── */}
      <section className="py-24 md:py-32">
        <div className={wrap}>
          <div className="text-center">
            <span className="inline-block rounded-full bg-white/[0.06] px-4 py-1.5 text-[13px] text-white/70">
              Our Values
            </span>
            <h2
              className={`${h2} mt-6`}
              style={{ ...display, fontSize: SIZE.chapter }}
            >
              What we believe
            </h2>
          </div>

          <ol className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {MANIFESTO.map((m, i) => {
              const Icon = m.icon;
              return (
                <li
                  key={m.claim}
                  className="relative flex min-h-[320px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6"
                >
                  {/* 背景大图标:压在卡片右上、部分出血,极低不透明度当纹理用 */}
                  <Icon
                    aria-hidden
                    /* 只留描边、不加填充——重影是「描边+填充」两层灰度造成的,与粗细无关,
                       所以描边可以放心加粗。1.6 在 224px 下约 15px,分量够又不糊 */
                    strokeWidth={1.6}
                    className="pointer-events-none absolute -top-8 right-1 size-56 text-white/[0.11]"
                  />
                  <span
                    style={display}
                    className="absolute left-6 top-5 text-[28px] font-bold tabular-nums text-white/35"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {/* 图标区固定高度,让标题与正文从同一位置起排(原来整块贴底排,
                     正文行数不同会把标题顶得高低不一)。容器拉宽后标题都是一行,
                     所以不再需要给标题留两行高 */}
                  <div aria-hidden className="h-[132px] shrink-0" />
                  <h3 className="relative text-[17px] font-bold leading-snug text-white">
                    {m.claim}
                  </h3>
                  <p className="relative mt-1 text-[17px] leading-[1.5] text-white/55">
                    {m.body}
                  </p>
                </li>
              );
            })}
          </ol>

          <div className="mt-14 flex justify-center">
            <Cta>Start creating</Cta>
          </div>
        </div>
      </section>

      {/* ── 5 · 浅色带:两类使用者 + 用例 ─────────────────────── */}
      <section
        className="py-24 text-[#131517] md:py-36"
        style={{ backgroundColor: BAND }}
      >
        {/* 按 higgsfield「DESIGNED FOR EVERY CREATOR」版式:药丸眉标 + 居中标题 + 居中副标题,
            下面两张等宽卡片,图片内嵌带留白、圆角,清单用小图标而非横线分隔 */}
        <div className={wrap}>
          <div className="text-center">
            <span className="inline-block rounded-full bg-black/[0.05] px-4 py-1.5 text-[13px] text-black/60">
              About BuzzVideo
            </span>
            <h2
              className={`${h2} mt-6`}
              style={{ ...display, fontSize: SIZE.chapter }}
            >
              Made for marketers.
              {/* 品牌橙。白底上 3.06:1,对 54px 大字达标(大字要求 3:1) */}
              <span className="text-[#ff5e1a]"> Made for ads.</span>
            </h2>
            {/* 整句单行 1469px,两行每行需 735px;原来的 72ch 只有 726px,
               差 9px 就把最后一个词挤到第三行。给到 800px 留余量 */}
            <p className="mx-auto mt-5 max-w-[800px] text-[16px] leading-[1.65] text-black/60">
              BuzzVideo is not a general-purpose video tool. Every model,
              template, and workflow is here to do one job — get
              campaign-ready ads out the door, without the timeline, the crew,
              or the production budget.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2">
            {AUDIENCES.map((a) => (
              <article
                key={a.title}
                className="rounded-[20px] bg-black/[0.04] p-4"
              >
                <div className="overflow-hidden rounded-[14px] bg-black/5">
                  <Media
                    src={a.media}
                    className="aspect-[16/10] w-full object-cover"
                  />
                </div>
                <div className="px-2 pb-2 pt-7">
                  <h3
                    className="text-[26px] font-black uppercase leading-[1.05] tracking-[-0.025em]"
                    style={display}
                  >
                    {a.title}
                  </h3>
                  {/* 限宽 550:右卡那句单行要 572px、容器 580px 刚好放得下,收窄才会断成两行;
                     左卡那句两行每行至少要 523px,所以只能落在 523–571 这个窗口里 */}
                  <p className="mt-3 max-w-[550px] text-[15px] leading-[1.6] text-black/60">
                    {a.lede}
                  </p>
                  <ul className="mt-6 space-y-3.5">
                    {a.points.map((p) => {
                      const Icon = p.icon;
                      return (
                        <li
                          key={p.text}
                          className="flex items-start gap-3 text-[15px] leading-snug"
                        >
                          <Icon
                            aria-hidden
                            strokeWidth={1.75}
                            className="mt-0.5 size-4 shrink-0 text-black/45"
                          />
                          <span className="text-black/75">{p.text}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-14 flex justify-center">
            <Cta>Start creating</Cta>
          </div>
        </div>

        {/* 用例:按参考图 —— 左对齐大标题 + 一句副标题,圆角卡片向右出血横滑,
            说明为「粗体标题. 灰色描述」同段排布(不再是全大写小标签) */}
        <div className={`${wrap} mt-24`}>
          <h3
            className={h2}
            style={{ ...display, fontSize: SIZE.aside }}
          >
            Use cases
          </h3>
          <p className="mt-3 text-[16px] leading-[1.6] text-black/60">
            Bridging the gap between imagination and production.
          </p>
          {/* 八条用例排成两行(桌面 4 列),不再横滑——横滑在宽屏下只溢出一点点,
              还得靠切边暗示可滑;摊开更好扫读 */}
          <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {USE_CASES.map((u) => (
              <figure key={u.title} className="group">
                {/* 底色用浅灰而不是纯黑:hover 放大时视频自身的圆角会顶到裁切边缘,
                    底色若是黑的,那一丝缝隙在白底上会很扎眼 */}
                <div className="overflow-hidden rounded-2xl bg-black/5">
                  {u.media ? (
                    <Media
                      src={u.media}
                      className="aspect-[4/5] w-full object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.03]"
                    />
                  ) : (
                    /* 素材未到位的占位格(演示脚手架,不是产品的一部分,所以文案用中文) */
                    <div className="flex aspect-[4/5] w-full items-center justify-center rounded-2xl border border-dashed border-black/15 px-4 text-center text-[13px] leading-relaxed text-black/35">
                      待补素材
                    </div>
                  )}
                </div>
                <figcaption className="mt-4 text-[15px] leading-[1.55] text-black/55">
                  <span className="font-bold text-[#131517]">{u.title}.</span>{" "}
                  {u.desc}
                </figcaption>
              </figure>
            ))}
          </div>

          <div className="mt-14 flex justify-center">
            <Cta>Start creating</Cta>
          </div>
        </div>
      </section>

      {/* ── 7 · Affiliate(按 higgsfield EARN 版式:药丸眉标 + 居中标题副标题 +
             四项数据条 + 左侧带竖线的编号步骤、右侧圆角媒体) ─────────────── */}
      <section className="border-t border-white/10 py-24 md:py-32">
        <div className={wrap}>
          <div className="mx-auto max-w-[68ch] text-center">
            <span className="inline-block rounded-full bg-white/[0.06] px-4 py-1.5 text-[13px] text-white/70">
              Partner Program
            </span>
            <h2
              className={`${h2} mt-6`}
              style={{ ...display, fontSize: SIZE.chapter }}
            >
              Buzz Affiliate
            </h2>
            <p className="mt-4 text-[16px] leading-[1.65] text-white/60">
              Bring people in and keep half of what they spend — a real
              recurring cut, not a referral gimmick.
            </p>
          </div>

          {/* 数据条用的是项目真实条款(佣金/赠送额度/cookie/结算周期),
             不编「已发放多少钱」这类无法核实的成绩数字 */}
          <dl className="mt-14 grid grid-cols-2 gap-y-10 md:grid-cols-4">
            {AFFILIATE_TERMS.map((t) => (
              <div key={t.label} className="text-center">
                <dt className="sr-only">{t.label}</dt>
                <dd
                  className="text-[clamp(30px,4vw,44px)] font-black tracking-[-0.02em]"
                  style={display}
                >
                  {t.value}
                </dd>
                <p className="mt-1 text-[14px] text-white/55">{t.label}</p>
              </div>
            ))}
          </dl>

          <div className="mt-16 grid gap-12 md:grid-cols-2 md:items-start">
            <div>
              <ol className="border-l border-white/12 pl-7">
                {AFFILIATE_STEPS.map((s, i) => (
                  <li key={s.title} className={i > 0 ? "mt-9" : ""}>
                    <div className="relative">
                      <span className="absolute -left-[35px] text-[12px] tabular-nums text-white/35">
                        {i + 1}
                      </span>
                      <h3
                        className="text-[18px] font-bold uppercase tracking-[-0.02em]"
                        style={display}
                      >
                        {s.title}
                      </h3>
                      <p className="mt-3 max-w-[46ch] text-[15px] leading-[1.65] text-white/60">
                        {s.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="mt-10 pl-7">
                <Cta href="/prototypes/2026-06-09-affiliate">Apply now</Cta>
              </div>
            </div>

            <Clip
              src={`${CDN}/324795053161635840.mp4`}
              className="aspect-[4/5] w-full rounded-2xl bg-black object-cover"
            />
          </div>
        </div>
      </section>

      {/* ── 8 · FAQ ───────────────────────────────────────────── */}
      <section className="border-t border-white/10 py-20 md:py-28">
        <div className={`${wrap} grid gap-12 md:grid-cols-12`}>
          <h2
            className={`${h2} md:col-span-4`}
            style={{ ...display, fontSize: SIZE.aside }}
          >
            Questions
            <br />
            we get asked
          </h2>
          <Accordion type="single" collapsible className="md:col-span-8">
            {FAQ.map((f, i) => (
              <AccordionItem
                key={i}
                value={`q-${i}`}
                className="border-b border-white/12"
              >
                <AccordionTrigger
                  className="py-6 text-left text-[17px] font-bold uppercase tracking-[-0.01em] hover:no-underline focus-visible:border-white/40 focus-visible:ring-white/60 md:text-[19px]"
                  style={display}
                >
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="max-w-[62ch] pb-7 text-[15px] leading-[1.7] text-white/60">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ── 9 · 收口 CTA。克制版:一句话 + 一个按钮,不做整块橙 ────────── */}
      <section className="border-t border-white/10 py-20 md:py-24">
        <div
          className={`${wrap} flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between`}
        >
          <h2
            className={`${h2} max-w-[20ch]`}
            style={{ ...display, fontSize: SIZE.aside }}
          >
            Your next campaign is one prompt away.
          </h2>
          <Cta>Start creating</Cta>
        </div>
      </section>
    </main>
  );
}
