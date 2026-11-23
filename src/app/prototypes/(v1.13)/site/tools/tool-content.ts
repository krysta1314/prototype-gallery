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
      a: "An AI ad generator writes the script, makes the visuals and edits them into finished ads from a short brief. On BuzzVideo the Marketing Agent does this: it picks a model for each shot, adds a voiceover and returns every size you asked for in one run.",
    },
    steps: [
      { title: "Add your product", body: "Upload a product photo, paste a product page link, or describe what you sell." },
      { title: "Say what you need", body: "Name the formats, sizes and how many variations. The agent shows a plan and waits for you to confirm before it generates or spends credits." },
      { title: "Review and remix", body: "Keep the ads that work, then ask for new hooks or cuts of a winner without starting over." },
    ],
    uses: [
      { title: "Launch a new product", body: "One brief gives you UGC, product close-ups and a cinematic hero in every placement." },
      { title: "Fight creative fatigue", body: "Ask for five new hooks on an ad that is already spending well." },
      { title: "Shopify and dropshipping stores", body: "Start from the product page link instead of a shoot." },
    ],
    faq: [
      { q: "What is the best AI ad generator for products?", a: "Look for one that keeps your product's label and shape the same across shots and outputs every size you buy media in. BuzzVideo runs Seedance, Kling, Nano Banana and GPT Image in one place, so each shot can use the model that suits it." },
      { q: "Is there a free AI ad generator?", a: `Not for video ads: Seedance 2.5 and Kling 4.0 need a Starter, Pro or Ultra plan. The ${SIGNUP_CREDITS} free credits new accounts get do cover image ads on Seedream 4.5 and Seedream 5.0 lite, plus voiceovers with Seed Audio 1.0.` },
      { q: "Can it make ads for TikTok, Instagram and Facebook?", a: "Yes. Ask for 9:16 for TikTok, Reels and Shorts, 1:1 or 4:5 for feeds, and 16:9 for YouTube in the same request." },
      { q: "Can I use the AI ad generator in ChatGPT or Claude?", a: "Yes. Connect BuzzVideo MCP to ChatGPT or Claude, share your product photo or page link and describe the ads you want; they are generated on your BuzzVideo credits." },
    ],
    related: ["url-to-video", "ai-ugc-video-generator", "ai-product-video-generator"],
    metaTitle: "AI Ad Generator: Video & Image Ads | BuzzVideo",
    metaDescription: "Turn a product photo, link or brief into video and image ads for TikTok, Reels and Meta. BuzzVideo's AI ad generator makes every size and new variations.",
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
      { title: "Ads for every SKU", body: "Make a first-cut video for each product page without writing a script." },
      { title: "Landing page to ad", body: "Turn a launch page into a teaser for paid social." },
      { title: "Docs to explainer", body: "Point it at a feature doc to get a short explainer clip." },
    ],
    faq: [
      { q: "How do I make a video from a URL?", a: "In BuzzVideo, open Video, choose Wan 3.0 with Omni Reference, paste the link in the URL / Doc slot and describe the ad. You see the credit price before you create." },
      { q: "Is URL to video free?", a: "Not for video: URL to Video runs on Wan 3.0, a video model that needs a Starter, Pro or Ultra plan. You see the exact credit price before you create." },
      { q: "Is this a video URL converter or downloader?", a: "No. It does not download a video from a link; it reads the page's text and images and makes a new video ad from them." },
    ],
    related: ["ai-ad-generator", "ai-product-video-generator", "text-to-video"],
    metaTitle: "URL to Video: Product Page to Video Ad | BuzzVideo",
    metaDescription: "Paste a product page link and get a vertical video ad with a hook, selling points and a call to action. Powered by Wan 3.0 on BuzzVideo.",
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
      a: "An AI UGC video generator makes videos that look like user-generated content, a real-looking person reviewing or using a product on camera, without hiring a creator. BuzzVideo writes the script, generates the person and the product shots, and adds the voice.",
    },
    steps: [
      { title: "Upload your product", body: "One clear product photo is enough. The label and shape stay the same in every shot." },
      { title: "Describe the creator and script", body: "Say who is talking and what the hook is, or let the agent write three hooks to test." },
      { title: "Get the video", body: "Kling 4.0 can do up to 30 seconds in one take, so there are fewer cuts for the face to change across." },
    ],
    uses: [
      { title: "TikTok Shop and Reels ads", body: "Testimonials and unboxings in 9:16, ready to post." },
      { title: "Hook testing", body: "Same product, five different opening lines, one afternoon." },
      { title: "New markets", body: "Remake a winning UGC ad with a different creator and language." },
    ],
    faq: [
      { q: "Do UGC ads work?", a: "UGC-style ads are one of the most used formats on TikTok and Meta because they look like posts, not ads. AI makes it cheap to test many versions and keep the ones that perform." },
      { q: "Are AI UGC ads legal?", a: "AI-generated people can appear in ads, but TikTok and Meta both have AI-disclosure rules, so check their ad policies before you run them. Do not present an AI person as a real customer giving a real review." },
      { q: "What is the best AI UGC video generator?", a: "Pick one that keeps the same face for the whole clip and the product label readable. BuzzVideo uses Kling 4.0 for 30-second single takes and MiniMax H3 for consistent characters across clips." },
      { q: "Is there a free AI UGC video generator?", a: `Not for video: UGC clips use Kling 4.0, Seedance 2.5 and MiniMax H3, which need a Starter, Pro or Ultra plan. You can still voice a UGC script with Seed Audio 1.0 on the ${SIGNUP_CREDITS} free credits new accounts get.` },
    ],
    related: ["ai-spokesperson", "ai-ad-generator", "ai-product-video-generator"],
    metaTitle: "AI UGC Video Generator for Ads | BuzzVideo",
    metaDescription: "Make UGC video ads with a person talking about your product from one photo. Up to 30-second single takes with Kling 4.0 on BuzzVideo.",
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
      { title: "Product page videos", body: "Short loops for Shopify and Amazon listings." },
      { title: "Paid social", body: "Unboxing and before-and-after ads for every new SKU." },
      { title: "Launches", body: "A cinematic hero video before the product ships." },
    ],
    faq: [
      { q: "Can I make AI product videos for free?", a: `Not for video: Seedance 2.5, Kling 4.0 and Wan 3.0 need a Starter, Pro or Ultra plan. With the ${SIGNUP_CREDITS} free credits new accounts get, you can make still product shots on Seedream 4.5 or Seedream 5.0 lite to use as first frames later.` },
      { q: "Can AI make a product video from an image?", a: "Yes. Upload the product photo and describe the shot; Seedance 2.5 and Kling 4.0 animate it while keeping the label and shape from your photo." },
      { q: "How long should an Amazon product video be?", a: "Amazon accepts listing videos up to several minutes, but short clips that show the product in use in the first seconds tend to hold attention. BuzzVideo clips run from a few seconds up to 30 seconds per take." },
    ],
    related: ["image-to-video", "ai-product-photography", "url-to-video"],
    metaTitle: "AI Product Video Generator | BuzzVideo",
    metaDescription: "Make unboxings, demos and hero shots from a product photo. The label stays the same in every shot. Seedance, Kling and Wan on BuzzVideo.",
  },

  /* ───────── Video ───────── */
  {
    slug: "ai-video-generator",
    name: "AI Video Generator",
    group: "Video",
    h1: "AI Video Generator",
    h1Tail: "every leading model in one place",
    lead: "BuzzVideo's AI Video Generator creates video clips from a text prompt, an image or reference media, with the leading video models side by side on one account. Make ad creative, product shots, B-roll and cinematic brand films with Seedance 2.5, Kling 4.0, Wan 3.0, MiniMax H3 and Gemini Omni 1.2 Flash, choosing each by length and resolution.",
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
      { title: "Ad creative", body: "Hooks, product shots and B-roll for paid social." },
      { title: "Brand films", body: "Cinematic hero clips with native sound." },
      { title: "Content at volume", body: "Daily posts without a camera crew." },
    ],
    faq: [
      { q: "Is there a free AI video generator?", a: `Not for video: every video model on BuzzVideo, from Seedance 2.5 to Gemini Omni 1.2 Flash, needs a Starter, Pro or Ultra plan. The ${SIGNUP_CREDITS} free credits new accounts get work on Seedream 4.5, Seedream 5.0 lite and Seed Audio 1.0, so you can prepare first frames and voiceovers before you upgrade.` },
      { q: "Which AI video model is best?", a: "Seedance 2.5 for long, premium ads up to 30 seconds, Kling 4.0 for continuous 30-second takes with sound, and Gemini Omni 1.2 Flash when you need fast, affordable clips. For length, resolution, references and credit price of every model, see the AI video models page." },
      { q: "Can I use the AI video generator in ChatGPT or Claude?", a: "Yes. Connect BuzzVideo MCP to ChatGPT or Claude, describe the clip and name the model to use; the video is generated on your BuzzVideo credits." },
    ],
    related: ["text-to-video", "image-to-video", "ai-video-editor"],
    metaTitle: "AI Video Generator: Seedance, Kling & Wan | BuzzVideo",
    metaDescription: "Generate videos from text or images with Seedance 2.5, Kling 4.0, Wan 3.0 and MiniMax H3. Compare length and price, then create on BuzzVideo.",
  },
  {
    slug: "text-to-video",
    name: "Text to Video",
    group: "Video",
    h1: "Text to Video AI",
    h1Tail: "write the shot, get the clip",
    lead: "BuzzVideo's Text to Video AI turns a written prompt into a video clip with motion and native sound, up to 30 seconds in one take depending on the model. Describe the subject, action and camera to make ad concepts, B-roll and scripted ads with no footage, using Seedance 2.5, Kling 4.0, Wan 3.0 or Gemini Omni 1.2 Flash.",
    mode: "video",
    prompt: "A [10s] cinematic shot of [a lighthouse on a cliff at dusk, waves crashing below], slow aerial push-in, [moody blue light], with the sound of wind and surf.",
    models: ["seedance-2-5", "kling-4-0", "wan-3-0", "gemini-omni-1-2-flash"],
    media: {
      kind: "video",
      src: "/prototypes/model-page/kling-30s.mp4",
      poster: "/prototypes/model-page/kling-30s.jpg",
      aspect: "16:9",
      alt: "A continuous single-take shot generated from a text prompt",
      caption: "A single take generated from a text prompt with Kling 4.0.",
      source: "Kling 4.0 模型页样片 kling-30s",
    },
    definition: {
      q: "What is text to video AI?",
      a: "Text to video AI generates a video clip from a written description. The more specific the prompt (subject, action, camera, light, length), the closer the result. On BuzzVideo, Seedance 2.5, Kling 4.0 and Wan 3.0 make clips from text alone, up to 30 seconds in one take.",
    },
    steps: [
      { title: "Write the prompt", body: "Say who or what is on screen, what happens, the camera move and the mood." },
      { title: "Set length and size", body: "Pick seconds and aspect ratio. Longer clips cost more; the price updates as you change it." },
      { title: "Create and iterate", body: "Draft at a lower resolution, then render the keeper at full quality." },
    ],
    uses: [
      { title: "Concepts before a shoot", body: "Show a client the idea in motion." },
      { title: "B-roll", body: "Cutaways and scene-setters for longer edits." },
      { title: "Ads with no assets", body: "Start from a script when there is no footage yet." },
    ],
    faq: [
      { q: "Is there a free text to video AI?", a: `Not for video: Seedance 2.5, Kling 4.0, Wan 3.0 and Gemini Omni 1.2 Flash all need a Starter, Pro or Ultra plan. You can test the scene as a still image on Seedream 4.5 or Seedream 5.0 lite with the ${SIGNUP_CREDITS} free credits new accounts get.` },
      { q: "How long can a text-to-video clip be?", a: "It depends on the model: Kling 4.0 and Wan 3.0 go up to 30 seconds in one take; Seedance 2.5 also reaches 30 seconds." },
      { q: "Does text to video include sound?", a: "Most video models on BuzzVideo generate native audio with the clip, and many have a With Audio switch so you can add your own voiceover and music instead." },
    ],
    related: ["image-to-video", "ai-video-generator", "faceless-video-generator"],
    metaTitle: "Text to Video AI: Prompt to Video Clip | BuzzVideo",
    metaDescription: "Write a prompt and get a video clip with motion and sound, up to 30 seconds in one take. Seedance, Kling, Wan and Gemini Omni on BuzzVideo.",
  },
  {
    slug: "image-to-video",
    name: "Image to Video",
    group: "Video",
    h1: "Image to Video AI",
    h1Tail: "bring a photo to life",
    lead: "BuzzVideo's Image to Video AI animates a photo into a video clip, using your image as the first frame so the product, person or scene stays the same. Turn catalog shots into social video, add motion to still posts or animate storyboard frames, using Seedance 2.5, Kling 4.0, MiniMax H3 and Wan 3.0.",
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
      { title: "Product photos to video", body: "Turn your catalog into motion for social." },
      { title: "Social posts", body: "A subtle loop makes a still post stop the scroll." },
      { title: "Storyboards", body: "Animate key frames to check pacing." },
    ],
    faq: [
      { q: "Can I turn an image into a video for free?", a: `Not for video: animating a photo with Seedance 2.5, Kling 4.0, MiniMax H3 or Wan 3.0 needs a Starter, Pro or Ultra plan. The ${SIGNUP_CREDITS} free credits new accounts get can make the starting image itself on Seedream 4.5 or Seedream 5.0 lite.` },
      { q: "Which models can turn an image into a video?", a: "Most video models on BuzzVideo take a starting image, and many also take an end image so you control where the clip lands. Seedance 2.5 and Kling 4.0 also accept several reference images." },
    ],
    related: ["text-to-video", "ai-product-video-generator", "ai-video-generator"],
    metaTitle: "Image to Video AI: Animate Any Photo | BuzzVideo",
    metaDescription: "Upload a photo and turn it into a video clip that keeps your product or character. Seedance 2.5, Kling 4.0 and MiniMax H3 on BuzzVideo.",
  },
  {
    slug: "ai-video-editor",
    name: "AI Video Editor",
    group: "Video",
    h1: "AI Video Editor",
    h1Tail: "edit a clip by describing the change",
    lead: "BuzzVideo's AI Video Editor changes what is inside a clip from a text instruction: swap the background, change an outfit or remove an object while the people, motion and timing stay the same. Localize an ad for a new market, fix a shot or make seasonal versions of a winning video without a reshoot, powered by Seedance 2.5.",
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
      { title: "Localize an ad", body: "Change the setting or props for a new market without a reshoot." },
      { title: "Fix a shot", body: "Remove a logo or swap a product in footage you already have." },
      { title: "Seasonal versions", body: "Put a winning ad in a holiday setting." },
    ],
    faq: [
      { q: "Is there a free AI video editor?", a: `Not for video: Edit Video mode runs on Seedance 2.5, which needs a Starter, Pro or Ultra plan. The ${SIGNUP_CREDITS} free credits new accounts get cover image edits on Seedream 4.5 and Seedream 5.0 lite, not video.` },
      { q: "Does the AI video editor add captions and cuts?", a: "Captions and cuts are done in Canvas or by the Marketing Agent. Edit Video mode changes what is inside the shot." },
    ],
    related: ["ai-video-generator", "ai-image-editor", "faceless-video-generator"],
    metaTitle: "AI Video Editor: Edit Video with Text | BuzzVideo",
    metaDescription: "Swap backgrounds, outfits or objects in a video with one text instruction. Motion and timing stay the same. Seedance 2.5 on BuzzVideo.",
  },
  {
    slug: "faceless-video-generator",
    name: "Faceless Video Generator",
    group: "Video",
    h1: "Faceless Video Generator",
    h1Tail: "explainers with no one on camera",
    lead: "BuzzVideo's Faceless Video Generator turns one topic into a finished video with an AI voiceover, generated visuals and captions, so no one has to appear on camera. Make explainers, list videos and product round-ups for YouTube Shorts, TikTok and Reels, with visuals from Seedance 2.5 and Nano Banana 2.1 and narration from Seed Audio 1.0.",
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
      { title: "YouTube Shorts channels", body: "Explainers and list videos on a schedule." },
      { title: "Brand education", body: "How-it-works clips without a presenter." },
      { title: "Affiliate content", body: "Product round-ups with voiceover." },
    ],
    faq: [
      { q: "Is there a free faceless video generator?", a: `Not for video: the generated clips use Seedance 2.5, which needs a Starter, Pro or Ultra plan. The narration runs on Seed Audio 1.0, which works with the ${SIGNUP_CREDITS} free credits new accounts get.` },
      { q: "Can I use my own voice?", a: "Yes. Clone your voice with Seed Audio 1.0 and use it as the narrator." },
    ],
    related: ["text-to-video", "ai-voice-over", "ai-video-editor"],
    metaTitle: "Faceless Video Generator with Voiceover | BuzzVideo",
    metaDescription: "Turn a topic into a faceless video with an AI voiceover, generated visuals and captions for Shorts, TikTok and Reels on BuzzVideo.",
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
      { title: "Static ads", body: "Feed and story ads with room for a headline." },
      { title: "Product photos", body: "New scenes for your catalog without a shoot." },
      { title: "Social posts", body: "On-brand images for daily posting." },
    ],
    faq: [
      { q: "Is there a free AI image generator?", a: `Yes, on two models. The ${SIGNUP_CREDITS} free credits new accounts get work on Seedream 4.5 and Seedream 5.0 lite, which handle product sets, ad images and infographics. Nano Banana 2.1, GPT Image 2.5 Sunburst, Seedream 5.5 and Nano Banana Pro are not covered by free credits.` },
      { q: "Which AI image generator is best for text in images?", a: "GPT Image 2.5 Sunburst is built for fine print and labels; Nano Banana 2.1 is a fast all-rounder with sharp text." },
      { q: "Can I generate images based on an existing image?", a: "Yes. Nano Banana 2.1 takes up to 14 reference images in one prompt." },
    ],
    related: ["ai-image-editor", "ai-product-photography", "remove-background"],
    metaTitle: "AI Image Generator: Ad Images from a Prompt | BuzzVideo",
    metaDescription: "Generate ad images and product shots from a prompt or reference photos, with your product and label kept intact. Nano Banana, GPT Image and Seedream.",
  },
  {
    slug: "ai-image-editor",
    name: "AI Image Editor",
    group: "Image",
    h1: "AI Image Editor",
    h1Tail: "edit a photo by typing the change",
    lead: "BuzzVideo's AI Image Editor edits a photo from a plain-text instruction: swap a prop, change a color, fix a small detail or update the text on a label while the product stays exactly the same. Make seasonal variants, clean up product shots and refresh ad creatives in seconds, using Nano Banana 2.1, GPT Image 2.5 Sunburst and Seedream 5.5.",
    mode: "image",
    prompt: "Change [the mug to sage green] and [remove the sticker on the lid]. Keep everything else exactly the same.",
    models: ["nano-banana-2-1", "gpt-image-2-5-sunburst", "seedream-5-5"],
    definition: {
      q: "What is an AI image editor?",
      a: "An AI image editor changes specific things in a photo from a text instruction, such as a prop, a color, a small detail or a line of text, while the rest stays the same. On BuzzVideo you make these edits with Nano Banana 2.1, GPT Image 2.5 Sunburst or Seedream 5.5.",
    },
    steps: [
      { title: "Upload the photo", body: "Any product or lifestyle photo." },
      { title: "Describe the change", body: "Say what changes and what must stay the same." },
      { title: "Create", body: "Compare versions and keep the one you want." },
    ],
    uses: [
      { title: "Swap props", body: "Add holiday props or replace a cup, plant or book in an existing photo." },
      { title: "Recolor products", body: "Show the same product in every color without shooting each one." },
      { title: "Fix details and text", body: "Remove a sticker, tidy a set or correct the words on a sign." },
    ],
    faq: [
      { q: "Is there a free AI image editor?", a: `Partly. The ${SIGNUP_CREDITS} free credits new accounts get work on Seedream 4.5 and Seedream 5.0 lite, which both take reference images, so you can try prompt edits there. Nano Banana 2.1, GPT Image 2.5 Sunburst and Seedream 5.5 are not covered by free credits.` },
      { q: "Can I change the text in an image?", a: "Yes. Quote the old and new words in the prompt and say everything else stays the same. GPT Image 2.5 Sunburst is built for fine print and labels; check the spelling in the result." },
      { q: "Should I use the image editor to change the background?", a: "For a new scene behind your product, use the AI Background Generator, which is set up for that. The image editor is for props, colors, details and text." },
    ],
    related: ["ai-image-generator", "remove-background", "ai-product-photography"],
    metaTitle: "AI Image Editor: Change Props, Colors & Text | BuzzVideo",
    metaDescription: "Edit a photo by typing the change: swap props, recolor a product, fix small details or update text while the rest stays the same. Nano Banana and GPT Image.",
  },
  {
    slug: "remove-background",
    name: "Remove Background",
    group: "Image",
    h1: "Remove Background",
    h1Tail: "clean product cutouts in one step",
    lead: "BuzzVideo's Remove Background tool cuts your product out of a photo and returns a clean result on a transparent or pure white background. Get a transparent PNG with Seedream 5.5 or a pure white version with Nano Banana 2.1 for Amazon and Shopify listings, ad banners, or a new scene behind the product.",
    mode: "image",
    prompt: "Remove the background from this product photo and give me a clean cutout on transparent and pure white backgrounds.",
    models: ["seedream-5-5", "nano-banana-2-1"],
    definition: {
      q: "How do you remove a background from a photo with AI?",
      a: "Upload the photo and ask for a cutout. Seedream 5.5 can return the product on a transparent background (PNG), and any image model can put it on pure white, the format most marketplaces ask for. On BuzzVideo you can get both versions from the same request.",
    },
    steps: [
      { title: "Upload the photo", body: "A product photo with clear edges gives the cleanest cut." },
      { title: "Choose the output", body: "Transparent, pure white, or a new scene behind it." },
      { title: "Download", body: "Save the PNG or keep editing in Canvas." },
    ],
    uses: [
      { title: "Marketplace listings", body: "White-background main images for Amazon and Shopify." },
      { title: "Ad layouts", body: "Cutouts to drop onto any banner." },
      { title: "New scenes", body: "Remove the background, then place the product somewhere new." },
    ],
    faq: [
      { q: "How do I remove a background and make it transparent?", a: "Pick Seedream 5.5, which supports transparent backgrounds, and ask for a transparent cutout; the result downloads as a PNG." },
      { q: "How do I make a background white?", a: "Ask for a pure white background. You can get transparent and white versions from the same request." },
      { q: "Can I remove a background for free?", a: `Partly. Transparent cutouts use Seedream 5.5, which free credits do not cover. A pure white background on Seedream 4.5 or Seedream 5.0 lite works with the ${SIGNUP_CREDITS} free credits new accounts get.` },
    ],
    related: ["ai-image-editor", "ai-product-photography", "ai-image-generator"],
    metaTitle: "Remove Background from Product Photos | BuzzVideo",
    metaDescription: "Remove the background from a product photo and get a transparent PNG or pure white version for marketplaces and ads on BuzzVideo.",
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
      q: "Can AI do product photography?",
      a: "Yes, for most catalog and social shots. AI product photography puts your real product into a generated scene. The result depends on keeping the product itself unchanged, which is why BuzzVideo uses your photo as a reference.",
    },
    steps: [
      { title: "Upload a packshot", body: "One clear photo of the product." },
      { title: "Describe the scene", body: "Surface, props, light and mood." },
      { title: "Get a set", body: "Ask for several angles or settings in one go." },
    ],
    uses: [
      { title: "Listings", body: "Lifestyle images for Amazon, Shopify and Etsy." },
      { title: "Ads", body: "A fresh scene for every campaign." },
      { title: "Fashion and jewelry", body: "Pair with Virtual Try-On for on-model shots." },
    ],
    faq: [
      { q: "Is AI replacing product photography?", a: "For catalog variations and social content it often does; for hero campaigns many brands still shoot and use AI to extend the set. The product itself should always come from a real photo." },
      { q: "Can I try AI product photography for free?", a: `Yes, with Seedream 4.5, which is built for consistent product sets with accurate text; it works with the ${SIGNUP_CREDITS} free credits new accounts get, as does Seedream 5.0 lite. Nano Banana 2.1, GPT Image 2.5 Sunburst and Seedream 5.5 are not covered by free credits.` },
    ],
    related: ["ai-image-generator", "remove-background", "ai-product-video-generator"],
    metaTitle: "AI Product Photography from One Photo | BuzzVideo",
    metaDescription: "Place your real product in any scene from one packshot. The label stays exactly the same. Nano Banana, GPT Image and Seedream on BuzzVideo.",
  },

  /* ───────── Audio ───────── */
  {
    slug: "ai-voice-over",
    name: "AI Voice Over",
    group: "Audio",
    h1: "AI Voice Over",
    h1Tail: "natural voiceover for every ad",
    lead: "BuzzVideo's AI Voice Over turns a pasted script into natural narration, in a preset voice or your own cloned voice, and places it straight onto your video. Make voiceovers for product ads, explainers, faceless Shorts and TikToks, or localized versions in other languages, with Seed Audio 1.0; more voice models arrive in the next release.",
    mode: "audio",
    prompt: "Voice over my [15s] product ad in a [confident, upbeat] voice, paced to fit the video: [Paste your script here]",
    models: ["seed-audio-1-0"],
    nextModels: ["elevenlabs-eleven-v4", "minimax-speech-2-8-hd", "gemini-3-8-flash-tts"],
    definition: {
      q: "What is an AI voice over?",
      a: "An AI voice over is narration for a video, generated from text instead of recorded in a booth. On BuzzVideo it is made with Seed Audio 1.0 and placed on your clips in Canvas; ElevenLabs, MiniMax Speech and Gemini TTS arrive with the next release.",
    },
    steps: [
      { title: "Paste the script", body: "Add the lines and how they should sound." },
      { title: "Pick a voice", body: "Choose a preset voice or use your own cloned voice." },
      { title: "Add it to the video", body: "Use it in Canvas or let the Marketing Agent cut it to your clips." },
    ],
    uses: [
      { title: "Ad narration", body: "A voice paced to the cut of your product and explainer ads." },
      { title: "Faceless videos", body: "Narration under the visuals of Shorts and TikTok channels." },
      { title: "Founder-voiced ads", body: "Your cloned voice narrating every new ad." },
    ],
    faq: [
      { q: "How do I add an AI voice over to a video?", a: "Make the voiceover from your script, then place it on your clip in Canvas, or ask the Marketing Agent to cut it to your clips." },
      { q: "Is there a free AI voice over generator?", a: `Yes. Seed Audio 1.0, the voice model behind AI Voice Over, works with the ${SIGNUP_CREDITS} free credits new accounts get, so you can narrate your first ads without a plan. After that it is billed per second of audio.` },
      { q: "Can I use my own voice for the voice over?", a: "Yes. Clone your voice from a short, clean sample with Seed Audio 1.0 and use it as the narrator on every ad." },
    ],
    related: ["text-to-speech", "ai-voice-clone", "faceless-video-generator"],
    metaTitle: "AI Voice Over for Video Ads & Narration | BuzzVideo",
    metaDescription: "Paste your ad script and get natural AI narration placed on your video timeline, in a preset or cloned voice. Seed Audio 1.0 on BuzzVideo.",
  },
  {
    slug: "text-to-speech",
    name: "Text to Speech",
    group: "Audio",
    h1: "Text to Speech",
    h1Tail: "AI voices for videos and ads",
    lead: "BuzzVideo's Text to Speech converts written text into natural spoken audio with AI voices, in the tone and language you choose. Paste a script, pick a voice and download the audio file for podcasts, tutorials, product explainers or script previews before booking a voice actor, powered by Seed Audio 1.0 in 21 languages.",
    mode: "audio",
    prompt: "Convert this text to speech in [English] with a [calm, clear] voice, as a downloadable audio file: [Paste your text here]",
    models: ["seed-audio-1-0"],
    nextModels: ["elevenlabs-eleven-v4", "elevenlabs-eleven-v4-turbo", "minimax-speech-2-8-hd", "gemini-3-8-flash-tts", "kling-tts"],
    definition: {
      q: "What is AI text to speech?",
      a: "AI text to speech (TTS) converts written text into spoken audio with a natural-sounding voice. BuzzVideo uses Seed Audio 1.0 now and adds ElevenLabs v4, MiniMax Speech 2.8, Gemini 3.8 Flash TTS and Kling TTS in the next release.",
    },
    steps: [
      { title: "Type or paste text", body: "Add the script and any delivery notes." },
      { title: "Choose the voice", body: "Pick tone and language." },
      { title: "Download or use it", body: "Get the audio file or place it on a video." },
    ],
    uses: [
      { title: "Script previews", body: "Hear a script read aloud before you book a voice actor or film." },
      { title: "Many languages", body: "The same text as audio in any of the 21 languages Seed Audio 1.0 speaks." },
      { title: "Audio files", body: "Download MP3 or WAV for tutorials, lessons and how-to clips." },
    ],
    faq: [
      { q: "Is AI text to speech free?", a: `Seed Audio 1.0 works with the ${SIGNUP_CREDITS} free credits on sign-up and costs 0.5 credits per second of audio after that.` },
      { q: "Can I download the audio?", a: "Yes. Download it as MP3 or WAV from your assets, or use it directly in Canvas." },
      { q: "How many languages does it support?", a: "Seed Audio 1.0 speaks 21 languages and can voice more than one speaker in a single file. MiniMax Speech 2.8 HD, arriving in the next release, adds expressive speech in 40+ languages." },
    ],
    related: ["ai-voice-over", "ai-voice-clone", "ai-music-generator"],
    metaTitle: "Text to Speech AI: Download Natural Audio | BuzzVideo",
    metaDescription: "Convert text to natural AI speech in 21 languages and download it as MP3 or WAV. Preview a script before you record. Seed Audio 1.0 on BuzzVideo.",
  },
  {
    slug: "ai-voice-clone",
    name: "AI Voice Clone",
    group: "Audio",
    h1: "AI Voice Clone",
    h1Tail: "your voice, any script",
    lead: "BuzzVideo's AI Voice Clone learns a voice from a short, clean recording and uses it to read any new script you write. Put a founder's voice on every ad, keep one narrator across a series or have the same voice read a translated script, powered by Seed Audio 1.0. Only clone voices you have permission to use.",
    mode: "audio",
    prompt: "Read my script in the voice from @Audio1: [Paste your script here]",
    models: ["seed-audio-1-0"],
    nextModels: ["minimax-voice-clone", "kling-create-voice"],
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
      { title: "Founder-voiced ads", body: "Your own voice on every ad without recording each one." },
      { title: "Consistent narration", body: "One voice across a whole series." },
      { title: "Other languages", body: "The same voice reading a translated script." },
    ],
    faq: [
      { q: "How do I clone my voice with AI?", a: "Upload a clean sample in Audio, reference it as @Audio1 in the prompt and paste your script. Seed Audio 1.0 does the cloning." },
      { q: "Is AI voice cloning free?", a: `It runs on Seed Audio 1.0, which works with the ${SIGNUP_CREDITS} free credits new accounts get.` },
      { q: "Is it legal to clone a voice?", a: "Cloning your own voice, or one you have written permission for, is fine. Cloning someone else's voice without consent can break platform rules and the law in many places." },
    ],
    related: ["ai-voice-over", "text-to-speech", "ai-spokesperson"],
    metaTitle: "AI Voice Clone: Your Voice Reading Any Script | BuzzVideo",
    metaDescription: "Clone a voice from a short sample and use it to read any script as a voiceover. Seed Audio 1.0 on BuzzVideo, more models next release.",
  },
  {
    slug: "ai-music-generator",
    name: "AI Music Generator",
    group: "Audio",
    h1: "AI Music Generator",
    h1Tail: "background music for every ad",
    lead: "BuzzVideo's AI Music Generator composes background music from a short description of mood, genre and tempo, sized to the length of your ad. Make soundtracks that end on the last shot, one recognizable track for a whole campaign or original music for social posts with Seed Audio 1.0; songs with sung lyrics arrive in the next release.",
    mode: "music",
    prompt: "[Upbeat, warm] instrumental background music for a [30s] [skincare] ad that builds gently and ends cleanly on the last shot, no lyrics.",
    models: ["seed-audio-1-0"],
    nextModels: ["elevenlabs-music-v2-5", "lyria-3-5", "mureka-v9-5", "minimax-music-3"],
    definition: {
      q: "What is an AI music generator?",
      a: "An AI music generator composes instrumental music from a text description of mood, genre and tempo. BuzzVideo makes background music for ads with Seed Audio 1.0 today; ElevenLabs Music v2.5, Lyria 3.5, Mureka V9.5 and MiniMax Music 3 arrive with the next release.",
    },
    steps: [
      { title: "Describe the track", body: "Mood, genre, tempo and length." },
      { title: "Match the ad", body: "Set the length to your video so the track ends on the last shot." },
      { title: "Add it to the video", body: "Place it under your clips in Canvas." },
    ],
    uses: [
      { title: "Ad soundtracks", body: "Music that fits the length of the ad and ends on the last shot." },
      { title: "Under a voiceover", body: "Calm instrumental beds for explainers and tutorials." },
      { title: "Social content", body: "Original background tracks instead of trending sounds." },
    ],
    faq: [
      { q: "Can the music match my ad length?", a: "Yes. Say the length in the prompt, such as 15 or 30 seconds, so the track ends on the last shot." },
      { q: "Will the music clash with my voiceover?", a: "Ask for an instrumental track with no lyrics. Seed Audio 1.0 can also put the voiceover and the music in one track, so they are mixed together." },
      { q: "Is there a free AI music generator?", a: `Yes. Background music is made with Seed Audio 1.0, which works with the ${SIGNUP_CREDITS} free credits new accounts get and is billed per second of audio after that.` },
      { q: "Can it make songs with lyrics?", a: "Not here. For sung songs, see the AI Song Generator; vocals arrive with Lyria 3.5 and ElevenLabs Music v2.5 in the next release." },
    ],
    related: ["ai-sound-effects-generator", "ai-voice-over", "text-to-speech"],
    metaTitle: "AI Music Generator: Background Music for Ads | BuzzVideo",
    metaDescription: "Describe a mood and tempo and get instrumental background music sized to your ad. Seed Audio 1.0 now, with more music models next on BuzzVideo.",
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
      a: "Describe the sound and its length; the model generates it. On BuzzVideo, Seed Audio 1.0 makes sound effects today and ElevenLabs Sound Effects v3 (up to 30 seconds, loopable) comes with the next release.",
    },
    steps: [
      { title: "Describe the sound", body: "What it is, where it happens and how it should feel." },
      { title: "Set the length", body: "Match it to the moment in your clip." },
      { title: "Place it", body: "Drop it on the timeline in Canvas." },
    ],
    uses: [
      { title: "Product reveals", body: "Whooshes, pops and clicks that land on the cut." },
      { title: "UGC realism", body: "Room tone and handling sounds." },
      { title: "Transitions", body: "Risers and hits between scenes." },
    ],
    faq: [
      { q: "Is there an app for AI sound effects?", a: "BuzzVideo makes sound effects in the browser alongside your videos, so you do not need a separate app." },
      { q: "Can sound effects loop?", a: "ElevenLabs Sound Effects v3, coming in the next release, makes loopable effects up to 30 seconds." },
    ],
    related: ["ai-music-generator", "ai-voice-over", "ai-video-editor"],
    metaTitle: "AI Sound Effects Generator | BuzzVideo",
    metaDescription: "Describe a sound and get an AI sound effect for your video. Seed Audio 1.0 now; ElevenLabs Sound Effects v3 next on BuzzVideo.",
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
      { title: "Product explainers", body: "A friendly face for every SKU." },
      { title: "Talking products", body: "Your product as a character, made for social." },
      { title: "Training and onboarding", body: "A presenter for how-to clips." },
    ],
    faq: [
      { q: "How do I make an AI spokesperson video?", a: "Upload the product, describe the presenter and paste the script. The Marketing Agent generates the presenter, the voice and the lip sync." },
      { q: "Is there a free AI spokesperson video generator?", a: `Not for video: the presenter is animated with Kling 4.0, MiniMax H3 or Seedance 2.5, which need a Starter, Pro or Ultra plan. The voice runs on Seed Audio 1.0, which works with the ${SIGNUP_CREDITS} free credits new accounts get.` },
    ],
    related: ["ai-ugc-video-generator", "ai-voice-clone", "ai-product-video-generator"],
    metaTitle: "AI Spokesperson Video Generator | BuzzVideo",
    metaDescription: "Make a spokesperson video from a product photo and a script: a presenter or a talking product, with a natural voice, on BuzzVideo.",
  },
];

/* 2026-11-19 补齐的落地页(Header「More tools」里有、之前没页面的):分文件写在 content/ 下 */
export const TOOLS_CONTENT: ToolEntry[] = [...BASE_TOOLS, ...VIDEO_MORE_TOOLS, ...IMAGE_MORE_TOOLS, ...AUDIO_MORE_TOOLS, ...MORE_TOOLS, ...AGENT_TOOLS];


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
  if (slug === "") return { title: "AI Tools for Ads: Video, Image & Audio | BuzzVideo", description: "Every BuzzVideo AI tool for making ads: video, image, voiceover, music and avatar tools, plus free tools with no sign-up." };
  const t = toolBySlug(slug);
  if (!t) return undefined;
  return { title: t.metaTitle, description: t.metaDescription, image: t.media?.kind === "image" ? t.media.src : t.media?.poster };
}
