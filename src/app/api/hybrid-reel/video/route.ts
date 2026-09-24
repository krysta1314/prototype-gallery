/* AI 补拍:画布上的 AI 视频节点点 Generate Video 时调这里,转给 BytePlus Seedance。
   POST            建任务 → { id }
   GET ?id=        查任务 → { status, duration, error }
   GET ?id=&file=1 成片走服务端转一道(TOS 临时链接不带 CORS,前端要拿 Blob 存进 IndexedDB) */

import { NextResponse } from "next/server";
import { createVideoTask, getVideoTask, type VideoRequest } from "@/lib/hybrid-reel/video";

export const runtime = "nodejs";
export const maxDuration = 60;

const fail = (error: unknown, status = 502) =>
  NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status });

export async function POST(request: Request) {
  let body: VideoRequest;
  try {
    body = await request.json();
  } catch {
    return fail("请求体不是 JSON", 400);
  }
  if (!body.prompt?.trim()) return fail("缺 Prompt", 400);
  try {
    return NextResponse.json({ id: await createVideoTask(body) });
  } catch (error) {
    return fail(error);
  }
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const id = params.get("id");
  if (!id) return fail("缺任务 id", 400);
  try {
    const task = await getVideoTask(id);
    if (!params.get("file")) {
      const { videoUrl, ...rest } = task;
      return NextResponse.json({ ...rest, ready: !!videoUrl });
    }
    if (!task.videoUrl) return fail("视频还没生成好", 409);
    const res = await fetch(task.videoUrl);
    if (!res.ok || !res.body) return fail(`下载成片失败(${res.status})`);
    return new Response(res.body, { headers: { "Content-Type": "video/mp4", "Cache-Control": "no-store" } });
  } catch (error) {
    return fail(error);
  }
}
