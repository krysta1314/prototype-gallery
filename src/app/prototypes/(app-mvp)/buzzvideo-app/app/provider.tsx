import { createContext, useContext, useEffect, useReducer, type Dispatch, type ReactNode } from "react";
import { INITIAL_NAV, navReducer, type NavAction, type NavState } from "./nav";
import { INITIAL_STATE, storeReducer, type StoreAction, type StoreState } from "./store";

/** 安全区。真实 APP 里换成 react-native-safe-area-context 的 useSafeAreaInsets */
export type Insets = { top: number; bottom: number };

export const TICK_MS = 250;

const StoreCtx = createContext<{ state: StoreState; dispatch: Dispatch<StoreAction> } | null>(null);
const NavCtx = createContext<{ nav: NavState; navigate: Dispatch<NavAction> } | null>(null);
const InsetsCtx = createContext<Insets>({ top: 54, bottom: 34 });

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(storeReducer, INITIAL_STATE);
  const [nav, navigate] = useReducer(navReducer, INITIAL_NAV);

  // 模拟服务端:生成进度与上传进度
  useEffect(() => {
    const t = setInterval(() => dispatch({ type: "tick", ms: TICK_MS }), TICK_MS);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!state.toast) return;
    const t = setTimeout(() => dispatch({ type: "hideToast" }), 2200);
    return () => clearTimeout(t);
  }, [state.toast]);

  useEffect(() => {
    if (!state.pushBanner) return;
    const t = setTimeout(() => dispatch({ type: "dismissPush" }), 5000);
    return () => clearTimeout(t);
  }, [state.pushBanner]);

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

/**
 * 演示用:Onboarding 的三种版式(对比用,由外壳的演示切换条控制,不属于真实产品)
 * replace = 视频替换拼贴 · hero = 视频放进拼贴主卡 · full = 全屏视频背景
 */
export type OnboardingLayout = "replace" | "hero" | "full";
const OnboardingLayoutCtx = createContext<OnboardingLayout>("replace");
export function OnboardingLayoutProvider({ value, children }: { value: OnboardingLayout; children: ReactNode }) {
  return <OnboardingLayoutCtx.Provider value={value}>{children}</OnboardingLayoutCtx.Provider>;
}
export const useOnboardingLayout = () => useContext(OnboardingLayoutCtx);
