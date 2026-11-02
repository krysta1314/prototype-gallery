/* 选素材时的校验规则(纯函数):同一个文件不能重复加;最多 10 个文件;视频 ≤ 500 MB 且 ≤ 10 分钟;图片 ≤ 20 MB;音频 ≤ 50 MB;只收 video/* image/* audio/*。
   不合规的不加入,返回给落地页一条可关闭提示的文案。视频时长由调用方在浏览器里先读出来再传进来(读不到就不按时长拦)。 */

import type { MediaKind } from "../store";

const MB = 1024 * 1024;

export const UPLOAD_LIMITS = {
  maxFiles: 10,
  videoBytes: 500 * MB,
  videoSec: 10 * 60,
  imageBytes: 20 * MB,
  audioBytes: 50 * MB,
} as const;

/** 落地页 prompt 最长 20,000 字;快到上限(≥ 90%)时显示计数 */
export const PROMPT_MAX = 20_000;
export const showPromptCount = (len: number) => len >= PROMPT_MAX * 0.9;

/** 选中的一个文件:只要名字、MIME、大小,视频再带上读出来的时长;unreadable = 选中时探测出文件损坏(见 unreadableProbe) */
export type UploadCandidate = { name: string; type: string; size: number; durationSec?: number; key?: string; unreadable?: boolean };

/** 文件损坏的提示(顶部 toast 一行) */
export const unreadableText = (name: string) => `${name} can't be read — try exporting it again`;

/** 判重用的文件标识:名字 + 大小 + 修改时间都一样才算同一个文件(同名不同文件照样能加) */
export const fileKey = (f: { name: string; size: number; lastModified?: number }) => `${f.name}|${f.size}|${f.lastModified ?? 0}`;

/** 按 MIME 判断类型;有的系统给 HEIC / MOV 等文件的 type 是空的,再按扩展名兜底。都不是 → null(不收) */
export function mediaKind(name: string, type: string): MediaKind | null {
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";
  if (/\.(jpe?g|png|webp|heic|heif|gif)$/i.test(name)) return "image";
  if (/\.(mp4|mov|m4v|webm|avi|mkv)$/i.test(name)) return "video";
  if (/\.(mp3|m4a|wav|aac|ogg|flac)$/i.test(name)) return "audio";
  return null;
}

/** 单个文件不合规的原因(英文产品文案);合规返回 null */
export function rejectReason(c: UploadCandidate): string | null {
  const kind = mediaKind(c.name, c.type);
  if (!kind) return `${c.name} isn't a video, image or audio file`;
  if (c.unreadable) return unreadableText(c.name);
  if (kind === "video") {
    if (c.size > UPLOAD_LIMITS.videoBytes) return `${c.name} is over 500 MB`;
    if (c.durationSec !== undefined && c.durationSec > UPLOAD_LIMITS.videoSec) return `${c.name} is longer than 10 minutes`;
  }
  if (kind === "image" && c.size > UPLOAD_LIMITS.imageBytes) return `${c.name} is over 20 MB`;
  if (kind === "audio" && c.size > UPLOAD_LIMITS.audioBytes) return `${c.name} is over 50 MB`;
  return null;
}

/** 一次选择的结果:accepted 是可加入的下标(保持原顺序),notices 是提示行(每个被拒文件一行,超出数量再加一行)。
    同一个文件不能重复添加:已在列表里的(existingKeys),或同一批里选了两次的,只留第一份,提示「{name} is already added」 */
export function pickFiles(existing: number, candidates: UploadCandidate[], existingKeys: string[] = []): { accepted: number[]; notices: string[] } {
  const accepted: number[] = [];
  const notices: string[] = [];
  const seen = new Set(existingKeys);
  let overCap = false;
  candidates.forEach((c, i) => {
    if (c.key !== undefined) {
      if (seen.has(c.key)) {
        notices.push(`${c.name} is already added`);
        return;
      }
      seen.add(c.key);
    }
    const reason = rejectReason(c);
    if (reason) {
      notices.push(reason);
      return;
    }
    if (existing + accepted.length >= UPLOAD_LIMITS.maxFiles) {
      overCap = true;
      return;
    }
    accepted.push(i);
  });
  if (overCap) notices.push(`You can add up to ${UPLOAD_LIMITS.maxFiles} files`);
  return { accepted, notices };
}

/* ── 文件损坏(异常处理 spec 第 13 条)──
   选中时探测:视频挂到 <video> 读元数据,图片用 Image 解码。只有浏览器明确报错(error 事件)才可能算损坏;5 秒没读出来(超时)不算。
   浏览器报错还要再看文件头:文件头是认得的容器(MP4 / MOV 的 ftyp、WebM / MKV、AVI、JPEG、PNG、GIF、WebP、HEIC…)说明文件本身是好的,
   只是这个浏览器解不了(HEVC 的 .MOV、HEIC 图片)—— 照收,缩略图垫胶片图标,照常上传分析。文件头也对不上(或 0 字节)才拦。 */

const ascii = (b: Uint8Array, at: number, len: number) => String.fromCharCode(...Array.from(b.subarray(at, at + len)));

/** 文件头(前 16 字节以上)是不是认得的视频 / 图片容器 */
export function knownContainer(head: Uint8Array, kind: MediaKind): boolean {
  if (head.length < 4) return false;
  const isoBmff = ascii(head, 4, 4) === "ftyp" || ["moov", "mdat", "wide", "free", "skip", "pnot"].includes(ascii(head, 4, 4));
  if (kind === "video") {
    if (isoBmff) return true; // mp4 / mov / m4v
    if (head[0] === 0x1a && head[1] === 0x45 && head[2] === 0xdf && head[3] === 0xa3) return true; // webm / mkv
    if (ascii(head, 0, 4) === "RIFF" && ascii(head, 8, 4) === "AVI ") return true;
    return false;
  }
  if (kind === "image") {
    if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return true; // jpeg
    if (head[0] === 0x89 && ascii(head, 1, 3) === "PNG") return true;
    if (ascii(head, 0, 4) === "GIF8") return true;
    if (ascii(head, 0, 4) === "RIFF" && ascii(head, 8, 4) === "WEBP") return true;
    if (ascii(head, 4, 4) === "ftyp") return true; // heic / heif / avif
    return false;
  }
  return true;
}

/** 探测结果 → 算不算损坏:0 字节一定算;浏览器报错且文件头对不上才算;超时 / 读成功 / 认得的容器都不算 */
export function unreadableProbe(p: { size: number; mediaError: boolean; head: Uint8Array; kind: MediaKind }): boolean {
  if (p.size === 0) return true;
  return p.mediaError && !knownContainer(p.head, p.kind);
}

/* ── 上传中断网(异常处理 spec 第 13 条)──
   单个文件上传 / 分析请求因为断网失败:自动再传一次;还是失败就按「跳过这个文件」处理,回复里那一行的原因是 UPLOAD_INTERRUPTED。 */

/** 断网类错误:fetch 抛的 TypeError(Failed to fetch / Load failed / fetch failed)或报错里带网络字样 */
export function isNetworkError(e: unknown): boolean {
  if (e instanceof Error && e.name === "AbortError") return false;
  const msg = e instanceof Error ? e.message : String(e ?? "");
  if (e instanceof TypeError && /fetch|network|load failed/i.test(msg)) return true;
  return /failed to fetch|fetch failed|networkerror|network error|network request failed|load failed|ECONNRESET|ECONNREFUSED|ENOTFOUND|ERR_INTERNET_DISCONNECTED|offline/i.test(msg);
}

export const UPLOAD_INTERRUPTED = { en: "Upload interrupted — check your connection", zh: "上传中断了,请检查网络" } as const;

/** 逐个文件跑 run(files) 得到每个的成功 / 失败;断网失败的文件自动再跑一次(只重跑这几个),其余结果原样保留 */
export async function settleWithRetry<F, T>(files: F[], run: (files: F[], retry: boolean) => Promise<PromiseSettledResult<T>[]>): Promise<PromiseSettledResult<T>[]> {
  const first = await run(files, false);
  const again = first.flatMap((r, i) => (r.status === "rejected" && isNetworkError(r.reason) ? [i] : []));
  if (!again.length) return first;
  const second = await run(
    again.map((i) => files[i]),
    true,
  );
  const out = [...first];
  again.forEach((i, k) => {
    out[i] = second[k];
  });
  return out;
}
