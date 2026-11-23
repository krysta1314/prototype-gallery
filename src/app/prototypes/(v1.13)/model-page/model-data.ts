// 模型页模板的数据层(2026-11-18)。一个模型 = 一份 ModelPageContent(编辑写的文案)+ 自动带出的数据:
//   - 参数(时长 / 比例 / 分辨率 / 支持的输入模式)读 v1.12 的 capabilities.ts —— 和产品生成器同一份数据,不手抄;
//   - 价格读线上定价接口 webapi.buzzvideo.ai/web/v1/pricing/models(原型用 2026-11-18 的快照 pricing-snapshot.json;
//     真实页面在服务端拉接口 + ISR 缓存,改价后页面跟着变)。
// 文案事实来源:2026-11-02 博客 kling-4-0-for-ads(已核对 fal 官方说明、Wikipedia)、2026-11-10 模型博客 BRIEF 的套餐数据。
// 规则:不写没核实的功能 / 数字;能力按 v1.12 上线后的产品(若模型页早于 v1.12 上线,「What it can do」要按当时产品删减)。

import { modelCaps, MODE_LABEL, type ModelCaps, type ModelKey, type ModeKey } from "../../(v1.12)/video-gen-modes/app/capabilities";
import pricing from "./pricing-snapshot.json";

const M = "/prototypes/model-page";

/* ───────── 套餐(pricing 页,2026-11-10 BRIEF 核对) ───────── */
export const PLANS = {
  starter: { name: "Starter", perMonth: 14, credits: 1900 },
  pro: { name: "Pro", perMonth: 35, credits: 4900 },
  ultra: { name: "Ultra", perMonth: 63, credits: 8900 },
};
/** Pro 年付每积分约 $0.0071(示例换算用) */
export const USD_PER_CREDIT = (PLANS.pro.perMonth * 12) / (PLANS.pro.credits * 12);

type Sku = { dims: Record<string, string>; credits: number };
const SKUS = pricing.models as unknown as Record<string, { company: string; skus: Sku[] }>;
export const PRICING_SOURCE = { url: pricing.source, fetched: pricing.fetched };

/** 查某模型某档位的积分;dims 只比对传进来的键 */
export function credits(model: string, dims: Record<string, string>): number | undefined {
  return SKUS[model]?.skus.find((s) => Object.entries(dims).every(([k, v]) => s.dims[k] === v))?.credits;
}

/* ───────── 内容类型 ───────── */

export type Media = { video: string; poster: string; ratio: "9/16" | "16/9" };

export type ModelPageContent = {
  slug: string;
  caps: ModelKey;
  /** 定价接口里的名字 */
  pricingName: string;
  name: string;
  family: { name: string; href: string };
  developer: string;
  released: string;
  plans: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  /** 答案优先的定义句(2 句):AI 搜索最常整句引用,也和 llms.txt 里的模型描述一致 */
  definition: string;
  hero: Media;
  /** 首屏成片下方的说明(写清设置和积分,只写画面里真有的) */
  heroCaption: string;
  bestFor: { title: string; body: string }[];
  capabilities: { title: string; body: string; media?: Media; mode?: ModeKey }[];
  examples: { title: string; caption: string; media: Media; settings: string; credits: number; prompt?: { label: string; text: string } }[];
  howTo: { title: string; body: string }[];
  promptTips: string[];
  /** 价格表展示的档位 */
  priceGrid: { durations: string[]; resolutions: string[] };
  /** 「什么时候用别的模型」—— 诚实说明短板,GEO 引用更信任平衡的内容 */
  notFor: { title: string; body: string; alt?: { label: string; href: string } }[];
  compare: { model: string; href: string; length: string; typical: string; plans: string; bestFor: string; self?: boolean }[];
  faq: { q: string; a: string }[];
  /** 模型子页(spokes)+ 对比页 */
  spokes: { label: string; href: string; desc: string }[];
  siblings: { label: string; href: string; desc: string }[];
  others: { label: string; href: string; vendor: string }[];
  sources: { label: string; url: string }[];
  lastVerified: string;
};

/* ───────── Kling 4.0(样例) ───────── */

const k = (d: string, r: string) => credits("Kling 4.0", { duration: d, resolution: r })!;

export const KLING_4: ModelPageContent = {
  slug: "kling-4-0",
  caps: "kling-4.0",
  pricingName: "Kling 4.0",
  name: "Kling 4.0",
  family: { name: "Kling", href: "/kling" },
  developer: "Kuaishou",
  released: "October 2026",
  plans: "Starter, Pro and Ultra",
  metaTitle: "Kling 4.0 AI Video Generator: 30s Clips with Sound | BuzzVideo",
  metaDescription: `Make 3–30 second Kling 4.0 videos with native sound on BuzzVideo. See specs, prompt examples and credit prices from ${k("5", "720p")} credits per clip.`,
  h1: "Kling 4.0 AI Video Generator",
  definition: `Kling 4.0 is Kuaishou's AI video model that generates one continuous 3 to 30 second clip with native sound. On BuzzVideo it is built for one-take UGC ads, product demos and story ads, from ${k("5", "720p")} credits for a 5-second 720p clip.`,
  hero: { video: `${M}/kling-ugc.mp4`, poster: `${M}/kling-ugc.jpg`, ratio: "9/16" },
  heroCaption: `Made with Kling 4.0 on BuzzVideo · one take · 9:16 · 15 s · 720p · ${k("15", "720p")} credits`,
  bestFor: [
    { title: "Full UGC testimonials in one take", body: "A 20–30 second talking-to-camera script with the product in hand, without a face that drifts between clips." },
    { title: "Walk-through product demos", body: "Open the box, show the feature, show the result, in one continuous camera move." },
    { title: "Story ads with a beat structure", body: "Timecoded prompts (0–6 s, 6–12 s…) direct a mini narrative that still lands under 30 seconds." },
  ],
  capabilities: [
    { title: "30-second single takes", body: "One continuous clip of 3 to 30 seconds, double Kling 3.0's 15-second limit. Pick any whole second.", media: { video: `${M}/kling-30s.mp4`, poster: `${M}/kling-30s.jpg`, ratio: "16/9" } },
    { title: "Omni Reference", body: "Mix up to 10 images and 5 short videos as references, plus up to 7 characters or objects that stay consistent.", media: { video: `${M}/kling-omni.mp4`, poster: `${M}/kling-omni.jpg`, ratio: "16/9" }, mode: "omni" },
    { title: "Native sound and lip sync", body: "Dialogue, ambience and lip movement come out with the picture, so a rough cut is watchable straight away. The video at the top of this page is one take, sound included." },
    { title: "First & last frame", body: "Set the opening frame, the closing frame, or both, and Kling 4.0 fills the motion in between.", mode: "frames" },
    { title: "Keyframes", body: "Pin up to 8 frames between start and end to steer a longer move.", mode: "keyframes" },
    { title: "Edit video", body: "Change what's in an existing 3–30 second clip and keep the timing.", mode: "edit" },
  ],
  examples: [
    {
      title: "Draft the opening beat first",
      caption: "Made with Kling 4.0 on BuzzVideo: a 5-second 720p draft of the hook from the ad at the top of this page, used to check face, voice and product before paying for the full take.",
      media: { video: `${M}/kling-draft5s.mp4`, poster: `${M}/kling-draft5s.jpg`, ratio: "9/16" },
      settings: "9:16 · 5 s · 720p",
      credits: k("5", "720p"),
      prompt: {
        label: "Prompt template for this ad format",
        text: 'UGC testimonial · 9:16 · 15 s. One continuous handheld phone-style take, no cuts, natural daylight, native sound. Character (keep identical for the full clip): [a woman in her late 20s, shoulder-length dark hair, oversized cream sweater, small gold hoop earrings]. 0–4 s: close-up, she holds [product] up to the camera and says: "[Hook line, max 8 words]." 4–11 s: she uses the product at [a kitchen counter] and says: "[What changed, max 20 words]." 11–15 s: she points the product at camera and says: "[Call to action]." Keep the [product] label readable and unchanged.',
      },
    },
  ],
  howTo: [
    { title: "Open Kling 4.0", body: "In BuzzVideo, choose Video and pick Kling 4.0 in the model menu, or start from the Try it box on this page." },
    { title: "Describe the take", body: "Write the character once in detail, then split the clip into timecoded beats with the exact dialogue. Attach a product photo so the packaging matches." },
    { title: "Set length, ratio and resolution", body: "Choose 3–30 seconds, 9:16 for social or 16:9 for YouTube, and 720p or 1080p. The credit price shows before you press Create." },
    { title: "Draft, then go long", body: "Run the opening beat as a 5-second 720p draft. When the face, voice and product look right, generate the full take." },
  ],
  promptTips: [
    'Describe the person once at the top and add "keep identical for the full clip".',
    "Write 70–80 spoken words for 30 seconds; time the script out loud first.",
    "Spell unusual brand names phonetically in the dialogue line.",
    "Keep prices and dates out of the picture; add them as text when you edit.",
  ],
  /** 价格矩阵:行 = 时长,列 = 分辨率 */
  priceGrid: { durations: ["5", "10", "15", "30"], resolutions: ["720p", "1080p"] },
  notFor: [
    { title: "Cheap hook testing", body: "For 20 different 3-second openings, a shorter, cheaper model does the job.", alt: { label: "Kling 3.0", href: "/kling-3-0" } },
    { title: "Silent b-roll", body: "Kling 4.0 always generates sound on BuzzVideo. Mute it in your editor, or use a model with a sound switch.", alt: { label: "Wan 3.0", href: "/wan-3-0" } },
    { title: "4K masters", body: "BuzzVideo offers 720p and 1080p for Kling 4.0 today; 4K is listed by Kling but not available yet.", alt: { label: "Seedance 2.0", href: "/seedance" } },
    { title: "Top-fidelity hero shots", body: "When one shot has to look like real cinematography with heavy reference use, Seedance 2.5 is the stronger pick.", alt: { label: "Seedance 2.5", href: "/seedance-2-5" } },
  ],
  compare: [
    { model: "Kling 4.0", href: "/kling-4-0", length: "3–30 s", typical: `10 s 720p · ${k("10", "720p")}`, plans: "Starter+", bestFor: "One-take UGC and demos up to 30 s with sound", self: true },
    { model: "Seedance 2.5", href: "/seedance-2-5", length: "4–30 s", typical: `10 s 720p · ${credits("Seedance 2.5", { duration: "10", resolution: "720p", input_has_video: "no" })}`, plans: "Pro+", bestFor: "Highest-fidelity hero shots, heavy reference use" },
    { model: "Wan 3.0", href: "/wan-3-0", length: "2–30 s", typical: `10 s 720p · ${credits("Wan 3.0", { duration: "10", resolution: "720p" })}`, plans: "Starter+", bestFor: "Long single takes with audio for demos and explainers" },
    { model: "Kling 3.0", href: "/kling-3-0", length: "3–15 s", typical: `10 s standard · ${credits("Kling 3.0", { duration: "10", resolution: "std", with_audio: "yes" })}`, plans: "Starter+", bestFor: "Animating a product photo cheaply" },
  ],
  faq: [
    { q: "What is Kling 4.0?", a: "Kling 4.0 is the newest video model from Kuaishou's Kling family. It generates one continuous 3–30 second clip with native sound from text, images and video references." },
    { q: "When was Kling 4.0 released?", a: "Kuaishou opened a limited Kling 4.0 Flash preview on September 28, 2026, and released the full Kling 4.0 globally in October 2026. It is live on BuzzVideo now." },
    { q: "How long can a Kling 4.0 video be?", a: "Between 3 and 30 seconds per generation. On BuzzVideo you can pick any whole second in that range." },
    { q: "How much does Kling 4.0 cost?", a: `On BuzzVideo a 10-second 720p clip is ${k("10", "720p")} credits and a 30-second 1080p clip is ${k("30", "1080p").toLocaleString("en-US")} credits. On the Pro yearly plan that is roughly $${(k("10", "720p") * USD_PER_CREDIT).toFixed(2)} and $${(k("30", "1080p") * USD_PER_CREDIT).toFixed(2)}.` },
    { q: "Is Kling 4.0 free?", a: "Not on the Free plan. New accounts get 500 one-time credits that work on Seedream 4.5, Seedream 5.0 Lite and Seed Audio 1.0; Kling 4.0 starts on the Starter plan." },
    { q: "Kling 4.0 vs Seedance 2.5: which is better for ads?", a: "Kling 4.0 is the better value for long one-take UGC and demo clips, and it runs on Starter. Seedance 2.5 costs more and needs Pro or Ultra, but it is the pick for top-fidelity hero shots and heavy reference work." },
    { q: "Can I turn off sound in Kling 4.0?", a: "Not on BuzzVideo; Kling 4.0 always generates an audio track. Mute or replace it when you edit if you need silent footage." },
    { q: "Can I use Kling 4.0 inside ChatGPT or Claude?", a: "Yes. Connect BuzzVideo MCP to ChatGPT or Claude and ask for a Kling 4.0 video in the chat; it uses your BuzzVideo credits." },
  ],
  spokes: [
    { label: "Kling 4.0 Prompt Guide", href: "/kling-4-0-prompt-guide", desc: "Templates for UGC, demos and story ads" },
    { label: "Kling 4.0 Pricing", href: "/kling-4-0-pricing", desc: "Every length and resolution, in credits and dollars" },
    { label: "How to Use Kling 4.0", href: "/kling-4-0-how-to-use", desc: "Step by step, from first draft to final take" },
    { label: "Kling 4.0 vs Seedance 2.5", href: "/seedance-2-5-vs-kling-4-0", desc: "Which to pick for ads" },
    { label: "Kling 4.0 vs Kling 3.0", href: "/kling-4-0-vs-kling-3-0", desc: "What changed between versions" },
  ],
  siblings: [
    { label: "Kling 3.0", href: "/kling-3-0", desc: "3–15 s, cheaper product-photo animation" },
    { label: "Kling 3.0 Omni", href: "/kling-3-0-omni", desc: "Reference-driven clips up to 15 s" },
    { label: "Kling 3.0 Motion Control", href: "/motion-control", desc: "Copy moves from a reference video" },
  ],
  others: [
    { label: "Seedance 2.5", href: "/seedance-2-5", vendor: "ByteDance" },
    { label: "Wan 3.0", href: "/wan-3-0", vendor: "Alibaba" },
    { label: "Gemini Omni 1.2 Flash", href: "/gemini-omni-1-2-flash", vendor: "Google" },
    { label: "MiniMax H3", href: "/minimax-h3", vendor: "MiniMax" },
    { label: "Kling 3.0 Omni", href: "/kling-3-0-omni", vendor: "Kuaishou" },
    { label: "Seedance 2.5 Flash", href: "/seedance-2-5-flash", vendor: "ByteDance" },
  ],
  sources: [
    { label: "fal: What is Kling 4.0", url: "https://fal.ai/learn/tools/what-is-kling-4-0" },
    { label: "Wikipedia: Kling AI", url: "https://en.wikipedia.org/wiki/Kling_AI" },
    { label: "BuzzVideo pricing API (live credit prices)", url: "https://webapi.buzzvideo.ai/web/v1/pricing/models" },
  ],
  lastVerified: "November 18, 2026",
};

/* ───────── 从 capabilities.ts 带出的规格 ───────── */

export function specsOf(c: ModelPageContent) {
  const caps: ModelCaps = modelCaps(c.caps);
  return {
    caps,
    length: `${caps.durations.min}–${caps.durations.max} s`,
    ratios: ["Auto", ...caps.ratios].join(", "),
    resolutions: caps.resolutions.join(", "),
    modes: caps.modes.map((m) => MODE_LABEL[m]),
    references: caps.omni ? `Up to ${caps.omni.images} images, ${caps.omni.videos} videos${caps.omni.elements ? `, ${caps.omni.elements} characters or objects` : ""}` : "Images",
    multiShot: caps.multiShot ? `Yes, up to ${caps.multiShot.totalMax} s total` : "No",
  };
}
