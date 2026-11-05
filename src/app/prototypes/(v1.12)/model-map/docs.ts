// 端点 → 官方 API 文档链接(思维导图里点 Endpoint / Model 直接打开)。
// fal 的文档页统一是 https://fal.ai/models/<endpoint>/api(2026-11-05 用 fal OpenAPI 的 documentationUrl 核对过)。

export type DocPart = { text: string; url?: string };

const FAL_PREFIX = "(?:fal-ai|alibaba|xai|minimax|kling|blackforestlabs|meta|microsoft|elevenlabs)";
/** fal 端点;允许结尾一个 {a, b, c} 分组(H3 Max 的 styles/{vhs, hand-drawn, …}) */
const FAL_RE = new RegExp(`${FAL_PREFIX}/[A-Za-z0-9_.\\-/]+(?:\\{[^}]*\\})?`, "g");

/** 非 fal 渠道:按端点里的特征字符串认 */
const OTHER: { match: RegExp; url: string }[] = [
  { match: /contents\/generations\/tasks/, url: "https://docs.byteplus.com/en/docs/modelark/create-video-generation-task-api" },
  { match: /v1beta\/interactions/, url: "https://aistudio.google.com/docs/omni" },
  { match: /kling-3\.0\/video/, url: "https://docs.kie.ai/market/kling/kling-3-0" },
  { match: /lyria-3\.5/, url: "https://ai.google.dev/gemini-api/docs/music-generation" },
];

export const falDocUrl = (endpoint: string) => {
  const id = endpoint.includes("{") ? endpoint.replace(/\{([^,}]+)[^}]*\}/, "$1").trim() : endpoint;
  return `https://fal.ai/models/${id.replace(/\/+$/, "")}/api`;
};

/** 把一段文字切成「普通文字 + 可点的端点」 */
export function docParts(v: string): DocPart[] {
  const parts: DocPart[] = [];
  let last = 0;
  for (const m of v.matchAll(FAL_RE)) {
    const i = m.index ?? 0;
    if (i > last) parts.push({ text: v.slice(last, i) });
    parts.push({ text: m[0], url: falDocUrl(m[0]) });
    last = i + m[0].length;
  }
  if (last < v.length) parts.push({ text: v.slice(last) });
  if (parts.some((p) => p.url)) return parts;
  const other = OTHER.find((o) => o.match.test(v));
  return other ? [{ text: v, url: other.url }] : [{ text: v }];
}
