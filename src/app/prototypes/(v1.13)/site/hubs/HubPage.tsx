"use client";
/* 第二批(v1.14)汇总页的通用版式(2026-11-27)。和 /compare 同一套：面包屑 → 直接回答 → 更新日期 → 分组卡片(封面 = 各子页的 1200×630 分享图，
   博客卡片样式)→ 可选的说明段 → 站里通用 OAFaq → 站里通用 OACta;JSON-LD = CollectionPage(ItemList)+ BreadcrumbList + FAQPage。
   第二批只有汇总页进 Footer(Monica:「第二期落地页也需要在 footer 里出现，但不是每一个都出现，要像对比页那样有一个汇总的」)。 */
import type { ReactNode } from "react";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import type { OnLink } from "../../site-nav/SiteNavHeader";
import { OA_WRAP, OACta, OAFaq } from "../oa/kit";
import { JsonLd, PUBLISHER, faqLd, useLinks } from "../guides/parts";

const SITE = "https://buzzvideo.ai";
export type HubItem = { slug: string; title: string; kicker: string; desc: string; meta?: string; cta?: string };
export type HubGroup = { id: string; title: string; sub: string; items: HubItem[] };

export function HubPage({
  onLink,
  path,
  crumb,
  h1,
  answer,
  note,
  groups,
  extra,
  faq,
  cta,
}: {
  onLink: OnLink;
  path: string;
  crumb: string;
  h1: string;
  answer: string;
  note: string;
  groups: HubGroup[];
  extra?: ReactNode;
  faq: { q: string; a: string }[];
  cta: { title: string; sub: string; label: string; href: string };
}) {
  const { a } = useLinks(onLink);
  const all = groups.flatMap((g) => g.items);
  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: h1,
      url: `${SITE}${path}`,
      description: answer,
      dateModified: "2026-11-27",
      publisher: PUBLISHER,
      mainEntity: { "@type": "ItemList", itemListElement: all.map((x, i) => ({ "@type": "ListItem", position: i + 1, name: x.title, url: `${SITE}/${x.slug}` })) },
    },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: SITE }, { "@type": "ListItem", position: 2, name: crumb, item: `${SITE}${path}` }] },
    faqLd(faq),
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
            <span aria-current="page" className="text-white/80">{crumb}</span>
          </nav>
          <h1 className="mt-8 max-w-[20ch] text-[clamp(40px,5.6vw,72px)] font-black leading-[0.98] tracking-[-0.035em] [text-wrap:balance]">{h1}</h1>
          <p className="mt-7 max-w-[46rem] text-[18px] leading-[1.65] text-white/85 [text-wrap:pretty]">{answer}</p>
          <p className="mt-5 max-w-[46rem] text-[13.5px] leading-relaxed text-white/50">{note}</p>
          {groups.length > 1 && (
            <nav aria-label="Sections" className="mt-8 flex flex-wrap gap-2">
              {groups.map((g) => (
                <a key={g.id} href={`#${g.id}`} className="rounded-full bg-white/[0.06] px-3.5 py-1.5 text-[13.5px] font-medium text-white/85 transition hover:bg-white/15">
                  {g.title} <span className="text-white/45">{g.items.length}</span>
                </a>
              ))}
            </nav>
          )}
        </div>
      </section>

      <div className={`${OA_WRAP} space-y-14 pb-10`}>
        {groups.map((g) => (
          <section key={g.id} id={g.id} className="scroll-mt-28">
            <h2 className="text-[clamp(24px,2.4vw,32px)] font-bold leading-[1.2]">{g.title}</h2>
            <p className="mt-2 max-w-[40rem] text-[15px] leading-relaxed text-[#B5B5B5]">{g.sub}</p>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map((x) => (
                <li key={x.slug}>
                  <a {...a(x.title, `/${x.slug}`)} className="group flex h-full flex-col overflow-hidden rounded-[20px] bg-white/[0.04] ring-1 ring-white/10 transition hover:-translate-y-1 hover:ring-[#FF744D]/50">
                    <div className="aspect-[1200/630] overflow-hidden bg-[#111]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/prototypes/site/og/${x.slug.replace(/\//g, "_")}.jpg`} alt="" loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-[1.04]" />
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <p className="text-[12.5px] font-semibold uppercase tracking-[0.08em] text-[#FF9A73]">{x.kicker}</p>
                      <h3 className="mt-1.5 text-[19px] font-bold leading-snug transition group-hover:text-[#FF744D]">{x.title}</h3>
                      <p className="mt-2 flex-1 text-[14.5px] leading-relaxed text-[#CACACA] line-clamp-3">{x.desc}</p>
                      <div className="mt-5 flex items-center justify-between gap-4 border-t border-white/10 pt-4">
                        <span className="text-[13px] text-white/50">{x.meta ?? ""}</span>
                        <span className="inline-flex items-center gap-1.5 text-[14.5px] font-semibold text-white/90 transition group-hover:text-[#FF744D]">
                          {x.cta ?? "Learn more"} <ArrowUpRight className="size-4" aria-hidden />
                        </span>
                      </div>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {extra}
      </div>

      <OAFaq items={faq} />
      <OACta title={cta.title} sub={cta.sub} cta={{ label: cta.label, link: a(cta.label, cta.href) }} />
    </main>
  );
}
