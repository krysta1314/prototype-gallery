/* Kling 4.0 手写模型页的服务端元数据(2026-11-19):页面本体是客户端组件，标题和描述放这里在服务端输出 */
import type { Metadata } from "next";
import { KLING_4 } from "./model-data";

const URL = "https://buzzvideo.ai/kling-4-0";

export const metadata: Metadata = {
  title: KLING_4.metaTitle,
  description: KLING_4.metaDescription,
  alternates: { canonical: URL },
  openGraph: { type: "website", siteName: "BuzzVideo", url: URL, title: KLING_4.metaTitle, description: KLING_4.metaDescription, images: [{ url: "https://buzzvideo.ai/prototypes/model-page/kling-ugc.jpg" }] },
  twitter: { card: "summary_large_image", title: KLING_4.metaTitle, description: KLING_4.metaDescription },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
