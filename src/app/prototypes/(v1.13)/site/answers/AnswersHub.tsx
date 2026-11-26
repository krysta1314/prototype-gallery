"use client";
/* /answers 汇总页(2026-11-26):所有问答页的入口，按问题类型分组，带一个即时筛选框。
   列表数据 = 本批问答页(answers/content-*.ts)+ learn 里现行的 Questions / How-to 页(去掉已合并、已删的)。
   GEO:每条显示问题原文和直答的第一句，AI 和搜索引擎在汇总页也能读到答案。 */
import { useMemo, useState } from "react";
import { ArrowUpRight, Search } from "lucide-react";
import type { OnLink } from "../../site-nav/SiteNavHeader";
import { OA_WRAP, PicView } from "../oa/kit";
import { guideMedia } from "../learn/guide-media";
import { useLinks } from "../guides/parts";
import { isMerged, isRemoved } from "../redirects";
import { GUIDES as LEARN, type Guide } from "../learn/content";
import { FACTS } from "./content-facts";
import { TRACKED } from "./content-tracked";
import { SUGGEST_A } from "./content-suggest-a";
import { SUGGEST_B } from "./content-suggest-b";

const live = (g: Guide) => !isMerged(g.slug) && !isRemoved(g.slug);
const learnQ = LEARN.filter((g) => live(g) && !g.terms && g.group !== "Specs and reference");

const GROUPS: { id: string; title: string; sub: string; items: Guide[] }[] = [
  { id: "about", title: "About BuzzVideo", sub: "Pricing, credits, watermarks, commercial use and which models you get.", items: FACTS },
  { id: "choosing", title: "Choosing an AI video or ad tool", sub: "Which tools fit dropshipping, Facebook ads, agencies, avatars and more.", items: TRACKED },
  {
    id: "explainers",
    title: "AI video, explained",
    sub: "What B-roll, MCP, lip sync, voice cloning and UGC ads are, and how to make them.",
    items: [...SUGGEST_A, ...SUGGEST_B, ...learnQ],
  },
];

const SHOWCASE = guideMedia({ slug: "", related: ["ai-ad-generator", "ai-ugc-video-generator", "talking-avatar", "ai-product-video-generator"] }, 4);

/** 直答的第一句(去掉 [文字](链接) 标记) */
const firstSentence = (t: string) => {
  const plain = t.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  const m = plain.match(/^.+?[.?!](\s|$)/);
  return (m ? m[0] : plain).trim();
};

export function AnswersHub({ onLink }: { onLink: OnLink }) {
  const { a } = useLinks(onLink);
  const [q, setQ] = useState("");
  const groups = useMemo(() => {
    const k = q.trim().toLowerCase();
    return GROUPS.map((g) => ({ ...g, items: k ? g.items.filter((x) => `${x.h1} ${x.answer}`.toLowerCase().includes(k)) : g.items })).filter((g) => g.items.length);
  }, [q]);
  const total = GROUPS.reduce((n, g) => n + g.items.length, 0);

  return (
    <main className="bg-black text-white">
      <section className="relative isolate overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute left-[-10%] top-[-260px] -z-10 h-[520px] w-[900px] rounded-full bg-[#FF744D]/[0.14] blur-[120px]" />
        <div className={`${OA_WRAP} pb-12 pt-14 md:pb-16 md:pt-24`}>
          <h1 className="max-w-[16ch] text-[clamp(40px,5.6vw,76px)] font-black leading-[0.98] tracking-[-0.035em] [text-wrap:balance]">
            AI video and ad questions, answered
          </h1>
          <p className="mt-7 max-w-[40rem] text-[19px] leading-[1.6] text-white/85 [text-wrap:pretty]">
            Short, sourced answers about AI video, AI ads, UGC and BuzzVideo itself. Each page leads with the answer, then shows how to do it.
          </p>
          <label className="mt-8 flex h-12 w-full max-w-[34rem] items-center gap-3 rounded-xl bg-white/[0.08] px-4 ring-1 ring-white/10 focus-within:ring-[#FF744D]">
            <Search className="size-4 shrink-0 text-white/60" aria-hidden />
            <span className="sr-only">Search questions</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`Search ${total} questions`}
              className="h-full w-full bg-transparent text-[15px] text-white placeholder:text-white/50 focus:outline-none"
            />
          </label>
          <nav aria-label="Question groups" className="mt-6 flex flex-wrap gap-2">
            {GROUPS.map((g) => (
              <a key={g.id} href={`#${g.id}`} className="rounded-full bg-white/[0.06] px-3.5 py-1.5 text-[13.5px] font-medium text-white/85 transition hover:bg-white/15">
                {g.title}
              </a>
            ))}
          </nav>
          {/* 2026-11-26 Monica:新增规划页素材少 —— 从广告 / UGC / 数字人 / 产品视频落地页各取一条现成成片 */}
          <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {SHOWCASE.map((p) => (
              <figure key={p.src} className="min-w-0">
                <div className="aspect-[4/3] overflow-hidden rounded-[18px] bg-[#111] ring-1 ring-white/10">
                  <PicView p={p} />
                </div>
                <figcaption className="mt-2.5 line-clamp-2 text-[13px] leading-snug text-[#B5B5B5]">{p.alt}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <div className={`${OA_WRAP} space-y-16 pb-24 md:space-y-20 md:pb-32`}>
        {groups.map((g) => (
          <section key={g.id} id={g.id} className="scroll-mt-28">
            <h2 className="text-[clamp(26px,2.6vw,36px)] font-bold leading-[1.2]">{g.title}</h2>
            <p className="mt-2 max-w-[40rem] text-[15.5px] leading-relaxed text-[#B5B5B5]">{g.sub}</p>
            <ul className="mt-6 divide-y divide-white/10 border-y border-white/10">
              {g.items.map((x) => (
                <li key={x.slug}>
                  <a {...a(x.h1, `/${x.slug}`)} className="group grid gap-1.5 py-5 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)_auto] md:items-baseline md:gap-8">
                    <span className="text-[17px] font-semibold leading-snug text-white transition group-hover:text-[#FF744D]">{x.h1}</span>
                    <span className="text-[14.5px] leading-relaxed text-[#B5B5B5]">{firstSentence(x.answer)}</span>
                    <ArrowUpRight className="hidden size-4 text-white/40 transition group-hover:text-[#FF744D] md:block" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {!groups.length && <p className="text-[15.5px] text-[#B5B5B5]">No questions match “{q}”.</p>}
      </div>
    </main>
  );
}
