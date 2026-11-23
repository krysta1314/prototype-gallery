/* 官网落地页通配路由的服务端外壳(2026-11-19):给每个页面在服务端输出 <title>、meta description、canonical 和分享卡片。
   之前整页是客户端组件，标题只能在浏览器里改,搜索引擎和 AI 抓到的都是「Buzz Prototypes」。
   页面本体仍在 SitePage.tsx(客户端组件：导航、toast、页内交互)。 */

import type { Metadata } from "next";
import { SitePage } from "./SitePage";
import { modelHref, modelPageData } from "../models/model-content";
import { mediaOf } from "../models/model-media";
import { MODELS, modelsOfType, type ModelType } from "../../site-nav/models-catalog";
import { toolMetaOf } from "../tools/tool-content";
import { PAGE_META } from "../pages-meta";

/** 正式域名:canonical 和分享卡片都指向线上真实网址(原型域名不该被收录) */
const SITE = "https://buzzvideo.ai";

const HUB_META: Record<ModelType, { title: string; description: string }> = {
  video: {
    title: "AI Video Models: Seedance, Kling, Wan & More | BuzzVideo",
    description: `Compare ${modelsOfType("video").length} AI video models by length, resolution and credit price, then generate with the one that fits your ad on BuzzVideo.`,
  },
  image: {
    title: "AI Image Models: GPT Image, Nano Banana & More | BuzzVideo",
    description: `Compare ${modelsOfType("image").length} AI image models by text accuracy, detail and price per image, all on one BuzzVideo account.`,
  },
  audio: {
    title: "AI Audio Models: Voiceover, Music & SFX | BuzzVideo",
    description: `Seed Audio 1.0 is live on BuzzVideo; ${modelsOfType("audio").length - 1} more voiceover, voice cloning, music and sound effects models arrive next release.`,
  },
};

function meta(path: string, title: string, description: string, image?: string): Metadata {
  const url = SITE + path;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", siteName: "BuzzVideo", locale: "en_US", url, title, description, ...(image ? { images: [{ url: image, width: 1200, height: 630 }] } : {}) },
    twitter: { card: image ? "summary_large_image" : "summary", title, description, ...(image ? { images: [image] } : {}) },
  };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const { slug = [] } = await params;
  const path = "/" + slug.join("/");
  if (slug[0] === "models" && slug.length === 2) {
    const t = slug[1] as ModelType;
    if (t in HUB_META) return meta(path, HUB_META[t].title, HUB_META[t].description);
    const d = modelPageData(slug[1]);
    if (d) {
      const img = mediaOf(d.m.slug).find((s) => s.kind === "image")?.src ?? mediaOf(d.m.slug).find((s) => s.poster)?.poster;
      return meta(modelHref(d.m.slug), d.metaTitle, d.metaDescription, img ? (img.startsWith("http") ? img : SITE + img) : undefined);
    }
  }
  /* 2026-11-19 落地页改成一级网址(照 Higgsfield):/ai-image-generator、/kling-4-0、/seedance */
  if (slug.length === 1 && PAGE_META[slug[0]]) {
    const pm = PAGE_META[slug[0]];
    return meta(path, pm.title, pm.description, pm.image ? SITE + pm.image : undefined);
  }
  if (slug.length === 1 && slug[0] !== "tools") {
    const hub = slug[0].match(/^ai-(video|image|audio)-models$/);
    if (hub) {
      const h = HUB_META[hub[1] as ModelType];
      return meta(path, h.title, h.description);
    }
    const t = toolMetaOf(slug[0]);
    if (t) return meta(path, t.title, t.description, t.image ? (t.image.startsWith("http") ? t.image : SITE + t.image) : undefined);
    const d = modelPageData(slug[0] === "seedance" ? "seedance-2-5" : slug[0]);
    if (d) {
      const img = mediaOf(d.m.slug).find((s) => s.kind === "image")?.src ?? mediaOf(d.m.slug).find((s) => s.poster)?.poster;
      return meta(modelHref(d.m.slug), d.metaTitle, d.metaDescription, img ? (img.startsWith("http") ? img : SITE + img) : undefined);
    }
  }
  if (slug[0] === "tools") {
    const t = toolMetaOf(slug.slice(1).join("/"));
    if (t) return meta(path, t.title, t.description, t.image ? (t.image.startsWith("http") ? t.image : SITE + t.image) : undefined);
  }
  return { title: `BuzzVideo AI · ${MODELS.length} AI models for ads`, description: "AI ads for marketers and creators." };
}

export default function Page() {
  return <SitePage />;
}

