"use client";

import { useEffect, useRef, useState } from "react";
import Splash, { GROW_MS } from "../../buzzvideo-app/app/screens/Splash";
import HomeScreen from "../../buzzvideo-app/shell/HomeScreen";
import StatusBar from "../../buzzvideo-app/shell/StatusBar";
import AppS from "../app/AppS";
import { Provider2 } from "../app/store";
import { AppProvider, InsetsProvider, useStore } from "../app/v1";
import { INITIAL_STATE_FUN, funReducer } from "../app/presets";
import { INITIAL_STATE } from "../../buzzvideo-app/app/store";

const localDay = () => {
  const now = new Date();
  return Math.floor((now.getTime() - now.getTimezoneOffset() * 60_000) / 86_400_000);
};

/** 和第一版开发原型一样:iOS 桌面 → 点图标 → 启动页 → APP */
function Launcher({ skip }: { skip: boolean }) {
  const { dispatch } = useStore();
  const [phase, setPhase] = useState<"home" | "splash" | "app">(skip ? "app" : "home");
  const screenRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (phase !== "splash") return;
    const t = setTimeout(() => setPhase("app"), GROW_MS);
    return () => clearTimeout(t);
  }, [phase]);
  if (phase === "home")
    return (
      <div ref={screenRef} className="relative overflow-hidden bg-black" style={{ flex: 1, minHeight: 0 }}>
        <HomeScreen
          onLaunch={() => {
            dispatch({ type: "appLaunched", day: localDay() });
            setPhase("splash");
          }}
          scale={1}
          screenRef={screenRef}
        />
        <StatusBar tint="light" />
      </div>
    );
  if (phase === "splash")
    return (
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <Splash />
      </div>
    );
  return (
    <div className="hide-scrollbars" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      <AppS />
    </div>
  );
}

/** 第二版开发原型:纯 APP 页面，没有真机外壳和演示控件;用浏览器手机模式预览 */
export default function DevAppS() {
  // 调试用:网址带 ?skip 直接以已登录状态进首页(跳过桌面、引导、登录)
  const skip = typeof location !== "undefined" && new URLSearchParams(location.search).has("skip");
  return (
    <div style={{ height: "100dvh", width: "100%", maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <AppProvider reducer={funReducer} initialState={skip ? { ...INITIAL_STATE_FUN(), signedIn: true, onboarded: true, aiConsent: true, paywallShownDay: 0 } : INITIAL_STATE_FUN()}>
        <Provider2>
          <InsetsProvider value={{ top: 20, bottom: 16 }}>
            <Launcher skip={skip} />
          </InsetsProvider>
        </Provider2>
      </AppProvider>
    </div>
  );
}
