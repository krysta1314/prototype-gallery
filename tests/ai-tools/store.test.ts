import { describe, it, expect } from "vitest";
import { DEFAULT_PARAMS } from "../../src/app/prototypes/(v1.12)/ai-tools/app/logic";
import type { UpscaleResult, UpscaleSource } from "../../src/app/prototypes/(v1.12)/ai-tools/app/api";
import {
  initialState,
  jobCost,
  parseSaved,
  reduce,
  serialize,
  type UpscaleState,
} from "../../src/app/prototypes/(v1.12)/ai-tools/app/store";

const src: UpscaleSource = { url: "blob:src", width: 1536, height: 1024, name: "src.png" };
const p81 = { ...DEFAULT_PARAMS, factor: 8.1 };
const result: UpscaleResult = { url: "https://x/out.png", width: 12442, height: 8294, fileSize: 38_200_000, format: "png", seed: 1234 };

/** 放好源图和参数(8.1x → 11 积分) */
function ready(balance = 100): UpscaleState {
  let s = initialState({ balance });
  s = reduce(s, { type: "setSource", source: src });
  return reduce(s, { type: "setParams", params: p81 });
}

describe("upscale agent store", () => {
  it("remove deletes just that job from the history", () => {
    const one = reduce(ready(100), { type: "submit", id: "j1", now: 1000 });
    const two = reduce(one, { type: "hydrate", jobs: [...one.jobs, { ...one.jobs[0], id: "j2" }], balance: one.balance });
    const s = reduce(two, { type: "remove", id: "j1" });
    expect(s.jobs.map((j) => j.id)).toEqual(["j2"]);
    /* 删掉之后迟到的结果不会把记录加回来 */
    expect(reduce(s, { type: "succeed", id: "j1", result: { url: "x", width: 1, height: 1, fileSize: 1, format: "png", seed: 1 } }).jobs.map((j) => j.id)).toEqual(["j2"]);
  });

  it("jobCost uses the rounded output size (8.1x → 11 credits)", () => {
    expect(jobCost(src, p81)).toBe(11);
  });

  it("submit deducts cost and adds running job", () => {
    const s = reduce(ready(100), { type: "submit", id: "j1", now: 1000 });
    expect(s.balance).toBe(89);
    expect(s.jobs).toHaveLength(1);
    expect(s.jobs[0]).toMatchObject({ id: "j1", status: "running", cost: 11, startedAt: 1000, source: src, params: p81 });
  });

  it("submit clears the source and keeps params", () => {
    const s = reduce(ready(100), { type: "submit", id: "j1", now: 1 });
    expect(s.source).toBeNull();
    expect(s.params).toEqual(p81);
  });

  it("submit without a source or enough credits does nothing", () => {
    const noSrc = reduce(initialState({ balance: 100 }), { type: "submit", id: "j1", now: 1 });
    expect(noSrc.jobs).toHaveLength(0);
    expect(noSrc.balance).toBe(100);
    const poor = reduce(ready(5), { type: "submit", id: "j1", now: 1 });
    expect(poor.jobs).toHaveLength(0);
    expect(poor.balance).toBe(5);
  });

  it("succeed stores the result without touching balance", () => {
    let s = reduce(ready(100), { type: "submit", id: "j1", now: 1 });
    s = reduce(s, { type: "succeed", id: "j1", result });
    expect(s.jobs[0].status).toBe("done");
    expect(s.jobs[0].result).toEqual(result);
    expect(s.balance).toBe(89);
  });

  it.each(["fail", "unsafe"] as const)("fail refunds cost (%s)", (kind) => {
    let s = reduce(ready(100), { type: "submit", id: "j1", now: 1 });
    s = reduce(s, { type: "fail", id: "j1", kind });
    expect(s.balance).toBe(100);
    expect(s.jobs[0]).toMatchObject({ status: "failed", error: kind });
    // 同一个 job 不会被退两次
    expect(reduce(s, { type: "fail", id: "j1", kind }).balance).toBe(100);
  });

  it("retry charges again and resets job", () => {
    let s = reduce(ready(100), { type: "submit", id: "j1", now: 1 });
    s = reduce(s, { type: "fail", id: "j1", kind: "fail" });
    s = reduce(s, { type: "retry", id: "j1", now: 5000 });
    expect(s.balance).toBe(89);
    expect(s.jobs[0]).toMatchObject({ status: "running", startedAt: 5000 });
    expect(s.jobs[0].error).toBeUndefined();
  });

  it("retry is not allowed for unsafe jobs or without enough credits", () => {
    let s = reduce(ready(100), { type: "submit", id: "j1", now: 1 });
    s = reduce(s, { type: "fail", id: "j1", kind: "unsafe" });
    expect(reduce(s, { type: "retry", id: "j1", now: 2 })).toBe(s);
    let t = reduce(ready(11), { type: "submit", id: "j2", now: 1 });
    t = reduce(t, { type: "fail", id: "j2", kind: "fail" });
    t = { ...t, balance: 3 };
    expect(reduce(t, { type: "retry", id: "j2", now: 2 })).toBe(t);
  });

  it("resume does not charge twice", () => {
    const before = reduce(ready(100), { type: "submit", id: "j1", now: 1 });
    const saved = parseSaved(serialize(before));
    expect(saved).not.toBeNull();
    let s = reduce(initialState(), { type: "hydrate", jobs: saved!.jobs, balance: saved!.balance });
    expect(s.balance).toBe(89);
    expect(s.jobs[0].status).toBe("running");
    // 再 hydrate 一次也不变
    s = reduce(s, { type: "hydrate", jobs: saved!.jobs, balance: saved!.balance });
    expect(s.balance).toBe(89);
    s = reduce(s, { type: "succeed", id: "j1", result });
    expect(s.balance).toBe(89);
  });

  it("parseSaved rejects garbage", () => {
    expect(parseSaved(null)).toBeNull();
    expect(parseSaved("not json")).toBeNull();
    expect(parseSaved(JSON.stringify({ jobs: "x", balance: 1 }))).toBeNull();
  });

  it("hydrate restores jobs and balance without touching source or params", () => {
    const before = reduce(ready(100), { type: "submit", id: "j1", now: 1 });
    const saved = parseSaved(serialize(before))!;
    const s = reduce(initialState(), { type: "hydrate", jobs: saved.jobs, balance: saved.balance });
    expect(s.jobs).toHaveLength(1);
    expect(s.balance).toBe(89);
    expect(s.source).toBeNull();
  });

  it("upscaleAgain sets the result as source and resets the factor to 2x, keeping other params", () => {
    const next: UpscaleSource = { url: result.url, width: result.width, height: result.height, name: "upscaled.png" };
    const custom = { ...DEFAULT_PARAMS, mode: "target" as const, target: "2160p" as const, factor: 8.1, noiseScale: 0.3, seed: 7, format: "webp" as const };
    let s = reduce(initialState(), { type: "setParams", params: custom });
    s = reduce(s, { type: "upscaleAgain", source: next });
    expect(s.source).toEqual(next);
    expect(s.params).toEqual({ ...custom, mode: "factor", factor: 2 });
  });
});
