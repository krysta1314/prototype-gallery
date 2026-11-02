import localFont from "next/font/local";

// Courier Prime(Google Fonts latin 子集，已下载到仓库，构建时不再联网取字体)
export const Courier_Prime = localFont({
  src: [
    { path: "./courier-prime-400.woff2", weight: "400", style: "normal" },
    { path: "./courier-prime-700.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
});
