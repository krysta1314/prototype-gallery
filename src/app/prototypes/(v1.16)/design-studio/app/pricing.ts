// Design Studio 里 AI 动作的积分(示意数，单价待确认;现有工具沿用工具页价格)。
// 编辑器本身(排版、改字、Elements、模板、非 AI Resize)不扣积分。

export type AiAction =
  | "remove_bg"
  | "upscale"
  | "relight"
  | "object_removal"
  | "regenerate_layer"
  | "split_layers"
  | "brand_from_url"
  | "generate_on_brand"
  | "deck_outline"
  | "deck_slide"
  | "site_section"
  | "magic_expand"
  | "magic_write"
  | "rewrite_shorter"
  | "slide_image"
  | "to_chart";

export const AI_ACTIONS: Record<AiAction, { label: string; credits: number; note?: string }> = {
  remove_bg: { label: "Remove background", credits: 2 },
  upscale: { label: "Upscale", credits: 4 },
  relight: { label: "Relight", credits: 6 },
  object_removal: { label: "Remove object", credits: 4 },
  regenerate_layer: { label: "Regenerate this layer", credits: 6 },
  split_layers: { label: "Split to Layers", credits: 8 },
  brand_from_url: { label: "Build brand kit from website", credits: 0, note: "First one is free" },
  generate_on_brand: { label: "Generate on brand", credits: 6, note: "per design" },
  deck_outline: { label: "Deck outline", credits: 0 },
  deck_slide: { label: "Deck slide", credits: 6, note: "per slide" },
  site_section: { label: "Site section", credits: 4, note: "per section" },
  magic_expand: { label: "Magic Expand", credits: 6 },
  magic_write: { label: "Magic Write", credits: 1 },
  rewrite_shorter: { label: "Rewrite shorter", credits: 1 },
  slide_image: { label: "Generate image for slide", credits: 6 },
  to_chart: { label: "Turn into chart", credits: 2 },
};

export const costOf = (a: AiAction, count = 1) => AI_ACTIONS[a].credits * Math.max(1, count);
