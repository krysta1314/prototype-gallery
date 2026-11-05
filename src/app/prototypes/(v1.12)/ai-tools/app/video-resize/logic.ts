// Video Resize 的纯逻辑:目标比例、处理方式、积分、Smart Reframe 的取景框、主体出框的时间段。
// 坐标用「源视频画面的比例」(0–1)。

export type VideoMethod = "reframe" | "expand" | "fit";
export type FitFill = "blur" | "black";

export type VideoRatio = { id: string; w: number; h: number };

export const VIDEO_RATIOS: VideoRatio[] = [
  { id: "9:16", w: 9, h: 16 },
  { id: "1:1", w: 1, h: 1 },
  { id: "4:5", w: 4, h: 5 },
  { id: "16:9", w: 16, h: 9 },
];
export const DEFAULT_VIDEO_RATIOS = ["9:16", "1:1"];

/** 上传上限(spec:≤ 60s,待确认) */
export const MAX_VIDEO_SECONDS = 60;

/* 积分 = 计费秒数(不足 1 秒按 1 秒)× 比例数 × 每秒单价。
   ⚠️ 占位价:Smart Reframe / Expand 模型都还没选型,下面的每秒单价只是原型里的假设,选型后按实际成本改。
   Fit(补模糊背景或纯色)不用模型,和图片的 Crop / Fit 一样不扣积分。 */
export const VIDEO_CREDITS_PER_SECOND: Record<VideoMethod, number> = { reframe: 1, expand: 4, fit: 0 };

export function videoCredits(durationSec: number, ratioCount: number, method: VideoMethod): number {
  if (!(durationSec > 0) || ratioCount <= 0) return 0;
  return Math.ceil(durationSec) * ratioCount * VIDEO_CREDITS_PER_SECOND[method];
}

/** 和源视频同比例(误差 1%):不用转,勾不上 */
export function sameAspect(r: { w: number; h: number }, src: { w: number; h: number }): boolean {
  return Math.abs(r.w / r.h - src.w / src.h) / (src.w / src.h) < 0.01;
}

/** 主体轨迹的一个关键帧(源画面比例);box = null 表示这段没有明确主体(如空镜) */
export type TrackKey = { t: number; box: { cx: number; cy: number; w: number; h: number } | null };

/** t 时刻的主体框:两关键帧之间线性插值;有一边是 null 就取前一个关键帧 */
export function subjectAt(track: TrackKey[], t: number): TrackKey["box"] {
  if (!track.length) return null;
  if (t <= track[0].t) return track[0].box;
  for (let i = 0; i < track.length - 1; i++) {
    const a = track[i];
    const b = track[i + 1];
    if (t >= a.t && t <= b.t) {
      if (!a.box || !b.box) return a.box;
      const k = b.t === a.t ? 0 : (t - a.t) / (b.t - a.t);
      const mix = (p: number, q: number) => p + (q - p) * k;
      return { cx: mix(a.box.cx, b.box.cx), cy: mix(a.box.cy, b.box.cy), w: mix(a.box.w, b.box.w), h: mix(a.box.h, b.box.h) };
    }
  }
  return track[track.length - 1].box;
}

/** 目标比例在源画面里能取多大的框(源画面比例):比源更竖 → 满高、宽度缩;更扁 → 满宽、高度缩 */
export function cropSize(ratio: { w: number; h: number }, src: { w: number; h: number }): { w: number; h: number } {
  const target = ratio.w / ratio.h;
  const source = src.w / src.h;
  return target < source ? { w: target / source, h: 1 } : { w: 1, h: source / target };
}

/** Smart Reframe 的取景框:以主体为中心,夹在画面内;没主体时居中 */
export function reframeWindow(
  ratio: { w: number; h: number },
  src: { w: number; h: number },
  subject: TrackKey["box"],
): { x: number; y: number; w: number; h: number } {
  const c = cropSize(ratio, src);
  const cx = subject?.cx ?? 0.5;
  const cy = subject?.cy ?? 0.5;
  const clamp = (v: number, size: number) => Math.min(1 - size, Math.max(0, v - size / 2));
  return { x: clamp(cx, c.w), y: clamp(cy, c.h), w: c.w, h: c.h };
}

/** 主体有没有超出取景框(容差 1%) */
export function outOfWindow(subject: TrackKey["box"], win: { x: number; y: number; w: number; h: number }): boolean {
  if (!subject) return false;
  const e = 0.01;
  return (
    subject.cx - subject.w / 2 < win.x - e ||
    subject.cx + subject.w / 2 > win.x + win.w + e ||
    subject.cy - subject.h / 2 < win.y - e ||
    subject.cy + subject.h / 2 > win.y + win.h + e
  );
}

/**
 * Smart Reframe 下主体出框的时间段(给时间轴标红):每 step 秒采样一次,连续出框的样本合成一段。
 * Expand / Fit 保留整个画面,不会出框,返回空。
 */
export function outOfFrameRanges(
  track: TrackKey[],
  duration: number,
  ratio: { w: number; h: number },
  src: { w: number; h: number },
  method: VideoMethod,
  step = 0.1,
): { start: number; end: number }[] {
  if (method !== "reframe" || !(duration > 0)) return [];
  const out: { start: number; end: number }[] = [];
  let open: number | null = null;
  const n = Math.ceil(duration / step);
  for (let i = 0; i <= n; i++) {
    const t = Math.min(duration, i * step);
    const s = subjectAt(track, t);
    const bad = outOfWindow(s, reframeWindow(ratio, src, s));
    if (bad && open === null) open = t;
    if (!bad && open !== null) {
      out.push({ start: round(open), end: round(t) });
      open = null;
    }
  }
  if (open !== null) out.push({ start: round(open), end: round(duration) });
  return out;
}
const round = (n: number) => Math.round(n * 100) / 100;

/** 下载文件名:video-resize-9x16.mp4 */
export const videoFileName = (ratioId: string) => `video-resize-${ratioId.replace(":", "x")}.mp4`;

/** 0:07 */
export function formatClock(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Custom 比例的一边(如 2:3 的 2):取整夹到 [1, 100];非数字回到 fallback */
export function parseRatioPart(raw: string, fallback: number): number {
  const n = Number(raw.trim());
  if (!raw.trim() || !Number.isFinite(n)) return fallback;
  return Math.min(100, Math.max(1, Math.round(n)));
}
