import type { PaidPlanId } from "./data";
import type { PaywallTrigger } from "./store";

export type TabId = "inspire" | "create" | "me";

/** 盖住 Tab 栏的全屏页面 */
export type Route =
  /** list = 从灵感流哪个列表点进来(上下滑按这个顺序切上一个 / 下一个) */
  | { name: "useCase"; id: string; list?: string[] }
  /** askWatermark:进来就弹去水印弹窗(评审原型直接停在这一步用) */
  | { name: "work"; id: string; askWatermark?: boolean }
  | { name: "settings" }
  | { name: "members" }
  | { name: "plans"; trigger: PaywallTrigger; tab: PaidPlanId; /** 评审预置：打开时直接弹 App Store 确认面板 */ confirm?: boolean }
  | { name: "camera" }
  /** 邀请好友得积分(spec §7.1);和邀请组织成员的 invite 面板是两回事 */
  | { name: "inviteFriends" }
  /** 订阅管理:当前方案、续费日、待生效变更;取消订阅的唯一入口 */
  | { name: "subscription" };

/** 底部面板 / 抽屉,同一时间只开一个 */
export type SheetState =
  /** demo:评审原型直接停在长按菜单(menu = 会话 id)或多选(select = 已选的会话 id) */
  | { name: "sessions"; menu?: string; select?: string[] }
  | { name: "sessionActions"; id: string }
  | { name: "attach" }
  | { name: "mode" }
  | { name: "model" }
  /** 创作页工具条右边的「全部工具」 */
  | { name: "tools" }
  /** Audio 模式选音色(Preset voice / My voice,可克隆自己的声音) */
  | { name: "voice" }
  | { name: "share"; workId: string }
  | { name: "prompt"; workId: string }
  | { name: "report"; target: string }
  | { name: "workspace" }
  | { name: "confirmDelete" }
  | { name: "transferWorkspace" }
  | { name: "invite" }
  /** 联系销售(Enterprise 专享功能被非 Enterprise 用户点到) */
  | { name: "contactSales" }
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
    case "push": {
      // 同一屏连推两次(开发模式 StrictMode 下 effect 会跑两遍)只留一层，否则 pop 后还停在原屏
      const top = s.stack[s.stack.length - 1];
      if (top && JSON.stringify(top) === JSON.stringify(a.route)) return { ...s, sheet: null };
      return { ...s, stack: [...s.stack, a.route], sheet: null };
    }
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
