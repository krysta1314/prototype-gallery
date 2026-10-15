import { applyAccount, type DemoAccountId } from "./accounts";
import { CREDITS_INITIAL, type Billing, type PlanId, type WorkspaceId } from "./data";
import {
  INITIAL_STATE,
  LOW_CREDITS,
  NO_SUBSCRIPTION,
  storeReducer,
  type PermissionKind,
  type PermissionValue,
  type Role,
  type StoreAction,
  type StoreState,
  type Faults,
  type StoreKitSim,
  type SubscriptionSource,
} from "./store";

/**
 * 演示专用 action:只有评审原型调用(spec §10.1)。
 * 真实 APP 里这些状态来自服务端、App Store 或系统设置,没有对应的 action,所以不进 store.ts;
 * 开发原型的 provider 用的是 storeReducer,根本接不到它们。
 */
export type DemoAction =
  | { type: "demo/setRole"; workspace: WorkspaceId; role: Role }
  | { type: "demo/setCredits"; credits: number }
  | { type: "demo/setCreditsLow"; low: boolean }
  | { type: "demo/setWebSubscriber"; on: boolean }
  | { type: "demo/setPlan"; plan: PlanId; source: SubscriptionSource; period?: Billing }
  | { type: "demo/setCancelled"; on: boolean }
  | { type: "demo/setBillingRetry"; on: boolean }
  | { type: "demo/setStoreKit"; patch: Partial<StoreKitSim> }
  | { type: "demo/setFaults"; patch: Partial<Faults> }
  | { type: "demo/setAccount"; account: DemoAccountId }
  | { type: "demo/setDuplicate"; on: boolean }
  | { type: "demo/resetExitOffer" }
  | { type: "demo/expireExitOffer" }
  | { type: "demo/resetPromo" }
  | { type: "demo/setPermission"; kind: PermissionKind; value: PermissionValue };
export type AnyAction = StoreAction | DemoAction;

export function demoReducer(s: StoreState, a: AnyAction): StoreState {
  switch (a.type) {
    case "demo/setRole":
      return { ...s, roles: { ...s.roles, [a.workspace]: a.role } };
    case "demo/setCredits":
      return { ...s, credits: { ...s.credits, [s.workspace]: a.credits } };
    case "demo/setCreditsLow":
      return { ...s, credits: { ...s.credits, [s.workspace]: a.low ? LOW_CREDITS : CREDITS_INITIAL[s.workspace] } };
    case "demo/setWebSubscriber":
      if (a.on) return { ...s, subscription: { plan: "pro", source: "web" } };
      // 关闭只撤销网页订阅,不动 APP 内购买
      return s.subscription.source === "web" ? { ...s, subscription: NO_SUBSCRIPTION } : s;
    case "demo/setPlan":
      return {
        ...s,
        subscription:
          a.plan === "free"
            ? NO_SUBSCRIPTION
            : {
                plan: a.plan,
                source: a.source,
                ...(a.period ? { period: a.period, renewDay: s.today + (a.period === "yearly" ? 365 : 30) } : {}),
              },
      };
    case "demo/setCancelled": {
      // 只对 APP 内订阅有效:网页订阅在网页上取消
      if (s.subscription.source !== "app") return s;
      const { cancelled: _, ...rest } = s.subscription;
      return { ...s, subscription: a.on ? { ...rest, cancelled: true } : rest };
    }
    case "demo/setBillingRetry": {
      // 只对 APP 内订阅有效
      if (s.subscription.source !== "app") return s;
      const { billingRetry: _, ...rest } = s.subscription;
      return { ...s, subscription: a.on ? { ...rest, billingRetry: true } : rest };
    }
    case "demo/setAccount":
      return applyAccount(s, a.account);
    case "demo/setFaults":
      return { ...s, faults: { ...s.faults, ...a.patch } };
    case "demo/setStoreKit":
      return { ...s, storekit: { ...s.storekit, ...a.patch } };
    case "demo/setDuplicate": {
      // 重复订阅:当前生效的是网页订阅,另有一份 App Store 订阅
      if (!a.on) {
        const { duplicateApp: _, ...rest } = s.subscription;
        return { ...s, subscription: rest };
      }
      const base = s.subscription.source === "web" ? s.subscription : { plan: "pro" as const, source: "web" as const, period: "yearly" as const };
      return { ...s, subscription: { ...base, duplicateApp: true } };
    }
    case "demo/resetExitOffer":
      return { ...s, exitOfferUsed: false, exitOfferOpen: false, exitOfferExpiresAt: 0 };
    case "demo/expireExitOffer":
      // 模拟 24 小时已过:到期时间改到过去
      return { ...s, exitOfferOpen: false, exitOfferExpiresAt: s.exitOfferExpiresAt > 0 ? 1 : 0 };
    case "demo/resetPromo":
      return { ...s, promoViews: {}, promoLastDay: {}, promoOpen: null };
    case "demo/setPermission":
      return { ...s, permissions: { ...s.permissions, [a.kind]: a.value } };
    default:
      return storeReducer(s, a);
  }
}

/**
 * 「以这个账号登录」的完整状态:看完引导、拒绝追踪、允许推送、同意 AI 数据授权、已登录,
 * 今天的首登付费墙已经看过(切换账号直接落在首页)
 */
export function signedInAs(id: DemoAccountId, day: number): StoreState {
  const steps: AnyAction[] = [
    { type: "appLaunched", day },
    { type: "completeOnboarding" },
    { type: "demo/setPermission", kind: "tracking", value: "denied" },
    { type: "demo/setPermission", kind: "push", value: "granted" },
    { type: "setAiConsent", on: true },
  ];
  const before = applyAccount(steps.reduce(demoReducer, INITIAL_STATE), id);
  const signed = demoReducer(before, { type: "signIn" });
  return demoReducer(signed, { type: "consumePaywallRequest" });
}
