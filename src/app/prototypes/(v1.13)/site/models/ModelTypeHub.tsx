"use client";

/* 按模态的模型总页 /models/video、/models/image、/models/audio(2026-11-18)。
   线上 /models 已有(总页，复用);这三页是新增的分类页(VEED / invideo 的做法),吃「ai video models」「ai image models」「ai voice models」这类词。
   每个模型一行：名字(链到模型页)、厂商、官方描述、起价;上新的标 New。 */

import { ArrowRight } from "lucide-react";
import { MODELS, modelsOfType, TYPE_TITLE, type ModelType } from "../../site-nav/models-catalog";
import { go, type OnLink } from "../../site-nav/SiteNavHeader";
import { statusOf } from "../../site-nav/nav-data";
import { modelHref, modelPageData } from "./model-content";

const INTRO: Record<ModelType, { h1: string; p: string }> = {
  video: { h1: "AI video models", p: "Every leading AI video model in one place: Seedance, Kling, Wan, MiniMax, Gemini Omni and more. Compare length, quality and price, then generate with the one that fits the ad." },
  image: { h1: "AI image models", p: "GPT Image, Nano Banana, Seedream, FLUX and more, side by side. Pick by text accuracy, detail or price per image." },
  audio: { h1: "AI audio models", p: "Seed Audio 1.0 is live today. Voiceover, voice cloning, music and sound effects models from ElevenLabs, MiniMax, Google, Kuaishou and Mureka arrive with the next release, on the same credits." },
};

export function ModelTypeHub({ type, onLink }: { type: ModelType; onLink: OnLink }) {
  const list = modelsOfType(type);
  const a = (label: string, href: string) => ({
    href,
    onClick: (e: React.MouseEvent) => {
      e.preventDefault();
      go(href, statusOf(href), label, onLink);
    },
  });
  return (
    <main className="bg-black px-4 pb-20 pt-14 text-white sm:px-6">
      <div className="mx-auto max-w-[1120px]">
        <h1 className="mt-5 text-[clamp(40px,6.4vw,84px)] font-extrabold uppercase leading-[0.95] tracking-[-0.02em]">{INTRO[type].h1}</h1>
        <p className="mt-5 max-w-[42rem] text-[18px] leading-relaxed text-[#CACACA]">{INTRO[type].p}</p>
        <div className="mt-8 flex flex-wrap gap-2">
          {(["video", "image", "audio"] as ModelType[]).map((t) => (
            <a
              key={t}
              {...a(TYPE_TITLE[t], `/ai-${t}-models`)}
              aria-current={t === type ? "page" : undefined}
              className={`inline-flex h-9 items-center rounded-full px-4 text-[14px] font-bold transition ${t === type ? "bg-white text-[#240A03]" : "bg-white/[0.07] text-white hover:bg-white/[0.12]"}`}
            >
              {TYPE_TITLE[t]} <span className="ml-1.5 text-[12px] opacity-70">{modelsOfType(t).length}</span>
            </a>
          ))}
        </div>

        <h2 className="mt-14 text-[24px] font-extrabold tracking-[-0.02em]">Compare {TYPE_TITLE[type].toLowerCase()} by {type === "video" ? "length, resolution" : type === "image" ? "quality" : "use"} and price</h2>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-[15px] md:min-w-[720px]">
            <thead>
              <tr className="border-b-2 border-white/80 text-[14px]">
                <th scope="col" className="py-3 pr-4 font-bold">
                  Model
                </th>
                <th scope="col" className="hidden px-4 py-3 font-bold sm:table-cell">
                  Developer
                </th>
                <th scope="col" className="hidden px-4 py-3 font-bold md:table-cell">
                  Best for
                </th>
                <th scope="col" className="py-3 pl-4 text-right font-bold">
                  From
                </th>
              </tr>
            </thead>
            <tbody>
              {list.map((m) => {
                const d = modelPageData(m.slug);
                return (
                  <tr key={m.slug} className="group border-b border-white/10">
                    <th scope="row" className="py-4 pr-4">
                      <a {...a(m.name, modelHref(m.slug))} className="inline-flex items-center gap-2 text-[16px] font-bold underline decoration-[#CACACA] decoration-2 underline-offset-4 hover:decoration-[#FF744D]">
                        {m.name}
                      </a>
                    </th>
                    <td className="hidden px-4 py-4 sm:table-cell">{m.vendor}</td>
                    <td className="hidden px-4 py-4 text-[#9F9F9F] md:table-cell">{m.desc}</td>
                    <td className="py-4 pl-4 text-right tabular-nums">{d?.fromCredits ? `${d.fromCredits} credits` : m.release === "v1.13" ? "At launch" : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <a {...a(`All ${MODELS.length} AI models`, "/models")} className="mt-8 inline-flex items-center gap-1 text-[15px] font-bold underline decoration-[#FF744D] decoration-2 underline-offset-[5px] hover:text-[#FF5255]">
          All {MODELS.length} AI models <ArrowRight className="size-4" />
        </a>
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
                { "@type": "ListItem", position: 2, name: "AI Models", item: "https://buzzvideo.ai/models" },
                { "@type": "ListItem", position: 3, name: TYPE_TITLE[type], item: `https://buzzvideo.ai/ai-${type}-models` },
              ],
            },
            {
              "@context": "https://schema.org",
              "@type": "ItemList",
              name: INTRO[type].h1,
              itemListElement: list.map((m, i) => ({ "@type": "ListItem", position: i + 1, name: m.name, url: `https://buzzvideo.ai${modelHref(m.slug)}` })),
            },
          ]),
        }}
      />
    </main>
  );
}
