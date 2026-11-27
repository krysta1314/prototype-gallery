"use client";
/* 第二批汇总页注册表(2026-11-27):/solutions(方案 / 行业 / 平台 / 广告类型 27 页)、/research(原创数据 4 页)。
   Monica 2026-11-27 按调研建议定：方案页一个总页分四组(Creatify、HeyGen 都是一个总页);数据页单独成区(Sprout Social、Semrush 的做法)。
   调研：docs/research/2026-11-27-compare-hub-research.md。子页网址不变。 */
import type { ReactNode } from "react";
import type { OnLink } from "../../site-nav/SiteNavHeader";
import { PAGE_META } from "../pages-meta";
import { RESEARCH } from "../answers/content-research";
import { BV_FREE } from "../compare/vendors";
import { HubPage, type HubGroup, type HubItem } from "./HubPage";
import { META } from "./meta";

const pm = (slug: string, kicker: string): HubItem => {
  const m = PAGE_META[slug];
  return { slug, kicker, title: (m?.title ?? slug).replace(/ \| BuzzVideo$/, "").split(":")[0].trim(), desc: m?.description ?? "", cta: "See how it works" };
};

const SOLUTIONS: HubGroup[] = [
  {
    id: "industry",
    title: "By industry",
    sub: "Ad formats, shots and hooks that work for one kind of product.",
    items: ["real-estate-video-ads", "restaurant-ads", "fashion-ads", "skincare-ads", "beverage-ads", "home-decor-ads", "jewelry-ads", "supplement-ads", "fitness-ads", "perfume-ads"].map((s) => pm(s, "Industry")),
  },
  {
    id: "team",
    title: "By team",
    sub: "How online stores, small businesses, creators and agencies use BuzzVideo.",
    items: ["ai-video-for-ecommerce", "ai-video-for-small-business", "ai-video-for-creators", "ai-video-for-agencies", "dropshipping-ads", "ai-marketing-videos"].map((s) => pm(s, "Team")),
  },
  {
    id: "platform",
    title: "By platform",
    sub: "Sizes, lengths and styles for the places your ads run.",
    items: ["tiktok-videos", "tiktok-shop-videos", "instagram-reels", "amazon-product-videos", "shopify-product-videos"].map((s) => pm(s, "Platform")),
  },
  {
    id: "ad-type",
    title: "By ad type",
    sub: "Ready-made structures for UGC, demos, commercials and app installs.",
    items: ["product-video-templates", "ai-ugc-ads", "product-demo-videos", "ai-commercials", "affiliate-marketing-videos", "mobile-app-ads"].map((s) => pm(s, "Ad type")),
  },
];

const rs = (slug: string, kicker: string): HubItem => {
  const g = RESEARCH.find((x) => x.slug === slug)!;
  return { slug, kicker, title: g.h1.replace(/^What is the /, "").replace(/\?$/, "").replace(/^./, (c) => c.toUpperCase()), desc: g.description, meta: `${g.sources?.length ?? 0} sources · checked Nov 26, 2026`, cta: "See the data" };
};
const RESEARCH_GROUPS: HubGroup[] = [
  { id: "models", title: "AI model benchmarks", sub: "How AI video models rank in blind tests, next to what each costs on BuzzVideo.", items: [rs("ai-video-model-benchmarks", "Model data")] },
  { id: "ads", title: "Ad benchmarks", sub: "Public benchmarks for TikTok, Facebook and Instagram ads, each from a named source.", items: [rs("tiktok-ads-benchmarks", "Ad data"), rs("tiktok-ads-cpm", "Ad data"), rs("best-time-to-post-ads", "Ad data")] },
];

export const PAGES: Record<string, { title: string; description: string; render: (onLink: OnLink) => ReactNode }> = {
  solutions: {
    ...META.solutions,
    render: (onLink: OnLink) => (
      <HubPage
        onLink={onLink}
        path="/solutions"
        crumb="Solutions"
        h1="AI video ads for your industry, team and platform"
        answer="BuzzVideo makes video and image ads from a product photo, a product link or an idea, with a Marketing Agent that plans the shots and returns every size you need. These pages show what that looks like for one industry, team, platform or ad type, with example ads and the models used."
        note="Last updated Nov 27, 2026 · 27 pages, grouped by industry, team, platform and ad type."
        groups={SOLUTIONS}
        faq={[
          { q: "What kinds of businesses use BuzzVideo?", a: "Online stores, small businesses, creators, agencies and marketing teams, across industries such as real estate, restaurants, fashion, skincare, beverages, home decor, jewelry, supplements, fitness and perfume." },
          { q: "Can I make ads for TikTok, Instagram and Amazon from one product?", a: "Yes. The Marketing Agent returns each ad in the sizes you ask for, such as 9:16 for TikTok and Reels and 16:9 or 1:1 for marketplaces and feeds." },
          { q: "Do I need a video team or a studio shoot?", a: "No. You start from a product photo, a product page link or a short brief, and BuzzVideo writes the script, picks a model for each shot and adds a voiceover." },
          { q: "Is BuzzVideo free to try?", a: `New accounts get ${BV_FREE.charAt(0).toLowerCase() + BV_FREE.slice(1)}.` },
        ]}
        cta={{ title: "Make ads for your product", sub: "Brief the Marketing Agent with a photo or link and get ads in every size.", label: "Try the Marketing Agent", href: "/marketing-agent" }}
      />
    ),
  },
  research: {
    ...META.research,
    render: (onLink: OnLink) => (
      <HubPage
        onLink={onLink}
        path="/research"
        crumb="Research"
        h1="AI ad research and benchmarks"
        answer="These pages collect public ad benchmarks and AI video model rankings in one place: TikTok ad benchmarks by industry, TikTok CPM by country, the best time to post ads on Facebook and Instagram, and how AI video models rank. Every number names its source and the date we checked it."
        note="Last updated Nov 27, 2026 · BuzzVideo does not publish its own ad-spend data; where no reliable source exists, the page says Not published."
        groups={RESEARCH_GROUPS}
        extra={
          <section className="grid gap-10 border-t border-white/10 pt-14 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <h2 className="text-[clamp(24px,2.4vw,32px)] font-bold leading-[1.2]">How we collect the data</h2>
            <ul className="space-y-4 text-[15.5px] leading-relaxed text-[#CACACA]">
              <li>Ad benchmarks come from public reports that state their sample and time range, such as TwoMinuteReports, Gupta Media and the TikTok and Meta help centers. Sources that do not explain their method are left out.</li>
              <li>Different sources measure differently, so their numbers are listed side by side instead of averaged into one figure.</li>
              <li>Model rankings come from Artificial Analysis blind-test leaderboards; prices are BuzzVideo&apos;s own credit prices on the same date.</li>
            </ul>
          </section>
        }
        faq={[
          { q: "Where does this data come from?", a: "From named public sources such as TwoMinuteReports, Gupta Media, Sprout Social, Hootsuite, Buffer, the TikTok and Meta help centers, and Artificial Analysis. Each page links to every source." },
          { q: "How often is it updated?", a: "Each page shows the date we last checked it. The current figures were checked on Nov 26, 2026." },
          { q: "Does BuzzVideo use its own ad data?", a: "No. BuzzVideo does not have its own US or UK ad-spend data, so these pages only use public data and BuzzVideo's own model prices." },
        ]}
        cta={{ title: "Turn the data into ads", sub: "Make TikTok, Reels and feed ads from a product photo or link with the Marketing Agent.", label: "Try the Marketing Agent", href: "/marketing-agent" }}
      />
    ),
  },
};
