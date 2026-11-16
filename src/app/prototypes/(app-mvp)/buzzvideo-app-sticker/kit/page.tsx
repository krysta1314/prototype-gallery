"use client";

import dynamic from "next/dynamic";
import { Bricolage_Grotesque } from "next/font/google";

// 贴纸风的粗展示字:组件里用 var(--font-gz) 引用
const display = Bricolage_Grotesque({ subsets: ["latin"], weight: ["700", "800"], variable: "--font-gz", display: "swap" });

// 贴纸风(Gen-Z sticker)组件库:第二版 UI 去 AI 味的新方向。新原型，第二版不动
const KitPage = dynamic(() => import("./KitPage"), { ssr: false });

export default function BuzzVideoStickerKit() {
  return (
    <div className={display.variable}>
      <KitPage />
    </div>
  );
}
