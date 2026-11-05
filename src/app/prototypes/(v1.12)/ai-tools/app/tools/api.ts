// 新工具页的模型调用抽象:原型用 fixture(定时器 + 可选失败),真实接入时实现同一接口。
// 结果都是前端按参数现算 / 现画的(fixture 媒体),这里只模拟「跑多久、成没成」。

export type ToolTask =
  | "outpaint"
  | "reframe"
  | "video-expand"
  | "video-fit"
  | "transcribe"
  | "burn-in"
  | "avatar-frame"
  | "avatar-video"
  | "face-match"
  | "avatar-train"
  | "voice-enhance"
  | "remux"
  | "erase"
  | "inpaint"
  | "try-on"
  | "angle"
  /* 模型加工类工具页(model-tools):视频类统一一个任务、Voice Clone 一个 */
  | "model-video"
  | "voice-clone"
  /* Upscale Video(SeedVR) */
  | "video-upscale";

export interface ToolsApi {
  run(task: ToolTask, opts?: { signal?: AbortSignal }): Promise<void>;
}

export class ToolRunError extends Error {
  constructor(task: ToolTask) {
    super(`${task} failed`);
    this.name = "ToolRunError";
  }
}

/** 演示用耗时(真实耗时待模型选型后实测) */
const DELAY: Record<ToolTask, number> = {
  outpaint: 3500,
  reframe: 5000,
  "video-expand": 6000,
  "video-fit": 2500,
  transcribe: 3500,
  "burn-in": 3000,
  "avatar-frame": 2500,
  "avatar-video": 6000,
  "face-match": 1800,
  /* 真实约几分钟;原型 8 秒 */
  "avatar-train": 8000,
  "voice-enhance": 3500,
  "remux": 2500,
  erase: 3000,
  inpaint: 4000,
  "try-on": 5000,
  angle: 4500,
  "model-video": 6000,
  "voice-clone": 3500,
  "video-upscale": 6000,
};

export function createToolsFixture(o: { outcome?: "ok" | "fail"; speed?: number } = {}): ToolsApi {
  const speed = o.speed ?? 1;
  return {
    run(task, opts) {
      return new Promise<void>((resolve, reject) => {
        const signal = opts?.signal;
        if (signal?.aborted) return reject(new DOMException("aborted", "AbortError"));
        const timer = setTimeout(() => {
          signal?.removeEventListener("abort", onAbort);
          if (o.outcome === "fail") reject(new ToolRunError(task));
          else resolve();
        }, DELAY[task] * speed);
        const onAbort = () => {
          clearTimeout(timer);
          reject(new DOMException("aborted", "AbortError"));
        };
        signal?.addEventListener("abort", onAbort, { once: true });
      });
    },
  };
}
