import type { Metadata } from "next";
import { Inter } from "@/app/fonts/google/inter";
import { Plus_Jakarta_Sans } from "@/app/fonts/google/plus-jakarta-sans";
import { Bricolage_Grotesque } from "@/app/fonts/google/bricolage-grotesque";
import { Archivo } from "@/app/fonts/google/archivo";
import "./globals.css";

const inter = Inter;

const jakarta = Plus_Jakarta_Sans;

// 仅供 affiliate-bold(彻底换皮版)使用的编辑风 display 字体,不改其他原型默认
const bricolage = Bricolage_Grotesque;

// 仅供 about(深色硬派编辑风)使用的工业 grotesk,不改其他原型默认
const archivo = Archivo;

export const metadata: Metadata = {
  title: "Buzz Prototypes",
  description: "Monica's prototype gallery — built with Next.js + Tailwind + shadcn/ui",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jakarta.variable} ${bricolage.variable} ${archivo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
