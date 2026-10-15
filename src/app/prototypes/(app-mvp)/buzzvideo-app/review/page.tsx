"use client";

import dynamic from "next/dynamic";

// 评审原型:真机外壳 + 左栏用户旅程 + 右栏需求说明与状态控制。APP 本身和开发原型(../page.tsx)是同一份 ../app
const ReviewApp = dynamic(() => import("./ReviewApp"), { ssr: false });

export default function BuzzVideoAppReview() {
  return <ReviewApp />;
}
