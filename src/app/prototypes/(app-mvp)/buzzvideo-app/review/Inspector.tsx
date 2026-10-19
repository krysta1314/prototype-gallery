"use client";

import { CalendarClock, House, Megaphone, RotateCcw, UserPlus, Link2 } from "lucide-react";
import { useState, type ReactNode, type RefObject } from "react";
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
      className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-[#5f6070] hover:bg-white hover:text-[#1a1a2e]"
    >
      <Link2 size={12} />
      {copied ? "已复制" : "复制链接"}
    </button>
  );
}

/** 右栏顶部的导航路径:首次打开 › 登录 › Apple 登录 › 第一次(和左栏一样，去掉重复的父级前缀) */
function crumb(j: Journey) {
  const path = navPathOf(j.id) ?? [];
  const parent = path[path.length - 1];
  const leaf = parent && j.title.startsWith(`${parent}:`) ? j.title.slice(parent.length + 1) : j.title;
  return [...path, leaf].join(" › ");
}
import { NOTES } from "./notes";
import { surfaceOf } from "./surface";

/** 右栏:当前场景、本屏需求说明 + 这台真机的状态开关(全部是演示控件,中文) */
export default function Inspector({ phone, journey, onReplay }: { phone: RefObject<PhoneHandle | null>; journey: Journey; onReplay: () => void }) {
  const { state } = useStore();
  const { nav } = useNav();
  const demo = useDemoDispatch();
  const now = useNow();
  const key = surfaceOf(state, nav);
  const note = NOTES[key];
  const { plan, source } = state.subscription;
  const account = accountOf(state);
  const credits = state.credits[state.workspace];

  const setPlan = (p: PlanId, src: SubscriptionSource = source === "none" ? "app" : source) => demo({ type: "demo/setPlan", plan: p, source: src, ...(p === "free" ? {} : { period: "yearly" as const }) });
  const setPerm = (kind: PermissionKind) => (value: PermissionValue) => demo({ type: "demo/setPermission", kind, value });

  return (
    <aside className="flex min-h-0 flex-col border-l border-black/[0.06] bg-[#f4f4f6]">
      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* 当前旅程的场景:前置条件 + 预期结果(验收点) */}
        <section className="border-b border-black/[0.06] px-5 py-4">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[11px] font-medium tracking-wide" style={{ color: moduleColorOf(journey.id) ?? "#ff5e1a" }}>{crumb(journey)}</p>
            <CopyLink />
          </div>
          <p className="mt-1.5 text-[13px] leading-[19px] text-[#3a3b45]">
            <span className="font-medium text-[#1a1a2e]">前置:</span>
            {journey.given}
          </p>
          <ul className="mt-1.5 space-y-1">
            {journey.expect.map((e) => (
              <li key={e} className="flex gap-2 text-[13px] leading-[19px] text-[#3a3b45]">
                <span className="mt-[3px] shrink-0 text-[11px] text-[#16794a]">✓</span>
                {e}
              </li>
            ))}
          </ul>
        </section>

        {/* 当前屏需求:功能说明 / 状态与分支 / 边界情况 / 异常处理 / 埋点 */}
        <section className="border-b border-black/[0.06] px-5 py-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-[15px] font-semibold">{note?.title ?? "此屏暂无说明"}</h2>
            {note ? <span className="shrink-0 rounded-md bg-white px-1.5 py-0.5 text-[11px] font-medium text-[#5f6070]">{note.spec}</span> : null}
          </div>
          {note ? (
            <div className="mt-3 space-y-4">
              <NoteList label="功能说明" items={note.rules} />
              <NoteList label="状态与分支" items={note.states} />
              <NoteList label="边界情况" items={note.edge} />
              <NoteList label="异常处理" items={note.errors} />
            </div>
          ) : (
            <p className="mt-2 text-[12px] text-[#5f6070]">{key}</p>
          )}
        </section>

        {/* 状态 */}
        <section className="space-y-4 px-5 py-5">
          <h2 className="text-[15px] font-semibold">状态</h2>

          <Field label="地区" hint="真实 APP:App Store 区域。美区才有网页付款外链">
            <Seg value={state.region} onChange={(region) => demo({ type: "setRegion", region })} options={[["us", "美区"], ["other", "其他地区"]]} />
          </Field>

          <Field label="演示账号" hint={`${DEMO_ACCOUNTS.find((x) => x.id === account)!.hint}。真实 APP:服务端会员状态 + 所在组织`}>
            <Seg value={account} onChange={(id) => demo({ type: "demo/setAccount", account: id })} options={DEMO_ACCOUNTS.map((x) => [x.id, x.label] as [DemoAccountId, string])} />
            {account === "enterprise" ? (
              <div className="mt-1.5">
                <Seg
                  value={state.roles.presslogic ?? "member"}
                  onChange={(role) => demo({ type: "demo/setRole", workspace: "presslogic", role })}
                  options={[["member", "组织成员"], ["admin", "Admin"], ["owner", "Owner"]]}
                />
              </div>
            ) : null}
            {plan !== "free" ? (
              <div className="mt-1.5">
                <Seg value={source === "web" ? "web" : "app"} onChange={(src) => setPlan(plan, src)} options={[["app", "APP 内购"], ["web", "网页订阅"]]} />
              </div>
            ) : null}
            {plan !== "free" && source === "app" ? (
              <div className="mt-2 space-y-1.5">
                <Switch label="已取消自动续费(到期回 Free)" on={!!state.subscription.cancelled} onChange={(on) => demo({ type: "demo/setCancelled", on })} />
                <Switch label="续费扣款失败(宽限期)" on={!!state.subscription.billingRetry} onChange={(on) => demo({ type: "demo/setBillingRetry", on })} />
              </div>
            ) : null}
            {plan !== "free" && source === "web" ? (
              <div className="mt-2">
                <Switch label="App Store 也订了一份(重复订阅)" on={!!state.subscription.duplicateApp} onChange={(on) => demo({ type: "demo/setDuplicate", on })} />
              </div>
            ) : null}
          </Field>

          <Field label={`积分余额(${state.workspace === "personal" ? "个人" : "组织"})`} hint="真实 APP:服务端积分账本,两端共用">
            <Seg value={String(credits)} onChange={(v) => demo({ type: "demo/setCredits", credits: Number(v) })} options={[["20", "20"], ["500", "500"], ["4900", "4,900"], ["18400", "18,400"]]} />
          </Field>

          <Field label="素材" hint="真实 APP:服务端作品与素材库">
            <Switch
              label="素材为空(新用户,没生成过)"
              on={!state.jobs.some((j) => j.workspace === "personal") && state.library.length === 0}
              onChange={(on) => demo({ type: "demo/setEmptyLibrary", on })}
            />
          </Field>

          <Field label="Apple 账户" hint="真实 APP:登录过 BuzzVideo 的 Apple 账户，系统面板不再问姓名和邮箱">
            <Seg value={state.appleKnown ? "known" : "first"} onChange={(v) => demo({ type: "demo/setAppleKnown", on: v === "known" })} options={[["first", "第一次登录"], ["known", "登录过"]]} />
          </Field>

          <Field label="邮箱验证码结果" hint="真实 APP:服务端校验验证码">
            <Seg value={state.emailCodeSim} onChange={(sim) => demo({ type: "demo/setEmailCodeSim", sim })} options={[["ok", "正确"], ["wrong", "输错"], ["expired", "已过期"]]} />
          </Field>

          <Field label="网络与加载" hint="真实 APP:由网络环境和第三方服务决定">
            <div className="space-y-1.5">
              <Switch label="断网" on={state.faults.offline} onChange={(offline) => demo({ type: "demo/setFaults", patch: { offline } })} />
              <Switch label="拉价失败(App Store 商品信息)" on={state.faults.prices} onChange={(prices) => demo({ type: "demo/setFaults", patch: { prices } })} />
              <Switch label="第三方登录失败" on={state.faults.signIn} onChange={(signIn) => demo({ type: "demo/setFaults", patch: { signIn } })} />
              <Switch label="广告片 / 视频加载失败" on={state.faults.media} onChange={(media) => demo({ type: "demo/setFaults", patch: { media } })} />
            </div>
          </Field>

          <Field label="App Store 返回结果" hint="真实 APP:StoreKit 的结果。用户在确认框点 Cancel 不算失败">
            <p className="mb-1 text-[11px] text-[#8e8d99]">购买</p>
            <Seg value={state.storekit.purchase} onChange={(purchase) => demo({ type: "demo/setStoreKit", patch: { purchase } })} options={[["success", "成功"], ["failed", "失败"], ["pending", "待家长批准"]]} />
            <p className="mb-1 mt-2 text-[11px] text-[#8e8d99]">恢复购买</p>
            <Seg value={state.storekit.restore} onChange={(restore) => demo({ type: "demo/setStoreKit", patch: { restore } })} options={[["restored", "恢复成功"], ["none", "没有记录"], ["otherAccount", "属于其他账号"]]} />
          </Field>

          <Field label="系统权限" hint="真实 APP:iOS 系统设置">
            <PermRow label="推送" value={state.permissions.push} onChange={setPerm("push")} />
            <PermRow label="ATT 追踪" value={state.permissions.tracking} onChange={setPerm("tracking")} />
            <PermRow label="相机" value={state.permissions.camera} onChange={setPerm("camera")} />
          </Field>

          <Field label="挽留优惠" hint="真实 APP:服务端记录,每账号一生一次;弹出起 24 小时有效(真实倒计时)">
            <div className="flex items-center justify-between gap-2 text-[13px]">
              <span className="text-[#3a3b45]">
                {!state.exitOfferUsed
                  ? "未用(关闭付费墙会弹)"
                  : exitOfferLive(state, now)
                    ? `进行中 · 剩 ${countdown(state.exitOfferExpiresAt - now)}`
                    : "已用过 / 已到期"}
              </span>
              <span className="flex shrink-0 gap-1.5">
                {exitOfferLive(state, now) ? <SmallButton onClick={() => demo({ type: "demo/expireExitOffer" })}>模拟到期</SmallButton> : null}
                {state.exitOfferUsed ? <SmallButton onClick={() => demo({ type: "demo/resetExitOffer" })}>重置</SmallButton> : null}
              </span>
            </div>
          </Field>

          <Field label="运营活动" hint="真实 APP:GET /api/promo/active(admin 配置)">
            <Switch label="活动在线(+35% 积分)" on={!!state.activePromo} onChange={(on) => demo({ type: "promoLoaded", campaign: on ? PROMO_CAMPAIGN : null })} />
            <div className="mt-1.5 flex items-center justify-between text-[12px] text-[#5f6070]">
              <span>{`弹窗已弹 ${state.promoViews[PROMO_CAMPAIGN.id] ?? 0}/${PROMO_CAMPAIGN.frequency.maxPerUser} 次`}</span>
              <SmallButton onClick={() => demo({ type: "demo/resetPromo" })}>重置频控</SmallButton>
            </div>
          </Field>

          <Field label="营销推送" hint="真实 APP:设置里的 Offers & news">
            <Switch label="Offers & news" on={state.marketingPush} onChange={(on) => demo({ type: "setMarketingPush", on })} />
          </Field>

          <div className="space-y-1.5 pt-1">
            <p className="text-[12px] font-medium text-[#5f6070]">模拟事件</p>
            <Action icon={<CalendarClock size={14} />} onClick={() => phone.current?.coldStart()} label="跨天冷启动" hint={`第 ${state.today} 天 → 第 ${state.today + 1} 天`} />
            <Action icon={<House size={14} />} onClick={() => phone.current?.goHome()} label="回到桌面" />
            <Action
              icon={<CalendarClock size={14} />}
              onClick={() => demo({ type: "subscriptionRenewed" })}
              label="到续费日"
              hint={state.subscription.source !== "app" || state.subscription.plan === "free" ? "只对 APP 内订阅" : state.subscription.cancelled ? "已取消 → 回 Free" : state.subscription.pendingChange ? "待生效的变更生效" : "续费 + 订阅积分重置"}
            />
            <Action icon={<CalendarClock size={14} />} onClick={() => demo({ type: "monthlyCreditsReset" })} label="新的计费月(订阅积分重置)" hint={state.subscription.plan === "free" ? "只对会员" : undefined} />
            <Action
              icon={<Megaphone size={14} />}
              onClick={() => demo({ type: "campaignPushReceived", campaignId: PROMO_CAMPAIGN.id })}
              label="推送活动通知"
              hint={!state.activePromo ? "先打开活动" : !state.marketingPush ? "用户没开 Offers & news,收不到" : undefined}
            />
            <Action icon={<UserPlus size={14} />} onClick={() => demo({ type: "inviteRewardGranted" })} label="好友订阅了(邀请奖励 +1,500)" hint={`${state.inviteRewards}/10`} />
            <Action
              icon={<Link2 size={14} />}
              onClick={() =>
                // 先杀进程,再由系统把链接交给 APP,然后冷启动:已登录直接落到 Use Case,不弹付费墙(spec §8.3)
                phone.current?.coldStart(() => demo({ type: "openDeepLink", useCaseId: "uc-latte" }))
              }
              label="从广告链接打开(冰拿铁)"
            />
            <Action icon={<RotateCcw size={14} />} onClick={onReplay} label="重来这一步" />
          </div>
        </section>
      </div>
    </aside>
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
        <Seg value={value === "limited" ? "granted" : value} onChange={onChange} options={[["undetermined", "未决定"], ["granted", "允许"], ["denied", "拒绝"]]} />
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
