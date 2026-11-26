import type { Metadata } from "next";
import { TUTORIALS } from "./content";

const SITE = "https://buzzvideo.ai";
export const HUB = {
  title: "BuzzVideo Tutorials: Step-by-Step AI Video Guides | BuzzVideo",
  description: "Step-by-step BuzzVideo tutorials: make ads with the Marketing Agent, turn a link or photo into a video, build UGC ads, avatars, Canvas workflows and more.",
};
export function tutorialMeta(slug?: string): Metadata {
  const g = slug ? TUTORIALS.find((t) => t.slug === slug) : undefined;
  const title = g?.title ?? HUB.title;
  const description = g?.description ?? HUB.description;
  const url = `${SITE}/tutorials${g ? `/${g.slug}` : ""}`;
  /* 2026-11-26 每个落地页都配 OG 分享图(scripts/site/gen-og.mjs 生成，素材暂放原型站) */
  const og = { url: `https://prototype-gallery-bay.vercel.app/prototypes/site/og/tutorials${g ? `_${g.slug}` : ""}.jpg`, width: 1200, height: 630, alt: title.replace(/ \| BuzzVideo$/, "") };
  return { title, description, alternates: { canonical: url }, openGraph: { type: "website", siteName: "BuzzVideo", locale: "en_US", url, title, description, images: [og] }, twitter: { card: "summary_large_image", title, description, images: [og.url] } };
}
