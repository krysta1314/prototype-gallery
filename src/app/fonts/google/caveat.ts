import localFont from "next/font/local";

// Caveat(Google Fonts latin 子集，已下载到仓库，构建时不再联网取字体)
export const Caveat = localFont({
  src: [
    { path: "./caveat-600-700.woff2", weight: "600 700", style: "normal" },
  ],
  display: "swap",
});
