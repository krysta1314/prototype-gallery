import localFont from "next/font/local";

// Plus Jakarta Sans(Google Fonts latin 子集，已下载到仓库，构建时不再联网取字体)
export const Plus_Jakarta_Sans = localFont({
  src: [
    { path: "./plus-jakarta-sans-700-800.woff2", weight: "700 800", style: "normal" },
  ],
  variable: "--font-jakarta",
  display: "swap",
});
