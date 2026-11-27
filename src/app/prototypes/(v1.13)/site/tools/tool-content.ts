// 工具落地页内容(2026-11-19,第 2 批):导航里 19 个「生成 / Agent 入口」类工具的营销落地页 /tools/<keyword>。
// 产品现状(v1.12 ai-tools 原型 sidebarMenus.ts 的 AGENT_JUMPS):这些工具在 app 里不是独立工具页，而是「带好提示词跳进
// Marketing Agent / Image Gen / Video Gen / Audio Gen」的入口。所以落地页 = 讲清能做什么 + 用哪些模型 + 多少积分 + 首屏可改的提示词,点按钮带着提示词进 app。
// 已有独立工具页的 16 个(Upscale、Lip Sync、Talking Avatar…)在 v1.12 ai-tools 里，有自己的 SEO 内容，不在这里重做。
//
// 规则:
// - 首屏提示词：产品里有预填模板的用原句(sidebarMenus.ts AGENT_JUMPS);没有的(AI Ad Generator、Faceless、Product Video)照同样格式写。
// - 画面只用 BuzzVideo 真实生成过的成片(MCP Skill 示例片、模型页样片、视频库),每条写明出处;没有就不放图，首屏用提示词框撑。
// - FAQ 的问题取自 Google 真实搜索(docs/research/keywords/2026-11-18-market.json),答案只写核实过的事实。
// - 积分价格从模型页数据(线上定价接口)算，不手写。

import { modelPageData } from "../models/model-content";
import { MODELS } from "../../site-nav/models-catalog";
import { VIDEO_MORE_TOOLS } from "./content/video";
import { IMAGE_MORE_TOOLS } from "./content/image";
import { AUDIO_MORE_TOOLS } from "./content/audio";
import { MORE_TOOLS } from "./content/more";
import { SEO_NOV25_TOOLS } from "./content/seo-2026-11-25";
import { SEO_NOV26_TOOLS } from "./content/seo-2026-11-26";
import { MERGED, REMOVED } from "../redirects";
import { pageMedia } from "../page-media";
import { AGENT_TOOLS } from "./content/agent";

export type ToolGroup = "Ads" | "Video" | "Image" | "Audio" | "Avatar";
/** 进 app 后落在哪:marketing = Marketing Agent;其余 = 对应生成页 */
export type ToolMode = "marketing" | "video" | "image" | "audio" | "music" | "sfx";

export type ToolMedia = {
  kind: "video" | "image";
  src: string;
  poster?: string;
  /** 宽:高 */
  aspect: string;
  alt: string;
  /** 图下一句说明(写清是怎么做出来的) */
  caption: string;
  /** 出处，给内部核对，不上页面 */
  source: string;
};

export type ToolEntry = {
  slug: string;
  /** 导航和面包屑里的名字(= 搜索词) */
  name: string;
  group: ToolGroup;
  /** H1 拆两行：上行是搜索词，下行一句好处 */
  h1: string;
  h1Tail: string;
  /** 首屏一句话(答案优先，能被 AI 单独摘走) */
  lead: string;
  mode: ToolMode;
  /** 产品里的预填提示词 */
  prompt: string;
  /** 驱动这个工具的模型(模型页 slug);第一个是默认 */
  models: string[];
  /** 下个版本才上的模型(v1.13),单独标出 */
  nextModels?: string[];
  media?: ToolMedia;
  /** 「什么是 X」一段 */
  definition: { q: string; a: string };
  steps: { title: string; body: string }[];
  /** 用途：一句标题 + 一句说明 */
  uses: { title: string; body: string }[];
  faq: { q: string; a: string }[];
  related: string[];
  metaTitle: string;
  metaDescription: string;
  /** 产品里还没有(导航标 Soon):首屏按钮改成「Get notified」,文案写清是即将上线 */
  soon?: boolean;
  /** 2026-11-26:同一页里第二种用法的完整一块(如 ai-face-swap 的照片换脸)—— 自己的步骤 + 适合场景 + FAQ,
   *  渲染在主「Best uses」之后;FAQ 并进页面 FAQPage 结构化数据。没有就不渲染。 */
  extra?: ToolExtra;
};
export type ToolExtra = {
  /** 锚点 id 前缀 */
  id: string;
  /** 步骤段标题，如 "How to face swap a photo" */
  title: string;
  /** 用途段标题和一句说明 */
  usesTitle: string;
  usesSub?: string;
  /** 步骤图里用的模型(模型页 slug)和提示词 */
  model: string;
  prompt: string;
  steps: { title: string; body: string }[];
  uses: { title: string; body: string }[];
  faqTitle: string;
  faq: { q: string; a: string }[];
};

/* 2026-11-19:视频库的 Vercel Blob 被封(403 "Your store is blocked"),样片改用本地压缩副本(原片在 ~/Desktop/BuzzVideo博客工程/skill-blogs/_videos/out/) */
const LOCAL = "/prototypes/site/tools";
const POSTER = "/video-library/posters";
const SHOW = "/prototypes/mcp-skill-showcase";

/** 免费积分能用的模型(和模型页 model-content.ts 的 FREE_OK 一致) */
export const FREE_MODELS = new Set(["seedream-4-5", "seedream-5-0-lite", "seed-audio-1-0"]);
/** 注册送的积分(2026-11-10 Monica 确认) */
import { SIGNUP_CREDITS } from "./credits";
export { SIGNUP_CREDITS };

const BASE_TOOLS: ToolEntry[] = [
  /* ───────── Ads ───────── */
  {
    slug: "ai-ad-generator",
    name: "AI Ad Generator",
    group: "Ads",
    h1: "AI Ad Generator",
    h1Tail: "a full ad set from one brief",
    lead: "BuzzVideo's AI Ad Generator turns a product photo, product page link or one-line brief into finished video and image ads with script, visuals and voiceover. Get UGC hooks, product close-ups and before-and-after ads in 9:16, 1:1 and 16:9 for TikTok, Reels and Meta, made with Seedance 2.5, Kling 4.0, Nano Banana 2.1 and GPT Image 2.5 Sunburst.",
    mode: "marketing",
    prompt: "Make [3] ad variations for [my product]: a UGC hook, a product close-up and a before-and-after, in 9:16 and 1:1.",
    models: ["seedance-2-5", "kling-4-0", "nano-banana-2-1", "gpt-image-2-5-sunburst", "seed-audio-1-0"],
    media: {
      kind: "video",
      src: `${LOCAL}/product-ad.mp4`,
      poster: `${POSTER}/skill-product-ad.jpg`,
      aspect: "9:16",
      alt: "A vertical product ad for a vitamin C serum bottle on a sunlit bathroom shelf",
      caption: "A 10-second product ad made by the Marketing Agent from one product photo.",
      source: "MCP Skill 示例 product-ad(视频库 skill-product-ad)",
    },
    definition: {
      q: "What is an AI ad generator?",
      a: "An AI ad generator, also called an AI ad maker or ad creative generator, writes the script, makes the visuals and edits them into finished ads from a short brief. On BuzzVideo the Marketing Agent does this: it picks a model for each shot, adds a voiceover and returns every size you asked for in one run.",
    },
    steps: [
      { title: "Add your product", body: "Upload a product photo, paste a product page link, or describe what you sell." },
      { title: "Say what you need", body: "Name the formats, sizes and how many variations. The agent shows a plan and waits for you to confirm before it generates or spends credits." },
      { title: "Review and remix", body: "Keep the ads that work, then ask for new hooks or cuts of a winner without starting over." },
    ],
    uses: [
      { title: "Launch a new product", body: "Brands launching a product give the Marketing Agent one brief and get a UGC hook, a product close-up and a before-and-after ad. Each comes in 9:16, 1:1 and 16:9, so the same launch runs on TikTok, Reels and Meta feeds." },
      { title: "Fight creative fatigue", body: "Media buyers ask for new hooks or cuts of an ad that is already spending well, without starting over. Video shots run up to 30 seconds each on Seedance 2.5 or Kling 4.0, and the agent shows its plan before any credits are spent." },
      { title: "Shopify and dropshipping stores", body: "Store owners paste a product page link instead of booking a shoot, and the agent builds the ad set from that page. Image ads come from Nano Banana 2.1 and GPT Image 2.5 Sunburst, with the script voiced by Seed Audio 1.0." },
    ],
    faq: [
      { q: "What is the best AI ad generator?", a: "For product ads, look for one that keeps your product's label and shape the same across shots and outputs every size you buy media in. BuzzVideo runs Seedance, Kling, Nano Banana and GPT Image in one place, so each shot can use the model that suits it." },
      { q: "Is there a free AI ad generator?", a: `Not for video ads: Seedance 2.5 and Kling 4.0 need a Starter, Pro or Ultra plan. The ${SIGNUP_CREDITS} free credits new accounts get do cover image ads on Seedream 4.5 and Seedream 5.0 lite, plus voiceovers with Seed Audio 1.0.` },
      { q: "Can it make ads for TikTok, Instagram and Facebook?", a: "Yes. Ask for 9:16 for TikTok, Reels and Shorts, 1:1 or 4:5 for feeds, and 16:9 for YouTube in the same request." },
      { q: "Can I use the AI ad generator in ChatGPT or Claude?", a: "Yes. Connect BuzzVideo MCP to ChatGPT or Claude, share your product photo or page link and describe the ads you want; they are generated on your BuzzVideo credits." },
      { q: "How long can an AI-generated video ad be?", a: "Up to 30 seconds per shot. Seedance 2.5 makes 4 to 30 second clips and Kling 4.0 makes 3 to 30 second clips in one take; longer ads are several shots edited together." },
      { q: "Which AI models make the ads?", a: "Seedance 2.5 and Kling 4.0 make the video shots, Nano Banana 2.1 and GPT Image 2.5 Sunburst make the image ads, and Seed Audio 1.0 voices the script. The Marketing Agent picks a model for each shot." },
      { q: "Will the AI ad generator spend credits before I approve?", a: "No. The Marketing Agent shows its plan first and waits for you to confirm before it generates anything or spends credits." },
      { q: "Can I make ads from a product page link?", a: "Yes. Paste the product page link in your brief instead of uploading photos, and the Marketing Agent builds the ad set from it, so a Shopify or dropshipping store can start without a shoot." },
      { q: "Can it make ads in other languages?", a: "Yes for the voiceover: Seed Audio 1.0 speaks 21 languages, so the same ad can be voiced again for a new market." },
      { q: "Can I use an AI ad generator with no sign up?", a: `No. You need a BuzzVideo account to generate ads, and creating one is free. New accounts get ${SIGNUP_CREDITS} free credits for image ads on Seedream 4.5 and Seedream 5.0 lite and voiceovers with Seed Audio 1.0.` },
      { q: "How do I make an ad with an AI ad creator?", a: "Add a product photo, a product page link or a one-line brief, then name the formats, sizes and number of variations. The Marketing Agent shows a plan, and after you confirm it returns the finished video and image ads." },
    ],
    related: ["url-to-video", "ai-ugc-video-generator", "ai-product-video-generator"],
    metaTitle: "AI Ad Generator: Video & Image Ads | BuzzVideo",
    metaDescription: "AI ad generator that turns a product photo, link or brief into video and image ads for TikTok, Reels and Meta, in every size, with new variations on request.",
  },
  {
    slug: "url-to-video",
    name: "URL to Video",
    group: "Ads",
    h1: "URL to Video",
    h1Tail: "turn a product page into an ad",
    lead: "BuzzVideo's URL to Video tool turns a product page, landing page or document link into a vertical video ad, reading the page and picking the selling points for you. Paste any link and get a short ad with a hook, product shots and a call to action, powered by Wan 3.0, the model that reads web pages and documents.",
    mode: "video",
    prompt: "A [15s] vertical ad from the page I added: hook in 2s, top 3 selling points, end on the product with Shop now.",
    models: ["wan-3-0"],
    media: {
      kind: "video",
      src: `${LOCAL}/link-to-ad.mp4`,
      poster: `${POSTER}/skill-link-to-ad.jpg`,
      aspect: "9:16",
      alt: "A vertical ad for a wireless charging stand made from its product page",
      caption: "Made from a product page link with the Link to Ad workflow.",
      source: "MCP Skill 示例 link-to-ad(视频库 skill-link-to-ad)",
    },
    definition: {
      q: "What is URL to video?",
      a: "URL to video makes a video from the content of a web page. In BuzzVideo it uses Wan 3.0, the model that can read web pages and documents, to turn a product page into a short ad.",
    },
    steps: [
      { title: "Paste the link", body: "Add a product page, landing page or document in the URL / Doc slot." },
      { title: "Set length and format", body: "Pick the length and aspect ratio. The prompt tells the model which selling points to lead with." },
      { title: "Generate and edit", body: "Check the price, create, then trim or re-cut the result in Canvas." },
    ],
    uses: [
      { title: "Video ads for every SKU", body: "Ecommerce teams paste each product page link and get a first-cut vertical ad with a hook, product shots and a call to action. Wan 3.0 reads the page and picks the selling points, so there is no script to write." },
      { title: "Landing page to teaser", body: "Marketers turn a launch page into a 2 to 30 second teaser at 480p, 720p or 1080p. Pick 9:16 for TikTok, Reels and Shorts, or 16:9 and 1:1 for other paid social placements." },
      { title: "Docs to explainer", body: "Product teams add a feature doc in the URL / Doc slot to get a short explainer clip with native audio. Omni Reference also takes up to 10 reference images, so you can add your own product photos next to the document." },
    ],
    faq: [
      { q: "How do I make a video from a URL?", a: "In BuzzVideo, open Video, choose Wan 3.0 with Omni Reference, paste the link in the URL / Doc slot and describe the ad. You see the credit price before you create." },
      { q: "Is URL to video free?", a: "Not for video: URL to Video runs on Wan 3.0, a video model that needs a Starter, Pro or Ultra plan. You see the exact credit price before you create." },
      { q: "Is URL to Video a URL to video converter or downloader?", a: "No. It does not convert or download a video from a link; it reads the page's text and images and makes a new video ad from them." },
      { q: "How long can a URL to video ad be?", a: "From 2 to 30 seconds in one clip. Wan 3.0 generates 2 to 30 second videos at 480p, 720p or 1080p." },
      { q: "What aspect ratios can I get?", a: "9:16, 16:9, 1:1, 3:4 and 4:3, or Auto to let the model choose. Pick 9:16 for TikTok, Reels and Shorts." },
      { q: "What kinds of links work?", a: "Product pages, landing pages and documents. Add the link in the URL / Doc slot and Wan 3.0 reads it before it generates." },
      { q: "Can I add my own product photos as well as the link?", a: "Yes. In Omni Reference, Wan 3.0 also takes up to 10 reference images, 5 videos and 5 audio clips, so you can add product photos next to the link." },
      { q: "Does the video have sound?", a: "Yes. Wan 3.0 generates native audio with the clip, and you can turn it off to add your own voiceover and music in Canvas." },
      { q: "URL to Video vs the AI Ad Generator: which should I use?", a: "Use URL to Video for one quick clip made straight from a page with Wan 3.0. Use the AI Ad Generator when you want a full set: the Marketing Agent writes the script and returns video and image ads in several sizes." },
      { q: "Can I use URL to Video online?", a: "Yes. URL to Video runs online in your browser, with nothing to install. Sign in to your BuzzVideo account, paste the link and create." },
      { q: "Can ChatGPT or Claude turn a URL into a video?", a: "Yes, with BuzzVideo MCP connected. Share the product page link in ChatGPT or Claude and ask for an ad; the video is generated on your BuzzVideo plan and saved to your library." },
    ],
    related: ["ai-ad-generator", "ai-product-video-generator", "text-to-video"],
    metaTitle: "URL to Video: Product Page to Video Ad | BuzzVideo",
    metaDescription: "URL to video: paste a product page, landing page or doc link and get a vertical video ad with a hook, selling points and a call to action, made with Wan 3.0.",
  },
  {
    slug: "ai-ugc-video-generator",
    name: "AI UGC Video Generator",
    group: "Ads",
    h1: "AI UGC Video Generator",
    h1Tail: "creator-style ads without creators",
    lead: "BuzzVideo's AI UGC Video Generator makes creator-style video ads, a real-looking person talking to camera about your product, from one product photo and a short brief. Get testimonials, unboxings and hook variations for TikTok Shop and Reels with Kling 4.0, Seedance 2.5 and MiniMax H3, with no creator sourcing, product shipping or reshoots.",
    mode: "marketing",
    prompt: "A [15s] UGC video of [a woman in her 20s] talking to camera about my product, ending with Shop now.",
    models: ["kling-4-0", "seedance-2-5", "minimax-h3", "seed-audio-1-0"],
    media: {
      kind: "video",
      src: `${LOCAL}/ugc-product-review.mp4`,
      poster: `${POSTER}/skill-ugc-product-review.jpg`,
      aspect: "9:16",
      alt: "A woman holding a serum bottle and talking to camera in a selfie-style UGC ad",
      caption: "An 8-second UGC product review made from one product photo.",
      source: "MCP Skill 示例 ugc-product-review(视频库 skill-ugc-product-review)",
    },
    definition: {
      q: "What is an AI UGC video generator?",
      a: "AI UGC is user-generated-style content made with AI. An AI UGC video generator makes videos that look like user-generated content, a real-looking person reviewing or using a product on camera, without hiring a creator. BuzzVideo writes the script, generates the person and the product shots, and adds the voice.",
    },
    steps: [
      { title: "Upload your product", body: "One clear product photo is enough. The label and shape stay the same in every shot." },
      { title: "Describe the creator and script", body: "Say who is talking and what the hook is, or let the agent write three hooks to test." },
      { title: "Get the video", body: "Kling 4.0 can do up to 30 seconds in one take, so there are fewer cuts for the face to change across." },
    ],
    uses: [
      { title: "AI UGC ads for TikTok Shop and Reels", body: "Ecommerce brands make testimonials and unboxings where a real-looking creator talks to camera about the product. Clips come in 9:16, and Kling 4.0 holds one take for up to 30 seconds, so the face has fewer cuts to change across." },
      { title: "Hook testing", body: "Performance marketers keep one product and ask the agent to write three hooks to test, each as its own video. The label and shape stay the same in every version because all of them start from the same product photo." },
      { title: "New markets and languages", body: "Teams remake a winning UGC ad with a different creator for another country. Describe the new person in the brief, and Seed Audio 1.0 voices the script in any of 21 languages, in a preset voice or a cloned one." },
    ],
    faq: [
      { q: "Do UGC ads work?", a: "Often, yes. UGC-style ads are one of the most used formats on TikTok and Meta because they look like posts, not ads. AI makes it cheap to test many versions and keep the ones that perform." },
      { q: "Are AI UGC ads legal?", a: "Generally yes, if you follow the platform rules. AI-generated people can appear in ads, but TikTok and Meta both have AI-disclosure rules, so check their ad policies before you run them. Do not present an AI person as a real customer giving a real review." },
      { q: "What is the best AI UGC video generator?", a: "Pick one that keeps the same face for the whole clip and the product label readable. BuzzVideo uses Kling 4.0 for 30-second single takes and MiniMax H3 for consistent characters across clips." },
      { q: "Is there a free AI UGC video generator?", a: `Not for video: UGC clips use Kling 4.0, Seedance 2.5 and MiniMax H3, which need a Starter, Pro or Ultra plan. You can still voice a UGC script with Seed Audio 1.0 on the ${SIGNUP_CREDITS} free credits new accounts get.` },
      { q: "How long can an AI UGC video be?", a: "Up to 30 seconds in a single take. Kling 4.0 makes 3 to 30 second clips and Seedance 2.5 makes 4 to 30 seconds; MiniMax H3 runs 5 to 15 seconds." },
      { q: "Can I choose what the AI creator looks like?", a: "Yes. Describe the person in the brief, such as age, look and setting, or add reference images; Kling 4.0 takes up to 10 and Seedance 2.5 up to 30." },
      { q: "Can the AI creator speak my script?", a: "Yes. Paste your script or let the agent write it. Kling 4.0 and MiniMax H3 generate the speech with the video, and Seed Audio 1.0 can voice it in a preset voice or your own cloned voice." },
      { q: "Can I make UGC ads in other languages?", a: "Yes. Remake a winning ad with a different creator and language; Seed Audio 1.0 voices scripts in 21 languages." },
      { q: "What aspect ratio are AI UGC videos?", a: "9:16 for TikTok Shop, Reels and Shorts. Kling 4.0 also outputs 16:9, 1:1 and 21:9, and Seedance 2.5 adds 3:4 and 4:3." },
      { q: "What is AI UGC?", a: "AI UGC is content that looks like a real user's post, such as a review, testimonial or unboxing, but is generated by AI instead of filmed by a creator. Brands use it for ads because it is fast to make and easy to test in many versions." },
      { q: "How do I make AI UGC videos?", a: "Upload one clear product photo, describe the creator and the hook, and confirm the plan. BuzzVideo's AI UGC creator writes the script, generates the person and the product shots and adds the voice." },
    ],
    related: ["ai-spokesperson", "ai-ad-generator", "ai-product-video-generator"],
    /* 2026-11-25:同义词「AI UGC Creator」(Trends 约 2.4 万/月)并进本页标题，不单独开页 */
    metaTitle: "AI UGC Video Generator & UGC Creator for Ads | BuzzVideo",
    metaDescription: "AI UGC video generator for ads: a real-looking creator talks about your product from one photo. Up to 30-second single takes with Kling 4.0 on BuzzVideo.",
  },
  {
    slug: "ai-product-video-generator",
    name: "AI Product Video Generator",
    group: "Ads",
    h1: "AI Product Video Generator",
    h1Tail: "hero shots and demos from one photo",
    lead: "BuzzVideo's AI Product Video Generator turns one product photo into unboxings, hero shots, in-use demos and 3D turnarounds, with the label kept exactly as it is. Make 9:16 videos for paid social and 16:9 clips for Shopify and Amazon product pages from the same run, using Seedance 2.5, Kling 4.0 and Wan 3.0.",
    mode: "marketing",
    prompt: "A [15s] unboxing video of my product: hands open the box, slow close-up on the label, end on the product.",
    models: ["seedance-2-5", "kling-4-0", "wan-3-0", "nano-banana-2-1"],
    media: {
      kind: "video",
      src: `${LOCAL}/unboxing-ugc.mp4`,
      poster: `${POSTER}/skill-unboxing-ugc.jpg`,
      aspect: "9:16",
      alt: "Hands opening a pink gift box with a perfume bottle inside",
      caption: "A 15-second unboxing video made from one product photo.",
      source: "MCP Skill 示例 unboxing-ugc(视频库 skill-unboxing-ugc)",
    },
    definition: {
      q: "What is an AI product video generator?",
      a: "An AI product video generator makes videos of your product from photos instead of a shoot. BuzzVideo uses your photo as a reference so the product looks the same in every shot, and picks the video model by shot type.",
    },
    steps: [
      { title: "Add product photos", body: "Front-on photos with a readable label work best. Add more angles for 3D turnarounds." },
      { title: "Pick the shot", body: "Unboxing, in-use demo, hero close-up or a person holding it. Write it in one line." },
      { title: "Create and resize", body: "Get 9:16 for social and 16:9 for your product page from the same run." },
    ],
    uses: [
      { title: "Shopify and Amazon product pages", body: "Sellers turn one front-on product photo into 16:9 clips for Shopify and Amazon listings, such as an in-use demo or a 3D turnaround. Output goes up to 1080p, and the label stays as it is in the photo." },
      { title: "Paid social for every SKU", body: "Ecommerce marketers write the shot in one line and get an unboxing or a person holding the product in 9:16. The same run also returns 16:9, so one request covers TikTok, Reels and the product page." },
      { title: "Launch hero videos", body: "Brands make a cinematic hero close-up before the product ships, using only photos. Seedance 2.5 suits premium hero shots and takes up to 30 reference images, while Kling 4.0 holds a continuous take of up to 30 seconds with sound." },
    ],
    faq: [
      { q: "Is there a free AI product video generator?", a: `Not for video: Seedance 2.5, Kling 4.0 and Wan 3.0 need a Starter, Pro or Ultra plan. With the ${SIGNUP_CREDITS} free credits new accounts get, you can make still product shots on Seedream 4.5 or Seedream 5.0 lite to use as first frames later.` },
      { q: "Can AI make a product video from an image?", a: "Yes. Upload the product photo and describe the shot; Seedance 2.5 and Kling 4.0 animate it while keeping the label and shape from your photo." },
      { q: "How long should an Amazon product video be?", a: "Amazon accepts listing videos up to several minutes, but short clips that show the product in use in the first seconds tend to hold attention. BuzzVideo clips run from a few seconds up to 30 seconds per take." },
      { q: "What kinds of product videos can it make?", a: "Unboxings, hero close-ups, in-use demos, 3D turnarounds and a person holding the product. Write the shot in one line and the video model is picked by shot type." },
      { q: "Will my product look the same as in my photo?", a: "Yes in most cases, because your photo is used as a reference in every shot. Seedance 2.5 takes up to 30 reference images and Kling 4.0 up to 10, so add more angles for turnarounds and check small label text before you publish." },
      { q: "What resolution and sizes can I get?", a: "Up to 1080p on Seedance 2.5, Kling 4.0 and Wan 3.0. All three output 9:16 for social, 16:9 for product pages and 1:1." },
      { q: "Which AI model is best for product videos?", a: "Seedance 2.5 for premium hero shots, Kling 4.0 for continuous takes up to 30 seconds with sound, and Wan 3.0 for long demos on a budget." },
      { q: "Can I turn a product page link into a video?", a: "Yes, with URL to Video: paste the link and Wan 3.0 reads the page and makes a short ad from it." },
      { q: "What is the best AI product video generator?", a: "Pick one that keeps the label and shape of your product the same in every shot and outputs the sizes you need. BuzzVideo uses your photo as a reference and runs Seedance 2.5, Kling 4.0 and Wan 3.0, so each shot can use the model that suits it." },
      { q: "How do I make AI product videos?", a: "Upload a front-on product photo, write the shot in one line, such as an unboxing or a hero close-up, and create. You get 9:16 for social and 16:9 for your product page from the same run." },
      { q: "Do I need an account to use the AI product video maker?", a: "Yes. You need a BuzzVideo account to generate, and creating one is free. Video models need a Starter, Pro or Ultra plan." },
    ],
    related: ["image-to-video", "ai-product-photography", "url-to-video"],
    metaTitle: "AI Product Video Generator from One Photo | BuzzVideo",
    metaDescription: "AI product video generator: make unboxings, demos and hero shots from one product photo, with the label kept the same. Seedance, Kling and Wan on BuzzVideo.",
  },

  /* ───────── Video ───────── */
  {
    slug: "ai-video-generator",
    name: "AI Video Generator",
    group: "Video",
    h1: "AI Video Generator",
    h1Tail: "every leading model in one place",
    lead: "BuzzVideo's AI Video Generator creates video clips from a text prompt, an image or reference media, with the leading video models side by side on one account. Make ads, YouTube Shorts and TikTok videos, product shots, B-roll and cinematic brand films with Seedance 2.5, Kling 4.0, Wan 3.0, MiniMax H3 and Gemini Omni 1.2 Flash, choosing each by length and resolution.",
    mode: "video",
    prompt: "A [15s] vertical ad for [product]: quick hook, [in-use shot], end on the product.",
    models: ["seedance-2-5", "kling-4-0", "wan-3-0", "minimax-h3", "gemini-omni-1-2-flash"],
    media: {
      kind: "video",
      src: `${LOCAL}/3d-product-video.mp4`,
      poster: `${POSTER}/skill-3d-product-video.jpg`,
      aspect: "16:9",
      alt: "Wireless earbuds rotating above their charging case against a black background",
      caption: "A 15-second 3D product video made on BuzzVideo.",
      source: "MCP Skill 示例 3d-product-video(视频库)",
    },
    definition: {
      q: "What is an AI video generator?",
      a: "An AI video generator makes video clips from a text prompt, an image or other reference media. BuzzVideo gives you the main video models side by side, so you can pick by length, resolution and price instead of switching apps.",
    },
    steps: [
      { title: "Choose a model", body: "Seedance 2.5 for premium ads, Kling 4.0 for 30-second takes, Wan 3.0 for long clips on a budget." },
      { title: "Prompt and add references", body: "Describe the shot and add product photos, a character or a video to follow." },
      { title: "Create", body: "The exact credit price shows next to Create. Keep editing in Canvas." },
    ],
    uses: [
      { title: "Ad creative for paid social", body: "Marketers generate hooks, product shots and B-roll from a prompt plus product photos. Seedance 2.5 makes 4 to 30 second clips at up to 1080p and takes up to 30 reference images of your product." },
      { title: "Brand films", body: "Brand teams make cinematic hero clips with native sound in 16:9, or 21:9 on Seedance 2.5 and MiniMax H3. MiniMax H3 goes up to 4K for 5 to 15 second shots, and Kling 4.0 holds one continuous take for up to 30 seconds." },
      { title: "YouTube Shorts and TikTok", body: "Creators post vertical 9:16 videos every day without a camera crew. Wan 3.0 covers long clips on a budget and Gemini Omni 1.2 Flash returns fast, affordable ones, with the exact credit price shown next to Create." },
    ],
    faq: [
      { q: "Is there a free AI video generator?", a: `Not for video: every video model on BuzzVideo, from Seedance 2.5 to Gemini Omni 1.2 Flash, needs a Starter, Pro or Ultra plan. The ${SIGNUP_CREDITS} free credits new accounts get work on Seedream 4.5, Seedream 5.0 lite and Seed Audio 1.0, so you can prepare first frames and voiceovers before you upgrade.` },
      { q: "What is the best AI video generator model?", a: "Seedance 2.5 for long, premium ads up to 30 seconds, Kling 4.0 for continuous 30-second takes with sound, and Gemini Omni 1.2 Flash when you need fast, affordable clips. For length, resolution, references and credit price of every model, see the AI video models page." },
      { q: "Can I use the AI video generator in ChatGPT or Claude?", a: "Yes. Connect BuzzVideo MCP to ChatGPT or Claude, describe the clip and name the model to use; the video is generated on your BuzzVideo credits." },
      { q: "How long can an AI-generated video be?", a: "Up to 30 seconds in one generation. Seedance 2.5 (4 to 30 seconds), Kling 4.0 (3 to 30 seconds) and Wan 3.0 (2 to 30 seconds) all reach 30 seconds; MiniMax H3 makes 5 to 15 second clips." },
      { q: "What resolution can I get?", a: "Up to 1080p on Seedance 2.5, Kling 4.0 and Wan 3.0, and up to 4K on MiniMax H3." },
      { q: "What aspect ratios are supported?", a: "Seedance 2.5, Kling 4.0, Wan 3.0 and MiniMax H3 all output 9:16, 16:9 and 1:1. Seedance 2.5 and MiniMax H3 add 3:4, 4:3 and 21:9." },
      { q: "Is there an AI video generator with audio?", a: "Yes. The video models on BuzzVideo generate native sound with the picture. On Seedance 2.5 and Wan 3.0 you can switch it off; Kling 4.0 and MiniMax H3 always include it." },
      { q: "Can the AI video generator make a video from an image?", a: "Yes. Add an image as the first frame or as a reference: up to 30 on Seedance 2.5, 10 on Kling 4.0 and Wan 3.0, and 9 on MiniMax H3. Seedance 2.5 also takes up to 10 reference videos and 10 audio clips." },
      { q: "Can I make AI videos with no watermark?", a: "Yes. Video generation needs a Starter, Pro or Ultra plan, and videos made on those plans have no watermark. Only work made on the Free plan carries one." },
      { q: "Can I use an AI video generator with no sign up or login?", a: `No. You need to log in to a BuzzVideo account to generate, and creating one is free. New accounts get ${SIGNUP_CREDITS} free credits for Seedream images and Seed Audio 1.0; video models need a Starter, Pro or Ultra plan.` },
      { q: "Is there an AI video generator app?", a: "No. BuzzVideo is a web product, not an app: you use it in your browser, with nothing to install. You can also generate videos inside ChatGPT or Claude through BuzzVideo MCP." },
    ],
    related: ["text-to-video", "image-to-video", "ai-video-editor"],
    metaTitle: "AI Video Generator: Seedance, Kling & Wan | BuzzVideo",
    metaDescription: "AI video generator with Seedance 2.5, Kling 4.0, Wan 3.0 and MiniMax H3 in one account. Make videos from text or an image, with audio, for YouTube and TikTok.",
  },
  {
    slug: "text-to-video",
    name: "Text to Video",
    group: "Video",
    /* 2026-11-25 Monica:H1 照竞品用自然叫法;搜索词「text to video ai」留在 meta title */
    h1: "AI Text to Video Generator",
    h1Tail: "write the shot, get the clip",
    lead: "BuzzVideo's AI Text to Video Generator turns a written prompt into a video clip with motion and native sound, up to 30 seconds in one take depending on the model. Describe the subject, action and camera to make ad concepts, B-roll and scripted ads with no footage, using Seedance 2.5, Kling 4.0, Wan 3.0 or Gemini Omni 1.2 Flash.",
    mode: "video",
    prompt: "A [10s] cinematic shot of [a lighthouse on a cliff at dusk, waves crashing below], slow aerial push-in, [moody blue light], with the sound of wind and surf.",
    models: ["seedance-2-5", "kling-4-0", "wan-3-0", "gemini-omni-1-2-flash"],
    media: {
      kind: "video",
      src: "/prototypes/site/models/kling-4-0/lp-rooftop.mp4",
      poster: "/prototypes/site/models/kling-4-0/lp-rooftop.webp",
      aspect: "16:9",
      alt: "A continuous single-take shot generated from a text prompt",
      caption: "A single take generated from a text prompt with Kling 4.0.",
      source: "Kling 4.0 真实样片 lp-rooftop(原来是内部宣讲片画面，2026-11-27 换掉)",
    },
    definition: {
      q: "What is text to video AI?",
      a: "Text to video AI generates a video clip from a written description. The more specific the prompt (subject, action, camera, light, length), the closer the result. On BuzzVideo, text to video models such as Seedance 2.5, Kling 4.0 and Wan 3.0 make clips from text alone, up to 30 seconds in one take.",
    },
    steps: [
      { title: "Write the prompt", body: "Say who or what is on screen, what happens, the camera move and the mood." },
      { title: "Set length and size", body: "Pick seconds and aspect ratio. Longer clips cost more; the price updates as you change it." },
      { title: "Create and iterate", body: "Draft at a lower resolution, then render the keeper at full quality." },
    ],
    uses: [
      { title: "Concepts before a shoot", body: "Agencies and creative teams show a client the idea in motion before anyone books a crew. Write the subject, action, camera move and light, draft at a lower resolution, then render the version you keep at up to 1080p." },
      { title: "B-roll for longer edits", body: "Editors generate cutaways and scene-setters from a one-line description instead of searching for footage. Clips come with native sound in 9:16, 16:9 or 1:1, and Seedance 2.5 adds 21:9 for widescreen edits." },
      { title: "Scripted ads with no footage", body: "Marketers start from a script when there are no product assets yet. One take runs up to 30 seconds on Seedance 2.5, Kling 4.0 or Wan 3.0, and longer ads are several shots cut together in Canvas." },
    ],
    faq: [
      { q: "Is there a free text to video AI?", a: `Not for video: Seedance 2.5, Kling 4.0, Wan 3.0 and Gemini Omni 1.2 Flash all need a Starter, Pro or Ultra plan. You can test the scene as a still image on Seedream 4.5 or Seedream 5.0 lite with the ${SIGNUP_CREDITS} free credits new accounts get.` },
      { q: "How long can a text-to-video clip be?", a: "It depends on the model: Kling 4.0 and Wan 3.0 go up to 30 seconds in one take; Seedance 2.5 also reaches 30 seconds." },
      { q: "Does text to video include sound?", a: "Yes, on most models. They generate native audio with the clip, and many have a With Audio switch so you can add your own voiceover and music instead." },
      { q: "How do I write a good text-to-video prompt?", a: "Write it like a shot list: who or what is on screen, what happens, the camera move, the light and the length. For example: a 10-second cinematic shot of a lighthouse at dusk, slow aerial push-in, moody blue light." },
      { q: "What resolution and aspect ratios can I choose?", a: "Up to 1080p, in 9:16, 16:9 or 1:1 on Seedance 2.5, Kling 4.0 and Wan 3.0. Seedance 2.5 also does 21:9, 3:4 and 4:3." },
      { q: "What is the best text to video AI generator?", a: "It depends on the clip: Seedance 2.5 for premium ads, Kling 4.0 for continuous 30-second takes with sound, and Wan 3.0 for long clips on a budget. You see each model's credit price before you create." },
      { q: "Text to video vs image to video: which should I use?", a: "Use text to video when you have no assets and want the model to create the scene from your description. Use image to video when a product, person or frame must stay as it is in your photo, because the image becomes the first frame." },
      { q: "Can I make a video longer than 30 seconds?", a: "Not in one take: 30 seconds is the longest single clip. For a longer video, generate several shots and cut them together in Canvas, or give the Marketing Agent a script and it edits the shots for you." },
      { q: "Can I use text to video AI online without login?", a: "No. BuzzVideo runs online in your browser, but you need to log in to a BuzzVideo account to generate, and creating one is free. Text to video models need a Starter, Pro or Ultra plan." },
      { q: "Is there a text to video app?", a: "No. BuzzVideo is a web product, not an app: you use the text to video generator in your browser, with nothing to install. You can also use it inside ChatGPT or Claude through BuzzVideo MCP." },
      { q: "How do I convert text to video?", a: "Open Video, pick a model and write the prompt: who or what is on screen, what happens, the camera move and the mood. Set the length and aspect ratio, check the credit price and create." },
    ],
    related: ["image-to-video", "ai-video-generator", "faceless-video-generator"],
    metaTitle: "Text to Video AI: Prompt to Video Clip | BuzzVideo",
    metaDescription: "Text to video AI: write a prompt and get a clip with motion and native sound, up to 30 seconds in one take, from Seedance 2.5, Kling 4.0 or Wan 3.0.",
  },
  {
    slug: "image-to-video",
    name: "Image to Video",
    group: "Video",
    /* 2026-11-25 Monica:H1 照竞品(Higgsfield、OpenArt)用自然叫法;搜索量最高的「image to video ai」(Semrush 27,100/月)放进 meta title */
    h1: "AI Image to Video Generator",
    h1Tail: "bring a photo to life",
    lead: "BuzzVideo's AI Image to Video Generator animates a photo into a video clip, using your image as the first frame so the product, person or scene stays the same. Turn catalog shots into social video, add motion to still posts or animate storyboard frames, using Seedance 2.5, Kling 4.0, MiniMax H3 and Wan 3.0.",
    mode: "video",
    prompt: "Animate my product image into a [5s] vertical clip with a [slow push-in].",
    models: ["seedance-2-5", "kling-4-0", "minimax-h3", "wan-3-0"],
    media: {
      kind: "video",
      src: `${LOCAL}/talking-product.mp4`,
      poster: `${POSTER}/skill-talking-product.jpg`,
      aspect: "9:16",
      alt: "A cartoon-faced drink can on a kitchen counter that talks to camera",
      caption: "A product photo turned into an 8-second talking-product clip.",
      source: "MCP Skill 示例 talking-product(视频库 skill-talking-product)",
    },
    definition: {
      q: "What is image to video AI?",
      a: "Image to video AI uses a still image as the first frame or reference and generates motion from it. It is the fastest way to turn existing product photos into video. On BuzzVideo, Seedance 2.5, Kling 4.0, MiniMax H3 and Wan 3.0 all start from your image.",
    },
    steps: [
      { title: "Upload the image", body: "Use a sharp photo. For products, a clean front view keeps the label readable." },
      { title: "Describe the motion", body: "Camera move, what moves in the scene, and how long." },
      { title: "Create", body: "Add a last frame too if you want to control where the clip lands." },
    ],
    uses: [
      { title: "Product photos to video", body: "Ecommerce brands animate catalog shots into clips for social. The photo becomes the first frame, so the product and its label stay as shot, and clips run up to 30 seconds on Seedance 2.5, Kling 4.0 and Wan 3.0." },
      { title: "Still posts with motion", body: "Social media managers add a subtle loop to a still post so it stops the scroll. Describe the camera move and what moves in the scene, such as a 5-second vertical clip with a slow push-in, and the result comes with native audio." },
      { title: "Storyboard frames", body: "Directors and agencies animate key frames to check pacing before production. First & Last Frame mode on Seedance 2.5, Kling 4.0 and Wan 3.0 takes a start image and an end image and generates the motion between them." },
    ],
    faq: [
      { q: "Is there a free, unlimited image to video AI generator?", a: `Not on BuzzVideo: image to video is neither free nor unlimited. Animating a photo with Seedance 2.5, Kling 4.0, MiniMax H3 or Wan 3.0 needs a Starter, Pro or Ultra plan. The ${SIGNUP_CREDITS} free credits new accounts get can make the starting image itself on Seedream 4.5 or Seedream 5.0 lite.` },
      { q: "Which models can turn an image into a video?", a: "Most video models on BuzzVideo take a starting image, and many also take an end image so you control where the clip lands. Seedance 2.5 and Kling 4.0 also accept several reference images." },
      { q: "How long can an image-to-video clip be?", a: "Up to 30 seconds on Seedance 2.5, Kling 4.0 and Wan 3.0, and 5 to 15 seconds on MiniMax H3." },
      { q: "Can I set both the first and the last frame?", a: "Yes. Seedance 2.5, Kling 4.0 and Wan 3.0 have a First & Last Frame mode: upload a start image and an end image, and the model generates the motion between them." },
      { q: "What kind of photo works best?", a: "A sharp photo. For products, a clean front view keeps the label readable in the video." },
      { q: "How do I describe the motion?", a: "Say the camera move, what moves in the scene and how long the clip is, for example a 5-second vertical clip with a slow push-in." },
      { q: "What resolution is the video?", a: "Up to 1080p on Seedance 2.5, Kling 4.0 and Wan 3.0, and up to 4K on MiniMax H3." },
      { q: "Does image to video AI come with audio?", a: "Yes. The video models generate native audio with the clip. On Seedance 2.5 and Wan 3.0 you can switch it off and add your own voiceover or music; Kling 4.0 and MiniMax H3 always include it." },
      { q: "Can I use image to video AI with no sign up?", a: "No. You need a BuzzVideo account to animate a photo, and creating one is free. Video models need a Starter, Pro or Ultra plan." },
      { q: "What is the best image to video AI generator?", a: "It depends on the clip. On BuzzVideo, Seedance 2.5 and Kling 4.0 animate a photo for up to 30 seconds and accept several reference images, MiniMax H3 goes up to 4K, and Wan 3.0 suits long clips on a budget." },
      { q: "How do I use Kling AI for image to video?", a: "Open Video, choose Kling 4.0, upload your image as the first frame and describe the motion. Kling 4.0 makes 3 to 30 second clips with sound, and its First & Last Frame mode lets you set the end image too." },
    ],
    related: ["text-to-video", "ai-product-video-generator", "ai-video-generator"],
    metaTitle: "Image to Video AI: Turn Any Photo into Video | BuzzVideo",
    metaDescription: "Image to video AI that uses your photo as the first frame, so the product or person stays the same. Animate stills up to 30 seconds with Seedance or Kling.",
  },
  {
    slug: "ai-video-editor",
    name: "AI Video Editor",
    group: "Video",
    h1: "AI Video Editor",
    h1Tail: "edit a clip by describing the change",
    lead: "BuzzVideo's AI Video Editor changes what is inside a clip from a text prompt: swap the background, change an outfit or remove an object while the people, motion and timing stay the same. Localize an ad for a new market, fix a shot or make seasonal versions of a winning video for YouTube, TikTok and Reels without a reshoot, powered by Seedance 2.5.",
    mode: "video",
    prompt: "In my video, [replace the background with a beach]. Keep the people, motion and timing.",
    models: ["seedance-2-5"],
    definition: {
      q: "What is an AI video editor?",
      a: "An AI video editor changes the content of a video from a text instruction instead of frame-by-frame editing. On BuzzVideo, Edit Video mode uses Seedance 2.5 and keeps the original motion and timing.",
    },
    steps: [
      { title: "Upload the clip", body: "Add the video you want to change." },
      { title: "Describe the edit", body: "Say what to change and what to keep the same." },
      { title: "Create", body: "Compare with the original, then cut and caption it in Canvas." },
    ],
    uses: [
      { title: "Localize an ad", body: "Marketing teams change the setting or props of an existing ad for a new market without a reshoot. Edit Video mode on Seedance 2.5 keeps the people, motion and timing, and accepts a reference image of the new location." },
      { title: "Fix a shot", body: "Editors remove a logo or swap a product in footage they already have by typing the change. There is no green screen or masking, and clips from 4 to 30 seconds come back at 480p, 720p or 1080p." },
      { title: "Seasonal social media versions", body: "Brands put a winning ad in a holiday setting for YouTube, TikTok and Reels. Swap the background or an outfit with one prompt, compare the result with the original, then cut and caption it in Canvas." },
    ],
    faq: [
      { q: "Is there a free AI video editor?", a: `Not for video: Edit Video mode runs on Seedance 2.5, which needs a Starter, Pro or Ultra plan. The ${SIGNUP_CREDITS} free credits new accounts get cover image edits on Seedream 4.5 and Seedream 5.0 lite, not video.` },
      { q: "Does the AI video editor add captions and cuts?", a: "Captions and cuts are done in Canvas or by the Marketing Agent. Edit Video mode changes what is inside the shot." },
      { q: "How do I edit a video with an AI prompt?", a: "Open Video, choose Edit Video mode on Seedance 2.5, upload the clip and describe the change. Say what must stay the same, such as the people, motion and timing." },
      { q: "How long can the video be?", a: "Seedance 2.5 works with clips from 4 to 30 seconds. Split longer footage into parts." },
      { q: "Can I use a reference image for the edit?", a: "Yes. Edit Video on Seedance 2.5 accepts reference images, so you can upload the new background or location you want in the shot." },
      { q: "Can I remove an object or logo from a video?", a: "Yes. Say what to remove and what to keep, for example remove the logo on the cup and keep the people, motion and timing the same." },
      { q: "Do I need a green screen or masking?", a: "No. Describe the change and Seedance 2.5 rebuilds that part of the scene, keeping the people and their motion." },
      { q: "Does it keep the original audio?", a: "Not always. Check the sound in the result and add your own voiceover or music in Canvas if needed." },
      { q: "What resolution is the edited video?", a: "Seedance 2.5 outputs 480p, 720p or 1080p." },
      { q: "Is the AI video editor online or an app?", a: "Online. BuzzVideo is a web product, so you edit in your browser with nothing to install." },
      { q: "Can I use the AI video editor with no sign up?", a: "No. You need a BuzzVideo account to edit a video, and creating one is free. Edit Video mode runs on Seedance 2.5, which needs a Starter, Pro or Ultra plan." },
    ],
    related: ["ai-video-generator", "ai-image-editor", "faceless-video-generator"],
    metaTitle: "AI Video Editor Online: Edit Video with a Prompt | BuzzVideo",
    metaDescription: "AI video editor online: change a clip with one text prompt. Swap the background, an outfit or an object while motion and timing stay. Seedance 2.5.",
  },
  {
    slug: "faceless-video-generator",
    name: "AI Faceless Video Generator",
    group: "Video",
    h1: "AI Faceless Video Generator",
    h1Tail: "explainers with no one on camera",
    lead: "BuzzVideo's AI Faceless Video Generator turns one topic into a finished video with an AI voiceover, generated visuals and captions, so no one has to appear on camera. Make explainers, list videos and product round-ups for YouTube Shorts, TikTok and Reels, with visuals from Seedance 2.5 and Nano Banana 2.1 and narration from Seed Audio 1.0.",
    mode: "marketing",
    prompt: "A [30s] faceless explainer about [topic]: hook in the first 2s, voiceover and captions, no people on camera.",
    models: ["seedance-2-5", "nano-banana-2-1", "seed-audio-1-0"],
    media: {
      kind: "video",
      src: `${SHOW}/faceless-money.mp4`,
      poster: `${SHOW}/faceless-money.jpg`,
      aspect: "9:16",
      alt: "A hand-drawn doodle-style faceless explainer about money",
      caption: "A faceless explainer with voiceover and captions, made by the Marketing Agent.",
      source: "MCP Skill 展示 faceless-money",
    },
    definition: {
      q: "What is a faceless video generator?",
      a: "A faceless video generator makes videos where no presenter appears: a script read by an AI voice over generated visuals, with captions. It is a common format for explainer and list channels. On BuzzVideo, the Marketing Agent writes the script, makes the visuals with Seedance 2.5 and Nano Banana 2.1 and narrates it with Seed Audio 1.0.",
    },
    steps: [
      { title: "Give it a topic", body: "One line is enough; the agent writes the script and hook." },
      { title: "Pick a look", body: "Doodle, cinematic B-roll, product shots or stock-style scenes." },
      { title: "Get the video", body: "Voiceover, visuals and captions come back as one edit you can tweak." },
    ],
    uses: [
      { title: "Faceless YouTube channels", body: "Faceless video creators give one topic and get an explainer or list video for YouTube Shorts with the hook, script, voiceover and captions done. It comes in 9:16, and the Marketing Agent shows its plan before it generates." },
      { title: "Brand education", body: "Brands make how-it-works clips without putting a presenter on camera. Name a look in the brief, such as doodle or cinematic B-roll, and Seedance 2.5 and Nano Banana 2.1 make the visuals in that style." },
      { title: "Affiliate product round-ups", body: "Affiliate marketers turn a product list into a round-up with voiceover for TikTok and Reels. Seed Audio 1.0 narrates in 21 languages or in your own cloned voice, and the edit comes back with captions you can tweak." },
    ],
    faq: [
      { q: "Is there a free faceless video generator?", a: `Not for video: the generated clips use Seedance 2.5, which needs a Starter, Pro or Ultra plan. The narration runs on Seed Audio 1.0, which works with the ${SIGNUP_CREDITS} free credits new accounts get.` },
      { q: "Can I use my own voice?", a: "Yes. Clone your voice with Seed Audio 1.0 and use it as the narrator." },
      { q: "How long can a faceless video be?", a: "Say the length in your brief, such as 30 seconds. Each generated shot runs up to 30 seconds on Seedance 2.5, and longer scripts become several shots edited together." },
      { q: "Can I use my own script?", a: "Yes. Paste your script into the Marketing Agent instead of a topic; it plans the scenes, shows you the plan and generates after you confirm." },
      { q: "Does it add captions automatically?", a: "Yes. Voiceover, visuals and captions come back as one edit that you can tweak." },
      { q: "What visual styles can I choose?", a: "Doodle, cinematic B-roll, product shots or stock-style scenes. Name the look in your brief." },
      { q: "What languages can the voiceover be in?", a: "Seed Audio 1.0 speaks 21 languages, so the same faceless video can be narrated again for another market." },
      { q: "What sizes can I get for Shorts, TikTok and Reels?", a: "9:16 for YouTube Shorts, TikTok and Reels. Seedance 2.5 also outputs 16:9, 1:1, 3:4, 4:3 and 21:9 if you need another placement." },
      { q: "What is a faceless video?", a: "A faceless video is a video where no presenter appears on camera. A voiceover carries the story over visuals such as B-roll, illustrations or product shots, usually with captions." },
      { q: "What is the best faceless AI video generator?", a: "Pick one that handles the script, the visuals, the voiceover and the captions in one place, so you are not stitching tools together. On BuzzVideo the Marketing Agent does all four from one topic and shows its plan before it generates." },
      { q: "What are good faceless video ideas?", a: "Explainers, list videos, how-it-works clips and product round-ups all work without a presenter. Give the Marketing Agent the topic in one line and it writes the hook and script." },
    ],
    related: ["text-to-video", "ai-voice-over", "ai-video-editor"],
    metaTitle: "AI Faceless Video Generator with Voiceover | BuzzVideo",
    metaDescription: "Faceless video generator: give one topic and get a video with AI voiceover, generated visuals and captions for Shorts, TikTok and Reels, no one on camera.",
  },

  /* ───────── Image ───────── */
  {
    slug: "ai-image-generator",
    name: "AI Image Generator",
    group: "Image",
    h1: "AI Image Generator",
    h1Tail: "ad-ready images from a prompt",
    lead: "BuzzVideo's AI Image Generator turns a text prompt or reference photos into ad-ready images, keeping your product and its label exactly as they are. Create static feed and story ads, product photos and social posts in 1:1, 4:5 and 9:16 with Nano Banana 2.1, GPT Image 2.5 Sunburst, Seedream 5.5 and Nano Banana Pro.",
    mode: "image",
    prompt: "An ad photo of [product] on [a sunlit kitchen counter], bright and clean, space at the top for a headline.",
    models: ["nano-banana-2-1", "gpt-image-2-5-sunburst", "seedream-5-5", "nano-banana-pro"],
    media: {
      kind: "image",
      src: "/prototypes/site/models/nano-banana-2-1/giant.jpg",
      aspect: "4:5",
      alt: "A giant serum bottle standing in a city square next to a woman in a camel coat",
      caption: "Generated with Nano Banana 2.1 from one product photo.",
      source: "Nano Banana 2.1 模型页样片 giant.jpg(博客 #58)",
    },
    definition: {
      q: "What is an AI image generator?",
      a: "An AI image generator creates an image from a text prompt, and the better ones also follow reference photos. For ads, the important part is keeping your product and its text exactly as they are. On BuzzVideo, Nano Banana 2.1 takes up to 14 reference photos so your product stays the same.",
    },
    steps: [
      { title: "Pick a model", body: "Nano Banana 2.1 for fast, consistent results; GPT Image for sharp text; Seedream for low cost." },
      { title: "Prompt and add references", body: "Add product photos so the label stays correct." },
      { title: "Create and resize", body: "Make the same image in 1:1, 4:5 and 9:16." },
    ],
    uses: [
      { title: "Static ads", body: "Marketers make feed and story ads with room left at the top for a headline. Create the same image in 1:1, 4:5 and 9:16, and use GPT Image 2.5 Sunburst when the ad carries fine print or label text." },
      { title: "Product photos", body: "Ecommerce sellers put a product in new scenes for the catalog without a shoot. Nano Banana 2.1 takes up to 14 reference photos, so the product and its label stay the same, and it outputs at up to 4K." },
      { title: "Social posts", body: "Social teams produce on-brand images for daily posting from a text prompt. Seedream is the low-cost pick, and new accounts can try Seedream 4.5 and Seedream 5.0 lite with the free credits they get on sign-up." },
    ],
    faq: [
      { q: "Is there a free AI image generator?", a: `Yes, on two models. The ${SIGNUP_CREDITS} free credits new accounts get work on Seedream 4.5 and Seedream 5.0 lite, which handle product sets, ad images and infographics. Nano Banana 2.1, GPT Image 2.5 Sunburst, Seedream 5.5 and Nano Banana Pro are not covered by free credits.` },
      { q: "Which AI image generator is best for text in images?", a: "GPT Image 2.5 Sunburst is built for fine print and labels; Nano Banana 2.1 is a fast all-rounder with sharp text." },
      { q: "Is there an AI image generator with a reference image?", a: "Yes. Add an existing image as a reference and the model follows it; Nano Banana 2.1 takes up to 14 reference images in one prompt." },
      { q: "What aspect ratios can I make?", a: "Nano Banana 2.1 covers 14 aspect ratios, including 1:1, 4:5, 9:16, 16:9 and 21:9. GPT Image 2.5 Sunburst outputs 1:1, 3:4, 4:3, 4:5, 9:16 and 16:9." },
      { q: "Can I generate 4K images?", a: "Yes. Nano Banana 2.1 and Nano Banana Pro output at 1K, 2K or 4K. Seedream 5.5 goes up to 2K." },
      { q: "Nano Banana 2.1 vs GPT Image 2.5 Sunburst: which should I use?", a: "Nano Banana 2.1 is the fast all-rounder with sharp text and consistent characters, with up to 14 reference images and 4K output. GPT Image 2.5 Sunburst is the pick for fine print, labels and detailed portraits, with up to 16 reference images." },
      { q: "How do I write a good image prompt?", a: "Say the subject, setting, light and framing, and put any on-image text in quotes. Add your product photo as a reference and say \"keep the label exactly the same\"." },
      { q: "Can I make images with a transparent background?", a: "Yes. Seedream 5.5 and GPT Image 2.5 or 2.6 (Flare or Sunburst) output images with a real transparent background (PNG with an alpha channel), so there is no separate cutout step." },
      { q: "Is there a watermark on generated images?", a: "Yes on the Free plan: work made on Free carries a watermark. Starter, Pro and Ultra remove it." },
      { q: "Can I use an AI image generator with no sign up or login?", a: `No. You need to log in to a BuzzVideo account to generate images, and creating one is free. New accounts get ${SIGNUP_CREDITS} free credits that work on Seedream 4.5 and Seedream 5.0 lite.` },
      { q: "Can I use Google's AI image generator on BuzzVideo?", a: "Yes. Nano Banana 2.1 and Nano Banana Pro are Google's image models, and both run on BuzzVideo next to GPT Image 2.5 Sunburst and Seedream 5.5." },
    ],
    related: ["ai-image-editor", "ai-product-photography", "remove-background"],
    metaTitle: "AI Image Generator from Text: Free to Try | BuzzVideo",
    metaDescription: "AI image generator from text or reference photos: make ad-ready product shots and posts with the label kept intact. Free credits on sign-up for Seedream 4.5.",
  },
  {
    slug: "ai-image-editor",
    name: "AI Image Editor",
    group: "Image",
    h1: "AI Image Editor",
    h1Tail: "edit a photo by typing the change",
    lead: "BuzzVideo's AI Image Editor edits a photo from a plain-text prompt: swap a prop, change a color, fix a small detail or update the text on a label while the product stays exactly the same. Make seasonal variants, clean up product shots and refresh ad creatives in seconds, using Nano Banana 2.1, GPT Image 2.5 Sunburst and Seedream 5.5.",
    mode: "image",
    prompt: "Change [the mug to sage green] and [remove the sticker on the lid]. Keep everything else exactly the same.",
    models: ["nano-banana-2-1", "gpt-image-2-5-sunburst", "seedream-5-5"],
    definition: {
      q: "What is an AI image editor?",
      a: "An AI image editor, or AI photo editor, changes specific things in a photo from a text prompt, such as a prop, a color, a small detail or a line of text, while the rest stays the same. On BuzzVideo you make these edits with Nano Banana 2.1, GPT Image 2.5 Sunburst or Seedream 5.5.",
    },
    steps: [
      { title: "Upload the photo", body: "Any product or lifestyle photo." },
      { title: "Describe the change", body: "Say what changes and what must stay the same." },
      { title: "Create", body: "Compare versions and keep the one you want." },
    ],
    uses: [
      { title: "Swap props", body: "Marketers add holiday props or replace a cup, plant or book in a photo they already have, which gives seasonal variants of an ad creative. Nano Banana 2.1 takes up to 14 reference images, so you can upload the exact prop to place." },
      { title: "Recolor products", body: "Ecommerce sellers show one product in every color without shooting each one. Type the change, such as the mug to sage green, and say that everything else stays the same. Output goes up to 4K on Nano Banana 2.1." },
      { title: "Fix details and text", body: "Designers remove a sticker, tidy a set or correct the words on a sign or label. Quote the old and new words in the prompt, use GPT Image 2.5 Sunburst for fine print, and check the spelling in the result." },
    ],
    faq: [
      { q: "Is there a free AI image editor?", a: `Partly. The ${SIGNUP_CREDITS} free credits new accounts get work on Seedream 4.5 and Seedream 5.0 lite, which both take reference images, so you can try prompt edits there. Nano Banana 2.1, GPT Image 2.5 Sunburst and Seedream 5.5 are not covered by free credits.` },
      { q: "Can I change the text in an image?", a: "Yes. Quote the old and new words in the prompt and say everything else stays the same. GPT Image 2.5 Sunburst is built for fine print and labels; check the spelling in the result." },
      { q: "Should I use the image editor to change the background?", a: "You can, but for a whole new scene behind your product the AI Background Generator is set up for that. The image editor is for props, colors, details and text." },
      { q: "How do I use the AI photo editor?", a: "Upload the photo and type what should change and what must stay the same, for example \"Change the mug to sage green. Keep everything else exactly the same.\" Then compare versions and keep the one you want." },
      { q: "What is the best AI image editor model?", a: "Nano Banana 2.1 for fast edits that keep the product consistent, GPT Image 2.5 Sunburst for fine print and labels, and Seedream 5.5 or GPT Image 2.5 or 2.6 when you need a transparent background." },
      { q: "Can I combine several photos in one edit?", a: "Yes. Nano Banana 2.1 takes up to 14 reference images and GPT Image 2.5 Sunburst up to 16, so you can add the prop or product you want placed in the photo." },
      { q: "Can I remove an object from a photo?", a: "Yes. Say what to remove, such as a sticker on the lid, and that everything else stays exactly the same." },
      { q: "What resolution is the edited image?", a: "Up to 4K on Nano Banana 2.1 and up to 2K on Seedream 5.5. GPT Image 2.5 Sunburst has five quality levels, from Low to Max." },
      { q: "Can I edit a video the same way?", a: "Not here: this tool edits still images only." },
      { q: "Can I use the AI image editor with no sign up?", a: `No. You need a BuzzVideo account to edit an image, and creating one is free. New accounts get ${SIGNUP_CREDITS} free credits that work on Seedream 4.5 and Seedream 5.0 lite.` },
      { q: "Is the AI image editor online?", a: "Yes. BuzzVideo is a web product, so you edit photos in your browser with nothing to install." },
    ],
    related: ["ai-image-generator", "remove-background", "ai-product-photography"],
    metaTitle: "AI Image Editor with Prompt: Edit Photos by Text | BuzzVideo",
    metaDescription: "AI image editor with prompt: type the change to swap a prop, recolor a product or update label text while the rest stays. Nano Banana 2.1 and GPT Image.",
  },
  {
    slug: "remove-background",
    name: "Remove Background",
    group: "Image",
    h1: "Remove Background",
    h1Tail: "clean product cutouts in one step",
    lead: "BuzzVideo's Remove Background tool removes the background from an image online: it cuts your product out of a photo and returns a clean result on a transparent or pure white background. Get a transparent PNG with Seedream 5.5 or GPT Image 2.5 or 2.6 (Flare or Sunburst), or a pure white version with Nano Banana 2.1 for Amazon and Shopify listings, ad banners, or a new scene behind the product.",
    mode: "image",
    prompt: "Remove the background from this product photo and give me a clean cutout on transparent and pure white backgrounds.",
    models: ["seedream-5-5", "gpt-image-2-5-flare", "nano-banana-2-1"], /* 2026-11-26 GPT Image 2.5 / 2.6 也能出透明背景(接口有 background=transparent),补上一个 */
    definition: {
      q: "How do you remove a background from a photo with AI?",
      a: "Upload the photo and ask for a cutout. Seedream 5.5 and GPT Image 2.5 or 2.6 (Flare or Sunburst) can return the product on a transparent background (PNG), and any image model can put it on pure white, the format most marketplaces ask for. On BuzzVideo you can get both versions from the same request.",
    },
    steps: [
      { title: "Upload the photo", body: "A product photo with clear edges gives the cleanest cut." },
      { title: "Choose the output", body: "Transparent, pure white, or a new scene behind it." },
      { title: "Download", body: "Save the PNG or keep editing in Canvas." },
    ],
    uses: [
      { title: "Amazon and Shopify listings", body: "Sellers get white-background main images, the format most marketplaces ask for. Nano Banana 2.1 puts the product on pure white, and the same request can also return a transparent version." },
      { title: "Ad banners", body: "Designers get a transparent PNG cutout to drop onto any banner or layout. Seedream 5.5 and GPT Image 2.5 or 2.6 (Flare or Sunburst) return a transparent background, and a photo with clear edges gives the cleanest cut." },
      { title: "New scenes", body: "Marketers remove the background, then ask for a new scene behind the product instead of transparent or white. There is no manual masking and nothing to install, and you can keep editing the result in Canvas." },
    ],
    faq: [
      { q: "How do I remove a background and get a transparent PNG?", a: "Pick Seedream 5.5 or one of the GPT Image 2.5 or 2.6 models, which support transparent backgrounds, and ask for a transparent cutout; the result downloads as a PNG." },
      { q: "How do I make a background white?", a: "Ask for a pure white background. You can get transparent and white versions from the same request." },
      { q: "Can I remove the background from an image for free?", a: `Partly. Transparent cutouts use Seedream 5.5 or GPT Image 2.5 or 2.6, which free credits do not cover. A pure white background on Seedream 4.5 or Seedream 5.0 lite works with the ${SIGNUP_CREDITS} free credits new accounts get.` },
      { q: "Which AI model removes backgrounds best?", a: "For a transparent background, use Seedream 5.5 or GPT Image 2.5 or 2.6 (Flare or Sunburst); they are the models that output a real alpha channel. For a pure white background, Nano Banana 2.1 or any other image model works." },
      { q: "What kind of photo gives the cleanest cutout?", a: "A product photo with clear edges gives the cleanest cut." },
      { q: "Is a white background right for Amazon and Shopify listings?", a: "Yes. Pure white is the format most marketplaces ask for in main images, and you can get it from the same request as the transparent cutout." },
      { q: "Can I put my product on a new background?", a: "Yes. Ask for a new scene behind the product instead of transparent or white, or use the AI Background Generator, which is set up for that." },
      { q: "What resolution is the cutout?", a: "Seedream 5.5 outputs at 1K, 1.5K or 2K; the GPT Image models have five quality levels from Low to Max." },
      { q: "Can I remove the background from a video?", a: "Not for your own footage yet. This tool works on still images." },
      { q: "Can I remove a background online without Photoshop?", a: "Yes. Upload the photo in your browser and ask for a cutout; there is no software to install and no manual masking." },
      { q: "Do I need to sign up to remove a background?", a: "Yes. You need a BuzzVideo account to generate a cutout, and creating one is free." },
    ],
    related: ["ai-image-editor", "ai-product-photography", "ai-image-generator"],
    metaTitle: "Remove Background from Image: Transparent PNG | BuzzVideo",
    metaDescription: "Remove background from an image online: get a transparent PNG or a pure white version of your product photo for marketplaces and ads on BuzzVideo.",
  },
  {
    slug: "ai-product-photography",
    name: "AI Product Photography",
    group: "Image",
    h1: "AI Product Photography",
    h1Tail: "studio shots without the studio",
    lead: "BuzzVideo's AI Product Photography places your real product in any setting from one packshot, from marble and citrus to a bathroom shelf or a beach, with the label kept exactly as it is. Make lifestyle images for Amazon, Shopify and Etsy listings and fresh ad scenes with Nano Banana 2.1, GPT Image 2.5 Sunburst and Seedream 5.5.",
    mode: "marketing",
    prompt: "Shoot my product on [white marble] with [fresh citrus], soft daylight. Keep the label exactly the same.",
    models: ["nano-banana-2-1", "gpt-image-2-5-sunburst", "seedream-5-5"],
    media: {
      kind: "image",
      src: `${POSTER}/skill-product-photos.jpg`,
      aspect: "4:5",
      alt: "A vitamin C serum bottle on a stone counter next to folded towels and a plant",
      caption: "A product photo set made from one packshot.",
      source: "MCP Skill 示例 product-photos 封面",
    },
    definition: {
      q: "What is AI product photography?",
      a: "AI product photography puts your real product into a generated scene instead of a studio set. You upload a packshot, describe the surface, props and light, and an AI product photography generator returns the finished image. The result depends on keeping the product itself unchanged, which is why BuzzVideo uses your photo as a reference.",
    },
    steps: [
      { title: "Upload a packshot", body: "One clear photo of the product." },
      { title: "Describe the scene", body: "Surface, props, light and mood." },
      { title: "Get a set", body: "Ask for several angles or settings in one go." },
    ],
    uses: [
      { title: "Amazon, Shopify and Etsy listings", body: "Sellers turn one packshot into lifestyle images for marketplace listings. Nano Banana 2.1 covers 14 aspect ratios, including 1:1 for listings, at up to 4K, and the label stays as it is in your photo." },
      { title: "Ad scenes for each campaign", body: "Marketers describe a surface, props, light and mood, such as white marble with fresh citrus in soft daylight, and get a fresh scene per campaign. Ask for several angles or settings in one go, in 4:5 for feeds or 9:16 for stories." },
      { title: "Fashion and jewelry", body: "Fashion and jewelry brands pair AI Product Photography with Virtual Try-On to get on-model shots. Add more angles as references if you have them: GPT Image 2.5 Sunburst takes up to 16 photos and Nano Banana 2.1 up to 14." },
    ],
    faq: [
      { q: "Is AI replacing product photography?", a: "Partly. For catalog variations and social content it often does; for hero campaigns many brands still shoot and use AI to extend the set. The product itself should always come from a real photo." },
      { q: "Can I try AI product photography for free?", a: `Yes, with Seedream 4.5, which is built for consistent product sets with accurate text; it works with the ${SIGNUP_CREDITS} free credits new accounts get, as does Seedream 5.0 lite. Nano Banana 2.1, GPT Image 2.5 Sunburst and Seedream 5.5 are not covered by free credits.` },
      { q: "How do I do product photography with AI?", a: "Upload one clear packshot, describe the surface, props, light and mood, and generate. You can ask for several angles or settings in one go." },
      { q: "How many photos do I need to upload?", a: "One clear packshot is enough. You can add more angles if you have them: Nano Banana 2.1 takes up to 14 reference photos and GPT Image 2.5 Sunburst up to 16." },
      { q: "Will the label on my product stay accurate?", a: "Yes in most cases, because your real photo is the reference for the product. GPT Image 2.5 Sunburst is built for fine print and labels; check small text before you publish." },
      { q: "What sizes can I get for listings and social?", a: "Nano Banana 2.1 covers 14 aspect ratios, including 1:1 for listings, 4:5 for feeds and 9:16 for stories, at up to 4K." },
      { q: "Can I get a white or transparent background instead of a scene?", a: "Yes. Use Remove Background: Seedream 5.5 and GPT Image 2.5 or 2.6 (Flare or Sunburst) return a transparent PNG, and any image model can put the product on pure white." },
      { q: "Can I show clothes or jewelry on a model?", a: "Yes. Pair AI Product Photography with Virtual Try-On for on-model shots of fashion and jewelry." },
      { q: "Is there a watermark on the photos?", a: "Yes on the Free plan: work made on Free carries a watermark. Starter, Pro and Ultra remove it." },
      { q: "Can AI do product photography?", a: "Yes, for most catalog and social shots. AI places your real product into a generated scene, and the product itself stays unchanged because your photo is used as a reference." },
      { q: "What are good AI product photography prompts?", a: "Name the surface, the props, the light and the mood, and say what must not change. For example: shoot my product on white marble with fresh citrus, soft daylight, keep the label exactly the same." },
    ],
    related: ["ai-image-generator", "remove-background", "ai-product-video-generator"],
    metaTitle: "AI Product Photography from One Photo | BuzzVideo",
    metaDescription: "AI product photography from one packshot: place your real product in any scene with the label kept exactly as it is, for Amazon, Shopify and Etsy listings.",
  },

  /* ───────── Audio ───────── */
  {
    slug: "ai-voice-over",
    name: "AI Voice Over",
    group: "Audio",
    h1: "AI Voice Over",
    h1Tail: "natural voiceover for every ad",
    lead: "BuzzVideo's AI Voice Over turns a pasted script into natural narration, in a preset voice or your own cloned voice, and places it straight onto your video. Make voiceovers for product ads, explainers, YouTube videos, faceless Shorts and TikToks, or localized versions in other languages, with Seed Audio 1.0, MiniMax Speech 2.8 HD, ElevenLabs v3 or Gemini 3.8 Flash TTS.",
    mode: "audio",
    prompt: "Voice over my [15s] product ad in a [confident, upbeat] voice, paced to fit the video: [Paste your script here]",
    models: ["seed-audio-1-0", "minimax-speech-2-8-hd"],
    nextModels: ["elevenlabs-eleven-v3", "gemini-3-8-flash-tts"],
    definition: {
      q: "What is an AI voice over?",
      a: "An AI voice over is narration for a video, generated from text instead of recorded in a booth. On BuzzVideo it is made with Seed Audio 1.0, ElevenLabs, MiniMax Speech or Gemini TTS and placed on your clips in Canvas.",
    },
    steps: [
      { title: "Paste the script", body: "Add the lines and how they should sound." },
      { title: "Pick a voice", body: "Choose a preset voice or use your own cloned voice." },
      { title: "Add it to the video", body: "Use it in Canvas or let the Marketing Agent cut it to your clips." },
    ],
    uses: [
      { title: "Ad narration", body: "Marketers paste a script and get a voice paced to the cut of a product or explainer ad. Describe the delivery, such as confident and upbeat for a 15-second ad, then place the result on the clip in Canvas." },
      { title: "YouTube videos and faceless Shorts", body: "Creators narrate YouTube videos, Shorts and TikToks without recording in a booth. Seed Audio 1.0 can put voiceover, background music and sound effects in one track, and it works with the free credits new accounts get." },
      { title: "Founder-voiced ads", body: "Founders clone their voice from a short, clean sample with Seed Audio 1.0 and use it as the narrator on every new ad. The Marketing Agent can cut each voiceover to your clips, so a new ad needs a script, not a recording session." },
      { title: "Localized versions", body: "Brands voice the same ad again for another market. Seed Audio 1.0 speaks 21 languages, and MiniMax Speech 2.8 HD adds expressive speech in 40+ languages with emotion, speed, pitch and volume controls." },
    ],
    faq: [
      { q: "How do I add an AI voice over to a video?", a: "Make the voiceover from your script, then place it on your clip in Canvas, or ask the Marketing Agent to cut it to your clips." },
      { q: "Is there a free AI voice over generator?", a: `Yes. Seed Audio 1.0, the voice model behind AI Voice Over, works with the ${SIGNUP_CREDITS} free credits new accounts get, so you can narrate your first ads without a plan. After that it is billed per second of audio.` },
      { q: "Can I use my own voice for the voice over?", a: "Yes. Clone your voice from a short, clean sample with Seed Audio 1.0 and use it as the narrator on every ad." },
      { q: "How much does an AI voice over cost?", a: "Seed Audio 1.0 costs 0.5 credits per second of audio, so a 30-second voiceover costs 15 credits. The price shows before you create." },
      { q: "What languages can the voice over be in?", a: "Seed Audio 1.0 speaks 21 languages, and MiniMax Speech 2.8 HD adds expressive speech in 40+ languages." },
      { q: "Which AI voice models can I use?", a: "Seed Audio 1.0, MiniMax Speech 2.8 HD, ElevenLabs v3 and Gemini 3.8 Flash TTS. MiniMax Speech 2.8 HD has 17 preset voices, and ElevenLabs v3 speaks 70+ languages." },
      { q: "Can I control the tone and pace of the voice?", a: "Yes. Describe the delivery in the prompt, such as a confident, upbeat voice paced to a 15-second ad. MiniMax Speech 2.8 HD also has emotion, speed, pitch and volume controls." },
      { q: "Can I add music under the voice over?", a: "Yes. Seed Audio 1.0 can put voiceover, background music and sound effects in one track, or you can make them separately and mix them in Canvas." },
      { q: "How do I make an AI voice over?", a: "Paste your script, say how it should sound and pick a preset voice or your own cloned voice. The AI voice over generator returns the narration, ready to place on your video." },
      { q: "Is there an AI voice over app?", a: "No. BuzzVideo is a web product, not an app: you make voiceovers in your browser, with nothing to install." },
      { q: "Can I use AI voice over for YouTube videos?", a: "Yes. Make the narration from your script and place it on the video in Canvas. It suits YouTube videos, Shorts and faceless channels where no one records in a booth." },
    ],
    related: ["ai-voice-generator", "text-to-speech", "ai-voice-clone", "faceless-video-generator", "ai-podcast-generator"], /* 2026-11-25 指向新的主词页 */
    metaTitle: "AI Voice Over Generator for Videos: Free to Try | BuzzVideo",
    metaDescription: "AI voice over generator: turn a script into natural narration in a preset or cloned voice and place it on your video. Free credits cover Seed Audio 1.0.",
  },
  {
    slug: "text-to-speech",
    name: "Text to Speech",
    group: "Audio",
    h1: "Text to Speech",
    h1Tail: "AI voices for videos and ads",
    lead: "BuzzVideo's Text to Speech is an online AI voice generator that converts written text into natural spoken audio, in the tone and language you choose. Paste a script, pick a voice and download the audio file for podcasts, tutorials, product explainers or script previews before booking a voice actor, powered by Seed Audio 1.0 in 21 languages.",
    mode: "audio",
    prompt: "Convert this text to speech in [English] with a [calm, clear] voice, as a downloadable audio file: [Paste your text here]",
    models: ["seed-audio-1-0", "minimax-speech-2-8-hd"],
    nextModels: ["elevenlabs-eleven-v3", "gemini-3-8-flash-tts"],
    definition: {
      q: "What is AI text to speech?",
      a: "AI text to speech (TTS) converts written text into spoken audio with a natural-sounding voice. BuzzVideo uses Seed Audio 1.0, MiniMax Speech 2.8 HD, ElevenLabs v3 and Gemini 3.8 Flash TTS.",
    },
    steps: [
      { title: "Type or paste text", body: "Add the script and any delivery notes." },
      { title: "Choose the voice", body: "Pick tone and language." },
      { title: "Download or use it", body: "Get the audio file or place it on a video." },
    ],
    uses: [
      { title: "Script previews", body: "Writers and producers hear a script read aloud before they book a voice actor or film. Add delivery notes such as calm and clear, or use the emotion, speed and pitch controls on MiniMax Speech 2.8 HD." },
      { title: "Many languages", body: "Teams turn the same text into audio for each market they sell in. Seed Audio 1.0 speaks 21 languages, MiniMax Speech 2.8 HD covers 40+ and ElevenLabs v3 covers 70+. Pick the language when you choose the voice." },
      { title: "Tutorials and lessons", body: "Teachers, students and course creators convert written lessons and how-to steps into audio files. Download the result as MP3 or WAV from your assets, or place it on a video in Canvas." },
      { title: "Podcasts and dialogue", body: "Podcasters and marketers script a two-person conversation and get it back as one file. Seed Audio 1.0 voices more than one speaker in a single file, which suits podcast-style clips and dialogue ads." },
    ],
    faq: [
      { q: "Is text to speech free online?", a: `Yes, to start. Seed Audio 1.0 works with the ${SIGNUP_CREDITS} free credits on sign-up, enough for up to ${SIGNUP_CREDITS * 2} seconds of speech, and costs 0.5 credits per second of audio after that.` },
      { q: "Can I download the audio?", a: "Yes. Download it as MP3 or WAV from your assets, or use it directly in Canvas." },
      { q: "How many languages does it support?", a: "Seed Audio 1.0 speaks 21 languages and can voice more than one speaker in a single file. MiniMax Speech 2.8 HD adds expressive speech in 40+ languages." },
      { q: "Which text to speech voices are available?", a: "Seed Audio 1.0 has preset voices and can clone your own, and MiniMax Speech 2.8 HD has 17 preset voices. ElevenLabs v3 and Gemini 3.8 Flash TTS are also available, with ElevenLabs v3 covering 70+ languages." },
      { q: "Can I control emotion, speed and pitch?", a: "Yes. MiniMax Speech 2.8 HD has emotion, speed, pitch and volume controls, and with Seed Audio 1.0 you describe the delivery in the prompt, such as calm and clear." },
      { q: "Can it read a dialogue with two voices?", a: "Yes. Seed Audio 1.0 can voice more than one speaker in a single file, which suits dialogue ads and podcast-style clips." },
      { q: "Can I use my own voice for text to speech?", a: "Yes. Upload a short, clean recording of one speaker and Seed Audio 1.0 reads your text in that voice. Only clone voices you have permission to use." },
      { q: "Text to speech vs AI voice over: what is the difference?", a: "Text to Speech turns any text into an audio file you download. AI Voice Over paces the narration to a video and places it on your clips in Canvas. Both run on Seed Audio 1.0." },
      { q: "How do I use text to speech?", a: "Type or paste your text, pick the voice, tone and language, and create. Then download the audio as MP3 or WAV, or place it on a video in Canvas." },
      { q: "Is there a text to speech app?", a: "No. BuzzVideo is a web product, not an app: the text to speech generator runs online in your browser, with nothing to install." },
      { q: "Text to speech vs speech to text: what is the difference?", a: "Text to speech turns written text into spoken audio. Speech to text does the reverse and transcribes spoken audio into text. This page is text to speech." },
    ],
    related: ["ai-voice-over", "ai-voice-clone", "ai-music-generator"],
    metaTitle: "Text to Speech AI Online: Free to Try | BuzzVideo",
    metaDescription: "Text to speech online: convert text to natural AI voices in 21 languages and download MP3 or WAV. Free credits on sign-up, with Seed Audio 1.0 on BuzzVideo.",
  },
  {
    slug: "ai-voice-clone",
    name: "AI Voice Clone",
    group: "Audio",
    h1: "AI Voice Clone",
    h1Tail: "your voice, any script",
    lead: "BuzzVideo's AI Voice Clone is an AI voice cloner that learns a voice from a short, clean recording and uses it to read any new script you write. Put a founder's voice on every ad, keep one narrator across a series or have the same voice read a translated script, powered by Seed Audio 1.0. Only clone voices you have permission to use.",
    mode: "audio",
    prompt: "Read my script in the voice from @Audio1: [Paste your script here]",
    models: ["seed-audio-1-0"],
    nextModels: ["voice-replication-2-0"],
    definition: {
      q: "What is AI voice cloning?",
      a: "AI voice cloning learns a voice from a sample recording and uses it to say new text. Only clone voices you have permission to use. On BuzzVideo, Seed Audio 1.0 clones a voice from a short, clean sample and reads any script in it.",
    },
    steps: [
      { title: "Upload a sample", body: "A short recording of one speaker with no music or background noise." },
      { title: "Paste the script", body: "Write what the cloned voice should say." },
      { title: "Create", body: "Use the result as a voiceover on any video." },
    ],
    uses: [
      { title: "Founder-voiced ads", body: "Founders upload a short recording of their own voice and put it on every ad without recording each one. Reference the sample as @Audio1, paste the script, and Seed Audio 1.0 reads it at 0.5 credits per second of audio." },
      { title: "Consistent narration", body: "Creators and brands keep one narrator across a whole series, including faceless videos and AI spokesperson clips. A sample of one speaker with no music or background noise gives the closest match." },
      { title: "Other languages", body: "Teams have the same voice read a translated script for a new market. Seed Audio 1.0 speaks 21 languages, and Voice Replication 2.0 clones from a reference recording in Chinese, English, Japanese, Spanish and more." },
    ],
    faq: [
      { q: "How do I clone my voice with AI?", a: "Upload a clean sample in Audio, reference it as @Audio1 in the prompt and paste your script. Seed Audio 1.0 does the cloning." },
      { q: "Is there a free AI voice cloner?", a: `Yes, to start. It runs on Seed Audio 1.0, which works with the ${SIGNUP_CREDITS} free credits new accounts get.` },
      { q: "Is AI voice cloning legal?", a: "Yes, when you clone your own voice or one you have written permission for. Cloning someone else's voice without consent can break platform rules and the law in many places." },
      { q: "What makes a good voice sample?", a: "A short recording of one speaker with no music or background noise. A clean sample gives the closest match." },
      { q: "Can my cloned voice speak other languages?", a: "Yes. Paste a translated script and the cloned voice reads it; Seed Audio 1.0 speaks 21 languages." },
      { q: "How much does AI voice cloning cost?", a: "Audio made with Seed Audio 1.0 is billed at 0.5 credits per second, so a 30-second read in your cloned voice costs 15 credits. The price shows before you create." },
      { q: "Can I use my cloned voice in videos?", a: "Yes. Use the result as a voiceover on any video in Canvas, as the narrator of a faceless video or as the voice of an AI spokesperson." },
      { q: "Which voice cloning models does BuzzVideo have?", a: "Seed Audio 1.0, which takes up to 3 reference voices in one request and reads any script in them, and Voice Replication 2.0, which clones a voice from a reference recording in Chinese, English, Japanese, Spanish, Indonesian, Portuguese and more." },
      { q: "Can I use the AI voice clone with no sign up?", a: `No. You need a BuzzVideo account to clone a voice, and creating one is free. New accounts get ${SIGNUP_CREDITS} free credits that work on Seed Audio 1.0.` },
      { q: "What is the best AI voice cloner?", a: "Pick one that matches the voice from a short sample and lets you use it straight on your videos. On BuzzVideo, Seed Audio 1.0 clones from a short, clean recording and takes up to 3 reference voices in one request." },
      { q: "Can I use my AI voice clone for text to speech?", a: "Yes. Reference your sample in the prompt and paste any text; Seed Audio 1.0 reads it in the cloned voice." },
    ],
    related: ["ai-voice-over", "text-to-speech", "ai-spokesperson"],
    metaTitle: "AI Voice Clone & Voice Cloner: Free to Try | BuzzVideo",
    metaDescription: "AI voice clone tool: copy a voice from a short sample and have the AI voice cloner read any script as a voiceover. Seed Audio 1.0 and Voice Replication 2.0.",
  },
  {
    slug: "ai-music-generator",
    name: "AI Music Generator",
    group: "Audio",
    h1: "AI Music Generator",
    h1Tail: "background music for every ad",
    lead: "BuzzVideo's AI Music Generator composes background music from text, a short description of mood, genre and tempo, sized to the length of your ad. Make soundtracks that end on the last shot, one recognizable track for a whole campaign or original music for social posts with Seed Audio 1.0, plus songs with sung lyrics from Lyria 3.5 and ElevenLabs Music v2.5.",
    mode: "music",
    prompt: "[Upbeat, warm] instrumental background music for a [30s] [skincare] ad that builds gently and ends cleanly on the last shot, no lyrics.",
    models: ["seed-audio-1-0"],
    nextModels: ["elevenlabs-music-v2-5", "lyria-3-5", "mureka-v9-5", "minimax-music-3"],
    definition: {
      q: "What is an AI music generator?",
      a: "An AI music generator composes instrumental music from a text description of mood, genre and tempo. BuzzVideo makes background music for ads with Seed Audio 1.0, ElevenLabs Music v2.5, Lyria 3.5, Mureka V9.5 and MiniMax Music 3.",
    },
    steps: [
      { title: "Describe the track", body: "Mood, genre, tempo and length." },
      { title: "Match the ad", body: "Set the length to your video so the track ends on the last shot." },
      { title: "Add it to the video", body: "Place it under your clips in Canvas." },
    ],
    uses: [
      { title: "Ad soundtracks", body: "Marketers describe the mood, genre and tempo and get a track sized to the ad. Say the length in the prompt, such as 15 or 30 seconds, and the music builds and ends cleanly on the last shot." },
      { title: "Under a voiceover", body: "Video editors ask for a calm instrumental bed with no lyrics for explainers and tutorials. Seed Audio 1.0 can also put the voiceover and the music in one track, so the two are mixed together." },
      { title: "Social content", body: "Creators make original background tracks for social posts instead of reusing trending sounds. Download as MP3 or WAV, or use Lyria 3.5 and ElevenLabs Music v2.5 when the post needs sung vocals and lyrics." },
      { title: "Music for commercial use", body: "Brands and agencies use the tracks in paid ads and client work, since everything generated on BuzzVideo can be used commercially on every plan. A 30-second track on Seed Audio 1.0 costs 15 credits, and the price shows before you create." },
    ],
    faq: [
      { q: "Can the music match my ad length?", a: "Yes. Say the length in the prompt, such as 15 or 30 seconds, so the track ends on the last shot." },
      { q: "Will the music clash with my voiceover?", a: "Not if you ask for an instrumental track with no lyrics. Seed Audio 1.0 can also put the voiceover and the music in one track, so they are mixed together." },
      { q: "Is there a free AI music generator?", a: `Yes. Background music is made with Seed Audio 1.0, which works with the ${SIGNUP_CREDITS} free credits new accounts get and is billed per second of audio after that.` },
      { q: "Is there an AI music generator with vocals?", a: "Yes. Lyria 3.5 and ElevenLabs Music v2.5 make tracks with sung vocals and lyrics; for songs written from a brief, see the AI Song Generator." },
      { q: "How do I describe the music I want?", a: "Give the mood, genre, tempo and length, for example upbeat, warm instrumental background music for a 30-second skincare ad that ends cleanly on the last shot." },
      { q: "How much does AI music cost?", a: "Seed Audio 1.0 costs 0.5 credits per second of audio, so a 30-second track costs 15 credits. The price shows before you create." },
      { q: "Can I download the music?", a: "Yes. Seed Audio 1.0 outputs MP3 or WAV, or you can place the track under your clips in Canvas." },
      { q: "Which AI music models can I use?", a: "Seed Audio 1.0, ElevenLabs Music v2.5 (tracks from 3 seconds to 10 minutes, instrumental or with lyrics), Lyria 3.5 (full songs of about 2 minutes), Mureka V9.5 and MiniMax Music 3." },
      { q: "Can I use an AI music generator with no sign up?", a: `No. You need a BuzzVideo account to make music, and creating one is free. New accounts get ${SIGNUP_CREDITS} free credits that work on Seed Audio 1.0.` },
      { q: "Can I use the AI music generator for commercial use?", a: "Yes. Everything you generate on BuzzVideo can be used commercially on every plan, including Free." },
      { q: "How do AI music generators work?", a: "You describe the mood, genre, tempo and length in text, and the model composes a new track to match. On BuzzVideo you then place it under your clips in Canvas or download it." },
      { q: "Is there an AI music generator app?", a: "No. BuzzVideo is a web product, not an app: you make music in your browser, with nothing to install." },
    ],
    related: ["ai-sound-effects-generator", "ai-voice-over", "text-to-speech", "ai-lyrics-generator"],
    metaTitle: "AI Music Generator from Text: Music for Ads | BuzzVideo",
    metaDescription: "AI music generator from text: describe the mood, genre and tempo and get background music sized to your video, or songs with vocals from Lyria 3.5.",
  },
  {
    slug: "ai-sound-effects-generator",
    name: "AI Sound Effects Generator",
    group: "Audio",
    h1: "AI Sound Effects Generator",
    h1Tail: "the exact sound, from a sentence",
    lead: "BuzzVideo's AI Sound Effects Generator turns a one-line description, such as a whoosh for a product reveal or a can opening, into a sound effect sized to your clip. Make reveal hits, transitions, room tone and handling sounds for UGC and product ads with Seed Audio 1.0, then drop them on the timeline in Canvas.",
    mode: "sfx",
    prompt: "A short [whoosh] sound for a [product reveal].",
    models: ["seed-audio-1-0"],
    nextModels: ["elevenlabs-sound-effects-v3"],
    definition: {
      q: "How do you make sound effects with AI?",
      a: "Describe the sound and its length; the model generates it. On BuzzVideo, Seed Audio 1.0 and ElevenLabs Sound Effects v3 (up to 30 seconds, loopable) make sound effects.",
    },
    steps: [
      { title: "Describe the sound", body: "What it is, where it happens and how it should feel." },
      { title: "Set the length", body: "Match it to the moment in your clip." },
      { title: "Place it", body: "Drop it on the timeline in Canvas." },
    ],
    uses: [
      { title: "Product reveals", body: "Video editors generate whooshes, pops and clicks that land on the cut of a product reveal. Set the length to the moment in the clip. A 2-second whoosh on Seed Audio 1.0 costs 1 credit." },
      { title: "UGC realism", body: "Marketers add room tone and handling sounds, such as a can opening, to UGC and product ads. Describe what the sound is, where it happens and how it should feel, and Seed Audio 1.0 returns it as MP3 or WAV." },
      { title: "Transitions", body: "Editors make risers and hits for the moments between scenes, then drop them on the timeline in Canvas. For longer beds, ElevenLabs Sound Effects v3 makes loopable effects up to 30 seconds." },
    ],
    faq: [
      { q: "Is there an app for AI sound effects?", a: "No app is needed. BuzzVideo makes sound effects in the browser alongside your videos, with nothing to install." },
      { q: "Can sound effects loop?", a: "Yes. ElevenLabs Sound Effects v3 makes loopable effects up to 30 seconds." },
      { q: "Is there a free AI sound effects generator?", a: `Yes. Sound effects are made with Seed Audio 1.0, which works with the ${SIGNUP_CREDITS} free credits new accounts get and is billed per second of audio after that.` },
      { q: "How much does an AI sound effect cost?", a: "Seed Audio 1.0 costs 0.5 credits per second of audio, so a 2-second whoosh costs 1 credit. The price shows before you create." },
      { q: "How do I write a prompt for a sound effect?", a: "Say what the sound is, where it happens and how it should feel, plus the length, for example a short whoosh for a product reveal." },
      { q: "What kinds of sounds can it make?", a: "Whooshes, pops and clicks for product reveals, risers and hits for transitions, and room tone and handling sounds for UGC-style clips." },
      { q: "Can I download the sound effect?", a: "Yes. Seed Audio 1.0 outputs MP3 or WAV, or you can drop the sound on the timeline in Canvas." },
      { q: "Can I get sound effects, music and voiceover in one track?", a: "Yes. Seed Audio 1.0 can put voiceover, background music and sound effects in one track, or you can make them separately and mix them in Canvas." },
      { q: "What is an AI sound effects generator?", a: "An AI sound effects generator makes a sound from a text description instead of a recording or a sound library. You say what the sound is and how long it runs, and the model generates it." },
      { q: "Can I use the AI sound effect generator with no sign up?", a: `No. You need a BuzzVideo account to generate sounds, and creating one is free. New accounts get ${SIGNUP_CREDITS} free credits that work on Seed Audio 1.0.` },
      { q: "Can AI add sound effects to a video?", a: "Yes. Generate the effect at the length of the moment, then drop it on the timeline in Canvas where it should land." },
    ],
    related: ["ai-music-generator", "ai-voice-over", "ai-video-editor"],
    metaTitle: "AI Sound Effects Generator: Free to Try | BuzzVideo",
    metaDescription: "AI sound effects generator: describe a sound and get an effect sized to your video. Free credits cover Seed Audio 1.0, plus ElevenLabs Sound Effects v3.",
  },

  /* ───────── Avatar ───────── */
  {
    slug: "ai-spokesperson",
    name: "AI Spokesperson Video",
    group: "Avatar",
    h1: "AI Spokesperson Video",
    h1Tail: "a presenter for every product",
    lead: "BuzzVideo's AI Spokesperson Video generator has a presenter, or a talking version of your product, introduce what you sell from a product photo and a script. Get lip-synced product explainers, talking-product clips for social and how-to videos in a preset or cloned voice, made with Kling 4.0, MiniMax H3, Seedance 2.5 and Seed Audio 1.0.",
    mode: "marketing",
    prompt: "A [15s] video of an avatar holding my product, sharing [3] selling points, ending with Shop now.",
    models: ["kling-4-0", "minimax-h3", "seedance-2-5", "seed-audio-1-0"],
    media: {
      kind: "video",
      src: `${SHOW}/talking-oasys.mp4`,
      poster: `${SHOW}/talking-oasys.jpg`,
      aspect: "9:16",
      alt: "A water bottle with a cartoon face introducing itself in a gym",
      caption: "A talking-product spokesperson clip made by the Marketing Agent.",
      source: "MCP Skill 展示 talking-oasys",
    },
    definition: {
      q: "What is an AI spokesperson video?",
      a: "An AI spokesperson video has a generated presenter speak your script on camera. On BuzzVideo the presenter can be a person or the product itself, and the voice can be a preset or your own clone.",
    },
    steps: [
      { title: "Add the product", body: "A photo of what the spokesperson should hold or present." },
      { title: "Write the script", body: "Or ask for three selling points and a call to action." },
      { title: "Get the video", body: "Lip-synced speech with a natural voice." },
    ],
    uses: [
      { title: "Product explainers", body: "Ecommerce brands give every SKU a presenter who holds the product and shares its selling points. Ask for three selling points and a call to action, and the Marketing Agent writes the script and generates the lip-synced video." },
      { title: "Talking products", body: "Social teams turn the product itself into a talking character, a format made for social. One take runs up to 30 seconds on Kling 4.0 and Seedance 2.5, or 5 to 15 seconds on MiniMax H3." },
      { title: "Training and onboarding", body: "Teams make how-to clips with a generated presenter instead of filming a colleague. Seed Audio 1.0 voices the script in 21 languages, in a preset voice or a voice cloned from a short, clean sample." },
    ],
    faq: [
      { q: "How do I make AI spokesperson videos?", a: "Upload the product, describe the presenter and paste the script. The Marketing Agent works as your AI spokesperson video creator: it generates the presenter, the voice and the lip sync." },
      { q: "Is there a free AI spokesperson video generator?", a: `Not for video: the presenter is animated with Kling 4.0, MiniMax H3 or Seedance 2.5, which need a Starter, Pro or Ultra plan. The voice runs on Seed Audio 1.0, which works with the ${SIGNUP_CREDITS} free credits new accounts get.` },
      { q: "How long can an AI spokesperson video be?", a: "Up to 30 seconds in one take on Kling 4.0 and Seedance 2.5, and 5 to 15 seconds on MiniMax H3." },
      { q: "Can the presenter be my product instead of a person?", a: "Yes. The presenter can be a person or the product itself as a talking character, a format made for social." },
      { q: "Can the spokesperson speak in my own voice?", a: "Yes. Clone your voice with Seed Audio 1.0 from a short, clean sample and use it as the presenter's voice, or pick a preset voice." },
      { q: "What languages can the spokesperson speak?", a: "Seed Audio 1.0, which voices the script, speaks 21 languages." },
      { q: "Do I have to write the script?", a: "No. Ask for three selling points and a call to action and the Marketing Agent writes the script, or paste your own." },
      { q: "AI spokesperson vs AI UGC video: what is the difference?", a: "A spokesperson video has a presenter deliver your script to camera, like an explainer. A UGC video is styled as a creator's own post, such as a testimonial or an unboxing. Both are made by the Marketing Agent with Kling 4.0, Seedance 2.5 and MiniMax H3." },
    ],
    related: ["ai-ugc-video-generator", "ai-voice-clone", "ai-product-video-generator"],
    metaTitle: "AI Spokesperson Video Generator | BuzzVideo",
    metaDescription: "AI spokesperson video generator: a presenter or a talking product introduces what you sell from a product photo and a script, in a natural voice.",
  },
];

/* 2026-11-19 补齐的落地页(Header「More tools」里有、之前没页面的):分文件写在 content/ 下 */
/* 2026-11-25 新增落地页(docs/research/2026-11-25-landing-page-plan.md)。合并 / 改名掉的旧条目(site/redirects.ts)不再进清单;
   ai-video-background-changer 写好了但 Trends 显示需求只有 ~24/月(remover ~480/月),先不上线，保留原 remover 页 */
const DROPPED = new Set(["ai-video-background-changer", ...REMOVED]); /* 2026-11-25 加上 Monica 划掉的 12 页 */
export const TOOLS_CONTENT: ToolEntry[] = [...BASE_TOOLS, ...VIDEO_MORE_TOOLS, ...IMAGE_MORE_TOOLS, ...AUDIO_MORE_TOOLS, ...MORE_TOOLS, ...AGENT_TOOLS, ...SEO_NOV25_TOOLS, ...SEO_NOV26_TOOLS].filter(
  (x) => !MERGED[x.slug] && !DROPPED.has(x.slug),
)
  /* 2026-11-25 Monica:所有套餐都可商用 —— 没写商用问题的页统一补一条 FAQ */
  /* 2026-11-25 下个版本的模型这次全部一起上线:nextModels 并进可用模型 */
  .map((x) => (x.nextModels?.length ? { ...x, models: [...x.models, ...x.nextModels.filter((s) => !x.models.includes(s))], nextModels: undefined } : x))
  /* 2026-11-25 下架的模型(已从模型目录删除)不再出现在工具页的可用模型里 */
  .map((x) => ({ ...x, models: x.models.filter((s) => MODELS.some((m) => m.slug === s)), related: x.related.filter((s) => !REMOVED.has(s.replace(/^\//, ""))) }))
  .map((x) => (/commercially|commercial use/i.test(JSON.stringify(x.faq)) ? x : { ...x, faq: [...x.faq, { q: `Can I use what I make with ${x.name} commercially?`, a: "Yes. Everything you generate on BuzzVideo can be used commercially on every plan, including Free." }] }));


export const toolBySlug = (slug: string) => TOOLS_CONTENT.find((t) => t.slug === slug);

/** 模型的起价(积分),从模型页数据算 */
export function fromCreditsOf(slug: string): number | undefined {
  return modelPageData(slug)?.fromCredits;
}
export const modelEntry = (slug: string) => MODELS.find((m) => m.slug === slug);

/** 这个工具最便宜的起价(只算已上线模型) */
export function toolFrom(t: ToolEntry): number | undefined {
  /* 只算这个工具主产出的模型：视频 / 图片工具不把配音模型(按秒 0.5 积分)算成起价 */
  const main = t.group === "Audio" ? "audio" : t.models.map((s) => modelEntry(s)?.type).find((x) => x !== "audio");
  const xs = t.models
    .filter((s) => modelEntry(s)?.type === main)
    .map(fromCreditsOf)
    .filter((x): x is number => typeof x === "number");
  return xs.length ? Math.min(...xs) : undefined;
}

export type ToolMeta = { title: string; description: string; image?: string };
export function toolMetaOf(slug: string): ToolMeta | undefined {
  const t = toolBySlug(slug);
  if (!t) return undefined;
  /* 2026-11-25 分享图优先用本页专属配图(各页不同),没有再用共用成片 */
  const own = pageMedia(slug)[0];
  const ownSrc = own ? (own.kind === "video" ? own.poster : own.src) : undefined;
  return { title: t.metaTitle, description: t.metaDescription, image: ownSrc ?? (t.media?.kind === "image" ? t.media.src : t.media?.poster) };
}
