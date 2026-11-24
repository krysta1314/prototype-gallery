"use client";

/* 官网 Header / Footer · SEO + GEO 改版(2026-11-18)。
   顶部演示条先选 Header / Footer tab,再切「访客页面 / 登录后 app」,「标出页面状态」给每个链接加色点(绿 = 线上已有、蓝 = 原型 / UAT 已有、橙 = 待建)。
   本轮只改导航(Monica 2026-11-18 定);首页正文 2026-11-24 起复用 v1.4 homepage 原型。下方的交接说明已去掉(Monica 2026-11-24:UI 做完后另写需求文档)。
   调研:docs/research/2026-11-18-header-footer-seo-geo.md */

import { useMemo, useState } from "react";
import { CircleHelp, Gift, UserPlus } from "lucide-react";
import { useToast } from "../../(v1.7)/blog/toast";
import { APPLE_FONT } from "../../(v1.12)/hybrid-reel/agent/chat/shell";
import { allLinks, STATUS_LABEL, type LinkStatus } from "./nav-data";
import { SiteNavHeader, STATUS_DOT, targetOf, type OnLink } from "./SiteNavHeader";
import { SiteFooter } from "./SiteFooter";
/* 首页正文：直接复用 v1.4 的产品首页原型(和线上 buzzvideo.ai 首页同一套内容),不另画一份 */
import { HomepageContent } from "../../(v1.4)/homepage/page";
import { MarketingAgentPromptComposer } from "../../(v1.4)/marketing-agent-v14/page";

/** 演示条：登录状态(2026-11-24 Monica:演示出「未登录 / 已登录」,已登录时 Sign Up 换成账号区) */
type Auth = "out" | "in";
/** 演示条第一组 tab:看 Header 还是看 Footer */
type Part = "header" | "footer";


/* ───────── 演示条 ───────── */

function DemoBar({ part, setPart, auth, setAuth, mark, setMark, counts, }: { part: Part; setPart: (p: Part) => void; auth: Auth; setAuth: (a: Auth) => void; mark: boolean; setMark: (v: boolean) => void; counts: Record<LinkStatus, number> & { built: number } }) {
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
      <div role="group" aria-label="登录状态" className="flex rounded-[10px] bg-white/10 p-0.5">
        {(["out", "in"] as Auth[]).map((a) => (
          <button
            key={a}
            type="button"
            aria-pressed={auth === a}
            onClick={() => setAuth(a)}
            className={`h-8 rounded-lg px-3 text-[13px] font-bold transition ${auth === a ? "bg-white text-[#1a1a2e] shadow-sm" : "text-white/70 hover:text-white"}`}
          >
            {a === "out" ? "未登录" : "已登录"}
          </button>
        ))}
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

/* 已登录时顶栏右侧的账号区(照线上产品顶栏):Invite · 积分 · 礼物(有红点)· 帮助 · 头像。
   点击都只出 toast 说明交互，不做真实弹窗。手机上只留积分和头像，其余收进头像菜单。 */
function AccountArea({ notify }: { notify: (t: string) => void }) {
  const ghost = "grid size-9 place-items-center rounded-full text-[#240A03] transition hover:bg-[#240A03]/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF744D]/50";
  return (
    <div className="flex items-center gap-1.5 sm:gap-2.5">
      <button
        type="button"
        onClick={() => notify("Invite:打开邀请好友弹窗(复制邀请链接，双方各得积分)")}
        className="hidden h-9 items-center gap-1.5 rounded-full border border-[#240A03]/15 bg-white px-3.5 text-[13.5px] font-bold text-[#240A03] transition hover:bg-[#FFF3EC] lg:inline-flex"
      >
        <UserPlus aria-hidden className="size-4" strokeWidth={2.2} />
        Invite
      </button>
      <button
        type="button"
        onClick={() => notify("积分：点击进入 Pricing / 充值页;数字是当前工作区的可用积分")}
        aria-label="1,127,273 credits"
        className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#FFF0EA] px-3 text-[14.5px] font-bold tabular-nums text-[#FF5E3A] transition hover:bg-[#FFE4DA]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/prototypes/homepage/credits-icon.svg" alt="" className="size-[18px]" />
        1,127,273
      </button>
      <button type="button" onClick={() => notify("礼物：打开活动 / 奖励面板;红点表示有未领取的奖励")} aria-label="Rewards, 1 new" className={`${ghost} relative max-sm:hidden`}>
        <Gift aria-hidden className="size-[22px] text-[#FF5E3A]" strokeWidth={1.9} />
        <span aria-hidden className="absolute right-1.5 top-1.5 size-2 rounded-full bg-[#FF2D6F] ring-2 ring-white" />
      </button>
      <span aria-hidden className="mx-0.5 h-5 w-px bg-[#240A03]/15 max-sm:hidden" />
      <button type="button" onClick={() => notify("帮助：打开 Help Center")} aria-label="Help" className={`${ghost} max-sm:hidden`}>
        <CircleHelp aria-hidden className="size-[22px]" strokeWidth={1.8} />
      </button>
      <button
        type="button"
        onClick={() => notify("头像：打开账号菜单(工作区切换、设置、账单、退出登录)")}
        aria-label="Account menu"
        className="grid size-9 place-items-center rounded-full bg-[#240A03] text-[13px] font-bold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF744D]/50"
      >
        M
      </button>
    </div>
  );
}

function SitePreview({ part, auth, mark, onLink, notify }: { part: Part; auth: Auth; mark: boolean; onLink: OnLink; notify: (t: string) => void }) {
  /* Footer tab:只看 Footer(直接顶到演示条下面) */
  if (part === "footer") return <SiteFooter mark={mark} onLink={onLink} notify={notify} />;
  return (
    <div className="bg-white">
      <SiteNavHeader
        glass
        mark={mark}
        onLink={onLink}
        /* 未登录：点 Sign Up 只出 toast 说明交互(打开登录 / 注册弹窗),原型里不做弹窗 */
        onAuth={() => notify("Sign Up:打开登录 / 注册弹窗(Google、邮箱验证码);登录成功后留在当前页，顶栏右侧换成账号区")}
        account={auth === "in" ? <AccountArea notify={notify} /> : undefined}
      />
      {/* 首页正文(Monica 2026-11-24:补上现在的首页)。访客 = 未登录状态;下面接 Footer,整页和线上一样能一路滚到底 */}
      <div className="relative">
        <HomepageContent embedded live promoUserState={auth === "in" ? "member" : "logged-out"} />
        {/* 底部悬浮的 Marketing Agent 输入框(线上首页一直贴在底部);只在首页正文范围内吸底，到 Footer 就停 */}
        <div className="pointer-events-none sticky bottom-4 z-40 flex justify-center px-3 pb-4 sm:bottom-5">
          <MarketingAgentPromptComposer className="pointer-events-auto w-[min(860px,100%)]" />
        </div>
      </div>
      <SiteFooter mark={mark} onLink={onLink} notify={notify} />
    </div>
  );
}

export default function SiteNavPage() {
  const [notify, toast] = useToast();
  const [part, setPart] = useState<Part>("header");
  const [auth, setAuth] = useState<Auth>("out");
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
      <DemoBar part={part} setPart={setPart} auth={auth} setAuth={setAuth} mark={mark} setMark={setMark} counts={counts} />
      {/* 2026-11-24 Monica:去掉「访客页面 / 登录后 app」切换，这页只演示官网(访客)的 Header / Footer / 首页;登录后的产品在各自的 app 原型里看，app 侧栏的 logo 和 Home 链回这页 */}
      <SitePreview part={part} auth={auth} mark={mark} onLink={onLink} notify={(t) => notify(t, "info")} />
    </div>
  );
}
