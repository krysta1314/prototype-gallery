"use client";

/* 全部模型总页 /models(2026-11-19;2026-11-24 页头和卡片段换成线上 All Models 的版式，见 ../models/AllModels.tsx):MODELS 里每个模型按 视频 / 图片 / 音频 分组，各链到自己的落地页(Seedance 2.5 → /models/seedance)。
   卡片 = 真实成片封面(没有就不放图)+ 名字 + 厂商 + 后台官方描述 + 起价;下一版本上线的标 Next release。
   底部挂对比页和指南页，FAQ 只用 catalog / 定价里的事实。 */

import type { OnLink } from "../../site-nav/SiteNavHeader";
import { MODELS, EXTRA_MODELS, modelsOfType } from "../../site-nav/models-catalog";
import { AllModels } from "../models/AllModels";
import { modelHref } from "../models/model-content";
import { OAChips, OACta, OAFaq } from "../oa/kit";
import { SIGNUP_CREDITS } from "../tools/credits";
import { COMPARISONS, GUIDES } from "./content";
import { META } from "./meta";
import { faqLd, JsonLd, PUBLISHER, SourcesNote, useLinks } from "./parts";

export function ModelsHub({ onLink }: { onLink: OnLink }) {
  const { a } = useLinks(onLink);
  const n = MODELS.length + EXTRA_MODELS.length;
  const live = MODELS.filter((m) => m.release === "live");
  const next = MODELS.filter((m) => m.release !== "live");
  const lead = `BuzzVideo is an AI ad platform that runs ${n} video, image and audio models from ByteDance, Google, OpenAI, Kuaishou and other labs on one account and one set of credits. Browse every model by type below and open its page for specs, credit prices and real examples, or compare two side by side.`;

  const faq = [
    {
      q: "How many AI models does BuzzVideo have?",
      a: `BuzzVideo lists ${n} AI models: ${modelsOfType("video").length} video, ${modelsOfType("image").length} image and ${modelsOfType("audio").length} audio. ${next.length ? `${live.length} are live now and ${next.length} arrive with the next release.` : "All of them are live now."}`,
    },
    { q: "Which AI models can I use with free credits?", a: `New BuzzVideo accounts get ${SIGNUP_CREDITS} free credits. They work on Seedream 4.5 and Seedream 5.0 lite for images and Seed Audio 1.0 for audio; video models need the Starter, Pro or Ultra plan.` },
    { q: "Which AI video model should I use for ads?", a: "It depends on the ad. Seedance 2.5 is BuzzVideo's flagship for long, premium ads up to 30 seconds; Kling 4.0 makes continuous videos up to 30 seconds with sound; Wan 3.0 suits long single takes for demos. The comparison pages below go model by model." },
    { q: "Do I need a separate subscription for each model?", a: "No. Every model on this page runs on one BuzzVideo account and the same credits, and you see the credit price before you create." },
    { q: "Can I use these models in ChatGPT or Claude?", a: "Yes, for models that are live on BuzzVideo. Connect BuzzVideo MCP to ChatGPT or Claude and ask for a model by name; it uses your BuzzVideo credits." },
    { q: "What is the best AI video generator model for long clips?", a: "Seedance 2.5, Kling 4.0 and Wan 3.0 all make single clips up to 30 seconds on BuzzVideo. Seedance 2.5 takes the most references, Kling 4.0 costs less at 1080p and runs on Starter, and Wan 3.0 suits long single takes for demos." },
    { q: "Which video models generate sound?", a: "Seedance 2.5 and Kling 4.0 generate native audio with the picture, and MiniMax H3 adds native audio and lip sync. On Seedance 2.5 you can switch sound off; Kling 4.0 always generates a sound track." },
    { q: "Which plan do I need for video models?", a: "Starter, Pro or Ultra. Most video models start on Starter, while Seedance 2.5 and Seedance 2.0 need Pro or Ultra. Free credits cover only Seedream 4.5, Seedream 5.0 lite and Seed Audio 1.0." },
    { q: "Can I use what I make with these models commercially?", a: "Yes. Everything you generate on BuzzVideo, with any model, can be used commercially on every plan, including Free." },
    { q: "How do I know what a generation will cost?", a: "The credit price shows in the generator before you press Create, and it updates as you change length, resolution or quality. Each model's page also lists sample prices." },
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
