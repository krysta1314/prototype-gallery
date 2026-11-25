"use client";

/* 官网 Footer v3(2026-11-24,Monica:「header 给用户，footer 瞄准 SEO / GEO」)。
   Header 用动词说法、点了进产品;落地页(SEO / GEO 权重页)全部从 Footer 点到，链接文字用精准搜索词。
   结构(整块 CTA 渐变底 #FFA73C → #FF5255,字用 Primary text #240A03):
     1. 站点地图：核心链接 + 原来单独一段的「Explore more AI features」合并成一份，按 SEO 分类分组(footerSitemap),CSS 多栏;
     3. 一条细行:logo + 社交 + 实体定义(和 /llms.txt 开头同一句,GEO);
     4. 最底深色条：© + 法务。
   SEO:全部真实 <a href>,指向落地页(不是工具页)。 */

import { footerSitemap, LEGAL_LINKS, SOCIAL, type LinkStatus } from "./nav-data";
import { Badge, NavA, STATUS_DOT, type OnLink } from "./SiteNavHeader";

const LOGO = "/prototypes/ai-tools/logo.svg";

/** 和 llms.txt 开头一致的实体定义(改这里要同步改 llms.txt) */
export const ENTITY_DEFINITION =
  "BuzzVideo is an AI ad generator for marketers and creators. Its Marketing Agent turns a product photo, link or idea into campaign-ready video and image ads, using leading models such as Seedance, Kling, Nano Banana and GPT Image in one place.";

/* Instagram 图标(lucide 新版去掉了品牌图标，这里内联同款线条图形) */
function InstagramGlyph() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

/* 演示用状态点 */
function Dot({ status, mark }: { status: LinkStatus; mark: boolean }) {
  if (!mark) return null;
  return <span aria-hidden className={`ml-1.5 inline-block size-1.5 shrink-0 rounded-full align-middle ${STATUS_DOT[status]}`} />;
}

/** Footer 5 栏：工具(视频+音频数字人)/ 图片工具 / Agent+行业 / 模型 / 资源+公司;没列到的分组放最后一栏 */
const FOOTER_LAYOUT: string[][] = [
  ["Video Tools", "Audio & Avatar"],
  ["Image Tools"],
  ["Agent & Studios", "Solutions"],
  ["Video Models", "Image Models"],
  /* 2026-11-26 Monica:「footer 的布局再重新排一下」—— 补进 16 个高搜索量页面后第 4 栏过长、第 5 栏过短，Audio Models 挪到第 5 栏，五栏高度拉平 */
  ["Audio Models", "Resources", "Company"],
];
function footerColumns<G extends { title: string }>(groups: G[]): G[][] {
  const cols = FOOTER_LAYOUT.map((titles) => titles.map((t) => groups.find((g) => g.title === t)).filter((g): g is G => !!g));
  const placed = new Set(FOOTER_LAYOUT.flat());
  cols[cols.length - 1].push(...groups.filter((g) => !placed.has(g.title)));
  return cols;
}

export function SiteFooter({ mark, onLink, notify, compact = false }: { mark: boolean; onLink: OnLink; notify: (t: string) => void; compact?: boolean }) {
  /* 2026-11-24 Monica:Explore more 并进 Footer —— 全站只有这一份站点地图，链接文字都是精准搜索词 */
  const sitemap = footerSitemap();
  return (
    <footer className={`text-[#240A03] ${compact ? "overflow-hidden rounded-b-[16px]" : ""}`}>
      <div className="relative isolate overflow-hidden bg-gradient-to-br from-[#FFA73C] via-[#FF744D] to-[#FF5255]">
      {/* 一点光感：左上提亮、右下压深，渐变不是一整块平涂 */}
      <div aria-hidden className="pointer-events-none absolute -left-40 -top-40 -z-10 size-[620px] rounded-full bg-white/25 blur-[120px]" />
      <div aria-hidden className="pointer-events-none absolute -bottom-48 -right-32 -z-10 size-[560px] rounded-full bg-[#240A03]/15 blur-[120px]" />

      <div className="mx-auto max-w-[1240px] px-4 pb-10 pt-16 sm:px-6 md:pt-20">
        {/* 1. 站点地图：核心链接 + 原 Explore more 的全部落地页，按 SEO 分类。用 CSS 多栏自动排，分组不跨栏。
            太长，默认露出一个高度，可展开;收起时链接仍全部在 DOM 里(只是被裁掉),爬虫照样抓得到 */}
        <nav aria-label="Footer" id="footer-sitemap" className="relative" /* 2026-11-25 Monica:「直接展示完」—— 去掉展开 / 收起按钮，全部链接直接展示 */>
          {/* 2026-11-25 Monica:「这里的布局是不是要重新排」—— 不再用 CSS 自动分栏(分组被挤得高低乱跳),改成固定 5 栏、按语义排 */}
          <div className="grid grid-cols-2 gap-x-6 sm:grid-cols-3 lg:grid-cols-5">
            {footerColumns(sitemap).map((col, i) => (
              <div key={i}>
                {col.map((g) => (
                  <div key={g.title} className="mb-9">
                    <h3 className="text-[13px] font-bold uppercase tracking-[0.07em] text-[#240A03]/70">{g.title}</h3>
                    <ul className="mt-3.5 space-y-2">
                      {g.links.map((l) => (
                        <li key={l.href + l.label}>
                          <NavA link={l} onLink={onLink} className="inline-flex items-center text-[14.5px] font-medium leading-snug text-[#240A03]/70 decoration-[#240A03] decoration-2 underline-offset-4 transition hover:text-[#240A03] hover:underline">
                            {l.label}
                            <Badge b={l.badge} />
                            <Dot status={l.status} mark={mark} />
                          </NavA>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </nav>
        {/* 3. 完整 logo(图标 + 字标，和 Header 一致)+ 实体定义(GEO)。Ask AI 按 Monica 2026-11-19 去掉 */}
        <div className="mt-14 flex flex-col gap-4 border-t border-[#240A03]/15 pt-8 lg:flex-row lg:items-start lg:gap-10">
          <div className="flex shrink-0 flex-col items-center gap-3">
          <NavA link={{ label: "Home", href: "/", status: "live" }} onLink={onLink} className="flex items-center gap-2">
            {/* 官方 logo 原样引用(memory:brand-logo-immutable) */}
            <span className="grid size-10 place-items-center rounded-[12px] bg-white shadow-[0_6px_18px_-6px_rgba(36,10,3,0.35)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LOGO} alt="" className="size-6" />
            </span>
            <span className="whitespace-nowrap text-[20px] font-extrabold tracking-tight text-[#240A03]">BuzzVideo AI</span>
          </NavA>
            {/* 社交：Instagram 图标(2026-11-19 Monica:从底条挪到 logo 下面，用图标) */}
            <div className="flex gap-2">
              {SOCIAL.map((so) => (
                <a key={so.name} href={so.href} target="_blank" rel="noopener" aria-label={`BuzzVideo on ${so.name}`} className="grid size-9 place-items-center text-white/85 transition hover:text-white">
                  <InstagramGlyph />
                </a>
              ))}
            </div>
          </div>
          <p className="flex-1 pt-1 text-[13.5px] leading-relaxed text-[#240A03]/80">{ENTITY_DEFINITION}</p>
        </div>
      </div>

      </div>

      {/* 4. 最底深色条 */}
      <div className="bg-[#240A03] px-4 py-5 text-[13px] text-white/70 sm:px-6">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <p>© 2026 BuzzVideo AI · PressLogic. All rights reserved.</p>
          </div>
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {LEGAL_LINKS.map((l) => (
              <li key={l.href}>
                <NavA link={l} onLink={onLink} className="transition hover:text-white">
                  {l.label}
                  <Dot status={l.status} mark={mark} />
                </NavA>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
