"use client";

import dynamic from "next/dynamic";

// 第二版评审原型:左栏用户旅程 · 中间真机 · 右侧演示状态 · 下方交互说明。APP 和开发原型(../page.tsx)是同一份 ../v2
const ReviewApp2 = dynamic(() => import("./ReviewApp2"), { ssr: false });

export default function BuzzVideoAppV2Review() {
  return <ReviewApp2 />;
}
