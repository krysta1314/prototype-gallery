// Remove Object + Inpaint 画笔页的纯逻辑(node 测试直接跑):遮罩笔画的撤销 / 重做、积分、能不能提交、fal 入参。
// 两种模式同一个画笔页(调研第 4 轮,Monica 2026-11-04 批准):
//   remove  = 只要遮罩,不写 prompt → fal-ai/bria/eraser(image_url + mask_url);
//   replace = 遮罩 + prompt「What should go here?」→ fal-ai/qwen-image-edit/inpaint(image_url + mask_url + prompt)。
// 笔画坐标按图片归一化(0–1),笔刷直径按图片宽度的比例存:换显示尺寸 / 窄屏都不变形,导出遮罩时按原图像素画。

export type BrushMode = "remove" | "replace";

export const BRUSH_MODELS: Record<BrushMode, string> = {
  remove: "fal-ai/bria/eraser",
  replace: "fal-ai/qwen-image-edit/inpaint",
};

/** 一笔:paint = 涂遮罩,erase = 橡皮擦掉遮罩 */
export type Stroke = { kind: "paint" | "erase"; size: number; points: [number, number][] };

/** 笔刷大小滑块(显示给用户的是 1–100 档);size = 档位 / 100 × MAX_BRUSH(占图片宽度的比例) */
export const BRUSH_MIN = 1;
export const BRUSH_MAX = 100;
export const BRUSH_DEFAULT = 35;
const MAX_BRUSH = 0.16;
export const brushSize = (level: number) => (Math.min(BRUSH_MAX, Math.max(BRUSH_MIN, level)) / 100) * MAX_BRUSH;

/* ---------- 遮罩历史(撤销 / 重做 / 清空也能撤销) ---------- */
export type MaskState = { strokes: Stroke[]; past: Stroke[][]; future: Stroke[][] };
export type MaskAction = { type: "add"; stroke: Stroke } | { type: "undo" } | { type: "redo" } | { type: "clear" } | { type: "reset" };

export const EMPTY_MASK: MaskState = { strokes: [], past: [], future: [] };

export function maskReduce(s: MaskState, a: MaskAction): MaskState {
  switch (a.type) {
    case "add":
      if (!a.stroke.points.length) return s;
      return { strokes: [...s.strokes, a.stroke], past: [...s.past, s.strokes], future: [] };
    case "undo": {
      if (!s.past.length) return s;
      return { strokes: s.past[s.past.length - 1], past: s.past.slice(0, -1), future: [s.strokes, ...s.future] };
    }
    case "redo": {
      if (!s.future.length) return s;
      return { strokes: s.future[0], past: [...s.past, s.strokes], future: s.future.slice(1) };
    }
    case "clear":
      if (!s.strokes.length) return s;
      return { strokes: [], past: [...s.past, s.strokes], future: [] };
    case "reset":
      return EMPTY_MASK;
  }
}

/** 有没有涂过(只有橡皮擦不算) */
export const hasPaint = (strokes: Stroke[]) => strokes.some((s) => s.kind === "paint");

/* ---------- 积分(占位价,等定价;fal 账单:Bria eraser 约 $0.04 / 张,qwen inpaint 约 $0.03 / 百万像素) ---------- */
export const BRUSH_CREDITS: Record<BrushMode, number> = { remove: 2, replace: 3 };
/** 大图(> 4 百万像素)按 2 倍算(占位) */
export const LARGE_MP = 4;
/** 遮罩覆盖小于这个比例当作没涂(手抖点了一下) */
export const MIN_COVERAGE = 0.0005;
/** 遮罩覆盖超过这个比例提示:大面积效果可能不自然(不拦) */
export const LARGE_COVERAGE = 0.5;

/** 一次处理要多少积分;没涂(覆盖 ≈ 0)= null,按钮禁用 */
export function brushCredits(mode: BrushMode, coverage: number, width: number, height: number): number | null {
  if (!(coverage >= MIN_COVERAGE)) return null;
  const mp = (width * height) / 1_000_000;
  return BRUSH_CREDITS[mode] * (mp > LARGE_MP ? 2 : 1);
}

/** 主按钮能不能点;不能时返回原因(按钮悬停提示) */
export function brushBlocker(o: { hasImage: boolean; coverage: number; mode: BrushMode; prompt: string }): string | null {
  if (!o.hasImage) return "Upload an image first.";
  if (!(o.coverage >= MIN_COVERAGE)) return o.mode === "remove" ? "Brush over what you want to remove." : "Brush over the area to replace.";
  if (o.mode === "replace" && !o.prompt.trim()) return "Describe what should go here.";
  return null;
}

export const PROMPT_MAX = 300;

/** 真实接入时的 fal 入参(mask 白 = 要改的地方) */
export function toBrushInput(mode: BrushMode, imageUrl: string, maskUrl: string, prompt: string): Record<string, unknown> {
  if (mode === "remove") return { image_url: imageUrl, mask_url: maskUrl };
  return { image_url: imageUrl, mask_url: maskUrl, prompt: prompt.trim() };
}

export const brushFileName = (name: string, mode: BrushMode) => `${name.replace(/\.[^.]+$/, "") || "image"}-${mode === "remove" ? "removed" : "inpainted"}.png`;
