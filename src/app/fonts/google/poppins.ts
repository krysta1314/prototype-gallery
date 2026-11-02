import localFont from "next/font/local";

// Poppins(Google Fonts latin 子集，已下载到仓库，构建时不再联网取字体)
export const Poppins = localFont({
  src: [
    { path: "./poppins-500.woff2", weight: "500", style: "normal" },
    { path: "./poppins-600.woff2", weight: "600", style: "normal" },
    { path: "./poppins-700.woff2", weight: "700", style: "normal" },
    { path: "./poppins-800.woff2", weight: "800", style: "normal" },
  ],
  display: "swap",
});
