/* 官网落地页通配路由的服务端外壳(2026-11-19):给每个页面在服务端输出 <title>、meta description、canonical 和分享卡片。
   之前整页是客户端组件，标题只能在浏览器里改,搜索引擎和 AI 抓到的都是「Buzz Prototypes」。
   页面本体仍在 SitePage.tsx(客户端组件：导航、toast、页内交互)。 */

import type { Metadata } from "next";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { MERGED, REMOVED, resolveHref, SEEDANCE_LIVE } from "../redirects";
import { pageMedia } from "../page-media";
import { SitePage } from "./SitePage";
import { modelHref, modelPageData } from "../models/model-content";
import { mediaOf } from "../models/model-media";
import { MODELS, type ModelType } from "../../site-nav/models-catalog";
import { toolBySlug, toolMetaOf } from "../tools/tool-content";
import { PAGE_META } from "../pages-meta";
import OG_PAGES from "../og-manifest.json";

/** 正式域名:canonical 和分享卡片都指向线上真实网址(原型域名不该被收录) */
const SITE = "https://buzzvideo.ai";
/* 2026-11-26 SEO 审核：分享图原来拼成 https://buzzvideo.ai/prototypes/site/...,正式站没有这个路径，分享卡片和 AI 引用都会缺图。
   素材现在只放在原型站，所以图片用原型站的绝对地址(能打开);上线时开发把素材搬到正式站后，改这一个常量即可。 */
const ASSET_ORIGIN = "https://prototype-gallery-bay.vercel.app";
const abs = (src: string) => (src.startsWith("http") ? src : ASSET_ORIGIN + src);
/* 没有专属配图的页(音频页、/canvas、/models)用的分享图 */
const P = "/prototypes/site";
function fallbackImage(path: string): string | undefined {
  const s = path.replace(/^\/(models\/)?/, "");
  if (s === "canvas") return `${P}/nav/studios/canvas.webp`;
  if (s === "models") return "https://assets.presslogic.com/cdn-cgi/image/width=1200,quality=85,format=auto,fit=scale-down/buzzvideo/static/models/cards/card-seedance-2-5.webp";
  if (/music|song|jingle|lyria|mureka/.test(s)) return `${P}/audio/portraits/promo.jpg`;
  if (/podcast/.test(s)) return `${P}/audio/portraits/conversational.jpg`;
  if (/sound-effects/.test(s)) return `${P}/audio/portraits/unboxing.jpg`;
  if (/voice|speech|tts|text-to-speech|seed-audio|elevenlabs|heygen-voice|replication/.test(s)) return `${P}/audio/portraits/narration.jpg`;
  return undefined;
}

/* 模型分类页已并进唯一的聚合页 /models(2026-11-24);旧网址 /ai-video-models 等的 title 和 canonical 都用聚合页的 */
const TYPES: ModelType[] = ["video", "image", "audio"];

function meta(path: string, title: string, description: string, image?: string): Metadata {
  const url = SITE + path;
  /* 2026-11-26 Monica:「每个落地页都要配上 OG」—— 每页一张设计过的 1200×630 分享图(深色底 + 白色大标题 + 右侧本页成片墙),
     由 scripts/site/gen-og.mjs 抓渲染后的页面生成到 public/prototypes/site/og/,清单在 og-manifest.json。有专属 OG 就优先用它 */
  const ogKey = path.replace(/^\//, "").replace(/\//g, "_");
  const ogImage = (OG_PAGES as string[]).includes(ogKey) ? { url: abs(`${P}/og/${ogKey}.jpg`), width: 1200, height: 630, alt: title.replace(/ \| BuzzVideo$/, "") } : undefined;
  /* 2026-11-25 SEO:没指定分享图的页面，用本页自己的配图(page-media.ts)当分享图 */
  if (!image) {
    const own = pageMedia(path.replace(/^\/(models\/)?/, "").replace(/^seedance$/, "seedance-2-5"))[0];
    const src = own ? (own.kind === "video" ? own.poster : own.src) : undefined;
    if (src) image = abs(src);
  }
  if (!image) image = fallbackImage(path);
  if (image) image = abs(image.replace(/^https:\/\/buzzvideo\.ai(?=\/prototypes\/)/, ""));
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", siteName: "BuzzVideo", locale: "en_US", url, title, description, ...(ogImage ? { images: [ogImage] } : image ? { images: [{ url: image }] } : {}) },
    twitter: { card: ogImage || image ? "summary_large_image" : "summary", title, description, ...(ogImage ? { images: [ogImage.url] } : image ? { images: [image] } : {}) },
  };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const { slug = [] } = await params;
  const path = "/" + slug.join("/");
  if (slug[0] === "models" && slug.length === 2) {
    const t = slug[1] as ModelType;
    if (TYPES.includes(t) && PAGE_META.models) return meta("/models", PAGE_META.models.title, PAGE_META.models.description);
    const d = modelPageData(slug[1]);
    if (d) {
      const img = mediaOf(d.m.slug).find((s) => s.kind === "image")?.src ?? mediaOf(d.m.slug).find((s) => s.poster)?.poster;
      return meta(modelHref(d.m.slug), d.metaTitle, d.metaDescription, img ? abs(img) : undefined);
    }
  }
  /* 2026-11-19 落地页改成一级网址(照 Higgsfield):/ai-image-generator、/kling-4-0、/seedance */
  if (slug.length === 1 && PAGE_META[slug[0]]) {
    const pm = PAGE_META[slug[0]];
    return meta(path, pm.title, pm.description, pm.image ? abs(pm.image) : undefined);
  }
  if (slug.length === 1 && slug[0] !== "tools") {
    const hub = slug[0].match(/^ai-(video|image|audio)-models$/);
    if (hub && PAGE_META.models) return meta("/models", PAGE_META.models.title, PAGE_META.models.description);
    const t = toolMetaOf(slug[0]);
    if (t) return meta(path, t.title, t.description, t.image ? abs(t.image) : undefined);
    const d = modelPageData(slug[0] === "seedance" ? "seedance-2-5" : slug[0]);
    if (d) {
      const img = mediaOf(d.m.slug).find((s) => s.kind === "image")?.src ?? mediaOf(d.m.slug).find((s) => s.poster)?.poster;
      return meta(modelHref(d.m.slug), d.metaTitle, d.metaDescription, img ? abs(img) : undefined);
    }
  }
  if (slug[0] === "tools" && slug.length > 1) {
    const t = toolMetaOf(slug.slice(1).join("/"));
    if (t) return meta(path, t.title, t.description, t.image ? abs(t.image) : undefined);
  }
  return { title: `BuzzVideo AI · ${MODELS.length} AI models for ads`, description: "AI ads for marketers and creators." };
}

export default async function Page({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug = [] } = await params;
  /* 2026-11-26 Seedance 2.5 原型落地页删除，线上已有 buzzvideo.ai/models/seedance:原型网址和并进它的旧页都跳过去 */
  const path = "/" + slug.join("/");
  if (path === "/seedance" || path === "/models/seedance" || path === "/models/seedance-2-5" || path === "/seedance-2-5") redirect(SEEDANCE_LIVE);
  if (slug.length === 1 && MERGED[slug[0]] && resolveHref("/" + slug[0]) === SEEDANCE_LIVE) redirect(SEEDANCE_LIVE);
  /* 2026-11-25 合并页：旧网址永久跳到目标页(上线时照 redirects.ts 配 301) */
  if (slug.length === 1 && MERGED[slug[0]]) permanentRedirect("/prototypes/site" + MERGED[slug[0]]);
  /* 删除名单里的页面(redirects.ts 的 REMOVED)一律 404,不管它属于哪类模板 */
  if (slug.length === 1 && REMOVED.has(slug[0])) notFound();
  /* 模型页的旧网址 /models/<slug> 也一样 404 */
  if (slug.length === 2 && slug[0] === "models" && REMOVED.has(slug[1])) notFound();
  if (slug.length === 2 && slug[0] === "models" && MERGED[slug[1]]) permanentRedirect("/prototypes/site" + MERGED[slug[1]]);
  const crumbs = breadcrumbsOf(slug);
  return (
    <>
      {/* 2026-11-26 SEO 审核：152 页都没有面包屑结构化数据。按「首页 › 分类 › 本页」输出 BreadcrumbList,Google 会在结果里显示路径 */}
      {crumbs && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs).replace(/</g, "\\u003c") }} />}
      <SitePage />
    </>
  );
}

/** 面包屑：模型页 Home › Models › 模型;其余落地页 Home › 本页。页面名取 H1 / 名称，没有就取标题冒号前那段 */
function breadcrumbsOf(slug: string[]) {
  const path = "/" + slug.join("/");
  const short = (t: string) => t.replace(/ \| BuzzVideo$/, "").split(/: | \(/)[0].trim();
  let items: { name: string; url: string }[] | undefined;
  const asModel = slug[0] === "models" && slug.length === 2 ? slug[1] : slug.length === 1 ? (slug[0] === "seedance" ? "seedance-2-5" : slug[0]) : undefined;
  const d = asModel ? modelPageData(asModel) : undefined;
  if (d) items = [{ name: "Models", url: SITE + "/models" }, { name: d.m.name, url: SITE + modelHref(d.m.slug) }];
  else if (slug.length === 1) {
    const t = toolBySlug(slug[0]);
    const pm = PAGE_META[slug[0]];
    const name = t?.name ?? (pm ? short(pm.title) : undefined);
    if (name) items = [{ name, url: SITE + path }];
  }
  if (!items) return undefined;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Home", url: SITE + "/" }, ...items].map((x, i) => ({ "@type": "ListItem", position: i + 1, name: x.name, item: x.url })),
  };
}

