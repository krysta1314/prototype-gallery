// Virtual Try-On(含 Model Swap 模式)的纯逻辑(node 测试直接跑):两张图的校验、积分、FASHN v1.6 入参。
// 模型:fal-ai/fashn/tryon/v1.6(调研第 4 轮)。参数 category(tops / bottoms / one-pieces)、garment_photo_type(flat-lay / model)、num_samples(1–4)。
//   try-on     = 人物照(model_image)+ 服装照(garment_image,平铺图或别人穿着的图);
//   model-swap = 原图(模特穿着这套衣服)+ 新模特照 → 衣服换到新模特身上 = FASHN 以原图当 garment_image、garment_photo_type 固定 model。

export type TryOnMode = "try-on" | "model-swap";
export type GarmentCategory = "tops" | "bottoms" | "one-pieces";
export type GarmentPhotoType = "flat-lay" | "model";
/** 人物照拍到哪儿:upper = 半身(只到胸 / 腰),full = 全身;样例图手标,上传的图不知道 */
export type Framing = "upper" | "full" | "unknown";

export const FASHN_MODEL = "fal-ai/fashn/tryon/v1.6";

export const CATEGORY_OPTIONS = [
  { value: "tops", label: "Tops" },
  { value: "bottoms", label: "Bottoms" },
  { value: "one-pieces", label: "One-piece" },
] as const;
export const PHOTO_TYPE_OPTIONS = [
  { value: "flat-lay", label: "Flat-lay", title: "Product photo of the garment on its own" },
  { value: "model", label: "On model", title: "Someone is already wearing the garment" },
] as const;

/** 两个上传位在两种模式下的名字 */
export const SLOT_COPY: Record<TryOnMode, { a: { label: string; hint: string }; b: { label: string; hint: string } }> = {
  "try-on": {
    a: { label: "Person", hint: "A clear photo of the person — facing the camera works best." },
    b: { label: "Garment", hint: "A product photo of the garment, or someone wearing it." },
  },
  "model-swap": {
    a: { label: "Source photo", hint: "The model wearing the outfit you want to keep." },
    b: { label: "New model", hint: "The person who should wear the outfit." },
  },
};

export const SAMPLES_MIN = 1;
export const SAMPLES_MAX = 4;
/** 积分占位价:每张结果 3 credits(fal 账单约 $0.075 / 张,等定价) */
export const CREDITS_PER_SAMPLE = 3;

export function tryOnCredits(samples: number): number {
  return Math.min(SAMPLES_MAX, Math.max(SAMPLES_MIN, Math.round(samples))) * CREDITS_PER_SAMPLE;
}

export type SlotImage = { url: string; name: string; framing: Framing };

/** 主按钮能不能点;不能时返回原因 */
export function tryOnBlocker(mode: TryOnMode, a: SlotImage | null, b: SlotImage | null): string | null {
  const c = SLOT_COPY[mode];
  if (!a && !b) return `Add a ${c.a.label.toLowerCase()} and a ${c.b.label.toLowerCase()}.`;
  if (!a) return `Add a ${c.a.label.toLowerCase()}.`;
  if (!b) return `Add a ${c.b.label.toLowerCase()}.`;
  if (a.url === b.url) return "Use two different photos.";
  return null;
}

/** 不拦但要提醒的:下装 / 连体要全身照(人物照只到半身时) */
export function framingWarning(category: GarmentCategory, person: SlotImage | null): string | null {
  if (!person || person.framing !== "upper" || category === "tops") return null;
  return category === "bottoms" ? "This photo doesn't show the lower body — use a full-body photo for bottoms." : "Use a full-body photo for one-pieces.";
}

/** 真实接入时的 FASHN 入参。Model Swap:新模特 = model_image,原图 = garment_image,类型固定 model */
export function toFashnInput(
  mode: TryOnMode,
  o: { a: string; b: string; category: GarmentCategory; photoType: GarmentPhotoType; samples: number },
): Record<string, unknown> {
  const num_samples = Math.min(SAMPLES_MAX, Math.max(SAMPLES_MIN, Math.round(o.samples)));
  if (mode === "try-on") return { model_image: o.a, garment_image: o.b, category: o.category, garment_photo_type: o.photoType, num_samples };
  return { model_image: o.b, garment_image: o.a, category: o.category, garment_photo_type: "model", num_samples };
}

/** 两种模式下哪张是「穿衣服的人」(结果以它为底) */
export const wearerOf = <T extends SlotImage>(mode: TryOnMode, a: T, b: T): T => (mode === "try-on" ? a : b);
/** 两种模式下哪张提供衣服 */
export const garmentOf = <T extends SlotImage>(mode: TryOnMode, a: T, b: T): T => (mode === "try-on" ? b : a);

export const tryOnFileName = (mode: TryOnMode, i: number) => `${mode === "try-on" ? "try-on" : "model-swap"}-${i + 1}.png`;
