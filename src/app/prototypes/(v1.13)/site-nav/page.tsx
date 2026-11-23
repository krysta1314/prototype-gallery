"use client";

/* 官网 Header / Footer · SEO + GEO 改版(2026-11-18)。
   顶部演示条先选 Header / Footer tab,再切「访客页面 / 登录后 app」,「标出页面状态」给每个链接加色点(绿 = 线上已有、蓝 = 原型 / UAT 已有、橙 = 待建)。
   本轮只改导航(Monica 2026-11-18 定),首页正文是占位。下方白底区是交接说明 + 待建页面清单。
   调研:docs/research/2026-11-18-header-footer-seo-geo.md */

import { useEffect, useMemo, useRef, useState } from "react";
import { UserPlus } from "lucide-react";
import { useToast } from "../../(v1.7)/blog/toast";
import { APPLE_FONT, AccountCluster } from "../../(v1.12)/hybrid-reel/agent/chat/shell";
import { ProductSidebar } from "../../(v1.12)/ai-tools/app/components/ProductSidebar";
import { MobileNavDrawer } from "../../(v1.12)/ai-tools/app/components/MobileNavDrawer";
import { WorkspaceMenu } from "../../(v1.12)/ai-tools/app/components/WorkspaceMenu";
import { allLinks, STATUS_LABEL, type LinkStatus, type NavLink } from "./nav-data";
import { AppNavBar, SiteNavHeader, STATUS_DOT, targetOf, type OnLink } from "./SiteNavHeader";
import { SiteFooter } from "./SiteFooter";

type View = "site" | "app";
/** 演示条第一组 tab:看 Header 还是看 Footer */
type Part = "header" | "footer";


/* ───────── 演示条 ───────── */

function DemoBar({ part, setPart, view, setView, mark, setMark, counts, }: { part: Part; setPart: (p: Part) => void; view: View; setView: (v: View) => void; mark: boolean; setMark: (v: boolean) => void; counts: Record<LinkStatus, number> & { built: number } }) {
  const seg = (v: View, label: string) => (
    <button
      type="button"
      onClick={() => setView(v)}
      className={`h-8 rounded-lg px-3 text-[13px] font-bold transition ${view === v ? "bg-white text-[#1a1a2e] shadow-sm" : "text-white/70 hover:text-white"}`}
    >
      {label}
    </button>
  );
  const tab = (p: Part, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={part === p}
      onClick={() => setPart(p)}
      className={`h-8 rounded-lg px-4 text-[13px] font-bold transition ${part === p ? "bg-gradient-to-r from-[#FFA73C] to-[#FF5255] text-white shadow-sm" : "text-white/70 hover:text-white"}`}
    >
      {label}
    </button>
  );
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-[#1a1a2e] px-4 py-2.5 text-white">
      <span className="text-[13px] font-bold">演示</span>
      <div role="tablist" aria-label="看哪一块" className="flex rounded-[10px] bg-white/10 p-0.5">
        {tab("header", "Header")}
        {tab("footer", "Footer")}
      </div>
      <div className="flex rounded-[10px] bg-white/10 p-0.5">
        {seg("site", "访客页面")}
        {seg("app", "登录后 app")}
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-[13px] font-semibold">
        <input type="checkbox" checked={mark} onChange={(e) => setMark(e.target.checked)} className="size-4 accent-[#ff5e1a]" />
        标出页面状态
      </label>
      <span className={`flex flex-wrap items-center gap-3 text-[12px] text-white/70 ${mark ? "" : "opacity-40"}`}>
        {(["live", "uat", "new"] as LinkStatus[]).map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span className={`size-2 rounded-full ${STATUS_DOT[s]}`} />
            {STATUS_LABEL[s]} {counts[s]}
          </span>
        ))}
        <span>原型已建 {counts.built}</span>
      </span>
    </div>
  );
}

/* ───────── 访客页面 ───────── */

function SitePreview({ part, mark, onLink, notify }: { part: Part; mark: boolean; onLink: OnLink; notify: (t: string) => void }) {
  /* Footer tab:只看 Footer(直接顶到演示条下面) */
  if (part === "footer") return <SiteFooter mark={mark} onLink={onLink} notify={notify} />;
  return (
    <div className="bg-white">
      <SiteNavHeader mark={mark} onLink={onLink} onAuth={(w) => notify(w === "login" ? "Log in 将打开登录弹窗" : "Sign Up 将打开注册弹窗(弹窗里可切换登录)")} />
      {/* 首页正文不做占位，留白(Monica 2026-11-18):只留出高度，方便演示大菜单展开 */}
      <div aria-hidden className="h-[70vh] min-h-[480px] bg-white" />
    </div>
  );
}

/* ───────── 登录后 app ───────── */

function AppPreview({ part, mark, onLink, notify }: { part: Part; mark: boolean; onLink: OnLink; notify: (t: string) => void }) {
  const [drawer, setDrawer] = useState(false);
  /* Footer tab:内容区滚到页脚(app 里 Footer 在首页底部);Header tab:回到顶部 */
  const scroller = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    if (part === "footer" && footerRef.current) el.scrollTo({ top: footerRef.current.offsetTop, behavior: "smooth" });
    else el.scrollTo({ top: 0, behavior: "smooth" });
  }, [part]);
  const sideNav = () => notify("侧边栏照现有产品，本原型不展开");
  return (
    <div className="relative flex h-[calc(100dvh-52px)] min-h-[620px] overflow-hidden bg-[#FAFBFC]">
      <ProductSidebar active={{ nav: "home" }} onNav={sideNav} onNotice={notify} />
      <MobileNavDrawer open={drawer} active={{ nav: "home" }} onClose={() => setDrawer(false)} onNav={sideNav} onNotice={notify} />
      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] md:m-2 md:rounded-2xl">
        <AppNavBar
          mark={mark}
          onLink={onLink}
          onMenu={() => setDrawer(true)}
          right={
            <>
              <button
                type="button"
                onClick={() => notify("Invite 打开邀请弹窗(照现有产品)")}
                className="hidden h-8 items-center gap-1.5 rounded-xl border border-[#E8E8E8] bg-white px-3 text-[12px] font-bold text-[#260B03] transition hover:bg-[#FAFBFC] 2xl:inline-flex"
              >
                <UserPlus className="size-3.5" strokeWidth={2.2} />
                Invite
              </button>
              {/* 顶栏多了 7 个菜单:1536 以下团队名收成头像(Invite 侧栏底部也有) */}
              <AccountCluster credits={7100} className="max-sm:hidden" account={<><span className="hidden 2xl:inline"><WorkspaceMenu notify={notify} /></span><span className="2xl:hidden"><WorkspaceMenu compact notify={notify} /></span></>} />
              <span className="sm:hidden">
                <WorkspaceMenu compact notify={notify} />
              </span>
            </>
          }
        />
        <div ref={scroller} className="relative min-h-0 flex-1 overflow-y-auto">
          {/* 首页正文不做占位，留白(Monica 2026-11-18) */}
          <div aria-hidden className="h-[60vh] min-h-[360px]" />
          <div ref={footerRef}>
            <SiteFooter mark={mark} onLink={onLink} notify={notify} compact />
          </div>
        </div>
      </main>
    </div>
  );
}

/* ───────── 交接说明 ───────── */

const RATIONALE: [string, string][] = [
  ["菜单项用搜索词命名(AI Video Generator、AI Video Upscaler),不用 Features 这种泛词", "锚文本是 Google 判断目标页主题的主要信号"],
  ["链接文字按 Google 真实搜索词校正(6,822 个词):没人搜的叫法改成搜索原词(AI Voiceover → AI Voice Over、UGC Video Ads → AI UGC Video Generator),补上 Text to Speech、AI Ad Generator、Faceless Video Generator 等高需求词", "对照说明 docs/research/2026-11-18-nav-keyword-audit.md"],
  ["Popular questions:真实搜索问题做成解答页(/learn/),如 Can Claude Make Videos?、Do UGC Ads Work?;产品做不到的需求也回答，但不挂成工具链接", "GEO:AI 回答问题时最常引用一句话直答的页面"],
  ["每个链接是真实 <a href> 指向独立页面,不再用 /?mode=…&model=… 查询串", "查询串 = 首页重复内容,不会被单独收录(现有 Header / Footer 最大的漏洞)"],
  ["大菜单内容始终渲染在 HTML 里,只用 CSS 隐藏;手机抽屉手风琴同理", "爬虫不悬停、不点击,悬停才加载的链接等于不存在"],
  ["Header 9 个顶级(2026-11-19 照 Higgsfield):Image / Video / Audio / MCP / Agent / Studios / Resources / Affiliate / Pricing(菜单居中、不带下拉箭头) —— 前三个按媒介分(工具 + 模型放一起);Agent = Marketing Agent + 按团队 / 行业的方案 + 免费小工具;Studios = Design Studio / 3D Studio / Canvas / Hybrid Reel + 广告模板;Resources = 社区作品、Prompt Library、Blog、教程问答和对比", "用户按「我要做视频 / 图片 / 声音」找入口;每个下拉 = 一排图卡主入口(真实成片，图卡本身是链接)+ 两三列列表(超过 5 个收进 More,链接仍在 HTML 里)+ 底部一条当期推荐;/tools 和 /models 总页挂在列底「All …」"],
  ["MCP 保留顶级,含 for Claude / for ChatGPT 落地页", "GEO:AI 助手回答「能在 Claude 里做广告视频的工具」时要有页面可引用"],
  ["Footer 白底：上方「Explore more」标签云放长尾链接，下方 6 列核心链接，链接全在 HTML 里", "对标 Jupitrr(171)/ Higgsfield;首页权重经 Footer 传到每个落地页，视觉上只露核心链接"],
  ["免费小工具(/free-tools/,不登录就能用),工具页本身就是落地页", "竞品流量最大的一类(VEED 约 1,150 页、Opus 266、Jupitrr 40);做出结果后引导「Turn this into a video ad」"],
  ["广告模板库(按类型 / 平台 / 美英节日)", "invideo 109 页、VEED / Pippit / CapCut 都放顶级;吃「tiktok ad template」这类词"],
  ["模型子页(提示词指南 / 价格 / 教程)+ 模型对比(Seedance vs Kling)", "Pippit 每个模型 5–8 个子页;「X vs Y」是模型类第二大搜索意图"],
  ["Research 原创数据页(广告 hook 基准、最佳发布时间)", "AI 引用最多的内容类型(Opus /research 232 页);数据可来自 MediaLens 广告库"],
  ["Solutions 按团队 + 用途 + 行业(AI Marketing Videos / Agencies / Ecommerce / Small Business / Creators / Enterprise)", "Opus 10 类人群、Creatify 按业务类型;B2B 搜索按人群找工具"],
  ["FAQ 中心 + 术语表、客户案例、集成页、Press & Brand Kit", "AI 回答问题时直接摘 FAQ / 术语定义;案例和媒体包是可信度信号"],
  ["每个模型单独链接(视频 16 / 图片 18 / 音频 15,UAT 后台 Enabled + v1.13 上新)+ 按模态总页 /models/video|image|audio", "「模型名 + AI video generator」是本领域搜索量最大的一类词"],
  ["Alternatives 列:每个竞品一页,沿用 UAT 已上线的 /compare/topview 格式(替代品横评 + 案例 + FAQ + 核对日期)", "抢「topview alternatives」「creatify alternatives」;AI 回答「X 的替代品」最常引用这类页。不另开 vs 页,避免同词两页互抢"],
  ["Footer 顶部一段「BuzzVideo is …」实体定义", "和 llms.txt 开头同一句;AI 引用时最常摘的就是这种定义句"],
  ["「Ask AI about BuzzVideo」一行(预填提问,让 AI 读 llms.txt)", "Krea 在用,GEO 零成本"],
  ["Trust & Safety、Content Policy、What's New、llms.txt 链接", "AI 选择引用来源时看可信度信号"],
];

const BEYOND_NAV: [string, string][] = [
  ["/llms.txt + /llms-full.txt", "开头实体定义 + Last updated;「Instructions for AI assistants」段写清是什么 / 不是什么 / 适合谁 / 和 TopView、Creatify 等怎么比 / 价格实情(注册送积分、视频要订阅)/ 用户意图 → 网址对照;下架模型说明"],
  ["robots.txt", "加 Content-Signal: ai-train=yes, search=yes, ai-input=yes;逐个放行 GPTBot、ClaudeBot、PerplexityBot、Google-Extended 等"],
  ["结构化数据 JSON-LD", "全站 Organization + WebSite;首页 SoftwareApplication + FAQPage;所有页 BreadcrumbList;工具 / 模型页 FAQPage"],
  ["sitemap.xml", "新页面上线即进 sitemap;按目录拆分(tools / models / use-cases / compare)方便在 Search Console 看各栏数据"],
  ["旧查询串链接", "/?mode=…&model=… 全部换成新网址;已被收录的加 canonical 指向对应新页"],
  ["待建页面怎么上线", "页面没建好之前,对应链接先不放进 Header / Footer(避免 404 / 空页);每建好一批就放开一批"],
];

const FAMILY: [string, RegExp][] = [
  ["/ 工具页", /^\/tools/],
  ["/ 免费小工具", /^\/free-tools/],
  ["/ 模型页(含子页)", /^\/models/],
  ["/templates/ 广告模板", /^\/templates/],
  ["/solutions/ /use-cases/ 方案与用例", /^\/(solutions|use-cases|enterprise)/],
  ["/compare/ 竞品与模型对比、/best/ 榜单", /^\/(compare|best)/],
  ["/learn/ /research/ 教程与数据", /^\/(learn|research)/],
  ["/mcp/ /integrations/ 接入", /^\/(mcp|integrations|api)/],
  ["其他", /./],
];

function Notes({ links }: { links: NavLink[] }) {
  const pending = links.filter((l) => l.status !== "live");
  const families = FAMILY.map(([name, re], i) => ({
    name,
    items: pending.filter((l) => re.test(l.href) && !FAMILY.slice(0, i).some(([, r]) => r.test(l.href))),
  })).filter((f) => f.items.length);
  return (
    <section className="border-t border-[#ececf1] bg-white px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-[1040px] space-y-14 text-[#1a1a2e]">
        <div>
          <h2 className="text-[26px] font-extrabold tracking-tight">交接说明</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-[#6a6b7b]">
            本轮只改 Header 和 Footer。链接数据在 <code className="rounded bg-[#f5f5f7] px-1.5 py-0.5 text-[13px]">(v1.13)/site-nav/nav-data.ts</code>,每个链接标了状态(线上已有 / 原型或 UAT 已有 / 待建)。调研全文:
            <code className="rounded bg-[#f5f5f7] px-1.5 py-0.5 text-[13px]">docs/research/2026-11-18-header-footer-seo-geo.md</code>。
          </p>
        </div>

        <div>
          <h3 className="text-[18px] font-extrabold">每个设计对应的 SEO / GEO 依据</h3>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-[#ececf1]">
            <table className="w-full min-w-[640px] text-left text-[14px]">
              <thead className="bg-[#faf8f6] text-[12px] font-bold uppercase tracking-wider text-[#6a6b7b]">
                <tr>
                  <th className="px-4 py-3">设计</th>
                  <th className="px-4 py-3">依据</th>
                </tr>
              </thead>
              <tbody>
                {RATIONALE.map(([a, b]) => (
                  <tr key={a} className="border-t border-[#ececf1] align-top">
                    <td className="px-4 py-3 font-semibold">{a}</td>
                    <td className="px-4 py-3 text-[#6a6b7b]">{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 className="text-[18px] font-extrabold">交互说明</h3>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[14.5px] leading-relaxed text-[#3a3b4f]">
            <li>桌面(≥1280px;7 个顶级 + 登录按钮在 1024 宽放不下):悬停顶级项打开大菜单,移开 160ms 后关闭(斜穿到面板不会闪);点顶级项标题本身进总页(/tools、/models…);Tab 键进入菜单自动打开,Esc 关闭。</li>
            <li>浮层在菜单条正下方居中，每个菜单按内容定宽(两列 680、三列 / 图卡网格 800);切换时浮层不关闭，平滑变形到新的宽高，内容按移动方向左右滑入。每个菜单版式不同(照 Higgsfield):Image 底部两张推荐卡、Video 底部带图横幅、Audio 模型排两列、Agent / MCP / Studios / Community 有面板标题，Studios 是可筛选的大图卡网格。悬停模型或工具，浮层旁弹出详情卡(模型带时长 / 分辨率 / 参考图等要点，左列在左、右列在右)。内容太高时面板内滚动、底部渐隐，推荐区固定在底。顶级项下一块浅灰底跟着鼠标滑动;官网顶栏打开时页面轻微压暗。图卡悬停播放对应成片;系统开了「减少动态效果」只保留淡入淡出、不播视频。键盘：Tab 到顶级项自动打开,↓ 进入菜单第一项,Esc 关闭。</li>
            <li>登录后 app:顶栏左侧放同一套菜单(13px 紧凑版),右侧照旧 Invite + 积分 + 账号(1536px 以下 Invite 收起、团队名收成头像,侧栏底部仍有邀请卡);1280px 以下换成「Explore」按钮打开抽屉。左侧边栏不变。</li>
            <li>1280px 以下(平板 / 手机):访客页右上菜单按钮打开右侧抽屉,一级是手风琴、二级两列;Sign Up 固定在抽屉底部。Footer 不折叠：长尾链接标签云换行显示,5 列在手机上变 2 列。</li>
            <li>异常:模型下架 → 模型页改成「&lt;Model&gt; alternatives」继续保留,导航里撤掉该模型;Ask AI 链接是外链,新窗口打开;App Store 在 APP 上线前显示 Soon。</li>
          </ul>
        </div>

        <div>
          <h3 className="text-[18px] font-extrabold">导航之外、要和导航一起上线的</h3>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-[#ececf1]">
            <table className="w-full min-w-[640px] text-left text-[14px]">
              <tbody>
                {BEYOND_NAV.map(([a, b]) => (
                  <tr key={a} className="border-t border-[#ececf1] align-top first:border-0">
                    <td className="w-[200px] px-4 py-3 font-semibold">{a}</td>
                    <td className="px-4 py-3 text-[#6a6b7b]">{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 className="text-[18px] font-extrabold">
            待建 / 待上线页面清单 <span className="text-[15px] font-semibold text-[#9a9aab]">共 {pending.length} 个</span>
          </h3>
          <p className="mt-1.5 text-[14px] text-[#6a6b7b]">蓝点 = 原型或 UAT 已有、上线即可;橙点 = 要新建。</p>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {families.map((f) => (
              <div key={f.name} className="min-w-0 rounded-2xl border border-[#ececf1] p-5">
                <p className="text-[14px] font-bold">
                  {f.name} <span className="font-semibold text-[#9a9aab]">{f.items.length}</span>
                </p>
                <ul className="mt-3 space-y-1.5">
                  {f.items.map((l) => (
                    <li key={l.href} className="flex items-baseline gap-2 text-[13px]">
                      <span className={`size-1.5 shrink-0 translate-y-[-1px] rounded-full ${STATUS_DOT[l.status]}`} />
                      <span className="shrink-0 font-semibold">{l.label}</span>
                      <code className="min-w-0 truncate text-[12px] text-[#9a9aab]">{l.href}</code>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function SiteNavPage() {
  const [notify, toast] = useToast();
  const [view, setView] = useState<View>("site");
  const [part, setPart] = useState<Part>("header");
  const [mark, setMark] = useState(false);
  const links = useMemo(() => allLinks(), []);
  const counts = useMemo(() => {
    /* 「待建」只算还没做的;原型里已经做好的(如第 1 批模型页)单独计数 */
    const c: Record<LinkStatus, number> & { built: number } = { live: 0, uat: 0, new: 0, built: 0 };
    for (const l of links) {
      if (l.status === "new" && targetOf(l)) c.built += 1;
      else c[l.status] += 1;
    }
    return c;
  }, [links]);
  const onLink: OnLink = (l) => notify(`${l.label} → ${l.href}(${STATUS_LABEL[l.status]})`, "info");

  return (
    <div className="min-h-dvh bg-white" style={{ fontFamily: APPLE_FONT }}>
      {toast}
      <DemoBar part={part} setPart={setPart} view={view} setView={setView} mark={mark} setMark={setMark} counts={counts} />
      {view === "site" ? <SitePreview part={part} mark={mark} onLink={onLink} notify={(t) => notify(t, "info")} /> : <AppPreview part={part} mark={mark} onLink={onLink} notify={(t) => notify(t, "info")} />}
      <Notes links={links} />
    </div>
  );
}
