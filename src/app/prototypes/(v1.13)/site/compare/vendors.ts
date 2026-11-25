// 竞品替代页 / 榜单页用的厂商事实(2026-11-19 核实,2026-11-23 复核定价页，只取各家官网:定价页、功能页、帮助中心;不用评测站)。
// 复核记录见同目录 RESEARCH-NOTES.md。
// 规则:
// - 每条事实都能在 sources 里的官网页面找到;核实不到的不写(Arcads 价格只在 App 里、Higgsfield / Kling 会员价是 JS 渲染、
//   Murf 月付价、Claid 价格、Udio 授权条款都没核实到，页面上不写数字)。
// - 不提 Veo、Seedance 1.5 Pro(竞品页面上有，我们不写)。
// - BuzzVideo 自己的事实只从仓库来:models-catalog(上线模型)、model-facts、tool-content、model-page/model-data.ts 的 PLANS。

import { MODELS } from "../../site-nav/models-catalog";
import { PLANS } from "../../model-page/model-data";
import { SIGNUP_CREDITS } from "../tools/credits";

export type Src = { label: string; url: string };
export type Vendor = {
  key: string;
  name: string;
  /** 官网首页 */
  site: string;
  /** 一句话：它是什么(按厂商自己的说法) */
  what: string;
  /** 最低付费档(写清月付 / 年付) */
  entry: string;
  /** 免费额度 / 试用 */
  free: string;
  strengths: string[];
  cautions: string[];
  sources: Src[];
  /** 站内页面(BuzzVideo 自己、TopView 替代页) */
  href?: string;
};

const live = MODELS.filter((m) => m.release === "live");
const liveOf = (t: "video" | "image" | "audio") => live.filter((m) => m.type === t);
export const BV_COUNTS = { video: liveOf("video").length, image: liveOf("image").length, audio: liveOf("audio").length };
export const BV_VIDEO_NAMES = liveOf("video").map((m) => m.name);
const $ = (n: number) => `$${n}`;
export const BV_ENTRY = `Starter ${$(PLANS.starter.perMonth)}/mo billed yearly (${PLANS.starter.credits.toLocaleString("en-US")} credits a month)`;
export const BV_FREE = `${SIGNUP_CREDITS} free credits at sign-up for Seedream 4.5, Seedream 5.0 lite and Seed Audio 1.0; video models need a paid plan`;
export const BV_PLANS_LINE = `Starter ${$(PLANS.starter.perMonth)}, Pro ${$(PLANS.pro.perMonth)} and Ultra ${$(PLANS.ultra.perMonth)} a month, billed yearly`;
export const BV_SOURCES: Src[] = [{ label: "BuzzVideo pricing", url: "https://buzzvideo.ai/pricing" }];

export const VENDORS: Record<string, Vendor> = {
  buzzvideo: {
    key: "buzzvideo",
    name: "BuzzVideo",
    site: "https://buzzvideo.ai",
    href: "/",
    what: `BuzzVideo is an AI ad studio that runs ${BV_COUNTS.video} video, ${BV_COUNTS.image} image and ${BV_COUNTS.audio} audio models on one account, with a Marketing Agent that turns a brief, product photo or product link into finished ads.`,
    entry: BV_ENTRY,
    free: BV_FREE,
    strengths: [
      `${BV_COUNTS.video} video models in one place, including ${BV_VIDEO_NAMES.slice(0, 4).join(", ")}, so each shot can use the model that suits it.`,
      "The Marketing Agent plans the ad, picks a model per shot, adds a voiceover and returns every size you asked for.",
      "URL to Video reads a product page with Wan 3.0; BuzzVideo MCP runs the same tools from ChatGPT or Claude.",
      "Image, voiceover and music tools on the same credits, so a whole ad set is made in one account.",
    ],
    cautions: [
      "Free credits do not cover video: every video model needs Starter, Pro or Ultra, and Seedance 2.5 and Seedance 2.0 need Pro or Ultra.",
      "No published stock-avatar library count; presenters are generated or made from your photo.",
    ],
    sources: BV_SOURCES,
  },

  topview: {
    key: "topview",
    name: "TopView AI",
    site: "https://www.topview.ai",
    href: "/buzzvideo-vs-topview",
    what: "TopView AI is an AI video tool for ecommerce product video ads.",
    entry: "See our TopView AI alternatives page",
    free: "See our TopView AI alternatives page",
    strengths: [],
    cautions: [],
    sources: [],
  },

  creatify: {
    key: "creatify",
    name: "Creatify",
    site: "https://creatify.ai",
    what: "Creatify is an AI ad generator that makes video ads for products from any URL, with AI avatars and a playground of third-party video and image models.",
    entry: "Standard $15/mo billed monthly or $10/mo billed annually (55 credits a month, videos up to 2 minutes)",
    free: "Free plan: 10 credits a month, up to 2 video ads or 20 image ads, with a watermark",
    strengths: [
      "1,500+ AI presenters, and every avatar lip-syncs in 75+ languages with 140+ voices.",
      "A model playground with Kling, Seedance, MiniMax, Wan, Grok Video, Nano Banana, GPT Image and Seedream.",
      "Separate API plans (from $99/mo) and an Enterprise tier with SOC 2 and SSO.",
      "Ad-ops features such as ad account connections, routines and a managed Studio service.",
    ],
    cautions: [
      "The full 1,500-avatar library and custom avatars start on Pro ($55/mo monthly); Free and Standard get 300 AI actors.",
      "Credits are small per plan (55 on Standard), so check how many videos your plan actually covers.",
    ],
    sources: [
      { label: "Creatify homepage", url: "https://creatify.ai/" },
      { label: "Creatify pricing", url: "https://creatify.ai/pricing" },
      { label: "Creatify AI avatar", url: "https://creatify.ai/features/ai-avatar" },
      { label: "Creatify model playground", url: "https://creatify.ai/features/model-playground" },
    ],
  },

  arcads: {
    key: "arcads",
    name: "Arcads",
    site: "https://www.arcads.ai",
    what: "Arcads is an AI ad creation platform built around 1,000+ AI actors and leading video and image models.",
    entry: "Not published: Arcads shows USD prices only on the pricing page inside the app",
    free: "No free plan; a 72-hour trial with 1,000 credits (card required, then Starter starts unless cancelled)",
    strengths: [
      "1,000+ AI actors, plus custom actors.",
      "Talking actors in 74 languages with accents, and video translation in 176 language and accent options.",
      "Workflows make a full batch in one run, such as one script across several actors and languages.",
      "Public API and Lip Sync API from Pro, an Arcads MCP, and unused credits roll over on Pro and above.",
    ],
    cautions: [
      "Prices are not public before sign-up, so you cannot compare cost per video up front.",
      "No free plan; the trial needs a card and rolls into a paid plan.",
    ],
    sources: [
      { label: "Arcads homepage", url: "https://www.arcads.ai/" },
      { label: "What is Arcads (help center)", url: "https://help.arcads.ai/en/articles/17594889-what-is-arcads" },
      { label: "How Arcads pricing works", url: "https://help.arcads.ai/en/articles/17595066-how-does-arcads-pricing-work" },
      { label: "Arcads FAQ", url: "https://help.arcads.ai/en/articles/17350051-arcads-faq" },
    ],
  },

  makeugc: {
    key: "makeugc",
    name: "MakeUGC",
    site: "https://www.makeugc.ai",
    what: "MakeUGC is an AI video generator for ads that turns a product URL into UGC-style videos with 1,000+ AI actors.",
    entry: "Starter $59/mo billed monthly or $29.50/mo billed yearly (500 credits a month, 480p/720p export)",
    free: "No free plan; any plan can be tried for $1 and then renews at full price unless cancelled",
    strengths: [
      "Up to 1,000+ AI actors (300+ on Starter, 1,000+ on Pro) with lip-sync in 50+ languages.",
      "Product in Hand puts your product in the actor's hands; Batch Mode makes 10 variations at once.",
      "Third-party video models including Seedance, Kling, Sora, Grok Imagine, MiniMax and Wan.",
      "API and MCP included on the Pro plan.",
    ],
    cautions: [
      "Starter exports at 480p or 720p; HD, 2K and 4K start on Growth ($79/mo monthly).",
      "Its annual prices were Black Friday promotional prices when we checked, so confirm the renewal price.",
    ],
    sources: [
      { label: "MakeUGC homepage", url: "https://www.makeugc.ai/" },
      { label: "MakeUGC pricing", url: "https://makeugc.ai/pricing" },
    ],
  },

  pippit: {
    key: "pippit",
    name: "Pippit",
    site: "https://www.pippit.ai",
    what: "Pippit is CapCut's creative agent for video and image production that turns a link, file or media into marketing videos.",
    entry: "Starter includes 1,575 credits a month; we could not confirm a stable USD price, because the pricing page showed only promotional yearly prices next to higher list prices",
    free: "Free plan with free daily credits, no credit card required",
    strengths: [
      "Built-in publishing, scheduling, analytics and asset management next to creation.",
      "Product photo tools: background removal and replacement, AI backgrounds and product showcases.",
      "Named models include Seedance 2.5, Sora 2, Nano Banana Pro and Seedream 5.0 Pro.",
    ],
    cautions: [
      "Paid prices shown were promotional, so renewal may cost more; check the price in your region at checkout.",
      "Pippit's pages disagree on whether free exports carry a watermark; check before you publish.",
    ],
    sources: [
      { label: "Pippit homepage", url: "https://www.pippit.ai/" },
      { label: "Pippit pricing", url: "https://www.pippit.ai/pricing" },
      { label: "Pippit AI ad video maker", url: "https://www.pippit.ai/tools/ai-ad-video-maker" },
    ],
  },

  heygen: {
    key: "heygen",
    name: "HeyGen",
    site: "https://www.heygen.com",
    what: "HeyGen is an AI video platform for avatar videos, video translation and URL-to-video, with its own avatar and voice models.",
    entry: "Creator $29/mo billed monthly or $24/mo billed yearly (600 credits, 1080p, HeyGen branding removed)",
    free: "Free plan: 3 videos a month up to 1 minute each, with a watermark",
    strengths: [
      "1,100+ AI avatars and support for 175+ languages.",
      "Video translation with voice cloning and lip-sync, from a file or a YouTube link.",
      "APIs for video generation, translation and lip sync; SOC 2 Type II, GDPR and CCPA listed.",
      "URL to Video reads Shopify and Etsy product pages and outputs 16:9, 1:1 or 9:16.",
    ],
    cautions: [
      "4K and Seedance 2.5 start on Pro ($49/mo billed monthly).",
      "Pages behind a login or single-page apps need the script pasted in by hand for URL to Video.",
    ],
    sources: [
      { label: "HeyGen homepage", url: "https://www.heygen.com/" },
      { label: "HeyGen pricing", url: "https://www.heygen.com/pricing" },
      { label: "HeyGen avatars", url: "https://www.heygen.com/avatars" },
      { label: "HeyGen URL to Video", url: "https://www.heygen.com/tool/url-to-video" },
    ],
  },

  synthesia: {
    key: "synthesia",
    name: "Synthesia",
    site: "https://www.synthesia.io",
    what: "Synthesia is an enterprise AI video platform that makes presenter videos with AI avatars, voiceovers and translation in 140+ languages.",
    entry: "Starter $19/mo billed monthly or $14/mo billed yearly (about 12 minutes of video a month, Synthesia logo removed)",
    free: "Basic plan: 10 minutes of video or dubbing a month, 9 avatars, with a Synthesia watermark",
    strengths: [
      "140+ languages with one-click translation and AI dubbing that keeps the original voice.",
      "SOC 2 Type II, ISO 27001, ISO 27701 and ISO 42001, GDPR and EU data residency listed.",
      "Start a video from a prompt, a slide deck, a document or a link.",
      "Video, dubbing and interactive avatar APIs; Enterprise includes SSO and SCIM.",
    ],
    cautions: [
      "Built for presenter-led training and communication videos rather than product-shot ads.",
      "No third-party video models such as Seedance or Kling are listed.",
    ],
    sources: [
      { label: "Synthesia homepage", url: "https://www.synthesia.io/" },
      { label: "Synthesia pricing", url: "https://www.synthesia.io/pricing" },
    ],
  },

  higgsfield: {
    key: "higgsfield",
    name: "Higgsfield",
    site: "https://higgsfield.ai",
    what: "Higgsfield is a generative platform for creative production that brings 35+ frontier models together with its own production engine.",
    entry: "Starter $15/mo with 200 credits, per Higgsfield's own pricing guide (Oct 2026); the live pricing page loads in the browser and could not be read",
    free: "Free plan on a limited set of models; Higgsfield's pages differ on whether it includes daily credits",
    strengths: [
      "35+ models in one place, including Kling 3.0, Seedance 2.5 and 2.0, Wan and MiniMax.",
      "Marketing Studio turns a product page, website or social link into a 12 to 15 second ad.",
      "100+ avatars and dubbing into 18 languages with re-done lip sync.",
      "Upscaling to 4K and a Claude MCP connection.",
    ],
    cautions: [
      "Prices change with promotions (a Black Friday banner was live when we checked), so confirm the plan price at checkout.",
      "Marketing Studio ads are 12 to 15 seconds long.",
    ],
    sources: [
      { label: "Higgsfield homepage", url: "https://higgsfield.ai/" },
      { label: "Higgsfield URL to video", url: "https://higgsfield.ai/url-to-video" },
      { label: "Higgsfield pricing explained (official blog)", url: "https://higgsfield.ai/blog/higgsfield-pricing-explained" },
    ],
  },

  sync: {
    key: "sync",
    name: "sync.",
    site: "https://sync.so",
    what: "sync. (Sync Labs) is a lip-sync and visual dubbing tool that matches the mouth in existing footage to new audio.",
    entry: "Creator $19/mo plus $0.05 per second of usage (no watermark, up to 5 minutes per video)",
    free: "No free plan listed; Hobbyist is $5/mo plus usage, with a watermark",
    strengths: [
      "Own lip-sync models (sync-3, lipsync-2-pro) that handle side profiles, low light, several faces and fast camera moves.",
      "API and SDKs on every plan, and 4K ProRes output.",
      "Plugins for Premiere, DaVinci Resolve and ComfyUI.",
    ],
    cautions: [
      "Lip sync only: no avatar library and no text or image to video.",
      "Billing is per second on top of the plan fee.",
    ],
    sources: [
      { label: "sync. homepage", url: "https://sync.so/" },
      { label: "sync. pricing", url: "https://sync.so/pricing" },
    ],
  },

  runway: {
    key: "runway",
    name: "Runway",
    site: "https://runway.com",
    what: "Runway is an AI creative platform built on its own video models, such as Gen-4.5, with tools for ads and an API.",
    entry: "Standard $12/mo billed yearly, listed at $15 (625 credits a month, no watermark)",
    free: "Free plan: 125 one-time credits on a limited set of models",
    strengths: [
      "Its own frontier video model, Gen-4.5, plus Aleph and Act-Two for editing and performance.",
      "Kling 4.0 and Nano Banana Pro on Standard; Seedance 2.5 from Pro.",
      "Runway Ads makes on-brand ad variations, and Runway Dev offers an API.",
    ],
    cautions: ["Seedance 2.5 needs Pro ($28/mo billed yearly, listed at $35).", "Credits do not roll over on Standard or Pro.", "No lip sync or avatar workflow listed on the homepage."],
    sources: [
      { label: "Runway homepage", url: "https://runway.com/" },
      { label: "Runway pricing", url: "https://runway.com/pricing" },
    ],
  },

  luma: {
    key: "luma",
    name: "Luma Dream Machine",
    site: "https://lumalabs.ai",
    what: "Luma is an AI creative platform whose Dream Machine makes video and images with Luma's own Ray3.2 and Uni-1 models.",
    entry: "Plus $30/mo, or $25/mo billed yearly (10,000 credits, commercial use)",
    free: "No free plan listed on the pricing page",
    strengths: ["Own video model Ray3.2 with frame-level control and consistency across shots.", "Paid plans state commercial use, and Ray3.2 and Uni-1.1 have an API."],
    cautions: ["No avatar, lip-sync or product-URL tools listed.", "Entry price is higher than most tools on this list."],
    sources: [
      { label: "Luma homepage", url: "https://lumalabs.ai/" },
      { label: "Luma pricing", url: "https://lumalabs.ai/pricing" },
    ],
  },

  kling: {
    key: "kling",
    name: "Kling AI",
    site: "https://kling.ai",
    what: "Kling AI is Kuaishou's own video and image generator, home of the Kling 4.0 video model.",
    entry: "Not verified: membership prices load inside the app",
    free: "New users get sign-up credits and can claim more by logging in each month",
    strengths: [
      "First-party access to Kling 4.0 and Kling 3.0 Omni from the team that builds them.",
      "Motion Control, AI Avatar, a Canvas workspace and an API platform.",
    ],
    cautions: ["One model family only.", "Watermark removal is a premium-only feature; bought credits do not unlock it."],
    sources: [
      { label: "Kling AI homepage", url: "https://kling.ai/" },
      { label: "Kling AI credit policy", url: "https://kling.ai/docs/point-policy" },
    ],
  },

  elevenlabs: {
    key: "elevenlabs",
    name: "ElevenLabs",
    site: "https://elevenlabs.io",
    what: "ElevenLabs is an AI voice platform for text to speech, voice cloning, dubbing and music.",
    entry: "Starter $6/mo ($1 first month), or $5/mo billed yearly (30k credits, about 30 minutes of speech, commercial license)",
    free: "Free plan: 10k credits a month (about 10 minutes of speech); the commercial license starts on Starter",
    strengths: [
      "90+ languages on its newest speech model and a very large voice library.",
      "Instant voice cloning from a short clip and Professional Voice Cloning from 30+ minutes of audio.",
      "Streaming TTS API with TypeScript and Python SDKs.",
    ],
    cautions: ["The free plan is not for commercial use.", "Voice only: you need another tool for the video itself."],
    sources: [
      { label: "ElevenLabs text to speech", url: "https://elevenlabs.io/text-to-speech" },
      { label: "ElevenLabs pricing", url: "https://elevenlabs.io/pricing" },
    ],
  },

  elevenmusic: {
    key: "elevenmusic",
    name: "Eleven Music",
    site: "https://elevenlabs.io/music",
    what: "Eleven Music is ElevenLabs' AI music generator for songs, beats and melodies with vocals and lyrics.",
    entry: "Shares ElevenLabs credits: Starter $6/mo ($1 first month) includes commercial music use",
    free: "Free plan for personal use only",
    strengths: [
      "Vocals and lyrics from a lyric, mood, loop or voice recording, in several languages.",
      "ElevenLabs says its music is cleared for broad commercial use on paid plans; an API is available.",
    ],
    cautions: ["Self-serve plans exclude film, TV and studio games; those need Enterprise.", "We could not verify the maximum song length on the music page."],
    sources: [
      { label: "Eleven Music", url: "https://elevenlabs.io/music" },
      { label: "ElevenLabs pricing", url: "https://elevenlabs.io/pricing" },
    ],
  },

  murf: {
    key: "murf",
    name: "Murf AI",
    site: "https://murf.ai",
    what: "Murf AI is a text-to-speech platform for studio-quality voiceovers and voice agents.",
    entry: "Creator from $19/mo billed annually",
    free: "Free plan: 10 minutes of voice generation, 2 projects, no credit card",
    strengths: ["Voiceovers in 35+ languages with voice cloning on paid plans.", "Murf states full commercial usage rights for audio made with its TTS; Falcon API from $0.01 per minute."],
    cautions: ["Monthly-billing prices were not visible on the public pricing page.", "Voice only: no video generation."],
    sources: [{ label: "Murf AI text to speech", url: "https://murf.ai/text-to-speech" }],
  },

  suno: {
    key: "suno",
    name: "Suno",
    site: "https://suno.com",
    what: "Suno is an AI music generator that makes complete original songs with vocals, lyrics and full production.",
    entry: "Pro $8/mo, or $96 billed yearly (2,500 credits and 20 downloads a month, commercial use)",
    free: "Free plan: 50 credits a day, personal use only, no downloads",
    strengths: [
      "Full songs with vocals and your own lyrics; Voices lets it sing in a recording of your voice.",
      "Songs made on Pro or Premier stay yours to use commercially after you cancel.",
    ],
    cautions: ["Free songs are non-commercial and Suno keeps ownership.", "Downloads are capped per month on every plan."],
    sources: [
      { label: "Suno pricing", url: "https://suno.com/pricing" },
      { label: "Suno ownership help article", url: "https://help.suno.com/en/articles/2416769" },
      { label: "Suno terms update", url: "https://suno.com/blog/suno-updates-tos" },
    ],
  },

  udio: {
    key: "udio",
    name: "Udio",
    site: "https://www.udio.com",
    what: "Udio is an AI music generator.",
    entry: "Standard $10/mo, or $8/mo billed yearly",
    free: "10 credits a day, 100 a month",
    strengths: ["Two-minute song generations on Standard."],
    cautions: ["Downloading audio, video and stems has been disabled since Udio's UMG partnership, so tracks cannot be taken into an ad edit."],
    sources: [
      { label: "Udio pricing", url: "https://www.udio.com/pricing" },
      { label: "Udio UMG partnership changes", url: "https://help.udio.com/en/articles/12683565-changes-associated-with-the-universal-music-group-umg-partnership" },
    ],
  },

  photoroom: {
    key: "photoroom",
    name: "Photoroom",
    site: "https://www.photoroom.com",
    what: "Photoroom is an AI photo editor for product images, with background removal, AI backgrounds and batch editing.",
    entry: "Pro includes 8,000 AI credits and 1,000 exports a month; dollar prices did not load on the public pricing page when we checked",
    free: "Free plan for personal, non-commercial use only; 7-day trial on yearly Pro and Max",
    strengths: [
      "Unlimited core tools such as the background remover, plus AI backgrounds, AI fashion models and virtual try-on.",
      "Batch editing of thousands of images and an image API from $0.02 per image.",
      "Video Ad Maker on Max and Ultra turns product photos into video ads; Shopify integration from Max.",
    ],
    cautions: ["Free use is non-commercial.", "Video for ads starts on Max (25,000 AI credits and 3,000 exports a month)."],
    sources: [
      { label: "Photoroom pricing", url: "https://www.photoroom.com/pricing" },
      { label: "Photoroom API pricing", url: "https://www.photoroom.com/api/pricing" },
      { label: "Photoroom plans (help center)", url: "https://help.photoroom.com/en/articles/6976012-what-are-photoroom-s-plans" },
    ],
  },

  claid: {
    key: "claid",
    name: "Claid.ai",
    site: "https://claid.ai",
    what: "Claid.ai is an AI product photography suite to generate, enhance and edit product images.",
    entry: "Not verified: prices load from Claid's billing system at runtime",
    free: "Free trial with 50 credits for any operation, plus 50 API credits",
    strengths: [
      "AI Photoshoot, AI backgrounds, AI fashion, upscaling, outpainting and AI shadows.",
      "Batch processing on Pro and Business, and a real-time or batch API.",
      "Short 5-second AI product videos.",
    ],
    cautions: ["We could not verify plan prices on the public page.", "AI Video is not part of the free trial."],
    sources: [{ label: "Claid.ai pricing", url: "https://claid.ai/pricing" }],
  },

  pebblely: {
    key: "pebblely",
    name: "Pebblely",
    site: "https://pebblely.com",
    what: "Pebblely is an AI product photo generator that places your product in themed scenes.",
    entry: "Lite $9/mo, or $7.50/mo billed yearly (30 images a month)",
    free: "No free trial",
    strengths: ["100+ templates and 40+ background themes, plus custom prompts.", "Bulk generation from Basic, and you own the photos you generate."],
    cautions: ["No free trial and no refunds.", "Images only: no video, and unused images do not roll over."],
    sources: [
      { label: "Pebblely homepage", url: "https://pebblely.com/" },
      { label: "Pebblely pricing", url: "https://pebblely.com/pricing" },
    ],
  },
};

export const vendor = (k: string) => VENDORS[k];
