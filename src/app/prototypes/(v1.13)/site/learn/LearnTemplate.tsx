"use client";

/* BuzzVideo Academy 解答页 / 教程页模板(2026-11-19)。内容在 content.ts。
   版式：黑底首屏(左：问句 H1 + 直答 + CTA;右：真实成片,文字不压画面)→ 正文(左侧目录 + 问句 H2 小节)
     → 品牌色整块:How to do it on BuzzVideo(步骤 + 进工具按钮,appOf)→ FAQ 两列 → 浅底来源(URL + Last verified Nov 2026)
     → 继续阅读标签 → 收尾卡。
   GEO:一页一个 H1;首段直答;FAQ 答案先给结论;JSON-LD = Article + FAQPage(+ HowTo / DefinedTermSet)。不放面包屑。 */

import { Fragment, useMemo, type ReactNode } from "react";
import { ArrowRight, ArrowUpRight, ExternalLink } from "lucide-react";
import { appOf, go, type OnLink } from "../../site-nav/SiteNavHeader";
import { allLinks, statusOf } from "../../site-nav/nav-data";
import { OA_CTA, OA_WRAP, OAChips, OACta, OAFaq, PicView, type LinkProps } from "../oa/kit";
import { picsOf, POSTS, type Pic } from "../oa/pool";
import { GUIDES, LEARN, type Block, type Guide, type GuideGroup, type MediaRef } from "./content";

const VERIFIED = "Last verified Nov 2026";
const SITE = "https://buzzvideo.ai";

/* 池子之外、仓库里已有的真实 BuzzVideo 素材(工具页 Guide 截帧、MCP Skill 示例封面) */
const EXTRA: Record<string, Pic> = {
  "lip-1": { kind: "image", src: "/prototypes/ai-tools/guide/lip-sync-frame-1.jpg", aspect: "4:3", alt: "Frame from a lip-synced video: a woman holding a lipstick, lips closed between words", prompt: "", source: "ai-tools guide" },
  "lip-2": { kind: "image", src: "/prototypes/ai-tools/guide/lip-sync-frame-2.jpg", aspect: "4:3", alt: "Frame from a lip-synced video: a woman holding a lipstick, mid-word", prompt: "", source: "ai-tools guide" },
  "avatar-photo": { kind: "image", src: "/prototypes/ai-tools/guide/talking-avatar-photo.jpg", aspect: "4:3", alt: "Portrait photo used as the input for a talking avatar", prompt: "", source: "ai-tools guide" },
  "avatar-result": { kind: "image", src: "/prototypes/ai-tools/guide/talking-avatar-result.jpg", aspect: "4:3", alt: "Frame from a talking avatar video: a woman with sunglasses on her head smiling and speaking to camera", prompt: "", source: "ai-tools guide" },
  "product-photos": { kind: "image", src: "/video-library/posters/skill-product-photos.jpg", aspect: "4:5", alt: "A vitamin C serum bottle on a stone counter next to folded towels and a plant", prompt: "", source: "MCP Skill product-photos" },
  "hook-variants": { kind: "image", src: "/video-library/posters/skill-ad-hook-variants.jpg", aspect: "640:386", alt: "The same LUMEA serum shot shown with an original hook and two new hook variants", prompt: "", source: "MCP Skill ad-hook-variants" },
  "ad-localizer": { kind: "image", src: "/video-library/posters/skill-ad-localizer.jpg", aspect: "16:9", alt: "A dropper releasing a drop into a teal bottle in a lab, from a localized ad", prompt: "", source: "MCP Skill ad-localizer" },
};

export function resolveMedia(m?: MediaRef): Pic | undefined {
  if (!m) return undefined;
  if (m.from === "extra") return EXTRA[m.match];
  const re = new RegExp(m.match, "i");
  return picsOf(m.from).find((p) => re.test(p.alt));
}

const ratio = (a?: string) => {
  const [w, h] = (a ?? "1:1").split(":").map(Number);
  return w && h ? w / h : 1;
};

/* ── 链接 ── */
function useLinks(onLink: OnLink) {
  const a = (label: string, href: string): LinkProps => {
    if (href.startsWith("http")) return { href, onClick: () => {} };
    return {
      href,
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        go(href, statusOf(href), label, onLink);
      },
    };
  };
  /* 进产品工具(照工具页：有 app 原型页就直接进，没有退回落地页) */
  const app = (label: string, href: string): LinkProps => ({
    href,
    onClick: (e: React.MouseEvent) => {
      e.preventDefault();
      const url = appOf(href);
      if (url) window.location.href = url;
      else go(href, statusOf(href), label, onLink);
    },
  });
  return { a, app };
}

/* 文案里的 [label](href) → 链接 */
function Rich({ text, a, light = false }: { text: string; a: (label: string, href: string) => LinkProps; light?: boolean }) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return (
    <>
      {parts.map((p, i) => {
        const m = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (!m) return <Fragment key={i}>{p}</Fragment>;
        const ext = m[2].startsWith("http");
        return (
          <a
            key={i}
            {...a(m[1], m[2])}
            {...(ext ? { target: "_blank", rel: "noopener" } : {})}
            className={`font-semibold underline decoration-[#FF744D] decoration-2 underline-offset-4 transition hover:decoration-[3px] ${light ? "text-[#240A03]" : "text-white"}`}
          >
            {m[1]}
          </a>
        );
      })}
    </>
  );
}

/* 成片 + 下方说明(说明在图外，不压主体) */
function Figure({ pic, caption, max = 560 }: { pic: Pic; caption: string; max?: number }) {
  const r = pic.kind === "audio" ? 4 / 3 : ratio(pic.aspect);
  return (
    <figure className="w-full">
      <div className="mx-auto overflow-hidden rounded-[22px] bg-[#111] ring-1 ring-white/10" style={{ aspectRatio: `${r}`, maxWidth: r < 1 ? Math.round(max * r) : undefined }}>
        <PicView p={pic} />
      </div>
      <figcaption className="mx-auto mt-3 max-w-[34rem] text-center text-[13px] leading-snug text-[#9F9F9F]">
        {caption}
        {pic.model && <span className="text-[#CACACA]"> · {pic.model}</span>}
      </figcaption>
    </figure>
  );
}

function BlockView({ b, a }: { b: Block; a: (label: string, href: string) => LinkProps }) {
  switch (b.kind) {
    case "p":
      return (
        <p className="text-[17px] leading-[1.7] text-[#D6D6D6]">
          <Rich text={b.text} a={a} />
        </p>
      );
    case "ul":
      return (
        <ul className="space-y-3">
          {b.items.map((t) => (
            <li key={t} className="flex gap-3 text-[17px] leading-[1.65] text-[#D6D6D6]">
              <span aria-hidden className="mt-[11px] size-1.5 shrink-0 rounded-full bg-[#FF744D]" />
              <span>
                <Rich text={t} a={a} />
              </span>
            </li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol className="space-y-3">
          {b.items.map((t, i) => (
            <li key={t} className="flex gap-4 rounded-[16px] bg-white/[0.04] p-4 text-[16.5px] leading-[1.6] text-[#D6D6D6] ring-1 ring-white/[0.06]">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#FF744D] text-[13px] font-extrabold tabular-nums text-[#240A03]">{i + 1}</span>
              <span className="pt-0.5">
                <Rich text={t} a={a} />
              </span>
            </li>
          ))}
        </ol>
      );
    case "table":
      return (
        <div className="overflow-x-auto rounded-[16px] ring-1 ring-white/10">
          <table className="w-full min-w-[520px] border-collapse text-left text-[15px]">
            <thead>
              <tr className="bg-white/[0.06]">
                {b.head.map((h, i) => (
                  <th key={i} scope="col" className="px-4 py-3 font-bold text-white">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((r) => (
                <tr key={r.join("|")} className="border-t border-white/[0.08]">
                  {r.map((c, i) =>
                    i === 0 ? (
                      <th key={i} scope="row" className="px-4 py-3 align-top font-semibold text-white">
                        {c}
                      </th>
                    ) : (
                      <td key={i} className="px-4 py-3 align-top leading-relaxed text-[#CACACA]">
                        {c}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "note":
      return (
        <p className="rounded-[16px] bg-[#FFF3EC] px-5 py-4 text-[15px] leading-relaxed text-[#240A03]">
          <Rich text={b.text} a={a} light />
        </p>
      );
    case "media": {
      const p = resolveMedia(b.media);
      return p ? <Figure pic={p} caption={b.media.caption} max={460} /> : null;
    }
  }
}

/* ── 首屏 ── */
function Hero({ g, a, cta, children }: { g: { h1: string; answer: string; legal?: boolean }; a: (l: string, h: string) => LinkProps; cta?: ReactNode; children?: ReactNode }) {
  return (
    <section className="relative isolate overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute left-[-10%] top-[-260px] -z-10 h-[520px] w-[900px] rounded-full bg-[#FF744D]/[0.14] blur-[120px]" />
      <div className={`${OA_WRAP} grid items-center gap-12 pb-16 pt-14 md:pb-24 md:pt-24 ${children ? "lg:grid-cols-[1.2fr_0.8fr]" : ""}`}>
        <div>
          <h1 className="max-w-[18ch] text-[clamp(40px,5.6vw,76px)] font-black leading-[0.98] tracking-[-0.035em] [text-wrap:balance]">{g.h1}</h1>
          <p className="mt-7 max-w-[40rem] text-[19px] leading-[1.6] text-white/85 [text-wrap:pretty]">
            <Rich text={g.answer} a={a} />
          </p>
          <p className="mt-4 text-[13px] text-[#9F9F9F]">
            {VERIFIED} · BuzzVideo Academy{g.legal && " · Not legal advice"}
          </p>
          {cta && <div className="mt-8 flex flex-wrap items-center gap-3">{cta}</div>}
        </div>
        {children}
      </div>
    </section>
  );
}

function Sources({ sources, legal }: { sources: Guide["sources"]; legal?: boolean }) {
  if (!sources.length && !legal) return null;
  return (
    <section id="sources" className="scroll-mt-28 bg-[#F6F6F6] py-16 text-[#240A03] md:py-20">
      <div className={`${OA_WRAP} max-w-[56rem]`}>
        <h2 className="text-[clamp(24px,2.4vw,32px)] font-bold leading-[1.2]">Sources</h2>
        <p className="mt-3 text-[15px] text-[#6F6C6C]">
          Official pages we checked for the facts on this page. {VERIFIED}.{legal && " This page summarizes public rules and is not legal advice."}
        </p>
        {sources.length > 0 && (
          <ol className="mt-8 space-y-3">
            {sources.map((s, i) => (
              <li key={s.url} className="rounded-[14px] bg-white p-4 shadow-[0_1px_0_rgba(36,10,3,0.06)]">
                <a href={s.url} target="_blank" rel="noopener" className="group flex items-start gap-3">
                  <span className="mt-0.5 text-[13px] font-bold tabular-nums text-[#FF5255]">{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15.5px] font-semibold leading-snug group-hover:underline">{s.label}</span>
                    <span className="mt-1 block break-all text-[13px] text-[#6F6C6C]">{s.url}</span>
                    <span className="mt-1 block text-[12.5px] text-[#6F6C6C]">{VERIFIED}</span>
                  </span>
                  <ExternalLink className="mt-1 size-4 shrink-0 text-[#6F6C6C]" />
                </a>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

const labelOf = (href: string) => {
  const g = GUIDES.find((x) => `/${x.slug}` === href);
  if (g) return g.h1.replace(/\?$/, "?");
  return allLinks().find((l) => l.href === href)?.label ?? href.replace(/^\//, "").replace(/-/g, " ");
};

function ldOf(g: Guide) {
  const url = `${SITE}/${g.slug}`;
  const out: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: g.h1,
      description: g.answer,
      url,
      dateModified: "2026-11-19",
      author: { "@type": "Organization", name: "BuzzVideo AI", url: SITE },
      publisher: { "@type": "Organization", name: "BuzzVideo AI", url: SITE },
      ...(g.sources.length ? { citation: g.sources.map((s) => s.url) } : {}),
    },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: g.faq.map((q) => ({ "@type": "Question", name: q.q, acceptedAnswer: { "@type": "Answer", text: q.a.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") } })) },
  ];
  if (g.howto) out.push({ "@context": "https://schema.org", "@type": "HowTo", name: g.howto.name, step: g.howto.steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, text: s })) });
  if (g.terms)
    out.push({
      "@context": "https://schema.org",
      "@type": "DefinedTermSet",
      name: "AI video glossary",
      url,
      hasDefinedTerm: g.terms.map((t) => ({ "@type": "DefinedTerm", name: t.term, description: t.def, ...(t.href ? { url: `${SITE}${t.href}` } : {}) })),
    });
  return out;
}

function JsonLd({ data }: { data: object[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

/* ═════════════ 单篇解答 / 教程页 ═════════════ */
export function GuidePage({ g, onLink }: { g: Guide; onLink: OnLink }) {
  const { a, app } = useLinks(onLink);
  const hero = useMemo(() => resolveMedia(g.media), [g]);
  const toc = g.sections.map((s) => ({ id: s.id, label: s.h2 }));

  if (g.terms) return <GlossaryPage g={g} onLink={onLink} />;

  return (
    <main className="bg-black text-white">
      <Hero
        g={g}
        a={a}
        cta={
          <>
            <a {...app(g.buzz.cta.label, g.buzz.cta.href)} className={OA_CTA}>
              {g.buzz.cta.label} <ArrowUpRight className="size-4" />
            </a>
            <a href="#on-buzzvideo" className="inline-flex items-center gap-1.5 rounded-xl bg-white/[0.08] px-4 py-3 text-[14.5px] font-semibold text-white transition hover:bg-white/15">
              See the steps <ArrowRight className="size-4" />
            </a>
          </>
        }
      >
        {hero && g.media && (
          <div className="mx-auto w-full max-w-[460px] lg:max-w-none">
            <Figure pic={hero} caption={g.media.caption} max={540} />
          </div>
        )}
      </Hero>

      {/* 正文：左目录 + 问句小节 */}
      <div className={`${OA_WRAP} grid gap-12 pb-20 md:pb-28 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-16`}>
        <nav aria-label="On this page" className="hidden lg:block">
          <div className="sticky top-28">
            <p className="text-[12.5px] font-bold uppercase tracking-[0.08em] text-[#9F9F9F]">On this page</p>
            <ul className="mt-4 space-y-2.5 text-[14px] leading-snug">
              {toc.map((t) => (
                <li key={t.id}>
                  <a href={`#${t.id}`} className="text-[#CACACA] transition hover:text-white">
                    {t.label}
                  </a>
                </li>
              ))}
              <li>
                <a href="#on-buzzvideo" className="text-[#CACACA] transition hover:text-white">
                  {g.buzz.title}
                </a>
              </li>
              <li>
                <a href="#faq" className="text-[#CACACA] transition hover:text-white">
                  FAQ
                </a>
              </li>
              {(g.sources.length > 0 || g.legal) && (
                <li>
                  <a href="#sources" className="text-[#CACACA] transition hover:text-white">
                    Sources
                  </a>
                </li>
              )}
            </ul>
          </div>
        </nav>
        <article className="max-w-[46rem] space-y-16 md:space-y-20">
          {g.sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-28">
              <h2 className="text-[clamp(26px,2.6vw,36px)] font-bold leading-[1.18] tracking-[-0.015em] [text-wrap:balance]">{s.h2}</h2>
              <div className="mt-6 space-y-6">
                {s.blocks.map((b, i) => (
                  <BlockView key={i} b={b} a={a} />
                ))}
              </div>
            </section>
          ))}
        </article>
      </div>

      {/* 品牌色整块:在 BuzzVideo 上怎么做 */}
      <section id="on-buzzvideo" className="scroll-mt-28 bg-[#FF744D] py-20 text-[#240A03] md:py-24">
        <div className={OA_WRAP}>
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <div>
              <h2 className="text-[clamp(32px,4vw,56px)] font-black leading-[1.02] tracking-[-0.02em] [text-wrap:balance]">{g.buzz.title}</h2>
              {g.buzz.note && (
                <p className="mt-5 max-w-[32rem] text-[16px] leading-relaxed text-[#240A03]/85">
                  <Rich text={g.buzz.note} a={a} light />
                </p>
              )}
              <a {...app(g.buzz.cta.label, g.buzz.cta.href)} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#240A03] px-6 py-3.5 text-[15px] font-bold text-white transition hover:bg-black">
                {g.buzz.cta.label} <ArrowUpRight className="size-4" />
              </a>
            </div>
            <ol className="grid gap-3">
              {g.buzz.steps.map((s, i) => (
                <li key={s} className="flex items-start gap-4 rounded-[20px] bg-[#240A03] p-5 text-white">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#FF744D] text-[15px] font-black tabular-nums text-[#240A03]">{i + 1}</span>
                  <span className="pt-1.5 text-[16.5px] font-semibold leading-snug">{s}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <OAFaq items={g.faq.map((q) => ({ q: q.q, a: q.a.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") }))} />
      <Sources sources={g.sources} legal={g.legal} />
      <OAChips title="Keep learning" chips={[...g.related, "/learn"].filter((h, i, arr) => arr.indexOf(h) === i).map((h) => ({ label: h === "/learn" ? "BuzzVideo Academy" : labelOf(h), link: a(labelOf(h), h) }))} />
      <OACta title="Make your next ad on BuzzVideo" sub="Video, image and audio ads with the leading AI models on one BuzzVideo account." cta={{ label: g.buzz.cta.label, link: app(g.buzz.cta.label, g.buzz.cta.href) }} />
      <div className="pb-10" />
      <JsonLd data={ldOf(g)} />
    </main>
  );
}

/* ═════════════ 术语表 ═════════════ */
function GlossaryPage({ g, onLink }: { g: Guide; onLink: OnLink }) {
  const { a, app } = useLinks(onLink);
  const terms = [...(g.terms ?? [])].sort((x, y) => x.term.localeCompare(y.term));
  const letters = [...new Set(terms.map((t) => t.term[0].toUpperCase()))];
  const idOf = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return (
    <main className="bg-black text-white">
      <Hero
        g={g}
        a={a}
        cta={
          <a {...app(g.buzz.cta.label, g.buzz.cta.href)} className={OA_CTA}>
            {g.buzz.cta.label} <ArrowUpRight className="size-4" />
          </a>
        }
      />
      <section className={`${OA_WRAP} pb-20 md:pb-28`}>
        <nav aria-label="Jump to letter" className="sticky top-16 z-10 -mx-4 flex flex-wrap gap-1.5 bg-black/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
          {letters.map((l) => (
            <a key={l} href={`#letter-${l}`} className="grid size-9 place-items-center rounded-lg bg-white/[0.06] text-[14px] font-bold text-white transition hover:bg-[#FF744D] hover:text-[#240A03]">
              {l}
            </a>
          ))}
        </nav>
        <h2 className="sr-only">AI video terms A to Z</h2>
        <div className="mt-8 space-y-12">
          {letters.map((l) => (
            <div key={l} id={`letter-${l}`} className="scroll-mt-36">
              <p aria-hidden className="text-[40px] font-black leading-none text-[#FF744D]">
                {l}
              </p>
              <dl className="mt-5 grid gap-3 md:grid-cols-2">
                {terms
                  .filter((t) => t.term[0].toUpperCase() === l)
                  .map((t) => (
                    <div key={t.term} id={idOf(t.term)} className="scroll-mt-36 rounded-[18px] bg-white/[0.05] p-5 ring-1 ring-white/[0.06]">
                      <dt className="text-[18px] font-extrabold leading-snug">
                        <h3>{t.term}</h3>
                      </dt>
                      <dd className="mt-2 text-[15.5px] leading-relaxed text-[#CACACA]">
                        {t.def}
                        {t.href && (
                          <a {...a(t.term, t.href)} className="mt-3 flex w-fit items-center gap-1 text-[14px] font-semibold text-white underline decoration-[#FF744D] decoration-2 underline-offset-4">
                            {labelOf(t.href)} <ArrowRight className="size-3.5" />
                          </a>
                        )}
                      </dd>
                    </div>
                  ))}
              </dl>
            </div>
          ))}
        </div>
      </section>
      <OAFaq items={g.faq} />
      <OAChips title="Keep learning" chips={g.related.map((h) => ({ label: h === "/learn" ? "BuzzVideo Academy" : labelOf(h), link: a(labelOf(h), h) }))} />
      <OACta title="Put the terms to work" sub="Make video, image and audio ads with the leading AI models on one BuzzVideo account." cta={{ label: g.buzz.cta.label, link: app(g.buzz.cta.label, g.buzz.cta.href) }} />
      <div className="pb-10" />
      <JsonLd data={ldOf(g)} />
    </main>
  );
}

/* ═════════════ Academy 总页 /learn ═════════════ */
const GROUPS: { key: GuideGroup; title: string }[] = [
  { key: "Questions", title: "Straight answers to common questions" },
  { key: "How-to guides", title: "How-to guides" },
  { key: "Specs and reference", title: "Specs and reference" },
];

export function LearnHub({ onLink }: { onLink: OnLink }) {
  const { a, app } = useLinks(onLink);
  return (
    <main className="bg-black text-white">
      <Hero
        g={{ h1: LEARN.h1, answer: LEARN.lead }}
        a={a}
        cta={
          <>
            <a href="#guides" className={OA_CTA}>
              Browse the guides <ArrowRight className="size-4" />
            </a>
            <a href="#tutorials" className="inline-flex items-center gap-1.5 rounded-xl bg-white/[0.08] px-4 py-3 text-[14.5px] font-semibold text-white transition hover:bg-white/15">
              Blog tutorials <ArrowRight className="size-4" />
            </a>
          </>
        }
      />

      <div id="guides" className="scroll-mt-28">
        {GROUPS.map((grp) => {
          const list = GUIDES.filter((g) => g.group === grp.key);
          return (
            <section key={grp.key} className="pb-16 md:pb-24">
              <div className={OA_WRAP}>
                <h2 className="text-[clamp(26px,2.8vw,40px)] font-bold leading-[1.2]">{grp.title}</h2>
                <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((g) => {
                    const p = resolveMedia(g.media);
                    return (
                      <li key={g.slug}>
                        <a {...a(g.h1, `/${g.slug}`)} className="group flex h-full flex-col overflow-hidden rounded-[20px] bg-white/[0.05] ring-1 ring-white/[0.06] transition hover:-translate-y-1 hover:bg-white/[0.08]">
                          {p && p.kind !== "audio" ? (
                            <div className="aspect-[16/10] overflow-hidden bg-[#111]">
                              <PicView p={p} className="transition duration-500 group-hover:scale-[1.04]" />
                            </div>
                          ) : (
                            <div className="flex aspect-[16/10] items-end bg-[radial-gradient(120%_90%_at_15%_0%,rgba(255,116,77,0.45),transparent_60%)] bg-[#1C1C1C] p-5">
                              <span className="text-[22px] font-black leading-tight">{g.slug === "glossary" ? "A–Z" : g.h1}</span>
                            </div>
                          )}
                          <div className="flex flex-1 flex-col p-5">
                            <h3 className="text-[17px] font-bold leading-snug">{g.h1}</h3>
                            <p className="mt-2 flex-1 text-[14.5px] leading-relaxed text-[#CACACA]">{g.card}</p>
                            <span className="mt-4 inline-flex items-center gap-1 text-[13.5px] font-semibold text-[#FF744D]">
                              Read <ArrowRight className="size-3.5" />
                            </span>
                          </div>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>
          );
        })}
      </div>

      <section id="tutorials" className="scroll-mt-28 bg-[#F6F6F6] py-20 text-[#240A03] md:py-28">
        <div className={OA_WRAP}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-[clamp(26px,2.8vw,40px)] font-bold leading-[1.2]">Step-by-step tutorials from the BuzzVideo blog</h2>
            <a {...a("Blog", "/blog")} className="inline-flex items-center gap-1.5 rounded-xl bg-[#240A03] px-4 py-2.5 text-[14px] font-semibold text-white transition hover:bg-black">
              All blog posts <ArrowRight className="size-4" />
            </a>
          </div>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {POSTS.map((p) => (
              <li key={p.href}>
                <a {...a(p.title, p.href)} className="group block h-full overflow-hidden rounded-[18px] bg-white shadow-[0_1px_0_rgba(36,10,3,0.06)] transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(36,10,3,0.10)]">
                  <div className="aspect-[16/10] overflow-hidden bg-[#F6F6F6]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.cover} alt="" loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-[1.04]" />
                  </div>
                  <div className="p-4">
                    <p className="text-[12px] text-[#6F6C6C]">{p.date}</p>
                    <h3 className="mt-1.5 text-[15.5px] font-bold leading-snug">{p.title}</h3>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <OACta title="Learn by making" sub="Put a guide to work on BuzzVideo: video, image and audio ads with the leading AI models on one account." cta={{ label: "Get started", link: app("Get started", "/ai-ad-generator") }} />
      <div className="pb-10" />
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: LEARN.h1,
            description: LEARN.lead,
            url: `${SITE}/learn`,
            publisher: { "@type": "Organization", name: "BuzzVideo AI", url: SITE },
            mainEntity: {
              "@type": "ItemList",
              itemListElement: [...GUIDES.map((g) => ({ name: g.h1, url: `${SITE}/${g.slug}` })), ...POSTS.map((p) => ({ name: p.title, url: `${SITE}${p.href}` }))].map((x, i) => ({ "@type": "ListItem", position: i + 1, name: x.name, url: x.url })),
            },
          },
        ]}
      />
    </main>
  );
}
