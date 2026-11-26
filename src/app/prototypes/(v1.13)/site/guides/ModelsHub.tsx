"use client";

/* 全部模型总页 /models(2026-11-19;2026-11-24 页头和卡片段换成线上 All Models 的版式，见 ../models/AllModels.tsx):MODELS 里每个模型按 视频 / 图片 / 音频 分组，各链到自己的落地页(Seedance 2.5 → /models/seedance)。
   卡片 = 真实成片封面(没有就不放图)+ 名字 + 厂商 + 后台官方描述 + 起价;下一版本上线的标 Next release。
   底部挂对比页和指南页，FAQ 只用 catalog / 定价里的事实。 */

import type { OnLink } from "../../site-nav/SiteNavHeader";
import { MODELS, EXTRA_MODELS, allModelsOfType } from "../../site-nav/models-catalog";
import { AllModels } from "../models/AllModels";
import { modelHref } from "../models/model-content";
import { OAChips, OACta, OAFaq } from "../oa/kit";
import { SIGNUP_CREDITS } from "../tools/credits";
import { COMPARISONS, GUIDES } from "./content";
import { META } from "./meta";
import { faqLd, JsonLd, PUBLISHER, SourcesNote, useLinks } from "./parts";
import { CONTENT_UPDATED } from "../content-date";

export function ModelsHub({ onLink }: { onLink: OnLink }) {
  const { a } = useLinks(onLink);
  const n = MODELS.length + EXTRA_MODELS.length;
  const live = MODELS.filter((m) => m.release === "live");
  const next = MODELS.filter((m) => m.release !== "live");
  const lead = `BuzzVideo is an AI ad platform that runs ${n} video, image and audio models from ByteDance, Google, OpenAI, Kuaishou and other labs on one account and one set of credits. Browse every model by type below and open its page for specs, credit prices and real examples, or compare two side by side.`;

  const faq = [
    {
      q: "How many AI models does BuzzVideo have?",
      /* 2026-11-26 SEO/GEO 审核：分项原来只数有落地页的模型(加起来 51),和总数 n(含只在本页展示的)对不上;分项改成和总数同口径 */
      a: `BuzzVideo lists ${n} AI models: ${allModelsOfType("video").length} video, ${allModelsOfType("image").length} image and ${allModelsOfType("audio").length} audio. ${next.length ? `${live.length} are live now and ${next.length} arrive with the next release.` : "All of them are live now."}`,
    },
    { q: "Is the AI video generator on BuzzVideo free?", a: `Video models need a paid plan: Starter, Pro or Ultra. Signing up is free, and new BuzzVideo accounts get ${SIGNUP_CREDITS} free credits that work on Seedream 4.5 and Seedream 5.0 lite for images and Seed Audio 1.0 for audio.` },
    { q: "Can I use an AI video generator without signing up?", a: "No. You need a BuzzVideo account to generate with any model on this page, and signing up is free. One account covers every video, image and audio model." },
    { q: "Which AI video model should I use for ads?", a: "It depends on the ad. Seedance 2.5 is BuzzVideo's flagship for long, premium ads up to 30 seconds; Kling 4.0 makes continuous videos up to 30 seconds with sound; Wan 3.0 suits long single takes for demos. The comparison pages below go model by model." },
    { q: "Do I need a separate subscription for each model?", a: "No. Every model on this page runs on one BuzzVideo account and the same credits, and you see the credit price before you create." },
    { q: "Can I use these models in ChatGPT or Claude?", a: "Yes. Connect BuzzVideo MCP to ChatGPT or Claude and ask for a model by name. It runs on your BuzzVideo credits, and each model needs the same plan as in the web app." },
    { q: "What is the best AI video generator model for long clips?", a: "Seedance 2.5, Kling 4.0 and Wan 3.0 all make single clips up to 30 seconds on BuzzVideo. Seedance 2.5 takes the most references, Kling 4.0 costs less at 1080p and runs on Starter, and Wan 3.0 suits long single takes for demos." },
    { q: "Which AI video generators make video with sound?", a: "Every video model with its own page here generates native audio with the picture, including Seedance 2.5, Kling 4.0, Wan 3.0 and MiniMax H3. On Seedance 2.5, Seedance 2.0, Kling 3.0 and Wan 3.0 you can switch the sound off; Kling 4.0 and MiniMax H3 always generate a sound track." },
    { q: "Which plan do I need for video models?", a: "You need Starter, Pro or Ultra. Most video models start on Starter, while Seedance 2.5 and Seedance 2.0 need Pro or Ultra. Free credits cover only Seedream 4.5, Seedream 5.0 lite and Seed Audio 1.0." },
    { q: "Can I use what I make with these models commercially?", a: "Yes. Everything you generate on BuzzVideo, with any model, can be used commercially on every plan, including Free." },
    { q: "How much does it cost to use an AI model on BuzzVideo?", a: "Each generation costs credits, and the price depends on the model and settings. The credit price shows in the generator before you press Create, and it updates as you change length, resolution or quality. Each model's page also lists sample prices." },
  ];

  return (
    <main className="bg-[#0d0c10] text-white">
      {/* 页头和卡片段照线上 All Models 页(2026-11-24),放全部模型 */}
      <AllModels a={a} />

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
            dateModified: CONTENT_UPDATED,
            publisher: PUBLISHER,
            mainEntity: { "@type": "ItemList", numberOfItems: n, itemListElement: MODELS.map((m, i) => ({ "@type": "ListItem", position: i + 1, name: m.name, url: `https://buzzvideo.ai${modelHref(m.slug)}` })) },
          },
          faqLd(faq),
        ]}
      />
    </main>
  );
}
