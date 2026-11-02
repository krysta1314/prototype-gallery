import localFont from "next/font/local";

// Fredoka(Google Fonts latin 子集，已下载到仓库，构建时不再联网取字体)
export const Fredoka = localFont({
  src: [
    { path: "./fredoka-600-700.woff2", weight: "600 700", style: "normal" },
  ],
  display: "swap",
});
