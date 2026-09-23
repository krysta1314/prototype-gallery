/* BytePlus ARK 调用层(仅服务端)。
   凭证与 buzz-video-frontend/service/.env 同一套,只从环境变量读,绝不进仓库。

   模型选择依据 —— 实测 ARK 模型表(GET /api/v3/models,58 个)后确定:
   · seed-2-0-lite-260428  input: text/image/video/audio,task: TextGeneration + VQA + SpeechToText
     一次 call 就能满足 PRD F1.3「内容概述 + 有无人声」,实测 usage 里确有 audio_tokens,声轨真的被读了。
     这推翻了工程设计 §3.1「只有 Gemini 系做得到」——那条结论基于 OpenRouter 清单,而 ARK 的 seed-2-0 系没在 OpenRouter 上架。
   · dreamina-seedance-2-5-260628  补拍用,output: video。 */

export const ARK_MODELS = {
  /** 素材理解 + 分镜编排。admin 可配,先写死默认档 */
  understand: "seed-2-0-lite-260428",
  /** AI 补拍 */
  generate: "dreamina-seedance-2-5-260628",
} as const;

type TextPart = { type: "text"; text: string };
type ImagePart = { type: "image_url"; image_url: { url: string } };
type VideoPart = { type: "video_url"; video_url: { url: string } };
export type ContentPart = TextPart | ImagePart | VideoPart;

export type ArkMessage = {
  role: "system" | "user" | "assistant";
  content: string | ContentPart[];
};

function arkConfig() {
  const apiKey = process.env.BYTEPLUS_ARK_API_KEY;
  const host = process.env.BYTEPLUS_ARK_HOST || "https://ark.ap-southeast.bytepluses.com";
  if (!apiKey) {
    throw new Error(
      "BYTEPLUS_ARK_API_KEY 未设置 —— 复制 buzz-video-frontend/service/.env 里的同名变量到 .env.local",
    );
  }
  return { apiKey, host };
}

const MAX_RETRIES = 2;
const RETRY_STATUS = new Set([429, 500, 502, 503, 504]);
/** 前端据这个前缀判断是「连不上」而不是模型报错 */
export const NETWORK_ERROR = "无法连接模型服务";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
function describe(error: unknown) {
  const cause = (error as { cause?: { code?: string; message?: string } })?.cause;
  return cause?.code ?? cause?.message ?? (error instanceof Error ? error.message : String(error));
}

export async function arkChat({
  model = ARK_MODELS.understand,
  messages,
  maxTokens = 1200,
  signal,
}: {
  model?: string;
  messages: ArkMessage[];
  maxTokens?: number;
  signal?: AbortSignal;
}): Promise<string> {
  const { apiKey, host } = arkConfig();
  const body = JSON.stringify({ model, messages, max_tokens: maxTokens });

  /* 网络中断(Node 报 "fetch failed")和 ARK 临时繁忙都重试两次;大视频走 base64,
     偶尔会在上传途中被断开,重试基本都能过 */
  let res: Response | undefined;
  for (let attempt = 0; ; attempt++) {
    try {
      res = await fetch(`${host}/api/v3/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body,
        signal,
      });
    } catch (error) {
      if (signal?.aborted || attempt >= MAX_RETRIES) {
        throw new Error(`${NETWORK_ERROR}(${describe(error)})`);
      }
      await sleep(900 * (attempt + 1));
      continue;
    }
    if (!res.ok && RETRY_STATUS.has(res.status) && attempt < MAX_RETRIES) {
      await sleep(900 * (attempt + 1));
      continue;
    }
    break;
  }

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`ARK ${res.status}: ${detail.slice(0, 400)}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string") throw new Error("ARK 返回里没有 message.content");
  return text;
}

/** 模型爱把 JSON 包在 ```json 里,或前后带一段解释。取第一个完整的 {...} 或 [...]。 */
export function extractJson<T>(raw: string): T {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = (fenced ? fenced[1] : raw).trim();

  const start = body.search(/[[{]/);
  if (start === -1) throw new Error(`模型没返回 JSON:${raw.slice(0, 200)}`);

  const open = body[start];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inStr = false;
  let esc = false;

  for (let i = start; i < body.length; i += 1) {
    const ch = body[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === open) depth += 1;
    else if (ch === close) {
      depth -= 1;
      if (depth === 0) return JSON.parse(body.slice(start, i + 1)) as T;
    }
  }
  throw new Error(`JSON 没闭合:${raw.slice(0, 200)}`);
}
