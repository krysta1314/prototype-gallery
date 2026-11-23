// 全部模型清单(2026-11-18 对账;2026-11-23 按《已接入模型清单》2026-11-19 版再核对上线状态和下架模型):每个模型一个落地页 /models/<slug>。导航(Header / Footer)和模型总页都从这里取。
// 来源:
//   - 现有:UAT 后台 uat-admin.buzzvideo.ai/models 里 Enabled 的模型(34 个里去掉 text 类、Disabled 和 Hidden);
//     desc 用后台模型的官方描述(list_models 的 description)。
//   - v1.13 上新:Notion「v1.13 上新模型清单与定价」;desc 按清单里的能力写，上线前和后台描述对齐。
//   - 不放：Veo 3.1 / Veo 3.1 Fast / Seedance 1.5 Pro(上游已下线)、Gemini Omni Flash 1.1(2026-12-03 自动转 1.2 后下架，换成 Gemini Omni 1.2 Flash)、Nano Banana(Gemini 2.5 Flash Image,Google 已弃用,2027-03-15 停用)、Gemini 文本模型。
//   - 2026-11-23 按 dev 后台 aigc-admin-dev …/models(Monica:模型都从这里取)补了 9 个:Qwen Image 3.0 / 3.0 Pro、Wan 2.7 Image / Pro、FLUX 3 Video、HeyGen Video、MiniMax H3 Max Turbo、HeyGen Voice、Voice Replication 2.0;名字也按后台对齐(slug 不改，免得断链)。
//     Disabled 的模型以后要做页面，就做成「<Model> alternatives」页。

export type ModelType = "video" | "image" | "audio";
export type ModelEntry = {
  name: string;
  slug: string;
  type: ModelType;
  vendor: string;
  /** live = 现在 UAT 已上线;v1.13 = 这个版本上新 */
  release: "live" | "v1.13";
  desc: string;
  /** 进 Header 菜单(每类挑最有搜索量 / 最主推的几个) */
  featured?: boolean;
  badge?: "New" | "Hot";
};

const M = (name: string, slug: string, type: ModelType, vendor: string, release: ModelEntry["release"], desc: string, extra: Partial<ModelEntry> = {}): ModelEntry => ({ name, slug, type, vendor, release, desc, ...extra });

export const MODELS: ModelEntry[] = [
  /* ── 视频 19 ── */
  M("Seedance 2.5", "seedance-2-5", "video", "ByteDance", "live", "Flagship quality for long, premium ads up to 30s", { featured: true, badge: "Hot" }),
  M("Kling 4.0", "kling-4-0", "video", "Kuaishou", "live", "Continuous videos up to 30s with sound", { featured: true }),
  M("Wan 3.0", "wan-3-0", "video", "Alibaba", "live", "Long 30s single takes with audio for demos", { featured: true }),
  M("MiniMax H3", "minimax-h3", "video", "MiniMax", "live", "Native audio and lip sync, consistent characters", { featured: true }),
  M("Seedance 2.0", "seedance-2-0", "video", "ByteDance", "live", "Cinematic hero ads with multi-reference control", { featured: true }),
  M("Seedance 2.5 Flash", "seedance-2-5-flash", "video", "ByteDance", "live", "Faster Seedance 2.5 for making ads in volume"),
  M("Seedance 2.0 Fast", "seedance-2-0-fast", "video", "ByteDance", "live", "About 20% cheaper than Seedance 2.0 for quick product and scenery clips"),
  M("Seedance 2.0 Mini", "seedance-2-0-mini", "video", "ByteDance", "live", "Affordable short clips for social and tests"),
  M("Kling 3.0", "kling-3-0", "video", "Kuaishou", "live", "Multi-shot story ads with dialogue"),
  M("MiniMax H3 Max", "minimax-h3-max", "video", "MiniMax", "live", "Fast drafts with first- and last-frame control"),
  M("Wan 3.0 Prime", "wan-3-0-prime", "video", "Alibaba", "live", "Up to 30s with image, video and audio references"),
  M("Kling 3.0 Omni", "kling-3-0-omni", "video", "Kuaishou", "live", "Reference-driven clips and video edits, up to 4K", { featured: true, badge: "New" }),
  M("Vidu Q3 Pro", "vidu-q3-pro", "video", "ShengShu", "live", "Text, image and reference to video up to 16s", { badge: "New" }),
  M("Gemini Omni 1.2 Flash", "gemini-omni-1-2-flash", "video", "Google", "v1.13", "Edit and extend clips up to 15s, with clear on-screen text", { featured: true, badge: "New" }),
  M("Grok Imagine Video 1.5", "grok-imagine-video-1-5", "video", "xAI", "live", "Text, image and keyframes to video up to 15s", { badge: "New" }),
  M("FLUX 3 Max Video", "flux-3-max-video", "video", "Black Forest Labs", "v1.13", "Keyframes to video, up to 20s", { badge: "New" }),
  M("FLUX 3 Video", "flux-3-video", "video", "Black Forest Labs", "v1.13", "Up to 20s at up to 4K, with keyframes, edit and extend", { badge: "New" }),
  M("HeyGen Video", "heygen-video", "video", "HeyGen", "v1.13", "Omni-reference clips up to 15s with native sound", { badge: "New" }),
  M("MiniMax H3 Max Turbo", "minimax-h3-max-turbo", "video", "MiniMax", "v1.13", "Fast 1–15s clips with references, frames and extend", { badge: "New" }),

  /* ── 图片 21 ── */
  M("Nano Banana 2.1", "nano-banana-2-1", "image", "Google", "live", "Fast all-rounder with sharp text, consistent characters", { featured: true, badge: "Hot" }),
  M("GPT Image 2.5 Sunburst", "gpt-image-2-5-sunburst", "image", "OpenAI", "live", "Fine print, labels and detailed portraits", { featured: true }),
  M("Nano Banana Pro", "nano-banana-pro", "image", "Google", "live", "Highest fidelity for hero and text-heavy layouts", { featured: true }),
  M("Seedream 5.5", "seedream-5-5", "image", "ByteDance", "live", "Up to 2K with transparent backgrounds", { featured: true }),
  M("Seedream 5.0 Pro", "seedream-5-0-pro", "image", "ByteDance", "live", "Premium detail and type for catalog visuals", { featured: true }),
  M("GPT Image 2.5 Flare", "gpt-image-2-5-flare", "image", "OpenAI", "live", "Fast photoreal product shots in bulk"),
  M("GPT Image 2", "gpt-image-2", "image", "OpenAI", "live", "Accurate in-image text for ad creatives"),
  M("Nano Banana 2", "nano-banana-2", "image", "Google", "live", "Pro-level text at Flash speed"),
  M("Nano Banana 2 Lite", "nano-banana-2-lite", "image", "Google", "live", "Fastest, cheapest for previews and bulk runs"),
  M("Seedream 5.0 lite", "seedream-5-0-lite", "image", "ByteDance", "live", "Budget pick for infographics and trend visuals"),
  M("Seedream 4.5", "seedream-4-5", "image", "ByteDance", "live", "Consistent product sets with accurate text"),
  M("Grok Imagine Image 2.0", "grok-imagine-2-0", "image", "xAI", "live", "Precise local edits and background removal"),
  M("GPT Image 2.6 Sunburst", "gpt-image-2-6-sunburst", "image", "OpenAI", "v1.13", "Finest detail for high-stakes visuals and multi-round edits", { featured: true, badge: "New" }),
  M("GPT Image 2.6 Flare", "gpt-image-2-6-flare", "image", "OpenAI", "v1.13", "Fast everyday images, complex layouts, transparency", { badge: "New" }),
  M("FLUX 3 Image", "flux-3-image", "image", "Black Forest Labs", "live", "Up to 4K with 10 reference images", { badge: "New" }),
  M("Muse Image", "muse-image", "image", "Meta", "live", "Low-cost generation and edits", { badge: "New" }),
  M("MAI-Image-2.5", "mai-image-2-5", "image", "Microsoft", "live", "Image generation guided by one reference image", { badge: "New" }),
  M("Qwen Image 3.0", "qwen-image-3-0", "image", "Alibaba", "v1.13", "Text-to-image and edits at 1K or 2K, 3 references", { badge: "New" }),
  M("Qwen Image 3.0 Pro", "qwen-image-3-0-pro", "image", "Alibaba", "v1.13", "Higher-quality Qwen Image 3.0 for hero visuals", { badge: "New" }),
  M("Wan 2.7 Image", "wan-2-7-image", "image", "Alibaba", "v1.13", "Up to 9 reference images, wide ratios to 21:9", { badge: "New" }),
  M("Wan 2.7 Image Pro", "wan-2-7-image-pro", "image", "Alibaba", "v1.13", "Up to 4K with 9 reference images", { badge: "New" }),

  /* ── 音频 17 ── */
  M("Seed Audio 1.0", "seed-audio-1-0", "audio", "ByteDance", "live", "Voiceover, music and SFX in one track, with cloning", { featured: true }),
  M("ElevenLabs v4", "elevenlabs-eleven-v4", "audio", "ElevenLabs", "v1.13", "Natural, expressive voiceover in many languages", { featured: true, badge: "New" }),
  M("ElevenLabs v4 Turbo", "elevenlabs-eleven-v4-turbo", "audio", "ElevenLabs", "v1.13", "Half-price v4 for volume voiceovers", { badge: "New" }),
  M("ElevenLabs v3", "elevenlabs-eleven-v3", "audio", "ElevenLabs", "v1.13", "Natural speech in 70+ languages, word timestamps", { badge: "New" }),
  M("MiniMax Speech 2.8 HD", "minimax-speech-2-8-hd", "audio", "MiniMax", "live", "Expressive voiceover in 40+ languages", { featured: true, badge: "New" }),
  M("MiniMax Speech 2.6 HD", "minimax-speech-2-6-hd", "audio", "MiniMax", "v1.13", "Voiceover with pause control and Cantonese", { badge: "New" }),
  M("Gemini 3.8 Flash TTS", "gemini-3-8-flash-tts", "audio", "Google", "v1.13", "Low-cost multilingual text to speech", { badge: "New" }),
  M("Kling TTS", "kling-tts", "audio", "Kuaishou", "v1.13", "Fast text to speech with 46 voices", { badge: "New" }),
  M("MiniMax Voice Clone", "minimax-voice-clone", "audio", "MiniMax", "v1.13", "Clone a voice from a short sample", { badge: "New" }),
  M("Kling Voice Clone", "kling-create-voice", "audio", "Kuaishou", "v1.13", "Custom voices for Kling videos", { badge: "New" }),
  M("ElevenLabs Music v2.5", "elevenlabs-music-v2-5", "audio", "ElevenLabs", "v1.13", "Songs and scores up to 10 minutes", { featured: true, badge: "New" }),
  M("Lyria 3.5", "lyria-3-5", "audio", "Google", "v1.13", "Full songs with vocals and lyrics", { featured: true, badge: "New" }),
  M("Mureka V9.5", "mureka-v9-5", "audio", "Kunlun Tech", "v1.13", "Songs from lyrics or a description", { badge: "New" }),
  M("MiniMax Music 3", "minimax-music-3", "audio", "MiniMax", "v1.13", "Background music priced by the second", { badge: "New" }),
  M("ElevenLabs Sound Effects v3", "elevenlabs-sound-effects-v3", "audio", "ElevenLabs", "v1.13", "Sound effects up to 30s, loopable", { featured: true, badge: "New" }),
  M("HeyGen Voice", "heygen-voice", "audio", "HeyGen", "v1.13", "24 voices in 39 languages, adjustable expressiveness", { badge: "New" }),
  M("Voice Replication 2.0", "voice-replication-2-0", "audio", "ByteDance", "v1.13", "Clone a voice from a reference recording", { badge: "New" }),
];

export const modelsOfType = (t: ModelType) => MODELS.filter((m) => m.type === t);
export const TYPE_TITLE: Record<ModelType, string> = { video: "Video models", image: "Image models", audio: "Audio models" };
