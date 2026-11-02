import localFont from "next/font/local";

// Permanent Marker(Google Fonts latin 子集，已下载到仓库，构建时不再联网取字体)
export const Permanent_Marker = localFont({
  src: [
    { path: "./permanent-marker-400.woff2", weight: "400", style: "normal" },
  ],
  display: "swap",
});
