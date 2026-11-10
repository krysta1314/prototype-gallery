/* 工具页的 <title> / description / 分享卡片 + 结构化数据(JSON-LD)。每个工具的 page.tsx(服务端组件)用这两个:
     export const metadata = toolMetadata("lip-sync");
     <ToolJsonLd tool="lip-sync" />
   文字和页面上看得见的落地页内容是同一份(seo/content.ts、seo/guides.ts)。正式环境把 ORIGIN 换成线上域名;
   原型域名不该被收录(上线后会和正式域名重复),这点留给开发在正式环境处理。 */

import type { Metadata } from "next";
import { TOOLS, type ToolKey } from "../sidebarMenus";
import { guideJsonLd } from "./content";
import { GUIDES } from "./guides";

const ORIGIN = "https://prototype-gallery-bay.vercel.app";

export function toolMetadata(tool: ToolKey): Metadata {
  const g = GUIDES[tool]!;
  const url = ORIGIN + TOOLS[tool].href;
  const image = g.ogImage ? ORIGIN + g.ogImage : undefined;
  return {
    title: g.metaTitle,
    description: g.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: "BuzzVideo",
      locale: "en_US",
      title: g.metaTitle,
      description: g.metaDescription,
      url,
      ...(image ? { images: [{ url: image, width: 1200, height: 630, alt: `BuzzVideo ${g.h1}` }] } : {}),
    },
    twitter: { card: image ? "summary_large_image" : "summary", title: g.metaTitle, description: g.metaDescription, ...(image ? { images: [image] } : {}) },
  };
}

export function ToolJsonLd({ tool }: { tool: ToolKey }) {
  const g = GUIDES[tool]!;
  const json = JSON.stringify(guideJsonLd(g, { origin: ORIGIN, image: g.ogImage })).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
