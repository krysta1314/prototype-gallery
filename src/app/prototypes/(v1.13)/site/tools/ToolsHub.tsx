"use client";

/* /tools 总页(2026-11-19):所有 AI 工具按类列出，每个都是独立落地页的链接(吃「ai tools for ads」这类总词，也是全部工具页的内链枢纽)。
   分组读导航数据里的 TOOLS_HUB_GROUPS,改导航这里跟着变。
   第 2 批做好的工具有一句好处说明;UAT 已有的工具页链到 UAT;免费小工具单独一组。 */

import { ArrowRight } from "lucide-react";
import { go, type OnLink } from "../../site-nav/SiteNavHeader";
import { statusOf, TOOLS_HUB_GROUPS } from "../../site-nav/nav-data";
import { toolBySlug } from "./tool-content";

export function ToolsHub({ onLink }: { onLink: OnLink }) {
  const groups = TOOLS_HUB_GROUPS;
  const a = (label: string, href: string, status = statusOf(href)) => ({
    href,
    onClick: (e: React.MouseEvent) => {
      e.preventDefault();
      go(href, status, label, onLink);
    },
  });

  return (
    <main className="bg-black text-white">
      <div className="mx-auto max-w-[1180px] px-4 pb-20 pt-10 sm:px-6">
        <h1 className="mt-6 max-w-[16ch] text-[clamp(40px,6.4vw,84px)] font-extrabold uppercase leading-[0.95] tracking-[-0.02em] [text-wrap:balance]">AI tools for ads</h1>
        <p className="mt-5 max-w-[42rem] text-[18px] leading-relaxed text-[#CACACA]">
          Every BuzzVideo tool for making video, image and audio ads. Each one runs on the same credits. Free tools are listed at the end.
        </p>

        <div className="mt-14 space-y-14">
          {groups.map((g) => (
            <section key={g.title} aria-labelledby={`g-${g.title}`}>
              <h2 id={`g-${g.title}`} className="border-b-2 border-white/80 pb-3 text-[24px] font-extrabold tracking-[-0.02em]">
                {g.title}
              </h2>
              <ul className="grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
                {g.links.map((l) => {
                  const built = toolBySlug(l.href.replace(/^\/tools\//, ""));
                  return (
                    <li key={l.href}>
                      <a {...a(l.label, l.href, l.status)} className="group flex items-start justify-between gap-4 border-b border-white/10 py-4">
                        <span>
                          <span className="block text-[16.5px] font-bold transition group-hover:text-[#FF744D]">{l.label}</span>
                          {built && <span className="mt-0.5 block text-[14px] text-[#9F9F9F]">{built.h1Tail.charAt(0).toUpperCase() + built.h1Tail.slice(1)}</span>}
                        </span>
                        <ArrowRight className="mt-1 size-4 shrink-0 transition group-hover:translate-x-0.5 group-hover:text-[#FF744D]" />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://buzzvideo.ai/" },
                { "@type": "ListItem", position: 2, name: "AI Tools", item: "https://buzzvideo.ai/tools" },
              ],
            },
            {
              "@context": "https://schema.org",
              "@type": "ItemList",
              name: "BuzzVideo AI tools",
              itemListElement: groups
                .flatMap((g) => g.links)
                .map((l, i) => ({ "@type": "ListItem", position: i + 1, name: l.label, url: `https://buzzvideo.ai${l.href}` })),
            },
          ]),
        }}
      />
    </main>
  );
}
