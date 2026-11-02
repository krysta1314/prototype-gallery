import localFont from "next/font/local";

// Bangers(Google Fonts latin 子集，已下载到仓库，构建时不再联网取字体)
export const Bangers = localFont({
  src: [
    { path: "./bangers-400.woff2", weight: "400", style: "normal" },
  ],
  display: "swap",
});
