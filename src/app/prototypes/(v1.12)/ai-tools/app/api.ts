// 放大接口抽象:原型用 fixture 实现,将来换成真实 fal 调用(SeedVR)只需实现同一接口。
import type { OutputFormat, UpscaleParams } from "./logic";

export type UpscaleSource = { url: string; width: number; height: number; name: string };

export type UpscaleResult = {
  url: string;
  width: number;
  height: number;
  fileSize: number;
  format: OutputFormat;
  seed: number;
};

/** 演示用的三种结局:成功 / 失败 / 安全检查拦截。 */
export type UpscaleOutcome = "ok" | "fail" | "unsafe";

/** 放大失败时给用户看的一句(Agent 结果位和画布节点共用) */
export const UPSCALE_ERROR_TEXT: Record<"fail" | "unsafe", string> = {
  fail: "Upscale failed. Your credits have been refunded.",
  unsafe: "This image can't be processed.",
};

export class UpscaleError extends Error {
  kind: "fail" | "unsafe";
  constructor(kind: "fail" | "unsafe", message?: string) {
    super(message ?? (kind === "unsafe" ? "Blocked by safety checker" : "Upscale failed"));
    this.name = "UpscaleError";
    this.kind = kind;
  }
}

export interface UpscaleApi {
  upscale(
    src: UpscaleSource,
    p: UpscaleParams,
    opts?: { signal?: AbortSignal },
  ): Promise<UpscaleResult>;
}
