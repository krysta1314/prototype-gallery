"use client";

/* /enterprise(2026-11-23 Monica:「照 openart.ai/enterprise 一模一样设计」,再「去量一下他们的字号间距，逐项对齐」)。
   尺寸全部照 openart.ai/enterprise 线上 CSS 实测(1470 宽):
     首屏      min-h min(88vh,860px)、上 176 下 96、内容左对齐最宽 980;标题 96/600/行高 .96/字距 -5px,第二行变灰;
               说明 20/30/500、宽 620、标题下 20;按钮高 56、圆角 12、18/600,主按钮左右 44、次按钮左右 32 + 1.5px 白描边;
               遮罩 = 左→右 0–28% 实黑、48% 78%、68% 42%、90% 透明 + 上下各一道渐黑;视频 object-position 58% 50%
     支柱卡    三列 gap 16、圆角 26、底 white/4%、描边 white/4%;上半 min-h 104 / 左右 28:左 64px 图标 + 右对齐 28–34px 全大写标题 #c5c5c5;
               下半 min-h 96 / 12 28 24:16–18px 行高 1.45 #969696;整排往下压进浅底 150px,接缝 200px 由黑渐变到浅灰
     分段卡    宽 1200(两侧至少 80)、上下 48;白卡 padding 56、圆角 16、1px 黑 8% 描边、无大阴影;两栏 gap clamp(36,6vw,76) 垂直居中;
               配图 4:3、圆角 20、1px 黑 10%、阴影 0 18 60 黑 12%;小标签 12/600/字距 .06em/行高 14、上下 8 左右 12、圆角 4、#d7d3cb 描边、下 18;
               标题 clamp(30,2.5vw,36)/600/行高 1.02/字距 -.045em、下 28;要点 每条上下 4、标题 16/600 + 7px 圆点(间距 10)、说明 14/1.45、上 2;
               按钮 高 38、左右 17、圆角 10、13/600 深底
     表单段    上 40 下 56、顶部 1px 分隔线;外壳圆角 24、padding 8、阴影 0 16 48 黑 8%;左右 .42 : .58,各 padding 12;
               左边三条视频轮播 min-h 640、圆角 20、压 22% 黑，底部三段进度条(距边 24、间距 8、3px 高);右边灰底表单(OpenArt 是 HubSpot 表单)
   和 OpenArt 不同的地方(故意):
     - 配色只用官方色板：OpenArt 的品红换成品牌橙 / CTA 渐变，正文深色用 #240A03;标题字体照 OpenArt 用 Bricolage Grotesque(根布局已加载，变量 --font-bricolage),正文用全站字体;
     - 标题和 OpenArt 一样用白→48% 白的竖向渐隐填充(Monica 要一模一样),高亮词实色品牌橙;
     - 不编事实：权益来自 company.ts(线上定价页 + v1.6 team-workspace);Trusted 只写 SOC 2 / DPA / 数据驻留 / SLA,不写 IP 检测和侵权赔偿;
     - 首屏底部的客户 logo 跑马灯不做(我们没有可公开的客户 logo);
     - 表单不真发，提交后显示成功状态;公司规模用 DropdownSelect(不用原生 select)。
   首屏背景片：BuzzVideo dev(Seedance 2.5 1080p)生成的 5 条「巨型产品闯进现实」FOOH 镜头，每条 3.2 秒拼成 16 秒循环,
   工程在 ~/Desktop/Enterprise落地页工程/hero/。 */

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ArrowRight, ArrowRightLeft, Check, FolderOpen, KeyRound, MousePointer2, Palette, Plus, UsersRound, Volume2, VolumeX } from "lucide-react";
import { DropdownSelect } from "@/components/ui/dropdown-select";
import type { OnLink } from "../../site-nav/SiteNavHeader";
import { MODELS } from "../../site-nav/models-catalog";
import { faqLd, linker, JsonLd, ORG } from "./ui";

type Linker = ReturnType<typeof linker>;

const INK = "#240A03";
const POSTER = "/video-library/posters";
const LOCAL = "/prototypes/site/tools";
const HERO = { src: "/prototypes/site/enterprise/hero.mp4", srcMobile: "/prototypes/site/enterprise/hero-720.mp4", poster: "/prototypes/site/enterprise/hero-poster.jpg" };
/* 浅底段的版心：最宽 1200,两侧至少 80(手机 16) */
const WRAP_LIGHT = "mx-auto w-[calc(100%-32px)] max-w-[1200px] md:w-[calc(100%-160px)]";

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ── 视频：静音循环，进入视口才播;「减少动态效果」时只显示封面 ── */
function Loop({ src, srcMobile, poster, className = "", label }: { src: string; srcMobile?: string; poster: string; className?: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  /* 有手机版就按屏宽挑文件(挂载后再定，首屏先显示封面) */
  const [file, setFile] = useState<string | undefined>(srcMobile ? undefined : src);
  useEffect(() => {
    if (srcMobile) setFile(window.matchMedia("(max-width: 767px)").matches ? srcMobile : src);
  }, [src, srcMobile]);
  useEffect(() => {
    const v = ref.current;
    if (!v || !file || reduced()) return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: 0.15 });
    io.observe(v);
    return () => io.disconnect();
  }, [file]);
  return <video ref={ref} src={file} poster={poster} muted loop playsInline preload="metadata" aria-label={label} className={`size-full object-cover ${className}`} />;
}

/* ── 支柱卡图标：等轴测线稿(OpenArt 的支柱卡左上是 64px 线稿图标，一条边用品牌色) ── */
function PillarIcon({ kind }: { kind: "teamwork" | "powerful" | "intuitive" | "trusted" }) {
  const face = "fill-[#131415] stroke-[#727b87]";
  return (
    <svg viewBox="0 0 64 64" className="size-14 shrink-0 md:size-16" aria-hidden fill="none" strokeWidth="1" strokeLinejoin="round">
      {kind === "powerful" &&
        [40, 30, 20].map((y, i) => (
          <path key={y} d={`M32 ${y - 10} L52 ${y} L32 ${y + 10} L12 ${y} Z`} className={i === 2 ? "fill-[#131415] stroke-[#FF744D]" : face} />
        ))}
      {kind === "teamwork" && (
        <>
          <path d="M22 14 L46 14 Q50 14 50 18 L50 34 Q50 38 46 38 L22 38 Q18 38 18 34 L18 18 Q18 14 22 14 Z" className={face} />
          <path d="M14 26 L38 26 Q42 26 42 30 L42 46 Q42 50 38 50 L14 50 Q10 50 10 46 L10 30 Q10 26 14 26 Z" className={face} />
          <path d="M40 34 L40 46 L43.5 42.5 L47 50 L49.5 49 L46 41.5 L51 41.5 Z" className="fill-[#FF744D] stroke-none" />
        </>
      )}
      {kind === "intuitive" && (
        <>
          <path d="M32 10 L52 20 L52 42 L32 54 L12 42 L12 20 Z" className={face} />
          <path d="M12 20 L32 31 L52 20 M32 31 L32 54" className="stroke-[#727b87]" />
          <path d="M27 36 L27 46 L30 43 L33 48 L35 47 L32 42 L36 42 Z" className="fill-[#FF744D] stroke-none" />
        </>
      )}
      {kind === "trusted" && (
        <>
          <path d="M32 8 L50 15 L50 31 C50 42 42 50 32 56 C22 50 14 42 14 31 L14 15 Z" className={face} />
          <path d="M32 14 L44 19 L44 31 C44 39 39 45 32 49" className="stroke-[#FF744D]" />
          <path d="M25 31 L30 36 L39 26" className="stroke-[#a0a7b1]" strokeWidth="1.6" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

/* GEO:页面的实体定义(FAQ 第一条、WebPage / SoftwareApplication 描述共用同一句) */
const LIVE_COUNT = MODELS.filter((m) => m.release === "live").length;
const ENT_DEFINITION =
  "BuzzVideo Enterprise is the BuzzVideo plan for companies and agencies that create ads, product videos and other content with AI as a team. It includes every leading AI model for video, image and audio, shared projects with review and approval, SSO, one shared credit pool, API access, an SLA and a dedicated account manager.";
/* FAQ(事实来源：线上定价页 + company.ts 的 Enterprise 权益与团队额度;功能清单 Monica 2026-11-23 确认) */
const ENT_FAQ: { q: string; a: string }[] = [
  { q: "What is BuzzVideo Enterprise?", a: ENT_DEFINITION },
  {
    q: "Who is BuzzVideo Enterprise for?",
    a: "Companies and agencies whose marketing, e-commerce, brand, HR and training teams create ads, product videos, social posts and training content, and want one workspace, one credit pool and manager review before anything goes live.",
  },
  {
    q: "How much does BuzzVideo Enterprise cost?",
    a: "Enterprise pricing is a custom quote based on your team size and how much you create. Your organization shares one credit pool that admins allocate per member. Contact sales for a quote, or see the Pricing page for individual plans.",
  },
  { q: "Can we try BuzzVideo Enterprise before we buy?", a: "Yes. Book a demo with our team and we'll set up a free trial account for your team." },
  {
    q: "Does BuzzVideo Enterprise include API access?",
    a: "Yes. Enterprise includes API access, so you can bring video and image generation into your own workflows and tools. BuzzVideo MCP, for ChatGPT, Claude and other AI apps, is included on every plan.",
  },
  {
    q: "Which AI models are included?",
    a: `Every model on BuzzVideo: ${LIVE_COUNT} video, image and audio models are live today, from ByteDance, Google, OpenAI, Kuaishou, Alibaba, MiniMax and more. Enterprise adds dedicated model capacity and a priority processing queue.`,
  },
  {
    q: "How do team credits and permissions work?",
    a: "Your organization has one shared credit pool. Admins set an allocation per member as a soft or hard limit, top up the pool or a person, and can turn on auto top-up with a monthly cap. Roles are Owner, Admin, Billing Admin and Member, and usage is visible per teammate.",
  },
  {
    q: "Does BuzzVideo Enterprise support SSO and security reviews?",
    a: "Yes. Enterprise supports SSO and SAML and an exportable audit log, and we provide SOC 2 reports, a custom DPA and data residency options for your security and legal review, backed by an SLA.",
  },
];

/* 顺序和下面的分段一致(Monica 2026-11-23:「这下面的 section 跟上面是对应是吧?」)→ Teamwork / Intuitive / Trusted / Powerful */
const PILLARS = [
  { key: "teamwork", tag: "Teamwork", body: "Every team and agency in one project, with manager sign-off before anything ships." },
  { key: "intuitive", tag: "Intuitive", body: "An AI agent and tools built for the people who create, not for prompt engineers." },
  { key: "trusted", tag: "Trusted", body: "SOC 2 reports, a custom DPA and data residency options for your security review." },
  { key: "powerful", tag: "Powerful", body: "Every leading AI model on one plan, with dedicated capacity and a priority queue." },
] as const;

type Point = { title: string; body: string; href?: string };
const POWERFUL: Point[] = [
  { title: "One plan, every leading model", href: "/models", body: "Video, image and audio models from ByteDance, Google, OpenAI, Kuaishou and more, plus MCP for ChatGPT, Claude and your team's tools." },
  { title: "Enterprise administration", body: "Seats, roles and shared workspaces, with one credit pool your admins control." },
  { title: "Custom credit allocation", body: "Credits sized to your team and set per member as a soft or hard limit, with auto top-up and a monthly cap." },
  { title: "One quote, one bill", body: "Custom pricing for your organization, based on team size and how much you create, with one invoice your Billing Admin manages." },
  { title: "API access and dedicated capacity", href: "/api", body: "Bring generation into your own workflows, with dedicated model capacity and a priority processing queue." },
];
const INTUITIVE: Point[] = [
  { title: "Built for every team", body: "Marketing, e-commerce, brand, HR and training teams start from a product link, a photo or a brief instead of a blank prompt." },
  { title: "An AI agent that does the work", href: "/marketing-agent", body: "Describe what you need, from a TikTok ad to an onboarding video. The agent plans it, writes the script and generates it with the right models." },
  { title: "Canvas and Studios", href: "/canvas", body: "Chain image, video and audio steps on Canvas, or start from ready-made templates in Studios." },
  { title: "Onboarding and an account manager", body: "Team training, onboarding and a dedicated account manager from day one." },
];
const TRUSTED: Point[] = [
  { title: "SOC 2 reports", body: "Get our SOC 2 reports for your security and IT review." },
  { title: "Custom DPA", body: "A data processing agreement written for your legal team." },
  { title: "Data residency", body: "Options for where your team's data is stored." },
  { title: "SLA", body: "A service level agreement, backed by a dedicated account manager." },
];

/* ── 分段卡：一边标签 + 标题 + 要点 + 按钮，一边 4:3 配图，左右交替 ── */
function Feature({ id, tag, title, points, media, flip = false, onContact, first = false, a }: { id: string; tag: string; title: string; points: Point[]; media: ReactNode; flip?: boolean; onContact: () => void; first?: boolean; a: Linker }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className={`scroll-mt-[90px] ${first ? "" : "py-10 md:py-12"}`}>
      <div className={WRAP_LIGHT}>
        <div className="grid items-center gap-8 rounded-[20px] border border-black/[0.08] bg-white p-6 md:rounded-[16px] md:p-10 lg:grid-cols-2 lg:gap-[clamp(36px,6vw,76px)] lg:p-14">
          <div className={`min-w-0 ${flip ? "lg:order-2" : ""}`}>
            <p className="mb-[18px] inline-flex rounded-[4px] border border-[#d7d3cb] px-3 py-2 text-[12px] font-semibold uppercase leading-[14px] tracking-[0.06em] text-[#232323]">{tag}</p>
            <h2 id={`${id}-h`} className="[font-family:var(--font-bricolage),sans-serif] mb-7 max-w-[620px] text-[26px] font-semibold leading-[1.02] tracking-[-0.045em] [text-wrap:balance] lg:text-[clamp(30px,2.5vw,36px)]" style={{ color: INK }}>
              {title}
            </h2>
            <ul>
              {points.map((p) => (
                <li key={p.title} className="py-1">
                  <h3 className="[font-family:var(--font-bricolage),sans-serif] flex items-center gap-2.5 text-[16px] font-semibold tracking-[-0.01em]" style={{ color: INK }}>
                    <span aria-hidden className="size-[7px] shrink-0 rounded-full" style={{ background: INK }} />
                    {p.href ? (
                      <a {...a(p.title, p.href)} className="underline decoration-[#240A03]/25 underline-offset-[3px] transition-colors hover:decoration-[#FF744D]">
                        {p.title}
                      </a>
                    ) : (
                      p.title
                    )}
                  </h3>
                  <p className="mt-0.5 pl-[17px] text-[14px] leading-[1.45] text-[#240A03]/70">{p.body}</p>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={onContact}
              className="mt-5 inline-flex h-[38px] items-center gap-2 rounded-[10px] px-[17px] text-[13px] font-semibold text-white transition-colors hover:bg-[#4a2a20] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF744D] focus-visible:ring-offset-2"
              style={{ background: INK }}
            >
              Contact sales team <ArrowRight className="size-3.5" />
            </button>
          </div>
          <div className={`aspect-[4/3] min-w-0 overflow-hidden rounded-[20px] border border-black/10 bg-white shadow-[0_18px_60px_rgba(0,0,0,0.12)] ${flip ? "lg:order-1" : ""}`}>{media}</div>
        </div>
      </div>
    </section>
  );
}

/* ── Powerful 配图：模型 logo 圆章墙，一排排缓慢横移(照 OpenArt;2026-11-23 Monica:用模型 logo)。
   logo 来自 LobeHub 开源图标库 @lobehub/icons-static-svg 1.106.0,只放 BuzzVideo 上线模型对应的品牌 ── */
const LIVE = MODELS.filter((m) => m.release === "live");
/* 2026-11-24 Monica:「logo 全部放进去，保留阿里和微软、meta」—— 她给的全部 logo(~/Downloads/模型 logo/)都上墙，文件统一放 public/prototypes/site/logos/ */
const LOGOS = [
  { name: "Kling", file: "kling-color.svg" },
  { name: "Seedance and Seedream", file: "bytedance-color.svg" },
  { name: "Wan", file: "wan.svg" },
  { name: "Alibaba", file: "alibaba-color.svg" },
  { name: "Hailuo", file: "hailuo-color.svg" },
  { name: "MiniMax", file: "minimax-color.svg" },
  { name: "Vidu", file: "vidu-color.svg" },
  { name: "Grok Imagine", file: "grok.svg" },
  { name: "Nano Banana", file: "nanobanana-color.svg" },
  { name: "Gemini", file: "gemini-color.svg" },
  { name: "Google", file: "google-color.svg" },
  { name: "GPT Image", file: "openai.svg" },
  { name: "FLUX", file: "flux.svg" },
  { name: "Meta", file: "meta-color.svg" },
  { name: "Muse", file: "muse-color.svg" },
  { name: "Microsoft", file: "microsoft-color.svg" },
  { name: "Qwen", file: "qwen-color.svg" },
  { name: "ElevenLabs", file: "elevenlabs.svg" },
  { name: "Mureka", file: "mureka.webp" },
  { name: "Claude", file: "claude-color.svg" },
];
function VendorWall() {
  /* 20 个 logo 分三行(7 / 7 / 6),每行各自循环滚动 */
  const rows = [LOGOS.slice(0, 7), LOGOS.slice(7, 14), LOGOS.slice(14)];
  return (
    <div className="relative flex size-full flex-col justify-center gap-3 overflow-hidden bg-[#F6F6F6]" role="img" aria-label={`${LIVE.length} models live today, including ${LOGOS.map((l) => l.name).join(", ")}`}>
      {rows.map((r, i) => (
        <div key={i} className="flex w-max gap-3 motion-safe:animate-[ent-drift_38s_linear_infinite]" style={{ animationDirection: i % 2 ? "reverse" : "normal", marginLeft: i % 2 ? -48 : 0 }}>
          {[...r, ...r].map((l, j) => (
            <span key={j} aria-hidden title={l.name} className="grid size-[clamp(72px,7vw,96px)] shrink-0 place-items-center rounded-full bg-white shadow-[0_8px_24px_rgba(36,10,3,0.08)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/prototypes/site/logos/${l.file}`} alt="" className={`object-contain ${l.file === "mureka.webp" ? "size-[50%] rounded-[22%]" : "size-[42%]"}`} />
            </span>
          ))}
        </div>
      ))}
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-14 bg-gradient-to-r from-[#F6F6F6] to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-14 bg-gradient-to-l from-[#F6F6F6] to-transparent" />
    </div>
  );
}

/* ── Intuitive 配图：成片上压一个 Marketing Agent 输入框，逐字打出 brief ── */
const BRIEF = "Make a 15-second ad of our lip gloss as a giant tube in a mall, for TikTok";
function AgentCard() {
  const [n, setN] = useState(BRIEF.length);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (reduced() || !box.current) return;
    let timer: number | undefined;
    const io = new IntersectionObserver(
      ([e]) => {
        window.clearInterval(timer);
        if (!e.isIntersecting) return;
        let i = 0;
        setN(0);
        timer = window.setInterval(() => {
          i = i >= BRIEF.length + 40 ? 0 : i + 1; // 打完停 2 秒再重来
          setN(i);
        }, 50);
      },
      { threshold: 0.4 },
    );
    io.observe(box.current);
    return () => {
      io.disconnect();
      window.clearInterval(timer);
    };
  }, []);
  return (
    <div ref={box} className="relative size-full bg-[#1C1C1C]">
      <Loop src="/prototypes/site/enterprise/agent-lipgloss.mp4" poster="/prototypes/site/enterprise/agent-lipgloss.jpg" label="A giant BuzzVideo lip gloss tube releasing pink bubbles in a mall, made on BuzzVideo" className="object-[60%_40%]" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
      <div className="absolute inset-x-4 bottom-4 rounded-[16px] bg-white p-4 shadow-[0_20px_50px_rgba(0,0,0,0.3)] sm:inset-x-6 sm:bottom-6">
        <p className="text-[11.5px] font-bold text-[#FF744D]">Marketing Agent</p>
        <p className="mt-1 min-h-[44px] text-[15px] leading-[22px]" style={{ color: INK }}>
          {BRIEF.slice(0, Math.min(n, BRIEF.length))}
          <span aria-hidden className="ml-0.5 inline-block h-[17px] w-[2px] translate-y-[3px] bg-[#FF744D] motion-safe:animate-pulse" />
        </p>
        <div className="mt-2 flex items-center justify-between" aria-hidden>
          <span className="grid size-8 place-items-center rounded-full bg-[#F6F6F6]" style={{ color: INK }}>
            <Plus className="size-4" />
          </span>
          <span className="grid size-8 place-items-center rounded-full bg-gradient-to-r from-[#FFA73C] to-[#FF5255] text-white">
            <ArrowRight className="size-4 -rotate-90" />
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Trusted 配图：组织后台的「安全与合规」页(按 v1.6 team-workspace 的角色体系画) ── */
function AdminCard() {
  const rows = [
    { k: "SOC 2 report", v: "Available on request", act: "Request" },
    { k: "Data processing agreement", v: "Custom DPA", act: "Request" },
    { k: "Data residency", v: "Set with your account manager", act: "Contact" },
  ];
  const roles = [
    { r: "Owner", n: 1 },
    { r: "Admin", n: 2 },
    { r: "Billing Admin", n: 1 },
    { r: "Member", n: 24 },
  ];
  return (
    <div className="flex size-full flex-col bg-[#141414] p-2" aria-label="Organization security settings in BuzzVideo">
      <div className="flex items-center gap-1.5 px-3 py-2" aria-hidden>
        <span className="size-2.5 rounded-full bg-white/15" />
        <span className="size-2.5 rounded-full bg-white/15" />
        <span className="size-2.5 rounded-full bg-white/15" />
        <span className="ml-3 text-[12px] font-semibold text-white/55">Organization settings</span>
      </div>
      <div className="grid min-h-0 flex-1 gap-2 sm:grid-cols-[132px_1fr]">
        <nav aria-hidden className="hidden flex-col gap-1 rounded-[14px] bg-white/[0.04] p-2 text-[12.5px] font-semibold text-white/55 sm:flex">
          {["Members", "Credits", "Security", "Billing"].map((t) => (
            <span key={t} className={`rounded-lg px-3 py-2 ${t === "Security" ? "bg-white/10 text-white" : ""}`}>
              {t}
            </span>
          ))}
        </nav>
        <div className="min-h-0 overflow-hidden rounded-[14px] bg-white/[0.04] p-4">
          <p className="text-[14px] font-bold text-white">Security and compliance</p>
          <ul className="mt-1 divide-y divide-white/[0.07]">
            {rows.map((r) => (
              <li key={r.k} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-white">{r.k}</p>
                  <p className="truncate text-[12px] text-white/55">{r.v}</p>
                </div>
                <span aria-hidden className="shrink-0 rounded-lg bg-white/10 px-3 py-1.5 text-[12px] font-bold text-white">
                  {r.act}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[12.5px] font-bold text-white">Roles</p>
          <ul className="mt-2 grid grid-cols-2 gap-2">
            {roles.map((r) => (
              <li key={r.r} className="flex items-center justify-between rounded-[10px] bg-white/[0.05] px-3 py-2 text-[12px] text-white/75">
                <span className="font-semibold text-white">{r.r}</span>
                <span className="tabular-nums">{r.n}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ── Teamwork 段(2026-11-23 Monica:「enterprise 功能也要展示，比如分享项目，画布里每个人的鼠标带名字，还有 enterprise 在乎的功能」)。
   OpenArt 没有这一段，版式沿用分段卡(OpenArt 的 detail-header:标题在左、按钮在右)+ 一块全宽画布演示 + 六条企业功能。
   2026-11-23 Monica:不讲多人协作，讲「多个团队在一个项目里 + 经理审核」这类 enterprise 关心的事 → 标题改成审核，节点带 Approved / In review。
   功能清单 Monica 2026-11-23 确认产品都能做到(多人协作、审核、SSO/SAML、审计日志、作品转交、品牌套件、API),按已有功能写。 */
/* 2026-11-23 Monica:「要更好看，内容更偏市场，市场调研以后再出内容」→ 照 Flora / Magnific Spaces 的多人画布展示重做:
   深色点阵画布、节点只留上方小标签、图很大、细曲线上有光点流动、彩色描边的名字光标。
   内容 = 一个真实 campaign 从参考图展开成整套投放素材：她在 Enterprise 画布上做的 DRIFT 冲浪片
   (人物 / 冲浪板 / 海湾三张参考 → 主视觉 → 15 秒英雄片 → TikTok 9:16 / Meta 4:5 / YouTube 16:9 三个尺寸)。
   素材都在 public/prototypes/site/enterprise/drift/,源文件 ~/Desktop/模板封面/19-DRIFT/。 */
type Cursor = { name: string; role: string; color: string; ink: string; path: [number, number][]; dur: number };
const D = "/prototypes/site/enterprise/drift";
const CURSORS: Cursor[] = [
  { name: "Maya", role: "Brand manager", color: "#A78BFA", ink: "#C9B8FF", path: [[720, 322], [745, 345], [712, 350], [740, 312]], dur: 10000 },
  { name: "Leo", role: "Performance", color: "#4ADE80", ink: "#9AF0BC", path: [[300, 380], [420, 430], [340, 495], [450, 360]], dur: 12000 },
  { name: "Sofia", role: "Marketing", color: "#60A5FA", ink: "#A9CCFF", path: [[880, 140], [912, 200], [868, 212], [918, 108]], dur: 14000 },
];
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/* 画布按固定 1040×560 画，再整体缩放到容器宽度(手机上也保持同样比例) */
const BW = 1040;
const BH = 560;
type Box = { x: number; y: number; w: number; h: number };
const N = {
  model: { x: 28, y: 52, w: 170, h: 96 },
  board: { x: 28, y: 210, w: 170, h: 96 },
  bay: { x: 28, y: 368, w: 170, h: 96 },
  key: { x: 262, y: 186, w: 230, h: 129 },
  hero: { x: 560, y: 52, w: 300, h: 169 },
  tiktok: { x: 560, y: 300, w: 124, h: 220 },
  meta: { x: 712, y: 300, w: 160, h: 200 },
  youtube: { x: 896, y: 300, w: 128, h: 72 },
} satisfies Record<string, Box>;
const right = (b: Box) => [b.x + b.w, b.y + b.h / 2] as const;
const left = (b: Box) => [b.x, b.y + b.h / 2] as const;
const top = (b: Box) => [b.x + b.w / 2, b.y] as const;
type Pt = readonly [number, number];
type Edge = { d: string; a: Pt; b: Pt };
const curve = (a: Pt, b: Pt): Edge => {
  const dx = Math.max(40, (b[0] - a[0]) / 2);
  return { a, b, d: `M${a[0]} ${a[1]} C${a[0] + dx} ${a[1]} ${b[0] - dx} ${b[1]} ${b[0]} ${b[1]}` };
};
const down = (a: Pt, b: Pt): Edge => ({ a, b, d: `M${a[0]} ${a[1]} C${a[0]} ${a[1] + 50} ${b[0]} ${b[1] - 50} ${b[0]} ${b[1]}` });
const EDGES: Edge[] = [
  curve(right(N.model), left(N.key)),
  curve(right(N.board), left(N.key)),
  curve(right(N.bay), left(N.key)),
  curve(right(N.key), left(N.hero)),
  down([N.hero.x + 60, N.hero.y + N.hero.h], top(N.tiktok)),
  down([N.hero.x + 150, N.hero.y + N.hero.h], top(N.meta)),
  down([N.hero.x + N.hero.w - 20, N.hero.y + N.hero.h], top(N.youtube)),
];

function TeamCanvas() {
  const wrap = useRef<HTMLDivElement>(null);
  const board = useRef<HTMLDivElement>(null);
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  /* 彗星流光：每条线一条拖尾 + 一团光晕，渐变跟着彗星一起走(和产品画布同一做法) */
  const comet = useRef<{ tail: SVGPathElement | null; glow: SVGPathElement | null; tg: SVGLinearGradientElement | null; gg: SVGLinearGradientElement | null }[]>(EDGES.map(() => ({ tail: null, glow: null, tg: null, gg: null })));
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    let raf = 0;
    const fit = () => {
      if (board.current) board.current.style.transform = `scale(${el.clientWidth / BW})`;
    };
    const fitRo = new ResizeObserver(fit);
    fitRo.observe(el);
    fit();
    const place = (now: number) => {
      CURSORS.forEach((c, i) => {
        const node = refs.current[i];
        if (!node) return;
        let [x, y] = c.path[0];
        if (now >= 0) {
          const seg = c.dur / c.path.length;
          const k = Math.floor((now % c.dur) / seg);
          const p = ((now % c.dur) % seg) / seg;
          const hold = 0.4; // 每段先停一会儿再移动，像真人在看节点
          const t = p < hold ? 0 : ease((p - hold) / (1 - hold));
          const [a, b] = [c.path[k], c.path[(k + 1) % c.path.length]];
          x = a[0] + (b[0] - a[0]) * t;
          y = a[1] + (b[1] - a[1]) * t;
        }
        node.style.transform = `translate(${x}px, ${y}px)`;
      });
    };
    if (reduced()) {
      place(-1);
      return () => fitRo.disconnect();
    }
    const TAIL = 120; // 拖尾长度(px,画布坐标)
    const GLOW = 66; // 光晕长度
    const SPEED = 0.26; // px / ms
    const lens = comet.current.map((c) => c.tail?.getTotalLength() ?? 0);
    const flow = (now: number) => {
      comet.current.forEach((c, i) => {
        const L = lens[i];
        if (!c.tail || !c.glow || !c.tg || !c.gg || !L) return;
        const head = ((now * SPEED + i * 137) % (L + TAIL * 1.6)) - TAIL * 0.3; // 彗星头的位置，走完一轮从头再来
        const set = (path: SVGPathElement, grad: SVGLinearGradientElement, len: number) => {
          const from = Math.max(0, head - len);
          const to = Math.min(L, Math.max(0, head));
          path.style.strokeDasharray = `${Math.max(0, to - from)} ${L + len}`;
          path.style.strokeDashoffset = `${-from}`;
          path.style.opacity = to - from > 14 ? "1" : "0";
          const a = path.getPointAtLength(from);
          const b = path.getPointAtLength(to);
          grad.setAttribute("x1", `${a.x}`);
          grad.setAttribute("y1", `${a.y}`);
          grad.setAttribute("x2", `${b.x}`);
          grad.setAttribute("y2", `${b.y}`);
        };
        set(c.tail, c.tg, TAIL);
        set(c.glow, c.gg, GLOW);
      });
    };
    const tick = (now: number) => {
      place(now);
      flow(now);
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf);
      if (e.isIntersecting) raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    place(0);
    return () => {
      io.disconnect();
      fitRo.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  /* 节点：上方一行小标签(名称 · 模型),下面就是大图，无卡片外框(Flora 的做法) */
  const Node = ({ b, label, meta, img, video, selected, status }: { b: Box; label: string; meta: string; img: string; video?: string; selected?: Cursor; status?: "approved" | "review" }) => (
    <div className="absolute" style={{ left: b.x, top: b.y - 20, width: b.w }}>
      <div className="flex items-center justify-between gap-2 pb-1.5 text-[11px] leading-none">
        <span className="truncate font-medium text-white/80">{label}</span>
        <span className="shrink-0 text-white/40">{meta}</span>
      </div>
      <div className="relative overflow-hidden rounded-[10px] bg-white/5" style={{ height: b.h, boxShadow: selected ? `0 0 0 2px ${selected.color}` : "0 0 0 1px rgba(255,255,255,0.08)" }}>
        {video ? (
          <video src={video} poster={img} muted loop autoPlay playsInline preload="none" className="size-full object-cover" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" className="size-full object-cover" />
        )}
        {status && (
          <span className={`absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-full px-1.5 py-[3px] text-[9.5px] font-semibold backdrop-blur ${status === "approved" ? "bg-[#5BD68A] text-black" : "bg-black/60 text-white"}`}>
            {status === "approved" ? <Check className="size-2.5" strokeWidth={3.5} /> : <span className="size-1.5 rounded-full bg-[#FFA73C]" />}
            {status === "approved" ? "Approved" : "In review"}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div
      className="overflow-hidden rounded-[20px] bg-[#0E0E0F] shadow-[0_24px_70px_rgba(0,0,0,0.25)] ring-1 ring-black/20"
      role="img"
      aria-label="The DRIFT summer surf campaign on a shared BuzzVideo Canvas: model, surfboard and bay references feed a key visual, a 15-second hero film and TikTok, Meta and YouTube cut-downs, while Sofia from Marketing, Leo from Performance and Maya, the brand manager, review and approve each cut in the same project"
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3" aria-hidden>
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-7 shrink-0 place-items-center rounded-md bg-white text-[10px] font-black tracking-[0.08em] text-black">DR</span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-white">DRIFT · Summer surf launch</p>
            <p className="truncate text-[11px] text-white/45">Brand team + marketing</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden items-center sm:flex">
            {CURSORS.map((c, i) => (
              <span key={c.name} className="grid size-7 place-items-center rounded-full text-[11px] font-bold text-black ring-2 ring-[#0E0E0F]" style={{ background: c.color, marginLeft: i ? -6 : 0 }}>
                {c.name[0]}
              </span>
            ))}
            <span className="-ml-1.5 grid size-7 place-items-center rounded-full bg-white/10 text-[10.5px] font-bold text-white/70 ring-2 ring-[#0E0E0F]">+6</span>
          </div>
          <span className="rounded-lg bg-white px-3 py-1.5 text-[12px] font-semibold text-black">Share</span>
        </div>
      </div>
      <div ref={wrap} aria-hidden className="relative aspect-[1040/560] overflow-hidden" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)", backgroundSize: "20px 20px" }}>
        <div ref={board} className="absolute left-0 top-0 origin-top-left" style={{ width: BW, height: BH }}>
          {/* 连线：照 uat 产品画布实测(2026-11-23)——
              线 #FF734D 2px 80%;彗星拖尾 2.4px,渐变从透明琥珀 #FFA53D 到 90% 的 #FF5254(就是 CTA 渐变);
              头部一团光晕 10px、25% #FF5254、高斯模糊 4;渐变用 userSpaceOnUse 每帧跟着彗星移动 */}
          <svg className="absolute inset-0" width={BW} height={BH} fill="none">
            <defs>
              <filter id="ent-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" />
              </filter>
              {EDGES.map((_, i) => (
                <g key={i}>
                  <linearGradient
                    id={`ent-comet-${i}`}
                    gradientUnits="userSpaceOnUse"
                    ref={(g) => {
                      comet.current[i].tg = g;
                    }}
                  >
                    <stop offset="0" stopColor="#FFA53D" stopOpacity="0" />
                    <stop offset="0.4" stopColor="#FF7F45" stopOpacity="0.47" />
                    <stop offset="0.8" stopColor="#FF5E4E" stopOpacity="0.77" />
                    <stop offset="1" stopColor="#FF5254" stopOpacity="0.9" />
                  </linearGradient>
                  <linearGradient
                    id={`ent-halo-${i}`}
                    gradientUnits="userSpaceOnUse"
                    ref={(g) => {
                      comet.current[i].gg = g;
                    }}
                  >
                    <stop offset="0" stopColor="#FF5254" stopOpacity="0" />
                    <stop offset="1" stopColor="#FF5254" stopOpacity="0.25" />
                  </linearGradient>
                </g>
              ))}
            </defs>
            {EDGES.map((e, i) => (
              <g key={i}>
                <path d={e.d} stroke="#FF734D" strokeOpacity="0.8" strokeWidth="2" />
                <path
                  d={e.d}
                  ref={(p) => {
                    comet.current[i].glow = p;
                  }}
                  stroke={`url(#ent-halo-${i})`}
                  strokeWidth="10"
                  strokeLinecap="round"
                  filter="url(#ent-glow)"
                  style={{ opacity: 0 }}
                />
                <path
                  d={e.d}
                  ref={(p) => {
                    comet.current[i].tail = p;
                  }}
                  stroke={`url(#ent-comet-${i})`}
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  style={{ opacity: 0 }}
                />
              </g>
            ))}
          </svg>
          <Node b={N.model} label="Model sheet" meta="Reference" img={`${D}/ref-model.jpg`} />
          <Node b={N.board} label="DRIFT board" meta="Reference" img={`${D}/ref-board.jpg`} />
          <Node b={N.bay} label="Location · the bay" meta="Reference" img={`${D}/ref-bay.jpg`} />
          <Node b={N.key} label="Key visual" meta="GPT Image 2.5" img={`${D}/key.jpg`} />
          <Node b={N.hero} label="Hero film" meta="Seedance 2.5 · 15s" img={`${D}/hero.jpg`} video={`${D}/hero.mp4`} />
          <Node b={N.tiktok} label="TikTok" meta="9:16" img={`${D}/tiktok.jpg`} video={`${D}/tiktok.mp4`} />
          <Node b={N.meta} label="Meta Reels" meta="4:5" img={`${D}/meta.jpg`} video={`${D}/meta.mp4`} selected={CURSORS[0]} />
          <Node b={N.youtube} label="YouTube" meta="16:9" img={`${D}/youtube.jpg`} video={`${D}/youtube.mp4`} />
          {/* 评论：钉在 YouTube 节点下面 */}
          <div className="absolute w-[150px] rounded-[12px] bg-[#1C1C1E] p-2.5 text-[11px] leading-[15px] shadow-[0_12px_30px_rgba(0,0,0,0.4)] ring-1 ring-white/10" style={{ left: 882, top: 392 }}>
            <p className="text-white/85">
              <b style={{ color: CURSORS[2].ink }}>Sofia</b> All three cuts are ready for review.
            </p>
            <p className="mt-1.5 flex items-center gap-1 text-white/85">
              <b style={{ color: CURSORS[0].ink }}>Maya</b> TikTok approved
              <Check className="size-3 text-[#5BD68A]" strokeWidth={3} />
            </p>
          </div>
          {/* 带名字的光标：彩色箭头 + 实色名牌(压在图上也看得清) */}
          {CURSORS.map((c, i) => (
            <div
              key={c.name}
              ref={(el) => {
                refs.current[i] = el;
              }}
              className="pointer-events-none absolute left-0 top-0 will-change-transform"
            >
              <svg width="16" height="16" viewBox="0 0 16 16">
                <path d="M1.5 1 L14 7.4 L8.4 9 L5.8 14.6 Z" fill={c.color} />
              </svg>
              <span className="absolute left-3.5 top-3.5 whitespace-nowrap rounded-md px-1.5 py-[2px] text-[11px] font-semibold text-black shadow-[0_2px_8px_rgba(0,0,0,0.35)]" style={{ background: c.color }}>
                {c.name} · {c.role}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const TEAM_FEATURES: { icon: typeof Plus; title: string; body: string }[] = [
  { icon: FolderOpen, title: "Shared projects and assets", body: "Projects, brand assets and every generation live in one workspace the whole team can open." },
  { icon: MousePointer2, title: "Review and approval", body: "Managers comment on any asset and approve it before it goes live, so nothing ships unchecked." },
  { icon: UsersRound, title: "Roles and permissions", body: "Owner, Admin, Billing Admin and Member, so each person sees what they need." },
  { icon: Palette, title: "Brand kits for every brand", body: "Logos, colors and fonts for each brand you run, so every ad, video and post stays on brand." },
  { icon: KeyRound, title: "SSO, SAML and audit log", body: "Sign in through your identity provider and export a full audit log of who did what." },
  { icon: ArrowRightLeft, title: "Ownership handover", body: "When someone leaves, an admin picks who inherits their projects. Nothing is deleted." },
];

function Teamwork({ onContact, first = false }: { onContact: () => void; first?: boolean }) {
  return (
    <section id="teamwork" aria-labelledby="teamwork-h" className={`scroll-mt-[90px] ${first ? "" : "py-10 md:py-12"}`}>
      <div className={WRAP_LIGHT}>
        <div className="rounded-[20px] border border-black/[0.08] bg-white p-6 md:rounded-[16px] md:p-10 lg:p-14">
          <div className="mb-8 flex flex-col items-start justify-between gap-5 md:mb-[46px] md:flex-row md:gap-[26px]">
            <div className="max-w-[560px]">
              <p className="mb-[18px] inline-flex rounded-[4px] border border-[#d7d3cb] px-3 py-2 text-[12px] font-semibold uppercase leading-[14px] tracking-[0.06em] text-[#232323]">Teamwork</p>
              <h2 id="teamwork-h" className="[font-family:var(--font-bricolage),sans-serif] text-[26px] font-semibold leading-[1.02] tracking-[-0.045em] [text-wrap:balance] lg:text-[clamp(30px,2.5vw,36px)]" style={{ color: INK }}>
                One project for every team, approved before it ships
              </h2>
              <p className="mt-4 text-[15px] leading-[1.5] text-[#240A03]/70">Teams across your company and your agencies work in the same project. Managers review every asset, leave notes and sign off before anything goes live.</p>
            </div>
            <button
              type="button"
              onClick={onContact}
              className="inline-flex h-[38px] shrink-0 items-center gap-2 rounded-[10px] px-[17px] text-[13px] font-semibold text-white transition-colors hover:bg-[#4a2a20] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF744D] focus-visible:ring-offset-2 md:mt-3"
              style={{ background: INK }}
            >
              Contact sales team <ArrowRight className="size-3.5" />
            </button>
          </div>
          <TeamCanvas />
          <ul className="mt-10 grid gap-x-10 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
            {TEAM_FEATURES.map((f) => (
              <li key={f.title} className="flex gap-3">
                <f.icon aria-hidden className="mt-0.5 size-5 shrink-0 text-[#FF744D]" strokeWidth={1.8} />
                <div>
                  <h3 className="[font-family:var(--font-bricolage),sans-serif] text-[16px] font-semibold tracking-[-0.01em]" style={{ color: INK }}>
                    {f.title}
                  </h3>
                  <p className="mt-1 text-[14px] leading-[1.45] text-[#240A03]/70">{f.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ── 作品墙(企业买家要看「做出来是什么样」;我们没有可公开的客户 logo,不编，放画布上做过的 12 个品牌示例片) ──
   来自 ~/Desktop/模板封面/<品牌>/成片.mp4(压成 640 宽 + 声音),品牌都是虚构的示例品牌。
   2026-11-23 Monica:全部自动播放、默认静音，点一下出声(同时只有一条出声);鼠标放上去跑马灯暂停，方便点。 */
const WORK = [
  { slug: "silkwave", brand: "Silkwave", kind: "Haircare" },
  { slug: "bobabloom", brand: "Boba Bloom", kind: "Bubble tea" },
  { slug: "deuce", brand: "DEUCE", kind: "Tennis wear" },
  { slug: "drift", brand: "DRIFT", kind: "Surfwear" },
  { slug: "goldenhourbakery", brand: "Golden Hour Bakery", kind: "Bakery" },
  { slug: "northline", brand: "Northline", kind: "Menswear" },
  { slug: "azurebay", brand: "Azure Bay", kind: "Resort" },
  { slug: "oasys", brand: "OASYS", kind: "Bottled water" },
  { slug: "pawsandbubbles", brand: "Paws & Bubbles", kind: "Pet grooming" },
  { slug: "pawsitivewalks", brand: "Pawsitive Walks", kind: "Dog walking" },
  { slug: "pulsefitness", brand: "Pulse Fitness", kind: "Gym" },
  { slug: "sparklehome", brand: "Sparkle Home", kind: "Home cleaning" },
];
function WorkWall() {
  /* 出声的那一条(跑马灯是 [...WORK, ...WORK] 两份，按渲染序号记) */
  const [voiced, setVoiced] = useState<number | null>(null);
  return (
    <section aria-labelledby="work-h" className="py-10 md:py-12">
      <div className={WRAP_LIGHT}>
        <h2 id="work-h" className="[font-family:var(--font-bricolage),sans-serif] text-[26px] font-semibold leading-[1.1] tracking-[-0.03em] lg:text-[32px]" style={{ color: INK }}>
          Made on BuzzVideo
        </h2>
        <p className="mt-3 max-w-[60ch] text-[15px] leading-[1.55] text-[#240A03]/70">Example campaigns for 12 brands across beauty, food, travel, fitness, fashion and services, each made on BuzzVideo. Tap a video to hear it.</p>
      </div>
      <div className="group/wall relative mt-8 overflow-hidden">
        <ul className="flex w-max gap-4 motion-safe:animate-[ent-drift_60s_linear_infinite] group-hover/wall:[animation-play-state:paused] group-focus-within/wall:[animation-play-state:paused]">
          {[...WORK, ...WORK].map((w, i) => (
            <WorkClip key={i} w={w} dup={i >= WORK.length} voiced={voiced === i} onToggle={() => setVoiced((v) => (v === i ? null : i))} />
          ))}
        </ul>
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#F6F6F6] to-transparent" />
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#F6F6F6] to-transparent" />
      </div>
    </section>
  );
}

function WorkClip({ w, dup, voiced, onToggle }: { w: (typeof WORK)[number]; dup: boolean; voiced: boolean; onToggle: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = !voiced;
    if (voiced) {
      v.currentTime = 0;
      v.play().catch(() => {});
    }
  }, [voiced]);
  const Icon = voiced ? Volume2 : VolumeX;
  return (
    <li aria-hidden={dup || undefined} className="w-[260px] shrink-0 md:w-[300px]">
      <button
        type="button"
        tabIndex={dup ? -1 : undefined}
        onClick={onToggle}
        aria-pressed={voiced}
        aria-label={`${w.brand} ${w.kind.toLowerCase()} video: ${voiced ? "mute" : "play with sound"}`}
        className={`relative block w-full overflow-hidden rounded-[14px] ring-1 transition-shadow duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF744D] ${voiced ? "ring-2 ring-[#FF744D] shadow-[0_12px_28px_-12px_rgba(255,116,77,0.55)]" : "ring-black/[0.06]"}`}
      >
        <video ref={ref} src={`/prototypes/site/enterprise/work/${w.slug}.mp4`} poster={`/prototypes/site/enterprise/work/${w.slug}.jpg`} autoPlay muted loop playsInline preload="metadata" className="aspect-video w-full object-cover" />
        <span className={`absolute bottom-2.5 right-2.5 grid size-8 place-items-center rounded-full backdrop-blur-sm transition-colors ${voiced ? "bg-[#FF744D] text-white" : "bg-black/45 text-white/90"}`}>
          <Icon aria-hidden className="size-4" />
        </span>
      </button>
      <p className="mt-2 flex items-baseline justify-between gap-2 px-0.5 text-[13px]">
        <span className="font-semibold" style={{ color: INK }}>
          {w.brand}
        </span>
        <span className="text-[#6F6C6C]">{w.kind}</span>
      </p>
    </li>
  );
}

/* ── 表单段左侧：三条成片轮播 + 底部三段进度条(OpenArt 的 contact-video-carousel) ── */
/* 2026-11-23 Monica:「这里不止去画布找，主要展示 9:16 的」→ 换成三条原生竖版成片(不裁切),三种格式各一:
   LUMEA 精华产品片 / BuzzRose 香水开箱 / BRIVO 会说话的汽水罐;铺满画框(Monica:「充满」),上下略裁。文件在 public/prototypes/site/tools/(都是 720×1280)。 */
const REEL = [
  { src: `${LOCAL}/product-ad.mp4`, poster: `${POSTER}/skill-product-ad.jpg`, label: "LUMEA vitamin C serum product video, vertical 9:16, made on BuzzVideo" },
  { src: `${LOCAL}/unboxing-ugc.mp4`, poster: `${POSTER}/skill-unboxing-ugc.jpg`, label: "BuzzRose perfume unboxing video, vertical 9:16, made on BuzzVideo" },
  { src: `${LOCAL}/talking-product.mp4`, poster: `${POSTER}/skill-talking-product.jpg`, label: "BRIVO sparkling drink talking-can video, vertical 9:16, made on BuzzVideo" },
];
function ContactReel() {
  const [cur, setCur] = useState(0);
  const [prog, setProg] = useState(0);
  const vids = useRef<(HTMLVideoElement | null)[]>([]);
  useEffect(() => {
    vids.current.forEach((v, i) => {
      if (!v) return;
      if (i === cur && !reduced()) {
        v.currentTime = 0;
        v.play().catch(() => {});
      } else v.pause();
    });
    setProg(0);
  }, [cur]);
  return (
    <div className="relative isolate size-full min-h-[640px] overflow-hidden rounded-[20px] bg-[#1C1C1C]">
      {REEL.map((r, i) => (
        <video
          key={r.src}
          ref={(el) => {
            vids.current[i] = el;
          }}
          src={r.src}
          poster={r.poster}
          muted
          playsInline
          preload={i === 0 ? "metadata" : "none"}
          aria-label={r.label}
          aria-hidden={i !== cur}
          onTimeUpdate={(e) => i === cur && setProg(e.currentTarget.currentTime / (e.currentTarget.duration || 1))}
          onEnded={() => i === cur && setCur((cur + 1) % REEL.length)}
          className={`absolute inset-0 z-[1] size-full object-cover transition-opacity duration-500 ${i === cur ? "opacity-100" : "opacity-0"}`}
        />
      ))}
      <div aria-hidden className="absolute inset-0 z-[2] bg-gradient-to-t from-black/35 via-transparent to-transparent" />
      <div className="absolute inset-x-6 bottom-6 z-[3] grid grid-cols-3 gap-2">
        {REEL.map((r, i) => (
          <button key={r.src} type="button" onClick={() => setCur(i)} aria-label={`Play video ${i + 1} of ${REEL.length}`} aria-current={i === cur} className="group block h-6 py-[9px] focus-visible:outline-none">
            <span className="block h-[3px] overflow-hidden rounded-full bg-white/50 group-hover:bg-white/80 group-focus-visible:ring-2 group-focus-visible:ring-white">
              <span className="block h-full rounded-full bg-white" style={{ width: `${i < cur ? 100 : i === cur ? prog * 100 : 0}%` }} />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── 销售表单 ── */
const SIZES = [
  { value: "", label: "Select company size" },
  { value: "1-10", label: "1–10 employees" },
  { value: "11-50", label: "11–50 employees" },
  { value: "51-200", label: "51–200 employees" },
  { value: "201-1000", label: "201–1,000 employees" },
  { value: "1000+", label: "More than 1,000 employees" },
] as const;
type Size = (typeof SIZES)[number]["value"];
const FREE_MAIL = /@(gmail|yahoo|hotmail|outlook|icloud|aol|proton|protonmail|qq|163)\./i;

function Field({ id, label, required, error, children }: { id: string; label: string; required?: boolean; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="block text-[13.5px] font-semibold" style={{ color: INK }}>
        {label}
        {required && <span className="text-[#D93A3F]"> *</span>}
      </label>
      <div className="mt-1.5">{children}</div>
      {error && (
        <p id={`${id}-err`} className="mt-1.5 text-[12.5px] font-medium text-[#D93A3F]">
          {error}
        </p>
      )}
    </div>
  );
}
const INPUT = "h-10 w-full rounded-lg border bg-white px-3 text-[14px] text-[#240A03] outline-none transition placeholder:text-[#8A8585] focus:border-[#FF744D] focus:ring-2 focus:ring-[#FF744D]/20";

function ContactForm({ a }: { a: Linker }) {
  const [f, setF] = useState({ first: "", last: "", company: "", title: "", email: "", use: "" });
  const [size, setSize] = useState<Size>("");
  const [err, setErr] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setF((p) => ({ ...p, [k]: e.target.value }));
    if (err[k]) setErr((p) => ({ ...p, [k]: "" }));
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const n: Record<string, string> = {};
    if (!f.first.trim()) n.first = "Enter your first name.";
    if (!f.last.trim()) n.last = "Enter your last name.";
    if (!f.company.trim()) n.company = "Enter your company name.";
    if (!size) n.size = "Choose your company size.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) n.email = "Enter a valid email address.";
    else if (FREE_MAIL.test(f.email)) n.email = "Use your business email so we can match you to your company.";
    setErr(n);
    if (Object.keys(n).length) {
      document.getElementById(`ent-${Object.keys(n)[0]}`)?.focus();
      return;
    }
    setSent(true);
  };
  const aria = (k: string) => ({ "aria-invalid": !!err[k] || undefined, "aria-describedby": err[k] ? `ent-${k}-err` : undefined });
  const border = (k: string) => (err[k] ? "border-[#D93A3F]" : "border-[#240A03]/15");

  if (sent)
    return (
      <div className="flex flex-1 flex-col justify-center py-10" role="status">
        <span className="grid size-12 place-items-center rounded-full bg-[#FFF3EC] text-[#FF744D]">
          <Check className="size-6" />
        </span>
        <h3 className="[font-family:var(--font-bricolage),sans-serif] mt-5 text-[26px] font-bold leading-tight" style={{ color: INK }}>
          Thanks, {f.first.trim()}.
        </h3>
        <p className="mt-3 max-w-[36ch] text-[15px] leading-[24px] text-[#6F6C6C]">
          Our sales team will reply to <span className="font-semibold text-[#240A03]">{f.email.trim()}</span> to book your demo and set up a free trial account for {f.company.trim()}.
        </p>
      </div>
    );

  return (
    <form noValidate onSubmit={submit} className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
      <Field id="ent-first" label="First name" required error={err.first}>
        <input id="ent-first" autoComplete="given-name" value={f.first} onChange={set("first")} className={`${INPUT} ${border("first")}`} {...aria("first")} />
      </Field>
      <Field id="ent-last" label="Last name" required error={err.last}>
        <input id="ent-last" autoComplete="family-name" value={f.last} onChange={set("last")} className={`${INPUT} ${border("last")}`} {...aria("last")} />
      </Field>
      <Field id="ent-company" label="Company" required error={err.company}>
        <input id="ent-company" autoComplete="organization" value={f.company} onChange={set("company")} className={`${INPUT} ${border("company")}`} {...aria("company")} />
      </Field>
      <Field id="ent-title" label="Job title">
        <input id="ent-title" autoComplete="organization-title" value={f.title} onChange={set("title")} className={`${INPUT} border-[#240A03]/15`} />
      </Field>
      <Field id="ent-size" label="Company size" required error={err.size}>
        <DropdownSelect
          label="Company size"
          value={size}
          onChange={(v) => {
            setSize(v);
            if (err.size) setErr((p) => ({ ...p, size: "" }));
          }}
          options={SIZES}
        />
      </Field>
      <Field id="ent-email" label="Business email" required error={err.email}>
        <input id="ent-email" type="email" autoComplete="email" inputMode="email" value={f.email} onChange={set("email")} placeholder="you@company.com" className={`${INPUT} ${border("email")}`} {...aria("email")} />
      </Field>
      <div className="sm:col-span-2">
        <Field id="ent-use" label="What will your team use BuzzVideo for?">
          <textarea
            id="ent-use"
            rows={4}
            value={f.use}
            onChange={set("use")}
            className={`${INPUT} h-auto resize-none border-[#240A03]/15 py-2.5 leading-[22px]`}
          />
        </Field>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2">
        <p className="text-[12.5px] text-[#6F6C6C]">
          By submitting, you agree to our{" "}
          <a {...a("Privacy Policy", "/privacy-policy")} className="underline underline-offset-2 hover:text-[#240A03]">
            Privacy Policy
          </a>
          .
        </p>
        <button
          type="submit"
          className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-6 text-[15px] font-semibold text-white shadow-[inset_0_-3px_0_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.3)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF744D] focus-visible:ring-offset-2"
        >
          Submit
        </button>
      </div>
    </form>
  );
}

export function EnterprisePage({ onLink }: { onLink: OnLink }) {
  const a = linker(onLink);
  const toForm = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: reduced() ? "auto" : "smooth" });
    window.setTimeout(() => document.getElementById("ent-first")?.focus({ preventScroll: true }), 600);
  };

  return (
    <main className="bg-black text-white">
      <style>{`@keyframes ent-drift{from{transform:translateX(0)}to{transform:translateX(-50%)}}@keyframes ent-flow{from{stroke-dashoffset:100}to{stroke-dashoffset:0}}`}</style>

      {/* ── 首屏：满屏背景视频 + 左对齐文字 ── */}
      <section className="relative isolate flex min-h-[min(90vh,680px)] items-center overflow-hidden pb-[72px] pt-28 md:min-h-[min(84vh,720px)] md:pb-[88px] md:pt-[136px] lg:min-h-[min(88vh,860px)] lg:pb-24 lg:pt-44">
        <div className="absolute inset-0 -z-10">
          <Loop src={HERO.src} srcMobile={HERO.srcMobile} poster={HERO.poster} label="Giant BuzzVideo products in a basketball court, a city street, a beach, a mall and over a river, made on BuzzVideo" className="object-[43%_40%] md:object-[54%_45%] lg:object-[58%_50%]" />
          {/* OpenArt 的三层遮罩：右缘一道、左侧文字区一道、上下各一道 */}
          <div
            aria-hidden
            className="absolute inset-0 hidden lg:block"
            style={{
              background:
                "linear-gradient(90deg,#0000 0% 76%,#0000006b 90%,#000),linear-gradient(90deg,#000 0% 28%,#000000c7 48%,#0000006b 68%,#0000 90%),linear-gradient(180deg,#000,#000000c7 10%,#0000 30% 72%,#000000b8 91%,#000)",
            }}
          />
          <div
            aria-hidden
            className="absolute inset-0 lg:hidden"
            style={{ background: "linear-gradient(90deg,#0000 0% 76%,#0000006b 92%,#000),linear-gradient(180deg,#000,#000000b8 12%,#0000006b 30%,#000000a8 62%,#000 96%)" }}
          />
        </div>

        <div className="w-full px-6 md:px-14">
          <div className="relative top-16 mx-auto grid max-w-[1648px] justify-items-center gap-7 text-center md:top-11 md:justify-items-start md:gap-12 md:text-left lg:top-[52px]">
            <div className="grid max-w-[980px] gap-2.5 md:gap-4">
              <h1 className="[font-family:var(--font-bricolage),sans-serif] max-w-[560px] text-[50px] font-semibold leading-[0.98] tracking-[-2.2px] [text-wrap:balance] bg-[linear-gradient(180deg,#fff_34%,#ffffff7a)] bg-clip-text text-transparent [-webkit-text-fill-color:transparent] md:max-w-[820px] md:text-[68px] md:leading-[0.96] md:tracking-[-4px] lg:max-w-[980px] lg:text-[96px] lg:tracking-[-5px]">
                {/* SEO:H1 里带品牌和产品名;视觉上是一行小字 */}
                <span className="mb-4 flex justify-center md:mb-6 md:justify-start">
                  {/* 纯文字字标放进细边框胶囊：不放 logo 图标和竖线(Monica 2026-11-24)。不用全大写宽字距小字(AI 味) */}
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/[0.06] px-4 py-2 font-sans text-[15px] font-medium leading-none tracking-[-0.01em] backdrop-blur-sm [-webkit-text-fill-color:#fff] md:px-5 md:py-2.5 md:text-[17px]">
                    BuzzVideo Enterprise
                  </span>
                </span>{" "}
                <span className="[-webkit-text-fill-color:#FF744D]">Scale</span>
                {" "}your team&apos;s creative production
              </h1>
              <p className="mt-2.5 max-w-[620px] text-[18px] font-medium leading-[27px] tracking-[-0.4px] text-[#eeedf0]/[0.78] md:mt-5 md:text-[20px] md:leading-[30px]">
                Ads, product videos, social posts, training and brand films. Give every team in your company the leading AI models, an AI agent and the controls to run it all in one place.
              </p>
            </div>
            <div className="flex w-full flex-col items-center gap-3 md:w-auto md:flex-row">
              <button
                type="button"
                onClick={toForm}
                className="inline-flex h-14 w-[min(100%,360px)] items-center justify-center rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-11 text-[18px] font-semibold text-white shadow-[inset_0_-4px_0_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.3)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black md:w-auto"
              >
                Contact sales team
              </button>
              <a
                {...a("Pricing", "/pricing")}
                className="inline-flex h-14 w-[min(100%,360px)] items-center justify-center rounded-xl px-8 text-[18px] font-semibold text-white shadow-[inset_0_0_0_1.5px_rgba(255,255,255,0.72)] transition hover:bg-white/10 hover:shadow-[inset_0_0_0_1.5px_#fff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:w-auto"
              >
                Enterprise pricing
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── 三张支柱卡：压在首屏和浅底的接缝上(往下压 150px) ── */}
      <div className="relative z-[2] mx-auto mb-4 grid w-[calc(100%-32px)] max-w-[1648px] gap-3 py-6 md:-mb-[150px] md:w-[calc(100%-112px)] md:grid-cols-2 md:gap-4 md:py-8 lg:grid-cols-4">
        {PILLARS.map((p) => (
          <a
            key={p.key}
            href={`#${p.key}`}
            className="group block min-w-0 self-start overflow-hidden rounded-[26px] border border-white/[0.04] bg-white/[0.043] text-[#c5c5c5] transition-colors hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <div className="flex min-h-24 items-center justify-between gap-3 px-[22px] py-5 md:min-h-[104px] md:gap-5 md:px-7">
              <PillarIcon kind={p.key} />
              <p className="[font-family:var(--font-bricolage),sans-serif] text-right text-[28px] font-semibold uppercase leading-[1.2] text-[#c5c5c5] lg:text-[clamp(28px,2vw,34px)]">{p.tag}</p>
            </div>
            <div className="flex items-end px-[22px] pb-6 pt-5 md:min-h-24 md:px-7 md:pt-3">
              <p className="text-[16px] leading-[1.45] text-[#969696] group-hover:text-[#dedede] lg:text-[clamp(16px,1.15vw,18px)]">{p.body}</p>
            </div>
          </a>
        ))}
      </div>

      {/* ── 浅底：接缝渐变(200px 由黑到浅灰)+ 三张分段卡 ── */}
      <div
        className="pb-10 pt-[104px] md:pt-[166px]"
        style={{ background: "linear-gradient(180deg,#000 0,#000 20px,#101011 44px,#181818 72px,#2a2a28 100px,#525250 128px,#8a8a88 152px,#bdbdbc 172px,#dededd 188px,#F6F6F6 200px,#F6F6F6 100%)" }}
      >
        {/* 2026-11-23 Monica:Teamwork 第一、Intuitive 第二、Trusted 第三、Powerful 第四 */}
        {/* 定义句放在最后 FAQ 第一条(默认展开)+ meta / 结构化数据里;Monica 2026-11-23:单独一段不美观 */}
        <div className="md:mt-6">
          <Teamwork first onContact={toForm} />
        </div>
        {/* 顺序(Monica 2026-11-23):Teamwork → Intuitive → Trusted → Powerful,配图左右交替 */}
        <Feature id="intuitive" tag="Intuitive" title="A tool your whole company will actually use" points={INTUITIVE} media={<AgentCard />} flip onContact={toForm} a={a} />
        <Feature id="trusted" tag="Trusted" title="Built for companies with compliance requirements" points={TRUSTED} media={<AdminCard />} onContact={toForm} a={a} />
        <Feature id="powerful" tag="Powerful" title="Everything your team needs to create at scale" points={POWERFUL} media={<VendorWall />} flip onContact={toForm} a={a} />
        <WorkWall />
      </div>

      {/* ── 表单段 ── */}
      <section id="contact" aria-labelledby="contact-h" className="scroll-mt-[90px] border-t border-[#dededb] bg-[#F6F6F6] pb-10 pt-6 md:pb-14 md:pt-10">
        <div className={WRAP_LIGHT}>
          <div className="rounded-[24px] border border-[#dededb] bg-white p-2 shadow-[0_16px_48px_rgba(23,23,31,0.08)]">
            <div className="grid min-w-0 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)]">
              <div className="hidden min-w-0 p-3 lg:flex">
                <ContactReel />
              </div>
              <div className="flex min-w-0 p-3">
                <div className="flex flex-1 flex-col rounded-[20px] bg-[#F6F6F6] p-6 sm:p-8">
                  <h2 id="contact-h" className="[font-family:var(--font-bricolage),sans-serif] text-[30px] font-bold leading-[1.1] tracking-[-0.02em] md:text-[32px]" style={{ color: INK }}>
                    Contact our team
                  </h2>
                  <p className="mb-7 mt-3 max-w-[48ch] text-[15px] leading-[24px] text-[#6F6C6C]">Book a demo and get a free trial account for your team. Tell us a little about what your team creates and we&apos;ll set it up.</p>
                  <ol className="-mt-3 mb-7 grid gap-2 sm:grid-cols-3">
                    {["Book a demo", "Get a free trial account", "Onboarding and training"].map((t, i) => (
                      <li key={t} className="flex items-center gap-2.5 rounded-[12px] bg-white px-3 py-2.5 text-[13.5px] font-semibold ring-1 ring-inset ring-black/[0.06]" style={{ color: INK }}>
                        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#FFF3EC] text-[12px] font-bold text-[#FF744D]">{i + 1}</span>
                        {t}
                      </li>
                    ))}
                  </ol>
                  <ContactForm a={a} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ(GEO:问答最容易被 AI 搜索引用;和 FAQPage 结构化数据同一份内容) ── */}
      <section id="faq" aria-labelledby="faq-h" className="scroll-mt-[90px] bg-[#F6F6F6] pb-10 pt-2 md:pb-14">
        <div className={WRAP_LIGHT}>
          <div className="grid gap-8 rounded-[20px] border border-black/[0.08] bg-white p-6 md:rounded-[16px] md:p-10 lg:grid-cols-[minmax(0,0.38fr)_minmax(0,0.62fr)] lg:gap-[clamp(36px,6vw,76px)] lg:p-14">
            <div>
              <p className="mb-[18px] inline-flex rounded-[4px] border border-[#d7d3cb] px-3 py-2 text-[12px] font-semibold uppercase leading-[14px] tracking-[0.06em] text-[#232323]">FAQ</p>
              <h2 id="faq-h" className="[font-family:var(--font-bricolage),sans-serif] text-[26px] font-semibold leading-[1.02] tracking-[-0.045em] lg:text-[clamp(30px,2.5vw,36px)]" style={{ color: INK }}>
                Frequently asked questions
              </h2>
              <p className="mt-4 text-[14.5px] leading-[1.5] text-[#240A03]/70">
                More answers in the{" "}
                <a {...a("FAQ", "/faq")} className="font-semibold underline decoration-[#240A03]/25 underline-offset-[3px] hover:decoration-[#FF744D]" style={{ color: INK }}>
                  FAQ
                </a>{" "}
                and{" "}
                <a {...a("Help Center", "/help")} className="font-semibold underline decoration-[#240A03]/25 underline-offset-[3px] hover:decoration-[#FF744D]" style={{ color: INK }}>
                  Help Center
                </a>
                , or ask our team above.
              </p>
            </div>
            <div className="divide-y divide-black/[0.08] border-y border-black/[0.08]">
              {ENT_FAQ.map((f, i) => (
                <details key={f.q} className="group py-1" open={i === 0}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[16px] font-semibold [&::-webkit-details-marker]:hidden" style={{ color: INK }}>
                    <h3 className="[font-family:var(--font-bricolage),sans-serif] tracking-[-0.01em]">{f.q}</h3>
                    <Plus aria-hidden className="size-4 shrink-0 text-[#240A03]/50 transition-transform duration-200 group-open:rotate-45" />
                  </summary>
                  <p className="pb-5 pr-8 text-[14.5px] leading-[1.6] text-[#240A03]/75">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <JsonLd
        data={[
          { "@context": "https://schema.org", "@type": "WebPage", name: "BuzzVideo Enterprise", url: "https://buzzvideo.ai/enterprise", description: ENT_DEFINITION, publisher: ORG },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://buzzvideo.ai/" },
              { "@type": "ListItem", position: 2, name: "Enterprise", item: "https://buzzvideo.ai/enterprise" },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "BuzzVideo Enterprise",
            applicationCategory: "MultimediaApplication",
            operatingSystem: "Web",
            url: "https://buzzvideo.ai/enterprise",
            description: ENT_DEFINITION,
            publisher: ORG,
            offers: { "@type": "Offer", url: "https://buzzvideo.ai/enterprise#contact", availability: "https://schema.org/InStock", description: "Custom pricing for teams. Contact sales for a quote and a free trial account." },
          },
          faqLd(ENT_FAQ),
        ]}
      />
    </main>
  );
}
