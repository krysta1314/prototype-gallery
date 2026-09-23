/* POST /api/hybrid-reel/analyze
   一条素材一次 ARK call → ClipProfile(PRD F1.3)。
   视频与音轨一起喂进去,所以「有无人声」不需要另外跑一次 STT。

   请求:multipart/form-data,字段名 file(可多条)
   注意:Vercel serverless 的请求体上限 4.5MB —— 本地 pnpm dev 没这个限制。
        上线要收大文件得改成直传对象存储再传 URL 给 ARK。 */

import { NextResponse } from "next/server";
import { ARK_MODELS, arkChat, extractJson, type ContentPart } from "@/lib/ark";

export const runtime = "nodejs";
export const maxDuration = 300;

const PROMPT = `You are analysing one piece of raw footage a small business shot themselves, so it can be cut into a short vertical ad.

Return ONLY JSON, no prose, matching exactly:
{
  "description": "one sentence, what is actually in frame",
  "tags": ["3-5 short lowercase tags, e.g. product, storefront, testimonial, hands, no face"],
  "hasVoice": true/false,
  "voiceSummary": "if someone speaks, quote or summarise what they say; otherwise omit",
  "issues": ["visible quality problems only: shake, blur, blown highlights, black frames, silence where speech was expected. empty array if clean"],
  "suggestedRole": "hook" | "pain" | "proof" | "usage" | "cta",
  "faceVisible": true/false
}

"suggestedRole" is which job this shot could do in an ad: hook = stops the scroll, pain = names the problem, proof = why believe you, usage = product doing its job, cta = what to do next.
"faceVisible" means a recognisable human face is on screen — it decides whether a missing beat can be AI-generated later.`;

type Analysed = {
  description: string;
  tags: string[];
  hasVoice: boolean;
  voiceSummary?: string;
  issues: string[];
  suggestedRole: string;
  faceVisible: boolean;
};

/* 浏览器和 curl 传上来的 file.type 经常是空或 application/octet-stream,
   而 ARK 会按 data URL 里的 MIME 校验,错了直接 400。按扩展名兜底。 */
const MIME_BY_EXT: Record<string, string> = {
  mp4: "video/mp4",
  mov: "video/quicktime",
  m4v: "video/mp4",
  webm: "video/webm",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
};

function mimeOf(file: File) {
  const declared = file.type;
  if (declared && declared !== "application/octet-stream") return declared;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXT[ext] ?? "video/mp4";
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "需要 multipart/form-data" }, { status: 400 });
  }

  const files = form.getAll("file").filter((f): f is File => f instanceof File);
  if (files.length === 0) return NextResponse.json({ error: "没有收到文件" }, { status: 400 });

  try {
    /* 并行 —— PRD F2.4 要求分析不阻塞对话 */
    const profiles = await Promise.all(
      files.map(async (file) => {
        const mime = mimeOf(file);
        const isImage = mime.startsWith("image/");
        const b64 = Buffer.from(await file.arrayBuffer()).toString("base64");
        const dataUrl = `data:${mime};base64,${b64}`;

        const media: ContentPart = isImage
          ? { type: "image_url", image_url: { url: dataUrl } }
          : { type: "video_url", video_url: { url: dataUrl } };

        const raw = await arkChat({
          model: ARK_MODELS.understand,
          messages: [{ role: "user", content: [media, { type: "text", text: PROMPT }] }],
          maxTokens: 900,
        }).catch((error: unknown) => {
          /* 报错带上是哪条素材,排查时知道是不是某个文件太大 */
          throw new Error(`${file.name}:${error instanceof Error ? error.message : String(error)}`);
        });

        const parsed = extractJson<Analysed>(raw);
        return {
          label: file.name,
          kind: isImage ? "image" : "video",
          sizeMB: Math.round((file.size / 1_048_576) * 10) / 10,
          ...parsed,
          issues: parsed.issues ?? [],
          tags: parsed.tags ?? [],
        };
      }),
    );

    return NextResponse.json({ profiles, model: ARK_MODELS.understand });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
