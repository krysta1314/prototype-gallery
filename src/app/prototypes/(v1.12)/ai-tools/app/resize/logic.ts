// Resize & Expand 的纯逻辑:版位预设、处理方式、积分、图片在版位画框里的位置、主体是否进了安全区。
// 坐标一律用「画框的比例」(0–1),预览缩略图、结果卡和导出画布都用同一套数。

export type Platform = "meta" | "instagram" | "google" | "tiktok" | "amazon" | "custom";
export type Method = "expand" | "crop" | "fit";

/** 9:16 竖版 UI 遮挡区:按 1080×1920 画框量,TikTok / Reels 顶部约 160px(状态栏、标签)、底部约 440px(文案、按钮)。缩放到任意高度按比例算 */
export const SAFE_ZONE_9x16 = { frameH: 1920, top: 160, bottom: 440 } as const;

export type Placement = {
  id: string;
  label: string;
  platform: Platform;
  /** 输出像素 */
  w: number;
  h: number;
  /** 有 UI 遮挡区(9:16 Stories / Reels / TikTok) */
  safeZone?: boolean;
};

export const PLACEMENTS: Placement[] = [
  { id: "meta-1x1", label: "Meta Feed", platform: "meta", w: 1080, h: 1080 },
  { id: "meta-4x5", label: "Meta Feed", platform: "meta", w: 1080, h: 1350 },
  { id: "stories-reels", label: "Stories & Reels", platform: "instagram", w: 1080, h: 1920, safeZone: true },
  { id: "google-display", label: "Google Display", platform: "google", w: 1200, h: 628 },
  { id: "tiktok", label: "TikTok", platform: "tiktok", w: 1080, h: 1920, safeZone: true },
  { id: "amazon", label: "Amazon", platform: "amazon", w: 2000, h: 2000 },
];

export const CUSTOM_ID = "custom";
export const CUSTOM_MIN = 64;
export const CUSTOM_MAX = 4096;
export const DEFAULT_CUSTOM = { w: 1200, h: 1500 };

/** 默认勾上的版位(广告最常用的三个) */
export const DEFAULT_SELECTED = ["meta-1x1", "meta-4x5", "stories-reels"];

/* 积分:Expand 要跑扩图模型,按张计;Crop / Fit 前端或后端直接处理,不扣积分。
   2026-11-05 Monica 定扩图模型 = fal bria/fibo-edit-1.5/expand($0.04 / 张)→ 4 credits / 张。
   调用：image_url + canvas_size(版位像素，如 [1080, 1350])+ original_image_size(原图在画布里缩放后的宽高)
   + original_image_location(原图左上角在画布里的 [x, y],用户拖动主体就是改这个);不传 aspect_ratio(它会强制居中)、不传 prompt(只补边)。
   retain_original_quality 保持默认 true(原图像素不重采样，符合「原图完整保留」)。 */
export const EXPAND_CREDITS_PER_IMAGE = 4;

export const methodCost = (m: Method) => (m === "expand" ? EXPAND_CREDITS_PER_IMAGE : 0);

/** 预计积分 = 选中版位里 Expand 的张数 × 单张价格 */
export function resizeCredits(methods: Method[]): number {
  return methods.reduce((n, m) => n + methodCost(m), 0);
}

/** 比例文字:1080×1920 → 9:16;1200×628 → 1.91:1 */
export function ratioLabel(w: number, h: number): string {
  const g = gcd(Math.round(w), Math.round(h));
  const a = Math.round(w) / g;
  const b = Math.round(h) / g;
  if (a <= 32 && b <= 32) return `${a}:${b}`;
  return w >= h ? `${trim(w / h)}:1` : `1:${trim(h / w)}`;
}
const trim = (n: number) => String(Math.round(n * 100) / 100);
function gcd(a: number, b: number): number {
  return b ? gcd(b, a % b) : Math.abs(a) || 1;
}

/** Custom 宽高输入:取整并夹到 [64, 4096];非数字回到 fallback */
export function parseCustomSide(raw: string, fallback: number): number {
  const n = Number(raw.trim());
  if (!raw.trim() || !Number.isFinite(n)) return fallback;
  return Math.min(CUSTOM_MAX, Math.max(CUSTOM_MIN, Math.round(n)));
}

export type Rect = { x: number; y: number; w: number; h: number };
/** 主体微调:图片相对居中位置的位移(画框比例) */
export type Offset = { dx: number; dy: number };
export const NO_OFFSET: Offset = { dx: 0, dy: 0 };

/**
 * 原图在画框里的位置(画框比例)。
 * - crop:等比铺满(cover),多出来的被裁掉;位移夹在「不露边」的范围里。
 * - expand / fit:等比放进去(contain),空出来的地方 Expand 由 AI 补、Fit 补纯色;位移夹在「不出框」的范围里。
 */
export function placeImage(src: { w: number; h: number }, frame: { w: number; h: number }, method: Method, offset: Offset = NO_OFFSET): Rect {
  const sx = frame.w / src.w;
  const sy = frame.h / src.h;
  const scale = method === "crop" ? Math.max(sx, sy) : Math.min(sx, sy);
  const w = (src.w * scale) / frame.w;
  const h = (src.h * scale) / frame.h;
  const place = (size: number, d: number) => {
    const free = 1 - size; // crop 时 ≤ 0,contain 时 ≥ 0
    const lo = Math.min(free, 0);
    const hi = Math.max(free, 0);
    return Math.min(hi, Math.max(lo, free / 2 + d));
  };
  return { x: place(w, offset.dx), y: place(h, offset.dy), w, h };
}

/** 位移夹到合法范围后的值(拖动结束时回写,免得越拖越远) */
export function clampOffset(src: { w: number; h: number }, frame: { w: number; h: number }, method: Method, offset: Offset): Offset {
  const r = placeImage(src, frame, method, offset);
  const c = placeImage(src, frame, method, NO_OFFSET);
  return { dx: r.x - c.x, dy: r.y - c.y };
}

/** 主体框(原图比例)换算到画框比例 */
export function subjectInFrame(subject: Rect, img: Rect): Rect {
  return { x: img.x + subject.x * img.w, y: img.y + subject.y * img.h, w: subject.w * img.w, h: subject.h * img.h };
}

/** 9:16 画框里的安全区(画框比例) */
export function safeArea(): { top: number; bottom: number } {
  return { top: SAFE_ZONE_9x16.top / SAFE_ZONE_9x16.frameH, bottom: 1 - SAFE_ZONE_9x16.bottom / SAFE_ZONE_9x16.frameH };
}

export type SubjectWarning = "cut" | "unsafe" | null;

/** 允许的误差(画框比例),免得贴边 1px 也报 */
const EPS = 0.005;

/**
 * 主体有没有问题:
 * - cut:主体有一部分在画框外(Crop 裁掉了);
 * - unsafe:9:16 版位里主体伸进了顶部 / 底部 UI 遮挡区。
 */
export function subjectWarning(subjectFrame: Rect, safeZone: boolean): SubjectWarning {
  const s = subjectFrame;
  if (s.x < -EPS || s.y < -EPS || s.x + s.w > 1 + EPS || s.y + s.h > 1 + EPS) return "cut";
  if (safeZone) {
    const z = safeArea();
    if (s.y < z.top - EPS || s.y + s.h > z.bottom + EPS) return "unsafe";
  }
  return null;
}

export const WARNING_TEXT: Record<Exclude<SubjectWarning, null>, string> = {
  cut: "Part of the subject is cropped out.",
  unsafe: "Subject overlaps the app's UI area.",
};

/** 下载文件名:resize-tiktok-1080x1920.png */
export const resizeFileName = (p: { id: string; w: number; h: number }) => `resize-${p.id}-${p.w}x${p.h}.png`;
