"use client";

import dynamic from "next/dynamic";

// 手机屏幕内是 React Native 代码(react-native-web),只在客户端渲染,避开样式注水问题
const Shell = dynamic(() => import("./shell/Shell"), { ssr: false });

export default function BuzzVideoAppPrototype() {
  return <Shell />;
}
