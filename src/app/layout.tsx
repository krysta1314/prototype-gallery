import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  weight: ["700", "800"],
  subsets: ["latin"],
});

// 仅供 affiliate-bold(彻底换皮版)使用的编辑风 display 字体,不改其他原型默认
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  weight: ["400", "600", "700", "800"],
  subsets: ["latin"],
});

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
      className={`${inter.variable} ${jakarta.variable} ${bricolage.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
