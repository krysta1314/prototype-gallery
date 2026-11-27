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
import { ArrowUpRight, ChevronRight } from "lucide-react";
import type { OnLink } from "../../site-nav/SiteNavHeader";
import { OA_WRAP, OACta, OAFaq } from "../oa/kit";
import { JsonLd, PUBLISHER, faqLd, useLinks } from "../guides/parts";
import { isRemoved } from "../redirects";
import { ALTERNATIVES, BEST_OF } from "./content";
import { META } from "./meta";
import { BV_ENTRY, BV_FREE, vendor } from "./vendors";

const SITE = "https://buzzvideo.ai";
type Item = { key: string; name: string; href: string; title: string; bestFor: string; facts: string[]; checked: string; list?: number; cover?: string };

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
  cover: "/prototypes/site/og/compare_topview.jpg",
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
  /* 2026-11-27 Monica:9 个「Best AI …」榜单页并进 /compare 汇总，不另开榜单汇总页 */
  { id: "best", title: "Best AI tools by category", sub: "Side-by-side lists of the best AI tools for one job, each with the criteria we used." },
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
      cover: `/prototypes/site/og/${p.slug.replace(/\//g, "_")}.jpg`,
    };
  }),
];

/* 榜单页(第二批):每张卡写比了几款工具、按什么标准选 */
const BEST: Item[] = BEST_OF.filter((p) => !isRemoved(`/${p.slug}`)).map((p) => {
  const names = p.tools.map((t) => vendor(t.key)?.name ?? t.key);
  return {
    key: p.slug,
    name: p.slug,
    href: `/${p.slug}`,
    title: (META[p.slug]?.title ?? p.h1).split(/[:|]/)[0].trim(),
    bestFor: p.h1.replace(/ in 20\d\d.*$/, ""),
    facts: [`${names.length} tools compared: ${names.join(", ")}`, ...p.criteria.slice(0, 1)],
    checked: "Nov 2026",
    list: names.length,
    cover: `/prototypes/site/og/${p.slug}.jpg`,
  };
});
for (const b of BEST) GROUP_OF[b.key] = "best";
const V114_ALL = [...V114, ...BEST];

const ANSWER =
  "BuzzVideo is an AI ad generator that runs Seedance, Kling, Wan and other video models in one account, with a Marketing Agent that turns a product photo or link into ads in every size. These pages compare it with other AI video ad tools on entry price, free plans, product-link-to-video and watermarks, using each vendor's own pages.";

const faqs = (items: Item[]) => [
  {
    q: "Which BuzzVideo alternatives do these pages compare?",
    a:
      items.length === 1
        ? "The TopView AI alternatives page compares BuzzVideo AI, Creatify, Higgsfield, HeyGen, InVideo and VEED for ecommerce product video ads."
        : `${items.filter((x) => !x.list).map((x) => x.name).join(", ")}. Each page lists five or six tools side by side for one kind of ad, and the Best AI tools lists compare several tools for one job.`,
  },
  { q: "Where do the prices and plan details come from?", a: "From each vendor's official pricing and product pages, with the date we checked them on every page. Plans change often, so confirm on the vendor's site before you buy." },
  { q: "Is BuzzVideo free to try?", a: `New accounts get ${BV_FREE.charAt(0).toLowerCase() + BV_FREE.slice(1)}. Paid plans start at ${BV_ENTRY}.` },
  { q: "Why is BuzzVideo listed first?", a: "BuzzVideo publishes these pages. Putting it first is an editorial choice, not a score or a ranking, and each page says where other tools do better." },
];

function Card({ x, a, featured = false }: { x: Item; a: ReturnType<typeof useLinks>["a"]; featured?: boolean }) {
  const link = /^https?:/.test(x.href) ? { href: x.href } : a(x.title, x.href);
  return (
    /* 2026-11-27 Monica「要做一个封面图，就是像 blog 卡片那种的样式」:顶部封面(各子页的 1200×630 分享图)+ 下方文字，和 OABlog 卡片同一套 */
    <a {...link} className="group flex h-full flex-col overflow-hidden rounded-[20px] bg-white/[0.04] ring-1 ring-white/10 transition hover:-translate-y-1 hover:ring-[#FF744D]/50">
      {x.cover && (
        <div className="aspect-[1200/630] overflow-hidden bg-[#111]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={x.cover} alt="" loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-[1.04]" />
        </div>
      )}
      <div className={`flex flex-1 flex-col ${featured ? "p-6 md:p-9" : "p-6"}`}>
      <p className="text-[12.5px] font-semibold uppercase tracking-[0.08em] text-[#FF9A73]">{x.list ? x.bestFor : `Best for: ${x.bestFor}`}</p>
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
          {x.list ? "See the list" : "Compare"} <ArrowUpRight className="size-4" aria-hidden />
        </span>
      </div>
      </div>
    </a>
  );
}

export function CompareHub({ onLink }: { onLink: OnLink }) {
  const { a } = useLinks(onLink);
  const [v114, setV114] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setV114(new URLSearchParams(window.location.search).get("v") === "1.14"));
    return () => clearTimeout(id);
  }, []);
  const items = v114 ? V114_ALL : [TOPVIEW];
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
        {/* 2026-11-27 Monica「这个页面就是汇总页，所以这里就是卡片」:v1.13 只有一条时也按网格里的普通卡片显示(不做通栏大卡) */}
        {one ? (
          <section aria-labelledby="cards">
            <h2 id="cards" className="text-[clamp(24px,2.4vw,32px)] font-bold leading-[1.2]">Compare BuzzVideo with</h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <li>
                <Card x={items[0]} a={a} />
              </li>
            </ul>
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

      </div>

      {/* 2026-11-27 Monica「faq 就用 faq 我们经常用结构」:换成站里通用的 OAFaq(两列折叠卡，第一条默认展开) */}
      <OAFaq items={fq} />

      {/* 2026-11-27 Monica「这个也是我们平常有我们自己的设计样式」:收尾 CTA 换成站里通用的 OACta */}
      <OACta
        title="See if BuzzVideo fits your product ads"
        sub="Brief the Marketing Agent with a product photo or link and get ads in every size."
        cta={{ label: "Try the Marketing Agent", link: a("Try the Marketing Agent", "/marketing-agent") }}
      />
    </main>
  );
}
