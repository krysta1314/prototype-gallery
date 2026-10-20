"use client";

import { CalendarClock, FileText, House, X, Megaphone, RotateCcw, UserPlus, Link2 } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { PROMO_CAMPAIGN, type PlanId } from "../app/data";
import { DEMO_ACCOUNTS, accountOf, type DemoAccountId } from "../app/accounts";
import { useDemoDispatch, useNav, useStore } from "../app/provider";
import { exitOfferLive, type PermissionKind, type PermissionValue, type SubscriptionSource } from "../app/store";
import { countdown, useNow } from "../app/components/useNow";
import type { PhoneHandle } from "../shell/Shell";
import type { Journey } from "./journeys";
import { moduleColorOf, navPathOf } from "./navTree";

/** 复制这一屏的链接(网址里带 ?j=旅程),发给别人打开就停在这一屏 */
function CopyLink() {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-[#5f6070] hover:bg-black/[0.05] hover:text-[#1a1a2e]"
    >
      <Link2 size={12} />
      {copied ? "已复制" : "复制链接"}
    </button>
  );
}

/** 右栏顶部的导航路径:首次安装 › 登录 › Apple 登录 › 第一次(和左栏一样，去掉重复的父级前缀) */
function crumb(j: Journey) {
  const path = navPathOf(j.id) ?? [];
  const parent = path[path.length - 1];
  const leaf = parent && j.title.startsWith(`${parent}:`) ? j.title.slice(parent.length + 1) : j.title;
  return [...path, leaf].join(" › ");
}
import { NOTES } from "./notes";
import { surfaceOf } from "./surface";
import { surfaceOfJourney } from "./journeySurface";

/** 右栏:当前场景、本屏需求说明 + 这台真机的状态开关(全部是演示控件,中文) */
export default function Inspector({ phone, journey, onReplay, part, left = 0 }: { phone: RefObject<PhoneHandle | null>; journey: Journey; onReplay: () => void; part: "states" | "notes"; /** 说明面板左边界(左栏宽度) */ left?: number }) {
  const { state } = useStore();
  const { nav } = useNav();
  const demo = useDemoDispatch();
  const now = useNow();
  // 说明默认收起，只留左下角图标，点开从底部升起(2026-10-20 定);切换旅程时整块重挂，回到收起
  const [notesOpen, setNotesOpen] = useState(false);
  const notesRef = useRef<HTMLDivElement>(null);
  // 只在刚展开时滚过去一次(这一屏每秒会重渲染，不能放在 ref 回调里)
  useEffect(() => {
    if (notesOpen) notesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [notesOpen]);
  const key = surfaceOf(state, nav);
  const note = NOTES[key];
  const { plan, source } = state.subscription;
  const account = accountOf(state);
  const credits = state.credits[state.workspace];

  const setPlan = (p: PlanId, src: SubscriptionSource = source === "none" ? "app" : source) =>
    demo({ type: "demo/setPlan", plan: p, source: src, ...(p === "free" ? {} : { period: "yearly" as const }) });
  const setPerm = (kind: PermissionKind) => (value: PermissionValue) => demo({ type: "demo/setPermission", kind, value });

  // 状态开关跟着左栏选中的旅程走(按这条旅程预置的那一屏挑相关开关),在真机里怎么点都不跳;
  // 不相关的收进「其他状态」。需求说明仍按真机当前屏显示
  const stateKey = surfaceOfJourney(journey);
  const signedInScreen = !/^(onboarding|login|email-|auth-|perm-tracking|perm-push)/.test(stateKey);
  // "email-" 这类以 - 结尾的按前缀匹配;其余精确匹配(或它的子屏,如 auth-apple → auth-apple-sheet)
  const is = (...keys: string[]) => keys.some((p) => (p.endsWith("-") ? stateKey.startsWith(p) : stateKey === p || stateKey.startsWith(`${p}-`)));
  const controls: { id: string; show: boolean; el: ReactNode }[] = [
    {
      id: "account",
      show: signedInScreen,
      el: (
        <Field label="演示账号" hint={`${DEMO_ACCOUNTS.find((x) => x.id === account)!.hint}。真实 APP:服务端会员状态 + 所在组织`}>
          <Seg value={account} onChange={(id) => demo({ type: "demo/setAccount", account: id })} options={DEMO_ACCOUNTS.map((x) => [x.id, x.label] as [DemoAccountId, string])} />
          {account === "enterprise" ? (
            <div className="mt-1.5">
              <Seg
                value={state.roles.presslogic ?? "member"}
                onChange={(role) => demo({ type: "demo/setRole", workspace: "presslogic", role })}
                options={[
                  ["member", "组织成员"],
                  ["admin", "Admin"],
                  ["owner", "Owner"],
                ]}
              />
            </div>
          ) : null}
          {plan !== "free" ? (
            <div className="mt-1.5">
              <Seg
                value={source === "web" ? "web" : "app"}
                onChange={(src) => setPlan(plan, src)}
                options={[
                  ["app", "APP 内购"],
                  ["web", "网页订阅"],
                ]}
              />
            </div>
          ) : null}
        </Field>
      ),
    },
    {
      id: "subState",
      show: plan !== "free" && is("me", "subscription", "plans", "settings"),
      el: (
        <Field label="订阅状态" hint="真实 APP:App Store / 网页订阅的服务端状态">
          {source === "app" ? (
            <div className="space-y-1.5">
              <Switch label="已取消自动续费(到期回 Free)" on={!!state.subscription.cancelled} onChange={(on) => demo({ type: "demo/setCancelled", on })} />
              <Switch label="续费扣款失败(宽限期)" on={!!state.subscription.billingRetry} onChange={(on) => demo({ type: "demo/setBillingRetry", on })} />
            </div>
          ) : (
            <Switch label="App Store 也订了一份(重复订阅)" on={!!state.subscription.duplicateApp} onChange={(on) => demo({ type: "demo/setDuplicate", on })} />
          )}
        </Field>
      ),
    },
    {
      id: "region",
      show: is("plans", "exitOffer", "subscription", "me"),
      el: (
        <Field label="地区" hint="真实 APP:App Store 区域。美区才有网页付款外链">
          <Seg
            value={state.region}
            onChange={(region) => demo({ type: "setRegion", region })}
            options={[
              ["us", "美区"],
              ["other", "其他地区"],
            ]}
          />
        </Field>
      ),
    },
    {
      id: "credits",
      show: is("create", "me", "plans", "sheet-topUp", "useCase", "sheet-model", "sheet-mode", "work"),
      el: (
        <Field label={`积分余额(${state.workspace === "personal" ? "个人" : "组织"})`} hint="真实 APP:服务端积分账本,两端共用">
          <Seg
            value={String(credits)}
            onChange={(v) => demo({ type: "demo/setCredits", credits: Number(v) })}
            options={[
              ["20", "20"],
              ["500", "500"],
              ["4900", "4,900"],
              ["18400", "18,400"],
            ]}
          />
        </Field>
      ),
    },
    {
      id: "assets",
      show: is("me"),
      el: (
        <Field label="素材" hint="真实 APP:服务端作品与素材库">
          <Switch
            label="素材为空(新用户,没生成过)"
            on={!state.jobs.some((j) => j.workspace === "personal") && state.library.length === 0}
            onChange={(on) => demo({ type: "demo/setEmptyLibrary", on })}
          />
        </Field>
      ),
    },
    {
      id: "apple",
      show: is("login", "auth-apple"),
      el: (
        <Field label="Apple 账户" hint="真实 APP:登录过 BuzzVideo 的 Apple 账户，系统面板不再问姓名和邮箱">
          <Seg
            value={state.appleKnown ? "known" : "first"}
            onChange={(v) => demo({ type: "demo/setAppleKnown", on: v === "known" })}
            options={[
              ["first", "第一次登录"],
              ["known", "登录过"],
            ]}
          />
        </Field>
      ),
    },
    {
      id: "emailCode",
      show: is("email-"),
      el: (
        <Field label="邮箱验证码结果" hint="真实 APP:服务端校验验证码">
          <Seg
            value={state.emailCodeSim}
            onChange={(sim) => demo({ type: "demo/setEmailCodeSim", sim })}
            options={[
              ["ok", "正确"],
              ["wrong", "输错"],
              ["expired", "已过期"],
            ]}
          />
        </Field>
      ),
    },
    {
      id: "purchase",
      show: is("plans", "exitOffer", "sheet-topUp"),
      el: (
        <Field label="App Store 购买结果" hint="真实 APP:StoreKit 的结果。用户在确认框点 Cancel 不算失败">
          <Seg
            value={state.storekit.purchase}
            onChange={(purchase) => demo({ type: "demo/setStoreKit", patch: { purchase } })}
            options={[
              ["success", "成功"],
              ["failed", "失败"],
              ["pending", "待家长批准"],
            ]}
          />
          <div className="mt-1.5">
            <Switch label="拉价失败(App Store 商品信息)" on={state.faults.prices} onChange={(prices) => demo({ type: "demo/setFaults", patch: { prices } })} />
          </div>
        </Field>
      ),
    },
    {
      id: "restore",
      show: is("plans", "subscription", "settings"),
      el: (
        <Field label="恢复购买结果" hint="真实 APP:StoreKit 的结果">
          <Seg
            value={state.storekit.restore}
            onChange={(restore) => demo({ type: "demo/setStoreKit", patch: { restore } })}
            options={[
              ["restored", "恢复成功"],
              ["none", "没有记录"],
              ["otherAccount", "属于其他账号"],
            ]}
          />
        </Field>
      ),
    },
    {
      id: "media",
      show: is("onboarding", "work", "inspire", "useCase"),
      el: (
        <Field label="加载" hint="真实 APP:由网络环境决定">
          <Switch label="广告片 / 视频加载失败" on={state.faults.media} onChange={(media) => demo({ type: "demo/setFaults", patch: { media } })} />
        </Field>
      ),
    },
    {
      id: "offline",
      show: is("login", "auth-", "email-", "plans", "exitOffer", "sheet-topUp", "create", "inspire", "settings", "subscription"),
      el: (
        <Field label="网络" hint="真实 APP:由网络环境决定">
          <Switch label="断网" on={state.faults.offline} onChange={(offline) => demo({ type: "demo/setFaults", patch: { offline } })} />
        </Field>
      ),
    },
    {
      id: "perms",
      show: is("onboarding", "perm-", "login", "settings", "marketingOptIn", "create", "sheet-attach", "camera"),
      el: (
        <Field label="系统权限" hint="真实 APP:iOS 系统设置">
          {is("onboarding", "perm-tracking", "login") ? <PermRow label="ATT 追踪" value={state.permissions.tracking} onChange={setPerm("tracking")} /> : null}
          {is("perm-push", "login", "settings", "marketingOptIn") ? <PermRow label="推送" value={state.permissions.push} onChange={setPerm("push")} /> : null}
          {is("create", "sheet-attach", "camera", "perm-camera", "perm-photos") ? <PermRow label="相机" value={state.permissions.camera} onChange={setPerm("camera")} /> : null}
          {!is("onboarding", "perm-", "login", "settings", "marketingOptIn", "create", "sheet-attach", "camera") ? (
            <>
              <PermRow label="ATT 追踪" value={state.permissions.tracking} onChange={setPerm("tracking")} />
              <PermRow label="推送" value={state.permissions.push} onChange={setPerm("push")} />
              <PermRow label="相机" value={state.permissions.camera} onChange={setPerm("camera")} />
            </>
          ) : null}
        </Field>
      ),
    },
    {
      id: "exitOffer",
      show: is("plans", "exitOffer", "inspire"),
      el: (
        <Field label="挽留优惠" hint="开关 = 服务端配置(审核被拒时可远程关);记录存本机，每台手机一次，卸载重装才重置;弹出起 24 小时有效(真实倒计时)">
          <Switch label="挽留功能开启(关付费墙弹挽留页)" on={state.exitOfferEnabled} onChange={(on) => demo({ type: "demo/setExitOfferEnabled", on })} />
          <div className="mt-1.5">
            <Switch label="这个 Apple ID 已用过 Starter 首期优惠" on={state.introOfferUsed} onChange={(on) => demo({ type: "demo/setIntroUsed", on })} />
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-2 text-[13px]">
            <span className="text-[#3a3b45]">
              {!state.exitOfferEnabled ? "已关闭(关付费墙直接关)" : state.introOfferUsed ? "Apple ID 用过首期(关付费墙直接关)" : !state.exitOfferUsed ? "未用(关闭付费墙会弹)" : exitOfferLive(state, now) ? `进行中 · 剩 ${countdown(state.exitOfferExpiresAt - now)}` : "已用过 / 已到期"}
            </span>
            <span className="flex shrink-0 gap-1.5">
              {exitOfferLive(state, now) ? <SmallButton onClick={() => demo({ type: "demo/expireExitOffer" })}>模拟到期</SmallButton> : null}
              {state.exitOfferUsed ? <SmallButton onClick={() => demo({ type: "demo/resetExitOffer" })}>重置</SmallButton> : null}
            </span>
          </div>
        </Field>
      ),
    },
    {
      id: "promo",
      show: is("inspire", "promo", "plans", "campaignPush"),
      el: (
        <Field label="运营活动" hint="真实 APP:GET /api/promo/active(admin 配置)">
          <Switch label="活动在线(+35% 积分)" on={!!state.activePromo} onChange={(on) => demo({ type: "promoLoaded", campaign: on ? PROMO_CAMPAIGN : null })} />
          <div className="mt-1.5 flex items-center justify-between text-[12px] text-[#5f6070]">
            <span>{`弹窗已弹 ${state.promoViews[PROMO_CAMPAIGN.id] ?? 0}/${PROMO_CAMPAIGN.frequency.maxPerUser} 次`}</span>
            <SmallButton onClick={() => demo({ type: "demo/resetPromo" })}>重置频控</SmallButton>
          </div>
        </Field>
      ),
    },
    {
      id: "marketing",
      show: is("settings", "marketingOptIn", "campaignPush", "promo"),
      el: (
        <Field label="营销推送" hint="真实 APP:设置里的 Offers & news">
          <Switch label="Offers & news" on={state.marketingPush} onChange={(on) => demo({ type: "setMarketingPush", on })} />
        </Field>
      ),
    },
    // 模拟事件:同样只在相关的屏出现
    {
      id: "coldStart",
      show: is("inspire", "plans", "promo"),
      el: <Action icon={<CalendarClock size={14} />} onClick={() => phone.current?.coldStart()} label="过 24 小时冷启动" hint={`第 ${state.today} 个 24 小时 → 第 ${state.today + 1} 个`} />,
    },
    {
      id: "renew",
      show: is("me", "subscription"),
      el: (
        <div className="space-y-1.5">
          <Action
            icon={<CalendarClock size={14} />}
            onClick={() => demo({ type: "subscriptionRenewed" })}
            label="到续费日"
            hint={
              state.subscription.source !== "app" || state.subscription.plan === "free"
                ? "只对 APP 内订阅"
                : state.subscription.cancelled
                  ? "已取消 → 回 Free"
                  : state.subscription.pendingChange
                    ? "待生效的变更生效"
                    : "续费 + 订阅积分重置"
            }
          />
          <Action
            icon={<CalendarClock size={14} />}
            onClick={() => demo({ type: "monthlyCreditsReset" })}
            label="新的计费月(订阅积分重置)"
            hint={state.subscription.plan === "free" ? "只对会员" : undefined}
          />
        </div>
      ),
    },
    {
      id: "campaignPush",
      show: is("inspire", "promo", "campaignPush", "settings"),
      el: (
        <Action
          icon={<Megaphone size={14} />}
          onClick={() => demo({ type: "campaignPushReceived", campaignId: PROMO_CAMPAIGN.id })}
          label="推送活动通知"
          hint={!state.activePromo ? "先打开活动" : !state.marketingPush ? "用户没开 Offers & news,收不到" : undefined}
        />
      ),
    },
    {
      id: "inviteReward",
      show: is("inviteFriends", "me"),
      el: <Action icon={<UserPlus size={14} />} onClick={() => demo({ type: "inviteRewardGranted" })} label="好友订阅了(邀请奖励 +1,500)" hint={`${state.inviteRewards}/10`} />,
    },
    { id: "home", show: false, el: <Action icon={<House size={14} />} onClick={() => phone.current?.goHome()} label="回到桌面" /> },
  ];
  const here = controls.filter((c) => c.show);

  // APP 评审原型布局(2026-10-20 定):上面左手机、右演示状态(只列这条旅程相关的);下面白底区放路径 + 功能说明 + 异常情况
  if (part === "states")
    return (
      <section className="space-y-4 rounded-xl bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.05]">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[15px] font-semibold">演示状态</h2>
          <button type="button" onClick={onReplay} className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[12px] text-[#5f6070] hover:bg-black/[0.05] hover:text-[#1a1a2e]">
            <RotateCcw size={12} />
            重来这一步
          </button>
        </div>
        {here.length ? here.map((c) => <div key={c.id}>{c.el}</div>) : <p className="text-[12px] text-[#8e8d99]">这一屏没有需要切换的状态。</p>}
      </section>
    );

  return (
    <>
      {/* 平时只留左下角一个图标，不占手机的高度;点开后说明接在手机下方(不盖住原型)并滚过去(2026-10-20 定) */}
      {!notesOpen ? (
        <button
          type="button"
          onClick={() => setNotesOpen(true)}
          aria-label="展开说明"
          title="功能说明 / 异常情况"
          className="fixed bottom-5 z-20 flex size-11 items-center justify-center rounded-full bg-white text-[#3a3b45] shadow-[0_2px_10px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.06] hover:text-[#1a1a2e]"
          style={{ left: left + 20 }}
        >
          <FileText size={18} />
        </button>
      ) : (
        // 展开后放在手机下方的正常文档流里(不浮在原型上),并滚到这里;手机仍在上面，往回滚就看到
        <div
          ref={notesRef}
          className="mt-6 min-h-[70vh] w-full border-t border-black/[0.08] bg-white"
        >
          <div className="flex items-center justify-between gap-3 border-b border-black/[0.06] px-8 py-3">
            <span className="truncate text-[12px] font-medium tracking-wide" style={{ color: moduleColorOf(journey.id) ?? "#ff5e1a" }}>
              {crumb(journey)}
            </span>
            <div className="flex shrink-0 items-center gap-1">
              <CopyLink />
              <button type="button" onClick={() => setNotesOpen(false)} aria-label="收起说明" className="rounded-md p-1 text-[#5f6070] hover:bg-black/[0.05] hover:text-[#1a1a2e]">
                <X size={16} />
              </button>
            </div>
          </div>
          <section className="px-8 pt-5 pb-12">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-[15px] font-semibold">{note?.title ?? "此屏暂无说明"}</h2>
              {note ? <span className="shrink-0 rounded-md bg-[#f2f2f5] px-1.5 py-0.5 text-[11px] font-medium text-[#5f6070]">{note.spec}</span> : null}
            </div>
            {note ? (
              <div className="mt-3 space-y-5">
                <NoteList label="功能说明" items={note.rules} />
                <NoteList label="异常情况" items={note.errors} />
              </div>
            ) : (
              <p className="mt-2 text-[12px] text-[#5f6070]">{key}</p>
            )}
          </section>
        </div>
      )}
    </>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[12px] font-medium text-[#5f6070]">{label}</p>
      {children}
      {hint ? <p className="mt-1 text-[11px] leading-[15px] text-[#8e8d99]">{hint}</p> : null}
    </div>
  );
}

/** 分段按钮(不用原生 select) */
function Seg<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: [T, string][] }) {
  return (
    <div className="flex rounded-lg bg-black/[0.05] p-0.5" role="radiogroup">
      {options.map(([v, label]) => {
        const on = v === value;
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(v)}
            className={`h-7 flex-1 rounded-md text-[12px] transition-colors focus-visible:outline-2 focus-visible:outline-[#ff5e1a] ${
              on ? "bg-white font-medium text-[#1a1a2e] shadow-[0_1px_2px_rgba(26,26,46,0.1)]" : "text-[#5f6070] hover:text-[#1a1a2e]"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function PermRow({ label, value, onChange }: { label: string; value: PermissionValue; onChange: (v: PermissionValue) => void }) {
  return (
    <div className="mb-1.5 flex items-center gap-2">
      <span className="w-14 shrink-0 text-[12px] text-[#3a3b45]">{label}</span>
      <div className="flex-1">
        <Seg
          value={value === "limited" ? "granted" : value}
          onChange={onChange}
          options={[
            ["undetermined", "未决定"],
            ["granted", "允许"],
            ["denied", "拒绝"],
          ]}
        />
      </div>
    </div>
  );
}

function Switch({ label, on, onChange }: { label: string; on: boolean; onChange: (on: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className="flex w-full items-center justify-between text-left text-[13px] text-[#3a3b45]">
      {label}
      <span className={`relative h-5 w-9 rounded-full transition-colors ${on ? "bg-[#ff5e1a]" : "bg-black/[0.15]"}`}>
        <span className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-[left] ${on ? "left-[18px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}

function SmallButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="rounded-md border border-black/[0.1] bg-white px-2 py-0.5 text-[12px] text-[#3a3b45] hover:border-black/[0.2]">
      {children}
    </button>
  );
}

function Action({ icon, label, hint, onClick }: { icon: ReactNode; label: string; hint?: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-left text-[13px] text-[#1a1a2e] transition-colors hover:border-[#ff5e1a]/50 focus-visible:outline-2 focus-visible:outline-[#ff5e1a]"
    >
      <span className="text-[#5f6070]">{icon}</span>
      <span className="flex-1">{label}</span>
      {hint ? <span className="text-[11px] text-[#8e8d99]">{hint}</span> : null}
    </button>
  );
}

function NoteList({ label, items }: { label: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <p className="mb-1 text-[11px] font-medium text-[#8e8d99]">{label}</p>
      <ul className="space-y-1.5">
        {items.map((p) => (
          <li key={p} className="flex gap-2 text-[13px] leading-[19px] text-[#3a3b45]">
            <span className="mt-[7px] size-1 shrink-0 rounded-full bg-[#8e8d99]" />
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}
