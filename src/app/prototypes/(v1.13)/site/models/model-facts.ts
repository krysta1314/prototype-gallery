// 60 个模型的参数(模型页的规格表 / 速查表 / FAQ 从这里带出)。2026-11-18 整理，纯数据。
// 来源:
//   - 已上线:BuzzVideo list_models(UAT,和后台 uat-admin.buzzvideo.ai/models 同一份配置)—— 比例、分辨率、时长、参考素材上限、能否关声音;
//   - admin-dev:dev 后台 aigc-admin-dev …/models 的模型详情(2026-11-23 补的 9 个);
//   - v1.13:Notion「v1.13 上新模型清单与定价」各模型的参数段(fal / Google 官方 API);上线前以后台配置为准再核一次。
// 价格不写在这里(读定价接口,见 pricing.ts)。

import type { ModelType } from "../../site-nav/models-catalog";

export type ModelFacts = {
  slug: string;
  type: ModelType;
  /** 视频：可选时长(秒) */
  durations?: [number, number];
  resolutions?: string[];
  ratios?: string[];
  refs?: { images?: number; videos?: number; audios?: number };
  /** 视频：声音能不能关(false = 总是带声音) */
  soundOff?: boolean;
  /** 音频：做什么用 */
  audioKind?: "voiceover" | "voice clone" | "music" | "sound effects" | "all-in-one";
  /** 额外的一两句事实(只写来源里有的) */
  notes?: string[];
  /** 参数来源 */
  source: "list_models" | "notion-v1.13" | "admin-dev";
};

const V = (slug: string, d: [number, number], res: string[], ratios: string[], refs: ModelFacts["refs"], soundOff: boolean, notes: string[] = [], source: ModelFacts["source"] = "list_models"): ModelFacts => ({ slug, type: "video", durations: d, resolutions: res, ratios, refs, soundOff, notes, source });
const I = (slug: string, res: string[], ratios: string[], images: number, notes: string[] = [], source: ModelFacts["source"] = "list_models"): ModelFacts => ({ slug, type: "image", resolutions: res, ratios, refs: { images }, notes, source });
const A = (slug: string, audioKind: ModelFacts["audioKind"], notes: string[], source: ModelFacts["source"] = "notion-v1.13", refs?: ModelFacts["refs"]): ModelFacts => ({ slug, type: "audio", audioKind, notes, source, refs });

export const FACTS: ModelFacts[] = [
  /* ── 视频(list_models)── */
  V("seedance-2-5", [4, 30], ["480p", "720p", "1080p"], ["1:1", "3:4", "4:3", "9:16", "16:9", "21:9"], { images: 30, videos: 10, audios: 10 }, true),
  V("seedance-2-5-flash", [4, 30], ["480p", "720p"], ["Adaptive", "21:9", "16:9", "4:3", "1:1", "3:4", "9:16"], { images: 10, videos: 5, audios: 5 }, true),
  V("seedance-2-0", [4, 15], ["480p", "720p", "1080p", "4K"], ["1:1", "3:4", "4:3", "9:16", "16:9", "21:9"], { images: 9, videos: 3, audios: 3 }, true),
  V("seedance-2-0-fast", [4, 15], ["480p", "720p"], ["1:1", "3:4", "4:3", "9:16", "16:9", "21:9"], { images: 9, videos: 3, audios: 3 }, true),
  V("seedance-2-0-mini", [4, 15], ["480p", "720p"], ["1:1", "3:4", "4:3", "9:16", "16:9", "21:9"], { images: 9, videos: 3, audios: 3 }, true),
  V("kling-4-0", [3, 30], ["720p", "1080p"], ["Auto", "16:9", "9:16", "1:1", "21:9"], { images: 10, videos: 5 }, false),
  V("kling-3-0", [3, 15], ["720p", "1080p", "4K"], ["16:9", "9:16", "1:1"], { images: 2 }, true),
  V("wan-3-0", [2, 30], ["480p", "720p", "1080p"], ["Auto", "9:16", "16:9", "1:1", "3:4", "4:3"], { images: 10, videos: 5, audios: 5 }, true, ["Reads web pages and documents you add as a URL / Doc reference."]),
  V("wan-3-0-prime", [2, 30], ["480p", "720p", "1080p"], ["Adaptive", "16:9", "4:3", "1:1", "3:4", "9:16"], { images: 10, videos: 5, audios: 5 }, true),
  V("minimax-h3", [5, 15], ["768P", "2K", "4K"], ["1:1", "3:4", "4:3", "9:16", "16:9", "21:9"], { images: 9, videos: 3, audios: 3 }, false),
  V("minimax-h3-max", [5, 15], ["480P", "768P", "1080P"], ["Auto", "1:1", "3:4", "4:3", "9:16", "16:9", "21:9"], { images: 9, videos: 3, audios: 3 }, false),
  V("gemini-omni-flash", [4, 10], ["720p"], ["9:16", "16:9"], { images: 5 }, false, ["Clip length is 4, 6, 8 or 10 seconds."]),
  V("seedance-1-5-pro", [4, 12], ["480p", "720p", "1080p"], ["1:1", "21:9", "4:3", "3:4", "16:9", "9:16"], { images: 2 }, true, [], "admin-dev"),
  /* ── 视频(v1.13,Notion)── */
  V("kling-3-0-omni", [3, 15], ["std", "pro", "4K"], ["16:9", "9:16", "1:1"], { images: 7 }, true, ["Text, image and reference to video, plus video-to-video edits."], "notion-v1.13"),
  V("vidu-q3-pro", [1, 16], ["360p", "540p", "720p", "1080p"], ["16:9", "9:16", "4:3", "3:4", "1:1"], { images: 2 }, true, ["Text, image and reference to video."], "notion-v1.13"),
  V("gemini-omni-1-2-flash", [3, 15], ["360p", "720p", "1080p", "4K"], ["9:16", "16:9"], { images: 6, videos: 3 }, false, ["1080p and 4K are upscaled.", "Edits and extends videos up to 15 seconds.", "Reference video clips can be up to 3 seconds each."], "notion-v1.13"),
  V("grok-imagine-video-1-5", [1, 15], ["480p", "720p", "1080p"], ["16:9", "9:16", "4:3", "3:4", "1:1", "3:2", "2:3", "21:9", "5:2"], { images: 7 }, true, ["Text, image and reference to video.", "Start frame, optional end frame and up to 4 timed keyframes."], "notion-v1.13"),
  V("flux-3-max-video", [5, 20], ["720p", "1080p"], ["Auto", "21:9", "2:1", "16:9", "4:3", "1:1", "3:4", "9:16"], {}, true, ["Text to video, image to video (first frame, optional last frame) and keyframes to video."], "notion-v1.13"),

  /* ── 视频(v1.13,dev 后台 2026-11-23)── */
  V("flux-3-video", [5, 20], ["720p", "1080p", "1440p", "2160p"], ["Auto", "21:9", "2:1", "16:9", "4:3", "1:1", "3:4", "9:16"], { images: 10 }, true, ["Text to video, first and last frame, up to 10 keyframes, plus edit and extend video."], "admin-dev"),
  V("heygen-video", [5, 15], ["480p", "768p", "1080p", "2K"], ["Adaptive", "21:9", "16:9", "4:3", "1:1", "3:4", "9:16"], { images: 9, videos: 3, audios: 3 }, false, ["Omni reference and first-and-last-frame modes.", "Turbo, Quality and Ultra Quality settings."], "admin-dev"),
  V("minimax-h3-max-turbo", [1, 15], ["480P", "768P", "1080P", "2K"], ["Adaptive", "21:9", "16:9", "4:3", "1:1", "3:4", "9:16"], { images: 9, videos: 3, audios: 3 }, true, ["Omni reference, first and last frame, and extend video.", "Optional background music track."], "admin-dev"),

  /* ── 图片(list_models)── */
  I("seedream-5-5", ["1K", "1.5K", "2K"], ["1:1", "4:3", "3:4", "16:9", "9:16", "3:2", "2:3", "21:9", "4:5"], 10, ["Transparent backgrounds."]),
  I("seedream-5-0-pro", ["1K", "2K"], ["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "21:9"], 10),
  I("seedream-5-0-lite", ["2K", "3K", "4K"], ["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "21:9"], 14),
  I("seedream-4-5", ["2K", "4K"], ["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "21:9"], 14),
  I("nano-banana-2-1", ["1K", "2K", "4K"], ["1:1", "4:5", "5:4", "9:16", "16:9", "1:4", "1:8", "2:3", "3:2", "3:4", "4:1", "4:3", "8:1", "21:9"], 14),
  I("nano-banana-pro", ["1K", "2K", "4K"], ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"], 14),
  I("nano-banana-2", ["1K", "2K", "4K"], ["1:1", "1:4", "1:8", "2:3", "3:2", "3:4", "4:1", "4:3", "4:5", "5:4", "8:1", "9:16", "16:9", "21:9"], 14),
  I("nano-banana-2-lite", [], ["1:1", "1:4", "1:8", "2:3", "3:2", "3:4", "4:1", "4:3", "4:5", "5:4", "8:1", "9:16", "16:9", "21:9"], 14),
  I("nano-banana", [], ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"], 3),
  I("gpt-image-2-5-sunburst", ["Low", "Medium", "High", "X-High", "Max"], ["1:1", "3:4", "4:3", "4:5", "9:16", "16:9"], 16, ["Transparent backgrounds."]), /* 2026-11-26 接口有 background=transparent */
  I("gpt-image-2-5-flare", ["Low", "Medium", "High", "X-High", "Max"], ["1:1", "3:4", "4:3", "4:5", "9:16", "16:9"], 16, ["Transparent backgrounds."]),
  I("gpt-image-2", ["Low", "Medium", "High"], ["1:1", "3:4", "4:3", "4:5", "9:16", "16:9"], 10),
  I("grok-imagine-2-0", ["1K", "2K"], ["Auto", "1:1", "3:4", "4:3", "9:16", "16:9", "2:1", "20:9", "19.5:9", "3:2", "2:3", "9:19.5", "9:20", "1:2"], 10),
  /* ── 图片(v1.13)── */
  I("gpt-image-2-6-sunburst", ["Low", "Medium", "High", "X-High", "Max"], ["Auto", "1:1", "4:3", "3:4", "16:9", "9:16"], 16, ["Transparent backgrounds and SVG output.", "Edit with a mask or markup on the image."], "notion-v1.13"),
  I("gpt-image-2-6-flare", ["Low", "Medium", "High", "X-High", "Max"], ["Auto", "1:1", "4:3", "3:4", "16:9", "9:16"], 16, ["Transparent backgrounds and SVG output.", "The faster of the two GPT Image 2.6 tiers."], "notion-v1.13"),
  I("flux-3-image", ["768", "1K", "2K", "4K"], ["Auto", "21:9", "2:1", "16:9", "3:2", "7:5", "4:3", "5:4", "1:1", "4:5", "3:4", "5:7", "2:3", "9:16", "1:2"], 10, [], "notion-v1.13"),
  I("muse-image", [], ["21:9", "16:9", "4:3", "3:2", "1:1", "2:3", "3:4", "9:16", "9:21"], 10, ["Generate and edit at the same price."], "notion-v1.13"),
  I("mai-image-2-5", [], ["Auto", "1:1", "4:3", "3:4", "16:9", "9:16", "3:2", "2:3"], 1, [], "notion-v1.13"),

  /* ── 图片(v1.13,dev 后台 2026-11-23)── */
  I("qwen-image-3-0", ["1K", "2K"], ["Auto", "1:1", "4:3", "3:4", "16:9", "9:16", "3:2", "2:3", "21:9"], 3, ["Prompts up to 4,500 characters."], "admin-dev"),
  I("qwen-image-3-0-pro", ["1K", "2K"], ["Auto", "1:1", "4:3", "3:4", "16:9", "9:16", "3:2", "2:3", "21:9"], 3, [], "admin-dev"),
  I("wan-2-7-image", ["1K", "2K"], ["Auto", "1:1", "4:3", "3:4", "16:9", "9:16", "3:2", "2:3", "21:9"], 9, ["Prompts up to 5,000 characters."], "admin-dev"),
  I("wan-2-7-image-pro", ["1K", "2K", "4K"], ["Auto", "1:1", "4:3", "3:4", "16:9", "9:16", "3:2", "2:3", "21:9"], 9, [], "admin-dev"),

  /* ── 音频 ── */
  A("seed-audio-1-0", "all-in-one", ["Voiceover, music and sound effects in one track, with voice cloning.", "Multi-speaker scenes in 21 languages; MP3 or WAV."], "list_models", { images: 1, audios: 3 }),
  A("elevenlabs-eleven-v4", "voiceover", ["Up to 5,000 characters per generation.", "Character-level timestamps for captions."]),
  A("elevenlabs-eleven-v4-turbo", "voiceover", ["Supports audio tags and IPA pronunciation."]),
  A("elevenlabs-eleven-v3", "voiceover", ["70+ languages.", "Word-level timestamps for captions."]),
  A("minimax-speech-2-8-hd", "voiceover", ["17 preset voices, 40+ language boosts.", "Emotion, speed, pitch and volume controls."]),
  A("minimax-speech-2-6-hd", "voiceover", ["Pause markers and a custom pronunciation dictionary.", "Includes Cantonese."]),
  A("gemini-3-8-flash-tts", "voiceover", ["Multilingual text to speech from Google."]),
  A("kling-tts", "voiceover", ["Up to 500 characters, 46 preset voices.", "MP3 output."]),
  A("minimax-voice-clone", "voice clone", ["Clone a voice, then preview it before using it."]),
  A("kling-create-voice", "voice clone", ["Create a voice from 5–30 seconds of clean speech for use in Kling videos."]),
  A("elevenlabs-music-v2-5", "music", ["From 3 seconds to 10 minutes.", "Instrumental or with lyrics, section by section."]),
  A("lyria-3-5", "music", ["Full songs with vocals and lyrics, about 2 minutes each."]),
  A("mureka-v9-5", "music", ["Songs from your lyrics or from a description."]),
  A("minimax-music-3", "music", ["Background music priced by the second."]),
  A("elevenlabs-sound-effects-v3", "sound effects", ["0.5 to 30 seconds, optional seamless loop."]),
  A("heygen-voice", "voiceover", ["24 preset voices in 39 languages.", "Adjustable expressiveness."], "admin-dev", { audios: 1 }),
  A("voice-replication-2-0", "voice clone", ["Clone a voice from a reference recording, in Chinese, English, Japanese, Spanish, Indonesian, Portuguese and more."], "admin-dev"),
];

export const factsOf = (slug: string) => FACTS.find((f) => f.slug === slug);
