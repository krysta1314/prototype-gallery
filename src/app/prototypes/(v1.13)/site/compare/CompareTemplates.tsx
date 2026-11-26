"use client";

/* 竞品替代页 + 榜单页模板(2026-11-23)。版式沿用 guides 的黑底 OA 套件;结构参照 UAT 已上线的 /compare/topview:
   首屏(定义 + 编辑声明)→ 短答案 → 怎么选 → 正面对比表 → 竞品更强的地方 / BuzzVideo 不一样的地方(浅底)
   → 速览表 → 逐个工具(各带来源)→ BuzzVideo 真实成片 → 怎么核对的 → FAQ → 相关页 → 收尾 → 全部来源。
   竞品事实只读 vendors.ts,BuzzVideo 事实只读仓库数据;成片只用 oa/pool 和模型页的真实素材，文字放在画面外。 */

import type { ReactNode } from "react";
import { ArrowRight, Check, CircleAlert } from "lucide-react";
import type { OnLink } from "../../site-nav/SiteNavHeader";
import { OACta, OAChips, OAFaq, OAPanel, OA_CTA, OA_WRAP, PicView } from "../oa/kit";
import { picsOf, type Pic } from "../oa/pool";
import { mediaOf } from "../models/model-media";
import { pageMedia } from "../page-media";
import { AnswerCard, DataTable, GHOST_BTN, GuideHero, JsonLd, PUBLISHER, SpecTable, abs, examplesOf, faqLd, useLinks } from "../guides/parts";
import type { AltPage, BestPage, MediaKind, ToolPick } from "./content";
import { VENDORS, type Src, type Vendor } from "./vendors";
import { CONTENT_UPDATED } from "../content-date";

export const VERIFIED_LABEL = "Last verified Nov 2026";
const DATE_MODIFIED = CONTENT_UPDATED;

type A = ReturnType<typeof useLinks>["a"];
type Resolved = Vendor & { pick: ToolPick };

const resolve = (p: ToolPick): Resolved => {
  const v = VENDORS[p.key];
  return { ...v, what: p.what ?? v.what, strengths: p.strengths ?? v.strengths, cautions: p.cautions ?? v.cautions, entry: p.entry ?? v.entry, free: p.free ?? v.free, pick: p };
};

const uniqSources = (tools: Resolved[]): Src[] => {
  const seen = new Set<string>();
  const out: Src[] = [];
  for (const t of tools)
    for (const s of t.sources) {
      if (seen.has(s.url)) continue;
      seen.add(s.url);
      out.push(s);
    }
  return out;
};

/* ── 真实成片(每类挑 3–4 条)── */
const SKILL = (slug: string) => picsOf("video").find((p) => p.src.endsWith(`/${slug}.mp4`));
const firstVideo = (slug: string) => examplesOf(slug).find((x) => x.kind === "video");
function mediaFor(kind: MediaKind): Pic[] {
  const pick = (xs: (Pic | undefined)[]) => xs.filter((x): x is Pic => !!x);
  switch (kind) {
    case "ads":
      return pick([SKILL("link-to-ad"), SKILL("product-ad"), SKILL("unboxing-ugc"), SKILL("talking-product")]);
    case "ugc":
      return pick([SKILL("ugc-product-review"), SKILL("unboxing-ugc"), mediaOf("minimax-h3").find((x) => x.kind === "video") && { ...mediaOf("minimax-h3").find((x) => x.kind === "video")!, model: "MiniMax H3", modelSlug: "minimax-h3" }]);
    case "avatar":
      return pick([SKILL("talking-product"), SKILL("ugc-product-review"), mediaOf("minimax-h3").find((x) => x.kind === "video") && { ...mediaOf("minimax-h3").find((x) => x.kind === "video")!, model: "MiniMax H3", modelSlug: "minimax-h3" }]);
    case "video":
      return pick([firstVideo("seedance-2-5"), firstVideo("kling-4-0"), firstVideo("wan-3-0")]);
    case "image":
      return picsOf("image").slice(0, 4);
    case "audio":
      return mediaOf("seed-audio-1-0")
        .filter((x) => x.kind === "audio")
        .slice(0, 4)
        .map((x) => ({ ...x, model: "Seed Audio 1.0", modelSlug: "seed-audio-1-0" }));
  }
}

function MediaGrid({ pics }: { pics: Pic[] }) {
  const audio = pics.every((p) => p.kind === "audio");
  return (
    <div className={`grid gap-4 ${audio ? "sm:grid-cols-2" : pics.length >= 4 ? "grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3"}`}>
      {pics.map((p) => (
        <figure key={p.src}>
          <div className={`overflow-hidden rounded-[20px] bg-[#111] ring-1 ring-white/10 ${audio ? "h-[150px]" : ""}`} style={audio ? undefined : { aspectRatio: (p.aspect ?? "9:16").replace(":", "/") }}>
            <PicView p={p} />
          </div>
          {!audio && <figcaption className="mt-3 text-[14px] leading-snug text-[#CACACA]">{p.alt}</figcaption>}
          <p className="mt-1 text-[12.5px] font-semibold text-[#9F9F9F]">{p.model ? `Made with ${p.model} on BuzzVideo` : "Made on BuzzVideo"}</p>
        </figure>
      ))}
    </div>
  );
}

/* ── 首屏下方的编辑声明 ── */
function Disclosure({ best }: { best?: boolean }) {
  return (
    <div className="mx-auto max-w-[760px] rounded-[20px] bg-white/[0.04] px-6 py-5 text-left text-[14px] leading-relaxed text-[#CACACA] ring-1 ring-white/[0.08]">
      <p className="mt-1.5">
        BuzzVideo made this page and lists itself first as an editorial choice, not a {best ? "ranking" : "verdict"}. Facts about other tools come only from their official pricing, feature and help pages, each linked below; we did not sign in, buy plans or use review sites. Prices change often, so confirm on each site before you buy.
      </p>
    </div>
  );
}

/* ── 逐个工具卡 ── */
function ToolCard({ t, n, a, them }: { t: Resolved; n?: number; a: A; them?: boolean }) {
  const isBv = t.key === "buzzvideo";
  return (
    <article id={`tool-${t.key}`} className="scroll-mt-28 rounded-[24px] bg-white/[0.04] p-6 ring-1 ring-white/[0.08] md:p-8">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        {n !== undefined && <span className="text-[15px] font-black tabular-nums text-[#FF744D]">{String(n).padStart(2, "0")}</span>}
        <h3 className="text-[24px] font-extrabold leading-tight">{t.name}</h3>
        {isBv && <span className="rounded-full bg-white/[0.08] px-2.5 py-0.5 text-[12px] font-semibold text-[#CACACA]">Our product</span>}
        {them && <span className="rounded-full bg-white/[0.08] px-2.5 py-0.5 text-[12px] font-semibold text-[#CACACA]">The tool this page compares</span>}
      </div>
      <p className="mt-3 max-w-[56rem] text-[16px] leading-relaxed text-[#E8E8E8]">{t.what}</p>
      <p className="mt-4 text-[15px] leading-relaxed">
        <span className="font-bold text-[#FF744D]">Best for: </span>
        <span className="text-white">{t.pick.bestFor}</span>
      </p>
      <dl className="mt-5 grid gap-3 text-[14.5px] sm:grid-cols-2">
        <div className="rounded-[14px] bg-black/40 p-4 ring-1 ring-white/[0.06]">
          <dt className="text-[12.5px] font-semibold text-[#9F9F9F]">Entry paid plan</dt>
          <dd className="mt-1 leading-relaxed text-white">{t.entry}</dd>
        </div>
        <div className="rounded-[14px] bg-black/40 p-4 ring-1 ring-white/[0.06]">
          <dt className="text-[12.5px] font-semibold text-[#9F9F9F]">Free option</dt>
          <dd className="mt-1 leading-relaxed text-white">{t.free}</dd>
        </div>
      </dl>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {t.strengths.length > 0 && (
          <div>
            <h4 className="text-[15px] font-bold">Strengths</h4>
            <ul className="mt-3 space-y-2.5">
              {t.strengths.map((s) => (
                <li key={s} className="flex gap-2.5 text-[14.5px] leading-relaxed text-[#CACACA]">
                  <Check className="mt-1 size-4 shrink-0 text-[#FF744D]" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {t.cautions.length > 0 && (
          <div>
            <h4 className="text-[15px] font-bold">Check before you buy</h4>
            <ul className="mt-3 space-y-2.5">
              {t.cautions.map((s) => (
                <li key={s} className="flex gap-2.5 text-[14.5px] leading-relaxed text-[#CACACA]">
                  <CircleAlert className="mt-1 size-4 shrink-0 text-[#9F9F9F]" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/[0.08] pt-5 text-[13px] text-[#9F9F9F]">
        {isBv ? (
          <>
            {t.pick.tryHref && (
              <a {...a("Try BuzzVideo", t.pick.tryHref)} className={`${OA_CTA} px-4 py-2.5 text-[14px]`}>
                Try it on BuzzVideo <ArrowRight className="size-4" />
              </a>
            )}
          </>
        ) : (
          <>
            {t.href && t.href !== "/" && (
              <a {...a(`${t.name} alternatives`, t.href)} className="font-semibold text-white underline decoration-[#FF744D] underline-offset-4">
                Full {t.name} comparison
              </a>
            )}
          </>
        )}
      </div>
    </article>
  );
}

/* 速览表:每行一个工具 */
function GlanceTable({ tools }: { tools: Resolved[] }) {
  return (
    <DataTable
      firstColLabel="Tool"
      head={["Best for", "Entry paid plan", "Free option"]}
      rows={tools.map((t) => ({
        label: t.name,
        cells: [
          t.pick.bestFor,
          t.entry,
          <span key="f">
            {t.free}
          </span>,
        ],
      }))}
    />
  );
}

/* 浅底两栏：竞品强在哪 / BuzzVideo 不一样在哪 */
function StrongerSection({ name, them, bv }: { name: string; them: string[]; bv: string[] }) {
  const col = (title: string, items: string[], icon: ReactNode) => (
    <div className="rounded-[24px] bg-white p-7 shadow-[0_24px_60px_rgba(36,10,3,0.08)] md:p-9">
      <h2 className="text-[clamp(22px,2.2vw,28px)] font-extrabold leading-tight">{title}</h2>
      <ul className="mt-6 space-y-4">
        {items.map((s) => (
          <li key={s} className="flex gap-3 text-[16px] leading-relaxed text-[#240A03]/80">
            {icon}
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
  return (
    <section id="strengths" className="scroll-mt-28 bg-[#F6F6F6] py-20 text-[#240A03] md:py-28">
      <div className={`${OA_WRAP} grid gap-6 md:grid-cols-2`}>
        {col(`Where is ${name} stronger than BuzzVideo?`, them, <Check className="mt-1.5 size-4 shrink-0 text-[#FF744D]" />)}
        {col(`Where is BuzzVideo different from ${name}?`, bv, <ArrowRight className="mt-1.5 size-4 shrink-0 text-[#FF744D]" />)}
      </div>
    </section>
  );
}

function HowWeChecked({ extra }: { extra?: string }) {
  const items = [
    "Every fact about another product comes from that company's own website: pricing pages, feature pages and help-center articles. No review sites, directories or affiliate lists.",
    "We read each page in November 2026 without signing in or buying a plan. Where a price only loads inside an app, or a page did not show it, we say so instead of guessing.",
    "Where a company's own pages disagree, we say they differ rather than pick one.",
    "BuzzVideo facts come from BuzzVideo's own model settings, tool pages and pricing.",
    ...(extra ? [extra] : []),
  ];
  return (
    <OAPanel id="method" title="How did we check the facts on this page?">
      <ul className="max-w-[56rem] space-y-3">
        {items.map((s) => (
          <li key={s} className="flex gap-3 text-[16px] leading-relaxed text-[#CACACA]">
            <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-[#FF744D]" />
            {s}
          </li>
        ))}
      </ul>
    </OAPanel>
  );
}

function SourcesSection(_: { sources: Src[] }) {
  /* 2026-11-25 Monica:「落地页都不要放这个」—— 页面底部不再显示数据来源说明;外部来源仍留在结构化数据里 */
  return null;
}
export function SourcesSectionLegacy({ sources }: { sources: Src[] }) {
  return (
    <section id="sources" className="scroll-mt-28 pb-14 pt-6">
      <div className={OA_WRAP}>
        <h2 className="text-[22px] font-extrabold">Where do these facts come from?</h2>
        <p className="mt-2 text-[14px] text-[#9F9F9F]">Official pages only. {VERIFIED_LABEL}. Prices and plans change; check each site before you buy.</p>
        <ul className="mt-5 grid gap-x-8 gap-y-2 text-[13.5px] leading-relaxed text-[#9F9F9F] md:grid-cols-2">
          {sources.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white">
                {s.label}
              </a>{" "}
              <span className="break-all">({s.url.replace(/^https?:\/\//, "")})</span> · {VERIFIED_LABEL}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ChooseGrid({ items }: { items: { title: string; body: string }[] }) {
  return (
    <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((c, i) => (
        <li key={c.title} className="rounded-[20px] bg-white/[0.04] p-6 ring-1 ring-white/[0.08]">
          <span className="text-[14px] font-black tabular-nums text-[#FF744D]">{String(i + 1).padStart(2, "0")}</span>
          <h3 className="mt-2 text-[17px] font-bold leading-snug">{c.title}</h3>
          <p className="mt-2 text-[15px] leading-relaxed text-[#CACACA]">{c.body}</p>
        </li>
      ))}
    </ol>
  );
}

const mediaTitle: Record<MediaKind, string> = {
  ads: "What kind of ads does BuzzVideo make?",
  ugc: "What do BuzzVideo's UGC-style videos look like?",
  avatar: "What do BuzzVideo's talking videos look like?",
  video: "What do BuzzVideo's video models make?",
  image: "What do BuzzVideo's product images look like?",
  audio: "What does BuzzVideo's audio sound like?",
};

const lc = (s: string) => s.toLowerCase().replace(/\bai\b/g, "AI");
const softwareLd = (t: Resolved) => ({ "@type": "SoftwareApplication", name: t.name, url: t.site, applicationCategory: "MultimediaApplication" });

/* ═════════ 替代页 ═════════ */
export function AlternativesTemplate({ p, onLink }: { p: AltPage; onLink: OnLink }) {
  const { a } = useLinks(onLink);
  const them = resolve({ key: p.them, bestFor: p.tools.find((t) => t.key === p.them)?.bestFor ?? "" });
  const tools = p.tools.map(resolve);
  const others = tools.filter((t) => t.key !== p.them);
  const ordered = [tools[0], them, ...others.slice(1)];
  const sources = uniqSources([them, ...others]);
  const pics = mediaFor(p.media);
  const name = them.name;

  return (
    <main className="bg-black text-white">
      <GuideHero
        title={p.h1}
        lead={p.lead}
        actions={
          <>
            <a href="#compare" className={`${OA_CTA} px-6 py-3.5`}>
              Compare side by side
            </a>
            <a href="#tools" className={GHOST_BTN}>
              See every alternative
            </a>
          </>
        }
      >
        <Disclosure />
      </GuideHero>

      <AnswerCard q={`What is the best ${name} alternative?`} a={p.answer} />

      <OAPanel id="choose" title={`How do you choose a ${name} alternative?`} sub="Five checks that matter more than a feature list.">
        <ChooseGrid items={p.choose} />
      </OAPanel>

      <OAPanel id="compare" title={`How does BuzzVideo compare with ${name}?`} sub={`Side by side on the points buyers ask about most. ${name} facts come from its official pages, linked under the table.`}>
        <DataTable firstColLabel="" head={["BuzzVideo", name]} highlight={0} rows={p.h2h.map((r) => ({ label: r.label, cells: [r.bv, r.them] }))} />
      </OAPanel>

      <StrongerSection name={name} them={p.themStronger} bv={p.bvDifferent} />

      <OAPanel id="glance" title={`How do ${name} alternatives compare at a glance?`} sub="Entry plans and free options as each company lists them. Promotional prices are marked where we saw them.">
        <GlanceTable tools={ordered} />
      </OAPanel>

      <OAPanel id="tools" title={`Which ${name} alternatives are worth trying?`} sub={`BuzzVideo first, because we make it, then ${name} itself and ${others.length - 1} alternatives, each with its official sources.`}>
        <div className="space-y-6">
          {ordered.map((t) => (
            <ToolCard key={t.key} t={t} a={a} them={t.key === p.them} />
          ))}
        </div>
      </OAPanel>

      {pics.length > 0 && (
        <OAPanel id="examples" title={mediaTitle[p.media]} sub="Real results generated on BuzzVideo. Products shown are fictional or unbranded.">
          <MediaGrid pics={pics} />
        </OAPanel>
      )}

      <HowWeChecked />
      <OAFaq title={`What do people ask about ${name} alternatives?`} items={p.faq} />
      <OAChips title="Related comparisons" chips={p.related.map((r) => ({ label: r.label, link: a(r.label, r.href) }))} />
      <OACta title={`See if BuzzVideo fits your ads better than ${name}`} sub="Video, image and audio models on one account. You see the credit price before you create." cta={{ label: p.cta.label, link: a(p.cta.label, p.cta.href) }} />
      <SourcesSection sources={sources} />
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: p.h1,
            description: p.lead,
            dateModified: DATE_MODIFIED,
            publisher: PUBLISHER,
            about: ordered.map(softwareLd),
            citation: sources.map((s) => s.url),
          },
          faqLd(p.faq),
          ...pics.filter((x) => x.kind === "video").slice(0, 3).map((x) => ({ "@context": "https://schema.org", "@type": "VideoObject", name: x.alt, description: "Made on BuzzVideo.", contentUrl: abs(x.src), thumbnailUrl: abs(x.poster), uploadDate: DATE_MODIFIED })),
        ]}
      />
    </main>
  );
}

/* ═════════ 榜单页 ═════════ */
export function BestOfTemplate({ p, onLink }: { p: BestPage; onLink: OnLink }) {
  const { a } = useLinks(onLink);
  const tools = p.tools.map(resolve);
  const sources = uniqSources(tools.slice(1));
  const pics = pageMedia(p.slug).length ? pageMedia(p.slug) : mediaFor(p.media); /* 2026-11-25 榜单页有自己的示例就用自己的 */
  const noun = lc(p.h1.replace(/^Best /, ""));

  return (
    <main className="bg-black text-white">
      <GuideHero
        title={p.h1}
        lead={p.lead}
        actions={
          <>
            <a href="#glance" className={`${OA_CTA} px-6 py-3.5`}>
              Compare all {tools.length}
            </a>
            <a href="#criteria" className={GHOST_BTN}>
              How we chose
            </a>
          </>
        }
      >
        <Disclosure best />
      </GuideHero>

      <AnswerCard q={`What are the best ${noun}?`} a={p.answer} />

      <OAPanel id="criteria" title={`How did we choose these ${noun}?`} sub="Every tool on this page meets all of these.">
        <ChooseGrid items={p.criteria.map((c, i) => ({ title: ["What it does", "Where it starts", "Where the facts come from", "Who can buy it"][i] ?? "Criteria", body: c }))} />
      </OAPanel>

      <OAPanel id="glance" title={`How do the best ${noun} compare?`} sub="Best use, entry plan and free option for each, as listed on the official sites.">
        <GlanceTable tools={tools} />
      </OAPanel>

      {p.modelTable && p.modelTable.length > 0 && (
        <OAPanel id="models" title="How do the leading video models compare on specs?" sub="Every number comes from BuzzVideo's settings for these models. Gen-4.5 and Ray3.2 are not on BuzzVideo, so they are covered in the tool cards below.">
          <SpecTable slugs={p.modelTable} a={a} highlight={0} />
        </OAPanel>
      )}

      <OAPanel id="tools" title="What is each tool best for?" sub="BuzzVideo first, because we make it; the rest in no particular order. Each card lists its official sources.">
        <div className="space-y-6">
          {tools.map((t, i) => (
            <ToolCard key={t.key} t={t} n={i + 1} a={a} />
          ))}
        </div>
      </OAPanel>

      {pics.length > 0 && (
        <OAPanel id="examples" title={mediaTitle[p.media]} sub="Real results generated on BuzzVideo. Products shown are fictional or unbranded.">
          <MediaGrid pics={pics} />
        </OAPanel>
      )}

      <HowWeChecked />
      <OAFaq title={`What do people ask about ${noun}?`} items={p.faq} />
      <OAChips title="Related pages" chips={p.related.map((r) => ({ label: r.label, link: a(r.label, r.href) }))} />
      <OACta title="Make your next ad on BuzzVideo" sub="Video, image and audio models on one account. You see the credit price before you create." cta={{ label: p.cta.label, link: a(p.cta.label, p.cta.href) }} />
      <SourcesSection sources={sources} />
      <JsonLd
        data={[
          { "@context": "https://schema.org", "@type": "Article", headline: p.h1, description: p.lead, dateModified: DATE_MODIFIED, publisher: PUBLISHER, citation: sources.map((s) => s.url) },
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: p.h1,
            itemListElement: tools.map((t, i) => ({ "@type": "ListItem", position: i + 1, item: { ...softwareLd(t), description: t.pick.bestFor } })),
          },
          faqLd(p.faq),
        ]}
      />
    </main>
  );
}

