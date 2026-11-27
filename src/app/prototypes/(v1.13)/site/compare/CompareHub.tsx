"use client";
/* /compare 汇总页。
   2026-11-27 Monica:「Resources 加个 compare 汇总页……v1.13 只有 /compare/topview,第二批在此基础上做」「v1.14 里面就有第二批的」;
   同日追问「有做过市场调研吗，人家怎么写的，还有要根据 SEO / GEO」→ 按调研重做(HeyGen /alternatives、Synthesia /alternatives、
   Creatify /compare、monday /alternative、ClickUp /compare、HubSpot /comparisons;Descript / Jasper / Higgsfield / OpenArt / TopView 没有汇总页):
   - 汇总页本身只排「BuzzVideo alternatives / vs」这类品牌词，主要作用是给子页传权重、让爬虫找到子页;通用词靠子页拿;
   - GEO:开头 40–60 词直接回答、核对日期、来源、页面上可见的 FAQ、硬事实(入门价、免费额度、能不能从商品链接生成);
   - 只有 1 条时做一张 Featured 大卡，不列「Coming soon」;12 条时按用途分组。
   默认 = v1.13 版(只有线上已有的 TopView AI 替代页);网址带 ?v=1.14 = 第二批版本。第二批上线时把 V114 设为默认。 */
import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight, ChevronRight } from "lucide-react";
import type { OnLink } from "../../site-nav/SiteNavHeader";
import { OA_CTA, OA_WRAP } from "../oa/kit";
import { JsonLd, PUBLISHER, faqLd, useLinks } from "../guides/parts";
import { isRemoved } from "../redirects";
import { ALTERNATIVES } from "./content";
import { META } from "./meta";
import { BV_ENTRY, BV_FREE, vendor } from "./vendors";

const SITE = "https://buzzvideo.ai";
type Item = { key: string; name: string; href: string; title: string; bestFor: string; facts: string[]; checked: string };

/* 线上 buzzvideo.ai/compare/topview(Last updated: Nov 18, 2026)页面上的事实，照抄不改 */
const TOPVIEW: Item = {
  key: "topview",
  name: "TopView AI",
  href: `${SITE}/compare/topview`,
  title: "TopView AI Alternatives",
  bestFor: "Ecommerce product video ads",
  facts: [
    "Six tools compared: BuzzVideo AI, Creatify, Higgsfield, HeyGen, InVideo and VEED",
    "Entry paid plans from $15 to $29 a month on monthly billing",
    "Which tools start a video from a product URL, and on which plan",
    "Entry-plan watermark and export resolution, and what the free plans include",
  ],
  checked: "Nov 18, 2026",
};

/* 第二批：按用途分组(调研：12 条时分组比平铺好找) */
const GROUP_OF: Record<string, string> = {
  topview: "url", pippit: "url",
  creatify: "ugc", arcads: "ugc", makeugc: "ugc",
  heygen: "avatar", synthesia: "avatar",
  higgsfield: "models", openart: "models", invideo: "models",
};
const GROUPS = [
  { id: "url", title: "Product link to video ad", sub: "Tools that start an ad from a product page or product photo." },
  { id: "ugc", title: "UGC and AI actor ads", sub: "Creator-style ads with AI actors or avatars talking to camera." },
  { id: "avatar", title: "AI avatars and presenters", sub: "Talking-presenter video for explainers, training and translation." },
  { id: "models", title: "Multi-model creative platforms", sub: "Platforms that run several image and video models in one account." },
];
const BEST_FOR: Record<string, string> = {
  pippit: "Ecommerce video ads", creatify: "AI ad avatars", arcads: "AI actor UGC ads", makeugc: "AI UGC ads",
  heygen: "AI avatars and dubbing", synthesia: "Training and avatar video", higgsfield: "AI video models", openart: "AI image and video models", invideo: "AI video editing",
};
const V114: Item[] = [
  TOPVIEW,
  ...ALTERNATIVES.filter((p) => !isRemoved(`/${p.slug}`)).map((p) => {
    const v = vendor(p.them);
    return {
      key: p.them,
      name: v?.name ?? p.them,
      href: `/${p.slug}`,
      title: (META[p.slug]?.title ?? p.h1).split(":")[0],
      bestFor: BEST_FOR[p.them] ?? "AI video tools",
      facts: [v?.entry, v?.free].filter((x): x is string => !!x).map((x) => x.replace(/\s*\(.*?\)\s*$/, "")),
      checked: "Nov 2026",
    };
  }),
];

const ANSWER =
  "BuzzVideo is an AI ad generator that runs Seedance, Kling, Wan and other video models in one account, with a Marketing Agent that turns a product photo or link into ads in every size. These pages compare it with other AI video ad tools on entry price, free plans, product-link-to-video and watermarks, using each vendor's own pages.";

const faqs = (items: Item[]) => [
  {
    q: "Which BuzzVideo alternatives do these pages compare?",
    a:
      items.length === 1
        ? "The TopView AI alternatives page compares BuzzVideo AI, Creatify, Higgsfield, HeyGen, InVideo and VEED for ecommerce product video ads."
        : `${items.map((x) => x.name).join(", ")}. Each page lists five or six tools side by side for one kind of ad.`,
  },
  { q: "Where do the prices and plan details come from?", a: "From each vendor's official pricing and product pages, with the date we checked them on every page. Plans change often, so confirm on the vendor's site before you buy." },
  { q: "Is BuzzVideo free to try?", a: `New accounts get ${BV_FREE.charAt(0).toLowerCase() + BV_FREE.slice(1)}. Paid plans start at ${BV_ENTRY}.` },
  { q: "Why is BuzzVideo listed first?", a: "BuzzVideo publishes these pages. Putting it first is an editorial choice, not a score or a ranking, and each page says where other tools do better." },
];

function Card({ x, a, featured = false }: { x: Item; a: ReturnType<typeof useLinks>["a"]; featured?: boolean }) {
  const link = /^https?:/.test(x.href) ? { href: x.href } : a(x.title, x.href);
  return (
    <a {...link} className={`group flex h-full flex-col rounded-[20px] bg-white/[0.04] ring-1 ring-white/10 transition hover:bg-white/[0.07] hover:ring-[#FF744D]/50 ${featured ? "p-6 md:p-9" : "p-6"}`}>
      <div className="flex items-center gap-2.5" aria-hidden>
        <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-[#FFA73C] to-[#FF5255] text-[14px] font-black text-white">BV</span>
        <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-white/40">vs</span>
        <span className="grid size-11 place-items-center rounded-2xl bg-white/10 text-[14px] font-black text-white">{x.name.replace(/ AI$/, "").slice(0, 2).toUpperCase()}</span>
        {featured && <span className="ml-auto rounded-full bg-[#FF744D]/15 px-3 py-1 text-[12px] font-semibold text-[#FF9A73]">Featured comparison</span>}
      </div>
      <p className="mt-5 text-[12.5px] font-semibold uppercase tracking-[0.08em] text-[#FF9A73]">Best for: {x.bestFor}</p>
      <h3 className={`mt-1.5 font-bold leading-snug transition group-hover:text-[#FF744D] ${featured ? "text-[26px] md:text-[30px]" : "text-[19px]"}`}>{x.title}</h3>
      <ul className={`mt-4 flex-1 space-y-2 ${featured ? "grid gap-x-8 md:grid-cols-2 md:space-y-0 md:gap-y-2.5" : ""}`}>
        {x.facts.map((f) => (
          <li key={f} className={`flex gap-2.5 text-[14.5px] leading-relaxed text-[#CACACA] ${featured ? "" : "line-clamp-3"}`}>
            <span aria-hidden className="mt-[9px] size-1.5 shrink-0 rounded-full bg-[#FF744D]" />
            {f}
          </li>
        ))}
      </ul>
      <div className="mt-6 flex items-center justify-between gap-4 border-t border-white/10 pt-4">
        <span className="text-[13px] text-white/50">Checked {x.checked}</span>
        <span className="inline-flex items-center gap-1.5 text-[14.5px] font-semibold text-white/90 transition group-hover:text-[#FF744D]">
          Compare <ArrowUpRight className="size-4" aria-hidden />
        </span>
      </div>
    </a>
  );
}

export function CompareHub({ onLink }: { onLink: OnLink }) {
  const { a } = useLinks(onLink);
  const [v114, setV114] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setV114(new URLSearchParams(window.location.search).get("v") === "1.14"));
    return () => cancelAnimationFrame(id);
  }, []);
  const items = v114 ? V114 : [TOPVIEW];
  const one = items.length === 1;
  const fq = faqs(items);
  const abs = (h: string) => (/^https?:/.test(h) ? h : `${SITE}${h}`);
  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Compare BuzzVideo with other AI video ad tools",
      url: `${SITE}/compare`,
      description: META.compare.description,
      dateModified: "2026-11-27",
      publisher: PUBLISHER,
      mainEntity: { "@type": "ItemList", itemListElement: items.map((x, i) => ({ "@type": "ListItem", position: i + 1, name: x.title, url: abs(x.href) })) },
    },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: SITE }, { "@type": "ListItem", position: 2, name: "Compare", item: `${SITE}/compare` }] },
    faqLd(fq),
  ];

  return (
    <main className="bg-black text-white">
      <JsonLd data={ld} />
      <section className="relative isolate overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute left-[-10%] top-[-260px] -z-10 h-[520px] w-[900px] rounded-full bg-[#FF744D]/[0.14] blur-[120px]" />
        <div className={`${OA_WRAP} pb-10 pt-10 md:pb-14 md:pt-16`}>
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px] text-white/55">
            <a {...a("Home", "/")} className="hover:text-white">Home</a>
            <ChevronRight className="size-3.5" aria-hidden />
            <span aria-current="page" className="text-white/80">Compare</span>
          </nav>
          <h1 className="mt-8 max-w-[20ch] text-[clamp(40px,5.6vw,72px)] font-black leading-[0.98] tracking-[-0.035em] [text-wrap:balance]">Compare BuzzVideo with other AI video ad tools</h1>
          <p className="mt-7 max-w-[46rem] text-[18px] leading-[1.65] text-white/85 [text-wrap:pretty]">{ANSWER}</p>
          <p className="mt-5 max-w-[46rem] text-[13.5px] leading-relaxed text-white/50">
            Last updated Nov 27, 2026 · BuzzVideo publishes these pages. Listing BuzzVideo first is an editorial choice, not a ranking, and every fact links to its source.
          </p>
        </div>
      </section>

      <div className={`${OA_WRAP} pb-24 md:pb-32`}>
        {one ? (
          <section aria-labelledby="featured">
            <h2 id="featured" className="sr-only">Featured comparison</h2>
            <Card x={items[0]} a={a} featured />
          </section>
        ) : (
          <div className="space-y-14">
            {GROUPS.map((g) => {
              const xs = items.filter((x) => GROUP_OF[x.key] === g.id);
              if (!xs.length) return null;
              return (
                <section key={g.id} id={g.id} className="scroll-mt-28">
                  <h2 className="text-[clamp(24px,2.4vw,32px)] font-bold leading-[1.2]">{g.title}</h2>
                  <p className="mt-2 max-w-[40rem] text-[15px] leading-relaxed text-[#B5B5B5]">{g.sub}</p>
                  <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {xs.map((x) => (
                      <li key={x.key}>
                        <Card x={x} a={a} />
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}

        <section className="mt-20 grid gap-10 border-t border-white/10 pt-14 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div>
            <h2 className="text-[clamp(24px,2.4vw,32px)] font-bold leading-[1.2]">How we check the facts</h2>
          </div>
          <ul className="space-y-4 text-[15.5px] leading-relaxed text-[#CACACA]">
            <li>Prices, free plans, watermarks and export limits come from each vendor&apos;s own pricing and product pages, never from review sites.</li>
            <li>Every comparison shows the date we last checked it and links each fact to its source, so you can confirm before you buy.</li>
            <li>Where a vendor does not publish a fact, the page says so instead of guessing, and it notes where other tools do better than BuzzVideo.</li>
          </ul>
        </section>

        <section className="mt-20 border-t border-white/10 pt-14">
          <h2 className="text-[clamp(24px,2.4vw,32px)] font-bold leading-[1.2]">Frequently asked questions</h2>
          <dl className="mt-8 divide-y divide-white/10 border-y border-white/10">
            {fq.map((f) => (
              <div key={f.q} className="grid gap-2 py-6 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:gap-10">
                <dt className="text-[17px] font-semibold leading-snug">{f.q}</dt>
                <dd className="text-[15.5px] leading-relaxed text-[#CACACA]">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-20 flex flex-col items-start gap-5 rounded-[24px] bg-gradient-to-br from-[#FF744D]/20 to-transparent p-8 ring-1 ring-white/10 md:flex-row md:items-center md:justify-between md:p-10">
          <div>
            <h2 className="text-[clamp(22px,2.2vw,30px)] font-bold leading-[1.2]">See if BuzzVideo fits your product ads</h2>
            <p className="mt-2 text-[15.5px] text-[#CACACA]">Brief the Marketing Agent with a product photo or link and get ads in every size.</p>
          </div>
          <a {...a("Try the Marketing Agent", "/marketing-agent")} className={`${OA_CTA} shrink-0 px-6 py-3.5`}>
            Try the Marketing Agent <ArrowRight className="size-4" />
          </a>
        </section>
      </div>
    </main>
  );
}
