import localFont from "next/font/local";

// Oswald(Google Fonts latin 子集，已下载到仓库，构建时不再联网取字体)
export const Oswald = localFont({
  src: [
    { path: "./oswald-500-700.woff2", weight: "500 700", style: "normal" },
  ],
  display: "swap",
});
