"use client";

import dynamic from "next/dynamic";
import { Bricolage_Grotesque } from "next/font/google";

const display = Bricolage_Grotesque({ subsets: ["latin"], weight: ["700", "800"], variable: "--font-gz", display: "swap" });

// 贴纸风新原型 · 评审原型:左栏旅程菜单 · 中间真机 · 右侧演示状态 · 下方交互说明
const ReviewAppS = dynamic(() => import("./ReviewAppS"), { ssr: false });

export default function BuzzVideoStickerReview() {
  return (
    <div className={display.variable}>
      <ReviewAppS />
    </div>
  );
}
