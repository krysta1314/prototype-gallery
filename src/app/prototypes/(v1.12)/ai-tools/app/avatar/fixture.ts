// Product Avatar / Custom Avatar 的 fixture 素材(都是仓库里已有、无真实客户品牌的图):
// - 预设 UGC 数字人:asset-library 头像 / 图片、buzzvideo-app 头像、ai-tools 演示图、mcp-skill-showcase 小头像;
// - 样例商品:mcp-skill-showcase 的 Aurelia(自家虚构护肤品牌)两张;
// - Custom Avatar 样例拍摄素材:avatar-footage-sample.mp4 = buzzvideo-app/avatar.jpg 做的 42 秒缓推镜头(ffmpeg 生成,无声)。
import type { ProductCategory } from "./logic";

export type PresetAvatar = { id: string; name: string; image: string; tag: string; /** 头像在图里的焦点(object-position) */ focus?: string };

export const PRESET_AVATARS: PresetAvatar[] = [
  { id: "p-maya", name: "Maya", image: "/prototypes/asset-library/avatars/avatar-01.png", tag: "Casual · 20s", focus: "50% 30%" },
  { id: "p-jun", name: "Jun", image: "/prototypes/buzzvideo-app/avatar.jpg", tag: "Friendly · 30s", focus: "50% 35%" },
  { id: "p-hana", name: "Hana", image: "/prototypes/asset-library/images/img-01.jpg", tag: "Clean beauty · 20s", focus: "50% 25%" },
  { id: "p-zoe", name: "Zoe", image: "/prototypes/ai-tools/demo-after.png", tag: "Energetic · 20s", focus: "50% 30%" },
  { id: "p-lily", name: "Lily", image: "/prototypes/mcp-skill-showcase/avatar-ugc-product-review.jpg", tag: "Selfie style · 20s", focus: "50% 40%" },
];

export type VoiceOption = { id: string; name: string; desc: string; /** 浏览器朗读试听(speechSynthesis)的音高 / 语速 */ pitch: number; rate: number; prefer: "female" | "male" };

export const PRESET_VOICES: VoiceOption[] = [
  { id: "v-ava", name: "Ava", desc: "Warm, conversational", pitch: 1.1, rate: 1, prefer: "female" },
  { id: "v-noah", name: "Noah", desc: "Calm, confident", pitch: 0.85, rate: 0.95, prefer: "male" },
  { id: "v-ivy", name: "Ivy", desc: "Bright, upbeat", pitch: 1.3, rate: 1.1, prefer: "female" },
  { id: "v-leo", name: "Leo", desc: "Deep, steady", pitch: 0.7, rate: 0.9, prefer: "male" },
];

export const VOICE_PREVIEW_LINE = "Hi! Here's a quick look at how I sound in your video.";

export type ProductImage = { id: string; url: string; name: string };

export const SAMPLE_PRODUCT = {
  name: "Aurelia Brightening Serum",
  category: "beauty" as ProductCategory,
  benefits: ["fades dark spots in four weeks", "feels weightless and absorbs in seconds", "pairs vitamin C with niacinamide"],
  images: [
    { id: "s-1", url: "/prototypes/mcp-skill-showcase/aurelia-ecom.jpg", name: "aurelia-serum.jpg" },
    { id: "s-2", url: "/prototypes/mcp-skill-showcase/ref-product-ad.jpg", name: "aurelia-set.jpg" },
  ] satisfies ProductImage[],
};

export const SAMPLE_FOOTAGE = { url: "/prototypes/ai-tools/avatar-footage-sample.mp4", name: "my-footage.mp4", duration: 42, poster: "/prototypes/buzzvideo-app/avatar.jpg" };

/** 授权声明:按页面提示朗读这一句 */
export const CONSENT_SENTENCE =
  "I confirm this is my face and voice, and I allow BuzzVideo to create a digital avatar of me for use in this workspace.";

/** 训练完成前显示的预计时间(fixture 实际 8 秒) */
export const TRAINING_ETA = "about 5 minutes";
