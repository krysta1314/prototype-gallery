// UpscaleApi 的 fixture 实现:定时器模拟耗时,按参数算出输出尺寸,结果图用固定样本。
import { outputSize } from "./logic";
import {
  UpscaleError,
  type UpscaleApi,
  type UpscaleOutcome,
  type UpscaleResult,
  type UpscaleSource,
} from "./api";

// 演示图(Monica 2026-11-04 指定):放大后 = 原图 1376×768;放大前 = 同一张缩到 1/4(344×192、JPEG 低质量)。
// 放大结果的宽高按参数现算,fileSize 按下面的字节/像素比例换算(估算,非 fal 实测)
export const FIXTURE_SAMPLE: { source: UpscaleSource; result: UpscaleResult } = {
  source: {
    url: "/prototypes/ai-tools/demo-before.jpg",
    width: 344,
    height: 192,
    name: "portrait.jpg",
  },
  result: {
    url: "/prototypes/ai-tools/demo-after.png",
    width: 12442,
    height: 8294,
    fileSize: 38_200_000,
    format: "png",
    seed: 0,
  },
};

function abortError(): Error {
  return new DOMException("Upscale aborted", "AbortError");
}

export function createFixtureApi(o: { delayMs?: number; outcome?: UpscaleOutcome } = {}): UpscaleApi {
  const delayMs = o.delayMs ?? 8000; // 演示用;真实约 101s
  const outcome = o.outcome ?? "ok";
  return {
    upscale(src, p, opts) {
      return new Promise<UpscaleResult>((resolve, reject) => {
        const signal = opts?.signal;
        if (signal?.aborted) return reject(abortError());
        const onAbort = () => {
          clearTimeout(timer);
          reject(abortError());
        };
        const timer = setTimeout(() => {
          signal?.removeEventListener("abort", onAbort);
          if (outcome !== "ok") return reject(new UpscaleError(outcome));
          const { w, h } = outputSize(src.width, src.height, p);
          const s = FIXTURE_SAMPLE.result;
          const bytesPerPx = s.fileSize / (s.width * s.height);
          resolve({
            url: s.url,
            width: w,
            height: h,
            fileSize: Math.round(w * h * bytesPerPx),
            format: p.format,
            seed: p.seed ?? s.seed,
          });
        }, delayMs);
        signal?.addEventListener("abort", onAbort, { once: true });
      });
    },
  };
}
