import { describe, expect, it } from "vitest";
import {
  addUpscaleNode,
  aiRefs,
  arrange,
  failUpscale,
  finishUpscale,
  keepRuntime,
  removeAsset,
  resetInterrupted,
  retryUpscale,
  canRetryUpscale,
  type Asset,
  type Project,
} from "@/app/prototypes/(v1.12)/hybrid-reel/canvas/project";
import { DEFAULT_PARAMS, type UpscaleParams } from "@/app/prototypes/(v1.12)/ai-tools/app/logic";
import { UPSCALE_ERROR_TEXT, type UpscaleResult } from "@/app/prototypes/(v1.12)/ai-tools/app/api";

const img = (id: string, over: Partial<Asset> = {}): Asset => ({
  id,
  kind: "image",
  origin: "upload",
  label: `${id}.png`,
  url: `blob:${id}`,
  durationSec: 10,
  aspect: 1.5,
  status: "ready",
  x: 0,
  y: 0,
  ...over,
});

const video = (id: string, over: Partial<Asset> = {}): Asset => ({
  id,
  kind: "video",
  origin: "upload",
  label: `${id}.mp4`,
  url: `blob:${id}`,
  durationSec: 8,
  aspect: 9 / 16,
  status: "ready",
  x: 0,
  y: 0,
  ...over,
});

const shot = (over: Partial<Asset> = {}): Asset => ({
  id: "ai-1",
  kind: "video",
  origin: "ai",
  label: "Video Generator",
  durationSec: 5,
  aspect: 9 / 16,
  prompt: "A close-up of the bottle",
  status: "idle",
  cost: 50,
  x: 0,
  y: 0,
  ...over,
});

const project = (assets: Asset[], over: Partial<Project> = {}): Project => ({
  v: 1,
  assets,
  clips: [],
  subtitleStyle: "classic",
  musicId: null,
  musicVol: 60,
  voiceVol: 100,
  originalOn: true,
  aspect: "9:16",
  autoLayout: false,
  editor: { x: 0, y: 0 },
  bgmPrompt: "",
  creditsPerShot: 50,
  spentCredits: 100,
  ...over,
});

const factor = (f: number): UpscaleParams => ({ ...DEFAULT_PARAMS, mode: "factor", factor: f });
const result: UpscaleResult = { url: "https://x/out.png", width: 12442, height: 8294, fileSize: 38_200_000, format: "png", seed: 7 };
const node = (p: Project, id: string) => p.assets.find((a) => a.id === id)!;

describe("upscale nodes on the canvas", () => {
  it("addUpscaleNode charges and links to source", () => {
    const p = addUpscaleNode(project([img("src")]), "src", factor(8.1), 11, "up-1");
    const n = node(p, "up-1");
    expect(n).toMatchObject({ origin: "ai", kind: "image", status: "generating", label: "Upscaled · 8.1x", aspect: 1.5, charged: 11 });
    expect(n.upscale).toMatchObject({ sourceId: "src", cost: 11, params: factor(8.1) });
    expect(aiRefs(p, n).map((a) => a.id)).toEqual(["src"]);
    expect(p.spentCredits).toBe(111);
  });

  it("labels By resolution with the target tier", () => {
    const p = addUpscaleNode(project([img("src")]), "src", { ...DEFAULT_PARAMS, mode: "target", target: "2160p" }, 2, "up-1");
    expect(node(p, "up-1").label).toBe("Upscaled · 2160p");
  });

  it("ignores a missing source and a duplicate id", () => {
    const p0 = project([img("src")]);
    expect(addUpscaleNode(p0, "nope", factor(2), 1, "up-1")).toBe(p0);
    const p1 = addUpscaleNode(p0, "src", factor(2), 1, "up-1");
    expect(addUpscaleNode(p1, "src", factor(2), 1, "up-1")).toBe(p1);
  });

  it("chained upscale refs", () => {
    let p = addUpscaleNode(project([img("src")]), "src", factor(2), 1, "up-1");
    p = finishUpscale(p, "up-1", result);
    p = addUpscaleNode(p, "up-1", factor(2), 4, "up-2");
    expect(aiRefs(p, node(p, "up-2")).map((a) => a.id)).toEqual(["up-1"]);
    expect(aiRefs(p, node(p, "up-1")).map((a) => a.id)).toEqual(["src"]);
  });

  it("finishUpscale makes the node ready with the result size", () => {
    let p = addUpscaleNode(project([img("src")]), "src", factor(8.1), 11, "up-1");
    p = finishUpscale(p, "up-1", result);
    const n = node(p, "up-1");
    expect(n).toMatchObject({ status: "ready", url: result.url, charged: undefined, error: undefined });
    expect(n.upscale).toMatchObject({ width: 12442, height: 8294, fileSize: 38_200_000, seed: 7, cost: 11 });
    expect(p.spentCredits).toBe(111);
    /* 已经不在生成中:不再改 */
    expect(finishUpscale(p, "up-1", { ...result, url: "other" })).toBe(p);
  });

  it("failUpscale refunds", () => {
    const p0 = project([img("src")]);
    const p1 = addUpscaleNode(p0, "src", factor(8.1), 11, "up-1");
    const failed = failUpscale(p1, "up-1", "fail");
    expect(failed.spentCredits).toBe(100);
    expect(node(failed, "up-1")).toMatchObject({ status: "idle", error: UPSCALE_ERROR_TEXT.fail, charged: undefined });
    const unsafe = failUpscale(p1, "up-1", "unsafe");
    expect(unsafe.spentCredits).toBe(100);
    expect(node(unsafe, "up-1").error).toBe(UPSCALE_ERROR_TEXT.unsafe);
    /* 不会退两次 */
    expect(failUpscale(failed, "up-1", "fail")).toBe(failed);
  });

  it("uses the same failure copy as the Agent", () => {
    expect(UPSCALE_ERROR_TEXT).toEqual({
      fail: "Upscale failed. Your credits have been refunded.",
      unsafe: "This image can't be processed.",
    });
  });

  it("removing a generating upscale node refunds", () => {
    const p1 = addUpscaleNode(project([img("src")]), "src", factor(8.1), 11, "up-1");
    expect(removeAsset(p1, "up-1").spentCredits).toBe(100);
    const done = finishUpscale(p1, "up-1", result);
    expect(removeAsset(done, "up-1").spentCredits).toBe(111);
  });

  it("undoing past the upscale while it runs refunds it", () => {
    const before = project([img("src")]);
    const running = addUpscaleNode(before, "src", factor(8.1), 11, "up-1");
    const undone = keepRuntime(before, running);
    expect(undone.assets.map((a) => a.id)).toEqual(["src"]);
    expect(undone.spentCredits).toBe(100);
    /* 已经完成的:撤销只是拿掉节点,积分照扣 */
    expect(keepRuntime(before, finishUpscale(running, "up-1", result)).spentCredits).toBe(111);
  });

  it("a hard refresh mid-upscale refunds and shows it failed", () => {
    const p = resetInterrupted(addUpscaleNode(project([img("src")]), "src", factor(8.1), 11, "up-1"));
    expect(p.spentCredits).toBe(100);
    expect(node(p, "up-1")).toMatchObject({ status: "idle", error: UPSCALE_ERROR_TEXT.fail });
  });

  it("video aiRefs unchanged", () => {
    const ups = [video("v1"), img("i1"), video("v2"), img("i2", { url: undefined }), video("v3"), video("v4")];
    const p = project([...ups, shot()]);
    expect(aiRefs(p, shot()).map((a) => a.id)).toEqual(["v1", "i1", "v2"]);
    expect(aiRefs(p, shot({ refIds: ["v4", "gone", "i1"] })).map((a) => a.id)).toEqual(["v4", "i1"]);
    expect(aiRefs(p, img("i1"))).toEqual([]);
    expect(aiRefs(p, img("x", { origin: "ai" }))).toEqual([]);
  });
});

describe("arrange with upscale chains", () => {
  /* 改 arrange 之前实测的剪辑器位置(回归基线) */
  const EDITOR_BEFORE = { x: 700, y: 245 };
  it("keeps the two-column layout for uploads referenced by an AI shot", () => {
    const p = arrange(project([video("v1"), video("v2"), shot({ refIds: ["v1"] })], { autoLayout: true }));
    const x = (id: string) => node(p, id).x;
    expect(x("v1")).toBeLessThan(x("ai-1"));
    expect(x("v2")).toBe(x("ai-1"));
    expect(p.assets.map((a) => [a.id, a.x, a.y])).toEqual([
      ["v1", 20, 169],
      ["v2", 340, 0],
      ["ai-1", 340, 338],
    ]);
    expect(p.editor).toEqual(EDITOR_BEFORE);
  });

  it("puts each upscale one column after its source", () => {
    let p = project([img("src")], { autoLayout: true });
    p = finishUpscale(addUpscaleNode(p, "src", factor(2), 1, "up-1"), "up-1", result);
    p = arrange(addUpscaleNode(p, "up-1", factor(2), 4, "up-2"));
    const x = (id: string) => node(p, id).x;
    expect(x("src")).toBeLessThan(x("up-1"));
    expect(x("up-1")).toBeLessThan(x("up-2"));
    expect(p.editor.x).toBeGreaterThan(x("up-2"));
  });
});

describe("upscale runtime state (final fixes)", () => {
  const SRC = { width: 1536, height: 1024 };

  it("records the source pixel size at start (for Retry)", () => {
    const p = addUpscaleNode(project([img("src")]), "src", factor(2), 1, "up-1", SRC);
    expect(node(p, "up-1").upscale?.srcSize).toEqual(SRC);
  });

  it("failUpscale stores the error kind", () => {
    const p1 = addUpscaleNode(project([img("src")]), "src", factor(2), 1, "up-1", SRC);
    expect(node(failUpscale(p1, "up-1", "fail"), "up-1").upscale?.errorKind).toBe("fail");
    expect(node(failUpscale(p1, "up-1", "unsafe"), "up-1").upscale?.errorKind).toBe("unsafe");
  });

  it("keepRuntime keeps the upscale result info through undo / redo", () => {
    const p1 = addUpscaleNode(project([img("src")]), "src", factor(8.1), 11, "up-1", SRC);
    const done = finishUpscale(p1, "up-1", result);
    /* 快照是放大中(upscale 里没有结果尺寸);撤销后结果尺寸、文件大小仍是现在的 */
    const kept = keepRuntime(p1, done);
    expect(node(kept, "up-1").upscale).toMatchObject({ width: 12442, height: 8294, fileSize: 38_200_000, seed: 7 });
  });

  it("undo / redo bringing back a dead upscale node shows it failed with Retry", () => {
    const before = project([img("src")]);
    const running = addUpscaleNode(before, "src", factor(8.1), 11, "up-1", SRC);
    /* 撤销把它拿掉(积分退回),重做回来:请求已经作废,不能卡在 Upscaling… */
    const undone = keepRuntime(before, running);
    const redone = keepRuntime(running, undone);
    const n = node(redone, "up-1");
    expect(n).toMatchObject({ status: "idle", error: UPSCALE_ERROR_TEXT.fail, charged: undefined });
    expect(n.upscale?.errorKind).toBe("fail");
    expect(redone.spentCredits).toBe(100);
    expect(canRetryUpscale(redone, n)).toBe(true);
  });

  it("a hard refresh mid-upscale can be retried", () => {
    const p = resetInterrupted(addUpscaleNode(project([img("src")]), "src", factor(8.1), 11, "up-1", SRC));
    expect(node(p, "up-1").upscale?.errorKind).toBe("fail");
    expect(canRetryUpscale(p, node(p, "up-1"))).toBe(true);
  });

  it("retryUpscale charges again and goes back to upscaling", () => {
    const p1 = addUpscaleNode(project([img("src")]), "src", factor(8.1), 11, "up-1", SRC);
    const failed = failUpscale(p1, "up-1", "fail");
    expect(canRetryUpscale(failed, node(failed, "up-1"))).toBe(true);
    const again = retryUpscale(failed, "up-1");
    const n = node(again, "up-1");
    expect(n).toMatchObject({ status: "generating", charged: 11, error: undefined });
    expect(n.upscale?.errorKind).toBeUndefined();
    expect(again.spentCredits).toBe(111);
    /* 失败后再成功 / 再失败照常 */
    expect(failUpscale(again, "up-1", "fail").spentCredits).toBe(100);
    expect(node(finishUpscale(again, "up-1", result), "up-1").status).toBe("ready");
    /* 已经在放大中:不再扣 */
    expect(retryUpscale(again, "up-1")).toBe(again);
  });

  it("no Retry for unsafe, or when the source node is gone", () => {
    const p1 = addUpscaleNode(project([img("src")]), "src", factor(8.1), 11, "up-1", SRC);
    const unsafe = failUpscale(p1, "up-1", "unsafe");
    expect(canRetryUpscale(unsafe, node(unsafe, "up-1"))).toBe(false);
    expect(retryUpscale(unsafe, "up-1")).toBe(unsafe);
    const failed = failUpscale(p1, "up-1", "fail");
    const noSrc = removeAsset(failed, "src");
    expect(canRetryUpscale(noSrc, node(noSrc, "up-1"))).toBe(false);
    expect(retryUpscale(noSrc, "up-1")).toBe(noSrc);
    /* 普通图片节点、就绪的放大节点都不算 */
    expect(canRetryUpscale(failed, node(failed, "src"))).toBe(false);
    const done = finishUpscale(p1, "up-1", result);
    expect(canRetryUpscale(done, node(done, "up-1"))).toBe(false);
  });
});
