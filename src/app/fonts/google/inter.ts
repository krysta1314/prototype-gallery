import localFont from "next/font/local";

// Inter(Google Fonts latin 子集，已下载到仓库，构建时不再联网取字体)
export const Inter = localFont({
  src: [
    { path: "./inter-100-900.woff2", weight: "100 900", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
});
