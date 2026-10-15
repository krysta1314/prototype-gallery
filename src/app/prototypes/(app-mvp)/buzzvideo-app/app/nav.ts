import type { PaidPlanId } from "./data";
import type { PaywallTrigger } from "./store";

export type TabId = "inspire" | "create" | "me";

/** 盖住 Tab 栏的全屏页面 */
export type Route =
  | { name: "useCase"; id: string }
  | { name: "work"; id: string }
  | { name: "settings" }
  | { name: "members" }
  | { name: "plans"; trigger: PaywallTrigger; tab: PaidPlanId }
  | { name: "camera" }
  /** 邀请好友得积分(spec §7.1);和邀请组织成员的 invite 面板是两回事 */
  | { name: "inviteFriends" }
  /** 订阅管理:当前方案、续费日、待生效变更;取消订阅的唯一入口 */
  | { name: "subscription" };

/** 底部面板 / 抽屉,同一时间只开一个 */
export type SheetState =
  | { name: "sessions" }
  | { name: "sessionActions"; id: string }
  | { name: "attach" }
  | { name: "mode" }
  | { name: "model" }
  | { name: "share"; workId: string }
  | { name: "workMore"; workId: string }
  | { name: "report"; target: string }
  | { name: "workspace" }
  | { name: "confirmDelete" }
  | { name: "transferWorkspace" }
  | { name: "invite" }
  | { name: "memberCap"; id: string }
  /** 积分包(只有会员能打开) */
  | { name: "topUp" };

export type NavState = { tab: TabId; stack: Route[]; sheet: SheetState | null };

export type NavAction =
  | { type: "tab"; tab: TabId }
  | { type: "push"; route: Route }
  | { type: "pop" }
  | { type: "sheet"; sheet: SheetState }
  | { type: "closeSheet" }
  | { type: "reset" };

export const INITIAL_NAV: NavState = { tab: "inspire", stack: [], sheet: null };

export function navReducer(s: NavState, a: NavAction): NavState {
  switch (a.type) {
    case "tab":
      return { tab: a.tab, stack: [], sheet: null };
    case "push":
      return { ...s, stack: [...s.stack, a.route], sheet: null };
    case "pop":
      return { ...s, stack: s.stack.slice(0, -1), sheet: null };
    case "sheet":
      return { ...s, sheet: a.sheet };
    case "closeSheet":
      return { ...s, sheet: null };
    case "reset":
      return INITIAL_NAV;
  }
}

export const topRoute = (s: NavState): Route | null => s.stack[s.stack.length - 1] ?? null;

/** 当前页面的 key —— 外壳的说明面板按它显示对应说明 */
export const screenKey = (s: NavState): string => topRoute(s)?.name ?? s.tab;
