// 放大图片(SeedVR)的纯逻辑:参数、输出尺寸、积分、印刷判定、fal 入参映射。无 UI 依赖。

export type UpscaleMode = "factor" | "target";
export type TargetRes = "720p" | "1080p" | "1440p" | "2160p";
export type OutputFormat = "png" | "jpg" | "webp";

export type UpscaleParams = {
  mode: UpscaleMode;
  factor: number;
  target: TargetRes;
  noiseScale: number;
  seed: number | null;
  format: OutputFormat;
};

export const DEFAULT_PARAMS: UpscaleParams = {
  mode: "factor",
  factor: 2,
  target: "1080p",
  noiseScale: 0.1,
  seed: null,
  format: "png",
};

export const FACTOR_PRESETS = [2, 4, 8, 10] as const;
export const FACTOR_MIN = 1;
export const FACTOR_MAX = 10;
export const CREDITS_PER_MP = 0.1;
export const PRINT_LONG_EDGE = 10_000;
export const PRINT_DPI = 300;

export const ACCEPTED_TYPES: string[] = [
  "jpg", "jpeg", "png", "webp", "gif", "avif", "heic", "heif",
];

const TARGET_SHORT_EDGE: Record<TargetRes, number> = {
  "720p": 720,
  "1080p": 1080,
  "1440p": 1440,
  "2160p": 2160,
};

/** 输出尺寸:By factor 按倍数取整;By resolution 短边对齐档位、长边按原比例取整。 */
export function outputSize(w: number, h: number, p: UpscaleParams): { w: number; h: number } {
  if (p.mode === "factor") {
    return { w: Math.round(w * p.factor), h: Math.round(h * p.factor) };
  }
  const short = TARGET_SHORT_EDGE[p.target];
  if (w <= h) return { w: short, h: Math.round((h / w) * short) };
  return { w: Math.round((w / h) * short), h: short };
}

/** 积分:像素数向上取整到 MP,再 × 0.1 向上取整,最低 1。 */
export function upscaleCredits(outW: number, outH: number): number {
  const mp = Math.ceil((outW * outH) / 1_000_000);
  // 先抹掉浮点误差(如 30 × 0.1 = 3.0000000000000004),再向上取整
  const credits = Math.ceil(Math.round(mp * CREDITS_PER_MP * 1e6) / 1e6);
  return Math.max(1, credits);
}

export function isPrintReady(outW: number, outH: number): boolean {
  return Math.max(outW, outH) >= PRINT_LONG_EDGE;
}

/** 300 DPI 下的印刷尺寸(英寸),保留 1 位小数。 */
export function printInches(outW: number, outH: number): { w: number; h: number } {
  const r = (n: number) => Math.round((n / PRINT_DPI) * 10) / 10;
  return { w: r(outW), h: r(outH) };
}

/** 300 DPI 下的印刷尺寸(厘米):按精确英寸 × 2.54,保留 1 位小数。 */
export function printCm(outW: number, outH: number): { w: number; h: number } {
  const r = (n: number) => Math.round(((n / PRINT_DPI) * 2.54) * 10) / 10;
  return { w: r(outW), h: r(outH) };
}

/** 解析 seed 输入:只收非负整数(纯数字、安全整数范围内);空 = 随机(null);其余(负数、1e3、0x10、小数)回到 prev。 */
export function parseSeed(raw: string, prev: number | null): number | null {
  const t = raw.trim();
  if (t === "") return null;
  if (!/^\d+$/.test(t)) return prev;
  const n = Number(t);
  return Number.isSafeInteger(n) ? n : prev;
}

/** 解析倍数输入:步长 0.1、夹到 [1,10];空/非数字返回 prev。 */
export function parseFactor(raw: string, prev: number): number {
  if (raw.trim() === "") return prev;
  const n = Number(raw);
  if (!Number.isFinite(n)) return prev;
  const stepped = Math.round(n * 10) / 10;
  return Math.min(FACTOR_MAX, Math.max(FACTOR_MIN, stepped));
}

export function isAcceptedFile(name: string): boolean {
  const dot = name.lastIndexOf(".");
  if (dot < 0) return false;
  return ACCEPTED_TYPES.includes(name.slice(dot + 1).toLowerCase());
}

/** 映射为 fal 入参(字段名用 fal 原名)。 */
export function toFalInput(imageUrl: string, p: UpscaleParams): Record<string, unknown> {
  const input: Record<string, unknown> = { image_url: imageUrl, upscale_mode: p.mode };
  if (p.mode === "factor") input.upscale_factor = p.factor;
  else input.target_resolution = p.target;
  input.noise_scale = p.noiseScale;
  if (p.seed !== null) input.seed = p.seed;
  input.output_format = p.format;
  input.enable_safety_checker = true;
  return input;
}
