"use client";

/* All Models 页的版式(2026-11-24 Monica:「我们本来就用 All Models 页面，把所有模型都放进这个页面」)。
   照线上 https://buzzvideo.ai/models 的版式复刻：面包屑 → MODEL LIBRARY 标签 → 大标题 → 一段介绍 → 一行统计 →
   按 Video / Image / Audio 分段的三列卡片(横幅图 + NEW / HOT 角标 + 厂商图标 + 名字 + 一句描述 + 能力标签)。
   线上只有 18 个模型(视频 10 + 图片 8);聚合页只有这一页，放 models-catalog 里的全部 60 个(= dev 后台启用的生成模型),多了音频一段。

   横幅图：线上 CDN 已经有卡片图的 26 个直接用(/buzzvideo/static/models/cards/card-<slug>.webp,2026-11-24 逐个探测过);
   其余 34 个(v1.13 上新的和全部音频模型)线上还没出图，先用同一套版式的色块横幅(厂商色 + 模型名),等设计出图后把 slug 加进 CARD_ART 即可。 */

import { useState, type CSSProperties } from "react";
import { MODELS, EXTRA_MODELS, allModelsOfType, type ModelEntry, type ModelType } from "../../site-nav/models-catalog";
import { modelLogo } from "../../site-nav/model-logos";
import { factsOf } from "./model-facts";
import { modelHref } from "./model-content";
import { MERGED } from "../redirects";
import { appOf } from "../../site-nav/SiteNavHeader";

const CDN = "https://assets.presslogic.com/cdn-cgi/image/width=640,quality=80,format=auto,fit=scale-down/buzzvideo/static/models/cards";
/** 线上已有卡片图的模型(slug → 线上文件名里的 slug,大多相同) */
const CARD_ART: Record<string, string> = Object.fromEntries(
  [
    "seedance-2-5", "seedance-2-5-flash", "seedance-2-0", "seedance-2-0-fast", "seedance-2-0-mini",
    "kling-4-0", "kling-3-0", "wan-3-0", "wan-3-0-prime", "minimax-h3", "minimax-h3-max", "gemini-omni-flash",
    "nano-banana-2-1", "nano-banana-pro", "nano-banana-2", "nano-banana-2-lite", "nano-banana",
    "gpt-image-2-5-sunburst", "gpt-image-2-5-flare", "gpt-image-2",
    "seedream-5-5", "seedream-5-0-pro", "seedream-5-0-lite", "seedream-4-5", "grok-imagine-2-0",
  ].map((s) => [s, s]),
);

/** 没有卡片图时横幅用的两个颜色(厂商色) */
const VENDOR: Record<string, { from: string; to: string }> = {
  ByteDance: { from: "#3B5BFF", to: "#8A5CF6" },
  Google: { from: "#2E7BF6", to: "#F2B92B" },
  OpenAI: { from: "#0E8F6E", to: "#B8D94A" },
  Kuaishou: { from: "#12B76A", to: "#1E88E5" },
  Alibaba: { from: "#FF6A00", to: "#FFB020" },
  MiniMax: { from: "#6D3BF5", to: "#E0489B" },
  "Black Forest Labs": { from: "#3A3A44", to: "#8B8B99" },
  xAI: { from: "#2B2B33", to: "#7A7A88" },
  Meta: { from: "#0866FF", to: "#39C6F4" },
  ShengShu: { from: "#0FA3B1", to: "#7BD389" },
  ElevenLabs: { from: "#2A2A30", to: "#A0A0AE" },
  HeyGen: { from: "#6C4CF5", to: "#22C1EE" },
  Microsoft: { from: "#1BA1E2", to: "#7FBA00" },
  "Kunlun Tech": { from: "#E0489B", to: "#FF8A3D" },
};

/** 能力标签：只按 model-facts 里的事实推，不编 */
function tagsOf(m: ModelEntry): string[] {
  const f = factsOf(m.slug);
  if (m.type === "video") {
    const t = ["text-to-video"];
    if (f?.refs?.images) t.push("image-to-video");
    if (f?.refs?.videos || (f?.refs?.images ?? 0) > 2) t.push("reference-to-video");
    return t;
  }
  if (m.type === "image") return f?.refs?.images ? ["text-to-image", "image-to-image"] : ["text-to-image"];
  const kind = f?.audioKind;
  if (kind === "all-in-one") return ["voiceover", "music", "sound effects"];
  return kind ? [kind] : ["audio"];
}

const SECTION_TITLE: Record<ModelType, string> = { video: "Video models", image: "Image models", audio: "Audio models" };
const TYPES: ModelType[] = ["video", "image", "audio"];

type Linker = (label: string, href: string) => { href: string; onClick: (e: React.MouseEvent) => void };

function Banner({ m }: { m: ModelEntry }) {
  const art = CARD_ART[m.slug];
  const v = VENDOR[m.vendor] ?? { from: "#3A3A44", to: "#8B8B99" };
  return (
    <div className="relative isolate aspect-video overflow-hidden rounded-t-[18px] bg-[#0b0a0e]">
      {art ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={`${CDN}/card-${art}.webp`} alt={`${m.name} sample output`} loading="lazy" className="size-full object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.05] motion-reduce:transition-none" />
      ) : (
        <div
          className="grid size-full place-items-center px-5 transition-transform duration-[600ms] ease-out group-hover:scale-[1.05] motion-reduce:transition-none"
          style={{ background: `radial-gradient(90% 120% at 15% 0%, ${v.to}cc, transparent 60%), radial-gradient(90% 120% at 100% 100%, ${v.from}, transparent 65%), linear-gradient(135deg, ${v.from}, #14121a 85%)` } as CSSProperties}
        >
          <span className="[font-family:var(--font-bricolage),sans-serif] text-center text-[clamp(22px,2.4vw,32px)] font-extrabold leading-[1.02] tracking-[-0.03em] text-white [text-shadow:0_2px_18px_rgba(0,0,0,0.35)] [text-wrap:balance]">{m.name}</span>
        </div>
      )}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-[linear-gradient(to_top,#0b0a0e,rgba(11,10,14,0.35)_55%,transparent)]" />
      {(m.release !== "live" || m.badge) && (
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase leading-none tracking-[0.08em] text-white ${
            m.release !== "live" ? "bg-[#FF744D]" : m.badge === "Hot" ? "bg-[#FF5255]" : "bg-[#6C4CF5]"
          }`}
        >
          {m.release !== "live" ? "Coming soon" : m.badge === "Hot" ? "Hot" : "New"}
        </span>
      )}
    </div>
  );
}

/** 有自己落地页的模型点进落地页;没有的(后台启用、但不单独做页，或并进主型号页的)直接进产品并选中该模型 */
const hasPage = (m: ModelEntry) => MODELS.some((x) => x.slug === m.slug) && !MERGED[m.slug];

function ModelCard({ m, a }: { m: ModelEntry; a: Linker }) {
  const logo = modelLogo(m);
  return (
    <li>
      <a
        {...(hasPage(m) ? a(m.name, modelHref(m.slug)) : { href: appOf(`/${m.slug}`) ?? "/prototypes/video-gen-modes/home" })}
        className="group relative flex h-full flex-col overflow-hidden rounded-[18px] border border-white/[0.06] bg-white/[0.02] transition-[transform,border-color,background-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-white/[0.14] hover:bg-white/[0.035] hover:shadow-[0_26px_60px_-26px_rgba(255,94,26,0.5)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      >
        <Banner m={m} />
        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-center gap-2.5">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white/[0.07]">
              {logo ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={logo.src} alt="" className={`size-4 object-contain ${logo.mono ? "invert" : ""}`} />
              ) : (
                <span className="text-[10px] font-bold text-white/70">{m.vendor.slice(0, 2)}</span>
              )}
            </span>
            <h3 className="min-w-0 truncate text-[16px] font-semibold text-white">{m.name}</h3>
          </div>
          <p className="mt-2.5 text-[14px] leading-relaxed text-white/60">{m.desc}.</p>
          <ul className="mt-auto flex flex-wrap gap-1.5 pt-4">
            {tagsOf(m).map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11.5px] font-medium text-white/65">
                <span aria-hidden className="size-1 rounded-full bg-[#8A7BFF]" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </a>
    </li>
  );
}

/** 一段：标题 + 数量 + 三列卡片 */
export function ModelSection({ type, a }: { type: ModelType; a: Linker }) {
  const list = allModelsOfType(type);
  return (
    <section id={type} aria-labelledby={`models-${type}`} className="scroll-mt-28">
      <div className="flex items-center gap-3">
        <h2 id={`models-${type}`} className="[font-family:var(--font-bricolage),sans-serif] text-[26px] font-extrabold tracking-[-0.03em] text-white">
          {SECTION_TITLE[type]}
        </h2>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[12px] font-semibold tabular-nums text-white/60">{list.length}</span>
        <span aria-hidden className="h-px flex-1 bg-white/[0.08]" />
      </div>
      <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((m) => (
          <ModelCard key={m.slug} m={m} a={a} />
        ))}
      </ul>
    </section>
  );
}


/** 页头 + 卡片段。模型聚合页只有这一页(2026-11-24 Monica:「模型聚合页就一页，这一页里面包含所有模型」):
    三类模型都在这页，上面的标签只在页内筛选，不跳到别的页面;所有卡片始终在 HTML 里(筛掉的只是隐藏),爬虫照样抓得到。 */
export function AllModels({ a }: { a: Linker }) {
  const [filter, setFilter] = useState<ModelType | "all">("all");
  const vendors = [...new Set([...MODELS, ...EXTRA_MODELS].map((m) => m.vendor))];
  return (
    <div className="relative isolate overflow-hidden bg-[#0d0c10] text-white">
      <div aria-hidden className="pointer-events-none absolute left-[18%] top-[-260px] -z-10 h-[560px] w-[820px] rounded-full bg-[#FF744D]/[0.13] blur-[130px]" />
      <div className="mx-auto max-w-[1200px] px-4 pb-20 pt-8 sm:px-6 md:pt-10">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[14px] text-white/55">
          <a {...a("Home", "/")} className="transition hover:text-white">
            Home
          </a>
          <span aria-hidden>›</span>
          <span className="text-white/80">Models</span>
        </nav>

        <header className="mt-8 md:mt-10">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
            <span aria-hidden className="size-1.5 rounded-full bg-[#FF744D]" />
            Model library
          </p>
          <h1 className="[font-family:var(--font-bricolage),sans-serif] mt-5 text-[clamp(44px,6vw,64px)] font-extrabold leading-[1.02] tracking-[-0.025em]">
            All <span className="text-[#FF744D]">Models</span>
          </h1>
          <p className="mt-5 max-w-[920px] text-[16.5px] leading-[1.65] text-white/60">
            Every AI video, image and audio model on BuzzVideo in one place: ByteDance Seedance and Seedream, Google Gemini and Nano Banana, OpenAI GPT Image, Kling, Wan, MiniMax, FLUX, ElevenLabs and more. Pick the right model for your next creative project.
          </p>
          <p className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13.5px] text-white/50">
            <span>
              <strong className="font-semibold text-white">{MODELS.length + EXTRA_MODELS.length}</strong> models
            </span>
            <span aria-hidden className="h-3.5 w-px bg-white/15" />
            <span>Video, image &amp; audio generation</span>
            <span aria-hidden className="hidden h-3.5 w-px bg-white/15 sm:block" />
            <span className="hidden sm:inline">{vendors.slice(0, 7).join(" · ")} · more</span>
          </p>
          <div role="tablist" aria-label="Filter models by type" className="mt-8 flex flex-wrap gap-2">
            {(["all", ...TYPES] as const).map((t) => {
              const active = t === filter;
              const label = t === "all" ? "All models" : SECTION_TITLE[t];
              const n = t === "all" ? MODELS.length + EXTRA_MODELS.length : allModelsOfType(t).length;
              return (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(t)}
                  className={`inline-flex h-9 items-center rounded-full px-4 text-[14px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF744D] ${active ? "bg-white text-[#240A03]" : "bg-white/[0.07] text-white hover:bg-white/[0.12]"}`}
                >
                  {label} <span className="ml-1.5 text-[12px] tabular-nums opacity-65">{n}</span>
                </button>
              );
            })}
          </div>
        </header>

        <div className="mt-14 space-y-16">
          {TYPES.map((t) => (
            <div key={t} hidden={filter !== "all" && filter !== t}>
              <ModelSection type={t} a={a} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
