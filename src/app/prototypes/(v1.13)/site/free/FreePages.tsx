"use client";

/* 免费工具落地页 + 免费工具总页(2026-11-19)。
   PM 定：只有真能在浏览器里用的才算免费工具 —— 首屏就是工具本身(代替提示词框),下面是用法、FAQ、相关链接。
   AI 写作类(Hook / 脚本 / 文案 / TikTok 文案)首屏是表单，带着提示词打开 Marketing Agent,下面放 3 条标明 Example 的示例。 */

import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { appOf, go, type OnLink } from "../../site-nav/SiteNavHeader";
import { statusOf } from "../../site-nav/nav-data";
import { OA_H2, OA_WRAP, OABlog, OAChips, OACta, OAFaq, OAPanel } from "../oa/kit";
import { postsFor } from "../oa/pool";
import { SIGNUP_CREDITS } from "../tools/credits";
import { FREE_TOOLS, freeBySlug, type FreeTool } from "./content";
import { META_SIZES, SRC, ZONES } from "./specs";
import { AiWriter } from "./tools/AiWriter";
import { ImageResizer } from "./tools/ImageResizer";
import { SafeZoneChecker } from "./tools/SafeZoneChecker";
import { VideoCompressor } from "./tools/VideoCompressor";
import { VideoResizer } from "./tools/VideoResizer";
import { VideoToGif } from "./tools/VideoToGif";
import { Chip, faqLd, FreeHero, HowTo, howToLd, JsonLd, linker, ORG, Sources } from "./ui";

const enterApp = (href: string, label: string, onLink: OnLink) => {
  const app = appOf(href);
  if (app) window.location.href = app;
  else go(href, statusOf(href), label, onLink);
};

/* 产品里的相关付费工具(相关链接里放几个) */
const PAID = [
  { label: "AI Ad Generator", href: "/ai-ad-generator" },
  { label: "AI Video Generator", href: "/ai-video-generator" },
  { label: "AI Marketing Agent", href: "/marketing-agent" },
  { label: "AI Image Generator", href: "/ai-image-generator" },
];

function AdSizeTable() {
  return (
    <div className="overflow-x-auto rounded-[20px] bg-white/[0.04] ring-1 ring-white/[0.08]">
      <table className="w-full min-w-[860px] text-left text-[14px]">
        <caption className="sr-only">Recommended Meta ad sizes by placement</caption>
        <thead className="text-[12.5px] uppercase tracking-[0.04em] text-[#9F9F9F]">
          <tr>
            {["Placement", "Ratio", "Recommended size (px)", "File types", "Max file size", "Length", "Min width", "Safe zone"].map((h) => (
              <th key={h} scope="col" className="px-4 py-3 font-bold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {META_SIZES.map((r) => (
            <tr key={r.placement + r.format} className="border-t border-white/[0.08] align-top text-[#E8E8E8]">
              <th scope="row" className="px-4 py-3.5 font-bold text-white">
                <a href={r.src.url} target="_blank" rel="noopener noreferrer" className="underline decoration-white/25 underline-offset-4 hover:decoration-[#FF744D]">
                  {r.placement} {r.format.toLowerCase()}
                </a>
              </th>
              <td className="px-4 py-3.5">{r.ratio}</td>
              <td className="px-4 py-3.5 font-semibold tabular-nums text-white">{r.size}</td>
              <td className="px-4 py-3.5">{r.files}</td>
              <td className="px-4 py-3.5 tabular-nums">{r.maxSize}</td>
              <td className="px-4 py-3.5">{r.length ?? "—"}</td>
              <td className="px-4 py-3.5">{r.minWidth}</td>
              <td className="px-4 py-3.5">{r.safe ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SafeZoneTable() {
  const px = (f: number, base: number) => `${Math.round(f * base)} px`;
  return (
    <div className="overflow-x-auto rounded-[20px] bg-white/[0.04] ring-1 ring-white/[0.08]">
      <table className="w-full min-w-[640px] text-left text-[14px]">
        <caption className="sr-only">Safe zone margins at 1080 by 1920</caption>
        <thead className="text-[12.5px] uppercase tracking-[0.04em] text-[#9F9F9F]">
          <tr>
            {["Platform (1080×1920)", "Top", "Bottom", "Left", "Right", "Source"].map((h) => (
              <th key={h} scope="col" className="px-4 py-3 font-bold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ZONES.map((z) => (
            <tr key={z.key} className="border-t border-white/[0.08] text-[#E8E8E8]">
              <th scope="row" className="px-4 py-3.5 font-bold text-white">
                {z.label}
              </th>
              <td className="px-4 py-3.5 tabular-nums">{px(z.top, 1920)}</td>
              <td className="px-4 py-3.5 tabular-nums">{px(z.bottom, 1920)}</td>
              <td className="px-4 py-3.5 tabular-nums">{px(z.left, 1080)}</td>
              <td className="px-4 py-3.5 tabular-nums">
                {px(z.right, 1080)}
                {z.rail ? ` (+ ${px(z.rail.width, 1080)} button column)` : ""}
              </td>
              <td className="px-4 py-3.5 text-[13px] text-[#9F9F9F]">{z.measured ? "Measured from TikTok's template" : z.key === "shorts" ? "Google Ads Help" : "Meta Ads Guide"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Examples({ t }: { t: FreeTool }) {
  if (!t.examples) return null;
  return (
    <OAPanel id="examples" title={`${t.name} examples`} sub={<>Sample outputs for LUMEA, a fictional skincare brand, to show the format. Your results depend on your brief.</>}>
      <ul className="grid gap-4 md:grid-cols-3">
        {t.examples.map((e) => (
          <li key={e.title} className="flex flex-col rounded-[20px] bg-white/[0.05] p-6 ring-1 ring-white/[0.08]">
            <span className="w-fit rounded-full bg-[#FFF3EC] px-2.5 py-1 text-[11.5px] font-bold uppercase tracking-[0.06em] text-[#240A03]">Example</span>
            <h3 className="mt-4 text-[18px] font-extrabold">{e.title}</h3>
            <p className="mt-1 text-[12.5px] text-[#9F9F9F]">Input: {e.input}</p>
            <p className="mt-4 flex-1 whitespace-pre-line text-[15px] leading-relaxed text-[#E8E8E8]">{e.output}</p>
          </li>
        ))}
      </ul>
    </OAPanel>
  );
}

function toolBody(t: FreeTool): ReactNode {
  switch (t.kind) {
    case "resizer":
      return <VideoResizer />;
    case "compress":
      return <VideoCompressor />;
    case "gif":
      return <VideoToGif />;
    case "image":
      return <ImageResizer />;
    case "safe":
      return <SafeZoneChecker />;
    case "sizes":
      return <AdSizeTable />;
    case "writer":
      return t.writer ? <AiWriter spec={t.writer} /> : null;
  }
}

export function FreeToolPage({ t, onLink }: { t: FreeTool; onLink: OnLink }) {
  const a = linker(onLink);
  const related = t.related.map(freeBySlug).filter((x): x is FreeTool => !!x);
  const chips = [...related, ...FREE_TOOLS.filter((x) => x.slug !== t.slug && !t.related.includes(x.slug))].map((x) => ({ label: x.name, link: a(x.name, `/${x.slug}`) }));
  const chip = t.runs === "local" ? "Free · runs in your browser" : t.runs === "agent" ? "Free to start · BuzzVideo Marketing Agent" : "Free reference · verified sources";
  const faq = t.faq;

  return (
    <main className="bg-black text-white">
      <FreeHero chip={<Chip>{chip}</Chip>} title={t.h1} lead={t.lead} wide={t.kind === "sizes"}>
        {toolBody(t)}
        {t.runs === "local" && <p className="mt-4 text-center text-[13px] text-[#9F9F9F]">No sign-up. Your file is processed on your device and never uploaded to BuzzVideo.</p>}
      </FreeHero>

      {t.kind === "safe" && (
        <OAPanel title="Safe zone sizes at 1080 × 1920" sub="Margins to keep clear of text, logos and faces on each platform. Meta and Google publish these values; TikTok publishes template files, so its row is a measurement of TikTok's In-Feed Standard LTR template.">
          <SafeZoneTable />
        </OAPanel>
      )}
      {t.kind === "sizes" && (
        <OAPanel title="Stories and Reels safe zones" sub="Meta asks you to keep about 14% at the top, 35% at the bottom and 6% on each side of 9:16 ads free of text and logos. Here is how that compares with TikTok and YouTube Shorts.">
          <SafeZoneTable />
        </OAPanel>
      )}
      <Examples t={t} />

      <HowTo title={`How to use the ${t.name}`} steps={t.steps} />
      <OAFaq items={faq} />

      <OAChips title="More free tools" chips={[...chips, ...PAID.map((p) => ({ label: p.label, link: a(p.label, p.href) }))]} />
      <OABlog posts={postsFor("ads")} all={a("Blog", "/blog", "live")} link={(p) => a(p.title, p.href, "live")} />
      <OACta
        title={t.runs === "agent" ? "Turn the words into the ad" : "Make the ad itself with AI"}
        sub={`BuzzVideo makes video, image and audio ads with the leading AI models on one account. New accounts get ${SIGNUP_CREDITS} free credits for images and voiceovers.`}
        cta={{
          label: "Get started for free",
          link: {
            href: "/marketing-agent",
            onClick: (e) => {
              e.preventDefault();
              enterApp("/marketing-agent", "AI Marketing Agent", onLink);
            },
          },
        }}
      />
      {t.sources && <Sources items={t.sources} note="Platform specs on this page come from the sources above." />}
      {!t.sources && <div className="pb-14" />}

      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": t.runs === "guide" ? "WebPage" : "WebApplication",
            name: `BuzzVideo ${t.name}`,
            description: t.lead,
            url: `https://buzzvideo.ai/${t.slug}`,
            ...(t.runs === "guide" ? {} : { applicationCategory: "MultimediaApplication", operatingSystem: "Web browser", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } }),
            ...(t.runs === "local" ? { isAccessibleForFree: true } : {}),
            dateModified: "2026-11-23",
            publisher: ORG,
          },
          howToLd(`How to use the BuzzVideo ${t.name}`, t.steps),
          faqLd(faq),
        ]}
      />
    </main>
  );
}
