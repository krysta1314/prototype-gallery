"use client";

import dynamic from "next/dynamic";
import { Bricolage_Grotesque } from "next/font/google";

const display = Bricolage_Grotesque({ subsets: ["latin"], weight: ["700", "800"], variable: "--font-gz", display: "swap" });

// 贴纸风新原型 · 开发原型(全屏 APP,无外壳)。评审原型在 ./review,用户旅程图在 ./journey,组件库在 ./kit
const DevAppS = dynamic(() => import("./dev/DevAppS"), { ssr: false });

export default function BuzzVideoStickerPrototype() {
  return (
    <div className={display.variable}>
      <DevAppS />
    </div>
  );
}
