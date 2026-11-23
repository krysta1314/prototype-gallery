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
import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
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
  LifeBuoy,
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
  Bot,
  Check,
  Clock,
  Images,
  MessagesSquare,
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
  type LucideIcon,
} from "lucide-react";
import { FLYOUT_DESC, HEADER, type LinkStatus, type NavGroup, type NavLink, type NavPromo, type NavTile, type TopItem } from "./nav-data";
import { MODELS } from "./models-catalog";
import { factsOf } from "../site/models/model-facts";
import { PAGE_META } from "../site/pages-meta";
import { mediaOf } from "../site/models/model-media";

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
  "/photo-angle-editor": "/prototypes/ai-tools/photo-angle",
  "/talking-avatar": "/prototypes/ai-tools/talking-avatar",
  "/ai-lip-sync": "/prototypes/ai-tools/lip-sync",
  "/hybrid-reel": "/prototypes/hybrid-reel",
  "/3d-studio": "/prototypes/3d-studio",
  "/ad-creative-maker": "/prototypes/design-studio",
  "/brand-kit": "/prototypes/design-studio",
  "/ai-presentation-maker": "/prototypes/design-studio",
  "/ai-website-builder": "/prototypes/design-studio",
  "/design-studio": "/prototypes/design-studio",
};
/* 原型里已经做好的页面(按批次放开):第 1 批模型页 + 分类页;第 2 批工具落地页 + /tools 总页 */
const BUILT_TOOLS = new Set(TOOLS_CONTENT.map((t) => `/${t.slug}`).concat("/tools"));
const BUILT = (href: string) => !!PAGE_META[href.replace(/^\//, "")] || /^\/ai-(video|image|audio)-models$/.test(href) || href === "/seedance" || MODELS.some((m) => href === `/${m.slug}`) || BUILT_TOOLS.has(href);
const EXISTING_URL: Record<string, string> = {
  "/buzzvideo-vs-topview": "https://uat-app.buzzvideo.ai/compare/topview",
  /* 2026-11-23 核实线上已有(网址是旧的多级路径):直接指过去 */
  "/community-gallery": "https://buzzvideo.ai/gallery/marketing-agent-community",
  "/seedance-2-5-showcase": "https://buzzvideo.ai/gallery/seedance-2-5",
  "/mcp-skills": "https://uat-app.buzzvideo.ai/mcp/skills",
  "/llms.txt": "/prototypes/site/llms.txt",
};
export function targetOf(link: { href: string; status: LinkStatus }): { url: string; external: boolean } | null {
  const h = link.href;
  if (h.startsWith("http")) return null;
  /* 2026-11-19 Monica:已有的页面定向过去 —— TopView 对比页已在 UAT(/compare/topview) */
  if (EXISTING_URL[h]) return { url: EXISTING_URL[h], external: true };
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
  "gemini-omni-1-2-flash": "omni-flash-1.2", "minimax-h3": "h3", "minimax-h3-max": "h3-max", "vidu-q3-pro": "vidu-q3", "grok-imagine-video-1-5": "grok-1.5", "flux-3-max-video": "flux-3-max-video",
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
};
/* 功能 → 生成器的哪一类(图片 / 音乐 / 音效 / 配音 / Agent);视频类默认进 Video */
const TYPE_OF_TOOL: [RegExp, string][] = [
  [/^\/(ai-image-generator|ai-image-editor|remove-background|ai-product-photography|ai-inpainting|ai-background-generator|ai-image-extender|image-to-image|ai-photo-relight|ai-infographic-generator|ai-photo-restoration|sketch-to-image|consistent-character|ai-headshot-generator|ai-mockup-generator|ai-thumbnail-maker|image-to-3d)$/, "image"],
  [/^\/(ai-music-generator|ai-song-generator|ai-jingle-generator)$/, "music"],
  [/^\/ai-sound-effects-generator$/, "sfx"],
  [/^\/(ai-voice-over|text-to-speech|ai-voice-clone|ai-voice-changer|ai-voice-enhancer|ai-podcast-generator)$/, "audio"],
  [/^\/(marketing-agent|ai-ad-generator|url-to-video|ai-ugc-video-generator|ai-product-video-generator)$/, "marketing"],
];

/* 一级网址里不是功能 / 模型的页面(点了照常去页面本身) */
const NOT_TOOL = new Set(["/pricing", "/affiliate", "/enterprise", "/blog", "/help", "/faq", "/changelog", "/customers", "/about", "/contact", "/contact-sales", "/app", "/api", "/resources", "/glossary", "/learn", "/usecase", "/templates", "/solutions", "/free-tools", "/tools", "/models", "/integrations", "/research", "/press", "/trust", "/content-policy", "/privacy-policy", "/terms-of-service", "/llms.txt"]);

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
  const href = raw === "/models/seedance" ? "/seedance" : raw;
  const url = appBase(href);
  if (!url || !url.startsWith(GEN)) return url;
  const pr = bestPrompt(href);
  return pr ? `${url}${url.includes("?") ? "&" : "?"}prompt=${encodeURIComponent(pr)}` : url;
}

function appBase(href: string): string | undefined {
  if (APP_PAGE[href]) return APP_PAGE[href];
  if (PROTO_PAGE[href]) return PROTO_PAGE[href];
  /* 2026-11-19 落地页改成一级网址(/kling-4-0、/ai-image-generator),模型按 slug 认 */
  const m = href.match(/^\/([a-z0-9-]+)$/);
  if (m && (m[1] === "seedance" || MODELS.some((x) => x.slug === m[1]))) {
    const slug = m[1] === "seedance" ? "seedance-2-5" : m[1];
    if (GEN_KEY[slug]) return `${GEN}?model=${GEN_KEY[slug]}`;
    const model = MODELS.find((x) => x.slug === slug);
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
      href={link.href}
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
  "/safe-zone-checker": Frame,
  "/video-compressor": FileDown,
  "/image-resizer": Scaling,
  "/video-to-gif": Film,
  "/ad-size-guide": Ruler,
  "/help": LifeBuoy,
  "/faq": CircleHelp,
  "/glossary": BookA,
  "/changelog": Megaphone,
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
function TileArt({ art, img }: { art: NonNullable<NavTile["art"]>; img?: string }) {
  if (art === "voice")
    return (
      <span className="flex size-full items-center justify-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {img && <img src={img} alt="" loading="lazy" className="size-11 rounded-full object-cover shadow-[0_6px_14px_-4px_rgba(36,10,3,0.35)] ring-2 ring-white" />}
        <Bars n={11} />
      </span>
    );
  if (art === "tts")
    return (
      <span className="flex size-full flex-col justify-center gap-2 px-5">
        <span className="text-left text-[10.5px] font-medium leading-snug text-[#240A03]/45">
          Meet the serum <span className="text-[#240A03]">that works while</span> you sleep.
        </span>
        <span className="flex items-center gap-2">
          <span className="grid size-5 place-items-center rounded-full bg-gradient-to-r from-[#FFA73C] to-[#FF5255] text-white">
            <Play className="size-2.5 fill-current" />
          </span>
          <Bars n={13} h={18} />
        </span>
      </span>
    );
  if (art === "clone")
    return (
      <span className="flex size-full items-center justify-center gap-2">
        <Bars n={6} tone="muted" h={26} />
        <ChevronRight className="size-3.5 text-[#6F6C6C]" />
        <Bars n={9} h={34} />
      </span>
    );
  if (art === "music")
    return (
      <span className="flex size-full items-center justify-center gap-3">
        <span className="grid size-9 place-items-center rounded-full bg-gradient-to-r from-[#FFA73C] to-[#FF5255] text-white shadow-[0_6px_14px_-4px_rgba(255,82,85,0.5)]">
          <Music className="size-4" />
        </span>
        <span aria-hidden className="flex h-9 items-end gap-[3px]">
          {[40, 70, 55, 95, 65, 85, 45, 75, 60].map((v, i) => (
            <span key={i} className="w-[5px] rounded-t-[2px] bg-[#FF744D]" style={{ height: `${v}%` }} />
          ))}
        </span>
      </span>
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

/* 图卡(Higgsfield 式「画框」):浅底卡片里浮着一块内嵌画面;有成片的在浮层打开时循环播放 */
/* still:手机抽屉里用，不做进场位移、不自动播放(抽屉常驻 DOM,自动播放会在页面加载时就下载视频) */
function Tile({ t, mark, onLink, i = 0, active = true, still = false }: { t: NavTile; mark: boolean; onLink: OnLink; i?: number; active?: boolean; still?: boolean }) {
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
        <span className="relative block aspect-[16/10] w-full overflow-hidden rounded-[14px] bg-[#F6F6F6] ring-1 ring-inset ring-[#240A03]/[0.06] transition-colors duration-300 group-hover/tile:bg-[#FFF3EC]">
          {t.art ? (
            <TileArt art={t.art} img={t.img} />
          ) : (
            <span className="absolute inset-x-[12%] inset-y-[14%] overflow-hidden rounded-[9px] shadow-[0_10px_24px_-10px_rgba(36,10,3,0.5)] ring-1 ring-white/70 transition duration-500 ease-out group-hover/tile:-translate-y-1 group-hover/tile:scale-[1.04] motion-reduce:transition-none">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.img} alt="" loading="lazy" className="size-full object-cover" />
              {t.video && <video ref={vRef} src={t.video} muted loop playsInline preload="none" aria-hidden className="absolute inset-0 size-full object-cover motion-reduce:hidden" />}
            </span>
          )}
        </span>
        <span className="mt-2 block text-center text-[13px] font-semibold leading-tight text-[#240A03] [text-wrap:balance]">
          {t.label}
          <StatusDot status={t.status} mark={mark} />
        </span>
      </span>
    </NavA>
  );
}

/* ── 悬停详情卡(模型带参数要点，工具一句话)── */
type FlyData = { title: string; desc: string; bullets: { icon: LucideIcon; text: string }[]; icon?: LucideIcon; mono?: string; soon?: boolean };
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
    return { title: m.name, desc: m.desc, bullets: b.slice(0, 3), mono: monogram(m.vendor), soon: m.release === "v1.13" };
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
        {d.mono ? <span className="text-[10px] font-bold tracking-tight text-[#6F6C6C]">{d.mono}</span> : Icon && <Icon className="size-[18px]" />}
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
  return (
    <div className="min-w-0" onMouseLeave={() => onFly?.("", "", null)}>
      {/* 2026-11-19 Monica:分组名只是标题，不可点击(总页入口在列底「All …」) */}
      <p className="mb-1 text-[12.5px] font-medium text-[#6F6C6C]">{g.title}</p>
      <ul className={g.cols === 2 ? "grid grid-cols-2 gap-x-8" : undefined}>
        {g.links.map((l, i) => {
          const m = MODEL_BY_HREF.get(l.href);
          const Icon = m ? null : iconOf(l.href);
          return (
            <li key={l.href + l.label} className={i >= cut * (g.cols ?? 1) && !open ? "hidden" : undefined} onMouseEnter={(e) => onFly?.(l.href, l.label, e.currentTarget)}>
              <NavA
                toApp
                link={l}
                onLink={onLink}
                className="group/l -mx-2 flex items-center gap-2.5 rounded-lg px-2 py-[7px] transition-colors duration-150 hover:bg-[#F6F6F6] focus-visible:bg-[#F6F6F6] focus-visible:outline-none"
              >
                {m ? (
                  <span aria-hidden className="grid size-5 shrink-0 place-items-center rounded-[6px] bg-[#F6F6F6] text-[8.5px] font-bold tracking-tight text-[#6F6C6C] transition-colors group-hover/l:bg-white">
                    {monogram(m.vendor)}
                  </span>
                ) : (
                  Icon && <Icon aria-hidden className="size-4 shrink-0 text-[#6F6C6C] transition group-hover/l:text-[#FF744D]" />
                )}
                <span className="min-w-0 font-medium leading-snug text-[#240A03]">
                  {l.label}
                  <Badge b={l.badge} />
                  <StatusDot status={l.status} mark={mark} />
                </span>
              </NavA>
            </li>
          );
        })}
      </ul>
      {cut * (g.cols ?? 1) < g.links.length && (
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
        <NavA link={g.footer} onLink={onLink} className="group mt-1.5 flex w-fit items-center gap-1 text-[13px] font-semibold text-[#240A03] underline decoration-[#FF744D] decoration-2 underline-offset-[5px]">
          {g.footer.label}
          <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" />
          <StatusDot status={g.footer.status} mark={mark} />
        </NavA>
      )}
    </div>
  );
}

/* 底部三种：一行推荐条 / 带大图横幅 / 两张并排卡 —— 不同菜单用不同的(Higgsfield 也是各不相同) */
function Promo({ p, mark, onLink }: { p: NavPromo; mark: boolean; onLink: OnLink }) {
  if (p.kind === "banner")
    return (
      <NavA link={{ label: p.title, href: p.href, status: p.status }} onLink={onLink} className="group relative flex h-[112px] overflow-hidden rounded-[16px] bg-[#F6F6F6] ring-1 ring-inset ring-[#240A03]/[0.05]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={p.img}
          alt=""
          loading="lazy"
          className="absolute inset-y-0 right-0 h-full w-[62%] object-cover object-[50%_20%] transition duration-700 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
          style={{ maskImage: "linear-gradient(to right, transparent, black 45%)", WebkitMaskImage: "linear-gradient(to right, transparent, black 45%)" }}
        />
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
          {p.icon === "audio" ? <Bars n={7} h={18} /> : (() => {
            const I = { video: Clapperboard, chat: MessageCircleQuestion, chart: BarChart3, team: Building2, audio: AudioLines }[p.icon ?? "video"];
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
      <img src={p.img} alt="" loading="lazy" className="h-[64px] w-[96px] shrink-0 rounded-[10px] object-cover ring-1 ring-[#240A03]/[0.06]" />
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
const panelWidth = (item: TopItem) => (item.tabs || (item.groups?.length ?? 0) >= 3 ? 900 : 780);

const HEADING_ICON = { agent: Bot, mcp: MessagesSquare, studio: Sparkle, community: Users } as const;

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
  const HIcon = H ? HEADING_ICON[H.icon] : null;
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
          {H && HIcon && (
            <p className="flex items-center gap-2 px-1 pb-3 pt-1 text-[16px] font-semibold tracking-[-0.01em] text-[#240A03]">
              <HIcon aria-hidden className="size-[18px] text-[#FF744D]" />
              {H.text}
            </p>
          )}
          {item.tabs && (
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
                <div key={t.href} className={grid && tab !== "All" && t.cat !== tab ? "hidden" : undefined}>
                  <Tile t={t} mark={mark} onLink={onLink} i={i} active={active} />
                </div>
              ))}
            </div>
          )}
          {tiles.length > 0 && groups.length > 0 && <div aria-hidden className="mx-1 mb-4 mt-4 h-px bg-[#240A03]/[0.07]" />}
          {groups.length > 0 && (
            <div className="grid gap-x-8 px-3 pb-3" style={{ gridTemplateColumns: `repeat(${groups.length}, minmax(0, 1fr))` }}>
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
                        <Tile key={t.href} t={t} mark={mark} onLink={go} still />
                      ))}
                    </div>
                  )}
                  {(item.groups ?? []).map((g) => (
                    <div key={g.title} className="px-3 pb-2">
                      <p className="pb-1 pt-2 text-[13px] font-medium text-[#6F6C6C]">{g.title}</p>
                      <ul className="grid grid-cols-2 gap-x-3">
                        {[...g.links, ...(g.footer ? [g.footer] : [])].map((l) => (
                          <li key={l.href + l.label}>
                            <NavA link={l} onLink={go} className="flex min-h-10 items-center py-1.5 text-[14px] font-medium text-[#240A03]">
                              <span>
                                {l.label}
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

export function SiteNavHeader({ mark, onLink, onAuth, overlay = false }: { mark: boolean; onLink: OnLink; onAuth: (what: "login" | "signup") => void; overlay?: boolean }) {
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
  const auth = (
    <button type="button" onClick={() => onAuth("signup")} className={`${ctaBtn} group gap-1.5`}>
      Sign Up
      <ArrowUpRight aria-hidden className="size-4 transition duration-300 group-hover:-translate-y-px group-hover:translate-x-px" />
    </button>
  );
  /* 抽屉放在 header 外面:header 的 backdrop-blur 会让 fixed 子元素只盖住 header 自己 */
  return (
    <>
    <header className={`sticky top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-300 ${clear ? "border-transparent bg-transparent" : `bg-white/90 backdrop-blur-md ${scrolled ? "border-[#240A03]/[0.07] shadow-[0_1px_12px_rgba(36,10,3,0.04)]" : "border-transparent"}`}`}>
      {/* 2026-11-19 Monica:菜单在顶栏正中(logo 靠左、Sign Up 靠右);顶级项不带下拉箭头 */}
      <div className="mx-auto grid h-16 max-w-[1280px] grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:px-6 xl:gap-6">
        <NavA link={{ label: "Home", href: "/", status: "live" }} onLink={onLink} className="flex shrink-0 items-center gap-2 justify-self-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO} alt="" className="size-8" />
          <span className={`whitespace-nowrap text-[18px] font-extrabold tracking-tight transition-colors duration-300 ${clear ? "text-white" : "text-[#240A03]"}`}>BuzzVideo AI</span>
        </NavA>
        <DesktopMenu mark={mark} onLink={onLink} compact={false} dim dark={clear} />
        <div className="col-start-3 flex items-center justify-end gap-1.5">
          <div className="hidden items-center gap-1.5 sm:flex">{auth}</div>
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
        footer={<div className="[&>button]:w-full [&>button]:justify-center">{auth}</div>}
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
