/* AI 配音的音色预设。Seed-Audio 用一句英文描述控制音色(实测描述不会被念出来),
   前端只传 id,描述留在服务端拼,避免把任意文本当指令发出去。 */

export const VOICES = [
  /* 2026-09-29 起和真实产品的 Audio Settings 对齐:音色库用有名字的音色(和 audio-generation 原型的 VOICES 同一套 id),
     每个音色配一句英文描述发给 Seed-Audio。下面最后 4 个是之前的描述型预设,旧工程里存的 id 还能用 */
  { id: "warm-f", label: "Aria", desc: "A warm, friendly young female voice, natural and conversational" },
  { id: "deep-m", label: "Miles", desc: "A deep, confident male narrator voice" },
  { id: "bright-f", label: "Nova", desc: "A bright, clear young female voice, crisp and upbeat" },
  { id: "narr-m", label: "Atlas", desc: "A polished male narrator voice with a steady, documentary tone" },
  { id: "energy-f", label: "Piper", desc: "An energetic, excited young female voice with an upbeat, fast pace" },
  { id: "calm-m", label: "Sage", desc: "A calm, trustworthy male voice with a steady pace" },
  { id: "cn-f", label: "Xiaoyu", desc: "A lively young female voice speaking Mandarin Chinese, natural and friendly" },
  { id: "cn-m", label: "Chen", desc: "A steady, reassuring male voice speaking Mandarin Chinese" },
  { id: "warm-female", label: "Warm female", desc: "A warm, friendly young female voice, natural and conversational" },
  { id: "energetic-female", label: "Energetic female", desc: "An energetic, excited young female voice with an upbeat, fast pace" },
  { id: "calm-male", label: "Calm male", desc: "A calm, trustworthy male voice with a steady pace" },
  { id: "deep-male", label: "Deep male", desc: "A deep, confident male narrator voice" },
] as const;

/** 旧的描述型预设 id → 音色库里对应的音色(界面上的音色选择器按新 id 显示) */
export const LEGACY_VOICE: Record<string, string> = { "warm-female": "warm-f", "energetic-female": "energy-f", "calm-male": "calm-m", "deep-male": "deep-m" };

export type VoiceId = (typeof VOICES)[number]["id"];

export const voiceOf = (id?: string) => VOICES.find((v) => v.id === id) ?? VOICES[0];

/** 一次配音消耗的积分(原型定价) */
export const VOICE_COST = 5;
