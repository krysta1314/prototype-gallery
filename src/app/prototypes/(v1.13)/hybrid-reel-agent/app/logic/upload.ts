/* 选素材时的校验规则(纯函数):最多 10 个文件;视频 ≤ 500 MB 且 ≤ 10 分钟;图片 ≤ 20 MB;音频 ≤ 50 MB;只收 video/* image/* audio/*。
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

/** 选中的一个文件:只要名字、MIME、大小,视频再带上读出来的时长 */
export type UploadCandidate = { name: string; type: string; size: number; durationSec?: number };

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
  if (kind === "video") {
    if (c.size > UPLOAD_LIMITS.videoBytes) return `${c.name} is over 500 MB`;
    if (c.durationSec !== undefined && c.durationSec > UPLOAD_LIMITS.videoSec) return `${c.name} is longer than 10 minutes`;
  }
  if (kind === "image" && c.size > UPLOAD_LIMITS.imageBytes) return `${c.name} is over 20 MB`;
  if (kind === "audio" && c.size > UPLOAD_LIMITS.audioBytes) return `${c.name} is over 50 MB`;
  return null;
}

/** 一次选择的结果:accepted 是可加入的下标(保持原顺序),notices 是提示行(每个被拒文件一行,超出数量再加一行) */
export function pickFiles(existing: number, candidates: UploadCandidate[]): { accepted: number[]; notices: string[] } {
  const accepted: number[] = [];
  const notices: string[] = [];
  let overCap = false;
  candidates.forEach((c, i) => {
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
