/* /api/hybrid-reel/upload —— 素材直传 Vercel Blob
   Vercel serverless 的请求体上限是 4.5MB,手机拍的视频随便就超。所以浏览器把素材直接传到 Blob(不经过我们的接口),
   接口只负责发一次性的上传凭证;分析接口拿到 Blob 链接,由 ARK 自己去下载,分析完就删掉。

   GET  → { enabled }:这个环境有没有开 Blob(BLOB_READ_WRITE_TOKEN,在 Vercel 项目里连一个 Blob 存储会自动加上)。
          本地 pnpm dev 没开就返回 false,前端改回直接把文件发给分析接口(本地没有 4.5MB 限制)。
   POST → @vercel/blob 的 handleUpload:给浏览器发上传凭证 */

import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

export const runtime = "nodejs";

const enabled = () => !!process.env.BLOB_READ_WRITE_TOKEN;

export function GET() {
  return NextResponse.json({ enabled: enabled() });
}

export async function POST(request: Request) {
  if (!enabled()) return NextResponse.json({ error: "Blob storage is not set up" }, { status: 501 });
  const body = (await request.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["video/*", "image/*", "application/octet-stream"],
        /* 一条素材最多 500MB;文件名后面加随机串,别人猜不到链接,同名文件也不会互相覆盖 */
        maximumSizeInBytes: 500 * 1024 * 1024,
        addRandomSuffix: true,
      }),
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
