import localFont from "next/font/local";

// Archivo(Google Fonts latin 子集，已下载到仓库，构建时不再联网取字体)
export const Archivo = localFont({
  src: [
    { path: "./archivo-400-900.woff2", weight: "400 900", style: "normal" },
  ],
  variable: "--font-archivo",
  display: "swap",
});
