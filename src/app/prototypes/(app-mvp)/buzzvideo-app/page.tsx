"use client";

import dynamic from "next/dynamic";

// 开发原型:全屏 APP,无外壳。手机屏幕内是 React Native 代码(react-native-web),只在客户端渲染
// 评审原型(真机 + 用户旅程 + 状态控制)在 ./review
const DevApp = dynamic(() => import("./dev/DevApp"), { ssr: false });

export default function BuzzVideoAppPrototype() {
  return <DevApp />;
}
