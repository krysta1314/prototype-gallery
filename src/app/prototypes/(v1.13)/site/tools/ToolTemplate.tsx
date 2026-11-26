"use client";

/* 工具落地页模板 v2(2026-11-19,Monica:照 openart.ai/ai-image-generator 一模一样的版式)。/tools/<keyword>,数据在 tool-content.ts,区块在 ../oa/kit.tsx。
   定位(照 Higgsfield):Header 点功能直接进产品工具页;这一页是给搜索 / AI 搜索进来的人看的落地页，
   工具页的 canonical 指向这里。首屏提示词框 = 带着提示词进工具。
   版式(OpenArt 顺序):首屏(大写大标题 + 一句答案 + 发光提示词框 + 作品拼贴)→ 示例与提示词 → 关键功能(左右交替)
     → 品牌色底：更多玩法 + 背后的模型 → 浅底：三步教程 + 用途 → FAQ 两列 → 博客 → 相关工具标签 → 收尾卡。
   SEO / GEO:H1 = 搜索词;首段答案优先;「What is X?」做功能段标题;FAQ 来自真实搜索;
   JSON-LD:BreadcrumbList、SoftwareApplication、HowTo、FAQPage、成片 VideoObject / ImageObject。 */

import { useMemo, useState } from "react";
import { ArrowRight, ArrowUp, Plus } from "lucide-react";
import { appOf, go, type OnLink } from "../../site-nav/SiteNavHeader";
import { HEADER, statusOf, TOOLS_HUB_GROUPS } from "../../site-nav/nav-data";
import { MODELS, type ModelType } from "../../site-nav/models-catalog";
import { modelHref } from "../models/model-content";
import { mediaOf } from "../models/model-media";
import { StepPickModel, StepPrompt, StepResult } from "../models/ModelVisuals";
import { OA_CTA, OABlog, OAChips, OACta, OADrench, OAExamples, OAFaq, OAFeatureRows, OAHero, OAPromptBox, OASteps, PicView, type OACard, type OARow, OACompare } from "../oa/kit";
import { heroPics, picker, picsOf, postsFor, type Pic } from "../oa/pool";
import { FREE_MODELS, fromCreditsOf, modelEntry, SIGNUP_CREDITS, toolBySlug, TOOLS_CONTENT, type ToolEntry } from "./tool-content";
import { resolveHref } from "../redirects";
import { isPair, pageMedia, pageRows } from "../page-media";
import { AudioLanding, supportsTags } from "../audio/AudioLanding";
import { audioKindOf } from "../audio/audio-samples";
import { CONTENT_UPDATED } from "../content-date";

const VERIFIED = "November 19, 2026";
const MODE_LABEL: Record<ToolEntry["mode"], string> = { marketing: "Marketing Agent", video: "Video", image: "Image", audio: "Voiceover", music: "Music", sfx: "Sound Effects" };
const ATTACH: Partial<Record<ToolEntry["mode"], string>> = { marketing: "Add product photo", video: "Add image or link", image: "Add photo", audio: "Add voice sample" };
const TYPE_OF: Record<ToolEntry["group"], ModelType> = { Ads: "video", Video: "video", Image: "image", Audio: "audio", Avatar: "video" };
const TOPIC_OF = { Ads: "ads", Video: "video", Image: "image", Audio: "audio", Avatar: "video" } as const;

/* 提示词里的 [占位] 标橙(产品里打开时会选中第一个) */
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

export function ToolTemplate({ t, onLink }: { t: ToolEntry; onLink: OnLink }) {
  const a = (label: string, rawHref: string, status = statusOf(resolveHref(rawHref)), href = resolveHref(rawHref)) => ({
    href,
    onClick: (e: React.MouseEvent) => {
      e.preventDefault();
      go(href, status, label, onLink);
    },
  });
  /* 进工具(照 Higgsfield:落地页的按钮带人进产品工具页) */
  const enterTool = (label: string) => {
    const app = appOf(`/${t.slug}`);
    if (app) window.location.href = app;
    else go("/", statusOf("/"), label, onLink);
  };
  const toTool = (label: string) => ({
    href: `/${t.slug}`,
    onClick: (e: React.MouseEvent) => {
      e.preventDefault();
      enterTool(label);
    },
  });
  const [prompt, setPrompt] = useState(t.prompt);
  const type = TYPE_OF[t.group];
  const def = modelEntry(t.models[0]);
  const from = fromCreditsOf(t.models[0]);
  const freeOk = t.models.some((s) => FREE_MODELS.has(s));
  const freeLine = freeOk ? `${SIGNUP_CREDITS} free credits when you sign up` : t.group === "Image" ? "Free credits work on Seedream images · other models from the Starter plan" : "Free to sign up · video models from the Starter plan";

  /* 素材：本工具的成片 + 本工具模型的成片 → 同类池 */
  const own: Pic[] = useMemo(() => {
    const out: Pic[] = [...pageMedia(t.slug)]; /* 2026-11-25 本页专属配图排最前 */
    if (t.media) out.push({ kind: t.media.kind, src: t.media.src, poster: t.media.poster, aspect: t.media.aspect, alt: t.media.alt, prompt: t.prompt.replace(/\[|\]/g, ""), source: t.media.source });
    for (const s of t.models) {
      const m = modelEntry(s);
      for (const x of mediaOf(s)) if (x.kind === type) out.push({ ...x, model: m?.name, modelSlug: s });
    }
    return out;
  }, [t, type]);
  const pool = useMemo(() => {
    const seen = new Set<string>();
    return [...own, ...picsOf(type)].filter((p) => (seen.has(p.src) ? false : (seen.add(p.src), true)));
  }, [own, type]);
  const hero = useMemo(() => heroPics(type, own, 12), [type, own]);
  const visualPool = type === "audio" ? picsOf("image") : pool.filter((p) => p.kind !== "audio");

  /* 示例分类：全部 + 每个有成片的模型 */
  const tabs = useMemo(() => {
    const withPrompt = pool.filter((p) => p.prompt || p.kind === "audio");
    const byModel = new Map<string, Pic[]>();
    for (const p of withPrompt) if (p.model) byModel.set(p.model, [...(byModel.get(p.model) ?? []), p]);
    const firstTab = { label: "All", pics: withPrompt.slice(0, 14) };
    return [firstTab, ...[...byModel.entries()].filter(([, v]) => v.length > 1).slice(0, 5).map(([label, pics]) => ({ label, pics }))];
  }, [pool]);

  /* 功能段 / 用途段 / 卡片配图：同一页不重复(首屏拼贴之外的放前面，不够再循环) */
  const heroSet = new Set(hero.map((p) => p.src));
  const next = picker([...visualPool.filter((p) => !heroSet.has(p.src)), ...visualPool.filter((p) => heroSet.has(p.src))]);
  /* 2026-11-25 功能行优先用本页的前后对比(page-media.ts 的 PAGE_COMPARE),按行的顺序取;没有就用单张图 */
  /* 2026-11-25 逐行配图：page-media.ts 的 PAGE_ROWS 按行给对比或单张素材，没有的行照旧 */
  const rowMedia = pageRows(t.slug);
  let rowAt = 0;
  const media = (p?: Pic) => {
    const m = rowMedia[rowAt++];
    return <div className="aspect-[4/3]">{m && isPair(m) ? <OACompare {...m} /> : m ? <PicView p={m} /> : p ? <PicView p={p} /> : null}</div>;
  };
  const models = t.models.map((s) => modelEntry(s)).filter((m): m is NonNullable<typeof m> => !!m);

  const rows: OARow[] = [
    { key: "what", title: t.definition.q, body: t.definition.a, media: media(next()), cta: { label: "Try it now", link: toTool(t.name) } },
    /* 底层模型不在模型清单里(SeedVR、MCP Skill 现场选模型等)时不显示这一行 */
    ...(models.length ? [{
      key: "models",
      title: `Runs on ${models.slice(0, 3).map((m) => m.name).join(", ")}`,
      body: (
        <>
          {t.mode === "marketing" ? "The Marketing Agent picks the model for each shot, or you choose one yourself. " : "Pick the model next to the prompt. "}
          {models.slice(0, 3).map((m, i) => (
            <span key={m.slug}>
              <a {...a(m.name, modelHref(m.slug))} className="font-semibold text-white underline decoration-[#FF744D] decoration-2 underline-offset-4">
                {m.name}
              </a>{" "}
              {m.desc.charAt(0).toLowerCase() + m.desc.slice(1)}
              {i < Math.min(3, models.length) - 1 ? "; " : "."}
            </span>
          ))}
        </>
      ),
      media: media(next()),
      cta: { label: "Try it now", link: toTool(t.name) },
    }] : []),
    ...t.faq
      .filter((q) => !/free|cost|price|legal/i.test(q.q))
      .slice(0, 1)
      .map((q) => ({ key: "faq", title: q.q, body: q.a, media: media(next()), cta: { label: "Try it now", link: toTool(t.name) } })),
  ];

  const sameGroup = TOOLS_CONTENT.filter((x) => x.slug !== t.slug && (x.group === t.group || t.related.includes(x.slug)));
  const ways: OACard[] = [...t.related.map(toolBySlug).filter((x): x is ToolEntry => !!x), ...sameGroup.filter((x) => !t.related.includes(x.slug))]
    .slice(0, 8)
    .map((x) => ({
      key: x.slug,
      title: x.name,
      desc: x.h1Tail.charAt(0).toUpperCase() + x.h1Tail.slice(1),
      pic: x.media ? { kind: x.media.kind, src: x.media.src, poster: x.media.poster, aspect: x.media.aspect, alt: x.media.alt, prompt: "", source: "" } : next(),
      link: a(x.name, `/${x.slug}`),
    }));
  const modelCards: OACard[] = models.slice(0, 3).map((m) => {
    const s = mediaOf(m.slug).find((x) => x.kind !== "audio");
    const f = fromCreditsOf(m.slug);
    return { key: m.slug, title: m.name, tag: m.vendor, desc: m.desc, meta: f !== undefined ? (m.type === "audio" ? `${f} credits / s` : `From ${f} credits`) : m.release === "v1.13" ? "Next release" : undefined, pic: s ? { ...s, model: m.name } : undefined, link: a(m.name, modelHref(m.slug)) };
  });

  const resultPic = own.find((p) => p.kind !== "audio") ?? visualPool[0];
  const steps = t.steps.slice(0, 3).map((s, i) => ({
    ...s,
    visual:
      i === 0 && def ? (
        <StepPickModel m={def} siblings={MODELS.filter((x) => x.type === def.type && x.slug !== def.slug)} />
      ) : i === 1 ? (
        <StepPrompt prompt={t.prompt.replace(/\[|\]/g, "")} chips={[def?.name ?? MODE_LABEL[t.mode]]} />
      ) : def ? (
        <StepResult sample={resultPic} m={def} from={from} />
      ) : null,
  }));

  const uses: OARow[] = t.uses.map((u) => ({ key: u.title, title: u.title, body: u.body, media: media(next()), cta: { label: `Try ${t.name}`, link: toTool(t.name) } }));
  /* 相关工具标签 = 导航同一菜单里的全部功能(含新功能;Soon 的照样标出) */
  const menu = HEADER.find((h) => h.label === ({ Ads: "Agent", Video: "Video", Image: "Image", Audio: "Audio", Avatar: "Video" } as const)[t.group]);
  const chipLinks = [...(menu?.tiles ?? []), ...(menu?.groups?.[0]?.links ?? [])].filter((l, i, arr) => l.href !== `/${t.slug}` && arr.findIndex((x) => x.href === l.href) === i);
  const chips = (chipLinks.length ? chipLinks : TOOLS_HUB_GROUPS[1].links).slice(0, 24).map((l) => ({
    label: l.label,
    link: a(l.label, l.href, l.status),
    soon: l.badge === "Soon",
  }));
  const kind = t.group === "Image" ? "image" : t.group === "Audio" ? "audio" : "video";
  /* 2026-11-25 音频工具页照 ElevenLabs 单独做首屏和声音板块(../audio/AudioLanding.tsx);示例拼贴和品牌色底卡片去掉，下面的 SEO 段不变 */
  const audioKind = t.group === "Audio" ? audioKindOf(t.slug) : undefined;

  return (
    <main className="bg-black text-white">
      {/* 2026-11-19 Monica:落地页都是一级页面，不放面包屑 */}

      {audioKind ? (
        <AudioLanding
          slug={t.slug}
          kind={audioKind}
          title={t.h1}
          lead={t.lead}
          chip={
            t.soon ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.07] px-3.5 py-1.5 text-[13px] font-semibold text-[#E8E8E8] ring-1 ring-white/10">
                <span className="size-1.5 rounded-full bg-[#FFA73C]" />
                Coming soon
              </span>
            ) : def && (
              <a {...a(def.name, modelHref(def.slug))} className="inline-flex items-center gap-2 rounded-full bg-white/[0.07] px-3.5 py-1.5 text-[13px] font-semibold text-[#E8E8E8] ring-1 ring-white/10 transition hover:bg-white/[0.12]">
                <span className="size-1.5 rounded-full bg-[#FF744D]" />
                Powered by {def.name}
                <ArrowRight className="size-3.5" />
              </a>
            )
          }
          cta={{ label: t.soon ? "Get notified" : "Create now", onClick: () => enterTool(t.name) }}
          price={from !== undefined ? `${from} credits / s` : undefined}
          model={def?.name ?? MODE_LABEL[t.mode]}
          tags={supportsTags(t.models[0])}
          prompt={audioKind === "voice" ? undefined : t.prompt.replace(/\[|\]/g, "")}
          onPrompt={setPrompt}
        />
      ) : (
      <OAHero
          onPrompt={setPrompt}
          chip={
            t.soon ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.07] px-3.5 py-1.5 text-[13px] font-semibold text-[#E8E8E8] ring-1 ring-white/10">
                <span className="size-1.5 rounded-full bg-[#FFA73C]" />
                Coming soon
              </span>
            ) : def && (
              <a {...a(def.name, modelHref(def.slug))} className="inline-flex items-center gap-2 rounded-full bg-white/[0.07] px-3.5 py-1.5 text-[13px] font-semibold text-[#E8E8E8] ring-1 ring-white/10 transition hover:bg-white/[0.12]">
                <span className="size-1.5 rounded-full bg-[#FF744D]" />
                Powered by {def.name}
                <ArrowRight className="size-3.5" />
              </a>
            )
          }
          title={t.h1}
          lead={t.lead}
          pics={hero}
          box={
            <OAPromptBox onSubmit={() => enterTool(t.name)}>
              <label htmlFor="tool-prompt" className="sr-only">
                Prompt for {t.name}
              </label>
              {/* 一直可编辑;下面垫一层同排版的高亮层给 [占位] 标橙 */}
              <div className="relative min-h-[84px] px-1 text-[16px] leading-relaxed">
                <div aria-hidden className="pointer-events-none whitespace-pre-wrap break-words text-white">
                  <PromptPreview text={prompt} />
                  {"​"}
                </div>
                <textarea
                  id="tool-prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  spellCheck={false}
                  className="absolute inset-0 size-full resize-none overflow-hidden bg-transparent text-transparent caret-white selection:bg-[#FF744D]/30 focus:outline-none"
                />
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {ATTACH[t.mode] && (
                  <a {...toTool(ATTACH[t.mode]!)} className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] px-3 py-1.5 text-[12.5px] font-semibold text-[#E8E8E8] transition hover:bg-white/15">
                    <Plus className="size-3.5" /> {ATTACH[t.mode]}
                  </a>
                )}
                <span className="rounded-full bg-white px-3 py-1.5 text-[12.5px] font-semibold text-[#240A03]">{def?.name ?? MODE_LABEL[t.mode]}</span>
                <span className="ml-auto flex items-center gap-3">
                  {from !== undefined && <span className="text-[13px] font-semibold tabular-nums text-[#CACACA]">{t.group === "Audio" ? `${from} credits / s` : `From ${from} credits`}</span>}
                  <button type="submit" className={OA_CTA}>
                    {t.soon ? "Get notified" : "Create now"} <ArrowUp className="size-4" />
                  </button>
                </span>
              </div>
            </OAPromptBox>
          }
        />
      )}

      {!audioKind && tabs[0].pics.length > 0 && (
        <OAExamples
          title={`Explore ${t.name} examples and prompts`}
          sub={`See what marketers and creators make with BuzzVideo's ${t.name.replace(/^AI /, "AI ")}. Every example below was generated on BuzzVideo; hover to read the prompt, then try it or write your own.`}
          tabs={tabs}
          onUse={(p) => {
            setPrompt(p);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}

      <OAFeatureRows
        id="features"
        title={`Key ${t.name} features`}
        sub={`Create, edit and finish ${kind === "audio" ? "audio" : kind === "image" ? "images" : "videos"} for ads in one place. ${models.length > 1 ? `${models.slice(0, 4).map((m) => m.name).join(", ")} all run on the same BuzzVideo account and credits.` : ""}`}
        rows={rows}
      />

      {!audioKind && <OADrench
        ways={{ title: "More ways to create and edit", cards: ways }}
        models={modelCards.length === 0 ? undefined : {
          title: `Top AI models behind BuzzVideo's ${t.name}`,
          sub: "BuzzVideo gives you the leading models in one place, not one provider's look. Pick the model that fits the job; you see the credit price before you create.",
          cards: modelCards,
        }}
      />}

      <OASteps title={`How to use ${/^AI /.test(t.name) ? "the " : ""}${t.name}`} steps={steps} />
      <OAFeatureRows id="uses" tone="light" title={`Best uses for ${t.name}`} rows={uses} />

      <OAFaq items={[t.definition, ...t.faq]} />
      <OABlog posts={postsFor(TOPIC_OF[t.group])} all={a("Blog", "/blog", "live")} link={(p) => a(p.title, p.href, "live")} />
      <OAChips title={`Explore AI ${kind} tools`} chips={chips} />
      <OACta title={t.soon ? `Be first to try ${t.name}` : freeOk ? `Try ${t.name} with ${SIGNUP_CREDITS} free credits` : "Create without limits"} sub="Make video, image and audio ads with the leading AI models on one BuzzVideo account." cta={{ label: t.soon ? "Get notified at launch" : "Get started for free", link: toTool(t.name) }} />

      {/* 2026-11-25 Monica:「落地页都不要放这个」—— 页面底部不再显示数据来源说明;外部来源仍留在结构化数据里 */}
      <div className="pb-14" />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: `BuzzVideo ${t.name}`,
              applicationCategory: "MultimediaApplication",
              operatingSystem: "Web",
              description: t.lead,
              dateModified: CONTENT_UPDATED,
              publisher: { "@type": "Organization", name: "BuzzVideo AI", url: "https://buzzvideo.ai" },
            },
            { "@context": "https://schema.org", "@type": "HowTo", name: `How to use ${t.name} on BuzzVideo`, step: t.steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.title, text: s.body })) },
            { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: [t.definition, ...t.faq].map((q) => ({ "@type": "Question", name: q.q, acceptedAnswer: { "@type": "Answer", text: q.a } })) },
            ...own
              .filter((p) => p.kind !== "audio")
              .slice(0, 6)
              .map((p) => ({
                "@context": "https://schema.org",
                "@type": p.kind === "video" ? "VideoObject" : "ImageObject",
                name: p.alt,
                description: p.model ? `Made with ${p.model} on BuzzVideo.` : "Made on BuzzVideo.",
                contentUrl: p.src.startsWith("http") ? p.src : `https://buzzvideo.ai${p.src}`,
                ...(p.kind === "video" ? { thumbnailUrl: p.poster ? `https://buzzvideo.ai${p.poster}` : undefined, uploadDate: "2026-11-19" } : {}),
                creator: { "@type": "Organization", name: "BuzzVideo AI" },
              })),
          ]),
        }}
      />
    </main>
  );
}
