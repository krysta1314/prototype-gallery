/* BytePlus Seed Speech 语音识别(ASR 录音文件 · 快速模式):一次请求直接返回带时间轴的识别结果。
   和 ModelArk 是两个产品,密钥单独配在 BYTEPLUS_SPEECH_API_KEY。
   文档:https://docs.byteplus.com/en/docs/byteplusvoice/asraudiofile-flash */

import crypto from "node:crypto";

const FLASH_URL = "https://voice.ap-southeast-1.bytepluses.com/api/v3/auc/bigmodel/recognize/flash";
/** Seed ASR 2.0 快速模式 */
const RESOURCE_ID = "volc.seedasr.auc_turbo";

export type Utterance = { start: number; end: number; text: string };

/** 界面上的语言选项 → 接口的 language;auto 不传,模型自动识别中英及方言 */
const LANGUAGE: Record<string, string | undefined> = {
  auto: undefined,
  zh: "zh-CN",
  en: "en-US",
  ja: "ja-JP",
  ko: "ko-KR",
};

/** audio:16kHz 单声道 wav 的 base64。返回每句话的起止(秒)和文本 */
export async function transcribe(audio: string, lang = "auto"): Promise<{ text: string; utterances: Utterance[] }> {
  const key = process.env.BYTEPLUS_SPEECH_API_KEY;
  if (!key) throw new Error("BYTEPLUS_SPEECH_API_KEY 未设置 —— 在 .env.local 里加上 Seed Speech 控制台的 API Key");

  const res = await fetch(FLASH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": key,
      "X-Api-Resource-Id": RESOURCE_ID,
      "X-Api-Request-Id": crypto.randomUUID(),
      "X-Api-Sequence": "-1",
    },
    body: JSON.stringify({
      user: { uid: "hybrid-reel" },
      audio: { data: audio, format: "wav", ...(LANGUAGE[lang] ? { language: LANGUAGE[lang] } : {}) },
      request: { model_name: "bigmodel", enable_itn: true, enable_punc: true, enable_ddc: true, show_utterances: true },
    }),
  });

  const code = res.headers.get("x-api-status-code");
  const raw = await res.text();
  if (!res.ok || (code && code !== "20000000")) {
    /* 20000003 = 静音 / 没识别到人声,按「没有语音」处理,不算失败 */
    if (code === "20000003") return { text: "", utterances: [] };
    throw new Error(`语音识别失败(${res.status}${code ? ` / ${code}` : ""}):${res.headers.get("x-api-message") ?? raw.slice(0, 200)}`);
  }

  const data = JSON.parse(raw) as {
    result?: { text?: string; utterances?: { start_time: number; end_time: number; text: string }[] };
  };
  const utterances = (data.result?.utterances ?? [])
    .filter((u) => u.text?.trim())
    .map((u) => ({ start: u.start_time / 1000, end: u.end_time / 1000, text: u.text.trim() }));
  return { text: data.result?.text?.trim() ?? "", utterances };
}
