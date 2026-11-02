import localFont from "next/font/local";

// Playfair Display(Google Fonts latin 子集，已下载到仓库，构建时不再联网取字体)
export const Playfair_Display = localFont({
  src: [
    { path: "./playfair-display-600-800-italic.woff2", weight: "600 800", style: "italic" },
    { path: "./playfair-display-600-800.woff2", weight: "600 800", style: "normal" },
  ],
  display: "swap",
});
