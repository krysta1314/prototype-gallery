"use client";

import dynamic from "next/dynamic";

// 第二版组件库:TikTok 风格的 token 和组件展示。只是组件，现有页面还没换用
const KitPage = dynamic(() => import("./KitPage"), { ssr: false });

export default function BuzzVideoAppV2Kit() {
  return <KitPage />;
}
