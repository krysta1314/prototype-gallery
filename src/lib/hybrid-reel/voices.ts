/* AI 配音的音色预设。Seed-Audio 用一句英文描述控制音色(实测描述不会被念出来),
   前端只传 id,描述留在服务端拼,避免把任意文本当指令发出去。 */

export const VOICES = [
  { id: "warm-female", label: "Warm female", desc: "A warm, friendly young female voice, natural and conversational" },
  { id: "energetic-female", label: "Energetic female", desc: "An energetic, excited young female voice with an upbeat, fast pace" },
  { id: "calm-male", label: "Calm male", desc: "A calm, trustworthy male voice with a steady pace" },
  { id: "deep-male", label: "Deep male", desc: "A deep, confident male narrator voice" },
] as const;

export type VoiceId = (typeof VOICES)[number]["id"];

export const voiceOf = (id?: string) => VOICES.find((v) => v.id === id) ?? VOICES[0];

/** 一次配音消耗的积分(原型定价) */
export const VOICE_COST = 5;
