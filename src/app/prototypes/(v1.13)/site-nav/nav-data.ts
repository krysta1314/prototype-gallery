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

export type LinkStatus = "live" | "uat" | "new";

export type NavLink = {
  label: string;
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
  /** 一组链接排成两列(Audio 只有模型一组，占满整行) */
  cols?: 2;
};

/** 下拉顶部的图卡主入口:img = 真实成片 / 样图;art = 音频类用代码画的小界面(波形、声音克隆) */
export type NavTile = NavLink & {
  img?: string;
  art?: "voice" | "tts" | "clone" | "music" | "formats" | "site";
  /** 浮层打开时循环播放的成片(和封面是同一条) */
  video?: string;
  /** Studios 网格的筛选分类 */
  cat?: string;
};

/** 下拉底部一条推荐(当期主推的模型 / 活动) */
export type NavPromo = { title: string; desc: string; cta: string; href: string; status: LinkStatus; img?: string; icon?: "video" | "audio" | "chat" | "chart" | "team"; /** strip = 一行推荐条;banner = 带大图的横幅 */ kind?: "strip" | "banner" };

export type TopItem = {
  label: string;
  /** 顶级项本身也是一个可抓取链接(点标题进总页,悬停出大菜单) */
  href: string;
  status: LinkStatus;
  /** 面板标题(Agent / MCP / Studios / Resources 有;Image / Video / Audio 没有) */
  heading?: { text: string; icon: "agent" | "mcp" | "studio" | "community" };
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
  L("AI Video Editor", "/ai-video-editor", "new"),
  L("Faceless Video Generator", "/faceless-video-generator", "new"),
  L("AI Video Upscaler", "/upscale-video", "uat"),
  L("AI Motion Control", "/motion-control", "uat"),
  L("Video Character Swap", "/video-character-swap", "uat"),
  L("3D to Video", "/3d-to-video", "uat", undefined, "New"),
];
const IMAGE_TOOLS = [
  L("AI Image Generator", "/ai-image-generator", "new"),
  L("AI Image Editor", "/ai-image-editor", "new"),
  L("Remove Background", "/remove-background", "new"),
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
  L("AI Caption Generator", "/ai-caption-generator", "new"),
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
  L("Long Video to Shorts", "/long-video-to-shorts", "new"),
  L("Video Resizer", "/video-resizer", "new"),
  L("AI Dubbing", "/ai-dubbing", "new", undefined, "Soon"),
  L("AI Video Translator", "/ai-video-translator", "new", undefined, "Soon"),
  L("AI Music Video Generator", "/ai-music-video-generator", "new", undefined, "Soon"),
];
const AUDIO_MORE = [
  L("AI Song Generator", "/ai-song-generator", "new"),
  L("AI Jingle Generator", "/ai-jingle-generator", "new"),
  L("AI Sound Effects Generator", "/ai-sound-effects-generator", "new"),
  L("AI Lyrics Generator", "/ai-lyrics-generator", "new"),
  L("AI Voice Changer", "/ai-voice-changer", "new", undefined, "Soon"),
  L("AI Voice Enhancer", "/ai-voice-enhancer", "new", undefined, "Soon"),
  L("AI Podcast Generator", "/ai-podcast-generator", "new", undefined, "Soon"),
];
const DESIGN_MORE = [
  L("AI Graphic Design", "/ai-graphic-design", "uat"),
  L("AI Social Media Post Generator", "/ai-social-media-post-generator", "uat"),
  L("AI Instagram Post Generator", "/ai-instagram-post-generator", "uat"),
  L("AI Carousel Maker", "/ai-carousel-maker", "uat"),
  L("AI Poster Generator", "/ai-poster-generator", "uat"),
  L("AI Flyer Maker", "/ai-flyer-maker", "uat"),
  L("AI Logo Generator", "/ai-logo-generator", "new", undefined, "Soon"),
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
const VIDEO_MODELS = modelLinks("video");
const IMAGE_MODELS = modelLinks("image");
const AUDIO_MODELS = modelLinks("audio");
/* 按模态的模型总页(VEED / invideo 的做法):/models/video、/models/image、/models/audio */
const ALL_VIDEO = L("All video models", "/ai-video-models", "new");
const ALL_IMAGE = L("All image models", "/ai-image-models", "new");
const ALL_AUDIO = L("All audio models", "/ai-audio-models", "new");
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
];

const TEMPLATE_BY_TYPE = [
  L("UGC Ad Templates", "/ugc-ad-templates", "new"),
  L("Product Video Templates", "/product-video-templates", "new"),
  L("Unboxing Video Template", "/unboxing-video-templates", "new"),
  L("Before and After Video Template", "/before-and-after-templates", "new"),
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
];

/* 竞品页:沿用 UAT 已上线的 /compare/topview 格式 —— 一个竞品一页,标题「<竞品> Alternatives」,
   页内 = 选择标准 + 6 个替代品横评 + BuzzVideo 案例 + FAQ + 来源与核对日期。
   不再另开 /alternatives/ 和 /compare/<竞品>-vs-buzzvideo,免得同一个词两页互抢(关键词蚕食)。 */
const COMPARE = [
  L("TopView AI Alternatives", "/buzzvideo-vs-topview", "uat"),
  L("Creatify Alternatives", "/buzzvideo-vs-creatify", "new"),
  L("Arcads Alternatives", "/buzzvideo-vs-arcads", "new"),
  L("HeyGen Alternatives", "/buzzvideo-vs-heygen", "new"),
  L("Pippit Alternatives", "/buzzvideo-vs-pippit", "new"),
  L("Higgsfield Alternatives", "/buzzvideo-vs-higgsfield", "new"),
  L("Synthesia Alternatives", "/buzzvideo-vs-synthesia", "new"),
  L("MakeUGC Alternatives", "/buzzvideo-vs-makeugc", "new"),
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
const byHeat = (links: NavLink[]) =>
  links
    .map((l, i) => ({ l, i, h: HEAT[l.href] ?? [99, 9], soon: l.badge === "Soon" ? 1 : 0 }))
    .sort((a, b) => a.soon - b.soon || a.h[0] - b.h[0] || a.h[1] - b.h[1] || a.i - b.i)
    .map((x) => x.l);
const ALL_TOOLS = L("All AI tools", "/tools", "new");

export const HEADER: TopItem[] = [
  /* Monica 2026-11-23:最前面加 Home(普通链接，无下拉) */
  { label: "Home", href: "/", status: "live" },
  {
    label: "Image",
    href: "/ai-image-generator",
    status: "new",
    tiles: [
      T("AI Image Generator", "/ai-image-generator", "new", `${SM}/nano-banana-2-1/giant.jpg`),
      T("AI Image Editor", "/ai-image-editor", "new", `${SM}/grok-imagine-2-0/banner.jpg`),
      T("AI Product Photography", "/ai-product-photography", "new", `${SM}/gpt-image-2-5-sunburst/sunburst_flatlay.jpg`),
      T("AI Virtual Try-On", "/virtual-try-on", "uat", `${V}/skill-try-on-ugc.jpg`),
    ],
    groups: [
      {
        title: "Features",
        href: "/tools",
        links: byHeat([...without(IMAGE_TOOLS, ["/ai-image-generator", "/ai-image-editor", "/ai-product-photography", "/virtual-try-on"]), ...IMAGE_MORE]),
        more: 5,
        footer: ALL_TOOLS,
      },
      { title: "Models", href: "/ai-image-models", links: modelLinks("image", true, false), more: 5, footer: ALL_IMAGE },
    ],
    cards: [
      { title: "Nano Banana 2.1", desc: "Fast all-rounder with sharp text and consistent characters", cta: "Try now", href: "/nano-banana-2-1", status: "new", img: `${SM}/nano-banana-2-1/portrait.jpg` },
      { title: "GPT Image 2.5 Sunburst", desc: "Fine print, labels and detailed portraits", cta: "Try now", href: "/gpt-image-2-5-sunburst", status: "new", img: `${SM}/gpt-image-2-5-sunburst/sunburst_candid.jpg` },
    ],
  },
  {
    label: "Video",
    href: "/ai-video-generator",
    status: "new",
    tiles: [
      T("AI Video Generator", "/ai-video-generator", "new", `${V}/skill-video-understand.jpg`),
      T("Image to Video", "/image-to-video", "new", `${SM}/wan-3-0/wan30_candle_30s_take_poster.jpg`),
      T("AI Video Editor", "/ai-video-editor", "new", `${V}/skill-video-editor.jpg`),
      T("AI Avatar Video Generator", "/talking-avatar", "uat", `${AT}/ai-talking-avatar-og.jpg`),
    ],
    groups: [
      {
        title: "Features",
        href: "/tools",
        links: byHeat([
          ...without(VIDEO_TOOLS, ["/ai-video-generator", "/image-to-video", "/ai-video-editor"]),
          L("AI Lip Sync", "/ai-lip-sync", "uat"),
          L("AI Spokesperson Video", "/ai-spokesperson", "new"),
          ...VIDEO_MORE,
        ]),
        more: 5,
        footer: ALL_TOOLS,
      },
      { title: "Models", href: "/ai-video-models", links: modelLinks("video", true, false), more: 5, footer: ALL_VIDEO },
    ],
    promo: { title: "Kling 4.0", desc: "Continuous videos up to 30 seconds with sound, from text, images or video", cta: "Try now", href: "/kling-4-0", status: "uat", img: `${V}/blog-kling-4-0-for-ads.jpg`, kind: "banner" },
  },
  {
    label: "Audio",
    href: "/ai-voice-over",
    status: "new",
    tiles: [
      T("AI Voice Over", "/ai-voice-over", "new", "/prototypes/mcp-skill-showcase/avatar-viral-remix.jpg", "voice"),
      T("Text to Speech", "/text-to-speech", "new", undefined, "tts"),
      T("AI Voice Clone", "/ai-voice-clone", "new", undefined, "clone"),
      T("AI Music Generator", "/ai-music-generator", "new", undefined, "music"),
    ],
    groups: [
      { title: "Features", links: byHeat(AUDIO_MORE), more: 5, footer: ALL_TOOLS },
      { title: "Models", href: "/ai-audio-models", links: modelLinks("audio", false, false), more: 5, footer: ALL_AUDIO },
    ],
    promo: { title: "Seed Audio 1.0", desc: "Voiceover, music and sound effects in one track", cta: "Try now", href: "/seed-audio-1-0", status: "new", icon: "audio" },
  },
  {
    label: "MCP",
    href: "/mcp",
    status: "live",
    heading: { text: "Create inside your AI chat", icon: "mcp" },
    tiles: [
      T("BuzzVideo MCP", "/mcp", "live", `${V}/skill-product-promo-video.jpg`),
      T("Claude Video Generator", "/claude-video-generator", "new", `${V}/tutorial-claude.jpg`),
      T("ChatGPT Video Generator", "/chatgpt-video-generator", "new", `${V}/tutorial-chatgpt.jpg`),
      T("MCP Skills", "/mcp-skills", "uat", `${V}/skill-ad-localizer.jpg`),
    ],
    groups: [
      {
        title: "Popular skills",
        href: "/mcp-skills",
        links: [
          L("Link to Video Ad", "/link-to-ad-mcp-skill", "uat"),
          L("UGC Product Review", "/ugc-product-review-mcp-skill", "uat"),
          L("Hook Variations", "/ad-hook-variants-mcp-skill", "uat"),
          L("Ad Localizer", "/ad-localizer-mcp-skill", "uat"),
          L("Long to Shorts", "/long-to-shorts-mcp-skill", "uat"),
        ],
      },
      { title: "Developers", links: [L("API", "/api", "new"), L("llms.txt", "/llms.txt", "new")] },
    ],
    promo: { title: "MCP Skills", desc: "Ready-made ad workflows you run from your AI chat", cta: "Browse", href: "/mcp-skills", status: "uat", icon: "chat" },
  },
  {
    label: "Agent",
    href: "/marketing-agent",
    status: "new",
    heading: { text: "Make ads with AI agents", icon: "agent" },
    tiles: [
      T("AI Marketing Agent", "/marketing-agent", "new", `${V}/skill-ad-hook-variants.jpg`),
      T("URL to Video", "/url-to-video", "new", `${V}/skill-link-to-ad.jpg`),
      T("AI UGC Video Generator", "/ai-ugc-video-generator", "new", `${V}/skill-ugc-product-review.jpg`),
      T("AI Product Video Generator", "/ai-product-video-generator", "new", `${V}/skill-unboxing-ugc.jpg`),
    ],
    groups: [
      { title: "Make ads", links: [L("AI Ad Generator", "/ai-ad-generator", "new"), L("Hybrid Reel", "/hybrid-reel", "uat"), L("Canvas", "/canvas", "live")], footer: ALL_TOOLS },
      { title: "Free tools", links: FREE_TOOLS, more: 5, footer: L("All free tools", "/free-tools", "new") },
    ],
    promo: { title: "AI Marketing Agent", desc: "Brief in, campaign-ready ads out for every placement", cta: "Try now", href: "/marketing-agent", status: "new", img: `${V}/skill-ad-hook-variants.jpg` },
  },
  {
    label: "Studios",
    href: "/design-studio",
    status: "uat",
    heading: { text: "BuzzVideo Studios", icon: "studio" },
    tabs: ["All", "Design", "Video"],
    tiles: [
      { ...T("Design Studio", "/design-studio", "uat", undefined, "formats"), cat: "Design" },
      { ...T("3D Studio", "/3d-studio", "uat", `${NAV}/3d-studio.jpg`), cat: "Video" },
      { ...T("Canvas", "/canvas", "live", `${NAV}/canvas.jpg`), cat: "Video" },
      { ...T("Hybrid Reel", "/hybrid-reel", "uat", `${NAV}/hybrid-reel.jpg`), cat: "Video" },
      { ...T("AI Banner Generator", "/ad-creative-maker", "uat", `${SM}/nano-banana-pro/pro_static.jpg`), cat: "Design" },
      { ...T("Brand Kit", "/brand-kit", "uat", `${NAV}/brand-kit.jpg`), cat: "Design" },
      { ...T("AI Presentation Maker", "/ai-presentation-maker", "uat", `${NAV}/design-studio.jpg`), cat: "Design" },
      { ...T("AI Website Builder", "/ai-website-builder", "uat", `${SM}/nano-banana-2-1/giant.jpg`, "site"), cat: "Design" },
    ],
    groups: [{ title: "More design tools", links: DESIGN_MORE, cols: 2 }],
    promo: { title: "Design Studio", desc: "Banners, decks and sites from one brief, on brand", cta: "Open", href: "/design-studio", status: "uat", img: `${NAV}/design-studio.jpg` },
  },
  {
    label: "Resources",
    href: "/resources",
    status: "new",
    heading: { text: "Learn and get inspired", icon: "community" },
    tiles: [
      T("Community Gallery", "/community-gallery", "live", `${V}/blog-meta-andromeda-creative-diversity.jpg`),
      T("Prompt Library", "/usecase", "live", `${SM}/seedream-5-0-pro/pro_creator.jpg`),
      T("Blog", "/blog", "live", `${V}/blog-minimax-h3-for-ads.jpg`),
      T("BuzzVideo Academy", "/learn", "new", `${V}/demo-30s.jpg`),
    ],
    groups: [
      {
        title: "Help",
        links: [
          L("Help Center", "/help", "new"),
          L("What's New", "/changelog", "new"),
          L("Seedance 2.5 Showcase", "/seedance-2-5-showcase", "live"),
          L("BuzzVideo App", "/app", "new", undefined, "Soon"),
        ],
      },
    ],
    promo: { title: "How to Make a UGC Product Review Video with AI", desc: "Step-by-step guide on the BuzzVideo blog", cta: "Read", href: "/blog/ugc-product-review-video-ai", status: "live", img: `${V}/skill-ugc-product-review.jpg` },
  },
  /* Monica 2026-11-23:照 Higgsfield 加 Enterprise,放 Resources 和 Pricing 之间(普通链接，无下拉) */
  { label: "Enterprise", href: "/enterprise", status: "new" },
  { label: "Pricing", href: "/pricing", status: "live" },
];

/* 图卡悬停预览：只挂封面和成片对得上的(本地压缩副本，preload=none,悬停才下载) */
const TILE_VIDEO: Record<string, string> = {
  "/url-to-video": "/prototypes/site/tools/link-to-ad.mp4",
  "/ai-ugc-video-generator": "/prototypes/site/tools/ugc-product-review.mp4",
  "/ai-product-video-generator": "/prototypes/site/tools/unboxing-ugc.mp4",
  "/image-to-video": "/prototypes/site/models/wan-3-0/wan30_candle_30s_take.mp4",
  "/talking-avatar": "/prototypes/ai-tools/talking-avatar-demo.mp4",
  "/ugc-ad-templates": "/prototypes/site/tools/ugc-product-review.mp4",
  "/product-video-templates": "/prototypes/site/tools/product-ad.mp4",
};
for (const t of HEADER) for (const tile of t.tiles ?? []) if (TILE_VIDEO[tile.href]) tile.video = TILE_VIDEO[tile.href];

/** 悬停详情卡里的一句话(工具 / 功能;只写产品真做得到的) */
export const FLYOUT_DESC: Record<string, string> = {
  "/text-to-video": "Type a prompt and get a video clip, with sound on most models.",
  "/faceless-video-generator": "Explainer and story videos with voiceover and captions, no one on camera.",
  "/upscale-video": "Sharpen a video to a higher resolution.",
  "/motion-control": "Copy the movement from one video onto a character in your image.",
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
  "/ai-dubbing": "The same video in another language, with matching lips. Coming soon.",
  "/ai-video-translator": "Translate the speech and captions of a video. Coming soon.",
  "/ai-music-video-generator": "A music video cut to your song. Coming soon.",
  "/ai-song-generator": "Full songs with vocals and lyrics from a prompt.",
  "/ai-jingle-generator": "Short brand jingles and sonic logos.",
  "/ai-lyrics-generator": "Song lyrics from a theme or product. Free, no sign-up.",
  "/ai-voice-changer": "Change a recorded voice into another voice. Coming soon.",
  "/ai-voice-enhancer": "Remove noise and echo from recorded speech. Coming soon.",
  "/ai-podcast-generator": "A two-voice podcast from an article or notes. Coming soon.",
  "/ai-graphic-design": "Ads, posts and banners in Design Studio, on brand.",
  "/ai-social-media-post-generator": "Posts for every network, sized and on brand.",
  "/ai-instagram-post-generator": "Instagram posts and stories from a brief.",
  "/ai-carousel-maker": "Multi-slide carousels for Instagram and LinkedIn.",
  "/ai-poster-generator": "Event and product posters with real text.",
  "/ai-flyer-maker": "Print-ready flyers from a brief.",
  "/ai-logo-generator": "Logo ideas from your brand name. Coming soon.",
};

/** /tools 总页的分组(和改版前 AI Tools 菜单一致;顶栏按媒介拆开后，总页仍按工具类型列全) */
export const TOOLS_HUB_GROUPS: NavGroup[] = [
  { title: "Ads", links: AGENT_LINKS.filter((l) => l.href.startsWith("/")) },
  { title: "Video", href: "/ai-video-generator", links: VIDEO_TOOLS },
  { title: "Image", href: "/ai-image-generator", links: IMAGE_TOOLS },
  { title: "Audio & Avatar", href: "/ai-voice-over", links: AUDIO_AVATAR_TOOLS },
  { title: "Design & Studios", href: "/design-studio", links: DESIGN_TOOLS },
  { title: "Free tools", href: "/free-tools", links: FREE_TOOLS },
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
  { title: "Free Tools", links: [...FREE_TOOLS, L("All free tools", "/free-tools", "new")] },
  { title: "Video Models", links: [...VIDEO_MODELS, ALL_VIDEO, L("All AI models", "/models", "live")] },
  { title: "Image Models", links: [...IMAGE_MODELS, ALL_IMAGE] },
  { title: "Audio Models", links: [...AUDIO_MODELS, ALL_AUDIO] },
  { title: "Model Guides", links: MODEL_GUIDES },
  { title: "Compare Models", links: MODEL_COMPARE },
  { title: "Ad Templates", links: [...TEMPLATE_BY_TYPE, ...TEMPLATE_BY_PLATFORM.slice(0, 2), L("All ad templates", "/templates", "new")] },
  { title: "Seasonal Templates", links: [...TEMPLATE_SEASONAL, ...TEMPLATE_BY_PLATFORM.slice(2)] },
  { title: "Solutions", links: [...BY_TEAM, ...BY_AD_TYPE] },
  { title: "By Platform", links: BY_PLATFORM },
  { title: "By Industry", links: BY_INDUSTRY },
  { title: "Alternatives", links: COMPARE },
  { title: "Best & How-to", links: BEST_AND_LEARN },
  { title: "Questions", links: [...QUESTIONS, L("All guides", "/learn", "new")] },
  { title: "MCP & Developers", links: [...MCP_LINKS, L("llms.txt", "/llms.txt", "new")] },
  {
    title: "Resources",
    links: [
      L("Blog", "/blog", "live"),
      L("BuzzVideo Academy", "/learn", "new"),
      L("Prompt Library", "/usecase", "live"),
      L("Community Gallery", "/community-gallery", "live"),
      L("Help Center", "/help", "new"),
      L("FAQ", "/faq", "new"),
      L("AI Video Glossary", "/glossary", "new"),
      L("What's New", "/changelog", "new"),
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
      L("Contact", "/contact", "live"),
      L("Contact Sales", "/contact", "live"),
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
        "/ai-video-generator", "/image-to-video", "/text-to-video", "/ai-video-editor", "/upscale-video", "/faceless-video-generator",
        "/talking-avatar", "/ai-lip-sync", "/ai-image-generator", "/ai-image-editor", "/ai-inpainting", "/upscale-image",
        "/remove-background", "/ai-product-photography", "/virtual-try-on", "/ai-voice-over", "/text-to-speech", "/ai-music-generator",
        "/ai-sound-effects-generator",
      ]),
    },
  ],
  [
    { title: "Video Models", links: [...modelLinks("video", false, false).slice(0, 10), ALL_VIDEO] },
    { title: "Image Models", links: [...modelLinks("image", false, false).slice(0, 7), ALL_IMAGE] },
  ],
  [
    { title: "Audio Models", links: [...modelLinks("audio", true, false), ALL_AUDIO] },
    { title: "Studios", links: byHref(["/design-studio", "/3d-studio", "/canvas", "/hybrid-reel", "/templates"]) },
  ],
  [
    { title: "Agent", links: byHref(["/marketing-agent", "/ai-ad-generator", "/url-to-video", "/ai-ugc-video-generator", "/ai-product-video-generator", "/ai-video-for-ecommerce", "/ai-video-for-agencies", "/free-tools"]) },
    { title: "Platform", links: [...MCP_LINKS.map((l) => ({ ...l, desc: undefined })), L("llms.txt", "/llms.txt", "new")] },
  ],
  [
    { title: "Resources", links: [L("Blog", "/blog", "live"), L("BuzzVideo Academy", "/learn", "new"), L("Prompt Library", "/usecase", "live"), L("Help Center", "/help", "new"), L("FAQ", "/faq", "new"), L("What's New", "/changelog", "new")] },
    { title: "Company", links: [L("About", "/about", "live"), L("Pricing", "/pricing", "live"), L("Enterprise", "/enterprise", "new"), L("Affiliate Program", "/affiliate", "live"), L("Contact", "/contact", "live")] },
    { title: "Community", links: [L("Community Gallery", "/community-gallery", "live"), L("Seedance 2.5 Showcase", "/seedance-2-5-showcase", "live")] },
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
const FOOTER_HIDDEN = ["/resources", "/api", "/trust", "/content-policy", "/press", "/app", "/research", "/integrations", ...RESEARCH.map((l) => l.href), ...INTEGRATIONS.map((l) => l.href)];
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
