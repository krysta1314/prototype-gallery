"use client";

/* 画笔页的浏览器端绘制:把笔画画成遮罩、算遮罩覆盖率、做 fixture 结果图。
   fixture 结果(原型里不调模型):
   - Remove:遮罩区用周围像素向里扩散填平(低分辨率迭代平均 + 放大 + 羽化),纯色 / 渐变背景上看起来就是「东西没了」;
   - Replace:先同样填平,再在遮罩区叠一层按 prompt 换色的原图内容,看得出「换了东西」,但不是真的按描述画。 */

import type { BrushMode, Stroke } from "./logic";

/** 在 ctx 上按 w×h 画所有笔画(paint 用 color,erase 擦掉) */
export function drawStrokes(ctx: CanvasRenderingContext2D, strokes: Stroke[], w: number, h: number, color: string) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const s of strokes) {
    ctx.globalCompositeOperation = s.kind === "erase" ? "destination-out" : "source-over";
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    const d = s.size * w;
    if (s.points.length === 1) {
      const [x, y] = s.points[0];
      ctx.beginPath();
      ctx.arc(x * w, y * h, d / 2, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    ctx.lineWidth = d;
    ctx.beginPath();
    s.points.forEach(([x, y], i) => (i ? ctx.lineTo(x * w, y * h) : ctx.moveTo(x * w, y * h)));
    ctx.stroke();
  }
  ctx.restore();
}

/** 遮罩画布(透明底 + 白色遮罩) */
export function maskCanvas(strokes: Stroke[], w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (ctx) drawStrokes(ctx, strokes, w, h, "#fff");
  return c;
}

/** 遮罩占整张图的比例(在 ≤ 200px 宽的小图上数) */
export function maskCoverage(strokes: Stroke[], imgW: number, imgH: number): number {
  if (!strokes.length || imgW <= 0 || imgH <= 0) return 0;
  const k = Math.min(1, 200 / imgW);
  const w = Math.max(1, Math.round(imgW * k));
  const h = Math.max(1, Math.round(imgH * k));
  const ctx = maskCanvas(strokes, w, h).getContext("2d");
  if (!ctx) return 0;
  const d = ctx.getImageData(0, 0, w, h).data;
  let on = 0;
  for (let i = 3; i < d.length; i += 4) if (d[i] > 127) on++;
  return on / (w * h);
}

/** 导出给模型的遮罩 PNG(黑底白遮罩,原图像素) */
export function maskPng(strokes: Stroke[], w: number, h: number): string {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) return "";
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(maskCanvas(strokes, w, h), 0, 0);
  return c.toDataURL("image/png");
}

/** 简单字符串哈希 → 0–359(Replace 按 prompt 换色) */
const hue = (s: string) => {
  let x = 0;
  for (const ch of s) x = (x * 31 + ch.charCodeAt(0)) >>> 0;
  return x % 360;
};

/** 遮罩区向内扩散填平:在低分辨率上把遮罩像素反复取四邻平均 */
function diffuseFill(img: HTMLImageElement, strokes: Stroke[], w: number, h: number): HTMLCanvasElement {
  const k = Math.min(1, 160 / Math.max(w, h));
  const sw = Math.max(2, Math.round(w * k));
  const sh = Math.max(2, Math.round(h * k));
  const small = document.createElement("canvas");
  small.width = sw;
  small.height = sh;
  const sctx = small.getContext("2d")!;
  sctx.drawImage(img, 0, 0, sw, sh);
  const px = sctx.getImageData(0, 0, sw, sh);
  /* 遮罩稍微放大一点,把物体边缘也算进去 */
  const grown = strokes.map((s) => ({ ...s, size: s.kind === "paint" ? s.size * 1.25 : s.size }));
  const m = maskCanvas(grown, sw, sh).getContext("2d")!.getImageData(0, 0, sw, sh).data;
  const mask = new Uint8Array(sw * sh);
  for (let i = 0; i < mask.length; i++) mask[i] = m[i * 4 + 3] > 40 ? 1 : 0;
  const buf = new Float32Array(sw * sh * 3);
  for (let i = 0; i < sw * sh; i++) for (let c = 0; c < 3; c++) buf[i * 3 + c] = px.data[i * 4 + c];
  for (let iter = 0; iter < 260; iter++) {
    for (let y = 0; y < sh; y++)
      for (let x = 0; x < sw; x++) {
        const i = y * sw + x;
        if (!mask[i]) continue;
        let n = 0;
        const acc = [0, 0, 0];
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= sw || ny >= sh) continue;
          const j = ny * sw + nx;
          for (let c = 0; c < 3; c++) acc[c] += buf[j * 3 + c];
          n++;
        }
        for (let c = 0; c < 3; c++) buf[i * 3 + c] = acc[c] / n;
      }
  }
  for (let i = 0; i < sw * sh; i++) for (let c = 0; c < 3; c++) px.data[i * 4 + c] = buf[i * 3 + c];
  sctx.putImageData(px, 0, 0);
  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const octx = out.getContext("2d")!;
  octx.imageSmoothingQuality = "high";
  octx.filter = `blur(${Math.max(2, Math.round(w / 220))}px)`;
  octx.drawImage(small, 0, 0, w, h);
  octx.filter = "none";
  /* 加一点颗粒,别像一块塑料 */
  const grain = octx.getImageData(0, 0, w, h);
  for (let i = 0; i < grain.data.length; i += 4) {
    const g = (Math.random() - 0.5) * 6;
    grain.data[i] += g;
    grain.data[i + 1] += g;
    grain.data[i + 2] += g;
  }
  octx.putImageData(grain, 0, 0);
  return out;
}

/** fixture 结果图(PNG data URL,原图像素;长边超过 2048 先缩小,免得卡) */
export function fixtureResult(img: HTMLImageElement, strokes: Stroke[], mode: BrushMode, prompt: string): string {
  const k = Math.min(1, 2048 / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * k);
  const h = Math.round(img.naturalHeight * k);
  const fill = diffuseFill(img, strokes, w, h);
  const fctx = fill.getContext("2d")!;
  if (mode === "replace") {
    /* 遮罩区叠一层换了色相的原图内容,示意「画了新东西」 */
    fctx.save();
    fctx.globalAlpha = 0.55;
    fctx.filter = `hue-rotate(${hue(prompt)}deg) saturate(1.4)`;
    fctx.drawImage(img, w * 0.04, h * 0.04, w * 0.92, h * 0.92);
    fctx.restore();
  }
  /* 羽化遮罩:只把遮罩区换成填好的内容 */
  const feather = document.createElement("canvas");
  feather.width = w;
  feather.height = h;
  const ftx = feather.getContext("2d")!;
  ftx.filter = `blur(${Math.max(2, Math.round(w / 200))}px)`;
  ftx.drawImage(maskCanvas(strokes.map((s) => ({ ...s, size: s.kind === "paint" ? s.size * 1.2 : s.size })), w, h), 0, 0);
  ftx.filter = "none";
  ftx.globalCompositeOperation = "source-in";
  ftx.drawImage(fill, 0, 0);
  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const o = out.getContext("2d")!;
  o.drawImage(img, 0, 0, w, h);
  o.drawImage(feather, 0, 0);
  return out.toDataURL("image/png");
}
