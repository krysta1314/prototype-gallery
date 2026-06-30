// Shared model catalog: used by the Models nav menu, the Explore section,
// and the full "all models" aggregation page. Keep this as the single source.

export type ModelItem = {
  name: string;
  provider: string;
  badge?: string;
  desc?: string;
  thumb?: string;
};

const A = "https://assets.presslogic.com/buzzvideo/public/2026-06-15";
const U = "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-06-26";
const B = "https://asset.buzzvideo.ai/buzzvideo/video/2026/06/26";

export type ModelGroup = {
  label: string;
  type: "image" | "video";
  items: ModelItem[];
};

// Tools nav menu (labels only; icons are not shown in the menu)
export const TOOL_GROUPS: { label: string; items: { label: string }[] }[] = [
  {
    label: "Images",
    items: [
      { label: "AI image generator" },
      { label: "Image style transfer" },
      { label: "AI art generator" },
      { label: "Image to image" },
      { label: "Text to image" },
      { label: "Generate image from text" },
    ],
  },
  {
    label: "Video",
    items: [
      { label: "AI video generator" },
      { label: "Text to video" },
      { label: "Image to video" },
      { label: "Video style transfer" },
      { label: "AI motion effects" },
      { label: "Generate video from text" },
    ],
  },
];

// Featured tiles shown inside the Tools / Models mega-menus
export const TOOLS_FEATURED_VIDEO =
  "https://assets.presslogic.com/buzzvideo/public/2026-06-26/328742133781553152.mp4";
export const MODELS_FEATURED_VIDEO =
  "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-06-26/328832505492856832.mp4";

export const MODEL_GROUPS: ModelGroup[] = [
  {
    label: "Image models",
    type: "image",
    items: [
      { name: "GPT-image-2", provider: "fal", badge: "Hot", desc: "Versatile image generation and editing from text or references.", thumb: `${A}/324743022677909504.mp4` },
      { name: "Seedream 5.0 lite", provider: "bytedance", desc: "Fast, lightweight image generation for quick iteration.", thumb: `${A}/324746276853833728.mp4` },
      { name: "Nano Banana 2", provider: "google", desc: "The latest Nano Banana image model.", thumb: `${A}/324795053161635840.mp4` },
      { name: "Nano Banana Pro", provider: "google", desc: "Higher-detail image generation for finished assets.", thumb: `${A}/324747139299205120.mp4` },
      { name: "Nano Banana", provider: "google", desc: "Everyday image generation for ideas and drafts.", thumb: `${B}/c889902a-2b0f-445e-9131-e9ecd454693e_39984ab3.mp4` },
      { name: "Seedream 4.5", provider: "bytedance", desc: "Balanced quality and speed for general use.", thumb: `${B}/a9480f2a-4b7f-4cdf-8220-b9494d326fbe_1ecbe13f.mp4` },
    ],
  },
  {
    label: "Video models",
    type: "video",
    items: [
      { name: "Seedance 2.5", provider: "bytedance", badge: "New", desc: "Flagship model with 30s native video, 4K, and stronger scene control.", thumb: "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-06-30/330271124128587776.png" },
      { name: "Seedance 2.0 Mini", provider: "bytedance", desc: "Lighter, faster drafts for rapid iteration.", thumb: `${U}/328824916013015040.mp4` },
      { name: "Seedance 2.0 Fast", provider: "bytedance", desc: "Speed-optimized generation for quick tests.", thumb: `${A}/324784444911181824.mp4` },
      { name: "Seedance 2.0", provider: "bytedance", badge: "Hot", desc: "Reliable all-round AI video generation.", thumb: `${A}/324763823477153792.mp4` },
      { name: "Kling 3.0", provider: "kie", desc: "Cinematic motion with strong prompt adherence.", thumb: `${A}/324787241400459264.mp4` },
      { name: "Veo3.1 Fast", provider: "google", desc: "Quick Veo 3.1 generations at lower cost.", thumb: `${A}/324765417878904832.mp4` },
      { name: "Veo 3.1", provider: "google", desc: "High-fidelity video with rich detail.", thumb: `${A}/324784703385165824.mp4` },
      { name: "Seedance 1.5 Pro", provider: "bytedance", desc: "Previous-generation pro video model.", thumb: "https://assets.presslogic.com/buzzvideo/public/2026-06-26/328742133781553152.mp4" },
    ],
  },
];
