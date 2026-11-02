/* 报错文案统一过 friendlyError:界面只显示一句看得懂的话,原始报错收进可展开的 Details。纯函数。
   Agent 回复跟回复语言走:lang 为 zh 时报错句与「跳过了…」都出中文;按钮、弹窗标题等固定产品界面仍是英文。 */

import type { Lang } from "../store";

/** 带文件名的报错:单个素材失败时用,friendlyError 拿它拼 "{file} is too large to upload." */
export class FileError extends Error {
  constructor(
    readonly file: string,
    message: string,
  ) {
    super(message);
    this.name = "FileError";
  }
}

export type ErrorKind = "timeout" | "tooLarge" | "network" | "other";
export type Friendly = { kind: ErrorKind; text: string; details: string };

const rawText = (e: unknown) => (e instanceof Error ? e.message : String(e ?? ""));

export function errorKind(raw: string): ErrorKind {
  if (/\b413\b|too large|entity too large|payload too large|exceeds? the maximum|maximumSizeInBytes|file size/i.test(raw)) return "tooLarge";
  if (/timed? ?out|timeout|ETIMEDOUT|\b504\b|deadline|超时/i.test(raw)) return "timeout";
  if (/failed to fetch|networkerror|network error|network request failed|load failed|ECONNRESET|ECONNREFUSED|ENOTFOUND|offline/i.test(raw)) return "network";
  return "other";
}

const TEXT: Record<Lang, Record<ErrorKind, (file: string) => string> & { file: string }> = {
  en: {
    file: "The file",
    timeout: () => "The model took too long to respond.",
    tooLarge: (f) => `${f} is too large to upload.`,
    network: () => "Couldn't reach the server — check your connection.",
    other: () => "Something went wrong on our side.",
  },
  zh: {
    file: "该文件",
    timeout: () => "模型响应超时。",
    tooLarge: (f) => `${f}${/[\u4e00-\u9fff]$/.test(f) ? "" : " "}太大,无法上传。`, // 文件名与中文之间留空格,「该文件」不留
    network: () => "连不上服务器,请检查网络。",
    other: () => "我们这边出了点问题。",
  },
};

/** file 不传时从 FileError 里取;都没有就用 "The file" / 「该文件」。lang 默认 en */
export function friendlyError(e: unknown, file?: string, lang: Lang = "en"): Friendly {
  const details = rawText(e);
  const kind = errorKind(details);
  const t = TEXT[lang];
  const name = file ?? (e instanceof FileError ? e.file : undefined) ?? t.file;
  return { kind, text: t[kind](name), details };
}

/** 失败回复:「{前缀}: {报错句}」;中文冒号后不留空格 */
export const failText = (prefix: string, f: Friendly, lang: Lang = "en") => (lang === "zh" ? `${prefix}:${f.text}` : `${prefix}: ${f.text}`);

/** Agent 回复里跳过文件那一行:"Skipped {file}: {reason}" / 「跳过了 {file}:{原因}」 */
export const skippedLine = (s: { name: string; reason: string }, lang: Lang = "en") =>
  lang === "zh" ? `跳过了 ${s.name}:${s.reason}` : `Skipped ${s.name}: ${s.reason}`;

/** 取消(AbortController)抛出的错误 */
export const isAbort = (e: unknown) => (e instanceof DOMException || e instanceof Error) && e.name === "AbortError";
