// 落地页(OpenArt 版式)用的素材池和博客数据(2026-11-19)。
// 规则：只放 BuzzVideo 真实生成过的成片;知道是哪个模型做的就标模型名，不知道就只写「Made on BuzzVideo」,不张冠李戴。

import { MODELS, type ModelType } from "../../site-nav/models-catalog";
import { mediaOf, type Sample } from "../models/model-media";
import { modelHref } from "../models/model-content";

export type Pic = Sample & { model?: string; modelSlug?: string };

/** 某一类(图片 / 视频 / 音频)的全部真实成片，带模型名 */
export function picsOf(type: ModelType): Pic[] {
  const out: Pic[] = [];
  for (const m of MODELS.filter((x) => x.type === type)) for (const s of mediaOf(m.slug)) if (s.kind === type) out.push({ ...s, model: m.name, modelSlug: m.slug });
  if (type === "video") out.push(...SKILL_VIDEOS);
  return out;
}

/* MCP Skill 示例片(工具页首屏用的那几条):多模型合成，不标单一模型 */
const LOCAL = "/prototypes/site/tools";
const POSTER = "/video-library/posters";
const SKILL_VIDEOS: Pic[] = [
  ["link-to-ad", "A vertical video ad made from a product page link", "9:16"],
  ["ugc-product-review", "A creator-style product review video", "9:16"],
  ["unboxing-ugc", "A 15-second unboxing video made from one product photo", "9:16"],
  ["product-ad", "A product commercial made from photos", "9:16"],
  ["talking-product", "A talking product character ad", "9:16"],
  ["3d-product-video", "A 3D product turnaround video", "9:16"],
].map(([slug, alt, aspect]) => ({ kind: "video" as const, src: `${LOCAL}/${slug}.mp4`, poster: `${POSTER}/skill-${slug}.jpg`, aspect, alt, prompt: "", source: `MCP Skill 示例 ${slug}` }));

/** 首屏拼贴：优先用 own(本页模型 / 工具自己的成片),不够再用同类池补;音频页用图片池 */
export function heroPics(type: ModelType, own: Pic[] = [], n = 8): Pic[] {
  const pool = type === "audio" ? picsOf("image") : picsOf(type);
  const seen = new Set<string>();
  const out: Pic[] = [];
  for (const p of [...own.filter((x) => x.kind !== "audio"), ...pool]) {
    if (seen.has(p.src)) continue;
    seen.add(p.src);
    out.push(p);
    if (out.length >= n) break;
  }
  return out;
}

/** 按顺序轮着取一张(给卡片配图用),跳过已用的 */
export function picker(pool: Pic[]) {
  const used = new Set<string>();
  let i = 0;
  return (): Pic | undefined => {
    for (let k = 0; k < pool.length; k++) {
      const p = pool[(i + k) % pool.length];
      if (!used.has(p.src)) {
        used.add(p.src);
        i = (i + k + 1) % pool.length;
        return p;
      }
    }
    return pool.length ? pool[i++ % pool.length] : undefined;
  };
}

export const posterOf = (p?: Pic) => (p ? (p.kind === "video" ? p.poster ?? p.src : p.src) : undefined);
export const modelLinkOf = (p: Pic) => (p.modelSlug ? modelHref(p.modelSlug) : undefined);

/* ── 线上博客(buzzvideo.ai/blog,2026-11-02 发布的 26 篇 Skill 教程)。封面用同一篇文章里的示例片封面 ── */
export type Post = { title: string; href: string; cover: string; date: string; topic: "ads" | "video" | "image" | "audio" | "design" };
const P = (skill: string, title: string, slug: string, topic: Post["topic"]): Post => ({ title, href: `/blog/${slug}`, cover: `${POSTER}/skill-${skill}.jpg`, date: "Nov 2, 2026", topic });
export const POSTS: Post[] = [
  P("ugc-product-review", "How to Make a UGC Product Review Video with AI", "ugc-product-review-video-ai", "ads"),
  P("product-ad", "How to Make an AI Product Commercial from Photos", "ai-product-commercial", "video"),
  P("product-photos", "AI Product Photography from One Photo", "ai-product-photography-from-one-photo", "image"),
  P("marketplace-listing", "How to Make Amazon Listing Images with AI", "amazon-listing-images-ai", "image"),
  P("link-to-ad", "Turn a Product Link into Ads in ChatGPT or Claude", "product-link-to-ad-chatgpt-claude", "ads"),
  P("3d-product-video", "How to Make a 360 Product Video with AI", "360-product-video-ai", "video"),
  P("unboxing-ugc", "How to Make an AI Unboxing Video", "ai-unboxing-video", "video"),
  P("try-on-ugc", "How to Make an AI Try-On Video of Your Clothing", "ai-try-on-video", "image"),
  P("talking-product", "How to Make a Talking Product Video with AI", "talking-product-video-ai", "audio"),
  P("ad-hook-variants", "How to Make Ad Hook Variations with AI", "ad-hook-variations-ai", "ads"),
  P("ad-localizer", "How to Localize a Video Ad with AI", "localize-video-ads-ai", "audio"),
  P("photo-to-3d", "How to Turn a Photo into a 3D Figurine with AI", "photo-to-3d-figurine-ai", "image"),
  P("3d-director", "AI Video Camera Control with a 3D Blockout", "ai-video-camera-control-3d-blockout", "video"),
  P("faceless-explainer", "How to Make a Faceless Explainer Video with AI", "faceless-explainer-video-ai", "audio"),
  P("festival-campaign", "AI Christmas Campaign Creatives for the US & UK (2026)", "christmas-campaign-ai", "design"),
  P("ad-variations", "How to Make AI Ad Variations with New Talent", "ai-ad-variations-new-talent", "ads"),
];
export function postsFor(topic: Post["topic"], n = 3): Post[] {
  const a = POSTS.filter((p) => p.topic === topic);
  const b = POSTS.filter((p) => p.topic !== topic);
  return [...a, ...b].slice(0, n);
}
