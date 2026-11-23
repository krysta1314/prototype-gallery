"use client";

/* 模型对比模板(2026-11-19):首屏(大标题 + 两句话 + 一对大成片，没有成片时放规格表)→ 短答案 → 规格对照表
   → 同档位积分对照 → 浅底「做什么广告选哪个」→ 两边真实成片(同提示词成对的放一起)→ FAQ → 相关页 → 收尾。
   规格只读 model-facts / catalog,价格只读 model-content;竞品(Suno / ElevenLabs)只写官网公开页核实过的事实，带来源和核实日期。 */

import type { OnLink } from "../../site-nav/SiteNavHeader";
import { modelHref } from "../models/model-content";
import { OA_CTA, OAChips, OACta, OAFaq, OAPanel } from "../oa/kit";
import type { ComparisonEntry } from "./content";
import { AnswerCard, DataTable, ExampleCard, examplesOf, faqLd, GHOST_BTN, GuideHero, JsonLd, MediaPair, mediaLd, modelOf, PicksSection, priceRowsOf, PUBLISHER, SourcesNote, SpecTable, useLinks, type Ex } from "./parts";

export function ComparisonTemplate({ c, onLink }: { c: ComparisonEntry; onLink: OnLink }) {
  const { a, open, tryLink } = useLinks(onLink);
  const models = c.models.map(modelOf).filter((m): m is NonNullable<typeof m> => !!m);
  const first = models[0];
  const onTry = (x: Ex) => open(x.modelSlug, `Try ${x.model}`, x.prompt);

  /* 成片：每个模型取有提示词的优先;同提示词成对的(Sunburst / Flare)按 alt 配对 */
  const exBy = models.map((m) => {
    const xs = examplesOf(m.slug).filter((x) => x.kind !== "audio");
    return { m, xs: [...xs.filter((x) => x.prompt), ...xs.filter((x) => !x.prompt)] };
  });
  const pairs = c.pairs
    ? (() => {
        const [l, r] = c.pairs.map((s) => examplesOf(s));
        return l.map((x) => [x, r.find((y) => y.alt === x.alt)] as const).filter((p): p is readonly [Ex, Ex] => !!p[1]);
      })()
    : [];
  const withMedia = exBy.filter((x) => x.xs.length);
  const heroItems = pairs.length
    ? [{ pic: pairs[0][0], label: pairs[0][0].model, sub: "Same prompt" }, { pic: pairs[0][1], label: pairs[0][1].model, sub: "Same prompt" }]
    : withMedia.length >= 2
      ? withMedia.slice(0, 2).map((x) => ({ pic: x.xs[0], label: x.m.name, sub: x.xs[0].alt }))
      : [];

  const prices = models.some((m) => m.release === "live") ? priceRowsOf(models.filter((m) => m.release === "live").map((m) => m.slug)) : [];
  const liveCols = models.filter((m) => m.release === "live");
  const allExamples = exBy.flatMap((x) => x.xs);
  const primary = models.find((m) => m.release === "live") ?? first;
  const tryP = tryLink(primary.slug, `Try ${primary.name}`);
  const ext = c.external;

  return (
    <main className="bg-black text-white">
      <GuideHero
        title={c.h1}
        lead={c.lead}
        actions={
          <>
            <a href="#specs" className={`${OA_CTA} px-6 py-3.5`}>
              Compare specs
            </a>
            <a href="#picks" className={GHOST_BTN}>
              Which to pick
            </a>
          </>
        }
      >
        {heroItems.length ? (
          <MediaPair items={heroItems} />
        ) : (
          <div id="specs" className="scroll-mt-28">
            <SpecTable slugs={c.models} external={ext} extraRows={c.extraRows} a={a} />
          </div>
        )}
      </GuideHero>

      <AnswerCard q={`${c.h1}: which should you use?`} a={c.verdict} />

      {heroItems.length > 0 && (
        <OAPanel id="specs" title={`How do ${c.h1.replace(" vs ", " and ")} compare on specs?`} sub="Every number comes from BuzzVideo's model settings for these models.">
          <SpecTable slugs={c.models} external={ext} extraRows={c.extraRows} a={a} />
        </OAPanel>
      )}

      {prices.length > 0 && liveCols.length > 1 && (
        <OAPanel id="prices" title="How much does each model cost on BuzzVideo?" sub="Credits per generation at the same setting. A dash means that price is not listed here; the generator shows every price before you create.">
          <DataTable
            firstColLabel="Setting"
            head={liveCols.map((m) => (
              <a key={m.slug} {...a(m.name, modelHref(m.slug))} className="underline decoration-white/30 underline-offset-4 hover:decoration-[#FF744D]">
                {m.name}
              </a>
            ))}
            rows={prices.map((r) => ({ label: r.label, cells: r.cells.map((x) => (x !== undefined ? x.toLocaleString("en-US") : "—")) }))}
          />
        </OAPanel>
      )}

      <PicksSection title="Which model should you pick for each ad?" sub="Match the model to the job. Each reason comes from the specs and prices on this page." picks={c.picks} a={a} />

      {pairs.length > 0 && (
        <OAPanel id="examples" title="Same prompt, both models" sub="Each pair was generated on BuzzVideo from one prompt, run once on each model with no edits.">
          <div className="space-y-12">
            {pairs.map(([l, r]) => (
              <MediaPair key={l.src} items={[{ pic: l, label: l.model, sub: l.alt }, { pic: r, label: r.model, sub: r.alt }]} />
            ))}
          </div>
        </OAPanel>
      )}
      {!pairs.length && allExamples.length > 0 && (
        <OAPanel id="examples" title={`Real results from ${withMedia.map((x) => x.m.name).join(" and ").replace(/ and (?=.* and )/g, ", ")}`} sub="Generated on BuzzVideo. Where we have the prompt, it is shown in full so you can run it on either model.">
          <div className="space-y-14">
            {withMedia.map(({ m, xs }) => (
              <div key={m.slug}>
                <h3 className="text-[22px] font-extrabold">{m.name}</h3>
                <div className="mt-5 space-y-5">
                  {xs.slice(0, withMedia.length > 2 ? 1 : 2).map((x) => (
                    <ExampleCard key={x.src} ex={x} onTry={onTry} openLink={tryLink(m.slug, `Try ${m.name}`)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </OAPanel>
      )}

      <OAFaq items={c.faq} />
      <OAChips title="Related guides and comparisons" chips={c.related.map((r) => ({ label: r.label, link: a(r.label, r.href) }))} />
      <OACta
        title={primary.release === "live" ? `Run the same prompt on ${liveCols.length > 1 ? "both" : primary.name}` : "Make your next ad on BuzzVideo"}
        sub="Video, image and audio models on one BuzzVideo account. You see the credit price before you create."
        cta={{ label: primary.release === "live" ? `Try ${primary.name}` : "Get started", link: tryP }}
      />
      <SourcesNote sources={c.sources} extra={ext || c.extraRows ? "Facts about products outside BuzzVideo come only from their public pages listed below." : undefined} />
      <JsonLd
        data={[
          { "@context": "https://schema.org", "@type": "Article", headline: c.h1, description: c.lead, dateModified: "2026-11-19", publisher: PUBLISHER, about: models.map((m) => ({ "@type": "SoftwareApplication", name: m.name, applicationCategory: "MultimediaApplication", creator: { "@type": "Organization", name: m.vendor } })), ...(c.sources?.length ? { citation: c.sources.map((s) => s.url) } : {}) },
          faqLd(c.faq),
          ...mediaLd(allExamples),
        ]}
      />
    </main>
  );
}
