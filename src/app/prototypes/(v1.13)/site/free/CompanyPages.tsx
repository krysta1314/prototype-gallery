"use client";

/* 公司 / 帮助页:/help、/faq、/whats-new、/enterprise(2026-11-23)。
   不编：事实全部来自 company.ts / changelog.ts(出处写在那两个文件头);价格不写数字，指向 /pricing;Enterprise 的 CTA 去 /help#contact(线上 /contact 已并入 Help Center)。 */

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import type { OnLink } from "../../site-nav/SiteNavHeader";
import { OA_H2, OA_WRAP, OACta, OAFaq, OAPanel } from "../oa/kit";
import { RELEASES } from "./changelog";
import { ALL_FAQ, qaSlug, ENT_CREDITS, ENT_INCLUDED, ENT_PLANNED, FAQ_GROUPS, PLAN_ROWS } from "./company";
import { Chip, faqLd, FreeHero, JsonLd, linker, ORG } from "./ui";

const CARD = "rounded-[20px] bg-white/[0.05] p-6 ring-1 ring-white/[0.08]";

/* /help 搬到 ./HelpPage.tsx(2026-11-24 照 Higgsfield Help Center 重做，并入 Contact) */

/* ── /faq ──
   2026-11-24 去 AI 味(Monica):原来是居中大写标题 + 「17 answers」药丸 + 两栏折叠卡片 + 发光 CTA 卡。
   帮助内容要能扫读：左边固定分组目录，右边一栏问答全部展开(不用点开)，每条有自己的锚点，Help Center 点过来直接落在那一条。 */
export function FaqPage({ onLink }: { onLink: OnLink }) {
  const a = linker(onLink);
  return (
    <main className="bg-black text-white">
      <div className={`${OA_WRAP} pb-24 pt-14 md:pt-20`}>
        <header className="max-w-[720px]">
          <a {...a("Help Center", "/help")} className="text-[14px] font-medium text-white/60 hover:text-white">
            Help Center
          </a>
          <h1 className="mt-3 text-[clamp(32px,calc(22px+1.6vw),44px)] font-semibold leading-[1.05] tracking-[-0.02em]">Frequently asked questions</h1>
          <p className="mt-4 text-[16px] leading-7 text-white/70">Getting started, credits and plans, models, teams and the free tools.</p>
        </header>
        <div className="mt-12 grid gap-x-16 gap-y-8 lg:grid-cols-[200px_minmax(0,1fr)]">
          <nav aria-label="FAQ sections" className="lg:sticky lg:top-28 lg:self-start">
            <ul className="flex flex-wrap gap-x-5 gap-y-2 lg:flex-col lg:gap-y-3">
              {FAQ_GROUPS.map((g) => (
                <li key={g.title}>
                  <a href={`#${slugOf(g.title)}`} className="text-[15px] text-white/70 transition-colors hover:text-[#FF744D]">
                    {g.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="max-w-[760px] space-y-14">
            {FAQ_GROUPS.map((g) => (
              <section key={g.title} id={slugOf(g.title)} className="scroll-mt-28">
                <h2 className="text-[24px] font-semibold leading-tight tracking-[-0.015em]">{g.title}</h2>
                <div className="mt-5 border-t border-white/10">
                  {g.items.map((item) => (
                    <div key={item.q} id={qaSlug(item.q)} className="-mx-4 scroll-mt-28 border-b border-white/10 px-4 py-6 transition-colors target:bg-white/[0.06]">
                      <h3 className="text-[18px] font-medium leading-snug text-white">{item.q}</h3>
                      <p className="mt-2 max-w-[68ch] text-[16px] leading-7 text-white/75 [text-wrap:pretty]">{item.a}</p>
                    </div>
                  ))}
                </div>
              </section>
            ))}
            <p className="text-[16px] leading-7 text-white/75">
              Didn&apos;t find your answer?{" "}
              <a href="help#contact" className="font-semibold text-[#FF744D] hover:underline">
                Contact the BuzzVideo team
              </a>
              .
            </p>
          </div>
        </div>
      </div>
      <JsonLd data={[faqLd(ALL_FAQ)]} />
    </main>
  );
}
const slugOf = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

/* ── /whats-new(What's New;旧网址 /changelog 308 跳到这里)──
   2026-11-24 Monica:「要按照 openart.ai/suite/whats-new 这个页面一模一样做」—— 照它的版式：
   格子底的居中标题(第二个词用强调色) → 一条竖向时间线，每条 = 圆点 + 标签 + 大标题 + 说明 + 白色胶囊按钮，右边一张大图 → 底部 Show More。
   和它不同的两处(都是不编内容):它的标签是日期，我们没有真实上线日期(见 changelog.ts)，标签放版本号;
   它的强调字是渐变，design.md 不用渐变字，用品牌橙实色。配图只放和那一版内容对得上的，没有合适图的条目不配图。 */
const NAVIMG = "/prototypes/site/nav";
const WN = "/prototypes/site/whats-new";
/* wide = 16:9 素材(从宣传片 / 生成原片截的，按原比例放，不裁字);2026-11-25 Monica「全部都少了配图」补齐 */
const RELEASE_MEDIA: Record<string, { img: string; video?: string; wide?: boolean }> = {
  "v1.16": { img: `${NAVIMG}/studios/design.webp`, video: `${NAVIMG}/studios/design.mp4` },
  "v1.13": { img: `${NAVIMG}/image/image-generator.webp` },
  "v1.12": { img: `${NAVIMG}/studios/editor.webp`, video: `${NAVIMG}/studios/editor.mp4` },
  "v1.11": { img: `${NAVIMG}/studios/3d.webp`, video: `${NAVIMG}/studios/3d.mp4` },
  /* 2026-11-25 Monica:「这里要配图我们 marketing agent 里面的 LLM」→ 模型菜单(Gemini / Grok / Qwen / DeepSeek + Thinking 档位) */
  "v1.10": { img: `${WN}/llm.webp`, video: `${WN}/llm.mp4` },
  "v1.7.1": { img: `${NAVIMG}/image/nano-banana-2-1.webp` },
  "v1.5.2": { img: `${NAVIMG}/image/gpt-image-2-5-sunburst.webp` },
  "v1.4": { img: `${NAVIMG}/resources/prompt.webp`, video: `${NAVIMG}/resources/prompt.mp4` },
  /* 2026-11-25 Monica「要和这个页面我们做的这些素材一样的风格」→ 全部改成菜单图卡同款(官网素材工程/07 cards.html 的 wn-* 卡) */
  /* 2026-11-25 Monica:「你用 kling 4.0 重新生成一个内容素材吧」+「灯光太暗，我要色彩明亮的」→ 画面换成 Kling 4.0 真实生成的傍晚金色阳光版 */
  "kling-4-0": { img: `${WN}/kling.webp?v=2`, video: `${WN}/kling.mp4?v=2` },
  /* 2026-11-25 Monica:「太小，要把 claude 里面接入 buzz video mcp 画出来」→ 铺满整张的 Claude 对话窗口 */
  "v1.9": { img: `${WN}/mcp.webp?v=2`, video: `${WN}/mcp.mp4?v=2` },
  /* 2026-11-25 Monica:Canvas 节点图挪到 Mar 25「Canvas is here」那条;这条换成「项目标签 + 团队用量分析」的配图 */
  "v1.8": { img: `${WN}/tags.webp`, video: `${WN}/tags.mp4` },
  enterprise: { img: `${WN}/enterprise.webp`, video: `${WN}/enterprise.mp4` },
  "v1.5": { img: `${WN}/assets.webp`, video: `${WN}/assets.mp4` },
  "seedance-2-5-1080p": { img: `${WN}/1080.webp`, video: `${WN}/1080.mp4` },
  "seedance-2-5": { img: `${WN}/seedance.webp`, video: `${WN}/seedance.mp4` },
  canvas: { img: `${NAVIMG}/studios/canvas.webp`, video: `${NAVIMG}/studios/canvas.mp4` },
  "marketing-agent": { img: `${WN}/marketing-agent.webp`, video: `${WN}/marketing-agent.mp4` },
  beta: { img: `${WN}/beta.webp`, video: `${WN}/beta.mp4` },
  "v1.2": { img: `${WN}/pricing.webp`, video: `${WN}/pricing.mp4` },
  "v1.3": { img: `${NAVIMG}/agent/url.webp`, video: `${NAVIMG}/agent/url.mp4` },
};
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/* "2026-11-17" → "Nov 17, 2026"(手写，不走 Date,免得时区把日期挪一天) */
const fmtDate = (d: string) => { const [y, m, day] = d.split("-").map(Number); return `${MONTHS[m - 1]} ${day}, ${y}`; };
const FIRST = 5;
/* 标题区的格子底：细线网格 + 橙色格子轮流点亮(2026-11-25 Monica:背景要有动效，选了「格子逐个点亮」)。
   位置和节奏用固定种子算出来(服务端和浏览器一致，不会 hydration 不一致);中间标题后面的几列不放格子，免得和字抢。
   每格：亮起 → 发光 → 熄灭，周期 4.8–8.4 秒、错开起步(竖向扫光 2026-11-25 Monica 让去掉了)。reduce-motion 时停在静态的淡格子。 */
const CELLS = (() => {
  let x = 7;
  const rnd = () => ((x = (x * 9301 + 49297) % 233280) / 233280);
  const out: { c: number; r: number; dur: number; delay: number }[] = [];
  for (let i = 0; i < 46; i++) {
    const c = Math.floor(rnd() * 33), r = Math.floor(rnd() * 5);
    if (c >= 12 && c <= 20 && r >= 1 && r <= 3) continue;
    if (out.some((o) => o.c === c && o.r === r)) continue;
    out.push({ c, r, dur: 4.8 + rnd() * 3.6, delay: -rnd() * 8 });
  }
  return out;
})();
const GRID_CSS = `
@keyframes cl-cell { 0%, 100% { opacity: 0; box-shadow: 0 0 0 rgba(255,116,77,0); } 12% { opacity: 1; box-shadow: 0 0 26px rgba(255,116,77,.55); } 30% { opacity: .55; box-shadow: 0 0 10px rgba(255,116,77,.2); } 55% { opacity: 0; } }
.cl-cell { opacity: 0; animation: cl-cell var(--d) ease-in-out var(--dl) infinite; }
@media (prefers-reduced-motion: reduce) { .cl-cell { animation: none; opacity: .45; } }
`;
export function ChangelogPage({ onLink }: { onLink: OnLink }) {
  const a = linker(onLink);
  const [all, setAll] = useState(false);
  return (
    <main className="bg-[#090A0A] text-white">
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[300px] [mask-image:linear-gradient(to_bottom,black_55%,transparent)]" style={{ backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.07) 1px, transparent 1px)", backgroundSize: "41px 41px", backgroundPosition: "center top" }}>
          <style>{GRID_CSS}</style>
          <div className="absolute left-1/2 top-0 h-full w-[1353px] -translate-x-1/2">
            {CELLS.map(({ c, r, dur, delay }) => (
              <span key={`${c}-${r}`} className="cl-cell absolute size-[41px] bg-[#FF744D]/[0.28] ring-1 ring-inset ring-[#FF744D]/50" style={{ left: c * 41, top: r * 41, ["--d" as string]: `${dur.toFixed(2)}s`, ["--dl" as string]: `${delay.toFixed(2)}s` }} />
            ))}
          </div>
        </div>
        <div className={`${OA_WRAP} relative pb-16 pt-24 text-center md:pb-24 md:pt-32`}>
          <h1 className="text-[clamp(40px,calc(24px+2.6vw),60px)] font-bold leading-none tracking-[-0.02em]">
            What&apos;s <span className="text-[#FF744D]">New</span>
          </h1>
          <p className="mx-auto mt-5 max-w-[60ch] text-[15px] leading-6 text-white/80">See the latest BuzzVideo feature releases and product improvements.</p>
        </div>
      </section>

      <section className="pb-24">
        {/* 2026-11-25 Monica:「宽一点」—— 时间线整体从 1296 放宽到 1520,右侧配图列 570 → 680 */}
        <ol className="mx-auto max-w-[1520px] px-4 sm:px-6 lg:px-8">
          {RELEASES.map((r, idx) => {
            const media = RELEASE_MEDIA[r.version];
            const cta = r.items.find((i) => i.href);
            return (
              <li key={r.version} id={r.version.replace(/\./g, "-")} className={`relative scroll-mt-28 gap-x-12 pb-16 pl-12 md:pb-24 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,680px)] ${idx >= FIRST && !all ? "hidden" : ""}`}>
                {/* 时间线：圆点 + 往下的细线 */}
                <span aria-hidden className="absolute left-0 top-[3px] size-[26px] rounded-full bg-[radial-gradient(circle_at_35%_30%,#ffffff,#B9BCC2_45%,#4A4A50)] ring-1 ring-white/30" />
                <span aria-hidden className="absolute bottom-2 left-[12.5px] top-[40px] w-px bg-white/20" />
                <div className="min-w-0">
                  <span className="inline-flex h-7 items-center rounded-[8px] bg-white/[0.08] px-2 text-[12.5px] font-medium tabular-nums text-white ring-1 ring-white/10">
                    {r.date ? <time dateTime={r.date}>{fmtDate(r.date)}</time> : r.upcoming ? "Coming soon" : r.version}
                  </span>
                  <h2 className="mt-4 text-[26px] font-semibold leading-[1.25] tracking-[-0.01em] [text-wrap:balance] md:text-[32px]">{r.summary.replace(/\.$/, "")}</h2>
                  <ul className="mt-4 max-w-[62ch] space-y-2.5 text-[15px] leading-6 text-white/70">
                    {r.items.map((i) => (
                      <li key={i.title}>
                        <span className="font-medium text-white">{i.title}</span>
                        {i.status && i.status !== "Live" && <span className="ml-2 rounded-full bg-white/[0.1] px-2 py-0.5 text-[11.5px] font-semibold text-white/85">{i.status}</span>}
                        <span className="block">{i.body}</span>
                      </li>
                    ))}
                  </ul>
                  {cta?.href && (
                    <a {...a(cta.title, cta.href)} className="mt-6 inline-flex h-10 items-center rounded-full bg-gradient-to-b from-white to-[#CFCFCF] px-5 text-[13.5px] font-semibold text-[#090A0A] transition hover:brightness-110">
                      {cta.status === "Live" ? "Try Now" : "Learn More"}
                    </a>
                  )}
                </div>
                {media && (
                  <div className={`relative mt-8 ${media.wide ? "aspect-video" : "aspect-[16/10]"} self-start overflow-hidden rounded-[16px] lg:mt-0`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={media.img} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
                    {media.video && <video src={media.video} muted loop playsInline autoPlay preload="none" aria-hidden className="absolute inset-0 size-full object-cover motion-reduce:hidden" />}
                    {/* 2026-11-25 Monica:「这页面素材的尺寸要都保持一致」—— 深色素材和页面底色几乎一样，看起来像缩在中间的小图;
                        每张配图都描一圈同样的细边，框出同一个 16:10 的大小 */}
                    <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[16px] ring-1 ring-inset ring-white/[0.12]" />
                  </div>
                )}
              </li>
            );
          })}
        </ol>
        {!all && RELEASES.length > FIRST && (
          <div className="text-center">
            <button type="button" onClick={() => setAll(true)} className="inline-flex h-11 items-center rounded-full bg-white/[0.08] px-6 text-[14px] font-semibold text-white ring-1 ring-white/15 transition hover:bg-white/[0.14]">
              Show More
            </button>
          </div>
        )}
      </section>
      <JsonLd data={[{ "@context": "https://schema.org", "@type": "WebPage", name: "BuzzVideo release notes", url: "https://buzzvideo.ai/whats-new", publisher: ORG }]} />
    </main>
  );
}

/* ── /enterprise ── */
export function EnterprisePage({ onLink }: { onLink: OnLink }) {
  const a = linker(onLink);
  const contact = a("Contact Sales", "/help#contact", "new");
  const faq = [
    { q: "What is BuzzVideo Enterprise?", a: "BuzzVideo Enterprise is the BuzzVideo plan for brands and agencies that make ads as a team. It adds multi-user access, seat management, shared workspaces, custom credit allocation, API access, an SLA and a dedicated account manager." },
    { q: "How is Enterprise different from Pro or Ultra?", a: "Starter, Pro and Ultra are for one person. Enterprise adds team seats and shared workspaces, custom credits, dedicated model capacity, a priority processing queue, API access, onboarding and an account manager." },
    { q: "Does Enterprise include API access?", a: "Yes. API access is available on Enterprise plans only. MCP is included on every plan." },
    { q: "Can we get SOC 2 reports or a DPA?", a: "Yes. Enterprise customers can get SOC 2 reports, a custom DPA and data residency options." },
    { q: "How much does Enterprise cost?", a: "Enterprise pricing isn't listed on the pricing page. Contact sales for a quote." },
  ];
  const cols: { k: keyof (typeof PLAN_ROWS)[number]; label: string }[] = [
    { k: "free", label: "Free" },
    { k: "starter", label: "Starter" },
    { k: "pro", label: "Pro" },
    { k: "ultra", label: "Ultra" },
    { k: "ent", label: "Enterprise" },
  ];
  return (
    <main className="bg-black text-white">
      <FreeHero
        chip={<Chip>For brands and agencies</Chip>}
        title="BuzzVideo for teams"
        lead="BuzzVideo Enterprise is the AI ad generator plan for brands and agencies that create video and image ads as a team. It adds shared workspaces, seat management and custom credit allocation, plus API access, an SLA and a dedicated account manager."
      >
        <div className="flex justify-center">
          <a {...contact} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-6 py-3.5 text-[15.5px] font-bold text-white transition hover:brightness-105">
            Contact sales <ArrowRight className="size-4" />
          </a>
        </div>
      </FreeHero>

      <OAPanel title="What does Enterprise include?" sub="The Enterprise features listed on BuzzVideo's pricing page and in its billing FAQ.">
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ENT_INCLUDED.map((f) => (
            <li key={f.title} className={CARD}>
              <h3 className="text-[18px] font-extrabold">{f.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-[#CACACA]">{f.body}</p>
            </li>
          ))}
        </ul>
      </OAPanel>

      <section className="bg-[#F6F6F6] py-20 text-[#240A03] md:py-28">
        <div className={OA_WRAP}>
          <h2 className={OA_H2}>How do team credits work?</h2>
          <p className="mt-4 max-w-[44rem] text-[17px] leading-relaxed text-[#240A03]/80">One organization, one credit pool, and clear controls over who spends what.</p>
          <ul className="mt-12 grid gap-5 md:grid-cols-2">
            {ENT_CREDITS.map((c) => (
              <li key={c.title} className="rounded-[24px] bg-white p-7 shadow-[0_20px_50px_rgba(36,10,3,0.06)]">
                <h3 className="text-[18px] font-extrabold">{c.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[#240A03]/80">{c.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <OAPanel title="How does Enterprise compare with other plans?" sub={<>Features only; see <a {...a("Pricing", "/pricing")} className="underline underline-offset-4">Pricing</a> for current prices.</>}>
        <div className="overflow-x-auto rounded-[20px] bg-white/[0.04] ring-1 ring-white/[0.08]">
          <table className="w-full min-w-[760px] text-left text-[14px]">
            <caption className="sr-only">BuzzVideo plan features</caption>
            <thead className="text-[12.5px] uppercase tracking-[0.04em] text-[#9F9F9F]">
              <tr>
                <th scope="col" className="px-4 py-3 font-bold">
                  Feature
                </th>
                {cols.map((c) => (
                  <th key={c.k} scope="col" className={`px-4 py-3 font-bold ${c.k === "ent" ? "text-[#FF744D]" : ""}`}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PLAN_ROWS.map((r) => (
                <tr key={r.label} className="border-t border-white/[0.08] text-[#E8E8E8]">
                  <th scope="row" className="px-4 py-3.5 font-bold text-white">
                    {r.label}
                  </th>
                  {cols.map((c) => (
                    <td key={c.k} className={`px-4 py-3.5 ${c.k === "ent" ? "font-semibold text-white" : ""}`}>
                      {r[c.k]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </OAPanel>

      <OAPanel title="What's planned for Enterprise in Design Studio?" sub="These Design Studio controls are planned for Enterprise organizations and are not available yet.">
        <ul className="flex flex-wrap gap-2.5">
          {ENT_PLANNED.map((p) => (
            <li key={p} className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-4 py-2 text-[14px] font-semibold text-[#E8E8E8] ring-1 ring-white/10">
              {p}
              <span className="rounded-full bg-white/[0.1] px-2 py-0.5 text-[11px] font-bold text-[#CACACA]">Planned</span>
            </li>
          ))}
        </ul>
      </OAPanel>

      <OAFaq items={faq} />
      <OACta title="Bring BuzzVideo to your team" sub="Tell us about your team and the ads you make, and we'll set up a plan that fits." cta={{ label: "Contact sales", link: contact }} />
      <JsonLd
        data={[
          { "@context": "https://schema.org", "@type": "WebPage", name: "BuzzVideo Enterprise", url: "https://buzzvideo.ai/enterprise", publisher: ORG },
          faqLd(faq),
        ]}
      />
    </main>
  );
}
