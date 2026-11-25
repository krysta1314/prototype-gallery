"use client";

/* 官网 Header(SEO / GEO 版)。两种外观共用一套数据(nav-data.ts):
   - variant="site":访客页面(首页、工具页、模型页、博客…)的整条顶栏,logo + 9 个顶级 + Sign Up(和线上一致，不单独放 Log in);
   - variant="app":登录后 app 的顶栏(叠在白色内容面板顶部),左边同一套菜单(字号更小),右边 Invite + 积分 + 账号。
   SEO 要点(交接给开发):
   1. 大菜单内容**始终渲染在 DOM 里**,只用 CSS 隐藏(invisible + opacity),服务端渲染时链接就在 HTML 里 —— 爬虫不会悬停;
   2. 每个链接都是真实 <a href>(原型里拦下点击改成 toast,真实产品直接跳转);
   3. 顶级项本身也是链接(点标题进总页,悬停出大菜单)。
   交互:悬停 / 点击打开,移开 160ms 后关(给鼠标斜穿留余地);Esc 关;键盘 Tab 进入菜单时 focus-within 也能打开。
   xl(1280px)以下换成菜单按钮 + 全屏抽屉,分组用 <details> 手风琴(内容同样在 DOM 里)。 */

import { TOOLS_CONTENT } from "../site/tools/tool-content";
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  AudioLines,
  BarChart3,
  BookA,
  Box,
  Boxes,
  Building2,
  Captions,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clapperboard,
  Code,
  Crop,
  Eraser,
  FileDown,
  FileText,
  Film,
  Frame,
  Globe,
  Handshake,
  ImageUp,
  Layers,
  LayoutTemplate,
  Lightbulb,
  Maximize2,
  Megaphone,
  Menu,
  MessageCircleQuestion,
  MicVocal,
  Move,
  Music,
  Palette,
  PenLine,
  Play,
  Plug,
  Presentation,
  Quote,
  RectangleHorizontal,
  Replace,
  Rotate3d,
  Ruler,
  Scaling,
  ScrollText,
  Smartphone,
  Target,
  Type,
  Users,
  VenetianMask,
  Wand2,
  Workflow,
  Check,
  Clock,
  Images,
  MonitorPlay,
  Sparkle,
  Brush,
  ChartBar,
  CircleUserRound,
  Expand,
  GalleryHorizontal,
  History,
  ImagePlus,
  Languages,
  LayoutGrid,
  Mic,
  MoveHorizontal,
  Package,
  PencilLine,
  Scissors,
  Sun,
  UserRoundCheck,
  Video,

  X,
  Zap,
  Link2,
  Gift,
  Shirt,
  PackageOpen,
  TrendingUp,
  type LucideIcon,
  Newspaper,
} from "lucide-react";
import { modelLogo } from "./model-logos";
import { FLYOUT_DESC, HEADER, navLabel, type LinkStatus, type NavGroup, type NavLink, type NavPromo, type NavTile, type TopItem } from "./nav-data";
import { MODELS, EXTRA_MODELS } from "./models-catalog";
import { factsOf } from "../site/models/model-facts";
import { PAGE_META } from "../site/pages-meta";
import { freeBySlug } from "../site/free/content";
import { mediaOf } from "../site/models/model-media";
import { isRemoved, resolveHref } from "../site/redirects";

export type OnLink = (link: Pick<NavLink, "label" | "href" | "status">) => void;

const LOGO = "/prototypes/ai-tools/logo.svg";
const CLOSE_DELAY = 160;

/* 演示用:「标出页面状态」打开时,链接后面加一个色点 */
export const STATUS_DOT: Record<LinkStatus, string> = { live: "bg-[#1a7f4b]", uat: "bg-[#2563eb]", new: "bg-[#ff5e1a]" };

export function StatusDot({ status, mark, corner = false }: { status: LinkStatus; mark: boolean; corner?: boolean }) {
  if (!mark) return null;
  /* corner:顶栏顶级项用,角标不占宽度(8 个顶级在 1280 宽已经很满) */
  if (corner) return <span aria-hidden className={`absolute right-0.5 top-1 size-1.5 rounded-full ${STATUS_DOT[status]}`} />;
  return <span aria-hidden className={`ml-1.5 inline-block size-1.5 shrink-0 rounded-full align-middle ${STATUS_DOT[status]}`} />;
}

const BADGE: Record<NonNullable<NavLink["badge"]>, string> = {
  New: "bg-[#fff3ec] text-[#b8400e]",
  Hot: "bg-[#b8400e] text-white",
  Soon: "bg-[#F6F6F6] text-[#6F6C6C]",
};
/* 2026-11-19 Monica:New / Hot 标签都不要;只留 Soon(表示还不能用，是事实信息) */
export function Badge({ b }: { b?: NavLink["badge"] }) {
  if (b !== "Soon") return null;
  return <span className={`ml-1.5 rounded-full px-1.5 py-px text-[10px] font-bold leading-4 ${BADGE[b]}`}>{b}</span>;
}

/* 点击去哪(2026-11-18):
   - 线上已有(live)→ 新窗口打开 buzzvideo.ai 上的真页面(复用，不重做);
   - UAT 已有(uat)→ 新窗口打开 uat-app.buzzvideo.ai;Kling 4.0 和其他模型一样走统一模板;
   - 待建(new)且已经做好的批次 → /prototypes/site/<网址>(BUILT);其余还是 toast。 */
const PROTO_PAGE: Record<string, string> = {
  "/upscale-video": "/prototypes/ai-tools/video-upscale",
  "/motion-control": "/prototypes/ai-tools/motion-control",
  "/video-character-swap": "/prototypes/ai-tools/character-swap",
  "/3d-to-video": "/prototypes/ai-tools/render-3d",
  "/upscale-image": "/prototypes/ai-tools/image-upscale",
  "/remove-object": "/prototypes/ai-tools/brush-edit",
  "/virtual-try-on": "/prototypes/ai-tools/virtual-try-on",
  /* /photo-angle-editor:2026-11-24 Monica 划掉了独立的 Photo Angle 工具页(专用模型没接入),改成和其他图片功能一样进 Image Gen 并预填提示词 */
  "/talking-avatar": "/prototypes/ai-tools/talking-avatar",
  "/ai-lip-sync": "/prototypes/ai-tools/lip-sync",
  /* 2026-11-24 Monica:Spokesperson 进 Talking Avatar 工具页 */
  "/ai-spokesperson": "/prototypes/ai-tools/talking-avatar",
  "/hybrid-reel": "/prototypes/hybrid-reel",
  "/3d-studio": "/prototypes/3d-studio",
  "/ad-creative-maker": "/prototypes/design-studio",
  "/brand-kit": "/prototypes/design-studio",
  "/ai-presentation-maker": "/prototypes/design-studio",
  "/ai-website-builder": "/prototypes/design-studio",
  "/design-studio": "/prototypes/design-studio",
};
/* 原型里已经做好的页面(按批次放开):第 1 批模型页 + 分类页;第 2 批工具落地页 + /tools 总页 */
const BUILT_TOOLS = new Set(TOOLS_CONTENT.map((t) => `/${t.slug}`));
const BUILT = (href: string) => !!PAGE_META[href.replace(/^\//, "")] || /^\/ai-(video|image|audio)-models$/.test(href) || href === "/seedance" || MODELS.some((m) => href === `/${m.slug}`) || BUILT_TOOLS.has(href);
const EXISTING_URL: Record<string, string> = {
  "/buzzvideo-vs-topview": "https://uat-app.buzzvideo.ai/compare/topview",
  /* 2026-11-23 核实线上已有(网址是旧的多级路径):直接指过去 */
  "/community-gallery": "https://buzzvideo.ai/gallery/marketing-agent-community",
  "/seedance-2-5-showcase": "https://buzzvideo.ai/gallery/seedance-2-5",
  "/mcp-skills": "https://uat-app.buzzvideo.ai/mcp/skills",
  /* 2026-11-24 核实 UAT 已有 skill 详情页 /mcp/skills/<slug>(假 slug 会退回通用标题，真页标题是「<Skill> Skill for Claude and ChatGPT」);
     Monica:Popular skills 点了去 MCP Skills 落地页里对应的展示页 —— 下面 targetOf 把所有 /<id>-mcp-skill 都指过去 */
  /* 2026-11-24 Monica:Pricing 点了直接去线上定价页 */
  "/pricing": "https://buzzvideo.ai/pricing",
  "/llms.txt": "/prototypes/site/llms.txt",
};
export function targetOf(link: { href: string; status: LinkStatus }): { url: string; external: boolean } | null {
  if (link.href.startsWith("http")) return null;
  /* 2026-11-25 合并页：点击直接去目标页 */
  if (resolveHref(link.href) !== link.href) return targetOf({ href: resolveHref(link.href), status: link.status });
  /* 带锚点的站内链接(如 /help#contact):按不带锚点的网址找目标，再把锚点接回去 */
  const hashAt = link.href.indexOf("#");
  if (hashAt > 0) {
    const base = targetOf({ href: link.href.slice(0, hashAt), status: link.status });
    return base && { ...base, url: base.url + link.href.slice(hashAt) };
  }
  const h = link.href;
  /* 2026-11-24 Monica:logo / Home 回原型里的官网首页(首页现在就在导航原型这页),不再跳去线上 buzzvideo.ai */
  if (h === "/") return { url: "/prototypes/site-nav", external: false };
  /* 2026-11-19 Monica:已有的页面定向过去 —— TopView 对比页已在 UAT(/compare/topview) */
  if (EXISTING_URL[h]) return { url: EXISTING_URL[h], external: true };
  const skill = h.match(/^\/(.+)-mcp-skill$/);
  if (skill) return { url: `https://uat-app.buzzvideo.ai/mcp/skills/${skill[1]}`, external: true };
  if (link.status === "live") return { url: `https://buzzvideo.ai${h}`, external: true };
  /* 落地页已做好的优先打开落地页(Footer 链落地页);Header 进产品走 appOf */
  if (BUILT(h)) return { url: `/prototypes/site${h}`, external: false };
  /* 2026-11-19 核实:这些工具页在 uat-app 上是 404,实际做在原型里(v1.12 ai-tools 等),点了打开原型页 */
  if (PROTO_PAGE[h]) return { url: PROTO_PAGE[h], external: false };
  if (link.status === "uat") return { url: `https://uat-app.buzzvideo.ai${h}`, external: true };
  if (BUILT(h)) return { url: `/prototypes/site${h}`, external: false };
  return null;
}

/* ───────── Header 点击去哪(2026-11-19 Monica 定：照 Higgsfield)─────────
   Header 里的功能 / 模型 = 直接进产品里的工具(带输入框的生成页),和 Higgsfield /ai/image 一样;
   落地页(一级网址 /ai-image-generator、/kling-4-0…)不在 Header 里抢点击，靠工具页的 canonical 指向它 + Footer 站点地图 + 分类页 / 博客内链被收录。
   交接给开发：工具页 <link rel="canonical" href="https://buzzvideo.ai/<keyword>">(模型的工具页指向 /<model>);
   原型里没有真实 app,这里打开对应的 app 原型页;没有原型页的退回落地页。 */
const GEN_KEY: Record<string, string> = {
  "seedance-2-5": "seedance-2.5", "seedance-2-0": "seedance-2.0", "seedance-2-0-fast": "seedance-2.0-fast", "seedance-2-0-mini": "seedance-2.0-mini",
  "kling-4-0": "kling-4.0", "kling-3-0": "kling-3.0", "kling-3-0-omni": "kling-3.0-omni", "wan-3-0": "wan-3.0", "wan-3-0-prime": "wan-3.0-prime",
  "gemini-omni-1-2-flash": "omni-flash-1.2", "seedance-2-5-flash": "seedance-2.5-flash", "seedance-1-5-pro": "seedance-1.5-pro", "minimax-h3-max-turbo": "h3-max-turbo",
  "minimax-h3-max-avatar": "h3-max-avatar", "minimax-h3-max-lip-sync": "h3-max-lip-sync", "minimax-h3-max-camera-controls": "h3-max", "minimax-h3-max-recast": "h3-max-recast",
  "kling-3-0-motion-control": "kling-3.0-motion-control", "kling-ai-avatar-v2-pro": "kling-avatar-v2-pro", "kling-lipsync": "kling-lipsync", "seedvr-upscale-video": "seedvr-upscale-video", "minimax-h3": "h3", "minimax-h3-max": "h3-max", "vidu-q3-pro": "vidu-q3", "grok-imagine-video-1-5": "grok-1.5", "flux-3-max-video": "flux-3-max-video",
};
const GEN = "/prototypes/video-gen-modes/home";
const APP = "/prototypes/ai-tools";
const APP_PAGE: Record<string, string> = {
  "/ai-video-generator": GEN,
  "/text-to-video": GEN,
  "/image-to-video": `${GEN}?model=kling-4.0&mode=frames`,
  "/first-last-frame": `${GEN}?model=kling-4.0&mode=frames`,
  "/ai-video-editor": `${GEN}?model=kling-4.0&mode=edit`,
  "/ai-video-extender": `${GEN}?model=seedance-2.5&mode=extend`,
  "/ai-camera-control": `${GEN}?model=h3-max&mode=camera`,
  "/ai-storyboard-generator": "/prototypes/ai-tools/canvas",
  "/canvas": "/prototypes/ai-tools/canvas",
  "/ai-dance-video": "/prototypes/3d-studio",
  "/design-studio": "/prototypes/design-studio",
  "/ai-graphic-design": "/prototypes/design-studio",
  "/ai-social-media-post-generator": "/prototypes/design-studio",
  "/ai-instagram-post-generator": "/prototypes/design-studio",
  "/ai-carousel-maker": "/prototypes/design-studio",
  "/ai-poster-generator": "/prototypes/design-studio",
  "/ai-flyer-maker": "/prototypes/design-studio",
  "/mcp": "/prototypes/mcp",
};
/* 图片 / 音频模型：官网 slug → 生成器里的模型 key(原型生成器里没有的模型，线上照样带 slug 选中) */
const IMAGE_KEY: Record<string, string> = { "gpt-image-2": "gpt-image-2", "gpt-image-2-6-flare": "gpt-image-2.6-flare", "gpt-image-2-6-sunburst": "gpt-image-2.6-sunburst", "gpt-image-2-5-sunburst": "gpt-image-2.5-sunburst", "nano-banana-2": "nano-banana-2", "seedream-5-0-pro": "seedream-5-pro" };
const AUDIO_KEY: Record<string, [string, string]> = {
  "seed-audio-1-0": ["audio", "seed-audio-1.0"],
  "elevenlabs-eleven-v4": ["audio", "eleven-v4"],
  "elevenlabs-eleven-v4-turbo": ["audio", "eleven-v4-turbo"],
  "minimax-speech-2-8-hd": ["audio", "minimax-speech-2.8-hd"],
  "gemini-3-8-flash-tts": ["audio", "gemini-3.8-flash-tts"],
  "elevenlabs-music-v2-5": ["music", "eleven-music-v2.5"],
  "lyria-3-5": ["music", "lyria-3.5"],
  "elevenlabs-sound-effects-v3": ["sfx", "eleven-sfx-v3"],
  "kling-tts": ["audio", "kling-tts"],
  "minimax-voice-clone": ["audio", "minimax-voice-clone"],
  "kling-voice-clone": ["audio", "kling-voice-clone"],
};
/* 功能 → 生成器的哪一类(图片 / 音乐 / 音效 / 配音 / Agent);视频类默认进 Video */
/** 一级菜单里点了直接进生成页的三项 */
const GEN_TOP = new Set(["Image", "Video", "Audio"]);
const TYPE_OF_TOOL: [RegExp, string][] = [
  [/^\/(ai-image-generator|photo-angle-editor|ai-image-editor|remove-background|ai-product-photography|ai-inpainting|ai-background-generator|ai-image-extender|image-to-image|ai-photo-relight|ai-infographic-generator|ai-photo-restoration|sketch-to-image|consistent-character|ai-headshot-generator|ai-mockup-generator|ai-thumbnail-maker|image-to-3d)$/, "image"],
  [/^\/(ai-music-generator|ai-song-generator|ai-jingle-generator)$/, "music"],
  [/^\/ai-sound-effects-generator$/, "sfx"],
  [/^\/(ai-voice-over|text-to-speech|ai-voice-clone|ai-voice-changer|ai-voice-enhancer|ai-podcast-generator)$/, "audio"],
  [/^\/(marketing-agent|ai-ad-generator|url-to-video|ai-ugc-video-generator|ai-product-video-generator)$/, "marketing"],
];

/* 一级网址里不是功能 / 模型的页面(点了照常去页面本身) */
const NOT_TOOL = new Set(["/pricing", "/affiliate", "/enterprise", "/blog", "/help", "/faq", "/whats-new", "/customers", "/about", "/contact", "/contact-sales", "/app", "/api", "/resources", "/glossary", "/learn", "/usecase", "/templates", "/solutions", "/free-tools", "/tools", "/models", "/integrations", "/research", "/press", "/trust", "/content-policy", "/privacy-policy", "/terms-of-service", "/llms.txt"]);

/** Header 里的链接点了去哪：产品工具(原型页),模型带上模型;没有对应工具的退回落地页 */
/* 2026-11-19 Monica:Header 点到具体工具 / 模型时，生成器里预填这个工具 + 模型最能出效果的提示词。
   模型：用这个模型自己最好的真实成片的提示词(落地页首屏第一条);工具：用该工具落地页的示例提示词([占位]去掉括号);
   都没有时用同类总工具的提示词。只对生成器网址加;ai-tools 里的上传类工具(去背景、放大、换衣…)没有提示词框，不加。 */
const TYPE_TOOL: Record<string, string> = { video: "ai-video-generator", image: "ai-image-generator", audio: "ai-voice-over" };
const toolPrompt = (slug: string) => TOOLS_CONTENT.find((t) => t.slug === slug)?.prompt?.replace(/\[([^\]]+)\]/g, "$1");
function bestPrompt(href: string): string | undefined {
  const slug = href.replace(/^\//, "") === "seedance" ? "seedance-2-5" : href.replace(/^\//, "");
  const model = MODELS.find((x) => x.slug === slug);
  if (model) {
    const own = mediaOf(slug).find((x) => x.prompt && x.kind === model.type)?.prompt;
    return own ?? toolPrompt(TYPE_TOOL[model.type] ?? "ai-video-generator");
  }
  return toolPrompt(slug);
}
export function appOf(raw: string): string | undefined {
  /* 2026-11-24 Monica:MCP skill 不进产品，去 MCP Skills 落地页对应的 skill 页(见 targetOf) */
  if (/-mcp-skill$/.test(raw)) return undefined;
  const href = raw === "/models/seedance" ? "/seedance" : raw;
  const url = appBase(href);
  if (!url || !url.startsWith(GEN)) return url;
  const pr = bestPrompt(href);
  return pr ? `${url}${url.includes("?") ? "&" : "?"}prompt=${encodeURIComponent(pr)}` : url;
}

/** Header 免费小工具 → Marketing Agent 的预填提示词 */
const FREE_AGENT_PROMPT: Record<string, string> = {
  "/ai-hook-generator": "Write 5 scroll-stopping hooks for my product's video ad, each under 8 words.",
  "/ai-ad-script-generator": "Write a 15s video ad script for my product: hook, problem, product demo and a Shop now ending.",
  "/ai-ad-copy-generator": "Write Facebook and Instagram ad copy for my product: 3 primary texts, 3 headlines and a CTA.",
  "/tiktok-caption-generator": "Write 5 TikTok captions with hashtags for my product video.",
  "/video-resizer": "Resize my video ad to 9:16, 1:1 and 4:5 for Reels, Stories and Feed.",
  "/safe-zone-checker": "Check my video ad for text, faces and logos outside the TikTok and Reels safe zones.",
  "/video-compressor": "Compress my video ad to a smaller file without losing quality, ready to upload to Meta Ads.",
  "/image-resizer": "Resize my product image for every Facebook ad placement: Feed, Stories and right column.",
  "/video-to-gif": "Turn my video ad into a short looping GIF for email and banners.",
  "/ad-size-guide": "Make my ad in every Meta placement size: Feed 4:5, Stories and Reels 9:16, and square 1:1.",
};

function appBase(href: string): string | undefined {
  if (APP_PAGE[href]) return APP_PAGE[href];
  /* 2026-11-24 Monica:Header 里的免费小工具不去落地页(落地页留给 Footer 做 SEO),直接进 Marketing Agent 并预填对应提示词 */
  if (FREE_AGENT_PROMPT[href]) return `${GEN}?type=marketing&prompt=${encodeURIComponent(FREE_AGENT_PROMPT[href])}`;
  if (freeBySlug(href.replace(/^\//, ""))) return `/prototypes/site${href}`;
  if (PROTO_PAGE[href]) return PROTO_PAGE[href];
  /* 2026-11-19 落地页改成一级网址(/kling-4-0、/ai-image-generator),模型按 slug 认 */
  const m = href.match(/^\/([a-z0-9-]+)$/);
  if (m && (m[1] === "seedance" || [...MODELS, ...EXTRA_MODELS].some((x) => x.slug === m[1]))) {
    const slug = m[1] === "seedance" ? "seedance-2-5" : m[1];
    if (GEN_KEY[slug]) return `${GEN}?model=${GEN_KEY[slug]}`;
    const model = [...MODELS, ...EXTRA_MODELS].find((x) => x.slug === slug);
    if (model?.type === "image") return `${GEN}?type=image&imageModel=${IMAGE_KEY[slug] ?? slug}`;
    if (model?.type === "audio") {
      const [type, key] = AUDIO_KEY[slug] ?? ["audio", slug];
      return `${GEN}?type=${type}&audioModel=${key}`;
    }
    if (model) return GEN;
  }
  for (const [re, type] of TYPE_OF_TOOL) if (re.test(href)) return `${GEN}?type=${type}`;
  /* 其余一级网址的功能落地页 → 视频生成器(不是功能页的站内页面排除在外) */
  if (/^\/[a-z0-9-]+$/.test(href) && !NOT_TOOL.has(href)) return GEN;
  return undefined;
}

/** 落地页模板内部链接用：按 targetOf 跳转，没做的走 onLink(toast) */
export function go(href: string, status: LinkStatus, label: string, onLink: OnLink) {
  const t = targetOf({ href, status });
  if (!t) return onLink({ label, href, status });
  if (t.external) window.open(t.url, "_blank", "noopener");
  else window.location.href = t.url;
}

/** 原型里所有链接都走这里:保留真实 href(可抓取);点击按 targetOf 打开真页面 / 原型页，没做的给 toast */
export function NavA({
  link,
  onLink,
  className,
  children,
  toApp = false,
}: {
  link: Pick<NavLink, "label" | "href" | "status">;
  onLink: OnLink;
  className?: string;
  children: ReactNode;
  /** Header 里的功能 / 模型链接：点了进产品工具 */
  toApp?: boolean;
}) {
  return (
    <a
      /* 2026-11-25 落地页已删的产品(Design Studio、3D Studio 等)直接链到产品，不留 404 链接 */
      href={isRemoved(link.href) ? appOf(link.href) ?? targetOf(link)?.url ?? resolveHref(link.href) : resolveHref(link.href)}
      className={className}
      onClick={(e: MouseEvent) => {
        if (link.href.startsWith("http")) return; // 外链(Ask AI、社交)照常新窗口打开
        e.preventDefault();
        const app = toApp ? appOf(link.href) : undefined;
        if (app) {
          window.location.href = app;
          return;
        }
        const t = targetOf(link);
        if (!t) return onLink(link);
        if (t.external) window.open(t.url, "_blank", "noopener");
        else window.location.href = t.url;
      }}
    >
      {children}
    </a>
  );
}

/* ───────── 大菜单面板(2026-11-19 按 Higgsfield 新版改)─────────
   结构：顶部一排图卡(主入口)→ 两三列列表(工具带图标、模型带厂商缩写,超过 5 个收进 More)→ 底部一条推荐。
   SEO:图卡、折叠的链接、推荐条都是真实 <a href>,始终在 DOM 里(More 只切 hidden)。
   配色只用官方色板:#240A03 正文 / #FF744D 品牌橙 / #6F6C6C 次要字 / #F6F6F6 浅底 / #FFF3EC 悬停。 */

const ICON: Record<string, LucideIcon> = {
  "/ai-ad-generator": Megaphone,
  "/hybrid-reel": Layers,
  "/canvas": Workflow,
  "/text-to-video": Type,
  "/faceless-video-generator": VenetianMask,
  "/upscale-video": Maximize2,
  "/motion-control": Move,
  "/video-character-swap": Replace,
  "/3d-to-video": Box,
  "/ai-lip-sync": MicVocal,
  "/ai-spokesperson": Presentation,
  "/3d-studio": Boxes,
  "/remove-background": Eraser,
  "/remove-object": Wand2,
  "/upscale-image": ImageUp,
  "/photo-angle-editor": Rotate3d,
  "/ad-creative-maker": RectangleHorizontal,
  "/brand-kit": Palette,
  "/ai-presentation-maker": Presentation,
  "/ai-website-builder": Globe,
  "/ai-sound-effects-generator": AudioLines,
  "/ai-hook-generator": Zap,
  "/ai-ad-script-generator": ScrollText,
  "/ai-ad-copy-generator": PenLine,
  "/tiktok-caption-generator": Captions,
  "/video-resizer": Crop,
  "/ai-commercials": Clapperboard,
  "/ai-marketing-videos": BarChart3,
  "/safe-zone-checker": Frame,
  "/video-compressor": FileDown,
  "/image-resizer": Scaling,
  "/video-to-gif": Film,
  "/ad-size-guide": Ruler,
  "/help": CircleHelp,
  "/usecase": ScrollText,
  "/blog": Newspaper,
  "/faq": CircleHelp,
  "/glossary": BookA,
  "/whats-new": Megaphone,
  "/customers": Quote,
  "/affiliate": Handshake,
  "/app": Smartphone,
  "/api": Code,
  "/llms.txt": FileText,
  "/tiktok-ads-benchmarks": FileText,
  "/community-gallery": Users,
  "/seedance-2-5-showcase": Clapperboard,
  "/ai-inpainting": Brush,
  "/ai-background-generator": ImagePlus,
  "/ai-image-extender": Expand,
  "/image-to-image": Images,
  "/ai-photo-relight": Sun,
  "/ai-infographic-generator": ChartBar,
  "/ai-photo-restoration": History,
  "/sketch-to-image": PencilLine,
  "/consistent-character": UserRoundCheck,
  "/ai-headshot-generator": CircleUserRound,
  "/ai-mockup-generator": Package,
  "/image-to-3d": Box,
  "/ai-thumbnail-maker": RectangleHorizontal,
  "/ai-caption-generator": Captions,
  "/ai-b-roll-generator": Film,
  "/ai-short-drama": Clapperboard,
  "/ai-animation-generator": Sparkle,
  "/ai-anime-generator": Sparkle,
  "/ai-dance-video": Music,
  "/ai-video-extender": MoveHorizontal,
  "/first-last-frame": GalleryHorizontal,
  "/ai-camera-control": Video,
  "/ai-storyboard-generator": LayoutGrid,
  "/ai-video-background-remover": Eraser,
  "/long-video-to-shorts": Scissors,
  "/ai-dubbing": Languages,
  "/ai-video-translator": Languages,
  "/ai-music-video-generator": Music,
  "/ai-song-generator": MicVocal,
  "/ai-jingle-generator": Music,
  "/ai-lyrics-generator": PenLine,
  "/ai-voice-changer": AudioLines,
  "/ai-voice-enhancer": Wand2,
  "/ai-podcast-generator": Mic,
  "/ai-graphic-design": Palette,
  "/ai-social-media-post-generator": LayoutTemplate,
  "/ai-instagram-post-generator": Smartphone,
  "/ai-carousel-maker": GalleryHorizontal,
  "/ai-poster-generator": RectangleHorizontal,
  "/ai-flyer-maker": FileText,
  "/ai-logo-generator": Sparkle,
  /* MCP Skills(2026-11-24 Monica:「icon 配好」—— 每个 skill 一个能看出用途的图标，不再统一用灯泡) */
  "/long-to-shorts-mcp-skill": Scissors,
  "/video-editor-mcp-skill": Captions,
  "/ugc-product-review-mcp-skill": Smartphone,
  "/link-to-ad-mcp-skill": Link2,
  "/ad-localizer-mcp-skill": Languages,
  "/ad-hook-variants-mcp-skill": Zap,
  "/ad-remake-mcp-skill": Replace,
  "/ad-resizer-mcp-skill": Scaling,
  "/ad-variations-mcp-skill": Users,
  "/competitor-ad-research-mcp-skill": ChartBar,
  "/faceless-explainer-mcp-skill": Presentation,
  "/festival-campaign-mcp-skill": Gift,
  "/marketplace-listing-mcp-skill": Package,
  "/photo-to-3d-mcp-skill": Box,
  "/product-ad-mcp-skill": Megaphone,
  "/product-photos-mcp-skill": ImagePlus,
  "/product-promo-video-mcp-skill": MonitorPlay,
  "/short-drama-mcp-skill": Film,
  "/talking-product-mcp-skill": MicVocal,
  "/transparent-video-mcp-skill": Layers,
  "/try-on-ugc-mcp-skill": Shirt,
  "/unboxing-ugc-mcp-skill": PackageOpen,
  "/video-understand-mcp-skill": ScrollText,
  "/viral-remix-mcp-skill": TrendingUp,
  "/3d-product-video-mcp-skill": Rotate3d,
  "/3d-director-mcp-skill": Clapperboard,
};
/* 按网址前缀兜底(模板 / 方案 / 问答 / 对比 / 集成这类同质链接用同一个图标) */
function iconOf(href: string): LucideIcon {
  if (ICON[href]) return ICON[href];
  if (href.startsWith("/templates/")) return LayoutTemplate;
  if (href.startsWith("/solutions/")) return Building2;
  if (href.startsWith("/use-cases/")) return Target;
  if (href.startsWith("/learn/")) return MessageCircleQuestion;
  if (href.startsWith("/compare/") || href.startsWith("/best/")) return ArrowLeftRight;
  if (href.startsWith("/integrations")) return Plug;
  if (href.startsWith("/mcp-skills")) return Workflow;
  return Lightbulb;
}
/* 模型不用厂商 logo(别人的商标),用厂商名缩写 */
const MODEL_BY_HREF = new Map(MODELS.map((m) => [m.slug === "seedance-2-5" ? "/models/seedance" : `/${m.slug}`, m]));
const monogram = (vendor: string) => (vendor.match(/[A-Z]/g) ?? [vendor[0]]).slice(0, 2).join("");

/* 音频 / 设计图卡：代码画的小界面(装饰波形、版式示意，不代表任何数据);图片都是自家成片 */
const WAVE = [34, 58, 82, 46, 96, 62, 38, 72, 100, 52, 76, 42, 66, 30, 54, 80, 44];
function Bars({ n = 14, tone = "brand", h = 34 }: { n?: number; tone?: "brand" | "muted"; h?: number }) {
  return (
    <span aria-hidden className="flex items-center gap-[3px]" style={{ height: h }}>
      {WAVE.slice(0, n).map((v, i) => (
        <span key={i} className={`w-[3px] rounded-full ${tone === "brand" ? "bg-[#FF744D]" : "bg-[#240A03]/25"}`} style={{ height: `${v}%` }} />
      ))}
    </span>
  );
}
const SMI = "/prototypes/site/models";
const NAVA = "/prototypes/site/nav/audio";
/* 深色小面板：铺满整张卡 */
/* 2026-11-25 Monica:「做成动起来的是不是好点」—— 音频卡全部动起来：声波按 4s 一圈从左到右「播放」(橙色盖过灰色 + 白色播放头),
   声波本身轻轻起伏像在出声，均衡器跳动，录音红点闪。系统开了「减少动态效果」就停在原来的静态画面。 */
const AUDIO_CSS = `
@keyframes wv-sweep{0%{clip-path:inset(0 var(--wv-s) 0 0)}85%,100%{clip-path:inset(0 0 0 0)}}
.wv-sweep{animation:wv-sweep 4s linear infinite}
@keyframes wv-head{0%{left:var(--wv-h)}85%,100%{left:calc(100% - 1.5px)}}
.wv-head{animation:wv-head 4s linear infinite}
@keyframes wv-talk{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.5)}}
.wv-talk{animation:wv-talk .9s ease-in-out infinite}
@keyframes wv-eq{0%,100%{transform:scaleY(.3)}50%{transform:scaleY(1)}}
.wv-eq{transform-origin:bottom;animation:wv-eq var(--d) ease-in-out infinite}
@keyframes wv-blink{50%{opacity:.2}}
.wv-blink{animation:wv-blink 1.2s steps(1) infinite}
@keyframes wv-l1{0%,27%{color:#FF744D}28%,100%{color:rgba(255,255,255,.25)}}
@keyframes wv-l2{0%,27%{color:rgba(255,255,255,.25)}28%,56%{color:#FF744D}57%,100%{color:rgba(255,255,255,.25)}}
@keyframes wv-l3{0%,56%{color:rgba(255,255,255,.25)}57%,100%{color:#FF744D}}
.wv-l1{animation:wv-l1 4s linear infinite}.wv-l2{animation:wv-l2 4s linear infinite}.wv-l3{animation:wv-l3 4s linear infinite}
@keyframes sx-bar{0%{clip-path:inset(0 100% 0 0)}28%,33.3%{clip-path:inset(0 0 0 0)}33.4%,100%{clip-path:inset(0 100% 0 0)}}
.sx-bar{animation:sx-bar 4s linear infinite}
@keyframes sx-tag{0%,33.3%{background:#FF744D;color:#15141A}33.4%,100%{background:rgba(255,255,255,.08);color:rgba(255,255,255,.6)}}
.sx-tag{animation:sx-tag 4s linear infinite}
@media (prefers-reduced-motion:reduce){.wv-sweep,.wv-head,.wv-talk,.wv-eq,.wv-blink,.wv-l1,.wv-l2,.wv-l3,.sx-bar,.sx-tag{animation:none}}
`;
/* 2026-11-25 Monica:「卡片变大了，内容也要变大适配」—— 三张一排(wide)时卡宽 = 四张一排 × 4/3,
   内容按四张一排的尺寸排好后整体放大 4/3(内层先缩成原卡宽高再 scale 回来，百分比留白和图标比例都不变) */
const WIDE_SCALE = 4 / 3;
const AudioScale = createContext(1);
function AudioPanel({ children }: { children: ReactNode }) {
  const k = useContext(AudioScale);
  return (
    <span className="absolute inset-0 overflow-hidden bg-[radial-gradient(120%_120%_at_20%_0%,#26232E,#15141A_70%)]">
      <style>{AUDIO_CSS}</style>
      <span className="absolute left-0 top-0 grid place-items-center" style={{ width: `${100 / k}%`, height: `${100 / k}%`, transform: k === 1 ? undefined : `scale(${k})`, transformOrigin: "0 0" }}>
        {children}
      </span>
    </span>
  );
}
/* 声波:n 根，前 played 根是橙色(from 之前的是原声灰白),其余暗灰;head = 在播放位置画一根白色播放头。
   anim = 播放动画(橙色从 from 扫到末尾，静态/减少动态时停在 played);talk = 每根轻轻起伏 */
const WAVE_H = [35, 55, 80, 45, 100, 65, 90, 50, 75, 40, 95, 60, 85, 45, 70, 30, 60, 90, 50, 75, 40, 65, 35, 55];
function Wave({ n, played, from = 0, h = 22, head = false, anim = false, talk = anim }: { n: number; played: number; from?: number; h?: number; head?: boolean; anim?: boolean; talk?: boolean }) {
  const bars = (color: (k: number) => string) =>
    Array.from({ length: n }, (_, k) => (
      <span key={k} className="flex h-full items-center">
        <span
          className={`w-[2.5px] rounded-full ${color(k)} ${talk ? "wv-talk" : ""}`}
          style={{ height: `${WAVE_H[k % WAVE_H.length]}%`, animationDelay: talk ? `${-((k * 0.23) % 0.9).toFixed(2)}s` : undefined }}
        />
      </span>
    ));
  const s = (from / n) * 100;
  const p = (played / n) * 100;
  if (!anim)
    return (
      <span aria-hidden className="relative flex items-center gap-[2.5px]" style={{ height: h }}>
        {bars((k) => (k < from ? "bg-white/45" : k < played ? "bg-[#FF744D]" : "bg-white/20"))}
        {head && <span className="absolute top-0 h-full w-[1.5px] rounded-full bg-white" style={{ left: `${p}%` }} />}
      </span>
    );
  return (
    <span aria-hidden className="relative flex items-center gap-[2.5px]" style={{ height: h }}>
      {bars((k) => (k < from ? "bg-white/45" : "bg-white/20"))}
      <span className="wv-sweep absolute inset-0 flex items-center gap-[2.5px]" style={{ "--wv-s": `${100 - s}%`, clipPath: `inset(0 ${100 - p}% 0 0)` } as CSSProperties}>
        {bars((k) => (k < from ? "bg-white/45" : "bg-[#FF744D]"))}
      </span>
      {head && <span className="wv-head absolute top-0 h-full w-[1.5px] rounded-full bg-white" style={{ "--wv-h": `${s}%`, left: `${p}%` } as CSSProperties} />}
    </span>
  );
}
const SFX_ROWS: [string, number[]][] = [
  ["Glass break", [14, 100, 88, 62, 44, 32, 24, 18, 14, 12, 10, 9, 8, 8]],
  ["Rain", [34, 46, 30, 42, 38, 28, 44, 36, 32, 46, 30, 40, 34, 38]],
  ["Whoosh", [8, 12, 20, 32, 50, 72, 92, 100, 84, 58, 36, 20, 12, 8]],
];
function TileArt({ art, img }: { art: NonNullable<NavTile["art"]>; img?: string }) {
  /* ── Audio 四张卡(2026-11-24 Monica 给的 Higgsfield 对照):音频不放照片，放干净的界面示意 ——
        深色小面板 + 荧光绿声波，和 Image / Video 那两排深色图卡是一套。头像是从同一批素材里裁的。 ── */
  if (art === "voice")
    /* Create Voice Over:一个人在说话 → 声波正在录 / 播到一半 */
    return (
      <AudioPanel>
        <span className="flex w-full items-center gap-2.5 px-[8%]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${NAVA}/face-voice.webp`} alt="" loading="lazy" className="size-[30%] max-w-[42px] shrink-0 rounded-full object-cover ring-2 ring-[#FF744D]" />
          {/* 2026-11-24 Monica:「这要出现一些文案」—— 声波上面放正在配的那句台词 */}
          <span className="flex min-w-0 flex-1 flex-col gap-[6px]">
            <span className="truncate text-left text-[9.5px] font-medium leading-none text-[#FF744D]">&ldquo;New drop lands Friday.&rdquo;</span>
            <Wave n={17} played={10} h={18} anim />
          </span>
        </span>
      </AudioPanel>
    );
  if (art === "tts")
    /* Convert Text to Speech:正在读的那一行高亮，下面播放键 + 进度 */
    return (
      <AudioPanel>
        <span className="flex w-full flex-col gap-[7px] px-[9%]">
          <span className="text-left text-[9.5px] font-medium leading-[1.35]">
            {/* 正在读的那一行跟着播放进度依次亮起 */}
            <span className="wv-l1 block truncate text-white/30">Meet the serum that works</span>
            <span className="wv-l2 block truncate text-[#FF744D]">while you sleep, and wakes</span>
            <span className="wv-l3 block truncate text-white/20">up brighter every morning.</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="grid size-[18px] shrink-0 place-items-center rounded-full bg-[#FF744D] text-[#15141A]">
              <Play className="size-2.5 translate-x-px fill-current" />
            </span>
            <Wave n={24} played={12} h={14} head anim />
          </span>
        </span>
      </AudioPanel>
    );
  if (art === "clone")
    /* Clone Voice(2026-11-24 调研后重画):「两个头像 + 声波」是 Higgsfield 画变声(Voice Change)的方式，放在克隆上会读成变声。
       照 ElevenLabs 的讲法：录一小段样本(灰、0:10)→ 同一个声音读出新台词(荧光绿)。只有一个人。 */
    return (
      <AudioPanel>
        <span className="flex w-full flex-col gap-[7px] px-[9%]">
          <span className="flex items-center gap-2">
            {/* 2026-11-25 Monica:去掉头像右上角的录音小红点 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${NAVA}/face-clone.webp`} alt="" loading="lazy" className="size-[22px] shrink-0 rounded-full object-cover ring-1 ring-white/25" />
            <Wave n={9} played={9} from={9} h={14} talk />
            <span className="text-[9px] font-medium leading-none text-white/40">0:10 sample</span>
          </span>
          <span className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${NAVA}/face-clone.webp`} alt="" loading="lazy" className="size-[22px] shrink-0 rounded-full object-cover ring-2 ring-[#FF744D]" />
            <span className="flex min-w-0 flex-1 flex-col gap-[4px]">
              <span className="truncate text-left text-[9.5px] font-medium leading-none text-[#FF744D]">&ldquo;Hey, it&rsquo;s me again!&rdquo;</span>
              <Wave n={18} played={18} h={12} anim />
            </span>
          </span>
        </span>
      </AudioPanel>
    );
  if (art === "change")
    /* Change Voice:两个不同的人 —— 左边原声(灰),右边换成的声音(绿圈),中间声波从灰变绿(Higgsfield 的 Voice Change 卡就是这个画法) */
    return (
      <AudioPanel>
        <span className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${NAVA}/face-clone.webp`} alt="" loading="lazy" className="size-[30%] max-w-[40px] shrink-0 rounded-full object-cover ring-2 ring-white/25" />
          <Wave n={15} played={15} from={6} h={20} anim />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${NAVA}/face-clone-b.webp`} alt="" loading="lazy" className="size-[30%] max-w-[40px] shrink-0 rounded-full object-cover ring-2 ring-[#FF744D]" />
        </span>
      </AudioPanel>
    );
  if (art === "music")
    /* Make Music:封面 + 一行风格描述(2026-11-24 Monica 同意：加上「输入风格」才读得出是生成，不像播放器)+ 正在唱的歌词 + 均衡器 */
    return (
      <AudioPanel>
        <span className="flex w-full items-center gap-2.5 px-[9%]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${NAVA}/cover-music.webp`} alt="" loading="lazy" className="size-[36%] max-w-[48px] shrink-0 rounded-[9px] object-cover ring-1 ring-white/15" />
          <span className="flex min-w-0 flex-1 flex-col items-start gap-[5px]">
            <span className="inline-flex max-w-full items-center gap-1 truncate rounded-full bg-white/[0.08] px-1.5 py-[3px] text-[8.5px] font-medium leading-none text-white/60">
              <Sparkle aria-hidden className="size-2 shrink-0 text-[#FF744D]" />
              Lo-fi pop, dreamy
            </span>
            {/* 歌词(Monica 2026-11-24:「显示歌词」):正在唱的那句高亮 */}
            <span className="block w-full truncate text-left text-[9px] font-medium leading-none text-[#FF744D]">City lights, wide awake</span>
            <span aria-hidden className="flex h-[14px] items-end gap-[2.5px]">
              {[35, 60, 45, 90, 70, 100, 55, 80, 40, 65, 30, 50].map((v, k) => (
                <span key={k} className="wv-eq w-[3px] rounded-t-[1.5px] bg-[#FF744D]" style={{ height: `${v}%`, "--d": `${0.55 + ((k * 7) % 5) * 0.12}s`, animationDelay: `${-((k * 0.19) % 0.6).toFixed(2)}s` } as CSSProperties} />
              ))}
            </span>
          </span>
        </span>
      </AudioPanel>
    );
  if (art === "sfx")
    /* Generate Sound Effects(2026-11-24 改):原来「一行描述 + 一条声波」和 Text to Speech 版式太像 → 改成三个音效标签，
       每个配一段形状不同的短波形(碎裂 = 尖峰后衰减 / 雨 = 细密均匀 / 呼啸 = 先涨后落),一眼看出是「一个个音效」 */
    return (
      <AudioPanel>
        <span className="flex w-full flex-col gap-[6px] px-[9%]">
          {/* 2026-11-25 Monica:「Sound Effects 那张也做成动的」—— 三个音效轮流播放，4s 一圈：
              轮到的那行标签变橙，它的波形从左往右播成橙色;减少动态效果时停在第一行高亮 */}
          {SFX_ROWS.map(([label, bars], r) => {
            const delay = { animationDelay: `${-((3 - r) % 3) * (4 / 3)}s` };
            const wave = (cls: string) => bars.map((v, k) => <span key={k} className={`w-[2px] rounded-full ${cls}`} style={{ height: `${v}%` }} />);
            return (
              <span key={label} className="flex items-center gap-2">
                <span style={delay} className={`sx-tag w-[66px] shrink-0 truncate whitespace-nowrap rounded-full px-1.5 py-[3px] text-left text-[8.5px] font-medium leading-none ${r === 0 ? "bg-[#FF744D] text-[#15141A]" : "bg-white/[0.08] text-white/60"}`}>{label}</span>
                <span aria-hidden className="relative flex h-[14px] flex-1 items-center gap-[2px]">
                  {wave("bg-white/35")}
                  <span style={{ ...delay, clipPath: r === 0 ? "inset(0 0 0 0)" : "inset(0 100% 0 0)" }} className="sx-bar absolute inset-0 flex items-center gap-[2px]">
                    {wave("bg-[#FF744D]")}
                  </span>
                </span>
              </span>
            );
          })}
        </span>
      </AudioPanel>
    );
  if (art === "formats")
    /* Design Studio:同一张图一键出 1:1 / 4:5 / 9:16 三个尺寸(Magic Resize) */
    return (
      <span className="flex size-full items-end justify-center gap-2 pb-[13%]">
        {[
          [`${SMI}/nano-banana-2-1/static.jpg`, "aspect-square w-[22%]"],
          [`${SMI}/nano-banana-pro/pro_portrait.jpg`, "aspect-[4/5] w-[22%]"],
          [`${SMI}/grok-imagine-2-0/story.jpg`, "aspect-[9/16] w-[19%]"],
        ].map(([src, cls]) => (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img key={src} src={src} alt="" loading="lazy" className={`${cls} rounded-[5px] object-cover shadow-[0_8px_18px_-8px_rgba(36,10,3,0.45)] ring-1 ring-white transition duration-500 ease-out group-hover/tile:-translate-y-1`} />
        ))}
      </span>
    );
  /* app:MCP 的入口卡(对照 Higgsfield):浅底上一枚 app 图标，底纹两道很淡的弧线 */
  /* app-code:Claude Code = Claude 图标 + 右下角一枚深色终端角标 */
  if (art === "app" || art === "app-code")
    return (
      <span className="absolute inset-0 flex items-center justify-center">
        <svg aria-hidden viewBox="0 0 200 125" preserveAspectRatio="none" className="absolute inset-0 size-full text-[#240A03]/[0.06]">
          <path d="M-10 110 C 50 40, 120 140, 210 30" fill="none" stroke="currentColor" strokeWidth="1" />
          <path d="M-10 70 C 60 0, 130 100, 210 -10" fill="none" stroke="currentColor" strokeWidth="1" />
        </svg>
        <span className="relative flex size-11 items-center justify-center rounded-[13px] bg-white shadow-[0_10px_24px_-12px_rgba(36,10,3,0.4)] ring-1 ring-[#240A03]/[0.06] transition duration-500 ease-out group-hover/tile:-translate-y-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {img && <img src={img} alt="" className="size-6 object-contain" />}
          {art === "app-code" && (
            <span className="absolute -bottom-1 -right-1 flex h-4 items-center rounded-[5px] bg-[#240A03] px-1 font-mono text-[8px] font-bold leading-none text-white ring-2 ring-white">&gt;_</span>
          )}
        </span>
      </span>
    );
  /* site:浏览器窗口里的一页落地页 */
  return (
    <span className="absolute inset-x-[13%] top-[15%] bottom-0 overflow-hidden rounded-t-[8px] bg-white shadow-[0_10px_24px_-10px_rgba(36,10,3,0.45)] ring-1 ring-[#240A03]/[0.08] transition duration-500 ease-out group-hover/tile:-translate-y-1">
      <span className="flex h-[14%] items-center gap-1 border-b border-[#240A03]/[0.06] px-2">
        {[0, 1, 2].map((i) => (
          <span key={i} className="size-1 rounded-full bg-[#240A03]/20" />
        ))}
        <span className="ml-1.5 h-[45%] flex-1 rounded-full bg-[#F6F6F6] text-[6px] leading-[7px] text-[#6F6C6C]">&nbsp;yourbrand.com</span>
      </span>
      <span className="flex h-[86%] gap-2 p-2">
        <span className="flex flex-1 flex-col justify-center gap-1">
          <span className="h-1.5 w-[85%] rounded-full bg-[#240A03]/80" />
          <span className="h-1.5 w-[60%] rounded-full bg-[#240A03]/80" />
          <span className="mt-1 h-1 w-[70%] rounded-full bg-[#240A03]/15" />
          <span className="mt-1.5 h-2.5 w-[42%] rounded-full bg-gradient-to-r from-[#FFA73C] to-[#FF5255]" />
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {img && <img src={img} alt="" loading="lazy" className="h-full w-[44%] rounded-[5px] object-cover" />}
      </span>
    </span>
  );
}

/* 图卡：图片铺满整张卡(2026-11-24 起，原来是浅底里浮一块内嵌画面);有成片的在浮层打开时循环播放。代码画的卡(音频波形、尺寸示意)仍是浅底 */
/* still:手机抽屉里用，不做进场位移、不自动播放(抽屉常驻 DOM,自动播放会在页面加载时就下载视频) */
function Tile({ t, mark, onLink, i = 0, active = true, still = false, wide = false }: { t: NavTile; mark: boolean; onLink: OnLink; i?: number; active?: boolean; still?: boolean; wide?: boolean }) {
  const vRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = vRef.current;
    if (!v) return;
    if (active && !still && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) v.play().catch(() => {});
    else {
      v.pause();
      v.currentTime = 0;
    }
  }, [active, still]);
  return (
    <NavA toApp link={t} onLink={onLink} className="group/tile block rounded-[16px] outline-none focus-visible:ring-2 focus-visible:ring-[#FF744D]/50">
      <span
        className="block transition duration-500 motion-reduce:!translate-y-0 motion-reduce:transition-none"
        style={{ transform: active ? "translateY(0)" : "translateY(8px)", transitionDelay: active ? `${60 + i * 35}ms` : "0ms", transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)" }}
      >
        {/* wide:一行只有三张时(2026-11-24 Monica:Audio「就 3 个卡片，高度不变，宽度适合」)卡变宽、高度和四张一排时一样 ——
            三列宽 ≈ 四列宽 × 4/3,所以比例 16/10 × 4/3 = 32/15 */}
        <span className={`relative block ${wide ? "aspect-[32/15]" : "aspect-[16/10]"} w-full overflow-hidden rounded-[14px] bg-[#F6F6F6] ring-1 ring-inset ring-[#240A03]/[0.06] transition-colors duration-300 group-hover/tile:bg-[#FFF3EC]`}>
          {t.art ? (
            <AudioScale.Provider value={wide ? WIDE_SCALE : 1}>
              <TileArt art={t.art} img={t.img} />
            </AudioScale.Provider>
          ) : (
            /* 2026-11-24 Monica:「不要间距，充满」—— 图片铺满整张卡，不再留一圈浅底;悬停时图片在卡内轻微放大 */
            <span className="absolute inset-0 overflow-hidden rounded-[14px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.img} alt="" loading="lazy" className="size-full object-cover transition duration-500 ease-out group-hover/tile:scale-[1.05] motion-reduce:transition-none" />
              {t.video && <video ref={vRef} src={t.video} muted loop playsInline preload="none" aria-hidden className="absolute inset-0 size-full object-cover motion-reduce:hidden" />}
            </span>
          )}
          {/* 还不能用的图卡：左上角贴「Coming soon」(2026-11-24 Monica，Studios 除 Canvas / 3D Studio 外都是) */}
          {/* 2026-11-24 Monica:「这个标签现在不显眼」—— 图卡换成深色后，原来的深底白字看不清，改成白底墨字加投影 */}
          {t.badge === "Soon" && <span className="absolute left-2 top-2 rounded-full bg-white px-2.5 py-1.5 text-[11px] font-bold leading-none text-[#240A03] shadow-[0_2px_8px_rgba(0,0,0,0.35)]">Coming soon</span>}
        </span>
        <span className="mt-2 block text-center text-[13px] font-semibold leading-tight text-[#240A03] [text-wrap:balance]">
          {t.labelIcon && (() => { const I = iconOf(t.href); return <I aria-hidden className="mr-1.5 inline-block size-[15px] -translate-y-px align-middle text-[#6F6C6C]" />; })()}
          {navLabel(t)}
          <StatusDot status={t.status} mark={mark} />
        </span>
      </span>
    </NavA>
  );
}

/* ── 悬停详情卡(模型带参数要点，工具一句话)── */
type FlyData = { title: string; desc: string; bullets: { icon: LucideIcon; text: string }[]; icon?: LucideIcon; mono?: string; logo?: string; soon?: boolean };
const resText = (r: string) => r.replace(/^(\d+)P$/, "$1p").replace(/^(\d+(?:\.\d+)?)k$/i, "$1K");
function flyOf(href: string): FlyData | null {
  const m = MODEL_BY_HREF.get(href);
  if (m) {
    const f = factsOf(m.slug);
    const b: FlyData["bullets"] = [];
    if (f?.durations) b.push({ icon: Clock, text: `Up to ${f.durations[1]} seconds` });
    const quality = !!f?.resolutions?.length && f.resolutions.every((x) => /^(low|medium|high|x-?high|max|standard|hd)$/i.test(x));
    if (f?.resolutions?.length) b.push({ icon: MonitorPlay, text: quality ? `${f.resolutions.length} quality levels` : `Up to ${resText(f.resolutions[f.resolutions.length - 1])}` });
    if (f?.refs?.images) b.push({ icon: Images, text: `Up to ${f.refs.images} reference image${f.refs.images > 1 ? "s" : ""}` });
    if (m.type === "video" && f) b.push({ icon: AudioLines, text: f.soundOff ? "Native audio, can be turned off" : "Native audio" });
    for (const n of f?.notes ?? []) b.push({ icon: Check, text: n.replace(/\.$/, "") });
    return { title: m.name, desc: m.desc, bullets: b.slice(0, 3), mono: monogram(m.vendor), logo: modelLogo(m)?.src, soon: m.release === "v1.13" };
  }
  const d = FLYOUT_DESC[href];
  return d ? { title: "", desc: d, bullets: [], icon: iconOf(href) } : null;
}
export type FlyState = { href: string; label: string; side: "left" | "right"; top: number } | null;
function Flyout({ fly, panelWidth }: { fly: FlyState; panelWidth: number }) {
  const [last, setLast] = useState<FlyState>(null);
  useEffect(() => {
    if (fly) setLast(fly);
  }, [fly]);
  const f = fly ?? last;
  const d = f ? flyOf(f.href) : null;
  if (!f || !d) return null;
  const Icon = d.icon;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute z-10 w-[252px] rounded-[18px] bg-white p-4 shadow-[0_1px_2px_rgba(36,10,3,0.04),0_18px_44px_-12px_rgba(36,10,3,0.22)] ring-1 ring-[#240A03]/[0.07] motion-reduce:!transition-none"
      style={{
        top: f.top,
        left: f.side === "left" ? -264 : panelWidth + 12,
        opacity: fly ? 1 : 0,
        transform: fly ? "translateX(0)" : `translateX(${f.side === "left" ? 6 : -6}px)`,
        transition: `opacity 200ms ${EASE}, transform 260ms ${EASE}, top 260ms ${EASE}`,
      }}
    >
      <span className="grid size-9 place-items-center rounded-[10px] bg-[#F6F6F6] text-[#240A03]">
        {d.logo ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={d.logo} alt="" className="size-5 object-contain" />
        ) : d.mono ? <span className="text-[10px] font-bold tracking-tight text-[#6F6C6C]">{d.mono}</span> : Icon && <Icon className="size-[18px]" />}
      </span>
      <p className="mt-3 text-[15px] font-semibold leading-snug text-[#240A03]">{d.title || f.label}</p>
      <p className="mt-1 text-[13px] leading-snug text-[#6F6C6C]">{d.desc}</p>
      {d.bullets.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {d.bullets.map((b) => (
            <li key={b.text} className="flex items-start gap-2 text-[13px] leading-snug text-[#240A03]">
              <b.icon className="mt-px size-3.5 shrink-0 text-[#FF744D]" />
              {b.text}
            </li>
          ))}
        </ul>
      )}
      {d.soon && <p className="mt-3 inline-flex rounded-full bg-[#F6F6F6] px-2 py-0.5 text-[11.5px] font-medium text-[#6F6C6C]">Coming in the next release</p>}
    </div>
  );
}

function GroupList({ g, mark, onLink, onFly }: { g: NavGroup; mark: boolean; onLink: OnLink; onFly?: (href: string, label: string, el: HTMLElement | null) => void }) {
  const [open, setOpen] = useState(false);
  /* 2026-11-23 Monica:「这里怎么没有 More?」—— 原来只多 1 个时不折叠，导致同一个下拉里有的列有 More、有的没有;改成超过 more 个就一律折叠 */
  const cut = g.more && g.links.length > g.more ? g.more : g.links.length;
  const item = (l: NavLink, hidden: boolean) => {
    const m = MODEL_BY_HREF.get(l.href);
    const Icon = m ? null : iconOf(l.href);
    return (
      <li key={l.href + l.label} className={hidden ? "hidden" : undefined} onMouseEnter={(e) => onFly?.(l.href, navLabel(l), e.currentTarget)}>
              <NavA
                toApp
                link={l}
                onLink={onLink}
                className="group/l -mx-2 flex items-center gap-2.5 rounded-lg px-2 py-[7px] transition-colors duration-150 hover:bg-[#F6F6F6] focus-visible:bg-[#F6F6F6] focus-visible:outline-none"
              >
                {m ? (
                  /* 模型 logo(2026-11-24 Monica 给的文件);没有 logo 的厂商退回字母缩写 */
                  modelLogo(m) ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img aria-hidden src={modelLogo(m)!.src} alt="" className="size-5 shrink-0 rounded-[5px] object-contain" />
                  ) : (
                    <span aria-hidden className="grid size-5 shrink-0 place-items-center rounded-[6px] bg-[#F6F6F6] text-[8.5px] font-bold tracking-tight text-[#6F6C6C] transition-colors group-hover/l:bg-white">
                      {monogram(m.vendor)}
                    </span>
                  )
                ) : (
                  Icon && <Icon aria-hidden className="size-4 shrink-0 text-[#6F6C6C] transition group-hover/l:text-[#FF744D]" />
                )}
                <span className="min-w-0 font-medium leading-snug text-[#240A03]">
                  {navLabel(l)}
                  <Badge b={l.badge} />
                  <StatusDot status={l.status} mark={mark} />
                </span>
              </NavA>
            </li>
    );
  };
  return (
    <div className="min-w-0" onMouseLeave={() => onFly?.("", "", null)}>
      {/* 2026-11-19 Monica:分组名只是标题，不可点击(总页入口在列底「All …」) */}
      <p className="mb-1 text-[12.5px] font-medium text-[#6F6C6C]">{g.title}</p>
      {g.sections ? (
        /* Audio 的 Models:四个小节排两列(左 Voice / Voice Clone,右 Music / Sound Effects),一个 More 同时展开四节 */
        <div className={`grid gap-x-6 ${g.sectionCols === 4 ? "grid-cols-4" : "grid-cols-2"}`}>
          {(g.sectionCols === 4 ? g.sections.map((x) => [x]) : [g.sections.slice(0, Math.ceil(g.sections.length / 2)), g.sections.slice(Math.ceil(g.sections.length / 2))]).map((col, c) => (
            <div key={c} className="min-w-0 space-y-2.5">
              {col.map((s) => (
                <div key={s.title}>
                  <p className="pb-0.5 pt-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#6F6C6C]/75">{s.title}</p>
                  <ul>{s.links.map((l, i) => item(l, i >= s.more && !open))}</ul>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
      <ul className={g.cols === 2 ? "grid grid-cols-2 gap-x-8" : undefined}>
        {g.links.map((l, i) => item(l, i >= cut * (g.cols ?? 1) && !open))}
      </ul>
      )}
      {(g.sections ? g.sections.some((s) => s.links.length > s.more) : cut * (g.cols ?? 1) < g.links.length) && (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="mt-0.5 inline-flex items-center gap-1 rounded-md py-1 text-[13px] font-medium text-[#6F6C6C] transition hover:text-[#240A03]"
        >
          {open ? "Less" : "More"}
          <ChevronDown className={`size-3.5 transition ${open ? "rotate-180" : ""}`} />
        </button>
      )}
      {g.footer && (
        <div className="mt-1.5 flex flex-wrap gap-x-6">
          {[g.footer, g.footer2].filter((x): x is NavLink => !!x).map((f) => (
            <NavA key={f.href} link={f} onLink={onLink} className="group flex w-fit items-center gap-1 text-[13px] font-medium text-[#6F6C6C] transition-colors hover:text-[#FF5E3A]">
              {f.label}
              <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" />
              <StatusDot status={f.status} mark={mark} />
            </NavA>
          ))}
        </div>
      )}
    </div>
  );
}

/* MCP(Model Context Protocol)官方字形，和 v1.9 MCP 页同一份;2026-11-24 Monica:导航 MCP 推荐条的图标换成它 */
/* Buzz logo 右上角的四角星：路径和渐变原样取自 public/prototypes/ai-tools/logo.svg,只裁出星星这一块 */
function BuzzStar({ className }: { className?: string }) {
  return (
    <svg viewBox="19.6 0.15 10.7 9.6" fill="none" aria-hidden className={className}>
      <path d="M24.9326 0.650635C25.2625 3.07517 27.3071 4.95474 29.7635 4.95495C27.3074 4.95516 25.2629 6.83431 24.9326 9.25842C24.6022 6.83436 22.5576 4.95526 20.1016 4.95495C22.5579 4.95465 24.6026 3.07512 24.9326 0.650635Z" fill="url(#buzz-star-g)" />
      <defs>
        <linearGradient id="buzz-star-g" x1="20.1016" y1="0.650635" x2="31.0463" y2="7.07198" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFA73C" />
          <stop offset="0.966346" stopColor="#FF5255" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function McpGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" fillRule="evenodd" className={className} aria-hidden>
      <path d="M15.688 2.343a2.588 2.588 0 00-3.61 0l-9.626 9.44a.863.863 0 01-1.203 0 .823.823 0 010-1.18l9.626-9.44a4.313 4.313 0 016.016 0 4.116 4.116 0 011.204 3.54 4.3 4.3 0 013.609 1.18l.05.05a4.115 4.115 0 010 5.9l-8.706 8.537a.274.274 0 000 .393l1.788 1.754a.823.823 0 010 1.18.863.863 0 01-1.203 0l-1.788-1.753a1.92 1.92 0 010-2.754l8.706-8.538a2.47 2.47 0 000-3.54l-.05-.049a2.588 2.588 0 00-3.607-.003l-7.172 7.034-.002.002-.098.097a.863.863 0 01-1.204 0 .823.823 0 010-1.18l7.273-7.133a2.47 2.47 0 00-.003-3.537z" />
      <path d="M14.485 4.703a.823.823 0 000-1.18.863.863 0 00-1.204 0l-7.119 6.982a4.115 4.115 0 000 5.9 4.314 4.314 0 006.016 0l7.12-6.982a.823.823 0 000-1.18.863.863 0 00-1.204 0l-7.119 6.982a2.588 2.588 0 01-3.61 0 2.47 2.47 0 010-3.54l7.12-6.982z" />
    </svg>
  );
}
/* 底部三种：一行推荐条 / 带大图横幅 / 两张并排卡 —— 不同菜单用不同的(Higgsfield 也是各不相同) */
function Promo({ p, mark, onLink }: { p: NavPromo; mark: boolean; onLink: OnLink }) {
  if (p.kind === "banner")
    return (
      <NavA link={{ label: p.title, href: p.href, status: p.status }} onLink={onLink} /* 带短片的横幅：160 被嫌太大(2026-11-24 Monica「太大了」),降到 124;112 只装得下脸 */
      className={`group relative flex overflow-hidden rounded-[16px] bg-[#F6F6F6] ring-1 ring-inset ring-[#240A03]/[0.05] ${p.video ? "h-[124px]" : "h-[112px]"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={p.img}
          alt=""
          loading="lazy"
          className="absolute inset-y-0 right-0 h-full w-[62%] object-cover object-[50%_20%] transition duration-700 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
          style={{ maskImage: "linear-gradient(to right, transparent, black 45%)", WebkitMaskImage: "linear-gradient(to right, transparent, black 45%)" }}
        />
        {p.video && (
          /* Audio 横幅(2026-11-24 Monica:「他需要说话」)换成对镜说话的短片，字幕已烧进视频;两张横幅同为 124 高 */
          <video
            src={p.video}
            poster={p.img}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden
            className="absolute inset-y-0 right-0 h-full w-[62%] object-cover object-center motion-reduce:hidden"
            style={{ maskImage: "linear-gradient(to right, transparent, black 45%)", WebkitMaskImage: "linear-gradient(to right, transparent, black 45%)" }}
          />
        )}
        <span className="relative flex max-w-[52%] flex-col justify-center gap-1 px-5">
          <span className="text-[15px] font-semibold text-[#240A03]">{p.title}</span>
          <span className="text-[13px] leading-snug text-[#6F6C6C]">{p.desc}</span>
          <span className="mt-1 inline-flex items-center gap-0.5 text-[13px] font-semibold text-[#240A03]">
            {p.cta}
            <ChevronRight className="size-3.5 text-[#FF744D] transition group-hover:translate-x-0.5" />
            <StatusDot status={p.status} mark={mark} />
          </span>
        </span>
      </NavA>
    );
  return (
    <NavA link={{ label: p.title, href: p.href, status: p.status }} onLink={onLink} className="group flex items-center gap-3 rounded-[14px] bg-[#F6F6F6] p-2 pr-4 transition-colors duration-200 hover:bg-[#FFF3EC]">
      {p.img ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={p.img} alt="" loading="lazy" className="h-10 w-14 shrink-0 rounded-lg object-cover" />
      ) : (
        <span className="grid h-10 w-14 shrink-0 place-items-center rounded-lg bg-white">
          {p.icon === "audio" ? <Bars n={7} h={18} /> : p.icon === "mcp" ? <McpGlyph className="size-[18px] text-[#FF744D]" /> : (() => {
            const I = { video: Clapperboard, chat: MessageCircleQuestion, chart: BarChart3, team: Building2, audio: AudioLines, mcp: MessageCircleQuestion }[p.icon ?? "video"];
            return <I aria-hidden className="size-[18px] text-[#FF744D]" />;
          })()}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate text-[13.5px]">
        <span className="font-semibold text-[#240A03]">{p.title}</span>
        <span className="ml-2 text-[#6F6C6C]">{p.desc}</span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-0.5 text-[13px] font-semibold text-[#6F6C6C] transition group-hover:text-[#240A03]">
        {p.cta}
        <ChevronRight className="size-3.5 transition group-hover:translate-x-0.5" />
        <StatusDot status={p.status} mark={mark} />
      </span>
    </NavA>
  );
}
function PromoCard({ p, mark, onLink }: { p: NavPromo; mark: boolean; onLink: OnLink }) {
  return (
    <NavA link={{ label: p.title, href: p.href, status: p.status }} onLink={onLink} className="group flex items-center gap-3.5 rounded-[14px] p-1.5 transition-colors duration-200 hover:bg-[#F6F6F6]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={p.img} alt="" loading="lazy" /* 2026-11-24 Monica:「放大点」—— 96×64 → 150×100,再按「小一点点」收到 126×84 */
        className="h-[84px] w-[126px] shrink-0 rounded-[11px] object-cover ring-1 ring-[#240A03]/[0.06]" />
      <span className="min-w-0">
        <span className="block text-[14px] font-semibold text-[#240A03]">
          {p.title}
          <StatusDot status={p.status} mark={mark} />
        </span>
        <span className="mt-0.5 block text-[13px] leading-snug text-[#6F6C6C]">{p.desc}</span>
      </span>
    </NavA>
  );
}

/* 菜单宽度跟内容走：三列 / 图卡网格的宽，两列的窄 */
/* 2026-11-23 Monica:菜单可以宽一点 */
/* 带小节的(Audio 模型分四类)加宽到 860,长模型名(ElevenLabs Sound Effects v3)不折行 */
const panelWidth = (item: TopItem) => (item.tabs || (item.groups?.length ?? 0) >= 3 ? 900 : item.groups?.some((g) => g.sections) ? 860 : 780);


function MegaPanel({
  item,
  mark,
  onLink,
  compact,
  active = true,
  width,
  onFly,
}: {
  item: TopItem;
  mark: boolean;
  onLink: OnLink;
  compact: boolean;
  active?: boolean;
  width: number;
  onFly?: (href: string, label: string, el: HTMLElement | null) => void;
}) {
  const groups = item.groups ?? [];
  const tiles = item.tiles ?? [];
  const [tab, setTab] = useState(item.tabs?.[0] ?? "All");
  const bodyRef = useRef<HTMLDivElement>(null);
  const [fade, setFade] = useState(false);
  /* 内容超出高度时面板内滚动，底部渐隐提示还有(Higgsfield 展开 More 后同样处理) */
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const check = () => setFade(el.scrollHeight - el.scrollTop - el.clientHeight > 4);
    check();
    el.addEventListener("scroll", check, { passive: true });
    const ro = new ResizeObserver(check);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => {
      el.removeEventListener("scroll", check);
      ro.disconnect();
    };
  }, []);
  const H = item.heading;
  const grid = !!item.tabs;
  return (
    <div className={`flex flex-col ${compact ? "text-[13px]" : "text-[14px]"}`} style={{ width }}>
      <div
        ref={bodyRef}
        className="overflow-y-auto overscroll-contain px-3 pt-3 [scrollbar-color:#E5E5E5_transparent] [scrollbar-width:thin]"
        style={{
          maxHeight: "min(560px, calc(100dvh - 230px))",
          maskImage: fade ? "linear-gradient(to bottom, black calc(100% - 48px), transparent)" : undefined,
          WebkitMaskImage: fade ? "linear-gradient(to bottom, black calc(100% - 48px), transparent)" : undefined,
        }}
      >
        <div>
          {/* 2026-11-24 Monica:Agent / Studios / Resources 标题前放 logo 里的四角星(后来要求放大一点，18 → 22px),MCP 标题前放 MCP logo */}
          {H && (
            <p className="flex items-center gap-1.5 px-1 pb-3 pt-1 text-[16px] font-semibold tracking-[-0.01em] text-[#240A03]">
              {(H.icon === "agent" || H.icon === "studio" || H.icon === "community") && <BuzzStar className="size-[22px] shrink-0" />}
              {H.icon === "mcp" && <McpGlyph className="size-[18px] shrink-0 text-[#240A03]" />}
              {H.text}
            </p>
          )}
          {item.tabs && item.tabs.length > 1 && (
            <div role="tablist" aria-label={`${item.label} categories`} className="mb-3 flex gap-1 px-1">
              {item.tabs.map((x) => (
                <button
                  key={x}
                  type="button"
                  role="tab"
                  aria-selected={tab === x}
                  onClick={() => setTab(x)}
                  className={`h-8 rounded-full px-3 text-[13px] font-medium transition-colors duration-200 ${tab === x ? "bg-[#240A03] text-white" : "text-[#6F6C6C] hover:bg-[#F6F6F6] hover:text-[#240A03]"}`}
                >
                  {x}
                </button>
              ))}
            </div>
          )}
          {tiles.length > 0 && (
            <div className="grid gap-x-2 gap-y-3" style={{ gridTemplateColumns: `repeat(${grid ? 3 : tiles.length === 3 ? 3 : 4}, minmax(0, 1fr))` }}>
              {tiles.map((t, i) => (
                /* 筛选只切 hidden,链接都留在 HTML 里 */
                <div key={`${t.href}-${t.label}`} className={grid && tab !== "All" && t.cat !== tab ? "hidden" : undefined}>
                  <Tile t={t} mark={mark} onLink={onLink} i={i} active={active} wide={!grid && tiles.length === 3} />
                </div>
              ))}
            </div>
          )}
          {tiles.length > 0 && groups.length > 0 && <div aria-hidden className="mx-1 mb-4 mt-4 h-px bg-[#240A03]/[0.07]" />}
          {/* 只有图卡、下面没有列表时(Resources),补上列表原本带的底部留白 */}
          {tiles.length > 0 && groups.length === 0 && <div aria-hidden className="h-3" />}
          {groups.length > 0 && (
            <div className="grid gap-x-8 px-3 pb-3" style={{ gridTemplateColumns: groups.map((g) => (g.sections ? "minmax(0, 2fr)" : "minmax(0, 1fr)")).join(" ") }}>
              {groups.map((g) => (
                <GroupList key={g.title} g={g} mark={mark} onLink={onLink} onFly={onFly} />
              ))}
            </div>
          )}
        </div>
      </div>
      {(item.cards || item.promo) && (
        <div className="px-3 pb-3 pt-1">
          {item.cards ? (
            <div className="grid grid-cols-2 gap-2">
              {item.cards.map((c) => (
                <PromoCard key={c.href} p={c} mark={mark} onLink={onLink} />
              ))}
            </div>
          ) : (
            item.promo && <Promo p={item.promo} mark={mark} onLink={onLink} />
          )}
        </div>
      )}
    </div>
  );
}

/* ───────── 桌面:顶级菜单条 + 共享浮层 ─────────
   2026-11-19 设计升级(在 Higgsfield 基础上往上做):
   - 浮层在菜单条正下方居中;每个菜单按内容定宽，切换时浮层平滑变形到新的宽高、内容按方向滑入(Monica 2026-11-19:不要顶级项外的胶囊浮层);
   - 顶级项下一块浅灰底跟着鼠标滑动;页面轻微压暗(只在官网顶栏);
   - 悬停模型 / 工具，浮层旁边弹出详情卡(左列在左、右列在右);
   - 内容太高时面板内滚动、底部渐隐，推荐区固定在底;
   - 动效 ease-out-quint;「减少动态效果」下只淡入淡出、不播视频。
   SEO 不变：每个菜单的内容始终在 DOM 里，只切 visibility / hidden。 */

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const GUTTER = 12;

function DesktopMenu({ mark, onLink, compact, dim = false, dark = false }: { mark: boolean; onLink: OnLink; compact: boolean; dim?: boolean; dark?: boolean }) {
  const [open, setOpen] = useState<string | null>(null);
  const [hot, setHot] = useState<string | null>(null);
  const [box, setBox] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);
  const [fly, setFly] = useState<FlyState>(null);
  /* 从关闭到打开的第一帧不做过渡(否则浮层会从上一次的位置飞过来) */
  const [morph, setMorph] = useState(false);
  /* 压暗层用 portal 挂到 body,只在客户端挂载后渲染(否则和服务端 HTML 对不上) */
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const timer = useRef<number | undefined>(undefined);
  const navRef = useRef<HTMLElement>(null);
  const ulRef = useRef<HTMLUListElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggers = useRef<Record<string, HTMLLIElement | null>>({});
  const panels = useRef<Record<string, HTMLDivElement | null>>({});
  const items = HEADER.filter((i) => i.groups || i.tiles);
  const openIdx = items.findIndex((i) => i.label === open);

  const cancel = () => window.clearTimeout(timer.current);
  const closeSoon = () => {
    cancel();
    timer.current = window.setTimeout(() => {
      setOpen(null);
      setMorph(false);
      setFly(null);
    }, CLOSE_DELAY);
  };
  const show = (label: string) => {
    cancel();
    if (open && open !== label) setMorph(true);
    setFly(null);
    setOpen(label);
  };

  useLayoutEffect(() => {
    if (!open) return;
    const measure = () => {
      const host = navRef.current?.closest("header");
      const ul = ulRef.current;
      const trig = triggers.current[open];
      const panel = panels.current[open];
      if (!host || !ul || !trig || !panel) return;
      const h = host.getBoundingClientRect();
      const u = ul.getBoundingClientRect();
      const tr = trig.getBoundingClientRect();
      /* 2026-11-19 Monica:每个菜单按内容定宽(不再统一宽度);浮层一律在菜单条正下方居中，不跟着悬停项偏 */
      const w = Math.min(panel.offsetWidth, h.width - GUTTER * 2);
      const center = u.left + u.width / 2 - h.left;
      void tr;
      setBox({ left: Math.max(GUTTER, Math.min(center - w / 2, h.width - w - GUTTER)), top: u.bottom - h.top + 10, width: w, height: panel.offsetHeight });
    };
    measure();
    const ro = new ResizeObserver(measure);
    const panel = panels.current[open];
    if (panel) ro.observe(panel);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [open]);

  /* 顶级项下面的滑动浅底 */
  useLayoutEffect(() => {
    const label = hot ?? open;
    const el = label ? triggers.current[label] : null;
    const ul = ulRef.current;
    if (!el || !ul) return setPill(null);
    const u = ul.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    setPill({ left: r.left - u.left, width: r.width });
  }, [hot, open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(null);
        setMorph(false);
        setFly(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      cancel();
    };
  }, []);

  const onFly = (href: string, label: string, el: HTMLElement | null) => {
    const wrap = wrapRef.current;
    if (!el || !wrap || !href || !flyOf(href)) return setFly(null);
    const w = wrap.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const side = r.left + r.width / 2 < w.left + w.width / 2 ? "left" : "right";
    setFly({ href, label, side, top: Math.max(0, r.top - w.top - 18) });
  };

  const isOpen = !!open && !!box;
  const t = (props: string, ms = 340) => props.split(",").map((p) => `${p.trim()} ${ms}ms ${EASE}`).join(", ");

  return (
    <nav ref={navRef} aria-label="Main" className="hidden xl:block" onMouseLeave={() => setHot(null)}>
      <ul ref={ulRef} className={`relative flex items-center ${compact ? "gap-0.5" : "gap-1"}`}>
        <span
          aria-hidden
          className={`pointer-events-none absolute top-1/2 -translate-y-1/2 rounded-xl motion-reduce:!transition-none ${dark ? "bg-white/10" : "bg-[#F6F6F6]"}`}
          style={{
            left: pill?.left ?? 0,
            width: pill?.width ?? 0,
            height: compact ? 32 : 38,
            opacity: pill ? 1 : 0,
            transition: pill ? t("left, width, opacity", 280) : t("opacity", 180),
          }}
        />
        {HEADER.map((item) => {
          const has = !!(item.groups || item.tiles);
          const active = open === item.label;
          return (
            <li
              key={item.label}
              ref={(el) => {
                triggers.current[item.label] = el;
              }}
              className="relative"
              onFocus={() => has && show(item.label)}
              onBlur={(e) => e.relatedTarget && closeSoon()}
              onKeyDown={(e) => {
                if (!has || e.key !== "ArrowDown") return;
                e.preventDefault();
                show(item.label);
                requestAnimationFrame(() => panels.current[item.label]?.querySelector<HTMLElement>("a")?.focus());
              }}
              onMouseEnter={() => {
                setHot(item.label);
                if (has) show(item.label);
                else closeSoon();
              }}
              onMouseLeave={closeSoon}
            >
              <NavA
                /* 2026-11-24 Monica:点一级的 Image / Video / Audio 直接进产品的 Image Gen / Video Gen / Audio Gen(不是落地页) */
                toApp={GEN_TOP.has(item.label)}
                link={item}
                onLink={onLink}
                className={`relative flex items-center gap-1 whitespace-nowrap rounded-xl font-medium transition-colors duration-200 ${compact ? "h-8 px-2.5 text-[13px]" : "h-10 px-3 text-[14.5px]"} ${
                  dark ? (active || hot === item.label ? "text-white" : "text-white/75") : active || hot === item.label ? "text-[#240A03]" : "text-[#240A03]/70"
                }`}
              >
                {item.label}
                <StatusDot status={item.status} mark={mark} corner />
              </NavA>
            </li>
          );
        })}
      </ul>

      {/* 共享浮层：所有菜单叠在同一个容器里(同宽),容器高度变形到当前菜单 */}
      <div
        ref={wrapRef}
        className={`absolute z-40 ${isOpen ? "visible" : "pointer-events-none invisible"}`}
        style={{ left: box?.left ?? 0, top: box?.top ?? 0, width: box?.width, transition: morph ? t("left") : undefined }}
        onMouseEnter={cancel}
        onMouseLeave={closeSoon}
        onFocus={cancel}
        /* 焦点因面板切换被隐藏时 relatedTarget 为空，不算离开 */
        onBlur={(e) => e.relatedTarget && !e.currentTarget.contains(e.relatedTarget as Node) && closeSoon()}
      >
        <div
          className="relative overflow-hidden rounded-[22px] bg-white shadow-[0_1px_2px_rgba(36,10,3,0.04),0_24px_64px_-12px_rgba(36,10,3,0.18)] ring-1 ring-[#240A03]/[0.07] motion-reduce:!transition-[opacity]"
          style={{
            width: box?.width,
            height: box?.height,
            opacity: isOpen ? 1 : 0,
            transform: isOpen ? "translateY(0) scale(1)" : "translateY(-6px) scale(0.985)",
            transformOrigin: "50% 0",
            transition: [morph ? t("width, height") : "", isOpen ? t("opacity, transform", 260) : t("opacity, transform", 160)].filter(Boolean).join(", "),
          }}
        >
          {items.map((item, i) => {
            const active = i === openIdx;
            const shift = openIdx < 0 || active ? 0 : i < openIdx ? -28 : 28;
            return (
              <div
                key={item.label}
                ref={(el) => {
                  panels.current[item.label] = el;
                }}
                className={`absolute left-0 top-0 motion-reduce:!transform-none ${active ? "visible" : "pointer-events-none invisible"}`}
                style={{
                  opacity: active ? 1 : 0,
                  transform: `translateX(${shift}px)`,
                  transition: morph ? `${t("opacity, transform", 300)}, visibility 0s linear ${active ? "0s" : "300ms"}` : "none",
                }}
              >
                <MegaPanel item={item} mark={mark} onLink={onLink} compact={compact} active={active && isOpen} width={panelWidth(item)} onFly={active ? onFly : undefined} />
              </div>
            );
          })}
        </div>
        <Flyout fly={isOpen ? fly : null} panelWidth={box?.width ?? 780} />
      </div>

      {dim &&
        mounted &&
        createPortal(
          <div
            aria-hidden
            onMouseEnter={closeSoon}
            className={`fixed inset-0 z-40 bg-[#240A03]/[0.10] backdrop-blur-[2px] transition-opacity duration-300 motion-reduce:backdrop-blur-none ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
          />,
          document.body,
        )}
    </nav>
  );
}

/* ───────── 手机 / 平板:抽屉 + 手风琴 ───────── */

function MobileDrawer({ open, onClose, mark, onLink, footer }: { open: boolean; onClose: () => void; mark: boolean; onLink: OnLink; footer?: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  const go: OnLink = (l) => {
    onClose();
    onLink(l);
  };
  return (
    <div className={`fixed inset-0 z-[120] xl:hidden ${open ? "visible" : "invisible"}`} role="dialog" aria-modal="true" aria-label="Menu">
      <button type="button" aria-label="Close menu" onClick={onClose} className={`absolute inset-0 bg-[#1a1a2e]/30 transition ${open ? "opacity-100" : "opacity-0"}`} />
      <div className={`absolute inset-y-0 right-0 flex w-full max-w-[400px] flex-col bg-white shadow-2xl transition duration-200 ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#ececf1] px-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO} alt="BuzzVideo AI" className="size-7" />
          <button type="button" onClick={onClose} aria-label="Close menu" className="grid size-10 place-items-center rounded-xl text-[#1a1a2e] hover:bg-[#f5f5f7]">
            <X className="size-5" />
          </button>
        </div>
        <nav aria-label="Main" className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {HEADER.map((item) =>
            item.groups || item.tiles ? (
              <details key={item.label} className="group border-b border-[#f1f1f4] last:border-0">
                <summary className="flex h-12 cursor-pointer list-none items-center justify-between rounded-xl px-3 text-[15px] font-bold text-[#1a1a2e] [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center">
                    {item.label}
                    <StatusDot status={item.status} mark={mark} />
                  </span>
                  <ChevronDown className="size-4 text-[#5d5e6e] transition group-open:rotate-180" />
                </summary>
                <div className="pb-3">
                  {item.tiles && (
                    <div className="grid grid-cols-2 gap-1 px-1.5 pb-1">
                      {item.tiles.map((t) => (
                        <Tile key={`${t.href}-${t.label}`} t={t} mark={mark} onLink={go} still />
                      ))}
                    </div>
                  )}
                  {(item.groups ?? []).map((g) => (
                    <div key={g.title} className="px-3 pb-2">
                      <p className="pb-1 pt-2 text-[13px] font-medium text-[#6F6C6C]">{g.title}</p>
                      {g.sections?.map((s) => (
                        <div key={s.title}>
                          <p className="pt-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#6F6C6C]/75">{s.title}</p>
                          <ul className="grid grid-cols-2 gap-x-3">
                            {s.links.map((l) => (
                              <li key={l.href + l.label}>
                                <NavA link={l} onLink={go} className="flex min-h-10 items-center py-1.5 text-[14px] font-medium text-[#240A03]">
                                  <span>
                                    {navLabel(l)}
                                    <Badge b={l.badge} />
                                    <StatusDot status={l.status} mark={mark} />
                                  </span>
                                </NavA>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                      <ul className="grid grid-cols-2 gap-x-3">
                        {[...(g.sections ? [] : g.links), ...(g.footer ? [g.footer] : []), ...(g.footer2 ? [g.footer2] : [])].map((l) => (
                          <li key={l.href + l.label}>
                            <NavA link={l} onLink={go} className="flex min-h-10 items-center py-1.5 text-[14px] font-medium text-[#240A03]">
                              <span>
                                {navLabel(l)}
                                <Badge b={l.badge} />
                                <StatusDot status={l.status} mark={mark} />
                              </span>
                            </NavA>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  {item.cards && (
                    <div className="space-y-1 px-1.5 pt-1">
                      {item.cards.map((c) => (
                        <PromoCard key={c.href} p={c} mark={mark} onLink={go} />
                      ))}
                    </div>
                  )}
                  {item.promo && (
                    <div className="px-3 pt-1">
                      <Promo p={{ ...item.promo, kind: "strip" }} mark={mark} onLink={go} />
                    </div>
                  )}
                </div>
              </details>
            ) : (
              <NavA key={item.label} link={item} onLink={go} className="flex h-12 items-center px-3 text-[15px] font-bold text-[#1a1a2e]">
                {item.label}
                <StatusDot status={item.status} mark={mark} />
              </NavA>
            ),
          )}
        </nav>
        {footer && <div className="shrink-0 border-t border-[#ececf1] p-4">{footer}</div>}
      </div>
    </div>
  );
}

/* ───────── 对外导出 ───────── */

const ctaBtn =
  "inline-flex h-10 items-center whitespace-nowrap rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-4 text-[14px] font-bold text-white shadow-[0_8px_22px_rgba(255,82,85,0.26)] transition hover:brightness-105";

export function SiteNavHeader({ mark, onLink, onAuth, overlay = false, glass = false, account }: { mark: boolean; onLink: OnLink; onAuth: (what: "login" | "signup") => void; overlay?: boolean; /** 透明顶栏(首页,Monica 2026-11-24):没有底色、没有分界线，内容从下面透过去;只加一层向下渐隐的柔化，保证菜单字看得清 */ glass?: boolean; /** 已登录时顶栏右侧的账号区(Invite / 积分 / 礼物 / 帮助 / 头像)。传了就替换掉 Sign Up */ account?: ReactNode }) {
  const [drawer, setDrawer] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  /* 2026-11-19 Monica:落地页(黑色首屏)顶部 Header 透明、字变白;往下滚动后变回白底黑字 */
  const clear = overlay && !scrolled;
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > (overlay ? 40 : 4));
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [overlay]);
  /* 2026-11-19 Monica:和线上 buzzvideo.ai 一致，只有一个「Sign Up ↗」(登录在注册弹窗里切换),不放 Log in */
  const auth = account ?? (
    <button type="button" onClick={() => onAuth("signup")} className={`${ctaBtn} group gap-1.5`}>
      Sign Up
      <ArrowUpRight aria-hidden className="size-4 transition duration-300 group-hover:-translate-y-px group-hover:translate-x-px" />
    </button>
  );
  /* 抽屉放在 header 外面:header 的 backdrop-blur 会让 fixed 子元素只盖住 header 自己 */
  return (
    <>
    <header className={`sticky top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-300 ${clear || glass ? "border-transparent bg-transparent" : `bg-white ${scrolled ? "border-[#240A03]/[0.07] shadow-[0_1px_12px_rgba(36,10,3,0.04)]" : "border-transparent"}`}`}>
      {glass && <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[88px] bg-white/45 backdrop-blur-md [mask-image:linear-gradient(to_bottom,#000_55%,transparent)] motion-reduce:backdrop-blur-none" />}
      {/* 2026-11-19 Monica:菜单在顶栏正中(logo 靠左、Sign Up 靠右);顶级项不带下拉箭头 */}
      {/* glass(首页):左右留白跟首页正文的留白一致(12 / 20 / 24),logo 和 Sign Up 才能和正文边缘对齐 */}
      {/* 已登录(account):顶栏和首页正文同宽(正文 max 1600 + 两侧留白),菜单紧跟 logo、账号区靠右 —— Monica 2026-11-24 */}
      <div className={`mx-auto h-16 items-center gap-4 xl:gap-6 ${account ? "flex max-w-[1648px] justify-between" : "grid max-w-[1280px] grid-cols-[1fr_auto_1fr]"} ${glass ? "px-3 sm:px-5 lg:px-6" : "px-4 sm:px-6"}`}>
        <NavA link={{ label: "Home", href: "/", status: "live" }} onLink={onLink} className="flex shrink-0 items-center gap-2 justify-self-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO} alt="" className="size-8" />
          <span className={`whitespace-nowrap text-[18px] font-extrabold tracking-tight transition-colors duration-300 ${clear ? "text-white" : "text-[#240A03]"}`}>BuzzVideo AI</span>
        </NavA>
        <DesktopMenu mark={mark} onLink={onLink} compact={false} dim dark={clear} />
        <div className={`col-start-3 flex items-center justify-end gap-1.5 ${account ? "ml-auto" : ""}`}>
          <div className={account ? "flex items-center" : "hidden items-center gap-1.5 sm:flex"}>{auth}</div>
          <button
            type="button"
            onClick={() => setDrawer(true)}
            aria-label="Open menu"
            className={`grid size-10 place-items-center rounded-xl transition xl:hidden ${clear ? "text-white hover:bg-white/10" : "text-[#1a1a2e] hover:bg-[#f5f5f7]"}`}
          >
            <Menu className="size-5" />
          </button>
        </div>
      </div>
    </header>
      <MobileDrawer
        open={drawer}
        onClose={() => setDrawer(false)}
        mark={mark}
        onLink={onLink}
        footer={account ? undefined : <div className="[&>button]:w-full [&>button]:justify-center">{auth}</div>}
      />
    </>
  );
}

/** 登录后 app 的顶栏:同一套菜单,左对齐;right = Invite + 积分 + 账号(外壳传进来) */
export function AppNavBar({ mark, onLink, right, onMenu }: { mark: boolean; onLink: OnLink; right: ReactNode; onMenu?: () => void }) {
  const [drawer, setDrawer] = useState(false);
  return (
    <header className="relative z-30 flex h-14 shrink-0 items-center gap-2 px-3 sm:px-4">
      {onMenu && (
        <button type="button" onClick={onMenu} aria-label="Open sidebar" className="grid size-10 place-items-center rounded-xl text-[#260B03] hover:bg-[#f5f5f5] md:hidden">
          <Menu className="size-5" />
        </button>
      )}
      <DesktopMenu mark={mark} onLink={onLink} compact />
      <button
        type="button"
        onClick={() => setDrawer(true)}
        className="inline-flex h-8 items-center gap-1 rounded-xl px-2.5 text-[13px] font-semibold text-[#3a3b4f] hover:bg-[#f5f5f7] xl:hidden"
      >
        Explore <ChevronDown className="size-3.5" />
      </button>
      <div className="ml-auto flex items-center gap-2">{right}</div>
      <MobileDrawer open={drawer} onClose={() => setDrawer(false)} mark={mark} onLink={onLink} />
    </header>
  );
}
