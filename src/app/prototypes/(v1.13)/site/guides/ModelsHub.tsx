"use client";

/* 全部模型总页 /models(2026-11-19):MODELS 里每个模型按 视频 / 图片 / 音频 分组，各链到自己的落地页(Seedance 2.5 → /models/seedance)。
   卡片 = 真实成片封面(没有就不放图)+ 名字 + 厂商 + 后台官方描述 + 起价;下一版本上线的标 Next release。
   底部挂对比页和指南页，FAQ 只用 catalog / 定价里的事实。 */

import { ArrowRight } from "lucide-react";
import type { OnLink } from "../../site-nav/SiteNavHeader";
import { MODELS, modelsOfType, TYPE_TITLE, type ModelType } from "../../site-nav/models-catalog";
import { modelHref, modelPageData } from "../models/model-content";
import { mediaOf } from "../models/model-media";
import { OA_CTA, OA_H2, OA_WRAP, OAChips, OACta, OAFaq } from "../oa/kit";
import { SIGNUP_CREDITS } from "../tools/credits";
import { COMPARISONS, GUIDES } from "./content";
import { META } from "./meta";
import { faqLd, GHOST_BTN, GuideHero, JsonLd, PUBLISHER, SourcesNote, useLinks } from "./parts";

const TYPES: ModelType[] = ["video", "image", "audio"];
const HUB: Record<ModelType, string> = { video: "/ai-video-models", image: "/ai-image-models", audio: "/ai-audio-models" };
const Q: Record<ModelType, string> = { video: "Which AI video models are on BuzzVideo?", image: "Which AI image models are on BuzzVideo?", audio: "Which AI audio models are on BuzzVideo?" };

const vendorsOf = (t?: ModelType) => [...new Set((t ? modelsOfType(t) : MODELS).map((m) => m.vendor))];
const andList = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);

export function ModelsHub({ onLink }: { onLink: OnLink }) {
  const { a } = useLinks(onLink);
  const n = MODELS.length;
  const live = MODELS.filter((m) => m.release === "live");
  const next = MODELS.filter((m) => m.release !== "live");
  const lead = `BuzzVideo is an AI ad platform that runs ${n} video, image and audio models from ByteDance, Google, OpenAI, Kuaishou and other labs on one account and one set of credits. Browse every model by type below and open its page for specs, credit prices and real examples, or compare two side by side.`;

  const faq = [
    {
      q: "How many AI models does BuzzVideo have?",
      a: `BuzzVideo lists ${n} AI models: ${modelsOfType("video").length} video, ${modelsOfType("image").length} image and ${modelsOfType("audio").length} audio. ${live.length} are live now and ${next.length} arrive with the next release.`,
    },
    { q: "Which AI models can I use with free credits?", a: `New BuzzVideo accounts get ${SIGNUP_CREDITS} free credits. They work on Seedream 4.5 and Seedream 5.0 lite for images and Seed Audio 1.0 for audio; video models need the Starter, Pro or Ultra plan.` },
    { q: "Which AI video model should I use for ads?", a: "It depends on the ad. Seedance 2.5 is BuzzVideo's flagship for long, premium ads up to 30 seconds; Kling 4.0 makes continuous videos up to 30 seconds with sound; Wan 3.0 suits long single takes for demos. The comparison pages below go model by model." },
    { q: "Do I need a separate subscription for each model?", a: "No. Every model on this page runs on one BuzzVideo account and the same credits, and you see the credit price before you create." },
    { q: "Can I use these models in ChatGPT or Claude?", a: "Yes, for models that are live on BuzzVideo. Connect BuzzVideo MCP to ChatGPT or Claude and ask for a model by name; it uses your BuzzVideo credits." },
  ];

  const card = (slug: string) => {
    const m = MODELS.find((x) => x.slug === slug)!;
    const d = modelPageData(slug);
    const s = mediaOf(slug).find((x) => x.kind !== "audio");
    const img = s ? (s.kind === "video" ? s.poster : s.src) : undefined;
    const price = m.release !== "live" ? "Next release" : slug === "seed-audio-1-0" ? "0.5 credits / s" : d?.fromCredits !== undefined ? `From ${d.fromCredits} credits` : undefined;
    return (
      <li key={slug}>
        <a {...a(m.name, modelHref(slug))} className="group flex h-full flex-col overflow-hidden rounded-[20px] bg-white/[0.04] ring-1 ring-white/[0.08] transition hover:-translate-y-0.5 hover:bg-white/[0.07]">
          {img && (
            <div className="aspect-[16/10] overflow-hidden bg-[#111]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt={s!.alt} loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-[1.03]" />
            </div>
          )}
          <div className="flex flex-1 flex-col p-5">
            <p className="flex items-center justify-between gap-3 text-[12.5px] font-semibold text-[#9F9F9F]">
              <span>{m.vendor}</span>
              {m.release !== "live" ? <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-bold text-[#E8E8E8]">Next release</span> : m.badge && <span className="rounded-full bg-[#FF744D]/20 px-2 py-0.5 text-[11px] font-bold text-[#FFF3EC]">{m.badge}</span>}
            </p>
            <h3 className="mt-2 text-[19px] font-extrabold leading-snug">{m.name}</h3>
            <p className="mt-1.5 text-[14.5px] leading-relaxed text-[#CACACA]">{m.desc}</p>
            <p className="mt-auto flex items-center justify-between pt-4 text-[13px] font-semibold text-white">
              <span className="tabular-nums text-[#CACACA]">{price}</span>
              <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
            </p>
          </div>
        </a>
      </li>
    );
  };

  return (
    <main className="bg-black text-white">
      <GuideHero
        title="All AI models on BuzzVideo"
        lead={lead}
        actions={TYPES.map((t, i) => (
          <a key={t} href={`#${t}`} className={i === 0 ? `${OA_CTA} px-6 py-3.5` : GHOST_BTN}>
            {TYPE_TITLE[t]} ({modelsOfType(t).length})
          </a>
        ))}
      />

      {TYPES.map((t) => (
        <section key={t} id={t} className="scroll-mt-28 py-16 md:py-20">
          <div className={OA_WRAP}>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className={OA_H2}>{Q[t]}</h2>
                <p className="mt-4 max-w-[46rem] text-[17px] leading-[28px] text-[#CACACA]">
                  {modelsOfType(t).length} {t} models from {andList(vendorsOf(t))}, on the same BuzzVideo credits.
                </p>
              </div>
              <a {...a(`All ${t} models`, HUB[t])} className={GHOST_BTN}>
                Compare {t} models <ArrowRight className="size-4" />
              </a>
            </div>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{modelsOfType(t).map((m) => card(m.slug))}</ul>
          </div>
        </section>
      ))}

      <OAChips title="Compare AI models" chips={COMPARISONS.map((c) => ({ label: c.h1, link: a(c.h1, `/${c.slug}`) }))} />
      <OAChips title="Model guides" chips={GUIDES.map((g) => ({ label: g.h1, link: a(g.h1, `/${g.slug}`) }))} />
      <OAFaq items={faq} />
      <OACta title="Every leading AI model, one account" sub="Make video, image and audio ads on BuzzVideo. You see the credit price before you create." cta={{ label: "Get started for free", link: a("Get started", "/") }} />
      <SourcesNote />
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: META.models.title,
            description: lead,
            dateModified: "2026-11-19",
            publisher: PUBLISHER,
            mainEntity: { "@type": "ItemList", numberOfItems: n, itemListElement: MODELS.map((m, i) => ({ "@type": "ListItem", position: i + 1, name: m.name, url: `https://buzzvideo.ai${modelHref(m.slug)}` })) },
          },
          faqLd(faq),
        ]}
      />
    </main>
  );
}
