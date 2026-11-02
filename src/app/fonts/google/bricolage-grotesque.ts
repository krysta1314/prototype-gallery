import localFont from "next/font/local";

// Bricolage Grotesque(Google Fonts latin 子集，已下载到仓库，构建时不再联网取字体)
export const Bricolage_Grotesque = localFont({
  src: [
    { path: "./bricolage-grotesque-400-800.woff2", weight: "400 800", style: "normal" },
  ],
  variable: "--font-bricolage",
  display: "swap",
});
