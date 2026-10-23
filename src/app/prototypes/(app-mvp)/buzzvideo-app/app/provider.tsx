import { createContext, useContext, useEffect, useReducer, type Dispatch, type ReactNode } from "react";
import type { AnyAction } from "./demo";
import { useStill } from "./still";
import { INITIAL_NAV, navReducer, type NavAction, type NavState } from "./nav";
import { INITIAL_STATE, storeReducer, type StoreAction, type StoreState } from "./store";

/** 安全区。真实 APP 里换成 react-native-safe-area-context 的 useSafeAreaInsets */
export type Insets = { top: number; bottom: number };

export const TICK_MS = 250;

const StoreCtx = createContext<{ state: StoreState; dispatch: Dispatch<StoreAction> } | null>(null);
const NavCtx = createContext<{ nav: NavState; navigate: Dispatch<NavAction> } | null>(null);
const InsetsCtx = createContext<Insets>({ top: 54, bottom: 34 });

type Reducer = (s: StoreState, a: StoreAction) => StoreState;

/**
 * 开发原型用默认值;评审原型传入 demoReducer(多接一组演示 action)和按用户旅程预置的初始状态。
 * 两边渲染的是同一个 <App />,改 app/ 两边同步(spec §10.1)
 */
export function AppProvider({
  children,
  reducer = storeReducer,
  initialState = INITIAL_STATE,
  initialNav = INITIAL_NAV,
}: {
  children: ReactNode;
  reducer?: Reducer;
  initialState?: StoreState;
  initialNav?: NavState;
}) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [nav, navigate] = useReducer(navReducer, initialNav);

  // 模拟服务端:生成进度与上传进度;旅程图静帧里不走，停在预置的进度
  const still = useStill();
  useEffect(() => {
    if (still) return;
    const t = setInterval(() => dispatch({ type: "tick", ms: TICK_MS }), TICK_MS);
    return () => clearInterval(t);
  }, [still]);

  useEffect(() => {
    // 旅程图静帧里 toast 一直留着，截图才看得到
    if (!state.toast || still) return;
    const t = setTimeout(() => dispatch({ type: "hideToast" }), 2200);
    return () => clearTimeout(t);
  }, [state.toast, still]);

  // 旅程图静帧里横幅一直留着(和 toast 一样)
  useEffect(() => {
    if (!state.pushBanner || still) return;
    const t = setTimeout(() => dispatch({ type: "dismissPush" }), 5000);
    return () => clearTimeout(t);
  }, [state.pushBanner, still]);

  // 活动推送横幅也是 5 秒自动收起
  useEffect(() => {
    if (!state.campaignBanner || still) return;
    const t = setTimeout(() => dispatch({ type: "dismissCampaignBanner" }), 5000);
    return () => clearTimeout(t);
  }, [state.campaignBanner, still]);

  return (
    <StoreCtx.Provider value={{ state, dispatch }}>
      <NavCtx.Provider value={{ nav, navigate }}>{children}</NavCtx.Provider>
    </StoreCtx.Provider>
  );
}

export function InsetsProvider({ value, children }: { value: Insets; children: ReactNode }) {
  return <InsetsCtx.Provider value={value}>{children}</InsetsCtx.Provider>;
}

export function useStore() {
  const v = useContext(StoreCtx);
  if (!v) throw new Error("useStore must be used inside AppProvider");
  return v;
}

export function useNav() {
  const v = useContext(NavCtx);
  if (!v) throw new Error("useNav must be used inside AppProvider");
  return v;
}

export const useInsets = () => useContext(InsetsCtx);

/** 评审原型专用:派发演示 action。provider 必须挂 demoReducer,否则演示 action 会落进 storeReducer 的 switch 而被忽略 */
export const useDemoDispatch = () => useStore().dispatch as unknown as Dispatch<AnyAction>;

