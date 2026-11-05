// Upscale Video(fal-ai/seedvr/upscale/video)的纯逻辑：参数、输出尺寸、积分、fal 入参。无 UI 依赖。
// 字段 2026-11-05 对照 fal OpenAPI schema 核对:
//   video_url(必填)、upscale_mode(factor / target,默认 factor)、upscale_factor(1–10,默认 2)、
//   target_resolution(720p / 1080p / 1440p / 2160p,默认 1080p)、noise_scale(0–1,步长 0.001,默认 0.1)、
//   output_format(X264 (.mp4) / VP9 (.webm) / PRORES4444 (.mov) / GIF (.gif),默认 mp4)、
//   output_quality(low / medium / high / maximum,默认 high)、output_write_mode(fast / balanced / small,默认 balanced)、
//   seed(不开放，每次随机)、enable_safety_checker / sync_mode(系统参数，后端写死)。
// 价格:fal 按「输出视频的像素数据量」收 $0.001 / 百万像素(宽 × 高 × 帧数),和 Upscale Image 同一个换算(0.1 credit / MP)。

import { outputSize, type TargetRes, type UpscaleMode } from "../logic";

export type VideoFormat = "mp4" | "webm" | "mov" | "gif";
export type VideoQuality = "low" | "medium" | "high" | "maximum";
export type WriteMode = "fast" | "balanced" | "small";

export type VideoUpscaleParams = {
  mode: UpscaleMode;
  factor: number;
  target: TargetRes;
  noiseScale: number;
  format: VideoFormat;
  quality: VideoQuality;
  writeMode: WriteMode;
};

export const DEFAULT_VIDEO_PARAMS: VideoUpscaleParams = {
  mode: "factor",
  factor: 2,
  target: "1080p",
  noiseScale: 0.1,
  format: "mp4",
  quality: "high",
  writeMode: "balanced",
};

/** 产品里的选项 → fal 的 output_format 取值 */
export const FORMAT_API: Record<VideoFormat, string> = {
  mp4: "X264 (.mp4)",
  webm: "VP9 (.webm)",
  mov: "PRORES4444 (.mov)",
  gif: "GIF (.gif)",
};

/** 上传上限(待确认;fal 没写，先按 60s) */
export const MAX_UPSCALE_SECONDS = 60;
/** 读不到帧率时按 30fps 估帧数(预计积分用，实际按模型输出结算) */
export const ASSUMED_FPS = 30;
export const VIDEO_CREDITS_PER_MP = 0.1;

export function videoOutputSize(w: number, h: number, p: VideoUpscaleParams): { w: number; h: number } {
  return outputSize(w, h, { mode: p.mode, factor: p.factor, target: p.target, noiseScale: p.noiseScale, seed: null, format: "png" });
}

/** 预计积分 = 输出宽 × 高 × 帧数(百万像素)× 0.1,向上取整，至少 1 */
export function videoUpscaleCredits(outW: number, outH: number, durationSec: number, fps = ASSUMED_FPS): number {
  if (!(durationSec > 0) || outW <= 0 || outH <= 0) return 0;
  const frames = Math.ceil(durationSec * fps);
  const mp = (outW * outH * frames) / 1_000_000;
  return Math.max(1, Math.ceil(Math.round(mp * VIDEO_CREDITS_PER_MP * 1e6) / 1e6));
}

/** 发给 fal 的入参(只带用户能改的 + 必填) */
export function toFalVideoInput(videoUrl: string, p: VideoUpscaleParams): Record<string, unknown> {
  const input: Record<string, unknown> = { video_url: videoUrl, upscale_mode: p.mode, noise_scale: p.noiseScale, output_format: FORMAT_API[p.format], output_quality: p.quality, output_write_mode: p.writeMode };
  if (p.mode === "factor") input.upscale_factor = p.factor;
  else input.target_resolution = p.target;
  return input;
}

const FORMAT_LABEL: Record<VideoFormat, string> = { mp4: "MP4", webm: "WEBM", mov: "MOV", gif: "GIF" };
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

/** 结果卡标题行的参数(和左栏同名) */
export function videoParamSummary(p: VideoUpscaleParams): string {
  return [p.mode === "factor" ? `Factor ${p.factor}x` : `Target ${p.target}`, `Noise Scale ${p.noiseScale}`, FORMAT_LABEL[p.format], `${cap(p.quality)} Quality`, cap(p.writeMode)].join(" · ");
}
