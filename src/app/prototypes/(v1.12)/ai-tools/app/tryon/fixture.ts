"use client";

/* Virtual Try-On / Model Swap 的样例图和 fixture 结果(原型里不调 FASHN)。
   样例(都是仓库里的无品牌人像,没有真实客户品牌;仓库里没有平铺服装图,所以服装样例是「On model」):
   - Try-On:人物 = asset-library/images/img-01.jpg(白色针织上衣,半身);服装 = ai-tools/demo-after.png(橙色罗纹背心,别人穿着);
   - Model Swap:原图 = ai-tools/demo-after.png(穿橙色背心);新模特 = buzzvideo-app/avatar.jpg(米色毛衣,半身)。
   结果 = 「穿衣服的人」那张图 + 在手标的上身区域用正片叠底铺上服装区域的纹理(羽化边;黑头发叠完还是黑的,所以长发不会被盖住)。
   每张变体稍微挪一下纹理、换一点亮度,结果网格不完全一样。上传的图不识别,按画面下半中间一块估算。 */

import { loadImage } from "../tools/media";
import type { Framing, GarmentPhotoType, TryOnMode } from "./logic";

type Rect = { x: number; y: number; w: number; h: number };
export type SampleImage = { url: string; name: string; framing: Framing; photoType?: GarmentPhotoType; body: Rect; garment: Rect };

const IMG_01: SampleImage = {
  url: "/prototypes/asset-library/images/img-01.jpg",
  name: "model-white-top.jpg",
  framing: "upper",
  body: { x: 0.1, y: 0.69, w: 0.8, h: 0.31 },
  garment: { x: 0.4, y: 0.8, w: 0.2, h: 0.2 },
};
const ORANGE_TOP: SampleImage = {
  url: "/prototypes/ai-tools/demo-after.png",
  name: "orange-ribbed-tank.png",
  framing: "upper",
  photoType: "model",
  body: { x: 0.28, y: 0.77, w: 0.44, h: 0.23 },
  garment: { x: 0.34, y: 0.8, w: 0.32, h: 0.2 },
};
const MAN_SWEATER: SampleImage = {
  url: "/prototypes/buzzvideo-app/avatar.jpg",
  name: "new-model.jpg",
  framing: "upper",
  body: { x: 0.04, y: 0.69, w: 0.94, h: 0.31 },
  garment: { x: 0.25, y: 0.78, w: 0.5, h: 0.22 },
};

/** 每个模式两个上传位的样例 */
export const SAMPLES: Record<TryOnMode, { a: SampleImage; b: SampleImage }> = {
  "try-on": { a: IMG_01, b: ORANGE_TOP },
  "model-swap": { a: ORANGE_TOP, b: MAN_SWEATER },
};

const KNOWN = [IMG_01, ORANGE_TOP, MAN_SWEATER];
const UPLOAD_BODY: Rect = { x: 0.2, y: 0.58, w: 0.6, h: 0.42 };
const UPLOAD_GARMENT: Record<GarmentPhotoType, Rect> = { "flat-lay": { x: 0.25, y: 0.25, w: 0.5, h: 0.5 }, model: { x: 0.32, y: 0.62, w: 0.36, h: 0.3 } };
const known = (url: string) => KNOWN.find((k) => k.url === url);

/** 上传位缩略图对准衣服(样例图的衣服在画面下部);不认识的图居中 */
export function garmentFocus(url: string): string | undefined {
  const g = known(url)?.garment;
  return g ? `50% ${Math.round((g.y + g.h / 2) * 100)}%` : undefined;
}

/** fixture 结果图(JPEG data URL);variant 0–3 */
export async function renderTryOn(wearerUrl: string, garmentUrl: string, photoType: GarmentPhotoType, variant: number): Promise<string> {
  const [person, garment] = await Promise.all([loadImage(wearerUrl), loadImage(garmentUrl)]);
  const k = Math.min(1, 1280 / Math.max(person.naturalWidth, person.naturalHeight));
  const w = Math.round(person.naturalWidth * k);
  const h = Math.round(person.naturalHeight * k);
  const body = known(wearerUrl)?.body ?? UPLOAD_BODY;
  const g = known(garmentUrl)?.garment ?? UPLOAD_GARMENT[photoType];

  /* 服装纹理铺满上身框(每个变体挪一点、放大一点) */
  const tex = document.createElement("canvas");
  tex.width = w;
  tex.height = h;
  const t = tex.getContext("2d")!;
  const bx = body.x * w;
  const by = body.y * h;
  const bw = body.w * w;
  const bh = body.h * h;
  const zoom = 1 + variant * 0.12;
  const sx = g.x * garment.naturalWidth + variant * 0.03 * garment.naturalWidth;
  const sw = (g.w * garment.naturalWidth) / zoom;
  const sh = (g.h * garment.naturalHeight) / zoom;
  /* 按上身框比例从服装区域里取一块(不拉伸变形) */
  const want = bw / bh;
  const cw = Math.min(sw, sh * want);
  const ch = cw / want;
  t.filter = `brightness(${1.12 - variant * 0.05}) saturate(${1 + variant * 0.06})`;
  t.drawImage(garment, sx + (sw - cw) / 2, g.y * garment.naturalHeight + (sh - ch) / 2, cw, ch, bx - bw * 0.04, by, bw * 1.08, bh * 1.04);
  t.filter = "none";
  /* 羽化成上身形状(圆角 + 模糊边) */
  const mask = document.createElement("canvas");
  mask.width = w;
  mask.height = h;
  const m = mask.getContext("2d")!;
  m.filter = `blur(${Math.round(w / 70)}px)`;
  m.fillStyle = "#fff";
  m.beginPath();
  m.roundRect(bx + bw * 0.04, by + bh * 0.08, bw * 0.92, bh * 1.2, bw * 0.18);
  m.fill();
  m.filter = "none";
  m.globalCompositeOperation = "source-in";
  m.drawImage(tex, 0, 0);

  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const o = out.getContext("2d")!;
  o.drawImage(person, 0, 0, w, h);
  o.globalCompositeOperation = "multiply";
  o.drawImage(mask, 0, 0);
  /* 再叠一层正常模式的一小部分,让浅色衣服的人也看得出颜色 */
  o.globalCompositeOperation = "source-over";
  o.globalAlpha = 0.18;
  o.drawImage(mask, 0, 0);
  return out.toDataURL("image/jpeg", 0.9);
}
