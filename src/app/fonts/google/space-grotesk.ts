import localFont from "next/font/local";

// Space Grotesk(Google Fonts latin 子集，已下载到仓库，构建时不再联网取字体)
export const Space_Grotesk = localFont({
  src: [
    { path: "./space-grotesk-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-grotesk",
  display: "swap",
});
