import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DEFAULT_PARAMS } from "../../src/app/prototypes/(v1.12)/ai-tools/app/logic";
import { UpscaleError } from "../../src/app/prototypes/(v1.12)/ai-tools/app/api";
import { createFixtureApi, FIXTURE_SAMPLE } from "../../src/app/prototypes/(v1.12)/ai-tools/app/fixture";

const src = { ...FIXTURE_SAMPLE.source, width: 1536, height: 1024 }; // 尺寸固定,不随演示图变
const p4 = { ...DEFAULT_PARAMS, factor: 4 };

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("createFixtureApi", () => {
  it("resolves after delay with computed size", async () => {
    const api = createFixtureApi({ delayMs: 1000 });
    let done = false;
    const pr = api.upscale(src, p4).then((r) => { done = true; return r; });
    await vi.advanceTimersByTimeAsync(999);
    expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    const r = await pr;
    expect(r.width).toBe(6144);
    expect(r.height).toBe(4096);
    expect(r.format).toBe("png");
    expect(r.fileSize).toBeGreaterThan(0);
  });

  it("echoes explicit seed", async () => {
    const api = createFixtureApi({ delayMs: 10 });
    const pr = api.upscale(src, { ...p4, seed: 42 });
    await vi.advanceTimersByTimeAsync(10);
    expect((await pr).seed).toBe(42);
  });

  it("fail outcome rejects with UpscaleError kind fail", async () => {
    const api = createFixtureApi({ delayMs: 10, outcome: "fail" });
    const pr = api.upscale(src, p4);
    const assertion = expect(pr).rejects.toMatchObject({ kind: "fail" });
    await vi.advanceTimersByTimeAsync(10);
    await assertion;
    await expect(pr).rejects.toBeInstanceOf(UpscaleError);
  });

  it("unsafe outcome rejects with UpscaleError kind unsafe", async () => {
    const api = createFixtureApi({ delayMs: 10, outcome: "unsafe" });
    const pr = api.upscale(src, p4);
    const assertion = expect(pr).rejects.toMatchObject({ kind: "unsafe" });
    await vi.advanceTimersByTimeAsync(10);
    await assertion;
  });

  it("abort rejects with AbortError and never resolves", async () => {
    const api = createFixtureApi({ delayMs: 1000 });
    const ac = new AbortController();
    const pr = api.upscale(src, p4, { signal: ac.signal });
    const assertion = expect(pr).rejects.toMatchObject({ name: "AbortError" });
    await vi.advanceTimersByTimeAsync(500);
    ac.abort();
    await assertion;
    await vi.advanceTimersByTimeAsync(2000); // 不会再有结果
  });
});
