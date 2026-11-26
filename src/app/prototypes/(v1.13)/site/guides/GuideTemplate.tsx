"use client";

/* 模型指南模板(2026-11-19):提示词指南 / 价格页 / 教程三种，同一套黑底 OpenArt 版式(../oa/kit)。
   首屏 = 大标题 + 两句话 + 按钮 + 一对大成片(价格页换成价格表)。
   提示词指南：提示词结构(按模型核实过的能力)→ 真实提示词 + 成片(复制 / 带提示词进生成器)→ 参数表 → 清单 → FAQ。
   价格页：价格矩阵(model-content 的积分表，不换算美元)→ 短答案 → 套餐 → 同档位对比 → 省积分 → 成片 → FAQ。
   教程：四步(带产品界面示意)→ 能做什么 → 参数表 → 价格 → 草稿示例 → FAQ。 */

import { ArrowUpRight, Check } from "lucide-react";
import type { OnLink } from "../../site-nav/SiteNavHeader";
import { MODELS } from "../../site-nav/models-catalog";
import { modelHref, modelPageData, type PriceRow } from "../models/model-content";
import { StepPickModel, StepPrompt, StepResult } from "../models/ModelVisuals";
import { KLING_4 } from "../../model-page/model-data";
import { OA_CTA, OA_H2, OA_WRAP, OAChips, OACta, OAFaq, OAFeatureRows, OAPanel, type OARow } from "../oa/kit";
import { SIGNUP_CREDITS } from "../tools/credits";
import type { GuideEntry } from "./content";
import { pageMedia } from "../page-media";
import { AnswerCard, DataTable, ExampleCard, examplesOf, faqLd, GHOST_BTN, GuideHero, HeroChip, JsonLd, MediaPair, mediaLd, modelOf, priceRowsOf, PUBLISHER, SourcesNote, SpecTable, useLinks, type Ex } from "./parts";
import { CONTENT_UPDATED } from "../content-date";

/* 视频价格：行 = 时长，列 = 分辨率 */
function PriceGrid({ prices, unit = "credits" }: { prices: PriceRow[]; unit?: string }) {
  const parsed = prices.map((p) => ({ ...p, m: p.label.match(/^(\d+) s · (.+)$/) }));
  if (parsed.every((p) => p.m)) {
    const durs = [...new Set(parsed.map((p) => Number(p.m![1])))].sort((a, b) => a - b);
    const res = [...new Set(parsed.map((p) => p.m![2]))];
    return (
      <DataTable
        firstColLabel="Clip length"
        head={res}
        rows={durs.map((d) => ({ label: `${d} seconds`, cells: res.map((r) => { const c = parsed.find((p) => Number(p.m![1]) === d && p.m![2] === r)?.credits; return c !== undefined ? `${c.toLocaleString("en-US")} ${unit}` : "—"; }) }))}
      />
    );
  }
  return <DataTable firstColLabel="Setting" head={["Credits"]} rows={prices.map((p) => ({ label: p.label, cells: [`${p.credits.toLocaleString("en-US")} ${unit}`] }))} />;
}

export function GuideTemplate({ g, onLink }: { g: GuideEntry; onLink: OnLink }) {
  const { a, open, tryLink } = useLinks(onLink);
  const m = modelOf(g.model)!;
  const d = modelPageData(g.model)!;
  /* 2026-11-25 本页专属素材(page-media.ts)排最前：指南页是该模型按本页写法真实跑出来的成片，价格页是该模型样片 */
  const ex: Ex[] = [...pageMedia(g.slug).map((x) => ({ ...x, model: x.model ?? m.name, modelSlug: x.modelSlug ?? m.slug, caption: x.alt })), ...examplesOf(g.model)];
  const withPrompt = ex.filter((x) => x.prompt);
  const ordered = [...withPrompt, ...ex.filter((x) => !x.prompt)];
  const href = modelHref(m.slug);
  const onTry = (x: Ex) => open(x.modelSlug, `Try ${x.model}`, x.prompt);
  const tryM = tryLink(m.slug, `Try ${m.name}`);

  const min = d.prices.length ? d.prices.reduce((x, y) => (y.credits < x.credits ? y : x)) : undefined;
  const max = d.prices.length ? d.prices.reduce((x, y) => (y.credits > x.credits ? y : x)) : undefined;
  const tier = (l: string) => {
    const v = l.match(/^(\d+) s · (.+)$/);
    return v ? `a ${v[1]}-second ${v[2]} clip` : `a ${l}${/image/i.test(l) ? "" : " image"}`;
  };
  const costQA = min && max ? { q: `How much does ${m.name} cost?`, a: `On BuzzVideo, ${m.name} costs ${min.credits} credits for ${tier(min.label)} and ${max.credits.toLocaleString("en-US")} credits for ${tier(max.label)}. The exact price shows in the generator before you press Create.` } : undefined;
  const faq = [{ q: `What is ${m.name}?`, a: d.definition }, ...(g.kind !== "prompt" && costQA ? [costQA] : []), ...g.faq];

  /* 2026-11-26 审核：提示词指南页首屏两条和下面示例区头两条是同一批素材(同页重复)。示例够多(≥6)时首屏改用最后两条，示例区不再列这两条 */
  const visual = ex.filter((x) => x.kind !== "audio");
  const heroPair = g.kind === "prompt" && visual.length >= 6 ? visual.slice(-2) : visual.slice(0, 2);
  const heroSrc = new Set(g.kind === "prompt" && visual.length >= 6 ? heroPair.map((x) => x.src) : []);
  const hero = (() => {
    if (g.kind === "pricing") return <PriceGrid prices={d.prices} />;
    const pair = heroPair;
    return pair.length ? <MediaPair items={pair.map((x) => ({ pic: x, label: x.alt, sub: `Made with ${x.model} on BuzzVideo` }))} /> : null;
  })();

  const sameType = MODELS.filter((x) => x.type === m.type && x.slug !== m.slug);
  const chips = g.related.map((r) => ({ label: r.label, link: a(r.label, r.href) }));

  /* 2026-11-25:模板原先只给 Kling 4.0 教程页和视频价格页用，步骤 / 能力 / 文案都写死。
     现在别的模型也有教程和价格页：Kling 4.0 仍用手写模型页的数据，其余模型用 modelPageData 的 howTo / goodFor;「clip」按模型类型换词。 */
  const isKling4 = g.model === "kling-4-0";
  const isVideo = m.type === "video";
  const unit = isVideo ? "clip" : m.type === "image" ? "image" : "audio clip";
  const steps = isKling4 ? KLING_4.howTo : d.howTo;
  const caps: { title: string; body: string }[] = isKling4 ? KLING_4.capabilities : d.goodFor;
  const COMPARE_POOL = isVideo ? ["seedance-2-5", "seedance-2-0", "kling-4-0", "wan-3-0"] : ["nano-banana-pro", "gpt-image-2-5-sunburst", "nano-banana-2-1", "seedream-5-5"];
  const compareCols = [m.slug, ...COMPARE_POOL.filter((x) => x !== m.slug && modelOf(x)).slice(0, 3)];
  /* 教程步骤(Kling 4.0 的四步来自手写模型页) */
  const draft = ex.find((x) => x.prompt);
  const howRows: OARow[] =
    g.kind === "how-to"
      ? steps.map((s, i) => ({
          key: s.title,
          title: `${i + 1}. ${s.title}`,
          body: s.body,
          media:
            i === 0 ? (
              <StepPickModel m={m} siblings={sameType} />
            ) : i === 1 ? (
              <StepPrompt prompt={(draft?.prompt ?? "").replace(/\[|\]/g, "")} chips={isKling4 ? [m.name, "9:16", "15 s"] : [m.name]} />
            ) : i < steps.length - 1 ? (
              <div className="p-5">
                <SpecTable slugs={[m.slug]} a={a} />
              </div>
            ) : (
              <StepResult sample={draft} m={m} from={d.prices.find((p) => p.label === "5 s · 720p")?.credits} />
            ),
          cta: { label: `Try ${m.name}`, link: tryM },
        }))
      : [];

  const ldType =
    g.kind === "how-to"
      ? { "@context": "https://schema.org", "@type": "HowTo", name: g.h1, description: g.lead, step: steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.title, text: s.body })) }
      : { "@context": "https://schema.org", "@type": "TechArticle", headline: g.h1, description: g.lead, dateModified: CONTENT_UPDATED, about: { "@type": "SoftwareApplication", name: m.name, applicationCategory: "MultimediaApplication", creator: { "@type": "Organization", name: m.vendor } }, publisher: PUBLISHER };

  return (
    <main className="bg-black text-white">
      <GuideHero
        chip={<HeroChip link={a(m.name, href)}>{m.name} by {m.vendor}</HeroChip>}
        title={g.h1}
        lead={g.lead}
        actions={
          <>
            <a {...tryM} className={`${OA_CTA} px-6 py-3.5`}>
              Try {m.name} <ArrowUpRight className="size-4" />
            </a>
            <a {...a(m.name, href)} className={GHOST_BTN}>
              {m.name} specs
            </a>
          </>
        }
      >
        {hero}
        {g.kind === "pricing" && <p className="mt-4 text-[13.5px] text-[#9F9F9F]">Credits per generation on BuzzVideo, {isVideo ? "by clip length and resolution" : "by setting"}. Other settings show their price in the generator before you create.</p>}
      </GuideHero>

      {/* ── 提示词指南 ── */}
      {g.kind === "prompt" && g.anatomy && (
        <OAPanel id="structure" title={`How do you structure a ${m.name} prompt?`} sub={`Write it in this order. Each step is based on what ${m.name} supports on BuzzVideo${withPrompt.length ? " and on the real prompts further down this page" : ""}.`}>
          <ol className="grid gap-4 md:grid-cols-2">
            {g.anatomy.map((s, i) => (
              <li key={s.title} className={`rounded-[22px] bg-white/[0.04] p-6 ring-1 ring-white/[0.08] ${i === g.anatomy!.length - 1 && g.anatomy!.length % 2 ? "md:col-span-2" : ""}`}>
                <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-[#FF744D]">Step 0{i + 1}</p>
                <h3 className="mt-2 text-[20px] font-extrabold leading-snug">{s.title}</h3>
                <p className="mt-3 text-[15.5px] leading-relaxed text-[#CACACA]">{s.body}</p>
              </li>
            ))}
          </ol>
        </OAPanel>
      )}

      {g.kind === "prompt" && ordered.length > 0 && (
        <OAPanel
          id="examples"
          title={`Real ${m.name} prompts and what they made`}
          sub={withPrompt.length ? `Each result below was generated with ${m.name} on BuzzVideo${g.model === "kling-4-0" ? "; the template is the structure behind the one-take UGC ad" : " from the prompt next to it"}. Copy a prompt, or open it in the generator and swap in your product.` : `Each ${isVideo ? "video" : "image"} below was generated with ${m.name} on BuzzVideo. Use the structure above to write your own, then open ${m.name} to try it.`}
        >
          <div className="space-y-5">
            {ordered.filter((x) => !heroSrc.has(x.src)).map((x) => (
              <ExampleCard key={x.src} ex={x} onTry={onTry} openLink={tryM} />
            ))}
          </div>
        </OAPanel>
      )}

      {/* ── 价格页 ── */}
      {g.kind === "pricing" && costQA && <AnswerCard q={costQA.q} a={costQA.a} />}
      {g.kind === "pricing" && (
        <>
          <OAPanel id="plans" title={`Which plans include ${m.name}?`}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[22px] bg-white/[0.04] p-6 ring-1 ring-white/[0.08]">
                <h3 className="text-[20px] font-extrabold">{d.plans}</h3>
                <p className="mt-3 text-[15.5px] leading-relaxed text-[#CACACA]">{m.name} is included on the {d.plans} plans. Credits come with your plan and work on every model you can use, so one balance covers video, image and audio.</p>
                <a {...a("Pricing", "/pricing")} className={`${GHOST_BTN} mt-5`}>
                  See plans
                </a>
              </div>
              <div className="rounded-[22px] bg-white/[0.04] p-6 ring-1 ring-white/[0.08]">
                <h3 className="text-[20px] font-extrabold">Free credits</h3>
                <p className="mt-3 text-[15.5px] leading-relaxed text-[#CACACA]">New accounts get {SIGNUP_CREDITS} free credits. They work on Seedream 4.5, Seedream 5.0 lite and Seed Audio 1.0, not on {m.name}{isVideo ? " or other video models" : ""}.</p>
              </div>
            </div>
          </OAPanel>
          <OAPanel id="compare" title={`How does ${m.name} pricing compare with other ${m.type} models?`} sub={`Credits per ${unit} on BuzzVideo at the same ${isVideo ? "length and resolution" : "setting"}. A dash means that price is not listed here; the generator shows every price before you create.`}>
            {(() => {
              const cols = compareCols;
              return (
                <DataTable
                  firstColLabel="Setting"
                  highlight={0}
                  head={cols.map((s) => (
                    <a key={s} {...a(modelOf(s)!.name, modelHref(s))} className="underline decoration-white/30 underline-offset-4 hover:decoration-[#FF744D]">
                      {modelOf(s)!.name}
                    </a>
                  ))}
                  rows={priceRowsOf(cols).map((r) => ({ label: r.label, cells: r.cells.map((c) => (c !== undefined ? c.toLocaleString("en-US") : "—")) }))}
                />
              );
            })()}
          </OAPanel>
        </>
      )}

      {/* ── 教程 ── */}
      {g.kind === "how-to" && <OAFeatureRows id="steps" title={`How do you use ${m.name} on BuzzVideo?`} sub={`${steps.length === 4 ? "Four" : steps.length === 3 ? "Three" : steps.length} steps from an empty prompt to a finished ${m.name} ${unit}.`} rows={howRows} />}
      {g.kind === "how-to" && (
        <OAPanel id="features" title={`What can ${m.name} do?`}>
          <ul className="grid gap-4 md:grid-cols-3">
            {caps.map((c) => (
              <li key={c.title} className="rounded-[22px] bg-white/[0.04] p-6 ring-1 ring-white/[0.08]">
                <h3 className="text-[18px] font-extrabold">{c.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[#CACACA]">{c.body}</p>
              </li>
            ))}
          </ul>
        </OAPanel>
      )}

      {/* ── 共用：参数 / 价格 / 清单 ── */}
      {g.kind !== "pricing" && (
        <OAPanel id="specs" title={`Which ${m.name} settings can you use on BuzzVideo?`}>
          <SpecTable slugs={[m.slug]} a={a} />
        </OAPanel>
      )}
      {g.kind === "how-to" && d.prices.length > 0 && (
        <OAPanel id="price" title={`How much does a ${m.name} ${unit} cost?`} sub={`Credits per ${unit} on BuzzVideo. The price shows in the generator before you create.`}>
          <PriceGrid prices={d.prices} />
        </OAPanel>
      )}
      {g.kind === "how-to" && draft && (
        <OAPanel id="draft" title={isVideo ? "Draft the opening beat first" : "Start from a real prompt"} sub={isVideo ? "Check the face, voice and product on a short draft, then generate the full take with the same prompt." : `This image was made with ${draft.model} on BuzzVideo. Open the prompt in the generator and swap in your product.`}>
          <ExampleCard ex={draft} onTry={onTry} openLink={tryM} />
        </OAPanel>
      )}

      {g.tips && (
        <section className="bg-[#F6F6F6] py-20 text-[#240A03] md:py-28">
          <div className={OA_WRAP}>
            <h2 className={OA_H2}>{g.kind === "pricing" ? `How can you spend fewer credits on ${m.name}?` : `${m.name} prompt checklist`}</h2>
            <ul className="mt-10 grid gap-3 md:grid-cols-2">
              {g.tips.map((t) => (
                <li key={t} className="flex gap-3 rounded-[18px] bg-white p-5 text-[16px] leading-relaxed shadow-[0_12px_30px_rgba(36,10,3,0.06)]">
                  <Check className="mt-1 size-4 shrink-0 text-[#FF5255]" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {g.kind === "pricing" && ex.length > 0 && (
        <OAPanel id="examples" title={`What does a ${m.name} ${unit} look like?`} sub={`Real ${m.name} ${isVideo ? "videos" : "images"} made on BuzzVideo${ex.slice(0, 2).some((x) => x.prompt) ? ", with the prompts behind them" : ""}.`}>
          <div className="space-y-5">
            {ex.slice(0, 4).map((x) => ( /* 2026-11-26 价格页原来只放 2 条示例，放到 4 条 */
              <ExampleCard key={x.src} ex={x} onTry={onTry} openLink={tryM} />
            ))}
          </div>
        </OAPanel>
      )}

      <OAFaq items={faq} />
      <OAChips title={`More on ${m.name}`} chips={chips} />
      <OACta title={`Make your next ad with ${m.name}`} sub="Video, image and audio models on one BuzzVideo account. You see the credit price before you create." cta={{ label: `Try ${m.name}`, link: tryM }} />
      <SourcesNote sources={g.model === "kling-4-0" && g.kind === "how-to" ? KLING_4.sources.filter((s) => !/pricing/i.test(s.label)) : []} />
      <JsonLd data={[ldType, faqLd(faq), ...mediaLd(ex)]} />
    </main>
  );
}
