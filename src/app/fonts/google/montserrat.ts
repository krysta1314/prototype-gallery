import localFont from "next/font/local";

// Montserrat(Google Fonts latin 子集，已下载到仓库，构建时不再联网取字体)
export const Montserrat = localFont({
  src: [
    { path: "./montserrat-500-900-italic.woff2", weight: "500 900", style: "italic" },
    { path: "./montserrat-500-900.woff2", weight: "500 900", style: "normal" },
  ],
  display: "swap",
});
