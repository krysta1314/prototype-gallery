import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";

/* 只为给 Skills 页面一个像样的标签页标题(根布局默认是 Buzz Prototypes);页面本身是 client 组件，没法导出 metadata */
export const metadata: Metadata = {
  title: { default: "BuzzVideo Skills for Claude and ChatGPT", template: "%s | BuzzVideo" },
};

/* 本页(含整页和对话框)的滚动条统一做细：6px、半透明滑块、无轨道底色。
   Chrome/Safari 用 ::-webkit-scrollbar(设了 scrollbar-width 会让它失效，所以只给 Firefox 设);只在这组路由渲染，不影响画廊其他页 */
const SCROLLBAR_CSS = `
::-webkit-scrollbar{width:6px;height:6px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.16);border-radius:9999px}
::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,0.28)}
::-webkit-scrollbar-corner{background:transparent}
@supports (-moz-appearance:none){*{scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.16) transparent}}
`;

/* 标题字体：照 higgsfield.ai/skills 用 Space Grotesk 700,以变量 --font-grotesk 提供给本页各组件 */
const grotesk = Space_Grotesk({ subsets: ["latin"], weight: ["700"], variable: "--font-grotesk" });

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{SCROLLBAR_CSS}</style>
      <div className={grotesk.variable}>{children}</div>
    </>
  );
}
