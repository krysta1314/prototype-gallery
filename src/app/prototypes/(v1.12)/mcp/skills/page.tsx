"use client";

/* BuzzVideo MCP Skills 列表页：1:1 复刻 higgsfield.ai/zh/skills(2026-11-02 量取)。
   尺寸、间距、字体(Inter + Space Grotesk)、颜色 token 都照原页;品牌色把它的荧光绿换成 Buzz 橙，
   第三方产品的 logo 换成通用图标。结构：3D 图标扇 + 标题 → 三栏接入卡 → How it works(对话 + 结果)
   → 技能库(左侧分类、右侧两列卡片)→ 模型墙 → FAQ。点卡片进 [slug] 详情页。 */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Bookmark,
  CircleCheck,
  Forward,
  Heart,
  MessageCircle,
  Music2,
  Play,
  Plus,
  AudioLines,
  Box,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Clapperboard,
  Clock,
  Copy,
  Film,
  Flame,
  ImageIcon,
  Megaphone,
  Radar,
  RectangleVertical,
  RotateCcw,
  Scissors,
  Search,
  ShoppingBag,
  ThumbsDown,
  ThumbsUp,
  UserRound,
  Volume2,
  X,
} from "lucide-react";
import { useToast } from "@/app/prototypes/(v1.7)/blog/toast";
import { CATEGORIES, CATEGORY_NOTE, MCP_URL, SKILLS, chatgptUrl, claudeUrl, mediaSrc, type Category, type Skill } from "./data";
import { BuzzLogo, ClaudeGlyph, Footer, grotesk, Nav, OpenAiGlyph, SetupSteps, SkillMedia, openNew, useReducedMotion } from "./ui";

/* 原页 token(--color-*),品牌色换成 Buzz 橙 */
const C = {
  page: "#131517",
  surface: "#222222", // neutral-surface-subtle:对话 / 结果面板
  cardOverlay: "#1c1e20", // surface-primary:卡片悬停渐变底
  secondary: "#898a8b", // font-secondary
  brand: "#ff6a2b", // 原页 #d1fe17
  claude: "#dc6f4c", // Claude 品牌色：只用于大字(标题里的 CLAUDE)
  claudeBtn: "#b8532f", // 按钮底色压暗一档，白字对比度 4.9:1
};

const H2 = `${grotesk.className} font-bold uppercase leading-8 tracking-[-0.06rem] text-center text-white [text-wrap:balance] text-[1.75rem] sm:text-[2rem] sm:leading-9 sm:tracking-[-0.08rem]`;

type Filter = "Featured" | Category;

const CAT_ICON: Record<Filter, typeof Megaphone> = {
  Featured: Flame,
  Ads: Megaphone,
  UGC: UserRound,
  "E-commerce": ShoppingBag,
  "Video tools": Scissors,
  Stories: Clapperboard,
  "3D": Box,
  Research: Radar,
};

/* How it works 的分类标签：每个挑一条 Skill,配上对话里工具卡片显示的参数 */
type DemoRef = { kind: "video" | "image"; src: string; label: string };
/* 一个演示放多条成片时，结果区左右滑动;id 对应 TIKTOK 里的账号和 avatar-<id>.jpg */
type DemoSlide = { id: string; video: string; poster: string };
/* ask / refs:演示里用户那条消息的原话和附件;不填就用 Skill 自己的提示词 */
const DEMOS: { key: string; label: string; icon: typeof Megaphone; slug: string; chips: [string, string, string]; ask?: string; refs?: DemoRef[]; split?: [string, string]; slides?: DemoSlide[] }[] = [
  {
    key: "ads",
    label: "Marketing",
    icon: Megaphone,
    slug: "viral-remix",
    chips: ["Seedance 2.0", "9:16", "15s"],
    /* 原版爆款取自用例库同一模板「Secret Hack Reveal」的另一条;产品图从成片里裁出那块砧板 */
    ask: "Recreate this viral reel shot by shot with my cutting board: same hook, pacing, camera moves and transitions.",
    refs: [
      { kind: "video", src: "https://assets.presslogic.com/cdn-cgi/image/width=160,quality=80,format=auto/buzzvideo/public/2026-07-31/341460464733052928.jpg", label: "Viral reel" },
      { kind: "image", src: "/prototypes/mcp-skill-showcase/ref-viral-remix-product.jpg", label: "board.jpg" },
    ],
  },
  {
    key: "3d",
    label: "3D Studio",
    icon: Box,
    slug: "3d-director",
    chips: ["Seedance 2.5", "16:9", "32s"],
    /* 用 3D Studio 宣讲片的素材：上半白模编舞、下半 AI 真人版，四个镜头拼成一条，上下逐帧同步 */
    ask: "Choreograph a 4-member K-pop girl group on a neon stage. Block the dance in 3D first, then render the same moves photoreal.",
    split: ["3D blockout", "AI render"],
  },
  {
    key: "edit",
    label: "Video Editing",
    icon: Scissors,
    slug: "video-editor",
    chips: ["Auto edit", "9:16", "15s"],
    /* 实拍素材：Pexels 同一摄影师(Pavel Danilyuk)同一模特的五段，可免费商用、免署名;本地剪成带字幕的 Day in my life */
    ask: "Cut my clips into a 15-second day-in-my-life Reel with captions.",
    refs: [
      { kind: "video", src: "/prototypes/mcp-skill-showcase/ref-video-editor-clip1.jpg", label: "clip_01.mov" },
      { kind: "video", src: "/prototypes/mcp-skill-showcase/ref-video-editor-clip2.jpg", label: "clip_02.mov" },
      { kind: "video", src: "/prototypes/mcp-skill-showcase/ref-video-editor-clip3.jpg", label: "+3 more" },
    ],
  },
  {
    key: "faceless",
    label: "Faceless Video",
    icon: Clapperboard,
    slug: "faceless-explainer",
    chips: ["Seedance 2.5", "9:16", "20s"],
    /* 欧美 faceless 最热的两个赛道：理财、心理学冷知识;两条都是 dev 环境实际生成 */
    ask: "Make two 20-second faceless explainers for my channel: one on money habits, one on psychology.",
    slides: [
      { id: "faceless-money", video: "/prototypes/mcp-skill-showcase/faceless-money.mp4", poster: "/prototypes/mcp-skill-showcase/faceless-money.jpg" },
      { id: "faceless-brain", video: "/prototypes/mcp-skill-showcase/faceless-brain.mp4", poster: "/prototypes/mcp-skill-showcase/faceless-brain.jpg" },
    ],
  },
  {
    key: "ecom",
    label: "E-commerce",
    icon: ShoppingBag,
    slug: "product-ad",
    chips: ["AI video", "9:16", "15s"],
    /* Aurelia 是我们虚构的护肤品牌：产品图来自 Hybrid Reel 宣传片素材，成片是 Monica 做过的 9:16 版 */
    ask: "Turn my product photo into a 15-second Reels ad.",
    refs: [{ kind: "image", src: "/prototypes/mcp-skill-showcase/ref-product-ad.jpg", label: "aurelia.jpg" }],
  },
  {
    key: "ugc",
    label: "UGC",
    icon: UserRound,
    slug: "ugc-product-review",
    chips: ["AI video", "9:16", "15s"],
    refs: [{ kind: "image", src: "/prototypes/mcp-skill-showcase/ref-ugc-product-review.jpg", label: "neck-fan.jpg" }],
  },
];

/* 模型墙：用产品里各模型自己的示例作品(uat-app.buzzvideo.ai/usecase/<模型>),名字和 list_models 一致 */
const CDN = "https://assets.presslogic.com/buzzvideo/";
/* Seedance 四张直接用官网 buzzvideo.ai/mcp「Explore more AI models」的素材;其余是新上的模型，用各自在产品里的示例 */
const MODELS: { name: string; kind: "video" | "image" | "audio"; poster: string; video?: string }[] = [
  { name: "Seedance 2.5", kind: "video", poster: "static/landing/mcp/345831915154104320.poster.jpg", video: "static/landing/mcp/345831915154104320.mp4" },
  { name: "Kling 4.0", kind: "video", poster: "public/2026-10-29/374069432101691392.jpg", video: "public/2026-10-29/374069257685753856.mp4" },
  { name: "MiniMax H3 Max", kind: "video", poster: "public/2026-09-11/356665162171736064.jpg", video: "public/2026-09-11/356665064461230080.mp4" },
  { name: "Seedance 2.0", kind: "video", poster: "static/landing/mcp/340778900600709120.poster.jpg", video: "static/landing/mcp/340778900600709120.mp4" },
  { name: "Gemini Omni Flash", kind: "video", poster: "public/2026-07-03/331317882648584192.jpg" },
  { name: "Seedance 2.0 Fast", kind: "video", poster: "static/landing/mcp/340778056568332288.poster.jpg", video: "static/landing/mcp/340778056568332288.mp4" },
  { name: "Seedance 2.0 Mini", kind: "video", poster: "static/landing/mcp/340788772281049088.poster.jpg", video: "static/landing/mcp/340788772281049088.mp4" },
  { name: "GPT Image 2.5", kind: "image", poster: "public/2026-10-13/368291667893084160.jpg", video: "public/2026-09-11/356666546531131392.mp4" },
  { name: "Nano Banana 2.1", kind: "image", poster: "public/2026-10-10/367215493842526208.jpg", video: "public/2026-10-10/367214924906160128.mp4" },
  { name: "Seedream 5.0 Pro", kind: "image", poster: "public/2026-07-10/333842466765594624.jpg" },
];
const KIND_ICON = { video: Film, image: ImageIcon, audio: AudioLines };

const FAQ: { q: string; a: string }[] = [
  {
    q: "How does BuzzVideo connect to my AI assistant?",
    a: "Through MCP (Model Context Protocol), the open standard assistants use to call outside tools. Once connected, your assistant can write scripts, generate images and videos, edit, and save everything to your BuzzVideo Assets in the same chat.",
  },
  {
    q: "Which assistants are supported?",
    a: "Claude (web and desktop) as a custom connector, and ChatGPT as a plugin. Any other assistant or client that supports MCP can connect with the same URL.",
  },
  {
    q: "Which models can it use?",
    a: "Every model in BuzzVideo, including Seedance, Kling, Veo, Wan, GPT Image, Nano Banana and Seedream. The skill picks the right one for each shot, or you can name one yourself.",
  },
  {
    q: "What can I make?",
    a: "Ads, UGC, product photos and videos, short dramas, explainers, 3D product shots and more. Start from a text prompt, your own photos and footage, or both.",
  },
  {
    q: "Do I need an API key?",
    a: "No. Add the BuzzVideo connector in your assistant and sign in with your BuzzVideo account. There are no keys to manage.",
  },
  {
    q: "How is it priced?",
    a: "It uses the same credits as BuzzVideo. Before anything is generated, the assistant shows you the plan and the credit estimate and waits for your go-ahead.",
  },
  {
    q: "How long does a video take?",
    a: "Images take seconds. Videos take a few minutes, depending on length and model. Generation runs in the background and your assistant checks back until the file is ready.",
  },
  {
    q: "Can I reuse what I made before?",
    a: "Yes. Everything is saved to your BuzzVideo Assets, and any past image or video can be the starting point for a new one.",
  },
];

export default function SkillsIndex() {
  const [notify, toastNode] = useToast();

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify("Copied");
    } catch {
      notify("Couldn't copy. Select the text and copy it manually.", "error");
    }
  };

  return (
    <div className={`min-h-screen font-sans text-[#f7f7f8] antialiased`} style={{ background: C.page }}>
      {toastNode}
      <Nav />
      <main>
        <Hero onCopy={copy} />
        <HowItWorks />
        <SkillLibrary />
        <ModelWall />
        <Faq />
      </main>
      <Footer />
    </div>
  );
}

/* ───────── 首屏 + 接入卡 ───────── */

function Hero({ onCopy }: { onCopy: (t: string) => void }) {
  return (
    <section className="relative mx-auto w-full max-w-[1440px] overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[34rem]"
        style={{ background: `radial-gradient(32% 28% at 50% 21.875rem, ${C.page} 0%, rgba(19,21,23,0.85) 45%, transparent 100%)` }}
      />
      <div className="relative z-[2] mx-auto flex max-w-[86rem] flex-col items-center px-6 pb-16 pt-24 md:pt-20">
        <header className="flex flex-col items-center text-center">
          <IconFan />
          <h1 className={`${grotesk.className} mt-6 text-[3rem] font-bold uppercase leading-[3.5rem] tracking-[-0.12rem] md:text-[2.5rem] md:leading-[3rem] md:tracking-[-0.1rem]`} style={{ color: C.brand }}>
            BuzzVideo skills for any AI
          </h1>
          <p className="mt-3 max-w-[40rem] text-[16px] leading-6 text-white/60 [text-wrap:balance]">
            Connect BuzzVideo once. Then ask Claude or ChatGPT for ads, UGC and product videos, and get the finished file back in the chat.
          </p>
        </header>

        <div className="mt-10 flex w-full flex-col gap-5 md:mt-[3.75rem]">
          <div id="setup" className="scroll-mt-24">
            <SetupSteps onCopy={onCopy} />
          </div>
          <div className="relative isolate">
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 -z-[1] h-16 w-[80rem] max-w-full -translate-x-1/2 -translate-y-1/2"
              style={{ background: "radial-gradient(ellipse at center, #131416 0%, rgba(19,20,22,0.85) 42%, transparent 72%)" }}
            />
            <div className="flex flex-wrap items-center justify-center gap-2.5 px-3 text-[12px] font-medium leading-[18px] text-white">
              <button onClick={() => onCopy(MCP_URL)} className="inline-flex min-h-8 items-center gap-1 underline-offset-4 transition-colors hover:underline">
                Using another MCP client? Copy the connector URL
                <Copy className="size-3" />
              </button>
              <span className="hidden h-2 w-px shrink-0 bg-white/[0.08] sm:block" />
              <Link href="#faq" className="inline-flex min-h-8 items-center gap-1 underline-offset-4 hover:underline">
                FAQ <ArrowUpRight className="size-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* 首屏徽标：只放真实接得上的三方(ChatGPT / BuzzVideo / Claude),不拿通用图标凑数 */
function IconFan() {
  const tiles: { x: number; ry: number; s: number; node: React.ReactNode; bg: string }[] = [
    { x: -4.6, ry: 38, s: 0.84, bg: "#f4f4f5", node: <OpenAiGlyph className="size-[4.25rem] text-[#131517]" /> },
    { x: 4.6, ry: -38, s: 0.84, bg: "#f3eee6", node: <ClaudeGlyph className="size-[4.25rem]" /> },
    { x: 0, ry: 0, s: 1, bg: "#1d1e22", node: <BuzzLogo className="size-[5.25rem]" /> },
  ];
  return (
    <div aria-hidden className="relative h-[5.5rem] w-[13rem]" style={{ perspective: "40rem" }}>
      {tiles.map((t, i) => (
        <div
          key={i}
          className="absolute left-1/2 top-1/2 flex size-[7.5rem] items-center justify-center rounded-[1.75rem] ring-1 ring-inset ring-white/10"
          style={{
            background: t.bg,
            transform: `translate(calc(-50% + ${t.x}rem), -50%) rotateY(${t.ry}deg) scale(${t.s * 0.72})`,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25), 0 14px 28px -8px rgba(0,0,0,0.55)",
          }}
        >
          {t.node}
        </div>
      ))}
    </div>
  );
}

/* ───────── How it works:左对话、右结果 ───────── */

function HowItWorks() {
  const [tab, setTab] = useState(DEMOS[0].key);
  const d = DEMOS.find((x) => x.key === tab)!;
  const s = SKILLS.find((x) => x.slug === d.slug)!;
  return (
    <section className="relative mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-6 py-12 lg:py-20">
      <div className="flex w-full flex-col gap-5">
        <h2 className={H2}>How does MCP work?</h2>
        <div className="w-full min-w-0">
          <div role="tablist" className="mx-auto flex w-full min-w-0 items-center overflow-x-auto rounded-full border border-white/5 bg-white/5 p-1.5 [scrollbar-width:none] sm:w-max sm:max-w-full">
            {DEMOS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={`flex h-8 shrink-0 items-center justify-center rounded-full px-2 py-1 text-[12px] font-medium leading-4 transition-colors duration-150 motion-reduce:transition-none ${
                  tab === key ? "bg-white text-[#1b1b1b]" : "text-white/50 hover:text-white/75"
                }`}
              >
                <Icon className="size-4 shrink-0" />
                <span className="px-1">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <DemoPanel key={d.key} s={s} chips={d.chips} ask={d.ask} refs={d.refs} split={d.split} slides={d.slides} />
    </section>
  );
}

/* 成片统一套一层 TikTok 播放页蒙版(横版片照 TikTok 的样子居中、上下黑边)(右侧点赞栏、底部账号与文案、音乐条),让人一眼看出「这就是能直接发的成片」;纯装饰，不拦点击。
   每条示例按真实发帖写：账号、文案、话题、原声名和互动数；头像和唱片用成片里裁出的小图(人像博主裁脸，品牌号裁产品) */
const TIKTOK: Record<string, { handle: string; caption: string; sound: string; counts: [string, string, string, string] }> = {
  "viral-remix": {
    handle: "oakandgrain.home",
    caption: "3 years of daily chopping and still zero knife marks. end-grain walnut hits different #kitchentok #cuttingboard #homecook",
    sound: "original sound - Oak & Grain",
    counts: ["48.2K", "612", "3,109", "1,027"],
  },
  "video-editor": {
    handle: "nora.wfh",
    caption: "slow mornings are my whole personality now. wfh edition, part 12 #dayinmylife #wfh #morningroutine",
    sound: "original sound - nora",
    counts: ["74.8K", "1,163", "9,402", "2,318"],
  },
  "product-ad": {
    handle: "aurelia.skinrituals",
    caption: "golden hour, but make it skincare. our brightening serum + regenerating cream duo is back in stock #skincare #glowup #skintok",
    sound: "original sound - Aurelia Skin Rituals",
    counts: ["36.9K", "421", "4,876", "812"],
  },
  "ugc-product-review": {
    handle: "jules.outside",
    caption: "nyc summer survival item #1. this neck fan is the only reason I'm not melting on my commute #summerhacks #nycsummer #honestreview",
    sound: "original sound - jules",
    counts: ["128.4K", "1,204", "8,532", "2,140"],
  },
  "3d-director": {
    handle: "ethan.builds.ai",
    caption: "I blocked this whole k-pop stage in 3D, then let AI render it. same choreography, frame for frame. workflow in comments #aitools #3danimation #techtok",
    sound: "original sound - Ethan Builds AI",
    counts: ["186.3K", "4,912", "38.7K", "9,845"],
  },
  "short-drama": {
    handle: "midnightreels",
    caption: "ep 1: he was built to sweep the old cinema. then the screen turned on by itself... part 2 tomorrow #microdrama #scifi #shortfilm",
    sound: "original sound - Midnight Reels",
    counts: ["214.9K", "5,836", "19.2K", "7,410"],
  },
  "faceless-money": {
    handle: "moneyinminutes",
    caption: "got a raise and still broke? it's not you, it's lifestyle creep. one fix that actually works #moneytok #personalfinance #savingmoney",
    sound: "original sound - Money in Minutes",
    counts: ["241.6K", "3,982", "57.3K", "18.4K"],
  },
  "faceless-brain": {
    handle: "brainfacts.daily",
    caption: "why your brain replays that one embarrassing moment at 2am, and how to make it stop #psychology #brainfacts #overthinking",
    sound: "original sound - Brain Facts Daily",
    counts: ["188.9K", "6,215", "44.1K", "11.7K"],
  },
};

function TikTokOverlay({ s, id }: { s: Skill; id?: string }) {
  const key = id ?? s.slug;
  const t = TIKTOK[key];
  if (!t) return null;
  const pic = `/prototypes/mcp-skill-showcase/avatar-${key}.jpg`;
  const rail = [Heart, MessageCircle, Bookmark, Forward];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.35)]">
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/45 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
      <div className="absolute inset-x-0 top-3.5 flex items-center justify-center gap-4 text-[14px] font-semibold">
        <span className="text-white/65">Following</span>
        <span className="relative">
          For You
          <span className="absolute -bottom-1.5 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-white" />
        </span>
      </div>
      <div className="absolute bottom-16 right-2 flex flex-col items-center gap-3.5 [filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.45))_drop-shadow(0_0_6px_rgba(0,0,0,0.25))]">
        <span className="relative mb-2 block size-10 rounded-full ring-2 ring-white">
          <img src={pic} alt="" className="size-full rounded-full object-cover" />
          <span className="absolute -bottom-2 left-1/2 flex size-[1.125rem] -translate-x-1/2 items-center justify-center rounded-full bg-[#fe2c55]">
            <Plus className="size-3" strokeWidth={3} />
          </span>
        </span>
        {rail.map((Icon, i) => (
          <span key={i} className="flex flex-col items-center gap-0.5">
            <Icon className={`size-7 drop-shadow ${i === 0 ? "text-[#fe2c55]" : ""}`} fill="currentColor" strokeWidth={i === 0 ? 0 : 1.5} />
            <span className="text-[11px] font-semibold">{t.counts[i]}</span>
          </span>
        ))}
        <span className="mt-1 flex size-9 animate-[spin_6s_linear_infinite] items-center justify-center rounded-full bg-[conic-gradient(#1f1f1f,#4a4a4a,#1f1f1f)] motion-reduce:animate-none">
          <img src={pic} alt="" className="size-5 rounded-full object-cover" />
        </span>
      </div>
      <div className="absolute bottom-4 left-3 right-16 flex flex-col gap-1.5 [filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.4))]">
        <span className="text-[14px] font-bold">@{t.handle}</span>
        <p className="line-clamp-2 text-[13px] leading-[1.35]">{t.caption}</p>
        <span className="flex items-center gap-1.5 text-[12px]">
          <Music2 className="size-3.5 shrink-0" />
          <span className="truncate">{t.sound}</span>
        </span>
      </div>
    </div>
  );
}

/* 多条成片：横向吸附滚动，可以手指滑、触控板横滑，也可以点两侧箭头;只播当前这条，底部圆点标出第几条 */
function SlideStack({ s, slides }: { s: Skill; slides: DemoSlide[] }) {
  const [active, setActive] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const go = (i: number) => {
    const el = track.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };
  return (
    <div className="absolute inset-0">
      <div
        ref={track}
        onScroll={(e) => setActive(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        className="flex size-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((sl, i) => (
          <div key={sl.id} className="relative size-full shrink-0 snap-center">
            <SkillMedia s={{ ...s, video: sl.video, poster: sl.poster, ratio: "9:16" }} playing={active === i} eager className="absolute inset-0 size-full" />
            <TikTokOverlay s={s} id={sl.id} />
          </div>
        ))}
      </div>
      {active > 0 && (
        <button onClick={() => go(active - 1)} aria-label="Previous video" className="absolute left-2 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/65">
          <ChevronLeft className="size-4" />
        </button>
      )}
      {active < slides.length - 1 && (
        <button onClick={() => go(active + 1)} aria-label="Next video" className="absolute right-14 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/65">
          <ChevronRight className="size-4" />
        </button>
      )}
      <div className="pointer-events-none absolute inset-x-0 top-[4.25rem] z-10 flex justify-center gap-1.5">
        {slides.map((sl, i) => (
          <span key={sl.id} className={`h-1.5 rounded-full transition-all ${i === active ? "w-4 bg-white" : "w-1.5 bg-white/45"}`} />
        ))}
      </div>
    </div>
  );
}

function DemoPanel({ s, chips, ask, refs, split, slides }: { s: Skill; chips: [string, string, string]; ask?: string; refs?: DemoRef[]; split?: [string, string]; slides?: DemoSlide[] }) {
  const reduced = useReducedMotion();
  const [stage, setStage] = useState(0);
  const [inView, setInView] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  /* 滚到可见(40%)才开始播，免得用户到这里时动画早已播完 */
  useEffect(() => {
    const el = panel.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setInView(true), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (reduced) {
      setStage(4);
      return;
    }
    if (!inView) return;
    setStage(0);
    const ids = [250, 650, 1050, 1500].map((t, i) => setTimeout(() => setStage(i + 1), t));
    return () => ids.forEach(clearTimeout);
  }, [reduced, inView]);
  const done = stage >= 4;
  /* 新消息渲染后把对话滚到底(固定高度、内容往上推);顶部有渐隐，不会硬切 */
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const id = requestAnimationFrame(() => el.scrollTo({ top: el.scrollHeight, behavior: reduced ? "auto" : "smooth" }));
    return () => cancelAnimationFrame(id);
  }, [stage, reduced]);
  /* 演示里已附了产品图，提示词里「先让我上传」的那句就去掉 */
  const prompt = ask ?? s.prompt.replace(/^Use the BuzzVideo [a-z0-9-]+ skill\. /, "").replace(/\s*Ask me[^.]*\./g, "");
  const lower = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);

  return (
    <div ref={panel} className="relative flex w-full flex-col gap-1 overflow-hidden rounded-3xl lg:flex-row lg:py-3 lg:pl-3">
      {/* 对话 */}
      <div
        className="flex h-[34rem] w-full shrink-0 flex-col overflow-hidden rounded-b-sm rounded-t-[20px] border border-white/5 lg:h-[46rem] lg:w-[52.875rem] lg:rounded-l-[20px] lg:rounded-r-sm"
        style={{ background: C.surface }}
      >
        <div className="flex shrink-0 items-center justify-center py-5">
          <span className="inline-flex items-center gap-2 text-[16px] font-medium leading-6 text-white">
            <ClaudeGlyph className="size-6" />
            Claude
            <span className="text-white/40">&amp;</span>
            <OpenAiGlyph className="size-5" />
            ChatGPT
          </span>
        </div>
        <div ref={scroller} className="flex min-h-0 flex-1 items-start justify-center overflow-y-auto overscroll-contain px-4 pb-6 pt-2 [mask-image:linear-gradient(to_bottom,transparent,black_2rem)] sm:px-8 lg:pb-8">
          <div className="mx-auto flex w-full max-w-[65.5rem] flex-col gap-7">
            <div className="flex flex-col items-end gap-3 px-2">
              {refs && (
                <div className="flex gap-2">
                  {refs.map((r) => (
                    <figure key={r.src} className="flex w-14 flex-col gap-1">
                      <div className="relative aspect-square overflow-hidden rounded-lg border border-white/10 bg-white/5">
                        <img src={r.src} alt="" className="size-full object-cover" />
                        {r.kind === "video" && (
                          <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <span className="flex size-5 items-center justify-center rounded-full bg-black/55 backdrop-blur-sm">
                              <Play className="ml-px size-2.5 text-white" fill="currentColor" />
                            </span>
                          </span>
                        )}
                      </div>
                      <figcaption className="truncate text-center text-[10px] text-white/45">{r.label}</figcaption>
                    </figure>
                  ))}
                </div>
              )}
              <div className="w-full max-w-[32.25rem] rounded-2xl bg-black/20 py-4 pl-4 pr-5">
                <p className="max-w-[65ch] text-[16px] leading-6 text-white [word-break:break-word]">{prompt}</p>
              </div>
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <Fade show={stage >= 1}>
                <p className="max-w-[65ch] text-[16px] leading-[1.46] text-white/80">Got it. {s.steps[0]} first, then I&apos;ll show you the plan and the credit estimate.</p>
              </Fade>
              <Fade show={stage >= 2}>
                <p className="max-w-[65ch] text-[16px] leading-[1.46] text-white/80">
                  You approved the plan. {s.steps[1]}, then {lower(s.steps[2])}.
                </p>
              </Fade>
              <Fade show={stage >= 3}>
                <div className="flex w-full flex-col rounded-[14px]">
                  <div className="flex w-full items-center py-5">
                    <div className="flex shrink-0 items-center gap-2.5">
                      <BuzzLogo className="size-6 rounded-[0.3rem]" />
                      <span className="whitespace-nowrap text-[18px] font-medium leading-7 text-white/80">BuzzVideo</span>
                    </div>
                  </div>
                  <div className="relative h-[11rem] w-fit self-start overflow-hidden rounded-[0.625rem]">
                    {s.media === "none" ? (
                      <div className="flex h-full w-[13rem] items-center justify-center bg-white/5 text-[13px] text-white/60">Ad report</div>
                    ) : (
                      <img src={mediaSrc(s, "jpg")} alt="" className="block h-full w-auto" />
                    )}
                  </div>
                  <div className="w-full overflow-hidden py-2.5">
                    <div className="flex w-full flex-col gap-4">
                      <div className="flex min-h-12 items-center gap-3 px-2.5">
                        <p className="line-clamp-2 min-w-0 max-w-[65ch] flex-1 text-[16px] leading-6 text-white/50">{prompt}</p>
                      </div>
                      <div className="-my-1 flex w-full flex-wrap items-center gap-2 py-1 opacity-60">
                        {[
                          { icon: Film, t: chips[0] },
                          { icon: RectangleVertical, t: chips[1] },
                          { icon: Clock, t: chips[2] },
                          { icon: Volume2, t: "Audio" },
                        ].map(({ icon: Icon, t }) => (
                          <span key={t} className="flex h-[2.375rem] shrink-0 items-center gap-1.5 rounded-full bg-white/5 pl-2.5 pr-3.5 text-[14px] font-semibold text-white/80">
                            <Icon className="size-4" /> {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Fade>
              <Fade show={done}>
                <div className="flex flex-col gap-1.5">
                  <p className="max-w-[65ch] text-[16px] leading-[1.46] text-white/80">Done. I checked every frame before sending it, and it&apos;s saved in your BuzzVideo Assets.</p>
                  <div className="flex items-center pt-1.5 text-white/50">
                    {[Copy, ThumbsUp, ThumbsDown, RotateCcw].map((Icon, i) => (
                      <span key={i} className="flex size-6 items-center justify-center">
                        <Icon className="size-4" />
                      </span>
                    ))}
                  </div>
                </div>
              </Fade>
            </div>
          </div>
        </div>
      </div>

      {/* 结果 */}
      <div
        className="flex h-[40rem] min-w-0 flex-col gap-5 overflow-hidden rounded-b-[20px] rounded-t-sm border border-white/5 p-4 lg:h-[46rem] lg:flex-1 lg:rounded-l-sm lg:rounded-r-[20px]"
        style={{ background: C.surface }}
      >
        <div className="relative flex shrink-0 items-center justify-center gap-2 text-[16px] font-medium leading-6 text-white">
          <CircleCheck className="size-4" />
          <span>Result</span>
        </div>
        <div className="flex min-h-0 flex-1 justify-center overflow-hidden">
          <figure className={`flex h-full min-h-[17.5rem] w-full shrink-0 flex-col items-center gap-2.5 max-w-[21.5rem]`}>
            <div className="relative min-h-0 w-full flex-1 overflow-hidden rounded-[20px] border border-white/15 bg-white/5 shadow-[0_8px_16px_rgba(0,0,0,0.1)]">
              {slides ? (
                <SlideStack s={s} slides={slides} />
              ) : (
                <SkillMedia s={s} contain={s.ratio !== "9:16"} backdrop="black" playing eager className="absolute inset-0 size-full" />
              )}
              {split && (
                /* 上下两段的标签：成片是 720×1280,上段从 18.2% 起、下段从 50.2% 起 */
                <div aria-hidden className="pointer-events-none absolute inset-0">
                  {split.map((t, i) => (
                    <span key={t} className="absolute left-2.5 rounded-md bg-black/55 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-sm" style={{ top: `calc(${i === 0 ? 18.2 : 50.2}% + 0.5rem)` }}>
                      {t}
                    </span>
                  ))}
                </div>
              )}
              {!slides && <TikTokOverlay s={s} />}
            </div>
            <figcaption className="flex w-full shrink-0 flex-wrap items-center justify-center gap-x-1 px-0 text-[13px] font-semibold text-white">
              <button onClick={() => openNew(claudeUrl(s))} className="flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2 transition hover:bg-white/5">
                <ClaudeGlyph className="size-4" /> Recreate in Claude
              </button>
              <button onClick={() => openNew(chatgptUrl(s))} className="flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2 transition hover:bg-white/5">
                <OpenAiGlyph className="size-4" /> Recreate in ChatGPT
              </button>
            </figcaption>
          </figure>
        </div>
      </div>
    </div>
  );
}

/* 逐条出现：没轮到的消息不渲染(不占位),出现时淡入上移;关掉动效时直接显示 */
function Fade({ show, children }: { show: boolean; children: React.ReactNode }) {
  if (!show) return null;
  return <div className="animate-in fade-in slide-in-from-bottom-1.5 duration-300 ease-out motion-reduce:animate-none">{children}</div>;
}

/* ───────── 技能库 ───────── */

function SkillLibrary() {
  const [filter, setFilter] = useState<Filter>("Featured");
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s) return SKILLS.filter((k) => [k.name, k.line, k.slug, k.category, k.prompt, ...k.gets, ...k.variations.map((v) => v.title)].some((f) => f.toLowerCase().includes(s)));
    return filter === "Featured" ? SKILLS.filter((k) => k.featured) : SKILLS.filter((k) => k.category === filter);
  }, [filter, q]);
  const filters: Filter[] = ["Featured", ...CATEGORIES];
  const pick = (f: Filter) => {
    setFilter(f);
    setQ("");
  };

  return (
    <section id="skills" className="relative mx-auto w-full max-w-[1440px] scroll-mt-16 px-4 pb-20 pt-28 sm:px-6 md:py-20">
      <div className="flex flex-col items-center text-center">
        <h2 className={`${H2} hidden flex-wrap items-center justify-center gap-x-2.5 gap-y-1 md:flex`}>
          <span>Made with BuzzVideo skills in</span>
          <span className="inline-flex items-center gap-2.5" style={{ color: C.claude }}>
            <ClaudeGlyph className="size-8" />
            Claude
          </span>
          <span>and</span>
          <span className="inline-flex items-center gap-2.5">
            <OpenAiGlyph className="size-7" />
            ChatGPT
          </span>
        </h2>
        <p className="hidden text-[14px] font-medium leading-5 md:block" style={{ color: C.secondary }}>
          Give Claude and ChatGPT a full ad and video studio
        </p>
      </div>

      <div className="mt-0 grid min-h-0 items-start rounded-2xl md:mt-10 md:grid-cols-[18.25rem_minmax(0,1fr)]">
        <aside className="mb-4 flex min-h-0 min-w-0 flex-col gap-3 md:sticky md:top-20 md:mb-0 md:rounded-2xl md:bg-[#18191c] md:p-3">
          {/* 手机：标题 + 横向分类 */}
          <div className="flex min-w-0 flex-col gap-4 md:hidden">
            <h3 className={`${grotesk.className} text-center text-[18px] font-bold uppercase leading-6 tracking-[-0.02em] text-white`}>Browse {SKILLS.length} skills</h3>
            <SearchBox q={q} setQ={setQ} />
            <div className="relative -mr-4 flex min-w-0 items-center">
              <div className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none]">
                <div role="tablist" className="flex w-max items-center gap-1.5 py-1 pr-4">
                  {filters.map((f) => (
                    <button
                      key={f}
                      role="tab"
                      aria-selected={!q && filter === f}
                      onClick={() => pick(f)}
                      className={`flex h-[2.125rem] shrink-0 items-center rounded-full border px-3.5 text-[12px] font-medium leading-[0.875rem] text-white ${
                        !q && filter === f ? "border-transparent bg-white/5" : "border-white/10"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#131517] to-transparent" />
            </div>
          </div>
          {/* 桌面：搜索 + 分隔线 + 分类 */}
          <div className="hidden flex-col gap-3 md:flex">
            <SearchBox q={q} setQ={setQ} />
            <div className="mx-2 h-px bg-white/[0.08]" />
            <nav className="flex flex-col gap-1.5">
              {filters.map((f) => {
                const Icon = CAT_ICON[f];
                const active = !q && filter === f;
                return (
                  <button
                    key={f}
                    onClick={() => pick(f)}
                    aria-pressed={active}
                    className={`flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors duration-150 motion-reduce:transition-none ${active ? "bg-white/5" : "hover:bg-white/5"}`}
                  >
                    <span
                      className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/20 shadow-[inset_0_-0.3px_6px_rgba(185,185,185,0.35)]"
                      style={active ? { background: C.brand, color: "#131517" } : { background: "rgba(255,255,255,0.05)", color: "#fff" }}
                    >
                      <Icon className="size-[1.125rem]" />
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-[14px] font-medium leading-5 text-white">{f}</span>
                      <span className="truncate text-[12px] leading-4 text-white/60">
                        {f === "Featured" ? "Popular starter skills" : CATEGORY_NOTE[f]}
                      </span>
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        <div className="min-h-0 min-w-0 md:pl-4">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {list.map((s) => (
              <SkillCard key={s.slug} s={s} />
            ))}
          </div>
          {!list.length && (
            <div className="rounded-2xl border border-dashed border-white/15 px-6 py-12 text-center">
              <p className="text-[15px] text-white">No skills match &ldquo;{q}&rdquo;</p>
              <p className="mt-1 text-[14px]" style={{ color: C.secondary }}>
                Try one of these instead
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {["ad", "UGC", "3D", "product photo", "captions"].map((t) => (
                  <button key={t} onClick={() => setQ(t)} className="h-9 rounded-full border border-white/10 px-3.5 text-[13px] font-medium text-white transition hover:bg-white/5">
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* 搜索框：隐藏浏览器自带的蓝色清除钮，换成同色系的清除按钮 */
function SearchBox({ q, setQ }: { q: string; setQ: (v: string) => void }) {
  return (
    <label className="flex h-9 min-w-0 items-center gap-2 rounded-xl px-1.5 focus-within:bg-white/5" style={{ color: C.secondary }}>
      <Search className="size-5 shrink-0" />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search skills"
        aria-label="Search skills"
        className="min-w-0 flex-1 bg-transparent text-[14px] leading-5 text-white outline-none placeholder:text-[#898a8b] [&::-webkit-search-cancel-button]:appearance-none"
      />
      {q && (
        <button onClick={() => setQ("")} aria-label="Clear search" className="flex size-7 shrink-0 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white">
          <X className="size-4" />
        </button>
      )}
    </label>
  );
}

/* 卡片(照原页 figure):p-2.5 悬停浅底;画面 432:253;悬停半透明黑罩 + 底部渐变里放提示词和按钮;下方玻璃小图标 + 名称、右侧「Skill」 */
function SkillCard({ s }: { s: Skill }) {
  const [hover, setHover] = useState(false);
  /* 卡片进入视口就自动静音循环播放，划出去暂停，免得一屏外的几十条视频同时在跑 */
  const reduced = useReducedMotion();
  const [inView, setInView] = useState(false);
  const card = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = card.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const href = `/prototypes/mcp/skills/${s.slug}`;
  const Icon = CAT_ICON[s.category];
  return (
    <figure
      ref={card}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      className="group relative min-w-0 overflow-hidden rounded-2xl p-2.5 transition-colors duration-150 motion-reduce:transition-none [@media(hover:hover)]:hover:bg-white/5"
    >
      <Link href={href} aria-label={`${s.name} details`} className="absolute inset-0 z-[1] rounded-[inherit]" />
      <div className="relative aspect-[432/253] overflow-hidden rounded-[0.625rem] bg-[#23262a]">
        <SkillMedia s={s} contain={s.ratio !== "wide"} playing={hover || (inView && !reduced)} className="absolute inset-0 size-full" />
        <div
          className={`pointer-events-none absolute inset-0 z-[2] flex flex-col justify-end bg-black/50 transition-opacity duration-150 motion-reduce:transition-none ${
            hover ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="flex w-full flex-col items-center justify-end gap-1.5 px-2 pb-3 pt-12" style={{ background: `linear-gradient(to bottom, transparent, ${C.cardOverlay})` }}>
            <div className="flex w-full p-1">
              <p className="line-clamp-2 w-full text-[14px] font-medium leading-5 opacity-75">{s.prompt.replace(/^Use the BuzzVideo [a-z0-9-]+ skill\. /, "").replace(/\s*Ask me[^.]*\./g, "")}</p>
            </div>
            <div className="flex w-full items-start gap-2">
              <button
                onClick={() => openNew(claudeUrl(s))}
                className="pointer-events-auto relative z-[3] flex h-10 flex-1 items-center justify-center gap-1.5 overflow-hidden rounded-[0.625rem] border border-white/5 px-3 text-[14px] font-semibold text-white shadow-[inset_0_2px_3px_rgba(255,255,255,0.05)] transition-transform duration-150 active:scale-[0.98]"
                style={{ background: C.claudeBtn }}
              >
                <ClaudeGlyph white className="size-5" /> Recreate
              </button>
              <button
                onClick={() => openNew(chatgptUrl(s))}
                aria-label={`Try ${s.name} in ChatGPT`}
                className="pointer-events-auto relative z-[3] flex size-10 shrink-0 items-center justify-center rounded-[0.625rem] border border-white/5 bg-white/10 text-white backdrop-blur-md transition hover:bg-white/15 active:scale-[0.98]"
              >
                <OpenAiGlyph className="size-5" />
              </button>
              <Link
                href={href}
                className="pointer-events-auto relative z-[3] flex h-10 shrink-0 items-center justify-center rounded-[0.625rem] border border-white/5 bg-white/5 px-3 text-[14px] font-semibold text-white backdrop-blur-md transition hover:bg-white/10 active:scale-[0.98]"
              >
                <span className="px-1.5">Learn more</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
      <figcaption className="pointer-events-none relative z-[2] mt-2.5 flex h-7 min-w-0 items-center justify-between gap-2 pl-1 pr-2">
        <span className="flex min-w-0 items-center gap-2">
          <span className="relative flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-[0.375rem] border border-[rgba(197,197,197,0.24)] bg-white/5 text-white shadow-[inset_0_-0.3px_6px_rgba(185,185,185,0.35)]">
            <Icon className="size-4" />
          </span>
          <span className="truncate text-[14px] font-medium leading-5 text-white">{s.name}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1 text-[12px] font-medium" style={{ color: C.secondary }}>
          <Clock className="size-3.5" /> ~{s.minutes} min
        </span>
      </figcaption>
      {/* 一句话说明常显：触屏没有悬停，也要知道这个 Skill 做什么 */}
      <p className="pointer-events-none relative z-[2] mt-1 truncate pl-10 pr-2 text-[13px] leading-5" style={{ color: C.secondary }}>
        {s.line}
      </p>
    </figure>
  );
}

/* ───────── 模型墙 ───────── */

function ModelWall() {
  return (
    <section className="relative mx-auto w-full max-w-[1440px] px-8 py-20">
      <div className="flex flex-col items-center gap-3 text-center">
        <h2 className={`${H2} flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1`}>
          <span>Every creative model, inside</span>
          <span className="inline-flex items-center gap-2.5">
            <ClaudeGlyph className="size-10" />
            Claude
          </span>
          <span>and</span>
          <span className="inline-flex items-center gap-2.5">
            <OpenAiGlyph className="size-8" />
            ChatGPT
          </span>
        </h2>
        <p className="text-[14px] font-medium leading-5" style={{ color: C.secondary }}>
          Let Claude and ChatGPT use powerful image and video models.
        </p>
      </div>
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {MODELS.map((m) => (
          <ModelCard key={m.name} m={m} />
        ))}
      </div>
    </section>
  );
}

/* 原页的模型卡：底部色带取图片自身的主色(渐变 + 实色带),图片加载后用 canvas 取底部平均色(CDN 允许跨域读取时才生效) */
function ModelCard({ m }: { m: (typeof MODELS)[number] }) {
  const Icon = KIND_ICON[m.kind];
  const [tint, setTint] = useState("rgb(40,40,44)");
  const poster = `https://assets.presslogic.com/cdn-cgi/image/width=720,quality=75,format=auto/buzzvideo/${m.poster}`;
  const sample = (img: HTMLImageElement) => {
    try {
      const c = document.createElement("canvas");
      c.width = 12;
      c.height = 12;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, img.naturalHeight * 0.6, img.naturalWidth, img.naturalHeight * 0.4, 0, 0, 12, 12);
      const d = ctx.getImageData(0, 0, 12, 12).data;
      let r = 0, g = 0, b = 0;
      for (let i = 0; i < d.length; i += 4) {
        r += d[i];
        g += d[i + 1];
        b += d[i + 2];
      }
      const n = d.length / 4;
      /* 压暗到 55%,保证白字在色带上够清楚 */
      setTint(`rgb(${Math.round((r / n) * 0.55)},${Math.round((g / n) * 0.55)},${Math.round((b / n) * 0.55)})`);
    } catch {
      /* 跨域不可读就用默认深灰 */
    }
  };
  return (
    <article className="relative h-[23.5rem] overflow-hidden rounded-2xl border border-white/15 bg-black/15">
      <img src={poster} alt={`${m.name} example`} crossOrigin="anonymous" loading="lazy" onLoad={(e) => sample(e.currentTarget)} className="absolute inset-0 size-full object-cover" />
      {m.video && (
        <video src={CDN + m.video} poster={poster} autoPlay loop muted playsInline preload="none" className="absolute inset-0 size-full object-cover motion-reduce:hidden" />
      )}
      <div className="absolute inset-x-0 bottom-20 h-[7.5rem]" style={{ background: `linear-gradient(to top, ${tint}, transparent)` }} />
      <div className="absolute inset-x-0 bottom-0 flex min-h-20 items-center justify-center gap-2 px-4 py-5" style={{ background: tint }}>
        <Icon className="size-5 shrink-0 text-white" />
        <h3 className="text-center text-[18px] font-semibold leading-7 text-white">{m.name}</h3>
      </div>
    </article>
  );
}

/* ───────── FAQ ───────── */

function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="relative mx-auto w-full max-w-3xl scroll-mt-16 px-6 py-12">
      <h2 className={H2}>Still have questions?</h2>
      <div className="mt-6 flex flex-col">
        {FAQ.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={f.q} className="w-full">
              <button
                onClick={() => setOpen(isOpen ? -1 : i)}
                aria-expanded={isOpen}
                className="flex min-h-10 w-full items-center gap-2 py-2 text-left"
              >
                <span className="min-w-0 flex-1 text-[16px] font-semibold leading-6 text-white">{f.q}</span>
                <span className="flex size-6 shrink-0 items-center justify-center" style={{ color: C.secondary }}>
                  <ChevronDown className={`size-5 transition-transform duration-300 motion-reduce:transition-none ${isOpen ? "rotate-180" : ""}`} />
                </span>
              </button>
              <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out motion-reduce:transition-none ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                <div className="overflow-hidden">
                  <p className="max-w-[65ch] pb-6 pt-1 text-[16px] leading-6" style={{ color: C.secondary }}>
                    {f.a}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

