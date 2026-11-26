"use client";

/* 用例 / 广告模板落地页模板(2026-11-19,v1.13 第 3 批)。一级网址 /<slug>,数据在 content/*.ts(汇总于 usecase-content.ts)。
   版式沿用工具页的 OpenArt 骨架(../oa/kit.tsx):首屏(大标题 + 一句定义 + 可编辑提示词框 + 真实成片拼贴)
     → 能做什么(左右交替，真实成片)→ 模板 = 现成提示词配方(填回首屏 / 复制)→ 示例 → 三步 → 规格(只放核实过的)
     → FAQ → 博客 → 相关页面标签 → 收尾卡。
   「模板」只是提示词，不说有模板库功能。CTA「Create now」= 带着当前提示词进最匹配的工具(appOf)。 */

import { useMemo, useState } from "react";
import { ArrowRight, ArrowUp, Plus } from "lucide-react";
import { appOf, go, type OnLink } from "../../site-nav/SiteNavHeader";
import { allLinks, INDUSTRY_HREFS, statusOf } from "../../site-nav/nav-data";
import { MODELS } from "../../site-nav/models-catalog";
import { StepPickModel, StepPrompt, StepResult } from "../models/ModelVisuals";
import { modelHref } from "../models/model-content";
import { CopyBtn, OA_CTA, OA_WRAP, OABlog, OAChips, OACta, OAExamples, OAFaq, OAFeatureRows, OAHero, OAPanel, OAPromptBox, OASteps, PicView, type OARow } from "../oa/kit";
import { heroPics, picsOf, postsFor, type Pic } from "../oa/pool";
import { SIGNUP_CREDITS } from "../tools/credits";
import { MEDIA, type MediaKey, type UseCase } from "./usecase-types";
import { caseBySlug } from "./usecase-content";
import { resolveHref } from "../redirects";
import { pageMedia } from "../page-media";
import { CONTENT_UPDATED } from "../content-date";

const VERIFIED = "November 23, 2026";
const ALL_PICS: Pic[] = [...picsOf("video"), ...picsOf("image")];
const picOf = (k: MediaKey): Pic | undefined => ALL_PICS.find((p) => p.src.endsWith(MEDIA[k]));
const plain = (s: string) => s.replace(/\[([^\]]+)\]/g, "$1");

/* 提示词里的 [占位] 标橙 */
function PromptPreview({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\[[^\]]+\])/g).map((p, i) =>
        p.startsWith("[") ? (
          <mark key={i} className="rounded-[3px] bg-[#FF744D]/20 text-white ring-1 ring-[#FF744D]/60">
            {p.slice(1, -1)}
          </mark>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

let LABELS: Map<string, string> | null = null;
function labelOf(href: string): string {
  if (!LABELS) LABELS = new Map(allLinks().map((l) => [l.href, l.label]));
  return LABELS.get(href) ?? caseBySlug(href.slice(1))?.name ?? href.slice(1).replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function UseCaseTemplate({ u, onLink }: { u: UseCase; onLink: OnLink }) {
  const a = (label: string, rawHref: string, status = statusOf(resolveHref(rawHref)), href = resolveHref(rawHref)) => ({
    href,
    onClick: (e: React.MouseEvent) => {
      e.preventDefault();
      go(href, status, label, onLink);
    },
  });
  const [prompt, setPrompt] = useState(u.prompt);

  /* 进工具：带上当前提示词([占位] 去括号);生成器以外的工具页不带 */
  const enterTool = (label: string, text = prompt) => {
    const base = appOf(u.tool);
    if (!base) return go(u.tool, statusOf(u.tool), label, onLink);
    if (base.startsWith("/prototypes/video-gen-modes")) {
      const url = new URL(base, window.location.origin);
      url.searchParams.set("prompt", plain(text));
      window.location.assign(url.pathname + url.search);
    } else window.location.assign(base);
  };
  const toTool = (label: string) => ({
    href: u.tool,
    onClick: (e: React.MouseEvent) => {
      e.preventDefault();
      enterTool(label);
    },
  });

  const own = useMemo(() => [...pageMedia(u.slug), ...u.hero.map(picOf).filter((p): p is Pic => !!p)], [u]); /* 2026-11-25 本页专属配图排最前 */
  const type = own[0]?.kind === "image" ? "image" : "video";
  const hero = useMemo(() => heroPics(type, own, 10), [type, own]);
  const model = MODELS.find((m) => m.slug === u.model);

  const rows: OARow[] = u.makes.map((m) => {
    const p = picOf(m.pic);
    return {
      key: m.title,
      title: m.title,
      body: m.body,
      media: <div className="aspect-[4/3]">{p ? <PicView p={p} /> : null}</div>,
      cta: { label: "Create now", link: toTool(u.toolName) },
    };
  });

  /* 示例：本页挑的成片 + 「能做什么」用到的成片(去重) */
  const examples = useMemo(() => {
    const seen = new Set<string>();
    return [...own, ...u.makes.map((m) => picOf(m.pic)).filter((p): p is Pic => !!p)].filter((p) => (seen.has(p.src) ? false : (seen.add(p.src), true)));
  }, [own, u]);

  const firstRecipe = u.recipes[0]?.prompt ?? u.prompt;
  const steps = u.steps.slice(0, 3).map((s, i) => ({
    ...s,
    visual:
      i === 0 && model ? (
        <StepPickModel m={model} siblings={MODELS.filter((x) => x.type === model.type && x.slug !== model.slug)} />
      ) : i === 1 ? (
        <StepPrompt prompt={plain(firstRecipe)} chips={[model?.name ?? u.toolName]} />
      ) : model ? (
        <StepResult sample={own[0]} m={model} />
      ) : null,
  }));

  const applyRecipe = (p: string) => {
    setPrompt(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* 2026-11-25 Footer 精简到约 100 个后，行业页不再全部进 Footer:每个行业页在「相关」里多带后面两个行业，保证都有正文内链 */
  const at = INDUSTRY_HREFS.indexOf("/" + u.slug);
  const siblings = at < 0 ? [] : [1, 2].map((k) => INDUSTRY_HREFS[(at + k) % INDUSTRY_HREFS.length]).filter((h) => !u.related.includes(h));
  const chips = [...u.related, ...siblings].map((href) => ({ label: labelOf(href), link: a(labelOf(href), href) }));
  const faqs = [u.definition, ...u.faq];

  return (
    <main className="bg-black text-white">
      <OAHero
        onPrompt={setPrompt}
        chip={
          model ? (
            <a {...a(model.name, modelHref(model.slug))} className="inline-flex items-center gap-2 rounded-full bg-white/[0.07] px-3.5 py-1.5 text-[13px] font-semibold text-[#E8E8E8] ring-1 ring-white/10 transition hover:bg-white/[0.12]">
              <span className="size-1.5 rounded-full bg-[#FF744D]" />
              {u.chip}
              <ArrowRight className="size-3.5" />
            </a>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.07] px-3.5 py-1.5 text-[13px] font-semibold text-[#E8E8E8] ring-1 ring-white/10">
              <span className="size-1.5 rounded-full bg-[#FF744D]" />
              {u.chip}
            </span>
          )
        }
        title={u.h1}
        lead={u.lead}
        pics={hero}
        box={
          <OAPromptBox onSubmit={() => enterTool(u.toolName)}>
            <label htmlFor="usecase-prompt" className="sr-only">
              Prompt for {u.name}
            </label>
            <div className="relative min-h-[84px] px-1 text-[16px] leading-relaxed">
              <div aria-hidden className="pointer-events-none whitespace-pre-wrap break-words text-white">
                <PromptPreview text={prompt} />
                {"​"}
              </div>
              <textarea
                id="usecase-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                spellCheck={false}
                className="absolute inset-0 size-full resize-none overflow-hidden bg-transparent text-transparent caret-white selection:bg-[#FF744D]/30 focus:outline-none"
              />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <a {...toTool("Add product photo")} className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] px-3 py-1.5 text-[12.5px] font-semibold text-[#E8E8E8] transition hover:bg-white/15">
                <Plus className="size-3.5" /> Add product photo
              </a>
              <span className="rounded-full bg-white px-3 py-1.5 text-[12.5px] font-semibold text-[#240A03]">{u.toolName}</span>
              <span className="ml-auto">
                <button type="submit" className={OA_CTA}>
                  Create now <ArrowUp className="size-4" />
                </button>
              </span>
            </div>
          </OAPromptBox>
        }
      />

      {u.hub && <HubGrid u={u} a={a} />}

      {rows.length > 0 && <OAFeatureRows id="make" title={u.makeTitle} sub={u.makeSub} rows={rows} />}

      {u.recipes.length > 0 && (
        <OAPanel
          id="templates"
          title={u.recipesTitle}
          sub={
            <>
              {u.recipesSub} Each template is a prompt: swap the <span className="rounded-[3px] bg-[#FF744D]/20 px-1 text-white ring-1 ring-[#FF744D]/60">highlighted</span> parts for your own product, then create.
            </>
          }
        >
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {u.recipes.map((r) => (
              <li key={r.name} className="flex flex-col rounded-[20px] bg-white/[0.05] p-5 ring-1 ring-white/[0.08]">
                <h3 className="text-[18px] font-extrabold leading-snug">{r.name}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-[#CACACA]">{r.bestFor}</p>
                <p className="mt-4 flex-1 rounded-[14px] bg-black/50 p-4 text-[14.5px] leading-relaxed text-white/90 ring-1 ring-white/[0.06]">
                  <PromptPreview text={r.prompt} />
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => applyRecipe(r.prompt)} className="rounded-lg bg-white px-3 py-2 text-[12.5px] font-bold text-[#240A03] transition hover:bg-[#FFF3EC]">
                    Use this template
                  </button>
                  <CopyBtn text={r.prompt} />
                </div>
              </li>
            ))}
          </ul>
        </OAPanel>
      )}

      {examples.length >= 4 && (
        <OAExamples
          title={`${u.name} examples made on BuzzVideo`}
          sub="Every clip and image below was generated on BuzzVideo. Hover a card to read its prompt when one is attached, then try it or start from a template above."
          tabs={[{ label: "All", pics: examples }]}
          onUse={applyRecipe}
        />
      )}

      <OASteps title={u.stepsTitle} steps={steps} />

      {u.specs && (
        <OAPanel id="specs" title={u.specs.title} sub={u.specs.sub}>
          <dl className="divide-y divide-white/[0.08] overflow-hidden rounded-[20px] bg-white/[0.05] ring-1 ring-white/[0.08]">
            {u.specs.rows.map((r) => (
              <div key={r.label} className="grid gap-1 px-5 py-4 sm:grid-cols-[1fr_1.4fr] sm:gap-6">
                <dt className="text-[15px] font-bold">{r.label}</dt>
                <dd className="text-[15px] text-[#CACACA]">{r.value}</dd>
              </div>
            ))}
          </dl>
        </OAPanel>
      )}

      <OAFaq items={faqs} />
      <OABlog posts={postsFor(u.blogTopic)} all={a("Blog", "/blog", "live")} link={(p) => a(p.title, p.href, "live")} />
      {chips.length > 0 && <OAChips title={u.kind === "template" ? "More ad templates and tools" : "Related use cases and tools"} chips={chips} />}
      <OACta
        title={u.ctaTitle}
        sub={`New accounts get ${SIGNUP_CREDITS} free credits for Seedream images and Seed Audio voiceovers; video models are on the Starter, Pro and Ultra plans.`}
        cta={{ label: "Get started for free", link: toTool(u.toolName) }}
      />

      {/* 2026-11-25 Monica:「落地页都不要放这个」—— 页面底部不再显示数据来源说明;外部来源仍留在结构化数据里 */}
      <div className="pb-14" />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": u.hub ? "CollectionPage" : "WebPage",
              name: u.h1,
              description: u.lead,
              url: `https://buzzvideo.ai/${u.slug}`,
              dateModified: CONTENT_UPDATED,
              publisher: { "@type": "Organization", name: "BuzzVideo AI", url: "https://buzzvideo.ai" },
            },
            ...(u.recipes.length
              ? [
                  {
                    "@context": "https://schema.org",
                    "@type": "ItemList",
                    name: u.recipesTitle,
                    itemListElement: u.recipes.map((r, i) => ({ "@type": "ListItem", position: i + 1, item: { "@type": "CreativeWork", name: r.name, text: r.prompt } })),
                  },
                ]
              : []),
            { "@context": "https://schema.org", "@type": "HowTo", name: u.stepsTitle, step: u.steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.title, text: s.body })) },
            { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((q) => ({ "@type": "Question", name: q.q, acceptedAnswer: { "@type": "Answer", text: q.a } })) },
            ...own
              .slice(0, 4)
              .map((p) => ({
                "@context": "https://schema.org",
                "@type": p.kind === "video" ? "VideoObject" : "ImageObject",
                name: p.alt,
                description: p.model ? `Made with ${p.model} on BuzzVideo.` : "Made on BuzzVideo.",
                contentUrl: p.src.startsWith("http") ? p.src : `https://buzzvideo.ai${p.src}`,
                ...(p.kind === "video" ? { thumbnailUrl: p.poster ? (p.poster.startsWith("http") ? p.poster : `https://buzzvideo.ai${p.poster}`) : undefined, uploadDate: "2026-11-23" } : {}),
                creator: { "@type": "Organization", name: "BuzzVideo AI" },
              })),
          ]),
        }}
      />
    </main>
  );
}

/* 模板总页：按类型 / 平台 / 节日分组列出全部模板页 */
function HubGrid({ u, a }: { u: UseCase; a: (label: string, href: string) => { href: string; onClick: (e: React.MouseEvent) => void } }) {
  if (!u.hub) return null;
  return (
    <section id="all-templates" className="scroll-mt-28 py-20 md:py-28">
      <div className={OA_WRAP}>
        <h2 className="font-bold leading-[1.2] tracking-[-0.01em] [text-wrap:balance] text-[clamp(28px,2.8vw,40px)]">{u.hub.title}</h2>
        <p className="mt-5 max-w-[60rem] text-[18px] leading-[28px] text-[#CACACA]">{u.hub.sub}</p>
        <div className="mt-12 space-y-14">
          {u.hub.groups.map((g) => (
            <div key={g.title}>
              <h3 className="text-[22px] font-extrabold">{g.title}</h3>
              <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {g.slugs
                  .map((s) => caseBySlug(s))
                  .filter((x): x is UseCase => !!x)
                  .map((x) => {
                    const p = picOf(x.hero[0]);
                    return (
                      <li key={x.slug}>
                        <a {...a(x.name, `/${x.slug}`)} className="group block h-full overflow-hidden rounded-[20px] bg-white/[0.05] ring-1 ring-white/[0.08] transition hover:-translate-y-1">
                          <div className="aspect-[4/5] overflow-hidden bg-[#111]">{p && <PicView p={p} className="transition duration-500 group-hover:scale-[1.04]" />}</div>
                          <div className="p-4">
                            <p className="text-[16px] font-bold">{x.name}</p>
                            <p className="mt-1 text-[13.5px] text-[#CACACA]">{x.recipes.length} copy-ready prompts</p>
                          </div>
                        </a>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
