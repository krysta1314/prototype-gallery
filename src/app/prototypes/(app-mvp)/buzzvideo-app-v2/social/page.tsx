"use client";

import dynamic from "next/dynamic";

// 第二版探索稿:如果由社交 APP 的资深设计师来做(沿用组件库视觉，加同款链、朋友、火苗、炫耀)
const SocialPage = dynamic(() => import("./SocialPage"), { ssr: false });

export default function BuzzVideoAppV2Social() {
  return <SocialPage />;
}
