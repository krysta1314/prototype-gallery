/* POST /api/hybrid-reel/analyze
   一条素材一次 ARK call → ClipProfile(PRD F1.3)。
   视频与音轨一起喂进去,所以「有无人声」不需要另外跑一次 STT。

   请求两种:
   - application/json { items: [{ url, name, type, size }], lang }:素材已经由浏览器直传到 Vercel Blob(见 ../upload),
     这里把 Blob 链接交给 ARK 自己下载,分析完删掉。线上走这个 —— Vercel serverless 的请求体上限 4.5MB,视频直接发过来会被拦
   - multipart/form-data,字段名 file(可多条):本地 pnpm dev 没开 Blob 时用,本地没有 4.5MB 限制 */

import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
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

/* 视频额外做一份场记:按动作 / 构图的变化切成片段,标出哪几段能用、各能当什么镜头、证明了什么卖点。
   一条长镜头里往往只有几秒是好镜头,分镜按片段挑,而不是整条从 0 秒截 */
const SEGMENTS = (lang: "zh" | "en") => `

This is a VIDEO. Also log it the way an assistant editor writes a shot log, and add to the same JSON:
"segments": [{"start": s, "end": s, "description": "what happens, concrete", "usable": true/false, "reason": "only if not usable", "roles": ["hook"|"pain"|"proof"|"usage"|"cta"], "sellingPoint": "the product benefit this visibly shows, or empty"}]
- The clip may be one continuous take: split wherever the action or framing meaningfully changes, not only at hard cuts. Let the content decide how long each segment is.
- usable = false for anything an editor would cut: fumbling, preparation (opening a cap, adjusting grip, reframing), shake, blur, out of focus, black or empty frames, the camera starting or stopping.
- Timestamps in seconds with one decimal, covering the whole clip in order, without gaps or overlaps.
- Write "description", "reason" and "sellingPoint" in ${lang === "zh" ? "Simplified Chinese" : "English"}.`;

type Segment = { start: number; end: number; description: string; usable: boolean; reason?: string; roles: string[]; sellingPoint?: string };

/** 模型给的片段:排序、去掉越界和倒挂、保留一位小数 */
function cleanSegments(raw: unknown): Segment[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const r1 = (n: number) => Math.round(n * 10) / 10;
  const out = raw
    .map((x) => x as Partial<Segment>)
    .filter((x) => Number.isFinite(Number(x.start)) && Number.isFinite(Number(x.end)) && Number(x.end) > Number(x.start))
    .map((x) => ({
      start: r1(Math.max(0, Number(x.start))),
      end: r1(Number(x.end)),
      description: String(x.description ?? ""),
      usable: x.usable !== false,
      reason: x.reason ? String(x.reason) : undefined,
      roles: Array.isArray(x.roles) ? x.roles.map(String) : [],
      sellingPoint: x.sellingPoint ? String(x.sellingPoint) : undefined,
    }))
    .sort((a, b) => a.start - b.start);
  return out.length ? out : undefined;
}

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

function mimeOf(file: { name: string; type: string }) {
  const declared = file.type;
  if (declared && declared !== "application/octet-stream") return declared;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXT[ext] ?? "video/mp4";
}

const CJK = /[一-鿿]/;

/* 片段说明要跟对话语言走。要中文、模型却写了英文(偶尔会这样)时,再调一次把文字翻成简体中文;
   只翻 description / reason / sellingPoint,时间和能不能用原样保留。翻译失败就用原文,不影响分析结果 */
async function inLanguage(segments: Segment[] | undefined, lang: "zh" | "en") {
  if (lang !== "zh" || !segments?.length) return segments;
  const texts = segments.flatMap((g: Segment) => [g.description, g.reason, g.sellingPoint].filter((t): t is string => !!t));
  if (!texts.length || texts.some((t) => CJK.test(t))) return segments;
  try {
    const raw = await arkChat({
      model: ARK_MODELS.understand,
      messages: [
        {
          role: "user",
          content: `Translate every string value in this JSON array into Simplified Chinese. Keep the same array length, order and keys. Return ONLY the JSON array.\n${JSON.stringify(
            segments.map((g: Segment) => ({ description: g.description, reason: g.reason, sellingPoint: g.sellingPoint })),
          )}`,
        },
      ],
      maxTokens: 1600,
    });
    const out = extractJson<{ description?: string; reason?: string; sellingPoint?: string }[]>(raw);
    if (!Array.isArray(out) || out.length !== segments.length) return segments;
    return segments.map((g: Segment, i: number) => ({
      ...g,
      description: out[i]?.description || g.description,
      reason: g.reason && (out[i]?.reason || g.reason),
      sellingPoint: g.sellingPoint && (out[i]?.sellingPoint || g.sellingPoint),
    }));
  } catch {
    return segments;
  }
}

/** 一条素材:文件本身(multipart)或 Blob 链接(JSON) */
type Source = { name: string; type: string; size: number; file?: File; url?: string };

/** 只删我们自己 Blob 存储里的文件,别的链接不碰 */
const isBlobUrl = (u: string) => {
  try {
    return new URL(u).hostname.endsWith(".blob.vercel-storage.com");
  } catch {
    return false;
  }
};

export async function POST(request: Request) {
  let sources: Source[] = [];
  let lang: "zh" | "en" = "zh";
  if ((request.headers.get("content-type") ?? "").includes("application/json")) {
    const body = (await request.json().catch(() => null)) as { items?: Partial<Source>[]; lang?: string } | null;
    lang = body?.lang === "en" ? "en" : "zh";
    sources = (body?.items ?? [])
      .filter((x) => typeof x.url === "string" && isBlobUrl(x.url))
      .map((x) => ({ name: String(x.name ?? "clip"), type: String(x.type ?? ""), size: Number(x.size) || 0, url: x.url }));
  } else {
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return NextResponse.json({ error: "需要 multipart/form-data 或 JSON" }, { status: 400 });
    }
    lang = form.get("lang") === "en" ? "en" : "zh";
    sources = form
      .getAll("file")
      .filter((f): f is File => f instanceof File)
      .map((file) => ({ name: file.name, type: file.type, size: file.size, file }));
  }
  if (sources.length === 0) return NextResponse.json({ error: "没有收到文件" }, { status: 400 });

  try {
    /* 并行 —— PRD F2.4 要求分析不阻塞对话 */
    const profiles = await Promise.all(
      sources.map(async (src) => {
        const mime = mimeOf(src);
        const isImage = mime.startsWith("image/");
        /* Blob 链接直接给 ARK;本地上传的文件转成 data URL */
        const url = src.url ?? `data:${mime};base64,${Buffer.from(await src.file!.arrayBuffer()).toString("base64")}`;

        const media: ContentPart = isImage
          ? { type: "image_url", image_url: { url } }
          : { type: "video_url", video_url: { url, fps: 2 } };

        const raw = await arkChat({
          model: ARK_MODELS.understand,
          messages: [{ role: "user", content: [media, { type: "text", text: isImage ? PROMPT : PROMPT + SEGMENTS(lang) }] }],
          maxTokens: isImage ? 900 : 2400,
        }).catch((error: unknown) => {
          /* 报错带上是哪条素材,排查时知道是不是某个文件太大 */
          throw new Error(`${src.name}:${error instanceof Error ? error.message : String(error)}`);
        });

        const parsed = extractJson<Analysed & { segments?: unknown }>(raw);
        return {
          label: src.name,
          kind: isImage ? "image" : "video",
          sizeMB: Math.round((src.size / 1_048_576) * 10) / 10,
          ...parsed,
          issues: parsed.issues ?? [],
          tags: parsed.tags ?? [],
          segments: isImage ? undefined : await inLanguage(cleanSegments(parsed.segments), lang),
        };
      }),
    );

    return NextResponse.json({ profiles, model: ARK_MODELS.understand });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 502 });
  } finally {
    /* 分析完(不管成没成功)就把传上去的素材删掉,不留在存储里;删失败不影响返回 */
    const urls = sources.map((x) => x.url).filter((u): u is string => !!u);
    if (urls.length) await del(urls).catch(() => {});
  }
}
