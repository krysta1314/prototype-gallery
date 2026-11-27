"use client";

/* 指南 / 对比 / 模型总页共用的小部件(2026-11-19)。版式沿用 ../oa/kit 的黑底 + #FF744D + #F6F6F6 浅底段。
   首屏不放拼贴：大标题 + 两句话 + 按钮，下面接一对大成片或一张表(Monica:这类页面用大图对 / 表代替拼贴)。
   成片只用真实素材(model-media / Kling 4.0 手写模型页),文字都在画面外，不压主体。 */

import { useState, type ReactNode } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { appOf, go, type OnLink } from "../../site-nav/SiteNavHeader";
import { statusOf } from "../../site-nav/nav-data";
import { MODELS, type ModelEntry } from "../../site-nav/models-catalog";
import { factsOf } from "../models/model-facts";
import { modelHref, modelPageData, type PriceRow } from "../models/model-content";
import { mediaOf, type Sample } from "../models/model-media";
import { KLING_4 } from "../../model-page/model-data";
import { CopyBtn, OA_CTA, OA_H2, OA_WRAP, PicView } from "../oa/kit";
import type { Pic } from "../oa/pool";
import type { Pick, Source } from "./content";
import { resolveHref } from "../redirects";

export const VERIFIED = "November 19, 2026";
export const VERIFIED_SHORT = "Nov 2026";

export const modelOf = (slug: string) => MODELS.find((m) => m.slug === slug);

/* ── 链接：站内走 go(没做的给 toast),站外新窗口 ── */
export function useLinks(onLink: OnLink) {
  const a = (label: string, rawHref: string, href = resolveHref(rawHref)) =>
    /^https?:/.test(href)
      ? { href, target: "_blank", rel: "noopener noreferrer", onClick: () => {} }
      : {
          href,
          onClick: (e: React.MouseEvent) => {
            e.preventDefault();
            go(href, statusOf(href), label, onLink);
          },
        };
  /* 进产品生成器(选好模型);带提示词时替换掉 appOf 默认带的那条 */
  const open = (slug: string, label: string, prompt?: string) => {
    const base = appOf(modelHref(slug));
    if (!base) return go(modelHref(slug), statusOf(modelHref(slug)), label, onLink);
    if (!prompt) return void (window.location.href = base);
    const u = new URL(base, window.location.origin);
    u.searchParams.set("prompt", prompt);
    window.location.href = /^https?:/.test(base) ? u.toString() : u.pathname + u.search;
  };
  const tryLink = (slug: string, label: string, prompt?: string) => ({
    href: modelHref(slug),
    onClick: (e: React.MouseEvent) => {
      e.preventDefault();
      open(slug, label, prompt);
    },
  });
  return { a, open, tryLink };
}

/* ── 真实成片(带提示词)── */
export type Ex = Sample & { model: string; modelSlug: string; caption: string; promptLabel?: string };

const K = (video: string, poster: string, ratio: string, alt: string, caption: string, prompt = "", promptLabel?: string): Ex => ({
  kind: "video",
  src: video,
  poster,
  aspect: ratio.replace("/", ":"),
  alt,
  caption,
  prompt,
  promptLabel,
  source: "model-page/model-data.ts (Kling 4.0)",
  model: "Kling 4.0",
  modelSlug: "kling-4-0",
});

export function examplesOf(slug: string): Ex[] {
  const m = modelOf(slug);
  if (!m) return [];
  /* Kling 4.0:成片和提示词模板在手写模型页的数据里 */
  if (slug === "kling-4-0") {
    const ex = KLING_4.examples[0];
    return [
      K(KLING_4.hero.video, KLING_4.hero.poster, KLING_4.hero.ratio, "A one-take UGC ad made with Kling 4.0", KLING_4.heroCaption),
      ...(ex ? [K(ex.media.video, ex.media.poster, ex.media.ratio, ex.title, ex.caption, ex.prompt?.text ?? "", ex.prompt?.label)] : []),
      /* 2026-11-27 Monica:「不要用我们内部的展示片」→ 功能点那两条(30 秒 / Omni Reference)是内部宣讲片的动效画面，不再当成片用;改用 Kling 4.0 真实跑出来的样片(带提示词) */
      ...mediaOf(slug).map((x) => ({ ...x, model: m.name, modelSlug: slug, caption: x.alt })),
    ];
  }
  const own = mediaOf(slug).map((s) => ({ ...s, model: m.name, modelSlug: slug, caption: s.alt }));
  /* Nano Banana Pro 的三张图和 Nano Banana 2.1 用的是同一条提示词(博客 #58 对比测试,两边同提示词各跑一次) */
  if (slug === "nano-banana-pro") {
    const nb21 = mediaOf("nano-banana-2-1");
    return own.map((s) => {
      const key = s.src.split("/").pop()?.replace(/^pro_/, "");
      const twin = nb21.find((x) => x.src.endsWith(`/${key}`));
      return twin?.prompt ? { ...s, prompt: twin.prompt, promptLabel: "Prompt (the same prompt was also run on Nano Banana 2.1)" } : s;
    });
  }
  return own;
}

/* ── 首屏：黑底大标题 + 两句话 + 按钮;下面放大成片对 / 表 ── */
export function GuideHero({ chip, title, lead, actions, children }: { chip?: ReactNode; title: string; lead: string; actions?: ReactNode; children?: ReactNode }) {
  return (
    <section className="relative isolate overflow-hidden pb-16 pt-14 md:pb-24 md:pt-24">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-[-240px] -z-10 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[#FF744D]/[0.16] blur-[120px]" />
      <div className={`${OA_WRAP} text-center`}>
        {chip && <div className="flex justify-center">{chip}</div>}
        <h1 className={`mx-auto max-w-[min(1200px,94vw)] font-black uppercase leading-[0.95] tracking-[-0.035em] [text-wrap:balance] text-[clamp(40px,calc(30px+3.4vw),92px)] ${chip ? "mt-8" : ""}`}>{title}</h1>
        <p className="mx-auto mt-6 max-w-[680px] text-[16px] leading-[26px] text-white/75 [text-wrap:pretty]">{lead}</p>
        {actions && <div className="mt-8 flex flex-wrap items-center justify-center gap-3">{actions}</div>}
      </div>
      {children && <div className={`${OA_WRAP} mt-14 md:mt-16`}>{children}</div>}
    </section>
  );
}

export function HeroChip({ children, link }: { children: ReactNode; link?: { href: string; onClick: (e: React.MouseEvent) => void } }) {
  const cls = "inline-flex items-center gap-2 rounded-full bg-white/[0.07] px-3.5 py-1.5 text-[13px] font-semibold text-[#E8E8E8] ring-1 ring-white/10";
  return link ? (
    <a {...link} className={`${cls} transition hover:bg-white/[0.12]`}>
      <span className="size-1.5 rounded-full bg-[#FF744D]" />
      {children}
      <ArrowRight className="size-3.5" />
    </a>
  ) : (
    <span className={cls}>
      <span className="size-1.5 rounded-full bg-[#FF744D]" />
      {children}
    </span>
  );
}

export const GHOST_BTN = "inline-flex items-center justify-center gap-2 rounded-xl bg-white/[0.08] px-5 py-3 text-[15px] font-bold text-white transition hover:bg-white/15";

/* 大成片对：两张并排，标签在画面下方 */
export function MediaPair({ items, onUse }: { items: { pic: Pic | Ex; label: string; sub?: string }[]; onUse?: (prompt: string) => void }) {
  return (
    <div className={`grid gap-4 ${items.length > 1 ? "md:grid-cols-2" : "mx-auto max-w-[720px]"}`}>
      {items.map((x) => (
        <figure key={x.pic.src}>
          {/* 两张并排时用同一个画框比例(4:3),画面按原比例放在框内，左右等宽、上下对齐 */}
          <div className="group relative flex max-h-[640px] items-center justify-center overflow-hidden rounded-[24px] bg-[#111] ring-1 ring-white/10" style={{ aspectRatio: items.length > 1 ? "4 / 3" : aspectOf(x.pic.aspect, 1.6) }}>
            <PicView p={x.pic} cover={false} />
            {/* 2026-11-27 Monica:「这两个应该也有 prompt」→ 和示例区卡片同一套：悬停露出提示词 + Try this prompt + Copy */}
            {x.pic.prompt && (
              <div className="absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-black/90 via-black/65 to-transparent p-5 pt-20 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
                <p className="line-clamp-4 text-[13.5px] leading-relaxed text-white/90">{x.pic.prompt}</p>
                <div className="mt-3 flex gap-2">
                  {onUse && (
                    <button type="button" onClick={() => onUse(x.pic.prompt!)} className="rounded-lg bg-white px-3 py-2 text-[12.5px] font-bold text-[#240A03] transition hover:bg-[#FFF3EC]">
                      Try this prompt
                    </button>
                  )}
                  <CopyBtn text={x.pic.prompt} />
                </div>
              </div>
            )}
          </div>
          <figcaption className="mt-3 flex flex-wrap items-baseline gap-x-2 text-[14px]">
            <span className="font-bold text-white">{x.label}</span>
            {x.sub && <span className="text-[#9F9F9F]">{x.sub}</span>}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

const ratioOf = (a?: string) => {
  const [w, h] = (a ?? "1:1").split(":").map(Number);
  return w && h ? w / h : 1;
};
const aspectOf = (a?: string, max = 1.8) => `${Math.min(max, Math.max(0.5625, ratioOf(a)))}`;

/* ── 成片 + 完整提示词卡：复制 / 带提示词进生成器 ── */
export function ExampleCard({ ex, onTry, openLink }: { ex: Ex; onTry: (ex: Ex) => void; openLink: { href: string; onClick: (e: React.MouseEvent) => void } }) {
  const [open, setOpen] = useState(false);
  const long = ex.prompt.length > 420;
  const vertical = ratioOf(ex.aspect) < 1;
  return (
    <article className={`grid gap-6 rounded-[24px] bg-white/[0.04] p-4 ring-1 ring-white/[0.08] md:p-5 ${vertical ? "md:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]" : "md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]"}`}>
      <div className="mx-auto w-full max-w-[520px] overflow-hidden rounded-[18px] bg-[#111]" style={{ aspectRatio: aspectOf(ex.aspect) }}>
        <PicView p={ex} />
      </div>
      <div className="flex min-w-0 flex-col">
        <p className="text-[12.5px] font-bold uppercase tracking-[0.08em] text-[#FF744D]">Made with {ex.model} on BuzzVideo</p>
        <h3 className="mt-2 text-[19px] font-extrabold leading-snug">{ex.caption}</h3>
        {ex.prompt ? (
          <>
            <p className="mt-5 text-[12.5px] font-semibold text-[#9F9F9F]">{ex.promptLabel ?? "Prompt used"}</p>
            <div className="relative mt-2">
              <p className={`whitespace-pre-wrap break-words rounded-[14px] bg-black/50 p-4 text-[13.5px] leading-relaxed text-[#E8E8E8] ring-1 ring-white/[0.06] ${long && !open ? "max-h-[220px] overflow-hidden" : ""}`}>{ex.prompt}</p>
              {long && !open && <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-16 rounded-b-[14px] bg-gradient-to-t from-black to-transparent" />}
            </div>
            {long && (
              <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="mt-2 self-start text-[13px] font-semibold text-white underline decoration-[#FF744D] decoration-2 underline-offset-4">
                {open ? "Show less" : "Show full prompt"}
              </button>
            )}
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" onClick={() => onTry(ex)} className={`${OA_CTA} px-4 py-2.5 text-[14px]`}>
                Try this prompt <ArrowUpRight className="size-4" />
              </button>
              <CopyBtn text={ex.prompt} />
            </div>
          </>
        ) : (
          <div className="mt-5">
            <a {...openLink} className={GHOST_BTN}>
              Try {ex.model} <ArrowUpRight className="size-4" />
            </a>
          </div>
        )}
      </div>
    </article>
  );
}

/* ── 黑底数据表：手机上横向滚动 ── */
export function DataTable({ head, rows, firstColLabel = "", highlight }: { head: ReactNode[]; rows: { label: string; cells: ReactNode[] }[]; firstColLabel?: string; highlight?: number }) {
  return (
    <div className="overflow-x-auto rounded-[20px] ring-1 ring-white/10 [scrollbar-width:thin]">
      <table className="w-full min-w-[560px] border-collapse text-left text-[14.5px]">
        <thead>
          <tr className="bg-white/[0.06]">
            <th scope="col" className="w-[180px] px-5 py-4 text-[13px] font-semibold text-[#9F9F9F]">
              {firstColLabel}
            </th>
            {head.map((h, i) => (
              <th key={i} scope="col" className={`px-5 py-4 text-[15px] font-extrabold text-white ${highlight === i ? "bg-[#FF744D]/[0.14]" : ""}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-t border-white/[0.08]">
              <th scope="row" className="px-5 py-4 align-top text-[13.5px] font-semibold text-[#CACACA]">
                {r.label}
              </th>
              {r.cells.map((c, i) => (
                <td key={i} className={`px-5 py-4 align-top tabular-nums text-white ${highlight === i ? "bg-[#FF744D]/[0.06]" : ""}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── 规格(只用 model-facts / catalog / 定价接口)── */
const fmtRes = (r: string) => r.replace(/^(\d+)P$/, "$1p").replace(/^std$/i, "Standard").replace(/^pro$/i, "Pro");
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;
const KIND_LABEL: Record<string, string> = { voiceover: "Voiceover", "voice clone": "Voice cloning", music: "Music", "sound effects": "Sound effects", "all-in-one": "Voiceover, music and sound effects" };

export function specOf(slug: string): Record<string, string> {
  const m = modelOf(slug);
  if (!m) return {};
  const f = factsOf(slug);
  const d = modelPageData(slug);
  const live = m.release === "live";
  const from = d?.fromCredits;
  const r = f?.refs;
  const row: Record<string, string> = { Developer: m.vendor };
  if (m.type === "audio") {
    row["Where you use it"] = "BuzzVideo";
    row.Status = live ? "Live on BuzzVideo" : "Coming in the next BuzzVideo release";
    row["What it makes"] = f?.audioKind ? KIND_LABEL[f.audioKind] : "Audio";
    row.Details = f?.notes?.join(" ") || m.desc;
    row["Free option"] = slug === "seed-audio-1-0" ? "Works with the free sign-up credits" : "Free sign-up credits don't apply";
    row["Price on BuzzVideo"] = live ? (slug === "seed-audio-1-0" ? "0.5 credits per second" : from ? `From ${from} credits` : "Shown before you create") : "Confirmed at launch";
    return row;
  }
  row.Status = live ? "Live on BuzzVideo" : "Coming in the next BuzzVideo release";
  if (m.type === "video") {
    if (f?.durations) row["Clip length"] = `${f.durations[0]}–${f.durations[1]} s`;
    if (f?.resolutions?.length) row.Resolution = f.resolutions.map(fmtRes).join(", ");
    if (f?.ratios?.length) row["Aspect ratios"] = f.ratios.join(", ");
    row.References = r && (r.images || r.videos || r.audios) ? [r.images && plural(r.images, "image"), r.videos && plural(r.videos, "video"), r.audios && plural(r.audios, "audio clip")].filter(Boolean).join(", ") : "—";
    row["Native audio"] = f ? (f.soundOff ? "Yes, can be turned off" : "Yes, always on") : "—";
  } else {
    const q = f?.resolutions?.some((x) => /low|high|max/i.test(x));
    if (f?.resolutions?.length) row[q ? "Quality levels" : "Resolution"] = f.resolutions.join(", ");
    else row.Resolution = "—";
    if (f?.ratios?.length) row["Aspect ratios"] = `${f.ratios.length}: ${f.ratios.join(", ")}`;
    row["Reference images"] = r?.images ? String(r.images) : "—";
  }
  if (f?.notes?.length) row.Notes = f.notes.join(" ");
  row.Plans = live ? d?.plans ?? "—" : "Confirmed at launch";
  row["Starting price"] = from !== undefined ? `${from} credits${d?.prices.find((p) => p.credits === from) ? ` (${d.prices.find((p) => p.credits === from)!.label})` : ""}` : live ? "Shown before you create" : "Confirmed at launch";
  return row;
}

/* 规格表：多个模型 + 可选竞品列 + 额外行 */
export function SpecTable({ slugs, external, extraRows, a, highlight }: { slugs: string[]; external?: { name: string; values: Record<string, string> }; extraRows?: { label: string; values: Record<string, string> }[]; a: (l: string, h: string) => object; highlight?: number }) {
  const cols = slugs.map((s) => ({ m: modelOf(s)!, v: specOf(s) })).filter((c) => c.m);
  if (external && cols[0]?.m.type === "audio") cols.forEach((c) => (c.v.Models = c.m.name));
  const keys: string[] = [];
  for (const c of cols) for (const k of Object.keys(c.v)) if (!keys.includes(k)) keys.push(k);
  if (external) for (const k of Object.keys(external.values)) if (!keys.includes(k)) keys.push(k);
  /* 类型不同的列(如 Plans 放最后)保持在价格前 */
  const order = (k: string) => (k === "Starting price" || k === "Price on BuzzVideo" ? 2 : k === "Plans" ? 1 : 0);
  keys.sort((x, y) => order(x) - order(y));
  const head: ReactNode[] = [
    ...cols.map((c) => (
      <a key={c.m.slug} {...a(c.m.name, modelHref(c.m.slug))} className="underline decoration-white/30 underline-offset-4 hover:decoration-[#FF744D]">
        {c.m.name}
      </a>
    )),
    ...(external ? [<span key="ext">{external.name}</span>] : []),
  ];
  const rows = [
    ...keys.map((k) => ({ label: k, cells: [...cols.map((c) => c.v[k] ?? "—"), ...(external ? [external.values[k] ?? "—"] : [])] })),
    ...(extraRows ?? []).map((r) => ({ label: r.label, cells: [...cols.map((c) => r.values[c.m.slug] ?? "—"), ...(external ? ["—"] : [])] })),
  ];
  return <DataTable head={head} rows={rows} highlight={highlight} />;
}

/* 价格对照：至少两个模型都有的档位;都没有重合时列出全部 */
const durOf = (l: string) => Number(l.match(/^(\d+) s/)?.[1] ?? NaN);
const resRank = (l: string) => {
  const r = l.split(" · ")[1] ?? l;
  const list = l.includes(" s · ") ? ["480p", "720p", "1080p", "4K"] : ["Low", "Medium", "High", "X-High", "Max", "1K", "2K", "4K"];
  const i = list.findIndex((x) => r.startsWith(x));
  return i < 0 ? 99 : i;
};
export function priceRowsOf(slugs: string[]) {
  const per = slugs.map((s) => ({ s, p: modelPageData(s)?.prices ?? ([] as PriceRow[]) }));
  const labels: string[] = [];
  for (const x of per) for (const p of x.p) if (!labels.includes(p.label)) labels.push(p.label);
  labels.sort((a, b) => (durOf(a) || 0) - (durOf(b) || 0) || resRank(a) - resRank(b));
  const shared = labels.filter((l) => per.filter((x) => x.p.some((p) => p.label === l)).length >= 2);
  const use = shared.length ? shared : labels;
  return use.map((l) => ({ label: l, cells: per.map((x) => x.p.find((p) => p.label === l)?.credits) }));
}

/* ── 「Which should you pick?」浅底表 ── */
export function PicksSection({ title, sub, picks, a }: { title: string; sub?: string; picks: Pick[]; a: (l: string, h: string) => object }) {
  return (
    <section id="picks" className="scroll-mt-28 bg-[#F6F6F6] py-20 text-[#240A03] md:py-28">
      <div className={OA_WRAP}>
        <h2 className={OA_H2}>{title}</h2>
        {sub && <p className="mt-5 max-w-[46rem] text-[18px] leading-[28px] text-[#240A03]/80">{sub}</p>}
        <ul className="mt-12 divide-y divide-[#240A03]/10 overflow-hidden rounded-[24px] bg-white shadow-[0_24px_60px_rgba(36,10,3,0.08)]">
          {picks.map((p) => (
            <li key={p.job} className="grid gap-2 px-6 py-5 md:grid-cols-[1.1fr_0.8fr_1.4fr] md:items-baseline md:gap-6">
              <p className="text-[16px] font-bold">{p.job}</p>
              <p>
                <a {...a(p.pick, p.href)} className="inline-flex items-center gap-1 rounded-full bg-[#FFF3EC] px-3 py-1 text-[14px] font-bold text-[#240A03] transition hover:bg-[#FF744D]/20">
                  {p.pick} <ArrowRight className="size-3.5" />
                </a>
              </p>
              <p className="text-[15px] leading-relaxed text-[#240A03]/75">{p.why}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ── 短答案卡(GEO:一段能被单独引用的结论)── */
export function AnswerCard({ q, a }: { q: string; a: string }) {
  return (
    <section className="py-16 md:py-20">
      <div className={OA_WRAP}>
        <div className="rounded-[28px] bg-white/[0.04] p-7 ring-1 ring-white/[0.08] md:p-10">
          <h2 className="text-[clamp(24px,2.4vw,32px)] font-extrabold leading-tight">{q}</h2>
          <p className="mt-4 max-w-[60rem] text-[18px] leading-[30px] text-[#E8E8E8]">{a}</p>
        </div>
      </div>
    </section>
  );
}

/* ── 页脚说明：来源 + 核实日期 ── */
export function SourcesNote(_: { sources?: Source[]; extra?: string }) {
  /* 2026-11-25 Monica:「落地页都不要放这个」—— 页面底部不再显示数据来源说明;外部来源仍留在结构化数据里 */
  return <div className="pb-14" />;
}
export function SourcesNoteLegacy({ sources = [], extra }: { sources?: Source[]; extra?: string }) {
  return (
    <div className="mx-auto max-w-[1240px] px-4 pb-14 pt-4 text-[13px] leading-relaxed text-[#9F9F9F] sm:px-6">
      <p>
        Specs from BuzzVideo&apos;s model settings; credit prices from BuzzVideo&apos;s live pricing. Examples on this page were generated on BuzzVideo.{extra ? ` ${extra}` : ""} Last verified {VERIFIED}.
      </p>
      {sources.length > 0 && (
        <p className="mt-2">
          Public sources:{" "}
          {sources.map((s, i) => (
            <span key={s.url}>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white">
                {s.label}
              </a>{" "}
              ({s.url.replace(/^https?:\/\//, "")}, last verified {VERIFIED_SHORT}){i < sources.length - 1 ? "; " : "."}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}

export function JsonLd({ data }: { data: object[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
export const faqLd = (items: { q: string; a: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map((q) => ({ "@type": "Question", name: q.q, acceptedAnswer: { "@type": "Answer", text: q.a } })),
});
export const PUBLISHER = { "@type": "Organization", name: "BuzzVideo AI", url: "https://buzzvideo.ai" };
export const abs = (src?: string) => (src ? (src.startsWith("http") ? src : `https://buzzvideo.ai${src}`) : undefined);
export const mediaLd = (xs: Ex[]) =>
  xs
    .filter((x) => x.kind !== "audio")
    .slice(0, 6)
    .map((x) => ({
      "@context": "https://schema.org",
      "@type": x.kind === "video" ? "VideoObject" : "ImageObject",
      name: x.alt,
      description: `Made with ${x.model} on BuzzVideo.`,
      contentUrl: abs(x.src),
      ...(x.kind === "video" ? { thumbnailUrl: abs(x.poster), uploadDate: "2026-11-19" } : {}),
      creator: { "@type": "Organization", name: "BuzzVideo AI" },
    }));

export type { ModelEntry };
