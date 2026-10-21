"use client";

import { useEffect, useRef, useState } from "react";
import App from "../app/App";
import Splash, { GROW_MS } from "../app/screens/Splash";
import HomeScreen from "../shell/HomeScreen";
import StatusBar from "../shell/StatusBar";
import { AppProvider, InsetsProvider, useStore } from "../app/provider";

/** 本机日期作为 day(不是 UTC):本机零点到零点算一天 */
const localDay = () => {
  const now = new Date();
  return Math.floor((now.getTime() - now.getTimezoneOffset() * 60_000) / 86_400_000);
};

/**
 * 开发原型的启动流程(2026-10-21):和真机一样先停在 iOS 桌面，点 BuzzVideo AI 图标 → 启动页(logo 放大约 1 秒)→ 进入 APP。
 * 点图标时才以本机日期作为 day 走冷启动逻辑(每天最多一次付费墙等)。
 * GET /api/promo/active 在开发原型里视为「当前没有活动」;活动态在评审原型里切换
 */
function Launcher() {
  const { dispatch } = useStore();
  const [phase, setPhase] = useState<"home" | "splash" | "app">("home");
  const screenRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (phase !== "splash") return;
    const t = setTimeout(() => setPhase("app"), GROW_MS);
    return () => clearTimeout(t);
  }, [phase]);
  const launch = () => {
    dispatch({ type: "appLaunched", day: localDay() });
    setPhase("splash");
  };

  if (phase === "home")
    return (
      <div ref={screenRef} className="relative overflow-hidden bg-black" style={{ flex: 1, minHeight: 0 }}>
        <HomeScreen onLaunch={launch} scale={1} screenRef={screenRef} />
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
    // 和真机一样不显示滚动条，滑动照常
    <div className="hide-scrollbars" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      <App />
    </div>
  );
}

/**
 * 开发原型(spec §10.1):纯 APP 页面，没有真机外壳，也没有任何演示控件(2026-10-21 去掉顶部的演示账号切换),供研发复刻。
 * 用浏览器手机模式预览：从 iOS 桌面开始，新用户流程(引导页 → 登录 → …);账号状态切换在评审原型里做。
 * 手机屏幕内的代码和评审原型是同一份(../app)
 */
export default function DevApp() {
  return (
    <div style={{ height: "100dvh", width: "100%", maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <AppProvider>
        <InsetsProvider value={{ top: 20, bottom: 16 }}>
          <Launcher />
        </InsetsProvider>
      </AppProvider>
    </div>
  );
}
