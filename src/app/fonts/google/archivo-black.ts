import localFont from "next/font/local";

// Archivo Black(Google Fonts latin 子集，已下载到仓库，构建时不再联网取字体)
export const Archivo_Black = localFont({
  src: [
    { path: "./archivo-black-400.woff2", weight: "400", style: "normal" },
  ],
  display: "swap",
});
