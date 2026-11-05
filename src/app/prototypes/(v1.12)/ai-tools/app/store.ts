// Upscale Image 工具页的纯 reducer:源图与参数、余额、放大任务(jobs)。
// 扣费只在 submit / retry;失败(fail / unsafe)全额退;hydrate 只是把 sessionStorage 里的状态搬回来,不扣费。
import { DEFAULT_CREDITS } from "@/app/prototypes/(v1.12)/hybrid-reel/canvas/credits";
import { DEFAULT_PARAMS, outputSize, upscaleCredits, type UpscaleParams } from "./logic";
import type { UpscaleResult, UpscaleSource } from "./api";

/** 离开再回来续跑:jobs + 余额存这里(sessionStorage) */
export const JOBS_KEY = "upscale-image:jobs";

export type Job = {
  id: string;
  source: UpscaleSource;
  params: UpscaleParams;
  cost: number;
  status: "running" | "done" | "failed";
  startedAt: number;
  result?: UpscaleResult;
  error?: "fail" | "unsafe";
};

export type UpscaleState = {
  source: UpscaleSource | null;
  params: UpscaleParams;
  balance: number;
  jobs: Job[];
};

export type Action =
  /** 结果卡的 Upscale again:结果当新源图,倍数回到 2x(By factor),其余参数沿用 */
  | { type: "upscaleAgain"; source: UpscaleSource }
  | { type: "setSource"; source: UpscaleSource | null }
  | { type: "setParams"; params: UpscaleParams }
  | { type: "submit"; id: string; now: number }
  | { type: "succeed"; id: string; result: UpscaleResult }
  | { type: "fail"; id: string; kind: "fail" | "unsafe" }
  | { type: "retry"; id: string; now: number }
  /** 结果卡右上角删除这条记录(生成中的也能删，迟到的结果直接丢掉) */
  | { type: "remove"; id: string }
  | { type: "hydrate"; jobs: Job[]; balance: number }
  /** 外壳钱包的余额(其他工具页扣 / 退过)同步进来 */
  | { type: "syncBalance"; balance: number };

export function initialState(init: Partial<UpscaleState> = {}): UpscaleState {
  return { source: null, params: DEFAULT_PARAMS, balance: DEFAULT_CREDITS, jobs: [], ...init };
}

/** 这张图按这组参数放大要多少积分(源图宽高必须是已知正数) */
export function jobCost(source: UpscaleSource, params: UpscaleParams): number {
  const out = outputSize(source.width, source.height, params);
  return upscaleCredits(out.w, out.h);
}

/** Upscale again 时倍数回到的默认档 */
export const AGAIN_FACTOR = 2;

const mapJob = (s: UpscaleState, id: string, f: (j: Job) => Job): Job[] => s.jobs.map((j) => (j.id === id ? f(j) : j));

export function reduce(s: UpscaleState, a: Action): UpscaleState {
  switch (a.type) {
    case "upscaleAgain":
      return { ...s, source: a.source, params: { ...s.params, mode: "factor", factor: AGAIN_FACTOR } };
    case "setSource":
      return { ...s, source: a.source };
    case "setParams":
      return { ...s, params: a.params };
    case "submit": {
      const src = s.source;
      if (!src || !(src.width > 0) || !(src.height > 0)) return s;
      if (s.jobs.some((j) => j.id === a.id)) return s;
      const cost = jobCost(src, s.params);
      if (s.balance < cost) return s;
      const job: Job = { id: a.id, source: src, params: s.params, cost, status: "running", startedAt: a.now };
      // 提交后清掉源图(左栏回到上传位,可换图再放大);参数保留
      return { ...s, source: null, balance: s.balance - cost, jobs: [...s.jobs, job] };
    }
    case "succeed": {
      const job = s.jobs.find((j) => j.id === a.id);
      if (!job || job.status !== "running") return s;
      return { ...s, jobs: mapJob(s, a.id, (j) => ({ ...j, status: "done", result: a.result, error: undefined })) };
    }
    case "fail": {
      const job = s.jobs.find((j) => j.id === a.id);
      if (!job || job.status !== "running") return s;
      return {
        ...s,
        balance: s.balance + job.cost,
        jobs: mapJob(s, a.id, (j) => ({ ...j, status: "failed", error: a.kind, result: undefined })),
      };
    }
    case "remove":
      return { ...s, jobs: s.jobs.filter((j) => j.id !== a.id) };
    case "retry": {
      const job = s.jobs.find((j) => j.id === a.id);
      // 只有普通失败能重试;安全检查拦下的不给 Retry
      if (!job || job.status !== "failed" || job.error !== "fail") return s;
      if (s.balance < job.cost) return s;
      return {
        ...s,
        balance: s.balance - job.cost,
        jobs: mapJob(s, a.id, (j) => ({ ...j, status: "running", startedAt: a.now, error: undefined, result: undefined })),
      };
    }
    case "hydrate":
      return { ...s, jobs: a.jobs, balance: a.balance };
    case "syncBalance":
      return a.balance === s.balance ? s : { ...s, balance: a.balance };
  }
}

export function serialize(s: UpscaleState): string {
  return JSON.stringify({ jobs: s.jobs, balance: s.balance });
}

/** 读回 serialize 的内容;格式不对返回 null */
export function parseSaved(raw: string | null): { jobs: Job[]; balance: number } | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as unknown;
    if (!v || typeof v !== "object") return null;
    const { jobs, balance } = v as { jobs?: unknown; balance?: unknown };
    if (!Array.isArray(jobs) || typeof balance !== "number" || !Number.isFinite(balance)) return null;
    return { jobs: jobs as Job[], balance };
  } catch {
    return null;
  }
}
