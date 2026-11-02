import localFont from "next/font/local";

// Rubik(Google Fonts latin 子集，已下载到仓库，构建时不再联网取字体)
export const Rubik = localFont({
  src: [
    { path: "./rubik-700-900.woff2", weight: "700 900", style: "normal" },
  ],
  display: "swap",
});
