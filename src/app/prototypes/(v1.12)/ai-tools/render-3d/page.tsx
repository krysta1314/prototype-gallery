import { DevToolPage } from "../app/DevToolPage";
import { ToolJsonLd, toolMetadata } from "../app/seo/ToolSeo";

/* 3D to Video 工具页(开发原型直达;评审页里从侧边栏进)。
   2026-11-10(SEO / GEO):有自己的 <title> / description / 分享卡片，并输出结构化数据;文字和 Guide 标签页里看得见的内容是同一份 */
export const metadata = toolMetadata("render-3d");

export default function Render3DPage() {
  return (
    <>
      <ToolJsonLd tool="render-3d" />
      <DevToolPage view="render-3d" />
    </>
  );
}
