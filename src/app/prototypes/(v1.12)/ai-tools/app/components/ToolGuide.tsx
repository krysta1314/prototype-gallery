/* 工具页 Guide 标签页里、首屏演示下面的落地页内容(2026-11-10,SEO / GEO)。文字全部来自 seo/content.ts;这里只管版式。
   版式是 Monica 2026-11-10 选定的「大色块落地页」(试过一版更素的，她要求改回这一版，不要再往素里改):
   一屏讲一件事，每屏长得不一样，图片当主角:
     ① 大标题 + 定义段，旁边是两格配图(Upscale 是同一处细节的 Before / After 特写，其他工具是输入和结果);
     ② 暖白色块：三步，每步一块产品界面片段;
     ③ 两组大幅前后对比，等高排开;
     ④ 深色块：用途，大字清单;
     ⑤ 规格表(左标签、右数值);
     ⑥ FAQ;
     ⑦ 品牌渐变色块的行动区(按钮直接打开文件选择框)+ 其他工具的链接。
   宽度跟着结果区走(容器查询),字号用 cqw 随栏宽缩放。
   所有文字直接写在 HTML 里(FAQ 用 <details>,收起时答案也在源码里);其他工具是真链接，在外壳里点了就地切换工具页。 */

import type { ReactNode } from "react";
import { ArrowRight, ArrowUpRight, AudioLines, Download, Film, ImagePlus, Plus, Upload } from "lucide-react";
import { TOOLS, type ToolKey } from "../sidebarMenus";
import type { GuideVisual, ToolGuide as Guide } from "../seo/content";
import { GUIDES } from "../seo/guides";
import { CompareSlider } from "./ResultCard";

const INK = "text-[#1a1a2e]";
const H2 = `scroll-mt-16 text-balance text-[clamp(25px,4.4cqw,38px)] font-extrabold leading-[1.12] tracking-[-0.022em] ${INK}`;
const SUB = "mt-3 max-w-[56ch] text-pretty text-[clamp(15px,1.9cqw,17px)] leading-[1.55] text-[#5b5c6e]";
const BODY = "text-pretty text-[15px] leading-[1.6] text-[#5b5c6e]";
const CTA =
  "inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-7 text-[16px] font-bold text-white shadow-[0_10px_30px_rgba(255,82,85,0.28)] outline-none transition hover:brightness-105 hover:shadow-[0_14px_38px_rgba(255,82,85,0.4)] focus-visible:ring-2 focus-visible:ring-[#c2410c] focus-visible:ring-offset-2";

/* 定义段旁边的两格配图(内容在 seo 配置里:Upscale 是同一处细节的 Before / After 特写，其他工具是输入和结果)。
   用 <img> 不用 CSS 背景(SEO 审核):背景图图片搜索看不到 */
function MediaTile({ src, label, alt }: { src: string; label: string; alt: string }) {
  return (
    <div className="relative aspect-[4/3] min-w-0 flex-1 overflow-hidden rounded-2xl bg-[#f1f2f5]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} width={640} height={480} loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />
      <span className="absolute left-2.5 top-2.5 rounded-full bg-[#1a1a2e]/70 px-2 py-[3px] text-[11px] font-semibold text-white">{label}</span>
    </div>
  );
}

const FILE_ICON = { image: ImagePlus, video: Film, audio: AudioLines };

/* 步骤的界面片段(已上传的素材卡 / 一排选项 / 结果缩略图 + 下载),内容在 seo 配置里;纯展示，读屏跳过 */
function StepVisual({ visual: v }: { visual: GuideVisual }) {
  return (
    <div aria-hidden className="flex h-[148px] select-none items-center justify-center rounded-2xl bg-white px-5 shadow-[0_4px_16px_rgba(26,26,46,0.06)]">
      {v.kind === "file" && (
        <div className="flex w-full max-w-[230px] items-center gap-3 rounded-xl border border-[#e1e3e9] bg-white p-2.5">
          {v.thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={v.thumb} alt="" loading="lazy" className="size-12 shrink-0 rounded-lg object-cover" />
          ) : (
            <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-[#fff3ec] text-[#ff5e1a]">
              {(() => {
                const Icon = FILE_ICON[v.icon ?? "image"];
                return <Icon className="size-5" strokeWidth={1.8} />;
              })()}
            </span>
          )}
          <div className="min-w-0 text-left">
            <p className={`truncate text-[13px] font-semibold ${INK}`}>{v.name}</p>
            <p className="truncate text-[12px] tabular-nums text-[#5b5c6e]">{v.meta}</p>
          </div>
        </div>
      )}
      {v.kind === "choice" && (
        <div className="w-full max-w-[230px]">
          {v.label && <p className={`mb-2 text-left text-[12px] font-semibold ${INK}`}>{v.label}</p>}
          <div className="grid gap-0.5 rounded-[10px] bg-[#f1f2f5] p-0.5 text-center text-[12.5px] font-semibold text-[#5b5c6e]" style={{ gridTemplateColumns: `repeat(${v.options.length}, minmax(0, 1fr))` }}>
            {v.options.map((o) => (
              <span key={o} className={`truncate px-1 py-1.5 ${o === v.selected ? `rounded-lg bg-white shadow-[0_1px_2px_rgba(26,26,46,0.12)] ${INK}` : ""}`}>{o}</span>
            ))}
          </div>
          {v.from && v.to && (
            <p className="mt-3 flex items-center justify-center gap-1.5 text-[12.5px] tabular-nums text-[#5b5c6e]">
              {v.from} <ArrowRight className="size-3" /> <span className={`font-semibold ${INK}`}>{v.to}</span>
            </p>
          )}
        </div>
      )}
      {v.kind === "slider" && (
        <div className="w-full max-w-[230px]">
          <p className={`mb-2.5 text-left text-[12px] font-semibold ${INK}`}>{v.label}</p>
          <div className="flex items-center gap-3">
            <div className="relative h-1 flex-1 rounded-full bg-[#ececf1]">
              <span className="absolute inset-y-0 left-0 rounded-full bg-[#ff5e1a]" style={{ width: `${v.percent}%` }} />
              <span className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#ff5e1a] bg-white" style={{ left: `${v.percent}%` }} />
            </div>
            <span className={`inline-flex h-8 min-w-[46px] items-center justify-center rounded-lg border border-[#e1e3e9] bg-white px-2 text-[12.5px] font-semibold tabular-nums ${INK}`}>
              {v.value}
              {v.unit && <span className="ml-0.5 font-medium text-[#5b5c6e]">{v.unit}</span>}
            </span>
          </div>
          {v.from && v.to && (
            <p className="mt-3 flex items-center justify-center gap-1.5 text-[12.5px] tabular-nums text-[#5b5c6e]">
              {v.from} <ArrowRight className="size-3" /> <span className={`font-semibold ${INK}`}>{v.to}</span>
            </p>
          )}
        </div>
      )}
      {v.kind === "result" && (
        <div className="flex w-full max-w-[230px] items-center gap-3">
          <div className="relative h-[84px] w-[112px] shrink-0 overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={v.after} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
            {v.before && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={v.before} alt="" loading="lazy" className="absolute inset-0 size-full object-cover [clip-path:inset(0_50%_0_0)]" />
                <span className="absolute inset-y-0 left-1/2 w-px bg-white" />
              </>
            )}
          </div>
          <span className={`inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#e1e3e9] bg-white px-3 text-[12.5px] font-semibold ${INK}`}>
            <Download className="size-3.5" /> {v.label}
          </span>
        </div>
      )}
    </div>
  );
}

/** 一屏。tone 决定底色：plain 白 / warm 暖白色块 / ink 深色块 / glow 品牌渐变色块(色块都是内缩的大圆角面板) */
function Band({ id, tone = "plain", children }: { id: string; tone?: "plain" | "warm" | "ink" | "glow"; children: ReactNode }) {
  const panel = {
    plain: "",
    warm: "rounded-[28px] bg-[#faf8f6] px-[clamp(20px,4.5cqw,48px)] py-[clamp(36px,6cqw,60px)]",
    ink: "rounded-[28px] bg-[#1a1a2e] px-[clamp(20px,4.5cqw,48px)] py-[clamp(36px,6cqw,60px)]",
    glow: "rounded-[28px] px-[clamp(20px,4.5cqw,48px)] py-[clamp(40px,7cqw,72px)] [background:linear-gradient(160deg,#ffe7d2_0%,#fff8f3_52%,#ffdedf_100%)]",
  }[tone];
  return (
    <section aria-labelledby={id} className={panel}>
      {children}
    </section>
  );
}

export function ToolGuide({ guide, onOpenTool, onStart }: { guide: Guide; onOpenTool?: (tool: ToolKey) => void; /** 页尾主按钮：开始用这个工具(Upscale Image 是打开文件选择框) */ onStart?: () => void }) {
  const { definition, steps, examples, uses, specs, faq, related, cta } = guide;
  /* 每屏标题的 id 带上工具名:外壳里打开过的工具页会一直挂着(只是藏起来),不带前缀的话一个文档里会有重复的 id */
  const ID = (name: string) => `${guide.tool}-guide-${name}`;
  return (
    <div className="@container mx-auto w-full max-w-[1040px] px-4 pb-10 pt-[clamp(40px,7vh,72px)] text-left sm:px-6">
      <div className="space-y-[clamp(56px,9cqw,104px)]">
        {/* ① 是什么：大标题 + 定义，旁边是细节特写 */}
        <Band id={ID("definition")}>
          <div className={`grid items-center gap-x-12 gap-y-8 ${definition.media ? "@3xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]" : ""}`}>
            <div>
              <h2 id={ID("definition")} className={H2}>{definition.heading}</h2>
              <p className={`mt-5 max-w-[54ch] text-pretty text-[clamp(16px,2.1cqw,18px)] font-medium leading-[1.55] ${INK}`}>{definition.lead}</p>
              <p className={`mt-4 max-w-[58ch] ${BODY}`}>{definition.body}</p>
            </div>
            {definition.media && (
              <figure>
                <div className="flex gap-2.5">
                  {definition.media.items.map((m) => (
                    <MediaTile key={m.src} {...m} />
                  ))}
                </div>
                <figcaption className="mt-3 text-[13px] text-[#5b5c6e]">{definition.media.caption}</figcaption>
              </figure>
            )}
          </div>
        </Band>

        {/* ② 怎么用：暖白色块，三步各配一块界面片段 */}
        <Band id={ID("steps")} tone="warm">
          <h2 id={ID("steps")} className={H2}>{steps.heading}</h2>
          <p className={SUB}>{steps.sub}</p>
          <ol className="mt-9 grid gap-x-6 gap-y-9 @2xl:grid-cols-3">
            {steps.items.map((s, i) => (
              <li key={s.title}>
                {s.visual && <StepVisual visual={s.visual} />}
                <h3 className={`mt-5 flex gap-2.5 text-[17px] font-bold leading-snug ${INK}`}>
                  <span aria-hidden className="tabular-nums text-[#c2410c]">{i + 1}.</span>
                  {s.title}
                </h3>
                <p className={`mt-1.5 ${BODY}`}>{s.body}</p>
              </li>
            ))}
          </ol>
        </Band>

        {/* ③ 效果：两组大幅前后对比，等高排开(每张的宽度按自己的宽高比分，不裁图) */}
        {examples && (
          <Band id={ID("examples")}>
            <h2 id={ID("examples")} className={H2}>{examples.heading}</h2>
            <p className={SUB}>{examples.sub}</p>
            <div className="mt-8 flex flex-col gap-x-4 gap-y-7 @2xl:flex-row">
              {examples.items.map((e) => (
                <figure key={e.after} className="min-w-0" style={{ flex: `${e.width / e.height} 1 0%` }}>
                  <div className="overflow-hidden rounded-2xl bg-[#f1f2f5] shadow-[0_18px_40px_rgba(26,26,46,0.14)]">
                    <CompareSlider before={e.before} after={{ url: e.after, width: e.width, height: e.height }} afterAlt={e.alt} beforeAlt={e.beforeAlt} lazy />
                  </div>
                  <figcaption className="mt-3.5">
                    <span className={`block text-[15px] font-bold ${INK}`}>{e.caption}</span>
                    <span className="mt-0.5 block text-[12.5px] text-[#5b5c6e]">Photo: {e.credit}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </Band>
        )}

        {/* ④ 用途：深色块，大字清单 */}
        <Band id={ID("uses")} tone="ink">
          <h2 id={ID("uses")} className={`${H2} !text-white`}>{uses.heading}</h2>
          <p className={`${SUB} !text-[#b9bacb]`}>{uses.sub}</p>
          <dl className="mt-8">
            {uses.items.map((u) => (
              <div key={u.title} className="grid gap-x-10 gap-y-1.5 border-t border-white/12 py-5 @2xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] @2xl:items-baseline">
                <dt className="text-[clamp(19px,2.6cqw,24px)] font-extrabold tracking-[-0.015em] text-white">{u.title}</dt>
                <dd className="text-pretty text-[15px] leading-[1.6] text-[#b9bacb]">{u.body}</dd>
              </div>
            ))}
          </dl>
        </Band>

        {/* ⑤ 规格：左标签、右数值 */}
        <Band id={ID("specs")}>
          <div className="grid gap-x-12 gap-y-7 @3xl:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
            <h2 id={ID("specs")} className={H2}>{specs.heading}</h2>
            <dl>
              {specs.items.map((s) => (
                <div key={s.label} className="grid gap-x-6 gap-y-0.5 border-t border-[#ececf1] py-3.5 last:border-b @md:grid-cols-[150px_minmax(0,1fr)]">
                  <dt className="text-[14px] font-medium text-[#5b5c6e]">{s.label}</dt>
                  <dd className={`text-pretty text-[15px] font-semibold leading-snug tabular-nums ${INK}`}>{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Band>

        {/* ⑥ FAQ */}
        <Band id={ID("faq")}>
          <div className="mx-auto max-w-[760px]">
            <h2 id={ID("faq")} className={`${H2} text-center`}>{faq.heading}</h2>
            <div className="mt-8 divide-y divide-[#ececf1] border-y border-[#ececf1]">
              {faq.items.map((f, i) => (
                <details key={f.q} open={i === 0} className="group">
                  <summary className={`flex cursor-pointer list-none items-start justify-between gap-6 rounded-lg py-[18px] outline-none transition-colors hover:text-[#c2410c] focus-visible:ring-2 focus-visible:ring-[#c2410c] [&::-webkit-details-marker]:hidden ${INK}`}>
                    <h3 className="text-[17px] font-bold leading-snug">{f.q}</h3>
                    <Plus aria-hidden className="mt-1 size-[18px] shrink-0 text-[#74758a] transition-transform duration-200 ease-out group-open:rotate-45 motion-reduce:transition-none" />
                  </summary>
                  <p className={`max-w-[64ch] pb-6 pr-10 ${BODY}`}>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </Band>

        {/* ⑦ 行动区 + 其他工具 */}
        <div className="space-y-8">
          <Band id={ID("cta")} tone="glow">
            <div className="mx-auto flex max-w-[640px] flex-col items-center text-center">
              <h2 id={ID("cta")} className={H2}>{cta.heading}</h2>
              <p className={`${SUB} !text-[#4a4b5c]`}>{cta.body}</p>
              <button type="button" onClick={onStart} className={`mt-7 ${CTA}`}>
                <Upload className="size-[18px]" strokeWidth={2} />
                {cta.button}
              </button>
            </div>
          </Band>

          {/* 其他工具：带缩略图的卡片(2026-11-10 Monica:原来只是一行文字链接，不好看)。
              缩略图用对方页面的成果图;宽屏三张并排，窄了改成「左图右字」的横条。整张卡都是链接 */}
          <nav aria-labelledby={ID("related")} className="pt-[clamp(8px,2cqw,24px)]">
            <h2 id={ID("related")} className={`text-[clamp(20px,3cqw,26px)] font-extrabold tracking-[-0.018em] ${INK}`}>{related.heading}</h2>
            <ul className="mt-5 grid gap-x-5 gap-y-3 @2xl:grid-cols-3">
              {related.items.map((r) => {
                const target = GUIDES[r.tool];
                const img = target?.cardImage ?? target?.definition.media?.items.at(-1)?.src;
                const clip = target?.cardVideo;
                return (
                  <li key={r.tool}>
                    <a
                      href={TOOLS[r.tool].href}
                      onClick={(e) => {
                        if (!onOpenTool || e.metaKey || e.ctrlKey || e.shiftKey) return;
                        e.preventDefault();
                        onOpenTool(r.tool);
                      }}
                      className="group flex h-full items-center gap-4 rounded-[20px] border border-[#ececf1] bg-white p-2.5 outline-none transition duration-200 ease-out hover:border-[#ffd2b8] hover:shadow-[0_10px_28px_rgba(26,26,46,0.10)] focus-visible:ring-2 focus-visible:ring-[#c2410c] motion-reduce:transition-none @2xl:flex-col @2xl:items-stretch @2xl:gap-0 @2xl:p-3"
                    >
                      {(img || clip) && (
                        <span className="relative block aspect-[4/3] w-[104px] shrink-0 overflow-hidden rounded-xl bg-[#f1f2f5] @2xl:aspect-[16/10] @2xl:w-full @2xl:rounded-[14px]">
                          {/* 有短视频就静音循环自动播放(2026-11-10 Monica:卡片不要静图);图片垫在底下当封面，系统开了「减少动态效果」时只显示图片 */}
                          {img && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={img} alt="" width={640} height={400} loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transition-none" />
                          )}
                          {clip && (
                            <video
                              src={clip}
                              poster={img}
                              autoPlay
                              muted
                              loop
                              playsInline
                              preload="metadata"
                              aria-hidden
                              className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:hidden"
                            />
                          )}
                        </span>
                      )}
                      <span className="block min-w-0 flex-1 @2xl:px-1.5 @2xl:pb-1.5 @2xl:pt-3.5">
                        <span className={`flex items-center justify-between gap-2 text-[16px] font-bold leading-snug transition-colors group-hover:text-[#c2410c] ${INK}`}>
                          {/* 链接文字用那一页的 H1(AI Video Upscaler),不用菜单名(Upscale Video):全站对同一个工具只有一个叫法 */}
                          {target?.h1 ?? TOOLS[r.tool].label}
                          <ArrowUpRight aria-hidden className="size-4 shrink-0 text-[#74758a] transition duration-200 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#c2410c] motion-reduce:transition-none" />
                        </span>
                        <span className="mt-1 block text-pretty text-[14px] leading-[1.5] text-[#5b5c6e]">{r.body}</span>
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
}
