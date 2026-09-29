/* POST /api/hybrid-reel/analyze
   一条素材一次 ARK call → ClipProfile(PRD F1.3),含素材身份与原声类型(剪辑方案 spec 2.1 / 2.7)。
   音频文件走 input_audio(只收 base64),判断是音乐、口播还是音效。
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

const PROMPT = `You are analysing one file a business uploaded so it can be cut into a short vertical ad.

Return ONLY JSON, no prose, matching exactly:
{
  "description": "one sentence, what is actually in frame",
  "tags": ["3-5 short lowercase tags, e.g. product, storefront, testimonial, hands, logo, screenshot"],
  "identity": "footage" | "reference" | "brand" | "showcase" | "evidence" | "unused",
  "identityWhy": "one short sentence on why",
  "showcase": "photo" | "screenshot" | "recording",
  "hasVoice": true/false,
  "voiceSummary": "if someone speaks, quote or summarise what they say; otherwise omit",
  "sound": "speech" | "meaningful" | "ambient" | "noise" | "silent",
  "soundNote": "what the sound is, a few words, e.g. 'spray hiss', 'street noise'",
  "issues": ["visible quality problems only: shake, blur, blown highlights, black frames, low resolution. empty array if clean"],
  "suggestedRole": "hook" | "pain" | "proof" | "usage" | "cta",
  "faceVisible": true/false
}

"identity" is what job this file does for the ad. Judge by CONTENT, not by file type — a lifestyle photo can be footage:
- footage: raw material the advertiser shot, meant to be cut into the ad.
- reference: someone else's finished ad or a style sample (polished edit, burnt-in captions, another brand, a watermark or a downloader name like "SaveClip" in the file name). Only its look and copy style are borrowed; it never goes into the cut.
- brand: a logo, wordmark or brand graphic.
- showcase: a clean, finished product display — a packshot / product photo on a plain background, an app or web screenshot, or a screen recording of software. Also set "showcase" to which of the three. Camera footage the advertiser shot (handheld, hands in frame, a desk or room, the product being used or turned around) is FOOTAGE, never showcase, even when the product fills the frame.
- evidence: customer reviews, ratings, data, awards, press coverage.
- unused: blurry, accidental or unrelated to the product.
Omit "showcase" unless identity is showcase.
"sound" (videos only; "silent" for images): speech = someone talking; meaningful = a sound that sells the product (spray hiss, pouring, cap click, keyboard); ambient = room tone or background; noise = wind, bystanders, crew instructions.
"suggestedRole" is which job this shot could do in an ad: hook = stops the scroll, pain = names the problem, proof = why believe you, usage = product doing its job, cta = what to do next.`;

const AUDIO_PROMPT = `You are listening to one audio file a business uploaded for a short vertical ad.

Return ONLY JSON, no prose, matching exactly:
{
  "description": "one sentence: what it is, mood and pace",
  "tags": ["3-5 short lowercase tags"],
  "audioKind": "music" | "voice" | "sfx",
  "hasVoice": true/false,
  "voiceSummary": "if someone speaks, quote or summarise what they say; otherwise omit",
  "issues": ["audible problems only: clipping, hiss, too quiet. empty array if clean"]
}
music = a song or backing track; voice = a voiceover or spoken recording; sfx = a short sound effect.`;

/* 视频额外做一份场记:按动作 / 构图的变化切成片段,标出哪几段能用、各能当什么镜头、证明了什么卖点。
   一条长镜头里往往只有几秒是好镜头,分镜按片段挑,而不是整条从 0 秒截 */
const SEGMENTS = (lang: "zh" | "en") => `

This is a VIDEO. Also log it the way an assistant editor writes a shot log, and add to the same JSON:
"segments": [{"start": s, "end": s, "description": "what happens, concrete", "usable": true/false, "reason": "only if not usable", "roles": ["hook"|"pain"|"proof"|"usage"|"cta"], "sellingPoint": "the product benefit this visibly shows, or empty", "sound": "speech"|"meaningful"|"ambient"|"noise"|"silent"}]
- The clip may be one continuous take: split wherever the action or framing meaningfully changes, not only at hard cuts. Let the content decide how long each segment is.
- usable = false for anything an editor would cut: fumbling, preparation (opening a cap, adjusting grip, reframing), shake, blur, out of focus, black or empty frames, the camera starting or stopping.
- Timestamps in seconds with one decimal, covering the whole clip in order, without gaps or overlaps.
- Write "description", "reason" and "sellingPoint" in ${lang === "zh" ? "Simplified Chinese" : "English"}.`;

type Sound = "speech" | "meaningful" | "ambient" | "noise" | "silent";
const SOUNDS = new Set<Sound>(["speech", "meaningful", "ambient", "noise", "silent"]);
const IDENTITIES = new Set(["footage", "reference", "brand", "showcase", "evidence", "audio", "unused"]);
type Segment = { start: number; end: number; description: string; usable: boolean; reason?: string; roles: string[]; sellingPoint?: string; sound?: Sound };

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
      sound: SOUNDS.has(x.sound as Sound) ? (x.sound as Sound) : undefined,
    }))
    .sort((a, b) => a.start - b.start);
  return out.length ? out : undefined;
}

type Analysed = {
  identity?: string;
  identityWhy?: string;
  showcase?: string;
  audioKind?: string;
  sound?: string;
  soundNote?: string;
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
  mp3: "audio/mpeg",
  wav: "audio/wav",
  m4a: "audio/mp4",
  aac: "audio/aac",
  ogg: "audio/ogg",
};

/** ARK 的 input_audio 要 format 名 */
const AUDIO_FORMAT: Record<string, string> = { "audio/mpeg": "mp3", "audio/mp3": "mp3", "audio/wav": "wav", "audio/x-wav": "wav", "audio/mp4": "m4a", "audio/x-m4a": "m4a", "audio/aac": "aac", "audio/ogg": "ogg" };

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
        const isAudio = mime.startsWith("audio/");
        /* 音频 ARK 只收 base64,Blob 链接要先取回来;图片视频的 Blob 链接直接给 ARK,本地上传的转成 data URL */
        const bytes = async () => (src.file ? Buffer.from(await src.file.arrayBuffer()) : Buffer.from(await (await fetch(src.url!)).arrayBuffer()));
        const url = isAudio ? "" : src.url ?? `data:${mime};base64,${(await bytes()).toString("base64")}`;

        const media: ContentPart = isAudio
          ? { type: "input_audio", input_audio: { data: (await bytes()).toString("base64"), format: AUDIO_FORMAT[mime] ?? "mp3" } }
          : isImage
            ? { type: "image_url", image_url: { url } }
            : { type: "video_url", video_url: { url, fps: 2 } };

        const langLine = `\nFile name: "${src.name}"\nWrite "identityWhy" and "soundNote" in ${lang === "zh" ? "Simplified Chinese" : "English"}.`;
        const text = isAudio ? AUDIO_PROMPT : (isImage ? PROMPT : PROMPT + SEGMENTS(lang)) + langLine;
        const raw = await arkChat({
          model: ARK_MODELS.understand,
          messages: [{ role: "user", content: [media, { type: "text", text }] }],
          maxTokens: isImage || isAudio ? 900 : 2400,
        }).catch((error: unknown) => {
          /* 报错带上是哪条素材,排查时知道是不是某个文件太大 */
          throw new Error(`${src.name}:${error instanceof Error ? error.message : String(error)}`);
        });

        const parsed = extractJson<Analysed & { segments?: unknown }>(raw);
        const identity = isAudio ? "audio" : IDENTITIES.has(String(parsed.identity)) && parsed.identity !== "audio" ? parsed.identity : "footage";
        return {
          label: src.name,
          kind: isAudio ? "audio" : isImage ? "image" : "video",
          sizeMB: Math.round((src.size / 1_048_576) * 10) / 10,
          ...parsed,
          identity,
          /* 视频只有「录屏」一种产品展示;模型把手机实拍判成产品展示时退回可剪素材(实测把手持演示判成过 showcase) */
          ...(identity === "showcase" && !isImage && parsed.showcase !== "recording" ? { identity: "footage" } : {}),
          showcase: identity === "showcase" ? (isImage ? (parsed.showcase === "screenshot" ? "screenshot" : "photo") : parsed.showcase === "recording" ? "recording" : undefined) : undefined,
          audioKind: isAudio ? (["music", "voice", "sfx"].includes(String(parsed.audioKind)) ? parsed.audioKind : "music") : undefined,
          sound: isAudio ? undefined : SOUNDS.has(parsed.sound as Sound) ? parsed.sound : isImage ? "silent" : parsed.hasVoice ? "speech" : "ambient",
          suggestedRole: parsed.suggestedRole ?? "usage",
          faceVisible: !!parsed.faceVisible,
          issues: parsed.issues ?? [],
          tags: parsed.tags ?? [],
          segments: isImage || isAudio ? undefined : await inLanguage(cleanSegments(parsed.segments), lang),
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
