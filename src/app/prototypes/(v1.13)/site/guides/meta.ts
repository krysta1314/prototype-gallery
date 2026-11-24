// 模型指南 / 对比 / 模型总页的 <title> 和 meta description(2026-11-19)。
// 服务端 generateMetadata 直接读这里，所以这个文件不能引任何 React 组件。标题 ≤60 字符、关键词在前、以 " | BuzzVideo" 结尾;描述 120–160 字符。

import { VIDEO_META } from "./content-video";
import { IMAGE_META } from "./content-image";
import { COMPARE_META } from "./content-compare";

export const META: Record<string, { title: string; description: string }> = {
  ...VIDEO_META,
  ...IMAGE_META,
  ...COMPARE_META,
  "seedance-2-5-prompt-guide": {
    title: "Seedance 2.5 Prompt Guide: Real Examples | BuzzVideo",
    description: "How to write Seedance 2.5 prompts for video ads: product locks, timecoded beats, sound and avoid lists, with real prompts and the videos they made on BuzzVideo.",
  },
  "kling-4-0-prompt-guide": {
    title: "Kling 4.0 Prompt Guide: One-Take Video Ads | BuzzVideo",
    description: "Write Kling 4.0 prompts for one-take UGC ads, demos and story ads: character locks, timecoded beats and dialogue, with a template and real Kling 4.0 videos.",
  },
  "gpt-image-2-5-sunburst-prompt-guide": {
    title: "GPT Image 2.5 Sunburst Prompt Guide | BuzzVideo",
    description: "How to prompt GPT Image 2.5 Sunburst for ad creatives: product references, quoted label text, framing and quality levels, with real Sunburst images.",
  },
  "nano-banana-pro-prompt-guide": {
    title: "Nano Banana Pro Prompt Guide: Product Ads | BuzzVideo",
    description: "Write Nano Banana Pro prompts for product ads: ad format, product lock, quoted text, pose and lighting, with three real prompts and their images on BuzzVideo.",
  },
  "seedance-2-5-pricing": {
    title: "Seedance 2.5 Pricing: Credits per Clip | BuzzVideo",
    description: "What Seedance 2.5 costs on BuzzVideo: credits per clip by length and resolution, which plans include it, and how it compares with Kling 4.0 and Wan 3.0.",
  },
  "kling-4-0-how-to-use": {
    title: "How to Use Kling 4.0: Step-by-Step Guide | BuzzVideo",
    description: "Step-by-step guide to Kling 4.0 on BuzzVideo: open the model, write a one-take prompt, set length, ratio and resolution, then draft before the full clip.",
  },
  "seedance-2-5-vs-kling-4-0": {
    title: "Seedance 2.5 vs Kling 4.0: Specs, Price & Picks | BuzzVideo",
    description: "Seedance 2.5 vs Kling 4.0 side by side: clip length, references, sound, plans and credit prices, real BuzzVideo results and which to pick for each ad.",
  },
  "seedance-2-5-vs-seedance-2-0": {
    title: "Seedance 2.5 vs Seedance 2.0: What Changed | BuzzVideo",
    description: "Seedance 2.5 vs Seedance 2.0 compared: 30 vs 15 second clips, references, 4K, plans and credit prices, real BuzzVideo results and when to upgrade.",
  },
  "seedance-2-5-vs-wan-3-0": {
    title: "Seedance 2.5 vs Wan 3.0: Specs & Price | BuzzVideo",
    description: "Seedance 2.5 vs Wan 3.0 side by side: 30-second clips, references, sound, plans and credit prices, real BuzzVideo results and which fits each ad.",
  },
  "nano-banana-pro-vs-nano-banana-2": {
    title: "Nano Banana Pro vs Nano Banana 2: Compared | BuzzVideo",
    description: "Nano Banana Pro vs Nano Banana 2 (and 2.1) compared: resolution, aspect ratios, references and credit price per image on BuzzVideo, and which to pick.",
  },
  "gpt-image-vs-nano-banana": {
    title: "GPT Image vs Nano Banana: Which for Ads? | BuzzVideo",
    description: "GPT Image 2.5 and GPT Image 2 vs Nano Banana 2.1, Pro and 2: references, ratios, quality and credit prices on BuzzVideo, real results and which fits each ad.",
  },
  "gpt-image-2-5-sunburst-vs-flare": {
    title: "GPT Image 2.5 Sunburst vs Flare: Compared | BuzzVideo",
    description: "GPT Image 2.5 Sunburst vs Flare on BuzzVideo: same specs and credit prices, different jobs. See the same prompts run on both and which tier to use for each ad.",
  },
  "lyria-3-5-vs-suno": {
    title: "Lyria 3.5 vs Suno: AI Music for Ads | BuzzVideo",
    description: "Lyria 3.5 vs Suno for ad soundtracks: what each makes, where you use it, free options and plans, from BuzzVideo's model notes and Suno's public pricing page.",
  },
  "gemini-3-8-flash-tts-vs-elevenlabs": {
    title: "Gemini 3.8 Flash TTS vs ElevenLabs | BuzzVideo",
    description: "Gemini 3.8 Flash TTS vs ElevenLabs v4, v4 Turbo and v3 for ad voiceovers: languages, timestamps, pronunciation and which voice model fits each job.",
  },
  models: {
    title: "All AI Models: Video, Image & Audio | BuzzVideo",
    description: "Browse every AI model on BuzzVideo: Seedance, Kling, Wan, GPT Image, Nano Banana, ElevenLabs and more, grouped by video, image and audio, with specs and prices.",
  },
};
