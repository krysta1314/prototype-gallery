"use client";

/* /canvas 落地页(2026-11-26 重做)。
   2026-11-25 先照 higgsfield.ai/canvas 做成产品式页头(节点拼贴 + All Canvases / Templates);
   2026-11-26 Monica:「大屏幕有问题」(2000px 宽时整块很小挤在中间，下面一大片空)+「做成落地页介绍 canvas，
   canvas 相关的 SEO/GEO 关键词，场景词，长尾词去做这个落地页，做完整落地页」。
   现在：节点拼贴保留做首屏画面，但按屏宽等比放大(canvas/visuals.tsx 的 NodeBoard);下面按全站落地页顺序：
   示例 → Key features → How to use → Best uses → 更多工具 / 模型 → FAQ → 博客 → 收尾 CTA。
   区块和 ToolTemplate 一样用 ../oa/kit;文案和素材清单在 canvas/content.ts(含关键词和竞品调研笔记)。 */

import { ArrowRight } from "lucide-react";
import { appOf, go, type OnLink } from "../../site-nav/SiteNavHeader";
import { statusOf } from "../../site-nav/nav-data";
import { modelHref } from "../models/model-content";
import { mediaOf } from "../models/model-media";
import { OA_CTA, OA_H2, OA_WRAP, OABlog, OACompare, OACta, OADrench, OAFaq, OAFeatureRows, OASteps, PicView, type OACard, type OARow } from "../oa/kit";
import { postsFor, type Pic } from "../oa/pool";
import { resolveHref, isRemoved } from "../redirects";
import { CONTENT_UPDATED } from "../content-date";
import { modelEntry, SIGNUP_CREDITS, toolBySlug } from "./tool-content";
import { WorkflowGallery } from "./canvas/WorkflowGallery";
import { CTA_SUB, FAQ, FEATURES, HERO, MODEL_CARDS, STEPS, USES, WAYS } from "./canvas/content";
import { FanOut, NodeBoard, StepAdd, StepConnectNodes, StepFinish, TeamBoard } from "./canvas/visuals";

/* 博客封面是视频库的 skill-*.jpg,和本页用到的同一批 MCP Skill 成片撞画面 —— 这几篇不放 */
const BLOG_SKIP = new Set(["ugc-product-review", "product-ad", "unboxing-ugc", "talking-product", "3d-product-video", "ad-hook-variants", "ad-variations", "ad-resizer"].map((k) => `/video-library/posters/skill-${k}.jpg`));
const pic = (x: { kind?: "image" | "video"; src: string; poster?: string; alt: string }, aspect = "16:9"): Pic => ({ kind: x.kind ?? (x.src.endsWith(".mp4") ? "video" : "image"), src: x.src, poster: x.poster, aspect, alt: x.alt, prompt: "", source: "" });

export function CanvasLanding({ onLink }: { onLink: OnLink }) {
  const a = (label: string, rawHref: string) => {
    const href = resolveHref(rawHref);
    return {
      href,
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        go(href, statusOf(href), label, onLink);
      },
    };
  };
  /* 落地页按钮带人进产品里的 Canvas(照 Higgsfield);产品页还没接上时给 toast */
  const enter = (label: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const app = appOf("/canvas");
    if (app && !app.startsWith("/prototypes/site")) window.location.href = app;
    else go("/", statusOf("/"), label, onLink);
  };
  const toCanvas = (label: string) => ({ href: "/canvas", onClick: enter(label) });

  const rows: OARow[] = [
    {
      key: "what",
      title: FEATURES.what.title,
      body: FEATURES.what.body,
      media: <div className="aspect-video"><PicView p={pic(FEATURES.what.media)} /></div>,
      cta: { label: "Open Canvas", link: toCanvas("Open Canvas") },
    },
    {
      key: "reference",
      title: FEATURES.reference.title,
      body: FEATURES.reference.body,
      media: <FanOut from={FEATURES.reference.media.from} outs={FEATURES.reference.media.outs} fromLabel="Product" outLabel="Scene" />,
      cta: { label: "Try it now", link: toCanvas("Try it now") },
    },
    {
      key: "character",
      title: FEATURES.character.title,
      body: FEATURES.character.body,
      media: <FanOut from={FEATURES.character.media.from} outs={FEATURES.character.media.outs} fromLabel="Character" outLabel="Shot" />,
      cta: { label: "Try it now", link: toCanvas("Try it now") },
    },
    {
      key: "tools",
      title: FEATURES.tools.title,
      body: FEATURES.tools.body,
      media: <div className="aspect-video"><OACompare before={FEATURES.tools.before} after={FEATURES.tools.after} beforeLabel="Image node" afterLabel="Lip Sync" /></div>,
      cta: { label: "Try it now", link: toCanvas("Try it now") },
    },
    {
      key: "team",
      title: FEATURES.team.title,
      body: FEATURES.team.body,
      media: <TeamBoard imgs={FEATURES.team.media} />,
      cta: { label: "Start a team canvas", link: toCanvas("Start a team canvas") },
    },
  ];

  const uses: OARow[] = USES.map((u) => ({
    key: u.key,
    title: u.title,
    body: u.body,
    media: (
      <div className="aspect-video">
        {"pair" in u ? (
          <OACompare before={pic(u.pair.before, "4:3")} after={pic(u.pair.after, "4:3")} beforeLabel={u.pair.beforeLabel} afterLabel={u.pair.afterLabel} />
        ) : "video" in u ? (
          <PicView p={pic(u.video)} />
        ) : (
          <PicView p={pic(u.image)} />
        )}
      </div>
    ),
    cta: { label: "Try it on Canvas", link: toCanvas(u.title) },
  }));

  const ways: OACard[] = WAYS.flatMap((w) => {
    const t = toolBySlug(w.slug);
    if (!t || isRemoved(`/${w.slug}`)) return [];
    return [{ key: w.slug, title: t.name, desc: w.desc, pic: pic(w.pic, "4:5"), link: a(t.name, `/${w.slug}`) }];
  });
  const modelCards: OACard[] = MODEL_CARDS.flatMap(({ slug, pick }) => {
    const m = modelEntry(slug);
    const s = mediaOf(slug).filter((x) => x.kind !== "audio")[pick];
    if (!m || !s) return [];
    return [{ key: slug, title: m.name, tag: m.vendor, desc: m.desc, pic: { ...s, model: m.name }, link: a(m.name, modelHref(slug)) }];
  });

  const steps = [
    { ...STEPS[0], visual: <StepAdd /> },
    { ...STEPS[1], visual: <StepConnectNodes /> },
    { ...STEPS[2], visual: <StepFinish /> },
  ];

  return (
    <main className="bg-black text-white">
      {/* ── 首屏：H1 + 一句话 + CTA,下面是铺满屏宽的节点画板 ── */}
      <section className="relative isolate overflow-hidden pb-14 pt-[96px] md:pb-20 md:pt-[104px]">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-[0.22] [background-image:radial-gradient(rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_45%,black,transparent)]" />
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-[-260px] -z-10 h-[560px] w-[min(1100px,90vw)] -translate-x-1/2 rounded-full bg-[#FF744D]/[0.16] blur-[120px]" />
        <div className={`${OA_WRAP} text-center`}>
          {/* 2026-11-27 Monica 划掉「BuzzVideo Canvas」小标签 */}
          <h1 className="mx-auto max-w-[min(1320px,94vw)] font-black uppercase leading-[0.92] tracking-[-0.035em] [text-wrap:balance] text-[clamp(44px,calc(24px+4.6vw),112px)]">
            <span className="block">{HERO.h1}</span>
            <span className="mt-2 block text-[clamp(24px,calc(12px+2.4vw),60px)] leading-[1] tracking-[-0.02em] text-[#FF744D]">{HERO.accent}</span>
          </h1>
          {/* 2026-11-27 Monica「两行」:桌面上说明放宽到两行 */}
          <p className="mx-auto mt-6 max-w-[680px] text-[15px] leading-[24px] text-white/75 [text-wrap:balance] md:max-w-[1080px] md:text-[16px] md:leading-[26px]">{HERO.lead}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a {...toCanvas("Start a canvas")} className={`${OA_CTA} px-6 py-3.5`}>
              Start a canvas free <ArrowRight className="size-4" />
            </a>
            <a href="#examples" className="inline-flex items-center gap-2 rounded-xl bg-white/[0.08] px-5 py-3 text-[15px] font-bold text-white ring-1 ring-white/20 transition hover:bg-white/15">
              See workflows
            </a>
          </div>
          <p className="mt-3 text-[12.5px] text-white/50">{SIGNUP_CREDITS} free credits when you sign up · runs online in your browser</p>
        </div>
        <div className="mx-auto mt-12 w-[min(1680px,calc(100vw-32px))] md:mt-14 md:w-[min(1680px,calc(100vw-96px))]">
          <NodeBoard />
        </div>
      </section>

      {/* ── 示例(ai canvas examples)── */}
      <section id="examples" className="scroll-mt-28 py-20 md:py-28">
        <div className={OA_WRAP}>
          {/* 2026-11-27 Monica「这里应该是 workflow，点击展示 workflow 弹窗，点击 use 有个 toast 提示说是去画布」:换成产品里真实的 Workflow 模板(后台 workflow-templates) */}
          <h2 className={OA_H2}>AI canvas workflows you can start from</h2>
          <p className="mt-5 max-w-[60rem] text-[18px] leading-[28px] text-[#CACACA]">
            Every workflow below is a ready-made template on BuzzVideo Canvas. Open one to see the nodes behind it, from reference images to the finished ad, then use it and swap in your own product.
          </p>
          <div className="mt-10">
            <WorkflowGallery onUse={(t) => { const app = appOf("/canvas"); if (app && !app.startsWith("/prototypes/site")) window.location.href = app; else go("/", statusOf("/"), t, onLink); }} />
          </div>
        </div>
      </section>

      <OAFeatureRows id="features" title={FEATURES.title} sub={FEATURES.sub} rows={rows} />
      <OASteps title="How to use the AI Canvas" steps={steps} />
      <OAFeatureRows id="uses" tone="light" title="Best uses for an AI canvas" sub="Node-based AI workflows built for marketers, ecommerce brands and agencies." rows={uses} />

      <OADrench
        ways={{ title: "More ways to create on Canvas", cards: ways }}
        models={
          modelCards.length
            ? {
                title: "Top AI models on BuzzVideo Canvas",
                sub: "Pick the model on each node: Seedance 2.5 and Kling 4.0 for video, Nano Banana 2.1 for images and Seed Audio 1.0 for voiceover, music and sound effects. You see the credit cost before you generate.",
                cards: modelCards,
              }
            : undefined
        }
      />

      <OAFaq items={FAQ} />
      <OABlog posts={postsFor("ads", 3, BLOG_SKIP)} all={a("Blog", "/blog")} link={(p) => a(p.title, p.href)} />
      <OACta title="Build your next ad on one AI canvas" sub={CTA_SUB} cta={{ label: "Start a canvas free", link: toCanvas("Start a canvas free") }} />
      <div className="pb-14" />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "BuzzVideo AI Canvas",
              applicationCategory: "MultimediaApplication",
              operatingSystem: "Web",
              description: HERO.lead,
              dateModified: CONTENT_UPDATED,
              publisher: { "@type": "Organization", name: "BuzzVideo AI", url: "https://buzzvideo.ai" },
            },
            { "@context": "https://schema.org", "@type": "HowTo", name: "How to use the AI Canvas on BuzzVideo", step: STEPS.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.title, text: s.body })) },
            { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((q) => ({ "@type": "Question", name: q.q, acceptedAnswer: { "@type": "Answer", text: q.a } })) },
            {
              "@context": "https://schema.org",
              "@type": "VideoObject",
              name: FEATURES.what.media.alt,
              description: "A walkthrough of BuzzVideo's AI Canvas: prompt, reference and video nodes connected on one board.",
              contentUrl: `https://buzzvideo.ai${FEATURES.what.media.src}`,
              thumbnailUrl: `https://buzzvideo.ai${FEATURES.what.media.poster}`,
              uploadDate: "2026-11-25",
            },
          ]),
        }}
      />
    </main>
  );
}
