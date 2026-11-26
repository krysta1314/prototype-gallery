"use client";

/* 模型页通用模板 v4(2026-11-19,Monica:版式改成照 openart.ai/ai-image-generator,区块在 ../oa/kit.tsx;v3 是 Gemini 式)。
   顺序：首屏 → 示例与提示词 + 写法要点 → 关键功能 → 品牌色底(更多玩法 + 更多模型)→ 规格与价格 → 三步教程 → 用途 → 对比 → FAQ → 博客 → 同类模型标签 → 收尾。
   以下是 v3 的说明，SEO / GEO 规则不变:
   48 个模型(除 Kling 4.0 手写版)共用，数据来自 model-content.ts + model-media.ts。

   版式(Gemini 的骨架):居中两行大标题(白 + 品牌橙)+ 一句答案 + 提示词框 → 通栏成片舞台(轮播，带真实提示词)
     → 「What X is good for」→ 能力段(每段一个居中标题 + 一句话 + 一张大成片，有成片才放)→ 速查规格
     → 三步用法 → 写 prompt 的要点 + 真实 prompt → 价格 → 「Choose the right model」并排对比 → FAQ + 更多模型 → 收尾。
   SEO / GEO:
     - H1 = 「<模型> AI Video / Image Generator」;首段答案优先(AI 摘要最常整句引用);
     - 每个 H2 都写成这个模型的真实搜索说法(What is X good for / How to use X / X prompt / X pricing / X vs …);
     - FAQ 按这个模型被搜的问题生成(时长、分辨率、参考图、prompt、API、vs、免费、价格),答案只用核实过的数据，details 收起时答案仍在 HTML;
     - JSON-LD:BreadcrumbList、SoftwareApplication(带起价 Offer)、HowTo、FAQPage、ItemList(对比)、每条成片 VideoObject / ImageObject。
   画面规则：只放该模型真实生成的成片;没有成片的位置放参数图形卡(ModelVisuals.tsx),不放假图。
   配色只取 design.md 1.0 官方色板;CTA 渐变只给按钮和收尾通栏;不用渐变字、不在每节头顶放 kicker、标题句式大小写。 */

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUp, ArrowUpRight, Check, ChevronDown, Copy, Pause, Play } from "lucide-react";
import { MODELS, TYPE_TITLE } from "../../site-nav/models-catalog";
import { appOf, go, type OnLink } from "../../site-nav/SiteNavHeader";
import { statusOf } from "../../site-nav/nav-data";
import { HERO_LEADS } from "./hero-leads";
import { modelHref, usdOf, type ModelPageData } from "./model-content";
import { mediaOf, type Sample } from "./model-media";
import { SpecTile, StepPickModel, StepPrompt, StepResult, tilesOf } from "./ModelVisuals";
import { CopyBtn, OA_CTA, OABlog, OAChips, OACta, OADrench, OAExamples, OAFaq, OAFeatureRows, OAHero, OAPanel, OAPromptBox, OASteps, PicView, type OACard, type OARow } from "../oa/kit";
import { heroPics, picker, picsOf, postsFor, type Pic } from "../oa/pool";
import { TOOLS_CONTENT } from "../tools/tool-content";
import { MERGED, resolveHref } from "../redirects";
import { pageMedia } from "../page-media";
import { AudioLanding, supportsTags } from "../audio/AudioLanding";
import { audioKindOf } from "../audio/audio-samples";
import { CONTENT_UPDATED } from "../content-date";

const VERIFIED = "November 19, 2026";
const ctaBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-6 py-3.5 text-[15px] font-bold text-white shadow-[0_10px_30px_rgba(255,82,85,0.28)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF744D] focus-visible:ring-offset-2 focus-visible:ring-offset-black";
const display = "font-extrabold leading-[1.02] tracking-[-0.03em] [text-wrap:balance]";
const wrap = "mx-auto max-w-[1180px] px-4 sm:px-6";
const sectionY = "py-20 md:py-28";

/* 模型页 → 对应工具页的内链(「AI video generator」这类词交给工具页) */
const TOOL_FOR = {
  video: { label: "AI video generator", href: "/ai-video-generator" },
  image: { label: "AI image generator", href: "/ai-image-generator" },
  audio: { label: "AI voice over tool", href: "/ai-voice-over" },
} as const;
const sentenceCut = (t: string, n: number) => {
  if (t.length <= n) return t;
  const cut = t.slice(0, n);
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
  return end > 60 ? cut.slice(0, end + 1) : `${cut.slice(0, cut.lastIndexOf(" "))}…`;
};
const ratioOf = (a: string) => {
  const [w, h] = a.split(":").map(Number);
  return w && h ? w / h : 1;
};

/* Gemini 式的居中两行标题：第一行白，第二行品牌橙 */
function Headline({ top, accent, sub, as: Tag = "h2" }: { top: string; accent?: string; sub?: string; as?: "h2" | "h1" | "h3" }) {
  return (
    <div className="mx-auto max-w-[46rem] text-center">
      <Tag className={`${display} ${Tag === "h1" ? "text-[clamp(42px,7vw,84px)]" : "text-[clamp(32px,4.8vw,58px)]"}`}>
        <span className="block">{top}</span>
        {accent && " "}
        {accent && <span className="block text-[#FF744D]">{accent}</span>}
      </Tag>
      {sub && <p className="mx-auto mt-5 max-w-[40rem] text-[17px] leading-relaxed text-[#CACACA] [text-wrap:pretty] md:text-[18px]">{sub}</p>}
    </div>
  );
}

/* 单条成片：视频静音循环(尊重减少动态效果),图片直接显示 */
function Media({ s, active = true, className = "" }: { s: Sample; active?: boolean; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (!active || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      v.pause();
      return;
    }
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: 0.25 });
    io.observe(v);
    return () => io.disconnect();
  }, [active]);
  if (s.kind === "video") return <video ref={ref} src={s.src} poster={s.poster} muted loop playsInline preload="metadata" aria-label={s.alt} className={`size-full object-cover ${className}`} />;
  if (s.kind === "audio")
    return (
      <div className={`flex size-full flex-col justify-end bg-[#1C1C1C] p-6 ${className}`}>
        <p className="text-[15px] font-bold leading-snug text-white">{s.alt}</p>
        {s.prompt && <p className="mt-1.5 line-clamp-2 text-[13.5px] leading-relaxed text-[#9F9F9F]">{s.prompt}</p>}
        <audio src={s.src} controls className="mt-4 w-full" />
      </div>
    );
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={s.src} alt={s.alt} loading="lazy" className={`size-full object-cover ${className}`} />;
}

/* 通栏成片舞台(Gemini 的大轮播):一次一条，左右切换 + 圆点;下面是这条成片的真实提示词 */
function Stage({ samples, name }: { samples: Sample[]; name: string }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const s = samples[i];
  const n = samples.length;
  const tall = ratioOf(s.aspect) < 1;
  return (
    <div className="mx-auto max-w-[1080px]" aria-roledescription="carousel" aria-label={`${name} examples`}>
      <div className="relative flex h-[min(72vh,640px)] items-center justify-center overflow-hidden rounded-[28px] bg-[#111]">
        {/* 竖片放在居中舞台里，两侧用同一画面的模糊放大做底，避免大块黑边 */}
        {tall && s.poster && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.poster} alt="" aria-hidden className="absolute inset-0 size-full scale-110 object-cover opacity-35 blur-2xl" />
        )}
        {tall && !s.poster && s.kind === "image" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.src} alt="" aria-hidden className="absolute inset-0 size-full scale-110 object-cover opacity-35 blur-2xl" />
        )}
        <div className="relative h-full overflow-hidden rounded-[20px] shadow-[0_30px_80px_rgba(0,0,0,0.5)]" style={{ aspectRatio: `${ratioOf(s.aspect)}`, maxWidth: "100%" }} aria-roledescription="slide" aria-label={`${i + 1} of ${n}`}>
          <Media key={s.src} s={s} active={!paused} />
        </div>
        {n > 1 && (
          <>
            <button type="button" onClick={() => setI((i - 1 + n) % n)} aria-label="Previous example" className="absolute left-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:left-5">
              <ArrowLeft className="size-5" />
            </button>
            <button type="button" onClick={() => setI((i + 1) % n)} aria-label="Next example" className="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:right-5">
              <ArrowRight className="size-5" />
            </button>
          </>
        )}
        {s.kind === "video" && (
          <button type="button" onClick={() => setPaused((p) => !p)} aria-label={paused ? "Play video" : "Pause video"} className="absolute bottom-4 right-4 grid size-10 place-items-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
            {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
          </button>
        )}
      </div>
      {n > 1 && (
        <div className="mt-5 flex justify-center gap-2">
          {samples.map((x, k) => (
            <button key={x.src} type="button" onClick={() => setI(k)} aria-label={`Show example ${k + 1}`} aria-current={k === i || undefined} className="grid h-6 place-items-center px-1">
              <span className={`block h-2 rounded-full transition-all ${k === i ? "w-8 bg-[#FF744D]" : "w-2 bg-white/30 hover:bg-white/60"}`} />
            </button>
          ))}
        </div>
      )}
      <p className="mx-auto mt-5 max-w-[48rem] text-center text-[14px] leading-relaxed text-[#9F9F9F]">
        Made with {name} on BuzzVideo{s.alt ? `: ${s.alt.charAt(0).toLowerCase()}${s.alt.slice(1)}` : ""}.
      </p>
    </div>
  );
}

function CopyPrompt({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(text).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        });
      }}
      className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3.5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-white/20"
    >
      {done ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {done ? "Copied" : "Copy prompt"}
    </button>
  );
}

type Feature = { key: string; top: string; accent: string; body: string };

/* 能力段：标题写成搜索说法，全部从核实过的参数拼，不写参数之外的宣传话 */
function featuresOf(d: ModelPageData): Feature[] {
  const { m, f } = d;
  const out: Feature[] = [];
  const res = f?.resolutions ?? [];
  const refs = f?.refs;
  const ratios = (f?.ratios ?? []).filter((r) => /\d/.test(r));
  const top = res.length ? res[res.length - 1].replace(/^(\d+)P$/, "$1p") : undefined;
  if (m.type === "video" && f?.durations) out.push({ key: "duration", top: `Up to ${f.durations[1]} seconds`, accent: "in one take.", body: `${m.name} makes clips from ${f.durations[0]} to ${f.durations[1]} seconds. Pick the length before you generate; the credit price updates with it.` });
  if (refs?.images && refs.images > 1)
    out.push({ key: "refs", top: `${refs.images} reference images.`, accent: m.type === "video" ? "One consistent look." : "One consistent product.", body: `Add up to ${refs.images} images${refs.videos ? `, ${refs.videos} videos` : ""}${refs.audios ? ` and ${refs.audios} audio clips` : ""} to one prompt so the product, character or style stays the same.` });
  const quality = /Low|Medium|High/i.test(res.join());
  if (top)
    out.push(
      quality
        ? { key: "res", top: `${res.length} quality levels.`, accent: "Draft low, finish high.", body: `Choose ${res.join(", ")}. Lower levels cost less for drafts; use the top level for the final image.` }
        : { key: "res", top: `Up to ${top}.`, accent: "Draft low, finish sharp.", body: `Generate at ${res.map((r) => r.replace(/^(\d+)P$/, "$1p")).join(", ")}. Lower settings cost less for drafts; render the keeper at ${top}.` },
    );
  void ratios;
  if (m.type === "video" && f) out.push({ key: "sound", top: f.soundOff ? "Native audio," : "Sound built in,", accent: f.soundOff ? "on or off." : "every clip.", body: f.soundOff ? "Keep the generated dialogue and ambience, or switch audio off and add your own voiceover and music." : `${m.name} generates sound with the picture, so clips come out ready to post.` });
  return out;
}

export function ModelTemplate({ d, onLink }: { d: ModelPageData; onLink: OnLink }) {
  const { m, f } = d;
  const isNew = m.release === "v1.13";
  const samples = mediaOf(m.slug);
  const own: Pic[] = [...pageMedia(m.slug), ...samples.map((s) => ({ ...s, model: m.name, modelSlug: m.slug }))]; /* 2026-11-25 本页专属配图排最前 */
  const visual = own.filter((s) => s.kind !== "audio");
  const features = useMemo(() => featuresOf(d), [d]);
  const a = (label: string, rawHref: string, status = statusOf(resolveHref(rawHref)), href = resolveHref(rawHref)) => ({
    href,
    onClick: (e: React.MouseEvent) => {
      e.preventDefault();
      go(href, status, label, onLink);
    },
  });
  /* 落地页按钮带人进产品里的这个模型(照 Higgsfield:Header 也直接进工具) */
  const enter = () => {
    const app = appOf(modelHref(m.slug));
    if (app) window.location.href = app;
    else go("/", statusOf("/"), isNew ? "BuzzVideo" : m.name, onLink);
  };
  const toTool = { href: modelHref(m.slug), onClick: (e: React.MouseEvent) => (e.preventDefault(), enter()) };
  const withPrompts = own.filter((s) => s.prompt);
  const siblings = MODELS.filter((x) => x.slug !== m.slug && x.type === m.type);
  const chips = [
    m.name,
    m.type === "video" && f?.durations ? `${Math.min(10, f.durations[1])} s` : undefined,
    samples[0]?.aspect ?? f?.ratios?.find((r) => r === "9:16") ?? f?.ratios?.find((r) => /\d/.test(r)),
    f?.resolutions?.length ? f.resolutions[Math.min(1, f.resolutions.length - 1)].replace(/^(\d+)P$/, "$1p") : undefined,
  ].filter(Boolean) as string[];
  const [prompt, setPrompt] = useState(withPrompts[0]?.prompt ?? "");
  const placeholder = m.type === "video" ? "Describe the video you want to create…" : m.type === "image" ? "Describe the image you want to create…" : f?.audioKind === "music" ? "Describe the track you want…" : f?.audioKind === "sound effects" ? "Describe the sound you want…" : "Paste your script…";
  const hero = useMemo(() => heroPics(m.type, own, 12), [m.type, own]);
  /* 2026-11-25 音频模型页照 ElevenLabs 单独做首屏和声音板块(../audio/AudioLanding.tsx),下面的 SEO 段不变 */
  const audioKind = m.type === "audio" ? audioKindOf(m.slug) : undefined;
  const lead = HERO_LEADS[m.slug] ?? d.definition.replace(/\s*On BuzzVideo it starts at .*$/, "");
  const comingChip = isNew && (
    <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.07] px-3.5 py-1.5 text-[13px] font-semibold text-[#E8E8E8] ring-1 ring-white/10">
      <span className="size-1.5 rounded-full bg-[#FFA73C]" />
      Coming next release
    </span>
  );

  const TOC: [string, string][] = (
    [
      ["overview", "Overview"],
      ["prompts", "Prompts"],
      ["features", "Features"],
      ["specs", "Specs & pricing"],
      ["how", "How to use"],
      ["good-for", "Use cases"],
      ["compare", "Compare"],
      ["faq", "FAQ"],
    ] as [string, string][]
  ).filter(([id]) => id !== "compare" || d.matchup.length > 1);

  /* 没有成片时，功能段 / 用途段的画面用真实参数画的图形卡(不借别的模型的图) */
  const tile = (i: number) => {
    const kinds = tilesOf(m, f, d.fromCredits);
    return (
      <div className="flex aspect-[4/3] items-center justify-center bg-[radial-gradient(120%_90%_at_10%_0%,rgba(255,116,77,0.25),transparent_60%)] p-6">
        <div className="h-full" style={{ aspectRatio: "4 / 5" }}>
          <SpecTile kind={kinds[i % kinds.length]} m={m} f={f} from={d.fromCredits} samples={samples} />
        </div>
      </div>
    );
  };
  const pic = (i: number) => (visual.length ? <div className="aspect-[4/3]"><PicView p={visual[i % visual.length]} /></div> : tile(i));

  const rows: OARow[] = features.map((ft, i) => ({ key: ft.key, title: `${ft.top} ${ft.accent}`, body: ft.body, media: pic(i + 1), cta: { label: isNew ? "Start free" : "Try it now", link: toTool } }));
  const uses: OARow[] = d.goodFor.map((g, i) => ({ key: g.title, title: g.title, body: g.body || m.desc, media: pic(i + 2), cta: { label: isNew ? "Start free" : i === 0 ? `Try ${m.name}` : "Create with this model", link: toTool } })) /* 2026-11-26 SEO 审核：模型名重复过多，用途行只有第一行按钮带模型名 */;

  const typeTools = TOOLS_CONTENT.filter((t) => (m.type === "audio" ? t.group === "Audio" : m.type === "image" ? t.group === "Image" : t.group === "Video" || t.group === "Ads"));
  const toolPool = picker(m.type === "audio" ? picsOf("image") : picsOf(m.type));
  const ways: OACard[] = typeTools.slice(0, 8).map((t) => ({
    key: t.slug,
    title: t.name,
    desc: t.h1Tail.charAt(0).toUpperCase() + t.h1Tail.slice(1),
    pic: t.media ? { kind: t.media.kind, src: t.media.src, poster: t.media.poster, aspect: t.media.aspect, alt: t.media.alt, prompt: "", source: "" } : toolPool(),
    link: a(t.name, `/${t.slug}`),
  }));
  const modelCards: OACard[] = d.related.slice(0, 3).map((x) => {
    const s = mediaOf(x.slug).find((y) => y.kind !== "audio");
    const fc = d.compare.find((c) => c.m.slug === x.slug)?.from;
    return { key: x.slug, title: x.name, tag: x.vendor, desc: x.desc, meta: fc !== undefined ? (x.type === "audio" ? `${fc} credits / s` : `From ${fc} credits`) : x.release === "v1.13" ? "Next release" : undefined, pic: s ? { ...s, model: x.name } : undefined, link: a(x.name, modelHref(x.slug)) };
  });

  const steps = d.howTo.slice(0, 3).map((s, i) => ({
    ...s,
    visual:
      i === 0 ? (
        <StepPickModel m={m} siblings={siblings} />
      ) : i === 1 ? (
        <StepPrompt prompt={withPrompts[0]?.prompt ?? placeholder} chips={chips.slice(1)} />
      ) : visual.length ? (
        <StepResult sample={visual[1] ?? visual[0]} m={m} from={d.fromCredits} />
      ) : (
        <div className="mx-auto h-[220px]" style={{ aspectRatio: "4 / 5" }}>
          <SpecTile kind={m.type === "audio" ? "voice" : "price"} m={m} f={f} from={d.fromCredits} samples={samples} />
        </div>
      ),
  }));

  return (
    <main className="bg-black text-white">
      {/* 2026-11-19 Monica:落地页都是一级页面，不放面包屑和页内目录条 */}
      {audioKind ? (
        <div id="overview" className="scroll-mt-28">
          <AudioLanding
            slug={m.slug}
            kind={audioKind}
            title={m.name}
            lead={lead}
            chip={comingChip}
            cta={{ label: isNew ? "Start free" : "Create now", onClick: enter }}
            price={d.fromCredits !== undefined ? `${d.fromCredits} credits / s` : undefined}
            model={m.name}
            tags={supportsTags(m.slug)}
            onPrompt={setPrompt}
          />
        </div>
      ) : (
      <div id="overview" className="scroll-mt-28">
          <OAHero
          onPrompt={setPrompt}
            /* 2026-11-19 Monica:去掉「厂商 · 模型类型」标签;还没上线的模型保留一个「Coming next release」提示 */
            chip={
              isNew && (
                <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.07] px-3.5 py-1.5 text-[13px] font-semibold text-[#E8E8E8] ring-1 ring-white/10">
                  <span className="size-1.5 rounded-full bg-[#FFA73C]" />
                  Coming next release
                </span>
              )
            }
            /* 2026-11-19 Monica:大标题只放模型名。「AI Image Generator」这类关键词保留在 <title>、meta 描述和首句说明里(d.h1 仍用于 metaTitle) */
            title={m.name}
            /* 2026-11-19 Monica:首屏不讲 credits / 美元成本(价格在下面的 Specs & pricing 和 FAQ 里) */
            lead={HERO_LEADS[m.slug] ?? d.definition.replace(/\s*On BuzzVideo it starts at .*$/, "")}
            pics={hero}
            box={
              <OAPromptBox onSubmit={enter}>
                <label htmlFor="hero-prompt" className="sr-only">
                  Prompt for {m.name}
                </label>
                <textarea
                  id="hero-prompt"
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={placeholder}
                  className="thin-scroll-dark w-full resize-none bg-transparent px-1 text-[15.5px] leading-relaxed text-white placeholder:text-[#9F9F9F] focus:outline-none"
                />
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {chips.map((c, i) => (
                    <span key={c} className={`rounded-full px-3 py-1.5 text-[12.5px] font-semibold ${i === 0 ? "bg-white text-[#240A03]" : "bg-white/[0.08] text-[#CACACA]"}`}>
                      {c}
                    </span>
                  ))}
                  <span className="ml-auto flex items-center gap-3">
                    {d.fromCredits !== undefined && <span className="text-[13px] font-semibold tabular-nums text-[#CACACA]">{m.type === "audio" ? `${d.fromCredits} credits / s` : d.fromSingle ? `${d.fromCredits} credits · ${d.fromSingle}` : `From ${d.fromCredits} credits`}</span>}
                    <button type="submit" className={OA_CTA}>
                      {isNew ? "Start free" : "Create now"} <ArrowUp className="size-4" />
                    </button>
                  </span>
                </div>
              </OAPromptBox>
            }
          />
        </div>
      )}

      {/* ── 示例与提示词(吃「X prompt / prompt examples」);没有成片就只放写法要点 + 模板 ── */}
      {!audioKind && own.length > 0 && (
        <OAExamples
          title={`Explore ${m.name} examples and prompts`}
          sub={`Every example below was generated with ${m.name} on BuzzVideo. Hover to read the prompt, then try it or write your own.`}
          tabs={[{ label: m.name, pics: own }]}
          onUse={(p) => {
            setPrompt(p);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}
      <OAPanel id="prompts" title={`How to write a ${m.name} prompt`}>
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <ol className="space-y-4">
            {d.promptTips.map((t, i) => (
              <li key={t} className="flex gap-4 text-[16.5px] leading-relaxed">
                <span className="w-7 shrink-0 text-[20px] font-extrabold tabular-nums text-[#FF744D]">{i + 1}</span>
                <span className="text-[#E8E8E8]">{t}</span>
              </li>
            ))}
          </ol>
          <div className="space-y-3">
            {(withPrompts.length ? withPrompts.slice(0, 2) : []).map((s) => (
              <div key={s.src} className="rounded-[20px] bg-white/[0.05] p-5 ring-1 ring-white/[0.08]">
                <p className="line-clamp-5 whitespace-pre-line text-[14.5px] leading-relaxed text-[#E8E8E8]">{s.prompt}</p>
                <div className="mt-4 flex justify-end">
                  <CopyBtn text={s.prompt} />
                </div>
              </div>
            ))}
            {withPrompts.length === 0 && (
              <div className="rounded-[20px] bg-white/[0.05] p-6 ring-1 ring-white/[0.08]">
                <p className="text-[13px] font-semibold text-[#9F9F9F]">Prompt template</p>
                <p className="mt-3 text-[16px] leading-relaxed text-[#E8E8E8]">
                  {m.type === "video"
                    ? `[Subject] [does what] in [setting]. [Camera move], [light and mood]. ${f?.durations ? `${Math.min(10, f.durations[1])} s, ` : ""}${f?.ratios?.find((r) => /9:16/.test(r)) ? "9:16" : "16:9"}.`
                    : m.type === "image"
                      ? `[Product] on [surface] in [setting], [light], [framing]. Text on the image: "[headline]". Keep the label exactly the same.`
                      : f?.audioKind === "music"
                        ? "[Genre] track, [mood], [tempo], about [length]. For a [product] ad."
                        : f?.audioKind === "sound effects"
                          ? "A [short / long] [sound] for a [moment], [dry / with room echo]."
                          : "Read this in a [warm, friendly] voice, [pace]: [script]"}
                </p>
              </div>
            )}
          </div>
        </div>
      </OAPanel>

      {rows.length > 0 && <OAFeatureRows id="features" title={`Key ${m.name} features`} sub={`What ${m.name} can do on BuzzVideo, from its model settings. You see the credit price before you create.`} rows={rows} />}

      {!audioKind && <OADrench
        ways={{ title: `More ways to create with ${TYPE_TITLE[m.type].replace(/ models$/, "").toLowerCase()} AI`, cards: ways }}
        models={{ title: `More ${TYPE_TITLE[m.type].toLowerCase()} on BuzzVideo`, sub: `One account, every leading ${m.type} model. Pick the one that fits the job; prices are per generation.`, cards: modelCards }}
      />}

      {/* ── 规格 + 价格(GEO 最爱的结构化事实) ── */}
      <OAPanel id="specs" title={`${m.name} specs and pricing`} sub={d.priceNote}>
        <div id="pricing" className="grid scroll-mt-28 gap-4 lg:grid-cols-2">
          <dl className="rounded-[24px] bg-white/[0.05] p-6 ring-1 ring-white/[0.08] md:p-8">
            {d.facts.map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-6 border-b border-white/10 py-3.5 last:border-0">
                <dt className="text-[14px] text-[#9F9F9F]">{k}</dt>
                <dd className="text-right text-[15.5px] font-bold">{v}</dd>
              </div>
            ))}
            {f?.notes && f.notes.length > 0 && (
              <ul className="mt-4 list-disc space-y-1.5 pl-5 text-[14.5px] leading-relaxed text-[#CACACA] marker:text-[#FF744D]">
                {f.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            )}
          </dl>
          <div className="rounded-[24px] bg-white/[0.05] p-6 ring-1 ring-white/[0.08] md:p-8">
            {d.prices.length > 0 ? (
              <table className="w-full text-left tabular-nums">
                <caption className="sr-only">{m.name} credits per generation</caption>
                <thead>
                  <tr className="border-b border-white/30 text-[13.5px]">
                    <th scope="col" className="pb-3 pr-4 font-bold">
                      Setting
                    </th>
                    <th scope="col" className="px-4 pb-3 text-right font-bold">
                      Credits
                    </th>
                    <th scope="col" className="pb-3 pl-4 text-right font-bold">
                      ≈ on Pro yearly
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {d.prices.map((p) => (
                    <tr key={p.label} className="border-b border-white/10 last:border-0">
                      <th scope="row" className="py-3.5 pr-4 text-[15px] font-bold">
                        {p.label}
                      </th>
                      <td className="px-4 py-3.5 text-right text-[22px] font-extrabold tracking-[-0.02em]">{p.credits.toLocaleString("en-US")}</td>
                      <td className="py-3.5 pl-4 text-right text-[13.5px] text-[#9F9F9F]">${usdOf(p.credits)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-[16px] leading-relaxed text-[#CACACA]">{isNew ? "Credit prices appear here and in the generator at launch." : "The exact price shows in the generator before you press Create."}</p>
            )}
            <a {...a("Pricing", "/pricing")} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-[15px] font-bold text-[#240A03] transition hover:bg-[#FFF3EC]">
              See plans <ArrowRight className="size-4" />
            </a>
          </div>
        </div>
      </OAPanel>

      <OASteps title={`How to use ${m.name}`} steps={steps} />
      <OAFeatureRows id="good-for" tone="light" title={`Best uses for ${m.name}`} rows={uses} />

      {/* ── 对比：搜索里最常一起比的同类模型 ── */}
      {d.matchup.length > 1 && (
        <OAPanel id="compare" title={`${m.name} vs ${d.matchup.slice(1).map((x) => x.m.name).join(" vs ")}`} sub="Choose the right model for the job.">
          <div className={`grid gap-4 ${d.matchup.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
            {d.matchup.map(({ m: x, rows: r }) => {
              const self = x.slug === m.slug;
              return (
                <div key={x.slug} className={`rounded-[24px] p-6 md:p-7 ${self ? "bg-[#FF744D] text-[#240A03]" : "bg-white/[0.05] ring-1 ring-white/[0.08]"}`}>
                  <p className={`text-[13px] font-semibold ${self ? "text-[#240A03]/75" : "text-[#9F9F9F]"}`}>{r.Developer}</p>
                  <h3 className="mt-1 text-[24px] font-extrabold tracking-[-0.02em]">
                    {self ? (
                      x.name
                    ) : (
                      <a {...a(x.name, modelHref(x.slug))} className="underline decoration-white/25 decoration-2 underline-offset-4 hover:decoration-[#FF744D]">
                        {x.name}
                      </a>
                    )}
                  </h3>
                  <p className={`mt-2 text-[15px] leading-relaxed ${self ? "" : "text-[#CACACA]"}`}>{r["Best for"]}</p>
                  <dl className={`mt-5 divide-y border-t ${self ? "divide-[#240A03]/15 border-[#240A03]/15" : "divide-white/10 border-white/10"}`}>
                    {d.matchupRows
                      .filter((k) => k !== "Developer" && k !== "Best for")
                      .map((k) => (
                        <div key={k} className="flex items-baseline justify-between gap-4 py-3">
                          <dt className={`text-[14px] ${self ? "text-[#240A03]/75" : "text-[#9F9F9F]"}`}>{k}</dt>
                          <dd className="text-right text-[15px] font-bold tabular-nums">{r[k]}</dd>
                        </div>
                      ))}
                  </dl>
                </div>
              );
            })}
          </div>
        </OAPanel>
      )}

      <OAFaq items={d.faq} />
      <OABlog posts={postsFor(m.type)} all={a("Blog", "/blog", "live")} link={(p) => a(p.title, p.href, "live")} />
      {/* 2026-11-25 Monica:Footer 去掉 All Models,改在每个模型落地页这里放「Explore all models」;并进主型号页的模型不单列(会和主型号重复) */}
      <OAChips
        title={`Explore ${TYPE_TITLE[m.type].toLowerCase()}`}
        chips={siblings.filter((x) => !MERGED[x.slug]).slice(0, 20).map((x) => ({ label: x.name, link: a(x.name, modelHref(x.slug)) }))}
        more={{ label: "Explore all models", link: a("All Models", "/models") }}
      />
      <OACta title={`Start creating with ${m.name}`} sub="Use it and every other leading model on one BuzzVideo account." cta={{ label: isNew ? "Get started for free" : `Try ${m.name}`, link: toTool }} />

      {/* 2026-11-25 Monica:「落地页都不要放这个」—— 页面底部不再显示数据来源说明;外部来源仍留在结构化数据里 */}
      <div className="pb-14" />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: m.name,
              alternateName: d.h1,
              creator: { "@type": "Organization", name: m.vendor },
              applicationCategory: "MultimediaApplication",
              operatingSystem: "Web",
              description: d.definition,
              dateModified: CONTENT_UPDATED,
              publisher: { "@type": "Organization", name: "BuzzVideo AI", url: "https://buzzvideo.ai" },
              /* 价格挂在套餐上(Starter 起 $14 / 月),不输出 credits 折算出来的零点几美分 */
              ...(!isNew ? { offers: { "@type": "Offer", url: "https://buzzvideo.ai/pricing", priceCurrency: "USD", price: "14.00", description: `BuzzVideo Starter plan; ${m.name} uses credits${d.fromCredits !== undefined ? `, from ${d.fromCredits} per generation` : ""}` } } : {}),
            },
            {
              "@context": "https://schema.org",
              "@type": "HowTo",
              name: `How to use ${m.name} on BuzzVideo`,
              step: d.howTo.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.title, text: s.body })),
            },
            { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: d.faq.map((q) => ({ "@type": "Question", name: q.q, acceptedAnswer: { "@type": "Answer", text: q.a } })) },
            ...(d.matchup.length > 1
              ? [
                  {
                    "@context": "https://schema.org",
                    "@type": "ItemList",
                    name: `${m.name} vs ${d.matchup.slice(1).map((x) => x.m.name).join(" vs ")}`,
                    itemListElement: d.matchup.map((x, i) => ({ "@type": "ListItem", position: i + 1, name: x.m.name, url: `https://buzzvideo.ai${modelHref(x.m.slug)}` })),
                  },
                ]
              : []),
            ...samples
              .filter((s) => s.kind !== "audio")
              .map((s) => ({
                "@context": "https://schema.org",
                "@type": s.kind === "video" ? "VideoObject" : "ImageObject",
                name: s.alt,
                description: `Made with ${m.name} on BuzzVideo.${s.prompt ? ` Prompt: ${sentenceCut(s.prompt.replace(/\s+/g, " "), 300)}` : ""}`,
                contentUrl: s.src.startsWith("http") ? s.src : `https://buzzvideo.ai${s.src}`,
                ...(s.kind === "video" ? { thumbnailUrl: s.poster ? (s.poster.startsWith("http") ? s.poster : `https://buzzvideo.ai${s.poster}`) : undefined, uploadDate: s.src.match(/20\d\d-\d\d-\d\d/)?.[0] ?? "2026-11-19" } : {}),
                creator: { "@type": "Organization", name: "BuzzVideo AI" },
              })),
          ]),
        }}
      />
    </main>
  );
}
