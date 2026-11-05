// 图片 / 配音 / 音色克隆 / 音效音乐模型。
// 新模型参数来自 Notion「v1.12 上新模型清单与定价」(成本价，2026-11-04);老模型来自产品模型列表，细参数未收录的标 To confirm。
import type { MapModel } from "./types";

const TBC = { k: "Params", v: "To confirm — not in the v1.12 model sources" };

const legacyImage = (name: string, provider: string, i2iOnly = false, extra?: string): MapModel => ({
  name,
  provider,
  modes: [
    ...(i2iOnly ? [] : [{ name: "Text-to-Image", params: [{ k: "Required", v: "prompt" }, TBC] }]),
    { name: "Image-to-Image", params: [{ k: "Required", v: "prompt + reference image(s)" }, TBC] },
  ],
  limits: extra ? [{ k: "Notes", v: extra }] : [],
});

export const IMAGE_MODELS: MapModel[] = [
  {
    name: "Muse Image",
    provider: "fal · Meta",
    isNew: true,
    price: "$0.01 / image",
    modes: [
      { name: "Text-to-Image", params: [{ k: "Endpoint", v: "meta/muse-image/text-to-image" }, { k: "Required", v: "prompt (≤5000 chars)" }, { k: "Params", v: "aspect_ratio" }] },
      { name: "Edit (Image-to-Image)", params: [{ k: "Endpoint", v: "meta/muse-image/edit" }, { k: "Required", v: "prompt + reference images (≤10)" }, { k: "Params", v: "aspect_ratio" }] },
    ],
    limits: [
      { k: "Aspect ratio", v: "21:9 / 16:9 / 4:3 / 3:2 / 1:1 / 2:3 / 3:4 / 9:16 / 9:21" },
      { k: "Images", v: "Up to 10 reference images" },
      { k: "Prompt", v: "Max 5000 characters" },
    ],
  },
  {
    name: "MAI-Image-2.5",
    provider: "fal · Microsoft",
    isNew: true,
    price: "≈ $0.05 / image",
    note: "MAI-Image-2.6 不在 fal 上，先上 2.5",
    modes: [
      { name: "Text-to-Image", params: [{ k: "Endpoint", v: "microsoft/mai-image-2.5" }, { k: "Required", v: "prompt" }, { k: "Params", v: "aspect_ratio" }] },
      { name: "Image-to-Image", params: [{ k: "Endpoint", v: "microsoft/mai-image-2.5/edit" }, { k: "Required", v: "prompt + 1 reference image" }, { k: "Params", v: "aspect_ratio" }] },
    ],
    limits: [
      { k: "Aspect ratio", v: "auto / 1:1 / 4:3 / 3:4 / 16:9 / 9:16 / 3:2 / 2:3" },
      { k: "Images", v: "1 reference image" },
    ],
  },
  {
    name: "FLUX 3 Image",
    provider: "fal · Black Forest Labs",
    isNew: true,
    price: "$0.048 / image (1K)",
    modes: [
      { name: "Text-to-Image", params: [{ k: "Endpoint", v: "blackforestlabs/flux-3/text-to-image" }, { k: "Required", v: "prompt" }, { k: "Params", v: "resolution, aspect_ratio" }] },
      { name: "Edit Image", params: [{ k: "Endpoint", v: "blackforestlabs/flux-3/edit-image" }, { k: "Required", v: "prompt + reference images (≤10)" }, { k: "Params", v: "resolution, aspect_ratio" }] },
    ],
    limits: [
      { k: "Resolution", v: "768 square / 1K / 2K / 4K" },
      { k: "Aspect ratio", v: "auto / 21:9 / 2:1 / 16:9 / 3:2 / 7:5 / 4:3 / 5:4 / 1:1 / 4:5 / 3:4 / 5:7 / 2:3 / 9:16 / 1:2" },
      { k: "Images", v: "Up to 10 reference images" },
    ],
  },
  legacyImage("Seedream 5.0 Pro", "ByteDance"),
  legacyImage("GPT-image-2", "OpenAI"),
  legacyImage("Nano Banana 2 Lite", "Google", false, "14 aspect ratios; sub-2s latency"),
  legacyImage("Seedream 5.0 lite", "ByteDance"),
  legacyImage("Nano Banana 2", "Google"),
  legacyImage("Nano Banana Pro", "Google", true),
  legacyImage("Nano Banana", "Google"),
  legacyImage("Seedream 4.5", "ByteDance"),
];

export const TTS_MODELS: MapModel[] = [
  {
    name: "MiniMax Speech 2.8 HD",
    provider: "fal · MiniMax",
    isNew: true,
    price: "$0.10 / 1K chars",
    modes: [
      {
        name: "Text-to-Speech",
        params: [
          { k: "Endpoint", v: "fal-ai/minimax/speech-2.8-hd" },
          { k: "Required", v: "text + voice_id (17 presets)" },
          { k: "Voice", v: "speed 0.5–2 · volume 0.01–10 · pitch_rate −12–12 · emotion · english_normalization · language_boost" },
          { k: "Output", v: "format mp3 / pcm / flac · sample_rate · bitrate · audio_channel" },
        ],
      },
    ],
    limits: [{ k: "Voices", v: "17 preset voice_ids; cloned voices from MiniMax Voice Clone" }],
  },
  {
    name: "Kling TTS",
    provider: "fal · Kling",
    isNew: true,
    price: "$0.007 / call",
    modes: [
      {
        name: "Text-to-Speech",
        params: [
          { k: "Endpoint", v: "fal-ai/kling-video/v1/tts" },
          { k: "Required", v: "text (≤500 chars) + voice_id (46 presets)" },
          { k: "Params", v: "voice_speed 0.8–2" },
        ],
      },
    ],
    limits: [{ k: "Output", v: "MP3" }],
  },
  {
    name: "ElevenLabs Eleven v3",
    provider: "fal · ElevenLabs",
    isNew: true,
    price: "$0.10 / 1K chars",
    modes: [
      {
        name: "Text-to-Speech",
        params: [
          { k: "Endpoint", v: "fal-ai/elevenlabs/tts/eleven-v3" },
          { k: "Required", v: "text + voice" },
          { k: "Params", v: "stability · similarity_boost · speed · language_code · normalization · timestamps · output_format" },
        ],
      },
    ],
    limits: [],
  },
  {
    name: "ElevenLabs Eleven v4",
    provider: "fal · ElevenLabs",
    isNew: true,
    price: "$0.08 / 1K chars",
    modes: [
      {
        name: "Text-to-Speech",
        params: [
          { k: "Endpoint", v: "elevenlabs/tts/eleven-v4" },
          { k: "Required", v: "text (1–5000 chars) + voice" },
          { k: "Params", v: "No speed parameter; other fields To confirm" },
        ],
      },
    ],
    limits: [{ k: "Text", v: "1–5000 characters" }],
  },
  {
    name: "ElevenLabs Eleven v4 Turbo",
    provider: "fal · ElevenLabs",
    isNew: true,
    price: "$0.04 / 1K chars",
    modes: [
      {
        name: "Text-to-Speech",
        params: [
          { k: "Endpoint", v: "elevenlabs/tts/eleven-v4-turbo" },
          { k: "Required", v: "text + voice" },
          { k: "Params", v: "Same as Eleven v4 (faster, cheaper) — To confirm" },
        ],
      },
    ],
    limits: [],
  },
  {
    name: "Seed Audio",
    provider: "BytePlus",
    modes: [
      {
        name: "Text-to-Speech",
        params: [
          { k: "Endpoint", v: "BytePlus /api/v3/tts/create · model seed-audio-1.0" },
          { k: "Required", v: "text_prompt (≤3000 chars)" },
          { k: "Optional", v: "references[]: speaker voice ID / reference audio / reference image (mutually exclusive)" },
          { k: "Params", v: "audio_config: format · sample_rate (must be set) · speech_rate −50–100 · pitch_rate −12–12 · loudness_rate −50–100 · enable_subtitle" },
        ],
      },
    ],
    limits: [
      { k: "Languages", v: "20 languages in one model, with timestamps" },
      { k: "Output", v: "audio / url (valid 2h) · billed duration ≤120s · subtitle" },
    ],
  },
];

export const CLONE_MODELS: MapModel[] = [
  {
    name: "MiniMax Voice Clone",
    provider: "fal · MiniMax",
    isNew: true,
    price: "$1.5 / clone · preview $0.3 / 1K chars",
    modes: [
      {
        name: "Clone Voice",
        params: [
          { k: "Endpoint", v: "fal-ai/minimax/voice-clone" },
          { k: "Required", v: "voice sample audio" },
          { k: "Params", v: "noise_reduction · volume_normalization" },
          { k: "Returns", v: "custom voice_id for MiniMax Speech" },
        ],
      },
    ],
    limits: [],
  },
  {
    name: "Kling Create Voice",
    provider: "fal · Kling",
    isNew: true,
    price: "$0.007 / call",
    modes: [
      {
        name: "Clone Voice",
        params: [
          { k: "Endpoint", v: "fal-ai/kling-video/create-voice" },
          { k: "Required", v: "voice_url (5–30s clean, single speaker)" },
          { k: "Returns", v: "voice_id for Kling 4.0 / Kling TTS / Lip Sync" },
        ],
      },
    ],
    limits: [{ k: "Input", v: "5–30s audio or video, one speaker" }],
  },
];

export const SOUND_MODELS: MapModel[] = [
  {
    name: "ElevenLabs Sound Effects V3",
    provider: "fal · ElevenLabs",
    isNew: true,
    price: "$0.002 / second",
    modes: [
      {
        name: "Text-to-SFX",
        params: [
          { k: "Endpoint", v: "elevenlabs/sound-effects/v3" },
          { k: "Required", v: "text (≤450 chars)" },
          { k: "Params", v: "duration_seconds 0.5–30 · prompt_influence · loop" },
        ],
      },
    ],
    limits: [{ k: "Duration", v: "0.5–30s" }],
  },
  {
    name: "ElevenLabs Music v2.5",
    provider: "fal · ElevenLabs",
    isNew: true,
    price: "$0.6 / minute",
    modes: [
      {
        name: "Text-to-Music",
        params: [
          { k: "Endpoint", v: "elevenlabs/music/v2.5" },
          { k: "Required", v: "prompt (≤4100 chars) or composition_plan (1–30 chunks)" },
          { k: "Params", v: "music_length_ms 3s–10min · force_instrumental · seed" },
        ],
      },
    ],
    limits: [{ k: "Length", v: "3s – 10 min" }],
  },
  {
    name: "Lyria 3.5",
    provider: "Google · Gemini API",
    isNew: true,
    price: "$0.08 / song",
    modes: [
      {
        name: "Text-to-Music",
        params: [
          { k: "Model", v: "lyria-3.5 (Gemini API)" },
          { k: "Required", v: "prompt" },
          { k: "Output", v: "≈ 2-min song with vocals and lyrics" },
        ],
      },
    ],
    limits: [],
  },
];
