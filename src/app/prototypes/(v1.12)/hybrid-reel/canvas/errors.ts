/* 剪辑器的报错文案:补拍 / 配音 / 识别失败时,界面只显示一句看得懂的英文,原始报错(接口原文、HTTP 码、中文报错)
   收进 details,Settings 红框里折叠在「Details」下。措辞与 Agent 一致(hybrid-reel-agent/app/logic/errors.ts),
   但不从那边 import —— 画布要能单独用。纯函数。 */

export type CanvasErrorKind = "timeout" | "tooLarge" | "network" | "busy" | "other";
export type CanvasError = { kind: CanvasErrorKind; text: string; details: string };

/** 补拍轮询等太久时自己抛的句子:本身就是给用户看的,原样显示,不再换成通用的超时文案 */
export const SHOT_TIMEOUT_TEXT = "This is taking much longer than usual, so we stopped waiting. Your credits are back — try again.";

const TEXT: Record<CanvasErrorKind, string> = {
  timeout: "The model took too long to respond.",
  tooLarge: "The file is too large to upload.",
  network: "Couldn't reach the server — check your connection.",
  busy: "The model is busy right now — try again in a moment.",
  other: "Something went wrong on our side.",
};

/** 已经是给用户看的句子(不需要再转)→ 它属于哪一类 */
const FRIENDLY = new Map<string, CanvasErrorKind>([
  [SHOT_TIMEOUT_TEXT, "timeout"],
  ...(Object.entries(TEXT) as [CanvasErrorKind, string][]).map(([k, t]) => [t, k] as [string, CanvasErrorKind]),
]);

export function canvasErrorKind(raw: string): CanvasErrorKind {
  if (/\b413\b|too large|entity too large|payload too large|exceeds? the maximum|file size|过大|太大/i.test(raw)) return "tooLarge";
  if (/timed? ?out|timeout|ETIMEDOUT|\b504\b|deadline|超时/i.test(raw)) return "timeout";
  if (/failed to fetch|networkerror|network error|network request failed|\bload failed|ECONNRESET|ECONNREFUSED|ENOTFOUND|offline/i.test(raw)) return "network";
  if (/\b429\b|\b503\b|busy|overload|rate.?limit|too many requests|quota|capacity|繁忙|限流|拥挤/i.test(raw)) return "busy";
  return "other";
}

/** 把一次失败转成界面文案 + 原文。已经是友好句子的原样返回(没有 details) */
export function canvasError(e: unknown): CanvasError {
  const raw = (e instanceof Error ? e.message : String(e ?? "")).trim();
  const known = FRIENDLY.get(raw);
  if (known) return { kind: known, text: raw, details: "" };
  const kind = canvasErrorKind(raw);
  return { kind, text: TEXT[kind], details: raw };
}
