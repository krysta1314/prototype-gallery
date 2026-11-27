// 官网 Header 大菜单 + Footer 站点地图的数据(2026-11-18,SEO / GEO 改版)。纯数据,无 UI 依赖。
// 依据:docs/research/2026-11-18-header-footer-seo-geo.md(13 个竞品 + buzzvideo.ai 现状)。
// 链接文字按真实搜索词校正(2026-11-18 第二轮,Google 自动补全 6,822 个词):docs/research/keywords/2026-11-18-market.json,
// 对照说明见 docs/research/2026-11-18-nav-keyword-audit.md。没人搜的叫法改成搜索原词;产品做不到但有人搜的需求，做成解答页(/learn/),不做成工具链接。
//
// 规则(交接给开发):
// 1. 每个链接 = 真实 <a href> 指向独立可索引页面,不再用 /?mode=…&model=… 查询串(会被当成首页重复内容)。
// 2. 锚文本就是目标搜索词(「AI Video Generator」而不是「Features」);desc 是给人看的一行好处说明。
// 3. 网址规则(2026-11-19 Monica 改：照 Higgsfield,功能 / 模型 / 免费工具的落地页一律一级网址)—— /<keyword>(如 /ai-image-generator)、/<model>(如 /kling-4-0,
//    下挂 /<model>/prompt-guide 等)、免费工具 /<x>;分类总页 /tools、/models、/models/video|image|audio、/free-tools 保留;旧网址 /tools/…、/models/…、/free-tools/… 一律 301 到新网址。其余目录:/templates/<x>、
//    /solutions/<team>、/use-cases/<x>、/compare/<competitor>(竞品替代页,沿用 UAT 的 /compare/topview)、/compare/models/<a>-vs-<b>、
//    /best/<x>、/learn/<x>、/research/<x>、/integrations/<x>、/faq、/glossary。
//    现有 /usecase/*、/mcp/skills/* 不动(/models/seedance 301 到 /seedance)。
// 4. status:live = buzzvideo.ai 线上已有;uat = UAT / 已有原型、即将上线;new = 要新建(原型里可高亮,即待建清单)。
//    2026-11-18 逐个探测过 buzzvideo.ai 和 uat-app.buzzvideo.ai(app.buzzvideo.ai 301 到 buzzvideo.ai):已有的页面直接复用，不重做。

import { MODELS, modelsOfType, type ModelType } from "./models-catalog";
import { isMerged, isRemoved } from "../site/redirects";

export type LinkStatus = "live" | "uat" | "new";

export type NavLink = {
  /** 搜索词叫法：Footer / Explore more / 落地页内链都用它(锚文本带关键词) */
  label: string;
  /** 顶栏里的短名(见 NAV_SHORT)。只有 Header 用;没有就用 label */
  nav?: string;
  href: string;
  status: LinkStatus;
  /** 菜单里标题下的一行说明(只 Header 用) */
  desc?: string;
  badge?: "New" | "Hot" | "Soon";
};

export type NavGroup = {
  title: string;
  href?: string;
  links: NavLink[];
  /** Header 下拉里先露几个，其余收进 More(链接仍在 DOM 里) */
  more?: number;
  /** 列底常驻的「All …」总页链接 */
  footer?: NavLink;
  /** 列底第二个总页链接(Audio 去掉 Features 列后,All AI tools 挪到这里) */
  footer2?: NavLink;
  /** 小节排几列(默认 2;Audio 只剩模型一组占满整行时 4 列，一类一列) */
  sectionCols?: 2 | 4;
  /** 一组链接排成两列(Audio 只有模型一组，占满整行) */
  cols?: 2;
  /** 列内再分小节(2026-11-24 Monica:Audio 的模型按 Voice / Voice Clone / Music / Sound Effects 分);有它时按小节渲染,links 仍是全部模型 */
  sections?: { title: string; links: NavLink[]; more: number }[];
};

/** 下拉顶部的图卡主入口:img = 真实成片 / 样图;art = 音频类用代码画的小界面(波形、声音克隆) */
export type NavTile = NavLink & {
  img?: string;
  art?: "voice" | "tts" | "clone" | "change" | "music" | "formats" | "site" | "app" | "app-code" | "sfx";
  /** 浮层打开时循环播放的成片(和封面是同一条) */
  video?: string;
  /** Studios 网格的筛选分类 */
  cat?: string;
  /** 图卡名字前放一个小图标(Resources 菜单) */
  labelIcon?: boolean;
};

/** 下拉底部一条推荐(当期主推的模型 / 活动) */
export type NavPromo = { title: string; desc: string; cta: string; href: string; status: LinkStatus; img?: string; /** 横幅里循环播放的短片(和 img 是同一画面，img 当封面) */ video?: string; icon?: "video" | "audio" | "chat" | "chart" | "team" | "mcp"; /** strip = 一行推荐条;banner = 带大图的横幅 */ kind?: "strip" | "banner" };

export type TopItem = {
  label: string;
  /** 顶级项本身也是一个可抓取链接(点标题进总页,悬停出大菜单) */
  href: string;
  status: LinkStatus;
  /** 面板标题(Agent / MCP / Studios / Resources 有;Image / Video / Audio 没有) */
  /* 2026-11-24 Monica:标题前不放图标(AI 味),icon 字段已不渲染 */
  heading?: { text: string; icon?: "agent" | "mcp" | "studio" | "community" };
  tiles?: NavTile[];
  /** Studios:图卡网格上方的筛选标签 */
  tabs?: string[];
  groups?: NavGroup[];
  /** 底部两张并排的推荐卡(Image 用) */
  cards?: NavPromo[];
  promo?: NavPromo;
};

const L = (label: string, href: string, status: LinkStatus, desc?: string, badge?: NavLink["badge"]): NavLink => ({ label, href, status, desc, badge });

/* ───────── 链接库(Header 和 Footer 共用,改一处两边一起变) ───────── */

const AGENT_LINKS = [
  L("AI Marketing Agent", "/marketing-agent", "new", "Brief in, campaign-ready ads out"),
  L("AI Ad Generator", "/ai-ad-generator", "new", "Ad sets and new variations of a winner"),
  L("URL to Video", "/url-to-video", "new", "Turn a product page into a video ad"),
  L("AI UGC Video Generator", "/ai-ugc-video-generator", "new", "Creator-style ads without creators"),
  L("AI Product Video Generator", "/ai-product-video-generator", "new", "Hero shots and demos from one photo"),
  L("Hybrid Reel", "/hybrid-reel", "uat", "Your footage plus AI-shot scenes", "New"),
];

const VIDEO_TOOLS = [
  L("AI Video Generator", "/ai-video-generator", "new"),
  L("Text to Video", "/text-to-video", "new"),
  L("Image to Video", "/image-to-video", "new"),
  L("AI Faceless Video Generator", "/faceless-video-generator", "new"),
  L("AI Video Upscaler", "/upscale-video", "uat"),
  L("AI Motion Control", "/motion-control", "uat"),
  L("Video Character Swap", "/video-character-swap", "uat"),
  L("3D to Video", "/3d-to-video", "uat", undefined, "New"),
];
const IMAGE_TOOLS = [
  L("AI Image Generator", "/ai-image-generator", "new"),
  L("AI Image Editor", "/ai-image-editor", "new"),
  L("Remove Background", "/remove-background", "new"),
  L("Transparent PNG Generator", "/transparent-png-generator", "new"),
  L("Remove Object from Photo", "/remove-object", "uat"),
  L("AI Image Upscaler", "/upscale-image", "uat"),
  L("AI Virtual Try-On", "/virtual-try-on", "uat"),
  L("AI Product Photography", "/ai-product-photography", "new"),
  L("Photo Angle Editor", "/photo-angle-editor", "uat"),
];
const AUDIO_AVATAR_TOOLS = [
  L("AI Voice Over", "/ai-voice-over", "new"),
  L("Text to Speech", "/text-to-speech", "new"),
  L("AI Voice Clone", "/ai-voice-clone", "new"),
  L("AI Music Generator", "/ai-music-generator", "new"),
  L("AI Sound Effects Generator", "/ai-sound-effects-generator", "new"),
  L("AI Avatar Video Generator", "/talking-avatar", "uat"),
  L("AI Lip Sync", "/ai-lip-sync", "uat"),
  L("AI Spokesperson Video", "/ai-spokesperson", "new"),
];
const DESIGN_TOOLS = [
  L("AI Banner Generator", "/ad-creative-maker", "uat", undefined, "New"),
  L("Brand Kit", "/brand-kit", "uat"),
  L("AI Presentation Maker", "/ai-presentation-maker", "uat"),
  L("AI Website Builder", "/ai-website-builder", "uat"),
  L("Canvas", "/canvas", "live"),
  L("3D Studio", "/3d-studio", "uat"),
];
/* 2026-11-19 功能扩充(Monica「全部做」):产品能做 / 原型有 / MCP Skill 有的直接放;未来才做的标 Soon(先有落地页吃搜索)。
   不放：AI Face Swap、Video Face Swap(热度高，但广告用得少、平台政策风险，见 2026-11-04 调研) */
const IMAGE_MORE = [
  L("AI Inpainting", "/ai-inpainting", "new"),
  L("AI Background Generator", "/ai-background-generator", "new"),
  L("AI Image Extender", "/ai-image-extender", "new"),
  L("Image to Image", "/image-to-image", "new"),
  L("AI Photo Relight", "/ai-photo-relight", "new"),
  L("AI Infographic Generator", "/ai-infographic-generator", "new"),
  L("AI Photo Restoration", "/ai-photo-restoration", "new"),
  L("Sketch to Image", "/sketch-to-image", "new"),
  L("Consistent Character AI", "/consistent-character", "new"),
  L("AI Headshot Generator", "/ai-headshot-generator", "new"),
  L("AI Mockup Generator", "/ai-mockup-generator", "new"),
  L("Image to 3D", "/image-to-3d", "new"),
  L("AI Thumbnail Maker", "/ai-thumbnail-maker", "new"),
];
const VIDEO_MORE = [
  L("AI B-roll Generator", "/ai-b-roll-generator", "new"),
  L("AI Short Drama Generator", "/ai-short-drama", "new"),
  L("AI Animation Generator", "/ai-animation-generator", "new"),
  L("AI Anime Generator", "/ai-anime-generator", "new"),
  L("AI Dance Video Generator", "/ai-dance-video", "new"),
  L("AI Video Extender", "/ai-video-extender", "new"),
  L("First and Last Frame to Video", "/first-last-frame", "new"),
  L("AI Camera Control", "/ai-camera-control", "new"),
  L("AI Storyboard Generator", "/ai-storyboard-generator", "new"),
  L("AI Video Background Remover", "/ai-video-background-remover", "new"),
  L("Video Resizer", "/video-resizer", "new"),
  L("AI Dubbing", "/ai-dubbing", "new"),
  L("AI Video Translator", "/ai-video-translator", "new", undefined, "Soon"),
  L("AI Music Video Generator", "/ai-music-video-generator", "new"),
];
const AUDIO_MORE = [
  L("AI Song Generator", "/ai-song-generator", "new"),
  L("AI Jingle Generator", "/ai-jingle-generator", "new"),
  L("AI Sound Effects Generator", "/ai-sound-effects-generator", "new"),
  L("AI Lyrics Generator", "/ai-lyrics-generator", "new"),
  L("AI Voice Changer", "/ai-voice-changer", "new", undefined, "Soon"),
  L("AI Voice Enhancer", "/ai-voice-enhancer", "new", undefined, "Soon"),
  L("AI Podcast Generator", "/ai-podcast-generator", "new"),
];
const DESIGN_MORE = [
  L("AI Graphic Design", "/ai-graphic-design", "uat"),
  L("AI Social Media Post Generator", "/ai-social-media-post-generator", "uat"),
  L("AI Instagram Post Generator", "/ai-instagram-post-generator", "uat"),
  L("AI Carousel Maker", "/ai-carousel-maker", "uat"),
  L("AI Poster Generator", "/ai-poster-generator", "uat"),
  L("AI Flyer Maker", "/ai-flyer-maker", "uat"),
  L("AI Logo Generator", "/ai-logo-generator", "new"),
];

/* 免费小工具:不登录就能用,工具页本身就是落地页(首屏工具 + 下方用法 / FAQ / 相关工具);网址 /free-tools/ 和付费 /tools/ 分开 */
const FREE_TOOLS = [
  L("AI Hook Generator", "/ai-hook-generator", "new"),
  L("AI Ad Script Generator", "/ai-ad-script-generator", "new"),
  L("AI Ad Copy Generator", "/ai-ad-copy-generator", "new"),
  L("TikTok Caption Generator", "/tiktok-caption-generator", "new"),
  L("Video Resizer", "/video-resizer", "new"),
  L("Safe Zone Checker", "/safe-zone-checker", "new"),
  L("Video Compressor", "/video-compressor", "new"),
  L("Image Resizer for Facebook Ads", "/image-resizer", "new"),
  L("Video to GIF", "/video-to-gif", "new"),
  L("Meta Ad Size Guide", "/ad-size-guide", "new"),
];

/* 模型链接从 models-catalog.ts 生成(UAT 后台 Enabled + v1.13 上新,2026-11-18 对账);Kling 4.0 有原型页，其余待建 */
/* Seedance 2.5 的落地页用家族网址 /seedance(线上现有的 /models/seedance、/models/seedance-2-5 都 301 到 /seedance) */
const EXISTING_MODEL_PAGE: Record<string, string> = { "seedance-2-5": "/models/seedance" };
const modelLink = (m: (typeof MODELS)[number], withDesc = true): NavLink => {
  const live = EXISTING_MODEL_PAGE[m.slug];
  /* 2026-11-19 落地页改一级网址;线上原有的 /models/seedance 要 301 到 /seedance,所以这里一律算新页 */
  /* 2026-11-19 Monica:线上已有的页面直接指过去(Seedance 2.5 = buzzvideo.ai/models/seedance) */
  return L(m.name, live ?? `/${m.slug}`, live ? "live" : m.slug === "kling-4-0" ? "uat" : "new", withDesc ? `${m.vendor} · ${m.desc}` : undefined, m.badge);
};
const modelLinks = (t: ModelType, featuredOnly = false, withDesc = true) =>
  modelsOfType(t).filter((m) => !featuredOnly || m.featured).map((m) => modelLink(m, withDesc));
/* ───────── 顶栏 Models 列表按网络搜索热度排(2026-11-24 Monica:「模型就按名字搜索，最后整理排名」)─────────
   按模型名搜：以这个名字开头的不同搜索建议有多少条(名字 + 空格 + a..z 逐个展开),Google 和 YouTube 各查一遍相加(hl=en, gl=us)。
   条数越多 = 搜的人和搜法越多，排越前。比上午只看「打几个字符被补全」准：那个办法对带版本号的名字不公平。
   仍然是搜索建议数据，不是真实搜索量;刚发布的型号(Seedance 2.5 Flash、GPT Image 2.6…)建议还没长出来，会排在后面。
   原始数据和脚本:docs/research/keywords/2026-11-24-header-verbs-and-models.json、research-2026-11-24.py。 */
const MODEL_HEAT: Record<string, number> = { "Seedance 2.5": 469, "Kling 4.0": 173, "Wan 3.0": 267, "MiniMax H3": 468, "Seedance 2.0": 461, "Seedance 2.5 Flash": 1, "Seedance 2.0 Fast": 57, "Seedance 2.0 Mini": 79, "Kling 3.0": 353, "Seedance 1.5 Pro": 76, "MiniMax H3 Max": 110, "Wan 3.0 Prime": 13, "Kling 3.0 Omni": 64, "Vidu Q3 Pro": 6, "Gemini Omni Flash": 229, "Gemini Omni 1.2 Flash": 1, "Grok Imagine Video 1.5": 23, "FLUX 3 Max Video": 0, "FLUX 3 Video": 65, "HeyGen Video": 189, "MiniMax H3 Max Turbo": 9, "Nano Banana 2.1": 139, "GPT Image 2.5 Sunburst": 37, "Nano Banana Pro": 419, "Seedream 5.5": 5, "Seedream 5.0 Pro": 101, "GPT Image 2.5 Flare": 23, "GPT Image 2": 322, "Nano Banana 2": 306, "Nano Banana 2 Lite": 53, "Nano Banana": 492, "Seedream 5.0 lite": 55, "Seedream 4.5": 180, "Grok Imagine Image 2.0": 9, "GPT Image 2.6 Sunburst": 1, "GPT Image 2.6 Flare": 1, "FLUX 3 Image": 69, "Muse Image": 102, "MAI-Image-2.5": 7, "Qwen Image 3.0": 62, "Qwen Image 3.0 Pro": 7, "Wan 2.7 Image": 37, "Wan 2.7 Image Pro": 2, "Seed Audio 1.0": 24, "ElevenLabs v4": 83, "ElevenLabs v4 Turbo": 4, "ElevenLabs v3": 149, "MiniMax Speech 2.8 HD": 4, "MiniMax Speech 2.6 HD": 1, "Gemini 3.8 Flash TTS": 50, "Kling TTS": 1, "MiniMax Voice Clone": 24, "Kling Voice Clone": 1, "ElevenLabs Music v2.5": 0, "Lyria 3.5": 41, "Mureka V9.5": 1, "MiniMax Music 3": 127, "ElevenLabs Sound Effects v3": 1, "HeyGen Voice": 61, "Voice Replication 2.0": 0 };
/* ───────── 模型排名以 Artificial Analysis 榜单为准(2026-11-24 Monica:「图片视频音频模型你就在这里看排名」)─────────
   来源(2026-11-24 抓取，原始表存 docs/research/keywords/2026-11-24-artificial-analysis-leaderboards.json):
     图片 artificialanalysis.ai/image/leaderboard/text-to-image(AA-Image-T2I v2.1)
     视频 artificialanalysis.ai/video/leaderboard/text-to-video(AA-Video-T2V v2.1)
     音频 artificialanalysis.ai/text-to-speech/leaderboard(只有语音合成榜;该站没有音乐 / 音效 / 声音克隆的榜单)
   数字是榜单上的 Elo 分(盲测对战得分，越高越好),按 Elo 从高到低排。
   榜单上没有的模型(Kling 4.0、Wan 3.0 Prime、Seedance 2.0 Fast / Mini、Seedance 1.5 Pro、MiniMax H3 Max Turbo,以及全部音乐 / 音效 / 克隆 / Seed Audio / Kling TTS / HeyGen Voice)
   排在有榜单分的模型后面，它们之间按上面的搜索热度 MODEL_HEAT 排。ElevenLabs v4 和 v4 Turbo 同分(1340),v4 放前。 */
const AA_ELO: Record<string, number> = { "GPT Image 2.6 Sunburst": 1263, "GPT Image 2.5 Sunburst": 1229, "GPT Image 2.6 Flare": 1227, "GPT Image 2.5 Flare": 1210, "GPT Image 2": 1195, "Nano Banana 2.1": 1175, "Grok Imagine Image 2.0": 1166, "Nano Banana 2": 1144, "Seedream 5.5": 1134, "Muse Image": 1126, "MAI-Image-2.5": 1118, "Nano Banana Pro": 1117, "FLUX 3 Image": 1114, "Nano Banana 2 Lite": 1110, "Seedream 5.0 Pro": 1104, "Qwen Image 3.0 Pro": 1094, "Qwen Image 3.0": 1075, "Seedream 4.5": 1030, "Seedream 5.0 lite": 1019, "Wan 2.7 Image": 988, "Nano Banana": 987, "Wan 2.7 Image Pro": 983, "Wan 3.0": 1174, "MiniMax H3": 1163, "Seedance 2.5": 1155, "Gemini Omni 1.2 Flash": 1153, "FLUX 3 Max Video": 1150, "HeyGen Video": 1148, "MiniMax H3 Max": 1144, "FLUX 3 Video": 1137, "Seedance 2.0": 1133, "Gemini Omni Flash": 1123, "Seedance 2.5 Flash": 1120, "Grok Imagine Video 1.5": 1049, "Kling 3.0 Omni": 1015, "Kling 3.0": 1000, "Vidu Q3 Pro": 933, "ElevenLabs v4": 1340.1, "ElevenLabs v4 Turbo": 1340, "Gemini 3.8 Flash TTS": 1282, "ElevenLabs v3": 1191, "MiniMax Speech 2.8 HD": 1173, "MiniMax Speech 2.6 HD": 1124 };
/* 人工置顶(2026-11-24 Monica 定):Image 默认露出的前五个由她指定 —— 纯按榜单排的话首屏五个全是 OpenAI 的模型，
   所以前五改成每家一个代表:OpenAI 两档 + Google + xAI + 字节。置顶之后的仍按榜单 Elo 排。 */
const MODEL_PIN: string[] = ["GPT Image 2.6 Sunburst", "GPT Image 2.6 Flare", "Nano Banana 2.1", "Grok Imagine Image 2.0", "Seedream 5.5",
  /* 2026-11-24 Monica 在截图上标的 Video 前 10 个顺序，之后仍按榜单 Elo */
  "Seedance 2.5", "Wan 3.0", "MiniMax H3 Max", "Gemini Omni 1.2 Flash", "MiniMax H3", "FLUX 3 Max Video", "HeyGen Video", "MiniMax H3 Max Turbo", "FLUX 3 Video", "Seedance 2.0"];
const byModelHeat = (links: NavLink[]) =>
  links
    .map((l, i) => ({ l, i, p: MODEL_PIN.indexOf(l.label), e: AA_ELO[l.label] ?? 0, h: MODEL_HEAT[l.label] ?? 0 }))
    .sort((a, b) => (a.p < 0 ? 99 : a.p) - (b.p < 0 ? 99 : b.p) || b.e - a.e || b.h - a.h || a.i - b.i)
    .map((x) => x.l);
const VIDEO_MODELS = modelLinks("video");
const IMAGE_MODELS = modelLinks("image");
const AUDIO_MODELS = modelLinks("audio");
/* 音频模型按用途分四类(Header Audio 下拉的 Models 列小节);新音频模型上架时要在这里归类，否则不会出现在下拉里 */
/* 小节里手动指定的前排顺序;没列到的按原排序跟在后面 */
const AUDIO_SECTION_HEAD: Record<string, string[]> = { Voice: ["ElevenLabs v4", "ElevenLabs v4 Turbo", "Seed Audio 1.0", "Gemini 3.8 Flash TTS"] };
const headRank = (section: string, label: string) => {
  const i = AUDIO_SECTION_HEAD[section]?.indexOf(label) ?? -1;
  return i < 0 ? 99 : i;
};
const AUDIO_MODEL_TASKS: [string, string[], number][] = [
  ["Voice", ["ElevenLabs v4", "ElevenLabs v4 Turbo", "ElevenLabs v3", "Gemini 3.8 Flash TTS", "MiniMax Speech 2.8 HD", "MiniMax Speech 2.6 HD", "Kling TTS", "HeyGen Voice", "Seed Audio 1.0"], 5], /* 2026-11-24 Monica:Voice 默认露 5 个 */
  ["Voice Clone", ["MiniMax Voice Clone", "Voice Replication 2.0", "Kling Voice Clone"], 2],
  ["Music", ["Lyria 3.5", "MiniMax Music 3", "ElevenLabs Music v2.5", "Mureka V9.5", "Seed Audio 1.0"], 2],
  ["Sound Effects", ["ElevenLabs Sound Effects v3", "Seed Audio 1.0"], 2],
];
/* 2026-11-24 Monica:「模型聚合页就一页，这一页里面包含所有模型」—— 去掉 /ai-video-models、/ai-image-models、/ai-audio-models 三个分类页，
   统一指向线上已有的 All Models 页 /models(页内用标签切换视频 / 图片 / 音频)。旧网址 301 到 /models。 */
const ALL_MODELS = L("All AI models", "/models", "live"); /* 2026-11-24 Monica:和 All AI tools 对齐 */
const ALL_VIDEO = ALL_MODELS;
const ALL_IMAGE = ALL_MODELS;
const ALL_AUDIO = ALL_MODELS;
/* 模型对比(模型 vs 模型)+ 榜单。网址 /compare/models/<a>-vs-<b>,和竞品替代页 /compare/<竞品> 分开(models 是保留 slug) */
const MODEL_COMPARE = [
  L("Seedance 2.5 vs Kling 4.0", "/seedance-2-5-vs-kling-4-0", "new"),
  L("Seedance 2.5 vs Seedance 2.0", "/seedance-2-5-vs-seedance-2-0", "new"),
  L("Seedance 2.5 vs Wan 3.0", "/seedance-2-5-vs-wan-3-0", "new"),
  L("Nano Banana Pro vs Nano Banana 2", "/nano-banana-pro-vs-nano-banana-2", "new"),
  L("GPT Image vs Nano Banana", "/gpt-image-vs-nano-banana", "new"),
  L("GPT Image 2.5 Sunburst vs Flare", "/gpt-image-2-5-sunburst-vs-flare", "new"),
  L("Lyria 3.5 vs Suno", "/lyria-3-5-vs-suno", "new"),
  L("Gemini 3.8 Flash TTS vs ElevenLabs", "/gemini-3-8-flash-tts-vs-elevenlabs", "new"),
  /* 2026-11-24 第二批：Google 自动补全里出现的「<模型> vs …」组合 */
  L("Seedance 2.5 vs MiniMax H3", "/seedance-2-5-vs-minimax-h3", "new"),
  L("Seedance 2.0 vs Kling 3.0", "/seedance-2-0-vs-kling-3-0", "new"),
  L("Seedance 2.0 vs Fast vs Mini", "/seedance-2-0-vs-fast-vs-mini", "new"),
  L("Kling 4.0 vs Kling 3.0", "/kling-4-0-vs-kling-3-0", "new"),
  L("Kling 3.0 vs Kling 3.0 Omni", "/kling-3-0-vs-kling-3-0-omni", "new"),
  L("Wan 3.0 vs MiniMax H3", "/wan-3-0-vs-minimax-h3", "new"),
  L("MiniMax H3 vs MiniMax H3 Max", "/minimax-h3-vs-minimax-h3-max", "new"),
  L("Gemini Omni Flash vs Seedance 2.5", "/gemini-omni-flash-vs-seedance-2-5", "new"),
  L("Nano Banana 2 vs Nano Banana 2.1", "/nano-banana-2-vs-nano-banana-2-1", "new"),
  L("GPT Image 2 vs GPT Image 2.5", "/gpt-image-2-vs-gpt-image-2-5", "new"),
  L("Seedream 5.0 Pro vs Nano Banana Pro", "/seedream-5-0-pro-vs-nano-banana-pro", "new"),
  L("Best AI Video Models", "/best-ai-video-models", "new"),
];
/* 模型子页(spokes):每个版本页下挂 提示词指南 / 价格 / 教程,导航只露最热的几个,其余从模型页内链进入 */
const MODEL_GUIDES = [
  L("Seedance 2.5 Prompt Guide", "/seedance-2-5-prompt-guide", "new"),
  L("Kling 4.0 Prompt Guide", "/kling-4-0-prompt-guide", "new"),
  L("GPT Image 2.5 Prompt Guide", "/gpt-image-2-5-sunburst-prompt-guide", "new"),
  L("Nano Banana Pro Prompt Guide", "/nano-banana-pro-prompt-guide", "new"),
  L("Seedance 2.5 Pricing", "/seedance-2-5-pricing", "new"),
  L("How to Use Kling 4.0", "/kling-4-0-how-to-use", "new"),
  /* 2026-11-24 第二批(SEO/GEO 调研：模型子页没有官方垄断，聚合站能排;按各模型自动补全里 price / prompt / how to use 的条数挑) */
  L("How to Use Seedance 2.5", "/seedance-2-5-how-to-use", "new"),
  L("Seedance 2.0 Prompt Guide", "/seedance-2-0-prompt-guide", "new"),
  L("Seedance 2.0 Pricing", "/seedance-2-0-pricing", "new"),
  L("How to Use Seedance 2.0", "/seedance-2-0-how-to-use", "new"),
  L("Kling 4.0 Pricing", "/kling-4-0-pricing", "new"),
  L("Kling 3.0 Prompt Guide", "/kling-3-0-prompt-guide", "new"),
  L("How to Use Kling 3.0", "/kling-3-0-how-to-use", "new"),
  L("Wan 3.0 Prompt Guide", "/wan-3-0-prompt-guide", "new"),
  L("Wan 3.0 Pricing", "/wan-3-0-pricing", "new"),
  L("MiniMax H3 Prompt Guide", "/minimax-h3-prompt-guide", "new"),
  L("MiniMax H3 Pricing", "/minimax-h3-pricing", "new"),
  L("How to Use MiniMax H3", "/minimax-h3-how-to-use", "new"),
  L("Gemini Omni Flash Pricing", "/gemini-omni-flash-pricing", "new"),
  L("Nano Banana Pro Pricing", "/nano-banana-pro-pricing", "new"),
  L("How to Use Nano Banana Pro", "/nano-banana-pro-how-to-use", "new"),
  L("Nano Banana 2 Prompt Guide", "/nano-banana-2-prompt-guide", "new"),
  L("How to Use Nano Banana 2", "/nano-banana-2-how-to-use", "new"),
  L("GPT Image 2 Prompt Guide", "/gpt-image-2-prompt-guide", "new"),
  L("How to Use GPT Image 2", "/gpt-image-2-how-to-use", "new"),
  L("Seedream 4.5 Prompt Guide", "/seedream-4-5-prompt-guide", "new"),
];

const TEMPLATE_BY_TYPE = [
  L("UGC Ad Templates", "/ugc-ad-templates", "new"),
  L("Product Video Templates", "/product-video-templates", "new"),
  L("Unboxing Video Template", "/unboxing-video-templates", "new"),
  L("Before and After Video Template", "/before-and-after-templates", "new"),
  /* 2026-11-24:UGC / 脚本类模板的搜索结果是小站在排 */
  L("UGC Ad Script Templates", "/ugc-ad-script-templates", "new"),
  L("Problem-Solution Ad Template", "/problem-solution-ad-template", "new"),
  L("Talking Head Ad Template", "/talking-head-ad-template", "new"),
  L("Street Interview Ad Template", "/street-interview-ad-template", "new"),
  L("GRWM Ad Template", "/grwm-ad-template", "new"),
  L("Testimonial Ad Templates", "/testimonial-ad-templates", "new"),
];
const TEMPLATE_BY_PLATFORM = [
  L("TikTok Ad Templates", "/tiktok-ad-templates", "new"),
  L("Instagram Reels Templates", "/instagram-reels-templates", "new"),
  L("Facebook Ad Templates", "/facebook-ad-templates", "new"),
  L("YouTube Shorts Templates", "/youtube-shorts-templates", "new"),
];
/* 节日按美 / 英市场(memory:目标市场美英,不写香港) */
const TEMPLATE_SEASONAL = [
  L("Black Friday Ad Templates", "/black-friday-ad-templates", "new", undefined, "Hot"),
  L("Christmas Ads", "/christmas-ad-templates", "new"),
  L("Valentine's Day Ads", "/valentines-day-ad-templates", "new"),
  L("Mother's Day Ads", "/mothers-day-ad-templates", "new"),
];

const BY_TEAM = [
  L("AI Marketing Videos", "/ai-marketing-videos", "new", "One brief, every channel, on brand"),
  L("AI Video for Agencies", "/ai-video-for-agencies", "new", "More client creatives per week"),
  L("AI Video for Ecommerce", "/ai-video-for-ecommerce", "new", "Product ads for every SKU"),
  L("AI Video for Small Business", "/ai-video-for-small-business", "new", "Ads without an agency budget"),
  L("AI Video for Creators", "/ai-video-for-creators", "new", "Post daily without a crew"),
  L("Enterprise", "/enterprise", "new", "Seats, SSO, usage controls"),
];
const BY_AD_TYPE = [
  L("AI UGC Ads", "/ai-ugc-ads", "new"),
  L("AI Product Demo Videos", "/product-demo-videos", "new"),
  L("AI Commercial Generator", "/ai-commercials", "new"),
  L("AI Model Photoshoot", "/ai-model-photoshoot", "new"),
  L("Affiliate Marketing Videos", "/affiliate-marketing-videos", "new"),
];
const BY_PLATFORM = [
  L("AI TikTok Video Generator", "/tiktok-videos", "new"),
  L("TikTok Shop Videos", "/tiktok-shop-videos", "new"),
  L("AI Instagram Reels Maker", "/instagram-reels", "new"),
  L("AI Facebook Ad Generator", "/facebook-ads", "new"),
  L("AI YouTube Shorts Generator", "/youtube-shorts", "new"),
  L("Amazon Product Videos", "/amazon-product-videos", "new"),
  L("Shopify Product Videos", "/shopify-product-videos", "new"),
];
const BY_INDUSTRY = [
  L("Skincare Ads", "/skincare-ads", "new"),
  L("Fashion Ads", "/fashion-ads", "new"),
  L("Restaurant Ads", "/restaurant-ads", "new"),
  L("Dropshipping Ads", "/dropshipping-ads", "new"),
  L("Mobile App Ads", "/mobile-app-ads", "new"),
  /* 2026-11-24:行业 × AI 广告长尾，搜索结果几乎没有大牌专门页 */
  L("Supplement Ads", "/supplement-ads", "new"),
  L("Jewelry Ads", "/jewelry-ads", "new"),
  L("Fitness Ads", "/fitness-ads", "new"),
  L("Pet Product Ads", "/pet-product-ads", "new"),
  L("Perfume Ads", "/perfume-ads", "new"),
  L("Home Decor Ads", "/home-decor-ads", "new"),
  L("Beverage Ads", "/beverage-ads", "new"),
  L("Real Estate Video Ads", "/real-estate-video-ads", "new"),
];
/** 行业页网址(2026-11-25:Footer 精简后，行业页之间在正文里互相带，见 UseCaseTemplate) */
export const INDUSTRY_HREFS = BY_INDUSTRY.map((l) => l.href);

/* 竞品页:沿用 UAT 已上线的 /compare/topview 格式 —— 一个竞品一页,标题「<竞品> Alternatives」,
   页内 = 选择标准 + 6 个替代品横评 + BuzzVideo 案例 + FAQ + 来源与核对日期。
   不再另开 /alternatives/ 和 /compare/<竞品>-vs-buzzvideo,免得同一个词两页互抢(关键词蚕食)。 */
/* 2026-11-24 调研后排序：小众竞品(Arcads / MakeUGC / TopView)排前 —— 这三个词的搜索结果几乎全是同行小站自写页，新站能排;
   大牌(HeyGen / Creatify / Synthesia / Higgsfield)被 G2 / Capterra / AlternativeTo 垄断，页面保留但先不进 Footer(见 FOOTER_DEFERRED)。 */
const COMPARE = [
  L("Arcads Alternatives", "/compare/arcads", "new"),
  L("MakeUGC Alternatives", "/compare/makeugc", "new"),
  L("TopView AI Alternatives", "/compare/topview", "uat"),
  L("Pippit Alternatives", "/compare/pippit", "new"),
  L("Creatify Alternatives", "/compare/creatify", "new"),
  L("HeyGen Alternatives", "/compare/heygen", "new"),
  L("Higgsfield Alternatives", "/compare/higgsfield", "new"),
  L("Synthesia Alternatives", "/compare/synthesia", "new"),
  /* 2026-11-26 新增(调研后 Monica 定的清单) */
  L("invideo Alternatives", "/compare/invideo", "new"),
  L("OpenArt Alternatives", "/compare/openart", "new"),
];
/* 榜单 / 教程(长尾词) */
const BEST_AND_LEARN = [
  L("Best AI Ad Generators", "/best-ai-ad-generators", "new"),
  L("Best AI UGC Video Generators", "/best-ai-ugc-video-generators", "new"),
  L("Best AI Video Generators", "/best-ai-video-generators", "new"),
  L("Best AI Avatar Video Generators", "/best-ai-avatar-video-generators", "new"),
  L("Best AI Voice Over Generators", "/best-ai-voice-over-generators", "new"),
  L("Best AI Music Generators", "/best-ai-music-generators", "new"),
  L("Best AI Product Photography Tools", "/best-ai-product-photography-tools", "new"),
  L("Best AI Lip Sync Tools", "/best-ai-lip-sync-tools", "new"),
  L("How to Make UGC Ads with AI", "/make-ugc-ads-with-ai", "new"),
  L("How to Write a Good Hook", "/write-a-good-hook", "new"),
  L("TikTok Ad Specs", "/tiktok-ad-specs", "new"),
];
/* 真实搜索问题 → 解答页(GEO:AI 回答这类问题时最爱引用一句话直答 + 数据的页面)。
   我们做不到的玩法也照样回答(比如别家的做法、平台规则),但不挂成工具链接。 */
const QUESTIONS = [
  L("Can Claude Make Videos?", "/can-claude-make-videos", "new"),
  L("Can ChatGPT Make Videos?", "/can-chatgpt-make-videos", "new"),
  L("Do UGC Ads Work?", "/do-ugc-ads-work", "new"),
  L("Are AI UGC Ads Legal?", "/are-ai-ugc-ads-legal", "new"),
  L("AI UGC vs Human UGC", "/ai-ugc-vs-human-ugc", "new"),
  L("How to Create AI Product Videos for Free", "/create-ai-product-videos-free", "new"),
  L("How Long Should an Amazon Product Video Be?", "/amazon-product-video-length", "new"),
  L("How to Add Video to Shopify Product Page", "/add-video-to-shopify-product-page", "new"),
  L("How to Make an AI Avatar Video", "/make-ai-avatar-video", "new"),
  L("How to Clone Your Voice with AI", "/clone-your-voice-with-ai", "new"),
  L("How to Do AI Lip Sync", "/how-to-do-ai-lip-sync", "new"),
  L("Can AI Do Product Photography?", "/can-ai-do-product-photography", "new"),
  L("Does TikTok Have an AI Video Generator?", "/tiktok-ai-video-generator", "new"),
  L("AI in Advertising Examples", "/ai-in-advertising-examples", "new"),
];
/* 原创数据页:AI 最爱引用的一类(Opus /research 232 页);数据可来自 MediaLens 广告库 */
const RESEARCH = [
  L("Best Time to Post Ads on Facebook & Instagram", "/best-time-to-post-ads", "new"),
  L("AI Video Model Benchmarks", "/ai-video-model-benchmarks", "new"),
  L("TikTok Ads Benchmarks by Industry", "/tiktok-ads-benchmarks", "new"),
  L("TikTok Ads CPM by Country", "/tiktok-ads-cpm", "new"),
];

const MCP_LINKS = [
  L("BuzzVideo MCP", "/mcp", "live", "Create videos and images inside any AI chat"),
  L("MCP Skills", "/mcp-skills", "uat", "26 ready-made ad workflows", "New"),
  L("Claude Video Generator", "/claude-video-generator", "new", "Make videos inside Claude"),
  L("ChatGPT Video Generator", "/chatgpt-video-generator", "new", "Make ads from a ChatGPT chat"),
  L("Video Generation MCP Server", "/video-generation-mcp", "new", "One MCP server for video, image and audio"),
];
/* 集成:只放产品真支持的。Shopify / Meta / TikTok Ads 是候选,要确认能力后再上线 */
const INTEGRATIONS = [
  L("All Integrations", "/integrations", "new"),
  L("Shopify", "/shopify-integration", "new"),
  L("Meta Ads Manager", "/meta-ads-integration", "new"),
  L("TikTok Ads Manager", "/tiktok-ads-integration", "new"),
  L("API", "/api", "new"),
];

/* ───────── Header:按媒介分的 9 个顶级(2026-11-19 改版;同日 Monica 定顶级照 Higgsfield:Image / Video / Audio / MCP / Agent / Studios / Resources / Affiliate / Pricing,
   Templates 并进 Studios、Solutions 并进 Agent;Resources 含社区作品、Prompt Library、Blog;菜单居中、不带下拉箭头) ─────────
   Monica 2026-11-19:参照 Higgsfield 新版顶栏，顶级改成按媒介分(Video / Image / Audio),每个下拉里工具和模型放在一起;
   每个下拉 = 顶部一排图卡(主入口，图卡本身就是真实链接)+ 两三列列表(超过 5 个折叠在 More 里，链接仍在 DOM)+ 底部一条推荐。
   保留:Marketing Agent(她定过不并入工具)、MCP、Templates、Solutions、Resources、Pricing。
   改版前顶栏里的每个链接都还在某个下拉里(SEO 不丢内链);/tools 和 /models 总页挂在列底的「All …」链接。 */

const V = "/video-library/posters";
const SM = "/prototypes/site/models";
const AT = "/prototypes/ai-tools";
const NAV = "/prototypes/site/nav";
/* MCP 下拉图标卡直接跳正式站的 MCP 页 */
const MCP_LIVE = "https://buzzvideo.ai/mcp";
const T = (label: string, href: string, status: LinkStatus, img?: string, art?: NavTile["art"]): NavTile => ({ label, href, status, img, art });
const without = (links: NavLink[], hrefs: string[]) => links.filter((l) => !hrefs.includes(l.href));
const plain = (links: NavLink[]) => links.map((l) => ({ ...l, desc: undefined }));
/* 下拉 Features 列按搜索热度排序(2026-11-23 Monica:「按照 SEO 关键词的热门顺序排序」)。
   数据：docs/research/keywords/2026-11-19-nav-features.json —— Google 自动补全(美国英文),
   [几个字符就出现在建议里, 出现时已输入占全词的比例],两个数越小越热门。只是相对热度，不是绝对搜索量。
   没测到的词排在测到的后面;挂「Soon」的排在可用的后面(热门但还用不了的不放最前)。 */
const HEAT: Record<string, [number, number]> = {
  "/remove-background": [3, 0.18], "/upscale-image": [4, 0.24], "/ai-background-generator": [6, 0.26], "/ai-headshot-generator": [6, 0.29],
  "/ai-mockup-generator": [6, 0.32], "/ai-thumbnail-maker": [6, 0.33], "/ai-inpainting": [6, 0.46], "/remove-object": [8, 0.33],
  "/ai-infographic-generator": [8, 0.33], "/ai-photo-restoration": [10, 0.5], "/ai-image-extender": [10, 0.59], "/image-to-image": [10, 0.59],
  "/ai-photo-relight": [10, 0.62], "/sketch-to-image": [10, 0.67], "/consistent-character": [12, 0.52], "/image-to-3d": [14, 1],
  "/photo-angle-editor": [16, 0.73],
  "/ai-b-roll-generator": [5, 0.26], "/ai-music-video-generator": [6, 0.25], "/ai-animation-generator": [6, 0.27], "/ai-caption-generator": [6, 0.3],
  "/ai-short-drama": [6, 0.43], "/ai-dance-video": [6, 0.43], "/ai-lip-sync": [6, 0.55], "/ai-dubbing": [6, 0.6], "/ai-storyboard-generator": [8, 0.35],
  "/ai-anime-generator": [8, 0.44], "/video-character-swap": [8, 0.53], "/video-resizer": [8, 0.62], "/ai-video-background-remover": [10, 0.37],
  "/ai-video-translator": [10, 0.53], "/upscale-video": [10, 0.59], "/ai-video-extender": [10, 0.59], "/motion-control": [10, 0.59],
  "/text-to-video": [10, 0.62], "/faceless-video-generator": [12, 0.5], "/first-last-frame": [16, 0.7], "/long-video-to-shorts": [20, 0.87],
  "/ai-lyrics-generator": [4, 0.21], "/ai-song-generator": [4, 0.24], "/ai-podcast-generator": [6, 0.3], "/ai-jingle-generator": [6, 0.32],
  "/ai-voice-changer": [6, 0.38], "/ai-voice-enhancer": [10, 0.59], "/ai-sound-effects-generator": [16, 0.62],
};
const VERB_HEAT: Record<string, number> = { "/ai-image-generator": 302, "/ai-image-editor": 282, "/ai-product-photography": 11, "/virtual-try-on": 99, "/remove-background": 475, "/upscale-image": 343, "/ai-background-generator": 412, "/ai-headshot-generator": 38, "/ai-mockup-generator": 122, "/ai-thumbnail-maker": 155, "/ai-inpainting": 12, "/remove-object": 190, "/ai-infographic-generator": 82, "/ai-photo-restoration": 149, "/ai-image-extender": 216, "/image-to-image": 164, "/ai-photo-relight": 37, "/sketch-to-image": 3, "/consistent-character": 20, "/image-to-3d": 147, "/photo-angle-editor": 192, "/ai-video-generator": 399, "/image-to-video": 202, "/ai-video-editor": 499, "/talking-avatar": 92, "/ai-b-roll-generator": 7, "/ai-animation-generator": 273, "/ai-caption-generator": 206, "/ai-short-drama": 7, "/ai-dance-video": 15, "/ai-lip-sync": 150, "/ai-storyboard-generator": 59, "/ai-anime-generator": 183, "/video-character-swap": 22, "/video-resizer": 258, "/ai-video-background-remover": 220, "/upscale-video": 296, "/motion-control": 3, "/ai-video-extender": 169, "/text-to-video": 53, "/faceless-video-generator": 18, "/first-last-frame": 2, "/long-video-to-shorts": 26, "/3d-to-video": 21, "/ai-spokesperson": 1, "/ai-camera-control": 2, "/ai-music-video-generator": 85, "/ai-dubbing": 59, "/ai-video-translator": 335, "/ai-voice-over": 30, "/text-to-speech": 93, "/ai-voice-clone": 281, "/ai-music-generator": 393, "/ai-lyrics-generator": 72, "/ai-song-generator": 347, "/ai-jingle-generator": 19, "/ai-sound-effects-generator": 23, "/ai-podcast-generator": 114, "/ai-voice-changer": 373, "/ai-voice-enhancer": 219 };
/* Features 排序：按动词说法的搜索热度(NAV_VERB 的第二项)从高到低;Soon 的排最后 */
const byHeat = (links: NavLink[]) =>
  links
    .map((l, i) => ({ l, i, h: VERB_HEAT[l.href] ?? 0, soon: l.badge === "Soon" ? 1 : 0 }))
    .sort((a, b) => a.soon - b.soon || b.h - a.h || a.i - b.i)
    .map((x) => x.l);
/* 2026-11-24 Monica:/tools 和 /free-tools 两个聚合页删除，菜单和页脚都不再有「All AI tools」「All free tools」入口 */

export const HEADER: TopItem[] = [
  /* Home 不放进菜单(Monica 2026-11-24 去掉):点 logo 就回首页 */
  {
    label: "Image",
    href: "/ai-image-generator",
    status: "new",
    tiles: [
      /* 2026-11-24 重做的图卡：每张为功能设计构图(叠卡 / 棋盘格 / 四场景 / 平铺图→上身),素材在 dev 用 GPT Image 2.5 Sunburst / Flare 生成，
         原图和排版源文件在 ~/Desktop/官网素材工程/01-顶栏-Image/ */
      T("AI Image Generator", "/ai-image-generator", "new", "/prototypes/site/nav/image/image-generator.webp"),
      T("AI Image Editor", "/ai-image-editor", "new", "/prototypes/site/nav/image/image-editor.webp"),
      T("AI Product Photography", "/ai-product-photography", "new", "/prototypes/site/nav/image/product-photography.webp"),
      T("AI Virtual Try-On", "/virtual-try-on", "uat", "/prototypes/site/nav/image/virtual-try-on.webp"),
    ],
    groups: [
      {
        title: "Features",
        links: byHeat([...without(IMAGE_TOOLS, ["/ai-image-generator", "/ai-image-editor", "/ai-product-photography", "/virtual-try-on"]), ...IMAGE_MORE, L("AI Storyboard Generator", "/ai-storyboard-generator", "new")]),
        more: 5,
      },
      { title: "Models", href: "/models", links: byModelHeat(modelLinks("image", false, false)), more: 5, footer: ALL_IMAGE },
    ],
    cards: [
      { title: "Nano Banana 2.1", desc: "Fast all-rounder with sharp text and consistent characters", cta: "Try now", href: "/nano-banana-2-1", status: "new", img: "/prototypes/site/nav/image/nano-banana-2-1.webp" },
      { title: "GPT Image 2.5 Sunburst", desc: "Fine print, labels and detailed portraits", cta: "Try now", href: "/gpt-image-2-5-sunburst", status: "new", img: "/prototypes/site/nav/image/gpt-image-2-5-sunburst.webp" },
    ],
  },
  {
    label: "Video",
    href: "/ai-video-generator",
    status: "new",
    tiles: [
      /* 2026-11-24 Flash Diary 方向重做(Monica 选的 A),原图在 ~/Desktop/官网素材工程/04-顶栏-Video-FlashDiary/ */
      T("AI Video Generator", "/ai-video-generator", "new", "/prototypes/site/nav/video/video-generator.webp"),
      /* 2026-11-24 Monica:第 2 张改成 Edit Video,第 3 张改成 UGC 广告;Animate Image 回到 Features 列表。
         UGC 卡素材 = Flash Diary 风格新做的 16:9 口播(深夜便利店门口 + 虚构饮料 NOVA,GPT Image 2.5 Sunburst 首帧 → Seedance 2.5 720p 6s)+ 代码叠逐字字幕;
         工程在 ~/Desktop/官网素材工程/06-Video-UGC卡/ */
      /* 2026-11-26 Monica:AI Video Editor 功能还没有，图卡拿掉(落地页同步删除) */
      T("AI UGC Video Generator", "/ai-ugc-video-generator", "new", "/prototypes/site/nav/video/ugc-ads.webp"),
      T("AI Avatar Video Generator", "/talking-avatar", "uat", "/prototypes/site/nav/video/avatar-video.webp"),
    ],
    groups: [
      {
        title: "Features",
        links: byHeat([
          ...without(VIDEO_TOOLS, ["/ai-video-generator", "/ai-video-editor"]),
          L("AI Lip Sync", "/ai-lip-sync", "uat"),
          L("AI Spokesperson Video", "/ai-spokesperson", "new"),
          /* 2026-11-24 Monica 批注：去掉 Add Subtitles / Convert Video to Shorts;Dub Video 和 Lip Sync 重复，去掉;
             Make Dance Video 和 Copy Motion 都是 Kling Motion Control,合并成一个(/motion-control);Create Storyboard 出的是图，挪到 Image。
             这些落地页和 Footer 链接照旧保留。 */
          ...without(VIDEO_MORE, ["/ai-caption-generator", "/long-video-to-shorts", "/ai-dubbing", "/ai-dance-video", "/ai-storyboard-generator"]),
        ]),
        more: 5,
      },
      { title: "Models", href: "/models", links: byModelHeat(modelLinks("video", false, false)), more: 5, footer: ALL_VIDEO },
    ],
    /* 2026-11-24 Monica:Video 的推荐位放 Seedance 2.5(主推模型);横幅是一段循环短片 */
    promo: { title: "Seedance 2.5", desc: "Flagship quality for long, premium ads up to 30 seconds, with native audio", cta: "Try now", href: "/seedance", status: "live", img: "/prototypes/site/nav/video/seedance-2-5.webp", video: "/prototypes/site/nav/video/seedance-2-5.mp4", kind: "banner" },
  },
  {
    label: "Audio",
    href: "/ai-voice-over",
    status: "new",
    tiles: [
      /* 2026-11-24:Audio 四张是代码画的界面卡(深色面板 + 荧光绿声波，对照 Higgsfield 的音频卡),不放照片;头像从 ~/Desktop/官网素材工程/05-顶栏-Audio-FlashDiary/ 的素材里裁 */
      /* 2026-11-24 Monica:Voice Over 和 Text to Speech 在产品里是同一个功能 → 合成一张 Text to Speech(搜索热度 93 > 30,Higgsfield 也叫这个;
         /ai-voice-over 落地页留在 Footer)。空位按调研放 Change Voice(热度 373,Higgsfield / ElevenLabs 都是主功能;产品里还是 Soon)。 */
      /* 2026-11-24 Monica:四张卡对应音频的四类(配音 / 克隆 / 音乐 / 音效),Change Voice(Soon)换成 Sound Effects,变声退回 Features 列 */
      T("Text to Speech", "/text-to-speech", "new", undefined, "tts"),
      T("AI Voice Clone", "/ai-voice-clone", "new", undefined, "clone"),
      T("AI Music Generator", "/ai-music-generator", "new", undefined, "music"),
      /* 2026-11-24 Monica:Audio 只留三张卡(音效热度 23,低于其他三张一个量级),音效入口留在 Models 的 Sound Effects 小节和 Footer */
    ],
    groups: [
      /* 2026-11-24 Monica:Features 列去掉 —— 音频的高频场景上面四张大卡已覆盖(写歌 / 歌词在 Make Music 里),
         剩下的 Jingle 热度低、Enhance Audio 还是 Soon;落地页仍在 Footer 站点地图。模型一组占满整行，四类各一列，All AI tools 挪到列底 */
      {
        title: "Models",
        href: "/models",
        links: byModelHeat(modelLinks("audio", false, false)),
        footer: ALL_AUDIO, /* 2026-11-24 Monica:Audio 下拉去掉 All AI tools,只留 All AI models */
        sectionCols: 4,
        /* 2026-11-24 Monica:原来五个全是配音模型，做音乐 / 音效的看不到 → 按四类分小节，每类露头部 2–3 个，其余收进 More。
           Seed Audio 1.0 配音、音乐、音效都能做，三类里各出现一次(克隆有专门的模型，不放) */
        sections: AUDIO_MODEL_TASKS.map(([title, names, more]) => ({
          title,
          more,
          /* 通用的 Seed Audio 排在每节最后，专门模型优先;有指定前排的小节按指定顺序(2026-11-24 Monica:Voice 前四 = v4 / v4 Turbo / Seed Audio / Gemini) */
          links: byModelHeat(modelLinks("audio", false, false).filter((l) => names.includes(l.label)))
            .sort((a, b) => +(a.label === "Seed Audio 1.0") - +(b.label === "Seed Audio 1.0"))
            .sort((a, b) => headRank(title, a.label) - headRank(title, b.label)),
        })),
      },
    ],
    /* 2026-11-24 Monica:Audio 的推荐位放 ElevenLabs v4(榜单第一的语音模型),并配一张图 */
  },
  {
    label: "Agent",
    href: "/marketing-agent",
    status: "new",
    heading: { text: "Marketing Agent", icon: "agent" },
    tiles: [
      /* 2026-11-24 Flash Diary 方向重做成循环短片(Monica 逐张选的构图):一个产品散成三种版位 / 链接条下的商品图活过来 /
         自拍口播 + 逐字字幕 / 角落小图 + 主视觉成片。静帧 GPT Image 2.5 Sunburst,短片 Seedance 2.5 720p,代码合成;
         工程在 ~/Desktop/官网素材工程/07-顶栏-Agent-FlashDiary/(./build.sh 重渲) */
      T("AI Marketing Agent", "/marketing-agent", "new", `${NAV}/agent/agent.webp`),
      T("URL to Video", "/url-to-video", "new", `${NAV}/agent/url.webp`),
      T("AI UGC Video Generator", "/ai-ugc-video-generator", "new", `${NAV}/agent/ugc.webp`),
      T("AI Product Video Generator", "/ai-product-video-generator", "new", `${NAV}/agent/product.webp`),
    ],
    /* 2026-11-24 Monica:Make ads 和 Free tools 两列并成一列「Use cases」(文案类工具都是 Marketing Agent 在跑);
       去掉 Hybrid Reel、Canvas(Studios 菜单里有)和底部推荐条。浏览器里跑的 6 个免费小工具折在 More 里，链接仍在 DOM。 */
    /* 2026-11-24 Monica 批注「把这两个换掉」:Compress Video、Convert Video to GIF 不算 Agent 的用途，换成两个广告场景页
       (Commercials、Marketing Videos);这两个免费工具的落地页和 Footer 链接照旧。 */
    groups: [
      {
        title: "Use cases",
        links: [
          L("AI Ad Generator", "/ai-ad-generator", "new"),
          ...without(FREE_TOOLS, ["/video-compressor", "/video-to-gif", "/ad-size-guide"]),
          L("AI Commercial Generator", "/ai-commercials", "new"),
          L("AI Marketing Videos", "/ai-marketing-videos", "new"),
          L("Meta Ad Size Guide", "/ad-size-guide", "new"),
        ],
        more: 5,
        cols: 2,
      },
    ],
  },
  {
    label: "Studios",
    href: "/design-studio",
    status: "uat",
    heading: { text: "BuzzVideo Studios", icon: "studio" },
    /* 2026-11-24 Monica:「先不要分类」—— 去掉 All / Design / Video 分类页签;各图卡的 cat 字段留着，之后要恢复把下面改回 tabs: ["All", "Design", "Video"]。
       只留 "All" 一项时页签条不显示，但仍走三列图卡网格版式 */
    tabs: ["All"],
    /* 2026-11-24 Monica:除了 Canvas 和 3D Studio，其余全部标 Coming soon(图卡左上角的标签) */
    tiles: [
      /* 2026-11-24 Monica 批注排序：Canvas → 3D Studio → AI Video Editor(Hybrid Reel) → Design Studio */
      /* 2026-11-24 Monica:「所有的卡片图都要重新设计」—— Flash Diary 调性，每张用界面元素讲功能;代码合成(cards.html),
         能动的做成循环动效，Brand Kit / Deck / Website 是静态图。工程在 ~/Desktop/官网素材工程/07-顶栏-Agent-FlashDiary/(./build-cards.sh) */
      /* 2026-11-25 Monica 批注：Canvas 前面加一张 Marketing Agent;图卡按 Studios 这批同一风格新做(对话面板 + 三种尺寸成片),工程同上 cards.html 的 agent */
      { ...T("AI Marketing Agent", "/marketing-agent", "new", `${NAV}/studios/agent.webp`), nav: "Marketing Agent", video: `/prototypes/site/nav/studios/agent.mp4?v=2`, cat: "Video" },
      { ...T("Canvas", "/canvas", "live", `${NAV}/studios/canvas.webp`), cat: "Video" },
      { ...T("3D Studio", "/3d-studio", "uat", `${NAV}/studios/3d.webp`), cat: "Video" },
      { ...T("Hybrid Reel", "/hybrid-reel", "uat", `${NAV}/studios/editor.webp`), badge: "Soon", cat: "Video" },
      { ...T("Design Studio", "/design-studio", "uat", `${NAV}/studios/design.webp`), badge: "Soon", cat: "Design" },
      { ...T("AI Banner Generator", "/ad-creative-maker", "uat", `${NAV}/studios/builder.webp`), badge: "Soon", cat: "Design" },
      { ...T("Brand Kit", "/brand-kit", "uat", `${NAV}/studios/brand.webp`), badge: "Soon", cat: "Design" },
      { ...T("AI Presentation Maker", "/ai-presentation-maker", "uat", `${NAV}/studios/deck.webp`), badge: "Soon", cat: "Design" },
      { ...T("AI Website Builder", "/ai-website-builder", "uat", `${NAV}/studios/site.webp`), badge: "Soon", cat: "Design" },
    ],
    /* 2026-11-24 Monica:去掉「More design tools」一组。这 7 个(Graphic Design、Social Media Post、Instagram Post、Carousel、Poster、Flyer、Logo)
       之后做成落地页(待她看落地页时再定);链接仍在 Footer 的 Design Tools 里。 */
    /* 2026-11-24 Monica:去掉底部 Design Studio 推荐条 */
  },
  /* 2026-11-24 Monica:MCP 挪到 Studios 后面 */
  {
    label: "MCP",
    href: "/mcp",
    status: "live",
    heading: { text: "Create inside your AI chat", icon: "mcp" },
    /* 2026-11-24 Monica(对照 Higgsfield「Generate with Higgsfield MCP」):入口不放截图，放 app 图标卡;
       二改：卡太大 → 一行 4 个小卡 Claude / Claude Code / ChatGPT / MCP Skills,名字只写产品名;
       BuzzVideo MCP 挪到底部推荐条(原推荐条是 MCP Skills,和卡片重复);
       Monica:四张卡都跳正式站 —— Claude / Claude Code / ChatGPT → buzzvideo.ai/mcp,MCP Skills → buzzvideo.ai/mcp/skills */
    tiles: [
      T("Claude", MCP_LIVE, "live", "/prototypes/site/logos/claude-color.svg", "app"),
      T("Claude Code", MCP_LIVE, "live", "/prototypes/site/logos/claude-color.svg", "app-code"),
      T("ChatGPT", MCP_LIVE, "live", "/prototypes/site/logos/openai.svg", "app"),
      T("MCP Skills", "https://buzzvideo.ai/mcp/skills", "live", "/prototypes/ai-tools/logo.svg", "app"),
    ],
    groups: [
      {
        title: "Popular skills",
        href: "/mcp-skills",
        /* 2026-11-24 Monica:MCP 下拉去掉 Developers(API / llms.txt),skills 一组占满整行，排两列 */
        cols: 2,
        /* 2026-11-24 按数据重排(Monica:「市场调研看哪些 skill 最高搜索和使用」):
           数据 docs/research/keywords/2026-11-24-mcp-skills.json(脚本 mcp-skills-2026-11-24.py)—— Google / YouTube 搜索建议(美国英文),
           每个 skill 取「想做」的说法(ai short drama,不取泛词 short drama),分数 = Google 展开数 + YouTube 展开数 − 补全所需字符数 × 0.5:
           AI Short Drama 366 / AI UGC 343 / Translate video 330 / Faceless video 309 / Auto captions 262 / Virtual try on 260。
           掉出去的：Long Video to Shorts 109、Link to Video Ad 96、Hook Variations 48(搜得少);Image to 3D 361 热但不是广告场景，没放 */
        links: [
          L("AI Short Drama", "/short-drama-mcp-skill", "uat"),
          L("UGC Product Review", "/ugc-product-review-mcp-skill", "uat"),
          L("Ad Localizer", "/ad-localizer-mcp-skill", "uat"),
          L("Faceless Video", "/faceless-explainer-mcp-skill", "uat"),
          L("Add Subtitles", "/video-editor-mcp-skill", "uat"),
          L("Virtual Try-On", "/try-on-ugc-mcp-skill", "uat"),
        ],
      },
    ],
    promo: { title: "BuzzVideo MCP", desc: "Create videos and images inside any AI chat", cta: "Set up", href: "/mcp", status: "live", icon: "mcp" },
  },
  {
    label: "Resources",
    href: "/resources",
    status: "new",
    /* 2026-11-24 Monica:「换个文案」—— 原来的 Learn and get inspired 在去掉 Academy / Gallery 后对不上内容，改成直接说里面有什么 */
    heading: { text: "Prompts, guides and updates", icon: "community" },
    tiles: [
      /* 2026-11-24 Monica 批注：图卡顺序 Prompt Library → Blog → Affiliate(第三张),去掉底部博客推荐条。
         Community Gallery 从这个菜单拿掉(Monica:「不要了」),Footer 的 Community 列里还有。BuzzVideo Academy 总页(/learn)也删了。Affiliate 暂用现成图占位，等这一排图卡重做时一起换。 */
      T("Prompt Library", "/usecase", "live", `${NAV}/resources/prompt.webp`),
      T("Blog", "/blog", "live", `${NAV}/resources/blog.webp`),
      T("Affiliate Program", "/affiliate", "live", `${NAV}/resources/affiliate.webp`),
      /* 2026-11-24 Monica:「把这两个也做成卡片」「每个卡片配上合适的图」—— 五张都是按内容新做的图卡(同 Studios 那批);
         卡的尺寸和 Image 菜单一样(四张一排，第五张换行;她否了五张小卡一排) */
      T("Help Center", "/help", "new", `${NAV}/resources/help.webp`),
      T("What's New", "/whats-new", "new", `${NAV}/resources/new.webp`),
    ],
  },
  /* Monica 2026-11-23:照 Higgsfield 加 Enterprise,放 Resources 和 Pricing 之间(普通链接，无下拉) */
  { label: "Enterprise", href: "/enterprise", status: "new" },
  { label: "Pricing", href: "/pricing", status: "live" },
];

/* 图卡悬停预览：只挂封面和成片对得上的(本地压缩副本，preload=none,悬停才下载) */
/* ───────── 2026-11-25 落地页清单落地(docs/research/2026-11-25-landing-page-plan.md)─────────
   合并掉的页(site/redirects.ts 的 MERGED)从所有导航里拿掉;改名的页换成新名字和新网址。 */
const RENAMED: Record<string, [string, string]> = {
  "/video-character-swap": ["Video Face Swap", "/video-face-swap"],
};
const fixLinks = <T extends NavLink>(links: T[]): T[] =>
  links.map((l) => (RENAMED[l.href] ? { ...l, label: RENAMED[l.href][0], href: RENAMED[l.href][1] } : l)).filter((l) => !isMerged(l.href));
/* 2026-11-25 这期不做的顶栏入口(Enterprise)整项拿掉，Resources 里 Help / What's New 图卡也拿掉 */
for (let i = HEADER.length - 1; i >= 0; i--) if (HEADER[i].href && !HEADER[i].groups && !HEADER[i].tiles && isRemoved(HEADER[i].href!)) HEADER.splice(i, 1);
for (const top of HEADER) {
  if (top.tiles) top.tiles = fixLinks(top.tiles).filter((t) => !(isRemoved(t.href) && ["/help", "/whats-new"].includes(t.href)));
  for (const g of top.groups ?? []) {
    g.links = fixLinks(g.links).filter((l) => !isRemoved(l.href) || /-mcp-skill$/.test(l.href)); /* 下拉里的文字链接去掉已删的页;图卡和 MCP Skill(产品入口)保留，点了去产品 */
    for (const s of g.sections ?? []) s.links = fixLinks(s.links);
  }
}

const TILE_VIDEO: Record<string, string> = {
  /* Video 菜单四张图卡的循环短片(2026-11-24:「video 的话应该动起来」),用同名静帧当封面 */
  "/ai-video-generator": "/prototypes/site/nav/video/video-generator.mp4",
  "/image-to-video": "/prototypes/site/nav/video/image-to-video.mp4",
  "/ai-video-editor": "/prototypes/site/nav/video/video-editor.mp4",
  "/talking-avatar": "/prototypes/site/nav/video/avatar-video.mp4",
  "/url-to-video": "/prototypes/site/tools/link-to-ad.mp4",
  "/ai-ugc-video-generator": "/prototypes/site/tools/ugc-product-review.mp4",
  "/ai-product-video-generator": "/prototypes/site/tools/unboxing-ugc.mp4",
  "/ugc-ad-templates": "/prototypes/site/tools/ugc-product-review.mp4",
  "/product-video-templates": "/prototypes/site/tools/product-ad.mp4",
};
for (const t of HEADER) for (const tile of t.tiles ?? []) if (TILE_VIDEO[tile.href]) tile.video = TILE_VIDEO[tile.href];

/* ───────── 顶栏里的名字(2026-11-24 第三版，Monica 定的规则)─────────
   「header 给用户，footer 瞄准 SEO / GEO」:顶栏的功能名也是搜索词，但要用动词说法，因为是用户来用(Remove Background、Upscale Image、Create Video);
   Footer 用精准的名词搜索词(AI Image Upscaler、AI Video Generator),见 footerSitemap。
   调研：每个功能准备 3–5 种动词说法，查 Google + YouTube 搜索建议，选「真有人这么搜、建议条数最多、且意思和功能对得上」的那个。
   [显示名，热度]:热度 = 以这个说法开头的不同搜索建议条数(Google + YouTube)。Features 按热度从高到低排。
   没选热度最高的几处(意思对不上):Lyrics 没用 "write a song"、Voice Enhancer 没用 "remove background noise"、Video Resizer 没用 "crop video"、Inpainting 没用 "fill in image"。
   调研了 Image / Video / Audio / Agent 四个菜单;MCP / Studios / Resources 仍是去掉「AI」的原名。 */
export const NAV_VERB: Record<string, [string, number]> = {
  "/ai-image-generator": ["Create Image", 302],
  "/ai-image-editor": ["Edit Image", 282],
  "/ai-product-photography": ["Create Product Photos", 11],
  "/virtual-try-on": ["Try On Clothes", 99],
  "/remove-background": ["Remove Background", 475],
  "/upscale-image": ["Upscale Image", 343],
  "/ai-background-generator": ["Change Background", 412],
  "/ai-headshot-generator": ["Create Headshot", 38],
  "/ai-mockup-generator": ["Create Mockup", 122],
  "/ai-thumbnail-maker": ["Create Thumbnail", 155],
  "/ai-inpainting": ["Inpaint Image", 12],
  "/remove-object": ["Remove Object from Photo", 190],
  "/ai-infographic-generator": ["Create Infographic", 82],
  "/ai-photo-restoration": ["Restore Old Photos", 149],
  "/ai-image-extender": ["Expand Image", 216],
  "/image-to-image": ["Transform Image", 164],
  "/ai-photo-relight": ["Relight Image", 37],
  "/sketch-to-image": ["Turn Sketch into Image", 3],
  "/consistent-character": ["Create Consistent Character", 20],
  "/image-to-3d": ["Convert Image to 3D", 147],
  "/photo-angle-editor": ["Change Camera Angle", 192],
  "/ai-video-generator": ["Create Video", 399],
  "/image-to-video": ["Animate Image", 202],
  "/ai-video-editor": ["Edit Video", 499],
  "/talking-avatar": ["Create AI Avatar", 92],
  "/ai-b-roll-generator": ["Create B-roll", 7],
  "/ai-animation-generator": ["Make Animation", 273],
  "/ai-caption-generator": ["Add Subtitles to Video", 206],
  "/ai-short-drama": ["Create Short Drama", 7],
  "/ai-dance-video": ["Make Dance Video", 15],
  "/ai-lip-sync": ["Lip Sync Video", 150],
  "/ai-storyboard-generator": ["Create Storyboard", 59],
  "/ai-anime-generator": ["Make Anime", 183],
  "/video-character-swap": ["Replace Character in Video", 22],
  "/video-resizer": ["Resize Video", 258],
  "/ai-video-background-remover": ["Remove Video Background", 220],
  "/upscale-video": ["Upscale Video", 296],
  "/motion-control": ["Copy Motion from Video", 3],
  "/ai-video-extender": ["Extend Video", 169],
  "/text-to-video": ["Convert Text to Video", 53],
  "/faceless-video-generator": ["Create Faceless Videos", 18],
  "/first-last-frame": ["Animate Between Two Images", 2],
  "/long-video-to-shorts": ["Convert Video to Shorts", 26],
  "/3d-to-video": ["3D to Video", 21],
  "/ai-spokesperson": ["Create AI Spokesperson", 1],
  "/ai-camera-control": ["Add Camera Movement to Video", 2],
  "/ai-music-video-generator": ["Make Music Video", 85],
  "/ai-dubbing": ["Dub Video", 59],
  "/ai-video-translator": ["Translate Video", 335],
  "/ai-voice-over": ["Create Voice Over", 30],
  "/text-to-speech": ["Convert Text to Speech", 93],
  "/ai-voice-clone": ["Clone Voice", 281],
  "/ai-music-generator": ["Make Music", 393],
  "/ai-lyrics-generator": ["Write Lyrics", 72],
  "/ai-song-generator": ["Make a Song", 347],
  "/ai-jingle-generator": ["Make a Jingle", 19],
  "/ai-sound-effects-generator": ["Generate Sound Effects", 23],
  "/ai-podcast-generator": ["Create a Podcast", 114],
  "/ai-voice-changer": ["Change Voice", 373],
  "/ai-voice-enhancer": ["Enhance Audio", 219],
  /* Agent 菜单(2026-11-24 补调研，数据 docs/research/keywords/2026-11-24-agent-menu-verbs.json;热度 = Google + YouTube 建议条数)
     Marketing Agent / Hybrid Reel / Canvas 是产品名，不改。没选最高的:UGC 的 "create ugc video"、产品视频的 "create product video" 本身不在建议里;
     TikTok 的 "tiktok caption ideas" 不是动词;广告尺寸没有动词说法被搜，用名词 Meta Ad Sizes。 */
  "/url-to-video": ["Convert URL to Video", 11],
  "/ai-ugc-video-generator": ["Create UGC Ads", 16],
  "/ai-product-video-generator": ["Make Product Video", 16],
  "/ai-ad-generator": ["Create Ads", 145],
  "/ai-hook-generator": ["Write a Hook", 10],
  "/ai-ad-script-generator": ["Write Ad Script", 1],
  "/ai-ad-copy-generator": ["Write Ad Copy", 3],
  "/tiktok-caption-generator": ["Write TikTok Caption", 1],
  "/safe-zone-checker": ["Check Safe Zone", 2],
  "/video-compressor": ["Compress Video", 335],
  /* 没查搜索量，先按同一写法起名(第二个数填 0) */
  "/ai-commercials": ["Make a Commercial", 0],
  "/ai-marketing-videos": ["Make Marketing Videos", 0],
  "/image-resizer": ["Resize Image for Facebook", 37],
  "/video-to-gif": ["Convert Video to GIF", 157],
  "/ad-size-guide": ["Meta Ad Sizes", 13],
};
/** 没调研到的菜单项：去掉开头的「AI 」 */
const stripAi = (label: string) => label.replace(/^AI\s+/, "");
for (const t of HEADER) {
  for (const tile of t.tiles ?? []) tile.nav = NAV_VERB[tile.href]?.[0] ?? stripAi(tile.label);
  for (const g of t.groups ?? []) for (const l of g.links) l.nav = NAV_VERB[l.href]?.[0] ?? stripAi(l.label);
}
/* 2026-11-24 Monica 定：Studio 只留给顶层工作台(Design Studio、3D Studio),Design Studio 里的三个工具用 Builder 命名，Brand Kit 不变。
   只改 Studios 菜单里图卡的名字;落地页标题、网址和 Footer 链接(AI Banner Generator / AI Presentation Maker 这些搜索词)不动。 */
const STUDIO_TILE_NAME: Record<string, string> = { "/hybrid-reel": "AI Video Editor", "/ad-creative-maker": "Image Builder", "/ai-presentation-maker": "Deck Builder", "/ai-website-builder": "Website Builder" };
for (const tile of HEADER.find((t) => t.label === "Studios")?.tiles ?? []) if (STUDIO_TILE_NAME[tile.href]) tile.nav = STUDIO_TILE_NAME[tile.href];
/* Studios / Resources 图卡里能动的那几张：循环动效(和封面同一画面) */
const CARD_VIDEO: Record<string, Record<string, string>> = {
  Studios: { "/design-studio": "studios/design", "/3d-studio": "studios/3d", "/canvas": "studios/canvas", "/hybrid-reel": "studios/editor", "/ad-creative-maker": "studios/builder" },
  Resources: { "/usecase": "resources/prompt", "/affiliate": "resources/affiliate", "/help": "resources/help", "/whats-new": "resources/new" },
};
for (const [menu, map] of Object.entries(CARD_VIDEO))
  for (const tile of HEADER.find((t) => t.label === menu)?.tiles ?? []) if (map[tile.href]) tile.video = `/prototypes/site/nav/${map[tile.href]}.mp4?v=3`;
/* 2026-11-24 Monica:「给这些配上 icon」—— Resources 的图卡名字前各放一个小图标 */
for (const tile of HEADER.find((t) => t.label === "Resources")?.tiles ?? []) tile.labelIcon = true;
/* Agent 菜单四张图卡各有自己的循环短片(和封面同一画面) */
const AGENT_TILE_VIDEO: Record<string, string> = { "/marketing-agent": "agent", "/url-to-video": "url", "/ai-ugc-video-generator": "ugc", "/ai-product-video-generator": "product" };
for (const tile of HEADER.find((t) => t.label === "Agent")?.tiles ?? [])
  if (AGENT_TILE_VIDEO[tile.href]) tile.video = `/prototypes/site/nav/agent/${AGENT_TILE_VIDEO[tile.href]}.mp4?v=3`;
/* Video 菜单的 UGC 图卡单独配短片(名字和 Agent 菜单一样，都是 Create UGC Ads) */
for (const tile of HEADER.find((t) => t.label === "Video")?.tiles ?? [])
  if (tile.href === "/ai-ugc-video-generator") Object.assign(tile, { nav: "Create UGC Ads", video: "/prototypes/site/nav/video/ugc-ads.mp4" });
/** 顶栏里显示的名字 */
export const navLabel = (l: { label: string; nav?: string }) => l.nav ?? l.label;

/** 悬停详情卡里的一句话(工具 / 功能;只写产品真做得到的) */
export const FLYOUT_DESC: Record<string, string> = {
  "/text-to-video": "Type a prompt and get a video clip, with sound on most models.",
  "/faceless-video-generator": "Explainer and story videos with voiceover and captions, no one on camera.",
  "/upscale-video": "Sharpen a video to a higher resolution.",
  "/motion-control": "Copy the moves from any video, dances included, onto a character in your image.",
  "/video-character-swap": "Replace the person in a video with your own character.",
  "/3d-to-video": "Turn a 3D blockout into a finished video shot.",
  "/ai-lip-sync": "Match a face's lip movement to any voice track.",
  "/ai-spokesperson": "A presenter reads your script to camera.",
  "/remove-background": "Cut the product out cleanly for any background.",
  "/remove-object": "Brush over anything you want gone.",
  "/upscale-image": "Sharpen an image to a higher resolution.",
  "/photo-angle-editor": "See the same product or person from a new angle.",
  "/ai-ad-generator": "Ad sets from a photo, link or brief, plus new variations of a winner.",
  "/ai-sound-effects-generator": "Describe a sound and get it, up to 30 seconds.",
  "/ad-creative-maker": "Static ads and banners in every size, on brand.",
  "/brand-kit": "Logos, colours and fonts that every design follows.",
  "/ai-presentation-maker": "Slides from a brief, in your brand.",
  "/ai-website-builder": "A one-page site from a prompt.",
  "/ai-hook-generator": "Opening lines for video ads. Free, no sign-up.",
  "/ai-ad-script-generator": "A full ad script from your product. Free, no sign-up.",
  "/ai-ad-copy-generator": "Headlines and primary text for ads. Free, no sign-up.",
  "/tiktok-caption-generator": "Captions and hashtags for TikTok posts. Free, no sign-up.",
  "/video-resizer": "Resize a video for every placement. Free, no sign-up.",
  "/safe-zone-checker": "Check that text clears the platform UI. Free, no sign-up.",
  "/video-compressor": "Make a video file smaller. Free, no sign-up.",
  "/image-resizer": "Resize images for Facebook ad placements. Free, no sign-up.",
  "/video-to-gif": "Turn a clip into a GIF. Free, no sign-up.",
  "/ad-size-guide": "Every Meta ad size and ratio on one page.",
  "/link-to-ad-mcp-skill": "Paste a product link in your AI chat and get a video ad.",
  "/ugc-product-review-mcp-skill": "A creator-style review video of your product.",
  "/ad-hook-variants-mcp-skill": "New opening hooks for an ad that already works.",
  "/ad-localizer-mcp-skill": "The same ad in another language and market.",
  "/long-to-shorts-mcp-skill": "Cut a long video into short vertical clips.",
  "/video-editor-mcp-skill": "Add word-by-word captions to a video you already have.",
  "/ai-inpainting": "Brush over part of an image and describe what goes there.",
  "/ai-background-generator": "Put your product in a new scene, light and setting.",
  "/ai-image-extender": "Extend an image to a new size or ratio without cropping.",
  "/image-to-image": "Turn a reference image into a new image from your prompt.",
  "/ai-photo-relight": "Change the light on a photo to match a new scene.",
  "/ai-infographic-generator": "Product infographics and listing images with readable text.",
  "/ai-photo-restoration": "Sharpen and clean up old or low-resolution photos.",
  "/sketch-to-image": "Turn a rough sketch into a finished image.",
  "/consistent-character": "Keep the same face or product across many images.",
  "/ai-headshot-generator": "Professional headshots from a few selfies.",
  "/ai-mockup-generator": "Your design on packaging, apparel and devices.",
  "/image-to-3d": "Turn a product photo into a 3D-style render.",
  "/ai-thumbnail-maker": "Video thumbnails with bold, readable titles.",
  "/ai-caption-generator": "Add styled captions to a video automatically.",
  "/ai-b-roll-generator": "Product and lifestyle cutaways for your edit.",
  "/ai-short-drama": "Episodic micro-drama scenes with the same cast.",
  "/ai-animation-generator": "Animated and cartoon-style clips from a prompt or image.",
  "/ai-anime-generator": "Anime-style images and clips.",
  "/ai-dance-video": "Characters that dance to your track, planned in 3D.",
  "/ai-video-extender": "Make a clip longer, continuing the same shot.",
  "/first-last-frame": "Set the first and last frame; the model fills the motion.",
  "/ai-camera-control": "Choose the camera move: push in, orbit, pan or crane.",
  "/ai-storyboard-generator": "Plan every shot of an ad on the Canvas before you render.",
  "/ai-video-background-remover": "Video with a transparent background, ready to layer.",
  "/long-video-to-shorts": "Cut a long video into short vertical clips.",
  "/ai-dubbing": "The same video in another language, with matching lips.",
  "/ai-video-translator": "Translate the speech and captions of a video. Coming soon.",
  "/ai-music-video-generator": "An AI song and the scenes to go with it.",
  "/ai-song-generator": "Full songs with vocals and lyrics from a prompt.",
  "/ai-jingle-generator": "Short brand jingles and sonic logos.",
  "/ai-lyrics-generator": "Song lyrics from a theme or product. Free, no sign-up.",
  "/ai-voice-changer": "Change a recorded voice into another voice. Coming soon.",
  "/ai-voice-enhancer": "Remove noise and echo from recorded speech. Coming soon.",
  "/ai-podcast-generator": "A two-voice podcast from an article or notes.",
  "/ai-graphic-design": "Ads, posts and banners in Design Studio, on brand.",
  "/ai-social-media-post-generator": "Posts for every network, sized and on brand.",
  "/ai-instagram-post-generator": "Instagram posts and stories from a brief.",
  "/ai-carousel-maker": "Multi-slide carousels for Instagram and LinkedIn.",
  "/ai-poster-generator": "Event and product posters with real text.",
  "/ai-flyer-maker": "Print-ready flyers from a brief.",
  "/ai-logo-generator": "Logo concepts from your brand name.",
};

/** 按工具类型的分组(/tools 总页已删，工具落地页的相关工具还读这里) */
export const TOOLS_HUB_GROUPS: NavGroup[] = [
  { title: "Ads", links: AGENT_LINKS.filter((l) => l.href.startsWith("/")) },
  { title: "Video", href: "/ai-video-generator", links: VIDEO_TOOLS },
  { title: "Image", href: "/ai-image-generator", links: IMAGE_TOOLS },
  { title: "Audio & Avatar", href: "/ai-voice-over", links: AUDIO_AVATAR_TOOLS },
  { title: "Design & Studios", href: "/design-studio", links: DESIGN_TOOLS },
  { title: "Free tools", links: FREE_TOOLS },
];

/* ───────── Footer:约 170 个链接的站点地图(对标 Jupitrr 171) ───────── */

export const FOOTER: NavGroup[] = [
  { title: "Marketing Agent", links: AGENT_LINKS },
  { title: "Video Tools", links: VIDEO_TOOLS },
  { title: "Image Tools", links: IMAGE_TOOLS },
  { title: "Audio & Avatar", links: AUDIO_AVATAR_TOOLS },
  { title: "Design & Studios", links: DESIGN_TOOLS },
  /* 2026-11-19:Header 改成直接进产品工具后，落地页靠 Footer 站点地图被收录 —— 新加的功能落地页全部进 Footer */
  { title: "More Image Tools", links: IMAGE_MORE },
  { title: "More Video Tools", links: VIDEO_MORE.filter((l) => l.href !== "/video-resizer") },
  { title: "More Audio Tools", links: AUDIO_MORE.filter((l) => l.href !== "/ai-sound-effects-generator") },
  { title: "Design Tools", links: DESIGN_MORE },
  { title: "Free Tools", links: [...FREE_TOOLS] },
  { title: "Video Models", links: [...VIDEO_MODELS, ALL_MODELS] },
  { title: "Image Models", links: [...IMAGE_MODELS] },
  { title: "Audio Models", links: [...AUDIO_MODELS] },
  { title: "Model Guides", links: MODEL_GUIDES },
  { title: "Compare Models", links: MODEL_COMPARE },
  { title: "Ad Templates", links: [...TEMPLATE_BY_TYPE, ...TEMPLATE_BY_PLATFORM.slice(0, 2), L("All ad templates", "/templates", "new")] },
  { title: "Seasonal Templates", links: [...TEMPLATE_SEASONAL, ...TEMPLATE_BY_PLATFORM.slice(2)] },
  { title: "Solutions", links: [...BY_TEAM, ...BY_AD_TYPE] },
  { title: "By Platform", links: BY_PLATFORM },
  { title: "By Industry", links: BY_INDUSTRY },
  { title: "Alternatives", links: COMPARE },
  { title: "Best & How-to", links: BEST_AND_LEARN },
  { title: "Questions", links: [...QUESTIONS] },
  { title: "MCP & Developers", links: [...MCP_LINKS, L("llms.txt", "/llms.txt", "new")] },
  {
    title: "Resources",
    links: [
      L("Blog", "/blog", "live"),
      L("Prompt Library", "/usecase", "live"),
      L("Help Center", "/help", "new"),
      L("FAQ", "/faq", "new"),
      L("AI Video Glossary", "/glossary", "new"),
      L("What's New", "/whats-new", "new"),
    ],
  },
  {
    title: "Company",
    links: [
      L("About", "/about", "live"),
      L("Pricing", "/pricing", "live"),
      L("Affiliate Program", "/affiliate", "live"),
      L("BuzzVideo App", "/app", "new"),
      L("Press & Brand Kit", "/press", "new"),
      /* 2026-11-24 Monica:线上 /contact 并入 Help Center，Contact Sales 也指到 Help Center 的 Contact 段 */
      L("Contact Sales", "/help#contact", "new"),
    ],
  },
  {
    title: "Trust & Legal",
    links: [
      L("Trust & Safety", "/trust", "new"),
      L("Content Policy", "/content-policy", "new"),
      L("Privacy Policy", "/privacy-policy", "live"),
      L("Terms of Service", "/terms-of-service", "live"),
    ],
  },
];

/* 2026-11-25 新增落地页(竞品 4 家里多家都做、搜索需求高、我们之前没有);合并页从 Footer 数据里拿掉 */
export const NEW_PAGES_NOV25: NavLink[] = [
  L("AI Voice Generator", "/ai-voice-generator", "new"),
  L("AI Face Swap", "/ai-face-swap", "new"),
  L("AI Influencer Generator", "/ai-influencer-generator", "new"),
  L("AI Art Generator", "/ai-art-generator", "new"),
  L("AI Script to Video", "/ai-script-to-video", "new"),
  L("AI Cartoon Generator", "/ai-cartoon-generator", "new"),
];
/* 2026-11-26 第 7 批(竞品 3 家都有的工具缺口，见 docs/research/2026-11-26-missing-pages-audit.md;内容在 site/tools/content/seo-2026-11-26.ts) */
export const NEW_PAGES_NOV26: NavLink[] = [
  L("AI Hairstyle Changer", "/ai-hairstyle-changer", "new"),
  L("Remove Object from Video", "/remove-object-from-video", "new"),
];
FOOTER.push({ title: "New Tools", links: [...NEW_PAGES_NOV25, ...NEW_PAGES_NOV26] });
for (const g of FOOTER) g.links = fixLinks(g.links).filter((l) => !isRemoved(l.href));

/* Footer 视觉分组(UI 审核 2026-11-18):23 个小列收成 6 大组，每组内用小标题分段;链接一个不少，全部还在 HTML 里 */
const F = (t: string) => FOOTER.find((g) => g.title === t)!;
export const FOOTER_GROUPS: { title: string; sections: NavGroup[] }[] = [
  { title: "Create", sections: ["Marketing Agent", "Video Tools", "Image Tools", "Audio & Avatar", "Design & Studios", "Free Tools"].map(F) },
  { title: "Models", sections: ["Video Models", "Image Models", "Model Guides", "Compare Models"].map(F) },
  { title: "Templates", sections: ["Ad Templates", "Seasonal Templates"].map(F) },
  { title: "Solutions", sections: ["Solutions", "By Platform", "By Industry"].map(F) },
  { title: "Learn", sections: ["Resources", "Best & How-to", "Questions", "Alternatives"].map(F) },
  { title: "Company", sections: ["MCP & Developers", "Company", "Trust & Legal"].map(F) },
];

/* Footer 第二版(2026-11-18,Monica:「footer 很丑很乱」,参考 higgsfield.ai):
   整块品牌橙 + 墨色字;左边一句大字口号，右边 5 列核心链接(每列叠 1–2 组);
   其余长尾链接放到页脚上方深色带的「Explore more」标签云 —— 和 Higgsfield 一样，链接全在 HTML 里，视觉上安静。 */
const pick = (links: NavLink[], labels: string[]) => labels.map((l) => links.find((x) => x.label === l)!);
/* 2026-11-19 照 Higgsfield:Header 点了进产品工具，落地页靠 Footer 串起来。
   列的分组和新导航对齐(Create / 模型 / Studios / Agent / Platform / Resources / Company / Community),
   每个链接都指向落地页(不是工具页);没进列的落地页全部进上方「Explore more AI features」标签云(exploreLinks 自动补齐，一个不少)。 */
const byHref = (hrefs: string[]) => hrefs.map((h) => allLinks().find((l) => l.href === h)).filter((l): l is NavLink => !!l).map((l) => ({ ...l, desc: undefined }));
export const FOOTER_COLUMNS: NavGroup[][] = [
  [
    {
      title: "Create",
      links: byHref([
        "/ai-video-generator", "/image-to-video", "/text-to-video", "/upscale-video", "/faceless-video-generator",
        "/talking-avatar", "/ai-lip-sync", "/ai-image-generator", "/ai-image-editor", "/ai-inpainting", "/upscale-image",
        "/remove-background", "/ai-product-photography", "/virtual-try-on", "/ai-voice-over", "/text-to-speech", "/ai-music-generator",
        "/ai-sound-effects-generator",
      ]),
    },
  ],
  [
    { title: "Video Models", links: [...modelLinks("video", false, false).slice(0, 10), ALL_VIDEO] },
    { title: "Image Models", links: [...modelLinks("image", false, false).slice(0, 7)] },
  ],
  [
    { title: "Audio Models", links: [...modelLinks("audio", false, false)] },
    { title: "Studios", links: byHref(["/design-studio", "/3d-studio", "/canvas", "/hybrid-reel", "/templates"]) },
  ],
  [
    { title: "Agent", links: byHref(["/marketing-agent", "/ai-ad-generator", "/url-to-video", "/ai-ugc-video-generator", "/ai-product-video-generator", "/ai-video-for-ecommerce", "/ai-video-for-agencies"]) },
    { title: "Platform", links: [...MCP_LINKS.map((l) => ({ ...l, desc: undefined })), L("llms.txt", "/llms.txt", "new")] },
  ],
  [
    { title: "Resources", links: [L("Blog", "/blog", "live"), L("Prompt Library", "/usecase", "live"), L("AI Video Tool Comparisons", "/compare", "new") /* 2026-11-27 Monica:Resources 加 compare 汇总页 */, L("Help Center", "/help", "new"), L("FAQ", "/faq", "new"), L("What's New", "/whats-new", "new")] },
    { title: "Company", links: [L("About", "/about", "live"), L("Pricing", "/pricing", "live"), L("Enterprise", "/enterprise", "new"), L("Affiliate Program", "/affiliate", "live")] },
    /* 2026-11-24 Monica:页脚的 Community 列(Community Gallery、Seedance 2.5 Showcase)删除 */
  ],
];
/** 页脚底条的法务链接 */
/* 2026-11-19 Monica:底条去掉 English、Trust & Safety、Content Policy */
export const LEGAL_LINKS: NavLink[] = [
  L("Privacy Policy", "/privacy-policy", "live"),
  L("Terms of Service", "/terms-of-service", "live"),
];
/* 「Explore more AI features」(2026-11-19 Monica:放回 Footer 上方，做成卡片，按类别分组)
   = Footer 分组列和底条之外的全部落地页(Footer 数据 + Header 里出现过的，一个不少)。 */
const EXPLORE_CATEGORY: Record<string, string> = {
  "Marketing Agent": "Ad tools",
  "Video Tools": "Video tools",
  "More Video Tools": "Video tools",
  "Image Tools": "Image tools",
  "More Image Tools": "Image tools",
  "Audio & Avatar": "Audio & avatar tools",
  "More Audio Tools": "Audio & avatar tools",
  "Design & Studios": "Design tools",
  "Design Tools": "Design tools",
  "Free Tools": "Free tools",
  "Video Models": "AI models",
  "Image Models": "AI models",
  "Audio Models": "AI models",
  "Model Guides": "Model guides & comparisons",
  "Compare Models": "Model guides & comparisons",
  "Ad Templates": "Ad templates",
  "Seasonal Templates": "Ad templates",
  Solutions: "Solutions",
  "By Platform": "Solutions",
  "By Industry": "Solutions",
  Alternatives: "Alternatives & best-of",
  "Best & How-to": "Alternatives & best-of",
  Questions: "Questions",
  Research: "Research",
  "MCP & Developers": "MCP & integrations",
  Integrations: "MCP & integrations",
};
/* Monica 2026-11-19 要求 Footer 里不出现的(API 还没上线;两个政策页先不放) */
/* 2026-11-19 Monica:研究报告(没有自己的美英投放数据)和 Shopify / Meta / TikTok 集成页(产品还不能对接)先不做，不出现在 Footer */
/* 2026-11-24 SEO / GEO 调研(Monica:「调整 footer」):下面这些页新站排不上或搜索意图不对，先不进 Footer。
   页面和路由都还在，只是 Footer 不再给内链;要恢复就从这个数组里删掉对应网址。
   - 自荐榜单：Google 疑似自 2026-01 起压低，AI Overviews 引用后 69% 不推荐发榜品牌 → 只留 UGC 榜单和模型榜单两个
   - 大牌替代页：评测站垄断
   - 节日 / Testimonial 模板：搜索意图是平面设计图(Adobe / Venngage / Template.net)
   - 四个问题页：高权重站或官方占位，离「做一条视频」也远 */
const FOOTER_DEFERRED = [
  "/best-ai-ad-generators", "/best-ai-video-generators", "/best-ai-avatar-video-generators", "/best-ai-voice-over-generators",
  "/best-ai-music-generators", "/best-ai-product-photography-tools", "/best-ai-lip-sync-tools",
  "/compare/creatify", "/compare/heygen", "/compare/synthesia", /* 2026-11-25 Higgsfield 替代页恢复进 Footer(2 家竞品都做了这个词) */
  ...TEMPLATE_SEASONAL.map((l) => l.href), "/testimonial-ad-templates",
  "/do-ugc-ads-work", "/tiktok-ai-video-generator", "/add-video-to-shopify-product-page", "/amazon-product-video-length",
];
const FOOTER_HIDDEN = [...FOOTER_DEFERRED, "/resources", "/api", "/trust", "/content-policy", "/press", "/app", "/research", "/integrations", ...RESEARCH.map((l) => l.href), ...INTEGRATIONS.map((l) => l.href)];
export function exploreGroups(): NavGroup[] {
  const used = new Set<string>([...FOOTER_COLUMNS.flat().flatMap((g) => g.links.map((l) => l.href)), ...LEGAL_LINKS.map((l) => l.href), "/", ...FOOTER_HIDDEN]);
  const groups = new Map<string, NavLink[]>();
  const add = (cat: string, l: NavLink) => {
    if (used.has(l.href) || !l.href.startsWith("/")) return;
    used.add(l.href);
    groups.set(cat, [...(groups.get(cat) ?? []), { ...l, desc: undefined }]);
  };
  for (const g of FOOTER) for (const l of g.links) add(EXPLORE_CATEGORY[g.title] ?? "Company & resources", l);
  /* Header 改成直接进工具后，Header 里出现过的落地页也必须在 Footer 能点到 */
  for (const l of allLinks()) add("More", l);
  return [...groups.entries()].map(([title, links]) => ({ title, links }));
}
export const exploreLinks = (): NavLink[] => exploreGroups().flatMap((g) => g.links);

/* ───────── Footer 站点地图(2026-11-24 Monica:「Explore more AI features 没必要单独，跟 footer 合并」;「header 给用户，footer 瞄准 SEO / GEO」)─────────
   Footer 是全站唯一的站点地图:FOOTER_COLUMNS 的核心链接 + 原来 Explore more 里的全部落地页，按 SEO 分类合成一份。
   链接文字全部用精准搜索词(label,不是顶栏的动词说法),全部真实 <a href> 指向落地页。 */
const SITEMAP_MERGE: Record<string, string> = {
  /* Explore 的分组并进 Footer 已有的同主题分组 */
  "Design tools": "Studios",
  "Company & resources": "Resources",
  More: "Platform",
};
const SITEMAP_ORDER = [
  "Create", "Video tools", "Image tools", "Audio & avatar tools",
  "Video Models", "Image Models", "Audio Models",
  "Agent", "Studios", "Free tools", "Ad templates", "Solutions",
  "Alternatives & best-of", "Model guides & comparisons", "Questions",
  "Platform", "Resources", "Company", "Community",
];
/* ───────── Footer 精简版(2026-11-25 Monica:「footer 页面是不是太多了」→ 审核后定：精简到约 100 个)─────────
   审核结论:282 个链接每页都带，内链权重被平均摊薄(46 个模型指南和 /ai-ad-generator 拿到的一样多);竞品最多 171(Jupitrr)。
   做法：页面一个不删，Footer 只留每组搜索热度最高的 + 聚合页;其余长尾页靠聚合页(/models、/templates)和相关页面正文里的链接带。
   挑选依据:VERB_HEAT / MODEL_HEAT(搜索建议热度)+ 每个系列留当前主力型号。要加减链接直接改下面的网址清单。
   顺手修掉的：/seedance 和 /models/seedance 重复、MCP Skill 页和同名工具页撞词、All ad templates 排错组。 */
const FOOTER_CURATED: [string, string[]][] = [
  /* 2026-11-25 Monica:「footer 根据竞品，把他们放的我们都要放(如果我们有落地页),然后也要根据搜索量去排，两个维度」
     入选：OpenArt / Imagine.art / TopView 三家 Footer 里出现、我们也有落地页的全部放 + 美国搜索量 A 档 + 最新主力型号;
     2026-11-25 再补：真实月搜 ≥ 3,000 但之前没进 Footer 的 16 个落地页(Nano Banana、AI Logo Generator、AI Headshot Generator 等)。
     每组内按美国月搜索量从高到低排(Google Ads 实际搜索量，DataForSEO 2026-11-25;docs/research/keywords/2026-11-25-dataforseo-volumes-us.json)。其余页面靠 /models、聚合页、正文内链和 sitemap.xml 收录。 */
  /* 2026-11-27 Monica 在 Footer 截图上勾了 Agent & Studios 里 6 个视频类页面，箭头挪进 Video Tools(插在 AI Short Drama Generator 后面) */
  ["Video Tools", ["/ai-video-generator", "/image-to-video", "/video-face-swap", "/ai-music-video-generator", "/text-to-video", "/ai-anime-generator", "/upscale-video", "/ai-animation-generator", "/ai-short-drama",
    "/ai-influencer-generator", "/chatgpt-video-generator", "/url-to-video", "/ai-ad-generator", "/ai-ugc-video-generator", "/ai-product-video-generator",
    "/remove-object-from-video" /* 2026-11-26 美国月搜 ~1,100 */, "/motion-control"]],
  ["Image Tools", ["/remove-background", "/ai-image-generator", "/ai-image-editor", "/ai-face-swap", "/ai-art-generator", "/ai-logo-generator", "/upscale-image", "/image-to-image", "/ai-headshot-generator", "/remove-object", "/image-to-3d", "/ai-image-extender", "/ai-hairstyle-changer" /* 2026-11-26 美国月搜 ~3,800 */, "/ai-poster-generator", "/ai-cartoon-generator", "/virtual-try-on", "/consistent-character", "/ai-product-photography", "/ai-inpainting"]],
  ["Audio & Avatar", ["/text-to-speech", "/ai-music-generator", "/ai-voice-generator", "/ai-song-generator", "/ai-voice-over", "/ai-voice-clone", "/ai-podcast-generator", "/ai-lip-sync", "/talking-avatar"]],
  ["Agent & Studios", ["/canvas", "/marketing-agent"]],
  /* 2026-11-27 Monica「把我们所有有落地页的模型都放在 footer 里，按照 artificialanalysis 排序」+ 截图标 Seedance 2.5 / Seedance 2.0 / MiniMax H3 为 1/2/3:
     = 第一批清单(landing-pages.html)里全部模型落地页;前三固定，其余按 Artificial Analysis 2026-11-27 榜单 Elo 排
     (视频：文生视频榜;图片：文生图榜;音频：TTS 榜)。不在榜上的(Wan 3.0 Prime;音乐 / 音效 / 声音克隆 / Seed Audio,AA 没有可用的音乐榜)排在最后，按美国月搜索量排 */
  ["Video Models", ["/models/seedance", "/seedance-2-0", "/minimax-h3",
    /* 2026-11-27 Monica 标注:HeyGen Video 拿掉;Wan 3.0 Prime 挪到 Wan 3.0 后面 */
    "/wan-3-0" /* T2V #1 */, "/wan-3-0-prime" /* 不在榜，跟着 Wan 3.0 */, "/flux-3-max-video" /* #8 */, "/minimax-h3-max" /* #10 */, "/kling-4-0" /* #11 */, "/flux-3-video" /* #12 */,
    "/gemini-omni-flash" /* #16(1.1) */, "/grok-imagine-video-1-5" /* #20 */, "/kling-3-0" /* #27 */]],
  ["Image Models", ["/gpt-image-2-6-sunburst" /* T2I #1 */, "/gpt-image-2-5-sunburst" /* #2 */, "/gpt-image-2-6-flare" /* #3 */, "/gpt-image-2-5-flare" /* #5 */, "/gpt-image-2" /* #6 */,
    "/nano-banana-2-1" /* #8 */, "/grok-imagine-2-0" /* #9 */, "/nano-banana-2" /* #13 */, "/seedream-5-5" /* #14 */, "/muse-image" /* #15 */, "/nano-banana-pro" /* #18 */,
    "/mai-image-2-5" /* #19 */ /* 2026-11-27 Monica 标注拿掉 FLUX 3 Image、Qwen Image 3.0、Seedream 4.5、Nano Banana */]],
  ["Audio Models", ["/gemini-3-8-flash-tts" /* TTS #7 */, "/elevenlabs-eleven-v3" /* #23 */, "/minimax-speech-2-8-hd" /* #29 */, "/minimax-speech-2-6-hd" /* #41 */,
    "/mureka-v9-5", "/lyria-3-5", "/elevenlabs-music-v2-5", "/minimax-music-3", "/seed-audio-1-0" /* 不在榜，按搜索量;2026-11-27 Monica 标注拿掉 ElevenLabs Sound Effects v3、Voice Replication 2.0、HeyGen Voice */]],
  /* 2026-11-27 Monica「footer 里在第二批的可以去掉了」:Solutions 一栏(行业 / 平台方案页)全部属于 v1.14 第二批，先不进 Footer;
     第二批上线时恢复：["Solutions", ["/ai-video-for-ecommerce", "/real-estate-video-ads", "/restaurant-ads", "/fashion-ads", "/skincare-ads", "/tiktok-shop-videos", "/beverage-ads", "/ai-marketing-videos", "/amazon-product-videos", "/home-decor-ads"]] */
];
const FOOTER_CURATED_TAIL: NavGroup[] = [
  /* 2026-11-27 Monica「footer 里在第二批的可以去掉了」:第二批(v1.14)的 Best AI Video Generators、Higgsfield Alternatives、AI Video Answers、
     AI Video Model Benchmarks、Trust & Safety 先拿掉，第二批上线时加回(网址：/best-ai-video-generators、/compare/higgsfield、/answers、/ai-video-model-benchmarks、/trust) */
  { title: "Resources", links: [L("BuzzVideo MCP", "/mcp", "new"), L("Blog", "/blog", "live"), L("Prompt Library", "/usecase", "live"), L("AI Video Tool Comparisons", "/compare", "new") /* 2026-11-27 Monica:Resources 加 compare 汇总页 */, L("Help Center", "/help", "new"), L("What's New", "/whats-new", "new")] },
  { title: "Company", links: [L("About", "/about", "live"), L("Pricing", "/pricing", "live"), L("Enterprise", "/enterprise", "new"), L("Affiliate Program", "/affiliate", "live")] },
];
/* 2026-11-27 Monica:「3d studio:https://buzzvideo.ai/3d-studio」—— 3D Studio 线上已有，Footer 的 Agent & Studios 直接链线上 */
const FOOTER_EXTRA: Record<string, NavLink[]> = { "Agent & Studios": [L("3D Studio", "https://buzzvideo.ai/3d-studio", "live")] };
/* 2026-11-27 Monica:「v1.14 第二批落地页 footer 也做更新，也要出个原型」—— 第二批不是每页都进 Footer,只放汇总页(像 /compare):
   /answers(问答)、/tutorials(教程)、/solutions(方案 / 行业 / 平台 / 模板，待建)、/research(原创数据，待建)、/trust(信任与政策);
   榜单并进 /compare;两个从第一批移来的工具页直接进 Video Tools。
   「在 v1.13 基础上新增的都换个字体颜色，换成白色」→ 这些链接带 v114 标记，SiteFooter 用白字。原型里网址带 ?v=1.14 看第二批版 Footer */
export type FooterLink = NavLink & { v114?: boolean };
const NEW = (l: NavLink): FooterLink => ({ ...l, v114: true });
const V114_ADD: { group: string; after?: string; links: () => FooterLink[] }[] = [
  /* 2026-11-27 Monica 划掉：两个移来的工具页(AI Caption Generator、Long Video to Shorts,待建)不进 Footer */
  { group: "Resources", after: "/compare", links: () => [L("AI Video Solutions", "/solutions", "new"), L("AI Video Answers", "/answers", "new"), L("Tutorials", "/tutorials", "new"), L("AI Ad Research", "/research", "new")].map(NEW) },
  { group: "Company", links: () => [NEW(L("Trust & Safety", "/trust", "new"))] },
  /* 2026-11-27 Monica 划掉 All AI Models:「这个 header 有」—— 模型指南 / 定价 6 页的入口 /models 在顶栏，Footer 不重复 */
];
export type FooterGroup = { title: string; links: FooterLink[] };
export function footerSitemap(v114 = false): FooterGroup[] {
  /* 2026-11-25 免费工具组和 Help/FAQ/What's New/Enterprise 这期不做，尾部两组也按删除名单过滤 */
  const tail = FOOTER_CURATED_TAIL.map((g) => ({ ...g, links: g.links.filter((l) => !isRemoved(l.href)) }));
  const groups: FooterGroup[] = [...FOOTER_CURATED.map(([title, hrefs]) => ({ title, links: [...byHref(hrefs), ...(FOOTER_EXTRA[title] ?? [])] as FooterLink[] })), ...tail];
  if (!v114) return groups;
  return groups.map((g) => {
    const add = V114_ADD.filter((x) => x.group === g.title);
    if (!add.length) return g;
    let links = [...g.links];
    for (const x of add) {
      const at = x.after ? links.findIndex((l) => l.href === x.after) : -1;
      links = at < 0 ? [...links, ...x.links()] : [...links.slice(0, at + 1), ...x.links(), ...links.slice(at + 1)];
    }
    return { ...g, links };
  });
}
/** 精简前的全量站点地图(282 个链接);留着做待建清单 / 对照，Footer 不再用 */
export function fullSitemap(): NavGroup[] {
  const groups = new Map<string, NavLink[]>();
  const push = (title: string, links: NavLink[]) => groups.set(title, [...(groups.get(title) ?? []), ...links]);
  for (const g of FOOTER_COLUMNS.flat()) push(g.title, g.links);
  const typeTitle: Record<ModelType, string> = { video: "Video Models", image: "Image Models", audio: "Audio Models" };
  for (const g of exploreGroups()) {
    if (g.title === "AI models") {
      /* 模型按类型并进各自的模型组;其余(All models 之类)放 Video Models 末尾 */
      for (const l of g.links) {
        const m = MODELS.find((x) => x.name === l.label);
        push(m ? typeTitle[m.type] : "Video Models", [l]);
      }
    } else push(SITEMAP_MERGE[g.title] ?? g.title, g.links);
  }
  /* 「All …」这类总页链接排到所在组的最后 */
  const tailLast = (links: NavLink[]) => [...links.filter((l) => !/^All /.test(l.label)), ...links.filter((l) => /^All /.test(l.label))];
  const titles = [...SITEMAP_ORDER.filter((t) => groups.has(t)), ...[...groups.keys()].filter((t) => !SITEMAP_ORDER.includes(t))];
  return titles.map((title) => ({ title, links: tailLast(groups.get(title)!) }));
}

/* Footer 底部「Ask AI about BuzzVideo」:每个链接带预填提问,让 AI 去读 /llms.txt(Krea 的做法,GEO 零成本)。 */
const ASK_PROMPT =
  "Read https://buzzvideo.ai/llms.txt and tell me what BuzzVideo is, who it is for, and how it compares with other AI ad video tools.";
export const ASK_AI: { name: string; href: string; color: string }[] = [
  { name: "ChatGPT", href: `https://chatgpt.com/?q=${encodeURIComponent(ASK_PROMPT)}`, color: "#10a37f" },
  { name: "Claude", href: `https://claude.ai/new?q=${encodeURIComponent(ASK_PROMPT)}`, color: "#d97757" },
  { name: "Perplexity", href: `https://www.perplexity.ai/search?q=${encodeURIComponent(ASK_PROMPT)}`, color: "#20808d" },
  { name: "Gemini", href: `https://gemini.google.com/app?q=${encodeURIComponent(ASK_PROMPT)}`, color: "#4285f4" },
  { name: "Grok", href: `https://grok.com/?q=${encodeURIComponent(ASK_PROMPT)}`, color: "#1a1a2e" },
];

/* 社交账号:目前只核实了 Instagram(线上 footer 里就有),其余账号上线前补真实地址 */
export const SOCIAL: { name: string; href: string }[] = [{ name: "Instagram", href: "https://www.instagram.com/buzzvideo.global/" }];

/** 去重后的全部链接(统计 / 待建清单用) */
export function allLinks(): NavLink[] {
  const seen = new Map<string, NavLink>();
  for (const t of HEADER) {
    seen.set(t.href, { label: t.label, href: t.href, status: t.status });
    for (const l of t.tiles ?? []) seen.set(l.href, { label: l.label, href: l.href, status: l.status });
    for (const g of t.groups ?? []) for (const l of [...g.links, ...(g.footer ? [g.footer] : [])]) seen.set(l.href, l);
    if (t.promo) seen.set(t.promo.href, { label: t.promo.title, href: t.promo.href, status: t.promo.status });
  }
  for (const g of FOOTER) for (const l of g.links) seen.set(l.href, l);
  return [...seen.values()];
}

export const STATUS_LABEL: Record<LinkStatus, string> = { live: "线上已有", uat: "原型 / UAT 已有", new: "待建" };

/** 按网址查链接状态(落地页模板内部的链接用);查不到当待建 */
let STATUS_MAP: Map<string, LinkStatus> | null = null;
export function statusOf(href: string): LinkStatus {
  if (!STATUS_MAP) STATUS_MAP = new Map(allLinks().map((l) => [l.href, l.status]));
  if (href === "/") return "live";
  return STATUS_MAP.get(href) ?? "new";
}
