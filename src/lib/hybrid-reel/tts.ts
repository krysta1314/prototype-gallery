/* BytePlus Seed Speech · Seed-Audio 1.0 音频生成(AI 配音)。和语音识别共用 BYTEPLUS_SPEECH_API_KEY。
   接口:POST https://voice.ap-southeast-1.bytepluses.com/api/v3/tts/create */

import crypto from "node:crypto";
import { voiceOf } from "./voices";

const TTS_URL = "https://voice.ap-southeast-1.bytepluses.com/api/v3/tts/create";

/** 返回 mp3 的 base64 和时长(秒) */
export async function synthesize(text: string, voice?: string): Promise<{ audio: string; duration: number }> {
  const key = process.env.BYTEPLUS_SPEECH_API_KEY;
  if (!key) throw new Error("BYTEPLUS_SPEECH_API_KEY 未设置 —— 在 .env.local 里加上 Seed Speech 控制台的 API Key");
  const script = text.trim().slice(0, 2800);
  if (!script) throw new Error("配音文案是空的");

  const res = await fetch(TTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Api-Key": key, "X-Api-Request-Id": crypto.randomUUID() },
    body: JSON.stringify({
      model: "seed-audio-1.0",
      /* 音色描述 + reads: + 正文;描述只用来定音色,不会被读出来 */
      text_prompt: `${voiceOf(voice).desc}, recording a voiceover for a short social video ad, reads: ${script}`,
      audio_config: { format: "mp3", sample_rate: 24000 },
    }),
  });
  const code = res.headers.get("x-api-status-code");
  const raw = await res.text();
  if (!res.ok || (code && code !== "20000000")) {
    throw new Error(`配音生成失败(${res.status}${code ? ` / ${code}` : ""}):${res.headers.get("x-api-message") ?? raw.slice(0, 200)}`);
  }
  const data = JSON.parse(raw) as { audio?: string; duration?: number };
  if (!data.audio) throw new Error("配音生成失败:没有返回音频");
  return { audio: data.audio, duration: data.duration ?? 0 };
}
