import { CREDITS_INITIAL, defaultModelFor, planById, type PaidPlanId } from "./data";
import { NO_SUBSCRIPTION, entitledPlan, isEnterprise, type StoreState } from "./store";

/**
 * 演示账号(两个原型共用):Free / Starter / Pro / Ultra / Enterprise。
 * 真实 APP 里账号类型来自服务端(订阅状态 + 所在组织),没有切换入口;这里只是演示控件。
 * Enterprise = 企业组织的成员:公司已付费,默认进组织空间,不弹自动付费墙 / 挽留 / 运营弹窗;
 * 其 Personal 空间仍是 Free(只在想生成视频、积分不足时被动弹付费墙)
 */
export type DemoAccountId = "free" | "starter" | "pro" | "ultra" | "enterprise";

export const DEMO_ACCOUNTS: { id: DemoAccountId; label: string; hint: string }[] = [
  { id: "free", label: "Free", hint: "注册送 500 积分,不能生成视频" },
  { id: "starter", label: "Starter", hint: "$168/年 · 1,900 积分/月 · 不含 Seedance 2.0 / 2.5" },
  { id: "pro", label: "Pro", hint: "$420/年 · 4,900 积分/月 · 全部模型" },
  { id: "ultra", label: "Ultra", hint: "$756/年 · 8,900 积分/月 · 长视频 · 优先处理" },
  { id: "enterprise", label: "Enterprise", hint: "PressLogic 组织成员 · 公司付费 · 个人空间是 Free" },
];

/** 当前状态对应哪个演示账号 */
export const accountOf = (s: StoreState): DemoAccountId => (isEnterprise(s) ? "enterprise" : s.subscription.plan);

/**
 * 在当前状态上换成某个账号:订阅、积分、所在组织、默认工作区,以及跟账号走的记录(挽留、运营弹窗频控、深链)
 * 都换成新账号的;设备上的东西(权限、作品演示数据、设置)不动。输入框的模型按新账号的权益重选
 */
export function applyAccount(s: StoreState, id: DemoAccountId): StoreState {
  const next = applyPlan(s, id);
  const mode = next.composer.mode;
  return { ...next, composer: { ...next.composer, model: mode === "agent" ? null : defaultModelFor(mode, entitledPlan(next)) } };
}

function applyPlan(s: StoreState, id: DemoAccountId): StoreState {
  const base: StoreState = {
    ...s,
    subscription: NO_SUBSCRIPTION,
    roles: {},
    workspace: "personal",
    currentSessionId: null,
    credits: { ...CREDITS_INITIAL },
    subscriptionCredits: 0,
    paywallRequest: null,
    topUpRequested: false,
    exitOfferOpen: false,
    exitOfferUsed: false,
    exitOfferExpiresAt: 0,
    promoOpen: null,
    promoViews: {},
    promoLastDay: {},
    deepLink: null,
  };
  if (id === "free") return base;
  if (id === "enterprise") return { ...base, roles: { presslogic: "member" }, workspace: s.signedIn ? "presslogic" : "personal" };
  const plan = id as PaidPlanId;
  // 演示:这个月的订阅积分一分没用
  return {
    ...base,
    subscription: { plan, source: "app", period: "yearly", renewDay: s.today + 365 },
    credits: { ...base.credits, personal: planById(plan).credits },
    subscriptionCredits: planById(plan).credits,
  };
}
